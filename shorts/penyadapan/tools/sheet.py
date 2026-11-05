# sheet.py OUT.jpg COLS img1 img2 ... -> labelled contact sheet (thumb width 300)
import sys, os
from PIL import Image, ImageDraw
out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
tw = 300
ims = [Image.open(f).convert("RGB") for f in files]
th = round(ims[0].height * tw / ims[0].width)
rows = (len(ims) + cols - 1) // cols
S = Image.new("RGB", (cols * tw, rows * th), "black")
d = ImageDraw.Draw(S)
for i, (f, im) in enumerate(zip(files, ims)):
    x, y = (i % cols) * tw, (i // cols) * th
    S.paste(im.resize((tw, th)), (x, y))
    d.rectangle([x, y, x + 70, y + 20], fill="black"); d.text((x + 4, y + 4), os.path.basename(f)[-8:-4], fill="yellow")
S.save(out, quality=85)
