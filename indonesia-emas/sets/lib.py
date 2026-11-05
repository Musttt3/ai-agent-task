# Shared helpers for the set builders (Blender Python). Import from a build script with:
#   import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from lib import *
import bpy, bmesh, math, os
from mathutils import Vector

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
TEX = os.path.join(ROOT, "assets", "tex")
HDRI = os.path.join(ROOT, "assets", "hdri")
SHOTS_TIMING = {  # id: (frame_start, frame_end) from shotlist.md
    "01": (0, 57), "02": (58, 129), "03": (130, 205), "04": (206, 264), "05": (265, 315), "06": (316, 365),
    "07": (366, 433), "08": (434, 481), "09": (482, 531), "10": (532, 597), "11": (598, 666), "12": (667, 723),
    "13": (724, 793), "14": (794, 861), "15": (862, 924), "16": (925, 982), "17": (983, 1060), "18": (1061, 1126),
    "19": (1127, 1187), "20": (1188, 1217), "21": (1218, 1260), "22": (1261, 1315), "23": (1316, 1393),
    "24": (1394, 1469), "25": (1470, 1531), "26": (1532, 1592), "27": (1593, 1638), "28": (1639, 1754),
}

def new_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.fps = 30; sc.render.resolution_x, sc.render.resolution_y = 1080, 1920
    sc.frame_start, sc.frame_end = 0, 1754
    sc.render.engine = "BLENDER_EEVEE_NEXT"; sc.eevee.taa_render_samples = 16
    sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"
    return sc

def coll(name):
    sc = bpy.context.scene
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in sc.collection.children: sc.collection.children.link(c)
    return c

# ---------------- materials ----------------
def mat(name, tex=None, color=(0.8, 0.8, 0.8), rough=0.8, metal=0.0, emit=None, emit_strength=0.0, alpha=1.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial"); b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    b.inputs["Base Color"].default_value = (*color, 1)
    if tex:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(os.path.join(TEX, tex + ".png"), check_existing=True)
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = emit_strength
    if alpha < 1:
        b.inputs["Alpha"].default_value = alpha; m.blend_method = "BLEND" if hasattr(m, "blend_method") else None
    nt.links.new(b.outputs["BSDF"], out.inputs["Surface"])
    return m

def box_uv(o, tile):
    me = o.data; bm = bmesh.new(); bm.from_mesh(me)
    uv = bm.loops.layers.uv.verify(); mw = o.matrix_world
    for f in bm.faces:
        n = (mw.to_3x3() @ f.normal); ax = max(range(3), key=lambda i: abs(n[i]))
        a, b = [(1, 2), (0, 2), (0, 1)][ax]
        for l in f.loops:
            p = mw @ l.vert.co; l[uv].uv = (p[a] / tile, p[b] / tile)
    bm.to_mesh(me); bm.free()

def assign(o, m, tile=1.0, bevel=0.0):
    o.data.materials.clear(); o.data.materials.append(m)
    if o.type == "MESH" and m.node_tree.nodes.get("Image Texture"): box_uv(o, tile)
    if bevel:
        b = o.modifiers.get("Bevel") or o.modifiers.new("Bevel", "BEVEL"); b.width = bevel; b.segments = 3; b.limit_method = "ANGLE"

def part(c, kind, name, loc, m, size=None, tile=1.0, bevel=0.0, rot=(0, 0, 0), smooth=None, **kw):
    if kind == "box": bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    elif kind == "cyl": bpy.ops.mesh.primitive_cylinder_add(location=loc, rotation=rot, **kw)
    elif kind == "cone": bpy.ops.mesh.primitive_cone_add(location=loc, rotation=rot, **kw)
    elif kind == "sph": bpy.ops.mesh.primitive_uv_sphere_add(location=loc, rotation=rot, **kw)
    elif kind == "ico": bpy.ops.mesh.primitive_ico_sphere_add(location=loc, rotation=rot, **kw)
    elif kind == "torus": bpy.ops.mesh.primitive_torus_add(location=loc, rotation=rot, **kw)
    elif kind == "plane": bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name
    if size: o.scale = size; bpy.ops.object.transform_apply(scale=True)
    for cc in o.users_collection: cc.objects.unlink(o)
    c.objects.link(o); assign(o, m, tile, bevel)
    sm = smooth if smooth is not None else kind in ("sph", "torus", "ico")
    for poly in o.data.polygons: poly.use_smooth = sm
    return o

# ---------------- lights ----------------
def lamp(c, name, kind, color, energy, loc=(0, 0, 0), aim=None, **kw):
    ld = bpy.data.lights.new(name, kind); ld.color = color; ld.energy = energy
    for k, v in kw.items(): setattr(ld, k, v)
    o = bpy.data.objects.new(name, ld); c.objects.link(o); o.location = loc
    if aim is not None: o.rotation_euler = Vector(aim).normalized().to_track_quat("-Z", "Y").to_euler()
    return o

def key(datablock, path, pairs, interp="CONSTANT"):
    for f, v in pairs:
        setattr(datablock, path, v); datablock.keyframe_insert(path, frame=f)
    for fc in datablock.animation_data.action.fcurves:
        if fc.data_path == path:
            for kp in fc.keyframe_points: kp.interpolation = interp

def world_hdri(name, strength):
    sc = bpy.context.scene
    w = sc.world or bpy.data.worlds.new("World"); sc.world = w; w.use_nodes = True
    nt = w.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld"); bg = nt.nodes.new("ShaderNodeBackground")
    tx = nt.nodes.new("ShaderNodeTexEnvironment"); tx.image = bpy.data.images.load(os.path.join(HDRI, name + ".hdr"), check_existing=True)
    bg.inputs["Strength"].default_value = strength
    nt.links.new(tx.outputs["Color"], bg.inputs["Color"]); nt.links.new(bg.outputs[0], out.inputs[0])

# ---------------- stand-ins, marks, cameras ----------------
GREY = None
def figure(c, name, loc, pose="stand", yaw=0.0, scale=1.0, color=(0.62, 0.62, 0.62)):
    """grey stand-in for a character (HERO_* = main character, FIG_* = supporting), replaced in Prompt 4"""
    m = mat("STANDIN_" + name, color=color, rough=0.7)
    root = bpy.data.objects.new(name, None); c.objects.link(root)
    root.location = loc; root.rotation_euler = (0, 0, math.radians(yaw)); root.scale = (scale,) * 3
    ps = []
    if pose == "stand":
        ps += [part(c, "cyl", name + "_kaki", (0, 0, 0.3), m, radius=0.11, depth=0.6), part(c, "box", name + "_badan", (0, 0, 0.8), m, (0.42, 0.3, 0.42))]
        hz = 1.08
    else:  # sit
        ps += [part(c, "box", name + "_paha", (0, -0.2, 0.0), m, (0.3, 0.4, 0.14)), part(c, "box", name + "_badan", (0, 0, 0.28), m, (0.42, 0.3, 0.42))]
        hz = 0.56
    ps.append(part(c, "sph", name + "_kepala", (0, 0, hz + 0.26), m, radius=0.26, segments=24, ring_count=12))
    for p in ps: p.parent = root
    return root

def empty(c, name, loc, size=0.15):
    e = bpy.data.objects.new(name, None); e.empty_display_size = size; e.location = loc; c.objects.link(e); return e

def camera(c, sid, lens, c0, c1, l0, l1, show=(), fstop=2.4, focus=None, interp="LINEAR", keys=None):
    """camera CAM_<sid> keyed over the shot's frames (or custom (frame, cam, look) keys), DOF on FOCUS_<sid>"""
    f0, f1 = SHOTS_TIMING[sid]
    cd = bpy.data.cameras.new("CAM_" + sid); cd.lens = lens; cd.sensor_fit = "AUTO"; cd.sensor_width = 36
    cd.clip_start, cd.clip_end = 0.05, 600
    cam = bpy.data.objects.new("CAM_" + sid, cd); c.objects.link(cam)
    tgt = bpy.data.objects.new("CAM_" + sid + "_TARGET", None); c.objects.link(tgt)
    con = cam.constraints.new("TRACK_TO"); con.target = tgt; con.track_axis = "TRACK_NEGATIVE_Z"; con.up_axis = "UP_Y"
    for f, cp, lp in (keys or ((f0, c0, l0), (f1, c1, l1))):
        cam.location, tgt.location = cp, lp
        cam.keyframe_insert("location", frame=f); tgt.keyframe_insert("location", frame=f)
    for ob in (cam, tgt):
        for fc in ob.animation_data.action.fcurves:
            for kp in fc.keyframe_points: kp.interpolation = interp
    cam["shot"], cam["frame_start"], cam["frame_end"], cam["show"] = sid, f0, f1, ",".join(show)
    fo = empty(c, "FOCUS_" + sid, focus or l0, 0.05)
    cd.dof.use_dof = True; cd.dof.focus_object = fo; cd.dof.aperture_fstop = fstop
    return cam

def save(name):
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "sets", name + ".blend"))
    print("SAVED", name)
