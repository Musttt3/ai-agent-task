"""Potong VO penuh menjadi VO01..VO07 di titik paling hening dekat batas bagian; tulis timing per bagian."""
import json, re, subprocess, sys
from pathlib import Path
import numpy as np
root = Path(__file__).resolve().parent.parent
src = root / "assets/vo" / sys.argv[1]
d = json.loads((root / "timing" / (src.stem + ".json")).read_text())
W = d["words"]
n = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
SEC = [("VO01_hook", ["tahun", "1978"]), ("VO02_pembuka", ["kenapa", "ya"]), ("VO03_latar", ["kita", "mulai"]),
       ("VO04_tersangka-otak", ["kalau", "begitu"]), ("VO05_bukti", ["tapi", "otak"]), ("VO06_klimaks", ["jadi", "apakah"]),
       ("VO07_penutup", ["jadi", "kalau"])]
sr = 48000
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(src), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                                 capture_output=True, check=True).stdout, np.float32)
def quietest(t0, t1):
    a, b = int(max(0, t0) * sr), int(min(len(x) / sr, t1) * sr)
    win = int(0.02 * sr)
    e = np.convolve(x[a:b] ** 2, np.ones(win) / win, "same")
    return (a + int(np.argmin(e))) / sr
idx = []
for name, seq in SEC:
    i = next(i for i in range(len(W) - 1) if n(W[i]["w"]).startswith(seq[0]) and n(W[i + 1]["w"]).startswith(seq[1]))
    idx.append(i)
cuts = [0.0]
for i in idx[1:]:
    cuts.append(quietest(W[i - 1]["e"] - 0.15, W[i]["s"] + 0.12))
cuts.append(len(x) / sr)
out = root / "assets/vo"
for k, (name, _) in enumerate(SEC):
    a, b = cuts[k], cuts[k + 1]
    tmp = out / f"{name}.tmp.mp3"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", str(src),
                    "-af", "afade=t=in:d=0.01", "-c:a", "libmp3lame", "-b:a", "192k", str(tmp)], check=True)
    tmp.replace(out / f"{name}.mp3")
    words = [dict(w, s=round(w["s"] - a, 2), e=round(w["e"] - a, 2)) for w in W[idx[k]: (idx[k + 1] if k + 1 < len(idx) else len(W))]]
    (root / "timing" / f"{name}.json").write_text(json.dumps({"file": f"{name}.mp3", "duration": b - a, "offset_in_full": a,
                                                              "text": " ".join(w["w"] for w in words), "words": words}, ensure_ascii=False, indent=1))
    print(f"{name:22s} {a:7.2f} - {b:7.2f}  ({b-a:6.2f} dtk, {len(words)} kata)")
