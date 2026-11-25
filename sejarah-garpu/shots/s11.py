# Shot 11 — "buat mencungkil siput dari cangkangnya." (617-688). Macro on the plate: the point of the cochlear
# goes into a snail's shell and draws the snail out (640).
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot_lib import *
SID = "11"; f0, f1, _ = SHOTS[SID]
sc = open_set("romawi", SID)
b, r = actor("romawi", loc=Vector((0.15, 0.78, 0)), yaw=0)
P.sit(r, b, seat_z(0.15, 0.8), lean=24, spread=0.1)
X, F, U = P.char_axes(r)
for o in bpy.data.objects:
    if o.name.startswith(("Mensa", "Kaki_Mensa", "Alas_Mensa")) or (o.users_collection and o.users_collection[0].name == "PROPS" and o.parent is None):
        o.location.y -= 0.16
bpy.context.view_layer.update()
co = bpy.data.objects["SENDOK_ROMAWI"]; co["grip_mode"] = "pena"
sn = bpy.data.objects["SIPUT_1"]
sn.location.y = 0.08; bpy.context.view_layer.update()            # this snail sits at his edge of the mensa (within reach)
mouth_local = Vector(sn["mulut"]); ap = sn.matrix_world @ mouth_local
# a second snail object with the body drawn out, swapped in at 640 (the drawn-out body follows the point)
sn2 = PR.siput("SIPUT_KELUAR", bpy.data.collections["PROPS"], body_out=1.0); sn2.matrix_world = sn.matrix_world.copy()
hide_between(sn2, 640); hide_between(sn, f0 - 10, 640)
into = ap + (ap - sn.matrix_world.translation).normalized() * 0.0
out_dir = (ap - sn.matrix_world.translation); out_dir.z = 0; out_dir.normalize()
d_poke = (-U * 0.75 - out_dir * 0.6).normalized()
errs = hold(co, r, "R", [(f0, ap + out_dir * 0.05 + U * 0.05), (632, ap + out_dir * 0.004 + U * 0.004), (640, ap - out_dir * 0.006), (660, ap + out_dir * 0.03 + U * 0.02), (f1, ap + out_dir * 0.06 + U * 0.05)],
            point_local=Vector(co["tip"]), grip_local=(0, 0, -0.01), pole=-U * 0.8 - X * 0.6, hand_dir=d_poke, palm_dir=(X * 0.7 - U * 0.5).normalized(),
            fingers=(1, 3), pre_shape=("garpu", 1.0), prop_dirs={f: d_poke for f in (f0, 632, 640, 660, f1)})
print("HOLD", errs)
# the drawn-out snail body rides on the point after 640
sn2.parent = None
c = sn2.constraints.new("CHILD_OF"); c.target = co
bpy.context.scene.frame_set(640); bpy.context.view_layer.update()
c.inverse_matrix = co.matrix_world.inverted()
cen = sn.matrix_world.translation
cam = camera(SID, 85, [(f0, cen + Vector((0.12, -0.32, 0.16)), cen + Vector((0, 0, 0.01))), (f1, cen + Vector((0.1, -0.28, 0.15)), cen + Vector((0, 0, 0.02)))], focus=ap, fstop=4.0)
finish(SID, chars=[(b, r)], props=[co], env=[bpy.data.objects["Mensa"]])
if "stills" in sys.argv: print("STILLS", stills(SID, [f0, 640, f1]))
