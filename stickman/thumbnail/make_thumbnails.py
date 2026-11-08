"""Build YouTube thumbnails (1280x720) from the video's own images.

Layout follows the "survival stickman" thumbnail convention: big two-tone
headline top-left, red tag pill, a red sub-banner, punchy colours and a
dark vignette so the text pops.
"""
import os
import sys
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = sys.argv[1]  # folder with 001.jpg ... 197.jpg
OUT = os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)
FONT = os.path.join(HERE, "fonts", "lilita.ttf")
W, H = 1280, 720
WHITE, YELLOW, RED = (255, 255, 255), (255, 205, 40), (214, 32, 32)


def base(name, crop_center_x=0.5, zoom=1.0, darken=0.0):
    im = Image.open(os.path.join(IMG, name)).convert("RGB")
    sw, sh = im.size
    cw, ch = sw / zoom, sh / zoom
    if cw / ch > W / H:
        cw = ch * W / H
    else:
        ch = cw * H / W
    cx = min(max(crop_center_x * sw, cw / 2), sw - cw / 2)
    cy = sh / 2
    im = im.crop((int(cx - cw / 2), int(cy - ch / 2), int(cx + cw / 2), int(cy + ch / 2))).resize((W, H), Image.LANCZOS)
    im = ImageEnhance.Color(im).enhance(1.35)
    im = ImageEnhance.Contrast(im).enhance(1.18)
    im = im.filter(ImageFilter.UnsharpMask(radius=2, percent=80, threshold=2))
    if darken:
        im = ImageEnhance.Brightness(im).enhance(1 - darken)
    return im


def vignette(im, left_shade=0.65):
    """Radial vignette + dark gradient on the left where the headline sits."""
    rad = Image.radial_gradient("L").resize((W, H))
    rad = rad.point(lambda v: int(min(255, max(0, (v - 110) * 1.6))))
    black = Image.new("RGB", (W, H), (0, 0, 0))
    im = Image.composite(black, im, rad)
    grad = Image.linear_gradient("L").rotate(90, expand=True).resize((W, H))  # white on left
    grad = grad.point(lambda v: int(v * left_shade) if v > 90 else 0)
    return Image.composite(black, im, grad)


def outlined(d, xy, text, font, fill, stroke=12, shadow=8):
    x, y = xy
    d.text((x + shadow, y + shadow), text, font=font, fill=(0, 0, 0), stroke_width=stroke, stroke_fill=(0, 0, 0))
    d.text((x, y), text, font=font, fill=fill, stroke_width=stroke, stroke_fill=(0, 0, 0))


def pill(d, xy, text, size=40):
    f = ImageFont.truetype(FONT, size)
    x, y = xy
    l, t, r, b = d.textbbox((0, 0), text, font=f)
    pw, ph = r - l + 36, b - t + 18
    d.rounded_rectangle((x, y, x + pw, y + ph), radius=12, fill=RED, outline=(0, 0, 0), width=5)
    d.text((x + 18 - l, y + 9 - t), text, font=f, fill=WHITE)
    return pw


def banner(d, xy, text, size=40):
    f = ImageFont.truetype(FONT, size)
    x, y = xy
    l, t, r, b = d.textbbox((0, 0), text, font=f)
    d.rectangle((x, y, x + r - l + 30, y + b - t + 16), fill=RED, outline=(0, 0, 0), width=4)
    d.text((x + 15 - l, y + 8 - t), text, font=f, fill=WHITE)


def headline(im, line1, line2, tag=None, sub=None, size1=150, size2=150, x=40, y=26):
    d = ImageDraw.Draw(im)
    f1 = ImageFont.truetype(FONT, size1)
    f2 = ImageFont.truetype(FONT, size2)
    outlined(d, (x, y), line1, f1, WHITE)
    l, t, r, b = d.textbbox((x, y), line1, font=f1)
    if tag:
        pill(d, (r + 22, y + 18), tag)
    y2 = b + 8
    if line2:
        outlined(d, (x, y2), line2, f2, YELLOW)
        y2 = d.textbbox((x, y2), line2, font=f2)[3] + 12
    if sub:
        banner(d, (x + 4, y2 + 4), sub)
    return im


def save(im, name):
    p = os.path.join(OUT, name)
    im.save(p, "JPEG", quality=92)
    print(p)


def title_block(im, x=40, y=30):
    """Video title: WABAH HILANG / INGATAN [HARI KE-6] / DI KLINIK PULAU."""
    d = ImageDraw.Draw(im)
    f1 = ImageFont.truetype(FONT, 112)
    f2 = ImageFont.truetype(FONT, 160)
    outlined(d, (x, y), "WABAH HILANG", f1, WHITE, stroke=11, shadow=7)
    y2 = d.textbbox((x, y), "WABAH HILANG", font=f1)[3] + 6
    outlined(d, (x, y2), "INGATAN", f2, YELLOW, stroke=13, shadow=8)
    l, t, r, b = d.textbbox((x, y2), "INGATAN", font=f2)
    pill(d, (r + 22, t + (b - t) // 2 - 32), "HARI KE-6", size=44)
    banner(d, (x + 4, b + 16), "DI KLINIK PULAU", size=50)
    return im


TITLE_SHOTS = [
    # (image, horizontal crop centre, zoom) — subject kept on the right, text on the left
    ("197.jpg", 0.62, 1.12),  # someone with your hair behind the door
    ("045.jpg", 0.5, 1.0),   # best friend raising scissors: "Kamu siapa?"
    ("144.jpg", 0.72, 1.2),   # you at the red door at 2 a.m.
]
for i, (name, cx, z) in enumerate(TITLE_SHOTS, 1):
    im = vignette(base(name, crop_center_x=cx, zoom=z), 0.75)
    save(title_block(im), f"thumbnail_{i}.jpg")
