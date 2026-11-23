# Ruang makan Romawi (triclinium): blender -b --python sets/build_romawi.py [-- preview]
# Pompeian red walls with a dark dado, mosaic floor, two marble columns opening onto a sunny courtyard (HDRI).
# ROMAWI sits on the couch (lectus) at (0, 0.75) facing -Y; low marble table (mensa) in front at (0, 0.05).
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

sc = new_scene()
S = coll("SET"); P = coll("PROPS"); L = coll("LIGHTS")
red = mat_ph("Plester_Merah", "red_plaster_weathered", scale=2.2, tint=(0.95, 0.75, 0.7))
mosaic = mat_ph("Mozaik", "marble_mosaic_tiles", scale=1.2)
marble = mat_ph("Marmer", "marble_01", scale=1.0, rough_mul=0.5)
wood = mat_ph("Kayu_Lectus", "lacquered_cherry_wood", scale=0.8, tint=(0.8, 0.6, 0.5))
cushion = mat_ph("Kain_Bantal", "velour_velvet", scale=0.35, tint=(0.75, 0.55, 0.2))
W, D, H = 8.0, 7.0, 4.2
box(S, "Lantai", (0, 1.0, -0.05), (W, D, 0.1), mosaic)
box(S, "Langit_Langit", (0, 1.0, H + 0.1), (W, D, 0.2), mat_ph("Plafon", "white_rough_plaster", scale=2.0, tint=(0.9, 0.85, 0.78)))
wall_with_openings(S, "Dinding_Belakang", -W / 2, W / 2, 1.0 + D / 2, H, 0.4, red, [(0, 0, 3.2, 3.2, False)], axis="x")
wall_with_openings(S, "Dinding_Kiri", 1.0 - D / 2, 1.0 + D / 2, -W / 2, H, 0.4, red, (), axis="y")
wall_with_openings(S, "Dinding_Kanan", 1.0 - D / 2, 1.0 + D / 2, W / 2, H, 0.4, red, [(2.0, 0.9, 1.2, 1.5, False)], axis="y")
dado = mat_ph("Plester_Gelap", "red_plaster_weathered", scale=2.2, tint=(0.25, 0.12, 0.1))
for nm, loc, size in (("Dado_Kiri", (-W / 2 + 0.21, 1.0, 0.45), (0.02, D - 0.4, 0.9)), ("Dado_Kanan", (W / 2 - 0.21, 1.0, 0.45), (0.02, D - 0.4, 0.9)),
                      ("Dado_Bel_a", (-2.8, 1.0 + D / 2 - 0.21, 0.45), (2.4, 0.02, 0.9)), ("Dado_Bel_b", (2.8, 1.0 + D / 2 - 0.21, 0.45), (2.4, 0.02, 0.9))):
    box(S, nm, loc, size, dado)
# fluted columns at the courtyard opening
for sx in (-1, 1):
    x = sx * 1.25
    col = cyl(S, f"Kolom_{sx}", (x, 1.0 + D / 2 - 0.1, H / 2), 0.2, H, marble, verts=48)
    for p in col.data.polygons: p.use_smooth = True
    for i in range(20):   # flutes as shallow grooves via a displace-free trick: thin dark strips
        a = 2 * math.pi * i / 20
        box(S, f"Alur_{sx}_{i}", (x + math.cos(a) * 0.199, 1.0 + D / 2 - 0.1 + math.sin(a) * 0.199, H / 2), (0.012, 0.012, H - 0.5), marble, rot=(0, 0, a))
    cyl(S, f"Kepala_Kolom_{sx}", (x, 1.0 + D / 2 - 0.1, H - 0.12), 0.27, 0.24, marble, verts=48)
    cyl(S, f"Alas_Kolom_{sx}", (x, 1.0 + D / 2 - 0.1, 0.1), 0.27, 0.2, marble, verts=48)
# courtyard: garden floor + plants seen through the opening
box(S, "Halaman", (0, 1.0 + D / 2 + 3.0, -0.06), (8, 6, 0.1), mat_ph("Paving_Halaman", "cobblestone_floor_02", scale=1.5))
ph_model("potted_plant_04", S, loc=(-1.8, 1.0 + D / 2 + 1.5, 0), size=1.3, axis="z", name="Tanaman_Halaman")
ph_model("antique_ceramic_vase_01", S, loc=(1.9, 1.0 + D / 2 + 1.2, 0), size=0.9, axis="z", name="Amfora_Halaman")
# lectus (couch) with cushions
box(S, "Lectus", (0, 0.85, 0.32), (2.0, 0.85, 0.12), wood, bevel=0.02)
for sx in (-1, 1):
    for sy in (-1, 1): cyl(S, f"Kaki_Lectus_{sx}{sy}", (sx * 0.9, 0.85 + sy * 0.35, 0.13), 0.04, 0.26, wood, verts=16)
box(S, "Kasur_Lectus", (0, 0.88, 0.44), (1.95, 0.8, 0.12), cushion, bevel=0.05)
box(S, "Sandaran_Lectus", (-0.95, 0.88, 0.62), (0.12, 0.8, 0.3), cushion, bevel=0.05)
# mensa: round marble table on a single carved leg
cyl(S, "Mensa", (0, 0.05, 0.52), 0.42, 0.05, marble, verts=64)
cyl(S, "Kaki_Mensa", (0, 0.05, 0.25), 0.07, 0.5, marble, verts=32)
cyl(S, "Alas_Mensa", (0, 0.05, 0.03), 0.2, 0.06, marble, verts=32)
TH = 0.545
pl = PR.piring("PIRING_SIPUT", 0.14, mat_ph("Tembikar_Merah", "red_plaster_weathered", scale=0.3, tint=(0.8, 0.42, 0.25), rough_mul=0.8), P); pl.location = (0.05, -0.05, TH)
import random
random.seed(5)
for k in range(6):
    a = k * 1.256 + 0.3; r = 0.085 if k else 0.0
    sp = PR.siput(f"SIPUT_{k}", P, body_out=0.0)
    sp.location = (0.05 + math.cos(a) * r, -0.05 + math.sin(a) * r, TH + 0.012); sp.rotation_euler = (0, 0, random.uniform(0, 6.28))
co = PR.sendok_cochlear("SENDOK_ROMAWI", P); co.location = (0.25, -0.12, TH + 0.01); co.rotation_euler = (math.radians(90), 0, math.radians(100))
ph_model("jug_01", P, loc=(-0.25, 0.2, TH), size=0.26, axis="z", name="Kendi_Anggur")
ph_model("carved_wooden_plate", P, loc=(-0.2, -0.2, TH), size=0.22, axis="max", name="Piring_Buah")
for k in range(3):
    ph_model("food_pomegranate_01", P, loc=(-0.2 + (k - 1) * 0.05, -0.2 + (k % 2) * 0.04, TH + 0.015), rot=(0, 0, k), size=0.075, axis="max", name=f"Delima_{k}")
ph_model("marble_bust_01", S, loc=(-2.8, 2.8, 1.05), rot=(0, 0, math.radians(30)), size=0.7, axis="z", name="Patung_Dada")
cyl(S, "Tiang_Patung", (-2.8, 2.8, 0.52), 0.22, 1.05, marble, verts=32)
ph_model("ceramic_vase_01", S, loc=(2.8, 3.4, 0), size=0.8, axis="z", name="Vas_1")
ph_model("ceramic_vase_03", S, loc=(3.2, 2.8, 0), size=0.6, axis="z", name="Vas_2")
ph_model("brass_vase_01", S, loc=(-3.3, -0.5, 0), size=0.5, axis="z", name="Vas_Kuningan")
# light: Mediterranean sun into the courtyard, sky through the opening, warm bounce
world_hdri("tiber_island", strength=1.0, rot_z=math.radians(30), res="4k")
sun(L, "MATAHARI", 5.5, elevation=48, azimuth=200, color=(1.0, 0.93, 0.8), angle=0.7)
lamp(L, "HALAMAN_ISI", "AREA", 700, (0, 1.0 + D / 2 + 0.6, 2.2), aim=(0, 0.3, 0.8), color=(1.0, 0.95, 0.88), size=3.0)
lamp(L, "PANTUL", "AREA", 150, (0, -3.0, 2.2), aim=(0, 0.8, 0.8), color=(1.0, 0.8, 0.65), size=3.0)
mark(S, "romawi", (0.0, 0.75, 0), 0)
save("romawi")
if "preview" in sys.argv:
    print("PREVIEW", preview("romawi", [((0.4, -3.0, 1.4), (0, 1.2, 0.8), 28), ((0.25, -0.35, 0.75), (0.05, -0.05, TH), 60)]))
