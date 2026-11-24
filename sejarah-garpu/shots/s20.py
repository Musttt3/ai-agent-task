# Shot 20 — "si pembawa garpu." (1113-1157). Close-up, slow push-in: CORYAT's proud smile fades; he lowers the fork.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from london_common import *
SID = "20"; f0, f1, _ = SHOTS[SID]
sc = open_set("london", SID)
b, r = coryat_seated(f0, f1)
X, F, U = P.char_axes(r)
# left hand rests in the lap (keeps the forearm out of the close-up)
P.reach(r, "L", P.bone_world(r, "spine01") + F * 0.3 - U * 0.1 + X * 0.12, pole_dir=-U * 0.5 + X * 0.8, wrist_fwd=(F - U * 0.3).normalized())
P._roll_palm(r, "L", -U); P.hand_shape(r, "L", "rileks", 0.3)
Lb = [pb.name for pb in r.pose.bones if pb.name.endswith(".L") or pb.name.endswith("_l")]
P.key_pose(r, f0, Lb); P.key_pose(r, f1, Lb)
g = bpy.data.objects["GARPU_CORYAT"]; g["grip_mode"] = "genggam"; g["r"] = 0.009
GL = Vector((0, 0, -0.035))
# fist held up beside his face with the fork upright, then lowered to the table edge, tines forward
show = P.bone_world(r, "spine01") + F * 0.18 + U * 0.16 - X * 0.26
low = P.bone_world(r, "spine01") + F * 0.4 - U * 0.12 - X * 0.14
d_up = (U * 0.95 + X * 0.12 + F * 0.05).normalized(); d_low = (F * 0.7 + U * 0.35 + X * 0.3).normalized()
d_fwd = (F * 0.85 + X * 0.35 - U * 0.1).normalized()
hold(g, r, "R", [(f0, show), (1128, show), (1145, low), (f1, low)], point_local=GL, grip_local=GL, pole=-U * 0.9 - X * 0.4,
     hand_dirs={f0: d_fwd, 1128: d_fwd, 1145: d_fwd, f1: d_fwd}, palm_dirs={f0: X, 1128: X, 1145: X * 0.7 - U * 0.3, f1: X * 0.7 - U * 0.3},
     fingers=(1, 2, 3, 4, 5), pre_shape=("pegang", 0.55), prop_dirs={f0: d_up, 1128: d_up, 1145: d_low, f1: d_low})
look(r, f0, Vector((-1.15, 0.45, 1.16)), 0.75); look(r, 1135, Vector((-1.15, 0.45, 1.16)), 0.75); look(r, f1, low + U * 0.12, 0.6)
P.face(b, f0, "BANGGA", 0.9); P.face(b, 1122, "BANGGA", 0.6); P.face(b, 1132, "BINGUNG", 0.7); P.face(b, f1, "SEDIH", 0.9)
P.blink(b, 1140)
head = P.bone_world(r, "head") + U * 0.06
cam = camera(SID, 50, [(f0, head + Vector((-0.72, -0.96, -0.12)), head - U * 0.12 - X * 0.14), (f1, head + Vector((-0.6, -0.8, -0.2)), head - U * 0.12)], focus=head, fstop=2.2)
finish(SID, chars=[(b, r)], props=[g])
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 1135, f1]))
