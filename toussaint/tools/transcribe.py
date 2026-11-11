# Word-level timestamps for the VO (faster-whisper). Output: data/words.json
import json, sys, subprocess
import numpy as np
from faster_whisper import WhisperModel
src, out = sys.argv[1], sys.argv[2]
m = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8", cpu_threads=4)
pcm = subprocess.run(["ffmpeg","-v","error","-i",src,"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True,check=True).stdout
audio = np.frombuffer(pcm, np.float32)
segs, info = m.transcribe(audio, language="id", word_timestamps=True, beam_size=5, vad_filter=False,
    initial_prompt="Toussaint Louverture, Napoleon Bonaparte, Saint-Domingue, Hispaniola, Bréda, André Rigaud, Moïse, Leclerc, Benteng de Joux, Jean-Jacques Dessalines, Haiti.")
words = []
for s in segs:
    for w in s.words:
        words.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)})
    print(f"{s.start:7.2f} {s.text}", flush=True)
json.dump({"duration": info.duration, "words": words}, open(out, "w"), ensure_ascii=False, indent=0)
print("DONE", len(words))
