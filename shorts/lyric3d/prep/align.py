# Align the user's lyric lines to word timestamps from the vocal stem (ASR used only for timing).
# usage: align.py lines.txt asr_words.json out.json
import json, re, sys, difflib
lines = [l.strip() for l in open(sys.argv[1]) if l.strip()]
asr = json.load(open(sys.argv[2]))
norm = lambda w: re.sub(r"[^a-z]", "", w.lower().replace("-oh", "").replace("-eah", ""))
words = [(li, w) for li, l in enumerate(lines) for w in l.split()]
a = [norm(w) for _, w in words]
b = [norm(x["w"]) for x in asr]
sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
t = [None] * len(words)
for blk in sm.get_matching_blocks():
    for k in range(blk.size):
        t[blk.a + k] = (asr[blk.b + k]["s"], asr[blk.b + k]["e"])
# fill gaps by spreading over the asr words in the corresponding opcode spans
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag in ("replace", "delete"):
        if j2 > j1:
            s0, e0 = asr[j1]["s"], asr[j2 - 1]["e"]
        else:
            s0 = t[i1 - 1][1] if i1 > 0 and t[i1 - 1] else 0.0
            e0 = next((t[k][0] for k in range(i2, len(t)) if t[k]), s0 + 0.3 * (i2 - i1))
        n = i2 - i1
        for k in range(n):
            t[i1 + k] = (s0 + (e0 - s0) * k / n, s0 + (e0 - s0) * (k + 1) / n)
matched = sum(blk.size for blk in sm.get_matching_blocks())
out = []
for li, l in enumerate(lines):
    ws = [{"text": w, "start": round(t[k][0], 3), "end": round(t[k][1], 3)} for k, (lj, w) in enumerate(words) if lj == li]
    out.append({"line": l, "start": ws[0]["start"], "end": ws[-1]["end"], "words": ws})
json.dump(out, open(sys.argv[3], "w"), indent=1, ensure_ascii=False)
print(f"matched {matched}/{len(words)} words")
for i, o in enumerate(out):
    print(i, f"{o['start']:.2f}-{o['end']:.2f}", len(o["words"]), "words", " ".join(f"{w['start']:.2f}" for w in o["words"]))
