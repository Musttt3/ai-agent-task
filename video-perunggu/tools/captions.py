"""Writes subtitles (SRT) from the script text + word timings, and YouTube chapters."""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
OUT = sys.argv[1]
plan = json.load(open(os.path.join(ROOT, "src", "data", "plan.json")))
script = json.load(open(os.path.join(HERE, "script.json")))  # [[scene, text], ...]
segs = json.load(open(os.path.join(HERE, "transcript.json")))
words = [w for s in segs for w in s["words"]]
FIX = {"Hathusa": "Hattusa", "Hatusa": "Hattusa", "Heth": "Het", "relif": "relief", "Disinilah": "Di sinilah",
       "disinilah": "di sinilah", "fir'aun": "firaun", "Fir'aun": "Firaun", "Ulu Burun": "Uluburun",
       "Mykenae": "Mykenai", "Pilos": "Pylos", "sebelum masehi": "sebelum Masehi", "laut tengah": "Laut Tengah",
       "antar negeri": "antarnegeri"}
start = {s["i"]: s["start"] + 0.10 for s in plan["scenes"]}
start[1] = 0.0
ids = sorted(start)
def speech_end(t0, t1):
    ends = [w["e"] for w in words if t0 - 0.05 <= w["s"] < t1 - 0.05]
    return max(ends) if ends else t1 - 0.2
def fmt(t):
    h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)) % 1000:03d}"
def chunks(text, limit=84):
    """Split into the fewest, evenly sized chunks of <= limit chars."""
    ws = text.split()
    k = max(1, -(-len(text) // limit))
    while True:
        target = len(text) / k
        out, cur = [], ""
        for w in ws:
            if cur and len(cur) + len(w) + 1 > target + 6 and len(out) < k - 1:
                out.append(cur); cur = w
            else:
                cur = (cur + " " + w).strip()
        out.append(cur)
        if max(len(c) for c in out) <= limit: return out
        k += 1
def wrap(c, width=42):
    if len(c) <= width: return c
    words_ = c.split(); best = None
    for k in range(1, len(words_)):
        a, b = " ".join(words_[:k]), " ".join(words_[k:])
        sc = max(len(a), len(b))
        if best is None or sc < best[0]: best = (sc, a + "\n" + b)
    return best[1]
cues = []
for n, row in enumerate(script):
    i, text = row[0], row[-1]
    for a, b in FIX.items(): text = text.replace(a, b)
    text = text[0].upper() + text[1:]
    t0 = start[i]; t1 = start[ids[ids.index(i) + 1]] if i != ids[-1] else plan["narrEnd"] + 0.3
    te = min(t1 - 0.04, speech_end(t0, t1) + 0.25)
    parts = chunks(text); tot = sum(len(p) for p in parts); t = t0
    for p in parts:
        d = (te - t0) * len(p) / tot
        cues.append((t, t + d, wrap(p))); t += d
with open(os.path.join(OUT, "subtitle_indonesia.srt"), "w") as f:
    for k, (a, b, c) in enumerate(cues, 1):
        f.write(f"{k}\n{fmt(a)} --> {fmt(b)}\n{c}\n\n")
ch = [(0.0, "Pembuka")] + [(o["start"] - 0.25, f'{o["num"].title()} · {o["title"]}') for o in plan["overlays"] if o["kind"] == "chapter"]
with open(os.path.join(OUT, "chapters_youtube.txt"), "w") as f:
    for t, name in ch:
        m, s = divmod(int(t), 60); f.write(f"{m}:{s:02d} {name}\n")
print(len(cues), "cues;", len(ch), "chapters")
