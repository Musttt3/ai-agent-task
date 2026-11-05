# Objek utama: peta kepulauan Indonesia 3D berbahan emas (plakat), dari garis pantai Natural Earth 1:50m.
#   blender -b --python sets/build_peta.py -- look      -> assets/peta_emas.blend + review/peta_look_*.png (6 sudut)
#   blender -b sets/kamar.blend --python sets/build_peta.py -- kamar   -> pasang di dinding Kamar (ganti placeholder)
# Pulau = kurva terisi, ekstrusi 3 cm, semua sisi bevel 6 mm; di atas papan kayu gelap. Emas: metallic, peta kasar
# bergores (roughness) dan warna dengan kotoran halus (dua gambar, jadi sama di Blender dan di glTF/Remotion).
import bpy, json, math, os, sys
from mathutils import Vector

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
mode = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "look"
if mode == "look": bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
G = json.load(open(os.path.join(ROOT, "assets", "geo", "indonesia_50m.geojson")))["geometry"]["coordinates"]

LON0, LON1, LAT0, LAT1 = 94.8, 141.2, -11.2, 6.2
W = 1.4                       # plaque width (m)
S = W / (LON1 - LON0)         # metres per degree
def xy(lon, lat): return ((lon - (LON0 + LON1) / 2) * S, (lat - (LAT0 + LAT1) / 2) * S)

def area(r): return 0.5 * abs(sum(r[i][0] * r[i - 1][1] - r[i - 1][0] * r[i][1] for i in range(len(r))))
islands = sorted((p[0] for p in G), key=area, reverse=True)
islands = [r for r in islands if area(r) > 0.012]   # drop specks (< ~0.012 deg^2) so every island reads as a shape

def gold_mat():
    m = bpy.data.materials.get("Emas") or bpy.data.materials.new("Emas")
    m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial"); b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Metallic"].default_value = 1.0
    for name, sock, cs in (("emas_warna", "Base Color", "sRGB"), ("emas_kasar", "Roughness", "Non-Color")):
        t = nt.nodes.new("ShaderNodeTexImage"); t.image = bpy.data.images.load(os.path.join(ROOT, "assets", "tex", name + ".png"), check_existing=True)
        t.image.colorspace_settings.name = cs; nt.links.new(t.outputs["Color"], b.inputs[sock])
    nt.links.new(b.outputs["BSDF"], out.inputs["Surface"]); return m

def board_mat():
    m = bpy.data.materials.get("Papan_Peta") or bpy.data.materials.new("Papan_Peta")
    m.use_nodes = True; b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.03, 0.022, 0.018, 1); b.inputs["Roughness"].default_value = 0.85
    return m

def build(parent_loc=(0, 0, 0), rot=(0, 0, 0)):
    root = bpy.data.objects.new("PETA_EMAS", None); sc.collection.objects.link(root)
    cu = bpy.data.curves.new("PETA_EMAS_pulau", "CURVE"); cu.dimensions = "2D"; cu.fill_mode = "BOTH"
    cu.extrude = 0.015; cu.bevel_depth = 0.0
    for r in islands:
        sp = cu.splines.new("POLY"); sp.points.add(len(r) - 2)
        for i, (lon, lat) in enumerate(r[:-1]):
            x, y = xy(lon, lat); sp.points[i].co = (x, y, 0, 1)
        sp.use_cyclic_u = True
    ob = bpy.data.objects.new("PETA_EMAS_pulau", cu); sc.collection.objects.link(ob)
    ob.data.materials.append(gold_mat()); ob.parent = root; ob.location = (0, 0, 0.032)
    # convert to mesh so it exports to glTF and keeps the bevel
    bpy.context.view_layer.objects.active = ob; ob.select_set(True); bpy.ops.object.convert(target="MESH"); ob.select_set(False)
    import bmesh
    bm = bmesh.new(); bm.from_mesh(ob.data); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0008)
    bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(1), verts=bm.verts, edges=bm.edges, delimit={"NORMAL"})
    bm.to_mesh(ob.data); bm.free()
    for poly in ob.data.polygons: poly.use_smooth = False   # flat: dense coastlines + smooth normals band on the top faces
    bv = ob.modifiers.new("Bevel", "BEVEL"); bv.width = 0.004; bv.segments = 3; bv.limit_method = "ANGLE"
    bv.angle_limit = math.radians(60); bv.use_clamp_overlap = True
    ob.modifiers.new("Tri", "TRIANGULATE")
    # UVs from x/y so the scratch maps lie flat on the islands
    me = ob.data; uv = me.uv_layers.new(name="UVMap")
    for l in me.loops:
        v = me.vertices[l.vertex_index].co; uv.data[l.index].uv = (v.x / 0.5 + 0.5, v.y / 0.5 + 0.5)
    # dark wooden board behind the islands, rounded corners via bevel
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.0)); bd = bpy.context.object; bd.name = "PETA_EMAS_papan"
    bd.scale = (W + 0.12, (LAT1 - LAT0) * S + 0.14, 0.03); bpy.ops.object.transform_apply(scale=True)
    bv = bd.modifiers.new("Bevel", "BEVEL"); bv.width = 0.012; bv.segments = 3
    bd.data.materials.append(board_mat()); bd.parent = root
    for o in (bd,):
        for cc in o.users_collection:
            if cc != sc.collection: cc.objects.unlink(o)
    root.location = parent_loc; root.rotation_euler = rot
    return root

if mode == "look":
    sc.render.engine = "BLENDER_EEVEE_NEXT"; sc.eevee.taa_render_samples = 32
    sc.render.resolution_x, sc.render.resolution_y = 1080, 1080
    sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"
    w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True; nt = w.node_tree
    env = nt.nodes.new("ShaderNodeTexEnvironment"); env.image = bpy.data.images.load(os.path.join(ROOT, "assets", "hdri", "kloofendal_48d_partly_cloudy_puresky.hdr"))
    nt.links.new(env.outputs["Color"], nt.nodes["Background"].inputs["Color"]); nt.nodes["Background"].inputs["Strength"].default_value = 0.8
    root = build((0, 0, 0.35), (math.radians(75), 0, 0))   # standing on the floor, leaning back a little
    bpy.ops.mesh.primitive_plane_add(size=12); fl = bpy.context.object
    fm = bpy.data.materials.new("Lantai_Netral"); fm.use_nodes = True
    fm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.32, 0.32, 0.32, 1); fl.data.materials.append(fm)
    key = bpy.data.objects.new("KEY", bpy.data.lights.new("KEY", "AREA")); key.data.energy = 300; key.data.size = 2
    key.location = (1.5, -2.0, 2.5); key.rotation_euler = (Vector((-1.5, 2.0, -2.2)).to_track_quat("-Z", "Y")).to_euler(); sc.collection.objects.link(key)
    cd = bpy.data.cameras.new("C"); cd.lens = 50; cam = bpy.data.objects.new("C", cd); sc.collection.objects.link(cam); sc.camera = cam
    tgt = Vector((0, 0, 0.35)); out = os.path.join(ROOT, "review")
    for i, (az, el, dist) in enumerate([(0, 15, 2.3), (-40, 15, 2.3), (-85, 10, 2.3), (180, 15, 2.3), (0, 70, 2.4), (35, 35, 1.2)]):
        a, e = math.radians(az), math.radians(el)
        cam.location = tgt + Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e))) * dist
        cam.rotation_euler = (tgt - cam.location).to_track_quat("-Z", "Y").to_euler()
        sc.render.filepath = os.path.join(out, f"peta_look_{i + 1}.png"); bpy.ops.render.render(write_still=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "assets", "peta_emas.blend"))
    print("PETA islands:", len(islands))
else:
    old = bpy.data.objects.get("PETA_EMAS")
    if old:
        for c in list(old.children): bpy.data.objects.remove(c)
        bpy.data.objects.remove(old)
    ph = bpy.data.objects.get("PETA_EMAS_placeholder")
    if ph: ph.hide_render = True; ph.hide_viewport = True
    root = build((0, 1.785, 1.6), (math.radians(90), 0, 0))  # flat on the back wall, islands facing the room (-y), Sumatra on the left
    kam = bpy.data.collections["SET_KAMAR"]
    for o in [root] + list(root.children):
        for cc in o.users_collection: cc.objects.unlink(o)
        kam.objects.link(o)
    bpy.ops.wm.save_mainfile(); print("PETA installed in Kamar")
