# Export one set for the Remotion/three.js render (hybrid pipeline):
#   blender -b sets/<set>.blend --python sets/export_set.py -- <set>
# -> export/<set>.glb   geometry + materials (modifiers applied), Y-up
#    export/<set>.json  per frame for this set's shots: cameras (pos, target, vfov, focus distance, f-stop),
#                       animated nodes (local TRS), animated emission strengths, lights (with animated energy),
#                       stand-in placements per shot (characters go there), world (hdri / sky).
# Coordinates are converted to glTF Y-up: (x, y, z) -> (x, z, -y).
import bpy, json, math, os, sys
from mathutils import Vector, Quaternion
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
NAME = sys.argv[sys.argv.index("--") + 1]
OUT = os.path.join(ROOT, "export"); os.makedirs(OUT, exist_ok=True)
sc = bpy.context.scene
SKIP = {"CAMERAS", "STANDINS", "MARKS", "LIGHTS", "DUMMY_HERO"}

def yup(v): return [round(v[0], 5), round(v[2], 5), round(-v[1], 5)]
def yup_q(q): return [round(q.x, 6), round(q.z, 6), round(-q.y, 6), round(q.w, 6)]   # three: x, y, z, w
def yup_s(s): return [round(s[0], 5), round(s[2], 5), round(s[1], 5)]

def in_skip(o):
    return any(c.name in SKIP for c in o.users_collection)
def root_of(o):
    while o.parent: o = o.parent
    return o

cams = sorted([o for o in sc.objects if o.type == "CAMERA" and o.name.startswith("CAM_")], key=lambda o: o.name)
frames = sorted({f for c in cams for f in range(int(c["frame_start"]), int(c["frame_end"]) + 1)})

# ---------------- geometry ----------------
bpy.ops.object.select_all(action="DESELECT")
export_objs = [o for o in sc.objects if not in_skip(o) and o.type in ("MESH", "EMPTY", "CURVE") and not o.hide_render and not root_of(o).name.startswith(("HERO_", "FIG_"))]
for o in export_objs:
    o.hide_set(False); o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, NAME + ".glb"), export_format="GLB", use_selection=True, export_apply=True,
                          export_cameras=False, export_lights=False, export_animations=False, export_yup=True, export_extras=True)

# ---------------- animated things, sampled per frame ----------------
def animated(o):
    while o:
        if o.animation_data and o.animation_data.action: return True
        o = o.parent
    return False
anim_nodes = [o for o in export_objs if o.animation_data and o.animation_data.action]
mats = [m for m in bpy.data.materials if m.node_tree and m.node_tree.animation_data and m.node_tree.animation_data.action]
lights = [o for o in sc.objects if o.type == "LIGHT"]
standins = [o for o in sc.objects if o.parent is None and o.name.startswith(("HERO_", "FIG_"))]

data = {"set": NAME, "frames": [frames[0], frames[-1]] if frames else [], "cameras": {}, "nodes": {o.name: {} for o in anim_nodes},
        "emission": {m.name: {} for m in mats}, "lights": {}, "standins": {}, "marks": {}}
for c in cams:
    data["cameras"][c.name[4:]] = {"start": int(c["frame_start"]), "end": int(c["frame_end"]), "show": [s for s in (c.get("show", "") + "," + c.get("dummy", "")).split(",") if s], "keys": []}
for L in lights:
    d = L.data
    data["lights"][L.name] = {"type": d.type, "color": list(d.color), "energy": {}, "pos": yup(L.matrix_world.translation),
                              "dir": yup(L.matrix_world.to_3x3() @ Vector((0, 0, -1))),
                              "size": getattr(d, "size", 0.0), "size_y": getattr(d, "size_y", 0.0), "spot": getattr(d, "spot_size", 0.0)}
for f in frames:
    sc.frame_set(f)
    for c in cams:
        if int(c["frame_start"]) <= f <= int(c["frame_end"]):
            tgt = bpy.data.objects[c.name + "_TARGET"].matrix_world.translation
            fo = c.data.dof.focus_object
            fd = (fo.matrix_world.translation - c.matrix_world.translation).length if fo else 5.0
            vfov = 2 * math.degrees(math.atan(c.data.sensor_width / 2 / c.data.lens))   # sensor fit AUTO, portrait -> height
            data["cameras"][c.name[4:]]["keys"].append([f, yup(c.matrix_world.translation), yup(tgt), round(vfov, 3), round(fd, 3), c.data.dof.aperture_fstop])
    for o in anim_nodes:
        m = o.matrix_local; t, q, s = m.decompose()
        data["nodes"][o.name][f] = [yup(t), yup_q(q), yup_s(s)]
    for m in mats:
        b = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if b: data["emission"][m.name][f] = round(b.inputs["Emission Strength"].default_value, 4)
    for L in lights:
        data["lights"][L.name]["energy"][f] = round(L.data.energy, 4)
    for s in standins:
        t, q, sc_ = s.matrix_world.decompose()
        yaw = s.matrix_world.to_euler().z
        data["standins"].setdefault(s.name, {})[f] = [yup(t), round(yaw, 4), round(sc_[0], 4)]
# compress: keep only frames where a value changes
def squeeze(d):
    out, last = {}, None
    for k in sorted(d, key=int):
        if d[k] != last: out[k] = d[k]; last = d[k]
    return out
for k in data["nodes"]: data["nodes"][k] = squeeze(data["nodes"][k])
for k in data["emission"]: data["emission"][k] = squeeze(data["emission"][k])
for k in data["lights"]: data["lights"][k]["energy"] = squeeze(data["lights"][k]["energy"])
for k in data["standins"]: data["standins"][k] = squeeze(data["standins"][k])
for o in sc.objects:
    if o.name.startswith("MARK_"): data["marks"][o.name[5:]] = yup(o.matrix_world.translation)
w = sc.world
if w and w.use_nodes:
    env = next((n for n in w.node_tree.nodes if n.type == "TEX_ENVIRONMENT"), None)
    sky = next((n for n in w.node_tree.nodes if n.type == "TEX_SKY"), None)
    bgs = [n for n in w.node_tree.nodes if n.type == "BACKGROUND"]
    data["world"] = {"hdri": [os.path.basename(n.image.filepath) for n in w.node_tree.nodes if n.type == "TEX_ENVIRONMENT" and n.image],
                     "strength": [n.inputs["Strength"].default_value for n in bgs], "sky": bool(sky)}
json.dump(data, open(os.path.join(OUT, NAME + ".json"), "w"), separators=(",", ":"))
print("EXPORTED", NAME, len(frames), "frames,", len(anim_nodes), "animated nodes,", len(cams), "cameras")
