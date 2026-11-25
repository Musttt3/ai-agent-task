# Shot 02 — "garpu bisa dicap sombong." (52-109). Medium: the PUTRI lifts the golden fork from her plate and looks
# at it; BANGSAWAN B, seated at her right, turns his eyes to her and sneers on "sombong" (85).
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from venesia_common import *
SID = "02"; f0, f1, _ = SHOTS[SID]
sc = open_set("venesia", SID)
b, r = putri_seated(f0, f1)
X, F, U = P.char_axes(r)
g = bpy.data.objects["GARPU_EMAS"]; g["grip_mode"] = "pena"
plate = Vector((0.02, 3.08, TH + 0.03))
chest = P.bone_world(r, "spine01") + F * 0.32 + U * 0.08 - X * 0.08
d_down = (-U * 0.8 + F * 0.45 + X * 0.25).normalized(); d_up = (U * 0.75 + F * 0.3 + X * 0.25).normalized()
errs = hold(g, r, "R", [(f0, plate + Vector((0.02, -0.02, 0.01))), (75, chest), (f1, chest + U * 0.01)], point_local=Vector(g["tip"]),
            grip_local=(0, 0, 0.025), pole=-U * 0.8 - X * 0.6, hand_dirs={f0: d_down, 75: d_up, f1: d_up},
            palm_dirs={f0: -U * 0.3 + X * 0.9, 75: X * 0.7 - F * 0.4, f1: X * 0.7 - F * 0.4}, fingers=(1, 3), pre_shape=("garpu", 1.0),
            prop_dirs={75: d_up, f1: d_up})
print("HOLD", errs)
tip_mid = g.matrix_world @ Vector(g["tip"])
P.face(b, f0, "SENYUM", 0.4, extra={"eyeLookDownLeft": 0.5, "eyeLookDownRight": 0.5})
P.face(b, 78, "BANGGA", 0.9, extra={"eyeLookDownLeft": 0.15, "eyeLookDownRight": 0.15})
P.face(b, f1, "BANGGA", 1.0)
# the noble at the first right-hand seat: glances at her, sneers on "sombong"
bb, rb = guest_seated("bangsawan_b", 1, 2.3, f0, f1)
look(rb, f0, Vector((0, 1.0, 1.1)), 0.6)
look(rb, 80, P.bone_world(r, "head"), 0.9); look(rb, f1, P.bone_world(r, "head"), 0.9)
P.face(bb, f0, "NETRAL"); P.face(bb, 80, "NETRAL", extra={"eyeLookOutLeft": 0.3, "eyeLookInRight": 0.3})
P.face(bb, 88, "SINIS", 1.0); P.face(bb, f1, "SINIS", 1.0)
P.blink(b, 96)
cam = camera(SID, 30, [(f0, (-0.55, 1.7, 1.25), (0.42, 3.2, 1.1)), (f1, (-0.5, 1.82, 1.25), (0.42, 3.2, 1.11))], focus=P.bone_world(r, "head"), fstop=2.8)
finish(SID, chars=[(b, r), (bb, rb)], props=[g], env=[bpy.data.objects["Meja"], bpy.data.objects["Taplak"]])
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 80, f1]))
