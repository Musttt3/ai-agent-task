"""Synthesise every sound effect in code and mix it under the voiceover.

python3 -I src/sound_board.py   ->  out/mix_board.wav and cues_board.md (evidence-board cut)
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


# ------------------------------------------------------------------ board-specific recipes
def pin_push(seed):
    r = np.random.default_rng(seed)
    n = int(0.25 * SR); t = np.arange(n) / SR
    click = hp(r.standard_normal(n), 3000) * env_exp(n, 0.003)
    cork = bp(r.standard_normal(n), 250, 1500) * env_exp(n, 0.03)
    thock = np.sin(2 * np.pi * 180 * t) * env_exp(n, 0.025)
    return norm(0.7 * click + cork + 0.6 * thock)


def string_zip(sec, seed):
    """Taut yarn pulled across cork: rising friction hiss with a light ripple."""
    r = np.random.default_rng(seed)
    n = int(sec * SR); t = np.arange(n) / SR
    x = bp(r.standard_normal(n), 900, 5000)
    rip = 0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(np.linspace(18, 40, n)) / SR)
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.2
    tw = np.sin(2 * np.pi * 220 * t) * np.exp(-((t - sec) / 0.05) ** 2) * 0.35  # small twang as it lands
    return norm(x * rip * e + tw)


def switch(seed, heavy=1.0):
    r = np.random.default_rng(seed)
    n = int(0.3 * SR); t = np.arange(n) / SR
    c1 = bp(r.standard_normal(n), 1500, 7000) * env_exp(n, 0.004)
    body = bp(r.standard_normal(n), 200, 1200) * env_exp(n, 0.04) * heavy
    low = np.sin(2 * np.pi * 70 * t) * env_exp(n, 0.06) * heavy
    return norm(c1 + 0.8 * body + 0.6 * low)


def flap(seed):
    r = np.random.default_rng(seed)
    n = int(0.6 * SR); t = np.arange(n) / SR
    x = bp(r.standard_normal(n), 700, 4000) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 6 * t))) * env_exp(n, 0.18)
    return norm(x)


def heartbeat():
    n = int(0.5 * SR); t = np.arange(n) / SR
    b = np.sin(2 * np.pi * 52 * t) * env_exp(n, 0.07) + 0.6 * np.sin(2 * np.pi * 48 * (t - 0.17)) * env_exp(n, 0.07) * (t > 0.17)
    return norm(lp(b, 200))


def typed(t0, t1, n, seed, label, g=-21, pan=0.0):
    for i in range(n):
        put(t0 + (t1 - t0) * (i + 0.5) / n - 0.02, key_clack(seed + i), g, pan, label if i == 0 else None)


# ------------------------------------------------------------------ cues (times = visual events in render_board.mjs)
typed(0.05, 0.50, 7, 300, "typewriter: SUHARTO strip")
put(0.60, scribble(0.70, 500, 4500, 9, 1, squeak=0.4), -21, -0.1, "grease pencil: circle round the smile")
put(3.04, pin_push(1), -18, 0.25, "pin: index card")
put(3.40, scribble(0.48, 600, 5000, 10, 31, squeak=0.6), -19, 0.25, "felt pen: Senang?")
put(4.35, string_zip(1.15, 2), -27, 0.2, "string pulled: portrait -> book")
for tw, g in [(6.68, -19), (6.94, -18), (7.46, -17)]:
    put(tw - 0.01, press(), g, 0.1, "letterpress: THE / SMILING / GENERAL" if tw == 6.68 else None)
put(8.62, scribble(1.30, 2500, 9000, 13, 2), -27, 0.15, "graphite pencil: 'Jenderal yang tersenyum'")
put(13.66, pin_push(3), -15, 0.3, "pin: 1969 tag")
put(13.74, flap(4), -24, 0.3, "tag swings")
put(13.74, string_zip(0.31, 5), -28, 0.3)
put(14.75, string_zip(1.55, 6), -27, -0.2, "string pulled: book -> contact sheet")
put(20.28, switch(7, 1.2), -16, 0, "light switch: lights out on 'Namun'")
put(20.50, string_zip(0.85, 8), -30, 0.2, "string pulled in the dark")
put(20.90, switch(9, 0.3), -20, -0.2, "flashlight click")
for k, tb in enumerate(np.arange(21.3, 27.0, 0.92)):
    put(tb, heartbeat(), -29, 0, "low pulse under the flashlight" if k == 0 else None)
typed(21.55, 22.05, 10, 320, "typewriter: JOHN ROOSA strip", -22, 0.1)
typed(22.05, 22.40, 9, 340, "typewriter: SEJARAWAN strip", -24, 0.1)
put(23.50, string_zip(0.65, 10), -29, 0.1)
put(23.72, slide(0.85, 900, 7000, 5), -23, 0.3, "tracing paper slides over the face")
put(24.37, pin_push(11), -19, 0.2, "pin: tracing paper")
put(26.95, switch(12, 1.0), -17, 0, "light switch: lights back on on 'Kesan'")
put(27.10, string_zip(1.40, 13), -28, -0.1, "string pulled: down to the map")
put(28.42, pin_push(14), -16, -0.2, "pin: Jakarta hub")
put(28.2, norm(lp(noise(4.0), 180) * np.sin(np.linspace(0, np.pi, int(4.0 * SR))) ** 2), -30, 0, "low bloom: network spreads")
# string network: one quiet pull per city, pins tap as they land (times mirror render_board.mjs)
proj = lambda lo, la: ((lo - 94.5) * 191.5, (6.5 - la) * 191.5)
cities = [[95.32, 5.55], [98.67, 3.59], [100.35, -0.95], [101.45, 0.51], [104.75, -2.99], [105.26, -5.43], [109.33, -0.03],
          [114.59, -3.32], [117.15, -0.5], [117.6, 3.3], [110.42, -6.97], [112.75, -7.25], [115.22, -8.65], [116.1, -8.58], [123.6, -10.17],
          [119.42, -5.14], [119.87, -0.9], [124.84, 1.47], [122.5, -3.97], [127.38, 0.79], [128.18, -3.69], [131.25, -0.88], [134.06, -0.86],
          [140.7, -2.53], [140.4, -8.49], [136.9, -4.5]]
J = proj(106.85, -6.2)
ds = [np.hypot(proj(*c)[0] - J[0], proj(*c)[1] - J[1]) for c in cities]
for k, (c, d) in enumerate(zip(cities, ds)):
    arrive = 29.0 + (d / max(ds)) ** 0.9 * (32.02 - 29.0)
    pan = float(np.clip((c[0] - 118) / 25, -0.8, 0.8))
    put(arrive - 0.55, string_zip(0.55, 400 + k), -33, pan, "string network: 26 pulls, last lands on 'dominan'" if k == 0 else None)
    put(arrive - 0.02, pin_push(500 + k), -27, pan)
put(34.40, pre_swish(0.62), -28, -0.2)
put(35.02, paper_drop(), -16, -0.2, "print lands: military photo, pinned at Jakarta")
for td, pan, lab in [(36.90, 0.1, "print lands + pin: protest photo"), (39.72, 0.25, "print lands + pin: rice field")]:
    put(td - 0.45, pre_swish(0.45), -28, pan)
    put(td, paper_drop(), -16, pan, lab)
    put(td + 0.01, pin_push(int(td * 10)), -18, pan)
for k in range(4):
    put(37.50 + k * 0.02, pin_push(600 + k), -21, 0.1, "pins: corners of the protest photo" if k == 0 else None)
put(37.62, string_zip(0.24, 700), -22, 0.0, "strings snap across the protest photo on 'dibatasi'")
put(37.66, string_zip(0.20, 701), -22, 0.2)
put(37.86, press(), -21, 0.1)
put(41.4, whoosh(3.0, 9, 80, 700), -30, 0, "air: long pull back over the board")
put(45.25, string_zip(1.85, 15), -28, 0.2, "string pulled: map -> contact sheet")
for tpin, tw, dur, lab, sd in [(48.10, 48.52, 0.43, "SETUJU?", 3), (49.10, 49.50, 0.36, "KESAL?", 4), (50.50, 50.90, 0.80, "MENJAGA SIKAP?", 6)]:
    put(tpin, pin_push(sd + 40), -19, 0.0, f"pin + felt pen: {lab}")
    put(tw, scribble(dur, 600, 5000, 10, sd, squeak=0.6), -19, 0.0)
put(52.00, string_zip(1.70, 16), -28, -0.2, "string pulled: back to the portrait")
put(55.30, scribble(0.30, 600, 5000, 9, 8, squeak=0.6), -19, 0.25, "felt pen: ? on 'tafsir'")
put(58.2, whoosh(2.9, 15, 70, 900), -27, 0, "air: the big pull back over the board")
put(58.20, string_zip(2.70, 17), -29, 0.1, "string pulled: portrait -> the papers")
for ts, lab in [(61.40, "stamp: KEPUTUSAN"), (62.40, "stamp: TINDAKAN")]:
    put(ts - 0.09, pre_swish(0.09), -26, 0)
    put(ts, stamp(), -13, -0.1 if ts < 62 else 0.1, lab)
put(62.98, switch(18, 1.0), -18, 0, "light switch: lights out")

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
out = os.path.join(ROOT, "out", "mix_board.wav")
wavfile.write(out, SR, (np.clip(mix, -1, 1) * 32767).astype(np.int16))

with open(os.path.join(ROOT, "cues_board.md"), "w") as f:
    f.write(f"# Sound cues\n\nAll synthesised in `src/sound.py`. Length {DUR:.3f} s, 48 kHz stereo, normalised to -14 LUFS.\n\n")
    for tc, lab in sorted(cues):
        f.write(f"- {tc:6.2f} s  {lab}\n")
print("mix ->", out)
