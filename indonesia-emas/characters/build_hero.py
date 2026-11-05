# HERO, Prompt 4 tahap 1 (BENTUK DASAR) + warna dasar. Ukuran diambil dari ref/karakter.png (tampak depan:
# 715 px = 1,60 m, jadi 1 px = 2,24 mm). Menghadap -y, kaki di z=0.
#   blender -b --python characters/build_hero.py [-- look]   -> characters/hero.blend (+ review/hero_look_*.png)
import bpy, math, os, sys, random
from mathutils import Vector
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sets"))
from lib import new_scene, coll, mat, ROOT

sc = new_scene()
C = coll("HERO")
rnd = random.Random(4)
SKIN = mat("Kulit", color=(0.8, 0.46, 0.25), rough=0.55)
HAIR = mat("Rambut", color=(0.02, 0.012, 0.009), rough=0.55)
HOOD = mat("Hoodie", color=(0.014, 0.014, 0.016), rough=0.8)
PANTS = mat("Celana", color=(0.016, 0.016, 0.018), rough=0.75)
ARM = mat("Lengan", color=(0.045, 0.02, 0.012), rough=0.6)
WHITE = mat("Putih_Mata", color=(0.97, 0.97, 0.96), rough=0.25)
BLACK = mat("Pupil", color=(0.01, 0.01, 0.01), rough=0.2)
BROW = mat("Alis", color=(0.06, 0.035, 0.025), rough=0.6)
SHOE = mat("Sepatu", color=(0.94, 0.94, 0.93), rough=0.55)
SOLE = mat("Sol", color=(0.85, 0.85, 0.84), rough=0.7)
LOGO = mat("Logo", color=(0.9, 0.9, 0.88), rough=0.6)
MOUTH = mat("Mulut", color=(0.03, 0.005, 0.005), rough=0.5)
TONGUE = mat("Lidah", color=(0.75, 0.08, 0.08), rough=0.5)

def obj(kind, name, loc, m, scale=(1, 1, 1), rot=(0, 0, 0), sub=0, smooth=True, **kw):
    getattr(bpy.ops.mesh, "primitive_" + kind + "_add")(location=loc, rotation=rot, **kw)
    o = bpy.context.object; o.name = name; o.scale = scale; bpy.ops.object.transform_apply(scale=True)
    for cc in o.users_collection: cc.objects.unlink(o)
    C.objects.link(o); o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = smooth
    if sub: s = o.modifiers.new("Subsurf", "SUBSURF"); s.levels = s.render_levels = sub
    return o

# ---------------- head ----------------
HC = Vector((0, 0, 1.265)); R = 0.196
head = obj("uv_sphere", "Kepala", HC, SKIN, scale=(1.0, 0.94, 0.96), segments=64, ring_count=32, radius=R)
def on_face(x, z, out=0.0):
    """point on the face surface (front, -y) at local x, z relative to the head centre"""
    rx, ry, rz = R * 1.0, R * 0.94, R * 0.96
    y = -ry * math.sqrt(max(0.0, 1 - (x / rx) ** 2 - (z / rz) ** 2))
    n = Vector((x / rx ** 2, y / ry ** 2, z / rz ** 2)).normalized()
    return HC + Vector((x, y, z)) + n * out, n
for side in (-1, 1):
    obj("uv_sphere", f"Telinga_{side}", HC + Vector((side * 0.196, 0.015, 0.0)), SKIN, scale=(0.55, 0.8, 1.0), radius=0.036)
    p, n = on_face(side * 0.062, 0.025, 0.006)
    eye = obj("uv_sphere", f"Mata_{side}", p, WHITE, scale=(1, 0.45, 1.08), radius=0.044)
    po, _ = on_face(side * 0.062, 0.025, -0.003)
    obj("uv_sphere", f"Mata_Garis_{side}", po, BLACK, scale=(1, 0.45, 1.08), radius=0.0465)
    pp, _ = on_face(side * 0.06, 0.022, 0.022)
    obj("uv_sphere", f"Pupil_{side}", pp, BLACK, scale=(1, 0.35, 1.08), radius=0.026)
    gp, _ = on_face(side * 0.06 + 0.009, 0.033, 0.033)
    obj("uv_sphere", f"Kilau_{side}", gp, WHITE, radius=0.007)
    # brow: a thick arched stroke above each eye
    cu = bpy.data.curves.new(f"Alis_{side}", "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = 0.012; cu.bevel_resolution = 4
    sp = cu.splines.new("POLY"); sp.points.add(6)
    for i in range(7):
        t = i / 6; x = side * (0.03 + 0.06 * t); z = 0.105 + 0.016 * math.sin(math.pi * t) - 0.004 * t
        q, _ = on_face(x, z, 0.004); sp.points[i].co = (*q, 1)
    b = bpy.data.objects.new(f"Alis_{side}", cu); C.objects.link(b); b.data.materials.append(HAIR)
# default mouth (SENANG): dark open smile with a red tongue, set into the face (decals come in stage 3)
mp, mn = on_face(0.0, -0.075, -0.004)
def face_patch(name, cx, cz, w, h, img, out=0.0025, n=12):
    """grid patch lying on the face surface, UV 0..1, alpha-blended image (mouth decal)"""
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
    m.surface_render_method = "BLENDED" if hasattr(m, "surface_render_method") else m.surface_render_method
    o.data.materials.append(m); return o
face_patch("Mulut", 0.0, -0.082, 0.22, 0.11, "mulut_senang.png")
mo, _ = on_face(0.008, -0.155, 0.002); obj("uv_sphere", "Tahi_Lalat", mo, BROW, radius=0.004)
obj("cylinder", "Leher", (0, 0.0, 1.1), SKIN, radius=0.045, depth=0.05)

# ---------------- hair: a smooth base cap + swept curl locks (tapered tubes with curled tips) ----------------
HHC = HC + Vector((0, 0.012, 0.03))
def covered(d):
    """where hair grows: top, sides above the ears, back down to the nape; forehead stays clear"""
    if d.y < -0.25 and d.z < 0.6: return False
    if d.y >= -0.25 and d.z < (-0.62 if d.y > 0.3 else 0.3 - 0.55 * max(0.0, d.y)): return False
    return True
mb = bpy.data.metaballs.new("Rambut_mb"); mb.resolution = 0.01; mb.render_resolution = 0.01
hob = bpy.data.objects.new("Rambut_mb", mb); C.objects.link(hob)
for i in range(420):  # base cap: smooth, slightly inside where the locks lie
    th = 2 * math.pi * rnd.random(); ph = math.acos(1 - 1.8 * rnd.random())
    d = Vector((math.sin(ph) * math.cos(th), math.sin(ph) * math.sin(th), math.cos(ph)))
    if not covered(d): continue
    el = mb.elements.new(); el.co = HHC + d * (0.19 + 0.035 * max(0.0, d.z)); el.radius = 0.05; el.stiffness = 2.0
bpy.context.view_layer.objects.active = hob; hob.select_set(True)
bpy.ops.object.convert(target="MESH"); cap = bpy.context.object; cap.name = "Rambut_Dasar"
cap.data.materials.clear(); cap.data.materials.append(HAIR); cap.select_set(False)
for p in cap.data.polygons: p.use_smooth = True
CROWN = Vector((0.02, 0.09, 0.97)).normalized()      # whorl at the back of the top, like the reference's back view
def lock(start, sweep, length, width, curl, k):
    """one lock: march over the scalp from `start` along `sweep`, tip curls round; tapered tube"""
    pts, rads = [], []
    d = start.normalized(); t = (sweep - d * sweep.dot(d)).normalized()
    n = 14
    for i in range(n + 1):
        f = i / n
        r = 0.205 + 0.04 * max(0.0, d.z) + 0.022 * math.sin(math.pi * min(1.0, f * 1.3))   # lifts off the scalp, then lands
        pts.append(HHC + d * r); rads.append(width * (1.0 - 0.75 * f ** 1.5))
        ang = length / n / r
        side = d.cross(t).normalized()
        t = (t * math.cos(curl * f * f) + side * math.sin(curl * f * f)).normalized()    # the tip turns more and more
        d = (d * math.cos(ang) + t * math.sin(ang)).normalized(); t = (t - d * t.dot(d)).normalized()
    cu = bpy.data.curves.new(f"Ikal_{k}", "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = 1.0; cu.bevel_resolution = 3; cu.use_fill_caps = True
    sp = cu.splines.new("POLY"); sp.points.add(len(pts) - 1)
    for i, (q, w_) in enumerate(zip(pts, rads)): sp.points[i].co = (*q, 1); sp.points[i].radius = w_
    ob = bpy.data.objects.new(f"Ikal_{k}", cu); C.objects.link(ob); return ob
locks = []; k = 0
for i in range(70):
    th = 2 * math.pi * rnd.random(); ph = math.acos(1 - 1.15 * rnd.random())
    d = Vector((math.sin(ph) * math.cos(th), math.sin(ph) * math.sin(th), math.cos(ph)))
    if not covered(d) or d.z < 0.05: continue
    away = (d - CROWN * d.dot(CROWN))
    if away.length < 1e-3: away = Vector((0, -1, 0))
    away.normalize()
    if d.y < 0: away = (away + Vector((0.55, -0.2, 0))).normalized()        # front locks sweep to the side, like the reference
    locks.append(lock(d, away, 0.16 + 0.1 * rnd.random(), 0.036 + 0.014 * rnd.random(), (1.2 + 0.9 * rnd.random()) * (1 if rnd.random() < 0.7 else -1), k)); k += 1
for i in range(9):  # nape: locks from the back of the crown down to the hood
    th = math.radians(55 + 9 * i); d = Vector((math.cos(th) * 0.8, math.sin(th) * 0.8, -0.05)).normalized()
    locks.append(lock(d, Vector((0, 0.2, -1.0)), 0.12, 0.034, 1.4 * (1 if i % 2 else -1), k)); k += 1
for i in range(7):  # fringe: curls falling on the forehead edge, sweeping right
    th = math.radians(-120 + 12 * i); d = Vector((math.cos(th) * 0.6, math.sin(th) * 0.6, 0.78)).normalized()
    locks.append(lock(d, Vector((0.7, -0.35, -0.6)), 0.15, 0.038, 2.0, k)); k += 1
for ob in locks: ob.select_set(True)
bpy.context.view_layer.objects.active = locks[0]
bpy.ops.object.convert(target="MESH"); bpy.ops.object.join(); hair = bpy.context.object; hair.name = "Rambut"
hair.data.materials.clear(); hair.data.materials.append(HAIR)
for p in hair.data.polygons: p.use_smooth = True
hair.select_set(False)

# ---------------- hoodie ----------------
def rbox(name, loc, size, m, bev):
    o = obj("cube", name, loc, m, scale=(size[0] / 2, size[1] / 2, size[2] / 2), smooth=True)
    b = o.modifiers.new("Bevel", "BEVEL"); b.width = bev; b.segments = 6; b.limit_method = "NONE"; return o
torso = rbox("Hoodie_Badan", (0, 0.0, 0.9), (0.35, 0.25, 0.4), HOOD, 0.11)
rbox("Hoodie_Bawah", (0, 0.0, 0.705), (0.355, 0.255, 0.16), HOOD, 0.075)
obj("torus", "Hoodie_Kerah", (0, 0.015, 1.095), HOOD, scale=(1.0, 0.85, 1.4), major_radius=0.075, minor_radius=0.032)
obj("uv_sphere", "Hoodie_Tudung", (0, 0.1, 1.11), HOOD, scale=(1.05, 0.62, 0.8), radius=0.105)
rbox("Hoodie_Saku", (0, -0.124, 0.785), (0.22, 0.012, 0.1), HOOD, 0.008)
for k, (ang, ln) in enumerate(((0, 0.07), (35, 0.05), (-35, 0.05))):  # small white line logo on the chest
    obj("cube", f"Logo_{k}", (0, -0.127, 0.99), LOGO, scale=(0.0018, 0.002, ln / 2), rot=(0, math.radians(ang), 0), smooth=False)
for side in (-1, 1):
    sl = obj("uv_sphere", f"Lengan_Hoodie_{side}", (side * 0.166, 0.0, 0.925), HOOD, scale=(0.046, 0.058, 0.088), rot=(0, math.radians(side * 14), 0), radius=1.0, segments=32, ring_count=16)
    # stick arm from the sleeve to a ball hand
    a0, a1 = Vector((side * 0.205, 0.0, 0.92)), Vector((side * 0.235, 0.0, 0.64))
    mid = (a0 + a1) / 2; dirv = (a1 - a0)
    obj("cylinder", f"Lengan_{side}", mid, ARM, radius=0.019, depth=dirv.length, rot=Vector((0, 0, 1)).rotation_difference(dirv).to_euler())
    obj("uv_sphere", f"Tangan_{side}", a1 + Vector((0, 0, -0.012)), SKIN, radius=0.03)
    # legs and sneakers
    obj("cylinder", f"Kaki_{side}", (side * 0.07, 0.0, 0.37), PANTS, radius=0.043, depth=0.56)
    obj("cube", f"Sepatu_{side}", (side * 0.075, -0.035, 0.05), SHOE, scale=(0.065, 0.115, 0.045), sub=2)
    obj("cube", f"Sol_{side}", (side * 0.075, -0.035, 0.013), SOLE, scale=(0.068, 0.118, 0.013), sub=1)

root = bpy.data.objects.new("HERO_ROOT", None); C.objects.link(root)
for o in C.objects:
    if o != root: o.parent = root
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "characters", "hero.blend"))
print("SAVED hero")

if "look" in sys.argv:
    sc.render.resolution_x, sc.render.resolution_y = 600, 1200; sc.eevee.taa_render_samples = 32
    w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.86, 0.86, 0.87, 1); w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.55
    sc.view_settings.view_transform = "Standard"; sc.view_settings.look = "None"
    for nm, loc, en, sz in (("KEY", (-1.5, -2.5, 2.8), 150, 2.5), ("FILL", (2.0, -1.5, 1.5), 50, 2.5), ("RIM", (0.5, 2.5, 2.5), 70, 2.0)):
        ld = bpy.data.lights.new(nm, "AREA"); ld.energy = en; ld.size = sz; lo = bpy.data.objects.new(nm, ld); sc.collection.objects.link(lo)
        lo.location = loc; lo.rotation_euler = (Vector((0, 0, 0.9)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    cd = bpy.data.cameras.new("C"); cd.type = "ORTHO"; cd.ortho_scale = 1.95; cam = bpy.data.objects.new("C", cd); sc.collection.objects.link(cam); sc.camera = cam
    for i, az in enumerate((0, -35, -90, 180)):
        a = math.radians(az); cam.location = Vector((math.sin(a) * 6, -math.cos(a) * 6, 0.85))
        cam.rotation_euler = (Vector((0, 0, 0.85)) - cam.location).to_track_quat("-Z", "Y").to_euler()
        sc.render.filepath = os.path.join(ROOT, "review", f"hero_look_{i + 1}.png"); bpy.ops.render.render(write_still=True)
