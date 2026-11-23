# Realistic characters with MPFB (MakeHuman for Blender). Import inside Blender:
#   import sys; sys.path.insert(0, "<project>/characters"); from mh_lib import build_char
# A spec is a dict: name, phenotype (gender 0 female..1 male, age 0..1 where 0.5 = 25 y, 1 = 90 y, muscle, weight,
# height, race {asian, caucasian, african}), skin (folder in data/skins), hair, eyebrows, eyes colour, clothes [..].
import bpy, os
from bl_ext.user_default.mpfb.services import HumanService, LocationService, TargetService

DATA = LocationService.get_user_data()
SYS = os.path.join(os.path.dirname(os.path.dirname(LocationService.get_user_data())), "")  # unused, kept for reference

def _asset(kind, name, ext=".mhclo"):
    p = os.path.join(DATA, kind, name, name + ext)
    if not os.path.exists(p):
        raise FileNotFoundError(p)
    return p

def build_char(spec, subdiv=1):
    ph = TargetService.get_default_macro_info_dict()
    for k, v in spec.get("phenotype", {}).items():
        if k == "race": ph["race"].update(v)
        else: ph[k] = v
    body = HumanService.create_human(macro_detail_dict=ph)
    body.name = spec["name"] + ".body"
    if subdiv:
        m = body.modifiers.new("Subdivision", "SUBSURF"); m.levels = subdiv; m.render_levels = subdiv   # same in viewport and render (surface-deformed brows stay bound)
    rig = HumanService.add_builtin_rig(body, "default")
    rig.name = spec["name"] + ".rig"
    HumanService.add_mhclo_asset(_asset("eyes", "high-poly"), body, asset_type="Eyes", subdiv_levels=0, material_type="MAKESKIN")
    HumanService.add_mhclo_asset(_asset("eyebrows", spec.get("eyebrows", "eyebrow001")), body, asset_type="Eyebrows", subdiv_levels=0, material_type="MAKESKIN")
    HumanService.add_mhclo_asset(_asset("eyelashes", spec.get("eyelashes", "eyelashes01")), body, asset_type="Eyelashes", subdiv_levels=0, material_type="MAKESKIN")
    for t in ("teeth", "tongue"):
        d = os.path.join(DATA, t)
        if os.path.isdir(d):
            nm = sorted(os.listdir(d))[0]
            try: HumanService.add_mhclo_asset(_asset(t, nm), body, asset_type=t.capitalize(), subdiv_levels=0, material_type="MAKESKIN")
            except Exception as e: print("skip", t, e)
    if spec.get("hair"):
        HumanService.add_mhclo_asset(_asset("hair", spec["hair"]), body, asset_type="Hair", subdiv_levels=0, material_type="MAKESKIN")
    for c in spec.get("clothes", []):
        HumanService.add_mhclo_asset(_asset("clothes", c), body, asset_type="Clothes", subdiv_levels=1, material_type="MAKESKIN")
    HumanService.set_character_skin(_asset("skins", spec["skin"], ".mhmat"), body, skin_type=spec.get("skin_type", "ENHANCED_SSS"))
    if spec.get("skin_tone"):
        skin_tone(body, spec["skin_tone"])
    for suffix, rgb in spec.get("tint", {}).items():
        o = bpy.data.objects.get(spec["name"] + "." + suffix)
        if o: tint(o, rgb)
        else: print("TINT: no object", suffix)
    return body, rig

def _mul_inputs(nt, rgb, keys=("Base Color", "Subsurface Color")):
    for bsdf in [n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"]:
        for key in keys:
            if key not in bsdf.inputs: continue
            inp = bsdf.inputs[key]
            mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"
            mix.inputs["Factor"].default_value = 1.0; mix.inputs[7].default_value = (*rgb, 1)
            if inp.links: nt.links.new(inp.links[0].from_socket, mix.inputs[6])
            else: mix.inputs[6].default_value = inp.default_value
            nt.links.new(mix.outputs[2], inp)
    for g in [n for n in nt.nodes if n.type == "GROUP" and n.node_tree]:
        if g.node_tree.get("_toned"): continue
        g.node_tree["_toned"] = True
        _mul_inputs(g.node_tree, rgb, keys)

def skin_tone(body, rgb):
    """darken/warm the skin (MakeHuman's asian textures are very light): multiply base and SSS colour, also inside groups"""
    for slot in body.material_slots:
        if slot.material and slot.material.use_nodes: _mul_inputs(slot.material.node_tree, rgb)

def tint(o, rgb):
    """recolour a costume: grey-scale its diffuse texture (keeps weave/folds), then multiply by rgb"""
    for slot in o.material_slots:
        m = slot.material
        if not m or not m.use_nodes: continue
        m = m.copy(); slot.material = m
        nt = m.node_tree
        bsdf = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if not bsdf: continue
        inp = bsdf.inputs["Base Color"]
        mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"
        mix.inputs["Factor"].default_value = 1.0; mix.inputs[7].default_value = (*rgb, 1)
        if inp.links:
            src = inp.links[0].from_socket
            bw = nt.nodes.new("ShaderNodeRGBToBW"); nt.links.new(src, bw.inputs[0])
            mean = 0.5
            img = src.node.image if src.node.type == "TEX_IMAGE" else next((n.image for n in nt.nodes if n.type == "TEX_IMAGE" and "diffuse" in n.name.lower() and n.image), None)
            if img:   # normalise brightness: the texture's mean luminance maps to 0.62
                try:
                    sm = img.copy(); sm.scale(32, 32); px = list(sm.pixels); bpy.data.images.remove(sm)
                    lum = [0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2] for i in range(0, len(px), 4)]
                    mean = max(0.03, sum(lum) / len(lum))
                except Exception as e: print("TINT mean", e)
            mr = nt.nodes.new("ShaderNodeMapRange"); mr.clamp = True
            mr.inputs["From Min"].default_value = 0.0; mr.inputs["From Max"].default_value = mean / (0.9 if max(rgb) > 0.8 else 0.62)
            nt.links.new(bw.outputs[0], mr.inputs["Value"]); nt.links.new(mr.outputs["Result"], mix.inputs[6])
        else:
            mix.inputs[6].default_value = (0.6, 0.6, 0.6, 1)
        nt.links.new(mix.outputs[2], inp)

def aim_bone(rig, bone, direction, blend=1.0):
    """rotate pose bone so its head->tail axis points along `direction` (world vector), relative to its parent's
    current pose (call parents first). blend < 1 rotates part of the way."""
    from mathutils import Vector, Quaternion
    bpy.context.view_layer.update()
    pb = rig.pose.bones[bone]; pb.rotation_mode = "QUATERNION"
    pb.rotation_quaternion = Quaternion(); bpy.context.view_layer.update()
    M = rig.matrix_world @ pb.matrix            # current world matrix of the bone (with identity local rotation)
    cur = (M.to_3x3() @ Vector((0, 1, 0))).normalized()
    q = cur.rotation_difference(Vector(direction).normalized())
    if blend < 1: q = Quaternion().slerp(q, blend)
    R3 = M.to_3x3().normalized()
    local = (R3.inverted() @ q.to_matrix() @ R3).to_quaternion()
    pb.rotation_quaternion = local; bpy.context.view_layer.update()

def side_sign(rig, bone):
    return 1 if (rig.matrix_world @ rig.pose.bones[bone].head).x > 0 else -1

def arms_down(rig, out=0.28):
    """relaxed standing arms: upper arms down and slightly out, forearms slightly forward"""
    for side in ("L", "R"):
        ua = f"upperarm01.{side}"
        if ua not in rig.pose.bones: continue
        sg = side_sign(rig, ua)
        aim_bone(rig, ua, (sg * out, 0.02, -1))
        for b in (f"upperarm02.{side}",):
            if b in rig.pose.bones: aim_bone(rig, b, (sg * out, 0.02, -1))
        for b in (f"lowerarm01.{side}", f"lowerarm02.{side}"):
            if b in rig.pose.bones: aim_bone(rig, b, (sg * 0.12, -0.18, -1))
