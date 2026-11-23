# Kedai London 1611: blender -b --python sets/build_london.py [-- preview]
# Low timber-framed tavern: plank floor, plank wainscot, lime-plastered panels between oak studs, heavy ceiling beams,
# leaded windows, plank door on the left wall (CORYAT enters there). Two tables: Coryat's (0, 0.6) and the
# townsfolk's (1.7, 1.6).
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

sc = new_scene()
S = coll("SET"); P = coll("PROPS"); L = coll("LIGHTS")
floor_m = mat_ph("Lantai_Papan", "old_wooden_floor_01", scale=1.6, tint=(0.8, 0.7, 0.6))
plaster = mat_ph("Plester_Kapur", "worn_plaster_wall", scale=2.0, tint=(0.92, 0.86, 0.75))
oak = mat_ph("Kayu_Ek", "medieval_wood", scale=1.4, tint=(0.55, 0.42, 0.32))
plank = mat_ph("Papan_Dinding", "raw_plank_wall", scale=1.5, tint=(0.6, 0.48, 0.38))
W, D, H = 8.0, 6.5, 2.9
box(S, "Lantai", (0, 1.0, -0.05), (W, D, 0.1), floor_m)
box(S, "Plafon", (0, 1.0, H + 0.08), (W, D, 0.16), plank)
for i in range(7): box(S, f"Balok_{i}", (-W / 2 + 0.6 + i * 1.15, 1.0, H - 0.12), (0.22, D, 0.24), oak, bevel=0.015)
wall_with_openings(S, "Dinding_Belakang", -W / 2, W / 2, 1.0 + D / 2, H, 0.3, plaster, [(-1.6, 1.0, 1.0, 1.0, False), (1.4, 1.0, 1.0, 1.0, False)], axis="x")
wall_with_openings(S, "Dinding_Kiri", 1.0 - D / 2, 1.0 + D / 2, -W / 2, H, 0.3, plaster, [(0.0, 0.0, 1.0, 2.0, False)], axis="y")
wall_with_openings(S, "Dinding_Kanan", 1.0 - D / 2, 1.0 + D / 2, W / 2, H, 0.3, plaster, [(1.6, 1.0, 1.0, 1.0, False)], axis="y")
# timber framing: studs + rails on the walls, plank wainscot
for x in [-3.6, -2.4, -0.8, 0.4, 2.4, 3.6]:
    box(S, f"Tiang_Bel_{x}", (x, 1.0 + D / 2 - 0.16, H / 2), (0.16, 0.04, H), oak)
for y in [-1.8, -0.6, 0.6, 2.2, 3.6]:
    for sx in (-1, 1): box(S, f"Tiang_Sisi_{sx}_{y}", (sx * (W / 2 - 0.16), y, H / 2), (0.04, 0.16, H), oak)
box(S, "Rel_Bel", (0, 1.0 + D / 2 - 0.17, 0.95), (W, 0.05, 0.12), oak)
for sx in (-1, 1): box(S, f"Rel_Sisi_{sx}", (sx * (W / 2 - 0.17), 1.0, 0.95), (0.05, D, 0.12), oak)
box(S, "Lambri_Bel", (0, 1.0 + D / 2 - 0.16, 0.45), (W, 0.03, 0.9), plank)
for sx in (-1, 1): box(S, f"Lambri_{sx}", (sx * (W / 2 - 0.16), 1.0, 0.45), (0.03, D, 0.9), plank)
# leaded windows (diamond panes): frame + frosted glass + lead lattice
lead = mat_simple("Timah_Jendela", (0.12, 0.12, 0.12), rough=0.5, metal=0.6)
glass = mat_simple("Kaca_Kabur", (0.85, 0.9, 0.82), rough=0.35, transmission=1.0, ior=1.5)
for i, x in enumerate((-1.6, 1.4)):
    g = box(S, f"Kaca_{i}", (x, 1.0 + D / 2 - 0.05, 1.5), (1.0, 0.01, 1.0), glass); g.visible_shadow = False
    for k in range(-5, 6):
        for sgn in (-1, 1):
            b = box(S, f"Timah_{i}_{k}_{sgn}", (x + k * 0.09, 1.0 + D / 2 - 0.06, 1.5), (0.008, 0.006, 1.45), lead, rot=(0, math.radians(45 * sgn), 0))
    box(S, f"Kusen_{i}", (x, 1.0 + D / 2 - 0.07, 1.5), (1.08, 0.06, 1.08), oak)
for o in [o for o in S.objects if o.name.startswith("Timah_")]:
    o.scale = (1, 1, 0.68)
# door (plank, iron straps) in the left wall opening, open a little; positions refined in shot 16
door = box(S, "Pintu", (-W / 2 + 0.15, 0.0, 1.0), (0.06, 1.0, 2.0), plank, bevel=0.005)
for z in (0.4, 1.6): box(S, f"Engsel_{z}", (-W / 2 + 0.19, 0.0, z), (0.01, 0.95, 0.06), PR.IRON())
door["engsel"] = (-W / 2 + 0.15, -0.5, 0)
# furniture
def table(name, loc, rot=0.0):
    r = ph_model("WoodenTable_02", S, loc=loc, rot=(0, 0, rot), size=0.76, axis="z", name=name); return r
table("Meja_Coryat", (0.0, 0.6, 0)); table("Meja_Warga", (1.9, 1.7, 0), rot=math.radians(90))
ph_model("painted_wooden_bench", S, loc=(0.0, 1.15, 0), size=0.45, axis="z", name="Bangku_Coryat")
for k, (x, y) in enumerate(((1.35, 1.7), (2.45, 1.7), (1.9, 2.5))):
    ph_model("wooden_stool_01" if k % 2 else "wooden_stool_02", S, loc=(x, y, 0), size=0.48, axis="z", name=f"Dingklik_{k}")
ph_model("wooden_barrels_01", S, loc=(-3.2, 3.4, 0), size=1.1, axis="z", name="Tong_Tong")
ph_model("Barrel_01", S, loc=(3.3, -0.8, 0), size=0.9, axis="z", name="Tong_1")
ph_model("wine_barrel_01", S, loc=(3.3, 0.2, 0), rot=(0, 0, 1.57), size=0.7, axis="z", name="Tong_Anggur")
ph_model("wooden_crate_01", S, loc=(-3.3, 2.3, 0), size=0.5, axis="z", name="Peti")
# table things
TH = 0.76
for k, (x, y) in enumerate(((1.75, 1.45), (2.05, 1.95), (1.95, 1.4))):
    ph_model("jug_01", P, loc=(x, y, TH), size=0.2, axis="z", name=f"Kendi_{k}")
ph_model("wooden_bowl_02", P, loc=(0.25, 0.45, TH), size=0.2, axis="max", name="Mangkuk_Coryat")
ph_model("wooden_candlestick", P, loc=(-0.3, 0.75, TH), size=0.25, axis="z", name="Kaki_Lilin_C")
l1 = PR.lilin("Lilin_C", 0.12, P); l1.location = (-0.3, 0.75, TH + 0.25)
ph_model("wooden_candlestick", P, loc=(1.9, 1.75, TH), size=0.25, axis="z", name="Kaki_Lilin_W")
l2 = PR.lilin("Lilin_W", 0.12, P); l2.location = (1.9, 1.75, TH + 0.25)
ph_model("Lantern_01", S, loc=(-1.0, 1.0, H - 0.9), size=0.4, axis="z", name="Lentera")
ph_model("vintage_suitcase", P, loc=(-0.75, 0.7, 0), rot=(0, 0, 0.3), size=0.35, axis="z", name="Tas_Coryat")
kg = PR.kotak_garpu("KOTAK_GARPU", P); kg.location = (0.15, 0.4, TH + 0.012); kg.rotation_euler = (0, math.radians(90), 0.4)
gc = PR.garpu_coryat("GARPU_CORYAT", P); gc.location = (0.15, 0.4, TH + 0.03); gc.rotation_euler = (0, math.radians(90), 0.4)
# light: overcast daylight through the windows and door, candles, warm fill
world_hdri("st_fagans_interior", strength=1.2)
fire(S, "PERAPIAN", (3.4, 3.2, 0.1), size=0.35, energy=300)
box(S, "Tungku_Perapian", (3.45, 3.3, 0.45), (0.9, 0.5, 0.9), mat_ph("Bata_Perapian", "brick_floor", scale=0.8, tint=(0.7, 0.5, 0.4)))
S.objects["Tungku_Perapian"].location = (3.45, 3.95, 0.6)
lamp(L, "JENDELA_1", "AREA", 700, (-1.6, 1.0 + D / 2 + 0.4, 1.6), aim=(-1.0, 0.5, 0.8), color=(0.86, 0.9, 1.0), size=1.2)
lamp(L, "JENDELA_2", "AREA", 700, (1.4, 1.0 + D / 2 + 0.4, 1.6), aim=(1.2, 1.0, 0.8), color=(0.86, 0.9, 1.0), size=1.2)
lamp(L, "PINTU_CAHAYA", "AREA", 500, (-W / 2 - 0.5, 0.0, 1.2), aim=(0, 0.3, 1.0), color=(0.88, 0.92, 1.0), size=1.6)
lamp(L, "ISI_HANGAT", "AREA", 260, (0.5, -3.0, 2.2), aim=(0.6, 1.0, 1.0), color=(1.0, 0.75, 0.5), size=3.0)
mark(S, "coryat", (0.0, 1.05, 0), 0)
mark(S, "coryat_pintu", (-W / 2 + 0.4, 0.0, 0), -90)
mark(S, "warga_a", (1.35, 1.75, 0), -90)
mark(S, "warga_b", (2.45, 1.75, 0), 90)
mark(S, "warga_c", (1.9, 2.5, 0), 0)
save("london")
if "preview" in sys.argv:
    print("PREVIEW", preview("london", [((0.4, -2.6, 1.5), (0.5, 1.5, 0.9), 26), ((-0.35, -0.3, 1.1), (0.15, 0.5, TH), 50)]))
