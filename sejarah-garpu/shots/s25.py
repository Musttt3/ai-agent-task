# Shot 25 — "Sekarang tinggal pilih, tim sendok" (1366-1429). Medium, slow push-in: the NARATOR at his dinner
# lifts the spoon and smiles at the camera on "tim sendok" (1404).
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot_lib import *
from venesia_common import look
SID = "25"; f0, f1, _ = SHOTS[SID]
sc = open_set("ruang_makan", SID)
TH = 0.76
b, r = actor("narator", loc=Vector((0.0, 0.74, 0)), yaw=0)
P.sit(r, b, seat_z(0.0, 0.74), lean=8)
X, F, U = P.char_axes(r)
s = bpy.data.objects["SENDOK_NARATOR"]; s["grip_mode"] = "pena"
rest = s.matrix_world @ Vector(s["tip"])
show = P.bone_world(r, "spine01") + F * 0.36 + U * 0.22 - X * 0.12
d_rest = (s.matrix_world.to_3x3() @ Vector((0, 0, 1))).normalized(); d_up = (U * 0.8 + F * 0.35 + X * 0.2).normalized()
# half-way (1389) the spoon is out in front of the chest, pointing forward-up: the hand neither brushes his chest
# nor swings the spoon across his face on the way up
mid = rest.lerp(show, 0.5) + F * 0.1; d_mid = (F * 0.7 + U * 0.5 + X * 0.1).normalized()
hold(s, r, "R", [(f0, rest + U * 0.004), (1380, rest + U * 0.004), (1389, mid), (1398, show), (f1, show + U * 0.01)], point_local=Vector(s["tip"]), grip_local=(0, 0, -0.03),
     pole=-U * 0.8 - X * 0.6, hand_dirs={f0: d_rest, 1380: d_rest, 1389: d_mid, 1398: d_up, f1: d_up},
     palm_dirs={f0: -U, 1380: -U, 1389: X * 0.5 - U * 0.6 - F * 0.1, 1398: X * 0.7 - F * 0.4, f1: X * 0.7 - F * 0.4},
     fingers=(1, 3), pre_shape=("garpu", 1.0), prop_dirs={1389: d_mid, 1398: d_up, f1: d_up})
P.relaxed_arms(r, sides=("L",))
P.reach(r, "L", Vector((0.25, 0.38, TH + 0.035)), pole_dir=X - U * 0.5, wrist_fwd=F - U * 0.15); P._roll_palm(r, "L", -U); P.hand_shape(r, "L", "rileks", 0.6)
P.key_pose(r, f0, bones=[pb.name for pb in r.pose.bones if pb.name.endswith(".L")]); r.keyframe_insert("location", frame=f0)
cam_pos = Vector((0.25, -1.35, 1.3))
look(r, f0, Vector((0, 0.28, TH)), 0.8); look(r, 1384, Vector((0, 0.28, TH)), 0.8); look(r, 1400, cam_pos, 0.9); look(r, f1, cam_pos, 0.9)
P.face(b, f0, "SENYUM", 0.4, extra={"eyeLookDownLeft": 0.5, "eyeLookDownRight": 0.5}); P.face(b, 1398, "SENYUM", 0.8); P.face(b, 1406, "SENANG", 0.9); P.face(b, f1, "SENANG", 0.8)
P.blink(b, 1390)
cam = camera(SID, 40, [(f0, cam_pos, (0.0, 0.6, 1.0)), (f1, cam_pos + Vector((0, 0.25, 0)), (0.0, 0.6, 1.05))], focus=P.bone_world(r, "head"), fstop=2.8)
finish(SID, chars=[(b, r)], props=[s], env=[o for o in bpy.data.objects["Meja_Makan"].children_recursive if o.type == "MESH"])
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 1386, 1389, 1393, 1404, f1]))
