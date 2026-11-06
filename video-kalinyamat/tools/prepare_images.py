"""Upscale the 105 source images (1376x768) into public/img for a 1080p render with camera moves.
Usage: python3 tools/prepare_images.py <folder berisi 001.jpg ... 128.jpg>"""
import os, sys
from PIL import Image
src = sys.argv[1]
dst = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "img")
os.makedirs(dst, exist_ok=True)
for i in range(1, 106):
    im = Image.open(os.path.join(src, f"{i:03d}.jpg")).convert("RGB")
    im.resize((2112, 1179), Image.LANCZOS).save(os.path.join(dst, f"{i:03d}.jpg"), quality=90)
print("ok")
