# Shot 08 — "Tiongkok sudah punya sumpit perunggu." (382-444). Close-up of the bronze chopsticks on their wooden
# stand, firelight glinting, slow push-in.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot_lib import *
SID = "08"; f0, f1, _ = SHOTS[SID]
sc = open_set("dapur", SID)
sp = bpy.data.objects["SUMPIT_PAJANG"]; c = sp.matrix_world.translation
lamp(bpy.data.collections["LIGHTS"], "KILAU_SUMPIT", "AREA", 6, c + Vector((-0.25, -0.2, 0.35)), aim=c, color=(1.0, 0.7, 0.4), size=0.25)
cam = camera(SID, 70, [(f0, c + Vector((-0.28, -0.42, 0.2)), c), (f1, c + Vector((-0.2, -0.3, 0.15)), c)], focus=c, fstop=2.8)
finish(SID, check=False)
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, f1]))
