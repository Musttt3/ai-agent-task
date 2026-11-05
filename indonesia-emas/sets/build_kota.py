# Set KOTA: jalan kota Indonesia masa depan yang cerah (blok + cahaya + dekorasi, satu script).
#   blender -b --python sets/build_kota.py   -> sets/kota.blend
# Tata letak (meter, Z ke atas): jalan sepanjang sumbu x (y -3..3), trotoar utara y 3..7 (rumah HERO, pohon
# trembesi, halte di x=-10), trotoar selatan y -3..-6.5, jalur kereta layang di y=-9 (tinggi 6 m), persimpangan
# dengan zebra cross di x=14, gedung tinggi berornamen tradisional di belakang trotoar utara (menara utama x=22).
# Cahaya: matahari pagi dari timur (sisi -x), rendah dan hangat + HDRI langit cerah Poly Haven.
import bpy, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
import lib
def part(c, *a, **kw):
    """shape from the arguments: part(c, name, loc, mat, size) = box; radius+depth = cylinder; radius+subdivisions = ico;
    radius alone = uv sphere; or an explicit kind first: part(c, "ico", name, ...)"""
    if a[0] in ("box", "cyl", "cone", "sph", "ico", "torus", "plane"): return lib.part(c, *a, **kw)
    kind = "ico" if "subdivisions" in kw else "cyl" if "depth" in kw else "sph" if "radius" in kw else "box"
    return lib.part(c, kind, *a, **kw)

sc = new_scene()
SET, PROPS, CAMS, CAST, LIGHT, MARKS = (coll(n) for n in ("SET_KOTA", "PROPS_KOTA", "CAMERAS", "STANDINS", "LIGHTS", "MARKS"))
M = {
    "aspal": mat("Aspal", "aspal", rough=0.85), "paving": mat("Paving", "paving", rough=0.8), "rumput": mat("Rumput", "rumput", rough=0.95),
    "fasad": mat("Fasad", "fasad", rough=0.5), "kayu": mat("Kayu", "kayu", rough=0.6), "kayu_gelap": mat("Kayu_Gelap", "kayu_gelap", rough=0.6),
    "dinding": mat("Dinding", "dinding", rough=0.9), "parang": mat("Ornamen_Parang", "batik_parang", rough=0.7),
    "beton": mat("Beton", color=(0.78, 0.76, 0.72), rough=0.85), "putih": mat("Cat_Putih", color=(0.92, 0.92, 0.9), rough=0.5),
    "garis": mat("Marka_Putih", color=(0.95, 0.95, 0.92), rough=0.6), "kuning": mat("Marka_Kuning", color=(0.95, 0.75, 0.15), rough=0.6),
    "batang": mat("Batang_Pohon", color=(0.36, 0.25, 0.16), rough=0.9), "daun": mat("Daun_Trembesi", color=(0.2, 0.45, 0.16), rough=0.8),
    "daun2": mat("Daun_Muda", color=(0.32, 0.56, 0.2), rough=0.8), "kaca": mat("Kaca_Biru", color=(0.42, 0.6, 0.72), rough=0.1, metal=0.3),
    "hijau_kereta": mat("Kereta_Hijau", color=(0.1, 0.55, 0.42), rough=0.4), "atap_merah": mat("Genteng", color=(0.66, 0.26, 0.15), rough=0.8),
    "mobil": [mat("Mobil_Kuning", color=(0.95, 0.72, 0.18), rough=0.35), mat("Mobil_Biru", color=(0.22, 0.45, 0.78), rough=0.35),
              mat("Mobil_Merah", color=(0.82, 0.22, 0.18), rough=0.35), mat("Mobil_Putih", color=(0.9, 0.9, 0.88), rough=0.35)],
    "ban": mat("Ban", color=(0.05, 0.05, 0.05), rough=0.8), "surya": mat("Panel_Surya", color=(0.06, 0.1, 0.2), rough=0.2, metal=0.5),
    "layar": mat("Layar_Besar", color=(0.05, 0.08, 0.12), rough=0.3, emit=(0.3, 0.55, 0.8), emit_strength=1.5),
    "pot": mat("Pot_Beton", color=(0.7, 0.66, 0.6), rough=0.9),
}

# ---------------- ground ----------------
part(SET, "Jalan", (0, 0, -0.05), M["aspal"], (140, 6, 0.1), 4.0)
part(SET, "Trotoar_Utara", (0, 5.0, 0.07), M["paving"], (140, 4, 0.14), 1.6, 0.03)
part(SET, "Trotoar_Selatan", (0, -4.75, 0.07), M["paving"], (140, 3.5, 0.14), 1.6, 0.03)
part(SET, "Rumput_Belakang", (0, 30, -0.06), M["rumput"], (160, 40, 0.1), 6.0)
part(SET, "Rumput_Selatan", (0, -40, -0.06), M["rumput"], (160, 68, 0.1), 6.0)
for x in range(-60, 61, 6):  # dashed centre line
    if abs(x - 14) > 3: part(SET, f"Marka_{x}", (x, 0, 0.002), M["garis"], (3, 0.15, 0.01))
for k in range(8):  # zebra cross at the intersection (x = 14)
    part(SET, f"Zebra_{k}", (14, -2.6 + k * 0.75, 0.003), M["garis"], (2.4, 0.45, 0.01))

# ---------------- HERO's house (door for shot 07) ----------------
part(SET, "Rumah_Dinding", (0, 8.2, 1.6), M["dinding"], (6, 2.4, 3.2), 2.0, 0.03)
part(SET, "Rumah_Atap", (0, 8.2, 3.55), M["atap_merah"], (6.6, 3.0, 0.7), 1.0, 0.05)
part(SET, "Rumah_Kusen", (0.2, 6.98, 1.08), M["kayu_gelap"], (1.2, 0.08, 2.2), 1.0, 0.01)
door = part(SET, "Rumah_Pintu", (0.2, 6.95, 1.05), M["kayu"], (1.0, 0.06, 2.06), 1.0, 0.01)
# hinge the door on its left edge and swing it open on frame 366 (shot 07)
pivot = bpy.data.objects.new("Rumah_Pintu_Engsel", None); SET.objects.link(pivot); pivot.location = (-0.3, 6.95, 0.02)
door.parent = pivot; door.location = (0.5, 0, 1.03)
for f, a in ((366, 0.0), (378, -100.0)):
    pivot.rotation_euler = (0, 0, math.radians(a)); pivot.keyframe_insert("rotation_euler", frame=f)
for w_ in (-1.8, 2.0):
    part(SET, f"Rumah_Jendela_{w_}", (w_, 6.98, 1.6), M["kaca"], (1.0, 0.05, 1.0), 1.0, 0.01)
part(PROPS, "Pot_Bunga", (1.2, 6.6, 0.35), M["pot"], (0.5, 0.5, 0.5), bevel=0.05)
part(PROPS, "ico", "Bunga", (1.2, 6.6, 0.85), M["daun2"], radius=0.4, subdivisions=2)

# ---------------- buildings with a touch of tradition (joglo-like roof caps, batik bands) ----------------
def tower(name, x, y, w, d, h, cap=True):
    part(SET, name, (x, y, h / 2), M["fasad"], (w, d, h), 8.0, 0.08)
    for k, z in enumerate((h * 0.33, h * 0.66)):
        part(SET, f"{name}_Pita_{k}", (x, y, z), M["parang"], (w + 0.3, d + 0.3, 0.8), 1.2, 0.05)
    if cap:  # stepped joglo roof
        part(SET, f"{name}_Atap1", (x, y, h + 0.6), M["atap_merah"], (w + 1.2, d + 1.2, 1.2), 2.0, 0.1)
        part(SET, f"{name}_Atap2", (x, y, h + 1.8), M["atap_merah"], (w * 0.55, d * 0.55, 1.4), 2.0, 0.1)
        part(SET, f"{name}_Surya", (x, y, h + 2.55), M["surya"], (w * 0.45, d * 0.45, 0.1))
tower("Menara_Utama", 22, 15, 10, 10, 60)
part(SET, "Menara_Layar", (22, 9.94, 14), M["layar"], (6, 0.1, 3.4))
for i, (x, h) in enumerate([(-30, 34), (-18, 26), (-6, 42), (8, 30), (36, 48), (50, 28), (-44, 40)]):
    tower(f"Gedung_{i}", x, 22 + (i % 3) * 6, 9, 9, h)
for i, x in enumerate(range(-48, 60, 16)):  # low shophouses along the north sidewalk
    if abs(x) < 6 or abs(x - 22) < 8: continue
    part(SET, f"Ruko_{i}", (x, 9.5, 3.5), M["fasad"], (12, 5, 7), 6.0, 0.05)
    part(SET, f"Ruko_{i}_Atap", (x, 9.5, 7.4), M["atap_merah"], (12.6, 5.6, 0.8), 2.0, 0.05)

# ---------------- elevated electric railway (fictional) ----------------
part(SET, "Rel_Layang", (0, -9, 6), M["beton"], (140, 3.2, 0.7), 4.0, 0.05)
for x in range(-60, 61, 12): part(SET, f"Tiang_Rel_{x}", (x, -9, 2.85), M["beton"], (1.0, 1.0, 5.7), 2.0, 0.05)
train = bpy.data.objects.new("Kereta", None); PROPS.objects.link(train)
for k in range(3):
    car = part(PROPS, f"Kereta_{k}", (k * 13.0, -9, 7.75), M["putih"], (12.5, 2.8, 2.8), 2.0, 0.35)
    part(PROPS, f"Kereta_{k}_Garis", (k * 13.0, -9, 7.25), M["hijau_kereta"], (12.6, 2.85, 0.5)).parent = train
    part(PROPS, f"Kereta_{k}_Jendela", (k * 13.0, -10.42, 8.1), M["kaca"], (10, 0.05, 0.9)).parent = train
    car.parent = train
for f, x in ((434, 40.0), (481, -40.0)):  # passes right -> left during shot 08 (peak ~frame 458)
    train.location = (x, 0, 0); train.keyframe_insert("location", frame=f)
for fc in train.animation_data.action.fcurves:
    for kp in fc.keyframe_points: kp.interpolation = "LINEAR"

# ---------------- trembesi trees, halte, street furniture ----------------
def trembesi(name, x, y, s=1.0):
    part(PROPS, name + "_Batang", (x, y, 1.6 * s), M["batang"], radius=0.22 * s, depth=3.2 * s, vertices=12, smooth=True)
    for k, (dx, dy, dz, r) in enumerate([(0, 0, 3.6, 2.6), (1.6, 0.6, 3.3, 1.9), (-1.7, -0.4, 3.2, 1.9), (0.3, -1.4, 3.4, 1.8), (-0.4, 1.5, 3.5, 1.7)]):
        o = part(PROPS, f"{name}_Tajuk_{k}", (x + dx * s, y + dy * s, dz * s), M["daun" if k % 2 else "daun2"], radius=r * s, subdivisions=2)
        o.scale = (1, 1, 0.55)
for i, x in enumerate(range(-40, 41, 10)):
    if abs(x - 0) > 2: trembesi(f"Trembesi_U{i}", x - 3, 6.3)
    if not (-3 <= x + 2 <= 14): trembesi(f"Trembesi_S{i}", x + 2, -5.6, 0.9)  # keep shots 08/09 clear
# halte (bus stop) at x=-10
part(PROPS, "Halte_Atap", (-10, 5.6, 2.6), M["atap_merah"], (4.2, 2.0, 0.15), 1.0, 0.05)
for dx in (-1.9, 1.9): part(PROPS, f"Halte_Tiang_{dx}", (-10 + dx, 6.2, 1.3), M["kayu_gelap"], (0.12, 0.12, 2.6))
part(PROPS, "Halte_Bangku", (-10, 6.3, 0.55), M["kayu"], (3.2, 0.5, 0.12), 1.0, 0.02)
part(PROPS, "Halte_Dinding", (-10, 6.55, 1.4), M["kaca"], (3.8, 0.05, 2.0))
# toy cars (fictional, no badges) flowing smoothly; positions keyed over shot 09
def car(name, x, y, m, f_pairs=None):
    root = bpy.data.objects.new(name, None); PROPS.objects.link(root); root.location = (x, y, 0)
    b = part(PROPS, name + "_Badan", (0, 0, 0.62), m, (3.6, 1.7, 0.7), bevel=0.25); b.parent = root
    c_ = part(PROPS, name + "_Kabin", (-0.2, 0, 1.2), m, (2.0, 1.5, 0.6), bevel=0.25); c_.parent = root
    k_ = part(PROPS, name + "_Kaca", (-0.2, 0, 1.22), M["kaca"], (2.02, 1.42, 0.5), bevel=0.2); k_.parent = root
    for wx in (-1.15, 1.15):
        for wy in (-0.85, 0.85):
            t = part(PROPS, f"{name}_Ban_{wx}_{wy}", (wx, wy, 0.34), M["ban"], rot=(math.radians(90), 0, 0), radius=0.34, depth=0.28, vertices=20, smooth=True); t.parent = root
    if f_pairs:
        for f, xx in f_pairs: root.location = (xx, y, 0); root.keyframe_insert("location", frame=f)
        for fc in root.animation_data.action.fcurves:
            for kp in fc.keyframe_points: kp.interpolation = "LINEAR"
    return root
car("Mobil_A", 0, 1.5, M["mobil"][0], [(482, 2.0), (531, 16.0), (532, 90.0)])
car("Mobil_B", 0, -1.5, M["mobil"][1], [(482, 26.0), (531, 12.0), (532, 90.0)])
car("Mobil_C", 0, 1.5, M["mobil"][2], [(482, -8.0), (531, 6.0), (532, 90.0)])
car("Mobil_D", 30, -1.5, M["mobil"][3])
# electric bus for shot 23: pulls in to the halte between frames 1316 and 1340
bus = bpy.data.objects.new("Bus", None); PROPS.objects.link(bus)
bb = part(PROPS, "Bus_Badan", (0, 0, 1.75), M["putih"], (11, 2.5, 3.0), 2.0, 0.3); bb.parent = bus
part(PROPS, "Bus_Garis", (0, 0, 1.0), M["hijau_kereta"], (11.05, 2.55, 0.5)).parent = bus
part(PROPS, "Bus_Kaca", (0, 1.27, 2.3), M["kaca"], (9.6, 0.05, 1.1)).parent = bus
for wx in (-3.6, 3.6):
    for wy in (-1.2, 1.2):
        part(PROPS, f"Bus_Ban_{wx}_{wy}", (wx, wy, 0.48), M["ban"], rot=(math.radians(90), 0, 0), radius=0.48, depth=0.3, vertices=20, smooth=True).parent = bus
for f, x in ((1316, -30.0), (1340, -10.0), (1393, -10.0)):
    bus.location = (x, 1.6, 0); bus.keyframe_insert("location", frame=f)
for fc in bus.animation_data.action.fcurves:
    for kp in fc.keyframe_points: kp.interpolation = "BEZIER"
# planters and lamp posts along the north sidewalk
for i, x in enumerate(range(-36, 37, 8)):
    part(PROPS, f"Tiang_Lampu_{i}", (x + 1, 3.4, 2.5), M["kayu_gelap"], radius=0.06, depth=5.0, vertices=10, smooth=True)
    part(PROPS, f"Kap_Lampu_{i}", (x + 1, 3.0, 5.0), M["putih"], (0.25, 1.0, 0.12), bevel=0.04)

# plain phone held by the hero (shots 10-12); the screen is a separate face so Remotion can map the app UI onto it
hp = bpy.data.objects.new("HP", None); PROPS.objects.link(hp); hp.location = (-4.0, 4.6, 1.0); hp.rotation_euler = (math.radians(-35), 0, 0)
part(PROPS, "HP_Badan", (0, 0, 0), M["ban"], (0.075, 0.012, 0.155), bevel=0.012).parent = hp
part(PROPS, "HP_Layar", (0, -0.0065, 0), mat("Layar_HP", color=(0.05, 0.08, 0.1), rough=0.2, emit=(0.85, 0.92, 1.0), emit_strength=1.2), (0.066, 0.001, 0.142)).parent = hp
# ---------------- stand-ins and marks ----------------
HERO = {  # stand-in per shot (names match MARK_<shot>)
    "07": (0.2, 6.3, 0.14, 180), "08": (1.5, -4.6, 0.14, 160), "09": (14, -1.0, 0.0, 0), "10": (-4, 5.0, 0.14, 200),
    "12": (-4, 5.0, 0.14, 200), "18": (6, 0.0, 0.0, 180), "19": (6, 0.0, 0.0, 180), "20": (6, 0.0, 0.0, 180),
    "21": (-6, 5.2, 0.14, 270), "23": (-9.6, 5.6, 0.14, 230), "24": (22, 5.6, 0.14, 180),
}
for sid, (x, y, z, yaw) in HERO.items():
    figure(CAST, "HERO_" + sid, (x, y, z), yaw=yaw)
    empty(MARKS, "MARK_" + sid, (x, y, z))
for i, (x, y, yaw, col) in enumerate([(-13, 5.4, 190, (0.7, 0.62, 0.45)), (-11.4, 6.2, 170, (0.45, 0.55, 0.7)), (-8.5, 5.0, 200, (0.6, 0.4, 0.4)),
                                      (-15, 4.6, 180, (0.5, 0.65, 0.5)), (-10.4, 5.0, 210, (0.65, 0.6, 0.55))]):
    figure(CAST, f"FIG_warga_{i}", (x, y, 0.14), yaw=yaw, color=col)

# ---------------- lights ----------------
sun = lamp(LIGHT, "MATAHARI", "SUN", (1.0, 0.88, 0.72), 4.5, aim=(0.75, 0.35, -0.5), angle=math.radians(1.2))
lamp(LIGHT, "LANGIT_ISI", "SUN", (0.75, 0.85, 1.0), 0.6, aim=(-0.3, -0.5, -0.8), angle=math.radians(30))
world_hdri("kloofendal_48d_partly_cloudy_puresky", 1.0)

# ---------------- cameras (see shotlist.md) ----------------
H = lambda sid: (HERO[sid][0], HERO[sid][1], HERO[sid][2] + 1.3)  # stand-in eye height
camera(CAMS, "07", 28, (2.6, 3.4, 1.45), (2.2, 3.4, 1.5), (0.2, 6.9, 1.2), (-3.0, 5.0, 1.6), show=["HERO_07"], focus=(0.2, 6.3, 1.4), fstop=2.8,
       keys=[(366, (2.6, 3.4, 1.45), (0.2, 6.9, 1.2)), (395, (2.6, 3.4, 1.45), (0.2, 6.9, 1.2)), (433, (2.2, 3.4, 1.5), (-3.0, 5.0, 1.6))], interp="BEZIER")
camera(CAMS, "08", 20, (3.6, -1.2, 0.55), (3.6, -1.2, 0.55), (-1.0, -9.0, 6.8), (-1.0, -9.0, 6.8), show=["HERO_08"], focus=H("08"), fstop=4.0)
camera(CAMS, "09", 28, (7.0, -2.8, 7.5), (9.0, -2.8, 7.5), (13.0, 1.0, 0.0), (15.0, 1.0, 0.0), show=["HERO_09"], focus=(14, -1.0, 0.8), fstop=4.0)
camera(CAMS, "10", 40, (-4.3, 3.0, 1.4), (-4.25, 3.5, 1.38), H("10"), H("10"), show=["HERO_10"], fstop=2.0)
camera(CAMS, "11", 50, (-4.0, 4.28, 1.22), (-4.0, 4.28, 1.22), (-4.0, 4.6, 1.0), (-4.0, 4.6, 1.0), show=["HERO_10"], fstop=2.8)
camera(CAMS, "12", 32, (-3.5, 2.6, 1.25), (-3.5, 2.6, 1.25), (-4.0, 5.0, 1.0), (-4.0, 5.0, 1.0), show=["HERO_12"], focus=H("12"), fstop=2.2)
camera(CAMS, "18", 30, (6.2, -8.0, 1.5), (6.2, -8.0, 1.5), (6.0, 0.0, 1.2), (6.0, 0.0, 1.2), show=["HERO_18"], focus=H("18"), fstop=3.5)
camera(CAMS, "19", 50, (6.05, -1.6, 1.4), (6.05, -1.25, 1.38), H("19"), H("19"), show=["HERO_19"], fstop=1.8)
camera(CAMS, "20", 40, (6.0, -2.3, 1.3), (6.0, -2.3, 1.3), (6.0, 0.0, 1.15), (6.0, 0.0, 1.15), show=["HERO_20"], focus=H("20"), fstop=2.2)
camera(CAMS, "21", 32, (-3.4, 5.0, 1.35), (-2.4, 5.0, 1.35), (-6.0, 5.2, 1.1), (-5.0, 5.2, 1.1), show=["HERO_21"], focus=H("21"), fstop=2.2)
camera(CAMS, "22", 30, (-15.5, 1.8, 1.6), (-9.5, 1.8, 1.6), (-14.0, 5.5, 1.2), (-8.0, 5.5, 1.2), show=[f"FIG_warga_{i}" for i in range(5)], focus=(-11, 5.4, 1.2), fstop=3.0)
camera(CAMS, "23", 32, (-13.6, 4.9, 1.45), (-12.9, 4.9, 1.42), (-9.8, 5.4, 1.2), (-9.8, 5.4, 1.2), show=["HERO_23", "FIG_warga_1", "FIG_warga_4"], focus=H("23"), fstop=2.2)
camera(CAMS, "24", 32, (22.0, 2.7, 1.35), (22.0, 2.7, 1.35), (22.0, 5.6, 1.4), (22.0, 5.6, 1.4), show=["HERO_24"], focus=H("24"), fstop=2.4)
camera(CAMS, "25", 24, (22.0, 1.0, 2.0), (22.0, 1.0, 26.0), (22.0, 10.0, 6.0), (22.0, 10.0, 40.0), fstop=8.0, interp="BEZIER")
save("kota")
