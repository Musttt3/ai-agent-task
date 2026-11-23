# Shared staging for the London tavern shots (16-20).
import bpy, math
from mathutils import Vector
from shot_lib import *
from venesia_common import look
TH = 0.76

def coryat_hat(r, b):
    h = PR.topi_tinggi("TOPI_CORYAT", coll=bpy.data.collections["PROPS"]); P.wear(h, r, b, height=0.135); return h

def coryat_seated(f0, f1):
    b, r = actor("coryat", loc=Vector((0.0, 1.12, 0)), yaw=0)
    P.sit(r, b, seat_z(0.0, 1.15), lean=10)
    coryat_hat(r, b)
    X, F, U = P.char_axes(r)
    P.relaxed_arms(r)
    for s, dx in (("L", 0.22), ("R", -0.22)):
        P.reach(r, s, Vector((dx, 0.86, TH + 0.035)), pole_dir=-U * 0.8 + (X if s == "L" else -X) * 0.6, wrist_fwd=F - U * 0.15)
        P._roll_palm(r, s, -U); P.hand_shape(r, s, "rileks", 0.6)
    P.key_pose(r, f0); P.key_pose(r, f1); r.keyframe_insert("location", frame=f0)
    return b, r

def townsfolk(f0, f1):
    """the three regulars around their table (1.9, 1.7)"""
    out = []
    for name, (x, y), yaw in (("warga_a", (1.35, 1.75), -90), ("warga_b", (2.45, 1.75), 90), ("warga_c", (1.9, 2.45), 0)):
        b, r = actor(name, loc=Vector((x, y, 0)), yaw=yaw)
        P.sit(r, b, seat_z(x, y), lean=8)
        X, F, U = P.char_axes(r)
        P.relaxed_arms(r)
        tbl = Vector((1.9, 1.7, TH + 0.035))
        for s in ("L", "R"):
            side = X if s == "L" else -X
            tgt = tbl + (Vector((x, y, TH)) - tbl).normalized() * 0.32 + side * 0.17; tgt.z = TH + 0.035
            P.reach(r, s, tgt, pole_dir=-U * 0.8 + side * 0.6, wrist_fwd=F - U * 0.1)
            P._roll_palm(r, s, -U); P.hand_shape(r, s, "rileks", 0.6)
        P.key_pose(r, f0); P.key_pose(r, f1); r.keyframe_insert("location", frame=f0)
        out.append((b, r))
    return out

def point_at(r, f, target, side="R"):
    X, F, U = P.char_axes(r)
    sh = P.bone_world(r, f"upperarm01.{side}")
    d = (Vector(target) - sh).normalized()
    P.reach(r, side, sh + d * 0.52, pole_dir=-U - (X if side == "R" else -X) * 0.3, wrist_fwd=d)
    P.hand_shape(r, side, "tunjuk", 1.0)
    P.key_pose(r, f, bones=[pb.name for pb in r.pose.bones if pb.name.endswith("." + side) and ("arm" in pb.name or "wrist" in pb.name or "finger" in pb.name or "clavicle" in pb.name)])
