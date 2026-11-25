# Posing toolkit for MPFB characters (default rig): faces, arm IK, finger grips, keyframing, penetration check.
#   from pose_lib import *
# Conventions: a character is the pair (body, rig) returned by mh_lib.build_char; objects are named "<name>.<asset>".
import bpy, math
from mathutils import Vector, Matrix, Quaternion
from mathutils.bvhtree import BVHTree

# ------------------------------------------------------------------ face
EXPR = {  # ARKit face units (MPFB faceunits01) per expression
    "NETRAL":  {},
    "SENYUM":  {"mouthSmileLeft": 0.55, "mouthSmileRight": 0.55, "cheekSquintLeft": 0.25, "cheekSquintRight": 0.25, "eyeSquintLeft": 0.15, "eyeSquintRight": 0.15},
    "SENANG":  {"mouthSmileLeft": 0.85, "mouthSmileRight": 0.85, "jawOpen": 0.18, "cheekSquintLeft": 0.45, "cheekSquintRight": 0.45, "eyeSquintLeft": 0.3, "eyeSquintRight": 0.3, "browInnerUp": 0.15},
    "TERTAWA": {"mouthSmileLeft": 1.0, "mouthSmileRight": 1.0, "jawOpen": 0.42, "cheekSquintLeft": 0.7, "cheekSquintRight": 0.7, "eyeSquintLeft": 0.6, "eyeSquintRight": 0.6, "mouthUpperUpLeft": 0.3, "mouthUpperUpRight": 0.3},
    "KAGET":   {"eyeWideLeft": 0.8, "eyeWideRight": 0.8, "browInnerUp": 0.8, "browOuterUpLeft": 0.7, "browOuterUpRight": 0.7, "jawOpen": 0.25, "mouthFunnel": 0.3},
    "MIKIR":   {"browInnerUp": 0.2, "browOuterUpLeft": 0.6, "browDownRight": 0.35, "mouthLeft": 0.35, "mouthPressLeft": 0.3, "eyeLookUpLeft": 0.35, "eyeLookUpRight": 0.35, "eyeSquintRight": 0.2},
    "BINGUNG": {"browInnerUp": 0.55, "browDownLeft": 0.2, "mouthShrugUpper": 0.3, "mouthRight": 0.25, "mouthFrownLeft": 0.2, "eyeLookDownLeft": 0.5, "eyeLookDownRight": 0.5},
    "SINIS":   {"browDownLeft": 0.45, "browDownRight": 0.15, "eyeSquintLeft": 0.5, "eyeSquintRight": 0.35, "mouthSmileLeft": 0.25, "mouthPressRight": 0.3, "noseSneerLeft": 0.3, "eyeLookOutLeft": 0.45, "eyeLookInRight": 0.45},
    "MARAH":   {"browDownLeft": 0.9, "browDownRight": 0.9, "eyeSquintLeft": 0.45, "eyeSquintRight": 0.45, "noseSneerLeft": 0.5, "noseSneerRight": 0.5, "mouthFrownLeft": 0.45, "mouthFrownRight": 0.45, "mouthPressLeft": 0.3, "mouthPressRight": 0.3},
    "TERIAK":  {"browDownLeft": 1.0, "browDownRight": 1.0, "eyeSquintLeft": 0.4, "eyeSquintRight": 0.4, "noseSneerLeft": 0.7, "noseSneerRight": 0.7, "jawOpen": 0.75, "mouthStretchLeft": 0.5, "mouthStretchRight": 0.5, "mouthUpperUpLeft": 0.5, "mouthUpperUpRight": 0.5},
    "SEDIH":   {"browInnerUp": 0.7, "mouthFrownLeft": 0.6, "mouthFrownRight": 0.6, "mouthShrugLower": 0.4, "eyeLookDownLeft": 0.4, "eyeLookDownRight": 0.4, "eyeSquintLeft": 0.1, "eyeSquintRight": 0.1},
    "BANGGA":  {"mouthSmileLeft": 0.6, "mouthSmileRight": 0.6, "browOuterUpLeft": 0.3, "browOuterUpRight": 0.3, "cheekSquintLeft": 0.3, "cheekSquintRight": 0.3, "eyeSquintLeft": 0.2, "eyeSquintRight": 0.2},
    "KEDIP":   {"eyeBlinkLeft": 1.0, "eyeBlinkRight": 1.0},
    "MENGUNYAH": {"jawOpen": 0.12, "mouthClose": 0.12, "mouthPucker": 0.15},
}
from bl_ext.user_default.mpfb.services.faceservice import FaceService, ARKIT_FACEUNITS
from bl_ext.user_default.mpfb.services.targetservice import TargetService

def setup_face(body):
    """load all ARKit face units as shape keys (value 0); make brows/lashes follow the face (surface deform)"""
    FaceService.load_targets(body, load_microsoft_visemes=False, load_arkit_faceunits=True)
    rig = body.parent
    name = body.name.rsplit(".", 1)[0]
    bpy.context.view_layer.update()
    for o in bpy.data.objects:
        if o.name.startswith(name + ".") and ("eyebrow" in o.name or "eyelash" in o.name):
            for m in list(o.modifiers):
                if m.type == "ARMATURE": o.modifiers.remove(m)
            sd = o.modifiers.new("FollowFace", "SURFACE_DEFORM"); sd.target = body; sd.falloff = 4
            with bpy.context.temp_override(object=o, active_object=o):
                bpy.ops.object.surfacedeform_bind(modifier=sd.name)
            if not sd.is_bound: print("WARN surface deform not bound", o.name)

def _key(body, unit):
    kb = body.data.shape_keys.key_blocks if body.data.shape_keys else None
    if not kb: return None
    return kb.get(unit) or kb.get(TargetService.expression_name_to_shapekey_name(unit))

def face(body, frame, preset="NETRAL", weight=1.0, extra=None, interp="BEZIER"):
    """key the whole face at `frame`: preset (scaled by weight) + extra units; every other unit keyed to 0"""
    want = {u: v * weight for u, v in EXPR[preset].items()}
    for u, v in (extra or {}).items(): want[u] = v
    for u in ARKIT_FACEUNITS:
        k = _key(body, u)
        if not k: continue
        k.value = min(1.0, max(0.0, want.get(u, 0.0)))
        k.keyframe_insert("value", frame=frame)
    _interp(body.data.shape_keys, interp)

def blink(body, frame, length=5):
    """a natural blink centred on frame (eyes keep whatever else they had)"""
    for u in ("eyeBlinkLeft", "eyeBlinkRight"):
        k = _key(body, u)
        if not k: continue
        for f, v in ((frame - length // 2 - 1, 0.0), (frame, 1.0), (frame + length // 2 + 1, 0.0)):
            k.value = v; k.keyframe_insert("value", frame=f)

def _interp(idblock, interp):
    ad = idblock.animation_data if idblock else None
    if ad and ad.action:
        for fc in ad.action.fcurves:
            for kp in fc.keyframe_points:
                if kp.interpolation != "CONSTANT": kp.interpolation = interp

# ------------------------------------------------------------------ bones
def bone_world(rig, bone, tail=False):
    bpy.context.view_layer.update()
    pb = rig.pose.bones[bone]; return rig.matrix_world @ (pb.tail if tail else pb.head)

def aim(rig, bone, direction, blend=1.0):
    """point a bone (head->tail) along a world direction, relative to its parent's current pose"""
    bpy.context.view_layer.update()
    pb = rig.pose.bones[bone]; pb.rotation_mode = "QUATERNION"
    pb.rotation_quaternion = Quaternion(); bpy.context.view_layer.update()
    M = rig.matrix_world @ pb.matrix
    cur = (M.to_3x3() @ Vector((0, 1, 0))).normalized()
    q = cur.rotation_difference(Vector(direction).normalized())
    if blend < 1: q = Quaternion().slerp(q, blend)
    R3 = M.to_3x3().normalized()
    pb.rotation_quaternion = (R3.inverted() @ q.to_matrix() @ R3).to_quaternion()
    bpy.context.view_layer.update()

def turn(rig, bone, axis_world, deg):
    """rotate a bone about a WORLD axis by deg (added to its current pose)"""
    bpy.context.view_layer.update()
    pb = rig.pose.bones[bone]; pb.rotation_mode = "QUATERNION"
    M = rig.matrix_world @ pb.matrix; R3 = M.to_3x3().normalized()
    q = Quaternion(Vector(axis_world).normalized(), math.radians(deg))
    pb.rotation_quaternion = pb.rotation_quaternion @ (R3.inverted() @ q.to_matrix() @ R3).to_quaternion()
    bpy.context.view_layer.update()

def rest_pose(rig):
    for pb in rig.pose.bones:
        pb.rotation_mode = "QUATERNION"; pb.rotation_quaternion = Quaternion(); pb.location = (0, 0, 0); pb.scale = (1, 1, 1)
    bpy.context.view_layer.update()

# ------------------------------------------------------------------ anatomical limits (applied when a pose is keyed)
FINGER_LIM = {1: (-12, 88), 2: (-4, 100), 3: (-4, 72)}          # MCP / PIP / DIP flexion range (deg), fingers 2-5
WRIST_LIM = dict(flex=72, ext=62, dev=28)                          # palmar flexion, extension, side deviation (deg)
ANATOMY = True

def _flex(p, d, lat):
    pp = p - lat * p.dot(lat); dd = d - lat * d.dot(lat)
    if pp.length < 1e-6 or dd.length < 1e-6: return 0.0, 0.0
    ang = math.degrees(pp.angle(dd)); sg = 1 if pp.cross(dd).dot(lat) >= 0 else -1
    side = math.degrees(math.asin(max(-1, min(1, d.dot(lat)))) - math.asin(max(-1, min(1, p.dot(lat)))))
    return sg * ang, side

def _hand_axes(rig, s):
    _, along, across, n = palm_frame(rig, s)
    return along, n, along.cross(n).normalized()

def _bone_dir(rig, b):
    return (bone_world(rig, b, tail=True) - bone_world(rig, b)).normalized()

def limit_fingers(rig, side):
    """keep every finger joint inside its flexion range and in its flexion plane (no sideways kinks)"""
    if f"finger2-1.{side}" not in rig.pose.bones: return
    along, n, lat = _hand_axes(rig, side)
    for fi in (2, 3, 4, 5):
        pdir = along
        for j in (1, 2, 3):
            b = f"finger{fi}-{j}.{side}"
            if b not in rig.pose.bones: break
            d = _bone_dir(rig, b)
            bend, sideways = _flex(pdir, d, lat)
            lo, hi = FINGER_LIM[j]
            if bend > hi: turn(rig, b, lat, -(bend - hi))
            elif bend < lo: turn(rig, b, lat, lo - bend)
            if j > 1 and abs(sideways) > 6:
                d = _bone_dir(rig, b)
                want = (d - lat * (d.dot(lat) - pdir.dot(lat))).normalized()
                ax = d.cross(want)
                if ax.length > 1e-6: turn(rig, b, ax.normalized(), math.degrees(d.angle(want)))
            pdir = _bone_dir(rig, b)

def _wrist_state(rig, s):
    along, n, lat = _hand_axes(rig, s)
    fa = (bone_world(rig, f"lowerarm02.{s}", tail=True) - bone_world(rig, f"lowerarm01.{s}")).normalized()
    fl, dev = _flex(fa, along, lat)
    ex = max(0.0, fl - WRIST_LIM["flex"]) + max(0.0, -WRIST_LIM["ext"] - fl) + max(0.0, abs(dev) - WRIST_LIM["dev"])
    return ex, fl, dev, lat, n

def _set_world(rig, b, Mw):
    pb = rig.pose.bones[b]; pb.matrix = rig.matrix_world.inverted() @ Mw; bpy.context.view_layer.update()

def _spread_twist(rig, s, Mw):
    """move the hand's roll relative to the forearm into the forearm bones (no candy-wrapper wrist)"""
    wb = rig.pose.bones[f"wrist.{s}"]
    q = wb.rotation_quaternion
    tw = 2 * math.atan2(q.y, q.w)
    if tw > math.pi: tw -= 2 * math.pi
    if tw < -math.pi: tw += 2 * math.pi
    if abs(tw) < math.radians(8): return
    for b, k in ((f"lowerarm01.{s}", 0.3), (f"lowerarm02.{s}", 0.5)):
        pb = rig.pose.bones[b]
        pb.rotation_quaternion = pb.rotation_quaternion @ Quaternion((0, 1, 0), tw * k)
        bpy.context.view_layer.update()
    _set_world(rig, f"wrist.{s}", Mw)

def _arm_pen(e, sh, wr, sp_lo, sp_hi, F, U):
    """penalty for an elbow placement: elbow / forearm inside the torso capsule, elbow above the shoulder or far
    behind the back"""
    seg = sp_hi - sp_lo
    def dist(pt):
        t = max(0, min(1, (pt - sp_lo).dot(seg) / seg.length_squared)); return (pt - (sp_lo + seg * t)).length
    pen = max(0.0, 0.17 - dist(e)) * 600
    for k in (0.25, 0.5, 0.7):                                    # along the forearm (not the hand end)
        pen += max(0.0, 0.15 - dist(e + (wr - e) * k)) * 400
    pen += max(0.0, (e - sh).dot(U) + 0.02) * 400 + max(0.0, -(e - sh).dot(F) - 0.12) * 200
    return pen

_TORSO_TRIS = {}
def _torso_bvh(rig):
    """BVH of the character's own torso skin (deformed, current pose) for elbow-swivel clearance tests"""
    body = next((c for c in rig.children if c.type == "MESH" and c.name.endswith(".body")), None)
    if body is None: return None
    if body.name not in _TORSO_TRIS:
        vreg = _vertex_regions(body); tris = []
        for p in body.data.polygons:
            vs = list(p.vertices)
            if all(vreg[i] == "badan" for i in vs):
                for k in range(1, len(vs) - 1): tris.append((vs[0], vs[k], vs[k + 1]))
        _TORSO_TRIS[body.name] = tris
    mods = [(m, m.show_viewport) for m in body.modifiers if m.type in ("SUBSURF", "MASK")]
    for m, _ in mods: m.show_viewport = False
    try:
        bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
        ev = body.evaluated_get(dg); me = ev.to_mesh(); mw = body.matrix_world
        co = [mw @ v.co for v in me.vertices]; ev.to_mesh_clear()
    finally:
        for m, v in mods: m.show_viewport = v
    return BVHTree.FromPolygons(co, _TORSO_TRIS[body.name], all_triangles=True)

def _torso_pen(T, e, sh, wr):
    """how far (m, weighted) the elbow / forearm / upper arm skin would sink into the torso"""
    if T is None: return 0.0
    pen = 0.0
    for pt, rad in ((e, 0.042), (e + (wr - e) * 0.25, 0.04), (e + (wr - e) * 0.5, 0.035), (e + (wr - e) * 0.75, 0.032),
                    (sh + (e - sh) * 0.6, 0.045)):
        loc, nor, _, d = T.find_nearest(pt, 0.3)
        if loc is None: continue
        sd = d if (pt - loc).dot(nor) >= 0 else -d
        pen += max(0.0, rad - sd)
    return pen * 2500

def fix_arm(rig, side, swivel=True):
    """keep the wrist inside anatomical limits without moving the hand: swivel the elbow about the shoulder-wrist
    axis (hand world pose held fixed); if no swivel is good enough, bend the hand back to the limit"""
    s = side
    if f"wrist.{s}" not in rig.pose.bones: return
    bpy.context.view_layer.update()
    wb = rig.pose.bones[f"wrist.{s}"]; wb.rotation_mode = "QUATERNION"
    Mw = (rig.matrix_world @ wb.matrix).copy()
    ex0 = _wrist_state(rig, s)[0]
    if ex0 > 0 and swivel:
        X, F, U = char_axes(rig)
        sh = bone_world(rig, f"upperarm01.{s}"); wr = bone_world(rig, f"wrist.{s}"); el0 = bone_world(rig, f"lowerarm01.{s}")
        axis = (wr - sh).normalized()
        sp_lo = bone_world(rig, "spine03"); sp_hi = bone_world(rig, "neck01")
        keep = {b: rig.pose.bones[b].rotation_quaternion.copy() for b in (f"upperarm01.{s}", f"upperarm02.{s}", f"lowerarm01.{s}", f"lowerarm02.{s}")}
        T = _torso_bvh(rig)
        best = (ex0 + _arm_pen(el0, sh, wr, sp_lo, sp_hi, F, U) + _torso_pen(T, el0, sh, wr), 0)
        for deg in range(-120, 130, 10):
            if deg == 0: continue
            e = sh + Quaternion(axis, math.radians(deg)) @ (el0 - sh)
            for b in (f"upperarm01.{s}", f"upperarm02.{s}"): aim(rig, b, e - sh)
            for b in (f"lowerarm01.{s}", f"lowerarm02.{s}"): aim(rig, b, wr - e)
            _set_world(rig, f"wrist.{s}", Mw)
            ex = _wrist_state(rig, s)[0]
            # elbow must stay outside the torso and not lift above the shoulder
            cost = ex + _arm_pen(e, sh, wr, sp_lo, sp_hi, F, U) + _torso_pen(T, e, sh, wr) + abs(deg) * 0.12
            if cost < best[0]: best = (cost, deg)
        for b, q in keep.items(): rig.pose.bones[b].rotation_quaternion = q
        bpy.context.view_layer.update()
        if best[1]:
            e = sh + Quaternion(axis, math.radians(best[1])) @ (el0 - sh)
            for b in (f"upperarm01.{s}", f"upperarm02.{s}"): aim(rig, b, e - sh)
            for b in (f"lowerarm01.{s}", f"lowerarm02.{s}"): aim(rig, b, wr - e)
        _set_world(rig, f"wrist.{s}", Mw)
    ex = _wrist_state(rig, s)[0]
    if ex > 0:                                                    # still out of range: bend the hand back (least change)
        step = 8.0
        while ex > 0.3 and step >= 0.5:
            _, _, _, lat, n = _wrist_state(rig, s)
            best = None
            for ax in (lat, -lat, n, -n):
                turn(rig, f"wrist.{s}", ax, step); e2 = _wrist_state(rig, s)[0]; turn(rig, f"wrist.{s}", ax, -step)
                if best is None or e2 < best[0]: best = (e2, ax)
            if best[0] < ex - 1e-3: turn(rig, f"wrist.{s}", best[1], step); ex = best[0]
            else: step *= 0.5
        Mw = (rig.matrix_world @ wb.matrix).copy()
    _spread_twist(rig, s, Mw)

def apply_anatomy(rig, bones=None):
    if not ANATOMY: return
    for s in ("L", "R"):
        if f"wrist.{s}" not in rig.pose.bones: continue
        arm = all(b in bones for b in (f"upperarm01.{s}", f"lowerarm01.{s}", f"wrist.{s}")) if bones else True
        if arm: fix_arm(rig, s)
        elif bones and f"wrist.{s}" in bones: fix_arm(rig, s, swivel=False)
        if not bones or any(b.startswith("finger") and b.endswith("." + s) for b in bones): limit_fingers(rig, s)

def _hemisphere(rig, pb, frame):
    """keep a new quaternion key on the same hemisphere as the animation around it (q and -q are the same
    rotation, but interpolating from one to the other's sign spins the bone the long way round)"""
    ad = rig.animation_data
    if not ad or not ad.action: return
    path = f'pose.bones["{pb.name}"].rotation_quaternion'
    fc = [ad.action.fcurves.find(path, index=i) for i in range(4)]
    if any(c is None or not len(c.keyframe_points) for c in fc): return
    # the nearest existing key in time is the neighbour this key will be interpolated against
    ks = sorted({round(k.co.x) for k in fc[0].keyframe_points if round(k.co.x) != frame}, key=lambda x: abs(x - frame))
    if not ks: return
    q0 = Quaternion([c.evaluate(ks[0]) for c in fc])
    if q0.dot(pb.rotation_quaternion) < 0: pb.rotation_quaternion = -pb.rotation_quaternion

def key_pose(rig, frame, bones=None, interp="BEZIER"):
    apply_anatomy(rig, bones)
    for pb in rig.pose.bones:
        if bones and pb.name not in bones: continue
        if pb.rotation_mode == "QUATERNION": _hemisphere(rig, pb, frame)
        pb.keyframe_insert("rotation_quaternion", frame=frame)
        if pb.name == "root": pb.keyframe_insert("location", frame=frame)
    _interp(rig, interp)

def key_obj(o, frame, interp="BEZIER"):
    o.keyframe_insert("location", frame=frame); o.keyframe_insert("rotation_euler", frame=frame)
    _interp(o, interp)

def side_of(rig, side):
    return 1 if (rig.matrix_world @ rig.pose.bones[f"upperarm01.{side}"].head).x > (rig.matrix_world.translation.x) else -1

def char_axes(rig):
    """world vectors of the character: right(+x of its own left), forward (face), up"""
    R = rig.matrix_world.to_3x3().normalized()
    return R @ Vector((1, 0, 0)), R @ Vector((0, -1, 0)), R @ Vector((0, 0, 1))   # MPFB humans face -Y

def relaxed_arms(rig, out=0.26, fwd=0.06, elbow=14, sides=("L", "R")):
    X, F, U = char_axes(rig)
    for s in sides:
        sg = 1 if s == "L" else -1
        d = X * (sg * out) + F * fwd - U
        for b in (f"upperarm01.{s}", f"upperarm02.{s}"): aim(rig, b, d)
        d2 = (X * (sg * out * 0.5) + F * math.tan(math.radians(elbow)) - U)
        for b in (f"lowerarm01.{s}", f"lowerarm02.{s}"): aim(rig, b, d2)

# ------------------------------------------------------------------ arm IK (two-segment analytic, keyable FK result)
ARM = {"upper": ("upperarm01", "upperarm02"), "lower": ("lowerarm01", "lowerarm02")}
def reach(rig, side, target, pole_dir, wrist_fwd=None, wrist_up=None):
    """place the wrist at `target` (world) with the elbow bending toward pole_dir (world). Solved analytically,
    written as FK rotations (so it can be keyed and blended). Optional wrist orientation: hand pointing along
    wrist_fwd (world) with the back of the hand facing wrist_up."""
    s = side
    sh = bone_world(rig, f"upperarm01.{s}")
    # segment lengths from the rest chain
    L1 = sum(rig.pose.bones[b].length for b in (f"upperarm01.{s}", f"upperarm02.{s}"))
    L2 = sum(rig.pose.bones[b].length for b in (f"lowerarm01.{s}", f"lowerarm02.{s}"))
    t = Vector(target); d = t - sh; D = min(d.length, (L1 + L2) * 0.999)
    dn = d.normalized()
    # elbow position: law of cosines
    a = math.acos(max(-1, min(1, (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D))))
    p = Vector(pole_dir); p = (p - dn * p.dot(dn)).normalized()
    elbow = sh + (dn * math.cos(a) + p * math.sin(a)) * L1
    for b in (f"upperarm01.{s}", f"upperarm02.{s}"): aim(rig, b, elbow - sh)
    wr = sh + dn * D
    for b in (f"lowerarm01.{s}", f"lowerarm02.{s}"): aim(rig, b, wr - elbow)
    if wrist_fwd is not None:
        aim(rig, f"wrist.{s}", wrist_fwd)
        if wrist_up is not None: roll_to(rig, f"wrist.{s}", wrist_up)

def roll_to(rig, bone, up_world, axis_local=Vector((0, 0, 1))):
    """roll a bone about its own length so that its local axis (default Z) points as close as possible to up_world"""
    bpy.context.view_layer.update()
    pb = rig.pose.bones[bone]
    M = (rig.matrix_world @ pb.matrix).to_3x3().normalized()
    along = (M @ Vector((0, 1, 0))).normalized(); cur = (M @ axis_local).normalized()
    u = Vector(up_world); u = (u - along * u.dot(along)).normalized()
    ang = cur.angle(u) if cur.length and u.length else 0.0
    sgn = 1 if along.dot(cur.cross(u)) > 0 else -1
    turn(rig, bone, along, math.degrees(ang) * sgn)

# ------------------------------------------------------------------ fingers
FINGERS = {1: "thumb", 2: "index", 3: "middle", 4: "ring", 5: "pinky"}
def curl(rig, side, finger, deg, spread=0.0):
    """curl one finger (1 thumb .. 5 pinky) by deg per joint toward the palm"""
    X, F, U = char_axes(rig)
    for j in (1, 2, 3):
        b = f"finger{finger}-{j}.{side}"
        if b not in rig.pose.bones: continue
        bpy.context.view_layer.update()
        pb = rig.pose.bones[b]; M = (rig.matrix_world @ pb.matrix).to_3x3().normalized()
        # bend axis = bone's local X (MakeHuman finger bones bend about X)
        ax = M @ Vector((1, 0, 0))
        k = deg * (0.8 if j == 1 else 1.0 if j == 2 else 0.8) * (0.7 if finger == 1 else 1.0)
        turn(rig, b, ax, k * (1 if side == "L" else 1))
        if spread and j == 1: turn(rig, b, M @ Vector((0, 0, 1)), spread)

def hand_shape(rig, side, shape="rileks", amount=1.0):
    """preset hand shapes: rileks, kepal (fist), cubit (pinch), pegang (grip a handle), tunjuk (point), buka (open)"""
    table = {"rileks": (12, 18, 22, 26, 30), "kepal": (55, 85, 90, 90, 90), "cubit": (35, 55, 40, 50, 55),
             "pegang": (40, 70, 75, 78, 80), "tunjuk": (45, 0, 85, 88, 90), "buka": (0, 0, 0, 0, 0), "garpu": (20, 16, 45, 60, 68),
             "garpu_makan": (24, 34, 50, 62, 70)}       # eating: the index curls over the handle
    # absolute: the fingers start from their rest pose, so calling it again (e.g. inside a solver loop) never
    # stacks the curl
    for i in range(1, 6):
        for j in (1, 2, 3):
            pb = rig.pose.bones.get(f"finger{i}-{j}.{side}")
            if pb: pb.rotation_mode = "QUATERNION"; pb.rotation_quaternion = Quaternion()
    for i, deg in enumerate(table[shape], start=1): curl(rig, side, i, deg * amount)

def close_on(rig, side, prop_objs, fingers=(1, 2, 3, 4, 5), step=4, max_deg=95, gap=0.002):
    """close fingers joint by joint until each fingertip touches the prop (no penetration): BVH distance test"""
    deps = bpy.context.evaluated_depsgraph_get()
    trees = [BVHTree.FromObject(o, deps) for o in prop_objs]
    def tip(b):
        bpy.context.view_layer.update(); return bone_world(rig, b, tail=True)
    def near(p):
        best = 1e9
        for o, tr in zip(prop_objs, trees):
            lp = o.matrix_world.inverted() @ p
            hit = tr.find_nearest(lp)
            if hit and hit[0] is not None:
                best = min(best, ((o.matrix_world @ hit[0]) - p).length)
        return best
    for fi in fingers:
        total = 0
        while total < max_deg:
            b3 = f"finger{fi}-3.{side}"
            if near(tip(b3)) < 0.015 + gap: break
            if fi > 1 and _finger_at_limit(rig, side, fi): break
            curl(rig, side, fi, step); total += step

def unpress_fingers(rig, side, props, tol=0.0012, step=3.0, max_iter=14):
    """open any finger whose skin sinks into a held prop (handle pressed into the fingertip pad)"""
    body = next((c for c in rig.children if c.type == "MESH" and c.name.endswith(".body")), None)
    if body is None or not props: return
    vg = {i: g.name for i, g in enumerate(body.vertex_groups)}
    fmap = {}
    for v in body.data.vertices:
        best = None
        for g in v.groups:
            n = vg[g.group]
            if n.startswith("finger") and n.endswith("." + side) and (best is None or g.weight > best[0]): best = (g.weight, n)
        if best and best[0] > 0.4: fmap[v.index] = int(best[1][6])
    mods = [(m, m.show_viewport) for m in body.modifiers if m.type in ("SUBSURF", "MASK")]
    for m, _ in mods: m.show_viewport = False
    try:
        for _ in range(max_iter):
            bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
            ev = body.evaluated_get(dg); me = ev.to_mesh(); mw = body.matrix_world
            worst = {}
            for o in props:
                T = BVHTree.FromObject(o, dg); gi = o.matrix_world.inverted()
                for vi, fi in fmap.items():
                    lp = gi @ (mw @ me.vertices[vi].co)
                    loc, nor, _, dist = T.find_nearest(lp)
                    if loc is not None and dist < 0.02 and (lp - loc).dot(nor) < 0:
                        worst[fi] = max(worst.get(fi, 0.0), dist)
            ev.to_mesh_clear()
            bad = [fi for fi, d in worst.items() if d > tol]
            if not bad: break
            _, _, lat = _hand_axes(rig, side)
            for fi in bad:
                if fi == 1: curl(rig, side, 1, -step); continue
                for j in (3, 2):                                  # lift the fingertip first (DIP, then PIP)
                    turn(rig, f"finger{fi}-{j}.{side}", lat, -step)
    finally:
        for m, v in mods: m.show_viewport = v

def _finger_total(rig, side, fi):
    along, n, lat = _hand_axes(rig, side); pdir = along; tot = 0.0
    for j in (1, 2, 3):
        d = _bone_dir(rig, f"finger{fi}-{j}.{side}"); tot += _flex(pdir, d, lat)[0]; pdir = d
    return tot

def cascade_curl(rig, side, slack=8.0):
    """a natural hand: ring and little finger curl at least as much as their neighbour toward the index
    (no lone straight little finger next to a curled middle finger)"""
    if f"finger5-1.{side}" not in rig.pose.bones: return
    for fi in (4, 5):
        for _ in range(30):
            if _finger_total(rig, side, fi) >= _finger_total(rig, side, fi - 1) - slack: break
            if _finger_at_limit(rig, side, fi): break
            curl(rig, side, fi, 4)

def _finger_at_limit(rig, side, fi):
    along, n, lat = _hand_axes(rig, side); pdir = along
    for j in (1, 2):
        d = _bone_dir(rig, f"finger{fi}-{j}.{side}")
        if _flex(pdir, d, lat)[0] >= FINGER_LIM[j][1] - 2: return True
        pdir = d
    return False

# ------------------------------------------------------------------ props in hands
def attach(prop, rig, bone, frame=None):
    """parent prop to a bone keeping its current world transform (Child Of constraint, keyable influence)"""
    bpy.context.view_layer.update()
    mw = prop.matrix_world.copy()
    c = prop.constraints.new("CHILD_OF"); c.target = rig; c.subtarget = bone
    c.set_inverse_pending = False
    pb = rig.pose.bones[bone]
    c.inverse_matrix = (rig.matrix_world @ pb.matrix).inverted()
    prop.matrix_world = mw
    if frame is not None: c.keyframe_insert("influence", frame=frame)
    return c

def palm_frame(rig, side):
    """palm centre and axes (world): along = wrist->knuckles, normal = out of the palm, thumbward"""
    bpy.context.view_layer.update()
    w = bone_world(rig, f"wrist.{side}")
    k2, k5 = bone_world(rig, f"finger2-1.{side}"), bone_world(rig, f"finger5-1.{side}")
    k3 = bone_world(rig, f"finger3-1.{side}")
    along = (k3 - w).normalized()
    across = (k2 - k5).normalized()                   # toward the index side
    normal = along.cross(across).normalized()
    if side == "R": normal = -normal                  # palm side for each hand
    centre = w + (k3 - w) * 0.62 + normal * 0.033
    return centre, along, across, normal

def place_pen(prop, rig, side, grip_local=Vector((0, 0, 0)), axis_local=Vector((0, 0, 1)), roll=0.0, slide=0.0):
    """pen / cutlery grip: the handle lies along the underside of the index finger, pinched by the thumb and the
    middle finger; the working end sticks out past the index fingertip"""
    bpy.context.view_layer.update()
    a = bone_world(rig, f"finger2-1.{side}"); b = bone_world(rig, f"finger2-2.{side}", tail=True)   # tip joint excluded
    c, along, across, normal = palm_frame(rig, side)
    ax_w = (b - a).normalized()
    # the rear of the handle must leave through the thumb web over the knuckle (dorsal + thumb side), never through
    # the palm: tilt the working end toward the palm and the pinky side
    ax_w = (ax_w + normal * 0.35 - across * 0.28).normalized()
    q = Vector(axis_local).normalized().rotation_difference(ax_w)
    q = Quaternion(ax_w, math.radians(roll)) @ q
    prop.rotation_mode = "QUATERNION"; prop.rotation_quaternion = q
    bpy.context.view_layer.update()
    seat = bone_world(rig, f"finger2-2.{side}") + normal * (0.0165 + float(prop.get("r", 0.0035))) + across * 0.009        # under the middle phalanx, thumb side
    gw = prop.matrix_world.to_3x3() @ Vector(grip_local)
    prop.location = seat - gw + ax_w * slide
    bpy.context.view_layer.update()

GRIP = "palm"
def place_in_palm(prop, rig, side, grip_local=Vector((0, 0, 0)), axis_local=Vector((0, 0, 1)), roll=0.0, slide=0.0):
    if prop.get("grip_mode") == "pena": return place_pen(prop, rig, side, grip_local, axis_local, roll, slide)
    return _place_palm(prop, rig, side, grip_local, axis_local, roll, slide)

def _place_palm(prop, rig, side, grip_local=Vector((0, 0, 0)), axis_local=Vector((0, 0, 1)), roll=0.0, slide=0.0):
    """put prop so its grip point (local) sits in the palm, its long axis (local) across the palm (index->pinky
    direction tilted toward the thumb a little), rotated by roll about that axis; slide moves it along the axis"""
    c, along, across, normal = palm_frame(rig, side)
    ax_w = (across * 0.82 + along * 0.57).normalized()          # a held handle crosses the palm diagonally
    q = Vector(axis_local).normalized().rotation_difference(ax_w)
    q = Quaternion(ax_w, math.radians(roll)) @ q
    prop.rotation_mode = "QUATERNION"; prop.rotation_quaternion = q
    bpy.context.view_layer.update()
    gw = prop.matrix_world.to_3x3() @ Vector(grip_local)
    prop.location = c - gw + ax_w * slide
    bpy.context.view_layer.update()

def hold_to(rig, side, prop, point_local, target, pole_dir, hand_dir, palm_dir, grip_local=Vector((0, 0, 0)),
            axis_local=Vector((0, 0, 1)), roll=0.0, iters=6, prop_dir=None):
    """pose the arm so that prop (held in the palm) brings its point_local to the world target.
    hand_dir / palm_dir: desired world directions of the hand (knuckles) and the palm normal."""
    T = Vector(target).copy()
    sh = bone_world(rig, f"upperarm01.{side}")
    for _ in range(iters):
        reach(rig, side, T, pole_dir, wrist_fwd=hand_dir, wrist_up=None)
        _roll_palm(rig, side, palm_dir)
        place_in_palm(prop, rig, side, grip_local, axis_local, roll)
        if prop_dir is not None:      # bend the wrist so the prop points along prop_dir
            for _k in range(3):
                cur = (prop.matrix_world.to_3x3() @ Vector(axis_local)).normalized()
                want = Vector(prop_dir).normalized()
                ax = cur.cross(want)
                if ax.length < 1e-4: break
                turn(rig, f"wrist.{side}", ax.normalized(), math.degrees(cur.angle(want)) * 0.8)
                place_in_palm(prop, rig, side, grip_local, axis_local, roll)
        tip = prop.matrix_world @ Vector(point_local)
        err = Vector(target) - tip
        if err.length < 0.004: break
        T = T + err
    if ANATOMY:
        # anatomical wrist: swivel the elbow (hand held still) or bend the hand back into range; if that moved the
        # prop point, carry the whole hand (same world orientation) back to the target with the arm and repeat
        wb = rig.pose.bones[f"wrist.{side}"]
        for _ in range(10):
            fix_arm(rig, side); place_in_palm(prop, rig, side, grip_local, axis_local, roll)
            err = Vector(target) - prop.matrix_world @ Vector(point_local)
            if err.length < 0.004: break
            Mw = (rig.matrix_world @ wb.matrix).copy()
            reach(rig, side, bone_world(rig, f"wrist.{side}") + err, pole_dir)
            bpy.context.view_layer.update()
            Mw.translation = bone_world(rig, f"wrist.{side}"); _set_world(rig, f"wrist.{side}", Mw)
            place_in_palm(prop, rig, side, grip_local, axis_local, roll)
    return (Vector(target) - prop.matrix_world @ Vector(point_local)).length

def _roll_palm(rig, side, palm_dir):
    """roll the wrist about the forearm-hand axis until the palm normal faces palm_dir"""
    best = None
    pb = rig.pose.bones[f"wrist.{side}"]
    base = pb.rotation_quaternion.copy()
    _, along, _, _ = palm_frame(rig, side)
    for deg in range(-180, 180, 10):
        pb.rotation_quaternion = base; turn(rig, f"wrist.{side}", along, deg)
        n = palm_frame(rig, side)[3]
        d = n.dot(Vector(palm_dir).normalized())
        if best is None or d > best[0]: best = (d, deg)
    pb.rotation_quaternion = base; turn(rig, f"wrist.{side}", along, best[1])

# ------------------------------------------------------------------ penetration check
REGIONS = {
    "tangan.L": ("wrist.L", "finger", "metacarpal"), "tangan.R": ("wrist.R", "finger", "metacarpal"),
    "lengan_bawah.L": ("lowerarm01.L", "lowerarm02.L"), "lengan_bawah.R": ("lowerarm01.R", "lowerarm02.R"),
    "lengan_atas.L": ("upperarm01.L", "upperarm02.L"), "lengan_atas.R": ("upperarm01.R", "upperarm02.R"),
    "badan": ("spine", "pelvis", "breast", "clavicle", "shoulder"), "kepala": ("neck", "head", "jaw", "oris", "levator",
             "orbicularis", "oculi", "temporalis", "risorius", "special", "tongue", "eye"),
    "kaki.L": ("upperleg01.L", "upperleg02.L", "lowerleg01.L", "lowerleg02.L", "foot.L", "toe"), "kaki.R": ("upperleg01.R", "upperleg02.R", "lowerleg01.R", "lowerleg02.R", "foot.R"),
}
def _region_of(gname, side_hint=None):
    for r, keys in REGIONS.items():
        for k in keys:
            if gname == k or gname.startswith(k):
                if r.endswith((".L", ".R")) and not gname.endswith(r[-2:]) and k in ("finger", "metacarpal", "toe"): continue
                return r
    return None

def _vertex_regions(o):
    """dominant deform group per vertex -> region name (computed on the base mesh, index-stable)"""
    names = {g.index: g.name for g in o.vertex_groups}
    body_gi = o.vertex_groups["body"].index if "body" in o.vertex_groups else None
    out = []
    for v in o.data.vertices:
        best, bw = None, 0.0
        if body_gi is not None and not any(g.group == body_gi and g.weight > 0.5 for g in v.groups):
            out.append(None); continue
        for g in v.groups:
            r = _region_of(names[g.group])
            if r and g.weight > bw: best, bw = r, g.weight
        out.append(best)
    return out

def _region_bvh(o, deps, regions_wanted, vreg, exclude_near=None):
    """BVH per region from the evaluated (deformed) mesh. Modifiers that change topology must be off."""
    ev = o.evaluated_get(deps); me = ev.to_mesh()
    mw = o.matrix_world
    co = [mw @ v.co for v in me.vertices]
    out = {}
    if len(me.vertices) != len(vreg):
        ev.to_mesh_clear(); raise RuntimeError(f"{o.name}: evaluated vertex count changed (disable subdivision for checks)")
    for r in regions_wanted:
        tris = []
        for p in me.polygons:
            vs = list(p.vertices)
            if all(vreg[i] == r for i in vs):
                if exclude_near and any(min((co[i] - q).length for q in exclude_near) < 0.07 for i in vs): continue
                for k in range(1, len(vs) - 1): tris.append((vs[0], vs[k], vs[k + 1]))
        if tris: out[r] = BVHTree.FromPolygons(co, tris, all_triangles=True)
    ev.to_mesh_clear()
    return out

PAIRS = [("tangan.L", "badan"), ("tangan.R", "badan"), ("tangan.L", "kepala"), ("tangan.R", "kepala"),
         ("tangan.L", "tangan.R"), ("lengan_bawah.L", "badan"), ("lengan_bawah.R", "badan"),
         ("tangan.L", "kaki.L"), ("tangan.L", "kaki.R"), ("tangan.R", "kaki.L"), ("tangan.R", "kaki.R"),
         ("lengan_bawah.L", "kaki.L"), ("lengan_bawah.R", "kaki.R"), ("kaki.L", "kaki.R"),
         ("lengan_atas.L", "kepala"), ("lengan_atas.R", "kepala")]

def check(chars, props=(), env=(), frames=(), report=None):
    """penetration report over frames.
    chars: list of (body, rig) ; props: objects held/handled ; env: set objects people must not pass through.
    Checks inside each body (hands vs torso/head/legs...), body vs its own torso clothes, bodies vs props, bodies vs
    env, and body vs other bodies. Returns list of (frame, a, b, n_overlapping_triangle_pairs)."""
    sc = bpy.context.scene; res = []
    sub_off = []
    for body, rig in chars:
        for o in [body] + [c for c in rig.children if c.type == "MESH"]:
            for m in o.modifiers:
                if m.type in ("SUBSURF", "MASK") and m.show_viewport:
                    sub_off.append((m, m.show_viewport)); m.show_viewport = False
    cache = {}
    for body, rig in chars:
        cache[body.name] = _vertex_regions(body)
    for f in frames:
        sc.frame_set(f); deps = bpy.context.evaluated_depsgraph_get()
        bv = {}
        live = [(b_, r_) for b_, r_ in chars if not b_.hide_viewport and not b_.hide_get()]
        for body, rig in live:
            shoulders = [bone_world(rig, f"upperarm01.{s}") for s in "LR"] + [bone_world(rig, "neck01")]
            elbows = [bone_world(rig, f"lowerarm01.{s}") for s in "LR"]
            hips = [bone_world(rig, f"upperleg01.{s}") for s in "LR"]
            R = _region_bvh(body, deps, set(a for p in PAIRS for a in p), cache[body.name])
            # joints: regions that meet at a joint are allowed to touch there -> rebuild with exclusion near joints
            Rx = _region_bvh(body, deps, set(a for p in PAIRS for a in p), cache[body.name], exclude_near=shoulders + elbows + hips)
            bv[body.name] = (R, Rx)
            for a, b in PAIRS:
                A, B = Rx.get(a), Rx.get(b)
                if A and B:
                    n = len(A.overlap(B))
                    if n: res.append((f, f"{body.name}:{a}", f"{body.name}:{b}", n))
            # hands/forearms vs this character's own clothes (torso + skirt parts only)
            for c in [c for c in rig.children if c.type == "MESH" and c != body and not any(k in c.name for k in ("eyebrow", "eyelash", "high-poly", "teeth", "tongue"))]:
                tr = _clothes_bvh(c, deps, rig, exclude_near=shoulders + elbows)
                if not tr: continue
                for a in ("tangan.L", "tangan.R", "lengan_bawah.L", "lengan_bawah.R"):
                    A = R.get(a)
                    if A:
                        n = len(A.overlap(tr))
                        if n > 2: res.append((f, f"{body.name}:{a}", c.name, n))
        for o in props:
            T = _world_bvh(o, deps)
            for body, rig in live:
                for a in ("tangan.L", "tangan.R", "kepala"):
                    A = bv[body.name][0].get(a)
                    if A and T and len(A.overlap(T)):
                        dmm = round(_depth(o, deps, A) * 1000, 1)       # how deep the prop sinks into the skin
                        if dmm > 1.5: res.append((f, f"{body.name}:{a}", o.name + " (mm)", dmm))
        for o in env:
            T = _world_bvh(o, deps)
            if not T: continue
            soft = any(k in o.name for k in ("Kasur", "Bantal", "Tikar", "Karpet", "Taplak", "Selimut"))
            for body, rig in live:
                dmm = round(_body_depth(body, deps, T, cache[body.name]) * 1000, 1)
                if dmm > (15.0 if soft else 3.0): res.append((f, body.name, o.name + " (mm)", dmm))
        names = [c[0] for c in live]
        for i in range(len(names)):
            for j in range(i + 1, len(names)):
                A = _world_bvh(names[i], deps); B = _world_bvh(names[j], deps)
                n = len(A.overlap(B))
                if n: res.append((f, names[i].name, names[j].name, n))
    for m, v in sub_off: m.show_viewport = v
    if report:
        with open(report, "w") as fh:
            for r in res: fh.write("\t".join(map(str, r)) + "\n")
    return res

def _body_depth(body, deps, bvh, vreg=None, reach=0.06):
    """max depth (m) of the body's skin vertices (helpers excluded) below the surface of bvh (an environment object)"""
    ev = body.evaluated_get(deps); me = ev.to_mesh(); mw = body.matrix_world; worst = 0.0
    for i, v in enumerate(me.vertices):
        if vreg is not None and (i >= len(vreg) or not vreg[i]): continue
        p = mw @ v.co
        hit = bvh.find_nearest(p, reach)
        if hit and hit[0] is not None:
            d = (p - hit[0]).dot(hit[1])
            if d < 0: worst = max(worst, -d)
    ev.to_mesh_clear(); return worst

def _depth(o, deps, bvh):
    """max depth (m) of o's vertices below the surface of bvh (uses the nearest-face normal)"""
    ev = o.evaluated_get(deps); me = ev.to_mesh(); mw = o.matrix_world; worst = 0.0
    for v in me.vertices:
        p = mw @ v.co
        hit = bvh.find_nearest(p, 0.03)
        if hit and hit[0] is not None:
            d = (p - hit[0]).dot(hit[1])
            if d < 0: worst = max(worst, -d)
    ev.to_mesh_clear(); return worst

def _world_bvh(o, deps):
    ev = o.evaluated_get(deps)
    try: me = ev.to_mesh()
    except Exception: return None
    if me is None or not len(me.polygons): ev.to_mesh_clear(); return None
    mw = o.matrix_world
    co = [mw @ v.co for v in me.vertices]; polys = [list(p.vertices) for p in me.polygons]
    ev.to_mesh_clear()
    return BVHTree.FromPolygons(co, polys)

def _clothes_bvh(c, deps, rig, exclude_near=()):
    """clothes triangles dominated by torso/leg bones (sleeves excluded), away from shoulder/elbow joints"""
    names = {g.index: g.name for g in c.vertex_groups}
    keep = []
    for v in c.data.vertices:
        best, bw = None, 0.0
        for g in v.groups:
            r = _region_of(names.get(g.group, ""))
            if r and g.weight > bw: best, bw = r, g.weight
        keep.append(best in ("badan", "kaki.L", "kaki.R"))
    ev = c.evaluated_get(deps); me = ev.to_mesh()
    if len(me.vertices) != len(keep): ev.to_mesh_clear(); return None
    mw = c.matrix_world; co = [mw @ v.co for v in me.vertices]
    tris = []
    for p in me.polygons:
        vs = list(p.vertices)
        if all(keep[i] for i in vs) and not any(min((co[i] - q).length for q in exclude_near) < 0.08 for i in vs if exclude_near):
            for k in range(1, len(vs) - 1): tris.append((vs[0], vs[k], vs[k + 1]))
    ev.to_mesh_clear()
    return BVHTree.FromPolygons(co, tris, all_triangles=True) if tris else None

def summarize(res):
    """compact text: per pair, frame ranges with max overlap"""
    from collections import defaultdict
    d = defaultdict(list)
    for f, a, b, n in res: d[(a, b)].append((f, n))
    lines = []
    for (a, b), l in sorted(d.items()):
        fs = [x[0] for x in l]; lines.append(f"{a} x {b}: frames {min(fs)}-{max(fs)} ({len(fs)} f), max {max(x[1] for x in l)}")
    return "\n".join(lines) if lines else "BERSIH: tidak ada tabrakan"

# ------------------------------------------------------------------ sitting
def _lowest(body, vfilter):
    """lowest world z of evaluated body vertices whose dominant region passes vfilter(region)"""
    deps = bpy.context.evaluated_depsgraph_get()
    mods = [(m, m.show_viewport) for m in body.modifiers if m.type in ("SUBSURF", "MASK")]
    for m, _ in mods: m.show_viewport = False
    deps.update(); ev = body.evaluated_get(deps); me = ev.to_mesh()
    vreg = body.get("_vreg")
    if vreg is None:
        vreg = _vertex_regions(body); body["_vreg"] = [r or "" for r in vreg]
    mw = body.matrix_world
    zs = [(mw @ v.co).z for v, r in zip(me.vertices, vreg) if vfilter(r)]
    ev.to_mesh_clear()
    for m, v in mods: m.show_viewport = v
    return min(zs) if zs else None

def sit(rig, body, seat_z, floor_z=0.0, spread=0.06, knee_fwd=0.0, lean=4.0):
    """seated pose on a seat at height seat_z: thighs forward (horizontal), shins down so the feet land on the
    floor, buttocks resting on the seat (rig lowered until the lowest thigh/pelvis point is seat_z + 3 mm).
    lean: torso forward lean in degrees."""
    X, F, U = char_axes(rig)
    for s in ("L", "R"):
        sg = 1 if s == "L" else -1
        d = F + X * (sg * spread) - U * 0.02
        for b in (f"upperleg01.{s}", f"upperleg02.{s}"): aim(rig, b, d)
    # drop the rig so the buttocks touch the seat
    for _ in range(3):
        low = _lowest(body, lambda r: r in ("badan", "kaki.L", "kaki.R"))
        rig.location.z += (seat_z + 0.003) - low; bpy.context.view_layer.update()
    # shins: pick the angle (from vertical) that puts the heel on the floor
    for s in ("L", "R"):
        knee = bone_world(rig, f"lowerleg01.{s}")
        Lsh = sum(rig.pose.bones[b].length for b in (f"lowerleg01.{s}", f"lowerleg02.{s}"))
        foot_h = 0.075 * (rig.matrix_world.to_scale().z)
        h = knee.z - floor_z - foot_h
        ang = math.acos(max(-1.0, min(1.0, h / Lsh))) if Lsh > 0 else 0.0
        d = -U * math.cos(ang) + F * (math.sin(ang) + knee_fwd)
        for b in (f"lowerleg01.{s}", f"lowerleg02.{s}"): aim(rig, b, d)
        aim(rig, f"foot.{s}", F * 1.0 - U * 0.25)
    if lean:
        turn(rig, "spine03", X, lean * 0.5); turn(rig, "spine02", X, lean * 0.5)
    bpy.context.view_layer.update()

def joint_world(body, group="joint-mouth"):
    """world centroid of a MakeHuman joint helper group (evaluated: follows pose and shape keys)"""
    gi = body.vertex_groups[group].index
    idx = [v.index for v in body.data.vertices if any(g.group == gi and g.weight > 0.5 for g in v.groups)]
    mods = [(m, m.show_viewport) for m in body.modifiers if m.type in ("SUBSURF", "MASK")]
    for m, _ in mods: m.show_viewport = False
    deps = bpy.context.evaluated_depsgraph_get(); deps.update()
    ev = body.evaluated_get(deps); me = ev.to_mesh(); mw = body.matrix_world
    c = sum((mw @ me.vertices[i].co for i in idx), Vector()) / max(1, len(idx))
    ev.to_mesh_clear()
    for m, v in mods: m.show_viewport = v
    return c

def lips_front(body, rig, out=0.012):
    """a point `out` metres in front of the lip surface (world). The lip surface = the evaluated skin vertex near the
    mouth joint that sticks out furthest along the face's forward direction (mouth joint -> nose tip)."""
    m = joint_world(body, "joint-mouth")
    mods = [(mm, mm.show_viewport) for mm in body.modifiers if mm.type in ("SUBSURF", "MASK")]
    for mm, _ in mods: mm.show_viewport = False
    deps = bpy.context.evaluated_depsgraph_get(); deps.update()
    ev = body.evaluated_get(deps); me = ev.to_mesh(); mw = body.matrix_world
    vreg = body.get("_vreg") or [r or "" for r in _vertex_regions(body)]
    near = [mw @ v.co for v, r in zip(me.vertices, vreg) if r and (mw @ v.co - m).length < 0.06]
    ev.to_mesh_clear()
    for mm, v in mods: mm.show_viewport = v
    X, F, U = char_axes(rig)
    head_q = (rig.matrix_world @ rig.pose.bones["head"].matrix).to_quaternion()
    fwd = (head_q @ Vector((0, 0, 1)))                      # MPFB head bone: local Z points out of the face
    if fwd.dot(F) < 0: fwd = -fwd
    fwd = (fwd + F * 0.5).normalized()
    near = [p for p in near if -0.018 < (p - m).dot(U) < 0.012 and abs((p - m).dot(X)) < 0.02]
    best = max(near, key=lambda p: (p - m).dot(fwd)) if near else m + F * 0.05
    return best + fwd * out

def wear(hat, rig, body, height=0.105, fwd=0.0, tilt=0.0):
    """put a hat on: centred over the skull (head bone), band at `height` above the head joint, level with the head,
    then attached to the head bone (follows every turn)"""
    bpy.context.view_layer.update()
    M = rig.matrix_world @ rig.pose.bones["head"].matrix
    up = (M.to_3x3() @ Vector((0, 1, 0))).normalized()          # head bone axis (neck -> crown)
    X, F, U = char_axes(rig)
    base = M.translation + up * height + F * fwd
    if "band_W" in hat.keys():   # seat the band on the skull: lowest height where no scalp vertex sticks out of the band
        side = up.cross(F).normalized(); fw = side.cross(up).normalized()
        dg = bpy.context.evaluated_depsgraph_get(); o0 = M.translation + F * fwd
        pts = []
        heads = [body] + [o for o in bpy.data.objects if o.type == "MESH" and o.parent == rig and o != body and o.visible_get()
                          and any(k in o.name.lower() for k in ("hair", "short", "bob", "ponytail", "braid", "afro"))]
        for ob in heads:
            ev = ob.evaluated_get(dg); me = ev.to_mesh(); mw = ob.matrix_world
            for v in me.vertices:
                d = mw @ v.co - o0; h = d.dot(up)
                if 0.02 < h < 0.3 and d.length < 0.3: pts.append((d.dot(side), d.dot(fw), h))
            ev.to_mesh_clear()
        print("WEAR meshes", [o.name for o in heads])
        W, D, px, py = hat["band_W"], hat["band_D"], hat["band_px"], hat["band_py"]
        def norm(x, y, k):   # superellipse matching the band plan scaled by k: <= 1 inside
            return abs(x / (W * k)) ** (2 / px) + abs(y / (D * k)) ** (2 / py)
        top = max(z for x, y, z in pts)
        best = top - 0.075                      # band sits ~7.5 cm below the crown (forehead / above the ears)
        slab = [(x, y) for x, y, z in pts if best <= z <= best + 0.03]
        cx = (min(x for x, y in slab) + max(x for x, y in slab)) / 2; cy = (min(y for x, y in slab) + max(y for x, y in slab)) / 2
        slab = [(x - cx, y - cy) for x, y in slab]
        k = 0.5
        while any(norm(x, y, k) > 1.0 for x, y in slab) and k < 2.0: k += 0.005
        k *= 1.0 + 0.004 / W                   # a little room under the band
        hat.scale = (k, k, k ** 0.5)
        base = M.translation + up * best + F * fwd + side * cx + fw * cy
        print("WEAR seat", round(best, 3), "top", round(top, 3), "scale", round(k, 3))
    hat.rotation_mode = "QUATERNION"
    q = Vector((0, 0, 1)).rotation_difference(up)
    if "band_W" in hat.keys():   # hat Y (front/back plates) along the face direction, X across the head
        from mathutils import Matrix
        q = Matrix((-side, fw, up)).transposed().to_quaternion()
    hat.rotation_quaternion = Quaternion(up, math.radians(tilt)) @ q
    hat.location = base
    bpy.context.view_layer.update()
    for c in list(hat.constraints): hat.constraints.remove(c)
    attach(hat, rig, "head")

def bersila(rig, body, floor_z, spread=0.85, lean=10.0):
    """cross-legged on the floor: thighs out to the sides, shins crossed in front (left shin in front of the
    right, a few cm apart), buttocks on the floor"""
    X, F, U = char_axes(rig)
    for s, sg in (("L", 1), ("R", -1)):
        d = F * 0.55 + X * sg * spread - U * 0.05
        for b in (f"upperleg01.{s}", f"upperleg02.{s}"): aim(rig, b, d)
    for s, sg, fwd, lift in (("L", 1, 0.42, 0.05), ("R", -1, 0.2, 0.0)):
        d = -X * sg * 0.9 + F * fwd - U * (0.12 - lift)
        for b in (f"lowerleg01.{s}", f"lowerleg02.{s}"): aim(rig, b, d)
        aim(rig, f"foot.{s}", -X * sg * 0.5 - U * 0.6 + F * 0.2)
    for _ in range(3):
        low = _lowest(body, lambda r: r in ("badan", "kaki.L", "kaki.R"))
        rig.location.z += (floor_z + 0.004) - low; bpy.context.view_layer.update()
    if lean:
        turn(rig, "spine03", X, lean * 0.5); turn(rig, "spine02", X, lean * 0.5)
    bpy.context.view_layer.update()

def berlutut(rig, body, floor_z, lean=40.0, spread=0.1):
    """kneeling, sitting back on the heels: thighs forward-down, shins flat on the ground behind, knees on the floor"""
    X, F, U = char_axes(rig)
    for s, sg in (("L", 1), ("R", -1)):
        d = F * 0.75 - U * 0.65 + X * sg * spread
        for b in (f"upperleg01.{s}", f"upperleg02.{s}"): aim(rig, b, d)
        d2 = -F * 0.97 - U * 0.08 + X * sg * 0.04
        for b in (f"lowerleg01.{s}", f"lowerleg02.{s}"): aim(rig, b, d2)
        aim(rig, f"foot.{s}", -F * 0.6 - U * 0.75)
    for _ in range(3):
        low = _lowest(body, lambda r: r in ("kaki.L", "kaki.R"))
        rig.location.z += (floor_z + 0.004) - low; bpy.context.view_layer.update()
    if lean:
        turn(rig, "spine03", X, lean * 0.4); turn(rig, "spine02", X, lean * 0.35); turn(rig, "spine01", X, lean * 0.25)
    bpy.context.view_layer.update()
