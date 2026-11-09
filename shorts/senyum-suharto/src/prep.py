"""Prepare graded photo prints and procedural textures for the render.

Run:  python3 -I src/prep.py   (from the project folder)
Outputs go to assets/gen/.
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageOps
from scipy.ndimage import gaussian_filter, zoom

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "assets", "raw")
GEN = os.path.join(ROOT, "assets", "gen")
os.makedirs(GEN, exist_ok=True)
rng = np.random.default_rng(7)


def grade(im, bw, warm=1.0):
    """Archival print look: lifted blacks, soft highlights, warm tone."""
    im = im.convert("RGB")
    a = np.asarray(im).astype(np.float32) / 255.0
    if bw:
        g = a @ np.array([0.30, 0.59, 0.11], np.float32)
        g = np.clip((g - 0.5) * 1.08 + 0.5, 0, 1)
        # silver-gelatin warm tone
        tone = np.stack([g * 1.0, g * 0.955, g * 0.86], -1)
        a = tone
    else:
        lum = (a @ np.array([0.30, 0.59, 0.11], np.float32))[..., None]
        a = lum + (a - lum) * 0.72  # desaturate
        a = a * np.array([1.03, 0.99, 0.90], np.float32)  # warm, faded
    a = 0.055 + a * 0.90  # lift blacks, roll highlights
    a = a ** 1.04
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


def up(im, w):
    h = round(im.height * w / im.width)
    im = im.resize((w, h), Image.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(radius=2.2, percent=40, threshold=2))


def crop_n(im, x0, y0, x1, y1):
    W, H = im.size
    return im.crop((round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H)))


def save(im, name):
    im.save(os.path.join(GEN, name), quality=95)
    print(name, im.size)


def load(n):
    return ImageOps.exif_transpose(Image.open(os.path.join(RAW, n)))


# ---------------------------------------------------------------- photos
save(up(grade(load("suharto_jas_senyum.jpg"), True), 1800), "portrait.jpg")
save(up(grade(crop_n(load("suharto_baret.jpg"), 0.0, 0.0, 0.925, 0.965), True), 1100), "cover.jpg")
save(up(grade(load("suharto_cerutu.jpg"), True), 1700), "contact1.jpg")
sawah = load("suharto_sawah.jpg")
c2 = crop_n(sawah, 0.20, 0.05, 0.80, 0.05 + 0.60 * sawah.width / sawah.height / 1.4)
save(up(grade(c2, False), 1700), "contact2.jpg")
peci = load("suharto_peci.jpg")
h = peci.width / 1.4 / peci.height
c3 = crop_n(peci, 0.0, 0.16, 1.0, 0.16 + h)
save(up(grade(c3, False), 1700), "contact3.jpg")
save(up(grade(peci, False), 1600), "peci.jpg")
save(up(grade(load("roosa_kacamata.jpg"), False), 1400), "roosa1.jpg")
save(up(grade(load("roosa_batik.jpg"), False), 1700), "roosa2.jpg")
mil = crop_n(load("suharto_militer_mik.jpg"), 0.0, 0.015, 1.0, 0.915)
save(up(grade(mil, True), 1450), "militer.jpg")
save(up(grade(load("protes_turunkan.jpg"), True), 1800), "protes.jpg")
save(up(grade(sawah, False), 1400), "sawah.jpg")


# ---------------------------------------------------------------- noise utils
def fbm(h, w, octaves, base, seed):
    r = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        s = base * 2 ** o
        gh, gw = max(2, int(h / s) + 2), max(2, int(w / s) + 2)
        g = r.standard_normal((gh, gw)).astype(np.float32)
        z = zoom(g, (h / (gh - 1), w / (gw - 1)), order=3)[:h, :w]
        if z.shape != (h, w):
            z = np.pad(z, ((0, h - z.shape[0]), (0, w - z.shape[1])), mode="edge")
        out += z * amp
        tot += amp
        amp *= 0.5
    return out / tot


def tileable(a, sigma):
    """Blur with wrap so the texture tiles."""
    return gaussian_filter(a, sigma, mode="wrap")


# ---------------------------------------------------------------- desk base (low frequency)
# world desk spans 16000 x 27000 units -> 2000 x 3375 px (8 units / px). Planks run vertically.
DW, DH = 2000, 3375
y = np.arange(DH)[:, None].astype(np.float32)
x = np.arange(DW)[None, :].astype(np.float32)
plank_w = 175  # px (= 1400 units)
pid = np.floor(x / plank_w)
warp = fbm(DH, DW, 4, 220, 1) * 22
gx = x + warp
rings = np.sin((gx + pid * 37.0) * 0.55 + fbm(DH, DW, 3, 400, 2) * 6.0)
rings2 = np.sin((gx * 0.21 + pid * 11.0) + fbm(DH, DW, 3, 600, 3) * 3.0)
plank_tone = np.random.default_rng(4).uniform(-0.10, 0.10, 64)[pid.astype(int) % 64]
v = 0.50 + 0.07 * rings + 0.10 * rings2 + plank_tone + 0.10 * fbm(DH, DW, 5, 300, 5)
seam = np.abs(((x + 0.5) % plank_w) - 0.5) < 1.2
v = np.where(seam, v * 0.45, v)
# room falloff: darker toward desk edges
cx, cy = DW * 0.33, DH * 0.48
d = np.sqrt(((x - cx) / (DW * 0.75)) ** 2 + ((y - cy) / (DH * 0.70)) ** 2)
v *= np.clip(1.15 - 0.55 * d, 0.35, 1.1)
v = np.clip(v, 0, 1)
walnut = np.stack([0.215 * v + 0.03, 0.135 * v + 0.02, 0.085 * v + 0.012], -1)
Image.fromarray((np.clip(walnut, 0, 1) * 255).astype(np.uint8)).save(os.path.join(GEN, "desk_base.png"))
print("desk_base", walnut.shape)

# ---------------------------------------------------------------- desk detail tile (1 unit / px, tileable)
T = 1024
n = rng.standard_normal((T, T)).astype(np.float32)
fib = tileable(n, (9.0, 0.7))  # long fibres along y
fib = fib / fib.std()
pores = (tileable(rng.standard_normal((T, T)).astype(np.float32), 1.2) > 1.6).astype(np.float32)
det = 0.5 + 0.10 * fib - 0.10 * pores
Image.fromarray((np.clip(det, 0, 1) * 255).astype(np.uint8), "L").save(os.path.join(GEN, "desk_tile.png"))

# ---------------------------------------------------------------- paper tile (tileable fibres + mottling)
n1 = tileable(rng.standard_normal((T, T)).astype(np.float32), 0.8)
n2 = tileable(rng.standard_normal((T, T)).astype(np.float32), 24)
n3 = tileable(rng.standard_normal((T, T)).astype(np.float32), (0.6, 5))
p = 0.5 + 0.035 * n1 / n1.std() + 0.05 * n2 / n2.std() + 0.02 * n3 / n3.std()
Image.fromarray((np.clip(p, 0, 1) * 255).astype(np.uint8), "L").save(os.path.join(GEN, "paper_tile.png"))

# ---------------------------------------------------------------- film grain (half res frames, several variants)
for i in range(6):
    g = rng.standard_normal((1920, 1080)).astype(np.float32)
    g = gaussian_filter(g, 0.6)
    g = g / g.std()
    Image.fromarray((np.clip(128 + 40 * g, 0, 255)).astype(np.uint8), "L").save(os.path.join(GEN, f"grain{i}.png"))
print("done")
