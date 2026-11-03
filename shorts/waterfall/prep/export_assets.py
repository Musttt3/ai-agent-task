# Final asset export for the Remotion scene: clean panels, smoothed depth, person cutout (+ bulge map), metadata.
# Run from the work dir that holds photo.jpg, mask_final.png, p{1,2,3}_clean.png, p{1,2,3}_depth.png.
import json, sys, numpy as np, cv2
from PIL import Image
out = sys.argv[1]
im = np.array(Image.open('photo.jpg').convert('RGB'))
H, W = im.shape[:2]
panels = [(0, 496), (496, 1042), (1042, 1500)]
for i, (a, b) in enumerate(panels, 1):
    Image.open(f'p{i}_clean.png').convert('RGB').save(f'{out}/p{i}.jpg', quality=93)
    d = np.array(Image.open(f'p{i}_depth.png').convert('L')).astype(np.float32)
    d = cv2.GaussianBlur(d, (0, 0), 6)
    Image.fromarray(np.clip(d, 0, 255).astype(np.uint8)).save(f'{out}/p{i}_depth.png')
# person cutout
m = np.array(Image.open('mask_final.png').convert('L')).astype(np.float32) / 255
m = np.clip((m - 0.3) / 0.4, 0, 1); m = m * m * (3 - 2 * m)
m = cv2.erode(m, np.ones((3, 3), np.uint8))
m = cv2.GaussianBlur(m, (0, 0), 0.8)
ys, xs = np.where(m > 0.02)
x0, x1, y0, y1 = max(xs.min() - 8, 0), min(xs.max() + 9, W), max(ys.min() - 8, 0), H
# edge decontamination: colours in a ~6 px band inside the boundary come from the eroded interior (kills the
# light background fringe), and alpha is pulled in by ~2 px
inner = cv2.erode((m > 0.5).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(np.float32)
num = cv2.GaussianBlur(im.astype(np.float32) * inner[..., None], (0, 0), 3)
den = cv2.GaussianBlur(inner, (0, 0), 3)[..., None] + 1e-4
fill = num / den
band = cv2.GaussianBlur(np.clip((m > 0.02).astype(np.float32) - inner, 0, 1), (0, 0), 1.5)[..., None]
rgb = im * (1 - band * 0.85) + fill * band * 0.85
m = cv2.erode(m, np.ones((5, 5), np.uint8))
m[1405:, 600:664] = 0  # sliver of the rock left of the left sandal
m = cv2.GaussianBlur(m, (0, 0), 0.9)
# alpha bleed: transparent pixels get the colour of the nearest opaque ones, so bilinear/mip filtering at the edge
# never mixes in the old background (the light halo seen in close-ups)
known = (m > 0.6).astype(np.float32)
bleed = rgb * known[..., None]
have = known.copy()
for sg in (1.5, 3, 6, 12, 24, 48, 96):
    num = cv2.GaussianBlur(rgb * known[..., None], (0, 0), sg)
    den = cv2.GaussianBlur(known, (0, 0), sg)
    fillc = num / (den[..., None] + 1e-6)
    take = ((have < 0.5) & (den > 1e-3)).astype(np.float32)
    bleed = bleed * (1 - take[..., None]) + fillc * take[..., None]
    have = np.maximum(have, take)
rgb = np.where((m > 0.6)[..., None], rgb, bleed)
rgba = np.dstack([np.clip(rgb, 0, 255), m * 255]).astype(np.uint8)[y0:y1, x0:x1]
Image.fromarray(rgba, 'RGBA').save(f'{out}/person.png')
# bulge (pseudo-volume) from the distance transform
dt = cv2.distanceTransform((m > 0.5).astype(np.uint8), cv2.DIST_L2, 5)
bul = np.sqrt(np.clip(dt / 60.0, 0, 1)); bul = cv2.GaussianBlur(bul, (0, 0), 3)
Image.fromarray((bul * 255).astype(np.uint8)[y0:y1, x0:x1]).save(f'{out}/person_bulge.png')
Image.fromarray(im).save(f'{out}/collage.jpg', quality=93)
meta = {"size": [W, H], "panels": panels, "person": {"x0": int(x0), "y0": int(y0), "x1": int(x1), "y1": int(y1)}}
json.dump(meta, open(f'{out}/meta.json', 'w'), indent=1)
print(meta)
