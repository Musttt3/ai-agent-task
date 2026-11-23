# Close-up of a hand at a frame from two angles: blender -b shots/blend/<SID>.blend --python shots/handcheck.py -- <rig> <side> <frame>
import bpy, sys, os
from mathutils import Vector
a = sys.argv[sys.argv.index("--") + 1:]; rig_name, side, frame = a[0], a[1], int(a[2])
sc = bpy.context.scene; sc.frame_set(frame)
r = bpy.data.objects[rig_name]; h = r.matrix_world @ r.pose.bones[f"wrist.{side}"].tail
sc.render.resolution_x = sc.render.resolution_y = 500; sc.cycles.samples = 16
outs = []
for i, off in enumerate([Vector((-0.25, -0.1, 0.05)), Vector((0.05, -0.25, -0.12)), Vector((0.2, 0.1, 0.15))]):
    cd = bpy.data.cameras.new("H"); cd.lens = 50; cam = bpy.data.objects.new("H", cd); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = h + off; cam.rotation_euler = (h - cam.location).to_track_quat("-Z", "Y").to_euler()
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "review", "shots", f"tangan_{rig_name}_{side}_{frame}_{i}.png")
    sc.render.filepath = p; bpy.ops.render.render(write_still=True); outs.append(p)
print("HAND", outs)
