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
mouth = P.lips_front(b, r, out=0.012)                       # rough; the eating keys re-measure it per frame
from props import gundukan_nasi
clump = gundukan_nasi("SUAPAN_NARATOR", 0.014, 0.9, bpy.data.collections["PROPS"])
keys = [(f0, grab + U * 0.15 + F * 0.05), (1437, grab + U * 0.012), (1441, grab + U * 0.006), (1450, mouth - U * 0.05 + F * 0.06), (1456, mouth), (1466, mouth + F * 0.1 - U * 0.12), (1480, grab + U * 0.12 + F * 0.1), (f1, grab + U * 0.12 + F * 0.1)]
def tips():
    bpy.context.view_layer.update()
    return (P.bone_world(r, "finger2-3.R", tail=True) + P.bone_world(r, "finger1-3.R", tail=True)) / 2
for f, t in keys:
    sc.frame_set(f)
    up = f in (1450, 1456)
    if up:
        # fingertips (not the wrist) go to the lips: the mouth is re-measured at this frame (head lean + look),
        # the hand comes from below-front with the fingers pointing back at the mouth; solve the wrist so the tips land
        m = P.lips_front(b, r, out=0.0)
        goal = m + F * 0.012 if f == 1456 else m + F * 0.07 - U * 0.035
        fwd = (-F * 0.75 + U * 0.35 - X * 0.15).normalized()
        w = goal - fwd * 0.17
        for _ in range(8):
            P.reach(r, "R", w, pole_dir=-X * 0.8 - U * 0.5, wrist_fwd=fwd)
            P._roll_palm(r, "R", (U * 0.7 - F * 0.3).normalized())
            P.hand_shape(r, "R", "cubit", 0.75)
            err = goal - tips()
            if err.length < 0.004: break
            w = w + err
        print("MOUTHERR", f, round(err.length * 1000, 1), "mm")
    else:
        P.reach(r, "R", t + U * 0.04 - F * 0.06, pole_dir=-X * 0.8 - U * 0.5, wrist_fwd=(F * 0.75 - U * 0.6).normalized())
        P._roll_palm(r, "R", (-U * 0.5 + X * 0.3 + F * 0.3).normalized())
        P.hand_shape(r, "R", "cubit", 0.75 if 1441 <= f <= 1456 else 0.35)
    P.key_pose(r, f, bones=[pb.name for pb in r.pose.bones if pb.name.endswith(".R") and ("arm" in pb.name or "wrist" in pb.name or "finger" in pb.name)])
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
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 1441, 1456, 1490]))
