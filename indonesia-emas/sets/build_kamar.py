# Set KAMAR, tahap 1 (BLOK): bentuk abu-abu + semua kamera shot Kamar (01-06, 28) + boneka skala HERO.
# Jalankan: blender -b --python sets/build_kamar.py   -> sets/kamar.blend
# Satuan meter, Z ke atas. Dinding belakang (kepala kasur + peta) di y=+1.8, TV di dinding depan y=-1.8,
# jendela di dinding kiri x=-2.0, pintu di dinding kanan x=+2.0. HERO ~1,35 m (kepala ~0,52 m).
import bpy, math, os
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 30
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = FPS
sc.render.resolution_x, sc.render.resolution_y = 1080, 1920
sc.frame_start, sc.frame_end = 0, 1754

def coll(name):
    c = bpy.data.collections.new(name); sc.collection.children.link(c); return c
SET, CAMS, DUMMY = coll("SET_KAMAR"), coll("CAMERAS"), coll("DUMMY_HERO")
grey = bpy.data.materials.new("BLOCK_GREY"); grey.diffuse_color = (0.6, 0.6, 0.6, 1)

def box(name, size, loc, c=SET, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(grey)
    for cc in o.users_collection: cc.objects.unlink(o)
    c.objects.link(o); return o

def cyl(name, r, h, loc, c=SET, rot=(0, 0, 0), verts=24):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.object; o.name = name; o.data.materials.append(grey)
    for cc in o.users_collection: cc.objects.unlink(o)
    c.objects.link(o); return o

W, D, H, T = 4.0, 3.6, 2.8, 0.1  # room width (x), depth (y), height, wall thickness
box("Lantai", (W, D, T), (0, 0, -T / 2))
box("Plafon", (W, D, T), (0, 0, H + T / 2))
box("Dinding_Belakang", (W, T, H), (0, D / 2 + T / 2, H / 2))
box("Dinding_Depan", (W, T, H), (0, -D / 2 - T / 2, H / 2))
# left wall with a window hole (y 0.15..1.15, z 1.0..2.1): built from four pieces
wy0, wy1, wz0, wz1 = 0.15, 1.15, 1.0, 2.1
x = -W / 2 - T / 2
box("Dinding_Kiri_a", (T, wy0 + D / 2, H), (x, (-D / 2 + wy0) / 2, H / 2))
box("Dinding_Kiri_b", (T, D / 2 - wy1, H), (x, (wy1 + D / 2) / 2, H / 2))
box("Dinding_Kiri_bawah", (T, wy1 - wy0, wz0), (x, (wy0 + wy1) / 2, wz0 / 2))
box("Dinding_Kiri_atas", (T, wy1 - wy0, H - wz1), (x, (wy0 + wy1) / 2, (wz1 + H) / 2))
box("Jendela_Kusen", (0.08, wy1 - wy0, 0.06), (-W / 2, (wy0 + wy1) / 2, (wz0 + wz1) / 2))
box("Jendela_Daun_Kiri", (0.04, 0.5, wz1 - wz0), (-W / 2 + 0.25, wy0 - 0.2, (wz0 + wz1) / 2), rot=(0, 0, math.radians(-50)))
# right wall with a door hole (y -1.35..-0.45, z 0..2.05)
dy0, dy1, dz1 = -1.35, -0.45, 2.05
x = W / 2 + T / 2
box("Dinding_Kanan_a", (T, dy0 + D / 2, H), (x, (-D / 2 + dy0) / 2, H / 2))
box("Dinding_Kanan_b", (T, D / 2 - dy1, H), (x, (dy1 + D / 2) / 2, H / 2))
box("Dinding_Kanan_atas", (T, dy1 - dy0, H - dz1), (x, (dy0 + dy1) / 2, (dz1 + H) / 2))
box("Pintu_Daun", (0.05, dy1 - dy0, dz1), (W / 2 - 0.03, (dy0 + dy1) / 2, dz1 / 2))
# bed against the back wall
box("Kasur_Rangka", (1.05, 2.0, 0.32), (0, 0.8, 0.16))
box("Kasur_Matras", (0.98, 1.92, 0.18), (0, 0.8, 0.41))
box("Kasur_Sandaran", (1.1, 0.08, 1.0), (0, 1.76, 0.5))
box("Bantal", (0.6, 0.35, 0.12), (0, 1.5, 0.56))
box("Selimut", (1.0, 1.15, 0.06), (0, 0.45, 0.52))
# the golden map plaque on the back wall above the bed (placeholder slab)
box("PETA_EMAS_placeholder", (1.4, 0.04, 0.55), (0, 1.78, 1.6))
# TV on a low table against the front wall, facing the bed (+y)
box("Meja_TV", (1.0, 0.42, 0.55), (0.3, -1.55, 0.275))
box("TV", (0.85, 0.06, 0.5), (0.3, -1.6, 0.85))
box("Lemari", (0.9, 0.55, 1.9), (1.45, 1.4, 0.95))
cyl("Kipas_Tiang", 0.025, 1.1, (1.55, 0.3, 0.55))
cyl("Kipas_Kepala", 0.22, 0.12, (1.55, 0.3, 1.15), rot=(math.radians(90), 0, math.radians(30)))
box("Nakas", (0.4, 0.38, 0.5), (-0.8, 1.55, 0.25))
box("Tikar", (1.4, 0.9, 0.01), (0.2, -0.6, 0.005))

# ---- dummy HERO (grey, for scale only; replaced by the real character in Prompt 4) ----
def dummy(name, loc, pose="stand", yaw=0.0):
    root = bpy.data.objects.new(name, None); DUMMY.objects.link(root)
    root.location = loc; root.rotation_euler = (0, 0, math.radians(yaw))
    parts = []
    if pose == "stand":
        parts += [cyl(name + "_kaki", 0.11, 0.6, (0, 0, 0.3), DUMMY), box(name + "_badan", (0.42, 0.3, 0.42), (0, 0, 0.8), DUMMY)]
        hz = 1.08
    elif pose == "sit":
        parts += [box(name + "_paha", (0.3, 0.4, 0.14), (0, -0.2, 0.0), DUMMY), cyl(name + "_betis", 0.1, 0.45, (0, -0.38, -0.22), DUMMY),
                  box(name + "_badan", (0.42, 0.3, 0.42), (0, 0, 0.28), DUMMY)]
        hz = 0.56
    else:  # lie
        parts += [box(name + "_badan", (0.42, 0.9, 0.25), (0, -0.4, 0.0), DUMMY)]
        hz = 0.05
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.26, location=(0, 0.25 if pose == "lie" else 0, hz + 0.26))
    hd = bpy.context.object; hd.name = name + "_kepala"; hd.data.materials.append(grey)
    for cc in hd.users_collection: cc.objects.unlink(hd)
    DUMMY.objects.link(hd); parts.append(hd)
    for p in parts: p.parent = root
    return root
dummy("HERO_tidur", (0, 0.95, 0.5), "lie")                    # shot 01-02
dummy("HERO_duduk_kasur", (0.05, 1.05, 0.52), "sit", 180)     # shot 03 (bangun, menghadap kaki kasur)
dummy("HERO_duduk_tepi", (0.0, -0.05, 0.5), "sit", 180)       # shot 05-06 (tepi kasur, menghadap TV)
dummy("HERO_berdiri_peta", (-0.75, 1.15, 0.0), "stand", 160)   # shot 28

# ---- cameras: one per shot, keyed over the shot's global frame range ----
SHOTS = {  # id: (frame_start, frame_end, lens_mm, cam_from, cam_to, look_from, look_to)
    "01": (0, 57, 32, (0.0, -0.45, 1.55), (0.0, -0.05, 1.58), (0.0, 1.78, 1.6), (0.0, 1.78, 1.6)),
    "02": (58, 129, 26, (1.15, -1.45, 1.45), (1.05, -1.25, 1.42), (0.0, 0.9, 0.85), (0.0, 0.95, 0.85)),
    "03": (130, 205, 30, (-1.55, 0.6, 1.1), (-1.55, 0.6, 1.1), (0.05, 1.05, 0.95), (0.05, 1.05, 0.95)),
    "04": (206, 264, 40, (0.3, -0.55, 0.95), (0.3, -0.8, 0.93), (0.3, -1.6, 0.85), (0.3, -1.6, 0.85)),
    "05": (265, 315, 30, (-0.5, 1.15, 1.45), (-0.45, 0.95, 1.42), (0.3, -1.6, 0.8), (0.3, -1.6, 0.8)),
    "06": (316, 365, 45, (0.2, -1.2, 1.3), (0.15, -0.85, 1.3), (0.0, -0.05, 1.12), (0.0, -0.05, 1.15)),
    "28": (1639, 1754, 32, (-0.2, -0.75, 1.15), (-0.35, -0.2, 1.2), (-0.65, 1.3, 1.05), (-0.55, 1.4, 1.15)),
}
PUSH = {"06": (327, 333)}  # shot 06: quick 6-frame push on "maju", then hold
for sid, (f0, f1, lens, c0, c1, l0, l1) in SHOTS.items():
    cd = bpy.data.cameras.new("CAM_" + sid); cd.lens = lens; cd.sensor_fit = "AUTO"; cd.sensor_width = 36
    cd.clip_start, cd.clip_end = 0.05, 200
    cam = bpy.data.objects.new("CAM_" + sid, cd); CAMS.objects.link(cam)
    tgt = bpy.data.objects.new("CAM_" + sid + "_TARGET", None); CAMS.objects.link(tgt)
    con = cam.constraints.new("TRACK_TO"); con.target = tgt; con.track_axis = "TRACK_NEGATIVE_Z"; con.up_axis = "UP_Y"
    a, b = PUSH.get(sid, (f0, f1))
    for f, cp, lp in ((a, c0, l0), (b, c1, l1)):
        cam.location, tgt.location = cp, lp
        cam.keyframe_insert("location", frame=f); tgt.keyframe_insert("location", frame=f)
    for ob in (cam, tgt):
        for fc in ob.animation_data.action.fcurves:
            for kp in fc.keyframe_points: kp.interpolation = "SINE" if sid == "06" else "LINEAR"
    cam["shot"], cam["frame_start"], cam["frame_end"] = sid, f0, f1
    cam["dummy"] = {"02": "HERO_tidur", "03": "HERO_duduk_kasur", "05": "HERO_duduk_tepi", "06": "HERO_duduk_tepi", "28": "HERO_berdiri_peta"}.get(sid, "")

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "kamar.blend"))
print("SAVED kamar.blend with cameras", sorted(SHOTS))
