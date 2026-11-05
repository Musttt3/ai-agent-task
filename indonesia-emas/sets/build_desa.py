# Set DESA: desa di perbukitan saat senja (sawah bertingkat, rumah panggung, tiang listrik, menara internet).
#   blender -b --python sets/build_desa.py -> sets/desa.blend      Shot 16, 17, 26, 27.
# Sawah bertingkat turun ke arah -y; rumah panggung di (0, 6); menara internet ramping di bukit (14, 40).
# Cahaya: matahari terbenam rendah dari barat (+x, belakang bukit), jingga; lampu rumah hangat menyala di 1022/1030/1038.
import bpy, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
import lib
def part(c, *a, **kw):
    if a[0] in ("box", "cyl", "cone", "sph", "ico", "torus", "plane"): return lib.part(c, *a, **kw)
    kind = "ico" if "subdivisions" in kw else "cyl" if "depth" in kw else "sph" if "radius" in kw else "box"
    return lib.part(c, kind, *a, **kw)

sc = new_scene()
SET, PROPS, CAMS, CAST, LIGHT, MARKS = (coll(n) for n in ("SET_DESA", "PROPS_DESA", "CAMERAS", "STANDINS", "LIGHTS", "MARKS"))
M = {"sawah": mat("Sawah", "tanah_sawah", rough=0.9), "pematang": mat("Pematang", color=(0.42, 0.32, 0.2), rough=0.95),
     "air": mat("Air_Sawah", color=(0.5, 0.55, 0.62), rough=0.08), "rumput": mat("Rumput", "rumput", rough=0.95),
     "kayu": mat("Kayu", "kayu", rough=0.6), "kayu_gelap": mat("Kayu_Gelap", "kayu_gelap", rough=0.6),
     "atap": mat("Atap_Ijuk", color=(0.25, 0.17, 0.12), rough=0.9), "bambu": mat("Anyaman_Bambu", "tikar", rough=0.85),
     "jendela": mat("Jendela_Menyala", color=(0.2, 0.12, 0.05), rough=0.6, emit=(1.0, 0.68, 0.3), emit_strength=0.0),
     "tiang": mat("Tiang_Listrik", color=(0.45, 0.45, 0.45), rough=0.6), "kabel": mat("Kabel", color=(0.05, 0.05, 0.05), rough=0.6),
     "menara": mat("Menara", color=(0.85, 0.85, 0.82), rough=0.4, metal=0.5), "lampu_menara": mat("Lampu_Menara", color=(0.3, 0.02, 0.02), emit=(1.0, 0.1, 0.05), emit_strength=0.0),
     "daun": mat("Daun_Kelapa", color=(0.2, 0.42, 0.18), rough=0.8), "batang": mat("Batang_Kelapa", color=(0.42, 0.32, 0.22), rough=0.9),
     "bukit": mat("Bukit", "rumput", rough=0.95), "layang": mat("Layangan", color=(0.9, 0.2, 0.2), rough=0.6)}
# rice terraces: stepped slabs going down toward -y, each with a mud bund and a sheet of sky-reflecting water
for k in range(9):
    y, z = -2 - k * 4.0, -0.45 * k
    part(SET, f"Teras_{k}", (0, y, z - 0.25), M["sawah"], (60, 4.0, 0.5), 3.0)
    part(SET, f"Pematang_{k}", (0, y - 2.0, z + 0.05), M["pematang"], (60, 0.35, 0.2), bevel=0.06)
    if k % 3 == 1: part(SET, f"Air_{k}", (0, y, z + 0.005), M["air"], (60, 3.6, 0.01))
part(SET, "Halaman", (0, 8, -0.05), M["rumput"], (60, 20, 0.1), 4.0)
for k, (x, y, r, h) in enumerate([(-30, 50, 30, 14), (10, 60, 34, 18), (40, 45, 26, 12), (25, 40, 14, 8)]):
    o = part(SET, f"Bukit_{k}", (x, y, -h * 0.4), M["bukit"], radius=r, subdivisions=3); o.scale = (1, 0.7, h / r)
# rumah panggung (stilt house) with ijuk roof, bamboo walls, warm windows that light up
def rumah(name, x, y, rot=0.0, s=1.0):
    root = bpy.data.objects.new(name, None); PROPS.objects.link(root); root.location = (x, y, 0); root.rotation_euler = (0, 0, math.radians(rot)); root.scale = (s,) * 3
    ps = [part(PROPS, f"{name}_Lantai", (0, 0, 1.2), M["kayu"], (5, 4, 0.2), bevel=0.03),
          part(PROPS, f"{name}_Dinding", (0, 0, 2.4), M["bambu"], (4.6, 3.6, 2.2), 1.0, 0.03),
          part(PROPS, f"{name}_Tangga", (0, -2.6, 0.6), M["kayu_gelap"], (1.0, 1.2, 0.1), rot=(math.radians(-45), 0, 0))]
    for dx in (-2.2, 0, 2.2):
        for dy in (-1.7, 1.7): ps.append(part(PROPS, f"{name}_Tiang_{dx}_{dy}", (dx, dy, 0.6), M["kayu_gelap"], (0.18, 0.18, 1.2)))
    for side in (-1, 1):  # steep gable roof
        ps.append(part(PROPS, f"{name}_Atap_{side}", (0, side * 1.2, 4.2), M["atap"], (5.8, 2.9, 0.18), rot=(math.radians(side * 38), 0, 0), bevel=0.04))
    wins = []
    for dx in (-1.2, 1.2):
        w = part(PROPS, f"{name}_Jendela_{dx}", (dx, -1.82, 2.5), M["jendela"], (0.8, 0.05, 0.7)); ps.append(w); wins.append(w)
    for p in ps: p.parent = root
    return root, wins
houses = [rumah("Rumah_Panggung", 0, 6), rumah("Rumah_B", -9, 9, 15, 0.9), rumah("Rumah_C", 10, 10, -12, 0.85)]
# the windows light up one house at a time on "listrik" (1022, 1030, 1038)
jm = M["jendela"].node_tree.nodes["Principled BSDF"].inputs["Emission Strength"]
for f, v in ((0, 0.0), (1022, 2.2)):
    jm.default_value = v; jm.keyframe_insert("default_value", frame=f)
for fc in M["jendela"].node_tree.animation_data.action.fcurves:
    for kp in fc.keyframe_points: kp.interpolation = "CONSTANT"
# electricity poles with sagging cables, a slender internet tower on the hill with a blinking light
poles = [(-14, 2), (-5, 1.5), (5, 1.5), (14, 2)]
for i, (x, y) in enumerate(poles):
    part(PROPS, f"Tiang_Listrik_{i}", (x, y, 3.5), M["tiang"], radius=0.1, depth=7.0, vertices=10)
    part(PROPS, f"Palang_{i}", (x, y, 6.8), M["tiang"], (0.1, 1.2, 0.1))
for i in range(len(poles) - 1):
    (x0, y0), (x1, y1) = poles[i], poles[i + 1]
    for dy in (-0.5, 0.5):
        cu = bpy.data.curves.new(f"Kabel_{i}_{dy}", "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = 0.012
        sp = cu.splines.new("POLY"); sp.points.add(8)
        for j in range(9):
            t = j / 8; sp.points[j].co = (x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + dy, 6.8 - 0.6 * math.sin(math.pi * t), 1)
        ob = bpy.data.objects.new(f"Kabel_{i}_{dy}", cu); PROPS.objects.link(ob); ob.data.materials.append(M["kabel"])
tx, ty, tz = 14, 34, 4.0
part(PROPS, "Menara_Batang", (tx, ty, tz + 9), M["menara"], radius=0.35, depth=18, vertices=6)
for k in range(3): part(PROPS, f"Menara_Antena_{k}", (tx + 0.45 * math.cos(k * 2.1), ty + 0.45 * math.sin(k * 2.1), tz + 16.5), M["menara"], (0.2, 0.2, 1.2))
part(PROPS, "Menara_Lampu", (tx, ty, tz + 18.3), M["lampu_menara"], radius=0.25, segments=12, ring_count=8)
lm = M["lampu_menara"].node_tree.nodes["Principled BSDF"].inputs["Emission Strength"]
for f in range(983, 1061, 12):  # blinks from "internet" on
    for df, v in ((0, 25.0), (6, 0.0)): lm.default_value = v; lm.keyframe_insert("default_value", frame=f + df)
for fc in M["lampu_menara"].node_tree.animation_data.action.fcurves:
    for kp in fc.keyframe_points: kp.interpolation = "CONSTANT"
for k, (x, y) in enumerate([(-6, 4), (6, 3.5), (-16, 10), (18, 8), (3, 14)]):  # coconut palms
    part(PROPS, f"Kelapa_Batang_{k}", (x, y, 3.5), M["batang"], radius=0.16, depth=7.0, vertices=8, rot=(0, math.radians(6 * (-1) ** k), 0))
    for j in range(7):
        o = part(PROPS, f"Kelapa_Daun_{k}_{j}", (x + 1.2 * math.cos(j * 0.9), y + 1.2 * math.sin(j * 0.9), 6.8), M["daun"], rot=(math.radians(-30), 0, j * 0.9 + math.pi / 2), radius=1.4, segments=12, ring_count=6)
        o.scale = (0.25, 1, 0.05)
layang = part(PROPS, "Layangan", (2, -9, 6), M["layang"], (0.8, 0.05, 1.0), rot=(0, 0, math.radians(45)))
# stand-ins: HERO on a bund (16), at the house (17, 26), laughing with the kids on the bunds (27); villagers on the porch
figure(CAST, "HERO_16", (1.0, -6.0, -0.35), yaw=200); empty(MARKS, "MARK_16", (1.0, -6.0, -0.35))
figure(CAST, "HERO_17", (1.5, 2.6, 0.0), yaw=200); empty(MARKS, "MARK_17", (1.5, 2.6, 0.0))
figure(CAST, "HERO_26", (2.2, 2.4, 0.0), yaw=210); empty(MARKS, "MARK_26", (2.2, 2.4, 0.0))
figure(CAST, "HERO_27", (-2.0, -5.95, -0.35), yaw=250); empty(MARKS, "MARK_27", (-2.0, -5.95, -0.35))
for i, (x, col) in enumerate([(-1.0, (0.7, 0.6, 0.45)), (0.0, (0.6, 0.45, 0.4)), (1.0, (0.5, 0.6, 0.7))]):
    figure(CAST, f"FIG_warga_desa_{i}", (x, 4.3, 1.3), yaw=180, color=col)
kids = []
for i in range(3):  # kids running along the bund during shot 27
    k_ = figure(CAST, f"FIG_anak_desa_{i}", (0, -6.0, -0.35), yaw=270, scale=0.75, color=[(0.85, 0.5, 0.4), (0.4, 0.6, 0.85), (0.9, 0.8, 0.3)][i])
    for f, x in ((1593, 2.0 + i * 1.6), (1638, -4.0 + i * 1.6)):
        k_.location.x = x; k_.keyframe_insert("location", index=0, frame=f)
# light: low orange sunset from behind the hills (+x, +y), purple-blue sky fill, warm window glow later
lamp(LIGHT, "MATAHARI_TERBENAM", "SUN", (1.0, 0.55, 0.28), 3.2, aim=(-0.7, -0.55, -0.22), angle=math.radians(2.5))
lamp(LIGHT, "LANGIT_SENJA", "SUN", (0.55, 0.55, 0.85), 0.5, aim=(0.3, 0.5, -0.8), angle=math.radians(40))
for i, (hx, hy) in enumerate([(0, 6), (-9, 9), (10, 10)]):  # warm porch lights, on from 1022 / 1030 / 1038
    pl = lamp(LIGHT, f"LAMPU_RUMAH_{i}", "POINT", (1.0, 0.65, 0.3), 0.0, loc=(hx, hy - 2.4, 2.6), shadow_soft_size=0.2)
    key(pl.data, "energy", [(0, 0.0), (1022 + 8 * i, 60.0)])
# sunset sky: physical sky with the sun just above the western hills (+x)
w = sc.world or bpy.data.worlds.new("World"); sc.world = w; w.use_nodes = True; nt = w.node_tree; nt.nodes.clear()
out = nt.nodes.new("ShaderNodeOutputWorld"); bg = nt.nodes.new("ShaderNodeBackground"); sky = nt.nodes.new("ShaderNodeTexSky")
sky.sky_type = "NISHITA"; sky.sun_elevation = math.radians(2.5); sky.sun_rotation = math.radians(220); sky.sun_size = math.radians(3)
sky.air_density = 1.6; sky.dust_density = 3.0
nt.links.new(sky.outputs["Color"], bg.inputs["Color"]); nt.links.new(bg.outputs[0], out.inputs[0]); bg.inputs["Strength"].default_value = 0.35
camera(CAMS, "16", 24, (-6.0, -38.0, 6.0), (-5.6, -35.5, 5.8), (2.0, 4.0, 2.0), (2.0, 4.0, 2.0), show=["HERO_16"], focus=(1.0, -6.0, 0.8), fstop=8.0)
camera(CAMS, "17", 30, (-1.0, -4.0, 1.5), (-1.0, -4.0, 1.5), (0.8, 4.0, 2.6), (0.8, 4.0, 2.6), show=["HERO_17"], focus=(1.5, 2.6, 1.3), fstop=4.0)
camera(CAMS, "26", 30, (-2.0, -3.8, 1.6), (-1.6, -2.8, 1.6), (0.3, 4.2, 2.2), (0.3, 4.2, 2.2), show=["HERO_26"] + [f"FIG_warga_desa_{i}" for i in range(3)], focus=(0.5, 3.5, 2.0), fstop=3.2)
camera(CAMS, "27", 28, (2.5, -13.0, 1.6), (-2.5, -13.0, 1.6), (2.0, -6.0, 0.8), (-2.0, -6.0, 0.8), show=["HERO_27"] + [f"FIG_anak_desa_{i}" for i in range(3)], focus=(0, -6.0, 0.7), fstop=4.0)
save("desa")
