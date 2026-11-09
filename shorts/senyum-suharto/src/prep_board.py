"""Cork evidence-board textures for render_board.mjs.

python3 -I src/prep_board.py  ->  assets/gen/cork_base.png, cork_tile.png
"""
import os
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, zoom

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEN = os.path.join(ROOT, "assets", "gen")
os.makedirs(GEN, exist_ok=True)
rng = np.random.default_rng(21)


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


# ---------------------------------------------------------------- cork base (world 16000 x 27000 units at 8 units/px)
DW, DH = 2000, 3375
m = fbm(DH, DW, 5, 160, 3)
v = 1.0 + 0.10 * m + 0.05 * fbm(DH, DW, 3, 30, 4)
base = np.array([0.50, 0.33, 0.20], np.float32)  # warm cork brown (linear-ish sRGB)
img = np.clip(v[..., None] * base, 0, 1)
Image.fromarray((img * 255).astype(np.uint8)).save(os.path.join(GEN, "cork_base.png"))

# ---------------------------------------------------------------- cork detail tile (1 unit / px, tileable), grey for overlay
T = 1024
g1 = nrm(tblur(rng.standard_normal((T, T)).astype(np.float32), 1.1))
g2 = nrm(tblur(rng.standard_normal((T, T)).astype(np.float32), 3.2))
g3 = nrm(tblur(rng.standard_normal((T, T)).astype(np.float32), 9.0))
pits = (nrm(tblur(rng.standard_normal((T, T)).astype(np.float32), 1.6)) < -1.9).astype(np.float32)
pits = tblur(pits, 0.8)
flecks = (nrm(tblur(rng.standard_normal((T, T)).astype(np.float32), 1.3)) > 2.0).astype(np.float32)
flecks = tblur(flecks, 0.6)
d = 0.5 + 0.09 * g1 + 0.07 * g2 + 0.05 * g3 - 0.45 * pits + 0.22 * flecks
Image.fromarray((np.clip(d, 0, 1) * 255).astype(np.uint8), "L").save(os.path.join(GEN, "cork_tile.png"))
print("cork textures ok")
