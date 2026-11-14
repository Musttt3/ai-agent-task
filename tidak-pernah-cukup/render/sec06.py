"""BAGIAN 6 — KLIMAKS: petunjuk baru (global 410.2–479.2)."""
from __future__ import annotations

import math
import sys
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
from engine import BEBAS, INK, RED, TYPE, Section, Shot, ease, font, kenburns, lerp, load_rgb, prog
from shots import (Item, Scene, _tex, bg_cork, bg_dark, bg_image, bg_paper, bg_wood, cut, dyn_keyword, index_card, journal_page,
                   note_card, photo, pin_sp, shot_img, shot_vid, sp, stamp_sp)
from timeline import SECTIONS, Ev, vo

OFF, END = SECTIONS["sec06"]
DUR = END - OFF
v = vo("VO06_klimaks", OFF)
A = v.start


def a(x):
    return A + x


@lru_cache(None)
def dial_sp() -> np.ndarray:
    w, h = 1400, 820
    im = _tex(w, h, (236, 228, 208), 801, 0.18)
    d = ImageDraw.Draw(im)
    cx, cy, r = w / 2, h - 120, 560
    d.arc((cx - r, cy - r, cx + r, cy + r), 180, 360, fill=INK, width=10)
    for k in range(0, 21):
        ang = math.pi + k * math.pi / 20
        r0 = r - (60 if k % 5 == 0 else 34)
        d.line((cx + r0 * math.cos(ang), cy + r0 * math.sin(ang), cx + r * math.cos(ang), cy + r * math.sin(ang)),
               fill=INK, width=8 if k % 5 == 0 else 4)
    d.text((cx, cy - r - 0 + 120), "NETRAL", font=font(TYPE, 54), fill=INK, anchor="mm")
    d.text((cx - r + 70, cy - 40), "–", font=font(BEBAS, 120), fill=INK, anchor="mm")
    d.text((cx + r - 70, cy - 40), "+", font=font(BEBAS, 120), fill=INK, anchor="mm")
    return sp(im)


def needle(cx, cy, r, keys):
    """keys: [(t, derajat)] 0 = netral (tegak), + = ke kanan."""
    def f(fr, t, c):
        if t < keys[0][0] - 0.8:
            return
        deg = keys[0][1]
        for (t0, d0), (t1, d1) in zip(keys, keys[1:]):
            if t >= t0:
                deg = lerp(d0, d1, ease(prog(t, t0, t1)))
        ang = math.radians(-90 + deg)
        p0 = c.pt(cx, cy)
        p1 = c.pt(cx + r * math.cos(ang), cy + r * math.sin(ang))
        cv2.line(fr, (int(p0[0]), int(p0[1])), (int(p1[0]), int(p1[1])), (0.7, 0.11, 0.09), max(3, int(14 * c.s)), cv2.LINE_AA)
        cv2.circle(fr, (int(p0[0]), int(p0[1])), max(4, int(30 * c.s)), (0.2, 0.16, 0.13), -1, cv2.LINE_AA)
    return f


def shot_rotate(t0, t1, name, z0, z1, ang0, ang1, fade=0.8, grade=0.75):
    holder = {}

    def draw(t, u, i):
        if "img" not in holder:
            holder["img"] = load_rgb(name, 3400, grade)
        return kenburns(holder["img"], u, z0, z1, (0.5, 0.5), (0.5, 0.5), ang0, ang1)
    return Shot(t0, t1, draw, fade_in=fade, name=name)


def build() -> Section:
    S = []
    # 1. Treadmill: tarik mundur pelan
    S.append(shot_img(0, a(4.0), "LS01_treadmill-brixton-1817.jpg", 1.18, 1.0, (0.5, 0.42), (0.5, 0.36), fade=0))

    # 2. PETUNJUK BARU: dokumen meluncur masuk + cap (momen klimaks)
    s2 = Scene(bg_wood(), [(a(3.8), .5, .5, 1.0), (a(7.0), .5, .5, 1.1)],
               [Item(journal_page("Berkas No. 001", "Petunjuk Baru", "lampiran", "2006", 900, 21, hl=None), 1200, 700, a(4.0),
                     anim="slide", dx=1400, dur=1.1, angle=-2),
                Item(stamp_sp("PETUNJUK BARU", 140, -9, 31), 1220, 640, a(5.7), anim="stamp")])
    S.append(s2.shot(a(3.8), a(7.0)))

    # 3. Diener 2006
    s3 = Scene(bg_paper(seed=71), [(a(6.8), .58, .5, 1.1), (a(11.9), .5, .5, 1.0)],
               [Item(journal_page("American Psychologist", "Beyond the Hedonic Treadmill", "E. Diener, R. E. Lucas & C. N. Scollon",
                                  "2006", 780, 22, hl=4), 1580, 680, a(6.9), angle=1.5),
                Item(index_card("ED DIENER", "psikolog", "", 700, 31), 660, 640, a(8.0), angle=-2)],
               [dyn_keyword("2006", a(7.0), a(9.8))])
    S.append(s3.shot(a(6.8), a(11.9)))

    # 4. Meteran titik dasar: netral -> sedikit di atas netral -> bergeser
    s4 = Scene(bg_paper(seed=72), [(a(11.7), .5, .52, 1.0), (a(20.7), .5, .55, 1.06)],
               [Item(dial_sp(), 1200, 660, a(11.8))],
               [needle(1200, 950, 470, [(a(12.2), -70), (a(13.6), 0), (a(15.6), 0), (a(16.9), 16),
                                                        (a(19.2), 16), (a(20.2), 34)])])
    S.append(s4.shot(a(11.7), a(20.7)))

    # 5. Hujan -> cahaya pagi
    S.append(shot_vid(a(20.5), a(26.3), "FT10_hujan-jendela.mp4", ss=4.0, z0=1.0, z1=1.05))
    S.append(shot_vid(a(25.8), a(28.7), "FT11_cahaya-jendela.mp4", ss=1.0, z0=1.0, z1=1.04, fade=1.2))

    # 6. Timbangan: pedang bermata dua
    s6 = Scene(bg_paper(seed=73), [(a(28.5), .5, .5, 1.0), (a(32.2), .5, .5, 1.07)],
               [Item(cut("LK12_timbangan_nobg.png", 1200, 0.6), 1200, 640, a(28.5))])
    S.append(s6.shot(a(28.5), a(32.2)))

    # 7. Tangga spiral: berputar sangat pelan
    S.append(shot_rotate(a(32.0), a(37.9), "LK13_tangga-spiral.jpg", 1.25, 1.32, 0, 8))

    # 8. SETELAH... SETELAH... SETELAH...
    s8 = Scene(bg_cork(), [(a(37.7), .5, .5, 1.0), (a(42.8), .52, .5, 1.06)],
               [Item(note_card("SETELAH\nNAIK GAJI", 560, 60, seed=41), 560, 680, a(37.8), angle=-3),
                Item(note_card("SETELAH\nPUNYA RUMAH", 600, 60, seed=42), 1200, 640, a(39.2), angle=2),
                Item(note_card("SETELAH\nDIAKUI", 520, 60, seed=43), 1840, 690, a(40.5), angle=-1),
                Item(pin_sp(), 560, 560, a(37.9), anim="drop"), Item(pin_sp(), 1200, 520, a(39.3), anim="drop"),
                Item(pin_sp(), 1840, 570, a(40.6), anim="drop")])
    S.append(s8.shot(a(37.7), a(42.8)))

    # 9. Vonnegut & Heller
    s9 = Scene(bg_cork(), [(a(42.6), .45, .5, 1.05), (a(49.6), .55, .5, 1.05)],
               [Item(cut("TU04_vonnegut_nobg.png", 640, 0.6), 700, 700, a(43.0)),
                Item(note_card("KURT VONNEGUT", 560, 46, seed=44), 700, 1180, a(43.3)),
                Item(cut("TU06_heller_nobg.png", 700, 0.6), 1700, 720, a(46.3)),
                Item(note_card("JOSEPH HELLER", 560, 46, seed=45), 1700, 1180, a(46.6))],
               [dyn_keyword("CATCH-22", a(48.1), a(49.4))])
    S.append(s9.shot(a(42.6), a(49.6)))

    # 10. Rumah mewah di malam hari
    S.append(shot_vid(a(49.4), a(59.0), "FT12_rumah-malam.mp4", ss=2.0, z0=1.0, z1=1.07))

    # 11. Foto Heller dipin di papan + cap CUKUP. di bawahnya
    s11 = Scene(bg_cork(), [(a(58.8), .5, .45, 1.0), (DUR, .5, .5, 1.18)],
                [Item(photo("TU05_heller.jpg", 620, crop=(0.0, 0.05, 1.0, 0.75), grade=0.72, angle=-1.5), 1200, 600, a(58.8)),
                 Item(pin_sp(), 1200, 262, a(58.9), anim="drop"),
                 Item(stamp_sp("CUKUP.", 200, -8, 33), 1230, 1080, a(65.9), anim="stamp")])
    S.append(s11.shot(a(58.8), DUR))

    return Section("06_klimaks", DUR, S, fade_from_black=0.5, fade_to_black=1.0)


def audio_events() -> list[Ev]:
    g = lambda x: OFF + a(x)  # noqa: E731
    return [
        Ev("vo/VO06_klimaks.mp3", OFF + A, 2.5, bus="vo"),
        Ev("SFX20_riser-tegang.mp3", OFF - 12.0, -20, dur=17.6, fade_in=4.0, fade_out=0.4),
        Ev("SFX05_whoosh-lembut.mp3", g(4.0), -24),
        Ev("SFX21_impact-klimaks.mp3", g(5.65), -12),
        Ev("SFX11_stempel.mp3", g(5.7), -14),
        Ev("SFX07_kertas-dibalik.mp3", g(6.9), -24), Ev("SFX08_foto-diletakkan.mp3", g(8.0), -25),
        Ev("SFX08_foto-diletakkan.mp3", g(11.8), -26),
        Ev("SFX22_hujan.mp3", g(20.5), -24, dur=6.5, fade_in=0.8, fade_out=1.8, bus="bed"),
        Ev("SFX12_pin-papan.mp3", g(37.9), -23), Ev("SFX12_pin-papan.mp3", g(39.3), -23), Ev("SFX12_pin-papan.mp3", g(40.6), -23),
        Ev("SFX08_foto-diletakkan.mp3", g(43.0), -25), Ev("SFX08_foto-diletakkan.mp3", g(46.3), -25),
        Ev("SFX11_stempel.mp3", g(65.9), -13),
        Ev("sfx_tambahan/freesound_community-small-wood-block-64458.mp3", g(65.9), -21, dur=0.5, fade_out=0.2),
    ]
