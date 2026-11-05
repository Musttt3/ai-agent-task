# Set KAMAR, tahap 2 (CAHAYA). Jalankan sesudah build_kamar.py:
#   blender -b sets/kamar.blend --python sets/kamar_cahaya.py
# Satu cahaya utama per waktu: subuh (shot 01-02) = bulan biru lewat jendela; pagi (shot 03-06, 28) = matahari
# miring lewat jendela kayu. Pendukung: lampu hangat di plafon (pelan), HDRI Poly Haven untuk isian dan
# pemandangan jendela, cahaya biru TV saat TV menyala (shot 04-06), kilau peta di kata "emas" (frame 104).
import bpy, math, os
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(bpy.data.filepath))
HDRI = os.path.join(HERE, "..", "assets", "hdri")
sc = bpy.context.scene
MORNING = 130  # first morning frame (shot 03)
LIGHT = bpy.data.collections.get("LIGHTS") or bpy.data.collections.new("LIGHTS")
if LIGHT.name not in sc.collection.children: sc.collection.children.link(LIGHT)
for o in list(LIGHT.objects): bpy.data.objects.remove(o)

def key(datablock, path, pairs, interp="CONSTANT"):
    for f, v in pairs:
        setattr(datablock, path, v); datablock.keyframe_insert(path, frame=f)
    for fc in datablock.animation_data.action.fcurves:
        if fc.data_path == path:
            for kp in fc.keyframe_points: kp.interpolation = interp

def lamp(name, kind, color, loc=(0, 0, 0), aim=None, **kw):
    ld = bpy.data.lights.new(name, kind); ld.color = color
    for k, v in kw.items(): setattr(ld, k, v)
    o = bpy.data.objects.new(name, ld); LIGHT.objects.link(o); o.location = loc
    if aim is not None: o.rotation_euler = Vector(aim).normalized().to_track_quat("-Z", "Y").to_euler()
    return o

# main lights: through the left-wall window, travelling toward +x and down
sun = lamp("MATAHARI", "SUN", (1.0, 0.86, 0.68), aim=(0.78, -0.28, -0.56), angle=math.radians(1.5))
key(sun.data, "energy", [(0, 0.0), (MORNING, 7.0)])
moon = lamp("BULAN", "SUN", (0.55, 0.68, 1.0), aim=(0.8, -0.2, -0.56), angle=math.radians(3))
key(moon.data, "energy", [(0, 1.1), (MORNING, 0.0)])
# warm support: ceiling bulb (soft, low) — morning bounce feel; very low at dawn
fill = lamp("LAMPU_HANGAT", "AREA", (1.0, 0.72, 0.45), loc=(0.3, 0.2, 2.7), aim=(0, 0, -1), size=1.2)
key(fill.data, "energy", [(0, 1.5), (MORNING, 10.0)])
# window bounce: soft warm area light just inside the window so the sunlit side reads warm, not grey
bounce = lamp("PANTULAN_JENDELA", "AREA", (1.0, 0.82, 0.6), loc=(-1.85, 0.65, 1.55), aim=(1, 0, -0.15), size=1.0)
key(bounce.data, "energy", [(0, 0.0), (MORNING, 14.0)])
# TV glow (on from shot 04 to the end of shot 06)
tv = lamp("TV_GLOW", "AREA", (0.6, 0.78, 1.0), loc=(0.3, -1.52, 0.86), aim=(0, 1, 0.05), shape="RECTANGLE", size=0.8, size_y=0.48)
key(tv.data, "energy", [(0, 0.0), (206, 18.0), (366, 0.0)])
# map glint on "emas" (frame 104), warm and short, plus a faint glow in shot 01
glint = lamp("KILAU_PETA", "SPOT", (1.0, 0.86, 0.6), loc=(-0.6, 0.3, 2.5), aim=(0.6, 1.48, -0.9), spot_size=math.radians(42), spot_blend=0.5, shadow_soft_size=0.08)
key(glint.data, "energy", [(0, 9.0), (57, 9.0), (58, 5.0), (95, 5.0), (104, 40.0), (118, 8.0), (MORNING, 0.0), (1639, 6.0)], "BEZIER")

# window bars (kusen) so the sun draws a crisp window pattern on the bed and floor
grey = bpy.data.materials.get("BLOCK_GREY")
SET = bpy.data.collections["SET_KAMAR"]
for n in [o.name for o in SET.objects if o.name.startswith("Jendela_Jeruji")]: bpy.data.objects.remove(bpy.data.objects[n])
for i, (y, z, sy, sz) in enumerate([(0.48, 1.55, 0.04, 1.1), (0.82, 1.55, 0.04, 1.1), (0.65, 1.55, 1.0, 0.04)]):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(-2.0, y, z)); o = bpy.context.object
    o.name = f"Jendela_Jeruji_{i}"; o.scale = (0.05, sy, sz); bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(grey)
    for cc in o.users_collection: cc.objects.unlink(o)
    SET.objects.link(o)

# world: two Poly Haven HDRIs (night / morning) mixed on the cut to morning; low strength = fill only
w = sc.world or bpy.data.worlds.new("World"); sc.world = w; w.use_nodes = True
nt = w.node_tree; nt.nodes.clear()
out = nt.nodes.new("ShaderNodeOutputWorld"); mix = nt.nodes.new("ShaderNodeMixShader")
envs = []
for name, strength in (("dikhololo_night", 0.6), ("kloofendal_48d_partly_cloudy_puresky", 0.3)):
    tx = nt.nodes.new("ShaderNodeTexEnvironment"); tx.image = bpy.data.images.load(os.path.join(HDRI, name + ".hdr"), check_existing=True)
    bg = nt.nodes.new("ShaderNodeBackground"); bg.inputs["Strength"].default_value = strength
    nt.links.new(tx.outputs["Color"], bg.inputs["Color"]); envs.append(bg)
nt.links.new(envs[0].outputs[0], mix.inputs[1]); nt.links.new(envs[1].outputs[0], mix.inputs[2]); nt.links.new(mix.outputs[0], out.inputs[0])
fac = mix.inputs["Fac"]
for f, v in ((0, 0.0), (MORNING, 1.0)):
    fac.default_value = v; fac.keyframe_insert("default_value", frame=f)
for fc in nt.animation_data.action.fcurves:
    for kp in fc.keyframe_points: kp.interpolation = "CONSTANT"

# shot 05: camera further left so the TV clears the head (block-out note)
cam = bpy.data.objects["CAM_05"]
if not cam.get("moved_left"):
  cam["moved_left"] = True
  for fc in cam.animation_data.action.fcurves:
    if fc.array_index == 0:
        for kp in fc.keyframe_points: kp.co[1] -= 0.25; kp.handle_left[1] -= 0.25; kp.handle_right[1] -= 0.25

# render look: Eevee, soft shadows, AgX
sc.render.engine = "BLENDER_EEVEE_NEXT"
sc.eevee.taa_render_samples = 16
sc.eevee.use_shadows = True
sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "AgX - Medium High Contrast"
bpy.ops.wm.save_mainfile()
print("SAVED lighting")
