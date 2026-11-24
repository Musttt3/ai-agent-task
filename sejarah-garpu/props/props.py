# Hand-made hero props (Blender Python). Every prop is ONE mesh object, real-world size in metres.
# Held props: origin = grip point, local +Z = along the handle toward the working end, custom props "tip" (local
# point of the working end) and "grip" (0,0,0). Import inside Blender:
#   sys.path.insert(0, "<project>/props"); import props as PR; o = PR.garpu_emas()
import bpy, bmesh, math, random
from mathutils import Vector, Matrix, noise

# ------------------------------------------------------------------ materials
def _bsdf(m):
    return next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")

def _noise_rough(m, base, amp=0.08, scale=60.0):
    """roughness variation (fingerprints / wear) so metal never looks like new plastic"""
    nt = m.node_tree; b = _bsdf(m)
    tc = nt.nodes.new("ShaderNodeTexCoord"); nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = scale; nz.inputs["Detail"].default_value = 8
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs["To Min"].default_value = max(0, base - amp); mr.inputs["To Max"].default_value = base + amp
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"]); nt.links.new(nz.outputs["Fac"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], b.inputs["Roughness"])
    # micro scratches
    w = nt.nodes.new("ShaderNodeTexWave"); w.inputs["Scale"].default_value = 180; w.inputs["Distortion"].default_value = 14
    bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.04; bump.inputs["Distance"].default_value = 0.0005
    nt.links.new(tc.outputs["Object"], w.inputs["Vector"]); nt.links.new(w.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])

def mat_metal(name, color, rough=0.25, amp=0.08):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True; b = _bsdf(m)
    b.inputs["Base Color"].default_value = (*color, 1); b.inputs["Metallic"].default_value = 1.0
    _noise_rough(m, rough, amp); return m

def GOLD(): return mat_metal("Emas", (1.0, 0.74, 0.32), 0.2, 0.07)
def SILVER(): return mat_metal("Perak", (0.8, 0.78, 0.74), 0.32, 0.1)
def IRON(): return mat_metal("Besi_Tua", (0.42, 0.41, 0.4), 0.42, 0.12)
def STEEL(): return mat_metal("Baja_Tahan_Karat", (0.8, 0.8, 0.8), 0.16, 0.05)

def BRONZE():
    """worked bronze: warm metal with darker oxidised crevices and only a trace of green patina"""
    m = bpy.data.materials.get("Perunggu")
    if m: return m
    m = bpy.data.materials.new("Perunggu"); m.use_nodes = True; nt = m.node_tree; b = _bsdf(m)
    tc = nt.nodes.new("ShaderNodeTexCoord"); nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 22; nz.inputs["Detail"].default_value = 12
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB"); E = ramp.color_ramp.elements
    E[0].position = 0.36; E[0].color = (0.2, 0.12, 0.06, 1)          # dark tarnish
    E[1].position = 0.64; E[1].color = (0.62, 0.42, 0.22, 1)         # polished bronze
    nt.links.new(nz.outputs["Fac"], ramp.inputs["Fac"]); nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    mt = nt.nodes.new("ShaderNodeMapRange"); mt.inputs["From Min"].default_value = 0.42; mt.inputs["From Max"].default_value = 0.6
    mt.inputs["To Min"].default_value = 0.85; mt.inputs["To Max"].default_value = 1.0
    nt.links.new(nz.outputs["Fac"], mt.inputs["Value"]); nt.links.new(mt.outputs["Result"], b.inputs["Metallic"])
    rr = nt.nodes.new("ShaderNodeMapRange"); rr.inputs["From Min"].default_value = 0.4; rr.inputs["From Max"].default_value = 0.65
    rr.inputs["To Min"].default_value = 0.7; rr.inputs["To Max"].default_value = 0.32
    nt.links.new(nz.outputs["Fac"], rr.inputs["Value"]); nt.links.new(rr.outputs["Result"], b.inputs["Roughness"])
    nz2 = nt.nodes.new("ShaderNodeTexNoise"); nz2.inputs["Scale"].default_value = 300
    bp = nt.nodes.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.15; bp.inputs["Distance"].default_value = 0.0003
    nt.links.new(tc.outputs["Object"], nz2.inputs["Vector"]); nt.links.new(nz2.outputs["Fac"], bp.inputs["Height"]); nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m

def mat_simple(name, color, rough=0.6, sss=0.0, spec=0.5, metal=0.0, alpha=1.0, transmission=0.0, ior=1.45, emit=None, emit_strength=0.0):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True; b = _bsdf(m)
    b.inputs["Base Color"].default_value = (*color, 1); b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal; b.inputs["IOR"].default_value = ior
    if sss: b.inputs["Subsurface Weight"].default_value = sss; b.inputs["Subsurface Radius"].default_value = (0.4, 0.25, 0.15)
    if transmission: b.inputs["Transmission Weight"].default_value = transmission
    if alpha < 1: b.inputs["Alpha"].default_value = alpha
    if emit: b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = emit_strength
    return m

def mat_noise_color(name, c1, c2, scale=12, rough=0.7, bump=0.15, detail=10, sss=0.0):
    """two-tone procedural colour + bump (stone, shell, meat, wood chips...)"""
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = _bsdf(m)
    tc = nt.nodes.new("ShaderNodeTexCoord"); nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = scale; nz.inputs["Detail"].default_value = detail
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    mixc = nt.nodes.new("ShaderNodeMix"); mixc.data_type = "RGBA"; mixc.inputs[6].default_value = (*c1, 1); mixc.inputs[7].default_value = (*c2, 1)
    nt.links.new(nz.outputs["Fac"], mixc.inputs["Factor"]); nt.links.new(mixc.outputs[2], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    if sss: b.inputs["Subsurface Weight"].default_value = sss; b.inputs["Subsurface Radius"].default_value = (0.5, 0.2, 0.1)
    if bump:
        bp = nt.nodes.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = bump; bp.inputs["Distance"].default_value = 0.002
        nt.links.new(nz.outputs["Fac"], bp.inputs["Height"]); nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m

import os
PH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "ph")
def mat_ph(name, tex, scale=1.0, tint=(1, 1, 1), rough_mul=1.0, bump=1.0, res="2k", coords="Object"):
    """Poly Haven PBR texture with box (tri-planar) projection in object space; scale = metres per tile"""
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = _bsdf(m)
    tc = nt.nodes.new("ShaderNodeTexCoord"); mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (1 / scale,) * 3
    nt.links.new(tc.outputs[coords], mp.inputs["Vector"])
    def img(kind, non_color):
        f = os.path.join(PH, tex, f"{tex}_{kind}_{res}.jpg")
        if not os.path.exists(f): return None
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(f, check_existing=True)
        if non_color: t.image.colorspace_settings.name = "Non-Color"
        t.projection = "BOX"; t.projection_blend = 0.25; nt.links.new(mp.outputs["Vector"], t.inputs["Vector"]); return t
    d = img("diffuse", False)
    if not d:
        b.inputs["Base Color"].default_value = (*tint, 1)
    if d:
        mul = nt.nodes.new("ShaderNodeMix"); mul.data_type = "RGBA"; mul.blend_type = "MULTIPLY"; mul.inputs["Factor"].default_value = 1
        mul.inputs[7].default_value = (*tint, 1); nt.links.new(d.outputs["Color"], mul.inputs[6]); nt.links.new(mul.outputs[2], b.inputs["Base Color"])
    r = img("rough", True)
    if r:
        mr = nt.nodes.new("ShaderNodeMath"); mr.operation = "MULTIPLY"; mr.inputs[1].default_value = rough_mul
        nt.links.new(r.outputs["Color"], mr.inputs[0]); nt.links.new(mr.outputs[0], b.inputs["Roughness"])
    n = img("nor_gl", True)
    if n:
        nm = nt.nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = bump
        nt.links.new(n.outputs["Color"], nm.inputs["Color"]); nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    return m

def scatter_grains(target, grain, count=2500, seed=1, scale_range=(0.85, 1.15), name="BUTIR"):
    """geometry-nodes scatter of a small grain object over target's surface (random rotation/scale)"""
    mod = target.modifiers.new(name, "NODES")
    ng = bpy.data.node_groups.new(name + "_GN", "GeometryNodeTree"); mod.node_group = ng
    ng.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    N = ng.nodes; L = ng.links
    gi = N.new("NodeGroupInput"); go = N.new("NodeGroupOutput")
    dist = N.new("GeometryNodeDistributePointsOnFaces"); dist.distribute_method = "POISSON"
    dist.inputs["Distance Min"].default_value = 0.0022; dist.inputs["Density Max"].default_value = count / max(1e-4, sum(p.area for p in target.data.polygons)); dist.inputs["Seed"].default_value = seed
    oi = N.new("GeometryNodeObjectInfo"); oi.inputs["Object"].default_value = grain; oi.transform_space = "ORIGINAL"
    rr = N.new("FunctionNodeRandomValue"); rr.data_type = "FLOAT_VECTOR"; rr.inputs["Max"].default_value = (6.3, 6.3, 6.3)
    rs = N.new("FunctionNodeRandomValue"); rs.data_type = "FLOAT"; rs.inputs["Min"].default_value = scale_range[0]; rs.inputs["Max"].default_value = scale_range[1]
    inst = N.new("GeometryNodeInstanceOnPoints"); real = N.new("GeometryNodeRealizeInstances")
    join = N.new("GeometryNodeJoinGeometry")
    L.new(gi.outputs[0], dist.inputs["Mesh"]); L.new(dist.outputs["Points"], inst.inputs["Points"])
    L.new(oi.outputs["Geometry"], inst.inputs["Instance"]); L.new(rr.outputs[0], inst.inputs["Rotation"]); L.new(rs.outputs[1], inst.inputs["Scale"])
    L.new(gi.outputs[0], join.inputs[0]); L.new(inst.outputs[0], join.inputs[0]); L.new(join.outputs[0], go.inputs[0])
    return mod

# ------------------------------------------------------------------ geometry helpers
def _new(name, bm, mats, smooth=True, subsurf=0, coll=None):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me)
    (coll or bpy.context.scene.collection).objects.link(o)
    for m in mats: me.materials.append(m)
    for p in me.polygons: p.use_smooth = smooth
    if subsurf:
        s = o.modifiers.new("Halus", "SUBSURF"); s.levels = subsurf; s.render_levels = subsurf
    return o

def _lathe(bm, profile, segs=32, z_axis=True, mat_index=0):
    """revolve (r, z) profile around Z. Returns the faces made."""
    rings = []
    for r, z in profile:
        ring = []
        for i in range(segs):
            a = 2 * math.pi * i / segs
            ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
        rings.append(ring)
    faces = []
    for k in range(len(rings) - 1):
        for i in range(segs):
            j = (i + 1) % segs
            f = bm.faces.new((rings[k][i], rings[k][j], rings[k + 1][j], rings[k + 1][i])); f.material_index = mat_index; faces.append(f)
    return rings, faces

def _sweep(bm, path, radius_fn, segs=12, flat=1.0, mat_index=0, cap=True, twist=0.0):
    """sweep an ellipse (rx = r, ry = r*flat) along a polyline path [(x,y,z)...]; radius_fn(t) with t 0..1"""
    pts = [Vector(p) for p in path]; n = len(pts)
    rings = []
    up = Vector((0, 1, 0))
    for k, p in enumerate(pts):
        t = k / (n - 1)
        d = (pts[min(k + 1, n - 1)] - pts[max(k - 1, 0)]).normalized()
        side = d.cross(up)
        if side.length < 1e-6: side = d.cross(Vector((1, 0, 0)))
        side.normalize(); nrm = side.cross(d).normalized()
        r = radius_fn(t); tw = twist * t
        ring = []
        for i in range(segs):
            a = 2 * math.pi * i / segs + tw
            ring.append(bm.verts.new(p + side * (math.cos(a) * r) + nrm * (math.sin(a) * r * flat)))
        rings.append(ring)
    for k in range(n - 1):
        for i in range(segs):
            j = (i + 1) % segs
            f = bm.faces.new((rings[k][i], rings[k][j], rings[k + 1][j], rings[k + 1][i])); f.material_index = mat_index
    if cap:
        for ring in (rings[0], rings[-1]):
            c = bm.verts.new(sum((v.co for v in ring), Vector()) / len(ring))
            for i in range(segs):
                f = bm.faces.new((ring[i], ring[(i + 1) % segs], c)); f.material_index = mat_index
    return rings

def _finish(o, tip, grip=(0, 0, 0)):
    o["tip"] = list(tip); o["grip"] = list(grip); return o

# ------------------------------------------------------------------ forks and spoons
def garpu_emas(name="GARPU_EMAS", coll=None):
    """Byzantine two-tined gold fork, 16.5 cm: slim twisted handle ending in a small ball, flat neck, 2 long tines.
    Grip at 4.5 cm from the handle end; +Z toward the tines."""
    bm = bmesh.new()
    L_handle = 0.105; z0 = -0.045
    # handle: twisted square-ish section, swelling slightly before the neck
    path = [(0, 0, z0 + L_handle * t) for t in [i / 40 for i in range(41)]]
    _sweep(bm, path, lambda t: 0.0032 + 0.0009 * math.sin(math.pi * t) + 0.0004 * t, segs=8, flat=0.82, twist=math.radians(540))
    # ball finial
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=0.0052, matrix=Matrix.Translation((0, 0, z0 - 0.003)))
    # collar ring
    bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=0.0042, radius2=0.0042, depth=0.003, matrix=Matrix.Translation((0, 0, z0 + L_handle)))
    # neck: flattened, widening to the tines' root
    zn = z0 + L_handle
    _sweep(bm, [(0, 0, zn + 0.018 * t) for t in [i / 10 for i in range(11)]], lambda t: 0.0028 + 0.0016 * t, segs=10, flat=0.45)
    # two tines from the root, slightly diverging, tapering to points
    zr = zn + 0.018
    for sx in (-1, 1):
        path = [(sx * (0.0026 + 0.0011 * t * t), 0, zr + 0.042 * t) for t in [i / 16 for i in range(17)]]
        _sweep(bm, path, lambda t: 0.0016 * (1 - 0.82 * t) + 0.0002, segs=8, flat=0.85)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    o = _new(name, bm, [GOLD()], subsurf=1, coll=coll)
    o["r"] = 0.0036
    return _finish(o, tip=(0, 0, zr + 0.042))

def garpu_coryat(name="GARPU_CORYAT", coll=None):
    """early-17th-century Italian two-tined fork: iron tines, turned bone handle, 18 cm"""
    bm = bmesh.new()
    z0 = -0.05
    prof = [(0.0001, z0 - 0.004), (0.0045, z0 - 0.003), (0.0055, z0 + 0.01), (0.0048, z0 + 0.03), (0.0058, z0 + 0.06),
            (0.0052, z0 + 0.085), (0.0062, z0 + 0.092), (0.0035, z0 + 0.098), (0.0001, z0 + 0.099)]
    _lathe(bm, prof, segs=20, mat_index=0)
    zn = z0 + 0.098
    _sweep(bm, [(0, 0, zn + 0.03 * t) for t in [i / 10 for i in range(11)]], lambda t: 0.0024 + 0.001 * t, segs=8, flat=0.5, mat_index=1)
    zr = zn + 0.03
    for sx in (-1, 1):
        _sweep(bm, [(sx * (0.0022 + 0.0008 * t), 0, zr + 0.05 * t) for t in [i / 14 for i in range(15)]], lambda t: 0.0014 * (1 - 0.8 * t) + 0.0002, segs=8, flat=0.8, mat_index=1)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    o = _new(name, bm, [mat_noise_color("Tulang", (0.86, 0.8, 0.66), (0.74, 0.66, 0.5), scale=40, rough=0.45, bump=0.05), IRON()], subsurf=1, coll=coll)
    o["r"] = 0.0062
    return _finish(o, tip=(0, 0, zr + 0.05))

def sendok_cochlear(name="SENDOK_ROMAWI", coll=None):
    """Roman cochlear: small round bowl (3 cm) on a long handle tapering to a sharp point; silver. 15 cm.
    +Z toward the POINT (used to pick snails); custom 'bowl' = bowl centre."""
    bm = bmesh.new()
    # handle from bowl junction (z=-0.04) to point (z=+0.085)
    path = [(0, 0, -0.04 + 0.125 * t) for t in [i / 30 for i in range(31)]]
    _sweep(bm, path, lambda t: 0.0024 * (1 - t) ** 0.9 + 0.00015, segs=10, flat=0.9)
    # offset step (Romans' cochlear handles step down into the bowl)
    _sweep(bm, [(0, 0.0, -0.04 - 0.008 * t) for t in [i / 6 for i in range(7)]], lambda t: 0.0024, segs=10, flat=0.7)
    # bowl: shallow spherical cap, opening toward +Y (up when the spoon lies flat)
    bc = Vector((0, -0.0, -0.064)); R = 0.016
    for j in range(9):
        for i in range(24):
            pass
    sph = bmesh.ops.create_uvsphere(bm, u_segments=28, v_segments=14, radius=R, matrix=Matrix.Translation(bc))
    cut = [v for v in sph["verts"] if v.co.y - bc.y > -0.004]       # keep only the lower part -> cap
    bmesh.ops.delete(bm, geom=cut, context="VERTS")
    capv = [v for v in bm.verts if (v.co - bc).length < R * 1.01 and v.co.y - bc.y <= -0.004]
    for v in capv: v.co.y = bc.y + (v.co.y - bc.y) * 0.45            # shallow
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    o = _new(name, bm, [SILVER()], subsurf=1, coll=coll)
    sol = o.modifiers.new("Tebal", "SOLIDIFY"); sol.thickness = 0.0012; o.modifiers.move(1, 0)
    o["bowl"] = list(bc)
    return _finish(o, tip=(0, 0, 0.085))

def sendok_garpu_eropa(coll=None):
    """17th-century pewter spoon (fig-shaped bowl) + two-tine fork carried by the sailor"""
    bm = bmesh.new()
    _sweep(bm, [(0, 0.0005 * math.sin(math.pi * t), -0.06 + 0.11 * t) for t in [i / 20 for i in range(21)]], lambda t: 0.0028 - 0.0008 * t, segs=8, flat=0.45)
    bc = Vector((0, 0.0, 0.075)); R = 0.024
    sph = bmesh.ops.create_uvsphere(bm, u_segments=28, v_segments=14, radius=R, matrix=Matrix.Translation(bc))
    bmesh.ops.delete(bm, geom=[v for v in sph["verts"] if v.co.y - bc.y > -0.006], context="VERTS")
    for v in [v for v in bm.verts if (v.co - bc).length < R * 1.01]:
        v.co.y = bc.y + (v.co.y - bc.y) * 0.5; v.co.z = bc.z + (v.co.z - bc.z) * 1.35   # fig shape: longer
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    pew = mat_metal("Timah_Putih", (0.62, 0.62, 0.6), 0.38, 0.12)
    s = _new("SENDOK_EROPA", bm, [pew], subsurf=1, coll=coll)
    s.modifiers.new("Tebal", "SOLIDIFY").thickness = 0.0015; s.modifiers.move(1, 0)
    _finish(s, tip=(0, 0, 0.095))
    f = garpu_coryat("GARPU_EROPA", coll)
    return s, f

def sumpit_perunggu(name="SUMPIT_PERUNGGU", length=0.24, coll=None):
    """pair of bronze chopsticks (square section at the top, round tapering tips). Returns ONE object (both sticks),
    origin at the middle of the upper third; +Z toward the tips."""
    bm = bmesh.new()
    for sx in (-1, 1):
        path = [(sx * (0.0045 - 0.0025 * t), 0, -length * 0.33 + length * t) for t in [i / 30 for i in range(31)]]
        _sweep(bm, path, lambda t: 0.0034 * (1 - 0.6 * t), segs=6 if True else 8, flat=1.0, twist=0.0)
    o = _new(name, bm, [BRONZE()], subsurf=1, coll=coll)
    return _finish(o, tip=(0, 0, length * 0.67))

# ------------------------------------------------------------------ prehistoric
def cangkang_kerang(name="CANGKANG_KERANG", coll=None):
    """clam valve 7.5 x 6.5 cm: oval dome with the umbo near the top edge, ~20 radial ribs, growth rings, a
    pearly inside. Origin at the umbo (hinge), +Z toward the lip, the hollow opens toward +Y."""
    bm = bmesh.new()
    s_ = bmesh.ops.create_uvsphere(bm, u_segments=72, v_segments=36, radius=1.0)
    bmesh.ops.delete(bm, geom=[v for v in s_["verts"] if v.co.y > 0.0001], context="VERTS")   # keep the -Y half (dome)
    for v in bm.verts:
        x, y, z = v.co
        # oval outline, hinge at top (z=+1) pulled in -> umbo
        X = x * 0.039; Zs = (1 - z) / 2                   # Zs: 0 at the umbo .. 1 at the far lip
        X *= 0.42 + 0.58 * math.sin(math.pi / 2 * min(1.0, Zs * 1.5))   # fan outline, narrow at the hinge
        Z = Zs * 0.066; Y = y * 0.015
        d = math.hypot(X, Z)
        ang = math.atan2(X, Z + 1e-6)
        rib = 0.0024 * abs(math.cos(12 * ang)) ** 0.6 * min(1, d / 0.012)
        ring = 0.0003 * math.sin(d * 1100) * min(1, d / 0.01)
        v.co = Vector((X, Y - rib - ring, Z))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bm.normal_update()
    flip = [f for f in bm.faces if f.normal.y > 0]          # outside of the dome faces -Y
    if flip: bmesh.ops.reverse_faces(bm, faces=flip)
    out_m = bpy.data.materials.get("Kerang_Luar")
    if not out_m:
        out_m = bpy.data.materials.new("Kerang_Luar"); out_m.use_nodes = True; nt = out_m.node_tree; b = _bsdf(out_m)
        tc = nt.nodes.new("ShaderNodeTexCoord"); w = nt.nodes.new("ShaderNodeTexWave"); w.wave_type = "RINGS"; w.inputs["Scale"].default_value = 60
        w.inputs["Distortion"].default_value = 0.8; w.inputs["Detail"].default_value = 3; w.inputs["Detail Scale"].default_value = 1
        mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Location"].default_value = (0, 0, 0)
        nt.links.new(tc.outputs["Object"], mp.inputs["Vector"]); nt.links.new(mp.outputs["Vector"], w.inputs["Vector"])
        ramp = nt.nodes.new("ShaderNodeValToRGB"); E = ramp.color_ramp.elements
        E[0].color = (0.4, 0.29, 0.2, 1); E[1].color = (0.6, 0.5, 0.39, 1); E[0].position = 0.3; E[1].position = 0.7
        nt.links.new(w.outputs["Fac"], ramp.inputs["Fac"]); nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.55
        nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 600
        bp = nt.nodes.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.3; bp.inputs["Distance"].default_value = 0.0002
        nt.links.new(tc.outputs["Object"], nz.inputs["Vector"]); nt.links.new(nz.outputs["Fac"], bp.inputs["Height"]); nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    in_m = bpy.data.materials.get("Kerang_Dalam")
    if not in_m:
        in_m = bpy.data.materials.new("Kerang_Dalam"); in_m.use_nodes = True; b = _bsdf(in_m)
        b.inputs["Base Color"].default_value = (0.86, 0.82, 0.8, 1); b.inputs["Roughness"].default_value = 0.18
        b.inputs["Coat Weight"].default_value = 0.6; b.inputs["Thin Film Thickness"].default_value = 420 if "Thin Film Thickness" in b.inputs else 0
    o = _new(name, bm, [out_m, in_m], subsurf=1, coll=coll)
    sol = o.modifiers.new("Tebal", "SOLIDIFY"); sol.thickness = 0.0022; sol.offset = -1; sol.material_offset = 1; sol.use_even_offset = True
    o.modifiers.move(1, 0)
    return _finish(o, tip=(0, -0.012, 0.066))

def serpihan_kayu(name="SERPIHAN_KAYU", coll=None):
    """a flat wooden scoop chip (12 cm): rough carved sliver, slightly concave end"""
    bm = bmesh.new()
    path = [(0, 0.004 * math.sin(math.pi * t * 0.8), -0.03 + 0.12 * t) for t in [i / 24 for i in range(25)]]
    _sweep(bm, path, lambda t: 0.006 + 0.01 * t ** 1.6, segs=10, flat=0.28)
    random.seed(4)
    for v in bm.verts: v.co += Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))) * 0.0006
    o = _new(name, bm, [mat_noise_color("Kayu_Serpih", (0.55, 0.4, 0.26), (0.36, 0.25, 0.15), scale=80, rough=0.8, bump=0.4)], smooth=True, subsurf=1, coll=coll)
    return _finish(o, tip=(0, 0.004, 0.09))

def mangkuk_batu(name="MANGKUK_BATU", coll=None, broth=True):
    """hand-ground stone bowl (Ø 22 cm), real rock texture, with an oily broth surface"""
    bm = bmesh.new()
    prof = [(0.001, 0.0), (0.07, 0.002), (0.105, 0.03), (0.115, 0.07), (0.11, 0.085), (0.095, 0.083), (0.088, 0.05), (0.06, 0.03), (0.001, 0.028)]
    _lathe(bm, prof, segs=48)
    for v in bm.verts:
        n = noise.noise(v.co * 25) * 0.006 + noise.noise(v.co * 80) * 0.0015
        d = Vector((v.co.x, v.co.y, 0))
        if d.length > 1e-4: v.co += d.normalized() * n
        v.co.z += n * 0.4
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    o = _new(name, bm, [mat_ph("Batu_Mangkuk", "rock_boulder_dry", scale=0.25, tint=(0.8, 0.78, 0.74))], subsurf=1, coll=coll)
    if broth:
        bm2 = bmesh.new(); bmesh.ops.create_circle(bm2, cap_ends=True, segments=48, radius=0.085, matrix=Matrix.Translation((0, 0, 0.062)))
        k = bpy.data.materials.get("Kuah")
        if not k:
            k = bpy.data.materials.new("Kuah"); k.use_nodes = True; nt = k.node_tree; b = _bsdf(k)
            b.inputs["Base Color"].default_value = (0.2, 0.11, 0.04, 1); b.inputs["Roughness"].default_value = 0.04
            tc = nt.nodes.new("ShaderNodeTexCoord"); vo = nt.nodes.new("ShaderNodeTexVoronoi"); vo.inputs["Scale"].default_value = 90
            bp = nt.nodes.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.15; bp.inputs["Distance"].default_value = 0.0005
            nt.links.new(tc.outputs["Object"], vo.inputs["Vector"]); nt.links.new(vo.outputs["Distance"], bp.inputs["Height"]); nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
        b_ = _new(name + "_KUAH", bm2, [k], coll=coll); b_.parent = o
    return o

def daging_bakar(name="DAGING_BAKAR", coll=None):
    """fire-roasted haunch on the bone (25 cm): irregular torn meat, charred crust with glossy fat, bone ends"""
    bm = bmesh.new()
    _sweep(bm, [(0, 0, -0.12 + 0.24 * t) for t in [i / 16 for i in range(17)]], lambda t: 0.01 + 0.006 * (abs(t - 0.5) * 2) ** 4, segs=12)
    for z in (-0.125, 0.125):
        for sx in (-1, 1): bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=0.0085, matrix=Matrix.Translation((sx * 0.005, sx * 0.002, z)))
    bone_faces = set(bm.faces)
    s_ = bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=24, radius=0.05, matrix=Matrix.Translation((0, 0, 0.01)))
    for v in s_["verts"]:
        p = v.co - Vector((0, 0, 0.01)); p.z *= 1.7; p.x *= 1.15
        n = noise.noise(p * 22 + Vector((3, 1, 2))) * 0.012 + noise.noise(p * 70) * 0.004 + noise.noise(p * 200) * 0.001
        p = p + p.normalized() * n if p.length > 1e-4 else p
        v.co = p + Vector((0, 0, 0.01))
    for f in bm.faces: f.material_index = 0 if f in bone_faces else 1
    meat = bpy.data.materials.get("Daging_Panggang")
    if not meat:
        meat = bpy.data.materials.new("Daging_Panggang"); meat.use_nodes = True; nt = meat.node_tree; b = _bsdf(meat)
        tc = nt.nodes.new("ShaderNodeTexCoord"); nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 45; nz.inputs["Detail"].default_value = 14
        nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
        ramp = nt.nodes.new("ShaderNodeValToRGB"); E = ramp.color_ramp.elements
        E[0].position = 0.35; E[0].color = (0.03, 0.02, 0.015, 1)    # char
        E[1].position = 0.7; E[1].color = (0.42, 0.18, 0.07, 1)      # roasted
        e = E.new(0.52); e.color = (0.2, 0.08, 0.03, 1)
        nt.links.new(nz.outputs["Fac"], ramp.inputs["Fac"]); nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
        rr = nt.nodes.new("ShaderNodeMapRange"); rr.inputs["To Min"].default_value = 0.65; rr.inputs["To Max"].default_value = 0.18
        nt.links.new(nz.outputs["Fac"], rr.inputs["Value"]); nt.links.new(rr.outputs["Result"], b.inputs["Roughness"])
        b.inputs["Subsurface Weight"].default_value = 0.1; b.inputs["Subsurface Radius"].default_value = (0.4, 0.1, 0.05)
        nz2 = nt.nodes.new("ShaderNodeTexNoise"); nz2.inputs["Scale"].default_value = 260
        bp = nt.nodes.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.5; bp.inputs["Distance"].default_value = 0.001
        nt.links.new(tc.outputs["Object"], nz2.inputs["Vector"]); nt.links.new(nz2.outputs["Fac"], bp.inputs["Height"]); nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    o = _new(name, bm, [mat_noise_color("Tulang_Mentah", (0.84, 0.78, 0.64), (0.62, 0.55, 0.42), scale=60, rough=0.55, bump=0.15), meat], subsurf=1, coll=coll)
    return _finish(o, tip=(0, 0, 0.09))

# ------------------------------------------------------------------ Roman snails
def siput(name="SIPUT", coll=None, body_out=0.0):
    """escargot (Helix): conical spiral shell ~3.6 cm, whorls stacked toward a raised apex, aperture opening
    sideways; snail body emerges by body_out (0..1). Shell base on z=0."""
    bm = bmesh.new()
    turns = 4.2; steps = 160; segs = 18
    W = 0.0155                                         # radius of the last whorl's centre line
    k = math.log(0.12) / (2 * math.pi * turns)         # whorl radius shrinks to 12 % at the apex
    rings = []
    for st in range(steps + 1):
        t = st / steps; a = 2 * math.pi * turns * (t - 1)      # a: -2pi*turns (apex) .. 0 (aperture)
        g = math.exp(-k * a) if False else math.exp(k * -a)    # growth factor 0.12 .. 1
        g = math.exp(-k * a)
        g = 0.12 ** (-a / (2 * math.pi * turns))
        R = W * g; r = R * 0.78
        z = 0.03 * (1 - g) + 0.011                       # apex up
        c = Vector((math.cos(a) * R, math.sin(a) * R, z))
        out = Vector((math.cos(a), math.sin(a), 0)); up = Vector((0, 0, 1))
        ring = [bm.verts.new(c + (out * math.cos(2 * math.pi * i / segs) + up * math.sin(2 * math.pi * i / segs) * 0.95) * r) for i in range(segs)]
        rings.append(ring)
    for st in range(steps):
        for i in range(segs):
            j = (i + 1) % segs
            bm.faces.new((rings[st][i], rings[st][j], rings[st + 1][j], rings[st + 1][i]))
    ap = bm.verts.new(sum((v.co for v in rings[0]), Vector()) / segs)
    for i in range(segs): bm.faces.new((rings[0][(i + 1) % segs], rings[0][i], ap))
    shell_faces = set(bm.faces)
    end = sum((v.co for v in rings[-1]), Vector()) / segs
    tangent = Vector((0, 1, 0))                          # the aperture faces +Y at a = 0
    if body_out > 0:
        path = [end + tangent * (0.002 + 0.03 * body_out * t) + Vector((0, 0, -0.004 * t)) for t in [i / 12 for i in range(13)]]
        _sweep(bm, [tuple(p) for p in path], lambda t: W * 0.62 * (1 - 0.5 * t ** 1.5), segs=14, flat=0.62)
        # two tentacles
        tip = Vector(path[-1])
        for sx in (-1, 1):
            _sweep(bm, [tuple(tip + Vector((sx * 0.004 * t, 0.006 * t, 0.009 * t))) for t in [i / 6 for i in range(7)]], lambda t: 0.0014 * (1 - 0.5 * t), segs=8)
    for f in bm.faces: f.material_index = 0 if f in shell_faces else 1
    shell = bpy.data.materials.get("Cangkang_Siput")
    if not shell:
        shell = bpy.data.materials.new("Cangkang_Siput"); shell.use_nodes = True; nt = shell.node_tree; b = _bsdf(shell)
        tc = nt.nodes.new("ShaderNodeTexCoord"); w = nt.nodes.new("ShaderNodeTexWave"); w.wave_type = "BANDS"; w.bands_direction = "Z"; w.inputs["Scale"].default_value = 140
        w.inputs["Distortion"].default_value = 3.0; w.inputs["Detail"].default_value = 3
        nt.links.new(tc.outputs["Object"], w.inputs["Vector"])
        ramp = nt.nodes.new("ShaderNodeValToRGB"); E = ramp.color_ramp.elements; E[0].color = (0.3, 0.19, 0.1, 1); E[1].color = (0.52, 0.4, 0.25, 1); E[0].position = 0.2; E[1].position = 0.85
        nt.links.new(w.outputs["Fac"], ramp.inputs["Fac"]); nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.32; b.inputs["Coat Weight"].default_value = 0.3
        nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 900
        bp = nt.nodes.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.2; bp.inputs["Distance"].default_value = 0.0002
        nt.links.new(tc.outputs["Object"], nz.inputs["Vector"]); nt.links.new(nz.outputs["Fac"], bp.inputs["Height"]); nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    body = mat_noise_color("Badan_Siput", (0.34, 0.27, 0.2), (0.18, 0.14, 0.1), scale=900, rough=0.2, bump=0.5, sss=0.25)
    o = _new(name, bm, [shell, body], subsurf=1, coll=coll)
    o["mulut"] = list(end)
    return o

# ------------------------------------------------------------------ China
def ding(name="DING_PERUNGGU", coll=None, liquid=True):
    """bronze ding: round cauldron Ø 42 cm, three legs, two upright loop handles, raised band of decoration"""
    bm = bmesh.new()
    prof = [(0.001, 0.12), (0.12, 0.125), (0.19, 0.17), (0.215, 0.24), (0.218, 0.33), (0.23, 0.345), (0.225, 0.36),
            (0.205, 0.355), (0.2, 0.33), (0.197, 0.24), (0.175, 0.175), (0.11, 0.14), (0.001, 0.135)]
    _lathe(bm, prof, segs=64)
    # decorative band (bumps)
    for i in range(24):
        a = 2 * math.pi * i / 24
        bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Translation((math.cos(a) * 0.219, math.sin(a) * 0.219, 0.3)) @ Matrix.Rotation(a, 4, "Z") @ Matrix.Diagonal((0.012, 0.03, 0.03, 1)))
    # legs
    for i in range(3):
        a = 2 * math.pi * i / 3 + math.pi / 6
        _sweep(bm, [(math.cos(a) * (0.13 + 0.015 * t), math.sin(a) * (0.13 + 0.015 * t), 0.16 - 0.16 * t) for t in [k / 10 for k in range(11)]],
               lambda t: 0.026 - 0.008 * t + 0.006 * (t > 0.85), segs=14)
    # handles: upright loops on the rim
    for sx in (-1, 1):
        path = [(sx * 0.19, 0.06 * math.cos(math.pi * t), 0.35 + 0.1 * math.sin(math.pi * t)) for t in [k / 16 for k in range(17)]]
        _sweep(bm, path, lambda t: 0.014, segs=10, flat=0.6, cap=True)
    o = _new(name, bm, [BRONZE()], subsurf=1, coll=coll)
    if liquid:
        bm2 = bmesh.new(); bmesh.ops.create_circle(bm2, cap_ends=True, segments=64, radius=0.198, matrix=Matrix.Translation((0, 0, 0.31)))
        lq = _new(name + "_SUP", bm2, [mat_noise_color("Sup_Kaldu", (0.42, 0.28, 0.12), (0.3, 0.18, 0.08), scale=10, rough=0.06, bump=0.05)], coll=coll)
        lq.parent = o
    return o

# ------------------------------------------------------------------ table ware & food
def piring(name="PIRING", radius=0.13, mat=None, coll=None):
    bm = bmesh.new()
    r = radius
    prof = [(0.001, 0.0), (r * 0.55, 0.0), (r * 0.6, 0.004), (r * 0.75, 0.006), (r * 0.98, 0.018), (r, 0.02), (r * 0.97, 0.021), (r * 0.73, 0.009), (r * 0.58, 0.007), (0.001, 0.006)]
    _lathe(bm, prof, segs=64)
    return _new(name, bm, [mat or SILVER()], subsurf=1, coll=coll)

def _butir_beras(coll=None):
    o = bpy.data.objects.get("BUTIR_BERAS")
    if o: return o
    bm = bmesh.new(); s_ = bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=1)
    for v in s_["verts"]: v.co = Vector((v.co.x * 0.0011, v.co.y * 0.0012, v.co.z * 0.0029))
    rm = bpy.data.materials.get("Nasi")
    if not rm:
        rm = bpy.data.materials.new("Nasi"); rm.use_nodes = True; b = _bsdf(rm)
        b.inputs["Base Color"].default_value = (0.93, 0.92, 0.88, 1); b.inputs["Roughness"].default_value = 0.35
        b.inputs["Subsurface Weight"].default_value = 0.5; b.inputs["Subsurface Radius"].default_value = (0.002, 0.002, 0.0018)
        b.inputs["Coat Weight"].default_value = 0.15
    o = _new("BUTIR_BERAS", bm, [rm], coll=coll); o.hide_render = True; o.hide_viewport = True
    return o

def gundukan_nasi(name, radius=0.07, height=0.6, coll=None):
    """a mound of cooked rice: core mesh + scattered grains (geometry nodes)"""
    bm = bmesh.new(); s_ = bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=20, radius=radius)
    for v in s_["verts"]:
        v.co.z = max(0.0, v.co.z) * height
        if v.co.length > 1e-4: v.co += v.co.normalized() * noise.noise(v.co * 40) * radius * 0.08
    core = _new(name, bm, [bpy.data.materials.get("Nasi") or _butir_beras(coll).data.materials[0]], coll=coll)
    grain = _butir_beras(coll)
    scatter_grains(core, grain, count=int(9000 * (radius / 0.07) ** 2), seed=hash(name) % 97, name="BUTIR")
    return core

def nasi_di_daun(name="NASI_DAUN", coll=None):
    """banana leaf (46x30 cm) with a mound of rice (real grains), fried fish and sambal (Nusantara meal)"""
    bm = bmesh.new(); nu, nv = 40, 20
    grid = []
    for j in range(nv + 1):
        v = j / nv; row = []
        for i in range(nu + 1):
            u = i / nu
            x = (u - 0.5) * 0.46; y = (v - 0.5) * 0.3 * (1 - 0.15 * abs(u - 0.5) * 2)
            z = 0.004 + 0.012 * (abs(v - 0.5) * 2) ** 2 + 0.0015 * (1 + math.sin(u * 40))
            row.append(bm.verts.new((x, y, z)))
        grid.append(row)
    for j in range(nv):
        for i in range(nu):
            bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
    leaf = _new(name, bm, [], coll=coll)
    m = bpy.data.materials.get("Daun_Pisang")
    if not m:
        m = bpy.data.materials.new("Daun_Pisang"); m.use_nodes = True; nt = m.node_tree; b = _bsdf(m)
        tc = nt.nodes.new("ShaderNodeTexCoord"); w = nt.nodes.new("ShaderNodeTexWave"); w.wave_type = "BANDS"; w.bands_direction = "Y"
        w.inputs["Scale"].default_value = 140; w.inputs["Distortion"].default_value = 0.3
        nt.links.new(tc.outputs["Object"], w.inputs["Vector"])
        nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 8
        nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
        mixc = nt.nodes.new("ShaderNodeMix"); mixc.data_type = "RGBA"; mixc.inputs[6].default_value = (0.02, 0.09, 0.01, 1); mixc.inputs[7].default_value = (0.05, 0.17, 0.02, 1)
        nt.links.new(nz.outputs["Fac"], mixc.inputs["Factor"])
        mix2 = nt.nodes.new("ShaderNodeMix"); mix2.data_type = "RGBA"; mix2.inputs["Factor"].default_value = 0.08
        nt.links.new(mixc.outputs[2], mix2.inputs[6]); nt.links.new(w.outputs["Color"], mix2.inputs[7]); nt.links.new(mix2.outputs[2], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.28; b.inputs["Coat Weight"].default_value = 0.4; b.inputs["Coat Roughness"].default_value = 0.2
        bp = nt.nodes.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.1; bp.inputs["Distance"].default_value = 0.0003
        nt.links.new(w.outputs["Fac"], bp.inputs["Height"]); nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    leaf.data.materials.append(m)
    leaf.modifiers.new("Tebal", "SOLIDIFY").thickness = 0.0008
    rice = gundukan_nasi(name + "_NASI", 0.07, 0.62, coll); rice.location = (-0.05, 0, 0.012); rice.parent = leaf
    fish = ikan_goreng(name + "_IKAN", coll); fish.location = (0.1, 0.02, 0.016); fish.rotation_euler = (math.radians(90), 0, math.radians(-15)); fish.parent = leaf
    bm = bmesh.new(); s_ = bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=12, radius=0.022)
    for v in s_["verts"]:
        v.co.z = max(0.0, v.co.z) * 0.45
        if v.co.length > 1e-4: v.co += v.co.normalized() * noise.noise(v.co * 160) * 0.002
    sb = _new(name + "_SAMBAL", bm, [mat_noise_color("Sambal", (0.5, 0.05, 0.02), (0.22, 0.02, 0.01), scale=200, rough=0.15, bump=0.6)], subsurf=1, coll=coll)
    sb.location = (0.04, -0.085, 0.012); sb.parent = leaf
    return leaf

def ikan_goreng(name="IKAN_GORENG", coll=None):
    """whole fried fish 16 cm lying on its side: deep flat body, blunt head with an eye, forked tail, crisp scaly
    golden-brown skin. Built upright (height along Z), then laid down (rotation X 90)."""
    bm = bmesh.new()
    path = [(-0.07 + 0.13 * t, 0, 0.0) for t in [i / 30 for i in range(31)]]
    def prof(t): return 0.004 + 0.03 * math.sin(math.pi * (0.06 + 0.7 * t)) ** 0.9 * (1 - 0.25 * t ** 3)
    _sweep(bm, path, prof, segs=20, flat=0.3)
    for v in bm.verts:   # flatter belly, rounder back
        if v.co.z < 0: v.co.z *= 0.85
    body_faces = set(bm.faces)
    # tail: two lobes, as thin plates
    for sz in (-1, 1):
        pts = [(-0.068, 0, 0.0), (-0.1, 0, sz * 0.032), (-0.096, 0, sz * 0.012), (-0.088, 0, 0.0)]
        bm.faces.new([bm.verts.new(p) for p in pts])
    # dorsal fin
    bm.faces.new([bm.verts.new(p) for p in ((-0.02, 0, 0.028), (0.02, 0, 0.033), (0.03, 0, 0.026), (-0.03, 0, 0.022))])
    # eye
    for sy in (-1, 1):
        bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=0.0042, matrix=Matrix.Translation((0.048, sy * 0.0085, 0.006)))
    for f in bm.faces: f.material_index = 0 if (f in body_faces or len(f.verts) == 4) else 1
    for f in bm.faces:
        if f not in body_faces and len(f.verts) > 4: f.material_index = 1
    skin = bpy.data.materials.get("Ikan_Goreng")
    if not skin:
        skin = bpy.data.materials.new("Ikan_Goreng"); skin.use_nodes = True; nt = skin.node_tree; b = _bsdf(skin)
        tc = nt.nodes.new("ShaderNodeTexCoord"); nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 60; nz.inputs["Detail"].default_value = 8
        nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
        ramp = nt.nodes.new("ShaderNodeValToRGB"); E = ramp.color_ramp.elements
        E[0].color = (0.08, 0.035, 0.01, 1); E[1].color = (0.6, 0.33, 0.1, 1); E[0].position = 0.35; E[1].position = 0.7
        nt.links.new(nz.outputs["Fac"], ramp.inputs["Fac"]); nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.3; b.inputs["Coat Weight"].default_value = 0.35
        vo = nt.nodes.new("ShaderNodeTexVoronoi"); vo.inputs["Scale"].default_value = 450
        bp = nt.nodes.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.35; bp.inputs["Distance"].default_value = 0.0004
        nt.links.new(tc.outputs["Object"], vo.inputs["Vector"]); nt.links.new(vo.outputs["Distance"], bp.inputs["Height"]); nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    eye = mat_simple("Mata_Ikan", (0.85, 0.82, 0.75), rough=0.2)
    o = _new(name, bm, [skin, eye], subsurf=1, coll=coll)
    o.rotation_euler = (math.radians(90), 0, 0)
    return o

def lilin(name="LILIN", height=0.2, coll=None, lit=True):
    """beeswax candle with a flame (emissive teardrop) and a small point light"""
    bm = bmesh.new()
    prof = [(0.001, 0), (0.012, 0), (0.012, height - 0.006), (0.011, height), (0.003, height - 0.003), (0.001, height - 0.004)]
    _lathe(bm, prof, segs=24)
    o = _new(name, bm, [mat_simple("Lilin_Lebah", (0.85, 0.72, 0.45), rough=0.5, sss=0.4)], subsurf=1, coll=coll)
    if lit:
        bm = bmesh.new()
        s = bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=0.006)
        for v in s["verts"]:
            if v.co.z > 0: v.co.z *= 3.2; v.co.x *= 1 - v.co.z / 0.03; v.co.y *= 1 - v.co.z / 0.03
        fl = _new(name + "_API", bm, [mat_simple("Api_Lilin", (1, 0.6, 0.2), rough=1, emit=(1.0, 0.55, 0.18), emit_strength=60)], coll=coll)
        fl.location = (0, 0, height + 0.012); fl.parent = o
        ld = bpy.data.lights.new(name + "_CAHAYA", "POINT"); ld.energy = 4; ld.color = (1.0, 0.62, 0.3); ld.shadow_soft_size = 0.01
        lo = bpy.data.objects.new(name + "_CAHAYA", ld); (coll or bpy.context.scene.collection).objects.link(lo)
        lo.location = (0, 0, height + 0.02); lo.parent = o
    return o

def kotak_garpu(name="KOTAK_GARPU", coll=None):
    """Coryat's small leather fork case (22 x 3.5 x 2 cm) with a lid"""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Diagonal((0.035, 0.02, 0.22, 1)))
    o = _new(name, bm, [mat_noise_color("Kulit_Kotak", (0.3, 0.16, 0.08), (0.18, 0.09, 0.04), scale=90, rough=0.5, bump=0.25)], smooth=False, coll=coll)
    b = o.modifiers.new("Bevel", "BEVEL"); b.width = 0.003; b.segments = 3
    return o

def nasi_piring_modern(name="PIRING_NASI", coll=None):
    """modern dinner: white ceramic plate with rice (real grains), a piece of fried chicken and a few vegetables"""
    plate = piring(name, 0.14, mat_simple("Keramik_Putih", (0.9, 0.9, 0.88), rough=0.15), coll)
    rice = gundukan_nasi(name + "_NASI", 0.06, 0.6, coll); rice.location = (-0.03, 0.01, 0.007); rice.parent = plate
    bm = bmesh.new(); s_ = bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=0.04)
    for v in s_["verts"]:
        v.co.x *= 1.35; v.co.z = max(-0.004, v.co.z) * 0.65
        if v.co.length > 1e-4: v.co += v.co.normalized() * (noise.noise(v.co * 60) * 0.005 + noise.noise(v.co * 200) * 0.0015)
    ay = _new(name + "_AYAM", bm, [mat_noise_color("Ayam_Goreng_Renyah", (0.42, 0.2, 0.05), (0.14, 0.06, 0.015), scale=90, rough=0.32, bump=0.9)], subsurf=1, coll=coll)
    ay.location = (0.06, -0.025, 0.02); ay.parent = plate
    for k in range(5):   # cucumber slices
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=20, radius1=0.016, radius2=0.016, depth=0.004)
        cu = _new(f"{name}_TIMUN{k}", bm, [mat_noise_color("Timun", (0.75, 0.82, 0.55), (0.2, 0.4, 0.1), scale=120, rough=0.3, bump=0.1, sss=0.2)], coll=coll)
        cu.location = (0.03 + k * 0.012, 0.06 + (k % 2) * 0.008, 0.012 + k * 0.001); cu.rotation_euler = (0.15, 0.1 * k, 0); cu.parent = plate
    return plate

def sendok_modern(name="SENDOK_MODERN", coll=None):
    """stainless table spoon, 19.5 cm. Origin at the grip, +Z toward the bowl."""
    bm = bmesh.new()
    _sweep(bm, [(0, 0.004 * math.sin(math.pi * t), -0.075 + 0.11 * t) for t in [i / 24 for i in range(25)]],
           lambda t: 0.0055 - 0.0035 * math.sin(math.pi * t * 0.9) ** 2 + 0.001 * (t < 0.15), segs=10, flat=0.25)
    bc = Vector((0, 0.004, 0.072)); R = 0.024
    sph = bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=R, matrix=Matrix.Translation(bc))
    bmesh.ops.delete(bm, geom=[v for v in sph["verts"] if v.co.y - bc.y > -0.005], context="VERTS")
    for v in [v for v in bm.verts if (v.co - bc).length < R * 1.01]:
        v.co.y = bc.y + (v.co.y - bc.y) * 0.45; v.co.z = bc.z + (v.co.z - bc.z) * 1.45; v.co.x *= 0.92
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    o = _new(name, bm, [STEEL()], subsurf=1, coll=coll); o.modifiers.new("Tebal", "SOLIDIFY").thickness = 0.0013; o.modifiers.move(1, 0)
    return _finish(o, tip=(0, 0.004, 0.1))

def garpu_modern(name="GARPU_MODERN", coll=None):
    """stainless table fork, 4 tines, 19.5 cm"""
    bm = bmesh.new()
    _sweep(bm, [(0, 0.004 * math.sin(math.pi * t), -0.075 + 0.105 * t) for t in [i / 24 for i in range(25)]],
           lambda t: 0.0055 - 0.0035 * math.sin(math.pi * t * 0.9) ** 2 + 0.001 * (t < 0.15), segs=10, flat=0.25)
    _sweep(bm, [(0, 0.004, 0.03 + 0.022 * t) for t in [i / 8 for i in range(9)]], lambda t: 0.004 + 0.008 * t, segs=10, flat=0.22)
    for k in range(4):
        x = (k - 1.5) * 0.0062
        _sweep(bm, [(x, 0.004 + 0.003 * t * t, 0.052 + 0.04 * t) for t in [i / 10 for i in range(11)]], lambda t: 0.0016 * (1 - 0.6 * t), segs=6, flat=0.7)
    o = _new(name, bm, [STEEL()], subsurf=1, coll=coll)
    return _finish(o, tip=(0, 0.006, 0.092))

def gelas_air(name="GELAS", coll=None):
    bm = bmesh.new()
    prof = [(0.001, 0), (0.032, 0), (0.036, 0.11), (0.034, 0.11), (0.03, 0.004), (0.001, 0.004)]
    _lathe(bm, prof, segs=48)
    o = _new(name, bm, [mat_simple("Kaca", (0.95, 0.97, 0.96), rough=0.02, transmission=1.0, ior=1.5)], subsurf=1, coll=coll)
    bm2 = bmesh.new(); _lathe(bm2, [(0.001, 0.006), (0.0298, 0.006), (0.033, 0.085), (0.001, 0.085)], segs=48)
    w = _new(name + "_AIR", bm2, [mat_simple("Air", (0.92, 0.96, 0.98), rough=0.0, transmission=1.0, ior=1.33)], coll=coll); w.parent = o
    return o

def pohon_kelapa(name="KELAPA", height=8.0, lean=0.12, seed=1, coll=None):
    """coconut palm: slender curved ringed trunk, crown of ~16 arching pinnate fronds with drooping leaflets,
    a cluster of coconuts. Real-world size; origin at the base."""
    rnd = random.Random(seed)
    bm = bmesh.new()
    ang = rnd.uniform(0, 6.28); d = Vector((math.cos(ang), math.sin(ang), 0))
    path = []
    for i in range(41):
        t = i / 40
        p = d * (lean * height * (t ** 1.6)) + Vector((0, 0, height * t))
        path.append(tuple(p))
    _sweep(bm, path, lambda t: 0.2 * (1 - 0.35 * t) + 0.05 * (t < 0.05), segs=16)
    trunk_faces = set(bm.faces)
    top = Vector(path[-1])
    # fronds
    nf = 16
    for k in range(nf):
        a = 2 * math.pi * k / nf + rnd.uniform(-0.15, 0.15)
        dirv = Vector((math.cos(a), math.sin(a), 0))
        up0 = rnd.uniform(0.25, 0.9)              # initial elevation
        L = rnd.uniform(3.6, 4.6)
        mid = []
        for i in range(25):
            t = i / 24
            p = top + dirv * (L * t) + Vector((0, 0, L * (up0 * t - 0.75 * t * t)))
            mid.append(p)
        _sweep(bm, [tuple(p) for p in mid], lambda t: 0.035 * (1 - 0.8 * t), segs=5)
        side = dirv.cross(Vector((0, 0, 1))).normalized()
        for i in range(3, 24):
            t = i / 24; p = mid[i]
            ll = 0.75 * math.sin(math.pi * min(1, t * 1.15)) + 0.15
            for sg in (-1, 1):
                tipp = p + side * sg * ll + Vector((0, 0, -ll * 0.55)) + dirv * 0.12
                w = 0.045 * (1 - 0.5 * t)
                v1 = bm.verts.new(p + dirv * w); v2 = bm.verts.new(p - dirv * w); v3 = bm.verts.new(tipp)
                f = bm.faces.new((v1, v2, v3)); f.material_index = 1
    # coconuts
    for k in range(7):
        a = 2 * math.pi * k / 7
        c = top + Vector((math.cos(a) * 0.22, math.sin(a) * 0.22, -0.35 - 0.1 * (k % 2)))
        s_ = bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=0.13, matrix=Matrix.Translation(c))
        for f in bm.faces:
            if all(v in s_["verts"] for v in f.verts): f.material_index = 2
    for f in bm.faces:
        if f in trunk_faces: f.material_index = 0
    trunk_m = bpy.data.materials.get("Batang_Kelapa")
    if not trunk_m:
        trunk_m = bpy.data.materials.new("Batang_Kelapa"); trunk_m.use_nodes = True; nt = trunk_m.node_tree; b = _bsdf(trunk_m)
        tc = nt.nodes.new("ShaderNodeTexCoord"); w = nt.nodes.new("ShaderNodeTexWave"); w.wave_type = "BANDS"; w.bands_direction = "Z"
        w.inputs["Scale"].default_value = 0.9; w.inputs["Distortion"].default_value = 1.5
        nt.links.new(tc.outputs["Object"], w.inputs["Vector"])
        ramp = nt.nodes.new("ShaderNodeValToRGB"); E = ramp.color_ramp.elements; E[0].color = (0.16, 0.13, 0.1, 1); E[1].color = (0.42, 0.38, 0.32, 1)
        nt.links.new(w.outputs["Fac"], ramp.inputs["Fac"]); nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"]); b.inputs["Roughness"].default_value = 0.9
        bp = nt.nodes.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.6; nt.links.new(w.outputs["Fac"], bp.inputs["Height"]); nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    leaf_m = bpy.data.materials.get("Daun_Kelapa")
    if not leaf_m:
        leaf_m = bpy.data.materials.new("Daun_Kelapa"); leaf_m.use_nodes = True; nt = leaf_m.node_tree; b = _bsdf(leaf_m)
        tc = nt.nodes.new("ShaderNodeTexCoord"); nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 3
        nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
        mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.inputs[6].default_value = (0.08, 0.2, 0.03, 1); mx.inputs[7].default_value = (0.25, 0.32, 0.08, 1)
        nt.links.new(nz.outputs["Fac"], mx.inputs["Factor"]); nt.links.new(mx.outputs[2], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.45; b.inputs["Subsurface Weight"].default_value = 0.0
        b.inputs["Transmission Weight"].default_value = 0.15
    nut_m = mat_noise_color("Buah_Kelapa", (0.35, 0.42, 0.1), (0.2, 0.26, 0.06), scale=30, rough=0.5, bump=0.1)
    o = _new(name, bm, [trunk_m, leaf_m, nut_m], coll=coll)
    for p in o.data.polygons: p.use_smooth = p.material_index != 1
    return o

def mitra(name="MITRA", head_width=0.17, coll=None):
    """bishop's mitre: front and back plates rising to pointed arches, close together and joined at the sides by
    fabric over the lower part; white silk with gold orphrey bands and a gold circlet. Origin at the band centre."""
    bm = bmesh.new()
    W = head_width * 0.56; H = 0.30; D = head_width * 0.66   # half width, height, half depth at the band (head is deeper than wide)
    S = 0.5                                                 # where the straight, slightly flaring sides turn into the arch
    def half(t):
        if t < S: return W * (1 + 0.06 * t / S)
        u = (t - S) / (1 - S); return W * 1.06 * max(0.004, 1 - u ** 1.7)   # full gothic arch ending in a point
    def dep(t): return D * max(0.06, 1 - 0.9 * max(0.0, (t - 0.12) / 0.88) ** 1.2)   # front/back plates stay upright, then meet
    rows = []
    nu, nv = 32, 24
    for j in range(nv + 1):
        t = j / nv; z = H * t; row = []
        for i in range(nu):
            a_ = 2 * math.pi * i / nu
            sa, ca = math.sin(a_), math.cos(a_)
            x = math.copysign(abs(sa) ** 0.7, sa) * half(t)                       # squarer plan: flat front and back plates
            y = math.copysign(abs(ca) ** 0.5, ca) * dep(t)
            if t > S and abs(sa) > 0.92: y *= 0.2                                  # side cleft above the closed part
            row.append(bm.verts.new((x, y, z)))
        rows.append(row)
    for j in range(nv):
        for i in range(nu):
            k = (i + 1) % nu
            bm.faces.new((rows[j][i], rows[j][k], rows[j + 1][k], rows[j + 1][i]))
    silk = mat_simple("Sutra_Putih", (0.92, 0.9, 0.84), rough=0.35)
    o = _new(name, bm, [silk], coll=coll)
    o.modifiers.new("Tebal", "SOLIDIFY").thickness = 0.003
    s_ = o.modifiers.new("Halus", "SUBSURF"); s_.levels = s_.render_levels = 1
    gold = mat_simple("Bordir_Emas", (0.85, 0.62, 0.2), rough=0.35, metal=0.8)
    def front_y(x, t):   # the plate surface at height t and across-offset x (same superellipse as the shell)
        hw = half(t); sa = min(1.0, abs(x) / hw) ** (1 / 0.7); ca = math.sqrt(max(0.0, 1 - sa * sa))
        return ca ** 0.5 * dep(t)
    for sy in (-1, 1):   # vertical orphrey on the front and the back: a flat strip lying on the plate
        bm2 = bmesh.new(); nt, nx = 22, 4; grid = []
        for j in range(nt + 1):
            t = 0.07 + (0.9 - 0.07) * j / nt; hw = min(0.017, half(t) * 0.45); row = []
            for i in range(nx + 1):
                x = -hw + 2 * hw * i / nx
                row.append(bm2.verts.new((x, sy * (front_y(x, t) + 0.0025), H * t)))
            grid.append(row)
        for j in range(nt):
            for i in range(nx):
                f = (grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i])
                bm2.faces.new(f if sy > 0 else f[::-1])
        b2 = _new(f"{name}_PITA_{sy}", bm2, [gold], coll=coll); b2.parent = o
        b2.modifiers.new("Tebal", "SOLIDIFY").thickness = 0.0015
    bm3 = bmesh.new()
    def ring_pt(i, z):
        sa, ca = math.sin(2 * math.pi * i / 48), math.cos(2 * math.pi * i / 48)
        return (math.copysign(abs(sa) ** 0.7, sa) * (W + 0.003), math.copysign(abs(ca) ** 0.5, ca) * (D + 0.003), z)
    rr = [bm3.verts.new(ring_pt(i, 0.0)) for i in range(48)]
    rr2 = [bm3.verts.new(ring_pt(i, 0.032)) for i in range(48)]
    for i in range(48): bm3.faces.new((rr[i], rr[(i + 1) % 48], rr2[(i + 1) % 48], rr2[i]))
    b3 = _new(f"{name}_LINGKAR", bm3, [gold], coll=coll); b3.parent = o
    b3.modifiers.new("Tebal", "SOLIDIFY").thickness = 0.003
    o["band_W"], o["band_D"], o["band_px"], o["band_py"] = W, D, 0.7, 0.5   # inner band shape, for seating on the head
    return o

def topi_tinggi(name="TOPI_CORYAT", head_width=0.17, coll=None):
    """Jacobean 'capotain' hat: tall slightly tapering crown, narrow brim, black felt, a plain band"""
    bm = bmesh.new()
    r0 = head_width * 0.6
    prof = [(r0 + 0.045, 0.0), (r0 + 0.05, 0.006), (r0 + 0.002, 0.008), (r0, 0.03), (r0 * 0.9, 0.17), (r0 * 0.84, 0.19), (0.001, 0.195)]
    _lathe(bm, prof, segs=48)
    felt = mat_noise_color("Laken_Hitam", (0.05, 0.045, 0.04), (0.02, 0.018, 0.016), scale=300, rough=0.85, bump=0.15)
    o = _new(name, bm, [felt], subsurf=1, coll=coll)
    o.modifiers.new("Tebal", "SOLIDIFY").thickness = 0.003
    bm2 = bmesh.new(); bmesh.ops.create_cone(bm2, cap_ends=False, segments=48, radius1=r0 * 0.985, radius2=r0 * 0.975, depth=0.025, matrix=Matrix.Translation((0, 0, 0.022)))
    b = _new(name + "_PITA", bm2, [mat_simple("Pita_Topi", (0.12, 0.08, 0.05), rough=0.5)], coll=coll); b.parent = o
    return o
