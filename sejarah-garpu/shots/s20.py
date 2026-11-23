# Shot 20 — "si pembawa garpu." (1113-1157). Close-up, slow push-in: CORYAT's proud smile fades; he lowers the fork.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from london_common import *
SID = "20"; f0, f1, _ = SHOTS[SID]
sc = open_set("london", SID)
b, r = coryat_seated(f0, f1)
X, F, U = P.char_axes(r)
g = bpy.data.objects["GARPU_CORYAT"]; g["grip_mode"] = "pena"
show = P.bone_world(r, "spine01") + F * 0.35 + U * 0.24 - X * 0.1
low = P.bone_world(r, "spine01") + F * 0.4 - U * 0.02 - X * 0.12
d_up = (U * 0.85 + F * 0.3 + X * 0.15).normalized(); d_low = (F * 0.6 + U * 0.2 + X * 0.4).normalized()
hold(g, r, "R", [(f0, show), (1128, show), (1145, low), (f1, low)], point_local=Vector(g["tip"]), grip_local=(0, 0, -0.01), pole=-U * 0.8 - X * 0.6,
     hand_dirs={f0: d_up, 1128: d_up, 1145: d_low, f1: d_low}, palm_dirs={f0: X * 0.7 - F * 0.4, 1128: X * 0.7 - F * 0.4, 1145: X * 0.5 - U * 0.5, f1: X * 0.5 - U * 0.5},
     fingers=(1, 3), pre_shape=("garpu", 1.0), prop_dirs={f0: d_up, 1128: d_up, 1145: d_low, f1: d_low})
look(r, f0, Vector((1.9, 1.8, 1.2)), 0.7); look(r, 1135, Vector((1.9, 1.8, 1.2)), 0.7); look(r, f1, low - U * 0.1, 0.8)
P.face(b, f0, "BANGGA", 0.9); P.face(b, 1122, "BANGGA", 0.6); P.face(b, 1132, "BINGUNG", 0.7); P.face(b, f1, "SEDIH", 0.9)
P.blink(b, 1140)
head = P.bone_world(r, "head") + U * 0.06
cam = camera(SID, 60, [(f0, head + Vector((-0.3, -1.05, -0.02)), head - U * 0.08), (f1, head + Vector((-0.24, -0.85, -0.02)), head - U * 0.06)], focus=head, fstop=2.2)
finish(SID, chars=[(b, r)], props=[g])
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 1135, f1]))
