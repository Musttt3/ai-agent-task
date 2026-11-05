# Painted textures for the sets (image files, so they look the same in Blender and in the three.js/Remotion render).
#   python3 sets/make_textures.py   -> assets/tex/*.png
# Our own patterns: kawung and parang batik drawn from geometry, wood grain, plaster, ceramic tile, woven pandan mat.
import os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "tex")
os.makedirs(OUT, exist_ok=True)
R = np.random.default_rng(7)

def noise(n, scale, seed):
    """smooth value noise in [0,1], tileable (bilinear upsample of a small random grid)"""
    g = np.random.default_rng(seed).random((scale, scale))
    im = Image.fromarray((g * 255).astype(np.uint8)).resize((n, n), Image.BICUBIC)
    a = np.asarray(im, np.float32) / 255
    return a

def save(name, rgb):
    Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).save(os.path.join(OUT, name + ".png"))

def tint(a, c0, c1):
    c0, c1 = np.array(c0, np.float32), np.array(c1, np.float32)
    return c0 + (c1 - c0) * a[..., None]

N = 1024
# wood (teak-ish), grain along v
y = np.linspace(0, 1, N)[:, None]; x = np.linspace(0, 1, N)[None, :]
warp = noise(N, 6, 1) * 0.08
grain = 0.5 + 0.5 * np.sin((x + warp) * 2 * math.pi * 70 + 3 * noise(N, 12, 2))
fine = noise(N, 160, 3)
w = 0.25 * grain + 0.35 * fine + 0.4 * noise(N, 8, 4)
save("kayu", tint(w, (118, 72, 40), (176, 118, 70)))
save("kayu_gelap", tint(w, (78, 46, 26), (128, 82, 48)))

# plaster wall: warm cream with soft mottling
p = 0.6 * noise(N, 10, 5) + 0.25 * noise(N, 40, 6) + 0.15 * noise(N, 200, 7)
save("dinding", tint(p, (214, 198, 168), (236, 224, 198)))

# ceramic floor tiles (4 per texture), beige with grout
t = 0.5 * noise(N, 12, 8) + 0.5 * noise(N, 90, 9)
img = tint(t, (196, 174, 140), (220, 202, 172))
k = N // 4
for i in range(5):
    img[max(0, i * k - 3):i * k + 3, :] = (150, 132, 108); img[:, max(0, i * k - 3):i * k + 3] = (150, 132, 108)
save("ubin", img)

# woven pandan mat (tikar): alternating strips
s = 32
xi, yi = np.meshgrid(np.arange(N), np.arange(N))
weave = (((xi // s) + (yi // s)) % 2).astype(np.float32)
stripe = 0.5 + 0.5 * np.sin(np.where(weave > 0, xi, yi) / s * math.pi * 2 * 3)
m = 0.55 * weave + 0.25 * stripe + 0.2 * noise(N, 80, 10)
save("tikar", tint(m, (170, 136, 84), (214, 182, 120)))

# white fabric (mattress, pillow) with soft weave
f = 0.7 + 0.3 * noise(N, 120, 11)
save("kain_putih", tint(f, (214, 210, 200), (246, 243, 236)))

def batik(name, bg, ink, accent, kind):
    im = Image.new("RGB", (N, N), bg); d = ImageDraw.Draw(im)
    if kind == "kawung":  # four oval petals meeting diagonally around a dot, the classic kawung grid
        c = 160
        def petal(cx, cy, ang):
            pts = [(cx + math.cos(t) * c * 0.30 * math.cos(ang) - math.sin(t) * c * 0.16 * math.sin(ang),
                    cy + math.cos(t) * c * 0.30 * math.sin(ang) + math.sin(t) * c * 0.16 * math.cos(ang)) for t in np.linspace(0, 2 * math.pi, 40)]
            d.polygon(pts, fill=ink, outline=accent, width=4)
            ip = [(cx + (x - cx) * 0.38, cy + (y - cy) * 0.38) for x, y in pts]
            d.polygon(ip, fill=accent)
        for gy in range(-1, N // c + 2):
            for gx in range(-1, N // c + 2):
                cx, cy = gx * c + c / 2, gy * c + c / 2
                for k in range(4):
                    ang = math.pi / 4 + k * math.pi / 2
                    petal(cx + math.cos(ang) * c * 0.26, cy + math.sin(ang) * c * 0.26, ang)
                d.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], fill=accent)
    else:  # parang: diagonal S-bands
        for k in range(-N, 2 * N, 96):
            pts = [(k + i, i) for i in range(0, N + 1, 8)]
            for off, col, wdt in ((0, ink, 26), (34, accent, 8), (-30, accent, 6)):
                d.line([(x + off, y) for x, y in pts], fill=col, width=wdt)
            for i in range(0, N, 64):
                d.ellipse([k + i - 12, i - 12, k + i + 12, i + 12], fill=accent)
    a = np.asarray(im.filter(ImageFilter.GaussianBlur(0.8)), np.float32)
    a *= (0.88 + 0.12 * noise(N, 60, hash(name) % 100))[..., None]  # dyed-cloth unevenness
    save(name, a)
batik("batik_kawung", (232, 222, 196), (52, 66, 112), (150, 92, 48), "kawung")   # sprei: indigo on cream
batik("batik_parang", (196, 150, 96), (86, 52, 30), (236, 214, 170), "parang")    # selimut: sogan brown
print("textures ->", sorted(os.listdir(OUT)))

# a small painting of rice terraces for the bedroom wall (our own, simple flat shapes)
im = Image.new("RGB", (768, 512), (150, 196, 228)); d = ImageDraw.Draw(im)
d.ellipse([520, 60, 600, 140], fill=(250, 226, 150))
d.polygon([(0, 260), (180, 150), (360, 250), (520, 170), (768, 260), (768, 512), (0, 512)], fill=(96, 140, 110))
for i, yy in enumerate(range(270, 512, 40)):
    col = (118 + 12 * (i % 2), 168 + 10 * (i % 3), 70 + 8 * (i % 2))
    d.polygon([(0, yy), (240, yy - 18), (520, yy + 6), (768, yy - 12), (768, yy + 34), (0, yy + 40)], fill=col)
    d.line([(0, yy), (240, yy - 18), (520, yy + 6), (768, yy - 12)], fill=(70, 110, 60), width=3)
d.polygon([(600, 300), (640, 250), (680, 300)], fill=(150, 80, 50)); d.rectangle([610, 300, 670, 340], fill=(190, 140, 90))
im.filter(ImageFilter.GaussianBlur(1.2)).save(os.path.join(OUT, "lukisan_sawah.png"))
