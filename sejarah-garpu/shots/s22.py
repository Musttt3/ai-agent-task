# Shot 22 — "makan pakai tangan kanan." (1210-1258). Close-up over the banana leaf: LELUHUR A's right hand gathers
# a little rice with the fingertips and lifts it toward his mouth.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nusa_common import *
SID = "22"; f0, f1, _ = SHOTS[SID]
sc = open_set("nusantara", SID)
a, ra = leluhur_bersila("leluhur_a", -0.35, -0.7, 0, f0, f1, lean=22)
X, F, U = P.char_axes(ra)
rice = bpy.data.objects["NASI_DAUN_A_NASI"]
rc = rice.matrix_world.translation; top = rc + Vector((0, 0, 0.07 * 0.62 + 0.004))
edge = rc + (P.bone_world(ra, "spine01") - rc).normalized() * 0.05; edge.z = rc.z + 0.03
# a small clump of rice that lives in the fingers after 1228
from props import gundukan_nasi
clump = gundukan_nasi("SUAPAN", 0.016, 0.9, bpy.data.collections["PROPS"])
mouth = P.lips_front(a, ra, out=0.04)
keys = [(f0, edge + U * 0.12 + F * 0.05), (1222, edge + U * 0.012), (1228, edge + U * 0.006), (1240, edge + U * 0.12), (f1, mouth - U * 0.05 + F * 0.06)]
for f, t in keys:
    sc.frame_set(f)
    P.reach(ra, "R", t + U * 0.04 - F * 0.06, pole_dir=-X * 0.8 - U * 0.5, wrist_fwd=(F * 0.75 - U * 0.6).normalized())
    P._roll_palm(ra, "R", (-U * 0.5 + X * 0.3 + F * 0.3).normalized())
    P.hand_shape(ra, "R", "cubit", 0.75 if f >= 1228 else 0.35)
    P.key_pose(ra, f, bones=[pb.name for pb in ra.pose.bones if pb.name.endswith(".R") and ("arm" in pb.name or "wrist" in pb.name or "finger" in pb.name)])
sc.frame_set(1228)
tipI = P.bone_world(ra, "finger2-3.R", tail=True); tipT = P.bone_world(ra, "finger1-3.R", tail=True)
clump.location = (tipI + tipT) / 2 - U * 0.006
P.attach(clump, ra, "wrist.R")
hide_between(clump, 1228)
look(ra, f0, edge, 0.8); look(ra, 1240, edge, 0.6); look(ra, f1, P.bone_world(ra, "head") + F * 0.5, 0.0)
P.face(a, f0, "NETRAL", extra={"eyeLookDownLeft": 0.6, "eyeLookDownRight": 0.6}); P.face(a, 1245, "SENYUM", 0.5, extra={"jawOpen": 0.15})
cam = camera(SID, 55, [(f0, rc + Vector((0.35, -0.6, 0.42)), rc + Vector((0, 0.05, 0.05))), (f1, rc + Vector((0.32, -0.55, 0.5)), rc + Vector((0, 0.12, 0.18)))], focus=rc + Vector((0, 0, 0.06)), fstop=3.2)
finish(SID, chars=[(a, ra)], props=[], env=[bpy.data.objects["Tikar"]])
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 1228, f1]))
