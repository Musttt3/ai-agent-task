# Product-shot catalogue of the hand-made props: blender -b --python props/catalog.py -> review/properti_katalog.png
import bpy, sys, os, math
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import props as PR
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
items = [
    (PR.garpu_emas(), (0, 0, 0), (math.radians(90), 0, 0)),
    (PR.garpu_coryat(), (0.06, 0, 0), (math.radians(90), 0, 0)),
    (PR.sendok_cochlear(), (0.12, 0, 0), (math.radians(90), 0, 0)),
    (PR.sumpit_perunggu(), (0.19, 0, 0), (math.radians(90), 0, 0)),
    (PR.serpihan_kayu(), (0.26, 0, 0), (math.radians(90), 0, 0)),
]
s, f = PR.sendok_garpu_eropa(); items += [(s, (0.32, 0, 0), (math.radians(90), 0, 0)), (f, (0.37, 0, 0), (math.radians(90), 0, 0))]
for o, loc, rot in items:
    o.location = Vector(loc) + Vector((0, 0, 0.12)); o.rotation_euler = rot
k = PR.cangkang_kerang(); k.location = (0.0, -0.05, 0.31); k.rotation_euler = (math.radians(90), 0, 0)
sp = PR.siput(body_out=0.6); sp.location = (0.12, -0.05, 0.34)
mb = PR.mangkuk_batu(); mb.location = (0.3, 0.1, 0.24); mb.scale = (0.6,) * 3
dg = PR.daging_bakar(); dg.location = (0.48, 0, 0.2); dg.rotation_euler = (0, math.radians(20), 0)
d = PR.ding(); d.location = (0.75, 0.1, 0.0)
kt = PR.kotak_garpu(); kt.location = (0.2, -0.05, 0.32); kt.rotation_euler = (0, math.radians(90), 0)
l = PR.lilin(); l.location = (0.62, -0.05, 0.05)
nd = PR.nasi_di_daun(); nd.location = (0.15, 0.05, 0.0)
pm = PR.nasi_piring_modern(); pm.location = (0.5, -0.05, 0.0)
bpy.ops.mesh.primitive_plane_add(size=6); fl = bpy.context.object
fl.data.materials.append(PR.mat_simple("Lantai_Katalog", (0.35, 0.33, 0.3), rough=0.6))
bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0.6, 0), rotation=(math.radians(90), 0, 0)); bpy.context.object.data.materials.append(bpy.data.materials["Lantai_Katalog"])
sc.render.engine = "CYCLES"; sc.cycles.samples = 64; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = 1800, 1000; sc.view_settings.view_transform = "AgX"
w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True; w.node_tree.nodes["Background"].inputs[1].default_value = 0.3
for nm, loc, e in (("K", (-0.8, -1.2, 1.4), 300), ("F", (1.6, -1.0, 0.8), 120), ("R", (0.4, 0.8, 1.2), 150)):
    ld = bpy.data.lights.new(nm, "AREA"); ld.energy = e; ld.size = 1.2; o = bpy.data.objects.new(nm, ld); sc.collection.objects.link(o)
    o.location = loc; o.rotation_euler = (Vector((0.38, 0, 0.15)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
cd = bpy.data.cameras.new("C"); cd.lens = 40; cam = bpy.data.objects.new("C", cd); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (0.38, -1.25, 0.55); cam.rotation_euler = (Vector((0.38, 0, 0.18)) - cam.location).to_track_quat("-Z", "Y").to_euler()
sc.render.filepath = os.path.join(HERE, "..", "review", "properti_katalog.png"); bpy.ops.render.render(write_still=True); print("CATALOG ok")
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "props_catalog.blend"))
