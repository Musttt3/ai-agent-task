# Frame-by-frame QA of the 16:9 IceCream render (memory-light variant of shorts/studio/short_qa.py):
# specs, loudness + true peak, per-frame luma / motion streamed at 160x90, black / unplanned white / frozen / pop frames
# (flashes, kicks and beat starts from the timeline count as planned), and contact sheets of one frame per 0.5 s.
# Usage: python3 ice_qa.py <video.mp4> <outdir> <ice_timeline.json>
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw

vid, out, tlp = sys.argv[1], sys.argv[2], sys.argv[3]
tl = json.load(open(tlp))
planned = set()
for a in tl["flashes"]: planned.update(range(a - 1, a + 6))
for a in tl["kicks"]: planned.update(range(a - 1, a + 8))
for b in tl["beats"]: planned.update((b["a"] - 1, b["a"], b["a"] + 1))
os.makedirs(out, exist_ok=True)
run = lambda *a: subprocess.run(a, capture_output=True, text=True)
R = []
pr = json.loads(run("ffprobe", "-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels:format=duration", "-of", "json", vid).stdout)
v = next(s for s in pr["streams"] if s["codec_type"] == "video")
au = [s for s in pr["streams"] if s["codec_type"] == "audio"]
R.append(f"SPECS {v['width']}x{v['height']} {v['r_frame_rate']} fps, {v.get('nb_frames')} frames, {float(pr['format']['duration']):.3f} s; audio: "
         + (", ".join(f"{s['codec_name']} {s['sample_rate']} Hz {s['channels']}ch" for s in au) if au else "NONE"))
if au:
    e = run("ffmpeg", "-i", vid, "-map", "0:a:0", "-af", "ebur128=peak=true", "-f", "null", "-").stderr
    tail = e[e.rfind("Summary:"):]
    R.append("LOUDNESS " + " | ".join(l.strip() for l in tail.splitlines() if l.strip().startswith(("I:", "LRA:", "Peak:"))))
    e = run("ffmpeg", "-i", vid, "-map", "0:a:0", "-af", "silencedetect=n=-45dB:d=0.5", "-f", "null", "-").stderr
    R.append("SILENCES " + ("; ".join(l.split("] ")[-1] for l in e.splitlines() if "silence_" in l) or "none"))

W, H = 160, 90
p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", vid, "-vf", f"scale={W}:{H}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
fs = W * H * 3
mean, diff, thumbs, prev, i = [], [], [], None, 0
while True:
    buf = p.stdout.read(fs)
    if len(buf) < fs: break
    fr = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    mean.append(float((fr.astype(np.float32) / 255 @ np.array([0.2126, 0.7152, 0.0722], np.float32)).mean()))
    if prev is not None: diff.append(float(np.abs(fr.astype(np.int16) - prev).mean()))
    if i % 15 == 0: thumbs.append((i, fr.copy()))
    prev = fr.astype(np.int16); i += 1
n, mean, diff = i, np.array(mean), np.array(diff)
med = np.array([np.median(diff[max(0, k - 8):k + 9]) for k in range(len(diff))])
pops = [k + 1 for k in range(len(diff)) if diff[k] > 3 * med[k] + 1.5 and (k + 1) not in planned]
black = [k for k in range(n) if mean[k] < 0.04 and k < n - 16]
white = [k for k in range(n) if mean[k] > 0.90 and k not in planned]
frozen, rs = [], None
for k in range(len(diff)):
    if diff[k] < 0.02: rs = k if rs is None else rs
    else:
        if rs is not None and k - rs >= 12: frozen.append((rs, k))
        rs = None
R.append(f"FRAMES {n}; black (excl. end fade) {black[:30]}; unplanned white {white[:30]}; frozen spans >=12f {frozen[:30]}")
R.append(f"POPS (unplanned diff spikes, not at beat starts/kicks/flashes; sub-angle cuts land here too): {len(pops)} {pops[:80]}")
R.append(f"MOTION mean diff {diff.mean():.2f}; luma mean {mean.mean():.3f} min {mean.min():.3f} max {mean.max():.3f}")
np.savez(os.path.join(out, "perframe.npz"), mean=mean, diff=diff)
cw, ch = 160, 90
per = 60  # 60 thumbs = 30 s per sheet
for s in range(0, len(thumbs), per):
    S = Image.new("RGB", (cw * 10, ch * 6), "black"); d = ImageDraw.Draw(S)
    for j, (f, fr) in enumerate(thumbs[s:s + per]):
        x, y = (j % 10) * cw, (j // 10) * ch
        S.paste(Image.fromarray(fr), (x, y)); d.rectangle([x, y, x + 34, y + 11], fill="black"); d.text((x + 2, y), str(f), fill="yellow")
    S.save(os.path.join(out, f"sheet_{thumbs[s][0]:05d}.jpg"), quality=85)
open(os.path.join(out, "report.md"), "w", encoding="utf-8").write("\n".join(R) + "\n")
print("\n".join(R))
