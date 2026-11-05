# Render stills of chosen cameras at their key frames: blender -b sets/kamar.blend --python sets/stills.py -- kamar cahaya 02:104 03:190 05:290 [percent]
import bpy, os, sys
a = sys.argv[sys.argv.index("--") + 1:]
setname, stage, jobs = a[0], a[1], [x for x in a[2:] if ":" in x]
pct = next((int(x) for x in a[2:] if ":" not in x), 100)
sc = bpy.context.scene; sc.render.resolution_percentage = pct
out = os.path.join(os.path.dirname(bpy.data.filepath), "..", "review")
for j in jobs:
    cid, fr = j.split(":"); cam = bpy.data.objects["CAM_" + cid]; sc.camera = cam; sc.frame_set(int(fr))
    want = set(filter(None, (cam.get("show", "") + "," + cam.get("dummy", "")).split(",")))
    for o in sc.objects:  # only this shot's stand-ins are visible
        root = o
        while root.parent: root = root.parent
        if root.name.startswith(("HERO_", "FIG_")): o.hide_render = root.name not in want
    sc.render.filepath = os.path.join(out, f"{setname}_{stage}_CAM_{cid}.png")
    bpy.ops.render.render(write_still=True); print("STILL", cid, fr)
