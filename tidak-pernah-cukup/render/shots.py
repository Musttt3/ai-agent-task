"""Toolkit adegan: Scene (latar + item bertimer + coretan dinamis + kamera keyframe), sprite, grafik, shot helper.

Semua waktu di sini = waktu LOKAL bagian (detik sejak awal file video bagian itu).
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Callable

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from engine import (BEBAS, FPS, H, INK, MANILA, OSWALD, PAPER, RED, SERIF, TYPE, W, Footage, Shot, affine,
                    archival_grade, blit, cork_texture, cover_scale, draw_poly_progress, draw_text, ease, ease_out,
                    footage_frame, font, hand_ellipse_pts, kenburns, label_card, lerp, load_rgb, paper_texture,
                    photo_print, pil_to_f, prog, pushpin, shadowed, stamp, to_f, warp_rgb, wood_texture)

INK_F = tuple(c / 255 for c in INK)


# ================================================================ latar (world)
@lru_cache(None)
def bg_paper(w=2400, h=1350, seed=31, tone=PAPER):
    return paper_texture(w, h, seed=seed, tone=tone, dark_edges=0.4)


@lru_cache(None)
def bg_cork(w=2400, h=1350):
    return cork_texture(w, h)


@lru_cache(None)
def bg_wood(w=2400, h=1350, seed=8):
    return wood_texture(w, h, seed=seed)


@lru_cache(None)
def bg_dark(w=2400, h=1350, seed=5):
    """Kertas gelap / latar studio untuk potongan tokoh."""
    p = paper_texture(w, h, seed=seed, tone=(70, 56, 44), dark_edges=0.55)
    return p


@lru_cache(None)
def bg_image(name: str, max_side=3400, grade=0.78):
    return load_rgb(name, max_side, grade)


# ================================================================ kamera
class Cam:
    def __init__(self, ww, wh, cx, cy, z):
        self.ww, self.wh = ww, wh
        s = cover_scale(ww, wh) * z
        hw, hh = W / (2 * s), H / (2 * s)
        cx = min(max(cx, hw), ww - hw) if ww > 2 * hw else ww / 2
        cy = min(max(cy, hh), wh - hh) if wh > 2 * hh else wh / 2
        self.s, self.cx, self.cy = s, cx, cy
        self.M = affine(s, 0, (cx, cy), (W / 2, H / 2))

    def pt(self, x, y):
        return (self.M[0, 0] * x + self.M[0, 1] * y + self.M[0, 2], self.M[1, 0] * x + self.M[1, 1] * y + self.M[1, 2])

    def pts(self, arr):
        a = np.asarray(arr, np.float32)
        return a @ self.M[:, :2].T + self.M[:, 2]


def cam_at(keys, t):
    """keys: [(t, cx_norm, cy_norm, z)], interpolasi ease antar keyframe."""
    if t <= keys[0][0]:
        return keys[0][1:]
    for (t0, *a), (t1, *b) in zip(keys, keys[1:]):
        if t <= t1:
            e = ease(prog(t, t0, t1))
            return tuple(lerp(x, y, e) for x, y in zip(a, b))
    return keys[-1][1:]


# ================================================================ item & scene
@dataclass
class Item:
    spr: np.ndarray            # RGBA float
    x: float                   # posisi pusat (px world)
    y: float
    t_in: float = -1e9
    t_out: float = 1e9
    scale: float = 1.0         # skala relatif world
    angle: float = 0.0
    anim: str = "fade"         # fade | stamp | drop | none | slide
    dur: float = 0.7
    alpha_fn: Callable | None = None  # (t)->faktor opasitas tambahan
    dx: float = 0.0            # untuk anim slide: offset awal (px world)

    def state(self, t):
        if t < self.t_in or t > self.t_out + 0.7:
            return None
        p = prog(t, self.t_in, self.t_in + self.dur)
        a, sc, ox, oy = 1.0, 1.0, 0.0, 0.0
        if self.anim == "fade":
            a, sc = ease(p), lerp(0.95, 1.0, ease(prog(t, self.t_in, self.t_in + self.dur * 1.3)))
        elif self.anim == "stamp":
            p = prog(t, self.t_in, self.t_in + 0.24)
            a, sc = ease(p), lerp(1.22, 1.0, ease_out(p))
        elif self.anim == "drop":
            a, oy = ease(p), -40 * (1 - ease_out(p))
        elif self.anim == "slide":
            a, ox = ease(p), self.dx * (1 - ease(prog(t, self.t_in, self.t_in + self.dur)))
        if self.t_out < 1e8:
            a *= 1 - ease(prog(t, self.t_out, self.t_out + 0.6))
        if self.alpha_fn:
            a *= self.alpha_fn(t)
        return a, sc, ox, oy


class Scene:
    def __init__(self, world: np.ndarray, cam: list, items: list[Item] | None = None,
                 dyn: list[Callable] | None = None, post: Callable | None = None):
        self.world, self.keys = world, cam
        self.items = items or []
        self.dyn = dyn or []      # dyn(frame, t, cam)
        self.post = post          # post(frame, t) setelah semua (mis. grade global adegan)
        self.wh, self.ww = world.shape[:2]

    def cam(self, t):
        cx, cy, z = cam_at(self.keys, t)
        return Cam(self.ww, self.wh, cx * self.ww, cy * self.wh, z)

    def render(self, t):
        c = self.cam(t)
        fr = warp_rgb(self.world, c.M, border=(0.06, 0.05, 0.04))
        layers = [(it, 0) for it in self.items] + [(d, 1) for d in self.dyn]
        # dyn digambar setelah item (urutan sesuai daftar masing-masing)
        for it in self.items:
            st = it.state(t)
            if not st or st[0] <= 0.002:
                continue
            a, sc, ox, oy = st
            px, py = c.pt(it.x + ox, it.y + oy)
            blit(fr, it.spr, (px, py), it.scale * sc * c.s, it.angle, a)
        for d in self.dyn:
            d(fr, t, c)
        if self.post:
            self.post(fr, t)
        return fr

    def shot(self, t0, t1, fade=0.8, name="scene"):
        return Shot(t0, t1, lambda t, u, i: self.render(t), fade_in=fade, name=name)


# ================================================================ sprite builder
def sp(im: Image.Image, shadow=True, blur=14, off=(10, 14), alpha=0.55) -> np.ndarray:
    return pil_to_f(shadowed(im, blur=blur, offset=off, alpha=alpha) if shadow else im)


def _tex(w, h, tone, seed, dark=0.15):
    return Image.fromarray((paper_texture(w, h, seed=seed, tone=tone, dark_edges=dark) * 255).astype(np.uint8)).convert("RGBA")


@lru_cache(None)
def index_card(name: str, sub: str = "", year: str = "", w: int = 760, seed: int = 0) -> np.ndarray:
    """Kartu indeks bergaris: nama besar (ketik), peran & tahun."""
    h = int(w * 0.6)
    im = _tex(w, h, (240, 234, 216), 300 + seed, 0.12)
    d = ImageDraw.Draw(im)
    for y in range(int(h * 0.36), h - 10, 44):
        d.line((0, y, w, y), fill=(150, 170, 200, 140), width=2)
    d.line((0, int(h * 0.27), w, int(h * 0.27)), fill=(200, 80, 80, 170), width=3)
    f = font(TYPE, 64 if len(name) < 16 else 52)
    d.text((40, int(h * 0.27) - 12), name, font=f, fill=INK, anchor="ls")
    if sub:
        d.text((44, int(h * 0.36) + 34), sub, font=font(TYPE, 40), fill=(60, 50, 44), anchor="ls")
    if year:
        d.text((w - 40, h - 36), year, font=font(TYPE, 58), fill=(150, 30, 24), anchor="rs")
    return sp(im)


@lru_cache(None)
def journal_page(journal: str, title: str, authors: str, year: str, w: int = 900, seed: int = 0,
                 hl: int | None = 2) -> np.ndarray:
    """Tiruan halaman jurnal arsip (bukan pindaian asli): masthead, judul, penulis, blok teks abu."""
    h = int(w * 1.3)
    im = _tex(w, h, (236, 230, 214), 400 + seed, 0.18)
    d = ImageDraw.Draw(im)
    d.text((w / 2, 70), journal.upper(), font=font(SERIF, 46, "Bold"), fill=INK, anchor="mm")
    d.line((50, 110, w - 50, 110), fill=INK, width=3)
    d.line((50, 118, w - 50, 118), fill=INK, width=1)
    d.text((w - 54, 140), year, font=font(TYPE, 30), fill=(70, 60, 50), anchor="ra")
    # judul (dibungkus)
    words, lines, cur = title.split(), [], ""
    ft = font(SERIF, 50, "Bold")
    for wd in words:
        test = (cur + " " + wd).strip()
        if d.textlength(test, font=ft) > w - 120:
            lines.append(cur)
            cur = wd
        else:
            cur = test
    lines.append(cur)
    y = 210
    for ln in lines:
        d.text((w / 2, y), ln, font=ft, fill=INK, anchor="mm")
        y += 62
    d.text((w / 2, y + 16), authors, font=font("PlayfairDisplay-Italic.ttf", 32), fill=(60, 50, 44), anchor="mm")
    y += 80
    r = np.random.default_rng(seed + 9)
    col_w = (w - 150) / 2
    rows = int((h - y - 70) / 26)
    for c in range(2):
        x0 = 60 + c * (col_w + 30)
        for k in range(rows):
            ln = col_w * (0.55 if (k % 9 == 8) else r.uniform(0.86, 1.0))
            yy = y + k * 26
            col = (120, 110, 100, 170)
            if hl is not None and c == 0 and hl <= k < hl + 3:
                d.rectangle((x0 - 6, yy - 9, x0 + col_w + 4, yy + 13), fill=(232, 190, 90, 150))
            d.rectangle((x0, yy - 4, x0 + ln, yy + 6), fill=col)
    return sp(im)


@lru_cache(None)
def note_card(text: str, w: int = 760, size: int = 58, tone=(240, 234, 216), color=INK, seed=0) -> np.ndarray:
    lines = text.split("\n")
    f = font(TYPE, size)
    h = int(size * 1.45 * len(lines) + 90)
    im = _tex(w, h, tone, 500 + seed, 0.12)
    d = ImageDraw.Draw(im)
    for k, ln in enumerate(lines):
        d.text((w / 2, 45 + size * 0.75 + k * size * 1.45), ln, font=f, fill=color, anchor="mm")
    return sp(im)


@lru_cache(None)
def photo(name: str, w: int, crop=None, caption=None, grade=0.8, angle=0.0, seed=0) -> np.ndarray:
    pr = photo_print(name, w, border=22, grade=grade, crop=crop, caption=caption, seed=seed)
    if angle:
        pr = pr.rotate(angle, expand=True, resample=Image.BICUBIC)
    return sp(pr, blur=16, off=(12, 16), alpha=0.6)


@lru_cache(None)
def cut(name: str, w: int, grade=0.7, shadow=True) -> np.ndarray:
    im = Image.open(__import__("engine").ASSETS / name).convert("RGBA")
    h = int(w * im.height / im.width)
    im = im.resize((w, h), Image.LANCZOS)
    a = to_f(im)
    a[..., :3] = archival_grade(a[..., :3], grade)
    pim = Image.fromarray((a * 255).astype(np.uint8), "RGBA")
    return sp(pim, blur=18, off=(12, 18), alpha=0.5) if shadow else pil_to_f(pim)


@lru_cache(None)
def stamp_sp(text: str, size=110, angle=-8, seed=5) -> np.ndarray:
    return pil_to_f(stamp(text, size=size, angle=angle, seed=seed))


@lru_cache(None)
def pin_sp(r=18) -> np.ndarray:
    return pil_to_f(pushpin(r))


@lru_cache(None)
def map_pin(r=26) -> np.ndarray:
    """Pin peta merah (tetes) dengan bayangan."""
    s = r * 4
    im = Image.new("RGBA", (s, int(s * 1.4)), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    cx, cy = s // 2, int(s * 0.45)
    d.ellipse((cx - r * 0.5 + 6, int(s * 1.25) - 6, cx + r * 0.5 + 6, int(s * 1.25) + 4), fill=(0, 0, 0, 90))
    d.polygon([(cx - r * 0.8, cy + r * 0.4), (cx + r * 0.8, cy + r * 0.4), (cx, int(s * 1.25))], fill=RED + (255,))
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=RED + (255,))
    d.ellipse((cx - r * 0.38, cy - r * 0.38, cx + r * 0.38, cy + r * 0.38), fill=(250, 235, 220, 255))
    return pil_to_f(im.filter(ImageFilter.GaussianBlur(0.6)))


@lru_cache(None)
def empty_frame(w=420, h=520, label="?", seed=0) -> np.ndarray:
    im = _tex(w, h, (236, 228, 208), 600 + seed, 0.2)
    d = ImageDraw.Draw(im)
    d.rectangle((22, 22, w - 22, h - 22), fill=(60, 52, 46, 255))
    # siluet kepala & bahu
    cx = w / 2
    d.ellipse((cx - 70, 110, cx + 70, 270), fill=(34, 30, 28, 255))
    d.rounded_rectangle((cx - 140, 280, cx + 140, h - 22), radius=90, fill=(34, 30, 28, 255))
    if label:
        d.text((cx, 190), label, font=font(BEBAS, 150), fill=RED + (255,), anchor="mm")
    return sp(im)


# ================================================================ coretan dinamis (screen space)
def dyn_circle(x, y, rx, ry, t0, dur=1.2, seed=0, width=8):
    pts = hand_ellipse_pts(x, y, rx, ry, seed=seed)

    def f(fr, t, c):
        p = ease(prog(t, t0, t0 + dur))
        if p > 0:
            draw_poly_progress(fr, c.pts(pts), p, width=max(3, int(width * c.s / 0.8)))
    return f


def dyn_line(p0, p1, t0, dur=1.0, color=RED, width=6, wobble=0.0, seed=0, n=60):
    r = np.random.default_rng(seed)
    u = np.linspace(0, 1, n)
    x = p0[0] + (p1[0] - p0[0]) * u
    y = p0[1] + (p1[1] - p0[1]) * u + wobble * np.sin(u * math.pi) + r.normal(0, 0.6, n)
    pts = np.stack([x, y], 1)

    def f(fr, t, c):
        p = ease(prog(t, t0, t0 + dur))
        if p > 0:
            draw_poly_progress(fr, c.pts(pts), p, color=color, width=max(2, int(width * c.s / 0.8)))
    return f


def dyn_poly(pts, t0, dur=1.5, color=RED, width=7):
    pts = np.asarray(pts, np.float32)

    def f(fr, t, c):
        p = ease(prog(t, t0, t0 + dur))
        if p > 0:
            draw_poly_progress(fr, c.pts(pts), p, color=color, width=max(2, int(width * c.s / 0.8)))
    return f


def dyn_arrow(p0, p1, t0, dur=0.9, color=RED, width=7, head=34):
    line = dyn_line(p0, p1, t0, dur, color, width)
    ang = math.atan2(p1[1] - p0[1], p1[0] - p0[0])

    def f(fr, t, c):
        line(fr, t, c)
        a = ease(prog(t, t0 + dur * 0.85, t0 + dur + 0.2))
        if a > 0:
            for s in (-1, 1):
                q = (p1[0] - head * math.cos(ang + s * 0.5), p1[1] - head * math.sin(ang + s * 0.5))
                draw_poly_progress(fr, c.pts([p1, q]), 1.0, color=color, width=max(2, int(width * c.s / 0.8)), alpha=0.92 * a)
    return f


def dyn_highlight(x0, y0, x1, y1, t0, dur=0.8, color=(232, 190, 70), alpha=0.45):
    def f(fr, t, c):
        p = ease(prog(t, t0, t0 + dur))
        if p <= 0:
            return
        (a0, b0), (a1, b1) = c.pt(x0, y0), c.pt(x0 + (x1 - x0) * p, y1)
        a0, a1 = int(max(0, a0)), int(min(W, a1))
        b0, b1 = int(max(0, b0)), int(min(H, b1))
        if a1 > a0 and b1 > b0:
            roi = fr[b0:b1, a0:a1]
            col = np.array(color, np.float32) / 255
            roi[:] = roi * (1 - alpha) + roi * col * alpha * 1.25
    return f


def dyn_text(text, x, y, t0, size=60, fnt=TYPE, color=INK, t1=1e9, anchor="mm"):
    def f(fr, t, c):
        a = ease(prog(t, t0, t0 + 0.6)) * (1 - ease(prog(t, t1, t1 + 0.6)))
        if a > 0:
            px, py = c.pt(x, y)
            draw_text(fr, text, (px, py), fnt, max(10, int(size * c.s)), color, a, anchor=anchor)
    return f


def dyn_keyword(text, t0, t1, pos=(130, 930), size=54):
    from engine import keyword

    def f(fr, t, c):
        keyword(fr, text, t, t0, t1, pos=pos, size=size)
    return f


# ---------------------------------------------------------------- grafik di atas kertas
def dyn_axes(x0, y0, x1, y1, t0, xlabel="", ylabel="", width=5):
    """Sumbu L (kiri & bawah) tergambar pelan + label."""
    v = dyn_line((x0, y0), (x0, y1), t0, 0.7, INK, width)
    hz = dyn_line((x0, y1), (x1, y1), t0 + 0.3, 0.8, INK, width)
    lx = dyn_text(xlabel, (x0 + x1) / 2, y1 + 70, t0 + 0.8, 46)
    ly = dyn_text(ylabel, x0 - 30, y0 - 50, t0 + 0.8, 46, anchor="lm")

    def f(fr, t, c):
        for g in (v, hz, lx, ly):
            g(fr, t, c)
    return f


def dyn_bar(x, base_y, w, h, t0, dur=1.4, color=(120, 90, 60), label="", value="", vsize=64):
    col = np.array(color, np.float32) / 255

    def f(fr, t, c):
        p = ease(prog(t, t0, t0 + dur))
        if p <= 0:
            return
        (a0, b1), (a1, b0) = c.pt(x - w / 2, base_y), c.pt(x + w / 2, base_y - h * p)
        a0, a1, b0, b1 = int(a0), int(a1), int(b0), int(b1)
        if a1 > a0 and b1 > b0:
            roi = fr[max(0, b0):min(H, b1), max(0, a0):min(W, a1)]
            roi[:] = roi * 0.15 + col * 0.85
        if label:
            px, py = c.pt(x, base_y + 50)
            draw_text(fr, label, (px, py), TYPE, int(44 * c.s), INK, p)
        if value:
            px, py = c.pt(x, base_y - h * p - 40)
            draw_text(fr, value, (px, py), TYPE, int(vsize * c.s), INK, ease(prog(t, t0 + dur * 0.7, t0 + dur)))
    return f


# ================================================================ shot helper (gambar & footage)
def shot_img(t0, t1, name, z0=1.0, z1=1.06, c0=(0.5, 0.5), c1=(0.5, 0.5), fade=0.8, grade=0.78, max_side=3400):
    holder = {}

    def draw(t, u, i):
        if "img" not in holder:
            holder["img"] = load_rgb(name, max_side, grade)
        return kenburns(holder["img"], u, z0, z1, c0, c1)
    return Shot(t0, t1, draw, fade_in=fade, name=name)


def shot_vid(t0, t1, name, ss=0.0, z0=1.0, z1=1.06, c0=(0.5, 0.5), c1=(0.5, 0.5), fade=0.8, grade=0.72,
             portrait=False, speed=1.0):
    holder = {}

    def draw(t, u, i):
        if "f" not in holder:
            holder["f"] = Footage(name, start=ss, portrait_fill=portrait, speed=speed)
        return footage_frame(holder["f"], i, u, z0, z1, c0, c1, grade)
    return Shot(t0, t1, draw, fade_in=fade, name=name)
