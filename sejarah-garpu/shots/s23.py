# Shot 23 — "Sendok dan garpu baru populer" (1259-1312). Wide from the beach: the European ships anchored in the
# bay, slow push-in.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nusa_common import *
SID = "23"; f0, f1, _ = SHOTS[SID]
sc = open_set("nusantara", SID)
cam = camera(SID, 35, [(f0, (2.0, 6.0, 1.3), (-3.0, 100.0, 5.0)), (f1, (1.7, 7.2, 1.3), (-3.5, 100.0, 5.5))], focus=Vector((-14, 95, 5)), fstop=8.0)
finish(SID, check=False)
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, f1]))
