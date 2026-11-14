"""Transkripsi satu file VO penuh -> timing/VO_full_v2.json (kata + waktu)."""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from faster_whisper import WhisperModel
root = Path(__file__).resolve().parent.parent
src = root / "assets/vo" / sys.argv[1]
raw = subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(src), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
audio = np.frombuffer(raw, np.float32)
model = WhisperModel("medium", device="cpu", compute_type="int8")
segs, info = model.transcribe(audio, language="id", word_timestamps=True, beam_size=5)
words = []
for s in segs:
    words += [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2), "p": round(w.probability, 2)} for w in s.words]
    print(f"{s.start:7.2f} {s.text.strip()[:90]}", flush=True)
(root / "timing" / (src.stem + ".json")).write_text(json.dumps({"file": src.name, "duration": info.duration, "words": words}, ensure_ascii=False, indent=1))
print("SELESAI", len(words))
