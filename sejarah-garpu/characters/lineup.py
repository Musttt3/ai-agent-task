# Line-up render of the cast: blender -b --python characters/lineup.py -- [names...]  -> review/pemeran_lineup.png
import bpy, sys, os, math
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from mh_lib import build_char, arms_down
from cast import CAST
names = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else list(CAST)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
gap = 0.85
for i, n in enumerate(names):
    body, rig = build_char(dict(name=n, **CAST[n]), subdiv=0)
    rig.location.x = (i - (len(names) - 1) / 2) * gap
    arms_down(rig)
sc.render.engine = "CYCLES"; c = sc.cycles; c.samples = 24; c.use_denoising = True; c.max_bounces = 4; c.transparent_max_bounces = 16; c.texture_limit_render = "1024"
sc.render.resolution_x, sc.render.resolution_y = 2400, 900
sc.view_settings.view_transform = "AgX"
w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.5, 0.52, 0.55, 1); w.node_tree.nodes["Background"].inputs[1].default_value = 0.5
def light(nm, loc, e, s, col=(1, 1, 1)):
    ld = bpy.data.lights.new(nm, "AREA"); ld.energy = e; ld.size = s; ld.color = col
    o = bpy.data.objects.new(nm, ld); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((0, 0, 1.0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
light("KEY", (-3, -5, 4), 1500, 5, (1, 0.93, 0.85)); light("FILL", (4, -4, 2), 500, 6); light("RIM", (0, 4, 4), 900, 6)
bpy.ops.mesh.primitive_plane_add(size=60)
cd = bpy.data.cameras.new("C"); cd.type = "ORTHO"; cd.ortho_scale = max(2.4, (len(names) * gap + 0.4) * 900 / 2400) * 2400 / 900 if False else max(len(names) * gap + 0.4, 2.2 * 2400 / 900)
cam = bpy.data.objects.new("C", cd); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (0, -12, 0.95); cam.rotation_euler = (math.radians(90), 0, 0)
sc.render.filepath = os.path.join(HERE, "..", "review", "pemeran_" + ("_".join(names) if len(names) < 3 else names[0] + "_dst") + ".png")
bpy.ops.render.render(write_still=True)
print("LINEUP done", names)
