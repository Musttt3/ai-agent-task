"""BAGIAN 1–2: Hook + Pembuka/Judul."""
from __future__ import annotations

import sys
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from engine import (BEBAS, FPS, H, INK, RED, TYPE, W, Footage, Section, Shot, archival_grade, blit, camera,
                    draw_poly_progress, draw_text, ease, ease_out, footage_frame, hand_ellipse_pts, kenburns,
                    keyword, lerp, load_rgb, paper_texture, photo_print, pil_to_f, prog, shadowed, stamp,
                    wood_texture)
from props import board_teaser, icon_envelope, icon_house, icon_phone, manila_folder
from timeline import Ev, vo

WW, WH = 2400, 1350  # ukuran 'world' untuk adegan meja/kolase
Z = W / WW           # zoom yang membuat world pas layar


# ---------------------------------------------------------------- adegan meja + foto (shot C)
@lru_cache(None)
def desk_world():
    world = Image.fromarray((wood_texture(WW, WH) * 255).astype(np.uint8)).convert("RGBA")
    folder = shadowed(manila_folder(1500, 1000).rotate(-2.5, expand=True, resample=Image.BICUBIC), blur=22, offset=(14, 20))
    world.alpha_composite(folder, (int(WW / 2 - folder.width / 2 - 60), int(WH / 2 - folder.height / 2 + 30)))
    pr = photo_print("LS03_undian-lotre-1809.jpg", 980, border=26, seed=3)
    pr = shadowed(pr.rotate(2.2, expand=True, resample=Image.BICUBIC), blur=14, offset=(10, 14))
    px, py = int(WW / 2 - pr.width / 2 + 120), int(WH / 2 - pr.height / 2 + 70)
    world.alpha_composite(pr, (px, py))
    arr = np.asarray(world.convert("RGB"), np.float32) / 255.0
    # pusat lingkaran: kerumunan di bagian bawah-tengah gravir
    circ = (px + pr.width * 0.50, py + pr.height * 0.62)
    return arr, circ


def shot_desk(t0, t1, circle_at, q_at):
    world, (ccx, ccy) = desk_world()
    pts = hand_ellipse_pts(ccx, ccy, 330, 200, seed=4)
    q = pil_to_f(stamp("?", size=260, angle=10, border=False, seed=9))

    def draw(t, u, i):
        w = world.copy()
        draw_poly_progress(w, pts, ease(prog(t, circle_at, circle_at + 1.3)), width=9)
        qa = ease(prog(t, q_at, q_at + 0.6))
        if qa > 0:
            blit(w, q, (ccx + 360, ccy - 170), lerp(1.08, 1.0, ease_out(prog(t, q_at, q_at + 0.6))), 0, qa)
        cx = lerp(WW / 2 + 40, ccx + 60, ease(u))
        cy = lerp(WH / 2 + 30, ccy - 40, ease(u))
        return camera(w, cx, cy, Z * lerp(1.06, 1.13, ease(u)))
    return Shot(t0, t1, draw, fade_in=0.9, name="meja-foto")


# ---------------------------------------------------------------- kolase gaji/ponsel/rumah (shot D)
@lru_cache(None)
def collage_world():
    return paper_texture(WW, WH, seed=31, dark_edges=0.4)


@lru_cache(None)
def collage_sprites():
    return [pil_to_f(shadowed(icon_envelope(), blur=16, offset=(10, 16), alpha=0.5)),
            pil_to_f(shadowed(icon_phone(), blur=16, offset=(10, 16), alpha=0.5)),
            pil_to_f(shadowed(icon_house(), blur=16, offset=(10, 16), alpha=0.5))]


def shot_collage(t0, t1, appear, fade_at):
    base = collage_world()
    sprites = collage_sprites()
    pos = [(560, 720, -4), (1200, 640, 3), (1860, 700, -2)]

    def draw(t, u, i):
        w = base.copy()
        pale = ease(prog(t, fade_at, fade_at + 1.8))
        for k, (spr, (x, y, ang)) in enumerate(zip(sprites, pos)):
            a = ease(prog(t, appear[k], appear[k] + 0.7))
            if a <= 0:
                continue
            sc = lerp(0.95, 1.0, ease(prog(t, appear[k], appear[k] + 0.9)))
            drift = (k - 1) * 18 * ease(u)  # parallax lembut
            blit(w, spr, (x + drift, y), sc * 0.95, ang, a * (1 - 0.62 * pale))
        if pale > 0:  # warna memudar ke sepia pucat
            g = archival_grade(w, 1.0, 0.9)
            w = w * (1 - pale) + (g * 0.85 + 0.12) * pale
        z = lerp(1.07, 1.0, ease(u))
        return camera(w, WW / 2, WH / 2, Z * z)
    return Shot(t0, t1, draw, fade_in=0.9, name="kolase")


# ---------------------------------------------------------------- footage helpers
def shot_footage(t0, t1, name, ss=0.0, z0=1.0, z1=1.06, c0=(0.5, 0.5), c1=(0.5, 0.5), fade=0.8, grade=0.72,
                 portrait=False, speed=1.0):
    holder = {}

    def draw(t, u, i):
        if "f" not in holder:
            holder["f"] = Footage(name, start=ss, portrait_fill=portrait, speed=speed)
        return footage_frame(holder["f"], i, u, z0, z1, c0, c1, grade)
    return Shot(t0, t1, draw, fade_in=fade, name=name)


def shot_image(t0, t1, name, z0=1.0, z1=1.06, c0=(0.5, 0.5), c1=(0.5, 0.5), fade=0.8, grade=0.78):
    holder = {}

    def draw(t, u, i):
        if "img" not in holder:
            holder["img"] = load_rgb(name, 3400, grade)
        return kenburns(holder["img"], u, z0, z1, c0, c1)
    return Shot(t0, t1, draw, fade_in=fade, name=name)


def shot_board(t0, t1, z0=0.66, z1=0.74, c0=(0.5, 0.5), c1=(0.52, 0.48), fade=0.9):
    def draw(t, u, i):
        world, _ = board_teaser()
        hh, ww = world.shape[:2]
        e = ease(u)
        return camera(world, lerp(c0[0], c1[0], e) * ww, lerp(c0[1], c1[1], e) * hh, lerp(z0, z1, e))
    return Shot(t0, t1, draw, fade_in=fade, name="papan")


# ---------------------------------------------------------------- judul (shot H)
TITLE = ["MENGAPA MANUSIA", "TIDAK PERNAH", "MERASA CUKUP?"]


@lru_cache(None)
def title_world():
    world = Image.fromarray((wood_texture(WW, WH, seed=8) * 255).astype(np.uint8)).convert("RGBA")
    folder = shadowed(manila_folder(1760, 1120).rotate(-1.2, expand=True, resample=Image.BICUBIC), blur=24, offset=(14, 22))
    fx, fy = int(WW / 2 - folder.width / 2), int(WH / 2 - folder.height / 2 + 40)
    world.alpha_composite(folder, (fx, fy))
    return np.asarray(world.convert("RGB"), np.float32) / 255.0, (fx, fy)


def shot_title(t0, t1, type_start, type_end, stamp_at):
    world, (fx, fy) = title_world()
    st = pil_to_f(stamp("TERBUKA", size=120, angle=-9, seed=12))
    total = sum(len(s) for s in TITLE)

    def draw(t, u, i):
        w = world.copy()
        n = int(round(total * prog(t, type_start, type_end)))
        y = fy + 430
        for line in TITLE:
            k = max(0, min(len(line), n))
            n -= len(line)
            if k:
                draw_text(w, line[:k], (fx + 230, y), TYPE, 118, INK, 0.93)
            y += 150
        # kursor ketik berkedip saat mengetik
        sa = ease(prog(t, stamp_at, stamp_at + 0.22))
        if sa > 0:
            blit(w, st, (fx + 1450, fy + 330), lerp(1.22, 1.0, ease_out(prog(t, stamp_at, stamp_at + 0.25))), 0, sa)
        z = lerp(1.04, 1.12, ease(u))
        return camera(w, lerp(WW / 2, WW / 2 + 40, ease(u)), lerp(WH / 2 + 20, WH / 2 + 60, ease(u)), Z * z)
    return Shot(t0, t1, draw, fade_in=0.9, name="judul")


# ---------------------------------------------------------------- susun bagian
def build() -> Section:
    v1, v2 = vo("VO01_hook"), vo("VO02_pembuka")
    T_END = 40.0
    shots = [
        # "tiga psikolog mendatangi..." -> foto arsip tiga peneliti mencatat (CDC/NIOSH, 1970, domain publik)
        shot_image(0.0, v1.at("orang") + 0.6, "LK15_tiga-peneliti-1970.jpg", 1.0, 1.08, (0.5, 0.5), (0.4, 0.5),
                   fade=0, grade=0.6),
        # "...orang-orang yang baru saja menang lotre" -> tabung bola undian (crop rapat)
        shot_image(v1.at("orang") - 0.2, 8.4, "LK01_mesin-undian-lotre.jpg", 2.6, 2.72, (0.625, 0.71), (0.63, 0.70),
                   fade=0.8),
        shot_footage(v1.at("Uang") - 0.45, v1.at("Tapi") + 0.5, "FT01_uang-jatuh.mp4", ss=1.5, z0=1.12, z1=1.17, c0=(0.5, 0.6), c1=(0.5, 0.62), fade=0.7),
        shot_desk(v1.at("Tapi") + 0.1, v2.start - 0.1, circle_at=v1.at("kebahagiaan") - 0.2, q_at=v1.at("heran")),
        shot_collage(v2.start - 0.4, v2.at("Kenapa", 2) - 0.1,
                     appear=[v2.at("Gaji"), v2.at("ponsel"), v2.at("rumah")], fade_at=v2.at("tapi")),
        shot_footage(v2.at("Kenapa", 2) - 0.5, v2.at("Hari") + 0.3, "FT02_ponsel-malam.mp4", ss=2.0, z0=1.0, z1=1.06,
                     c0=(0.5, 0.5), c1=(0.55, 0.5)),
        shot_footage(v2.at("Hari") - 0.2, v2.at("selama") + 0.2, "FT14_membuka-buku.mp4", ss=1.2, z0=1.0, z1=1.05),
        shot_board(v2.at("selama") - 0.4, v2.at("Berkas", 2) + 0.4),
        shot_title(v2.at("Berkas", 2) - 0.1, T_END, type_start=v2.at("Berkas", 2) + 0.3,
                   type_end=v2.at("cukup", edge="e") + 0.2, stamp_at=v2.at("cukup", edge="e") + 0.9),
    ]
    sec = Section("01_hook-pembuka", T_END, shots, fade_from_black=1.4, fade_to_black=0.6)
    kw = [("ILLINOIS, 1978", v1.at("Tahun") + 0.6, v1.at("lotre") + 0.9)]

    def overlay(frame, t):
        for text, a, b in kw:
            keyword(frame, text, t, a, b, pos=(130, 930))
    sec.overlays.append(overlay)
    return sec


def audio_events() -> list[Ev]:
    v1, v2 = vo("VO01_hook"), vo("VO02_pembuka")
    sec = build()
    sh = {s.name: s for s in sec.shots}
    st = stamp_time = v2.at("cukup", edge="e") + 0.9
    ev = [
        Ev("vo/VO01_hook.mp3", v1.start, 2.5, bus="vo"),
        Ev("vo/VO02_pembuka.mp3", v2.start, 2.5, bus="vo"),
        Ev("MUSIK01_misteri-tenang.mp3", 0.0, -4, fade_in=4.0, dur=40.0, bus="bed"),
        Ev("SFX01_room-tone.mp3", 0.0, -20, dur=40.0, loop=True, fade_in=1.5, bus="bed"),
        Ev("SFX02_proyektor-film.mp3", 0.0, -27, dur=8.6, fade_in=1.0, fade_out=1.5, bus="bed"),
        Ev("SFX03_bola-lotre.mp3", 0.3, -26, dur=7.6, fade_in=1.2, fade_out=1.8),
        Ev("SFX04_uang-kertas.mp3", v1.at("Uang") - 0.2, -24),
        Ev("SFX05_whoosh-lembut.mp3", v1.at("Tapi") - 0.35, -27),
        Ev("SFX08_foto-diletakkan.mp3", v1.at("Tapi") + 0.5, -24),
        Ev("SFX13_spidol.mp3", v1.at("kebahagiaan") - 0.15, -22),
        Ev("SFX13_spidol.mp3", v1.at("heran"), -24),
        Ev("SFX06_whoosh-udara.mp3", v2.start - 0.6, -28),
        Ev("SFX08_foto-diletakkan.mp3", v2.at("Gaji") - 0.05, -26),
        Ev("SFX08_foto-diletakkan.mp3", v2.at("ponsel") - 0.05, -27),
        Ev("SFX08_foto-diletakkan.mp3", v2.at("rumah") - 0.05, -26),
        Ev("SFX05_whoosh-lembut.mp3", v2.at("Kenapa", 2) - 0.7, -29),
        Ev("SFX15_map-dibuka.mp3", v2.at("buka") - 0.1, -22),
        Ev("SFX12_pin-papan.mp3", v2.at("selama") + 0.4, -26),
        Ev("SFX06_whoosh-udara.mp3", v2.at("Berkas", 2) - 0.5, -28),
        Ev("SFX09_mesin-ketik-judul.mp3", v2.at("Berkas", 2) + 0.3, -21, ss=2.0,
           dur=v2.at("cukup", edge="e") - v2.at("Berkas", 2) - 0.1, fade_out=0.3),
        Ev("SFX10_bel-mesin-ketik.mp3", v2.at("cukup", edge="e") + 0.25, -22),
        Ev("SFX11_stempel.mp3", st - 0.02, -14),
        Ev("sfx_tambahan/freesound_community-small-wood-block-64458.mp3", st - 0.02, -22, ss=0.0, dur=0.5, fade_out=0.2),
        Ev("SFX08_foto-diletakkan.mp3", st, -26),
    ]
    return ev
