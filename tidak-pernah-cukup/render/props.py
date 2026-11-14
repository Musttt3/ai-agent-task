"""Properti visual yang dipakai ulang: map berkas, ikon potongan kertas, papan investigasi."""
from __future__ import annotations

from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from engine import (BEBAS, INK, MANILA, OSWALD, RED, SERIF, TYPE, archival_grade, cork_texture, cutout, font,
                    paper_texture, photo_print, pil_to_f, pushpin, shadowed, stamp, to_f, wood_texture)


def _tex_img(w, h, tone, seed, dark=0.25):
    return Image.fromarray((paper_texture(w, h, seed=seed, tone=tone, dark_edges=dark) * 255).astype(np.uint8)).convert("RGBA")


@lru_cache(None)
def manila_folder(w: int = 1500, h: int = 1050, label: str = "BERKAS KASUS  No. 001") -> Image.Image:
    """Map manila dengan tab dan label ketik."""
    tab_h = 70
    body = _tex_img(w, h, MANILA, 21, 0.32)
    tab = _tex_img(int(w * 0.34), tab_h + 20, MANILA, 22, 0.3)
    out = Image.new("RGBA", (w, h + tab_h), (0, 0, 0, 0))
    m = Image.new("L", out.size, 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle((0, tab_h, w, h + tab_h), radius=18, fill=255)
    d.rounded_rectangle((int(w * 0.06), 0, int(w * 0.06) + tab.width, tab_h + 30), radius=16, fill=255)
    full = Image.new("RGBA", out.size, (0, 0, 0, 0))
    full.paste(tab, (int(w * 0.06), 0))
    full.paste(body, (0, tab_h))
    full.putalpha(m)
    d2 = ImageDraw.Draw(full)
    # garis lipat & tepi
    d2.line((0, tab_h + 4, w, tab_h + 4), fill=(150, 118, 70, 120), width=3)
    d2.rounded_rectangle((2, tab_h + 2, w - 2, h + tab_h - 2), radius=18, outline=(140, 108, 62, 140), width=4)
    # label di tab
    d2.text((int(w * 0.06) + 34, 22), "No. 001", font=font(TYPE, 40), fill=INK)
    # stiker label di badan map
    st = _tex_img(int(w * 0.62), 120, (240, 233, 214), 23, 0.1)
    ds = ImageDraw.Draw(st)
    ds.text((30, 30), label, font=font(TYPE, 52), fill=INK)
    full.alpha_composite(st, (int(w * 0.06), tab_h + 70))
    return full


def _paper_cut(shape_fn, w, h, fill_tone, seed, border=16):
    """Ilustrasi gaya potongan kertas: bentuk diwarnai tekstur kertas + tepi putih."""
    m = Image.new("L", (w, h), 0)
    shape_fn(ImageDraw.Draw(m), w, h)
    edge = m.filter(ImageFilter.MaxFilter(border * 2 + 1))
    tex = _tex_img(w, h, fill_tone, seed, 0.1)
    white = _tex_img(w, h, (242, 236, 222), seed + 1, 0.0)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    white.putalpha(edge)
    out.alpha_composite(white)
    tex.putalpha(m)
    out.alpha_composite(tex)
    return out


@lru_cache(None)
def icon_envelope() -> Image.Image:
    w, h = 620, 440

    def shape(d, w, h):
        d.rounded_rectangle((30, 60, w - 30, h - 30), radius=14, fill=255)
    im = _paper_cut(shape, w, h, (196, 170, 120), 41)
    d = ImageDraw.Draw(im)
    d.line((30, 60, w // 2, 230, w - 30, 60), fill=(150, 120, 74), width=6)
    # uang mengintip
    note = _paper_cut(lambda d, w, h: d.rectangle((20, 20, w - 20, h - 20), fill=255), 380, 150, (176, 150, 110), 43, 8)
    dn = ImageDraw.Draw(note)
    dn.text((48, 44), "Rp", font=font(BEBAS, 64), fill=(90, 70, 40))
    out = Image.new("RGBA", (w, h + 90), (0, 0, 0, 0))
    out.alpha_composite(note.rotate(6, expand=True, resample=Image.BICUBIC), (150, 0))
    out.alpha_composite(im, (0, 90))
    d2 = ImageDraw.Draw(out)
    d2.text((w // 2, h + 20), "GAJI", font=font(TYPE, 64), fill=INK, anchor="mm")
    return out


@lru_cache(None)
def icon_phone() -> Image.Image:
    w, h = 330, 600

    def shape(d, w, h):
        d.rounded_rectangle((20, 20, w - 20, h - 20), radius=46, fill=255)
    im = _paper_cut(shape, w, h, (60, 54, 50), 51)
    d = ImageDraw.Draw(im)
    scr = _tex_img(w - 90, h - 150, (214, 200, 168), 52, 0.05)
    im.alpha_composite(scr, (45, 70))
    d.rounded_rectangle((w // 2 - 40, 40, w // 2 + 40, 50), radius=5, fill=(30, 28, 26))
    # "kotak foto" di layar
    for i in range(3):
        for j in range(4):
            d.rectangle((62 + i * 70, 96 + j * 100, 122 + i * 70, 180 + j * 100), fill=(170, 150, 112))
    return im


@lru_cache(None)
def icon_house() -> Image.Image:
    w, h = 640, 560

    def shape(d, w, h):
        d.polygon([(40, 250), (w // 2, 40), (w - 40, 250)], fill=255)
        d.rectangle((90, 240, w - 90, h - 30), fill=255)
    im = _paper_cut(shape, w, h, (168, 120, 84), 61)
    d = ImageDraw.Draw(im)
    roof = _paper_cut(lambda d, w, h: d.polygon([(30, 230), (w // 2, 30), (w - 30, 230)], fill=255), w, 260, (120, 60, 44), 62, 6)
    im.alpha_composite(roof, (0, 14))
    d.rectangle((w // 2 - 50, h - 190, w // 2 + 50, h - 30), fill=(96, 66, 44))
    for x in (140, w - 220):
        d.rectangle((x, 300, x + 80, 380), fill=(226, 212, 176))
        d.line((x + 40, 300, x + 40, 380), fill=(96, 66, 44), width=5)
        d.line((x, 340, x + 80, 340), fill=(96, 66, 44), width=5)
    return im


# ---------------------------------------------------------------- papan investigasi (teaser)
@lru_cache(None)
def board_teaser(ww: int = 3000, wh: int = 1688):
    """Papan gabus penuh 'bukti' + benang merah. Return (world_rgb, daftar titik pin)."""
    world = cork_texture(ww, wh).copy()
    base = Image.fromarray((world * 255).astype(np.uint8)).convert("RGBA")
    items = [
        ("LS01_treadmill-brixton-1817.jpg", 360, (520, 520), -3, None),
        ("TU01_diderot-van-loo.jpg", 380, (1180, 430), 2, None),
        ("TU05_heller.jpg", 320, (1840, 470), -2, None),
        ("PT01_peta-illinois-1850.jpg", 420, (2520, 560), 3, None),
        ("DK02_komik-joneses-panel-1920.png", 400, (700, 1200), 2, None),
        ("LK06_upacara-medali-1912.jpg", 460, (1400, 1150), -2, None),
        ("LS08_zaman-batu-vasnetsov.jpg", 520, (2150, 1180), 2, (0.1, 0.0, 0.75, 1.0)),
        ("TU07_kahneman.jpg", 300, (2700, 1260), -3, None),
    ]
    pins = []
    for k, (name, wdt, (cx, cy), ang, crop) in enumerate(items):
        pr = photo_print(name, wdt, border=18, crop=crop, seed=k)
        pr = shadowed(pr.rotate(ang, expand=True, resample=Image.BICUBIC), blur=12, offset=(8, 12), alpha=0.6)
        base.alpha_composite(pr, (int(cx - pr.width / 2), int(cy - pr.height / 2)))
        pins.append((cx, cy - pr.height / 2 + 70))
    # benang merah antar pin
    d = ImageDraw.Draw(base)
    order = [0, 1, 5, 2, 3, 7, 6, 4, 0]
    for a, b in zip(order, order[1:]):
        (x0, y0), (x1, y1) = pins[a], pins[b]
        d.line((x0, y0, x1, y1), fill=(150, 20, 18, 230), width=5)
    pp = pushpin(18)
    for (x, y) in pins:
        base.alpha_composite(pp, (int(x - pp.width / 2), int(y - pp.height / 2)))
    return to_f(base.convert("RGB")), pins
