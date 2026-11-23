# Aula Venesia, abad ke-11: blender -b --python sets/build_venesia.py [-- preview]
# Hall 10 x 14 m, 6.5 m high. Long table along +Y; the PUTRI sits at the head (y = 3.4) facing -Y.
# Back wall (y = +7) has three tall arched windows onto a river city (HDRI); late-afternoon sun comes through them.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

sc = new_scene()
S = coll("SET"); P = coll("PROPS"); L = coll("LIGHTS")
floor_m = mat_ph("Lantai_Marmer", "marble_tiles", scale=1.6, rough_mul=0.6)
wall_m = mat_ph("Dinding_Plester", "yellow_plaster", scale=2.5, tint=(0.95, 0.85, 0.7))
wood_m = mat_ph("Kayu_Gelap", "dark_wood", scale=1.2, tint=(0.75, 0.6, 0.5))
beam_m = mat_ph("Balok_Kayu", "dark_wood", scale=2.0, tint=(0.55, 0.42, 0.35))
cloth_m = mat_ph("Taplak_Jacquard", "quatrefoil_jacquard_fabric", scale=0.5, tint=(0.75, 0.62, 0.55), rough_mul=1.1)
velvet_m = mat_ph("Beludru_Merah", "velour_velvet", scale=0.4, tint=(0.55, 0.06, 0.06))

W, D, H = 10.0, 14.0, 6.5
box(S, "Lantai", (0, 0, -0.05), (W, D, 0.1), floor_m)
box(S, "Langit_Langit", (0, 0, H + 0.1), (W, D, 0.2), wall_m)
for i in range(8):   # ceiling beams
    box(S, f"Balok_{i}", (0, -D / 2 + 1 + i * 1.75, H - 0.15), (W, 0.25, 0.3), beam_m)
win = [(-3.0, 1.3, 1.9, 3.6, True), (0.0, 1.3, 1.9, 3.6, True), (3.0, 1.3, 1.9, 3.6, True)]
wall_with_openings(S, "Dinding_Belakang", -W / 2, W / 2, D / 2, H, 0.5, wall_m, win, axis="x")
wall_with_openings(S, "Dinding_Depan", -W / 2, W / 2, -D / 2, H, 0.5, wall_m, (), axis="x")
wall_with_openings(S, "Dinding_Kiri", -D / 2, D / 2, -W / 2, H, 0.5, wall_m, [(2.5, 1.3, 1.6, 3.2, True)], axis="y")
wall_with_openings(S, "Dinding_Kanan", -D / 2, D / 2, W / 2, H, 0.5, wall_m, [(-2.0, 0.0, 2.2, 3.4, True)], axis="y")
# dark wood wainscot (lower 1.1 m) on the walls, and window frames / sills
for nm, loc, size in (("Panel_Kiri", (-W / 2 + 0.27, 0, 0.55), (0.04, D - 0.6, 1.1)), ("Panel_Kanan", (W / 2 - 0.27, 0, 0.55), (0.04, D - 0.6, 1.1)),
                      ("Panel_Depan", (0, -D / 2 + 0.27, 0.55), (W - 0.6, 0.04, 1.1)), ("Panel_Belakang_a", (-4.2, D / 2 - 0.27, 0.55), (1.6, 0.04, 1.1))):
    box(S, nm, loc, size, wood_m, bevel=0.01)
for i, (x, *_r) in enumerate(win):
    box(S, f"Ambang_{i}", (x, D / 2 - 0.3, 1.27), (2.1, 0.7, 0.08), mat_ph("Batu_Ambang", "marble_01", scale=0.8), bevel=0.01)
    # mullion + transom (iron frame) and thin glass
    box(S, f"Rangka_V_{i}", (x, D / 2 - 0.1, 1.3 + 2.3), (0.05, 0.05, 4.6), PR.IRON())
    box(S, f"Rangka_H_{i}", (x, D / 2 - 0.1, 1.3 + 2.0), (1.9, 0.05, 0.05), PR.IRON())
    g = box(S, f"Kaca_{i}", (x, D / 2 - 0.1, 1.3 + 2.3), (1.9, 0.01, 4.6), mat_simple("Kaca_Jendela", (0.9, 0.92, 0.88), rough=0.05, transmission=1.0, ior=1.5))
    g.visible_shadow = False
# carpet runner along the table
box(S, "Karpet", (0, 0.3, 0.005), (2.6, 8.4, 0.01), mat_ph("Karpet", "velour_velvet", scale=0.6, tint=(0.42, 0.12, 0.08), rough_mul=1.2))

# ---------------- table
TY0, TY1, TW, TH = -2.2, 3.0, 1.15, 0.76
for sx in (-1, 1):
    for y in (TY0 + 0.15, TY1 - 0.15, (TY0 + TY1) / 2):
        cyl(S, f"Kaki_Meja_{sx}_{y:.1f}", (sx * (TW / 2 - 0.1), y, TH / 2), 0.05, TH, wood_m, verts=16)
box(S, "Meja", (0, (TY0 + TY1) / 2, TH - 0.03), (TW, TY1 - TY0, 0.06), wood_m, bevel=0.01)
# tablecloth: top + hanging skirt with a soft hem
box(S, "Taplak", (0, (TY0 + TY1) / 2, TH + 0.003), (TW + 0.04, TY1 - TY0 + 0.04, 0.008), cloth_m)
for sx in (-1, 1):
    box(S, f"Taplak_Sisi_{sx}", (sx * (TW / 2 + 0.022), (TY0 + TY1) / 2, TH - 0.2), (0.006, TY1 - TY0 + 0.04, 0.4), cloth_m)
for sy, y in ((-1, TY0), (1, TY1)):
    box(S, f"Taplak_Ujung_{sy}", (0, y + sy * 0.022, TH - 0.2), (TW + 0.044, 0.006, 0.4), cloth_m)

# ---------------- chairs (head chair taller with velvet cushion)
SEATS = []
for i, y in enumerate([-1.6, -0.6, 0.4, 1.4, 2.3]):
    for sx in (-1, 1):
        r = ph_model("gallinera_chair", S, loc=(sx * (TW / 2 + 0.38), y, 0), rot=(0, 0, math.radians(-90 * sx)), size=1.03, axis="z", name=f"Kursi_{i}_{sx}")
        SEATS.append((sx, y))
head = ph_model("gallinera_chair", S, loc=(0, TY1 + 0.62, 0), rot=(0, 0, 0), size=1.25, axis="z", name="Kursi_Kepala")
box(S, "Bantal_Kursi_Kepala", (0, TY1 + 0.6, 0.555), (0.5, 0.42, 0.05), velvet_m, bevel=0.02)

# ---------------- table settings
silver = PR.SILVER()
places = [(0, TY1 - 0.2, "putri")] + [(sx * 0.33, y, f"tamu_{sx}_{i}") for i, y in enumerate([-1.6, -0.6, 0.4, 1.4, 2.3]) for sx in (-1, 1)]
for x, y, tag in places:
    p = PR.piring(f"Piring_{tag}", 0.12, silver, P); p.location = (x, y, TH + 0.008)
    gx = (0.26 if tag == "putri" else (0.2 if x <= 0 else -0.2)); gy = (0.05 if tag == "putri" else 0.15)
    gob = ph_model("brass_goblets", P, loc=(x + gx, y + gy, TH + 0.007), size=0.17, axis="z", name=f"Piala_{tag}",
                   only=["brass_goblet_0%d" % (1 + (abs(hash(tag)) % 3))])
# the hero: the golden fork rests on the princess's plate, tines toward the camera side (-Y)
g = PR.garpu_emas("GARPU_EMAS", P); g.rotation_euler = (math.radians(90), 0, math.radians(200)); g.location = (0.06, TY1 - 0.21, TH + 0.024)
# platters of fruit, jug, candles
pl = PR.piring("Nampan_Buah", 0.22, silver, P); pl.location = (0, 0.9, TH + 0.008)
for k, (mid, dx, dy) in enumerate((("food_pomegranate_01", -0.06, 0.03), ("food_pears_asian_01", 0.07, -0.04), ("food_apple_01", 0.0, 0.09), ("food_pomegranate_01", 0.05, 0.08))):
    ph_model(mid, P, loc=(dx, 0.9 + dy, TH + 0.025), rot=(0, 0, k * 1.3), size=0.08 if "pomegranate" in mid else 0.075, axis="max", name=f"Buah_{k}")
ph_model("metal_jug", P, loc=(0.25, -0.2, TH + 0.007), size=0.28, axis="z", name="Kendi")
for k, y in enumerate((-1.9, -0.1, 1.9)):
    ch = ph_model("brass_candleholders", P, loc=(0, y, TH + 0.007), size=0.22, axis="z", name=f"Tempat_Lilin_{k}")
    c_ = PR.lilin(f"Lilin_{k}", 0.2, P); c_.location = (0, y, TH + 0.007 + 0.22)
# iron ring chandeliers with candles (no electric fittings in the 11th century)
for k, y in enumerate((-1.0, 1.9)):
    kandelar(S, f"Kandelar_{k}", (0, y, H - 2.4), radius=0.7, candles=10, chain_to=H - 0.3)

# ---------------- wall furniture & decoration
ph_model("GothicCabinet_01", S, loc=(-W / 2 + 0.55, -3.5, 0), rot=(0, 0, math.radians(-90)), size=2.2, axis="z", name="Lemari_Gothic")
ph_model("ornate_mirror_01", S, loc=(W / 2 - 0.3, 3.0, 1.4), rot=(0, 0, math.radians(90)), size=1.4, axis="z", name="Cermin")
ph_model("fancy_picture_frame_01", S, loc=(-W / 2 + 0.3, 0.5, 1.8), rot=(0, 0, math.radians(-90)), size=1.2, axis="z", name="Bingkai")
ph_model("large_castle_door", S, loc=(W / 2 - 0.25, -2.0, 0), rot=(0, 0, math.radians(90)), size=3.4, axis="z", name="Pintu_Besar")
ph_model("antique_ceramic_vase_01", S, loc=(-W / 2 + 0.6, 5.5, 0), size=0.9, axis="z", name="Vas_Lantai")

# ---------------- light: the outside, the sun through the back windows, candles, a little bounce fill
world_hdri("tiber_island", strength=0.8, rot_z=math.radians(160), res="4k")
sun(L, "MATAHARI", 6.0, elevation=22, azimuth=180 + 18, color=(1.0, 0.82, 0.6), angle=0.8)
lamp(L, "PANTUL_HANGAT", "AREA", 260, (0, -3.0, 4.5), aim=(0, 1.5, 1.0), color=(1.0, 0.78, 0.55), size=4.0)
lamp(L, "JENDELA_ISI", "AREA", 500, (0, D / 2 - 0.6, 3.0), aim=(0, 0, 1.2), color=(0.85, 0.9, 1.0), size=6.0)

# ---------------- marks for the cast (yaw: 0 faces -Y)
mark(S, "putri", (0, TY1 + 0.62, 0), 0)
mark(S, "bangsawan_a", (-(TW / 2 + 0.33), 1.4, 0), -90)
mark(S, "bangsawan_b", ((TW / 2 + 0.33), 0.4, 0), 90)
mark(S, "tamu_c", (-(TW / 2 + 0.33), -0.6, 0), -90)
mark(S, "uskup", (1.6, 2.2, 0), 115)
save("venesia")
if "preview" in sys.argv:
    outs = preview("venesia", [((0, -6.5, 1.7), (0, 2.5, 1.2), 24), ((0.9, 1.6, 1.25), (0, 3.1, 0.95), 40), ((-0.15, TY1 - 0.72, TH + 0.16), (0.06, TY1 - 0.36, TH + 0.02), 60)])
    print("PREVIEW", outs)
