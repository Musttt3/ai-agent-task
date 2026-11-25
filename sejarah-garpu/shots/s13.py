# Shot 13 — "makan pakai garpu emas." (770-819). Close-up: the PUTRI lifts the golden fork to her lips, smiling;
# a gold glint on "emas" (800). Seated at the head of the table, left hand resting on the cloth.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot_lib import *
SID = "13"; f0, f1, _ = SHOTS[SID]
sc = open_set("venesia", SID)
# the head-end tablecloth skirt: shorten so her knees pass under the table (cloth would fold over them)
from venesia_common import prepare_table
prepare_table()                     # shortened skirt + her plate within reach
b, r = actor("putri", mark="putri")
sz = seat_z(0, 3.6)
print("SEAT", sz)
r.location.y = 3.62
P.sit(r, b, sz, lean=12)
X, F, U = P.char_axes(r)
P.relaxed_arms(r, sides=("L",))
# left hand rests on the table edge, palm down
TH = 0.76
lh = Vector((0.24, 2.93, TH + 0.035))
P.reach(r, "L", lh, pole_dir=X * 1.0 - U * 0.5, wrist_fwd=F * 1.0 - U * 0.15)
P._roll_palm(r, "L", -U); P.hand_shape(r, "L", "rileks", 0.6)
P.key_pose(r, f0); P.key_pose(r, f1)
r.keyframe_insert("location", frame=f0)
# head: slightly down at the start (looking at the plate), up toward the fork as it rises
P.turn(r, "neck02", X, 10); P.key_pose(r, f0, bones=["neck02", "head"])
P.turn(r, "neck02", X, -8); P.key_pose(r, 798, bones=["neck02", "head"]); P.key_pose(r, f1, bones=["neck02", "head"])
# the fork: from the plate (with a bite of pear on the tines) up to her lips
g = bpy.data.objects["GARPU_EMAS"]
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.011, location=(0, 0, 0)); bite = bpy.context.object; bite.name = "POTONGAN_PIR"
bite.scale = (1.0, 0.8, 1.2); bite.data.materials.append(PR.mat_noise_color("Daging_Pir", (0.92, 0.88, 0.66), (0.82, 0.76, 0.5), scale=400, rough=0.3, bump=0.2, sss=0.3))
for p_ in bite.data.polygons: p_.use_smooth = True
bite.parent = g; bite.location = Vector(g["tip"]) + Vector((0, 0, 0.002))
mouth = P.lips_front(b, r, out=0.024) - Vector((0, 0, 0.019))
print("MOUTH", mouth)
plate = Vector((0.02, 3.08, TH + 0.03))
keys = [(f0, plate + Vector((0.02, -0.02, 0.01))), (785, plate.lerp(mouth, 0.55) + Vector((-0.03, -0.04, 0.0))), (800, mouth), (809, mouth + F * 0.05 - U * 0.05), (f1, mouth + F * 0.08 - U * 0.1)]
g["grip_mode"] = "pena"
# hand (= fork) directions: tines down into the food, then turned toward the lips
d0 = (-U * 0.8 + F * 0.45 + X * 0.25).normalized()
dm = (mouth - (plate.lerp(mouth, 0.55))).normalized()
d1 = (X * 0.55 - F * 0.6 + U * 0.3).normalized()      # fork comes in from her right-front, slightly up, to the lips
errs = hold(g, r, "R", keys, point_local=Vector(g["tip"]), grip_local=(0, 0, 0.025), pole=-U * 0.8 - X * 0.6,
            hand_dirs={f0: d0, 785: (dm + d1).normalized(), 800: d1, 809: d1, f1: d1},
            palm_dirs={f0: -U * 0.3 + X * 0.9, 785: X * 0.6 - U * 0.6, 800: -U * 0.6 - F * 0.4, 809: -U * 0.6 - F * 0.4, f1: -U * 0.6 - F * 0.4},
            fingers=(1, 3), pre_shape=("garpu_makan", 1.0), prop_dirs={785: (dm + d1).normalized(), 800: d1, 809: d1, f1: (d1 - U * 0.15).normalized()})
print("HOLD errors", errs)
hide_between(bite, f0 - 5, 803)   # eaten
# face: soft smile, eyes on the fork, a blink after the bite
P.face(b, f0, "SENYUM", 0.5, extra={"eyeLookDownLeft": 0.45, "eyeLookDownRight": 0.45})
P.face(b, 792, "SENYUM", 0.8, extra={"eyeLookDownLeft": 0.25, "eyeLookDownRight": 0.25})
P.face(b, 796, "SENYUM", 0.6, extra={"jawOpen": 0.22, "mouthFunnel": 0.15})
P.face(b, 803, "SENYUM", 0.5, extra={"jawOpen": 0.12})
P.face(b, 808, "MENGUNYAH", 1.0, extra={"mouthSmileLeft": 0.5, "mouthSmileRight": 0.5})
P.face(b, 813, "SENYUM", 0.9, extra={"jawOpen": 0.05})
P.face(b, f1, "SENYUM", 1.0)
P.blink(b, 812)
# camera: close, from her front-right at eye level, slow push-in; focus on the fork tip / lips
cam = camera(SID, 55, [(f0, mouth + Vector((0.42, -1.05, 0.02)), mouth + Vector((0, 0, -0.1))), (f1, mouth + Vector((0.36, -0.9, 0.02)), mouth + Vector((0, 0, -0.08)))], focus=mouth, fstop=2.2)
rep = finish(SID, chars=[(b, r)], props=[g], env=[bpy.data.objects["Meja"], bpy.data.objects["Taplak"]])
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 785, 800, f1]))
