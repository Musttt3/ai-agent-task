# Final assembly: rendered frames (out/frames/NNNNN.png) + captions (drawn here) + audio/mix.wav -> out/sejarah_garpu.mp4
# Captions follow captions/voice.json: 1-2 words, each word appears exactly on its start frame; Montserrat ExtraBold,
# white with a thick dark outline, centred a little below the middle (inside the Shorts safe area); key words gold
# with a small pop-in. Usage: python3 studio/compose.py [first last] [--preview out.mp4]
import json, os, sys, subprocess
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, "..")
FPS, W, H, TOTAL = 30, 1080, 1920, 1515
KEY = {"sombong", "emas", "furcifer"}
words = json.load(open(os.path.join(ROOT, "captions", "voice.json")))["segments"][0]["words"]
wf = [dict(w=w["word"], a=round(w["start"] * FPS), b=round(w["end"] * FPS)) for w in words]
clean = lambda s: s.rstrip(",.").replace("…", "")
norm = lambda s: "".join(c for c in s.lower() if c.isalpha())
groups = []
for i, x in enumerate(wf):
    key = norm(x["w"]) in KEY
    g = groups[-1] if groups else None
    prev = wf[i - 1] if i else None
    join = g and len(g["words"]) < 2 and not key and not g["words"][0]["key"] and prev and not prev["w"][-1] in ".,!?" and x["a"] - prev["b"] < 6
    if join: g["words"].append(dict(w=clean(x["w"]), a=x["a"], key=key))
    else: groups.append(dict(words=[dict(w=clean(x["w"]), a=x["a"], key=key)], a=x["a"], b=x["b"]))
    groups[-1]["b"] = x["b"]
for i, g in enumerate(groups):
    nx = groups[i + 1] if i + 1 < len(groups) else None
    g["b"] = min(nx["a"], g["b"] + 10) if nx else g["b"] + 18
font_path = os.path.join(HERE, "fonts", "Montserrat.ttf")
_fonts = {}
def font(size):
    if size not in _fonts:
        f = ImageFont.truetype(font_path, size)
        try: f.set_variation_by_axes([800])
        except Exception: pass
        _fonts[size] = f
    return _fonts[size]
def caption(img, f):
    g = next((x for x in groups if x["a"] <= f < x["b"]), None)
    if not g: return img
    d = ImageDraw.Draw(img)
    vis = [w for w in g["words"] if f >= w["a"]]
    # layout on one line if it fits, else two
    parts = []
    for w in vis:
        t = min(1.0, (f - w["a"]) / 6)
        s = (0.7 + (1.12 - 0.7) * (t / 0.6) if t < 0.6 else 1.12 - 0.12 * ((t - 0.6) / 0.4)) if w["key"] else 1.0
        parts.append((w["w"], int(104 * s), (255, 201, 60) if w["key"] else (255, 255, 255)))
    widths = [d.textlength(p[0], font=font(p[1])) for p in parts]
    gap = 28; total = sum(widths) + gap * (len(parts) - 1)
    lines = [list(range(len(parts)))] if total <= W - 120 else [[i] for i in range(len(parts))]
    y = 1290
    for line in lines:
        lw = sum(widths[i] for i in line) + gap * (len(line) - 1); x = (W - lw) / 2
        for i in line:
            txt, size, col = parts[i]
            fy = y + (104 - size) * 0.6
            d.text((x + 0, fy + 8), txt, font=font(size), fill=(0, 0, 0, 90), stroke_width=16, stroke_fill=(0, 0, 0, 90))   # soft drop
            d.text((x, fy), txt, font=font(size), fill=col, stroke_width=16, stroke_fill=(27, 19, 12))
            x += widths[i] + gap
        y += 118
    return img
if __name__ == "__main__":
    a = [x for x in sys.argv[1:] if not x.startswith("--")]
    first, last = (int(a[0]), int(a[1])) if len(a) >= 2 else (0, TOTAL - 1)
    out = sys.argv[sys.argv.index("--preview") + 1] if "--preview" in sys.argv else os.path.join(ROOT, "out", "sejarah_garpu.mp4")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-ss", f"{first / FPS:.4f}", "-i", os.path.join(ROOT, "audio", "mix.wav"), "-map", "0:v", "-map", "1:a", "-shortest",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out],
                          stdin=subprocess.PIPE)
    last_img = None
    for f in range(first, last + 1):
        p = os.path.join(ROOT, "out", "frames", f"{f:05d}.png")
        if os.path.exists(p): last_img = Image.open(p).convert("RGB")
        img = (last_img.copy() if last_img else Image.new("RGB", (W, H)))
        if img.size != (W, H): img = img.resize((W, H))
        ff.stdin.write(caption(img, f).tobytes())
    ff.stdin.close(); ff.wait()
    print("WROTE", out, first, last)
