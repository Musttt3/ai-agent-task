# Desa pesisir Nusantara (abad ke-16/17): blender -b --python sets/build_nusantara.py [-- preview]
# Beach sloping into a bay (+Y = sea). A rumah panggung (stilt house) at (0, 0) with its veranda facing -Y... the
# sea is behind the house; for the ship shot the camera stands on the beach looking +Y over the bay.
# Veranda floor at z = 1.2; LELUHUR A/B sit on a pandan mat (tikar) on the veranda; PELAUT climbs the steps.
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
from mathutils import noise

sc = new_scene()
S = coll("SET"); P = coll("PROPS"); L = coll("LIGHTS")
sand = mat_ph("Pasir", "coast_sand_01", scale=2.5, tint=(1.0, 0.95, 0.86))
ground = mat_ph("Tanah_Rumput", "forest_ground_04", scale=2.5)
bamboo = mat_ph("Dinding_Bambu", "bamboo_wall", scale=1.2, tint=(0.85, 0.75, 0.55))
plank = mat_ph("Papan_Rumah", "dark_wooden_planks", scale=1.4, tint=(0.8, 0.65, 0.5))
thatch = mat_ph("Atap_Rumbia", "reed_roof_04", scale=1.4, tint=(0.8, 0.72, 0.6))
post_m = mat_ph("Tiang_Kayu", "medieval_wood", scale=1.0, tint=(0.6, 0.48, 0.38))
# terrain: village ground near the house, sand toward the sea, sloping under the water at y > 14
bpy.ops.mesh.primitive_grid_add(x_subdivisions=200, y_subdivisions=200, size=120, location=(0, 30, 0))
t = bpy.context.object; t.name = "Daratan"; link(t, S)
t.data.materials.append(ground); t.data.materials.append(sand)
for v in t.data.vertices:
    x, y = v.co.x, v.co.y + 30
    h = 0.0 if y < 8 else -(y - 8) * 0.06
    h += noise.noise(Vector((x * 0.08, y * 0.08, 0))) * 0.35 * (1 if y < 6 else 0.4) + noise.noise(Vector((x, y, 3)) * 0.6) * 0.03
    if abs(x) < 5 and -4 < y < 5: h *= 0.15            # flat around the house
    v.co.z = h
for p in t.data.polygons:
    c = p.center; p.material_index = 1 if (c.y + 30) > 5 + noise.noise(Vector((c.x * 0.2, 0, 0))) * 2 else 0
    p.use_smooth = True
# sea: large plane with a wavy, deep-teal water shader
bpy.ops.mesh.primitive_plane_add(size=1200, location=(0, 600, -0.35)); sea = bpy.context.object; sea.name = "Laut"; link(sea, S)
wm = bpy.data.materials.new("Air_Laut"); wm.use_nodes = True; nt = wm.node_tree; b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
b.inputs["Base Color"].default_value = (0.02, 0.18, 0.2, 1); b.inputs["Roughness"].default_value = 0.04; b.inputs["Transmission Weight"].default_value = 0.6
b.inputs["IOR"].default_value = 1.33
tc = nt.nodes.new("ShaderNodeTexCoord"); wv = nt.nodes.new("ShaderNodeTexNoise"); wv.inputs["Scale"].default_value = 0.6; wv.inputs["Detail"].default_value = 10
mp = nt.nodes.new("ShaderNodeMapping"); nt.links.new(tc.outputs["Object"], mp.inputs["Vector"]); nt.links.new(mp.outputs["Vector"], wv.inputs["Vector"])
bp = nt.nodes.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.25; bp.inputs["Distance"].default_value = 0.05
nt.links.new(wv.outputs["Fac"], bp.inputs["Height"]); nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
for f in (0, 1600):
    mp.inputs["Location"].default_value = (f * 0.0015, f * 0.004, f * 0.002); mp.inputs["Location"].keyframe_insert("default_value", frame=f)
for fc in nt.animation_data.action.fcurves:
    for kp in fc.keyframe_points: kp.interpolation = "LINEAR"
sea.data.materials.append(wm)
# ---------------- rumah panggung
FZ = 1.2                                       # floor height
HX, HY = 2.4, 2.0                              # half sizes of the house body (x, y); centre (0, 1.0)
for x in (-HX, 0, HX):
    for y in (-1.8, 0.0, 1.0, 3.0):
        cyl(S, f"Tiang_{x}_{y}", (x, y, FZ / 2), 0.09, FZ, post_m, verts=12)
box(S, "Lantai_Rumah", (0, 0.6, FZ - 0.04), (2 * HX + 0.3, 5.0, 0.08), plank, bevel=0.01)       # house + veranda floor
wall_with_openings(S, "Dinding_Depan", -HX, HX, -0.3, 2.3, 0.08, bamboo, [(0.0, 0.0, 0.9, 1.75, False), (-1.5, 0.8, 0.7, 0.6, False)], axis="x", z0=FZ)
wall_with_openings(S, "Dinding_Belakang", -HX, HX, 3.1, 2.3, 0.08, bamboo, [(1.2, 0.8, 0.7, 0.6, False)], axis="x", z0=FZ)
wall_with_openings(S, "Dinding_Kiri", -0.3, 3.1, -HX, 2.3, 0.08, bamboo, (), axis="y", z0=FZ)
wall_with_openings(S, "Dinding_Kanan", -0.3, 3.1, HX, 2.3, 0.08, bamboo, [(1.4, 0.8, 0.7, 0.6, False)], axis="y", z0=FZ)
# roof: steep gable, thatch, ridge along X over the house body (y -0.3..3.1) extended over the veranda (to y -2.2)
RZ = FZ + 2.3; RISE = 1.9; Y0, Y1 = -2.25, 3.35; YC = (Y0 + Y1) / 2; HALF = (Y1 - Y0) / 2
for sgn in (-1, 1):
    Lr = math.hypot(HALF, RISE)
    box(S, f"Atap_{sgn}", (0, YC + sgn * HALF / 2, RZ + RISE / 2), (2 * HX + 1.3, Lr, 0.24), thatch, rot=(-math.atan2(RISE, HALF) * sgn, 0, 0))
box(S, "Bubungan", (0, YC, RZ + RISE + 0.05), (2 * HX + 1.4, 0.3, 0.22), thatch)
import bmesh as _bm
for xx in (-HX, HX):
    bm_ = _bm.new(); vs = [bm_.verts.new(p_) for p_ in ((xx, -0.3, RZ), (xx, 3.1, RZ), (xx, (-0.3 + 3.1) / 2 + 0.0, RZ + RISE * 0.92))]
    bm_.faces.new(vs); me = bpy.data.meshes.new("Gevel"); bm_.to_mesh(me); bm_.free()
    g = bpy.data.objects.new(f"Gevel_{xx}", me); S.objects.link(g); me.materials.append(bamboo); g.modifiers.new("Tebal", "SOLIDIFY").thickness = 0.08
# veranda rail + steps
for x in (-HX, -1.2, 1.2, HX): cyl(S, f"Tiang_Serambi_{x}", (x, -1.85, FZ + 0.45), 0.04, 0.9, post_m, verts=10)
box(S, "Pagar_Serambi_a", (-1.8, -1.85, FZ + 0.85), (1.3, 0.06, 0.06), post_m); box(S, "Pagar_Serambi_b", (1.8, -1.85, FZ + 0.85), (1.3, 0.06, 0.06), post_m)
for k in range(5):
    box(S, f"Anak_Tangga_{k}", (0, -2.05 - k * 0.24, FZ - 0.24 * (k + 1) + 0.03), (1.0, 0.24, 0.05), plank)
for sx in (-1, 1): box(S, f"Ibu_Tangga_{sx}", (sx * 0.52, -2.55, FZ / 2), (0.06, 1.4, 0.08), post_m, rot=(math.radians(-50), 0, 0))
# tikar (pandan mat) on the veranda + the meal
tikar_m = mat_ph("Tikar_Pandan", "bamboo_veneer", scale=0.35, tint=(0.95, 0.82, 0.55))
box(S, "Tikar", (0, -1.0, FZ + 0.005), (2.0, 1.3, 0.008), tikar_m)
n1 = PR.nasi_di_daun("NASI_DAUN_A", P); n1.location = (-0.35, -1.05, FZ + 0.01); n1.rotation_euler = (0, 0, 0.2)
n2 = PR.nasi_di_daun("NASI_DAUN_B", P); n2.location = (0.45, -0.95, FZ + 0.01); n2.rotation_euler = (0, 0, -0.3)
ph_model("wicker_basket_02", P, loc=(0.95, -0.55, FZ), size=0.3, axis="z", name="Bakul")
ph_model("bananas", P, loc=(0.9, -0.5, FZ + 0.18), size=0.22, axis="max", name="Pisang")
ph_model("sungka_board", S, loc=(-1.6, -0.6, FZ), rot=(0, 0, 0.3), size=0.6, axis="max", name="Congklak")
ph_model("ceramic_pot", S, loc=(-1.9, -1.4, FZ), size=0.45, axis="z", name="Gentong_Air")
ph_model("wooden_bowl_01", P, loc=(0.05, -1.45, FZ + 0.01), size=0.16, axis="max", name="Mangkuk_Cuci_Tangan")
# coconut palms & tropical plants around
random.seed(3)
for k, (x, y) in enumerate(((-6.5, 1.0), (5.5, -1.5), (7.5, 4.5), (-8.0, 6.0), (-4.0, 9.0), (10.0, 9.5), (-12, 2.0), (3.5, 8.0), (-15, 8), (14, 3), (-2.5, 12.5), (8.5, 12.0))):
    pk = PR.pohon_kelapa(f"Kelapa_{k}", height=random.uniform(7.0, 10.5), lean=random.uniform(0.06, 0.2), seed=k + 1, coll=S); pk.location = (x, y, 0)
for k, (x, y) in enumerate(((-3.5, -1.0), (3.6, 0.2), (-3.2, 3.6), (4.0, 3.2), (-5.5, -3.0))):
    ph_model("fern_02" if k % 2 else "pachira_aquatica_01", S, loc=(x, y, 0), rot=(0, 0, k), size=1.2, axis="z", name=f"Semak_{k}")
for k in range(4):
    ph_model("shrub_02", S, loc=(random.uniform(-7, 7), random.uniform(-6, -2), 0), rot=(0, 0, k), size=0.8, axis="z", name=f"Semak_Pantai_{k}")
ph_model("coast_rocks_01", S, loc=(-9, 16, -0.6), size=3.0, axis="max", name="Karang_1")
ph_model("coast_land_rocks_02", S, loc=(12, 14, -0.4), size=4.0, axis="max", name="Karang_2")
# the European ships in the bay + a boat on the beach
ph_model("dutch_ship_large_01", S, loc=(-14, 95, -0.6), rot=(0, 0, math.radians(70)), size=42, axis="max", name="Kapal_Besar")
ph_model("dutch_ship_medium", S, loc=(22, 130, -0.5), rot=(0, 0, math.radians(110)), size=26, axis="max", name="Kapal_Sedang")
ph_model("ship_pinnace", S, loc=(5, 22, -0.45), rot=(0, 0, math.radians(20)), size=8, axis="max", name="Sekoci")
# light: tropical late morning sun from the left, open sky
world_hdri("secluded_beach", strength=1.0, rot_z=math.radians(200), res="4k")
sun(L, "MATAHARI", 5.0, elevation=40, azimuth=150, color=(1.0, 0.95, 0.85), angle=0.6)
lamp(L, "PANTUL_SERAMBI", "AREA", 260, (0, -4.5, FZ + 0.6), aim=(0, -1.0, FZ + 0.4), color=(1.0, 0.92, 0.8), size=3.5)   # sun bounce off the sand
mark(S, "leluhur_a", (-0.35, -0.7, FZ), 0)
mark(S, "leluhur_b", (0.45, -0.6, FZ), 0)
mark(S, "pelaut", (0.0, -2.5, FZ - 0.72), 0)
save("nusantara")
if "preview" in sys.argv:
    print("PREVIEW", preview("nusantara", [((3.5, -9.5, 2.0), (0, 1.0, 2.0), 24), ((2.0, 6.0, 1.2), (-3, 100, 6), 35), ((0.1, -2.1, FZ + 0.7), (-0.3, -1.05, FZ), 45)]))
