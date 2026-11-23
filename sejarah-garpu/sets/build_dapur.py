# Dapur Tiongkok kuno (Dinasti Shang, ±1200 SM): blender -b --python sets/build_dapur.py [-- preview]
# Rammed-earth walls, timber posts and beams, thatched roof, earth floor. A clay hearth with a bronze ding over the
# fire; KOKI stands behind it at (0, 1.0) facing -Y. A small wooden stand displays a pair of bronze chopsticks.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *

sc = new_scene()
S = coll("SET"); P = coll("PROPS"); L = coll("LIGHTS")
earth = mat_ph("Tanah_Padat", "brown_mud_dry", scale=2.0, tint=(0.85, 0.75, 0.62))
wallm = mat_ph("Dinding_Tanah", "clay_plaster", scale=2.0, tint=(0.85, 0.72, 0.58))
timber = mat_ph("Kayu_Tiang", "medieval_wood", scale=1.5, tint=(0.7, 0.55, 0.42))
thatch = mat_ph("Atap_Jerami", "reed_roof_04", scale=1.5)
clay = mat_ph("Tungku_Tanah", "brown_mud_rocks_01", scale=0.8, tint=(0.75, 0.55, 0.42))
W, D, H = 8.0, 7.0, 3.2
box(S, "Lantai", (0, 1.0, -0.05), (W, D, 0.1), earth)
wall_with_openings(S, "Dinding_Belakang", -W / 2, W / 2, 1.0 + D / 2, H, 0.45, wallm, [(-2.2, 1.0, 1.1, 0.9, False)], axis="x")
wall_with_openings(S, "Dinding_Kiri", 1.0 - D / 2, 1.0 + D / 2, -W / 2, H, 0.45, wallm, [(1.5, 0.9, 1.0, 1.0, False)], axis="y")
wall_with_openings(S, "Dinding_Kanan", 1.0 - D / 2, 1.0 + D / 2, W / 2, H, 0.45, wallm, [(0.0, 0.0, 1.4, 2.2, False)], axis="y")
# posts and beams
for x in (-2.6, 2.6):
    for y in (-1.0, 3.6):
        box(S, f"Tiang_{x}_{y}", (x, y, H / 2), (0.22, 0.22, H), timber, bevel=0.02)
for y in (-1.0, 1.3, 3.6):
    box(S, f"Balok_{y}", (0, y, H + 0.1), (W, 0.24, 0.24), timber, bevel=0.02)
# thatched gable roof: ridge along Y, eaves overhanging; gable triangles of rammed earth close both ends
import bmesh as _bm
RISE = 1.6; OVER = 0.5
for sgn in (-1, 1):
    half = W / 2 + OVER; L_ = math.hypot(half, RISE)
    r = box(S, f"Atap_{sgn}", (sgn * half / 2, 1.0, H + 0.22 + RISE / 2), (L_, D + 1.0, 0.22), thatch, rot=(0, math.atan2(RISE, half) * sgn, 0))
for yy in (1.0 - D / 2, 1.0 + D / 2):
    bm_ = _bm.new()
    vs = [bm_.verts.new(p_) for p_ in ((-W / 2, yy, H), (W / 2, yy, H), (0, yy, H + RISE))]
    bm_.faces.new(vs); me = bpy.data.meshes.new("Gevel"); bm_.to_mesh(me); bm_.free()
    g = bpy.data.objects.new(f"Gevel_{yy:.1f}", me); S.objects.link(g); me.materials.append(wallm)
    g.modifiers.new("Tebal", "SOLIDIFY").thickness = 0.45
# hearth: a raised clay platform with an opening for the fire, the ding stands over it
box(S, "Tungku", (0, 0.4, 0.14), (1.2, 1.0, 0.28), clay, bevel=0.06)
fire(S, "API_TUNGKU", (0, 0.4, 0.29), size=0.3, energy=280)
d = PR.ding("DING", P); d.location = (0, 0.4, 0.29)
# steam (thin volumetric column above the soup)
bpy.ops.mesh.primitive_cylinder_add(radius=0.22, depth=1.4, location=(0, 0.4, 0.29 + 0.36 + 0.7))
st = bpy.context.object; st.name = "UAP"; link(st, P)
sm = bpy.data.materials.new("Uap"); sm.use_nodes = True; nt = sm.node_tree; nt.nodes.clear()
o_ = nt.nodes.new("ShaderNodeOutputMaterial"); vp = nt.nodes.new("ShaderNodeVolumePrincipled"); vp.inputs["Density"].default_value = 0.0
tc = nt.nodes.new("ShaderNodeTexCoord"); nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 3.0; nz.inputs["Detail"].default_value = 6
sep = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(tc.outputs["Generated"], sep.inputs[0]); nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs["From Min"].default_value = 0.5; mr.inputs["From Max"].default_value = 0.75
mr.inputs["To Min"].default_value = 0.0; mr.inputs["To Max"].default_value = 0.6
nt.links.new(nz.outputs["Fac"], mr.inputs["Value"])
fade = nt.nodes.new("ShaderNodeMath"); fade.operation = "SUBTRACT"; fade.inputs[0].default_value = 1.0; nt.links.new(sep.outputs["Z"], fade.inputs[1])
mul = nt.nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"; nt.links.new(mr.outputs["Result"], mul.inputs[0]); nt.links.new(fade.outputs[0], mul.inputs[1])
nt.links.new(mul.outputs[0], vp.inputs["Density"]); vp.inputs["Color"].default_value = (0.9, 0.9, 0.9, 1)
nt.links.new(vp.outputs[0], o_.inputs["Volume"]); st.data.materials.append(sm)
mp = nt.nodes.new("ShaderNodeMapping"); nt.links.new(tc.outputs["Object"], mp.inputs["Vector"]); nt.links.new(mp.outputs["Vector"], nz.inputs["Vector"])
for f in range(0, 1600, 30):   # rising steam
    mp.inputs["Location"].default_value = (0, 0, -f * 0.012); mp.inputs["Location"].keyframe_insert("default_value", frame=f)
for fc in nt.animation_data.action.fcurves:
    for kp in fc.keyframe_points: kp.interpolation = "LINEAR"
# work table (low, Shang people knelt on mats) and kitchen things
box(S, "Meja_Rendah", (-1.7, 1.6, 0.32), (1.4, 0.7, 0.06), timber, bevel=0.01)
for sx in (-1, 1):
    for sy in (-1, 1): box(S, f"Kaki_Meja_{sx}{sy}", (-1.7 + sx * 0.6, 1.6 + sy * 0.28, 0.15), (0.07, 0.07, 0.3), timber)
ph_model("wooden_cutting_board", P, loc=(-1.9, 1.6, 0.35), size=0.45, axis="max", name="Talenan")
ph_model("food_ginger_01", P, loc=(-1.75, 1.55, 0.37), size=0.09, axis="max", name="Jahe")
ph_model("yellow_onion", P, loc=(-1.55, 1.7, 0.35), size=0.08, axis="max", name="Bawang")
ph_model("ceramic_pot", S, loc=(-2.9, 3.0, 0), size=0.6, axis="z", name="Gentong_1")
ph_model("ceramic_vase_02", S, loc=(-3.2, 2.3, 0), size=0.5, axis="z", name="Gentong_2")
ph_model("wooden_bucket_01", S, loc=(1.6, 2.6, 0), size=0.4, axis="z", name="Ember_Kayu")
ph_model("wicker_basket_01", S, loc=(2.3, 1.7, 0), size=0.35, axis="z", name="Keranjang")
ph_model("brass_pot_02", S, loc=(1.4, 3.3, 0), size=0.32, axis="z", name="Pot_Kecil")
# chopstick display: a small wooden stand on a wooden shelf by the right post
box(S, "Rak_Kayu", (2.3, 0.2, 0.9), (0.9, 0.45, 0.05), timber, bevel=0.01)
for sx in (-1, 1): box(S, f"Penyangga_Rak_{sx}", (2.3 + sx * 0.4, 0.2, 0.45), (0.06, 0.4, 0.9), timber)
stand = box(S, "Tatakan_Sumpit", (2.3, 0.15, 0.94), (0.2, 0.06, 0.03), mat_ph("Kayu_Tatakan", "rosewood_veneer1", scale=0.3), bevel=0.008)
sp = PR.sumpit_perunggu("SUMPIT_PAJANG", 0.24, P); sp.rotation_euler = (0, math.radians(90), math.radians(8)); sp.location = (2.3 - 0.0, 0.15, 0.968)
sl = PR.sumpit_perunggu("SUMPIT_MASAK", 0.36, P); sl.location = (0.3, 0.75, 0.9)   # long cooking pair, posed in the shot
# light: daylight through the back window and the right doorway; fire
world_hdri("citrus_orchard_puresky", strength=0.6, rot_z=math.radians(40))
sun(L, "MATAHARI", 3.5, elevation=35, azimuth=230, color=(1.0, 0.9, 0.75), angle=1.0)
lamp(L, "PINTU_ISI", "AREA", 300, (3.8, 1.0, 1.2), aim=(0, 0.6, 1.0), color=(0.85, 0.9, 1.0), size=2.0)
lamp(L, "ISI_DEPAN", "AREA", 120, (0, -3.0, 2.0), aim=(0, 0.8, 1.0), color=(1.0, 0.85, 0.7), size=3.0)
mark(S, "koki", (0.0, 1.0, 0), 0)
save("dapur")
if "preview" in sys.argv:
    print("PREVIEW", preview("dapur", [((0.6, -3.4, 1.7), (0, 1.0, 0.9), 26), ((2.05, -0.25, 1.1), (2.3, 0.15, 0.96), 55)]))
