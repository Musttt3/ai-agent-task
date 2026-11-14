"""BAGIAN 3 — LATAR: Bukti #1, treadmill hedonis & studi lotre (global 40.0–114.4)."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from engine import INK, RED, TYPE, Section
from shots import (Item, Scene, bg_cork, bg_image, bg_paper, bg_wood, cut, dyn_axes, dyn_bar, dyn_circle, dyn_highlight,
                   dyn_keyword, dyn_poly, dyn_text, empty_frame, index_card, journal_page, map_pin, note_card,
                   photo, shot_img, shot_vid, stamp_sp)
from timeline import SECTIONS, Ev, vo

OFF, END = SECTIONS["sec03"]
DUR = END - OFF
v = vo("VO03_latar", OFF)
A = v.start  # waktu lokal awal narasi bagian ini


def a(x):  # waktu kata di transkripsi -> waktu lokal
    return A + x


def build() -> Section:
    shots = []

    # 1. Papan: kartu BUKTI #1
    s1 = Scene(bg_cork(), [(0, .45, .5, 1.0), (a(2.0), .5, .48, 1.12)],
               [Item(note_card("BUKTI #1", 520, 76, seed=1), 1200, 640, a(0.2), anim="fade"),
                Item(map_pin(22), 1200, 470, a(0.6), anim="drop")])
    shots.append(s1.shot(0, a(2.4), fade=0))

    # 2. Meja kertas: kartu Brickman & Campbell + halaman esai 1971
    s2 = Scene(bg_paper(seed=33), [(a(1.9), .62, .5, 1.12), (a(5.8), .6, .5, 1.1), (a(11.4), .5, .5, 1.0)],
               [Item(index_card("PHILIP BRICKMAN", "psikolog", "", 700, 1), 620, 470, a(6.1), angle=-3),
                Item(index_card("DONALD T. CAMPBELL", "psikolog", "", 700, 2), 640, 900, a(7.0), angle=2),
                Item(journal_page("Adaptation-Level Theory", "Hedonic Relativism and Planning the Good Society",
                                  "P. Brickman & D. T. Campbell", "1971", 760, 3, hl=4), 1560, 690, a(2.4), angle=1.5)],
               [dyn_keyword("1971", a(2.6), a(7.5)), dyn_highlight(1220, 520, 1900, 560, a(8.2), 1.0)])
    shots.append(s2.shot(a(1.9), a(11.6)))

    # 3. Mata (Gray 869) di kartu kertas
    s3 = Scene(bg_paper(seed=34), [(a(11.4), .5, .5, 1.0), (a(17.7), .52, .48, 1.1)],
               [Item(photo("LS04_gray-mata.png", 1100, grade=0.5), 1200, 660, a(11.5), angle=-1.5)])
    shots.append(s3.shot(a(11.4), a(17.8)))

    # 4. Hidung (Gray 771)
    s4 = Scene(bg_paper(seed=35), [(a(17.6), .5, .52, 1.0), (a(21.0), .48, .5, 1.07)],
               [Item(photo("LS05_gray-hidung.png", 1000, grade=0.5), 1200, 660, a(17.6), angle=2)])
    shots.append(s4.shot(a(17.6), a(21.1)))

    # 5. Membuka kado
    shots.append(shot_vid(a(20.8), a(25.4), "FT03_membuka-kado.mp4", ss=3.0, z0=1.0, z1=1.06))

    # 6. Treadmill Brixton (gravir, potret -> pan vertikal)
    shots.append(shot_img(a(25.1), a(29.2), "LS01_treadmill-brixton-1817.jpg", 1.0, 1.05, (0.5, 0.30), (0.5, 0.42)))

    # 7. Treadmill Wellcome: close-up kaki + lingkaran merah
    s7 = Scene(bg_image("LS02_treadmill-wellcome.jpg", 3000, 0.8),
               [(a(29.0), .5, .22, 1.0), (a(34.6), .52, .32, 1.12)],
               dyn=[dyn_circle(1100, 1170, 330, 230, a(30.4), seed=7, width=9)])
    shots.append(s7.shot(a(29.0), a(34.6)))

    # 8. Peta Illinois + pin Chicago
    im = bg_image("PT01_peta-illinois-1850.jpg", 3000, 0.55)
    hh, ww = im.shape[:2]
    s8 = Scene(im, [(a(34.4), .55, .35, 1.25), (a(38.8), .72, .2, 1.9)],
               [Item(map_pin(30), ww * .775, hh * .175 - 30, a(35.8), anim="drop")],
               [dyn_keyword("ILLINOIS, 1978", a(36.0), a(38.6))])
    shots.append(s8.shot(a(34.4), a(38.9)))

    # 9. 22 pemenang vs 22 tetangga: grid siluet polaroid
    items = []
    fr = empty_frame(260, 320, "", 0)
    for g, (x0, t0) in enumerate([(380, a(39.6)), (1340, a(42.6))]):
        for k in range(22):
            r, c = divmod(k, 6)
            items.append(Item(fr, x0 + c * 120 + (r % 2) * 30, 330 + r * 190 + (c % 2) * 10, t0 + k * 0.06,
                              scale=0.42, angle=((k * 37) % 9) - 4, anim="fade", dur=0.5))
    items.append(Item(note_card("PEMENANG LOTRE", 620, 50, seed=4), 690, 1150, a(40.6)))
    items.append(Item(note_card("TETANGGA", 520, 50, seed=5), 1650, 1150, a(43.6)))
    s9 = Scene(bg_paper(seed=36), [(a(38.7), .45, .5, 1.04), (a(45.4), .55, .5, 1.0)], items,
               [dyn_poly([(1200, 230), (1200, 1250)], a(42.4), 1.0, width=6)])
    shots.append(s9.shot(a(38.7), a(45.4)))

    # 10. Grafik batang 4,00 vs 3,82 (skala 0–5)
    s10 = Scene(bg_paper(seed=37), [(a(45.2), .5, .5, 1.0), (a(49.5), .5, .52, 1.05)], [],
                [dyn_axes(700, 280, 1750, 1080, a(45.3), "", "skala kebahagiaan 0–5"),
                 dyn_bar(980, 1080, 260, 800 * 4.00 / 5, a(45.8), 1.5, (110, 84, 58), "Pemenang", "4,00"),
                 dyn_bar(1460, 1080, 260, 800 * 3.82 / 5, a(46.4), 1.5, (150, 128, 96), "Tetangga", "3,82")])
    shots.append(s10.shot(a(45.2), a(49.5)))

    # 11. Mengobrol sambil minum kopi
    shots.append(shot_vid(a(49.3), a(56.6), "FT04_ngobrol-kopi.mp4", ss=0.5, z0=1.0, z1=1.05, portrait=True))

    # 12. Catatan: sampel kecil (stempel)
    s12 = Scene(bg_paper(seed=38), [(a(56.4), .5, .5, 1.0), (a(59.6), .5, .5, 1.06)],
                [Item(note_card("n = 22", 640, 92, seed=6), 1200, 640, a(56.5)),
                 Item(stamp_sp("CATATAN", 120, -7, 3), 1450, 430, a(57.0), anim="stamp")])
    shots.append(s12.shot(a(56.4), a(59.6)))

    # 13. Peta Swedia + pin (studi 2020)
    im2 = bg_image("PT02_peta-swedia-1850.jpg", 3000, 0.55)
    h2, w2 = im2.shape[:2]
    s13 = Scene(im2, [(a(59.4), .45, .55, 1.0), (a(65.8), .48, .61, 1.5)],
                [Item(map_pin(30), w2 * .475, h2 * .628 - 30, a(60.4), anim="drop")],
                [dyn_keyword("SWEDIA, 2020", a(60.6), a(65.4))])
    shots.append(s13.shot(a(59.4), a(65.8)))

    # 14. Grafik: lonjakan rasa senang lalu turun lagi
    xs = np.linspace(0, 1, 160)
    base_y, x0, x1 = 900, 520, 1900
    yv = [base_y - 520 * (1 - np.exp(-((u - 0.18) / 0.03) ** 2) * 0 if u < 0.18 else 0) for u in xs]
    yv = []
    for u in xs:
        if u < 0.2:
            y = 0.0
        elif u < 0.26:
            y = (u - 0.2) / 0.06
        else:
            y = np.exp(-(u - 0.26) / 0.18)
        yv.append(base_y - 560 * y)
    pts = np.stack([x0 + (x1 - x0) * xs, yv], 1)
    s14 = Scene(bg_paper(seed=39), [(a(65.5), .5, .5, 1.0), (DUR, .55, .48, 1.08)], [],
                [dyn_axes(x0, 260, x1, base_y + 2, a(65.6), "waktu", "rasa senang"),
                 dyn_poly([(x0, base_y), (x1, base_y)], a(66.2), 0.8, (120, 110, 100), 3),
                 dyn_text("garis dasar", x0 + 190, base_y - 34, a(66.8), 38, color=(90, 80, 70)),
                 dyn_poly(pts, a(67.8), 3.8, RED, 8)])
    shots.append(s14.shot(a(65.5), DUR))

    sec = Section("03_latar", DUR, shots, fade_from_black=0.5, fade_to_black=0.6)
    return sec


def audio_events() -> list[Ev]:
    g = lambda x: OFF + a(x)  # noqa: E731  waktu transkripsi -> global
    return [
        Ev("vo/VO03_latar.mp3", OFF + A, 2.5, bus="vo"),
        Ev("SFX12_pin-papan.mp3", g(0.6), -24),
        Ev("SFX07_kertas-dibalik.mp3", g(1.9), -26),
        Ev("SFX08_foto-diletakkan.mp3", g(6.1), -25),
        Ev("SFX08_foto-diletakkan.mp3", g(7.0), -26),
        Ev("SFX07_kertas-dibalik.mp3", g(8.0), -23),
        Ev("SFX08_foto-diletakkan.mp3", g(11.5), -27),
        Ev("SFX08_foto-diletakkan.mp3", g(17.6), -27),
        Ev("SFX05_whoosh-lembut.mp3", g(24.8), -29),
        Ev("SFX02_proyektor-film.mp3", g(25.1), -30, dur=9.5, fade_in=1.0, fade_out=1.5, bus="bed"),
        Ev("SFX13_spidol.mp3", g(30.4), -22),
        Ev("SFX12_pin-papan.mp3", g(35.8), -22),
        Ev("sfx_tambahan/freesound_community-polaroid-foley-30001.mp3", g(39.6), -28, ss=0.0, dur=3.0, fade_out=0.8),
        Ev("sfx_tambahan/freesound_community-polaroid-foley-30001.mp3", g(42.6), -29, ss=3.0, dur=2.5, fade_out=0.8),
        Ev("SFX14_pensil-grafik.mp3", g(45.6), -24),
        Ev("SFX14_pensil-grafik.mp3", g(46.4), -26),
        Ev("SFX06_whoosh-udara.mp3", g(49.0), -29),
        Ev("SFX11_stempel.mp3", g(57.0), -15),
        Ev("sfx_tambahan/freesound_community-small-wood-block-64458.mp3", g(57.0), -23, dur=0.5, fade_out=0.2),
        Ev("SFX12_pin-papan.mp3", g(60.4), -22),
        Ev("SFX14_pensil-grafik.mp3", g(67.8), -24),
        Ev("SFX14_pensil-grafik.mp3", g(69.3), -26),
    ]
