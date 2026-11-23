# Shot 06 — "Cangkang kerang dan serpihan kayu." (246-310). Macro on the flat stone: the PURBA's right hand scoops
# broth from the stone bowl with a clam shell (on "Cangkang", 246-275), the camera slides to the wood chip (289).
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot_lib import *
SID = "06"; f0, f1, _ = SHOTS[SID]
sc = open_set("gua", SID)
b, r = actor("purba", loc=Vector((-0.55, 1.08, 0)), yaw=0)
P.sit(r, b, 0.3, lean=30, spread=0.15)     # crouched on a low stone behind the slab (out of frame)
X, F, U = P.char_axes(r)
bowl = bpy.data.objects["MANGKUK_BATU"]; shell = bpy.data.objects["CANGKANG_KERANG"]; chip = bpy.data.objects["SERPIHAN_KAYU"]
bc = bowl.matrix_world.translation; surf = bc.z + 0.062
inside = Vector((bc.x + 0.02, bc.y + 0.01, surf - 0.006))
up_pt = Vector((bc.x + 0.02, bc.y - 0.06, surf + 0.07))
shell["grip_mode"] = "palm"
errs = hold(shell, r, "R", [(f0, up_pt + U * 0.03), (258, inside), (268, inside + Vector((0.0, -0.03, 0.01))), (282, up_pt), (f1, up_pt + U * 0.02)],
            point_local=Vector(shell["tip"]), grip_local=(0, -0.004, 0.012), axis_local=(0, 0, 1), pole=-U * 0.7 - X * 0.6,
            hand_dir=(F * 0.8 - U * 0.4).normalized(), palm_dir=(U * 0.2 - F * 0.2 + X * 0.6).normalized(), fingers=(1, 2, 3), pre_shape=("cubit", 0.6))
print("HOLD", errs)
P.relaxed_arms(r, sides=("L",)); P.key_pose(r, f0, bones=[pb.name for pb in r.pose.bones if pb.name.endswith(".L")])
cam = camera(SID, 60, [(f0, bc + Vector((0.12, -0.42, 0.24)), bc + Vector((0.0, 0.0, 0.03))), (275, bc + Vector((0.06, -0.4, 0.22)), bc + Vector((-0.05, 0.0, 0.03))),
                       (f1, chip.matrix_world.translation + Vector((0.04, -0.36, 0.2)), chip.matrix_world.translation)],
             focus=bc + Vector((0, 0, 0.06)), fstop=3.5)
foc = bpy.data.objects["FOCUS_" + SID]
foc.location = bc + Vector((0, 0, 0.06)); foc.keyframe_insert("location", frame=275)
foc.location = chip.matrix_world.translation; foc.keyframe_insert("location", frame=292)
finish(SID, chars=[(b, r)], props=[shell, bowl], env=[bpy.data.objects["Batu_Datar"]] if bpy.data.objects.get("Batu_Datar") else [])
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 262, f1]))
