import sys, json
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[3] if len(sys.argv)>3 else "large-v3", device="cpu", compute_type="int8", cpu_threads=4)
import numpy as np
audio=np.fromfile(sys.argv[1],dtype=np.float32)
segs, info = m.transcribe(audio, language="id", word_timestamps=True, beam_size=5, vad_filter=False,
    initial_prompt="Presiden saja diduga disadap. Polri, Prabowo, Komisi III DPR, penyadapan.")
out=[]
for s in segs:
    for w in s.words:
        out.append({"w": w.word.strip(), "s": round(w.start,3), "e": round(w.end,3)})
json.dump(out, open(sys.argv[2],"w"), ensure_ascii=False, indent=0)
print(len(out), "words")
