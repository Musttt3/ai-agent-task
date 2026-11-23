# Shot 14 — "Tokoh gereja langsung mengecamnya." (820-884). The BISHOP steps forward and points at the princess,
# angry; she turns her head to him. Medium over the princess's left shoulder.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from venesia_common import *
SID = "14"; f0, f1, _ = SHOTS[SID]
sc = open_set("venesia", SID)
b, r = putri_seated(f0, f1)
X, F, U = P.char_axes(r)
g = bpy.data.objects["GARPU_EMAS"]; g["grip_mode"] = "pena"
plate = Vector((0.02, 2.88, TH + 0.03)); chest = P.bone_world(r, "spine01") + F * 0.32 + U * 0.04 - X * 0.08
d_up = (U * 0.75 + F * 0.3 + X * 0.25).normalized()
hold(g, r, "R", [(f0, chest), (f1, chest - U * 0.02)], point_local=Vector(g["tip"]), grip_local=(0, 0, 0.025), pole=-U * 0.8 - X * 0.6,
     hand_dirs={f0: d_up, f1: d_up}, palm_dirs={f0: X * 0.7 - F * 0.4, f1: X * 0.7 - F * 0.4}, fingers=(1, 3), pre_shape=("garpu", 1.0), prop_dirs={f0: d_up, f1: d_up})
u, ru = actor("uskup", loc=Vector((1.75, 2.75, 0)), yaw=-112)
mit = put_mitre(ru, u)
from shot_lib import plant_feet, walk
# two angry steps toward the table end, then he points
walk(ru, u, [(1.75, 2.75), (1.25, 2.95)], f0, 838, step_frames=9, arm_amp=8)
Xu, Fu, Uu = P.char_axes(ru)
for f in (846, f1):
    sc.frame_set(f)
    P.rest_pose(ru); P.relaxed_arms(ru, out=0.34, fwd=0.12, elbow=22, sides=("L",))
    head = P.bone_world(r, "head")
    sh = P.bone_world(ru, "upperarm01.R")
    P.reach(ru, "R", sh + (head - sh).normalized() * 0.55, pole_dir=-Uu - Xu * 0.4, wrist_fwd=(head - sh).normalized())
    P.hand_shape(ru, "R", "tunjuk", 1.0); P.hand_shape(ru, "L", "rileks", 0.8)
    ru.location = Vector((1.25, 2.95, ru.location.z)); plant_feet(ru, u)
    P.key_pose(ru, f); ru.keyframe_insert("location", frame=f)
look(ru, 846, P.bone_world(r, "head"), 1.0); look(ru, f1, P.bone_world(r, "head"), 1.0)
P.face(u, f0, "MARAH", 0.6); P.face(u, 846, "MARAH", 1.0); P.face(u, 860, "MARAH", 1.0, extra={"jawOpen": 0.2}); P.face(u, f1, "MARAH", 1.0)
look(r, f0, Vector((0, 1.5, 1.0)), 0.4); look(r, 840, Vector((0, 1.5, 1.0)), 0.4)
look(r, 850, P.bone_world(ru, "head"), 0.9); look(r, f1, P.bone_world(ru, "head"), 0.9)
P.face(b, f0, "SENYUM", 0.8); P.face(b, 846, "SENYUM", 0.6); P.face(b, 852, "KAGET", 0.7); P.face(b, f1, "KAGET", 0.6)
cam = camera(SID, 35, [(f0, (-0.75, 3.95, 1.45), (1.2, 2.8, 1.45)), (f1, (-0.7, 3.85, 1.45), (1.15, 2.85, 1.5))], focus=Vector((1.25, 2.95, 1.6)), fstop=3.2)
finish(SID, chars=[(b, r), (u, ru)], props=[g], env=[bpy.data.objects["Meja"], bpy.data.objects["Taplak"]])
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 846, f1]))
