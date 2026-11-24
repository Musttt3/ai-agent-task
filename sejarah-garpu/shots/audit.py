# Anatomy + motion audit of a built shot.
#   blender -b shots/blend/<SID>.blend --python shots/audit.py -- <SID> [step]
# Fingers: every joint's bend is measured against its parent bone, signed by the palm normal
#   (+ = flex toward the palm, - = bent backwards). Flags backwards bends, over-curl and sideways splay.
# Wrist: hand vs forearm flexion/extension and sideways deviation.
# Motion: wrist/head speed and acceleration spikes (pops), and per-bone rotation jumps (flips/spins).
import bpy, sys, os, math
from mathutils import Vector
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "characters"))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot_lib import SHOTS

a = sys.argv[sys.argv.index("--") + 1:]
SID = a[0]; step = int(a[1]) if len(a) > 1 else 1
f0, f1, _ = SHOTS[SID]
sc = bpy.context.scene
rigs = [o for o in bpy.data.objects if o.type == "ARMATURE" and not o.hide_render and o.name.endswith(".rig")]

def W(r, b, tail=False):
    pb = r.pose.bones[b]; return r.matrix_world @ (pb.tail if tail else pb.head)

def palm(r, s):
    w = W(r, f"wrist.{s}"); k2 = W(r, f"finger2-1.{s}"); k5 = W(r, f"finger5-1.{s}"); k3 = W(r, f"finger3-1.{s}")
    along = (k3 - w).normalized(); across = (k2 - k5).normalized()
    n = along.cross(across).normalized()
    if s == "R": n = -n
    return along, across, n

def flex(p, d, lat):
    """signed flexion (deg) from direction p to d about the lateral axis lat (+ = toward the palm),
    and sideways deviation (deg) out of the flexion plane"""
    pp = (p - lat * p.dot(lat)); dd = (d - lat * d.dot(lat))
    if pp.length < 1e-6 or dd.length < 1e-6: return 0.0, 0.0
    ang = math.degrees(pp.angle(dd)); sg = 1 if pp.cross(dd).dot(lat) >= 0 else -1
    side = math.degrees(math.asin(max(-1, min(1, d.dot(lat)))) - math.asin(max(-1, min(1, p.dot(lat)))))
    return sg * ang, side

issues = {}
def flag(kind, f, msg):
    issues.setdefault(kind, []).append((f, msg))

prev = {}; prev2 = {}; prevq = {}
for f in range(f0, f1 + 1, step):
    sc.frame_set(f)
    for r in rigs:
        body = next((c for c in r.children if c.type == "MESH" and c.name.endswith(".body")), None)
        if body is not None and (body.hide_render or body.hide_get()): continue
        nm = r.name.replace(".rig", "")
        for s in "LR":
            if f"wrist.{s}" not in r.pose.bones: continue
            along, across, n = palm(r, s)
            lat = along.cross(n).normalized()
            for fi in (2, 3, 4, 5):
                pdir = along
                for j in (1, 2, 3):
                    b = f"finger{fi}-{j}.{s}"
                    if b not in r.pose.bones: break
                    d = (W(r, b, True) - W(r, b)).normalized()
                    bend, side = flex(pdir, d, lat)
                    if bend < (-25 if j == 1 else -12): flag("jari_tertekuk_balik", f, f"{nm} {b} {bend:.0f}°")
                    if bend > (95 if j == 1 else 110): flag("jari_terlalu_menekuk", f, f"{nm} {b} {bend:.0f}°")
                    if j > 1 and abs(side) > 25: flag("jari_miring", f, f"{nm} {b} {side:.0f}°")
                    pdir = d
            fa = (W(r, f"lowerarm02.{s}", True) - W(r, f"lowerarm01.{s}")).normalized()
            wf, wd = flex(fa, along, lat)
            if wf > 80 or wf < -70: flag("pergelangan_ekstrem", f, f"{nm} {s} fleksi {wf:.0f}°")
            if abs(wd) > 40: flag("pergelangan_ekstrem", f, f"{nm} {s} miring {wd:.0f}°")
        # motion of wrists and head
        for key in ("wrist.L", "wrist.R", "head"):
            if key not in r.pose.bones: continue
            p = W(r, key); k = (nm, key)
            if k in prev:
                v = (p - prev[k]).length / step
                if v > 0.09: flag("gerak_terlalu_cepat", f, f"{nm} {key} {v * 30:.1f} m/s")
                if k in prev2:
                    acc = ((p - prev[k]) - (prev[k] - prev2[k])).length / (step * step)
                    if acc > 0.035: flag("gerak_menyentak", f, f"{nm} {key} accel {acc * 1000:.0f} mm/f²")
                prev2[k] = prev[k]
            prev[k] = p
        # rotation jumps per bone (flips / spins)
        for pb in r.pose.bones:
            q = (r.matrix_world @ pb.matrix).to_quaternion(); k = (nm, pb.name)
            if k in prevq:
                dq = math.degrees(prevq[k].rotation_difference(q).angle); dq = min(dq, 360 - dq) / step
                if dq > 30 and not pb.name.startswith(("toe", "root")): flag("rotasi_melompat", f, f"{nm} {pb.name} {dq:.0f}°/f")
            prevq[k] = q

print(f"AUDIT {SID}: frames {f0}-{f1}")
if not issues: print("AUDIT OK")
for kind, lst in issues.items():
    by = {}
    for f, msg in lst:
        key = " ".join(msg.split()[:2]); by.setdefault(key, []).append((f, msg))
    for key, l in by.items():
        worst = l[0][1]
        print(f"AUDIT {kind}: {key} frames {l[0][0]}-{l[-1][0]} ({len(l)}x) e.g. {worst}")
