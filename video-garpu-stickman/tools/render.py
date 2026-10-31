"""Render the stickman fun-fact short: camera moves, punches, shakes, captions, flashes."""
import json, math, subprocess, sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE = os.environ.get("VIDEO_WORKDIR", "/tmp/claude-0/-home-user-ai-agent-task/177f7a20-0212-5b4f-9876-a7b9fb2beee2/scratchpad")
A = f"{BASE}/assets"
W, H, FPS = 1080, 1920, 30
TOTAL = 45.4
PREVIEW = "--preview" in sys.argv  # renders only listed times as stills

# ---------------------------------------------------------------- timeline
# beat: (t_start, (cx,cy,z) from, (cx,cy,z) to). cx,cy normalized centre; z zoom.
SHOTS = [
    dict(src="img/s01.png", t=0.00, beats=[(0.00, (.5, .50, 1.00), (.5, .46, 1.10)),
                                           (1.08, (.42, .52, 1.75), (.42, .50, 1.95))]),
    dict(src="img/s02.png", t=2.08, beats=[(2.08, (.5, .50, 1.05), (.5, .48, 1.15)),
                                           (4.38, (.40, .36, 1.55), (.40, .36, 1.70))]),
    dict(src="vid/v03.mp4", t=5.20, vstart=0.0, vspeed=1.15,
         beats=[(5.20, (.5, .5, 1.00), (.5, .5, 1.10))]),
    dict(src="img/s04.png", t=7.04, beats=[(7.04, (.5, .30, 1.25), (.5, .55, 1.15)),
                                           (8.58, (.34, .56, 1.85), (.34, .55, 2.00)),
                                           (9.76, (.74, .78, 2.10), (.74, .77, 2.30))]),
    dict(src="img/s05.png", t=10.58, beats=[(10.58, (.5, .55, 1.05), (.5, .50, 1.15)),
                                            (12.58, (.30, .38, 1.75), (.31, .37, 1.95))]),
    dict(src="img/s06.png", t=14.08, beats=[(14.08, (.5, .52, 1.05), (.55, .50, 1.20)),
                                            (15.42, (.62, .42, 1.70), (.62, .42, 1.80))]),
    dict(src="img/s07.png", t=15.74, beats=[(15.74, (.5, .72, 1.25), (.5, .42, 1.10)),
                                            (18.26, (.5, .40, 1.65), (.5, .40, 1.80))]),
    dict(src="img/s08.png", t=19.98, beats=[(19.98, (.5, .5, 1.00), (.5, .5, 1.12)),
                                            (21.98, (.30, .62, 1.55), (.32, .62, 1.70))]),
    dict(src="vid/v09.mp4", t=23.36, vstart=0.2, vspeed=1.35,
         beats=[(23.36, (.5, .5, 1.00), (.5, .55, 1.06))]),
    dict(src="img/s10.png", t=26.62, beats=[(26.62, (.5, .45, 1.00), (.5, .55, 1.08)),
                                            (27.36, (.5, .62, 1.55), (.5, .62, 1.75))]),
    dict(src="img/s11.png", t=29.18, beats=[(29.18, (.5, .40, 1.05), (.5, .50, 1.15)),
                                            (32.40, (.52, .52, 1.70), (.52, .52, 1.85)),
                                            (34.30, (.80, .55, 2.00), (.80, .55, 2.15))]),
    dict(src="img/s12.png", t=35.16, beats=[(35.16, (.5, .22, 2.10), (.5, .22, 2.25)),
                                            (36.16, (.5, .40, 1.25), (.5, .50, 1.00))]),
    dict(src="img/s13.png", t=38.32, beats=[(38.32, (.5, .50, 1.05), (.5, .46, 1.20)),
                                            (40.04, (.5, .40, 1.75), (.5, .38, 1.90))]),
    dict(src="vid/v14.mp4", t=41.22, vstart=0.0, vspeed=1.0,
         beats=[(41.22, (.5, .5, 1.00), (.5, .45, 1.10))]),
]

# punches: (time, zoom_amount, shake_px, decay_s)
PUNCH = [(4.38, .10, 34, .45), (15.42, .07, 22, .35), (18.26, .05, 14, .3), (23.36, .04, 10, .3),
         (27.36, .08, 30, .4), (34.30, .05, 16, .3), (36.16, .04, 0, .3), (41.22, .06, 18, .4),
         (42.10, .04, 10, .3), (2.08, .03, 0, .2), (12.58, .04, 0, .3)]
# flashes: (time, rgb, alpha, decay)
FLASH = [(4.38, (220, 20, 20), .45, .35), (5.20, (255, 255, 255), .7, .18), (19.98, (0, 0, 0), .8, .35),
         (27.36, (255, 255, 255), .35, .15), (41.22, (255, 255, 255), .9, .3), (12.58, (255, 230, 150), .3, .4)]
# zoom-blur transitions into these times (duration before cut)
ZOOMBLUR = [(5.20, .22), (23.36, .14), (41.22, .14)]

# ---------------------------------------------------------------- captions
words = json.load(open(f"{A}/audio/vo_words.json"))
FIX = {"Venezia": "Venesia", "shock": "syok"}
toks = []
for w in words:
    txt = w["w"].strip()
    txt = FIX.get(txt.strip(",.?"), txt)
    if txt.startswith("-") and toks:
        toks[-1]["w"] += txt
        toks[-1]["e"] = w["e"]
        toks[-1]["n"] += 1
        continue
    toks.append(dict(w=txt, s=w["s"], e=w["e"], n=1, raw_i=len(toks)))
# chunk boundaries in raw word indices -> convert to token indices
RAW_BREAKS = [0, 5, 8, 11, 12, 15, 17, 20, 23, 25, 28, 30, 33, 37, 39, 42, 44, 47, 50, 53, 55, 59, 61, 64,
              67, 70, 73, 75, 78, 80, 82, 83, 85, 89, 93, 97, 98, 100]
raw_to_tok = []
for ti, t in enumerate(toks):
    raw_to_tok += [ti] * t["n"]
breaks = sorted(set(raw_to_tok[b] for b in RAW_BREAKS))
chunks = []
for i, b in enumerate(breaks):
    e = breaks[i + 1] if i + 1 < len(breaks) else len(toks)
    chunks.append(list(range(b, e)))

YELLOW = {"GARPU", "1004", "BIZANTIUM", "VENESIA", "EMAS", "1600AN", "MILIARAN", "PEMBERONTAK", "ABAD",
          "PERTENGAHAN", "JARI", "SERIBU"}
RED = {"PENDOSA", "SYOK", "WABAH", "HUKUMAN", "DIJAUHI", "DITERTAWAKAN", "MENINGGAL"}
BIG = {"PENDOSA", "PEMBERONTAK"}

FONT = f"{A}/fonts/LuckiestGuy-Regular.ttf"
FS = 92
font = ImageFont.truetype(FONT, FS)
font_big = ImageFont.truetype(FONT, int(FS * 1.35))
STROKE = 10
CAP_Y = 1370  # center y of caption block
MAXW = 940

_wcache = {}


def word_img(text, color, big):
    key = (text, color, big)
    if key in _wcache:
        return _wcache[key]
    f = font_big if big else font
    bb = f.getbbox(text, stroke_width=STROKE)
    w, h = bb[2] - bb[0] + 16, bb[3] - bb[1] + 22
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    # shadow
    sh = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((8 - bb[0] + 5, 8 - bb[1] + 8), text, font=f, fill=(0, 0, 0, 160),
                            stroke_width=STROKE, stroke_fill=(0, 0, 0, 160))
    sh = sh.filter(ImageFilter.GaussianBlur(4))
    im.alpha_composite(sh)
    ImageDraw.Draw(im).text((8 - bb[0], 8 - bb[1]), text, font=f, fill=color, stroke_width=STROKE,
                            stroke_fill=(0, 0, 0, 255))
    _wcache[key] = im
    return im


def style(word):
    k = word.strip(",.?!").upper()
    if k in RED:
        return (255, 72, 72, 255), k in BIG
    if k in YELLOW:
        return (255, 214, 64, 255), k in BIG
    return (255, 255, 255, 255), False


_layout = {}


def layout(ci):
    if ci in _layout:
        return _layout[ci]
    items = []
    for ti in chunks[ci]:
        t = toks[ti]
        txt = t["w"].upper().rstrip(",.")
        col, big = style(txt)
        items.append((ti, txt, col, big, word_img(txt, col, big)))
    space = 18
    lines, cur, cw = [], [], 0
    for it in items:
        w = it[4].width
        if cur and cw + space + w > MAXW:
            lines.append(cur)
            cur, cw = [], 0
        cw += (space if cur else 0) + w
        cur.append(it)
    if cur:
        lines.append(cur)
    lh = [max(i[4].height for i in ln) - 18 for ln in lines]
    total_h = sum(lh)
    y = CAP_Y - total_h / 2
    pos = []
    for ln, h in zip(lines, lh):
        lw = sum(i[4].width for i in ln) + space * (len(ln) - 1)
        x = (W - lw) / 2
        for it in ln:
            pos.append((it, x + it[4].width / 2, y + h / 2))
            x += it[4].width + space
        y += h
    _layout[ci] = pos
    return pos


def chunk_at(t):
    cur = None
    for ci, ch in enumerate(chunks):
        if toks[ch[0]]["s"] - 0.03 <= t:
            cur = ci
    return cur


def draw_captions(frame, t):
    ci = chunk_at(t)
    if ci is None:
        return
    last_end = toks[chunks[ci][-1]]["e"]
    if ci == len(chunks) - 1 and t > last_end + 1.2:
        return
    for (ti, txt, col, big, im), cx, cy in layout(ci):
        st = toks[ti]["s"] - 0.03
        if t < st:
            continue
        a = t - st
        s = 1.0
        if a < 0.14:
            p = a / 0.14
            s = 1.35 - 0.35 * (1 - (1 - p) ** 3)  # pop from 1.35 -> 1.0
        if big and a < 0.3:
            s *= 1 + 0.12 * math.sin(a / 0.3 * math.pi)
        wi = im if abs(s - 1) < 1e-3 else im.resize((int(im.width * s), int(im.height * s)), Image.BILINEAR)
        frame.alpha_composite(wi, (int(cx - wi.width / 2), int(cy - wi.height / 2)))


# ---------------------------------------------------------------- sources
_img = {}


def load_img(p):
    if p not in _img:
        _img[p] = Image.open(f"{A}/{p}").convert("RGB")
    return _img[p]


_vid = {}


def load_vid(p):
    if p not in _vid:
        out = subprocess.run(["ffmpeg", "-v", "error", "-i", f"{A}/{p}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                             capture_output=True).stdout
        info = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                               "stream=width,height", "-of", "csv=p=0", f"{A}/{p}"],
                              capture_output=True, text=True).stdout.strip().split(",")
        vw, vh = int(info[0]), int(info[1])
        arr = np.frombuffer(out, np.uint8).reshape(-1, vh, vw, 3)
        _vid[p] = arr
    return _vid[p]


def source(shot, t):
    if shot["src"].endswith(".mp4"):
        arr = load_vid(shot["src"])
        fi = int((shot.get("vstart", 0) + (t - shot["t"]) * shot.get("vspeed", 1)) * 24)
        fi = max(0, min(len(arr) - 1, fi))
        return Image.fromarray(arr[fi])
    return load_img(shot["src"])


def ease(p):
    p = min(1, max(0, p))
    return p * p * (3 - 2 * p)


def shot_at(t):
    cur = 0
    for i, s in enumerate(SHOTS):
        if s["t"] <= t:
            cur = i
    return cur


def camera(si, t):
    shot = SHOTS[si]
    end = SHOTS[si + 1]["t"] if si + 1 < len(SHOTS) else TOTAL
    beats = shot["beats"]
    bi = 0
    for i, b in enumerate(beats):
        if b[0] <= t:
            bi = i
    b0 = beats[bi][0]
    b1 = beats[bi + 1][0] if bi + 1 < len(beats) else end
    p = (t - b0) / max(0.01, b1 - b0)
    p = 1 - (1 - p) ** 2  # ease-out drift
    f, to = beats[bi][1], beats[bi][2]
    cx = f[0] + (to[0] - f[0]) * p
    cy = f[1] + (to[1] - f[1]) * p
    z = f[2] + (to[2] - f[2]) * p
    # cut-in overshoot on every beat start
    a = t - b0
    if a < 0.18:
        z *= 1 + 0.06 * (1 - ease(a / 0.18))
    return cx, cy, z


def punch_fx(t):
    zoom, dx, dy = 0.0, 0.0, 0.0
    for tp, za, sp, dec in PUNCH:
        a = t - tp
        if 0 <= a < dec * 4:
            k = math.exp(-a / dec)
            zoom += za * k * (1 if a > 0.04 else a / 0.04)
            dx += sp * k * math.sin(a * 63 + tp)
            dy += sp * k * math.cos(a * 51 + tp * 2)
    return zoom, dx, dy


def render_frame(t):
    si = shot_at(t)
    src = source(SHOTS[si], t)
    cx, cy, z = camera(si, t)
    pz, dx, dy = punch_fx(t)
    z *= 1 + pz
    sw, sh = src.size
    base_w = min(sw, sh * W / H)
    cw = base_w / z
    ch = cw * H / W
    x0 = cx * sw - cw / 2 + dx * cw / W
    y0 = cy * sh - ch / 2 + dy * ch / H
    x0 = min(max(0, x0), sw - cw)
    y0 = min(max(0, y0), sh - ch)
    frame = src.transform((W, H), Image.EXTENT, (x0, y0, x0 + cw, y0 + ch), Image.BICUBIC)
    # zoom blur leaving the shot
    for tc, dur in ZOOMBLUR:
        if tc - dur <= t < tc:
            p = (t - (tc - dur)) / dur
            acc = np.asarray(frame, np.float32)
            n = 5
            for k in range(1, n):
                s = 1 + 0.06 * p * k
                cwk, chk = W / s, H / s
                im = frame.transform((W, H), Image.EXTENT, ((W - cwk) / 2, (H - chk) / 2, (W + cwk) / 2,
                                                            (H + chk) / 2), Image.BILINEAR)
                acc += np.asarray(im, np.float32)
            frame = Image.fromarray((acc / n).astype(np.uint8))
    frame = frame.convert("RGBA")
    # flashes
    for tf, rgb, al, dec in FLASH:
        a = t - tf
        if 0 <= a < dec * 4:
            alpha = al * math.exp(-a / dec)
            ov = Image.new("RGBA", (W, H), rgb + (int(255 * alpha),))
            frame.alpha_composite(ov)
    draw_captions(frame, t)
    return frame.convert("RGB")


def main():
    if PREVIEW:
        times = [float(x) for x in sys.argv[2].split(",")]
        ims = [render_frame(t).resize((270, 480)) for t in times]
        cols = min(8, len(ims))
        rows = math.ceil(len(ims) / cols)
        sheet = Image.new("RGB", (270 * cols, 480 * rows))
        for i, im in enumerate(ims):
            sheet.paste(im, ((i % cols) * 270, (i // cols) * 480))
        sheet.save(sys.argv[3])
        return
    out = sys.argv[1]
    nfr = int(TOTAL * FPS)
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                          "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
                          "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    for i in range(nfr):
        t = i / FPS
        p.stdin.write(render_frame(t).tobytes())
        if i % 150 == 0:
            print(f"frame {i}/{nfr}", flush=True)
    p.stdin.close()
    p.wait()


if __name__ == "__main__":
    main()
