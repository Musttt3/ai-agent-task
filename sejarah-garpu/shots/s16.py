# Shot 16 — "Tahun 1611, Thomas Coryat" (911-986). Wide from inside the tavern: the door swings open (915) and
# CORYAT walks in with his leather bag, toward his table.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from london_common import *
SID = "16"; f0, f1, _ = SHOTS[SID]
sc = open_set("london", SID)
door = bpy.data.objects["Pintu"]; hinge = Vector((-3.85, -0.5, 0))
# pivot the door on its hinge
piv = bpy.data.objects.new("ENGSEL_PINTU", None); bpy.data.collections["SET"].objects.link(piv); piv.location = hinge
for o in [door] + [o for o in bpy.data.objects if o.name.startswith("Engsel_")]:
    mw = o.matrix_world.copy(); o.parent = piv; o.matrix_world = mw
for f, a in ((f0, 0), (915, 0), (930, -80), (f1, -82)):
    piv.rotation_euler = (0, 0, math.radians(a)); piv.keyframe_insert("rotation_euler", frame=f)
b, r = actor("coryat", loc=Vector((-4.4, 0.05, 0)), yaw=-90)
coryat_hat(r, b)
bag = bpy.data.objects["Tas_Coryat"]
walk(r, b, [(-4.4, 0.05), (-3.2, 0.25), (-1.0, 0.7)], 922, f1, step_frames=14, arm_amp=12, carry_R=True)
# the bag in the right hand: handle in a fist, arm hanging
X, F, U = P.char_axes(r)
bag_meshes = [o for o in bag.children_recursive if o.type == "MESH"]
for f in range(922, f1 + 1, 2):
    sc.frame_set(f)
    X, F, U = P.char_axes(r)
    sh = P.bone_world(r, "upperarm01.R")
    P.reach(r, "R", sh - U * 0.55 - X * 0.12 + F * 0.03, pole_dir=-X * 0.3 - F * 0.6, wrist_fwd=-U)
    P._roll_palm(r, "R", X); P.hand_shape(r, "R", "kepal", 0.85)
    P.key_pose(r, f, bones=[pb.name for pb in r.pose.bones if pb.name.endswith(".R") and ("arm" in pb.name or "wrist" in pb.name or "finger" in pb.name)])
sc.frame_set(922)
hand = P.bone_world(r, "wrist.R", tail=True)
mn, mx = None, None
from lib import bbox
mn, mx = bbox(bag_meshes)
top = Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mx.z))
bag.location += (hand - U * 0.035) - top
bag.rotation_euler = (0, 0, r.rotation_euler.z + math.radians(90))
for c in list(bag.constraints): bag.constraints.remove(c)
P.attach(bag, r, "wrist.R")
hide_between(r, 917)
for o in r.children: hide_between(o, 917)
P.face(b, f0, "SENYUM", 0.6); P.face(b, 950, "BANGGA", 0.8); P.blink(b, 960)
look(r, 940, Vector((2.0, 1.8, 1.2)), 0.5); look(r, f1, Vector((0, 0.6, 0.9)), 0.4)
cam = camera(SID, 24, [(f0, (2.4, -2.3, 1.55), (-2.6, 0.4, 1.2)), (f1, (2.2, -2.0, 1.5), (-1.4, 0.6, 1.15))], focus=Vector((-2.0, 0.5, 1.4)), fstop=4.0)
finish(SID, chars=[(b, r)], props=[], env=[bpy.data.objects["Lantai"]], every=6)
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 935, 960, f1]))
