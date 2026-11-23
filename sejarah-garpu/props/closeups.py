# Close-up QA of hero props: blender -b --python props/closeups.py -> review/properti_closeup.png (grid)
import bpy, sys, os, math
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import props as PR
import numpy as np
OUT = os.path.join(HERE, "..", "review")
shots = [("garpu_emas", lambda: PR.garpu_emas(), 0.11, (0, 0, 0.01)), ("garpu_coryat", lambda: PR.garpu_coryat(), 0.12, (0, 0, 0.02)),
         ("cochlear", lambda: PR.sendok_cochlear(), 0.1, (0, 0, 0.0)), ("sumpit", lambda: PR.sumpit_perunggu(), 0.17, (0, 0, 0.04)),
         ("kerang", lambda: PR.cangkang_kerang(), 0.1, (0, 0, 0.0)), ("siput", lambda: PR.siput(body_out=0.5), 0.07, (0, 0, 0.018)),
         ("ding", lambda: PR.ding(), 0.75, (0, 0, 0.22)), ("daging", lambda: PR.daging_bakar(), 0.32, (0, 0, 0.0)),
         ("mangkuk", lambda: PR.mangkuk_batu(), 0.32, (0, 0, 0.05)), ("daun", lambda: PR.nasi_di_daun(), 0.3, (0.02, 0, 0.03))]
ONLY = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
if ONLY: shots = [x for x in shots if x[0] in ONLY]
tiles = []
for nm, fn, size, look in shots:
    bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
    o = fn()
    flat = nm in ("garpu_emas", "garpu_coryat", "cochlear", "sumpit", "kerang")
    if flat and nm != "kerang": o.rotation_euler = (math.radians(90), 0, math.radians(90)); o.location = (0, 0, 0.006)
    if nm == "kerang": o.rotation_euler = (math.radians(-90), 0, 0); o.location = (0, -0.03, 0.0)
    bpy.ops.mesh.primitive_plane_add(size=10); fl = bpy.context.object
    fl.data.materials.append(PR.mat_noise_color("Meja_Kayu", (0.24, 0.14, 0.08), (0.14, 0.08, 0.04), scale=6, rough=0.55, bump=0.05))
    sc.render.engine = "CYCLES"; sc.cycles.samples = 64; sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = 600, 600; sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"
    w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True; w.node_tree.nodes["Background"].inputs[0].default_value = (0.05, 0.05, 0.06, 1)
    tgt = Vector(look)
    for ln, d, e in (("K", Vector((-1, -1.2, 1.3)), 6), ("R", Vector((0.8, 1.2, 0.9)), 4)):
        ld = bpy.data.lights.new(ln, "AREA"); ld.energy = e * (size / 0.2) ** 2; ld.size = size * 1.5
        lo = bpy.data.objects.new(ln, ld); sc.collection.objects.link(lo); lo.location = tgt + d * size * 1.6
        lo.rotation_euler = (tgt - lo.location).to_track_quat("-Z", "Y").to_euler()
    cd = bpy.data.cameras.new("C"); cd.lens = 60; cd.clip_start = 0.005
    cam = bpy.data.objects.new("C", cd); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = tgt + Vector((0.35, -1.0, 0.75)).normalized() * size * 2.0
    cam.rotation_euler = (tgt - cam.location).to_track_quat("-Z", "Y").to_euler()
    p = os.path.join(OUT, f"_c_{nm}.png"); sc.render.filepath = p; bpy.ops.render.render(write_still=True); tiles.append(p); print("CLOSE", nm)
imgs = [bpy.data.images.load(p) for p in tiles]
cols = 5; rows = (len(imgs) + cols - 1) // cols; W = H = 600
buf = np.zeros((rows * H, cols * W, 4), dtype=np.float32)
for i, im in enumerate(imgs):
    a = np.array(im.pixels[:], dtype=np.float32).reshape(H, W, 4); r = rows - 1 - i // cols; c = i % cols
    buf[r * H:(r + 1) * H, c * W:(c + 1) * W] = a
g = bpy.data.images.new("grid", cols * W, rows * H); g.pixels = buf.ravel(); g.filepath_raw = os.path.join(OUT, "properti_closeup.png" if not ONLY else "_closeup_" + "_".join(ONLY) + ".png"); g.file_format = "PNG"; g.save()
for p in tiles: os.remove(p)
print("GRID ok")
