# Shot 21 — "Di Nusantara, leluhur kita" (1158-1209). Wide establishing: crane down from the palm crowns to the
# stilt house; the two ancestors sit cross-legged on the veranda mat.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nusa_common import *
SID = "21"; f0, f1, _ = SHOTS[SID]
sc = open_set("nusantara", SID)
a, ra = leluhur_bersila("leluhur_a", -0.5, -0.7, 0, f0, f1)
bb, rb = leluhur_bersila("leluhur_b", 0.85, -0.6, 15, f0, f1)
P.face(a, f0, "SENYUM", 0.5); P.face(bb, f0, "SENYUM", 0.6); P.blink(a, 1180); P.blink(bb, 1195)
look(rb, f0, P.bone_world(ra, "head"), 0.6)
cam = camera(SID, 24, [(f0, (3.0, -10.5, 6.5), (0.0, 0.5, 3.8)), (f1, (2.6, -8.6, 2.2), (0.0, 0.0, 1.8))], focus=Vector((0, -0.7, 1.7)), fstop=5.6)
finish(SID, chars=[(a, ra), (bb, rb)], env=[bpy.data.objects["Lantai_Rumah"]], every=8)
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, f1]))
