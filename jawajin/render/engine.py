# Render engine: numpy/OpenCV frames piped to ffmpeg.
# 1920x1080, 30 fps. Shots (full-frame layers) + overlays (motion graphics) + film finishing.
import os, math, json, functools, subprocess
import numpy as np, cv2
cv2.setNumThreads(1)
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1920, 1080, 30
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets')

GOLD = (232, 196, 120)
CREAM = (240, 226, 196)
INK = (40, 28, 18)
RED = (196, 38, 30)
GHOST = (226, 232, 238)

# ------------------------------------------------------------------ math
def clamp01(x): return 0.0 if x < 0 else 1.0 if x > 1 else x
def ease(x): x = clamp01(x); return 0.5 - 0.5 * math.cos(math.pi * x)
def ease_out(x): x = clamp01(x); return 1 - (1 - x) ** 3
def ease_in(x): x = clamp01(x); return x ** 3
def lerp(a, b, t): return a + (b - a) * t
def lerp2(a, b, t): return (lerp(a[0], b[0], t), lerp(a[1], b[1], t))
def fade(t, t0, t1, fi=0.5, fo=0.5):
    """opacity envelope for an element visible t0..t1"""
    if t < t0 or t > t1: return 0.0
    a = ease((t - t0) / fi) if fi > 0 else 1.0
    b = ease((t1 - t) / fo) if fo > 0 else 1.0
    return min(a, b)

def smooth_noise(t, seed=0, freq=1.0):
    # cheap 1D value noise
    x = t * freq + seed * 17.13
    i = math.floor(x); f = x - i
    def h(n):
        n = (n * 374761393 + seed * 668265263) & 0xffffffff
        n = (n ^ (n >> 13)) * 1274126177 & 0xffffffff
        return ((n ^ (n >> 16)) & 0xffff) / 65535.0 * 2 - 1
    u = f * f * (3 - 2 * f)
    return h(i) * (1 - u) + h(i + 1) * u

# ------------------------------------------------------------------ assets
def find_asset(name):
    for sub in ('img', 'archive', 'gen'):
        p = os.path.join(ASSETS, sub, name)
        if os.path.exists(p): return p
    # prefix match (G38 -> G38_xxx.jpg)
    for sub in ('img', 'archive', 'gen'):
        d = os.path.join(ASSETS, sub)
        if not os.path.isdir(d): continue
        for f in sorted(os.listdir(d)):
            if f.startswith(name + '_') or f == name: return os.path.join(d, f)
    raise FileNotFoundError(name)

@functools.lru_cache(maxsize=40)
def load_img(name, target_cover=0.8):
    """uint8 RGB, upscaled (lanczos + light unsharp) so that cover-fit needs scale<=target_cover"""
    im = cv2.imread(find_asset(name), cv2.IMREAD_COLOR)
    im = cv2.cvtColor(im, cv2.COLOR_BGR2RGB)
    ih, iw = im.shape[:2]
    s = max(W / iw, H / ih)
    if s > target_cover:
        f = s / target_cover
        im = cv2.resize(im, (int(iw * f), int(ih * f)), interpolation=cv2.INTER_LANCZOS4)
        bl = cv2.GaussianBlur(im, (0, 0), 1.4)
        im = cv2.addWeighted(im, 1.45, bl, -0.45, 0)
    return im

@functools.lru_cache(maxsize=40)
def load_raw(name):
    im = cv2.imread(find_asset(name), cv2.IMREAD_COLOR)
    return cv2.cvtColor(im, cv2.COLOR_BGR2RGB)

def to_f(img): return img.astype(np.float32) * (1.0 / 255)

def kb_warp(img, z, c, rot=0.0, weave=(0, 0), out_size=(W, H)):
    """cover-fit img, zoom z (>=1), view centre c (normalised), rotation degrees"""
    ow, oh = out_size
    ih, iw = img.shape[:2]
    s = max(ow / iw, oh / ih) * z
    hw, hh = ow / (2 * s), oh / (2 * s)
    cx = min(max(c[0] * iw, hw), iw - hw)
    cy = min(max(c[1] * ih, hh), ih - hh)
    a = math.radians(rot)
    ca, sa = math.cos(a) * s, math.sin(a) * s
    M = np.array([[ca, -sa, ow / 2 - (ca * cx - sa * cy) + weave[0]],
                  [sa, ca, oh / 2 - (sa * cx + ca * cy) + weave[1]]], np.float32)
    return cv2.warpAffine(img, M, (ow, oh), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

@functools.lru_cache(maxsize=16)
def blurred_bg(name, dark=0.42, sw=240, sigma=5.0):
    img = load_raw(name)
    shh = int(sw * 9 / 16)
    ih, iw = img.shape[:2]
    s = max(sw / iw, shh / ih)
    small = cv2.resize(img, (max(sw, int(iw * s) + 1), max(shh, int(ih * s) + 1)), interpolation=cv2.INTER_AREA)
    y0 = (small.shape[0] - shh) // 2; x0 = (small.shape[1] - sw) // 2
    small = small[y0:y0 + shh, x0:x0 + sw]
    small = cv2.GaussianBlur(small, (0, 0), sigma)
    big = cv2.resize(small, (W + 200, H + 120), interpolation=cv2.INTER_CUBIC)
    return (big.astype(np.float32) / 255 * dark)

# ------------------------------------------------------------------ procedural textures
@functools.lru_cache(maxsize=4)
def paper_tex(seed=1, tone='cream', w=W + 240, h=H + 140):
    rng = np.random.default_rng(seed)
    base = {'cream': (214, 192, 150), 'dark': (58, 42, 28), 'board': (92, 62, 38)}[tone]
    def blob(scale, amp):
        n = rng.standard_normal((max(2, h // scale), max(2, w // scale))).astype(np.float32)
        n = cv2.resize(n, (w, h), interpolation=cv2.INTER_CUBIC)
        return cv2.GaussianBlur(n, (0, 0), scale / 2) * amp
    lum = blob(160, 0.10) + blob(40, 0.05) + blob(6, 0.025)
    fib = rng.standard_normal((h, w)).astype(np.float32)
    fib = cv2.GaussianBlur(fib, (0, 0), sigmaX=0.6, sigmaY=3.0) * 0.03
    if tone == 'board':  # cork-ish speckle
        fib = cv2.GaussianBlur(rng.standard_normal((h, w)).astype(np.float32), (0, 0), 1.2) * 0.10
    img = np.empty((h, w, 3), np.float32)
    for k in range(3):
        img[..., k] = base[k] / 255 * (1 + lum + fib)
    # edge burn
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.minimum(np.minimum(xx, w - xx) / w, np.minimum(yy, h - yy) / h)
    burn = np.clip(d / 0.12, 0, 1) ** 0.6
    img *= (0.55 + 0.45 * burn)[..., None]
    return np.clip(img * 255, 0, 255).astype(np.uint8)

# ------------------------------------------------------------------ fonts & text sprites
FONT_DIR = os.path.join(ASSETS, 'fonts')
FONTS = {'cinzel': 'Cinzel.ttf', 'elite': 'SpecialElite.ttf', 'oswald': 'Oswald.ttf',
         'corm': 'Cormorant.ttf', 'cormi': 'CormorantItalic.ttf', 'bebas': 'BebasNeue.ttf'}

@functools.lru_cache(maxsize=64)
def font(name, size, wght=None):
    f = ImageFont.truetype(os.path.join(FONT_DIR, FONTS[name]), size)
    if wght is not None:
        try: f.set_variation_by_axes([wght])
        except Exception: pass
    return f

@functools.lru_cache(maxsize=512)
def text_sprite(text, fname='cinzel', size=60, color=CREAM, tracking=0, wght=None,
                shadow=0.6, glow=0.0, glow_color=None, stroke=0, stroke_color=(0, 0, 0)):
    """returns float32 RGBA (premultiplied=False) sprite"""
    f = font(fname, size, wght)
    pad = int(size * 0.6) + int(glow * 30)
    # measure
    if tracking == 0:
        bbox = f.getbbox(text, stroke_width=stroke)
        tw = bbox[2] - bbox[0]; x_off = -bbox[0]
    else:
        tw = 0
        for ch in text: tw += f.getlength(ch) + tracking
        tw -= tracking; x_off = 0
    asc, desc = f.getmetrics()
    th = asc + desc
    Wd, Hd = int(tw + 2 * pad), int(th + 2 * pad)
    mask = Image.new('L', (Wd, Hd), 0)
    d = ImageDraw.Draw(mask)
    if tracking == 0:
        d.text((pad + x_off, pad), text, font=f, fill=255, stroke_width=stroke, stroke_fill=255)
    else:
        x = pad
        for ch in text:
            d.text((x, pad), ch, font=f, fill=255, stroke_width=stroke, stroke_fill=255)
            x += f.getlength(ch) + tracking
    m = np.asarray(mask, np.float32) / 255
    rgba = np.zeros((Hd, Wd, 4), np.float32)
    col = np.array(color, np.float32) / 255
    # composite: shadow -> glow -> text
    out_rgb = np.zeros((Hd, Wd, 3), np.float32); out_a = np.zeros((Hd, Wd), np.float32)
    def over(rgb, a):
        nonlocal out_rgb, out_a
        na = a + out_a * (1 - a)
        out_rgb = (rgb * a[..., None] + out_rgb * (out_a * (1 - a))[..., None]) / np.maximum(na, 1e-6)[..., None]
        out_a = na
    if shadow > 0:
        sh = cv2.GaussianBlur(m, (0, 0), max(1.5, size * 0.05))
        sh = np.roll(np.roll(sh, int(size * 0.04) + 1, 0), int(size * 0.03) + 1, 1)
        over(np.zeros((Hd, Wd, 3), np.float32), np.clip(sh * shadow * 1.4, 0, 1))
    if glow > 0:
        g = cv2.GaussianBlur(m, (0, 0), size * 0.25) * glow
        gc = np.array(glow_color or color, np.float32) / 255
        over(np.broadcast_to(gc, (Hd, Wd, 3)).copy(), np.clip(g, 0, 1))
    if stroke and stroke_color is not None and False:
        pass
    over(np.broadcast_to(col, (Hd, Wd, 3)).copy(), m)
    rgba[..., :3] = out_rgb; rgba[..., 3] = out_a
    # trim
    ys, xs = np.where(out_a > 0.003)
    if len(ys):
        rgba = rgba[max(0, ys.min() - 2):ys.max() + 3, max(0, xs.min() - 2):xs.max() + 3]
    return rgba

def sprite_from_rgb(img_u8, alpha=None):
    rgba = np.zeros(img_u8.shape[:2] + (4,), np.float32)
    rgba[..., :3] = img_u8.astype(np.float32) / 255
    rgba[..., 3] = 1.0 if alpha is None else alpha
    return rgba

def blit(frame, spr, x, y, alpha=1.0, anchor='c', scale=1.0):
    """alpha-composite RGBA float sprite onto float frame. (x,y) = anchor point."""
    if alpha <= 0.002: return
    if abs(scale - 1) > 1e-3:
        spr = cv2.resize(spr, (max(1, int(spr.shape[1] * scale)), max(1, int(spr.shape[0] * scale))),
                         interpolation=cv2.INTER_LINEAR if scale > 1 else cv2.INTER_AREA)
    sh, sw = spr.shape[:2]
    ax = {'c': 0.5, 'l': 0.0, 'r': 1.0}[anchor[0] if anchor[0] in 'clr' else 'c']
    ay = 0.5
    if len(anchor) > 1: ay = {'c': 0.5, 't': 0.0, 'b': 1.0}[anchor[1]]
    x0 = int(round(x - sw * ax)); y0 = int(round(y - sh * ay))
    fx0, fy0 = max(0, x0), max(0, y0); fx1, fy1 = min(W, x0 + sw), min(H, y0 + sh)
    if fx1 <= fx0 or fy1 <= fy0: return
    s = spr[fy0 - y0:fy1 - y0, fx0 - x0:fx1 - x0]
    a = s[..., 3:4] * alpha
    roi = frame[fy0:fy1, fx0:fx1]
    roi *= (1 - a); roi += s[..., :3] * a

def fill_mask(frame, mask_u8, color, alpha=1.0, roi=None):
    """mask_u8: HxW uint8 (0..255) ; blend solid color"""
    if alpha <= 0.002: return
    if roi is None:
        ys, xs = np.nonzero(mask_u8[::4, ::4])
        if len(ys) == 0: return
        y0, y1 = max(0, ys.min() * 4 - 8), min(H, ys.max() * 4 + 12)
        x0, x1 = max(0, xs.min() * 4 - 8), min(W, xs.max() * 4 + 12)
    else:
        x0, y0, x1, y1 = roi
    m = mask_u8[y0:y1, x0:x1].astype(np.float32)[..., None] * (alpha / 255)
    c = np.array(color, np.float32) / 255
    r = frame[y0:y1, x0:x1]
    r *= (1 - m); r += c * m

def new_mask(): return np.zeros((H, W), np.uint8)

# ------------------------------------------------------------------ shots
class Shot:
    tin = ('fade', 0.6)   # transition INTO this shot: type, duration
    def __init__(self, t0, t1, tin=None, sfx=None):
        self.t0, self.t1 = t0, t1
        if tin is not None: self.tin = tin
        self.sfx = sfx or []
        self.tail = 0.0   # filled by timeline: next shot's transition duration
    def p(self, t):
        return clamp01((t - self.t0) / max(0.01, (self.t1 + self.tail - self.t0)))
    def render(self, t, weave): raise NotImplementedError

class KB(Shot):
    def __init__(self, t0, t1, img, z=(1.0, 1.08), c=((.5, .5), (.5, .5)), r=(0, 0), tin=None, sfx=None,
                 grade=None, easing='ease'):
        super().__init__(t0, t1, tin, sfx)
        self.img, self.z, self.c, self.r, self.grade = img, z, c, r, grade
        self.easing = easing
    def render(self, t, weave):
        p = self.p(t); p = ease(p) if self.easing == 'ease' else p
        z = lerp(self.z[0], self.z[1], p)
        c = lerp2(self.c[0], self.c[1], p)
        rot = lerp(self.r[0], self.r[1], p)
        f = to_f(kb_warp(load_img(self.img), z, c, rot, weave))
        if self.grade == 'bw': f = sepia(f)
        return f

def sepia(f, strength=1.0, contrast=1.12):
    g = f[..., 0] * 0.3 + f[..., 1] * 0.59 + f[..., 2] * 0.11
    g = np.clip((g - 0.5) * contrast + 0.5, 0, 1)
    tone = np.stack([g * 1.06 + 0.02, g * 0.92 + 0.015, g * 0.74], -1)
    return np.clip(lerp(f, tone, strength), 0, 1)

def card_rgba(img_u8, card_h, border=0.035, paper=(236, 226, 204)):
    ih, iw = img_u8.shape[:2]
    ch = int(card_h); cw = int(card_h * iw / ih)
    inner = cv2.resize(img_u8, (cw, ch), interpolation=cv2.INTER_AREA if ch < ih else cv2.INTER_CUBIC)
    b = int(card_h * border)
    out = np.empty((ch + 2 * b, cw + 2 * b, 3), np.uint8)
    out[:] = paper
    out[b:b + ch, b:b + cw] = inner
    # subtle aging
    yy, xx = np.mgrid[0:out.shape[0], 0:out.shape[1]].astype(np.float32)
    d = np.minimum(np.minimum(xx, out.shape[1] - xx), np.minimum(yy, out.shape[0] - yy))
    age = np.clip(d / (b * 3 + 1), 0, 1) * 0.12 + 0.88
    out = (out.astype(np.float32) * age[..., None]).astype(np.uint8)
    return out

def project_quad(w, h, cx, cy, scale, yaw, pitch, roll=0.0, f=2400.0):
    pts = np.array([[-w / 2, -h / 2, 0], [w / 2, -h / 2, 0], [w / 2, h / 2, 0], [-w / 2, h / 2, 0]], np.float32) * scale
    a, b, c = math.radians(yaw), math.radians(pitch), math.radians(roll)
    Ry = np.array([[math.cos(a), 0, math.sin(a)], [0, 1, 0], [-math.sin(a), 0, math.cos(a)]])
    Rx = np.array([[1, 0, 0], [0, math.cos(b), -math.sin(b)], [0, math.sin(b), math.cos(b)]])
    Rz = np.array([[math.cos(c), -math.sin(c), 0], [math.sin(c), math.cos(c), 0], [0, 0, 1]])
    P = pts @ (Rz @ Rx @ Ry).T
    z = P[:, 2] + f
    return np.stack([cx + f * P[:, 0] / z, cy + f * P[:, 1] / z], 1).astype(np.float32)

def draw_card(frame, card_u8, quad, shadow=0.6, alpha=1.0):
    ch, cw = card_u8.shape[:2]
    src = np.array([[0, 0], [cw, 0], [cw, ch], [0, ch]], np.float32)
    Hm = cv2.getPerspectiveTransform(src, quad)
    x0, y0 = np.floor(quad.min(0)).astype(int) - 60
    x1, y1 = np.ceil(quad.max(0)).astype(int) + 90
    x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(W, x1), min(H, y1)
    if x1 <= x0 or y1 <= y0: return
    T = np.array([[1, 0, -x0], [0, 1, -y0], [0, 0, 1]], np.float64) @ Hm
    rw, rh = x1 - x0, y1 - y0
    warped = cv2.warpPerspective(card_u8, T, (rw, rh), flags=cv2.INTER_LINEAR)
    a = cv2.warpPerspective(np.full((ch, cw), 255, np.uint8), T, (rw, rh), flags=cv2.INTER_LINEAR).astype(np.float32) / 255
    roi = frame[y0:y1, x0:x1]
    if shadow > 0:
        sh = cv2.GaussianBlur(a, (0, 0), 16)
        M = np.float32([[1, 0, 14], [0, 1, 24]])
        sh = cv2.warpAffine(sh, M, (rw, rh))
        roi *= (1 - sh * shadow * alpha)[..., None]
    a = a[..., None] * alpha
    roi *= (1 - a); roi += warped.astype(np.float32) / 255 * a

class Card3D(Shot):
    """archive still as a physical print floating in 3D over a background"""
    def __init__(self, t0, t1, img, bg='blur', bg_img=None, h=0.78, pos=(0.5, 0.5), yaw=(-7, 5), pitch=(3, -1),
                 roll=(-1.0, 0.6), scale=(0.96, 1.04), tin=None, sfx=None, bw=False, crop=None):
        super().__init__(t0, t1, tin, sfx)
        self.img, self.bg, self.bg_img, self.h, self.pos = img, bg, bg_img, h, pos
        self.yaw, self.pitch, self.roll, self.scale, self.bw, self.crop = yaw, pitch, roll, scale, bw, crop
        self._card = None
    def card(self):
        if self._card is None:
            im = load_raw(self.img)
            if self.crop:
                x0, y0, x1, y1 = self.crop; ih, iw = im.shape[:2]
                im = im[int(y0 * ih):int(y1 * ih), int(x0 * iw):int(x1 * iw)]
            if self.bw:
                im = (sepia(im.astype(np.float32) / 255) * 255).astype(np.uint8)
            self._card = card_rgba(im, H * self.h)
        return self._card
    def render(self, t, weave):
        p = ease(self.p(t))
        frame = background(self.bg, self.bg_img or self.img, t, weave, p)
        c = self.card()
        quad = project_quad(c.shape[1], c.shape[0], W * self.pos[0] + weave[0], H * self.pos[1] + weave[1],
                            lerp(*self.scale, p), lerp(*self.yaw, p), lerp(*self.pitch, p), lerp(*self.roll, p))
        draw_card(frame, c, quad)
        return frame

def background(kind, img, t, weave, p):
    if kind in ('blur', 'soft'):
        bg = blurred_bg(img) if kind == 'blur' else blurred_bg(img, 0.5, 480, 3.0)
        dx = int(100 + 60 * (p - 0.5) + weave[0]); dy = int(60 + weave[1])
        return bg[dy:dy + H, dx:dx + W].copy()
    if kind in ('paper', 'dark', 'board'):
        tex = paper_tex(3 if kind == 'paper' else 5 if kind == 'dark' else 7, 'cream' if kind == 'paper' else kind)
        dx = int(120 + 50 * (p - 0.5) + weave[0]); dy = int(70 + 20 * (p - 0.5) + weave[1])
        return tex[dy:dy + H, dx:dx + W].astype(np.float32) / 255
    if kind == 'black':
        return np.zeros((H, W, 3), np.float32)
    raise ValueError(kind)

class Plate(Shot):
    """plain background (paper/dark/board/blur-of-image) – used under diagram overlays"""
    def __init__(self, t0, t1, kind='paper', img=None, tin=None, sfx=None, dim=1.0, kb=None):
        super().__init__(t0, t1, tin, sfx)
        self.kind, self.img, self.dim, self.kb = kind, img, dim, kb
    def render(self, t, weave):
        p = ease(self.p(t))
        if self.kind == 'kbimg':
            z0, z1, c0, c1 = self.kb
            f = to_f(kb_warp(load_img(self.img), lerp(z0, z1, p), lerp2(c0, c1, p), 0, weave))
            f = cv2.GaussianBlur(f, (0, 0), 6) if self.dim < 0.7 else f
            return f * self.dim
        f = background(self.kind, self.img, t, weave, p)
        return f * self.dim if self.dim != 1 else f

class Fn(Shot):
    def __init__(self, t0, t1, fn, tin=None, sfx=None):
        super().__init__(t0, t1, tin, sfx); self.fn = fn
    def render(self, t, weave): return self.fn(self, t, weave)

# ------------------------------------------------------------------ video
class VideoReader:
    def __init__(self, path, src_t, dur, size, vf_extra=''):
        self.path, self.src_t, self.dur, self.size, self.vf = path, src_t, dur, size, vf_extra
        self.proc = None; self.next_idx = None
    def _open(self, idx):
        if self.proc: self.proc.kill()
        t = self.src_t + idx / FPS
        w, h = self.size
        vf = f'fps={FPS},scale={w}:{h}:flags=lanczos' + (',' + self.vf if self.vf else '')
        cmd = ['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', self.path, '-t', f'{self.dur - idx / FPS + 1:.3f}',
               '-vf', vf, '-an', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
        self.proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, bufsize=10 ** 8)
        self.next_idx = idx; self.last = None
    def frame(self, idx):
        w, h = self.size
        if self.proc is None or idx < self.next_idx - 1 or idx > self.next_idx + 3:
            self._open(idx)
        while self.next_idx <= idx:
            buf = self.proc.stdout.read(w * h * 3)
            if len(buf) < w * h * 3:
                break
            self.last = np.frombuffer(buf, np.uint8).reshape(h, w, 3)
            self.next_idx += 1
        if self.last is None: return np.zeros((h, w, 3), np.uint8)
        return self.last

class Vid(Shot):
    """archive footage. mode 'full' (cover, slow push) or 'film' (inside a running film strip)"""
    def __init__(self, t0, t1, file, src, mode='film', tin=None, sfx=None, z=(1.0, 1.05), c=(.5, .5), bw=True,
                 src_size=(720, 576), crop=None, speed=1.0):
        super().__init__(t0, t1, tin, sfx)
        self.file, self.src, self.mode, self.z, self.c, self.bw, self.speed = file, src, mode, z, c, bw, speed
        sw, sh = src_size
        self.crop = crop
        self.reader = None
    def _reader(self):
        if self.reader is None:
            path = find_asset(self.file)
            dur = (self.t1 + 2 - self.t0) * self.speed
            vf = ''
            if self.crop: vf = 'crop=' + self.crop
            size = (960, 720) if self.mode == 'film' else (1280, 720)
            if self.speed != 1.0:
                vf = (vf + ',' if vf else '') + f'setpts=PTS/{self.speed}'
            self.reader = VideoReader(path, self.src, dur, size, vf)
            # crop/setpts must come before scale: rebuild vf ordering
            self.reader.vf = ''
            pre = []
            if self.crop: pre.append('crop=' + self.crop)
            if self.speed != 1.0: pre.append(f'setpts=PTS/{self.speed}')
            self.reader.pre = ','.join(pre)
        return self.reader
    def render(self, t, weave):
        rd = self._reader()
        idx = int(round((t - (self.t0 - 0.8)) * FPS))  # start 0.8s early to cover transitions
        idx = max(0, idx)
        fr = rd_frame(rd, idx)
        p = ease(self.p(t))
        if self.mode == 'full':
            f = to_f(kb_warp(fr, lerp(*self.z, p), self.c, 0, weave))
            return sepia(f) if self.bw else f
        # film strip mode
        bgf = cv2.resize(fr, (192, 108), interpolation=cv2.INTER_AREA)
        bgf = cv2.GaussianBlur(bgf, (0, 0), 4)
        frame = cv2.resize(bgf, (W, H), interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255 * 0.35
        if self.bw: frame = sepia(frame)
        strip_w = 1180; x0 = (W - strip_w) // 2 + int(weave[0])
        frame[:, max(0, x0):x0 + strip_w] *= 0.06
        # sprocket holes (moving)
        m = new_mask()
        off = int((t * 90) % 80)
        for xs in (x0 + 30, x0 + strip_w - 62):
            for y in range(-80 + off, H + 80, 80):
                cv2.rectangle(m, (xs, y), (xs + 32, y + 44), 255, -1, cv2.LINE_AA)
        fill_mask(frame, m, (215, 200, 170), 0.55, roi=(max(0, x0), 0, min(W, x0 + strip_w), H))
        vw, vh = 1020, 765
        img = kb_warp(fr, lerp(*self.z, p), self.c, 0, (0, 0), out_size=(vw, vh))
        f = img.astype(np.float32) / 255
        if self.bw: f = sepia(f)
        vx, vy = (W - vw) // 2 + int(weave[0]), (H - vh) // 2 + int(weave[1])
        frame[vy:vy + vh, vx:vx + vw] = f
        return frame

def rd_frame(rd, idx):
    # apply pre-filters (crop/speed) by rebuilding command on first open
    if getattr(rd, 'pre', '') and not rd.vf.startswith(rd.pre):
        pass
    if rd.proc is None or idx < rd.next_idx - 1 or idx > rd.next_idx + 3:
        open_reader(rd, idx)
    w, h = rd.size
    while rd.next_idx <= idx:
        buf = rd.proc.stdout.read(w * h * 3)
        if len(buf) < w * h * 3: break
        rd.last = np.frombuffer(buf, np.uint8).reshape(h, w, 3); rd.next_idx += 1
    if rd.last is None: return np.zeros((h, w, 3), np.uint8)
    return rd.last

def open_reader(rd, idx):
    if rd.proc: rd.proc.kill()
    t = rd.src_t + idx / FPS * 1.0
    w, h = rd.size
    pre = getattr(rd, 'pre', '')
    vf = (pre + ',' if pre else '') + f'fps={FPS},scale={w}:{h}:force_original_aspect_ratio=increase:flags=lanczos,crop={w}:{h}'
    cmd = ['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', rd.path, '-t', f'{max(1.0, rd.dur - idx / FPS + 1):.3f}',
           '-vf', vf, '-an', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    rd.proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, bufsize=10 ** 8)
    rd.next_idx = idx; rd.last = None

# ------------------------------------------------------------------ overlays
class Overlay:
    def __init__(self, t0, t1, sfx=None):
        self.t0, self.t1 = t0, t1; self.sfx = sfx or []
    def active(self, t): return self.t0 - 0.05 <= t <= self.t1 + 0.05
    def draw(self, f, t): raise NotImplementedError

class Text(Overlay):
    def __init__(self, t0, t1, text, x, y, fname='cinzel', size=60, color=CREAM, tracking=0, wght=None,
                 anchor='c', anim='rise', fi=0.6, fo=0.5, glow=0.0, glow_color=None, shadow=0.7, sfx=None, scale_from=1.0):
        super().__init__(t0, t1, sfx)
        self.args = dict(text=text, fname=fname, size=size, color=color, tracking=tracking, wght=wght,
                         glow=glow, glow_color=glow_color, shadow=shadow)
        self.x, self.y, self.anchor, self.anim, self.fi, self.fo, self.scale_from = x, y, anchor, anim, fi, fo, scale_from
    def draw(self, f, t):
        a = fade(t, self.t0, self.t1, self.fi, self.fo)
        if a <= 0: return
        spr = text_sprite(**self.args)
        q = ease_out((t - self.t0) / max(self.fi, 0.01) if self.fi else 1)
        y = self.y + (1 - q) * 18 if self.anim == 'rise' else self.y
        sc = lerp(self.scale_from, 1.0, q) if self.scale_from != 1.0 else 1.0
        if self.anim == 'drift': sc *= 1 + 0.03 * clamp01((t - self.t0) / max(0.1, self.t1 - self.t0))
        blit(f, spr, self.x, y, a, self.anchor, sc)

class LowerThird(Overlay):
    def __init__(self, t0, t1, name, sub=None, x=120, y=880, sfx=None, color=GOLD, right=False):
        super().__init__(t0, t1, sfx)
        self.name, self.sub, self.x, self.y, self.color, self.right = name, sub, x, y, color, right
    _grad = {}
    def draw(self, f, t):
        a = fade(t, self.t0, self.t1, 0.5, 0.5)
        if a <= 0: return
        key = (self.right, self.y)
        if key not in LowerThird._grad:
            yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
            cx = 0 if not self.right else W
            g = np.exp(-(((xx - cx) / 1100) ** 2 + ((yy - self.y - 20) / 230) ** 2))
            LowerThird._grad[key] = (np.clip(g * 1.25, 0, 1)[..., None]).astype(np.float32)
        f *= (1 - 0.62 * a * LowerThird._grad[key])
        q = ease_out((t - self.t0) / 0.9)
        ns = text_sprite(self.name, 'cinzel', 50, CREAM, 6, 700, shadow=0.85)
        linew = int(max(ns.shape[1], 300) * q)
        m = new_mask()
        x = self.x if not self.right else W - self.x
        if not self.right:
            cv2.line(m, (x, self.y), (x + linew, self.y), 255, 3, cv2.LINE_AA)
        else:
            cv2.line(m, (x - linew, self.y), (x, self.y), 255, 3, cv2.LINE_AA)
        fill_mask(f, m, self.color, a * 0.95, roi=(0, self.y - 6, W, self.y + 6))
        anc = 'lb' if not self.right else 'rb'
        blit(f, ns, x - 4 if not self.right else x + 4, self.y - 6, a * clamp01((t - self.t0 - 0.15) / 0.5), anc)
        if self.sub:
            ss = text_sprite(self.sub, 'cormi', 38, (236, 222, 196), 0, 500, shadow=0.9)
            blit(f, ss, x if not self.right else x, self.y + 8, a * clamp01((t - self.t0 - 0.4) / 0.6),
                 'lt' if not self.right else 'rt')

class Stamp(Overlay):
    def __init__(self, t0, t1, text, x, y, angle=-8, size=86, color=RED, sfx=('stamp', 0.0, 0.9), box=True):
        super().__init__(t0, t1, [sfx] if sfx else [])
        self.text, self.x, self.y, self.angle, self.size, self.color, self.box = text, x, y, angle, size, color, box
        self._spr = None
    def sprite(self):
        if self._spr is None:
            ts = text_sprite(self.text, 'elite', self.size, self.color, 4, shadow=0)
            h, w = ts.shape[:2]; pad = int(self.size * 0.35)
            spr = np.zeros((h + 2 * pad, w + 2 * pad, 4), np.float32)
            spr[pad:pad + h, pad:pad + w] = ts
            if self.box:
                m = np.zeros(spr.shape[:2], np.uint8)
                cv2.rectangle(m, (6, 6), (spr.shape[1] - 7, spr.shape[0] - 7), 255, max(4, self.size // 14), cv2.LINE_AA)
                mm = m.astype(np.float32) / 255
                spr[..., :3] = np.where(mm[..., None] > 0, np.array(self.color, np.float32) / 255, spr[..., :3])
                spr[..., 3] = np.maximum(spr[..., 3], mm)
            # ink grunge
            rng = np.random.default_rng(len(self.text))
            n = cv2.GaussianBlur(rng.random(spr.shape[:2]).astype(np.float32), (0, 0), 1.5)
            spr[..., 3] *= np.clip((n - 0.25) * 3.0, 0.35, 1.0)
            # rotate
            hh, ww = spr.shape[:2]; d = int(math.hypot(hh, ww)) + 4
            big = np.zeros((d, d, 4), np.float32)
            big[(d - hh) // 2:(d - hh) // 2 + hh, (d - ww) // 2:(d - ww) // 2 + ww] = spr
            M = cv2.getRotationMatrix2D((d / 2, d / 2), self.angle, 1.0)
            self._spr = cv2.warpAffine(big, M, (d, d), flags=cv2.INTER_LINEAR)
        return self._spr
    def draw(self, f, t):
        if t < self.t0 or t > self.t1: return
        k = (t - self.t0) / 0.16
        sc = lerp(1.6, 1.0, ease_out(k)) if k < 1 else 1.0
        a = clamp01(k * 1.5) * fade(t, self.t0, self.t1, 0.0, 0.35)
        blit(f, self.sprite(), self.x, self.y, a * 0.92, 'c', sc)

class Scribble(Overlay):
    """hand-drawn red ellipse around a point"""
    def __init__(self, t0, t1, x, y, rx, ry, color=RED, thick=6, dur=0.6, sfx=('scribble', 0.0, 0.6), turns=1.15, angle=0.0):
        super().__init__(t0, t1, [sfx] if sfx else [])
        self.x, self.y, self.rx, self.ry, self.color, self.th, self.dur, self.turns = x, y, rx, ry, color, thick, dur, turns
        rng = np.random.default_rng(int(x * 7 + y))
        n = 120
        a = np.linspace(-0.6, -0.6 + 2 * math.pi * turns, n)
        wob = 1 + 0.06 * np.sin(a * 2 + rng.random() * 6) + np.linspace(0, 0.08, n)
        ex, ey = rx * wob * np.cos(a), ry * wob * np.sin(a)
        ca, sa = math.cos(math.radians(angle)), math.sin(math.radians(angle))
        self.pts = np.stack([x + ex * ca - ey * sa, y + ex * sa + ey * ca], 1)
    def draw(self, f, t):
        a = fade(t, self.t0, self.t1, 0.01, 0.4)
        if a <= 0: return
        q = ease_out((t - self.t0) / self.dur)
        k = max(2, int(len(self.pts) * q))
        m = new_mask()
        cv2.polylines(m, [np.round(self.pts[:k] * 4).astype(np.int32)], False, 255, self.th, cv2.LINE_AA, shift=2)
        fill_mask(f, m, self.color, a * 0.9)

class Arrow(Overlay):
    def __init__(self, t0, t1, p0, p1, color=GOLD, thick=5, dur=0.8, head=26, dashed=False, curve=0.0, sfx=None):
        super().__init__(t0, t1, sfx)
        self.p0, self.p1, self.color, self.th, self.dur, self.head, self.dashed, self.curve = p0, p1, color, thick, dur, head, dashed, curve
        n = 60; s = np.linspace(0, 1, n)
        (x0, y0), (x1, y1) = p0, p1
        nx, ny = -(y1 - y0), (x1 - x0)
        b = np.sin(s * math.pi) * curve
        self.pts = np.stack([x0 + (x1 - x0) * s + nx * b, y0 + (y1 - y0) * s + ny * b], 1)
    def draw(self, f, t):
        a = fade(t, self.t0, self.t1, 0.01, 0.4)
        if a <= 0: return
        q = ease((t - self.t0) / self.dur)
        k = max(2, int(len(self.pts) * q))
        m = new_mask()
        pts = self.pts[:k]
        if self.dashed:
            for i in range(0, k - 1, 4):
                seg = pts[i:i + 3]
                if len(seg) > 1: cv2.polylines(m, [np.round(seg * 4).astype(np.int32)], False, 255, self.th, cv2.LINE_AA, shift=2)
        else:
            cv2.polylines(m, [np.round(pts * 4).astype(np.int32)], False, 255, self.th, cv2.LINE_AA, shift=2)
        if q > 0.95:
            tip = pts[-1]; d = pts[-1] - pts[-4]; d = d / (np.linalg.norm(d) + 1e-6)
            nrm = np.array([-d[1], d[0]])
            tri = np.array([tip + d * 6, tip - d * self.head + nrm * self.head * 0.55, tip - d * self.head - nrm * self.head * 0.55])
            cv2.fillPoly(m, [np.round(tri * 4).astype(np.int32)], 255, cv2.LINE_AA, shift=2)
        fill_mask(f, m, self.color, a)

class Dim(Overlay):
    """darken frame (for readability of graphics)"""
    def __init__(self, t0, t1, amount=0.5, fi=0.5, fo=0.5, grad=None):
        super().__init__(t0, t1); self.amount, self.fi, self.fo, self.grad = amount, fi, fo, grad
        if grad == 'bottom':
            y = np.linspace(0, 1, H, dtype=np.float32)
            self.g = (np.clip((y - 0.55) / 0.45, 0, 1) ** 1.3)[:, None, None]
        elif grad == 'left':
            x = np.linspace(0, 1, W, dtype=np.float32)
            self.g = (np.clip((0.6 - x) / 0.6, 0, 1) ** 1.2)[None, :, None]
        else: self.g = None
    def draw(self, f, t):
        a = fade(t, self.t0, self.t1, self.fi, self.fo) * self.amount
        if a <= 0: return
        if self.g is None: f *= (1 - a)
        else: f *= (1 - a * self.g)

class Source(Overlay):
    """small archive credit, bottom right"""
    def __init__(self, t0, t1, text):
        super().__init__(t0, t1); self.text = text
    def draw(self, f, t):
        a = fade(t, self.t0, self.t1, 0.6, 0.4) * 0.8
        if a <= 0: return
        blit(f, text_sprite(self.text, 'elite', 24, (230, 218, 192), 1, shadow=0.9), W - 60, H - 52, a, 'rc')

class Group(Overlay):
    def __init__(self, items):
        self.items = items
        super().__init__(min(i.t0 for i in items), max(i.t1 for i in items), sum([i.sfx for i in items], []))
    def draw(self, f, t):
        for i in self.items:
            if i.active(t): i.draw(f, t)

class FnOverlay(Overlay):
    def __init__(self, t0, t1, fn, sfx=None):
        super().__init__(t0, t1, sfx); self.fn = fn
    def draw(self, f, t): self.fn(self, f, t)

# ------------------------------------------------------------------ circle portrait node
@functools.lru_cache(maxsize=64)
def circle_portrait(img, cx, cy, zoom_h, r, ring=GOLD, ghost=False, light=False):
    """circular crop sprite. (cx,cy) normalised centre, zoom_h = crop height fraction of image"""
    d = 2 * r + 16
    spr = np.zeros((d, d, 4), np.float32)
    if light:
        yy, xx = np.mgrid[0:d, 0:d].astype(np.float32)
        rr = np.hypot(xx - d / 2, yy - d / 2) / r
        core = np.clip(1.2 - rr, 0, 1) ** 1.5
        spr[..., :3] = np.stack([np.full_like(rr, 1.0), np.full_like(rr, 0.97), np.full_like(rr, 0.9)], -1)
        spr[..., 3] = np.clip(core * 1.3, 0, 1) * (rr <= 1.0)
        body = (rr <= 1.0).astype(np.float32)
        spr[..., :3] = spr[..., :3] * spr[..., 3:4] + np.array([0.35, 0.28, 0.18]) * (1 - spr[..., 3:4])
        spr[..., 3] = body
    else:
        im = load_raw(img); ih, iw = im.shape[:2]
        ch = zoom_h * ih; cw = ch
        x0 = int(np.clip(cx * iw - cw / 2, 0, iw - cw)); y0 = int(np.clip(cy * ih - ch / 2, 0, ih - ch))
        crop = im[y0:y0 + int(ch), x0:x0 + int(cw)]
        crop = cv2.resize(crop, (2 * r, 2 * r), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        if ghost:
            crop = np.clip(crop * 0.6 + np.array([0.42, 0.45, 0.5]) * 0.6, 0, 1)
        m = np.zeros((2 * r, 2 * r), np.uint8)
        cv2.circle(m, (r * 4, r * 4), r * 4 - 4, 255, -1, cv2.LINE_AA, shift=2)
        spr[8:8 + 2 * r, 8:8 + 2 * r, :3] = crop
        spr[8:8 + 2 * r, 8:8 + 2 * r, 3] = m.astype(np.float32) / 255
    # ring
    m = np.zeros((d, d), np.uint8)
    cv2.circle(m, (d * 2, d * 2), r * 4, 255, 14, cv2.LINE_AA, shift=2)
    mm = m.astype(np.float32)[..., None] / 255
    col = np.array(ring, np.float32) / 255
    spr[..., :3] = spr[..., :3] * (1 - mm) + col * mm
    spr[..., 3] = np.maximum(spr[..., 3], mm[..., 0])
    return spr

# ------------------------------------------------------------------ finishing
class Finisher:
    def __init__(self, seed=11):
        rng = np.random.default_rng(seed)
        y, x = np.mgrid[0:H, 0:W].astype(np.float32)
        r = np.hypot((x - W / 2) / (W / 2), (y - H / 2) / (H / 2))
        self.vig = (1 - 0.38 * np.clip(r - 0.45, 0, 1) ** 1.6)[..., None].astype(np.float32)
        self.grain = []
        for i in range(12):
            g = rng.standard_normal((H // 2, W // 2)).astype(np.float32)
            g = cv2.GaussianBlur(g, (0, 0), 0.7)
            g = cv2.resize(g, (W, H), interpolation=cv2.INTER_LINEAR)
            self.grain.append((g * 127 / 3).clip(-127, 127).astype(np.int8))
        self.tint = np.array([1.035, 1.0, 0.935], np.float32)
    def apply(self, f, fi, t, extra_leak=0.0):
        # warm grade + lifted blacks (90s print look)
        f *= self.tint
        f *= 0.93; f += np.array([0.035, 0.028, 0.02], np.float32)
        # halation
        small = cv2.resize(f, (240, 135), interpolation=cv2.INTER_AREA)
        hi = np.clip(small - 0.62, 0, 1)
        hi = cv2.GaussianBlur(hi, (0, 0), 5)
        f += cv2.resize(hi, (W, H), interpolation=cv2.INTER_LINEAR) * np.array([0.55, 0.32, 0.16], np.float32)
        # flicker
        fl = 1 + 0.014 * smooth_noise(t, 3, 9) + 0.006 * smooth_noise(t, 5, 23)
        f *= self.vig * fl
        # grain
        f += self.grain[fi % 12].astype(np.float32)[..., None] * (0.03 / 42)
        # dust & hair
        rng = np.random.default_rng(fi * 7919 + 13)
        if rng.random() < 0.28:
            m = new_mask()
            for _ in range(rng.integers(1, 4)):
                x, y = int(rng.integers(0, W)), int(rng.integers(0, H))
                cv2.ellipse(m, (x, y), (int(rng.integers(1, 4)), int(rng.integers(1, 3))), float(rng.integers(0, 180)), 0, 360, 255, -1, cv2.LINE_AA)
            if rng.random() < 0.15:
                x, y = int(rng.integers(100, W - 100)), int(rng.integers(100, H - 100))
                pts = np.cumsum(rng.normal(0, 6, (14, 2)), 0) + [x, y]
                cv2.polylines(m, [pts.astype(np.int32)], False, 200, 1, cv2.LINE_AA)
            dark = rng.random() < 0.7
            fill_mask(f, m, (20, 14, 8) if dark else (250, 240, 220), 0.55)
        if rng.random() < 0.025:
            x = int(rng.integers(150, W - 150))
            f[:, x:x + 2] *= 1.12
        return f

def light_leak(p, seed=0):
    """warm burn texture (float HxWx3), intensity peaks at p=0.5"""
    k = math.sin(math.pi * clamp01(p)) ** 1.5
    if k < 0.01: return None, 0
    w, h = 192, 108
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx = lerp(-0.2, 1.2, p) * w; cy = (0.35 + 0.2 * math.sin(seed)) * h
    r1 = np.exp(-(((xx - cx) / (w * 0.32)) ** 2 + ((yy - cy) / (h * 0.7)) ** 2))
    r2 = np.exp(-(((xx - (w - cx * 0.7)) / (w * 0.22)) ** 2 + ((yy - h * 0.8) / (h * 0.5)) ** 2))
    leak = np.stack([r1 * 1.0 + r2 * 0.9, r1 * 0.55 + r2 * 0.3, r1 * 0.18 + r2 * 0.08], -1)
    return cv2.resize(leak, (W, H), interpolation=cv2.INTER_CUBIC), k

# ------------------------------------------------------------------ timeline compositor
class Timeline:
    def __init__(self, shots, overlays, duration):
        self.shots = sorted(shots, key=lambda s: s.t0)
        for a, b in zip(self.shots, self.shots[1:]):
            a.t1 = b.t0  # contiguous
            a.tail = b.tin[1] if b.tin[0] != 'cut' else 0.0
        self.shots[-1].t1 = duration
        self.overlays = overlays
        self.duration = duration
        self.fin = Finisher()
    def shot_at(self, t):
        cur = None
        for i, s in enumerate(self.shots):
            if s.t0 <= t: cur = i
        return cur
    def frame(self, fi):
        t = fi / FPS
        weave = (0.7 * smooth_noise(t, 1, 3.1) + 0.25 * smooth_noise(t, 2, 11), 0.9 * smooth_noise(t, 4, 2.3) + 0.3 * smooth_noise(t, 6, 13))
        i = self.shot_at(t)
        s = self.shots[i]
        kind, d = s.tin
        f = s.render(t, weave)
        leak = 0
        if i > 0 and kind != 'cut' and t < s.t0 + d:
            p = (t - s.t0) / d
            prev = self.shots[i - 1].render(t, weave)
            if kind == 'fade':
                a = ease(p); f = prev * (1 - a) + f * a
            elif kind == 'burn':
                a = ease(p); f = prev * (1 - a) + f * a
                L, k = light_leak(p, i)
                if L is not None:
                    f = 1 - (1 - np.clip(f, 0, 1)) * (1 - np.clip(L * k * 1.1, 0, 1))
            elif kind == 'dip':
                f = prev * (1 - ease(p * 2)) if p < 0.5 else f * ease((p - 0.5) * 2)
            elif kind == 'slide':
                a = ease(p); off = int(W * (1 - a))
                g = prev.copy() * (1 - 0.5 * a)
                sh = int(-W * 0.25 * a)
                g = np.roll(g, sh, 1)
                g[:, off:] = f[:, :W - off] if off < W else g[:, off:]
                f = g
            elif kind == 'flash':
                a = ease(p); f = prev * (1 - a) + f * a
                k = math.sin(math.pi * p) ** 2
                f = f + k * 0.9
        for o in self.overlays:
            if o.active(t): o.draw(f, t)
        # global fade in/out
        if t < 0.4: f *= ease(t / 0.4)
        if t > self.duration - 1.6: f *= ease((self.duration - t) / 1.6)
        f = self.fin.apply(f, fi, t)
        return np.clip(f * 255 + 0.5, 0, 255).astype(np.uint8)

def writer(path, crf=16):
    cmd = ['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
           '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', str(crf), '-pix_fmt', 'yuv420p',
           '-x264-params', 'keyint=60:min-keyint=60', path]
    return subprocess.Popen(cmd, stdin=subprocess.PIPE)
