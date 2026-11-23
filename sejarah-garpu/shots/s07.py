# Shot 07 — "Sekitar seribu dua ratus sebelum masehi," (311-381). Wide, slow crane down into the Shang kitchen:
# the KOKI behind the steaming bronze ding, stirring with the long chopsticks.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot_lib import *
SID = "07"; f0, f1, _ = SHOTS[SID]
sc = open_set("dapur", SID)
b, r = actor("koki", loc=Vector((0.0, 1.18, 0)), yaw=0)
sm_ = bpy.data.materials.get("Uap")
if sm_:
    for n_ in sm_.node_tree.nodes:
        if n_.type == "MAP_RANGE": n_.inputs["To Max"].default_value = 0.18
plant_feet(r, b)
X, F, U = P.char_axes(r)
P.turn(r, "spine02", X, 10); P.turn(r, "spine03", X, 6)
sp = bpy.data.objects["SUMPIT_MASAK"]; sp["grip_mode"] = "pena"; sp["r"] = 0.0035
pot = bpy.data.objects["DING"].matrix_world.translation + Vector((0, 0, 0.36))
keys = [(f, pot + Vector((0.07 * math.cos(i * 1.3), 0.07 * math.sin(i * 1.3), -0.03))) for i, f in enumerate(range(f0, f1 + 1, 10))]
errs = hold(sp, r, "R", keys, point_local=Vector(sp["tip"]), grip_local=(0, 0, -0.02), pole=-U * 0.8 - X * 0.6,
            hand_dir=(F * 0.5 - U * 0.5 - X * 0.2).normalized(), palm_dir=(X * 0.7 - F * 0.3).normalized(), fingers=(1, 2, 3), pre_shape=("pegang", 0.5),
            prop_dirs={k[0]: (-U * 0.85 + F * 0.3).normalized() for k in keys})
print("HOLD", errs)
P.relaxed_arms(r, sides=("L",)); P.key_pose(r, f0, bones=[pb.name for pb in r.pose.bones if pb.name.endswith(".L")])
plant_feet(r, b); r.keyframe_insert("location", frame=f0)
P.face(b, f0, "NETRAL", extra={"eyeLookDownLeft": 0.6, "eyeLookDownRight": 0.6}); P.blink(b, 350)
cam = camera(SID, 26, [(f0, (0.8, -3.3, 2.6), (0, 1.0, 1.2)), (f1, (0.7, -3.0, 1.5), (0, 1.0, 0.95))], focus=pot, fstop=4.0)
finish(SID, chars=[(b, r)], props=[sp], env=[bpy.data.objects["DING"], bpy.data.objects["Tungku"]], every=6)
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, f1]))
