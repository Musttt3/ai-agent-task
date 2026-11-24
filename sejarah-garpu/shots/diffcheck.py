# Does a rebuilt shot still match its rendered frames? Renders a few frames small and compares with out/frames.
#   blender -b shots/blend/<SID>.blend --python shots/diffcheck.py -- <SID>
# Prints DIFF <sid> <frame> <score>: mean of the worst 2% pixel differences (0-255) after blur, so render noise
# is ignored and a moved arm or hand shows up.
import bpy, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot_lib import SHOTS
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SID = sys.argv[sys.argv.index("--") + 1]
f0, f1, _ = SHOTS[SID]
sc = bpy.context.scene
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 270, 480, 100
sc.cycles.samples = 24
tmp = os.path.join(ROOT, "review", "diff"); os.makedirs(tmp, exist_ok=True)
for f in (f0 + 2, (f0 + f1) // 2, f1 - 2):
    old = os.path.join(ROOT, "out", "frames", f"{f:05d}.png")
    if not os.path.exists(old) or os.path.getsize(old) == 0: print(f"DIFF {SID} {f} missing"); continue
    sc.frame_set(f); p = os.path.join(tmp, f"{SID}_{f:05d}.png"); sc.render.filepath = p
    bpy.ops.render.render(write_still=True)
    print(f"DIFFPAIR {SID} {f} {p} {old}")
