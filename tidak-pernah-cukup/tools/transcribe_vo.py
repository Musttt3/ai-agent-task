"""Transkripsi VO per bagian dengan faster-whisper -> timing/<nama>.json (kata + waktu)."""
import json, subprocess, sys
import numpy as np
from pathlib import Path
from faster_whisper import WhisperModel
root = Path(__file__).resolve().parent.parent
model = WhisperModel(sys.argv[1] if len(sys.argv) > 1 else "medium", device="cpu", compute_type="int8")
for f in sorted((root / "assets/vo").glob("VO0*.mp3")):
    raw = subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(f), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    audio = np.frombuffer(raw, np.float32)
    segs, info = model.transcribe(audio, language="id", word_timestamps=True, beam_size=5)
    words, text = [], []
    for s in segs:
        text.append(s.text.strip())
        words += [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2), "p": round(w.probability, 2)} for w in s.words]
    out = {"file": f.name, "duration": info.duration, "text": " ".join(text), "words": words}
    (root / "timing" / (f.stem + ".json")).write_text(json.dumps(out, ensure_ascii=False, indent=1))
    low = [w for w in words if w["p"] < 0.5]
    print(f"{f.name}: {len(words)} kata, {len(low)} kata keyakinan rendah", flush=True)
