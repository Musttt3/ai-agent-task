#!/usr/bin/env python3
"""Camera-speed graph + dead-stop / jerk report from out/qa/camera.json."""
import json, os, sys
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(os.path.join(ROOT, "out/qa/camera.json"))); sp = [s[0] for s in d["speeds"]]; fps = 30
t = [i / fps for i in range(len(sp))]
stops = [i for i in range(1, len(sp) - 1) if sp[i] < 0.05]
jerks = [i for i in range(2, len(sp) - 1) if abs((sp[i + 1] - sp[i]) - (sp[i] - sp[i - 1])) > 40]
fig, ax = plt.subplots(figsize=(22, 5), dpi=110)
ax.plot(t, sp, lw=0.7, color="#333"); ax.set_yscale("symlog", linthresh=1); ax.set_xlabel("seconds"); ax.set_ylabel("camera target speed (px/frame, symlog)")
for b in d["beats"]: ax.axvline(b["t0"], color={"W": "#999", "G": "#2a2", "L": "#B3261E", "T": "#555"}.get(b["tr"], "#ccc"), lw=0.4)
ax.scatter([t[i] for i in stops], [sp[i] for i in stops], color="red", s=6, label=f"dead stops ({len(stops)})")
ax.set_title(f"Camera speed — min in-beat speed {min(sp[1:-1]):.2f}px/f; dead stops {len(stops)}; jerk spikes {len(jerks)}"); ax.legend(loc="upper right")
os.makedirs(os.path.join(ROOT, "out/qa"), exist_ok=True); fig.tight_layout(); fig.savefig(os.path.join(ROOT, "out/qa/camera_speed.png"))
print("dead stops (frames):", stops[:20], "jerk spikes:", jerks[:20])
