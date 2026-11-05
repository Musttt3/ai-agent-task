# Set KAMAR, tahap 3 (DEKORASI): material bertekstur (gambar di assets/tex, supaya sama di Blender dan Remotion),
# properti kecil bernuansa Indonesia, bevel ala mainan, depth of field per kamera, penanda MARK_[shot] + FOCUS_[shot].
#   blender -b sets/kamar.blend --python sets/kamar_dekorasi.py
import bpy, bmesh, math, os
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(bpy.data.filepath))
TEX = os.path.join(HERE, "..", "assets", "tex")
sc = bpy.context.scene
SET = bpy.data.collections["SET_KAMAR"]
PROPS = bpy.data.collections.get("PROPS_KAMAR") or bpy.data.collections.new("PROPS_KAMAR")
if PROPS.name not in sc.collection.children: sc.collection.children.link(PROPS)
for o in list(PROPS.objects): bpy.data.objects.remove(o)
MARKS = bpy.data.collections.get("MARKS") or bpy.data.collections.new("MARKS")
if MARKS.name not in sc.collection.children: sc.collection.children.link(MARKS)
for o in list(MARKS.objects): bpy.data.objects.remove(o)

# ---------------- materials ----------------
def mat(name, tex=None, color=(0.8, 0.8, 0.8), rough=0.8, emit=None, emit_strength=0.0, sss=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial"); b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Roughness"].default_value = rough
    b.inputs["Base Color"].default_value = (*color, 1)
    if tex:
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(os.path.join(TEX, tex + ".png"), check_existing=True)
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = emit_strength
    nt.links.new(b.outputs["BSDF"], out.inputs["Surface"])
    return m

M = {
    "dinding": mat("Dinding", "dinding", rough=0.92), "ubin": mat("Ubin", "ubin", rough=0.55),
    "kayu": mat("Kayu", "kayu", rough=0.6), "kayu_gelap": mat("Kayu_Gelap", "kayu_gelap", rough=0.6),
    "kawung": mat("Sprei_Kawung", "batik_kawung", rough=0.9), "parang": mat("Selimut_Parang", "batik_parang", rough=0.9),
    "putih": mat("Kain_Putih", "kain_putih", rough=0.95), "tikar": mat("Tikar", "tikar", rough=0.9),
    "plastik_hitam": mat("Plastik_Hitam", color=(0.03, 0.03, 0.035), rough=0.45),
    "layar": mat("Layar_TV", color=(0.01, 0.015, 0.03), rough=0.2, emit=(0.15, 0.3, 0.6), emit_strength=0.0),
    "kipas": mat("Plastik_Kipas", color=(0.55, 0.78, 0.82), rough=0.5), "logam": mat("Logam", color=(0.75, 0.75, 0.72), rough=0.35),
    "terakota": mat("Terakota", color=(0.62, 0.3, 0.17), rough=0.85), "daun": mat("Daun", color=(0.12, 0.42, 0.16), rough=0.6),
    "daun_muda": mat("Daun_Muda", color=(0.25, 0.55, 0.18), rough=0.6), "merah": mat("Plastik_Merah", color=(0.75, 0.12, 0.1), rough=0.4),
    "kaca": mat("Kaca", color=(0.85, 0.92, 0.95), rough=0.05), "tirai": mat("Tirai", color=(0.62, 0.74, 0.6), rough=0.95),
    "lukisan": mat("Lukisan_Sawah", "lukisan_sawah", rough=0.8), "lampu": mat("Lampu_Kap", color=(0.95, 0.88, 0.72), rough=0.7, emit=(1, 0.8, 0.5), emit_strength=0.6),
    "peta": mat("Peta_Sementara", color=(0.83, 0.62, 0.22), rough=0.35),
}

def box_uv(o, tile):
    """world-space box mapping: each face takes the two axes across its normal, one texture per `tile` metres"""
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
        o.modifiers.get("Smooth") or o.modifiers.new("Smooth", "WEIGHTED_NORMAL")

def part(kind, name, loc, m, size=None, tile=1.0, bevel=0.0, rot=(0, 0, 0), **kw):
    if kind == "box": bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    elif kind == "cyl": bpy.ops.mesh.primitive_cylinder_add(location=loc, rotation=rot, **kw)
    elif kind == "sph": bpy.ops.mesh.primitive_uv_sphere_add(location=loc, rotation=rot, **kw)
    elif kind == "torus": bpy.ops.mesh.primitive_torus_add(location=loc, rotation=rot, **kw)
    o = bpy.context.object; o.name = name
    if size: o.scale = size; bpy.ops.object.transform_apply(scale=True)
    for cc in o.users_collection: cc.objects.unlink(o)
    PROPS.objects.link(o); assign(o, m, tile, bevel)
    if kind in ("sph", "torus", "cyl"): bpy.ops.object.shade_smooth() if False else None
    for poly in o.data.polygons: poly.use_smooth = kind in ("sph", "torus")
    return o

# ---------------- existing set pieces ----------------
for o in SET.objects:
    n = o.name
    if n.startswith("Dinding"): assign(o, M["dinding"], 2.0)
    elif n == "Plafon": assign(o, M["dinding"], 2.0)
    elif n == "Lantai": assign(o, M["ubin"], 1.6)
    elif n.startswith(("Jendela_Kusen", "Jendela_Jeruji")): assign(o, M["kayu_gelap"], 0.8, 0.008)
    elif n.startswith("Jendela_Daun"): assign(o, M["kayu"], 0.8, 0.01)
    elif n == "Pintu_Daun": assign(o, M["kayu"], 1.2, 0.012)
    elif n in ("Kasur_Rangka", "Kasur_Sandaran", "Meja_TV", "Nakas", "Lemari"): assign(o, M["kayu"], 2.2, 0.02)
    elif n == "Kasur_Matras": assign(o, M["kawung"], 0.45, 0.04)
    elif n == "Bantal": assign(o, M["putih"], 0.8, 0.05)
    elif n == "Selimut": assign(o, M["parang"], 0.38, 0.02)
    elif n == "TV": assign(o, M["plastik_hitam"], 1.0, 0.02)
    elif n.startswith("Kipas"): assign(o, M["kipas"], 1.0)
    elif n == "Tikar": assign(o, M["tikar"], 0.5)
    elif n.startswith("PETA_EMAS"): assign(o, M["peta"], 1.0, 0.015)

# ---------------- props ----------------
part("box", "TV_Layar", (0.3, -1.566, 0.86), M["layar"], (0.78, 0.005, 0.43))
part("box", "Plint_Belakang", (0, 1.79, 0.05), M["kayu_gelap"], (4.0, 0.03, 0.1), 0.8)
part("box", "Plint_Depan", (0, -1.79, 0.05), M["kayu_gelap"], (4.0, 0.03, 0.1), 0.8)
part("box", "Lemari_Pintu_Garis", (1.45, 1.12, 0.95), M["kayu_gelap"], (0.02, 0.01, 1.75))
for z in (0.95,):
    part("sph", "Lemari_Gagang_a", (1.38, 1.115, z), M["logam"], radius=0.025, segments=12, ring_count=8)
    part("sph", "Lemari_Gagang_b", (1.52, 1.115, z), M["logam"], radius=0.025, segments=12, ring_count=8)
part("sph", "Pintu_Gagang", (1.95, -0.6, 1.0), M["logam"], radius=0.035, segments=12, ring_count=8)
# fan: cage rings + blades + base
for i, r in enumerate((0.23, 0.15)):
    part("torus", f"Kipas_Kurung_{i}", (1.55, 0.3, 1.15), M["logam"], rot=(math.radians(90), 0, math.radians(30)), major_radius=r, minor_radius=0.008)
for k in range(3):
    part("box", f"Kipas_Baling_{k}", (1.55, 0.3, 1.15), M["kipas"], (0.06, 0.012, 0.36), rot=(math.radians(90), math.radians(k * 120), math.radians(30)))
part("cyl", "Kipas_Alas", (1.55, 0.3, 0.02), M["kipas"], radius=0.2, depth=0.04, vertices=32)
# bedside table: alarm clock (bells), small lamp, glass
part("cyl", "Weker", (-0.85, 1.5, 0.58), M["merah"], rot=(math.radians(90), 0, math.radians(15)), radius=0.07, depth=0.05, vertices=32)
for dx in (-0.045, 0.045):
    part("sph", f"Weker_Lonceng_{dx}", (-0.85 + dx, 1.5, 0.66), M["logam"], radius=0.03, segments=16, ring_count=8)
part("box", "Weker_Muka", (-0.85, 1.473, 0.58), M["putih"], (0.09, 0.004, 0.09))
part("cyl", "Lampu_Meja_Tiang", (-0.7, 1.62, 0.62), M["kayu_gelap"], radius=0.012, depth=0.24, vertices=12)
part("cyl", "Lampu_Meja_Kap", (-0.7, 1.62, 0.78), M["lampu"], radius=0.09, depth=0.12, vertices=24)
part("cyl", "Gelas", (-0.95, 1.62, 0.55), M["kaca"], radius=0.03, depth=0.1, vertices=16)
# potted plant by the window (tropical, big leaves)
part("cyl", "Pot_Tanaman", (-1.65, -0.75, 0.18), M["terakota"], radius=0.17, depth=0.36, vertices=24, bevel=0.02)
for k in range(7):
    a = k / 7 * 2 * math.pi
    leaf = part("sph", f"Daun_{k}", (-1.65 + 0.22 * math.cos(a), -0.75 + 0.22 * math.sin(a), 0.62 + 0.12 * (k % 3)), M["daun" if k % 2 else "daun_muda"],
                rot=(math.radians(55), 0, a + math.pi / 2), radius=0.16, segments=16, ring_count=8)
    leaf.scale = (0.55, 1.0, 0.12)
# batik-free curtain hanging beside the window + wall painting of rice terraces
part("box", "Tirai", (-1.97, -0.05, 1.5), M["tirai"], (0.03, 0.32, 1.3), bevel=0.01)
part("box", "Lukisan_Bingkai", (1.96, 0.55, 1.55), M["kayu_gelap"], (0.03, 0.66, 0.46), 0.5, 0.01)
part("box", "Lukisan", (1.94, 0.55, 1.55), M["lukisan"], (0.01, 0.58, 0.38))
# the painting texture should fill the panel: plain 0..1 planar UVs on the -x face
pl = bpy.data.objects["Lukisan"]; bm = bmesh.new(); bm.from_mesh(pl.data); uvl = bm.loops.layers.uv.verify()
for f in bm.faces:
    for l in f.loops: l[uvl].uv = ((l.vert.co.y + 0.29) / 0.58, (l.vert.co.z + 0.19) / 0.38)
bm.to_mesh(pl.data); bm.free()
# banana leaves outside the window (what the morning sun shines through)
for k in range(4):
    lf = part("sph", f"Pisang_{k}", (-2.6 - 0.2 * k, 0.4 + 0.35 * (k % 2), 1.4 + 0.35 * k), M["daun_muda"],
              rot=(math.radians(20 + 25 * k), math.radians(10), math.radians(70 * k)), radius=0.5, segments=16, ring_count=8)
    lf.scale = (0.35, 1.0, 0.06)

# ---------------- marks, focus targets, depth of field ----------------
def empty(name, loc, size=0.15):
    e = bpy.data.objects.new(name, None); e.empty_display_type = "ARROWS" if name.startswith("MARK") else "SPHERE"
    e.empty_display_size = size; e.location = loc; MARKS.objects.link(e); return e
SPOTS = {  # shot: (stand point, focus point at the eyes)
    "02": ((0.0, 0.95, 0.5), (0.0, 1.25, 0.82)), "03": ((0.05, 1.05, 0.52), (0.05, 1.05, 1.32)),
    "05": ((0.0, -0.05, 0.5), (0.3, -1.6, 0.85)), "06": ((0.0, -0.05, 0.5), (0.0, -0.05, 1.32)),
    "28": ((-0.75, 1.15, 0.0), (-0.75, 1.15, 1.34)),
}
for sid, (stand, eye) in SPOTS.items():
    empty("MARK_" + sid, stand); empty("FOCUS_" + sid, eye, 0.05)
empty("FOCUS_01", (0.0, 1.76, 1.6), 0.05); empty("FOCUS_04", (0.3, -1.57, 0.86), 0.05)
FSTOP = {"01": 2.8, "02": 2.4, "03": 2.0, "04": 2.8, "05": 2.2, "06": 1.8, "28": 2.0}
for sid, fs in FSTOP.items():
    cd = bpy.data.objects["CAM_" + sid].data
    cd.dof.use_dof = True; cd.dof.focus_object = bpy.data.objects["FOCUS_" + sid]; cd.dof.aperture_fstop = fs

# TV screen glows while the TV is on (shot 04-06)
ls = M["layar"].node_tree.nodes["Principled BSDF"].inputs["Emission Strength"]
for f, v in ((0, 0.0), (206, 2.5), (366, 0.0)):
    ls.default_value = v; ls.keyframe_insert("default_value", frame=f)
for fc in M["layar"].node_tree.animation_data.action.fcurves:
    for kp in fc.keyframe_points: kp.interpolation = "CONSTANT"

bpy.ops.wm.save_mainfile()
print("SAVED dekorasi", len(PROPS.objects), "props")
