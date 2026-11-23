# Shot 01 — "Dulu, orang yang makan pakai" (0-51). Close-up of the golden fork on the princess's silver plate,
# candlelight, slow push-in (the mystery object first). Focus locked on the fork.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot_lib import *
from lib import bbox
SID = "01"; f0, f1, _ = SHOTS[SID]
sc = open_set("venesia", SID)
g = bpy.data.objects["GARPU_EMAS"]
bpy.context.view_layer.update()
mn, mx = bbox([g]); mid = (mn + mx) / 2
cam0 = mid + Vector((0.24, -0.2, 0.24)); cam1 = mid + Vector((0.17, -0.14, 0.17))
# nothing between the lens and the fork: hide table things whose centre lies near the camera path
for o in list(bpy.data.collections["PROPS"].all_objects):
    if o == g or o.name.startswith("Piring_putri") or o.type not in ("MESH", "EMPTY"): continue
    c = o.matrix_world.translation
    for p in (cam0, (cam0 + mid) / 2, cam1):
        if (c - p).length < 0.22: o.hide_render = True; [setattr(ch, "hide_render", True) for ch in o.children_recursive]
# warm candle glint from behind-left, darker surroundings
c = PR.lilin("LILIN_DEKAT", 0.16, bpy.data.collections["PROPS"]); c.location = mid + Vector((-0.3, 0.38, -0.024))
fo = bpy.data.objects.new("FOKUS_GARPU", None); sc.collection.objects.link(fo); fo.location = mid
cam = camera(SID, 70, [(f0, cam0, mid), (f1, cam1, mid + Vector((0.004, 0, 0)))], focus=fo, fstop=5.6)
finish(SID, check=False)
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, f1]))
