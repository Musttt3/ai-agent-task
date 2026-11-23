# Shot 15 — "Sombong!" (885-910). Close-up of the BISHOP shouting, fast 6-frame push-in.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from venesia_common import *
SID = "15"; f0, f1, _ = SHOTS[SID]
sc = open_set("venesia", SID)
u, ru = actor("uskup", loc=Vector((1.25, 2.95, 0)), yaw=110)
mit = put_mitre(ru, u)
from shot_lib import plant_feet
Xu, Fu, Uu = P.char_axes(ru)
target = Vector((0, 3.4, 1.3))
P.relaxed_arms(ru, out=0.34, fwd=0.12, elbow=22, sides=("L",))
sh = P.bone_world(ru, "upperarm01.R")
P.reach(ru, "R", sh + (target - sh).normalized() * 0.55, pole_dir=-Uu - Xu * 0.4, wrist_fwd=(target - sh).normalized())
P.hand_shape(ru, "R", "tunjuk", 1.0); P.hand_shape(ru, "L", "rileks", 0.8)
plant_feet(ru, u)
P.turn(ru, "spine02", Xu, 6)
P.key_pose(ru, f0); P.turn(ru, "spine02", Xu, 4); P.key_pose(ru, 893); ru.keyframe_insert("location", frame=f0)
look(ru, f0, target, 1.0)
P.face(u, f0, "MARAH", 1.0); P.face(u, 887, "TERIAK", 1.0); P.face(u, 899, "TERIAK", 0.9); P.face(u, f1, "MARAH", 1.0, extra={"jawOpen": 0.15})
head = P.bone_world(ru, "head") + Uu * 0.08
cam_dir = (target - head).normalized()
cam = camera(SID, 50, [(f0, head + cam_dir * 1.3 + Uu * 0.02, head), (f0 + 6, head + cam_dir * 0.85 + Uu * 0.02, head), (f1, head + cam_dir * 0.82 + Uu * 0.02, head)],
             focus=head + cam_dir * 0.1, fstop=2.4)
finish(SID, chars=[(u, ru)])
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 893, f1]))
