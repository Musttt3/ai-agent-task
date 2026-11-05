# Set SEKOLAH: ruang kelas terang (meja kayu, layar pintar di depan, rak buku, jendela besar dengan pohon).
#   blender -b --python sets/build_sekolah.py -> sets/sekolah.blend      Shot 13 (dolly maju dari pojok belakang).
# Kelas 8 x 7 m, tinggi 3,2 m. Papan/layar di dinding depan y=+3.5, jendela besar di dinding kiri x=-4.
import bpy, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
import lib
def part(c, *a, **kw):
    if a[0] in ("box", "cyl", "cone", "sph", "ico", "torus", "plane"): return lib.part(c, *a, **kw)
    kind = "ico" if "subdivisions" in kw else "cyl" if "depth" in kw else "sph" if "radius" in kw else "box"
    return lib.part(c, kind, *a, **kw)

sc = new_scene()
SET, PROPS, CAMS, CAST, LIGHT, MARKS = (coll(n) for n in ("SET_SEKOLAH", "PROPS_SEKOLAH", "CAMERAS", "STANDINS", "LIGHTS", "MARKS"))
M = {"dinding": mat("Dinding_Kelas", color=(0.93, 0.9, 0.78), rough=0.9), "lantai": mat("Ubin", "ubin", rough=0.55),
     "kayu": mat("Kayu", "kayu", rough=0.6), "kayu_gelap": mat("Kayu_Gelap", "kayu_gelap", rough=0.6),
     "hijau": mat("Cat_Hijau_Bawah", color=(0.36, 0.6, 0.48), rough=0.8), "layar": mat("Layar_Pintar", color=(0.03, 0.04, 0.06), rough=0.2, emit=(0.6, 0.8, 1.0), emit_strength=1.4),
     "bingkai": mat("Bingkai_Layar", color=(0.1, 0.1, 0.12), rough=0.4), "daun": mat("Daun", color=(0.24, 0.52, 0.2), rough=0.8),
     "batang": mat("Batang", color=(0.38, 0.27, 0.17), rough=0.9), "buku": [mat(f"Buku_{i}", color=c, rough=0.7) for i, c in enumerate(((0.8, 0.25, 0.2), (0.2, 0.45, 0.75), (0.95, 0.75, 0.2), (0.3, 0.6, 0.35)))],
     "rumput": mat("Rumput", "rumput", rough=0.95), "plafon": mat("Plafon", color=(0.96, 0.95, 0.92), rough=0.9)}
W, D, H = 8.0, 7.0, 3.2
part(SET, "Lantai", (0, 0, -0.05), M["lantai"], (W, D, 0.1), 1.6)
part(SET, "Plafon", (0, 0, H + 0.05), M["plafon"], (W, D, 0.1))
part(SET, "Dinding_Depan", (0, D / 2 + 0.05, H / 2), M["dinding"], (W, 0.1, H), 2.0)
part(SET, "Dinding_Belakang", (0, -D / 2 - 0.05, H / 2), M["dinding"], (W, 0.1, H), 2.0)
part(SET, "Dinding_Kanan", (W / 2 + 0.05, 0, H / 2), M["dinding"], (0.1, D, H), 2.0)
for y0, y1 in ((-3.5, -2.9), (-0.5, -0.3), (2.3, 3.5)):  # left wall piers between three big windows
    part(SET, f"Dinding_Kiri_{y0}", (-W / 2 - 0.05, (y0 + y1) / 2, H / 2), M["dinding"], (0.1, y1 - y0, H))
part(SET, "Dinding_Kiri_Bawah", (-W / 2 - 0.05, 0, 0.45), M["hijau"], (0.1, D, 0.9))
part(SET, "Dinding_Kiri_Atas", (-W / 2 - 0.05, 0, 2.95), M["dinding"], (0.1, D, 0.5))
for k, yy in enumerate((-1.6, 1.0)):
    part(SET, f"Kusen_{k}", (-W / 2, yy, 1.8), M["kayu_gelap"], (0.08, 0.06, 1.8))
part(SET, "Lis_Hijau", (0, D / 2 - 0.01, 0.45), M["hijau"], (W, 0.03, 0.9))
part(PROPS, "Layar_Bingkai", (0, D / 2 - 0.04, 1.8), M["bingkai"], (2.6, 0.06, 1.5), bevel=0.03)
part(PROPS, "Layar_Pintar", (0, D / 2 - 0.08, 1.8), M["layar"], (2.4, 0.01, 1.32))
part(PROPS, "Meja_Guru", (2.2, 2.4, 0.4), M["kayu"], (1.4, 0.7, 0.8), 1.2, 0.02)
for i in range(4):  # bookshelf on the right wall
    part(PROPS, f"Rak_{i}", (W / 2 - 0.25, -1.5, 0.4 + i * 0.45), M["kayu_gelap"], (0.4, 1.8, 0.04))
    for j in range(12):
        part(PROPS, f"Buku_{i}_{j}", (W / 2 - 0.25, -2.3 + j * 0.13, 0.55 + i * 0.45), M["buku"][(i + j) % 4], (0.28, 0.08, 0.26 - 0.03 * ((i * j) % 3)))
desks = []
for r in range(3):
    for cidx in range(3):
        x, y = -2.2 + cidx * 2.0, 1.2 - r * 1.6
        part(PROPS, f"Meja_{r}_{cidx}", (x, y, 0.62), M["kayu"], (1.2, 0.55, 0.05), 1.0, 0.015)
        for dx in (-0.55, 0.55):
            for dy in (-0.22, 0.22): part(PROPS, f"Kaki_{r}_{cidx}_{dx}_{dy}", (x + dx, y + dy, 0.3), M["kayu_gelap"], (0.05, 0.05, 0.6))
        desks.append((x, y))
for k, (x, y) in enumerate([(-6.5, -1.5), (-7.5, 1.5), (-6.8, 3.5)]):  # trees outside the windows
    part(PROPS, f"Pohon_Batang_{k}", (x, y, 1.6), M["batang"], radius=0.18, depth=3.2, vertices=10)
    o = part(PROPS, f"Pohon_Tajuk_{k}", (x, y, 3.6), M["daun"], radius=1.8, subdivisions=2); o.scale = (1, 1, 0.8)
part(SET, "Halaman", (-10, 0, -0.06), M["rumput"], (12, 20, 0.1), 4.0)
# stand-ins: 5 kids (smaller) seated at desks, HERO at the classroom door (front right)
cols = [(0.85, 0.85, 0.85), (0.7, 0.62, 0.5), (0.5, 0.6, 0.72), (0.72, 0.55, 0.55), (0.55, 0.7, 0.55)]
for i, (x, y) in enumerate(desks[:5]):
    figure(CAST, f"FIG_anak_{i}", (x + (0.25 if i % 2 else -0.25), y - 0.45, 0.45), pose="sit", yaw=0, scale=0.8, color=cols[i])
figure(CAST, "HERO_13", (3.2, 3.0, 0.0), yaw=210); empty(MARKS, "MARK_13", (3.2, 3.0, 0.0))
# light: morning sun through the big windows + soft sky fill
lamp(LIGHT, "MATAHARI", "SUN", (1.0, 0.9, 0.75), 4.0, aim=(0.8, 0.25, -0.55), angle=math.radians(1.5))
lamp(LIGHT, "ISI_HANGAT", "AREA", (1.0, 0.85, 0.65), 120.0, loc=(0, 0, H - 0.1), aim=(0, 0, -1), size=4.0)
world_hdri("kloofendal_48d_partly_cloudy_puresky", 0.8)
camera(CAMS, "13", 24, (-3.4, -3.1, 1.7), (-2.6, -2.2, 1.6), (0.6, 2.4, 1.2), (0.8, 2.6, 1.2), show=[f"FIG_anak_{i}" for i in range(5)] + ["HERO_13"], focus=(0.0, 0.5, 0.9), fstop=3.2)
save("sekolah")
