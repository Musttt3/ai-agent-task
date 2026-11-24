# python3 shots/diffscore.py < lines "DIFFPAIR sid f new old"
import sys
from PIL import Image, ImageFilter, ImageChops
for line in sys.stdin:
    if not line.startswith("DIFFPAIR"): continue
    _, sid, f, new, old = line.split()
    a = Image.open(new).convert("L").resize((135, 240)).filter(ImageFilter.GaussianBlur(1.5))
    b = Image.open(old).convert("L").resize((135, 240)).filter(ImageFilter.GaussianBlur(1.5))
    d = sorted(ImageChops.difference(a, b).getdata(), reverse=True)
    k = max(1, len(d) // 50)
    print(f"DIFF {sid} {f} {sum(d[:k]) / k:.1f}")
