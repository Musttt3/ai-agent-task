# Render the first frame of every CAM_* in a .blend (Workbench, grey) -> review/<set>_<stage>_<cam>.png
# blender -b sets/kamar.blend --python sets/look_sheet.py -- kamar blok [WORKBENCH|BLENDER_EEVEE_NEXT] [percent]
import bpy, os, sys
args = sys.argv[sys.argv.index("--") + 1:]
setname, stage = args[0], args[1]
eng = args[2] if len(args) > 2 else "BLENDER_WORKBENCH"
pct = int(args[3]) if len(args) > 3 else 50
out = os.path.join(os.path.dirname(bpy.data.filepath), "..", "review")
sc = bpy.context.scene
sc.render.engine = eng
sc.render.resolution_percentage = pct
if eng == "BLENDER_WORKBENCH":
    sh = sc.display.shading
    sh.light, sh.color_type, sh.show_cavity, sh.show_shadows = "STUDIO", "SINGLE", True, False
    sh.single_color = (0.62, 0.62, 0.62)
for cam in sorted([o for o in sc.objects if o.type == "CAMERA"], key=lambda o: o.name):
    sc.camera = cam
    sc.frame_set(int(cam.get("frame_start", 0)))
    want = cam.get("dummy", "")
    for o in sc.objects:  # only this shot's stand-in is visible
        root = o.parent if o.parent else o
        if root.name.startswith("HERO_"): o.hide_render = root.name != want
    sc.render.filepath = os.path.join(out, f"{setname}_{stage}_{cam.name}.png")
    bpy.ops.render.render(write_still=True)
    print("LOOK", cam.name)
