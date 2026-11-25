# Shot 09 — "Tapi awalnya buat masak, bukan buat makan." (445-531). Medium: the KOKI stirs the ding with the long
# bronze chopsticks, then on "bukan" (493) looks up at the camera and shakes his head.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot_lib import *
SID = "09"; f0, f1, _ = SHOTS[SID]
sc = open_set("dapur", SID)
b, r = actor("koki", loc=Vector((0.0, 1.06, 0)), yaw=0)     # toes at the stove edge (y 0.9)
sm_ = bpy.data.materials.get("Uap")
if sm_:
    for n_ in sm_.node_tree.nodes:
        if n_.type == "MAP_RANGE": n_.inputs["To Max"].default_value = 0.18
plant_feet(r, b)
X, F, U = P.char_axes(r)
P.turn(r, "spine02", X, 16); P.turn(r, "spine03", X, 10)      # leaning over the ding
# the ding (with its fire and steam) sits on her side of the stove top, within reach of the long chopsticks
for o in bpy.data.objects:
    if o.parent is None and (o.name in ("DING", "API_TUNGKU", "API_TUNGKU_cahaya") or o.name.upper().startswith("UAP")):
        o.location.y += 0.12
bpy.context.view_layer.update()
sp = bpy.data.objects["SUMPIT_MASAK"]; sp["grip_mode"] = "pena"; sp["r"] = 0.0035
pot = bpy.data.objects["DING"].matrix_world.translation + Vector((0, 0.06, 0.3))   # in the broth (surface z 0.6), her side of the pot
keys = [(f, pot + Vector((0.05 * math.cos(i * 1.3), 0.04 * math.sin(i * 1.3), -0.03))) for i, f in enumerate(range(f0, 490, 9))]
keys += [(498, pot + Vector((0.03, -0.03, 0.06))), (f1, pot + Vector((0.03, -0.03, 0.08)))]
hold(sp, r, "R", keys, point_local=Vector(sp["tip"]), grip_local=(0, 0, -0.02), pole=-U * 0.8 - X * 0.6,
     hand_dir=(F * 0.5 - U * 0.5 - X * 0.2).normalized(), palm_dir=(X * 0.7 - F * 0.3).normalized(), fingers=(1, 2, 3), pre_shape=("pegang", 0.5),
     prop_dirs={k[0]: (-U * 0.85 + F * 0.3).normalized() for k in keys})
P.relaxed_arms(r, sides=("L",)); P.key_pose(r, f0, bones=[pb.name for pb in r.pose.bones if pb.name.endswith(".L")])
plant_feet(r, b); r.keyframe_insert("location", frame=f0)
# head: down at the pot, up to camera at 490, shakes on "bukan buat makan" (493-523)
cam_pos = Vector((0.15, -1.55, 1.55))
for f, yaw, pitch in ((f0, 0, 18), (486, 0, 18), (492, 0, 0), (497, 16, 0), (503, -16, 0), (509, 14, 0), (515, -12, 0), (521, 0, 0), (f1, 0, 0)):
    sc.frame_set(f)
    for bn in ("neck02", "head"): r.pose.bones[bn].rotation_mode = "QUATERNION"; r.pose.bones[bn].rotation_quaternion = (1, 0, 0, 0)
    bpy.context.view_layer.update()
    P.turn(r, "neck02", U, yaw * 0.4); P.turn(r, "head", U, yaw * 0.6); P.turn(r, "neck02", X, pitch * 0.5); P.turn(r, "head", X, pitch * 0.5)
    P.key_pose(r, f, bones=["neck02", "head"])
P.face(b, f0, "NETRAL", extra={"eyeLookDownLeft": 0.5, "eyeLookDownRight": 0.5}); P.face(b, 488, "NETRAL")
P.face(b, 494, "SENYUM", 0.5, extra={"browInnerUp": 0.3}); P.face(b, f1, "SENYUM", 0.7)
P.blink(b, 470)
head = P.bone_world(r, "head")
cam = camera(SID, 40, [(f0, cam_pos, head - U * 0.25), (f1, cam_pos + Vector((0, 0.08, 0)), head - U * 0.2)], focus=head, fstop=2.8)
finish(SID, chars=[(b, r)], props=[sp], env=[bpy.data.objects["DING"], bpy.data.objects["Tungku"]], every=6)
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 500, f1]))
