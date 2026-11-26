# YouTube thumbnails (1280x720, JPG < 2 MB) built from the episode's own images.
import os, sys, math
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1920, 1080
F = lambda n: os.path.join(R, 'assets', 'fonts', n)
def img(code):
    d = os.path.join(R, 'assets', 'img')
    return Image.open(os.path.join(d, [f for f in os.listdir(d) if f.startswith(code + '_')][0])).convert('RGB')

def cover(im, zoom=1.0, cx=0.5, cy=0.5, size=(W, H)):
    w, h = size
    s = max(w / im.width, h / im.height) * zoom
    im2 = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    x = int(min(max(cx * im2.width - w / 2, 0), im2.width - w)); y = int(min(max(cy * im2.height - h / 2, 0), im2.height - h))
    return im2.crop((x, y, x + w, y + h))

def grade(im, contrast=1.18, sat=1.12, bright=1.0):
    im = ImageEnhance.Contrast(im).enhance(contrast)
    im = ImageEnhance.Color(im).enhance(sat)
    im = ImageEnhance.Brightness(im).enhance(bright)
    return im.filter(ImageFilter.UnsharpMask(2, 80, 2))

def vignette(im, strength=0.55, cx=0.5, cy=0.5):
    a = np.asarray(im).astype(np.float32)
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]].astype(np.float32)
    r = np.hypot((xx / a.shape[1] - cx) / 0.75, (yy / a.shape[0] - cy) / 0.75)
    a *= (1 - strength * np.clip(r - 0.35, 0, 1) ** 1.3)[..., None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def grad_dark(im, side='bottom', amount=0.8, start=0.45):
    a = np.asarray(im).astype(np.float32)
    if side == 'bottom':
        t = np.linspace(0, 1, a.shape[0])[:, None]
    elif side == 'left':
        t = np.linspace(1, 0, a.shape[1])[None, :]
    else:
        t = np.linspace(0, 1, a.shape[1])[None, :]
    m = np.clip((t - start) / (1 - start), 0, 1) ** 1.2 * amount
    a *= (1 - m)[..., None] if m.ndim == 2 else (1 - m)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def text(draw_img, xy, s, font, size, fill, stroke=10, stroke_fill=(0, 0, 0), anchor='la', shadow=True, gradient=None, tracking=0):
    f = ImageFont.truetype(F(font), size)
    if font.startswith('Oswald'):
        try: f.set_variation_by_axes([700])
        except Exception: pass
    layer = Image.new('RGBA', draw_img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    if shadow:
        sh = Image.new('RGBA', draw_img.size, (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
        ds.text((xy[0] + 10, xy[1] + 14), s, font=f, fill=(0, 0, 0, 200), stroke_width=stroke, stroke_fill=(0, 0, 0, 200), anchor=anchor)
        sh = sh.filter(ImageFilter.GaussianBlur(14))
        draw_img.alpha_composite(sh)
    d.text(xy, s, font=f, fill=(255, 255, 255, 255), stroke_width=stroke, stroke_fill=stroke_fill + (255,), anchor=anchor)
    if gradient:
        # recolour the fill (not the stroke) with a vertical gradient
        mask_fill = Image.new('L', draw_img.size, 0); ImageDraw.Draw(mask_fill).text(xy, s, font=f, fill=255, anchor=anchor)
        bbox = mask_fill.getbbox()
        g = Image.new('RGBA', draw_img.size, (0, 0, 0, 0))
        if bbox:
            gh = bbox[3] - bbox[1]
            col = np.zeros((gh, 1, 4), np.uint8)
            for i in range(gh):
                t = i / max(1, gh - 1)
                c = [int(gradient[0][k] + (gradient[1][k] - gradient[0][k]) * t) for k in range(3)]
                col[i, 0] = c + [255]
            strip = Image.fromarray(np.repeat(col, bbox[2] - bbox[0], 1), 'RGBA')
            g.paste(strip, (bbox[0], bbox[1]))
        layer.paste(g, (0, 0), mask_fill)
    else:
        mask_fill = Image.new('L', draw_img.size, 0); ImageDraw.Draw(mask_fill).text(xy, s, font=f, fill=255, anchor=anchor)
        layer.paste(Image.new('RGBA', draw_img.size, fill + (255,)), (0, 0), mask_fill)
    draw_img.alpha_composite(layer)
    return f.getbbox(s, stroke_width=stroke, anchor=anchor)

def eye_glow(im, pts, r=40, color=(235, 245, 255), k=1.0):
    g = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(g)
    for (x, y) in pts:
        d.ellipse((x - r, y - r, x + r, y + r), fill=color + (int(150 * k),))
    g = g.filter(ImageFilter.GaussianBlur(r * 0.7))
    im.alpha_composite(g)

def stamp(im, s, xy, size=64, angle=-6, color=(205, 40, 30)):
    f = ImageFont.truetype(F('SpecialElite.ttf'), size)
    bb = f.getbbox(s); tw, th = bb[2] - bb[0], bb[3] - bb[1]
    pad = int(size * 0.35)
    st = Image.new('RGBA', (tw + 2 * pad, th + 2 * pad + 10), (0, 0, 0, 0)); d = ImageDraw.Draw(st)
    d.rectangle((3, 3, st.width - 4, st.height - 4), outline=color + (255,), width=max(5, size // 12))
    d.text((pad - bb[0], pad - bb[1] + 4), s, font=f, fill=color + (255,))
    rng = np.random.default_rng(3)
    a = np.asarray(st).copy(); n = rng.random(a.shape[:2])
    a[..., 3] = (a[..., 3] * np.clip((n - 0.15) * 2.5, 0.45, 1)).astype(np.uint8)
    st = Image.fromarray(a).rotate(angle, expand=True, resample=Image.BICUBIC)
    im.alpha_composite(st, (int(xy[0]), int(xy[1])))

def finish(im, name):
    out = im.convert('RGB')
    # light film grain for consistency with the video
    a = np.asarray(out).astype(np.float32)
    a += np.random.default_rng(5).normal(0, 4, a.shape[:2])[..., None]
    out = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((1280, 720), Image.LANCZOS)
    p = os.path.join(R, 'out', 'thumbnail', name)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    out.save(p, quality=92, optimize=True)
    return p

GOLD = ((255, 232, 140), (240, 150, 30))
WHITE = ((255, 255, 255), (225, 225, 225))

# ---------- V1: hook image (Anwar + jinn princess), big text bottom
def v1():
    bg = grade(cover(img('G38'), 1.12, 0.5, 0.36), 1.2, 1.15)
    bg = vignette(bg, 0.6, 0.5, 0.4)
    bg = grad_dark(bg, 'bottom', 0.92, 0.42).convert('RGBA')
    eye_glow(bg, [(1255, 452), (1385, 452)], 26, k=0.9)
    text(bg, (W / 2, 830), 'LELUHUR JAWA', 'BebasNeue.ttf', 150, (255, 255, 255), 9, anchor='mm', gradient=WHITE)
    text(bg, (W / 2, 975), 'NIKAH SAMA JIN?', 'BebasNeue.ttf', 205, (255, 210, 80), 11, anchor='mm', gradient=GOLD)
    stamp(bg, 'SERAT PARAMAYOGA', (70, 60), 58, -5)
    return finish(bg, 'thumbnail_v1.jpg')

# ---------- V2: jinn princess close-up right, text block left
def v2():
    canvas = Image.new('RGB', (W, H), (14, 10, 7))
    face = grade(cover(img('G18'), 1.35, 0.5, 0.36, size=(1250, H)), 1.25, 1.1)
    canvas.paste(face, (W - 1250, 0))
    a = np.asarray(canvas).astype(np.float32)
    x = np.linspace(0, 1, W)[None, :]
    m = np.clip((0.60 - x) / 0.24, 0, 1) ** 1.4   # fully dark at the paste seam (x=0.35)
    base = np.array([14, 10, 7], np.float32)
    a = a * (1 - m)[..., None] + base * m[..., None]
    # warm haze on the dark side so it isn't flat black
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    haze = np.exp(-(((xx - 380) / 520) ** 2 + ((yy - 560) / 420) ** 2))[..., None] * np.array([46, 30, 14], np.float32)
    a += haze
    canvas = vignette(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)), 0.45, 0.62, 0.45).convert('RGBA')
    eye_glow(canvas, [(1218, 395), (1408, 395)], 34, k=1.0)
    stamp(canvas, 'SERAT PARAMAYOGA', (80, 55), 56, -4)
    text(canvas, (88, 380), 'LELUHUR JAWA', 'BebasNeue.ttf', 158, (255, 255, 255), 10, anchor='ls', gradient=WHITE)
    text(canvas, (82, 650), 'NIKAHI', 'BebasNeue.ttf', 280, (255, 210, 80), 13, anchor='ls', gradient=GOLD)
    text(canvas, (82, 950), 'JIN?', 'BebasNeue.ttf', 330, (255, 210, 80), 13, anchor='ls', gradient=GOLD)
    return finish(canvas, 'thumbnail_v2.jpg')

# ---------- V3: Anwar vs jinn princess split with manuscript stamp
def v3():
    bg = grade(cover(img('G38'), 1.0, 0.5, 0.42), 1.22, 1.12)
    bg = vignette(bg, 0.55, 0.5, 0.45)
    bg = grad_dark(bg, 'bottom', 0.75, 0.6).convert('RGBA')
    eye_glow(bg, [(1188, 372), (1302, 372)], 24, k=0.9)
    text(bg, (W / 2, 140), 'KETURUNAN JIN?', 'BebasNeue.ttf', 200, (255, 210, 80), 11, anchor='mm', gradient=GOLD)
    stamp(bg, '4 FAKTA GILA', (1340, 860), 70, -7)
    return finish(bg, 'thumbnail_v3.jpg')

if __name__ == '__main__':
    for fn in (v1, v2, v3):
        p = fn(); print(p, os.path.getsize(p) // 1024, 'KB')
