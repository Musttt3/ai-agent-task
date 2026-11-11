"""Align each transcript line (= one image) to the narration using word timestamps.

usage: python3 align.py words.json transkrip.md out/timeline.json

words.json: [{"w": word, "s": start, "e": end}, ...] from faster-whisper (tools/asr.py).
Each line's start = onset of its first word; the cut is placed a little before the
onset (inside the pause when there is one) so the picture lands with the voice.
"""
import difflib
import json
import re
import sys

words = json.load(open(sys.argv[1]))
lines = []
for l in open(sys.argv[2], encoding="utf-8"):
    m = re.match(r"- \*\*(\d+):(\d+)\*\* (.*)", l)
    if m:
        lines.append((int(m[1]) * 60 + int(m[2]), m[3].strip()))


def norm(w):
    w = w.lower().replace("aftur", "avtur")
    return re.sub(r"[^a-z0-9]", "", w)


# script tokens with the line they belong to
toks, owner = [], []
for i, (_, text) in enumerate(lines):
    for t in text.split():
        n = norm(t)
        if n:
            toks.append(n)
            owner.append(i)
asr = [norm(w["w"]) for w in words]

sm = difflib.SequenceMatcher(a=toks, b=asr, autojunk=False)
tok2asr = {}
for a, b, n in sm.get_matching_blocks():
    for k in range(n):
        tok2asr[a + k] = b + k

first_tok = {}
for k, i in enumerate(owner):
    first_tok.setdefault(i, k)

starts = []
for i, (rough, _) in enumerate(lines):
    t = None
    # first matched token of the line (allow the first one or two words to be misheard)
    k0 = first_tok[i]
    for k in range(k0, min(k0 + 4, len(toks))):
        if owner[k] != i:
            break
        if k in tok2asr:
            j = tok2asr[k]
            # step back over unmatched words that precede it within the same line
            back = k - k0
            j = max(0, j - back)
            t = words[j]["s"]
            break
    src = "asr"
    if t is None or abs(t - rough) > 2.5:
        t, src = float(rough), "rough"
    starts.append([t, src])

# keep monotonic
for i in range(1, len(starts)):
    if starts[i][0] <= starts[i - 1][0] + 0.4:
        starts[i][0] = starts[i - 1][0] + 0.4

# place cut a touch before the voice onset, but never before the previous word ends
ends = [w["e"] for w in words]
cuts = []
for i, (t, src) in enumerate(starts):
    if i == 0:
        cuts.append(0.0)
        continue
    prev_end = max([e for e in ends if e <= t + 0.01] or [t])
    c = max(t - 0.12, prev_end + 0.5 * max(0.0, t - prev_end - 0.12))
    c = min(c, t)
    cuts.append(round(c, 3))

out = [
    {"i": i + 1, "img": f"{i+1:03d}.jpg", "start": cuts[i], "voice": round(starts[i][0], 3), "src": starts[i][1], "text": lines[i][1]}
    for i in range(len(lines))
]
json.dump(out, open(sys.argv[3], "w"), ensure_ascii=False, indent=1)
rough = sum(1 for s in starts if s[1] == "rough")
print(f"{len(out)} shots, {rough} fell back to rough timestamps")
for o in out:
    if o["src"] == "rough":
        print("  rough:", o["i"], o["text"][:60])
