"""BAGIAN 5 — Bukti: perbandingan sosial, Olimpiade, Joneses, efek Diderot, uang (global 209.4–410.2)."""
from __future__ import annotations

import sys
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
from engine import BEBAS, INK, RED, TYPE, Section, draw_text, ease, font, lerp, prog
from props import _paper_cut, icon_envelope, icon_house, icon_phone
from shots import (Item, Scene, _tex, bg_cork, bg_dark, bg_image, bg_paper, cut, dyn_arrow, dyn_axes, dyn_circle,
                   dyn_highlight, dyn_keyword, dyn_line, dyn_poly, dyn_text, empty_frame, index_card, journal_page,
                   map_pin, note_card, photo, pin_sp, shot_img, shot_vid, sp, stamp_sp)
from timeline import SECTIONS, Ev, vo

OFF, END = SECTIONS["sec05"]
DUR = END - OFF
v = vo("VO05_bukti", OFF)
A = v.start


def a(x):
    return A + x


# ---------------------------------------------------------------- sprite khusus
@lru_cache(None)
def icon_sp(kind: str) -> np.ndarray:
    if kind == "phone":
        im = icon_phone()
    elif kind == "house":
        im = icon_house()
    elif kind == "envelope":
        im = icon_envelope()
    elif kind == "case":
        w, h = 330, 600
        im = _paper_cut(lambda d, w, h: d.rounded_rectangle((20, 20, w - 20, h - 20), radius=50, fill=255), w, h, (150, 60, 50), 81)
        d = ImageDraw.Draw(im)
        d.rounded_rectangle((60, 60, 160, 160), radius=24, fill=(90, 36, 30))
        d.ellipse((85, 85, 135, 135), fill=(40, 30, 28))
    elif kind == "sofa":
        w, h = 700, 420

        def shape(d, w, h):
            d.rounded_rectangle((60, 40, w - 60, 250), radius=40, fill=255)
            d.rounded_rectangle((20, 160, w - 20, 340), radius=40, fill=255)
            d.rectangle((70, 330, 110, 400), fill=255)
            d.rectangle((w - 110, 330, w - 70, 400), fill=255)
        im = _paper_cut(shape, w, h, (120, 90, 70), 82)
        d = ImageDraw.Draw(im)
        d.line((w / 2, 60, w / 2, 240), fill=(90, 66, 50), width=6)
    elif kind == "coin":
        w = 240
        im = _paper_cut(lambda d, w, h: d.ellipse((20, 20, w - 20, h - 20), fill=255), w, w, (200, 170, 90), 83)
        ImageDraw.Draw(im).text((w / 2, w / 2), "+1 JT", font=font(BEBAS, 72), fill=(90, 70, 30), anchor="mm")
    else:
        raise KeyError(kind)
    return sp(im, blur=14, off=(10, 14), alpha=0.5)


@lru_cache(None)
def podium_sp() -> np.ndarray:
    w, h = 1500, 620
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    blocks = [(2, 0, 420, 300), (1, 470, 0, 300), (3, 940, 160, 300)]  # (no, x, top, lebar)
    for no, x, top, bw in blocks:
        blk = _tex(bw + 140, h - top, (226, 214, 188), 90 + no, 0.18)
        im.alpha_composite(blk, (x, top))
        d = ImageDraw.Draw(im)
        d.rectangle((x, top, x + bw + 139, h - 1), outline=(60, 50, 40), width=6)
        d.text((x + (bw + 140) / 2, top + 120), str(no), font=font(BEBAS, 170), fill=INK, anchor="mm")
    return sp(im, blur=18, off=(12, 16), alpha=0.45)


@lru_cache(None)
def medal_sp(kind: str, w=210) -> np.ndarray:
    return cut(f"_alt/medali-{kind}.png", w, 0.45)


def finish_line(t0, t1, xa, xb, y0=300, y1=1100):
    """Garis finis merah yang terus bergeser ke kanan."""
    def f(fr, t, c):
        p = ease(prog(t, t0, t1))
        al = ease(prog(t, t0 - 0.8, t0 - 0.1))
        if al <= 0:
            return
        x = lerp(xa, xb, p)
        for k in range(14):
            ya, yb = y0 + k * (y1 - y0) / 14, y0 + (k + 0.6) * (y1 - y0) / 14
            pa, pb = c.pt(x, ya), c.pt(x, yb)
            cv2.line(fr, (int(pa[0]), int(pa[1])), (int(pb[0]), int(pb[1])), (0.7, 0.11, 0.09), max(3, int(8 * c.s)), cv2.LINE_AA)
        px, py = c.pt(x, y0 - 50)
        draw_text(fr, "FINIS", (px, py), BEBAS, int(80 * c.s), RED, al)
    return f


def build() -> Section:
    S = []

    # 1. Keramaian State Street, Chicago 1893
    S.append(shot_img(0, a(5.7), "LK04_state-street-chicago-1893.jpg", 1.0, 1.06, (0.4, 0.55), (0.6, 0.52), fade=0))
    S.append(Scene(bg_image("LK04_state-street-chicago-1893.jpg", 3400, 0.75), [(0, .45, .55, 1.0)], [],
                   [dyn_keyword("TERSANGKA #2", a(2.5), a(5.5))]).shot(0, a(5.7), fade=0))
    S.pop(0)

    # 2. Festinger 1954 + Human Relations (tiruan)
    s2 = Scene(bg_paper(seed=51), [(a(5.5), .58, .5, 1.1), (a(12.1), .48, .5, 1.0)],
               [Item(journal_page("Human Relations", "A Theory of Social Comparison Processes", "L. Festinger", "1954", 780, 11, hl=5),
                     1580, 680, a(5.6), angle=1.5),
                Item(index_card("LEON FESTINGER", "psikolog", "", 720, 21), 660, 640, a(8.6), angle=-2)],
               [dyn_keyword("1954", a(6.3), a(9.0))])
    S.append(s2.shot(a(5.5), a(12.1)))

    # 3–4. Ruang kelas 1899: lebar, lalu lingkaran pada wajah
    kel = bg_image("LK05_ruang-kelas-1899.jpg", 3400, 0.7)
    kh, kw = kel.shape[:2]
    s3 = Scene(kel, [(a(11.9), .45, .5, 1.0), (a(17.8), .5, .45, 1.06), (a(23.8), .45, .43, 1.25)], [],
               [dyn_circle(kw * .19, kh * .47, kw * .05, kh * .07, a(18.0), seed=1, width=7),
                dyn_circle(kw * .36, kh * .43, kw * .05, kh * .07, a(19.4), seed=2, width=7),
                dyn_circle(kw * .70, kh * .31, kw * .05, kh * .07, a(20.8), seed=3, width=7),
                dyn_keyword("DIBANDING SIAPA?", a(22.6), a(23.8))])
    S.append(s3.shot(a(11.9), a(23.8)))

    # 5. Upacara medali 1912 (BUKTI #2)
    S.append(shot_img(a(23.6), a(26.4), "LK06_upacara-medali-1912.jpg", 1.0, 1.07, (0.4, 0.45), (0.32, 0.42)))
    # 6. Cornell 1995
    s6 = Scene(bg_paper(seed=52), [(a(26.2), .5, .5, 1.0), (a(31.0), .5, .5, 1.06)],
               [Item(note_card("CORNELL UNIVERSITY\n1995", 860, 66, seed=23), 1200, 640, a(26.4)),
                Item(stamp_sp("BUKTI #2", 100, -6, 21), 1650, 380, a(26.6), anim="stamp")])
    S.append(s6.shot(a(26.2), a(31.0)))
    # 7. Peta Spanyol + pin Barcelona
    sp_map = bg_image("PT03_peta-spanyol-1850.jpg", 3000, 0.55)
    mh, mw = sp_map.shape[:2]
    s7 = Scene(sp_map, [(a(30.8), .5, .45, 1.0), (a(36.0), .72, .32, 1.8)],
               [Item(map_pin(30), mw * .775, mh * .30 - 30, a(33.7), anim="drop")],
               [dyn_keyword("BARCELONA, 1992", a(33.9), a(35.8))])
    S.append(s7.shot(a(30.8), a(36.0)))
    # 8. Stadion Montjuïc
    S.append(shot_img(a(35.8), a(39.4), "LK07_stadion-montjuic.jpg", 1.0, 1.06, (0.5, 0.5), (0.55, 0.48)))

    # 9. Tiga medali: perunggu disorot, perak meredup
    s9 = Scene(bg_paper(seed=53), [(a(39.2), .5, .5, 1.0), (a(43.2), .5, .5, 1.05)],
               [Item(medal_sp("perak", 420), 760, 680, a(39.2), alpha_fn=lambda t: 1 - 0.45 * ease(prog(t, a(42.2), a(43.0)))),
                Item(medal_sp("emas", 420), 1200, 660, a(39.2)),
                Item(medal_sp("perunggu", 420), 1640, 680, a(39.2))],
               [dyn_circle(1640, 680, 290, 380, a(39.8), seed=9, width=8)])
    S.append(s9.shot(a(39.2), a(43.2)))

    # 10. Podium: perak -> emas, perunggu -> 4
    pod_items = [Item(podium_sp(), 1180, 820, a(43.0)),
                 Item(medal_sp("perak", 150), 650, 810, a(43.1)), Item(medal_sp("emas", 150), 1120, 390, a(43.1)),
                 Item(medal_sp("perunggu", 150), 1590, 550, a(43.1)),
                 Item(note_card("4", 180, 90, seed=24), 2150, 1020, a(43.2)),
                 Item(note_card('"Sedikit lagi aku juara."', 900, 46, seed=25), 640, 190, a(46.2), angle=-2),
                 Item(note_card('"Untung aku dapat medali."', 900, 46, seed=26), 1820, 260, a(51.0), angle=2)]
    pod_dyn = [dyn_arrow((720, 740), (1030, 430), a(43.7), 1.0), dyn_arrow((1680, 600), (2070, 950), a(48.2), 1.0),
               dyn_circle(650, 880, 220, 260, a(52.9), seed=11, width=9)]
    s10 = Scene(bg_paper(seed=54), [(a(43.0), .5, .5, 1.0), (a(47.5), .42, .45, 1.08), (a(52.0), .6, .5, 1.08),
                                    (a(55.8), .45, .5, 1.05)], pod_items, pod_dyn)
    S.append(s10.shot(a(43.0), a(55.9)))

    # 11. Panel Joneses 1920
    S.append(Scene(bg_image("DK02_komik-joneses-panel-1920.png", 3400, 0.55), [(a(55.7), .5, .3, 1.0), (a(63.6), .5, .45, 1.07)], [],
                   [dyn_keyword("KEEPING UP WITH THE JONESES", a(59.2), a(63.4), size=50)]).shot(a(55.7), a(63.6)))
    # 12. Komik strip 1921: geser melintasi panel
    s12 = Scene(bg_paper(seed=56), [(a(63.4), .3, .5, 1.25), (a(70.7), .7, .5, 1.25)],
                [Item(photo("DK01_komik-joneses-1921.png", 2100, grade=0.5), 1200, 675, a(63.4))],
                [dyn_keyword("POP MOMAND, 1913", a(66.3), a(70.4))])
    S.append(s12.shot(a(63.4), a(70.7)))
    # 13. Close-up panel, lalu bingkai kosong '?'
    S.append(shot_img(a(70.5), a(75.4), "DK02_komik-joneses-panel-1920.png", 1.3, 1.4, (0.5, 0.7), (0.5, 0.75), grade=0.55))
    s13 = Scene(bg_cork(), [(a(75.2), .5, .5, 1.1), (a(78.6), .5, .5, 1.25)],
                [Item(empty_frame(460, 560, "?", 31), 1200, 700, a(75.2)), Item(pin_sp(), 1200, 450, a(75.4), anim="drop")])
    S.append(s13.shot(a(75.2), a(78.6)))

    # 14. Luttmer 2005
    s14 = Scene(bg_paper(seed=57), [(a(78.4), .55, .5, 1.08), (a(84.2), .5, .5, 1.0)],
                [Item(journal_page("Quarterly Journal of Economics", "Neighbors as Negatives: Relative Earnings and Well-Being",
                                   "E. F. P. Luttmer", "2005", 780, 13, hl=7), 1580, 680, a(78.5), angle=-1.5),
                 Item(index_card("ERZO LUTTMER", "ekonom", "2005", 720, 22), 660, 640, a(80.4), angle=2)],
                [dyn_highlight(1260, 690, 1900, 760, a(84.0), 1.0)])
    S.append(s14.shot(a(78.4), a(84.2)))

    # 15–17. Perumahan dari udara; scroll medsos; polaroid
    S.append(shot_vid(a(84.0), a(90.8), "FT07_perumahan-udara.mp4", ss=2.0, z0=1.0, z1=1.06))
    S.append(shot_vid(a(90.6), a(94.5), "FT08_scroll-medsos.mp4", ss=3.0, z0=1.0, z1=1.05))
    S.append(shot_img(a(94.3), a(100.5), "LK14_polaroid-di-meja.jpg", 1.0, 1.08, (0.5, 0.35), (0.5, 0.55)))

    # 18. TERSANGKA #3
    s18 = Scene(bg_cork(), [(a(100.3), .5, .5, 1.12), (a(104.2), .5, .5, 1.0)],
                [Item(note_card("TERSANGKA #3", 700, 74, seed=27), 1200, 640, a(100.5)), Item(pin_sp(), 1200, 560, a(100.6), anim="drop")])
    S.append(s18.shot(a(100.3), a(104.2)))

    # 19. Diderot (potongan) parallax di latar gelap
    s19 = Scene(bg_dark(seed=58), [(a(104.0), .5, .5, 1.0), (a(112.4), .45, .45, 1.08)],
                [Item(cut("TU02_diderot-van-loo_nobg.png", 1150, 0.55), 1350, 760, a(104.0))],
                [dyn_keyword("DENIS DIDEROT, 1769", a(104.6), a(109.5))])
    S.append(s19.shot(a(104.0), a(112.4)))

    # 20. Ruang abad ke-18 (Croome Court)
    S.append(shot_img(a(112.2), a(119.6), "LK11_ruang-croome-court.jpg", 1.0, 1.07, (0.3, 0.55), (0.6, 0.52)))

    # 21. Kursi, meja, hiasan dinding... lalu UTANG
    s21 = Scene(bg_paper(seed=59), [(a(119.4), .5, .5, 1.0), (a(126.0), .5, .5, 1.06)],
                [Item(cut("LK09_kursi-prancis-1735_nobg.png", 520, 0.6), 560, 720, a(120.6)),
                 Item(cut("LK10_meja-tulis-1760_nobg.png", 480, 0.6), 1150, 700, a(121.7)),
                 Item(photo("LK11_ruang-croome-court.jpg", 520, crop=(0.08, 0.12, 0.30, 0.55), grade=0.65), 1780, 560, a(123.0), angle=2),
                 Item(stamp_sp("UTANG", 140, -10, 22), 1250, 1060, a(124.9), anim="stamp")])
    S.append(s21.shot(a(119.4), a(126.0)))

    # 22. Potret Diderot: push-in ke wajah
    S.append(shot_img(a(125.8), a(132.3), "TU01_diderot-van-loo.jpg", 1.0, 1.45, (0.5, 0.45), (0.55, 0.33)))

    # 23. Rantai efek Diderot
    chain = [(cut("TU02_diderot-van-loo_nobg.png", 380, 0.55), 380, 680, a(132.1)),
             (cut("LK09_kursi-prancis-1735_nobg.png", 330, 0.6), 940, 700, a(132.1)),
             (cut("LK10_meja-tulis-1760_nobg.png", 300, 0.6), 1480, 690, a(132.1)),
             (photo("LK11_ruang-croome-court.jpg", 340, crop=(0.08, 0.12, 0.30, 0.55), grade=0.65), 2020, 640, a(132.1))]
    s23 = Scene(bg_cork(), [(a(132.1), .5, .5, 1.0), (a(139.5), .52, .5, 1.05)],
                [Item(sx, x, y, t0) for sx, x, y, t0 in chain] +
                [Item(pin_sp(), x, 420, a(132.3)) for _, x, _, _ in chain],
                [dyn_line((380, 420), (940, 420), a(136.4), 0.7, (150, 20, 18), 5, wobble=30),
                 dyn_line((940, 420), (1480, 420), a(137.1), 0.7, (150, 20, 18), 5, wobble=30, seed=2),
                 dyn_line((1480, 420), (2020, 420), a(137.8), 0.7, (150, 20, 18), 5, wobble=30, seed=3),
                 dyn_keyword("EFEK DIDEROT", a(135.3), a(139.3))])
    S.append(s23.shot(a(132.1), a(139.5)))

    # 24. Rantai modern + garis finis bergeser
    s24 = Scene(bg_paper(seed=60), [(a(139.3), .45, .5, 1.0), (a(145.6), .55, .5, 1.04)],
                [Item(icon_sp("phone"), 420, 480, a(139.4), scale=0.75), Item(icon_sp("case"), 900, 480, a(140.6), scale=0.75),
                 Item(icon_sp("house"), 430, 1010, a(141.4), scale=0.65), Item(icon_sp("sofa"), 960, 1010, a(142.6), scale=0.7)],
                [dyn_arrow((560, 480), (760, 480), a(140.2), 0.6), dyn_arrow((620, 1010), (720, 1010), a(142.2), 0.6),
                 finish_line(a(143.4), a(145.4), 1500, 2150)])
    S.append(s24.shot(a(139.3), a(145.6)))

    # 25. Uang (close-up)
    S.append(shot_vid(a(145.4), a(150.6), "FT09_uang-closeup.mp4", ss=0.0, z0=1.0, z1=1.05))

    # 26. Easterlin + peta AS
    us = bg_image("PT04_peta-amerika-1867.jpg", 3200, 0.5)
    s26 = Scene(us, [(a(150.4), .5, .5, 1.0), (a(155.8), .52, .5, 1.08)],
                [Item(index_card("RICHARD EASTERLIN", "ekonom", "1974", 760, 23), us.shape[1] * .5, us.shape[0] * .5, a(153.0), scale=1.6, angle=-2)],
                [dyn_keyword("1974", a(151.1), a(153.0))])
    S.append(s26.shot(a(150.4), a(155.8)))

    # 27. Grafik Easterlin 1946–1970: pendapatan naik, 'sangat bahagia' hampir datar (39% -> 43%)
    x0, x1, yb = 520, 2000, 1050
    inc = np.stack([np.linspace(x0, x1, 80), yb - 120 - np.linspace(0, 1, 80) ** 1.1 * 620], 1)
    hap = np.stack([np.linspace(x0, x1, 80), yb - 380 - np.linspace(0, 1, 80) * 30 + 10 * np.sin(np.linspace(0, 9, 80))], 1)
    s27 = Scene(bg_paper(seed=61), [(a(155.6), .5, .5, 1.0), (a(166.0), .52, .5, 1.05), (a(171.0), .52, .5, 1.05)],
                [Item(stamp_sp("DIPERDEBATKAN", 110, -8, 23), 1250, 330, a(170.0), anim="stamp")],
                [dyn_axes(x0, 230, x1, yb, a(155.7), "", ""),
                 dyn_text("1946", x0, yb + 60, a(156.0), 46), dyn_text("1970", x1, yb + 60, a(158.2), 46),
                 dyn_poly(inc, a(156.4), 4.6, INK, 7), dyn_text("pendapatan rata-rata", x1 - 200, yb - 790, a(160.0), 44),
                 dyn_poly(hap, a(161.5), 3.6, RED, 8), dyn_text("sangat bahagia: 39%", x0 + 260, yb - 450, a(162.5), 44, color=RED),
                 dyn_text("43%", x1 + 80, yb - 410, a(164.8), 46, color=RED),
                 dyn_keyword("PARADOKS EASTERLIN", a(167.3), a(170.8))])
    S.append(s27.shot(a(155.6), a(171.0)))

    # 28. Kahneman & Killingsworth (2023)
    s28 = Scene(bg_cork(), [(a(170.8), .5, .5, 1.08), (a(179.6), .5, .5, 1.0)],
                [Item(photo("TU07_kahneman.jpg", 760, caption="DANIEL KAHNEMAN", grade=0.75, angle=-2), 700, 640, a(172.0)),
                 Item(index_card("MATTHEW KILLINGSWORTH", "peneliti", "", 820, 24), 1700, 640, a(173.8), angle=2),
                 Item(pin_sp(), 700, 330, a(172.1), anim="drop"), Item(pin_sp(), 1700, 420, a(173.9), anim="drop")],
                [dyn_line((700, 330), (1700, 420), a(177.6), 1.1, (150, 20, 18), 5, wobble=40),
                 dyn_keyword("2023", a(171.4), a(176.0))])
    S.append(s28.shot(a(170.8), a(179.6)))

    # 29. Kurva logaritmik: naik terus, makin landai
    xs = np.linspace(0, 1, 160)
    lx0, lx1, ly = 520, 2050, 1060
    curve = np.stack([lx0 + (lx1 - lx0) * xs, ly - 700 * np.log1p(xs * 40) / np.log1p(40)], 1)
    log_dyn = [dyn_axes(lx0, 230, lx1, ly, a(179.4), "pendapatan", "kebahagiaan"), dyn_poly(curve, a(181.6), 4.6, RED, 8)]
    s29 = Scene(bg_paper(seed=62), [(a(179.4), .5, .5, 1.0), (a(187.0), .52, .48, 1.05)], [], log_dyn)
    S.append(s29.shot(a(179.4), a(187.0)))

    # 30. Dua amplop: +1 juta besar vs hampir tak terasa
    s30 = Scene(bg_paper(seed=63), [(a(186.8), .5, .5, 1.0), (a(190.4), .32, .5, 1.12), (a(194.3), .7, .5, 1.12)],
                [Item(icon_sp("envelope"), 700, 650, a(186.8), scale=0.9), Item(icon_sp("envelope"), 1700, 650, a(186.8), scale=0.9),
                 Item(note_card("GAJI 3 JUTA", 520, 52, seed=28), 700, 1080, a(187.0)),
                 Item(note_card("GAJI 100 JUTA", 560, 52, seed=29), 1700, 1080, a(187.0)),
                 Item(icon_sp("coin"), 980, 360, a(188.0), scale=1.25), Item(icon_sp("coin"), 1870, 420, a(191.4), scale=0.32)])
    S.append(s30.shot(a(186.8), a(194.3)))

    # 31. Kembali ke kurva: ujung yang landai disorot
    s31 = Scene(bg_paper(seed=62), [(a(194.1), .55, .45, 1.05), (DUR, .7, .35, 1.2)], [],
                [dyn_poly(curve, a(178.0), 0.2, RED, 8), dyn_axes(lx0, 230, lx1, ly, a(178.0), "pendapatan", "kebahagiaan"),
                 dyn_circle(1850, ly - 690, 260, 120, a(195.9), seed=12, width=9)])
    S.append(s31.shot(a(194.1), DUR))

    return Section("05_bukti", DUR, S, fade_from_black=0.5, fade_to_black=0.6)


def audio_events() -> list[Ev]:
    g = lambda x: OFF + a(x)  # noqa: E731
    E = [Ev("vo/VO05_bukti.mp3", OFF + A, 2.5, bus="vo"),
         Ev("SFX18_keramaian-jalan.mp3", OFF, -30, dur=6.0, fade_in=0.8, fade_out=1.5, bus="bed"),
         Ev("SFX07_kertas-dibalik.mp3", g(5.6), -24), Ev("SFX08_foto-diletakkan.mp3", g(8.6), -25),
         Ev("SFX13_spidol.mp3", g(18.0), -24), Ev("SFX13_spidol.mp3", g(19.4), -24), Ev("SFX13_spidol.mp3", g(20.8), -24),
         Ev("SFX11_stempel.mp3", g(26.6), -17),
         Ev("SFX12_pin-papan.mp3", g(33.7), -22),
         Ev("SFX08_foto-diletakkan.mp3", g(39.2), -25), Ev("SFX13_spidol.mp3", g(39.8), -23),
         Ev("SFX08_foto-diletakkan.mp3", g(43.0), -26), Ev("SFX13_spidol.mp3", g(43.7), -23),
         Ev("SFX08_foto-diletakkan.mp3", g(46.2), -26), Ev("SFX13_spidol.mp3", g(48.2), -23),
         Ev("SFX08_foto-diletakkan.mp3", g(51.0), -26), Ev("SFX13_spidol.mp3", g(52.9), -22),
         Ev("SFX07_kertas-dibalik.mp3", g(55.7), -25), Ev("SFX07_kertas-dibalik.mp3", g(63.4), -25),
         Ev("SFX12_pin-papan.mp3", g(75.4), -23),
         Ev("SFX07_kertas-dibalik.mp3", g(78.5), -24), Ev("SFX08_foto-diletakkan.mp3", g(80.4), -25),
         Ev("SFX06_whoosh-udara.mp3", g(83.8), -29), Ev("SFX06_whoosh-udara.mp3", g(90.4), -30),
         Ev("SFX19_jepret-kamera.mp3", g(94.6), -26), Ev("SFX19_jepret-kamera.mp3", g(96.0), -28),
         Ev("SFX19_jepret-kamera.mp3", g(97.6), -27),
         Ev("SFX12_pin-papan.mp3", g(100.6), -23),
         Ev("SFX05_whoosh-lembut.mp3", g(103.8), -29),
         Ev("SFX08_foto-diletakkan.mp3", g(120.6), -25), Ev("SFX08_foto-diletakkan.mp3", g(121.7), -25),
         Ev("SFX08_foto-diletakkan.mp3", g(123.0), -25),
         Ev("SFX11_stempel.mp3", g(124.9), -16),
         Ev("sfx_tambahan/freesound_community-small-wood-block-64458.mp3", g(124.9), -24, dur=0.5, fade_out=0.2),
         Ev("SFX12_pin-papan.mp3", g(132.3), -25),
         Ev("SFX13_spidol.mp3", g(136.4), -24), Ev("SFX13_spidol.mp3", g(137.1), -24), Ev("SFX13_spidol.mp3", g(137.8), -24),
         Ev("SFX08_foto-diletakkan.mp3", g(139.4), -26), Ev("SFX08_foto-diletakkan.mp3", g(140.6), -26),
         Ev("SFX08_foto-diletakkan.mp3", g(141.4), -26), Ev("SFX08_foto-diletakkan.mp3", g(142.6), -26),
         Ev("SFX06_whoosh-udara.mp3", g(143.4), -28),
         Ev("SFX04_uang-kertas.mp3", g(145.6), -24),
         Ev("SFX08_foto-diletakkan.mp3", g(153.0), -25),
         Ev("SFX14_pensil-grafik.mp3", g(156.4), -24), Ev("SFX14_pensil-grafik.mp3", g(158.2), -25),
         Ev("SFX14_pensil-grafik.mp3", g(161.5), -24), Ev("SFX14_pensil-grafik.mp3", g(163.2), -25),
         Ev("SFX11_stempel.mp3", g(170.0), -16),
         Ev("SFX12_pin-papan.mp3", g(172.1), -24), Ev("SFX12_pin-papan.mp3", g(173.9), -24),
         Ev("SFX13_spidol.mp3", g(177.6), -24),
         Ev("SFX14_pensil-grafik.mp3", g(181.6), -24), Ev("SFX14_pensil-grafik.mp3", g(183.4), -25),
         Ev("SFX24_koin.mp3", g(188.0), -19), Ev("SFX24_koin.mp3", g(191.4), -30),
         Ev("SFX13_spidol.mp3", g(195.9), -23)]
    return E
