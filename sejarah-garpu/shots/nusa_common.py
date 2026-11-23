# Shared staging for the Nusantara shots (21-24). Veranda floor at FZ.
import bpy, math
from mathutils import Vector
from shot_lib import *
from venesia_common import look
FZ = 1.2

def move_meals():
    for nm in ("NASI_DAUN_A", "NASI_DAUN_B"):
        o = bpy.data.objects.get(nm)
        if o and not o.get("_moved"): o.location.y -= 0.32; o["_moved"] = 1
    bpy.context.view_layer.update()

def leluhur_bersila(name, x, y, yaw, f0, f1, lean=12):
    move_meals()
    b, r = actor(name, loc=Vector((x, y, FZ)), yaw=yaw)
    P.bersila(r, b, FZ, lean=lean)
    X, F, U = P.char_axes(r)
    for s, sg in (("L", 1), ("R", -1)):          # hands resting on the knees
        knee = P.bone_world(r, f"lowerleg01.{s}")
        P.reach(r, s, knee + U * 0.13 - F * 0.03, pole_dir=X * sg * 0.8 - F * 0.3, wrist_fwd=(F * 0.85 - U * 0.2 + X * sg * 0.25).normalized())
        P._roll_palm(r, s, -U); P.hand_shape(r, s, "rileks", 0.7)
    P.key_pose(r, f0); P.key_pose(r, f1); r.keyframe_insert("location", frame=f0)
    return b, r
