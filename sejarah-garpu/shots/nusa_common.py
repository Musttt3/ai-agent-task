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

import json as _json
_KNEE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "blend", "knee_cache.json")
try: _KNEE_H = {tuple(k.split("|")): v for k, v in _json.load(open(_KNEE_FILE)).items()}
except Exception: _KNEE_H = {}
def _knee_key(r, s):
    """same character + same seated pose (knee relative to the root) -> same resting height"""
    k = r.matrix_world.inverted() @ P.bone_world(r, f"lowerleg01.{s}")
    return (r.name, s, "%.2f,%.2f,%.2f" % tuple(k))
def rest_hands_on_knees(b, r, f, sides=("L", "R")):
    """palms resting on top of the knees: start low and lift each hand until the collision check is clean"""
    X, F, U = P.char_axes(r)
    for s, sg in (("L", 1), ("R", -1)):
        if s not in sides: continue
        knee = P.bone_world(r, f"lowerleg01.{s}")
        arm = [pb.name for pb in r.pose.bones if pb.name.endswith("." + s) and any(k in pb.name for k in ("arm", "wrist", "finger", "metacarpal", "shoulder", "clavicle"))]
        h0 = _KNEE_H.get(_knee_key(r, s), 0.128) - 0.008   # start near the known / usual height (saves full collision checks)
        for i in range(25):
            h = h0 + 0.008 * i
            P.reach(r, s, knee + U * h - F * 0.07 - X * sg * 0.02, pole_dir=X * sg * 0.8 - F * 0.3, wrist_fwd=(F * 0.85 - U * 0.25 + X * sg * 0.1).normalized())
            P._roll_palm(r, s, -U); P.hand_shape(r, s, "rileks", 0.6)
            P.key_pose(r, f, bones=arm)
            bad = [x for x in P.check([(b, r)], frames=[f]) if f"tangan.{s}" in x[1] or f"lengan_bawah.{s}" in x[1]]
            if not bad: break
        h += 0.004
        P.reach(r, s, knee + U * h - F * 0.07 - X * sg * 0.02, pole_dir=X * sg * 0.8 - F * 0.3, wrist_fwd=(F * 0.85 - U * 0.25 + X * sg * 0.1).normalized())
        P._roll_palm(r, s, -U); P.hand_shape(r, s, "rileks", 0.6); P.key_pose(r, f, bones=arm)
        _KNEE_H[_knee_key(r, s)] = h - 0.004
        try: _json.dump({"|".join(k): v for k, v in _KNEE_H.items()}, open(_KNEE_FILE, "w"))
        except Exception: pass
        print("KNEE", r.name, s, "h %.3f" % h)

def leluhur_bersila(name, x, y, yaw, f0, f1, lean=12):
    move_meals()
    b, r = actor(name, loc=Vector((x, y, FZ)), yaw=yaw)
    P.bersila(r, b, FZ, lean=lean)
    X, F, U = P.char_axes(r)
    rest_hands_on_knees(b, r, f0)
    P.key_pose(r, f0); P.key_pose(r, f1); r.keyframe_insert("location", frame=f0)
    return b, r
