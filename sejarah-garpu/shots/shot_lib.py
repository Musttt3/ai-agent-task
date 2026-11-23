# Shot building helpers. A shot script (shots/sNN.py) does:
#   from shot_lib import *
#   sc = open_set("venesia", "13")          # loads sets/venesia.blend, sets the frame range from SHOTS
#   b, r = actor("putri", mark="putri")     # builds the character (cast.py design) and stands it on a mark
#   ... keyframe poses / faces / props with pose_lib (P) ...
#   cam = camera("13", lens=50, keys=[(f, loc, look), ...], focus=obj_or_point, fstop=2.0)
#   finish("13", chars=[(b, r)], props=[...], env=[...])   # penetration check + save shots/blend/13.blend
import bpy, os, sys, math, json
from mathutils import Vector, Euler, Quaternion
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
for d in ("sets", "props", "characters"): sys.path.insert(0, os.path.join(ROOT, d))
import pose_lib as P
from mh_lib import build_char
from cast import CAST
import props as PR
from lib import lamp, mat_ph, mat_simple

# id: (first frame, last frame, set)  — shotlist.md
SHOTS = {
    "01": (0, 51, "venesia"), "02": (52, 109, "venesia"), "03": (110, 141, "ruang_makan"), "04": (142, 223, "gua"),
    "05": (224, 245, "gua"), "06": (246, 310, "gua"), "07": (311, 381, "dapur"), "08": (382, 444, "dapur"),
    "09": (445, 531, "dapur"), "10": (532, 616, "romawi"), "11": (617, 688, "romawi"), "12": (689, 769, "venesia"),
    "13": (770, 819, "venesia"), "14": (820, 884, "venesia"), "15": (885, 910, "venesia"), "16": (911, 986, "london"),
    "17": (987, 1036, "london"), "18": (1037, 1060, "london"), "19": (1061, 1112, "london"), "20": (1113, 1157, "london"),
    "21": (1158, 1209, "nusantara"), "22": (1210, 1258, "nusantara"), "23": (1259, 1312, "nusantara"),
    "24": (1313, 1365, "nusantara"), "25": (1366, 1429, "ruang_makan"), "26": (1430, 1514, "ruang_makan"),
}
WORDS = json.load(open(os.path.join(ROOT, "captions", "voice.json")))["segments"][0]["words"]
def word_frame(text, after=0):
    """first frame of the first word starting with `text` at or after frame `after`"""
    for w in WORDS:
        f = round(w["start"] * 30)
        if f >= after and w["word"].lower().strip(",.?!").startswith(text.lower()): return f
    raise KeyError(text)

def open_set(name, sid):
    bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, "sets", name + ".blend"))
    sc = bpy.context.scene
    f0, f1, _ = SHOTS[sid]
    sc.frame_start, sc.frame_end = f0, f1; sc.frame_set(f0)
    sc.render.filepath = os.path.join(ROOT, "out", "frames", "#####")
    sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGB"
    sc["shot"] = sid
    fix_materials()
    return sc

def fix_materials():
    """late look tweaks applied to every shot (no set rebuild needed): richer gold, darker polished silver"""
    for name, col, rmin, rmax in (("Emas", (1.0, 0.66, 0.22), 0.1, 0.22), ("Perak", (0.62, 0.6, 0.57), 0.12, 0.28)):
        m = bpy.data.materials.get(name)
        if not m: continue
        b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
        b.inputs["Base Color"].default_value = (*col, 1)
        for n in m.node_tree.nodes:
            if n.type == "MAP_RANGE" and n.outputs[0].links and n.outputs[0].links[0].to_socket.name == "Roughness":
                n.inputs["To Min"].default_value = rmin; n.inputs["To Max"].default_value = rmax

def mark(name):
    return bpy.data.objects["MARK_" + name]

def actor(name, mark=None, loc=None, yaw=None, subdiv=1, face=True):
    """build a cast member and place its rig at a mark (or loc/yaw in degrees, 0 = facing -Y)"""
    body, rig = build_char(dict(name=name, **CAST[name]), subdiv=subdiv)
    if face: P.setup_face(body)
    if mark:
        m = bpy.data.objects["MARK_" + mark]; rig.location = m.location.copy(); rig.rotation_euler = (0, 0, m.rotation_euler.z)
    if loc is not None: rig.location = loc
    if yaw is not None: rig.rotation_euler = (0, 0, math.radians(yaw))
    for o in [body] + list(rig.children):
        if o.type == "MESH":
            for c in o.users_collection: c.objects.unlink(o)
    cc = bpy.data.collections.get("CAST") or bpy.data.collections.new("CAST")
    if cc.name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(cc)
    for o in [rig, body] + list(rig.children):
        if o.name not in cc.objects:
            for c in list(o.users_collection): c.objects.unlink(o)
            cc.objects.link(o)
    P.rest_pose(rig)
    return body, rig

def camera(sid, lens, keys, focus=None, fstop=2.8, sensor=36.0, interp="BEZIER", shake=0.0):
    """keys: [(frame, location, look_at)], focus: object or world point (DOF)"""
    sc = bpy.context.scene
    cd = bpy.data.cameras.new("CAM_" + sid); cd.lens = lens; cd.sensor_width = sensor; cd.sensor_fit = "AUTO"
    cd.clip_start = 0.01; cd.clip_end = 2000
    cam = bpy.data.objects.new("CAM_" + sid, cd); sc.collection.objects.link(cam)
    tgt = bpy.data.objects.new("CAM_" + sid + "_TARGET", None); sc.collection.objects.link(tgt)
    con = cam.constraints.new("TRACK_TO"); con.target = tgt; con.track_axis = "TRACK_NEGATIVE_Z"; con.up_axis = "UP_Y"
    for f, loc, look in keys:
        cam.location = loc; tgt.location = look
        cam.keyframe_insert("location", frame=f); tgt.keyframe_insert("location", frame=f)
    for ob in (cam, tgt):
        for fc in ob.animation_data.action.fcurves:
            for kp in fc.keyframe_points: kp.interpolation = interp; kp.easing = "EASE_IN_OUT"
    if focus is not None:
        cd.dof.use_dof = True; cd.dof.aperture_fstop = fstop
        if isinstance(focus, bpy.types.Object): cd.dof.focus_object = focus
        else:
            fo = bpy.data.objects.new("FOCUS_" + sid, None); sc.collection.objects.link(fo); fo.location = focus; cd.dof.focus_object = fo
    sc.camera = cam
    return cam

def lens_push(cam, f0, f1, l0, l1):
    cam.data.lens = l0; cam.data.keyframe_insert("lens", frame=f0); cam.data.lens = l1; cam.data.keyframe_insert("lens", frame=f1)

def hide_between(o, f_show, f_hide=None):
    """visible from f_show (inclusive) until f_hide (exclusive); keyed render + viewport visibility"""
    for oo in [o] + list(o.children_recursive):
        for f, vis in ((f_show - 1, False), (f_show, True)) + (((f_hide - 1, True), (f_hide, False)) if f_hide else ()):
            oo.hide_render = not vis; oo.hide_viewport = not vis
            oo.keyframe_insert("hide_render", frame=f); oo.keyframe_insert("hide_viewport", frame=f)

def hold(prop, rig, side, frames_keys, point_local=None, pole=None, hand_dir=None, palm_dir=None, grip_local=(0, 0, 0), axis_local=(0, 0, 1), roll=0.0,
         fingers=(1, 2, 3, 4, 5), prop_dirs=None, hand_dirs=None, palm_dirs=None, pre_shape=None):
    """animate an arm holding `prop`: frames_keys = [(frame, world target for point_local)].
    At each key: solve the arm so the prop point hits the target, curl fingers onto the prop, key the arm + prop."""
    X, F, U = P.char_axes(rig)
    s = side
    arm_bones = [f"upperarm01.{s}", f"upperarm02.{s}", f"lowerarm01.{s}", f"lowerarm02.{s}", f"wrist.{s}"] + \
                [f"finger{i}-{j}.{s}" for i in range(1, 6) for j in (1, 2, 3)]
    pt = Vector(point_local) if point_local is not None else Vector(prop["tip"])
    errs = []
    for f, target in frames_keys:
        bpy.context.scene.frame_set(f)
        for b in arm_bones:
            pb = rig.pose.bones.get(b)
            if pb: pb.rotation_mode = "QUATERNION"; pb.rotation_quaternion = Quaternion()
        hd = (hand_dirs or {}).get(f, hand_dir); pdir = (palm_dirs or {}).get(f, palm_dir)
        if pre_shape: P.hand_shape(rig, s, pre_shape[0], pre_shape[1])
        e = P.hold_to(rig, s, prop, pt, target, pole if pole is not None else (-U * 0.8 + (X if s == "L" else -X) * 0.6),
                      hd if hd is not None else F, pdir if pdir is not None else (U * 0.3 + (-X if s == "L" else X)),
                      grip_local=Vector(grip_local), axis_local=Vector(axis_local), roll=roll,
                      prop_dir=(prop_dirs or {}).get(f))
        P.close_on(rig, s, [prop], fingers=fingers)
        P.key_pose(rig, f, bones=arm_bones)
        errs.append(round(e, 4))
    # the prop rides on the wrist: same palm-relative placement at every key -> one Child Of constraint
    f_first = frames_keys[0][0]
    bpy.context.scene.frame_set(f_first)
    if prop.animation_data: prop.animation_data_clear()
    P.place_in_palm(prop, rig, s, Vector(grip_local), Vector(axis_local), roll)
    for c in list(prop.constraints): prop.constraints.remove(c)
    P.attach(prop, rig, f"wrist.{s}")
    return errs

def finish(sid, chars=(), props=(), env=(), every=3, check=True):
    sc = bpy.context.scene
    f0, f1, _ = SHOTS[sid]
    rep = ""
    env = [m for o in env for m in ([o] if o.type == "MESH" else [c for c in o.children_recursive if c.type == "MESH"])]
    if check and chars:
        res = P.check(list(chars), props=list(props), env=list(env), frames=list(range(f0, f1 + 1, every)) + [f1],
                      report=os.path.join(ROOT, "shots", "blend", f"{sid}_tabrakan.tsv"))
        rep = P.summarize(res)
        print(f"CHECK {sid}:\n{rep}")
    sc.frame_set(f0)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "shots", "blend", f"{sid}.blend"))
    print("SAVED shot", sid)
    return rep

def stills(sid, frames=None, res=(540, 960), samples=16, tag="qa"):
    """QA stills of a shot (low res) -> review/shot_<sid>_<tag>_<frame>.png"""
    sc = bpy.context.scene
    f0, f1, _ = SHOTS[sid]
    frames = frames or [f0, (f0 + f1) // 2, f1]
    old = (sc.render.resolution_x, sc.render.resolution_y, sc.cycles.samples, sc.render.filepath)
    sc.render.resolution_x, sc.render.resolution_y = res; sc.cycles.samples = samples
    outs = []
    for f in frames:
        sc.frame_set(f); p = os.path.join(ROOT, "review", "shots", f"shot_{sid}_{tag}_{f:05d}.png"); os.makedirs(os.path.dirname(p), exist_ok=True)
        sc.render.filepath = p; bpy.ops.render.render(write_still=True); outs.append(p)
    sc.render.resolution_x, sc.render.resolution_y, sc.cycles.samples, sc.render.filepath = old
    return outs

def seat_z(x, y, ignore=("CAST",), z0=1.6):
    """height of the first surface below (x, y) — a chair seat, a bench, a floor — ignoring the cast"""
    sc = bpy.context.scene; deps = bpy.context.evaluated_depsgraph_get()
    o = Vector((x, y, z0))
    for _ in range(6):
        hit, loc, nrm, idx, ob, mtx = sc.ray_cast(deps, o, Vector((0, 0, -1)))
        if not hit: return 0.0
        if any(c.name in ignore for c in ob.users_collection) or ob.hide_render: o = loc - Vector((0, 0, 0.001)); continue
        return loc.z
    return 0.0

def seated(name, x, y, yaw=0.0, lean=6.0, seat=None, **kw):
    b, r = actor(name, loc=Vector((x, y, 0)), yaw=yaw, **kw)
    z = seat if seat is not None else seat_z(x, y)
    P.sit(r, b, z, lean=lean)
    return b, r

def plant_feet(rig, body, floor_z=0.0):
    """shift the rig vertically so the lowest foot point rests exactly on the floor"""
    low = P._lowest(body, lambda reg: reg in ("kaki.L", "kaki.R"))
    rig.location.z += (floor_z + 0.004) - low; bpy.context.view_layer.update()

def walk(rig, body, pts, f_start, f_end, step_frames=15, floor_z=0.0, arm_amp=18, leg_amp=26, key_every=2, carry_R=False):
    """walk along the polyline pts (world, z ignored) from f_start to f_end: leg/arm swing, knee bend, feet
    planted on the floor every keyed frame, facing the walking direction."""
    import math as _m
    pts = [Vector((p[0], p[1], 0)) for p in pts]
    seg = [(pts[i + 1] - pts[i]).length for i in range(len(pts) - 1)]; total = sum(seg)
    def at(t):
        d = t * total
        for i, L in enumerate(seg):
            if d <= L or i == len(seg) - 1:
                u = min(1, d / L) if L else 0; return pts[i].lerp(pts[i + 1], u), (pts[i + 1] - pts[i]).normalized()
            d -= L
    for f in list(range(f_start, f_end + 1, key_every)) + [f_end]:
        bpy.context.scene.frame_set(f)
        t = (f - f_start) / max(1, f_end - f_start)
        te = t * t * (3 - 2 * t)                        # ease in/out
        pos, d = at(te)
        rig.location.x, rig.location.y = pos.x, pos.y
        rig.rotation_euler = (0, 0, _m.atan2(d.x, -d.y))
        bpy.context.view_layer.update()
        speed = 4 * te * (1 - te) if 0 < t < 1 else 0.0  # amplitude follows speed
        ph = (f - f_start) / step_frames * _m.pi
        P.rest_pose(rig)
        X, F, U = P.char_axes(rig)
        s = _m.sin(ph) * speed
        for side, sg in (("L", 1), ("R", -1)):
            th = leg_amp * s * sg
            P.aim(rig, f"upperleg01.{side}", -U * _m.cos(_m.radians(th)) + F * _m.sin(_m.radians(th)) + X * 0.02 * sg)
            P.aim(rig, f"upperleg02.{side}", -U * _m.cos(_m.radians(th)) + F * _m.sin(_m.radians(th)) + X * 0.02 * sg)
            knee = max(0.0, -_m.cos(ph) * sg) * 35 * speed + 4
            kd = -U * _m.cos(_m.radians(th - knee)) + F * _m.sin(_m.radians(th - knee))
            for b in (f"lowerleg01.{side}", f"lowerleg02.{side}"): P.aim(rig, b, kd)
            P.aim(rig, f"foot.{side}", F - U * 0.25)
        P.relaxed_arms(rig, sides=("L",) if carry_R else ("L", "R"))
        for side, sg in (("L", -1), ("R", 1)):
            if carry_R and side == "R": continue
            P.turn(rig, f"upperarm01.{side}", X, -arm_amp * s * sg * 0.6)
        plant_feet(rig, body, floor_z)
        P.key_pose(rig, f); rig.keyframe_insert("location", frame=f); rig.keyframe_insert("rotation_euler", frame=f)
