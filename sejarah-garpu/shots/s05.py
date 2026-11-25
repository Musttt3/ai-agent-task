# Shot 05 — "Sendoknya?" (224-245). Close-up: the PURBA looks at his greasy open palms, puzzled.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot_lib import *
SID = "05"; f0, f1, _ = SHOTS[SID]
sc = open_set("gua", SID)
b, r = actor("purba", loc=Vector((0.0, 1.42, 0)), yaw=0)
P.sit(r, b, seat_z(0.0, 1.4), lean=16, spread=0.12)
X, F, U = P.char_axes(r)
bpy.data.objects["DAGING_BAKAR"].location = (0.35, 1.05, 0.33)          # put down on the log beside him
bpy.data.objects["DAGING_BAKAR"].rotation_euler = (0, math.radians(90), 0.3)
head = P.bone_world(r, "head")
for f, lift in ((f0, 0.0), (232, 1.0), (f1, 1.0)):
    sc.frame_set(f)
    for s, sg in (("L", 1), ("R", -1)):
        tgt = head - U * (0.38 - 0.08 * lift) + F * 0.33 + X * sg * 0.11
        P.reach(r, s, tgt, pole_dir=-U * 0.9 + X * sg * 0.4, wrist_fwd=(F * 0.5 + U * 0.6 + X * sg * 0.1).normalized())
        P._roll_palm(r, s, (-F * 0.7 + U * 0.5).normalized())       # palms up toward his face
        P.hand_shape(r, s, "rileks", 0.8)      # open palms, fingers softly curved
    P.key_pose(r, f)
P.turn(r, "neck02", X, 14); P.key_pose(r, f0, bones=["neck02"]); P.key_pose(r, f1, bones=["neck02"])
P.face(b, f0, "BINGUNG", 0.6); P.face(b, 230, "BINGUNG", 1.0); P.face(b, f1, "BINGUNG", 1.0, extra={"browInnerUp": 0.8})
cam = camera(SID, 45, [(f0, head + F * 0.95 - U * 0.1 + X * 0.15, head - U * 0.22), (f1, head + F * 0.85 - U * 0.1 + X * 0.14, head - U * 0.2)], focus=head + F * 0.1, fstop=2.8)
finish(SID, chars=[(b, r)], env=[bpy.data.objects["Batang_Duduk"]])
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, f1]))
