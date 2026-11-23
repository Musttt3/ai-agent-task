# Ruang makan rumah Indonesia masa kini: blender -b --python sets/build_ruang_makan.py [-- preview]
# Bright room, white walls, wood floor, big window on the left (daylight + garden), dining table along X.
# NARATOR sits at (0, 0.62) facing -Y (toward the camera); his plate is at (0, 0.25).
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

sc = new_scene()
S = coll("SET"); P = coll("PROPS"); L = coll("LIGHTS")
floor_m = mat_ph("Lantai_Kayu", "plank_flooring_02", scale=1.6)
wall_m = mat_ph("Dinding_Putih", "white_plaster_02", scale=2.0, tint=(0.95, 0.93, 0.88))
W, D, H = 6.0, 5.5, 3.0
box(S, "Lantai", (0, 0.5, -0.05), (W, D, 0.1), floor_m)
box(S, "Plafon", (0, 0.5, H + 0.05), (W, D, 0.1), wall_m)
wall_with_openings(S, "Dinding_Belakang", -W / 2, W / 2, 0.5 + D / 2, H, 0.2, wall_m, (), axis="x")
wall_with_openings(S, "Dinding_Kiri", 0.5 - D / 2, 0.5 + D / 2, -W / 2, H, 0.2, wall_m, [(0.6, 0.6, 2.2, 1.9, False)], axis="y")
wall_with_openings(S, "Dinding_Kanan", 0.5 - D / 2, 0.5 + D / 2, W / 2, H, 0.2, wall_m, [(2.2, 0.0, 1.0, 2.2, False)], axis="y")
box(S, "Kusen_Jendela", (-W / 2 + 0.05, 0.6, 1.55), (0.12, 2.3, 2.0), mat_simple("Kusen_Hitam", (0.05, 0.05, 0.05), rough=0.4))
k = box(S, "Kaca_Jendela", (-W / 2 + 0.05, 0.6, 1.55), (0.01, 2.2, 1.9), mat_simple("Kaca_Bening", (0.95, 0.97, 0.96), rough=0.01, transmission=1.0, ior=1.5)); k.visible_shadow = False
S.objects["Kusen_Jendela"].modifiers.new("lubang", "BOOLEAN").object = box(S, "Lubang_Kusen", (-W / 2 + 0.05, 0.6, 1.55), (0.3, 2.14, 1.84), wall_m)
S.objects["Lubang_Kusen"].hide_render = True; S.objects["Lubang_Kusen"].display_type = "WIRE"
box(S, "Plint", (0, 0.5 + D / 2 - 0.11, 0.05), (W, 0.02, 0.1), mat_simple("Plint", (0.3, 0.22, 0.15), rough=0.5))
# furniture
tb = ph_model("dining_table", S, loc=(0, 0, 0), size=0.76, axis="z", name="Meja_Makan")
for k_, (x, y, r) in enumerate(((0, 0.7, 180), (-0.6, 0.7, 180), (0.6, -0.7, 0), (-0.6, -0.7, 0))):
    ph_model("dining_chair_02", S, loc=(x, y, 0), rot=(0, 0, math.radians(r)), size=0.9, axis="z", name=f"Kursi_{k_}")
ph_model("modern_wooden_cabinet", S, loc=(1.2, 0.5 + D / 2 - 0.4, 0), rot=(0, 0, math.radians(180)), size=0.85, axis="z", name="Bufet")
ph_model("ceramic_vase_04", S, loc=(0.9, 0.5 + D / 2 - 0.4, 0.85), size=0.3, axis="z", name="Vas_Bufet")
ph_model("potted_plant_04", S, loc=(-2.4, 2.4, 0), size=1.4, axis="z", name="Tanaman")
ph_model("wall_clock", S, loc=(-0.6, 0.5 + D / 2 - 0.12, 2.0), rot=(math.radians(90), 0, 0), size=0.35, axis="max", name="Jam_Dinding")
ph_model("hanging_picture_frame_01", S, loc=(1.2, 0.5 + D / 2 - 0.12, 1.5), rot=(0, 0, math.radians(180)), size=0.7, axis="z", name="Bingkai_Foto")
ph_model("modern_ceiling_lamp_01", S, loc=(0, 0, H - 0.9), size=0.7, axis="z", name="Lampu_Gantung")
# table setting
TH = 0.76
p = PR.nasi_piring_modern("PIRING_NARATOR", P); p.location = (0.0, 0.28, TH + 0.003)
s = PR.sendok_modern("SENDOK_NARATOR", P); s.location = (0.19, 0.28, TH + 0.006); s.rotation_euler = (math.radians(90), 0, math.radians(180))
f = PR.garpu_modern("GARPU_NARATOR", P); f.location = (-0.19, 0.28, TH + 0.006); f.rotation_euler = (math.radians(90), 0, math.radians(180))
gl = PR.gelas_air("GELAS_NARATOR", P); gl.location = (0.3, 0.08, TH + 0.002)
cw = PR.mangkuk_batu("MANGKUK_KOBOKAN", P, broth=False); cw.scale = (0.6, 0.6, 0.6); cw.location = (-0.33, 0.12, TH)   # finger bowl
ge = PR.garpu_emas("GARPU_EMAS", P); ge.location = (-0.05, -0.15, TH + 0.006); ge.rotation_euler = (math.radians(90), 0, math.radians(110))
ph_model("food_lime_01", P, loc=(0.32, 0.38, TH), size=0.05, axis="max", name="Jeruk_Nipis")
# light: daylight through the big left window, soft sky fill
world_hdri("kiara_interior", strength=0.4)
sun(L, "MATAHARI", 4.0, elevation=35, azimuth=-70, color=(1.0, 0.94, 0.84), angle=1.2)
lamp(L, "JENDELA", "AREA", 900, (-W / 2 - 0.6, 0.6, 1.6), aim=(0, 0.3, 1.0), color=(0.9, 0.94, 1.0), size=2.4)
lamp(L, "ISI", "AREA", 150, (1.0, -2.5, 2.2), aim=(0, 0.5, 1.0), color=(1.0, 0.93, 0.85), size=2.5)
# garden seen through the window
box(S, "Kebun", (-W / 2 - 4, 0.5, -0.06), (8, 10, 0.1), mat_ph("Rumput_Kebun", "forest_ground_04", scale=2.0, tint=(0.7, 0.9, 0.6)))
ph_model("pachira_aquatica_01", S, loc=(-W / 2 - 2.0, -0.5, 0), size=2.4, axis="z", name="Pohon_Kebun")
ph_model("shrub_01", S, loc=(-W / 2 - 1.5, 1.8, 0), size=1.2, axis="z", name="Semak_Kebun")
mark(S, "narator", (0.0, 0.62, 0), 0)
save("ruang_makan")
if "preview" in sys.argv:
    print("PREVIEW", preview("ruang_makan", [((0.3, -2.6, 1.3), (0, 0.6, 0.95), 32), ((0.15, -0.25, 1.05), (0, 0.25, TH), 50)]))
