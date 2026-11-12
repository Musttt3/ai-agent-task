#!/usr/bin/env python3
"""Self-QA on the finished render (step 6).
usage: python3 tools/qa_final.py out/Toussaint_Louverture_CaseFile_1080p30.mp4
Outputs in out/qa/final/: contact sheet (mid-beat), 360px readability sheet, transition strips, sync report, clutter/text report.
"""
import json, os, subprocess, sys, math
import numpy as np
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VID = sys.argv[1]; Q = os.path.join(ROOT, "out", "qa", "final"); os.makedirs(Q, exist_ok=True)
D = json.load(open(os.path.join(ROOT, "data", "beats.json"))); B = D["beats"]; FPS = 30

def frame(t, w=1920):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{max(0, t):.3f}", "-i", VID, "-frames:v", "1", "-vf", f"scale={w}:-2", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    h = len(raw) // (w * 3); return Image.frombytes("RGB", (w, h), raw)

def sheet(tiles, cols, tw, name, label=True):
    th = tw * 9 // 16; rows = (len(tiles) + cols - 1) // cols; S = Image.new("RGB", (cols * tw, rows * (th + (16 if label else 0))), (18, 18, 18)); d = ImageDraw.Draw(S)
    for k, (lab, im) in enumerate(tiles):
        x, y = (k % cols) * tw, (k // cols) * (th + (16 if label else 0)); S.paste(im.resize((tw, th), Image.LANCZOS), (x, y + (16 if label else 0)))
        if label: d.text((x + 3, y + 2), lab, fill=(255, 210, 90))
    S.save(os.path.join(Q, name), quality=86); return os.path.join(Q, name)

# 1) mid-beat contact sheet + 360px readability
mids = [(f"{b['id']} {int((b['t0'] + b['t1']) / 2) // 60}:{int((b['t0'] + b['t1']) / 2) % 60:02d}", frame((b["t0"] + b["t1"]) / 2 + 0.3, 640)) for b in B]
print(sheet(mids, 8, 360, "contact_mid_beats.jpg")); print(sheet(mids, 8, 360, "contact_360px.jpg", label=False))

# 2) transition strips: 14 frames around every cut
pages, cur = [], []
for b in B[1:]:
    f0 = round(b["t0"] * FPS) - 7
    strip = Image.new("RGB", (14 * 160, 90 + 14)); d = ImageDraw.Draw(strip)
    for k in range(14): strip.paste(frame((f0 + k) / FPS, 160).resize((160, 90)), (k * 160, 14))
    d.text((3, 1), f"{b['id']} {b['tr']} @ {b['t0']:.2f}s", fill=(255, 210, 90)); cur.append(strip)
    if len(cur) == 12: pages.append(cur); cur = []
if cur: pages.append(cur)
for n, pg in enumerate(pages):
    S = Image.new("RGB", (14 * 160, len(pg) * 104)); [S.paste(s, (0, i * 104)) for i, s in enumerate(pg)]; S.save(os.path.join(Q, f"transitions_{n + 1:02d}.jpg"), quality=84)
print(len(pages), "transition pages")

# 3) sync check: image change energy around each moment; the visible change should start within ~2 frames of the word
def diff_series(t, span=0.5):
    fs = [np.asarray(frame(t - span + k / FPS, 320), dtype=np.float32) for k in range(int(2 * span * FPS) + 1)]
    return [float(np.abs(fs[k + 1] - fs[k]).mean()) for k in range(len(fs) - 1)]
moments = []
for b in B:
    for o in b["objects"]:
        if o["type"] in ("stamp", "tape", "title") and "t" in o: moments.append((o["t"], o["type"], o.get("text", "").replace("\n", " "), b["id"]))
        if o["type"] == "mark" and o["kind"] in ("circle", "x", "strike", "arrow"): moments.append((o["t"], "mark-" + o["kind"], "", b["id"]))
stamps = [m for m in moments if m[1] == "stamp"]; others = [m for m in moments if m[1] != "stamp"][::6]
rep = ["moment sync check (frame-diff peak vs word time; +ve = visual after word)", ""]
for t, kind, text, bid in sorted(stamps + others)[:40]:
    ds = diff_series(t); k0 = int(0.5 * FPS)
    onset = next((k for k in range(k0 - 6, len(ds)) if ds[k] > max(ds[:max(1, k0 - 6)]) * 1.8 + 0.4), None)
    off = None if onset is None else (onset - k0) / FPS
    rep.append(f"{bid:>5} {kind:<12} {text[:28]:<28} word@{t:7.2f}s  onset {'n/a' if off is None else f'{off * 1000:+5.0f} ms'}")
open(os.path.join(Q, "sync_report.txt"), "w").write("\n".join(rep) + "\n"); print("\n".join(rep[:14]))

# 4) clutter / text-size / title-safe audit from beats.json
out = ["clutter & text audit", ""]
for b in B:
    objs = b["objects"]; prints = [o for o in objs if o["type"] in ("print", "doc", "map", "folder", "timeline", "card")]
    supp = [o for o in prints if o.get("dim")]; texts = [o for o in objs if o["type"] in ("type", "tape", "stamp", "title", "hand")]
    issues = []
    if len(supp) > 2: issues.append(f"{len(supp)} supporting objects")
    for o in texts:
        sz = o.get("size", 0.05); words = len(str(o.get("text", "")).split())
        hero = o["type"] in ("title", "type") or (o["type"] == "stamp" and sz >= 0.08)
        if hero and sz < 0.08: issues.append(f"hero text {o['text']!r} cap {sz:.3f} < 0.08")
        if not hero and sz < 0.035: issues.append(f"label {o['text']!r} cap {sz:.3f} < 0.035")
        if words > 6: issues.append(f"{o['text']!r} has {words} words")
        if abs(o.get("x", 0)) > 0.8 or abs(o.get("y", 0)) > 0.45: issues.append(f"{o['text']!r} centre outside title-safe")
    if issues: out.append(f"{b['id']}: " + "; ".join(issues))
out.append(f"\n{len(B)} beats checked")
open(os.path.join(Q, "clutter_report.txt"), "w").write("\n".join(out) + "\n"); print("\n".join(out[-12:]))
