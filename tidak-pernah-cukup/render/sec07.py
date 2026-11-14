"""BAGIAN 7 — PENUTUP + ajakan subscribe + layar akhir (global 479.2–556.0)."""
from __future__ import annotations

import sys
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
from engine import BEBAS, INK, RED, SERIF, TYPE, Section, font
from sec01 import TITLE, title_world
from sec05 import medal_sp, podium_sp, finish_line
from shots import (Item, Scene, _tex, bg_cork, bg_dark, bg_image, bg_paper, cut, dyn_circle, dyn_keyword, dyn_line,
                   dyn_text, empty_frame, note_card, pin_sp, shot_vid, sp, stamp_sp)
from timeline import SECTIONS, Ev, vo

OFF, END = SECTIONS["sec07"]
DUR = END - OFF
v = vo("VO07_penutup", OFF)
A = v.start


def a(x):
    return A + x


@lru_cache(None)
def parchment_quote() -> np.ndarray:
    w, h = 1700, 760
    im = _tex(w, h, (214, 190, 140), 901, 0.45)
    d = ImageDraw.Draw(im)
    f = font("PlayfairDisplay-Italic.ttf", 82)
    d.text((w / 2, h / 2 - 70), "Non qui parum habet,", font=f, fill=(60, 40, 24), anchor="mm")
    d.text((w / 2, h / 2 + 40), "sed qui plus cupit, pauper est.", font=f, fill=(60, 40, 24), anchor="mm")
    d.text((w - 120, h - 90), "— Seneca, Epistulae 2", font=font("PlayfairDisplay-Italic.ttf", 40), fill=(90, 66, 44), anchor="rm")
    return sp(im)


@lru_cache(None)
def end_slot(label: str) -> np.ndarray:
    """Bingkai 16:9 kosong untuk elemen layar akhir YouTube."""
    w, h = 820, 500
    im = _tex(w, h, (236, 228, 208), 902 + len(label), 0.2)
    d = ImageDraw.Draw(im)
    d.rectangle((24, 24, w - 24, h - 24), fill=(44, 38, 34))
    d.text((w / 2, h / 2), label, font=font(TYPE, 46), fill=(200, 186, 160), anchor="mm")
    return sp(im)


def title_scene(t_ditutup=None):
    world, (fx, fy) = title_world()
    items = [Item(stamp_sp("TERBUKA", 120, -9, 12), fx + 1450, fy + 330, -100, anim="none")]
    if t_ditutup is not None:
        items.append(Item(stamp_sp("DITUTUP", 150, 7, 41), fx + 1100, fy + 1010, t_ditutup, anim="stamp"))
    dyn = [dyn_text(line, fx + 230, fy + 430 + 150 * k, -100, 118, TYPE, INK, anchor="la") for k, line in enumerate(TITLE)]
    return world, items, dyn


def build() -> Section:
    S = []
    # 1. Map berkas di meja
    w1, it1, dy1 = title_scene()
    S.append(Scene(w1, [(0, .5, .52, 1.12), (a(5.0), .5, .5, 1.02)], it1, dy1).shot(0, a(5.0), fade=0))

    # 2. Podium: perunggu disorot (1. SADARI PEMICUNYA)
    s2 = Scene(bg_paper(seed=54), [(a(4.8), .5, .5, 1.0), (a(14.5), .6, .52, 1.1)],
               [Item(podium_sp(), 1180, 820, a(4.8)), Item(medal_sp("perak", 150), 650, 810, a(4.8)),
                Item(medal_sp("emas", 150), 1120, 390, a(4.8)), Item(medal_sp("perunggu", 150), 1590, 550, a(4.8)),
                Item(note_card("4", 180, 90, seed=24), 2150, 1020, a(4.8))],
               [dyn_circle(1590, 560, 150, 180, a(12.2), seed=21, width=9), dyn_circle(2150, 1020, 140, 110, a(13.6), seed=22, width=7),
                dyn_keyword("1. SADARI PEMICUNYA", a(5.3), a(11.6))])
    S.append(s2.shot(a(4.8), a(14.5)))

    # 3. Menulis jurnal syukur
    from shots import shot_vid as _sv
    s3a = _sv(a(14.3), a(22.2), "FT13_menulis-jurnal.mp4", ss=1.0, z0=1.0, z1=1.05)
    s3b = _sv(a(22.0), a(31.0), "FT13_menulis-jurnal.mp4", ss=14.0, z0=1.25, z1=1.32, c0=(0.45, 0.6), c1=(0.5, 0.62))
    S += [s3a, s3b]
    kw3 = Scene(bg_paper(), [(0, .5, .5, 1.0)], [], [dyn_keyword("2. LATIH RASA SYUKUR", a(14.6), a(18.4)),
                                                     dyn_keyword("EMMONS & McCULLOUGH, 2003", a(18.3), a(23.8))])

    # 4. Garis "cukup" milikmu
    s4 = Scene(bg_paper(seed=91), [(a(30.8), .5, .5, 1.0), (a(36.4), .5, .5, 1.06)],
               [Item(note_card("CUKUP", 420, 64, tone=(240, 226, 210), color=RED, seed=51), 1700, 520, a(33.6), angle=-3)],
               [dyn_line((300, 700), (2100, 700), a(32.3), 1.6, RED, 12, wobble=8),
                dyn_keyword("3. TENTUKAN 'CUKUP'-MU", a(31.5), a(36.2))])
    S.append(s4.shot(a(30.8), a(36.4)))

    # 5. Seneca
    s5 = Scene(bg_dark(seed=92), [(a(36.2), .5, .5, 1.0), (a(41.9), .45, .45, 1.08)],
               [Item(cut("TU03_seneca_nobg.png", 900, 0.55), 1350, 720, a(36.3))],
               [dyn_keyword("SENECA, ± 65 M", a(38.8), a(41.6))])
    S.append(s5.shot(a(36.2), a(41.9)))

    # 6. Perkamen: kutipan Latin
    s6 = Scene(bg_dark(seed=93), [(a(41.7), .5, .5, 1.0), (a(47.3), .5, .5, 1.1)],
               [Item(parchment_quote(), 1200, 675, a(41.8))])
    S.append(s6.shot(a(41.7), a(47.3)))

    # 7. Treadmill + garis finis
    tr = bg_image("LS01_treadmill-brixton-1817.jpg", 3400, 0.78)
    th, tw = tr.shape[:2]
    s7 = Scene(tr, [(a(47.1), .5, .36, 1.12), (a(53.5), .5, .36, 1.0)], [],
               [finish_line(a(50.3), a(50.4), tw * .72, tw * .72, th * .12, th * .5)])
    S.append(s7.shot(a(47.1), a(53.5)))

    # 8. Map berkas ditutup
    w8, it8, dy8 = title_scene(t_ditutup=a(54.5))
    s8 = Scene(w8, [(a(53.3), .5, .5, 1.0), (a(62.2), .5, .52, 1.1)], it8,
               dy8 + [dyn_keyword("KAPAN KAMU MERASA CUKUP?", a(57.9), a(61.9))])
    S.append(s8.shot(a(53.3), a(62.2)))

    # 9. Layar akhir: papan dengan slot video + subscribe
    s9 = Scene(bg_cork(), [(a(62.0), .5, .5, 1.08), (DUR, .5, .5, 1.0)],
               [Item(note_card("BERKAS BERIKUTNYA", 820, 58, seed=52), 1200, 240, a(62.2)),
                Item(end_slot("video berikutnya"), 720, 720, a(62.5), angle=-1.5),
                Item(end_slot("video lainnya"), 1680, 720, a(62.8), angle=1.5),
                Item(stamp_sp("SUBSCRIBE", 110, -6, 42), 1200, 1150, a(63.9), anim="stamp"),
                Item(pin_sp(), 720, 470, a(62.6), anim="drop"), Item(pin_sp(), 1680, 470, a(62.9), anim="drop")])
    S.append(s9.shot(a(62.0), DUR))

    sec = Section("07_penutup", DUR, S, fade_from_black=0.5, fade_to_black=1.8)
    sec.overlays.append(lambda fr, t: [d(fr, t, None) for d in kw3.dyn])
    return sec


def audio_events() -> list[Ev]:
    g = lambda x: OFF + a(x)  # noqa: E731
    return [
        Ev("vo/VO07_penutup.mp3", OFF + A, 2.5, bus="vo"),
        Ev("SFX08_foto-diletakkan.mp3", g(4.8), -26),
        Ev("SFX13_spidol.mp3", g(12.2), -23), Ev("SFX13_spidol.mp3", g(13.6), -24),
        Ev("SFX23_menulis-pena.mp3", g(14.8), -26), Ev("SFX23_menulis-pena.mp3", g(17.5), -27),
        Ev("SFX23_menulis-pena.mp3", g(22.4), -27),
        Ev("SFX13_spidol.mp3", g(32.3), -20), Ev("SFX08_foto-diletakkan.mp3", g(33.6), -25),
        Ev("SFX05_whoosh-lembut.mp3", g(36.0), -29),
        Ev("SFX07_kertas-dibalik.mp3", g(41.8), -24),
        Ev("SFX13_spidol.mp3", g(50.3), -22),
        Ev("SFX15_map-dibuka.mp3", g(53.6), -22),
        Ev("SFX11_stempel.mp3", g(54.5), -14),
        Ev("sfx_tambahan/freesound_community-small-wood-block-64458.mp3", g(54.5), -22, dur=0.5, fade_out=0.2),
        Ev("SFX12_pin-papan.mp3", g(62.6), -24), Ev("SFX12_pin-papan.mp3", g(62.9), -24),
        Ev("SFX11_stempel.mp3", g(63.9), -18),
    ]
