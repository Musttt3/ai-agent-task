"""Synthesise every sound effect in code and mix it under the voiceover.

python3 -I src/sound.py   ->  out/mix.wav (48 kHz stereo, 63.333 s, -14 LUFS) and cues.md
All cue times match the visual events in src/render.mjs.
"""
import os, subprocess, json
import numpy as np
from scipy.signal import butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
DUR = 1900 / 30  # 63.333 s, exactly the video length
N = int(round(DUR * SR))
rng = np.random.default_rng(12)
mix = np.zeros((N, 2), np.float32)
cues = []


def bp(x, lo, hi, order=4):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def lp(x, f, order=4):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=4):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def noise(sec):
    return rng.standard_normal(int(sec * SR)).astype(np.float32)


def env_exp(n, decay):
    return np.exp(-np.arange(n) / SR / decay).astype(np.float32)


def put(t, sig, gain_db, pan=0.0, label=None):
    """Add mono sig at time t (s) with equal-power pan (-1..1)."""
    if label:
        cues.append((t, label))
    g = 10 ** ((gain_db + 6) / 20)  # +6 dB: effects must read on phone speakers
    i = int(round(t * SR))
    if i < 0:
        sig = sig[-i:]; i = 0
    n = min(len(sig), N - i)
    if n <= 0:
        return
    a = (pan + 1) * np.pi / 4
    mix[i:i + n, 0] += sig[:n] * g * np.cos(a)
    mix[i:i + n, 1] += sig[:n] * g * np.sin(a)


def norm(x):
    return x / (np.max(np.abs(x)) + 1e-9)


# ------------------------------------------------------------------ sound recipes
def scribble(sec, lo, hi, rate, seed, squeak=0.0):
    """Marker / grease pencil on paper: band noise shaped into strokes."""
    r = np.random.default_rng(seed)
    n = int(sec * SR)
    body = bp(r.standard_normal(n), lo, hi)
    grit = hp(r.standard_normal(n) * (r.random(n) < 0.02), 2500) * 0.6
    e = np.zeros(n, np.float32)
    t = 0
    while t < n:
        L = int(SR * r.uniform(0.6, 1.4) / rate)
        s = np.sin(np.linspace(0, np.pi, L)) ** 0.7 * r.uniform(0.55, 1.0)
        e[t:t + L] = s[: max(0, min(L, n - t))]
        t += L + int(SR * r.uniform(0.0, 0.02))
    sig = (body + grit) * e
    if squeak:
        tt = np.arange(n) / SR
        f = 2600 + 300 * np.sin(tt * 2 * np.pi * rate * 0.5)
        sig += squeak * np.sin(2 * np.pi * np.cumsum(f) / SR) * e ** 2 * 0.15
    fade = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.015 * SR))
    return norm(sig * fade)


def stamp():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * np.cumsum(110 * np.exp(-t * 9) + 46) / SR) * env_exp(n, 0.10)
    knock = bp(noise(0.45), 180, 1400) * env_exp(n, 0.035)
    click = hp(noise(0.45), 1800) * env_exp(n, 0.006)
    squish = bp(noise(0.45), 400, 2500) * np.exp(-((t - 0.05) / 0.03) ** 2) * 0.25
    return norm(1.0 * thump + 0.7 * knock + 0.35 * click + squish)


def pre_swish(sec):
    """Short rising air before an impact."""
    n = int(sec * SR)
    x = bp(noise(sec), 300, 3000)
    e = np.linspace(0, 1, n) ** 2.5
    return norm(x * e)


def paper_drop():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    slap = bp(noise(0.5), 500, 6000) * env_exp(n, 0.045)
    thud = np.sin(2 * np.pi * 85 * t) * env_exp(n, 0.06)
    flutter = bp(noise(0.5), 900, 4000) * env_exp(n, 0.15) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * t)) * 0.25
    return norm(slap + 0.8 * thud + flutter)


def press():
    """Letterpress title: muted deep knock."""
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    k = np.sin(2 * np.pi * np.cumsum(90 * np.exp(-t * 12) + 55) / SR) * env_exp(n, 0.07)
    w = bp(noise(0.35), 120, 900) * env_exp(n, 0.03)
    return norm(k + 0.6 * w)


def key_clack(seed):
    r = np.random.default_rng(seed)
    n = int(0.16 * SR)
    t = np.arange(n) / SR
    c = hp(r.standard_normal(n), 2500) * env_exp(n, 0.004)
    b = bp(r.standard_normal(n), 700, 2200) * env_exp(n, 0.025)
    low = np.sin(2 * np.pi * 160 * t) * env_exp(n, 0.03)
    return norm(0.8 * c + b + 0.5 * low)


def slide(sec, lo, hi, seed):
    """Paper / tracing paper sliding across paper."""
    r = np.random.default_rng(seed)
    n = int(sec * SR)
    x = bp(r.standard_normal(n), lo, hi)
    crinkle = bp(r.standard_normal(n) * (r.random(n) < 0.004), 2000, 9000) * 3
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    e *= 0.75 + 0.25 * lp(r.standard_normal(n), 12) / 0.05
    return norm((x + crinkle) * np.clip(e, 0, None))


def whoosh(sec, seed, lo=120, hi=1600):
    r = np.random.default_rng(seed)
    n = int(sec * SR)
    x = np.cumsum(r.standard_normal(n)); x -= np.convolve(x, np.ones(2400) / 2400, "same")
    x = bp(x, lo, hi, 2)
    e = np.sin(np.linspace(0, np.pi, n)) ** 2
    return norm(x * e)


# ------------------------------------------------------------------ bed: room tone + low drone
t = np.arange(N) / SR
room = lp(np.cumsum(rng.standard_normal(N)) * 0.02, 400)
room = room - lp(room, 30)
room = norm(room) * 10 ** (-44 / 20)
drone_env = 0.55 + 0.45 * np.interp(t, [0, 3, 26, 28.5, 32.2, 34, 41, 44.5, 46, 57.5, 60, 62.6, DUR],
                                       [0, .5, .5, 1.0, 1.0, .55, .55, .85, .5, .5, .9, .8, 0])
dr = (np.sin(2 * np.pi * 55 * t) * 0.5 + np.sin(2 * np.pi * 82.41 * t + 1) * 0.3 + np.sin(2 * np.pi * 110.3 * t + 2) * 0.18
      + np.sin(2 * np.pi * 164.8 * t + .5) * 0.06 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t)))
dr *= 0.8 + 0.2 * np.sin(2 * np.pi * 0.11 * t)
fade_in = np.clip(t / 1.5, 0, 1)
fade_out = np.clip((DUR - t) / 0.4, 0, 1)
bed = (dr * 10 ** (-33 / 20) * drone_env) * fade_in * fade_out + room * fade_out
mix[:, 0] += bed.astype(np.float32)
mix[:, 1] += bed.astype(np.float32) * 0.98 + np.roll(room, 977).astype(np.float32) * 0.3
cues.append((0.0, "room tone + low drone (swells under the map and the final move)"))

# ------------------------------------------------------------------ cues (times = visual events)
put(0.60, scribble(0.70, 500, 4500, 9, 1, squeak=0.4), -21, -0.1, "grease pencil: circle round the smile")
for i in range(7):
    put(3.40 + i * 0.055, key_clack(40 + i), -19 + (2 if i == 6 else 0), 0.05 * (i - 3), "type: SENANG?" if i == 0 else None)
put(4.45, whoosh(1.3, 3), -32, 0.2, "air: glide to the book")
for tw, g in [(6.68, -19), (6.94, -18), (7.46, -17)]:
    put(tw - 0.01, press(), g, 0.1, "letterpress: THE / SMILING / GENERAL" if tw == 6.68 else None)
put(8.62, scribble(1.30, 2500, 9000, 13, 2), -27, 0.15, "graphite pencil: 'Jenderal yang tersenyum'")
put(13.74 - 0.09, pre_swish(0.09), -26, 0.2)
put(13.74, stamp(), -14, 0.15, "stamp: 1969")
put(23.72, slide(0.85, 900, 7000, 5), -23, 0.3, "tracing paper slides over the face")
put(27.3, whoosh(1.6, 7, 80, 900), -29, 0, "air: pull back to the map")
put(28.2, norm(lp(noise(4.0), 180) * np.sin(np.linspace(0, np.pi, int(4.0 * SR))) ** 2), -30, 0, "low bloom: ink spreads")
for td, pan, lab in [(35.02, -0.25, "print drops: military photo"), (36.90, 0.1, "print drops: protest photo"), (39.72, 0.25, "print drops: rice field")]:
    put(td - 0.45, pre_swish(0.45), -28, pan)
    put(td, paper_drop(), -16, pan, lab)
for k, tk in enumerate([37.62, 37.68, 37.74, 37.80]):
    put(tk, scribble(0.07, 800, 5000, 30, 60 + k), -22, 0.1, "marker: border snaps shut" if k == 0 else None)
put(37.86, press(), -22, 0.1)
put(41.4, whoosh(3.0, 9, 80, 700), -30, 0, "air: long pull back over the red map")
put(45.3, whoosh(1.8, 11), -32, -0.2, "air: travel to the contact sheet")
put(48.52, scribble(0.43, 600, 5000, 10, 3, squeak=0.6), -20, -0.1, "marker: SETUJU?")
put(49.50, scribble(0.36, 600, 5000, 10, 4, squeak=0.6), -20, 0.0, "marker: KESAL?")
put(50.90, scribble(0.80, 600, 5000, 10, 6, squeak=0.6), -20, 0.1, "marker: MENJAGA SIKAP?")
put(52.1, whoosh(1.5, 13), -32, 0.2, "air: back to the portrait")
put(55.30, scribble(0.24, 600, 5000, 9, 8, squeak=0.6), -20, 0.25, "marker: ? on 'tafsir'")
put(55.58, key_clack(99) * 0.6, -26, 0.25)
put(58.2, whoosh(2.9, 15, 70, 900), -27, 0, "air: the big pull back over the desk")
for ts, lab in [(61.40, "stamp: KEPUTUSAN"), (62.40, "stamp: TINDAKAN")]:
    put(ts - 0.09, pre_swish(0.09), -26, 0)
    put(ts, stamp(), -13, -0.1 if ts < 62 else 0.1, lab)

# ------------------------------------------------------------------ voiceover
vo_path = os.path.join(ROOT, "voice", "vo.mp3")
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", vo_path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
vo = np.frombuffer(raw, np.float32).copy()
vo = vo[:N]
vo = np.pad(vo, (0, N - len(vo)))
# gentle duck of the bed + sfx while the voice speaks (keeps words clear)
venv = lp(np.abs(vo), 6)
duck = 1 - 0.35 * np.clip(venv / (np.percentile(venv, 90) + 1e-9), 0, 1)
mix *= duck[:, None].astype(np.float32)
mix[:, 0] += vo
mix[:, 1] += vo

# ------------------------------------------------------------------ loudness: -14 LUFS integrated, true peak below -1.5 dBTP
from scipy.io import wavfile
from scipy.signal import resample_poly
tmp = os.path.join(ROOT, "out", "_mix_raw.wav")
os.makedirs(os.path.dirname(tmp), exist_ok=True)


def lufs(x):
    wavfile.write(tmp, SR, x.astype(np.float32))
    e = subprocess.run(["ffmpeg", "-hide_banner", "-i", tmp, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    line = [l for l in e.splitlines() if l.strip().startswith("I:")][-1]
    return float(line.split()[1])


for _ in range(2):
    mix *= 10 ** ((-14.0 - lufs(mix)) / 20)
    up4 = resample_poly(mix, 4, 1, axis=0)
    ceil = 10 ** (-1.5 / 20)
    peak = np.max(np.abs(up4))
    if peak > ceil:  # soft-knee limiter on the few overs
        knee = ceil * 0.7
        a = np.abs(mix)
        over = a > knee
        mix[over] = np.sign(mix[over]) * (knee + (ceil - knee) * np.tanh((a[over] - knee) / (ceil - knee)))
os.remove(tmp)
out = os.path.join(ROOT, "out", "mix.wav")
wavfile.write(out, SR, (np.clip(mix, -1, 1) * 32767).astype(np.int16))

with open(os.path.join(ROOT, "cues.md"), "w") as f:
    f.write(f"# Sound cues\n\nAll synthesised in `src/sound.py`. Length {DUR:.3f} s, 48 kHz stereo, normalised to -14 LUFS.\n\n")
    for tc, lab in sorted(cues):
        f.write(f"- {tc:6.2f} s  {lab}\n")
print("mix ->", out)
