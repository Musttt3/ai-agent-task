"""Build src/purba/data.json: shot cuts snapped to spoken words + word-level captions.

Inputs: timeline.txt (script per image), whisper word timings (head run for the
first 9 s, main run for the rest). Script words are aligned to the recognised words
with difflib so captions always show the exact script text.
"""
import json, re, sys, difflib
from pathlib import Path
here = Path(__file__).parent
FPS = 30
AUDIO_END = 57.63
TOTAL = 58.2

head = [("Minus",0.00,0.48),("30",0.48,1.04),("derajat,",1.04,1.78),("tanpa",2.10,2.56),("jaket,",2.56,3.24),
        ("tanpa",3.54,3.96),("sepatu",3.96,4.36),("modern.",4.36,4.78),("Apakah",5.24,5.82),("manusia",5.82,6.30),
        ("purba",6.30,6.70),("bisa",6.70,6.96),("selamat?",6.96,7.44)]
main = json.load(open(here / "whisper_words_main.json"))
# drop whisper's hallucinated repeat of "menjaga api tetap menyala siang dan malam" at ~29.9 s
main = [w for w in main if not (29.85 <= w["s"] <= 29.99 and w["w"] != "Di")]
rec = [dict(w=a, s=b, e=c) for a, b, c in head] + [w for w in main if w["s"] >= 7.8]

shots = []
for line in open(here / "timeline.txt", encoding="utf-8"):
    p = [x.strip() for x in line.split("|")]
    if len(p) == 6 and p[0].isdigit():
        shots.append(dict(n=int(p[0]), file=f"{int(p[0]):02d}.jpg", text=p[5]))

norm = lambda t: re.sub(r"[^a-z0-9]", "", t.lower())
script = []
for s in shots:
    for w in s["text"].split():
        script.append(dict(w=w, shot=s["n"]))
sm = difflib.SequenceMatcher(a=[norm(x["w"]) for x in script], b=[norm(x["w"]) for x in rec], autojunk=False)
for a, b, size in sm.get_matching_blocks():
    for k in range(size):
        script[a + k]["s"], script[a + k]["e"] = rec[b + k]["s"], rec[b + k]["e"]
# fuzzy fill for mismatches (e.g. "pakayan" vs "pakaian"): interpolate between neighbours
for i, w in enumerate(script):
    if "s" not in w:
        prev = next((script[j]["e"] for j in range(i - 1, -1, -1) if "e" in script[j]), 0.0)
        nxt_i = next((j for j in range(i + 1, len(script)) if "s" in script[j]), None)
        nxt = script[nxt_i]["s"] if nxt_i is not None else AUDIO_END
        gap = nxt_i - i if nxt_i is not None else 1
        span = (nxt - prev) / (gap + 0)
        w["s"], w["e"] = round(prev + 0.02, 2), round(prev + span, 2)
missing = [w["w"] for w in script if "s" not in w]
assert not missing, missing

f = lambda t: round(t * FPS)
starts = []
for s in shots:
    first = next(w for w in script if w["shot"] == s["n"])
    starts.append(0.0 if s["n"] == 1 else max(first["s"] - 0.12, 0))
ends = starts[1:] + [TOTAL]
for s, a, b in zip(shots, starts, ends):
    s["from"], s["dur"] = f(a), f(b) - f(a)
words = [dict(w=w["w"], shot=w["shot"], from_=f(w["s"]), to=f(w["e"])) for w in script]
for w in words:
    w["from"] = w.pop("from_")
json.dump(dict(fps=FPS, total=f(TOTAL), audioEnd=f(AUDIO_END), shots=shots, words=words),
          open(sys.argv[1], "w"), ensure_ascii=False, indent=0)
for s in shots:
    print(s["n"], round(s["from"] / FPS, 2), round(s["dur"] / FPS, 2), s["text"][:40])
