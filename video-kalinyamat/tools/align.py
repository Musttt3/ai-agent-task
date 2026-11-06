"""Align each scene's first words (tools/script.json) to Whisper word timings (tools/transcript.json)."""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
script = json.load(open(os.path.join(HERE, "script.json")))
segs = json.load(open(os.path.join(HERE, "transcript.json")))
words = [w for s in segs for w in s["words"]]
norm = lambda x: re.sub(r"[^a-z0-9]", "", x.lower())
NEXT_WORD = {20: -1}  # manual fixes: Whisper glued the previous sentence's last word
def ts2s(t):
    m, s = t.split(":"); return int(m) * 60 + int(s)
out = []
for i, ts, nar in script:
    t = ts2s(ts)
    toks = [norm(x) for x in nar.split() if norm(x)][:3]
    best = None
    for j, w in enumerate(words):
        if abs(w["s"] - t) > 3.0: continue
        for shift in (0, 1):  # allow Whisper to glue the previous sentence's last word
            k0 = j + shift
            cand = [norm(words[k]["w"]) for k in range(k0, min(k0 + 3, len(words)))]
            sc = sum(1 for a, b in zip(toks, cand) if a == b or (len(a) > 3 and len(b) > 2 and (a.startswith(b) or b.startswith(a))))
            key = (sc, -shift, -abs(words[k0]["s"] - t))
            if k0 < len(words) and (best is None or key > best[0]):
                best = (key, k0)
    k = best[1] + NEXT_WORD.get(i, 0)
    if words[k]["w"].strip().startswith("-") and k > 0: k -= 1
    out.append({"i": i, "ts": ts, "t": words[k]["s"], "score": best[0][0],
                "heard": " ".join(words[q]["w"] for q in range(k, min(k + 4, len(words)))), "nar": " ".join(nar.split()[:4])})
for o in out:
    flag = "" if o["score"] >= 2 else "  <-- CHECK"
    print(f'{o["i"]:3d} {o["ts"]:>5} {o["t"]:7.2f} s={o["score"]} | {o["nar"]} ||{o["heard"]}{flag}')
json.dump(out, open(os.path.join(HERE, "align_fixed.json"), "w"), ensure_ascii=False)
