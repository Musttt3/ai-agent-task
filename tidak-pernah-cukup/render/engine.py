"""Mesin render dokumenter gaya Vox + Case File.

Semua frame dibuat dengan NumPy/OpenCV/Pillow lalu dikirim mentah ke ffmpeg.
Konvensi: frame = float32 RGB 0..1, ukuran 1080x1920.
"""
from __future__ import annotations

import math
import os
import subprocess
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Callable

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
FONTS = ROOT / "fonts"
W, H, FPS = 1920, 1080, 30

# Palet case file
RED = (178, 28, 24)
RED_DARK = (120, 14, 12)
INK = (28, 22, 18)
PAPER = (232, 218, 188)
MANILA = (206, 172, 112)


# ---------------------------------------------------------------- easing
def ease(x: float) -> float:
    """ease-in-out halus (cosine)."""
    x = min(1.0, max(0.0, x))
    return 0.5 - 0.5 * math.cos(math.pi * x)


def ease_out(x: float) -> float:
    x = min(1.0, max(0.0, x))
    return 1 - (1 - x) ** 3


def lerp(a, b, x):
    return a + (b - a) * x


def prog(t: float, t0: float, t1: float) -> float:
    if t1 <= t0:
        return 1.0 if t >= t1 else 0.0
    return min(1.0, max(0.0, (t - t0) / (t1 - t0)))


# ---------------------------------------------------------------- fonts
@lru_cache(None)
def font(name: str, size: int, weight: str | None = None) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(FONTS / name), size)
    if weight:
        try:
            f.set_variation_by_name(weight)
        except Exception:
            pass
    return f


TYPE = "SpecialElite-Regular.ttf"
BEBAS = "BebasNeue-Regular.ttf"
OSWALD = "Oswald.ttf"
SERIF = "PlayfairDisplay.ttf"


# ---------------------------------------------------------------- grading
def archival_grade(rgb: np.ndarray, amount: float = 0.78, contrast: float = 1.08) -> np.ndarray:
    """Grade arsip: sepia hangat, kontras ringan. rgb float 0..1."""
    lum = rgb @ np.array([0.299, 0.587, 0.114], np.float32)
    sep = np.stack([lum * 1.07 + 0.035, lum * 0.93 + 0.02, lum * 0.72 + 0.0], -1)
    out = rgb * (1 - amount) + sep * amount
    out = (out - 0.5) * contrast + 0.5
    # angkat hitam sedikit (film), turunkan putih sedikit
    out = 0.035 + out * 0.94
    return np.clip(out, 0, 1).astype(np.float32)


def warm_grade(rgb: np.ndarray, amount: float = 0.35) -> np.ndarray:
    return archival_grade(rgb, amount=amount, contrast=1.04)


# ---------------------------------------------------------------- image IO
def to_f(img: Image.Image) -> np.ndarray:
    return np.asarray(img, dtype=np.float32) / 255.0


def load_rgb(name: str, max_side: int = 3200, grade: float | None = 0.78) -> np.ndarray:
    im = Image.open(ASSETS / name).convert("RGB")
    if max(im.size) > max_side:
        im.thumbnail((max_side, max_side), Image.LANCZOS)
    a = to_f(im)
    return archival_grade(a, grade) if grade else a


def load_rgba(name: str, max_side: int = 2600, grade: float | None = 0.78) -> np.ndarray:
    im = Image.open(ASSETS / name).convert("RGBA")
    if max(im.size) > max_side:
        im.thumbnail((max_side, max_side), Image.LANCZOS)
    a = to_f(im)
    if grade:
        a[..., :3] = archival_grade(a[..., :3], grade)
    return a


# ---------------------------------------------------------------- compositing
def affine(s: float, angle_deg: float, src_c: tuple[float, float], dst_c: tuple[float, float]) -> np.ndarray:
    """Matriks 2x3: putar+skala di sekitar src_c lalu pindah ke dst_c."""
    a = math.radians(angle_deg)
    c, sn = math.cos(a) * s, math.sin(a) * s
    sx, sy = src_c
    dx, dy = dst_c
    return np.array([[c, -sn, dx - (c * sx - sn * sy)], [sn, c, dy - (sn * sx + c * sy)]], np.float32)


def warp_rgb(src: np.ndarray, M: np.ndarray, size=(W, H), border=(0, 0, 0)) -> np.ndarray:
    return cv2.warpAffine(src, M, size, flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=border)


def blit(dst: np.ndarray, sprite: np.ndarray, center: tuple[float, float], scale: float = 1.0,
         angle: float = 0.0, opacity: float = 1.0) -> None:
    """Tempel sprite RGBA (float) ke dst RGB (float) dengan pusat, skala, rotasi, opasitas."""
    if opacity <= 0.001 or scale <= 0.001:
        return
    sh, sw = sprite.shape[:2]
    # kotak pembatas setelah transformasi
    r = 0.5 * math.hypot(sw, sh) * scale + 2
    x0, y0 = int(max(0, center[0] - r)), int(max(0, center[1] - r))
    x1, y1 = int(min(dst.shape[1], center[0] + r)), int(min(dst.shape[0], center[1] + r))
    if x1 <= x0 or y1 <= y0:
        return
    M = affine(scale, angle, (sw / 2, sh / 2), (center[0] - x0, center[1] - y0))
    flags = cv2.INTER_AREA if scale < 0.6 else cv2.INTER_LINEAR
    warped = cv2.warpAffine(sprite, M, (x1 - x0, y1 - y0), flags=flags, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    a = warped[..., 3:4] * opacity
    roi = dst[y0:y1, x0:x1]
    roi[:] = roi * (1 - a) + warped[..., :3] * a


def cover_scale(iw: int, ih: int, w: int = W, h: int = H) -> float:
    return max(w / iw, h / ih)


def kenburns(img: np.ndarray, t: float, z0: float, z1: float, c0=(0.5, 0.5), c1=(0.5, 0.5),
             angle0: float = 0.0, angle1: float = 0.0) -> np.ndarray:
    """Ken Burns: z=1 artinya gambar pas menutup layar. c = titik pusat (0..1 koordinat gambar)."""
    ih, iw = img.shape[:2]
    e = ease(t)
    z = lerp(z0, z1, e)
    cx, cy = lerp(c0[0], c1[0], e) * iw, lerp(c0[1], c1[1], e) * ih
    s = cover_scale(iw, ih) * z
    # jaga agar tepi gambar tidak masuk layar
    half_w, half_h = W / (2 * s), H / (2 * s)
    cx = min(max(cx, half_w), iw - half_w) if iw > 2 * half_w else iw / 2
    cy = min(max(cy, half_h), ih - half_h) if ih > 2 * half_h else ih / 2
    M = affine(s, lerp(angle0, angle1, e), (cx, cy), (W / 2, H / 2))
    return warp_rgb(img, M)


def camera(world: np.ndarray, cx: float, cy: float, zoom: float, angle: float = 0.0) -> np.ndarray:
    """Kamera pada 'world' (piksel): zoom=1 artinya 1 piksel world = 1 piksel layar."""
    M = affine(zoom, angle, (cx, cy), (W / 2, H / 2))
    return warp_rgb(world, M, border=(0.06, 0.05, 0.04))


# ---------------------------------------------------------------- footage
class Footage:
    """Membaca klip video lewat ffmpeg (scale+crop ke 16:9, fps 30) secara berurutan."""

    def __init__(self, name: str, start: float = 0.0, out_w: int = 2112, out_h: int = 1188,
                 speed: float = 1.0, portrait_fill: bool = False):
        self.path = ASSETS / name
        self.ow, self.oh = out_w, out_h
        self.start, self.speed = start, speed
        self.portrait_fill = portrait_fill
        self.proc = None
        self.frame_idx = -1
        self.last = None

    def _open(self, from_frame: int):
        if self.proc:
            self.proc.kill()
        ss = self.start + from_frame / FPS * self.speed
        vf = f"setpts={1/self.speed}*PTS,fps={FPS},"
        if self.portrait_fill:
            vf += f"scale={self.ow}:{self.oh}:force_original_aspect_ratio=increase,crop={self.ow}:{self.oh}:(iw-ow)/2:(ih-oh)*0.42"
        else:
            vf += f"scale={self.ow}:{self.oh}:force_original_aspect_ratio=increase,crop={self.ow}:{self.oh}"
        cmd = ["ffmpeg", "-v", "quiet", "-ss", f"{ss:.3f}", "-i", str(self.path), "-an", "-vf", vf,
               "-pix_fmt", "rgb24", "-f", "rawvideo", "-"]
        self.proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, bufsize=self.ow * self.oh * 3 * 4)
        self.frame_idx = from_frame - 1

    def get(self, i: int) -> np.ndarray:
        """Frame ke-i (relatif ke awal klip). Diasumsikan dipanggil berurutan."""
        if self.proc is None or i < self.frame_idx or i > self.frame_idx + 30:
            self._open(i)
        while self.frame_idx < i:
            buf = self.proc.stdout.read(self.ow * self.oh * 3)
            if len(buf) < self.ow * self.oh * 3:
                # habis: tahan frame terakhir
                self.frame_idx = i
                break
            self.last = np.frombuffer(buf, np.uint8).reshape(self.oh, self.ow, 3)
            self.frame_idx += 1
        return self.last.astype(np.float32) / 255.0

    def close(self):
        if self.proc:
            self.proc.kill()
            self.proc = None


def footage_frame(f: Footage, i: int, t: float, z0=1.0, z1=1.06, c0=(0.5, 0.5), c1=(0.5, 0.5), grade=0.72):
    fr = f.get(i)
    out = kenburns(fr, t, z0, z1, c0, c1)
    return archival_grade(out, grade)


# ---------------------------------------------------------------- texture & procedural
def rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


@lru_cache(None)
def paper_texture(w: int, h: int, seed: int = 1, tone=PAPER, dark_edges: float = 0.35) -> np.ndarray:
    """Tekstur kertas tua: dari foto kertas (TX01) + noise + tepi gelap."""
    base = Image.open(ASSETS / "TX01_kertas-tua.jpg").convert("L")
    r = rng(seed)
    bw, bh = base.size
    # potong area acak lalu resize
    cw, ch = int(bw * 0.55), int(bw * 0.55 * h / w)
    ch = min(ch, bh - 1)
    x0, y0 = int(r.integers(0, bw - cw)), int(r.integers(0, bh - ch))
    crop = base.crop((x0, y0, x0 + cw, y0 + ch)).resize((w, h), Image.LANCZOS)
    g = np.asarray(crop, np.float32) / 255.0
    g = (g - g.mean()) * 0.55 + 0.5
    col = np.array(tone, np.float32) / 255.0
    out = col * (0.78 + 0.44 * g[..., None])
    # tepi gelap / vignette kertas
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.minimum.reduce([xx / w, 1 - xx / w, yy / h, 1 - yy / h])
    edge = np.clip(d / 0.08, 0, 1) ** 0.6
    out *= (1 - dark_edges) + dark_edges * edge[..., None]
    return np.clip(out, 0, 1).astype(np.float32)


@lru_cache(None)
def wood_texture(w: int, h: int, seed: int = 3) -> np.ndarray:
    """Meja kayu gelap prosedural."""
    r = rng(seed)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    n = cv2.resize(r.random((h // 40 + 2, w // 6 + 2)).astype(np.float32), (w, h), interpolation=cv2.INTER_CUBIC)
    n2 = cv2.resize(r.random((h // 8 + 2, w // 60 + 2)).astype(np.float32), (w, h), interpolation=cv2.INTER_CUBIC)
    grain = np.sin((yy * 0.11 + n * 18 + n2 * 4)) * 0.5 + 0.5
    v = 0.55 + 0.25 * grain + 0.2 * n2
    base = np.array([0.20, 0.12, 0.07], np.float32)
    out = base * (0.55 + 0.9 * v[..., None])
    # papan-papan
    for x in range(0, w, 520):
        out[:, max(0, x - 2):x + 2] *= 0.55
    return np.clip(out, 0, 1).astype(np.float32)


@lru_cache(None)
def cork_texture(w: int, h: int) -> np.ndarray:
    """Papan gabus dari TX02 (area gabus polos di-tile), sedikit digelapkan."""
    im = Image.open(ASSETS / "TX02_papan-gabus.jpg").convert("RGB")
    iw, ih = im.size
    tile = im.crop((int(iw * 0.10), int(ih * 0.45), int(iw * 0.62), int(ih * 0.84)))  # area gabus polos
    tw, th = tile.size
    canvas = Image.new("RGB", (w, h))
    for y in range(0, h, th):
        for x in range(0, w, tw):
            t2 = tile.transpose(Image.FLIP_LEFT_RIGHT) if (x // tw) % 2 else tile
            t2 = t2.transpose(Image.FLIP_TOP_BOTTOM) if (y // th) % 2 else t2
            canvas.paste(t2, (x, y))
    a = to_f(canvas.filter(ImageFilter.GaussianBlur(0.6)))
    a = archival_grade(a, 0.35, 1.0) * 0.82
    return a


# ---------------------------------------------------------------- sprite builders (RGBA float)
def pil_to_f(im: Image.Image) -> np.ndarray:
    return np.asarray(im.convert("RGBA"), np.float32) / 255.0


def shadowed(im: Image.Image, blur: int = 14, offset=(10, 14), alpha: float = 0.55, pad: int = 40) -> Image.Image:
    """Tambah bayangan lembut di bawah sprite."""
    w, h = im.size
    out = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    sh = Image.new("RGBA", out.size, (0, 0, 0, 0))
    a = im.getchannel("A").point(lambda v: int(v * alpha))
    blk = Image.new("RGBA", im.size, (10, 6, 4, 255))
    blk.putalpha(a)
    sh.paste(blk, (pad + offset[0], pad + offset[1]), blk)
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    out.alpha_composite(sh)
    out.alpha_composite(im, (pad, pad))
    return out


def photo_print(name: str, width: int, border: int = 22, grade: float = 0.8, crop: tuple | None = None,
                caption: str | None = None, seed: int = 0) -> Image.Image:
    """Foto cetak berbingkai krem dengan tekstur, untuk dipin di papan."""
    im = Image.open(ASSETS / name).convert("RGB")
    if crop:
        iw, ih = im.size
        im = im.crop((int(crop[0] * iw), int(crop[1] * ih), int(crop[2] * iw), int(crop[3] * ih)))
    h = int(width * im.height / im.width)
    im = im.resize((width, h), Image.LANCZOS)
    a = archival_grade(to_f(im), grade)
    im = Image.fromarray((a * 255).astype(np.uint8))
    cap_h = 70 if caption else 0
    card = Image.new("RGBA", (width + border * 2, h + border * 2 + cap_h), (236, 226, 204, 255))
    tex = paper_texture(card.width, card.height, seed=seed + 11, tone=(238, 228, 206), dark_edges=0.15)
    card = Image.fromarray((tex * 255).astype(np.uint8)).convert("RGBA")
    card.paste(im, (border, border))
    if caption:
        d = ImageDraw.Draw(card)
        f = font(TYPE, 34)
        tw = d.textlength(caption, font=f)
        d.text(((card.width - tw) / 2, h + border + 14), caption, font=f, fill=INK)
    return card


def cutout(name: str, width: int, grade: float = 0.7) -> Image.Image:
    im = Image.open(ASSETS / name).convert("RGBA")
    h = int(width * im.height / im.width)
    im = im.resize((width, h), Image.LANCZOS)
    a = to_f(im)
    a[..., :3] = archival_grade(a[..., :3], grade)
    return Image.fromarray((a * 255).astype(np.uint8), "RGBA")


def pushpin(r: int = 16, color=RED) -> Image.Image:
    s = r * 4
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    c = s // 2
    d.ellipse((c - r + 5, c - r + 7, c + r + 5, c + r + 7), fill=(0, 0, 0, 90))
    d.ellipse((c - r, c - r, c + r, c + r), fill=color + (255,))
    d.ellipse((c - r * 0.45, c - r * 0.6, c - r * 0.05, c - r * 0.2), fill=(255, 190, 180, 200))
    return im.filter(ImageFilter.GaussianBlur(0.6))


def label_card(text: str, size: int = 44, fnt: str = TYPE, pad=(26, 14), bg=(240, 232, 214), fg=INK,
               tape: bool = True) -> Image.Image:
    f = font(fnt, size)
    d0 = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    x0, y0, x1, y1 = d0.textbbox((0, 0), text, font=f)
    w, h = x1 - x0 + pad[0] * 2, y1 - y0 + pad[1] * 2
    tex = paper_texture(w, h, seed=hash(text) % 997, tone=bg, dark_edges=0.12)
    im = Image.fromarray((tex * 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(im)
    d.text((pad[0] - x0, pad[1] - y0), text, font=f, fill=fg)
    if tape:
        t = Image.new("RGBA", (int(w * 0.28), 26), (230, 222, 190, 150))
        out = Image.new("RGBA", (w, h + 14), (0, 0, 0, 0))
        out.alpha_composite(im, (0, 14))
        out.alpha_composite(t, (int(w * 0.36), 0))
        return out
    return im


def stamp(text: str, size: int = 92, color=RED, angle: float = -8, border: bool = True, seed: int = 5) -> Image.Image:
    """Cap karet merah dengan tekstur tinta tidak rata."""
    f = font(BEBAS, size)
    d0 = ImageDraw.Draw(Image.new("RGB", (1, 1)))
    x0, y0, x1, y1 = d0.textbbox((0, 0), text, font=f)
    pw, ph = 34, 18
    w, h = x1 - x0 + pw * 2, y1 - y0 + ph * 2
    im = Image.new("L", (w + 20, h + 20), 0)
    d = ImageDraw.Draw(im)
    if border:
        d.rounded_rectangle((10, 10, w + 10, h + 10), radius=10, outline=255, width=8)
    d.text((10 + pw - x0, 10 + ph - y0), text, font=f, fill=255)
    a = np.asarray(im, np.float32) / 255.0
    r = rng(seed)
    noise = cv2.resize(r.random((im.height // 3 + 1, im.width // 3 + 1)).astype(np.float32), (im.width, im.height))
    speck = r.random(a.shape).astype(np.float32)
    a = a * np.clip(0.55 + noise * 0.7, 0, 1) * (speck > 0.08)
    a = cv2.GaussianBlur(a, (3, 3), 0)
    rgba = np.zeros((*a.shape, 4), np.float32)
    rgba[..., :3] = np.array(color, np.float32) / 255.0
    rgba[..., 3] = np.clip(a * 0.92, 0, 1)
    out = Image.fromarray((rgba * 255).astype(np.uint8), "RGBA").rotate(angle, expand=True, resample=Image.BICUBIC)
    return out


# ---------------------------------------------------------------- dynamic drawing (langsung di frame float)
def hand_ellipse_pts(cx, cy, rx, ry, seed=0, turns=1.08, n=220):
    r = rng(seed)
    ph = r.uniform(0, 2 * math.pi)
    j1, j2 = r.uniform(0.02, 0.05), r.uniform(0, 2 * math.pi)
    pts = []
    for i in range(n):
        u = i / (n - 1)
        a = ph + u * 2 * math.pi * turns
        wob = 1 + j1 * math.sin(3 * a + j2) + 0.03 * u
        pts.append((cx + rx * wob * math.cos(a), cy + ry * wob * math.sin(a)))
    return np.array(pts, np.float32)


def draw_poly_progress(frame: np.ndarray, pts: np.ndarray, p: float, color=RED, width: int = 7, alpha: float = 0.92):
    """Gambar polyline sebagian (0..1) dengan antialias, seperti spidol."""
    if p <= 0:
        return
    k = max(2, int(len(pts) * min(1.0, p)))
    sub = pts[:k]
    xs, ys = sub[:, 0], sub[:, 1]
    x0, y0 = int(max(0, xs.min() - width * 2)), int(max(0, ys.min() - width * 2))
    x1, y1 = int(min(frame.shape[1], xs.max() + width * 2)), int(min(frame.shape[0], ys.max() + width * 2))
    if x1 <= x0 or y1 <= y0:
        return
    mask = np.zeros((y1 - y0, x1 - x0), np.uint8)
    cv2.polylines(mask, [((sub - [x0, y0]) * 4).astype(np.int32)], False, 255, width, cv2.LINE_AA, shift=2)
    m = (mask.astype(np.float32) / 255.0 * alpha)[..., None]
    roi = frame[y0:y1, x0:x1]
    roi[:] = roi * (1 - m) + (np.array(color, np.float32) / 255.0) * m


def draw_text(frame: np.ndarray, text: str, xy, fnt: str, size: int, color=INK, alpha: float = 1.0,
              anchor: str = "la", stroke: int = 0, stroke_color=(0, 0, 0)):
    """Teks langsung di frame float (via patch PIL)."""
    if alpha <= 0.001 or not text:
        return
    f = font(fnt, size)
    d0 = ImageDraw.Draw(Image.new("L", (1, 1)))
    bx0, by0, bx1, by1 = d0.textbbox(xy, text, font=f, anchor=anchor, stroke_width=stroke)
    pad = 4
    x0, y0 = int(max(0, bx0 - pad)), int(max(0, by0 - pad))
    x1, y1 = int(min(frame.shape[1], bx1 + pad)), int(min(frame.shape[0], by1 + pad))
    if x1 <= x0 or y1 <= y0:
        return
    patch = Image.new("L", (x1 - x0, y1 - y0), 0)
    dp = ImageDraw.Draw(patch)
    if stroke:
        sp = Image.new("L", patch.size, 0)
        ImageDraw.Draw(sp).text((xy[0] - x0, xy[1] - y0), text, font=f, anchor=anchor, fill=255,
                                stroke_width=stroke, stroke_fill=255)
        ms = (np.asarray(sp, np.float32) / 255.0 * alpha)[..., None]
        roi = frame[y0:y1, x0:x1]
        roi[:] = roi * (1 - ms) + np.array(stroke_color, np.float32) / 255.0 * ms
    dp.text((xy[0] - x0, xy[1] - y0), text, font=f, anchor=anchor, fill=255)
    m = (np.asarray(patch, np.float32) / 255.0 * alpha)[..., None]
    roi = frame[y0:y1, x0:x1]
    roi[:] = roi * (1 - m) + np.array(color, np.float32) / 255.0 * m


def keyword(frame: np.ndarray, text: str, t: float, t0: float, t1: float, pos=(140, 900), size: int = 54):
    """Kata kunci di layar: label kertas ketik kecil, muncul fade+slide pelan, hilang fade."""
    a = ease(prog(t, t0, t0 + 0.7)) * (1 - ease(prog(t, t1 - 0.6, t1)))
    if a <= 0:
        return
    spr = _keyword_sprite(text, size)
    dy = (1 - ease(prog(t, t0, t0 + 0.9))) * 14
    blit(frame, spr, (pos[0] + spr.shape[1] / 2, pos[1] + dy), 1.0, 0, a)


@lru_cache(None)
def _keyword_sprite(text: str, size: int) -> np.ndarray:
    lab = label_card(text, size=size, tape=False, bg=(238, 230, 210))
    return pil_to_f(shadowed(lab, blur=10, offset=(6, 8), alpha=0.5, pad=24))


# ---------------------------------------------------------------- finishing global
class Finisher:
    def __init__(self, seed: int = 7):
        r = rng(seed)
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
        self.vig = (1 - 0.42 * np.clip(d - 0.35, 0, 1) ** 1.6)[..., None].astype(np.float32)
        self.grain = [cv2.GaussianBlur(r.normal(0, 1, (H, W)).astype(np.float32), (0, 0), 0.7)[..., None]
                      for _ in range(6)]
        self.r = r

    def apply(self, frame: np.ndarray, fi: int, grain: float = 0.028, flicker: float = 0.012, dust: bool = True) -> np.ndarray:
        f = frame * self.vig
        fl = 1 + flicker * (math.sin(fi * 0.71) * 0.6 + math.sin(fi * 1.93) * 0.4)
        f = f * fl
        g = self.grain[fi % len(self.grain)]
        lum = f.mean(axis=2, keepdims=True)
        f = f + g * grain * (0.6 + 0.8 * lum * (1 - lum) * 4) * 0.5
        if dust:
            r = np.random.default_rng(fi * 7919 + 13)
            if r.random() < 0.10:
                for _ in range(int(r.integers(1, 3))):
                    x, y = int(r.integers(0, W)), int(r.integers(0, H))
                    rad = int(r.integers(1, 3))
                    val = 0.85 if r.random() < 0.5 else 0.12
                    cv2.circle(f, (x, y), rad, (val, val * 0.95, val * 0.85), -1, cv2.LINE_AA)
            if r.random() < 0.03:
                x = int(r.integers(0, W))
                cv2.line(f, (x, 0), (x + int(r.integers(-6, 6)), H), (0.75, 0.72, 0.65), 1, cv2.LINE_AA)
        return np.clip(f, 0, 1)


# ---------------------------------------------------------------- timeline & render
@dataclass
class Shot:
    start: float
    end: float
    draw: Callable[[float, float, int], np.ndarray]  # (t_global, t_local01, frame_idx_local) -> frame
    fade_in: float = 0.8   # durasi crossfade masuk (overlap dengan shot sebelumnya)
    name: str = ""


@dataclass
class Section:
    name: str
    duration: float
    shots: list[Shot] = field(default_factory=list)
    overlays: list[Callable[[np.ndarray, float], None]] = field(default_factory=list)
    fade_from_black: float = 0.0
    fade_to_black: float = 0.0

    def frame(self, fi: int) -> np.ndarray:
        t = fi / FPS
        active = [s for s in self.shots if s.start - 1e-6 <= t < s.end]
        if not active:
            out = np.zeros((H, W, 3), np.float32)
        else:
            out = None
            for s in sorted(active, key=lambda s: s.start):
                loc = (t - s.start) / max(1e-6, s.end - s.start)
                fr = s.draw(t, loc, int(round((t - s.start) * FPS)))
                if out is None:
                    out = fr
                else:
                    a = ease(prog(t, s.start, s.start + s.fade_in))
                    out = out * (1 - a) + fr * a
        for ov in self.overlays:
            ov(out, t)
        if self.fade_from_black:
            out = out * ease(prog(t, 0, self.fade_from_black))
        if self.fade_to_black:
            out = out * (1 - ease(prog(t, self.duration - self.fade_to_black, self.duration)))
        return out


def encoder(path: Path, crf: int = 16) -> subprocess.Popen:
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", str(crf), "-pix_fmt", "yuv420p",
           "-movflags", "+faststart", str(path)]
    return subprocess.Popen(cmd, stdin=subprocess.PIPE)


def render_range(build: Callable[[], Section], f0: int, f1: int, out_path: Path, crf: int = 16):
    sec = build()
    fin = Finisher()
    enc = encoder(out_path, crf)
    for fi in range(f0, f1):
        fr = fin.apply(sec.frame(fi), fi)
        enc.stdin.write((fr * 255 + 0.5).astype(np.uint8).tobytes())
    enc.stdin.close()
    enc.wait()
    if enc.returncode != 0:
        raise RuntimeError(f"ffmpeg gagal: {out_path}")


def _worker(args):
    build, f0, f1, path, crf = args
    render_range(build, f0, f1, Path(path), crf)
    return path


def render_section(build: Callable[[], Section], out_path: Path, workers: int = 4, crf: int = 16) -> Path:
    """Render paralel per potongan frame, lalu gabung (concat -c copy). Simpan ke nama sementara dulu."""
    import multiprocessing as mp
    sec = build()
    n = int(round(sec.duration * FPS))
    chunk = math.ceil(n / workers)
    tmpdir = out_path.parent / f".{out_path.stem}_parts"
    tmpdir.mkdir(parents=True, exist_ok=True)
    jobs = [(build, i, min(n, i + chunk), str(tmpdir / f"p{k:02d}.mp4"), crf) for k, i in enumerate(range(0, n, chunk))]
    ctx = mp.get_context("fork")
    with ctx.Pool(workers) as pool:
        parts = pool.map(_worker, jobs)
    lst = tmpdir / "list.txt"
    lst.write_text("".join(f"file '{Path(p).name}'\n" for p in parts))
    tmp = out_path.with_suffix(".tmp.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(tmp)], check=True)
    tmp.replace(out_path)
    return out_path


def contact_sheet(build: Callable[[], Section], times: list[float], out_path: Path, cols: int = 3):
    sec = build()
    fin = Finisher()
    thumbs = []
    for t in times:
        fr = fin.apply(sec.frame(int(t * FPS)), int(t * FPS))
        im = Image.fromarray((fr * 255).astype(np.uint8)).resize((640, 360), Image.LANCZOS)
        d = ImageDraw.Draw(im)
        d.rectangle((0, 0, 92, 30), fill=(0, 0, 0))
        d.text((8, 4), f"{t:5.1f}s", font=font(OSWALD, 20), fill=(255, 255, 255))
        thumbs.append(im)
    rows = math.ceil(len(thumbs) / cols)
    sheet = Image.new("RGB", (cols * 650 + 10, rows * 370 + 10), (30, 30, 30))
    for i, im in enumerate(thumbs):
        sheet.paste(im, (10 + (i % cols) * 650, 10 + (i // cols) * 370))
    sheet.save(out_path, quality=88)
    return out_path
