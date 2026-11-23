# Shared staging for the London tavern shots (16-20).
import bpy, math
from mathutils import Vector
from shot_lib import *
from venesia_common import look
TH = 0.76
def table_top(name):
    """real top height of a tavern table (ray from above its centre)"""
    root = bpy.data.objects[name]; c = root.matrix_world.translation
    return seat_z(c.x, c.y, z0=2.0)

def arrange_tables():
    """the tavern tables are small round pedestal tables (top radius ~0.27 m): keep every table thing on the top"""
    moves = {"Mangkuk_Coryat": (0.12, 0.5), "Kaki_Lilin_C": (-0.13, 0.55), "Lilin_C": (-0.13, 0.55),
             "Kendi_0": (1.8, 1.6), "Kendi_1": (2.0, 1.8), "Kendi_2": (1.86, 1.86), "Kaki_Lilin_W": (1.98, 1.6), "Lilin_W": (1.98, 1.6)}
    for nm, (x, y) in moves.items():
        o = bpy.data.objects.get(nm)
        if o and not o.get("_ok"): o.location.x, o.location.y = x, y; o["_ok"] = 1
    for nm in ("KOTAK_GARPU", "GARPU_CORYAT"):
        o = bpy.data.objects.get(nm)
        if o and not o.get("_ok"): o.location.x -= 0.1; o.location.y += 0.3; o["_ok"] = 1
    bpy.context.view_layer.update()

def coryat_hat(r, b):
    h = PR.topi_tinggi("TOPI_CORYAT", coll=bpy.data.collections["PROPS"]); P.wear(h, r, b, height=0.135); return h

def coryat_seated(f0, f1):
    arrange_tables()
    bench = bpy.data.objects["Bangku_Coryat"]; bench.location.y = 1.36
    bpy.context.view_layer.update()
    b, r = actor("coryat", loc=Vector((0.0, 1.32, 0)), yaw=0)
    P.sit(r, b, seat_z(0.0, 1.36), lean=14)
    th = table_top("Meja_Coryat")
    coryat_hat(r, b)
    X, F, U = P.char_axes(r)
    P.relaxed_arms(r)
    for s, dx in (("L", 0.22), ("R", -0.22)):
        P.reach(r, s, Vector((dx * 0.55, 0.76, th + 0.035)), pole_dir=-U * 0.8 + (X if s == "L" else -X) * 0.6, wrist_fwd=F - U * 0.15)
        P._roll_palm(r, s, -U); P.hand_shape(r, s, "rileks", 0.6)
    P.key_pose(r, f0); P.key_pose(r, f1); r.keyframe_insert("location", frame=f0)
    return b, r

def townsfolk(f0, f1):
    """the three regulars around their table (1.9, 1.7)"""
    arrange_tables()
    out = []
    for nm, xy in (("Dingklik_0", (1.18, 1.7)), ("Dingklik_1", (2.62, 1.7)), ("Dingklik_2", (1.9, 2.72))):
        st = bpy.data.objects.get(nm)
        if st: st.location.x, st.location.y = xy
    bpy.context.view_layer.update()
    th = table_top("Meja_Warga")
    for name, (x, y), yaw in (("warga_a", (1.18, 1.75), 90), ("warga_b", (2.62, 1.75), -90), ("warga_c", (1.9, 2.72), 0)):
        b, r = actor(name, loc=Vector((x, y, 0)), yaw=yaw)
        P.sit(r, b, seat_z(x, y), lean=8)
        X, F, U = P.char_axes(r)
        P.relaxed_arms(r)
        for s in ("L", "R"):      # hands rest on the thighs (the table top is too small for six hands)
            side = X if s == "L" else -X
            hip = P.bone_world(r, f"upperleg01.{s}"); knee = P.bone_world(r, f"lowerleg01.{s}")
            tgt = hip.lerp(knee, 0.62) + U * 0.17 - side * 0.02
            P.reach(r, s, tgt, pole_dir=-U * 0.3 + side * 0.9, wrist_fwd=(F * 0.9 - U * 0.15).normalized())
            P._roll_palm(r, s, -U); P.hand_shape(r, s, "rileks", 0.6)
        P.key_pose(r, f0); P.key_pose(r, f1); r.keyframe_insert("location", frame=f0)
        out.append((b, r))
    return out

def point_at(r, f, target, side=None):
    X, F, U = P.char_axes(r)
    chest = P.bone_world(r, "spine01")
    if side is None: side = "L" if (Vector(target) - chest).dot(X) > 0 else "R"
    # twist the torso toward the target so the pointing arm never crosses the body
    d = Vector(target) - chest; yaw = math.degrees(math.atan2(d.dot(X), d.dot(F)))
    for bn, k in (("spine02", 0.3), ("spine01", 0.3)):
        r.pose.bones[bn].rotation_mode = "QUATERNION"; P.turn(r, bn, U, max(-45, min(45, yaw * k)))
    P.key_pose(r, f, bones=["spine02", "spine01"])
    sh = P.bone_world(r, f"upperarm01.{side}")
    d = (Vector(target) - sh).normalized()
    P.reach(r, side, sh + d * 0.52, pole_dir=-U - (X if side == "R" else -X) * 0.3, wrist_fwd=d)
    P.hand_shape(r, side, "tunjuk", 1.0)
    P.key_pose(r, f, bones=[pb.name for pb in r.pose.bones if pb.name.endswith("." + side) and ("arm" in pb.name or "wrist" in pb.name or "finger" in pb.name or "clavicle" in pb.name)])
