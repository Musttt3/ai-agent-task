"""Thumbnail YouTube 1280x720 dari gambar video stickman.

Kiri: 011 (stickman modern kaget), kanan: 010 (manusia purba bawa ikan),
tengah: kail kerang bercahaya (013) dalam lingkaran merah, teks besar di bawah.

Pakai: python3 thumbnail.py <folder_bahan> <font.ttf> <output.jpg> "TEKS JUDUL"
"""
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

src, font_path, out, title = sys.argv[1:5]
Wd, Ht = 1280, 720

def load(n, h, cx, w):
    im = Image.open(f"{src}/{n:03d}.jpg").convert("RGB")
    im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
    x0 = max(0, min(im.width - w, round(cx * im.width - w / 2)))
    return im.crop((x0, 0, x0 + w, h))

left = load(11, Ht, 0.50, 760)
right = load(10, Ht, 0.60, 760)
canvas = Image.new("RGB", (Wd, Ht))
canvas.paste(right, (Wd - 760, 0))
# seam diagonal: kiri menempel di atas kanan
top_x, bot_x = 700, 590
mask = Image.new("L", (Wd, Ht), 0)
ImageDraw.Draw(mask).polygon([(0, 0), (top_x, 0), (bot_x, Ht), (0, Ht)], fill=255)
lfull = Image.new("RGB", (Wd, Ht)); lfull.paste(left, (0, 0))
canvas = Image.composite(lfull, canvas, mask)
d = ImageDraw.Draw(canvas)
d.line([(top_x, -5), (bot_x, Ht + 5)], fill="black", width=22)
d.line([(top_x, -5), (bot_x, Ht + 5)], fill="white", width=12)
canvas = ImageEnhance.Color(canvas).enhance(1.15)
canvas = ImageEnhance.Contrast(canvas).enhance(1.05)

# gradasi gelap di bawah untuk teks
grad = Image.new("L", (1, Ht))
for y in range(Ht):
    grad.putpixel((0, y), int(max(0, (y - Ht * 0.58) / (Ht * 0.42)) ** 1.3 * 200))
canvas = Image.composite(Image.new("RGB", (Wd, Ht), "black"), canvas, grad.resize((Wd, Ht)))

# inset kail kerang bercahaya
D = 230
hook = Image.open(f"{src}/013.jpg").convert("RGB")
s = 700 / hook.height
hook = hook.resize((round(hook.width * s), 700), Image.LANCZOS)
hx, hy = round(hook.width * 0.50), round(700 * 0.49)
hook = hook.crop((hx - 175, hy - 175, hx + 175, hy + 175)).resize((D, D), Image.LANCZOS)
hook = ImageEnhance.Brightness(hook).enhance(1.08)
cm = Image.new("L", (D, D), 0); ImageDraw.Draw(cm).ellipse((0, 0, D - 1, D - 1), fill=255)
cx, cy = 640, 320
glow = Image.new("L", (Wd, Ht), 0)
ImageDraw.Draw(glow).ellipse((cx - D // 2 - 22, cy - D // 2 - 22, cx + D // 2 + 22, cy + D // 2 + 22), fill=200)
glow = glow.filter(ImageFilter.GaussianBlur(18))
canvas = Image.composite(Image.new("RGB", (Wd, Ht), (255, 220, 90)), canvas, glow)
d = ImageDraw.Draw(canvas)
d.ellipse((cx - D // 2 - 12, cy - D // 2 - 12, cx + D // 2 + 12, cy + D // 2 + 12), fill="black")
canvas.paste(hook, (cx - D // 2, cy - D // 2), cm)
d.ellipse((cx - D // 2 - 6, cy - D // 2 - 6, cx + D // 2 + 6, cy + D // 2 + 6), outline=(230, 30, 30), width=10)

# teks judul
size = 150
font = ImageFont.truetype(font_path, size)
while d.textlength(title, font=font) > Wd - 80:
    size -= 4; font = ImageFont.truetype(font_path, size)
tw = d.textlength(title, font=font)
bbox = d.textbbox((0, 0), title, font=font)
ty = Ht - (bbox[3] - bbox[1]) - bbox[1] - 34
tx = (Wd - tw) / 2
shadow = Image.new("L", (Wd, Ht), 0)
ImageDraw.Draw(shadow).text((tx + 8, ty + 10), title, font=font, fill=230, stroke_width=14, stroke_fill=230)
canvas = Image.composite(Image.new("RGB", (Wd, Ht), "black"), canvas, shadow.filter(ImageFilter.GaussianBlur(6)))
d = ImageDraw.Draw(canvas)
d.text((tx, ty), title, font=font, fill=(255, 214, 0), stroke_width=12, stroke_fill="black")
canvas.save(out, quality=93, optimize=True)
print(out, canvas.size)
