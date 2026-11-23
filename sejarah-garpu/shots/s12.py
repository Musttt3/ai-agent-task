# Shot 12 — "Abad kesebelas, Putri Byzantium di Venesia" (689-769). Wide: crane down from the arched windows to
# the long table; the PUTRI at the head, guests along the sides, the bishop standing by the wall.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from venesia_common import *
SID = "12"; f0, f1, _ = SHOTS[SID]
sc = open_set("venesia", SID)
b, r = putri_seated(f0, f1)
P.face(b, f0, "SENYUM", 0.6); P.blink(b, 720); P.blink(b, 760)
g = bpy.data.objects["GARPU_EMAS"]; g["grip_mode"] = "pena"
X, F, U = P.char_axes(r)
plate = Vector((0.02, 2.88, TH + 0.03))
hold(g, r, "R", [(f0, plate + Vector((0.02, -0.02, 0.012))), (f1, plate + Vector((0.02, -0.03, 0.02)))], point_local=Vector(g["tip"]),
     grip_local=(0, 0, 0.025), pole=-U * 0.8 - X * 0.6, hand_dirs={f0: (-U * 0.8 + F * 0.45 + X * 0.25).normalized(), f1: (-U * 0.8 + F * 0.45 + X * 0.25).normalized()},
     palm_dirs={f0: -U * 0.3 + X * 0.9, f1: -U * 0.3 + X * 0.9}, fingers=(1, 3), pre_shape=("garpu", 1.0))
ga, ra = guest_seated("bangsawan_a", -1, 1.4, f0, f1); P.face(ga, f0, "SENYUM", 0.3); look(ra, f0, P.bone_world(r, "head"), 0.7); P.blink(ga, 735)
gb, rb = guest_seated("bangsawan_b", 1, 2.3, f0, f1); P.face(gb, f0, "NETRAL"); look(rb, f0, Vector((0, 0.5, 1.0)), 0.5); P.blink(gb, 748)
u, ru = actor("uskup", loc=Vector((1.7, 2.6, 0)), yaw=-115)
mit = put_mitre(ru, u)
P.relaxed_arms(ru, out=0.18); P.turn(ru, "upperarm01.L", P.char_axes(ru)[1], 0)
for s_ in ("L", "R"): P.hand_shape(ru, s_, "rileks", 0.8)
from shot_lib import plant_feet
plant_feet(ru, u); P.key_pose(ru, f0); ru.keyframe_insert("location", frame=f0)
P.face(u, f0, "MARAH", 0.35); look(ru, f0, P.bone_world(r, "head"), 0.8)
cam = camera(SID, 24, [(f0, (0.0, -5.2, 3.4), (0.0, 3.4, 2.4)), (f1, (0.0, -4.4, 1.75), (0.0, 3.0, 1.15))], focus=Vector((0, 2.9, 1.1)), fstop=5.6)
finish(SID, chars=[(b, r), (ga, ra), (gb, rb), (u, ru)], props=[g], env=[bpy.data.objects["Meja"], bpy.data.objects["Taplak"]], every=8)
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, f1]))
