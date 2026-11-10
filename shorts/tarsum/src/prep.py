"""Graded prints and procedural textures for the Tarsum case board.

python3 -I src/prep.py   ->  assets/gen/*
"""
import os
import numpy as np
from PIL import Image, ImageFilter, ImageOps
from scipy.ndimage import gaussian_filter, zoom

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "assets", "raw")
GEN = os.path.join(ROOT, "assets", "gen")
os.makedirs(GEN, exist_ok=True)
rng = np.random.default_rng(5)


def grade(im, sat=0.62):
    """One look for every print: muted colour, lifted blacks, faintly warm, like a case-file photo."""
    a = np.asarray(im.convert("RGB")).astype(np.float32) / 255.0
    lum = (a @ np.array([0.30, 0.59, 0.11], np.float32))[..., None]
    a = lum + (a - lum) * sat
    a = a * np.array([1.03, 1.0, 0.93], np.float32)
    a = 0.05 + a * 0.90
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


def up(im, w):
    h = round(im.height * w / im.width)
    return im.resize((w, h), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2, percent=35, threshold=2))


def save(im, name):
    im.save(os.path.join(GEN, name), quality=94)
    print(name, im.size)


def load(n):
    return ImageOps.exif_transpose(Image.open(os.path.join(RAW, n)))


for src, dst in [("ai_tarsum_baskom.png", "baskom.jpg"), ("ai_ketua_rt.png", "rt.jpg"), ("ai_warga_ketakutan.png", "warga.jpg"),
                 ("ai_diamankan.png", "diamankan.jpg"), ("ai_rsj.png", "rsj.jpg"), ("ai_rumah_duka.png", "rumahduka.jpg")]:
    save(up(grade(load(src)), 1450), dst)
still = load("real_tarsum_still.jpg")
save(up(grade(still.crop((0, 0, still.width, int(still.height * 0.86))), 0.7), 1450), "tarsum.jpg")
save(up(grade(load("real_kandang.jpg")), 1800), "kandang.jpg")


def fbm(h, w, octaves, base, seed):
    r = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32); amp = 1.0; tot = 0.0
    for o in range(octaves):
        s = base * 2 ** o
        gh, gw = max(2, int(h / s) + 2), max(2, int(w / s) + 2)
        z = zoom(r.standard_normal((gh, gw)).astype(np.float32), (h / (gh - 1), w / (gw - 1)), order=3)[:h, :w]
        if z.shape != (h, w):
            z = np.pad(z, ((0, h - z.shape[0]), (0, w - z.shape[1])), mode="edge")
        out += z * amp; tot += amp; amp *= 0.5
    return out / tot


def tblur(a, s):
    return gaussian_filter(a, s, mode="wrap")


def nrm(a):
    return (a - a.mean()) / (a.std() + 1e-9)


# cork board: world 12000 x 30000 units at 8 units/px; darker and cooler than a bright office board
DW, DH = 1500, 3750
v = 1.0 + 0.11 * fbm(DH, DW, 5, 160, 3) + 0.05 * fbm(DH, DW, 3, 30, 4)
img = np.clip(v[..., None] * np.array([0.40, 0.27, 0.17], np.float32), 0, 1)
Image.fromarray((img * 255).astype(np.uint8)).save(os.path.join(GEN, "cork_base.png"))
T = 1024
g1 = nrm(tblur(rng.standard_normal((T, T)).astype(np.float32), 1.1))
g2 = nrm(tblur(rng.standard_normal((T, T)).astype(np.float32), 3.2))
g3 = nrm(tblur(rng.standard_normal((T, T)).astype(np.float32), 9.0))
pits = tblur((nrm(tblur(rng.standard_normal((T, T)).astype(np.float32), 1.6)) < -1.9).astype(np.float32), 0.8)
flecks = tblur((nrm(tblur(rng.standard_normal((T, T)).astype(np.float32), 1.3)) > 2.0).astype(np.float32), 0.6)
d = 0.5 + 0.09 * g1 + 0.07 * g2 + 0.05 * g3 - 0.45 * pits + 0.22 * flecks
Image.fromarray((np.clip(d, 0, 1) * 255).astype(np.uint8), "L").save(os.path.join(GEN, "cork_tile.png"))

# paper fibres (tileable)
n1 = tblur(rng.standard_normal((T, T)).astype(np.float32), 0.8)
n2 = tblur(rng.standard_normal((T, T)).astype(np.float32), 24)
n3 = tblur(rng.standard_normal((T, T)).astype(np.float32), (0.6, 5))
p = 0.5 + 0.035 * n1 / n1.std() + 0.05 * n2 / n2.std() + 0.02 * n3 / n3.std()
Image.fromarray((np.clip(p, 0, 1) * 255).astype(np.uint8), "L").save(os.path.join(GEN, "paper_tile.png"))

# film grain
for i in range(6):
    g = gaussian_filter(rng.standard_normal((1920, 1080)).astype(np.float32), 0.6)
    Image.fromarray(np.clip(128 + 40 * g / g.std(), 0, 255).astype(np.uint8), "L").save(os.path.join(GEN, f"grain{i}.png"))
print("textures ok")
