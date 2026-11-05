# align_words.py VOICE.mp3 WHISPER.json NASKAH.txt OUT_WORDS.json OUT_ENV.json
# Script words (exact spelling of the naskah) get whisper's timings; a start that lands inside a detected pause is
# moved to the pause end (whisper tends to start a word at the beginning of the silence before it).
# Also writes the per-frame (30 fps) voice loudness envelope that drives the on-screen waveform.
import sys, json, re, subprocess, difflib
import numpy as np
voice, wjson, txt, out_w, out_env = sys.argv[1:6]
raw = json.load(open(wjson))
script = open(txt, encoding="utf-8").read().split()
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
sm = difflib.SequenceMatcher(a=[norm(w["w"]) for w in raw], b=[norm(w) for w in script], autojunk=False)
out = [None] * len(script)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1):
        for k in range(j2 - j1):
            out[j1 + k] = dict(w=script[j1 + k], s=raw[i1 + k]["s"], e=raw[i1 + k]["e"])
    else:
        print("unaligned", tag, [w["w"] for w in raw[i1:i2]], script[j1:j2])
for j, o in enumerate(out):                    # interpolate anything whisper missed
    if o is None:
        prev = out[j - 1]["e"] if j else 0.0
        nxt = next((x["s"] for x in out[j + 1:] if x), prev + 0.4)
        out[j] = dict(w=script[j], s=prev, e=nxt)
log = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", voice, "-af", "silencedetect=n=-40dB:d=0.12", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]
en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", log)]
for i, w in enumerate(out):
    for a, b in zip(st, en):
        if w["s"] < a and b < w["e"] and i and (a - w["s"]) < 0.5 * (w["e"] - w["s"]):  # pause early in the span: word starts after it
            w["s"] = round(b, 3)
            out[i - 1]["e"] = min(out[i - 1]["e"], round(a + 0.05, 3))
        if a - 0.02 <= w["s"] < b:
            w["s"] = round(b, 3)
        if a < w["e"] <= b + 0.02 and w["e"] - a > 0.05:
            w["e"] = round(a + 0.05, 3)
    w["e"] = max(w["e"], w["s"] + 0.12)
json.dump(out, open(out_w, "w"), ensure_ascii=False, indent=0)
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", voice, "-ac", "1", "-ar", "48000", "-f", "f32le", "-"], capture_output=True).stdout
x = np.frombuffer(pcm, np.float32)
hop = 1600
n = len(x) // hop
rms = np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1))
env = np.clip(rms / (np.percentile(rms, 98) + 1e-9), 0, 1)
json.dump([round(float(v), 3) for v in env], open(out_env, "w"))
print(len(out), "words,", n, "env frames")
