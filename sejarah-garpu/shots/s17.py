# Shot 17 — "membawa garpu ke Inggris." (987-1036). Medium, push-in: CORYAT, seated, lifts his fork out of the
# leather case and holds it up proudly.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from london_common import *
SID = "17"; f0, f1, _ = SHOTS[SID]
sc = open_set("london", SID)
b, r = coryat_seated(f0, f1)
X, F, U = P.char_axes(r)
g = bpy.data.objects["GARPU_CORYAT"]; g["grip_mode"] = "pena"
case = bpy.data.objects["KOTAK_GARPU"]
start = g.matrix_world @ Vector(g["tip"])
show = P.bone_world(r, "spine01") + F * 0.35 + U * 0.24 - X * 0.1
d_case = (g.matrix_world.to_3x3() @ Vector((0, 0, 1))).normalized(); d_up = (U * 0.85 + F * 0.3 + X * 0.15).normalized()
errs = hold(g, r, "R", [(f0, start + U * 0.005), (1000, start + U * 0.06 + F * 0.02), (1015, show), (f1, show + U * 0.01)], point_local=Vector(g["tip"]),
            grip_local=(0, 0, -0.01), pole=-U * 0.8 - X * 0.6, hand_dirs={f0: d_case, 1000: (d_case + d_up).normalized(), 1015: d_up, f1: d_up},
            palm_dirs={f0: -U, 1000: X * 0.6 - U * 0.4, 1015: X * 0.7 - F * 0.4, f1: X * 0.7 - F * 0.4}, fingers=(1, 3), pre_shape=("garpu", 1.0),
            prop_dirs={1000: (d_case + d_up).normalized(), 1015: d_up, f1: d_up})
print("HOLD", errs)
P.face(b, f0, "SENYUM", 0.5, extra={"eyeLookDownLeft": 0.5, "eyeLookDownRight": 0.5}); P.face(b, 1012, "SENANG", 0.9); P.face(b, f1, "BANGGA", 1.0)
look(r, 1018, show + U * 0.05, 0.6); look(r, f1, show + U * 0.05, 0.6)
head = P.bone_world(r, "head")
cam = camera(SID, 45, [(f0, (0.45, -1.15, 1.32), (0.0, 0.9, 1.1)), (f1, (0.38, -0.85, 1.32), (0.0, 0.95, 1.18))], focus=show, fstop=2.8)
finish(SID, chars=[(b, r)], props=[g, case], env=[o for o in bpy.data.objects["Meja_Coryat"].children_recursive if o.type == "MESH"])
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 1015, f1]))
