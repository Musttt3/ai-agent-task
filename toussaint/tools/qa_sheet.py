#!/usr/bin/env python3
"""Mid-beat contact sheet (+ 360px phone-readability version) from rendered stills.
usage: python3 tools/qa_sheet.py out/qa/mid out/qa_mid_frames.txt out/qa_mid_ids.txt out/qa/beats_contact"""
import sys, os, glob
from PIL import Image, ImageDraw
d, frames, ids, out = sys.argv[1:5]
fr = open(frames).read().split(","); ids = open(ids).read().split(",")
tiles = []
for f, i in zip(fr, ids):
    p = os.path.join(d, f"f{int(f):05d}.jpg")
    if os.path.exists(p): tiles.append((i, int(f), Image.open(p)))
def sheet(tw, cols, name):
    th = tw * 9 // 16; rows = (len(tiles) + cols - 1) // cols; S = Image.new("RGB", (cols * tw, rows * (th + 18)), (20, 20, 20)); D = ImageDraw.Draw(S)
    for k, (i, f, im) in enumerate(tiles):
        x, y = (k % cols) * tw, (k // cols) * (th + 18); S.paste(im.resize((tw, th), Image.LANCZOS), (x, y + 18)); D.text((x + 4, y + 3), f"{i}  {f // 30 // 60}:{f // 30 % 60:02d}", fill=(255, 210, 90))
    S.save(f"{out}_{name}.jpg", quality=86); print(f"{out}_{name}.jpg", S.size)
sheet(480, 6, "480")
sheet(360, 6, "360px_readability")
