# Shot 24 — "setelah dibawa orang Eropa." (1313-1365). At the veranda: the European SAILOR, standing on the ground
# by the steps, lays a spoon and a fork on the mat (1330); LELUHUR A leans in, curious.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nusa_common import *
SID = "24"; f0, f1, _ = SHOTS[SID]
sc = open_set("nusantara", SID)
a, ra = leluhur_bersila("leluhur_a", -0.35, -0.85, 0, f0, f1)
p, rp = actor("pelaut", loc=Vector((0.45, -2.6, 0)), yaw=180)
plant_feet(rp, p)
Xp, Fp, Up = P.char_axes(rp)
spoon, fork = PR.sendok_garpu_eropa(bpy.data.collections["PROPS"])
spot_s = Vector((0.22, -1.7, FZ + 0.006)); spot_f = Vector((0.7, -1.7, FZ + 0.006))
# held: spoon in the right hand, fork in the left; laid down at 1330 (swap to resting copies)
for prop, side, spot in ((spoon, "R", spot_s), (fork, "L", spot_f)):
    prop["grip_mode"] = "pena"
    dd = (Fp * 0.8 - Up * 0.4).normalized()
    hold(prop, rp, side, [(f0, spot + Up * 0.25 - Fp * 0.15), (1324, spot + Up * 0.04), (1330, spot + Up * 0.012)], point_local=Vector(prop["tip"]),
         grip_local=(0, 0, -0.02), pole=-Up * 0.7 + (Xp if side == "L" else -Xp) * 0.6, hand_dir=dd, palm_dir=-Up, fingers=(1, 3), pre_shape=("garpu", 1.0),
         prop_dirs={f0: dd, 1324: dd, 1330: (Fp - Up * 0.05).normalized()})
    rest = prop.copy(); rest.data = prop.data; bpy.data.collections["PROPS"].objects.link(rest)
    for c in list(rest.constraints): rest.constraints.remove(c)
    if rest.animation_data: rest.animation_data_clear()
    sc.frame_set(1330); rest.matrix_world = prop.matrix_world.copy(); rest.location.z = FZ + 0.004
    hide_between(rest, 1331); hide_between(prop, f0 - 5, 1331)
# after letting go the hands withdraw
for side in ("L", "R"):
    sc.frame_set(1345)
    sh = P.bone_world(rp, f"upperarm01.{side}")
    P.reach(rp, side, sh - Up * 0.5 + Fp * 0.15 + (Xp if side == "L" else -Xp) * 0.12, pole_dir=-Fp * 0.5 + (Xp if side == "L" else -Xp) * 0.5, wrist_fwd=-Up)
    P.hand_shape(rp, side, "rileks", 0.7)
    P.key_pose(rp, 1345, bones=[pb.name for pb in rp.pose.bones if pb.name.endswith("." + side)])
    P.key_pose(rp, f1, bones=[pb.name for pb in rp.pose.bones if pb.name.endswith("." + side)])
P.turn(rp, "spine02", Xp, 8); P.key_pose(rp, 1328, bones=["spine02"])
look(rp, f0, spot_s, 0.8); look(rp, 1345, P.bone_world(ra, "head"), 0.7); look(rp, f1, P.bone_world(ra, "head"), 0.7)
P.face(p, f0, "SENYUM", 0.6); P.face(p, 1345, "SENANG", 0.7)
look(ra, f0, P.bone_world(rp, "head"), 0.8); look(ra, 1333, spot_s, 0.9); look(ra, f1, spot_s, 0.9)
P.face(a, f0, "NETRAL"); P.face(a, 1334, "KAGET", 0.6); P.face(a, f1, "MIKIR", 0.8)
cam = camera(SID, 32, [(f0, (1.9, -3.4, 1.9), (0.1, -1.2, 1.45)), (f1, (1.75, -3.2, 1.85), (0.1, -1.3, 1.4))], focus=spot_s, fstop=3.5)
finish(SID, chars=[(a, ra), (p, rp)], props=[spoon, fork], env=[bpy.data.objects["Lantai_Rumah"]], every=4)
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 1330, f1]))
