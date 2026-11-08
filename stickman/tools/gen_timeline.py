"""Parse timeline TXT, snap cuts to speech onsets, emit src/data.json."""
import re, json, subprocess, sys
txt, mp3, out = sys.argv[1:4]
FPS = 30
dur_audio = float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",mp3]))
log = subprocess.run(["ffmpeg","-i",mp3,"-af","silencedetect=noise=-35dB:d=0.2","-f","null","-"],capture_output=True,text=True).stderr
onsets = [float(m) for m in re.findall(r"silence_end: ([\d.]+)", log)]
def ts(s):
    m, sec = s.split(":"); return int(m)*60 + float(sec)
shots = []
for line in open(txt, encoding="utf-8"):
    p = [x.strip() for x in line.split("|")]
    if len(p) == 5 and p[0].isdigit():
        a, b = [ts(x) for x in p[1].split(" - ")]
        shots.append(dict(n=int(p[0]), file=p[3], text=p[4], start=a))
starts = []
for i, s in enumerate(shots):
    t = s["start"]
    if i > 0:
        near = [o for o in onsets if abs(o - t) <= 0.7]
        if near:
            t = min(near, key=lambda o: abs(o - t)) - 0.08
    starts.append(t)
# keep monotonic with min 0.5s per shot
for i in range(1, len(starts)):
    starts[i] = max(starts[i], starts[i-1] + 0.5)
end = dur_audio
frames = [round(x*FPS) for x in starts] + [round(end*FPS)]
for i, s in enumerate(shots):
    s["from"] = frames[i]; s["dur"] = frames[i+1] - frames[i]
    s["snap"] = round(starts[i] - s["start"], 2)
moved = [ (s["n"], s["snap"]) for s in shots if abs(s["snap"])>0.01]
print("audio", dur_audio, "shots", len(shots), "snapped", len(moved), "max shift", max(abs(m[1]) for m in moved))
json.dump(dict(fps=FPS, audioFrames=round(end*FPS), shots=shots), open(out,"w"), ensure_ascii=False, indent=0)
