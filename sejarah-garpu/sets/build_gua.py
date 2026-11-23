# Gua prasejarah: blender -b --python sets/build_gua.py [-- preview]
# A shallow cave: rock walls around (+Y back), cave mouth toward -Y (cool daylight), fire pit, log seat.
# PURBA sits on a log at (0, 1.25) facing -Y; flat stone with the stone bowl, clam shell and wood chip at (-0.55, 0.55).
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import *
from mathutils import noise

sc = new_scene()
S = coll("SET"); P = coll("PROPS"); L = coll("LIGHTS")
dirt = mat_ph("Tanah_Gua", "dirt_floor", scale=1.4, tint=(0.75, 0.68, 0.6))
rock = mat_ph("Batu_Gua", "rock_boulder_dry", scale=1.8, tint=(0.62, 0.56, 0.5))
# floor: subdivided plane with gentle bumps
bpy.ops.mesh.primitive_grid_add(x_subdivisions=120, y_subdivisions=120, size=14, location=(0, 2, 0))
fl = bpy.context.object; fl.name = "Lantai_Gua"; link(fl, S); fl.data.materials.append(dirt)
for v in fl.data.vertices:
    p = v.co; d = math.hypot(p.x, p.y - 0.3)
    v.co.z = noise.noise(Vector((p.x, p.y, 0)) * 0.6) * 0.12 + noise.noise(Vector((p.x, p.y, 1)) * 3) * 0.02
    v.co.z *= min(1.0, max(0.0, (d - 1.6) / 1.5))          # flat where the people are
# rock shell: a displaced half-dome over the cave (inside faces), opening toward -Y
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=96, v_segments=48, radius=1.0)
bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.15 or v.co.y < -0.55], context="VERTS")
for v in bm.verts:
    p = v.co.copy()
    n = noise.noise(p * 2.5) * 0.12 + noise.noise(p * 7) * 0.04 + noise.noise(p * 19) * 0.012
    v.co = Vector((p.x * 6.0, p.y * 6.5 + 2.0, p.z * 4.0 + 0.4)) * (1 + n)
bmesh.ops.reverse_faces(bm, faces=bm.faces)
me = bpy.data.meshes.new("Dinding_Gua"); bm.to_mesh(me); bm.free()
shell = bpy.data.objects.new("Dinding_Gua", me); S.objects.link(shell); me.materials.append(rock)
for p in me.polygons: p.use_smooth = True
shell.modifiers.new("Tebal", "SOLIDIFY").thickness = 0.4
# scanned rock faces & boulders for detail at the walls
ph_model("rock_face_01", S, loc=(-3.6, 3.6, -0.3), rot=(0, 0, math.radians(30)), size=3.2, axis="z", name="Tebing_1")
ph_model("rock_face_02", S, loc=(3.4, 4.0, -0.3), rot=(0, 0, math.radians(-35)), size=3.4, axis="z", name="Tebing_2")
ph_model("rock_moss_set_01", S, loc=(3.4, 2.2, 0), rot=(0, 0, 1.2), size=0.9, axis="z", name="Batu_Lumut")
ph_model("boulder_01", S, loc=(-2.6, 1.0, 0), rot=(0, 0, 0.4), size=1.0, axis="z", name="Bongkah_1")
ph_model("namaqualand_boulder_02", S, loc=(-1.8, 3.2, 0), rot=(0, 0, 2.0), size=1.2, axis="z", name="Bongkah_2")
ph_model("bark_debris_01", S, loc=(1.6, 0.0, 0), size=0.6, axis="max", name="Serpih_Kulit_Kayu")
ph_model("root_cluster_01", S, loc=(-3.0, 2.4, 0), size=1.0, axis="max", name="Akar")
ph_model("dry_branches_medium_01", S, loc=(2.2, 2.6, 0), rot=(0, 0, 0.7), size=1.6, axis="max", name="Ranting_Kering")
# fire pit + fire, the log seat, a flat stone "table"
ph_model("stone_fire_pit", S, loc=(0.95, 0.45, 0), size=1.0, axis="max", name="Tungku_Batu")
fire(S, "API_UNGGUN", (0.95, 0.45, 0.1), size=0.45, energy=650)
bark = mat_ph("Kulit_Kayu", "bark_brown_02", scale=0.8)
log = cyl(S, "Batang_Duduk", (0.0, 1.4, 0.19), 0.19, 1.7, bark, rot=(0, math.radians(90), 0), verts=40)
for v in log.data.vertices:
    v.co += v.co.normalized() * noise.noise(v.co * 4) * 0.015 if v.co.length > 1e-4 else Vector()
cyl(S, "Ujung_Batang_a", (0.85, 1.4, 0.19), 0.175, 0.01, mat_ph("Serat_Kayu", "medieval_wood", scale=0.3, tint=(0.8, 0.65, 0.5)), rot=(0, math.radians(90), 0), verts=40)
cyl(S, "Ujung_Batang_b", (-0.85, 1.4, 0.19), 0.175, 0.01, bpy.data.materials["Serat_Kayu"], rot=(0, math.radians(90), 0), verts=40)
ph_model("stone_01", S, loc=(-0.6, 0.6, 0), rot=(0, 0, 0.3), size=0.55, axis="max", name="Batu_Datar")
# meal things (positions refined per shot)
mb = PR.mangkuk_batu("MANGKUK_BATU", P); mb.location = (-0.62, 0.55, 0.16)
kr = PR.cangkang_kerang("CANGKANG_KERANG", P); kr.location = (-0.42, 0.5, 0.17); kr.rotation_euler = (math.radians(-90), 0, math.radians(30))
sk = PR.serpihan_kayu("SERPIHAN_KAYU", P); sk.location = (-0.8, 0.45, 0.17); sk.rotation_euler = (math.radians(90), 0, math.radians(70))
dg = PR.daging_bakar("DAGING_BAKAR", P); dg.location = (0.95, 0.45, 0.6)
# light: cool daylight from the mouth (-Y), warm fire, faint sky
world_hdri("forest_cave", strength=0.25, rot_z=0.0)
lamp(L, "MULUT_GUA", "AREA", 380, (-1.5, -5.0, 2.6), aim=(0, 1.5, 0.8), color=(0.72, 0.82, 1.0), size=5.0)
mark(S, "purba", (0.0, 1.25, 0), 0)
save("gua")
if "preview" in sys.argv:
    print("PREVIEW", preview("gua", [((0.2, -2.6, 1.3), (0.2, 1.2, 0.7), 28), ((-0.6, -0.1, 0.55), (-0.6, 0.55, 0.15), 50)]))
