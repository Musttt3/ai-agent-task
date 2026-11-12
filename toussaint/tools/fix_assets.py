#!/usr/bin/env python3
"""Post-fixes on downloaded assets (idempotent; a .fixed sidecar marks done files).
b71_carte_colonie: the photo carries a phone-camera stamp (date, photographer name, phone model) in white text on blank
paper, bottom-left. Remove it: mask the bright text pixels inside that area and inpaint them from the surrounding paper
(OpenCV Telea), then restore paper grain. The photographer stays credited in credits.csv."""
import os, cv2, numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def fix_b71(path, THR=18):
    if os.path.exists(path + ".fixed") or not os.path.exists(path): return
    im = cv2.imread(path); H, W = im.shape[:2]
    for (fx0, fy0, fx1, fy1) in ((0.0, 0.79, 0.33, 0.86), (0.0, 0.86, 0.37, 1.0)):   # stamp boxes that stay clear of the map lines
        x0, y0, x1, y1 = int(fx0 * W), int(fy0 * H), int(fx1 * W), int(fy1 * H)
        roi = im[y0:y1, x0:x1]; g = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY).astype(np.float32)
        bg = cv2.medianBlur(g.astype(np.uint8), 31).astype(np.float32)
        mask = ((g - bg) > THR).astype(np.uint8) * 255
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8)); mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), iterations=3)
        fixed = cv2.inpaint(roi, mask, 9, cv2.INPAINT_TELEA)
        rng = np.random.default_rng(71); noise = rng.normal(0, 4.0, fixed.shape[:2])[..., None]
        m3 = (cv2.GaussianBlur(mask, (0, 0), 3) / 255.0)[..., None]
        im[y0:y1, x0:x1] = np.clip(fixed.astype(np.float32) + noise * m3, 0, 255).astype(np.uint8)
    cv2.imwrite(path, im, [cv2.IMWRITE_JPEG_QUALITY, 93]); open(path + ".fixed", "w").write("phone stamp inpainted\n"); print("fixed", path)
for d in ("broll", "broll_interim"): fix_b71(os.path.join(ROOT, "assets", d, "b71_carte_colonie.jpg"), 15)
