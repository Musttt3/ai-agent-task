# Shot 03 — "Kok bisa?" (110-141). Close-up: the NARATOR at his dining table looks at the golden fork in his hand,
# one eyebrow up (MIKIR).
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot_lib import *
from venesia_common import look
SID = "03"; f0, f1, _ = SHOTS[SID]
sc = open_set("ruang_makan", SID)
TH = 0.76
b, r = actor("narator", loc=Vector((0.0, 0.74, 0)), yaw=0)
P.sit(r, b, seat_z(0.0, 0.74), lean=10)
X, F, U = P.char_axes(r)
g = bpy.data.objects["GARPU_EMAS"]; g["grip_mode"] = "pena"
show = P.bone_world(r, "spine01") + F * 0.33 + U * 0.25 - X * 0.08
d_up = (U * 0.85 + F * 0.2 + X * 0.3).normalized()
hold(g, r, "R", [(f0, show), (f1, show + U * 0.01)], point_local=Vector(g["tip"]), grip_local=(0, 0, 0.0), pole=-U * 0.8 - X * 0.6,
     hand_dirs={f0: d_up, f1: d_up}, palm_dirs={f0: X * 0.7 - F * 0.4, f1: X * 0.7 - F * 0.4}, fingers=(1, 3), pre_shape=("garpu", 1.0), prop_dirs={f0: d_up, f1: d_up})
P.relaxed_arms(r, sides=("L",))
P.reach(r, "L", Vector((0.22, 0.38, TH + 0.035)), pole_dir=X - U * 0.5, wrist_fwd=F - U * 0.15); P._roll_palm(r, "L", -U); P.hand_shape(r, "L", "rileks", 0.6)
P.key_pose(r, f0, bones=[pb.name for pb in r.pose.bones if pb.name.endswith(".L")]); r.keyframe_insert("location", frame=f0)
tip = g.matrix_world @ Vector(g["tip"])
look(r, f0, tip, 0.8); look(r, f1, tip, 0.85)
P.face(b, f0, "MIKIR", 0.6, extra={"eyeLookUpLeft": 0, "eyeLookUpRight": 0}); P.face(b, 120, "MIKIR", 1.0, extra={"eyeLookUpLeft": 0, "eyeLookUpRight": 0}); P.face(b, f1, "MIKIR", 1.0, extra={"eyeLookUpLeft": 0, "eyeLookUpRight": 0})
head = P.bone_world(r, "head") + U * 0.05
cam = camera(SID, 55, [(f0, head + Vector((-0.25, -0.95, -0.05)), (head + tip) / 2), (f1, head + Vector((-0.22, -0.85, -0.05)), (head + tip) / 2)], focus=head, fstop=2.4)
finish(SID, chars=[(b, r)], props=[g])
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, f1]))
