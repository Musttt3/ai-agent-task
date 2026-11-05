# HERO, Prompt 4 tahap 3 (WAJAH YANG BISA DITUKAR) + tahap 4 (RIG). Jalankan sesudah build_hero.py:
#   blender -b characters/hero.blend --python characters/hero_rig.py [-- look]
# Wajah: mata 3D (grup per mata, pupil di pivot sendiri = bisa melirik, kelopak + garis untuk TIDUR/TERTAWA),
# alis di pivot (naik/turun/miring), mulut = decal yang ditukar lewat satu properti angka "mulut"
# (0 tutup, 1 senyum, 2 lebar terbuka, 3 bulat "O", 4 miring, 5 tertawa). Preset: SENANG SENYUM TERTAWA KAGET MIKIR TIDUR.
# Rig: armature root/pelvis/spine/head + lengan atas/bawah + paha/betis; bagian tubuh menempel kaku ke tulang.
# Kontrol IK "IK_TANGAN_R" (tangan kanan ke dagu untuk MIKIR), aktif lewat properti "ik_dagu".
import bpy, math, os, sys
from mathutils import Vector, Matrix
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
sc = bpy.context.scene
C = bpy.data.collections["HERO"]
HR = bpy.data.objects["HERO_ROOT"]
HC = Vector((0, 0, 1.265)); R = 0.196

def on_face(x, z, out=0.0):
    rx, ry, rz = R * 1.0, R * 0.94, R * 0.96
    y = -ry * math.sqrt(max(0.0, 1 - (x / rx) ** 2 - (z / rz) ** 2))
    n = Vector((x / rx ** 2, y / ry ** 2, z / rz ** 2)).normalized()
    return HC + Vector((x, y, z)) + n * out, n

def link(o):
    for cc in o.users_collection: cc.objects.unlink(o)
    C.objects.link(o); return o

def empty(name, loc, parent=None):
    e = bpy.data.objects.get(name) or bpy.data.objects.new(name, None)
    if e.name not in C.objects: C.objects.link(e)
    e.empty_display_size = 0.02; e.location = loc
    if parent: e.parent = parent; e.matrix_parent_inverse = parent.matrix_world.inverted()
    bpy.context.view_layer.update()
    return e

def reparent(o, parent):
    bpy.context.view_layer.update()
    mw = o.matrix_world.copy(); o.parent = parent; o.matrix_parent_inverse = Matrix.Identity(4); o.matrix_world = mw
    bpy.context.view_layer.update()

def mat_line():
    return bpy.data.materials.get("Rambut")

def face_curve(name, pts_xz, width=0.007, out=0.006):
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = width; cu.bevel_resolution = 3; cu.use_fill_caps = True
    sp = cu.splines.new("POLY"); sp.points.add(len(pts_xz) - 1)
    for i, (x, z) in enumerate(pts_xz):
        q, _ = on_face(x, z, out); sp.points[i].co = (*q, 1)
    o = bpy.data.objects.new(name, cu); C.objects.link(o); o.data.materials.append(mat_line())
    for o_ in list(bpy.context.selected_objects): o_.select_set(False)
    bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.convert(target="MESH"); o.select_set(False)
    return bpy.data.objects[name]

def face_patch(name, cx, cz, w, h, img, out=0.0025, n=12):
    verts, faces, uvs = [], [], []
    for j in range(n + 1):
        for i in range(n + 1):
            u, v = i / n, j / n; q, _ = on_face(cx + (u - 0.5) * w, cz + (v - 0.5) * h, out); verts.append(q); uvs.append((u, v))
    for j in range(n):
        for i in range(n):
            a = j * (n + 1) + i; faces.append((a, a + 1, a + n + 2, a + n + 1))
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); uvl = me.uv_layers.new(name="UVMap")
    for l in me.loops: uvl.data[l.index].uv = uvs[l.vertex_index]
    o = bpy.data.objects.new(name, me); C.objects.link(o)
    m = bpy.data.materials.new("Decal_" + name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(os.path.join(ROOT, "assets", "wajah", img), check_existing=True)
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"]); nt.links.new(t.outputs["Alpha"], b.inputs["Alpha"]); b.inputs["Roughness"].default_value = 0.5
    o.data.materials.append(m); return o

# ---------------- face rig ----------------
if bpy.data.objects.get("Mulut"): bpy.data.objects.remove(bpy.data.objects["Mulut"])
MOUTHS = ["tutup", "senyum", "senang", "o", "miring", "tertawa"]
for i, nm in enumerate(MOUTHS):
    w, h = (0.24, 0.12) if nm == "tertawa" else (0.22, 0.11)
    face_patch(f"Mulut_{i}_{nm}", 0.0, -0.082, w, h, f"mulut_{nm}.png")
skin = bpy.data.materials["Kulit"]
WAJAH = empty("WAJAH", HC)   # all face pivots live under this; it alone is bound to the head bone
for side in (-1, 1):
    white = bpy.data.objects[f"Mata_{side}"]; c0 = white.location.copy()
    _, n = on_face(side * 0.062, 0.025)
    grp = empty(f"Mata_Grup_{side}", c0); reparent(grp, WAJAH)
    for nm in (f"Mata_{side}", f"Mata_Garis_{side}"): reparent(bpy.data.objects[nm], grp)
    piv = empty(f"Pupil_Pivot_{side}", c0 - n * 0.03); reparent(piv, grp)
    for nm in (f"Pupil_{side}", f"Kilau_{side}"): reparent(bpy.data.objects[nm], piv)
    # closed-eye pieces: a skin lid over the eye + a line (flat for TIDUR, arched for TERTAWA)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.049, location=c0 + n * 0.002, segments=32, ring_count=16)
    lid = bpy.context.object; lid.name = f"Kelopak_{side}"; lid.scale = (1, 0.36, 1.1); link(lid); lid.data.materials.append(skin)
    for p in lid.data.polygons: p.use_smooth = True
    x0 = side * 0.062
    reparent(lid, grp)
    face_curve(f"Mata_Tidur_{side}", [(x0 - 0.04, 0.022), (x0 - 0.015, 0.016), (x0 + 0.015, 0.016), (x0 + 0.04, 0.022)], out=0.005)
    face_curve(f"Mata_Tawa_{side}", [(x0 + 0.04 * math.cos(a), 0.012 + 0.03 * math.sin(a)) for a in [math.pi * k / 10 for k in range(11)]], out=0.005)
    for nm_ in (f"Mata_Tidur_{side}", f"Mata_Tawa_{side}"): reparent(bpy.data.objects[nm_], grp)
    # brows on pivots
    b = bpy.data.objects[f"Alis_{side}"]
    bp, _ = on_face(side * 0.06, 0.112); piv_b = empty(f"Alis_Pivot_{side}", bp); reparent(piv_b, WAJAH); reparent(b, piv_b)

def show(names, on):
    for nm in names:
        o = bpy.data.objects.get(nm)
        if o: o.hide_render = not on; o.hide_viewport = not on

PRESETS = {  # eyes, eye scale, look (yaw, pitch deg), brows (raise R, tilt R, raise L, tilt L), mouth
    "SENANG":  ("buka", 1.0, (0, 0), (0.004, 0, 0.004, 0), 2),
    "SENYUM":  ("buka", 1.0, (0, 0), (0.0, 0, 0.0, 0), 1),
    "TERTAWA": ("tawa", 1.0, (0, 0), (0.008, 0, 0.008, 0), 5),
    "KAGET":   ("buka", 1.16, (0, 0), (0.022, 0, 0.022, 0), 3),
    "MIKIR":   ("buka", 1.0, (14, 14), (-0.004, 14, 0.016, -8), 4),
    "TIDUR":   ("tidur", 1.0, (0, 0), (-0.004, 0, -0.004, 0), 0),
}
def ekspresi(name):
    eyes, es, (yaw, pitch), (rR, tR, rL, tL), mouth = PRESETS[name]
    HR["ekspresi"] = name; HR["mulut"] = mouth
    for side in (-1, 1):
        open_ = eyes == "buka"
        show([f"Mata_{side}", f"Mata_Garis_{side}", f"Pupil_{side}", f"Kilau_{side}"], open_)
        show([f"Kelopak_{side}"], False)   # lids are for blinks only; closed states are lines on the face
        show([f"Mata_Tidur_{side}"], eyes == "tidur"); show([f"Mata_Tawa_{side}"], eyes == "tawa")
        bpy.data.objects[f"Mata_Grup_{side}"].scale = (es, es, es)
        bpy.data.objects[f"Pupil_Pivot_{side}"].rotation_euler = (math.radians(pitch), 0, math.radians(yaw))
        raise_, tilt = (rR, tR) if side < 0 else (rL, tL)
        pv = bpy.data.objects[f"Alis_Pivot_{side}"]
        pv.delta_location = (0, 0, raise_); pv.rotation_euler = (0, math.radians(tilt * side), 0)
    for i, nm in enumerate(MOUTHS): show([f"Mulut_{i}_{nm}"], i == mouth)

# ---------------- armature ----------------
if bpy.data.objects.get("HERO_RIG"): bpy.data.objects.remove(bpy.data.objects["HERO_RIG"])
ad = bpy.data.armatures.new("HERO_RIG"); arm = bpy.data.objects.new("HERO_RIG", ad); C.objects.link(arm)
arm.parent = HR
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode="EDIT")
def bone(name, head, tail, parent=None):
    b = ad.edit_bones.new(name); b.head = head; b.tail = tail; b.roll = 0
    if parent: b.parent = ad.edit_bones[parent]; b.use_connect = False
    return b
bone("root", (0, 0, 0), (0, 0.15, 0))
bone("pelvis", (0, 0, 0.63), (0, 0, 0.76), "root")
bone("spine", (0, 0, 0.76), (0, 0, 1.08), "pelvis")
bone("head", (0, 0, 1.08), (0, 0, 1.5), "spine")
for side, sfx in ((-1, "R"), (1, "L")):   # x<0 is the character's right (it faces -y)
    bone(f"upperarm.{sfx}", (side * 0.19, 0, 1.0), (side * 0.214, 0, 0.8), "spine")
    bone(f"forearm.{sfx}", (side * 0.214, 0, 0.8), (side * 0.235, 0, 0.64), f"upperarm.{sfx}")
    bone(f"thigh.{sfx}", (side * 0.07, 0, 0.63), (side * 0.07, 0, 0.37), "pelvis")
    bone(f"shin.{sfx}", (side * 0.07, 0, 0.37), (side * 0.07, 0, 0.1), f"thigh.{sfx}")
bpy.ops.object.mode_set(mode="OBJECT")

def to_bone(o, bname):
    bpy.context.view_layer.update()
    mw = o.matrix_world.copy(); o.parent = arm; o.parent_type = "BONE"; o.parent_bone = bname
    o.matrix_parent_inverse = Matrix.Identity(4); bpy.context.view_layer.update(); o.matrix_world = mw
for o in list(C.objects):
    if o in (arm, HR) or o.parent not in (HR, None): continue
    n = o.name
    side = "R" if n.endswith("_-1") else "L" if n.endswith("_1") else None
    if n.startswith(("Lengan_Atas", "Lengan_Hoodie")): to_bone(o, f"upperarm.{side}")
    elif n.startswith(("Lengan_Bawah", "Siku", "Tangan")): to_bone(o, f"forearm.{side}")
    elif n.startswith(("Paha", "Lutut")): to_bone(o, f"thigh.{side}")
    elif n.startswith(("Betis", "Sepatu", "Sol")): to_bone(o, f"shin.{side}")
    elif n.startswith(("Hoodie_Bawah",)): to_bone(o, "pelvis")
    elif n.startswith(("Hoodie", "Logo")): to_bone(o, "spine")
    else: to_bone(o, "head")   # head, hair, ears, neck, eyes, brows, mouth decals, lids, pivots

# IK control: right hand to the chin (MIKIR); pole keeps the elbow down and out
ik_t = empty("IK_TANGAN_R", (-0.03, -0.215, 1.09)); ik_t.parent = HR
pole = empty("IK_SIKU_R", (-0.3, -0.45, 0.55)); pole.parent = HR
pb = arm.pose.bones["forearm.R"]; c = pb.constraints.new("IK"); c.target = ik_t; c.pole_target = pole; c.chain_count = 2; c.pole_angle = math.radians(-90)
HR["ik_dagu"] = 0.0; IK = c
for b in arm.pose.bones: b.rotation_mode = "XYZ"

def tail(bn):
    bpy.context.view_layer.update(); return arm.matrix_world @ arm.pose.bones[bn].tail
def bend(bn, axis, deg, want):
    """rotate a pose bone by +deg or -deg about a local axis, whichever moves its tail toward `want` (world)"""
    best = None
    for sgn in (1, -1):
        r = [0.0, 0.0, 0.0]; r[axis] = math.radians(deg * sgn); arm.pose.bones[bn].rotation_euler = r
        dist = (tail(bn) - Vector(want)).length
        if best is None or dist < best[0]: best = (dist, list(r))
    arm.pose.bones[bn].rotation_euler = best[1]
def pose(name):
    """test poses: BERDIRI, DUDUK (on a 0.5 m seat), DAGU (right hand to the chin by IK)"""
    for b in arm.pose.bones: b.rotation_euler = (0, 0, 0); b.location = (0, 0, 0)
    HR["ik_dagu"] = 0.0; IK.influence = 0.0
    if name == "DUDUK":
        for s_, x in (("R", -0.07), ("L", 0.07)):
            bend(f"thigh.{s_}", 0, 90, (x, -0.3, 0.63))      # thigh forward (toward -y)
            bend(f"shin.{s_}", 0, 90, (x, -0.26, 0.3))        # shin back down
    if name == "DAGU":
        HR["ik_dagu"] = 1.0; IK.influence = 1.0
        best = None
        for pa in (-90, 0, 90, 180):   # pick the pole angle that drops the elbow lowest
            IK.pole_angle = math.radians(pa); z = tail("upperarm.R").z
            if best is None or z < best[0]: best = (z, pa)
        IK.pole_angle = math.radians(best[1])
    bpy.context.view_layer.update()
    print("POSE", name, "knee.R", tuple(round(v, 2) for v in tail("thigh.R")), "foot.R", tuple(round(v, 2) for v in tail("shin.R")), "hand.R", tuple(round(v, 2) for v in tail("forearm.R")))

ekspresi("SENANG"); pose("BERDIRI")
bpy.ops.wm.save_mainfile()
print("SAVED rig")

if "look" in sys.argv:
    sc.render.resolution_x, sc.render.resolution_y = 600, 1200; sc.eevee.taa_render_samples = 32
    sc.view_settings.view_transform = "Standard"; sc.view_settings.look = "None"
    w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.86, 0.86, 0.87, 1); w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.55
    for nm, loc, en, sz in (("KEY", (-1.5, -2.5, 2.8), 150, 2.5), ("FILL", (2.0, -1.5, 1.5), 50, 2.5), ("RIM", (0.5, 2.5, 2.5), 70, 2.0)):
        ld = bpy.data.lights.new(nm, "AREA"); ld.energy = en; ld.size = sz; lo = bpy.data.objects.new(nm, ld); sc.collection.objects.link(lo)
        lo.location = loc; lo.rotation_euler = (Vector((0, 0, 0.9)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    cd = bpy.data.cameras.new("C"); cd.type = "ORTHO"; cam = bpy.data.objects.new("C", cd); sc.collection.objects.link(cam); sc.camera = cam
    out = os.path.join(ROOT, "review")
    # six expressions: busts, straight on
    sc.render.resolution_x, sc.render.resolution_y = 600, 600; cd.ortho_scale = 0.62
    cam.location = (0, -6, 1.2); cam.rotation_euler = (math.radians(90), 0, 0)
    for nm in PRESETS:
        ekspresi(nm); pose("DAGU" if nm == "MIKIR" else "BERDIRI")
        sc.render.filepath = os.path.join(out, f"hero_ekspresi_{nm}.png"); bpy.ops.render.render(write_still=True)
    # three test poses, 3/4 view
    sc.render.resolution_x, sc.render.resolution_y = 600, 1200; cd.ortho_scale = 1.95
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.25, 0.25)); seat = bpy.context.object; seat.scale = (0.8, 0.6, 0.5); seat.name = "KURSI_UJI"
    a = math.radians(-30); cam.location = Vector((math.sin(a) * 6, -math.cos(a) * 6, 0.85)); cam.rotation_euler = (Vector((0, 0, 0.85)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    for nm, ex in (("BERDIRI", "SENANG"), ("DUDUK", "KAGET"), ("DAGU", "MIKIR")):
        ekspresi(ex); pose(nm)
        seat.hide_render = nm != "DUDUK"
        HR.location = (0, 0, -0.1) if nm == "DUDUK" else (0, 0, 0)
        sc.render.filepath = os.path.join(out, f"hero_pose_{nm}.png"); bpy.ops.render.render(write_still=True)
    HR.location = (0, 0, 0)
