# Line-up render of every character (append each .blend's HERO collection side by side).
#   blender -b --python characters/lineup.py -> review/karakter_lineup.png
import bpy, math, os, sys
from mathutils import Vector
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sets"))
from lib import new_scene, ROOT
sc = new_scene()
names = ["hero", "anak_a", "anak_b", "anak_c", "perawat", "kakek", "petani", "guru", "pengemudi"]
for i, n in enumerate(names):
    with bpy.data.libraries.load(os.path.join(ROOT, "characters", n + ".blend")) as (src, dst):
        dst.collections = ["HERO"]
    c = dst.collections[0]; c.name = "CH_" + n; sc.collection.children.link(c)
    root = next(o for o in c.objects if o.name.startswith("HERO_ROOT"))
    root.location = ((i - 4) * 0.62, 0, 0)
sc.render.resolution_x, sc.render.resolution_y = 2400, 900; sc.eevee.taa_render_samples = 32
sc.view_settings.view_transform = "Standard"; sc.view_settings.look = "None"
w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.86, 0.86, 0.87, 1); w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.55
for nm, loc, en, sz in (("KEY", (-3, -5, 4), 900, 6), ("FILL", (4, -3, 2), 300, 6)):
    ld = bpy.data.lights.new(nm, "AREA"); ld.energy = en; ld.size = sz; lo = bpy.data.objects.new(nm, ld); sc.collection.objects.link(lo)
    lo.location = loc; lo.rotation_euler = (Vector((0, 0, 0.8)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
cd = bpy.data.cameras.new("C"); cd.type = "ORTHO"; cd.ortho_scale = 5.9; cam = bpy.data.objects.new("C", cd); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (0, -8, 0.85); cam.rotation_euler = (math.radians(90), 0, 0)
sc.render.filepath = os.path.join(ROOT, "review", "karakter_lineup.png"); bpy.ops.render.render(write_still=True)
