# Shot 01 — "Dulu, orang yang makan pakai" (0-51). Close-up of the golden fork on the princess's silver plate,
# candlelight, slow push-in (the mystery object first).
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot_lib import *
SID = "01"; f0, f1, _ = SHOTS[SID]
sc = open_set("venesia", SID)
g = bpy.data.objects["GARPU_EMAS"]
tip = g.matrix_world @ Vector(g["tip"]); mid = g.matrix_world @ Vector((0, 0, 0.02))
# a warm candle just behind the plate for a rim glint along the fork
c = PR.lilin("LILIN_DEKAT", 0.16, bpy.data.collections["PROPS"]); c.location = mid + Vector((-0.28, 0.32, -0.02))
cam = camera(SID, 85, [(f0, mid + Vector((0.12, -0.42, 0.16)), mid), (f1, mid + Vector((0.09, -0.31, 0.12)), mid + Vector((0.004, 0, 0)))],
             focus=mid, fstop=2.0)
finish(SID, check=False)
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, f1]))
