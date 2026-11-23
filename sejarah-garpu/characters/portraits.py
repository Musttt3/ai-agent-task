# Close-up portraits for look review: blender -b --python characters/portraits.py -- name1 name2 ... -> review/potret_<names>.png
import bpy, sys, os, math
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from mh_lib import build_char, arms_down
from cast import CAST
names = sys.argv[sys.argv.index("--") + 1:]
out = os.path.join(HERE, "..", "review")
tiles = []
for n in names:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    body, rig = build_char(dict(name=n, **CAST[n]), subdiv=1); arms_down(rig)
    bpy.context.view_layer.update()
    head = rig.matrix_world @ rig.pose.bones["head"].head
    eye = head + Vector((0, 0, 0.09))
    sc.render.engine = "CYCLES"; c = sc.cycles; c.samples = 40; c.use_denoising = True; c.texture_limit_render = "2048"
    sc.render.resolution_x, sc.render.resolution_y = 540, 960; sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"
    w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.22, 0.18, 0.15, 1); w.node_tree.nodes["Background"].inputs[1].default_value = 0.6
    def light(nm, off, e, s, col):
        ld = bpy.data.lights.new(nm, "AREA"); ld.energy = e; ld.size = s; ld.color = col
        o = bpy.data.objects.new(nm, ld); sc.collection.objects.link(o); o.location = eye + Vector(off)
        o.rotation_euler = (eye - o.location).to_track_quat("-Z", "Y").to_euler()
    light("KEY", (-0.9, -1.0, 0.6), 90, 0.8, (1.0, 0.86, 0.7)); light("FILL", (1.2, -1.0, 0.0), 18, 1.5, (0.8, 0.88, 1.0)); light("RIM", (0.7, 1.0, 0.5), 70, 0.6, (1.0, 0.9, 0.8))
    cd = bpy.data.cameras.new("C"); cd.lens = 70; cd.dof.use_dof = True; cd.dof.aperture_fstop = 2.8
    cam = bpy.data.objects.new("C", cd); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = eye + Vector((0.28, -1.05, -0.02)); cam.rotation_euler = ((eye - Vector((0, 0, 0.12))) - cam.location).to_track_quat("-Z", "Y").to_euler()
    fo = bpy.data.objects.new("F", None); sc.collection.objects.link(fo); fo.location = eye + Vector((0, -0.1, 0)); cd.dof.focus_object = fo
    p = os.path.join(out, f"_p_{n}.png"); sc.render.filepath = p; bpy.ops.render.render(write_still=True); tiles.append(p)
    print("PORTRAIT", n)
# contact strip
import numpy as np
imgs = [bpy.data.images.load(p) for p in tiles]
W, H = 540, 960
strip = bpy.data.images.new("strip", W * len(imgs), H)
buf = np.zeros((H, W * len(imgs), 4), dtype=np.float32)
for i, im in enumerate(imgs):
    a = np.array(im.pixels[:], dtype=np.float32).reshape(H, W, 4); buf[:, i * W:(i + 1) * W] = a
strip.pixels = buf.ravel(); strip.filepath_raw = os.path.join(out, "potret_" + "_".join(names) + ".png"); strip.file_format = "PNG"; strip.save()
for p in tiles: os.remove(p)
print("STRIP done")
