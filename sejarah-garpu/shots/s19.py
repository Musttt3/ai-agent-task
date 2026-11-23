# Shot 19 — "Dia diejek Furcifer," (1061-1112). The regulars point at Coryat and burst out laughing (1069).
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from london_common import *
SID = "19"; f0, f1, _ = SHOTS[SID]
sc = open_set("london", SID)
folk = townsfolk(f0, f1)
cor = Vector((0.0, 1.1, 1.25))
for i, ((b, r), side) in enumerate(zip(folk, (None, None, None))):
    look(r, f0, cor, 1.0)
    point_at(r, 1066 + i * 2, cor, side)
    X, F, U = P.char_axes(r)
    for f, k in ((1075, 1), (1083, -1), (1091, 1), (1099, -1), (f1, 0)):    # shoulders shake with laughter
        sc.frame_set(f); P.turn(r, "spine03", X, 3 * k); P.key_pose(r, f, bones=["spine03"])
    look(r, 1080, cor + U * 0.15, 0.9); look(r, f1, cor, 0.9)
    P.face(b, f0, "KAGET", 0.6); P.face(b, 1068 + i, "TERTAWA", 1.0); P.face(b, f1, "TERTAWA", 0.9)
cam = camera(SID, 28, [(f0, (0.6, -0.6, 1.5), (1.95, 1.95, 1.1)), (f1, (0.7, -0.45, 1.5), (1.95, 1.95, 1.12))], focus=Vector((1.9, 1.8, 1.25)), fstop=3.5)
finish(SID, chars=folk, env=[o for o in bpy.data.objects["Meja_Warga"].children_recursive if o.type == "MESH"], every=4)
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 1085, f1]))
