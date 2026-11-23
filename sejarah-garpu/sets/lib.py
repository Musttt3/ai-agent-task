# Shared helpers for the set builders (Blender Python):
#   import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from lib import *
import bpy, bmesh, math, os, sys, random
from mathutils import Vector, Matrix, Euler

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
sys.path.insert(0, os.path.join(ROOT, "props")); sys.path.insert(0, os.path.join(ROOT, "characters"))
import props as PR
from props import mat_ph, mat_simple, mat_noise_color
PH = os.path.join(ROOT, "assets", "ph")

def new_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.fps = 30; sc.render.resolution_x, sc.render.resolution_y = 1080, 1920
    sc.render.engine = "CYCLES"; c = sc.cycles; c.device = "CPU"
    c.samples = 32; c.use_adaptive_sampling = True; c.adaptive_threshold = 0.03; c.use_denoising = True
    c.max_bounces = 6; c.diffuse_bounces = 3; c.glossy_bounces = 3; c.transmission_bounces = 6; c.transparent_max_bounces = 24
    c.texture_limit_render = "2048"; sc.render.use_persistent_data = True
    sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"
    return sc

def coll(name, parent=None):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    p = parent or bpy.context.scene.collection
    if c.name not in [x.name for x in p.children]: p.children.link(c)
    return c

def link(o, c):
    for cc in list(o.users_collection): cc.objects.unlink(o)
    c.objects.link(o); return o

# ------------------------------------------------------------------ Poly Haven models
def ph_model(mid, c, loc=(0, 0, 0), rot=(0, 0, 0), size=None, axis="z", name=None, lod="LOD0", only=None):
    """append a Poly Haven model (only its LOD0 meshes when LODs exist), group under an empty, normalise the size:
    size = target extent (m) along axis ('x'|'y'|'z'|'max'). Returns the root empty."""
    f = os.path.join(PH, mid, mid + ".blend")
    with bpy.data.libraries.load(f, link=False) as (src, dst):
        dst.objects = src.objects; dst.collections = src.collections
    objs = [o for o in dst.objects if o and o.type in ("MESH", "CURVE", "EMPTY")]
    lodcols = [col for col in dst.collections if col and lod in col.name]
    if lodcols:
        keep = set()
        for col in lodcols: keep |= set(col.all_objects)
        objs = [o for o in objs if o in keep]
    if only:
        objs = [o for o in objs if o.name.split(".")[0] in only]
    root = bpy.data.objects.new(name or ("PH_" + mid), None); c.objects.link(root); root.empty_display_size = 0.2
    for o in objs:
        c.objects.link(o)
        if o.parent is None or o.parent not in objs: o.parent = root
    bpy.context.view_layer.update()
    if size:
        mn, mx = bbox(objs)
        ext = (mx - mn); e = {"x": ext.x, "y": ext.y, "z": ext.z, "max": max(ext)}[axis]
        if e > 1e-6: root.scale = (size / e,) * 3
    bpy.context.view_layer.update()
    mn, mx = bbox(objs)
    # sit on the ground at loc: move so the bottom centre is at the root's origin
    off = Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z))
    for o in objs:
        if o.parent == root: o.location -= root.matrix_world.inverted().to_3x3() @ off if False else (Matrix.Diagonal(root.scale).inverted() @ off)
    root.location = loc; root.rotation_euler = rot
    bpy.context.view_layer.update()
    root["ph"] = mid
    return root

def bbox(objs):
    mn = Vector((1e9,) * 3); mx = Vector((-1e9,) * 3)
    for o in objs:
        if o.type != "MESH": continue
        for cc in o.bound_box:
            w = o.matrix_world @ Vector(cc); mn = Vector(map(min, mn, w)); mx = Vector(map(max, mx, w))
    return mn, mx

def children_meshes(root):
    return [o for o in root.children_recursive if o.type == "MESH"]

# ------------------------------------------------------------------ primitives with materials
def box(c, name, loc, size, m, rot=(0, 0, 0), bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = size; bpy.ops.object.transform_apply(scale=True)
    link(o, c); o.data.materials.append(m)
    if bevel:
        b = o.modifiers.new("Bevel", "BEVEL"); b.width = bevel; b.segments = 2; b.limit_method = "ANGLE"
    return o

def plane(c, name, loc, size, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = (size[0], size[1], 1); bpy.ops.object.transform_apply(scale=True)
    link(o, c); o.data.materials.append(m); return o

def cyl(c, name, loc, r, h, m, rot=(0, 0, 0), verts=32, smooth=True):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=verts, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; link(o, c); o.data.materials.append(m)
    if smooth:
        for p in o.data.polygons: p.use_smooth = True
        o.data.polygons[0].use_smooth = False
    return o

def wall_with_openings(c, name, x0, x1, y, h, thick, m, openings=(), axis="x", z0=0.0):
    """a wall along X (at y) or Y (at x=y) from x0..x1, height h, with rectangular/arched openings
    [(centre, bottom, width, height, arched)] cut by boolean"""
    L = x1 - x0; cx = (x0 + x1) / 2
    if axis == "x": w = box(c, name, (cx, y, z0 + h / 2), (L, thick, h), m)
    else: w = box(c, name, (y, cx, z0 + h / 2), (thick, L, h), m)
    for i, (oc, ob, ow, oh, arched) in enumerate(openings):
        ob = ob + z0
        if axis == "x": cut = box(c, f"{name}_lubang{i}", (oc, y, ob + oh / 2), (ow, thick * 3, oh), m)
        else: cut = box(c, f"{name}_lubang{i}", (y, oc, ob + oh / 2), (thick * 3, ow, oh), m)
        if arched:
            r = ow / 2
            if axis == "x": a = cyl(c, f"{name}_lengkung{i}", (oc, y, ob + oh), r, thick * 3, m, rot=(math.radians(90), 0, 0), verts=48)
            else: a = cyl(c, f"{name}_lengkung{i}", (y, oc, ob + oh), r, thick * 3, m, rot=(0, math.radians(90), 0), verts=48)
            bo = w.modifiers.new(f"arch{i}", "BOOLEAN"); bo.object = a; bo.operation = "DIFFERENCE"; a.hide_render = True; a.display_type = "WIRE"
        bo = w.modifiers.new(f"cut{i}", "BOOLEAN"); bo.object = cut; bo.operation = "DIFFERENCE"; cut.hide_render = True; cut.display_type = "WIRE"
    for p in w.data.polygons: p.use_smooth = False
    return w

def apply_mods(o):
    with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o]):
        for m in list(o.modifiers):
            try: bpy.ops.object.modifier_apply(modifier=m.name)
            except Exception as e: print("apply", o.name, m.name, e)

# ------------------------------------------------------------------ world, lights
def world_hdri(hid, strength=1.0, rot_z=0.0, res="2k", bg_strength=None):
    sc = bpy.context.scene
    w = bpy.data.worlds.new("Dunia"); sc.world = w; w.use_nodes = True; nt = w.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    tc = nt.nodes.new("ShaderNodeTexCoord"); mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Rotation"].default_value = (0, 0, rot_z)
    tx = nt.nodes.new("ShaderNodeTexEnvironment")
    path = os.path.join(PH, hid, f"{hid}_{res}.hdr")
    if not os.path.exists(path):
        cand = [f for f in os.listdir(os.path.join(PH, hid)) if f.endswith(".hdr")]; path = os.path.join(PH, hid, cand[0])
    tx.image = bpy.data.images.load(path, check_existing=True)
    nt.links.new(tc.outputs["Generated"], mp.inputs["Vector"]); nt.links.new(mp.outputs["Vector"], tx.inputs["Vector"])
    bg = nt.nodes.new("ShaderNodeBackground"); bg.inputs["Strength"].default_value = strength
    nt.links.new(tx.outputs["Color"], bg.inputs["Color"])
    if bg_strength is None:
        nt.links.new(bg.outputs[0], out.inputs[0])
    else:   # camera sees the HDRI at another strength than the lighting
        bg2 = nt.nodes.new("ShaderNodeBackground"); bg2.inputs["Strength"].default_value = bg_strength; nt.links.new(tx.outputs["Color"], bg2.inputs["Color"])
        lp = nt.nodes.new("ShaderNodeLightPath"); mx = nt.nodes.new("ShaderNodeMixShader")
        nt.links.new(lp.outputs["Is Camera Ray"], mx.inputs[0]); nt.links.new(bg.outputs[0], mx.inputs[1]); nt.links.new(bg2.outputs[0], mx.inputs[2])
        nt.links.new(mx.outputs[0], out.inputs[0])
    return w

def lamp(c, name, kind, energy, loc, aim=None, color=(1, 1, 1), **kw):
    ld = bpy.data.lights.new(name, kind); ld.energy = energy; ld.color = color
    for k, v in kw.items(): setattr(ld, k, v)
    o = bpy.data.objects.new(name, ld); c.objects.link(o); o.location = loc
    if aim is not None: o.rotation_euler = (Vector(aim) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return o

def sun(c, name, energy, elevation, azimuth, color=(1, 0.95, 0.88), angle=0.6):
    ld = bpy.data.lights.new(name, "SUN"); ld.energy = energy; ld.color = color; ld.angle = math.radians(angle)
    o = bpy.data.objects.new(name, ld); c.objects.link(o)
    o.rotation_euler = Euler((math.radians(90 - elevation), 0, math.radians(azimuth)), "XYZ")
    return o

def fire(c, name, loc, size=0.35, energy=250):
    """camp/stove fire: flame tongues (emissive, alpha-feathered) + warm flickering lights (keyed per frame)"""
    m = bpy.data.materials.get("Api")
    if not m:
        m = bpy.data.materials.new("Api"); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
        out = nt.nodes.new("ShaderNodeOutputMaterial"); em = nt.nodes.new("ShaderNodeEmission"); tr = nt.nodes.new("ShaderNodeBsdfTransparent")
        mx = nt.nodes.new("ShaderNodeMixShader")
        tc = nt.nodes.new("ShaderNodeTexCoord"); gr = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(tc.outputs["Generated"], gr.inputs[0])
        nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 6; nz.inputs["Detail"].default_value = 6
        nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
        ramp = nt.nodes.new("ShaderNodeValToRGB"); E = ramp.color_ramp.elements
        E[0].position = 0.0; E[0].color = (1.0, 0.7, 0.3, 1); E[1].position = 0.8; E[1].color = (0.85, 0.15, 0.02, 1)
        nt.links.new(gr.outputs["Z"], ramp.inputs["Fac"]); nt.links.new(ramp.outputs["Color"], em.inputs["Color"])
        em.inputs["Strength"].default_value = 6
        a = nt.nodes.new("ShaderNodeMath"); a.operation = "MULTIPLY"; nt.links.new(nz.outputs["Fac"], a.inputs[0]); a.inputs[1].default_value = 1.6
        b2 = nt.nodes.new("ShaderNodeMath"); b2.operation = "SUBTRACT"; nt.links.new(a.outputs[0], b2.inputs[0]); nt.links.new(gr.outputs["Z"], b2.inputs[1])
        cl = nt.nodes.new("ShaderNodeClamp"); nt.links.new(b2.outputs[0], cl.inputs[0])
        nt.links.new(cl.outputs[0], mx.inputs[0]); nt.links.new(tr.outputs[0], mx.inputs[1]); nt.links.new(em.outputs[0], mx.inputs[2])
        nt.links.new(mx.outputs[0], out.inputs["Surface"])
    root = bpy.data.objects.new(name, None); c.objects.link(root); root.location = loc
    random.seed(hash(name) % 1000)
    for i in range(9):
        bm = bmesh.new(); s = bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=12, radius=1)
        for v in s["verts"]:
            z = (v.co.z + 1) / 2; v.co.x *= (1 - z) ** 0.8; v.co.y *= (1 - z) ** 0.8; v.co.z = z * 2.4
        me = bpy.data.meshes.new(f"{name}_lidah{i}"); bm.to_mesh(me); bm.free()
        o = bpy.data.objects.new(f"{name}_lidah{i}", me); c.objects.link(o); o.parent = root; me.materials.append(m)
        for p in me.polygons: p.use_smooth = True
        r = size * random.uniform(0.12, 0.25); o.scale = (r, r, r * random.uniform(0.9, 1.6))
        a = random.uniform(0, 6.28); d = random.uniform(0, size * 0.3); o.location = (math.cos(a) * d, math.sin(a) * d, 0)
        o.visible_shadow = False
        # flicker: scale keys
        for f in range(-10, 1700, 4):
            k = random.uniform(0.8, 1.2); o.scale = (r * k, r * k, r * random.uniform(0.9, 1.7)); o.keyframe_insert("scale", frame=f)
    L = lamp(c, name + "_cahaya", "POINT", energy, Vector(loc) + Vector((0, 0, size * 0.6)), color=(1.0, 0.55, 0.22), shadow_soft_size=size * 0.5)
    for f in range(-10, 1700, 3):
        L.data.energy = energy * random.uniform(0.75, 1.15); L.data.keyframe_insert("energy", frame=f)
    return root

def kandelar(c, name, loc, radius=0.65, candles=8, chain_to=None):
    """medieval iron ring chandelier with candles hung on three chains"""
    iron = PR.IRON()
    bpy.ops.mesh.primitive_torus_add(major_radius=radius, minor_radius=0.022, major_segments=64, minor_segments=12, location=loc)
    ring = bpy.context.object; ring.name = name; link(ring, c); ring.data.materials.append(iron)
    for p in ring.data.polygons: p.use_smooth = True
    for i in range(candles):
        a = 2 * math.pi * i / candles
        q = Vector(loc) + Vector((math.cos(a) * radius, math.sin(a) * radius, 0.02))
        cup = cyl(c, f"{name}_cawan{i}", q, 0.035, 0.03, iron, verts=20); cup.parent = ring; cup.matrix_parent_inverse = ring.matrix_world.inverted()
        l = PR.lilin(f"{name}_lilin{i}", 0.13, c); l.location = q + Vector((0, 0, 0.012))
    top = Vector(loc) + Vector((0, 0, (chain_to - loc[2]) if chain_to else 1.5))
    for i in range(3):
        a = 2 * math.pi * i / 3 + 0.3
        q = Vector(loc) + Vector((math.cos(a) * radius, math.sin(a) * radius, 0))
        d = top - q
        ch = cyl(c, f"{name}_rantai{i}", (q + top) / 2, 0.008, d.length, iron, verts=8)
        ch.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    return ring

def mark(c, name, loc, yaw=0.0):
    """position marker for characters / props (empty with yaw in degrees)"""
    e = bpy.data.objects.new("MARK_" + name, None); c.objects.link(e); e.location = loc; e.rotation_euler = (0, 0, math.radians(yaw))
    e.empty_display_type = "ARROWS"; e.empty_display_size = 0.3; return e

def save(name):
    p = os.path.join(ROOT, "sets", name + ".blend")
    bpy.ops.file.pack_all() if False else None
    bpy.ops.wm.save_as_mainfile(filepath=p, relative_remap=True)
    print("SAVED", p)

def preview(name, cams, res=(540, 960), samples=24):
    """quick QA renders of the set from given cameras [(loc, look, lens)] -> review/set_<name>_<i>.png"""
    sc = bpy.context.scene
    old = (sc.render.resolution_x, sc.render.resolution_y, sc.cycles.samples, sc.camera)
    sc.render.resolution_x, sc.render.resolution_y = res; sc.cycles.samples = samples
    outs = []
    for i, (loc, look, lens) in enumerate(cams):
        cd = bpy.data.cameras.new(f"PREV{i}"); cd.lens = lens; cd.clip_start = 0.02
        cam = bpy.data.objects.new(f"PREV{i}", cd); sc.collection.objects.link(cam); sc.camera = cam
        cam.location = loc; cam.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        p = os.path.join(ROOT, "review", f"_set_{name}_{i}.png"); sc.render.filepath = p; bpy.ops.render.render(write_still=True); outs.append(p)
        bpy.data.objects.remove(cam)
    sc.render.resolution_x, sc.render.resolution_y, sc.cycles.samples, sc.camera = old
    return outs
