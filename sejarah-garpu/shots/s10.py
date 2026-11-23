# Shot 10 — "Orang Romawi pakai sendok kecil berujung runcing" (532-616). Medium, slow dolly in: the ROMAWI on his
# couch lifts the small silver cochlear and turns it to show the sharp point (596).
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot_lib import *
SID = "10"; f0, f1, _ = SHOTS[SID]
sc = open_set("romawi", SID)
b, r = actor("romawi", loc=Vector((0.15, 0.78, 0)), yaw=0)
P.sit(r, b, seat_z(0.15, 0.8), lean=12, spread=0.1)
X, F, U = P.char_axes(r)
co = bpy.data.objects["SENDOK_ROMAWI"]; co["grip_mode"] = "pena"
TH = 0.545
table_pt = co.matrix_world.translation + Vector((0, 0, 0.02))
show = P.bone_world(r, "spine01") + F * 0.36 + U * 0.22 - X * 0.12
d_flat = (F * 0.7 + X * 0.5 - U * 0.3).normalized(); d_up = (U * 0.8 + F * 0.4 + X * 0.2).normalized(); d_turn = (U * 0.6 + X * 0.75 + F * 0.2).normalized()
errs = hold(co, r, "R", [(f0, table_pt + U * 0.06), (565, show - U * 0.08), (585, show), (600, show + U * 0.01), (f1, show + U * 0.01)],
            point_local=Vector((0, 0, 0.02)), grip_local=(0, 0, -0.01), pole=-U * 0.8 - X * 0.6,
            hand_dirs={f0: d_flat, 565: d_up, 585: d_up, 600: d_turn, f1: d_turn}, palm_dirs={f0: -U, 565: X * 0.8 - F * 0.3, 585: X * 0.8 - F * 0.3, 600: -F * 0.8 + X * 0.3, f1: -F * 0.8 + X * 0.3},
            fingers=(1, 3), pre_shape=("garpu", 1.0), prop_dirs={565: d_up, 585: d_up, 600: d_turn, f1: d_turn})
print("HOLD", errs)
P.relaxed_arms(r, sides=("L",))
P.reach(r, "L", Vector((0.15 + 0.35, 0.86, seat_z(0.5, 0.86) + 0.04)), pole_dir=X - U * 0.3, wrist_fwd=(F * 0.3 - U * 0.9).normalized())
P._roll_palm(r, "L", -U); P.hand_shape(r, "L", "rileks", 0.7)
P.key_pose(r, f0, bones=[pb.name for pb in r.pose.bones if pb.name.endswith(".L")])
r.keyframe_insert("location", frame=f0)
P.face(b, f0, "SENYUM", 0.4); P.face(b, 590, "BANGGA", 0.9); P.face(b, f1, "BANGGA", 1.0); P.blink(b, 560)
head = P.bone_world(r, "head")
cam = camera(SID, 35, [(f0, (0.6, -1.9, 1.15), (0.1, 0.8, 0.95)), (f1, (0.5, -1.45, 1.12), (0.08, 0.8, 0.98))], focus=show, fstop=3.2)
finish(SID, chars=[(b, r)], props=[co], env=[bpy.data.objects["Mensa"], bpy.data.objects["Kasur_Lectus"]])
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 585, f1]))
