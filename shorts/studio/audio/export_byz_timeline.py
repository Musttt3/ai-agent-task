# Exports the Constantinople shot plan (story.ts) + word table as audio/byz_timeline.json (same rules as timing.ts W()).
import json, re, os
HERE = os.path.dirname(os.path.abspath(__file__))
V = os.path.join(HERE, "..", "src", "videos", "byzantium")
w = json.load(open(os.path.join(V, "words.json")))
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
def W(alts, n=0, fr=0.0):
    keys = [norm(a) for a in alts.split("|")]; k = 0
    for x in w:
        if x["s"] < fr: continue
        t = norm(x["w"])
        if any(t == q or (len(q) > 3 and t.startswith(q)) for q in keys):
            if k == n: return round(x["s"] * 30)
            k += 1
    raise SystemExit("word not found " + alts)
src = open(os.path.join(V, "story.ts")).read()
T = {m.group(1): W(m.group(2), int(m.group(3) or 0), float(m.group(4) or 0)) for m in re.finditer(r'(\w+): W\("([^"]+)"(?:, (\d+))?(?:, ([\d.]+))?\)', src)}
total = round((w[-1]["e"] + 1.6) * 30)
shots = []
for m in re.finditer(r'S\("(\w+)", ([^,]+), "(\w+)", (\d+)\)', src):
    e = re.sub(r"T\.(\w+)", r'T["\1"]', m.group(2)).replace("BEAT", "3")
    shots.append({"id": m.group(1), "a": eval(e, {"T": T})})
for i, s in enumerate(shots): s["b"] = shots[i + 1]["a"] if i + 1 < len(shots) else total
json.dump({"fps": 30, "total": total, "voiceEnd": w[-1]["e"], "T": T, "shots": shots, "words": w, "flash": T["its"] - 3,
           "lightning": [T["cannons"] - 3, T["pounded"] - 3]}, open(os.path.join(HERE, "byz_timeline.json"), "w"))
print(total, len(shots), [ (s["id"], s["a"]) for s in shots])
