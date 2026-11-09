import sys, cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
src, dst = sys.argv[1], sys.argv[2]
im = cv2.imread(src)
x0,y0,x1,y1 = 1175,1725,1475,1875
roi = im[y0:y1, x0:x1]
g = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
bg = cv2.medianBlur(g, 41)
mask = ((bg.astype(int) - g.astype(int)) > 30).astype(np.uint8)*255
mask = cv2.dilate(mask, np.ones((5,5),np.uint8))
full = np.zeros(im.shape[:2], np.uint8); full[y0:y1, x0:x1] = mask
# fill from a clean parchment patch shifted left, blended with seamlessClone
shift = 330
srcpatch = np.roll(im, shift, axis=1)  # pixel at x comes from x-shift
filled = cv2.inpaint(im, full, 3, cv2.INPAINT_TELEA)
tex = srcpatch.astype(np.float32) - cv2.GaussianBlur(srcpatch, (0,0), 6).astype(np.float32)
m = cv2.GaussianBlur(full, (0,0), 2).astype(np.float32)[...,None]/255
im = np.clip(filled + tex*m, 0, 255).astype(np.uint8)
pil = Image.fromarray(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
layer = Image.new("L", pil.size, 0); d = ImageDraw.Draw(layer)
font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf", 104)
word = "JAVA"; sp = 14
w = sum(font.getlength(c) for c in word) + sp*(len(word)-1)
x = 1322 - w/2; y = 1752
for ch in word:
    d.text((x, y), ch, font=font, fill=255); x += font.getlength(ch) + sp
layer = layer.filter(ImageFilter.GaussianBlur(1.0))
ink = Image.new("RGB", pil.size, (36, 24, 15))
pil = Image.composite(ink, pil, layer.point(lambda v: int(v*0.9)))
pil.save(dst, quality=95)
pil.crop((1000,1500,1584,2000)).save(dst.replace('.jpg','_crop.jpg'))
