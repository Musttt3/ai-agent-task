# Export one character for the three.js render:  blender -b characters/<name>.blend --python characters/export_char.py -- <name>
# -> export/char_<name>.glb : all parts visible (the renderer toggles face parts by node name), armature bones as
#    nodes (rigid parts are children of their bone), modifiers applied, Y-up. Rest pose, IK off.
import bpy, os, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
NAME = sys.argv[sys.argv.index("--") + 1]
sc = bpy.context.scene
HR = bpy.data.objects["HERO_ROOT"]; arm = bpy.data.objects["HERO_RIG"]
for b in arm.pose.bones:
    b.rotation_euler = (0, 0, 0); b.location = (0, 0, 0)
    for c in b.constraints: c.influence = 0.0
HR.scale = (1, 1, 1)   # the renderer applies the variant's scale (stored as extra)
bpy.ops.object.select_all(action="DESELECT")
for o in list(bpy.data.collections["HERO"].objects):
    o.hide_render = False; o.hide_viewport = False
    if o.name in bpy.context.view_layer.objects: o.select_set(True)
HR["skala"] = float(HR.get("skala", 1.0))
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT, "export", f"char_{NAME}.glb"), export_format="GLB", use_selection=True,
                          export_apply=True, export_animations=False, export_yup=True, export_extras=True, export_skins=False)
print("EXPORTED char", NAME)
