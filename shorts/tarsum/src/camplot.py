"""Plot per-frame screen motion so stops and jerks are visible. python3 -I src/camplot.py out/camlog.csv out/camplot.png"""
import sys, csv
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
rows = list(csv.DictReader(open(sys.argv[1])))
t = [float(r["t"]) for r in rows]; m = [float(r["motion_px"]) for r in rows]; vh = [float(r["vh"]) for r in rows]
acc = [0] + [m[i] - m[i - 1] for i in range(1, len(m))]
fig, ax = plt.subplots(3, 1, figsize=(22, 10), sharex=True)
ax[0].plot(t, m, lw=1); ax[0].set_ylabel("screen px / frame"); ax[0].set_yscale("log"); ax[0].grid(alpha=.3)
ax[1].plot(t, acc, lw=1, color="C3"); ax[1].set_ylabel("change / frame"); ax[1].grid(alpha=.3)
ax[2].plot(t, vh, lw=1, color="C2"); ax[2].set_yscale("log"); ax[2].set_ylabel("view height"); ax[2].grid(alpha=.3)
for a in ax: a.set_xticks(range(0, 64, 2))
plt.tight_layout(); plt.savefig(sys.argv[2], dpi=70)
print("min motion", min(m), "at", t[m.index(min(m))], "| max motion", max(m), "at", t[m.index(max(m))], "| max |jerk|", max(map(abs, acc)), "at", t[[abs(a) for a in acc].index(max(map(abs, acc)))])
