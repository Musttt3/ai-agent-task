# Shot 04 — "Awalnya, manusia makan pakai tangan." (142-223). Medium-wide, slow push-in: the PURBA sits on the log
# by the fire and eats roast meat with his hands (both hands on the bone, a bite at 175, chewing).
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot_lib import *
SID = "04"; f0, f1, _ = SHOTS[SID]
sc = open_set("gua", SID)
b, r = actor("purba", loc=Vector((0.0, 1.42, 0)), yaw=0)
P.sit(r, b, seat_z(0.0, 1.4), lean=14, spread=0.12)
X, F, U = P.char_axes(r)
meat = bpy.data.objects["DAGING_BAKAR"]
mouth = P.lips_front(b, r, out=0.115)
low = P.bone_world(r, "spine01") + F * 0.4 + U * 0.02 - X * 0.05
# right hand holds the bare bone end; the meat comes up to the mouth for a bite (the meat surface stops at the lips)
d_meat = (X * 1.0 + U * 0.25 - F * 0.1).normalized()      # the bone lies across, meat toward his left
keys = [(f0, low), (166, mouth + F * 0.05 - U * 0.03), (176, mouth), (192, mouth + F * 0.07 - U * 0.08), (f1, low + U * 0.05)]
errs = hold(meat, r, "R", keys, point_local=Vector((0, 0, 0.01)), grip_local=(0, 0, -0.121), axis_local=(0, 0, 1), pole=-U * 0.8 - X * 0.5,
            hand_dir=(F * 0.6 + X * 0.6 + U * 0.3).normalized(), palm_dir=(X * 0.5 + U * 0.6).normalized(), pre_shape=("pegang", 0.6),
            prop_dirs={k[0]: d_meat for k in keys})
print("HOLD", errs)
# left hand rests on the left knee
sc.frame_set(f0)
knee = P.bone_world(r, "lowerleg01.L")
P.reach(r, "L", knee + U * 0.13 - F * 0.06, pole_dir=X * 0.8 - F * 0.2, wrist_fwd=(F * 0.9 - U * 0.15 + X * 0.15).normalized())
P._roll_palm(r, "L", -U); P.hand_shape(r, "L", "rileks", 0.7)
P.key_pose(r, f0, bones=[pb.name for pb in r.pose.bones if pb.name.endswith(".L") and ("arm" in pb.name or "wrist" in pb.name or "finger" in pb.name)])
P.face(b, f0, "NETRAL", extra={"eyeLookDownLeft": 0.4, "eyeLookDownRight": 0.4})
P.face(b, 170, "NETRAL", extra={"jawOpen": 0.45, "mouthFunnel": 0.1})
P.face(b, 178, "MENGUNYAH", 1.2); P.face(b, 186, "NETRAL", extra={"jawOpen": 0.08}); P.face(b, 194, "MENGUNYAH", 1.2)
P.face(b, 202, "SENYUM", 0.4, extra={"jawOpen": 0.05}); P.face(b, f1, "SENYUM", 0.5)
P.blink(b, 200)
head = P.bone_world(r, "head")
cam = camera(SID, 32, [(f0, (0.35, -1.9, 1.05), (0.1, 1.3, 0.8)), (f1, (0.3, -1.3, 1.0), (0.08, 1.3, 0.85))], focus=head, fstop=3.2)
finish(SID, chars=[(b, r)], props=[meat], env=[bpy.data.objects["Batang_Duduk"]])
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 176, f1]))
