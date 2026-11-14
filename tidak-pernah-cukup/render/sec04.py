"""BAGIAN 4 — Tersangka #1: otak, dopamin, evolusi (global 114.4–209.4)."""
from __future__ import annotations

import sys
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
from engine import BEBAS, INK, RED, TYPE, Section, draw_text, ease, prog
from shots import (Item, Scene, _tex, bg_cork, bg_dark, bg_image, bg_paper, cut, dyn_circle, dyn_highlight,
                   dyn_keyword, dyn_line, dyn_poly, dyn_text, empty_frame, index_card, journal_page, note_card, photo,
                   pin_sp, shot_img, shot_vid, sp, stamp_sp)
from timeline import SECTIONS, Ev, vo

OFF, END = SECTIONS["sec04"]
DUR = END - OFF
v = vo("VO04_tersangka-otak", OFF)
A = v.start


def a(x):
    return A + x


@lru_cache(None)
def clipping() -> np.ndarray:
    """Kliping majalah tiruan bertajuk 'HORMON BAHAGIA' (dibuat dengan kode, bukan media asli)."""
    w, h = 820, 520
    im = _tex(w, h, (228, 220, 200), 701, 0.2)
    d = ImageDraw.Draw(im)
    d.text((w / 2, 110), "HORMON", font=__import__("engine").font(BEBAS, 150), fill=INK, anchor="mm")
    d.text((w / 2, 240), "BAHAGIA", font=__import__("engine").font(BEBAS, 150), fill=INK, anchor="mm")
    for k in range(6):
        y = 330 + k * 28
        d.rectangle((60, y, w - 60 - (k % 3) * 70, y + 10), fill=(120, 110, 100))
    return sp(im.rotate(-3, expand=True, resample=Image.BICUBIC))


@lru_cache(None)
def two_col_card() -> np.ndarray:
    w, h = 1300, 560
    im = _tex(w, h, (240, 234, 216), 702, 0.12)
    d = ImageDraw.Draw(im)
    f = __import__("engine").font(TYPE, 84)
    d.line((w / 2, 60, w / 2, h - 60), fill=(150, 130, 110), width=4)
    d.text((w * 0.25, h / 2), "HARAPAN", font=f, fill=INK, anchor="mm")
    d.text((w * 0.75, h / 2), "KEPEMILIKAN", font=f, fill=INK, anchor="mm")
    return sp(im)


def build() -> Section:
    shots = []

    # 1. Papan tersangka: tiga bingkai kosong
    s1 = Scene(bg_cork(), [(0, .5, .5, 1.16), (a(4.8), .5, .5, 1.0)],
               [Item(empty_frame(420, 520, "?", 1), 760, 700, a(0.0), angle=-2),
                Item(empty_frame(420, 520, "?", 2), 1200, 690, a(0.3), angle=1.5),
                Item(empty_frame(420, 520, "?", 3), 1640, 700, a(0.6), angle=-1),
                Item(note_card("TERSANGKA", 640, 70, seed=11), 1200, 300, a(2.1)),
                Item(pin_sp(), 760, 470, a(0.1), anim="drop"), Item(pin_sp(), 1200, 460, a(0.4), anim="drop"),
                Item(pin_sp(), 1640, 470, a(0.7), anim="drop")])
    shots.append(s1.shot(0, a(4.9), fade=0))

    # 2. Otak (Gray 727) + lingkaran di otak tengah
    s2 = Scene(bg_paper(seed=41), [(a(4.6), .5, .5, 1.0), (a(8.3), .52, .55, 1.1)],
               [Item(photo("LS06_gray-otak.png", 1500, grade=0.45), 1200, 650, a(4.6), angle=-1)],
               [dyn_circle(1290, 800, 180, 130, a(5.3), seed=4, width=9), dyn_keyword("DOPAMIN", a(5.4), a(8.0))])
    shots.append(s2.shot(a(4.6), a(8.3)))

    # 3. Molekul dopamin + kliping 'hormon bahagia' dicoret
    s3 = Scene(bg_paper(seed=42), [(a(8.0), .5, .5, 1.0), (a(11.7), .5, .5, 1.06)],
               [Item(photo("LK03_molekul-dopamin.png", 900, grade=0.3), 700, 640, a(8.0), angle=-2),
                Item(clipping(), 1620, 660, a(8.2), angle=0)],
               [dyn_line((1260, 470), (1990, 860), a(9.9), 0.5, RED, 12), dyn_line((1260, 860), (1990, 470), a(10.2), 0.5, RED, 12)])
    shots.append(s3.shot(a(8.0), a(11.7)))

    # 4. Schultz 1997, Science (halaman tiruan)
    s4 = Scene(bg_paper(seed=43), [(a(11.5), .58, .5, 1.1), (a(19.2), .48, .5, 1.0)],
               [Item(journal_page("Science", "A Neural Substrate of Prediction and Reward", "W. Schultz, P. Dayan & P. R. Montague",
                                  "1997", 780, 5, hl=6), 1580, 680, a(11.6), angle=1.5),
                Item(index_card("WOLFRAM SCHULTZ", "ahli saraf", "", 720, 4), 660, 640, a(14.6), angle=-2.5)],
               [dyn_keyword("1997", a(11.9), a(14.4))])
    shots.append(s4.shot(a(11.5), a(19.2)))

    # 5. Monyet + setetes jus
    def drop(fr, t, c):
        p = prog(t, a(22.2), a(23.0))
        if 0 < p < 1:
            x, y = c.pt(1520, 330 + 360 * ease(p) ** 1.6)
            import cv2
            cv2.circle(fr, (int(x), int(y)), max(4, int(16 * c.s)), (0.62, 0.38, 0.14), -1, cv2.LINE_AA)
    s5 = Scene(bg_dark(seed=44), [(a(18.9), .45, .5, 1.0), (a(25.4), .52, .45, 1.08)],
               [Item(cut("LK02_monyet-rhesus_nobg.png", 900, 0.6), 1050, 760, a(18.9)),
                Item(note_card("JUS", 300, 56, seed=12), 1520, 260, a(21.0)),
                Item(note_card("DOPAMIN AKTIF", 560, 56, tone=(240, 220, 200), color=(150, 30, 24), seed=13), 1700, 900, a(24.2))],
               [drop])
    shots.append(s5.shot(a(18.9), a(25.4)))

    # 6. Diagram 3 baris (aktivitas sel dopamin)
    rows = [420, 760, 1100]
    xL, xJ, x0, x1 = 1020, 1640, 760, 2160

    def trace(y, spikes, dips=()):
        xs = np.linspace(x0, x1, 300)
        ys = np.full_like(xs, y, dtype=np.float32)
        r = np.random.default_rng(int(y))
        ys += r.normal(0, 3, xs.shape)
        for sx in spikes:
            ys -= 150 * np.exp(-((xs - sx) / 26) ** 2)
        for dx in dips:
            ys += 90 * np.exp(-((xs - dx) / 60) ** 2)
        return np.stack([xs, ys], 1)

    dyn6 = []
    labels = [("jus tiba-tiba", a(25.3), trace(rows[0], [xJ]), a(25.4)),
              ("lampu, lalu jus", a(28.0), trace(rows[1], [xL]), a(30.0)),
              ("lampu, jus tak datang", a(34.0), trace(rows[2], [xL], [xJ]), a(34.8))]
    for (lab, tl, tr, td), y in zip(labels, rows):
        dyn6.append(dyn_text(lab, 230, y, tl, 46, anchor="lm"))
        dyn6.append(dyn_poly(tr, td, 2.8, RED if "tak datang" in lab else INK, 6))
    items6 = []
    for y, t0 in zip(rows[1:], [a(28.0), a(34.0)]):
        items6.append(Item(note_card("LAMPU", 260, 40, seed=14), xL, y - 250, t0))
    items6.append(Item(note_card("JUS", 220, 40, seed=15), xJ, rows[0] - 250, a(25.3)))
    items6.append(Item(note_card("JUS", 220, 40, seed=16), xJ, rows[1] - 250, a(32.6)))
    items6.append(Item(note_card("JUS?", 240, 40, seed=17), xJ, rows[2] - 250, a(35.5)))
    dyn6.append(dyn_circle(xJ, rows[2] + 60, 150, 90, a(37.4), seed=6, width=8))
    s6 = Scene(bg_paper(seed=45), [(a(25.2), .5, .5, 1.0), (a(29.5), .5, .46, 1.06), (a(33.5), .5, .56, 1.08),
                                   (a(39.0), .52, .62, 1.1)], items6, dyn6)
    shots.append(s6.shot(a(25.2), a(39.0)))

    # 7. HARAPAN vs KEPEMILIKAN
    s7 = Scene(bg_paper(seed=46), [(a(38.8), .5, .5, 1.0), (a(44.6), .5, .5, 1.06)],
               [Item(two_col_card(), 1200, 675, a(38.8))],
               [dyn_highlight(640, 610, 1080, 740, a(41.8), 0.8), dyn_line((1300, 680), (1800, 680), a(43.9), 0.6, RED, 10)])
    shots.append(s7.shot(a(38.8), a(44.6)))

    # 8–9. Kopi yang sama tiap pagi; paket di depan pintu
    shots.append(shot_vid(a(44.4), a(48.8), "FT05_tuang-kopi.mp4", ss=2.0, z0=1.0, z1=1.05))
    shots.append(shot_vid(a(48.6), a(56.2), "FT06_paket-di-pintu.mp4", ss=0.5, z0=1.0, z1=1.04, portrait=True))

    # 10. Benang merah: DOPAMIN -> EVOLUSI?
    s10 = Scene(bg_cork(), [(a(56.0), .5, .5, 1.0), (a(59.1), .52, .5, 1.06)],
                [Item(note_card("DOPAMIN", 560, 64, seed=18), 700, 640, a(56.0), angle=-2),
                 Item(note_card("EVOLUSI?", 560, 64, seed=19), 1700, 640, a(57.0), angle=2),
                 Item(pin_sp(), 700, 560, a(56.1), anim="drop"), Item(pin_sp(), 1700, 560, a(57.1), anim="drop")],
                [dyn_line((700, 560), (1700, 560), a(57.2), 1.0, (150, 20, 18), 5, wobble=40)])
    shots.append(s10.shot(a(56.0), a(59.1)))

    # 11. David Buss + American Psychologist 2000 (+ stempel HIPOTESIS dipakai lagi nanti)
    s11 = Scene(bg_paper(seed=47), [(a(58.9), .55, .5, 1.08), (a(66.0), .48, .5, 1.0), (a(80.0), .5, .5, 1.0),
                                    (a(86.0), .52, .48, 1.08)],
                [Item(journal_page("American Psychologist", "The Evolution of Happiness", "D. M. Buss", "2000", 780, 7, hl=3),
                      1580, 680, a(59.0), angle=-1.5),
                 Item(index_card("DAVID BUSS", "psikolog evolusioner", "", 720, 5), 660, 640, a(61.8), angle=2),
                 Item(stamp_sp("HIPOTESIS", 130, -9, 8), 1200, 700, a(80.8), anim="stamp")])
    shots.append(s11.shot(a(58.9), a(66.0)))

    # 12–13. Lukisan gua Lascaux; Zaman Batu (Vasnetsov)
    shots.append(shot_img(a(65.8), a(70.1), "LS07_lukisan-gua-lascaux.jpg", 1.0, 1.07, (0.45, 0.5), (0.55, 0.48)))
    shots.append(shot_img(a(69.9), a(80.1), "LS08_zaman-batu-vasnetsov.jpg", 1.02, 1.06, (0.25, 0.5), (0.62, 0.48)))

    # 14. Kembali ke kartu Buss: cap HIPOTESIS
    shots.append(s11.shot(a(79.9), a(86.1)))

    # 15. Otak dipin di tengah papan, benang ke semua bukti
    s15 = Scene(bg_cork(), [(a(85.9), .5, .5, 1.25), (DUR, .5, .5, 1.0)],
                [Item(photo("LS06_gray-otak.png", 900, grade=0.45, angle=-2), 1200, 680, a(85.9)),
                 Item(note_card("DOPAMIN", 460, 56, seed=20), 420, 330, a(86.0), angle=-3),
                 Item(note_card("HARAPAN", 460, 56, seed=21), 2000, 330, a(86.0), angle=2),
                 Item(note_card("EVOLUSI?", 460, 56, seed=22), 420, 1050, a(86.0), angle=2),
                 Item(stamp_sp("HIPOTESIS", 80, -6, 9), 2000, 1050, a(86.0)),
                 Item(pin_sp(), 1200, 400, a(85.9)), Item(pin_sp(), 420, 290, a(86.0)), Item(pin_sp(), 2000, 290, a(86.0)),
                 Item(pin_sp(), 420, 1010, a(86.0))],
                [dyn_line((1200, 400), (420, 290), a(87.0), 1.0, (150, 20, 18), 5, wobble=30),
                 dyn_line((1200, 400), (2000, 290), a(87.6), 1.0, (150, 20, 18), 5, wobble=30, seed=2),
                 dyn_line((1200, 400), (420, 1010), a(88.2), 1.0, (150, 20, 18), 5, wobble=-30, seed=3),
                 dyn_line((1200, 400), (2000, 1010), a(88.8), 1.0, (150, 20, 18), 5, wobble=-30, seed=4)])
    shots.append(s15.shot(a(85.9), DUR))

    return Section("04_tersangka-otak", DUR, shots, fade_from_black=0.5, fade_to_black=0.6)


def audio_events() -> list[Ev]:
    g = lambda x: OFF + a(x)  # noqa: E731
    return [
        Ev("vo/VO04_tersangka-otak.mp3", OFF + A, 2.5, bus="vo"),
        Ev("SFX12_pin-papan.mp3", g(0.1), -24), Ev("SFX12_pin-papan.mp3", g(0.4), -25), Ev("SFX12_pin-papan.mp3", g(0.7), -24),
        Ev("SFX08_foto-diletakkan.mp3", g(2.1), -26),
        Ev("SFX08_foto-diletakkan.mp3", g(4.6), -26),
        Ev("SFX13_spidol.mp3", g(5.3), -22),
        Ev("SFX08_foto-diletakkan.mp3", g(8.2), -25),
        Ev("SFX13_spidol.mp3", g(9.9), -20), Ev("SFX13_spidol.mp3", g(10.2), -21),
        Ev("SFX07_kertas-dibalik.mp3", g(11.6), -23),
        Ev("SFX08_foto-diletakkan.mp3", g(14.6), -25),
        Ev("SFX06_whoosh-udara.mp3", g(18.6), -29),
        Ev("SFX16_tetes-jus.mp3", g(22.7), -20),
        Ev("SFX14_pensil-grafik.mp3", g(25.4), -25), Ev("SFX17_klik-lampu.mp3", g(28.0), -22),
        Ev("SFX14_pensil-grafik.mp3", g(30.0), -25), Ev("SFX17_klik-lampu.mp3", g(34.0), -22),
        Ev("SFX14_pensil-grafik.mp3", g(34.8), -25), Ev("SFX13_spidol.mp3", g(37.4), -22),
        Ev("SFX13_spidol.mp3", g(41.8), -24), Ev("SFX13_spidol.mp3", g(43.9), -21),
        Ev("SFX05_whoosh-lembut.mp3", g(44.2), -30),
        Ev("SFX05_whoosh-lembut.mp3", g(55.8), -30),
        Ev("SFX12_pin-papan.mp3", g(56.1), -24), Ev("SFX12_pin-papan.mp3", g(57.1), -24),
        Ev("SFX07_kertas-dibalik.mp3", g(59.0), -23), Ev("SFX08_foto-diletakkan.mp3", g(61.8), -25),
        Ev("SFX02_proyektor-film.mp3", g(65.8), -31, dur=14.5, fade_in=1.5, fade_out=2.0, bus="bed"),
        Ev("SFX11_stempel.mp3", g(80.8), -15),
        Ev("sfx_tambahan/freesound_community-small-wood-block-64458.mp3", g(80.8), -23, dur=0.5, fade_out=0.2),
        Ev("SFX12_pin-papan.mp3", g(86.0), -25),
    ]
