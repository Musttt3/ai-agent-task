# Shot 18 — "Hasilnya?" (1037-1060). The three regulars turn their heads toward Coryat at once.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from london_common import *
SID = "18"; f0, f1, _ = SHOTS[SID]
sc = open_set("london", SID)
folk = townsfolk(f0, f1)
cor = Vector((0.0, 1.1, 1.25))
for (b, r), d in zip(folk, (0, 2, 4)):
    look(r, f0, Vector((1.9, 1.7, 0.85)), 0.6); look(r, f0 + 3 + d, Vector((1.9, 1.7, 0.85)), 0.6); look(r, f0 + 10 + d, cor, 1.0); look(r, f1, cor, 1.0)
    P.face(b, f0, "SENYUM", 0.4); P.face(b, f0 + 10 + d, "KAGET", 0.8); P.face(b, f1, "KAGET", 0.7)
cam = camera(SID, 30, [(f0, (0.9, -0.4, 1.45), (1.95, 1.9, 1.05)), (f1, (0.95, -0.3, 1.45), (1.95, 1.9, 1.07))], focus=Vector((1.9, 1.8, 1.2)), fstop=3.5)
finish(SID, chars=folk, env=[o for o in bpy.data.objects["Meja_Warga"].children_recursive if o.type == "MESH"], every=4)
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, f1]))
