# Shared staging for the Venetian hall shots (02, 12, 13, 14, 15).
import bpy, math
from mathutils import Vector
from shot_lib import *

TH = 0.76; TY1 = 3.0; TW = 1.15

def prepare_table():
    """the head-end cloth skirt is shortened so seated knees pass under the table (cloth would fold over them)"""
    end = bpy.data.objects["Taplak_Ujung_1"]; end.scale.z = 0.25; end.location.z = TH - 0.05

def putri_seated(f0, f1, lean=12):
    prepare_table()
    b, r = actor("putri", loc=Vector((0, 3.62, 0)), yaw=0)
    P.sit(r, b, seat_z(0, 3.6), lean=lean)
    X, F, U = P.char_axes(r)
    P.relaxed_arms(r, sides=("L",))
    P.reach(r, "L", Vector((0.24, 2.93, TH + 0.035)), pole_dir=X * 1.0 - U * 0.5, wrist_fwd=F * 1.0 - U * 0.15)
    P._roll_palm(r, "L", -U); P.hand_shape(r, "L", "rileks", 0.6)
    P.key_pose(r, f0); P.key_pose(r, f1); r.keyframe_insert("location", frame=f0)
    return b, r

def guest_seated(name, side, y, f0, f1, lean=8, look_at=None):
    """a guest on a side chair (side = -1 left / +1 right of the table), hands resting on the table edge"""
    x = side * (TW / 2 + 0.38)
    b, r = actor(name, loc=Vector((x - side * 0.04, y, 0)), yaw=90 * side)   # facing the table
    P.sit(r, b, seat_z(x, y), lean=lean)
    X, F, U = P.char_axes(r)
    for s, dy in (("L", 0.18), ("R", -0.18)):
        tgt = Vector((side * (TW / 2 - 0.08), y + dy * side * -1, TH + 0.035))
        P.reach(r, s, tgt, pole_dir=-U * 0.8 + (X if s == "L" else -X) * 0.6, wrist_fwd=F * 1.0 - U * 0.1)
        P._roll_palm(r, s, -U); P.hand_shape(r, s, "rileks", 0.6)
    P.key_pose(r, f0); P.key_pose(r, f1); r.keyframe_insert("location", frame=f0)
    return b, r

def look(rig, f, target, amount=1.0, bones=("neck02", "head")):
    """turn the head toward a world point (split over neck and head), keyed at frame f"""
    bpy.context.scene.frame_set(f)
    X, F, U = P.char_axes(rig)
    hp = P.bone_world(rig, "head")
    d = (Vector(target) - hp)
    yaw = math.degrees(math.atan2(d.dot(X), d.dot(F))) * amount       # + = toward the character's left (+X)
    pitch = math.degrees(math.atan2(d.dot(U), Vector((d.dot(X), d.dot(F))).length)) * amount
    for b in bones:
        pb = rig.pose.bones[b]; pb.rotation_mode = "QUATERNION"; pb.rotation_quaternion = (1, 0, 0, 0)
    bpy.context.view_layer.update()
    P.turn(rig, bones[0], U, yaw * 0.45); P.turn(rig, bones[1], U, yaw * 0.55)
    P.turn(rig, bones[0], X, -pitch * 0.4); P.turn(rig, bones[1], X, -pitch * 0.6)
    P.key_pose(rig, f, bones=list(bones))

def put_mitre(rig, body):
    m = PR.mitra("MITRA", coll=bpy.data.collections["PROPS"])
    P.wear(m, rig, body, height=0.12)
    return m
