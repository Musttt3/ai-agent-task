# Set RUMAH SAKIT: lorong modern yang bersih dan hangat (tanaman, kursi tunggu, cahaya alami dari skylight).
#   blender -b --python sets/build_rs.py -> sets/rumah_sakit.blend      Shot 14 (lorong, dolly maju), 15 (kursi tunggu).
# Lorong sepanjang y (0..16), lebar 4 m, tinggi 3,4 m, skylight memanjang di plafon; kursi tunggu di sisi kanan.
import bpy, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
import lib
def part(c, *a, **kw):
    if a[0] in ("box", "cyl", "cone", "sph", "ico", "torus", "plane"): return lib.part(c, *a, **kw)
    kind = "ico" if "subdivisions" in kw else "cyl" if "depth" in kw else "sph" if "radius" in kw else "box"
    return lib.part(c, kind, *a, **kw)

sc = new_scene()
SET, PROPS, CAMS, CAST, LIGHT, MARKS = (coll(n) for n in ("SET_RS", "PROPS_RS", "CAMERAS", "STANDINS", "LIGHTS", "MARKS"))
M = {"dinding": mat("Dinding_RS", color=(0.94, 0.92, 0.86), rough=0.85), "lantai": mat("Lantai_Vinil", "ubin", rough=0.35),
     "kayu": mat("Kayu", "kayu", rough=0.55), "kursi": mat("Kursi_Toska", color=(0.25, 0.62, 0.6), rough=0.5),
     "logam": mat("Logam", color=(0.8, 0.8, 0.78), rough=0.3, metal=0.8), "kaca": mat("Kaca_Pintu", color=(0.7, 0.85, 0.9), rough=0.05),
     "daun": mat("Daun", color=(0.2, 0.5, 0.2), rough=0.7), "pot": mat("Pot", color=(0.85, 0.82, 0.76), rough=0.8),
     "plafon": mat("Plafon", color=(0.97, 0.96, 0.94), rough=0.9), "lis": mat("Lis_Kayu", "kayu_gelap", rough=0.6),
     "hijau": mat("Panel_Hijau", color=(0.62, 0.8, 0.66), rough=0.8)}
L, W, H = 16.0, 4.0, 3.4
part(SET, "Lantai", (0, L / 2, -0.05), M["lantai"], (W, L, 0.1), 1.2)
part(SET, "Dinding_Kiri", (-W / 2 - 0.05, L / 2, H / 2), M["dinding"], (0.1, L, H), 2.0)
part(SET, "Dinding_Kanan", (W / 2 + 0.05, L / 2, H / 2), M["dinding"], (0.1, L, H), 2.0)
part(SET, "Panel_Kanan", (W / 2 - 0.01, L / 2, 0.6), M["hijau"], (0.02, L, 1.2))
part(SET, "Panel_Kiri", (-W / 2 + 0.01, L / 2, 0.6), M["hijau"], (0.02, L, 1.2))
for side in (-1, 1): part(SET, f"Plafon_{side}", (side * 1.35, L / 2, H + 0.05), M["plafon"], (1.3, L, 0.1))
part(SET, "Ujung_Lorong", (0, L + 0.05, H / 2), M["dinding"], (W, 0.1, H))
# automatic glass doors at the far end (open on frame 836)
for side in (-1, 1):
    d = part(PROPS, f"Pintu_Otomatis_{side}", (side * 0.55, L - 0.1, 1.15), M["kaca"], (1.1, 0.05, 2.3), bevel=0.02)
    for f, x in ((826, side * 0.55), (840, side * 1.45)):
        d.location.x = x; d.keyframe_insert("location", index=0, frame=f)
for y in range(2, 16, 2):  # doors to rooms along the left wall
    part(PROPS, f"Pintu_Ruang_{y}", (-W / 2 + 0.03, y, 1.05), M["kayu"], (0.05, 1.0, 2.1), bevel=0.01)
    part(PROPS, f"Lis_Pintu_{y}", (-W / 2 + 0.02, y, 2.15), M["lis"], (0.04, 1.2, 0.08))
seats = []
for k, y in enumerate((3.0, 3.6, 4.2, 6.2, 6.8, 7.4)):  # waiting chairs along the right wall
    part(PROPS, f"Kursi_Dudukan_{k}", (W / 2 - 0.4, y, 0.45), M["kursi"], (0.5, 0.52, 0.08), bevel=0.03)
    part(PROPS, f"Kursi_Sandaran_{k}", (W / 2 - 0.16, y, 0.75), M["kursi"], (0.06, 0.52, 0.55), bevel=0.03)
    seats.append(y)
part(PROPS, "Rangka_Kursi_A", (W / 2 - 0.4, 3.6, 0.2), M["logam"], (0.06, 1.9, 0.06)); part(PROPS, "Rangka_Kursi_B", (W / 2 - 0.4, 6.8, 0.2), M["logam"], (0.06, 1.9, 0.06))
for k, y in enumerate((1.6, 5.2, 9.0)):  # potted plants
    part(PROPS, f"Pot_{k}", (W / 2 - 0.4, y, 0.3), M["pot"], radius=0.25, depth=0.6, vertices=20)
    for j in range(5):
        o = part(PROPS, f"Daun_{k}_{j}", (W / 2 - 0.4 + 0.15 * math.cos(j * 1.3), y + 0.15 * math.sin(j * 1.3), 0.85 + 0.12 * (j % 2)), M["daun"], rot=(math.radians(50), 0, j * 1.3), radius=0.22, segments=12, ring_count=6)
        o.scale = (0.5, 1, 0.15)
# stand-ins: HERO walking down the corridor (14), patient + HERO on the chairs (15), a nurse passing
figure(CAST, "HERO_14", (0.2, 7.0, 0.0), yaw=0); empty(MARKS, "MARK_14", (0.2, 7.0, 0.0))
figure(CAST, "FIG_perawat", (-0.7, 10.5, 0.0), yaw=180, color=(0.85, 0.92, 0.95))
figure(CAST, "FIG_pasien", (W / 2 - 0.45, 6.2, 0.45), pose="sit", yaw=270, color=(0.72, 0.6, 0.45))
figure(CAST, "HERO_15", (W / 2 - 0.45, 6.8, 0.45), pose="sit", yaw=270); empty(MARKS, "MARK_15", (W / 2 - 0.45, 6.8, 0.45))
# light: daylight through the long skylight (key) + warm fill
lamp(LIGHT, "SKYLIGHT_MATAHARI", "SUN", (1.0, 0.93, 0.8), 4.0, aim=(0.25, 0.35, -1.0), angle=math.radians(2))
sky = lamp(LIGHT, "SKYLIGHT_AREA", "AREA", (0.95, 0.97, 1.0), 400.0, loc=(0, L / 2, H + 0.3), aim=(0, 0, -1), shape="RECTANGLE", size=1.4, size_y=L)
lamp(LIGHT, "ISI_HANGAT", "AREA", (1.0, 0.8, 0.6), 60.0, loc=(0, 2, 2.6), aim=(0, 1, -0.5), size=3.0)
world_hdri("kloofendal_48d_partly_cloudy_puresky", 0.6)
camera(CAMS, "14", 26, (0.0, 0.6, 1.5), (0.0, 2.0, 1.5), (0.0, 12.0, 1.3), (0.0, 13.0, 1.3), show=["HERO_14", "FIG_perawat"], focus=(0.2, 7.0, 1.3), fstop=2.8)
camera(CAMS, "15", 32, (-0.4, 5.0, 1.15), (-0.4, 5.0, 1.15), (W / 2 - 0.45, 6.5, 0.85), (W / 2 - 0.45, 6.5, 0.85), show=["HERO_15", "FIG_pasien"], focus=(W / 2 - 0.45, 6.2, 1.25), fstop=2.2)
save("rumah_sakit")
