"""Transcribe a narration take with faster-whisper (Indonesian), align it to the script, and write word timings.

usage: python words.py <take.mp3> <script.json> <out.words.json> [--model small]
script.json: {"lines": [{"id": "L1", "text": "..."}, ...]}
Prints a per-line report (heard vs. expected) and exits 1 if any line has a word-level mismatch ratio > 15 %.
"""
import difflib, json, re, sys

def norm(w):
    return re.sub(r"[^0-9a-z]+", "", w.lower())

def main():
    take, script_p, out_p = sys.argv[1:4]
    model_name = sys.argv[sys.argv.index("--model") + 1] if "--model" in sys.argv else "small"
    from faster_whisper import WhisperModel
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segs, info = model.transcribe(take, language="id", word_timestamps=True, beam_size=5, vad_filter=False,
                                  initial_prompt="Indonesia Emas, nggak, HP, miliarder.")
    heard = []
    for s in segs:
        for w in s.words:
            if norm(w.word):
                heard.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 3)})
    script = json.load(open(script_p))
    exp = []  # (line index, word)
    for li, L in enumerate(script["lines"]):
        for w in L["text"].split():
            if norm(w):
                exp.append((li, w))
    a = [norm(x["w"]) for x in heard]
    b = [norm(w) for _, w in exp]
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    timing = [None] * len(exp)
    bad = [0] * len(script["lines"])
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                timing[j1 + k] = (heard[i1 + k]["s"], heard[i1 + k]["e"])
        else:
            for j in range(j1, j2):
                bad[exp[j][0]] += 1
            # spread the heard span over the expected words so every word still gets a time
            if i2 > i1 and j2 > j1:
                s0, e0 = heard[i1]["s"], heard[i2 - 1]["e"]
                n = j2 - j1
                for k in range(n):
                    timing[j1 + k] = (s0 + (e0 - s0) * k / n, s0 + (e0 - s0) * (k + 1) / n)
    # fill words that got no time (deletions) from neighbours
    for j in range(len(timing)):
        if timing[j] is None:
            prev = next((timing[k] for k in range(j - 1, -1, -1) if timing[k]), (0, 0))
            timing[j] = (prev[1], prev[1])
    lines_out, ok = [], True
    for li, L in enumerate(script["lines"]):
        idx = [j for j, (l, _) in enumerate(exp) if l == li]
        words = [{"w": exp[j][1], "s": timing[j][0], "e": timing[j][1]} for j in idx]
        ratio = bad[li] / max(1, len(idx))
        span = [k for k, x in enumerate(heard) if words and words[0]["s"] - .05 <= x["s"] <= words[-1]["e"] + .05]
        heard_txt = " ".join(heard[k]["w"] for k in span)
        flag = "OK " if ratio <= .15 else "BAD"
        if ratio > .15:
            ok = False
        print(f"{flag} {L['id']:>4} {words[0]['s']:6.2f}-{words[-1]['e']:6.2f}  mismatch {ratio:4.0%}\n      want: {L['text']}\n      got:  {heard_txt}")
        lines_out.append({"id": L["id"], "text": L["text"], "t0": words[0]["s"], "t1": words[-1]["e"], "words": words})
    json.dump({"take": take, "model": model_name, "lines": lines_out, "heard": heard}, open(out_p, "w"), indent=1, ensure_ascii=False)
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
