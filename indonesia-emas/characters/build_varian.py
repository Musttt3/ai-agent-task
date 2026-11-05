# Karakter pendukung = varian dari HERO (rig dan wajah yang sama), beda rambut, baju, warna, aksesori dan ukuran.
# Urutan (lihat characters/build_all.sh):
#   blender -b --python characters/build_hero.py                       (dasar, belum di-rig)
#   blender -b characters/hero.blend --python characters/build_varian.py -- <varian>   -> characters/<varian>.blend
#   blender -b characters/<varian>.blend --python characters/hero_rig.py
import bpy, math, os, sys
from mathutils import Vector
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sets"))
from lib import mat, ROOT

V = sys.argv[sys.argv.index("--") + 1]
C = bpy.data.collections["HERO"]; HR = bpy.data.objects["HERO_ROOT"]
HC = Vector((0, 0, 1.265))

VARIAN = {  # skin, top (kind, colour), trousers, shoes, hair, accessory, scale
    "anak_a":  dict(kulit=(0.72, 0.4, 0.2), atas=("kemeja", (0.92, 0.92, 0.9)), bawah=(0.62, 0.08, 0.08), celana_pendek=True, sepatu=(0.06, 0.06, 0.06), rambut="pendek", aks=None, skala=0.74),
    "anak_b":  dict(kulit=(0.8, 0.48, 0.28), atas=("kemeja", (0.92, 0.92, 0.9)), bawah=(0.62, 0.08, 0.08), celana_pendek=True, sepatu=(0.06, 0.06, 0.06), rambut="kuncir", aks=None, skala=0.72),
    "anak_c":  dict(kulit=(0.66, 0.36, 0.18), atas=("kaos", (0.95, 0.62, 0.12)), bawah=(0.15, 0.28, 0.55), celana_pendek=True, sepatu=(0.9, 0.9, 0.9), rambut="ikal", aks=None, skala=0.7),
    "perawat": dict(kulit=(0.82, 0.5, 0.3), atas=("kemeja", (0.55, 0.78, 0.86)), bawah=(0.55, 0.78, 0.86), sepatu=(0.95, 0.95, 0.95), rambut="sanggul", aks="topi_perawat", skala=0.97),
    "kakek":   dict(kulit=(0.66, 0.38, 0.2), atas=("batik", None), bawah=(0.25, 0.22, 0.2), sepatu=(0.3, 0.2, 0.12), rambut="uban", aks="peci", skala=0.95),
    "petani":  dict(kulit=(0.6, 0.32, 0.15), atas=("kaos", (0.32, 0.5, 0.3)), bawah=(0.3, 0.26, 0.2), sepatu=(0.25, 0.18, 0.12), rambut="pendek", aks="caping", skala=1.0),
    "guru":    dict(kulit=(0.76, 0.44, 0.24), atas=("batik", None), bawah=(0.1, 0.1, 0.14), sepatu=(0.12, 0.08, 0.06), rambut="pendek", aks="kacamata", skala=1.0),
    "pengemudi": dict(kulit=(0.7, 0.4, 0.2), atas=("jaket", (0.92, 0.45, 0.12)), bawah=(0.12, 0.12, 0.16), sepatu=(0.1, 0.1, 0.1), rambut="pendek", aks="helm", skala=1.0),
}[V]

def setcol(name, rgb):
    m = bpy.data.materials[name]; m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*rgb, 1)
def drop(prefixes):
    for o in [o for o in C.objects if o.name.startswith(prefixes)]: bpy.data.objects.remove(o)
def add(kind, name, loc, m, scale=(1, 1, 1), rot=(0, 0, 0), **kw):
    getattr(bpy.ops.mesh, "primitive_" + kind + "_add")(location=loc, rotation=rot, **kw)
    o = bpy.context.object; o.name = name; o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for cc in o.users_collection: cc.objects.unlink(o)
    C.objects.link(o); o.data.materials.append(m); o.parent = HR
    for p in o.data.polygons: p.use_smooth = True
    return o

# skin, trousers, shoes
setcol("Kulit", VARIAN["kulit"]); setcol("Celana", VARIAN["bawah"]); setcol("Sepatu", VARIAN["sepatu"])
if VARIAN.get("celana_pendek"):  # shorts: the shin shows skin
    for o in C.objects:
        if o.name.startswith(("Betis", "Lutut")): o.data.materials[0] = bpy.data.materials["Kulit"]
# top: replace the hoodie look (hood + logo go; colour or batik on the body and sleeves)
kind, col = VARIAN["atas"]
drop(("Logo", "Hoodie_Tudung", "Hoodie_Saku"))
if kind == "batik":
    top = mat("Baju_" + V, "batik_parang", rough=0.85)
    for o in C.objects:
        if o.name.startswith(("Hoodie", "Lengan_Hoodie")):
            o.data.materials[0] = top
            uv = o.data.uv_layers.active or o.data.uv_layers.new()
            for l in o.data.loops:  # box-ish UV so the motif shows at a sensible size
                v = o.matrix_world @ o.data.vertices[l.vertex_index].co; uv.data[l.index].uv = (v.x * 3 + v.y * 3, v.z * 3)
else:
    setcol("Hoodie", col)
    bpy.data.materials["Hoodie"].node_tree.nodes["Principled BSDF"].inputs["Sheen Weight"].default_value = 0.0
if kind in ("kemeja", "batik"):  # a little collar
    add("cube", "Kerah_a", (-0.05, -0.1, 1.1), bpy.data.materials["Hoodie"] if kind == "kemeja" else top, scale=(0.05, 0.012, 0.03), rot=(0, math.radians(-25), 0))
    add("cube", "Kerah_b", (0.05, -0.1, 1.1), bpy.data.materials["Hoodie"] if kind == "kemeja" else top, scale=(0.05, 0.012, 0.03), rot=(0, math.radians(25), 0))
if kind == "jaket":
    add("cube", "Ritsleting", (0, -0.126, 0.9), mat("Ritsleting", color=(0.2, 0.2, 0.2), rough=0.4), scale=(0.004, 0.003, 0.2))
# hair
hair_m = bpy.data.materials["Rambut"]
style = VARIAN["rambut"]
if style != "ikal":
    drop(("Rambut",))
    if style == "uban": hair_m = mat("Rambut_Uban", color=(0.75, 0.74, 0.72), rough=0.6)
    if style in ("pendek", "uban", "sanggul", "kuncir"):  # short smooth cap following the head
        add("uv_sphere", "Rambut", HC + Vector((0, 0.02, 0.045)), hair_m, scale=(1.04, 1.0, 0.93), radius=0.205, segments=48, ring_count=24)
        cap = bpy.data.objects["Rambut"]
        # cut the face open: delete the vertices in front, below the hairline
        import bmesh
        bm = bmesh.new(); bm.from_mesh(cap.data)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if (v.co.y < -0.06 and v.co.z < 0.07) or v.co.z < (-0.1 if v.co.y > 0.05 else 0.0)], context="VERTS")
        bm.to_mesh(cap.data); bm.free()
        sol = cap.modifiers.new("Tebal", "SOLIDIFY"); sol.thickness = 0.012
    if style == "kuncir":
        for s in (-1, 1): add("uv_sphere", f"Rambut_Kuncir_{s}", HC + Vector((s * 0.21, 0.04, 0.05)), hair_m, scale=(0.7, 0.8, 1.1), radius=0.06)
    if style == "sanggul":
        add("uv_sphere", "Rambut_Sanggul", HC + Vector((0, 0.2, 0.08)), hair_m, radius=0.075)
# accessories
A = VARIAN["aks"]
if A == "peci":
    add("cylinder", "Peci", HC + Vector((0, 0.01, 0.2)), mat("Peci", color=(0.02, 0.02, 0.02), rough=0.7), scale=(1.0, 0.85, 1.0), radius=0.17, depth=0.11)
elif A == "caping":
    add("cone", "Caping", HC + Vector((0, 0.0, 0.25)), mat("Caping", "tikar", rough=0.9), radius1=0.36, radius2=0.01, depth=0.16)
elif A == "kacamata":
    lens = mat("Bingkai_Kacamata", color=(0.05, 0.04, 0.04), rough=0.4)
    for s in (-1, 1): add("torus", f"Kacamata_{s}", HC + Vector((s * 0.062, -0.2, 0.026)), lens, rot=(math.radians(90), 0, 0), major_radius=0.05, minor_radius=0.005)
    add("cylinder", "Kacamata_Jembatan", HC + Vector((0, -0.2, 0.03)), lens, rot=(0, math.radians(90), 0), radius=0.004, depth=0.03)
elif A == "topi_perawat":
    add("cube", "Topi_Perawat", HC + Vector((0, -0.02, 0.215)), mat("Topi_Putih", color=(0.96, 0.96, 0.95), rough=0.6), scale=(0.11, 0.06, 0.035))
elif A == "helm":
    add("uv_sphere", "Helm", HC + Vector((0, 0.01, 0.05)), mat("Helm", color=(0.92, 0.45, 0.12), rough=0.35), scale=(1.15, 1.12, 1.08), radius=0.215, segments=48, ring_count=24)
    h = bpy.data.objects["Helm"]
    import bmesh
    bm = bmesh.new(); bm.from_mesh(h.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if (v.co.y < -0.05 and v.co.z < 0.07) or v.co.z < -0.08], context="VERTS")
    bm.to_mesh(h.data); bm.free(); h.modifiers.new("Tebal", "SOLIDIFY").thickness = 0.015
HR["varian"] = V; HR["skala"] = VARIAN["skala"]   # applied after rigging (hero_rig.py)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "characters", V + ".blend"))
print("SAVED", V)
