# Shot 24 — "setelah dibawa orang Eropa." (1313-1365). On the veranda mat: the European SAILOR has sat down
# cross-legged beside LELUHUR A (a guest sits lesehan) and lays a spoon and a fork on the mat next to the rice
# (1330); the leluhur leans in, curious.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nusa_common import *
SID = "24"; f0, f1, _ = SHOTS[SID]
sc = open_set("nusantara", SID)
a, ra = leluhur_bersila("leluhur_a", -0.35, -0.85, 0, f0, f1)
# the second meal belongs to leluhur B, who is not in this shot: the sailor sits in that place
mb = bpy.data.objects.get("NASI_DAUN_B")
if mb:
    for o in [mb] + list(mb.children_recursive): o.hide_render = True; o.hide_viewport = True
p, rp = leluhur_bersila("pelaut", 0.64, -1.2, -90, f0, f1, lean=50)       # facing -x, toward the leluhur and the rice
Xp, Fp, Up = P.char_axes(rp)
spoon, fork = PR.sendok_garpu_eropa(bpy.data.collections["PROPS"]); fork["r"] = 0.009; spoon["r"] = 0.005
MZ = FZ + 0.012                                                        # top of the mat
spot_s = Vector((0.1, -1.3, MZ + 0.006)); spot_f = Vector((0.16, -1.47, MZ + 0.006))   # beside the rice leaf
# held: spoon in the right hand, fork in the left; laid down at 1330 (swap to resting copies)
for prop, side, spot in ((spoon, "R", spot_s), (fork, "L", spot_f)):
    prop["grip_mode"] = "pena"
    sg = 1 if side == "L" else -1
    dd = (Fp * 0.7 - Up * 0.7).normalized()
    hold(prop, rp, side, [(f0, spot + Up * 0.2 + Fp * 0.08), (1324, spot + Up * 0.04), (1330, spot + Up * 0.012)], point_local=Vector(prop["tip"]),
         grip_local=(0, 0, -0.02), pole=-Up * 0.6 + Xp * sg * 0.8, hand_dir=dd, palm_dir=-Up, fingers=(1, 3), pre_shape=("garpu", 1.0),
         prop_dirs={f0: dd, 1324: dd, 1330: (Fp - Up * 0.05).normalized()})
    rest = prop.copy(); rest.data = prop.data; bpy.data.collections["PROPS"].objects.link(rest)
    for c in list(rest.constraints): rest.constraints.remove(c)
    if rest.animation_data: rest.animation_data_clear()
    sc.frame_set(1330); rest.matrix_world = prop.matrix_world.copy(); rest.location.z = MZ + 0.004
    hide_between(rest, 1331); hide_between(prop, f0 - 5, 1331)
# after letting go the hands lift off the mat, then go back to rest on his knees
for side in ("L", "R"):
    sc.frame_set(1336)
    sg = 1 if side == "L" else -1
    w = P.bone_world(rp, f"wrist.{side}") + Up * 0.1 - Fp * 0.06
    P.reach(rp, side, w, pole_dir=-Up * 0.6 + Xp * sg * 0.8, wrist_fwd=(Fp * 0.7 - Up * 0.7).normalized())
    P.key_pose(rp, 1336, bones=[pb.name for pb in rp.pose.bones if pb.name.endswith("." + side) and ("arm" in pb.name or "wrist" in pb.name)])
sc.frame_set(1348); rest_hands_on_knees(p, rp, 1348); rest_hands_on_knees(p, rp, f1)
look(rp, f0, spot_s, 0.8); look(rp, 1340, P.bone_world(ra, "head"), 0.7); look(rp, f1, P.bone_world(ra, "head"), 0.7)
P.face(p, f0, "SENYUM", 0.6); P.face(p, 1345, "SENANG", 0.7)
look(ra, f0, P.bone_world(rp, "head"), 0.8); look(ra, 1333, spot_s, 0.9); look(ra, f1, spot_s, 0.9)
P.face(a, f0, "NETRAL"); P.face(a, 1334, "KAGET", 0.6); P.face(a, f1, "MIKIR", 0.8)
cam = camera(SID, 24, [(f0, (-0.55, -4.1, 2.5), (0.15, -1.3, 1.45)), (f1, (-0.45, -3.9, 2.45), (0.15, -1.25, 1.45))], focus=spot_s, fstop=4.0)
finish(SID, chars=[(a, ra), (p, rp)], props=[spoon, fork], env=[bpy.data.objects["Lantai_Rumah"], bpy.data.objects["Tiang_0_-1.8"], bpy.data.objects["Tikar"]], every=4)
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 1330, f1]))
