# Shot 26 — "atau tim makan pakai tangan?" (1430-1514). The NARATOR puts the spoon down (1440), takes a little rice
# with his right fingertips, eats (1455), then looks at the camera with a challenging half-smile; hold to the end.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot_lib import *
from venesia_common import look
SID = "26"; f0, f1, _ = SHOTS[SID]
sc = open_set("ruang_makan", SID)
TH = 0.76
b, r = actor("narator", loc=Vector((0.0, 0.74, 0)), yaw=0)
P.sit(r, b, seat_z(0.0, 0.74), lean=10)
X, F, U = P.char_axes(r)
rice = bpy.data.objects["PIRING_NARATOR_NASI"]; rc = rice.matrix_world.translation
grab = rc + Vector((0.0, -0.03, 0.035))
from props import gundukan_nasi
clump = gundukan_nasi("SUAPAN_NARATOR", 0.014, 0.9, bpy.data.collections["PROPS"])
# hand-eating as people really do it: palm up, fingertips into the mouth from the front-below
# (thumb pushes the rice in), elbow low at his side; then the hand comes down in steps
plate_keys = [(f0, grab + U * 0.15 + F * 0.05), (1437, grab + U * 0.012), (1441, grab + U * 0.006)]
FW_DN = (F * 0.75 - U * 0.6).normalized()                    # fingers toward the plate
PALM_DN = (-U * 0.5 + X * 0.3 + F * 0.3).normalized()
# at the mouth: palm UP, fingers pointing back into the mouth, thumb pushes the rice in -> the curled fingers and
# knuckles stay BELOW the lips, the eyes and nose stay visible
FW_M = (-F * 0.8 + U * 0.3 - X * 0.25).normalized(); PALM_M = (U * 0.75 - F * 0.3 + X * 0.2).normalized()
def mix(a, b, k): return a.lerp(b, k).normalized()
# (frame, tip goal relative to the lips, fingers dir, palm dir, curl)
mouth_keys = [(1446, F * 0.2 - U * 0.2, mix(FW_DN, FW_M, 0.5), (X * 0.6 + U * 0.2 - F * 0.2).normalized(), 0.75),
              (1450, F * 0.06 - U * 0.03, FW_M, PALM_M, 0.75), (1456, F * 0.012, FW_M, PALM_M, 0.75),
              (1462, F * 0.12 - U * 0.1, mix(FW_M, FW_DN, 0.25), (X * 0.6 + U * 0.5 - F * 0.2).normalized(), 0.6),
              (1469, F * 0.18 - U * 0.2, mix(FW_M, FW_DN, 0.6), (X * 0.7 - U * 0.2).normalized(), 0.55)]
rest_keys = [(1480, grab + U * 0.12 + F * 0.1), (f1, grab + U * 0.12 + F * 0.1)]
def tips():
    bpy.context.view_layer.update()
    return (P.bone_world(r, "finger2-3.R", tail=True) + P.bone_world(r, "finger1-3.R", tail=True)) / 2
RB = [pb.name for pb in r.pose.bones if pb.name.endswith(".R") and ("arm" in pb.name or "wrist" in pb.name or "finger" in pb.name)]
for f, t in plate_keys + rest_keys:
    sc.frame_set(f)
    P.reach(r, "R", t + U * 0.04 - F * 0.06, pole_dir=-X * 0.8 - U * 0.5, wrist_fwd=FW_DN)
    P._roll_palm(r, "R", PALM_DN)
    P.hand_shape(r, "R", "cubit", 0.75 if f == 1441 else 0.5)
    P.key_pose(r, f, bones=RB)
for f, off, fwd, palm, curl in mouth_keys:
    # fingertips (not the wrist) go to the goal: the mouth is re-measured at this frame (head lean + look)
    sc.frame_set(f)
    goal = P.mouth_front(b, r) + off
    w = goal - fwd * 0.15
    for _ in range(10):
        P.reach(r, "R", w, pole_dir=-X * 0.6 - U * 0.8, wrist_fwd=fwd)
        P._roll_palm(r, "R", palm)
        P.hand_shape(r, "R", "cubit", curl)
        err = goal - tips()
        if err.length < 0.004: break
        w = w + err
    print("MOUTHERR", f, round(err.length * 1000, 1), "mm")
    P.key_pose(r, f, bones=RB)
sc.frame_set(1441)
tipI = P.bone_world(r, "finger2-3.R", tail=True); tipT = P.bone_world(r, "finger1-3.R", tail=True)
clump.location = (tipI + tipT) / 2 - U * 0.005
P.attach(clump, r, "wrist.R")
hide_between(clump, 1441, 1458)
P.relaxed_arms(r, sides=("L",))
P.reach(r, "L", Vector((0.25, 0.38, TH + 0.035)), pole_dir=X - U * 0.5, wrist_fwd=F - U * 0.15); P._roll_palm(r, "L", -U); P.hand_shape(r, "L", "rileks", 0.6)
P.key_pose(r, f0, bones=[pb.name for pb in r.pose.bones if pb.name.endswith(".L")]); r.keyframe_insert("location", frame=f0)
cam_pos = Vector((0.15, -1.25, 1.28))
look(r, f0, rc, 0.8); look(r, 1448, rc, 0.8); look(r, 1458, cam_pos, 0.5); look(r, 1470, cam_pos, 0.95); look(r, f1, cam_pos, 0.95)
P.face(b, f0, "SENYUM", 0.4, extra={"eyeLookDownLeft": 0.5, "eyeLookDownRight": 0.5}); P.face(b, 1454, "NETRAL", extra={"jawOpen": 0.25})
P.face(b, 1460, "MENGUNYAH", 1.0); P.face(b, 1466, "NETRAL", extra={"jawOpen": 0.06}); P.face(b, 1472, "MENGUNYAH", 1.0)
P.face(b, 1480, "SINIS", 0.5, extra={"mouthSmileLeft": 0.6, "browOuterUpLeft": 0.5}); P.face(b, f1, "SINIS", 0.5, extra={"mouthSmileLeft": 0.65, "browOuterUpLeft": 0.6})
P.blink(b, 1495)
cam = camera(SID, 40, [(f0, cam_pos, (0.0, 0.5, 1.0)), (1470, cam_pos, (0.0, 0.6, 1.08)), (f1, cam_pos + Vector((0, 0.22, 0.0)), (0.0, 0.62, 1.12))], focus=P.bone_world(r, "head"), fstop=2.8)
finish(SID, chars=[(b, r)], props=[], env=[o for o in bpy.data.objects["Meja_Makan"].children_recursive if o.type == "MESH"])
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 1441, 1450, 1456, 1462, 1469, 1476, 1490]))
