#!/usr/bin/env python3
"""Asset contact sheet with credits: out/qa/assets_contact_N.jpg (one tile per asset; videos show a mid frame)."""
import csv, os, glob, subprocess, textwrap
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rows = list(csv.DictReader(open(os.path.join(ROOT, "credits.csv"))))
font = ImageFont.truetype(glob.glob(os.path.join(ROOT, "node_modules/@fontsource/oswald/files/*latin-500-normal.woff"))[0], 17) if glob.glob(os.path.join(ROOT, "node_modules/@fontsource/oswald/files/*latin-500-normal.woff")) else ImageFont.load_default()
TW, TH, COLS, PER = 420, 420, 5, 20
os.makedirs(os.path.join(ROOT, "out/qa"), exist_ok=True)
def thumb(r):
    f = os.path.join(ROOT, r["file"])
    if f.endswith(".mp4"):
        tmp = "/tmp/_cs.jpg"; subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "2", "-i", f, "-frames:v", "1", tmp], check=True); f = tmp
    im = Image.open(f).convert("RGB"); im.thumbnail((TW - 16, TH - 120)); return im
for page in range(0, len(rows), PER):
    chunk = rows[page:page + PER]; rws = (len(chunk) + COLS - 1) // COLS
    sheet = Image.new("RGB", (COLS * TW, rws * TH), (24, 23, 22)); d = ImageDraw.Draw(sheet)
    for k, r in enumerate(chunk):
        x, y = (k % COLS) * TW, (k // COLS) * TH
        try: im = thumb(r); sheet.paste(im, (x + (TW - im.width) // 2, y + 8))
        except Exception as e: d.text((x + 10, y + 40), f"ERR {e}", fill=(255, 80, 80), font=font)
        lic = r["license"] + ("  · ILUSTRASI" if "ILUSTRASI" in r.get("note", "") else "")
        lines = [r["id"], lic, "by " + (r["author"] or "?")[:60], r["source"].replace("https://", "")[:58]]
        for j, ln in enumerate(lines): d.text((x + 10, y + TH - 108 + j * 25), ln, fill=(240, 200, 90) if j == 0 else (225, 225, 225) if j != 1 else (180, 230, 180), font=font)
    out = os.path.join(ROOT, f"out/qa/assets_contact_{page // PER + 1}.jpg"); sheet.save(out, quality=86); print(out)
