# Mix for "Menteri Jenius" (Ir. Sutami short).
#   python3 mix.py  -> mix.wav (48 kHz stereo, -14 LUFS, <= -1 dBTP) + cues.md
# Voice-over is untouched. Music: ElevenLabs take A, lengthened by repeating two bars (38.11-44.97 s, bar grid at
# 70 BPM) so its natural decay lands on the ending; it drops out on the pause before "Namun" and comes back filtered.
# SFX are placed on visual events (frame numbers from src/Sutami.tsx), each peak-aligned unless noted.
import os, subprocess
import numpy as np
import pyloudnorm as pyln
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
TOTAL = 67.0
N = int(TOTAL * SR)
FPS = 30


def load(path, sr=SR):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(np.float64)


def ns(t):
    return int(round(t * SR))


def db(x):
    return 10 ** (x / 20)


def place(buf, x, at):
    a, b = max(0, at), min(buf.shape[1], at + x.shape[1])
    if b > a:
        buf[:, a:b] += x[:, a - at: b - at]


def env_peak(x):
    e = np.abs(x).max(axis=0)
    k = ns(0.01)
    e = np.convolve(e, np.ones(k) / k, "same")
    return int(np.argmax(e))


def fade(x, fin=0.005, fout=0.02):
    x = x.copy()
    a, b = ns(fin), ns(fout)
    if a: x[:, :a] *= np.linspace(0, 1, a)
    if b: x[:, -b:] *= np.linspace(1, 0, b)
    return x


meter = pyln.Meter(SR)

# ------------------------------------------------------------------ voice
voice = load(os.path.join(HERE, "voice.mp3"))
v = np.zeros((2, N))
v[:, : voice.shape[1]] = voice[:, :N]
VL = meter.integrated_loudness(v.T)

# voice activity (for ducking)
mono = np.abs(v).max(axis=0)
k = ns(0.03)
act = np.convolve(mono, np.ones(k) / k, "same") > db(-38)
act = np.convolve(act.astype(float), np.ones(ns(0.25)) / ns(0.25), "same") > 0.01
key = np.convolve(act.astype(float), np.ones(ns(0.30)) / ns(0.30), "same")

# ------------------------------------------------------------------ music
A = load(os.path.join(HERE, "music", "musik_A.mp3"))
b0, b1 = ns(38.11), ns(44.97)          # two bars on the 70 BPM grid
xf = ns(0.06)
head = A[:, :b1].copy()
loop = A[:, b0:b1].copy()
tail = A[:, b1:].copy()


def join(p, q):
    w = np.linspace(0, 1, xf)
    out = np.concatenate([p[:, :-xf], p[:, -xf:] * w[::-1] + q[:, :xf] * w, q[:, xf:]], axis=1)
    return out


music = join(join(head, loop), tail)
m = np.zeros((2, N))
m[:, : min(N, music.shape[1])] = music[:, :N]

# drop before "Namun": out at 27.22 s, silent through the glitch, back from 27.95 s through a rising low-pass
drop0, drop1, back1 = ns(27.20), ns(27.95), ns(30.2)
g = np.ones(N)
g[drop0 - ns(0.08): drop0] = np.linspace(1, 0, ns(0.08))
g[drop0:drop1] = 0
g[drop1:back1] = np.linspace(0, 1, back1 - drop1) ** 1.5
seg = m[:, drop1:back1].copy()
sos_lo = signal.butter(2, 400, "low", fs=SR, output="sos")
lp = signal.sosfilt(sos_lo, seg, axis=1)
wmix = np.linspace(0, 1, seg.shape[1])[None, :] ** 2
m[:, drop1:back1] = lp * (1 - wmix) + seg * wmix
# end: fade out the last 1.6 s
g[ns(TOTAL - 1.6):] *= np.linspace(1, 0, N - ns(TOTAL - 1.6)) ** 2
ML = meter.integrated_loudness(m.T)
duck = db(-17.0 * key - 10.5 * (1 - key))   # relative to the narration: -17 LU under speech, -10.5 LU in pauses
m = m * db(VL - ML) * duck[None, :] * g[None, :]

# ------------------------------------------------------------------ SFX
SFXDIR = os.path.join(HERE, "sfx")
cache = {}


def S(name):
    if name not in cache:
        p = os.path.join(SFXDIR, name + ".mp3")
        if not os.path.exists(p):
            p = os.path.join(HERE, "sfx_mixkit", name + ".mp3")   # fetched by ../fetch_assets.sh
        x = load(p)
        cache[name] = x / (np.abs(x).max() + 1e-9) * db(-1)
    return cache[name]


sfx = np.zeros((2, N))
cues = []


def hit(name, t, gain, what, align="peak", dur=None, rev=False):
    x = S(name)
    if dur:
        x = fade(x[:, : ns(dur)], 0.003, min(0.15, dur / 3))
    if rev:
        x = x[:, ::-1]
    at = ns(t) - (env_peak(x) if align == "peak" else 0)
    place(sfx, x * db(gain), at)
    cues.append((t, name, gain, what))


def bed(name, t0, t1, gain, what, fin=0.4, fout=0.6):
    x = S(name)
    L = ns(t1 - t0)
    reps = int(np.ceil(L / x.shape[1])) + 1
    y = np.concatenate([x] * reps, axis=1)[:, :L]
    y = fade(y, fin, fout)
    place(sfx, y * db(gain), ns(t0))
    cues.append((t0, name, gain, f"{what} ({t0:.2f}-{t1:.2f} s)"))


f = lambda fr: fr / FPS
hit("impact_big", 0.02, -11, "pukulan bass di frame pertama", align="start")
hit("impact_trailer", f(25), -8, "RAKSASA menghantam layar")
hit("glitch_static", f(63), -15, "glitch ke adegan tagihan")
hit("paper_slide", f(75), -13, "kartu tagihan masuk", align="start")
hit("el_powercut", f(120), -5, "listrik padam tepat di 'diputus'")
hit("wood_hit", f(122), -7, "stempel DIPUTUS")
hit("whoosh_air", f(204), -15, "lingkaran hitam menutup layar")
for i, c in enumerate("Ir. Sutami"):
    if c != " ":
        hit("type_single" if i % 2 == 0 else "type_hit", f(228) + i * 0.1, -17 - (i % 3), "ketikan judul" if i == 0 else "")
hit("paper_slide", f(250), -16, "foto arsip Sutami masuk", align="start")
hit("shutter_vintage", f(262), -12, "kilat foto arsip")
hit("shutter_click", f(306), -11, "kilat ke adegan Soekarno-Soeharto")
hit("shutter_vintage", f(340), -13, "foto Soekarno")
hit("shutter_vintage", f(373), -13, "foto Soeharto")
hit("whoosh_cine", f(387), -12, "zoom-blur masuk JENIUS")
hit("impact_big", f(395), -15, "huruf JENIUS muncul")
hit("pencil_write", f(458), -13, "pensil di kertas cetak biru", align="start")
hit("scribble", f(478), -15, "coretan rumus")
hit("riser_cine", f(553) - 2.55, -17, "riser saat gambar rangka beton", align="start")
hit("paper_quick", f(556), -12, "mistar hitung masuk")
hit("switch_tap", f(562), -15, "ikon kalkulator muncul")
hit("buzzer_fail", f(582), -13, "tanda silang merah di 'tanpa'")
hit("wood_hit", f(591), -8, "KALKULATOR distempel")
hit("whoosh_air", f(614), -18, "masuk foto Semanggi")
for fr, nm in [(685, "Semanggi"), (732, "GBK"), (789, "DPR")]:
    hit("paper_slide", f(fr), -14, f"kartu {nm} masuk", align="start")
    hit("shutter_vintage", f(fr + 13), -13, f"kilat kartu {nm}")
hit("whoosh_stutter", f(822), -13, "tarikan sebelum 'Namun'")
hit("glitch_rewind", f(824), -13, "glitch ke kemegahan")
hit("impact_big", f(824), -8, "drop musik di 'Namun'")
hit("whoosh_air", f(890), -20, "light leak ke rumah sederhana")
hit("el_tear", f(1017), -8, "baju robek")
hit("scribble", f(1180), -14, "lingkaran di bekal nasi-tempe")
hit("pencil_short", f(1233), -11, "coretan merah 'Restoran Mewah'")
bed("rain_light", 41.95, 46.85, -21, "hujan, rumah bocor")
for t in (44.62, 45.36, 46.05):
    hit("el_drip", t, -9, "tetesan air bocor" if t == 44.62 else "")
for t in (46.85, 47.85, 48.85):
    hit("el_monitor", t, -13 - (t - 46.85) * 3, "monitor detak jantung" if t == 46.85 else "")
hit("glitch_cine", f(1580), -12, "glitch ke 1980")
hit("impact_big", f(1593), -6, "angka 1980")
bed("projector", 55.0, 57.25, -24, "dengung proyektor di foto arsip", 0.3, 0.5)
hit("whoosh_air", f(1716), -21, "light leak ke potret")
hit("impact_big", f(1885), -15, "KEJUJURAN muncul")

# ------------------------------------------------------------------ master
mix = v + m + sfx
L = meter.integrated_loudness(mix.T)
mix *= db(-14.0 - L)
# true-peak guard: look-ahead peak limiter (5 ms attack, 80 ms release), then re-normalise
from scipy.ndimage import minimum_filter1d, uniform_filter1d


def limit(x, ceiling_db=-1.5):
    thr = db(ceiling_db)
    up = np.abs(signal.resample_poly(x, 4, 1, axis=1)).max(axis=0).reshape(-1, 4).max(axis=1)[: x.shape[1]]
    A = ns(0.005)
    req = np.minimum(1.0, thr / (up + 1e-12))
    g = minimum_filter1d(req, 2 * A + 1)       # look-ahead: start reducing 5 ms before a peak
    g = uniform_filter1d(g, A)                  # smooth; never above the requirement
    rel = minimum_filter1d(g, ns(0.06))         # hold ~60 ms, then glide back
    g = np.minimum(g, uniform_filter1d(rel, ns(0.06)))
    return x * g[None, :]


for _ in range(3):
    mix = limit(mix)
    mix *= db(-14.0 - meter.integrated_loudness(mix.T))
mix = limit(mix, -1.2)
tp = 20 * np.log10(np.abs(signal.resample_poly(mix, 4, 1, axis=1)).max() + 1e-12)
L2 = meter.integrated_loudness(mix.T)
out = os.path.join(HERE, "mix.wav")
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16).T.copy()
import wave
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(f"voice {VL:.1f} LUFS | mix {L2:.1f} LUFS | true peak {tp:.1f} dBTP | music length {music.shape[1]/SR:.2f} s")

with open(os.path.join(HERE, "cues.md"), "w") as fh:
    fh.write("# Cue sheet SFX (detik, nama file, gain dB, kegunaan)\n\n| detik | file | dB | momen |\n|---|---|---|---|\n")
    for t, n, gdb, what in sorted(cues):
        if what:
            fh.write(f"| {t:6.2f} | {n} | {gdb:.0f} | {what} |\n")
    fh.write("\nMusik: ElevenLabs Music (take A), 2 bar diulang di 44,97 dtk; hilang 27,20-27,95 dtk (sebelum 'Namun'), kembali lewat low-pass.\n")
