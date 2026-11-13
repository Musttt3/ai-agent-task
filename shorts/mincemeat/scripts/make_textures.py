# Generate film-grain tiles, aged-paper and stamp-ink textures into public/fx/.
import numpy as np
from PIL import Image, ImageFilter

r = np.random.default_rng(7)
for i in range(8):
    n = r.normal(128, 42, (960, 540)).clip(0, 255).astype(np.uint8)
    Image.fromarray(n, 'L').save(f'public/fx/grain_{i}.png')

r = np.random.default_rng(3)


def smooth(h, w, s):
    n = r.standard_normal((h, w)).astype(np.float32)
    im = Image.fromarray(((n - n.min()) / (n.max() - n.min()) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(s))
    a = np.asarray(im).astype(np.float32) / 255
    return (a - a.mean()) / (a.std() + 1e-6)


h, w = 640, 960
base = np.array([233, 222, 196], np.float32)
lum = 1 + 0.045 * (smooth(h, w, 40) * 0.5 + smooth(h, w, 12) * 0.25) + 0.03 * smooth(h, w, 1) * 0.35
yy, xx = np.mgrid[0:h, 0:w]
edge = np.minimum(np.minimum(xx, w - 1 - xx), np.minimum(yy, h - 1 - yy))
burn = np.clip(1 - edge / 70, 0, 1) ** 2
lum = lum * (1 - 0.28 * burn)
img = np.clip(base[None, None, :] * lum[..., None] * np.array([1, 0.985, 0.95])[None, None, :] - burn[..., None] * np.array([10, 22, 40]), 0, 255)
Image.fromarray(img.astype(np.uint8)).save('public/fx/paper.png')

h, w = 400, 1000
a = np.clip(0.75 + 0.35 * smooth(h, w, 3) * 0.6 + 0.25 * smooth(h, w, 18), 0, 1)
a[smooth(h, w, 2) > 1.9] *= 0.15
rgba = np.zeros((h, w, 4), np.uint8)
rgba[..., :3] = 255
rgba[..., 3] = (a * 255).astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save('public/fx/ink.png')
print('textures written')
