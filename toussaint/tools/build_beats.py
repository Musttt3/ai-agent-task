#!/usr/bin/env python3
"""Compile the beat sheet into data/beats.json (the renderer reads only that file).

Every timed moment is anchored to a spoken word from data/words.json (faster-whisper word timestamps):
    w("budak", 17)      -> start time of the occurrence of "budak" nearest 0:17
    we("budak", 17)     -> its end time
    ws("bukan raja", 13) -> [[start,end], ...] for each word of the phrase (for typewriter sync)
Positions are in frame units (1 = frame height at the beat's camera distance) relative to the beat centre.
"""
import json, math, os, re, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORDS = json.load(open(os.path.join(ROOT, "data", "words.json")))
WL = WORDS["words"]; DUR = round(WORDS["duration"], 3)
FPS = 30; FOV = 32
FRAMES = round(DUR * FPS)

def norm(s): return re.sub(r"[^0-9a-zà-ÿœ]", "", s.lower())
def _find(word, near):
    if isinstance(near, str): m, s = near.split(":"); near = int(m) * 60 + float(s)
    key = norm(word); cands = [x for x in WL if norm(x["w"]).startswith(key)] or [x for x in WL if key in norm(x["w"])]
    if not cands: raise SystemExit(f"word not found: {word}")
    best = min(cands, key=lambda x: abs(x["s"] - near))
    if abs(best["s"] - near) > 6: print(f"warning: '{word}' near {near} matched at {best['s']}", file=sys.stderr)
    return best
def w(word, near): return _find(word, near)["s"]
def we(word, near): return _find(word, near)["e"]
def ws(phrase, near):
    parts = phrase.split(); first = _find(parts[0], near); i = WL.index(first); out = []
    for k, p in enumerate(parts): x = WL[i + k]; out.append([x["s"], x["e"]])
    return out

VH = 2 * 10 * math.tan(math.radians(FOV / 2)); VW = VH * 16 / 9
TR = {"fade": 0, "W": 11, "G": 6, "L": 14, "T": 12}
BEATS, FX, STAMPS, ASSETS = [], [], [], set()
_cursor = [0.0, 0.0]; _dir = [1.0, 0.0]

def beat(id, t0, tr, objs, cam=None, go="E", dist=10.0):
    """t0 = cut time (transition centre). go = direction of travel from the previous beat (E/W/N/S/NE/...)."""
    global _cursor
    d = {"E": (1, 0), "W": (-1, 0), "N": (0, 1), "S": (0, -1), "NE": (.7, .7), "SE": (.7, -.7), "NW": (-.7, .7), "SW": (-.7, -.7)}[go]
    if BEATS:
        step = 1.3 * VW if tr in ("W", "T") else 2.2 * VW
        _cursor = [_cursor[0] + d[0] * step, _cursor[1] + d[1] * step * 0.75]
    cam = dict(cam or {})
    cam.setdefault("drift", [d[0] * 0.05, d[1] * 0.04])
    b = {"id": id, "t0": round(t0, 3), "tr": tr, "trFrames": TR[tr], "center": [round(_cursor[0], 3), round(_cursor[1], 3)], "dist": dist, "cam": cam, "objects": objs}
    for o in objs:
        if o.get("asset"): ASSETS.add(o["asset"])
        if o.get("overlay"): ASSETS.add(o["overlay"]["asset"])
        if o["type"] == "stamp": STAMPS.append(round(o["t"], 3))
    if tr == "G": FX.append({"type": "glitch", "t": round(t0, 3), "frames": 6})
    if tr == "L": FX.append({"type": "leak", "t": round(t0, 3), "frames": 14})
    BEATS.append(b)

# object helpers --------------------------------------------------------------
def P(asset, x=0, y=0, h=0.7, rot=0, z=0.12, **k): return {"type": "print", "asset": asset, "x": x, "y": y, "h": h, "rot": rot, "z": z, **k}
def DOC(kind, x=0, y=0, w=0.6, h=0.75, rot=0, z=0.06, **k): return {"type": "doc", "kind": kind, "x": x, "y": y, "w": w, "h": h, "rot": rot, "z": z, **k}
def TYPE(text, x=0, y=0, size=0.085, z=0.35, **k): return {"type": "type", "text": text, "x": x, "y": y, "size": size, "z": z, **k}
def TAPE(text, t, x=0, y=0, size=0.045, rot=-2, z=0.3, **k): return {"type": "tape", "text": text, "t": t, "x": x, "y": y, "size": size, "rot": rot, "z": z, **k}
def STAMP(text, t, x=0, y=0, size=0.09, rot=-8, z=0.32, **k): return {"type": "stamp", "text": text, "t": t, "x": x, "y": y, "size": size, "rot": rot, "z": z, **k}
def TITLE(text, t, sub=None, x=0, y=0, size=0.09, z=0.4, **k): return {"type": "title", "text": text, "sub": sub, "t": t, "x": x, "y": y, "size": size, "z": z, **k}
def HAND(text, t, x=0, y=0, size=0.05, rot=-4, z=0.3, **k): return {"type": "hand", "text": text, "t": t, "x": x, "y": y, "size": size, "rot": rot, "z": z, **k}
def MARK(kind, t, x=0, y=0, w=0.3, h=0.3, rot=0, z=0.33, dur=0.5, **k): return {"type": "mark", "kind": kind, "t": t, "x": x, "y": y, "w": w, "h": h, "rot": rot, "z": z, "dur": dur, **k}
def CARD(**k): return {"type": "card", "x": 0, "y": 0, "w": 3.0, "h": 1.9, "z": 0.25, **k}
def MAP(bbox, x=0, y=0, w=1.7, h=0.98, rot=0, z=0.05, **k): return {"type": "map", "bbox": bbox, "x": x, "y": y, "w": w, "h": h, "rot": rot, "z": z, **k}


SHAKES = []
def GLITCH(t, frames=5): FX.append({"type": "glitch", "t": round(t, 3), "frames": frames, "extra": True})
def SHAKE(t, amp=12): SHAKES.append({"t": round(t, 3), "amp": amp})
def TL(items, x=0, y=0, w=1.5, h=0.18, rot=0, z=0.08, **k): return {"type": "timeline", "items": items, "x": x, "y": y, "w": w, "h": h, "rot": rot, "z": z, **k}
def FOLDER(t, x=0, y=0, w=0.7, h=0.88, rot=0, z=0.08): return {"type": "folder", "t": t, "x": x, "y": y, "w": w, "h": h, "rot": rot, "z": z}
def REDACT(t, x=0, y=0, w=0.6, h=0.1, rot=0, z=0.34, dur=0.45): return {"type": "redact", "t": t, "x": x, "y": y, "w": w, "h": h, "rot": rot, "z": z, "dur": dur}

def _imgsize(asset):
    from PIL import Image
    for d in ("broll", "broll_interim", "placeholder"):
        f = os.path.join(ROOT, "assets", d, asset + ".jpg")
        if os.path.exists(f): return Image.open(f).size
    f = sorted(glob.glob(os.path.join(ROOT, "frames", "vid", asset, "*.jpg")))
    return Image.open(f[0]).size if f else (1000, 1000)
def on(pr, u, v, du=0.0, dv=0.0):
    """Image coordinates (u,v in 0..1 of the full source image; du,dv = box size) -> frame-unit x, y, w, h on print `pr`."""
    iw, ih = _imgsize(pr["asset"]); cr = pr.get("crop", [0, 0, 1, 1])
    sw, sh = iw * (cr[2] - cr[0]), ih * (cr[3] - cr[1]); a = sw / sh; mx = 1700
    pw, ph = (mx, mx / a) if a >= 1 else (mx * a, mx)
    b = (pr.get("border") or (0.11 if pr.get("film") else 0.055)) * min(pw, ph); bx = b * 0.35 if pr.get("film") else b
    cw, ch = pw + 2 * bx, ph + 2 * b; k = pr["h"] / ch
    uu, vv = (u - cr[0]) / (cr[2] - cr[0]), (v - cr[1]) / (cr[3] - cr[1])
    lx, ly = (bx + uu * pw - cw / 2) * k, -(b + vv * ph - ch / 2) * k
    r = math.radians(pr.get("rot", 0)); x = pr["x"] + lx * math.cos(r) - ly * math.sin(r); y = pr["y"] + lx * math.sin(r) + ly * math.cos(r)
    return {"x": round(x, 4), "y": round(y, 4), "w": round(du / (cr[2] - cr[0]) * pw * k, 4), "h": round(dv / (cr[3] - cr[1]) * ph * k, 4), "rot": pr.get("rot", 0)}
def MARKON(kind, t, pr, u, v, du, dv, **k):
    g = on(pr, u, v, du, dv); return MARK(kind, t, x=g["x"], y=g["y"], w=max(g["w"], 0.04), h=max(g["h"], 0.04), rot=g["rot"], **k)

CAP = [-72.2, 19.76]; BREST = [-4.49, 48.39]
HISP = [-75.0, 17.2, -67.8, 20.6]; ATL = [-92, 2, 14, 56]; CARIB = [-92, 7, -56, 30]
HAITI, DOMREP = "332", "214"

exec(open(os.path.join(ROOT, "tools", "beats_def.py"), encoding="utf-8").read())

# ------------------------------------------------------------------ output
def placeholder(a):
    from PIL import Image, ImageDraw
    os.makedirs(os.path.join(ROOT, "assets", "placeholder"), exist_ok=True); f = f"assets/placeholder/{a}.jpg"
    im = Image.new("RGB", (1200, 1500), (214, 202, 176)); d = ImageDraw.Draw(im)
    for k in range(-1500, 1200, 22): d.line([(k, 1500), (k + 1500, 0)], fill=(190, 176, 148), width=3)
    d.rectangle([60, 60, 1140, 1440], outline=(80, 60, 40), width=8); d.text((100, 700), "ARSIP MENYUSUL: " + a, fill=(60, 40, 30))
    im.save(os.path.join(ROOT, f)); return f

def build(until=None):
    beats = BEATS
    out_dur = DUR
    if until is not None:
        beats = [b for b in BEATS if b["t0"] < until]
        out_dur = until
    FX.insert(0, {"type": "fadein", "t": 0, "dur": 0.6})
    FX.append({"type": "fadeout", "t": DUR - 0.9, "dur": 0.9})
    for i, b in enumerate(beats): b["t1"] = beats[i + 1]["t0"] if i + 1 < len(beats) else out_dur
    srcs = json.load(open(os.path.join(ROOT, "data", "assets.json")))
    used = sorted({o[k] if k == "asset" else o[k]["asset"] for b in beats for o in b["objects"] for k in ("asset", "overlay") if o.get(k)})
    assets = {}
    for a in used:
        if os.path.exists(os.path.join(ROOT, "assets", "broll", a + ".jpg")): assets[a] = {"type": "image", "src": f"assets/broll/{a}.jpg"}
        elif os.path.exists(os.path.join(ROOT, "assets", "broll_interim", a + ".jpg")):   # user's lower-res copy of the same Commons file
            assets[a] = {"type": "image", "src": f"assets/broll_interim/{a}.jpg", "interim": True}
        elif srcs.get(a, {}).get("kind") == "commons":                                     # not downloaded yet -> drawn placeholder
            assets[a] = {"type": "image", "src": placeholder(a), "placeholder": True}
        else:
            fr = sorted(glob.glob(os.path.join(ROOT, "frames", "vid", a, "*.jpg")))
            if not fr: raise SystemExit(f"asset missing: {a} (run tools/extract_video_frames.sh)")
            assets[a] = {"type": "video", "dir": f"frames/vid/{a}", "count": len(fr), "fps": FPS}
        assets[a]["ilus"] = bool(srcs.get(a, {}).get("ilus"))
    data = {"fps": FPS, "width": 1920, "height": 1080, "fov": FOV, "duration": DUR, "frames": FRAMES, "assets": assets, "beats": beats, "fx": FX, "stampTimes": sorted(STAMPS), "shakes": SHAKES}
    # ILUSTRASI tag rule: any print of an asset flagged ilus gets the tag
    for b in beats:
        for o in b["objects"]:
            if o["type"] == "print" and assets[o["asset"]]["ilus"]: o.setdefault("ilus", True)
    json.dump(data, open(os.path.join(ROOT, "data", "beats.json"), "w"), ensure_ascii=False, indent=1)
    print(f"{len(beats)} beats, {sum(len(b['objects']) for b in beats)} objects, {len(assets)} assets, {FRAMES} frames, {DUR}s")

if __name__ == "__main__":
    until = float(sys.argv[sys.argv.index("--until") + 1]) if "--until" in sys.argv else None
    build(until)
