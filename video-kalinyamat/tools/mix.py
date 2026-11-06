"""Sound design + mix for "Indonesia 1 Juta Tahun Lalu".

Everything except the narration and four short Remotion SFX (whoosh, whip,
page-turn, ding) is synthesised here, so the soundtrack is free of third-party
licences. Usage:  python3 tools/mix.py <narration.mp3> <out.wav>
"""
import json, os, subprocess, sys
import numpy as np
from scipy import signal

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
rng = np.random.default_rng(1891)

plan = json.load(open(os.path.join(ROOT, "src", "data", "plan.json")))
DUR = plan["duration"]
N = int(DUR * SR)
START = {s["i"]: s["start"] for s in plan["scenes"]}
END = {s["i"]: s["end"] for s in plan["scenes"]}
LAST = max(END)

# ------------------------------------------------------------------ utils
def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()

def sos(kind, f, order=2):
    return signal.butter(order, f, btype=kind, fs=SR, output="sos")

def filt(x, kind, f, order=2):
    return signal.sosfilt(sos(kind, f, order), x, axis=0)

def pink(n, ch=2):
    w = rng.standard_normal((n, ch))
    X = np.fft.rfft(w, axis=0)
    fr = np.fft.rfftfreq(n, 1 / SR)
    fr[0] = fr[1]
    X /= np.sqrt(fr)[:, None]
    y = np.fft.irfft(X, n, axis=0)
    return (y / (np.std(y) + 1e-9)).astype(np.float32)

def brown(n, ch=2):
    y = np.cumsum(rng.standard_normal((n, ch)), axis=0)
    y = filt(y, "highpass", 20)
    return y / (np.std(y) + 1e-9)

def lfo(n, rate, lo=0.0, hi=1.0):
    pts = max(4, int(n / SR * rate) + 4)
    v = rng.random(pts)
    x = np.linspace(0, pts - 3, n)
    y = np.interp(x, np.arange(pts), v)
    y = filt(y, "lowpass", max(rate * 2, 0.5), 1) if rate < 10 else y
    y = (y - y.min()) / (np.ptp(y) + 1e-9)
    return lo + (hi - lo) * y

def pan(mono, p):
    """p in [-1,1]"""
    a = (p + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)], axis=1)

def env_ar(n, a, r):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / r)

def fade(x, fi, fo):
    n = len(x)
    e = np.ones(n)
    ni, no = int(fi * SR), int(fo * SR)
    if ni: e[:ni] = np.linspace(0, 1, ni) ** 2
    if no: e[-no:] = np.minimum(e[-no:], np.linspace(1, 0, no) ** 2)
    return x * e[:, None] if x.ndim == 2 else x * e

def reverb(x, secs=1.2, mix=0.25):
    n = int(secs * SR)
    ir = rng.standard_normal((n, 2)) * np.exp(-np.arange(n) / (SR * secs / 6))[:, None]
    ir = filt(ir, "lowpass", 5000)
    ir /= np.sqrt((ir ** 2).sum(axis=0))
    wet = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    return x * (1 - mix) + wet * mix

def norm(x, peak=1.0):
    return x * (peak / (np.abs(x).max() + 1e-9))

def db(v):
    return 10 ** (v / 20)

MIX = {"amb": np.zeros((N, 2), np.float32), "sfx": np.zeros((N, 2), np.float32), "mus": np.zeros((N, 2), np.float32)}

def place(bus, x, t, gain_db=0.0):
    if x.ndim == 1:
        x = pan(x, 0)
    i = int(t * SR)
    if i >= N or i + len(x) <= 0:
        return
    j = min(N, i + len(x))
    k0 = max(0, -i)
    MIX[bus][max(0, i):j] += (x[k0: j - i] * db(gain_db)).astype(np.float32)

# ------------------------------------------------------------ ambiences
def amb_birds(d, density=0.7, level=1.0):
    n = int(d * SR)
    out = np.zeros((n, 2))
    for _ in range(rng.poisson(density * d)):
        t0 = rng.uniform(0, d)
        base = rng.uniform(2300, 5200)
        kind = rng.integers(0, 3)
        notes = rng.integers(2, 7)
        amp = rng.uniform(0.04, 0.16) * level
        p = rng.uniform(-0.85, 0.85)
        t = t0
        for _k in range(notes):
            nd = rng.uniform(0.04, 0.13)
            m = int(nd * SR)
            tt = np.arange(m) / SR
            if kind == 0:
                fr = base * (1 + 0.5 * tt / nd)
            elif kind == 1:
                fr = base * (1.4 - 0.5 * tt / nd)
            else:
                fr = base + 380 * np.sin(2 * np.pi * rng.uniform(18, 40) * tt)
            ph = 2 * np.pi * np.cumsum(fr) / SR
            s = (np.sin(ph) + 0.15 * np.sin(2 * ph)) * np.sin(np.pi * tt / nd) ** 2 * amp
            i = int(t * SR)
            if i + m < n:
                out[i:i + m] += pan(s, p)
            t += nd + rng.uniform(0.02, 0.09)
    return reverb(out, 0.9, 0.3)

def amb_wind(d, strength=1.0):
    n = int(d * SR)
    w = pink(n)
    a = filt(w, "lowpass", 700) * lfo(n, 0.08, 0.35, 1.0)[:, None]
    b = filt(w, "bandpass", [500, 1800]) * lfo(n, 0.12, 0.0, 0.6)[:, None] * 0.5
    return (a + b) * 0.07 * strength

def amb_river(d, level=1.0):
    n = int(d * SR)
    base = filt(pink(n), "bandpass", [250, 5000]) * 0.05 * lfo(n, 0.2, 0.75, 1.0)[:, None]
    bub = np.zeros(n)
    for _ in range(rng.poisson(35 * d)):
        m = int(rng.uniform(0.008, 0.03) * SR)
        f0 = rng.uniform(500, 2200)
        tt = np.arange(m) / SR
        s = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 1.5 * tt / tt[-1])) / SR) * np.exp(-tt / (tt[-1] / 3))
        i = rng.integers(0, n - m)
        bub[i:i + m] += s * rng.uniform(0.005, 0.03)
    return (base + pan(bub, rng.uniform(-0.3, 0.3))) * level

def amb_waves(d):
    n = int(d * SR)
    t = np.arange(n) / SR
    sw = (0.5 + 0.5 * np.sin(2 * np.pi * t / 7.5 + 1.0)) ** 2
    x = filt(pink(n), "lowpass", 1400) * (0.25 + sw)[:, None] * 0.06
    hiss = filt(pink(n), "highpass", 2500) * sw[:, None] ** 3 * 0.02
    return x + hiss

def amb_crickets(d, level=1.0):
    n = int(d * SR)
    out = np.zeros((n, 2))
    t = np.arange(n) / SR
    for _ in range(7):
        f = rng.uniform(3900, 5300)
        rate = rng.uniform(1.4, 3.0)
        pulses, prate = rng.integers(3, 6), rng.uniform(24, 34)
        ph0 = rng.uniform(0, 1)
        cyc = ((t * rate + ph0) % 1.0) / rate
        gate = (cyc < pulses / prate) & ((cyc * prate) % 1.0 < 0.45)
        e = filt(gate.astype(float), "lowpass", 300, 1)
        out += pan(np.sin(2 * np.pi * f * t) * e * rng.uniform(0.012, 0.03), rng.uniform(-0.9, 0.9))
    out += filt(pink(n), "bandpass", [5500, 9000]) * 0.006
    return reverb(out, 1.0, 0.25) * level

def amb_city(d):
    n = int(d * SR)
    out = filt(brown(n), "lowpass", 260) * 0.05
    for _ in range(int(d / 1.6)):
        m = int(rng.uniform(1.5, 3.0) * SR)
        g = signal.windows.gaussian(m, m / 6)
        nz = filt(rng.standard_normal(m), "bandpass", [150, 1800]) * g * rng.uniform(0.04, 0.09)
        p = np.linspace(rng.choice([-0.9, 0.9]), 0, m) * rng.choice([1, -1])
        i = rng.integers(0, n - m)
        out[i:i + m] += np.stack([nz * np.cos((p + 1) * np.pi / 4), nz * np.sin((p + 1) * np.pi / 4)], 1)
    for _ in range(int(d / 3)):  # motorbikes
        m = int(2.2 * SR)
        tt = np.arange(m) / SR
        f = rng.uniform(70, 110) * (1.08 - 0.12 * tt / tt[-1])
        ph = 2 * np.pi * np.cumsum(f) / SR
        saw = sum(np.sin(k * ph) / k for k in range(1, 9))
        s = filt(saw, "lowpass", 1400) * signal.windows.gaussian(m, m / 5) * 0.035
        i = rng.integers(0, n - m)
        out[i:i + m] += pan(s, rng.uniform(-0.7, 0.7))
    for _ in range(int(d / 9)):  # horns
        m = int(0.28 * SR)
        tt = np.arange(m) / SR
        hz = signal.square(2 * np.pi * 420 * tt) + signal.square(2 * np.pi * 530 * tt)
        s = filt(hz, "lowpass", 2400) * env_ar(m, 0.01, 0.2) * 0.012
        i = rng.integers(0, n - m)
        out[i:i + m] += pan(s, rng.uniform(-0.8, 0.8))
    return reverb(out, 1.4, 0.3)

def amb_fire(d):
    n = int(d * SR)
    out = filt(pink(n), "bandpass", [1500, 7000]) * 0.006 + filt(brown(n), "lowpass", 150) * 0.02
    for _ in range(rng.poisson(14 * d)):
        m = int(rng.uniform(0.003, 0.02) * SR)
        s = filt(rng.standard_normal(m), "highpass", 1200) * np.exp(-np.arange(m) / (m / 4)) * rng.uniform(0.02, 0.12)
        i = rng.integers(0, n - m)
        out[i:i + m] += pan(s, rng.uniform(-0.5, 0.5))
    return out

def amb_sizzle(d):
    n = int(d * SR)
    x = filt(pink(n), "highpass", 2500) * 0.03 * lfo(n, 25, 0.3, 1.0)[:, None]
    return x + amb_fire(d) * 0.4

def amb_vortex(d):
    n = int(d * SR)
    t = np.arange(n) / SR
    f = 80 * (1 + 6 * (t / d) ** 2)
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = (np.sin(ph) + 0.4 * np.sin(1.5 * ph)) * 0.05 * (t / d)
    sw = filt(pink(n), "bandpass", [300, 6000]) * (0.02 + 0.06 * (t / d) ** 2)[:, None]
    wob = 0.5 + 0.5 * np.sin(2 * np.pi * (2 + 6 * t / d) * t)
    return (pan(tone, 0) + sw) * wob[:, None]

def amb_room(d):
    n = int(d * SR)
    return filt(pink(n), "lowpass", 400) * 0.012

def amb_gulls(d, density=0.12):
    n = int(d * SR)
    out = np.zeros((n, 2))
    for _ in range(rng.poisson(density * d)):
        t0 = rng.uniform(0, max(0.1, d - 2))
        p = rng.uniform(-0.8, 0.8)
        for k in range(rng.integers(2, 5)):
            m = int(rng.uniform(0.18, 0.32) * SR)
            tt = np.arange(m) / SR
            f = rng.uniform(1500, 1900) * (1 - 0.35 * tt / tt[-1])
            ph = 2 * np.pi * np.cumsum(f) / SR
            y = sum(np.sin(h * ph) / h for h in range(1, 5)) * np.clip(np.sin(np.pi * tt / tt[-1]), 0, None) ** 1.5
            i = int((t0 + k * rng.uniform(0.3, 0.45)) * SR)
            if i + m < n:
                out[i:i + m] += pan(filt(y, "bandpass", [700, 5000]) * rng.uniform(0.02, 0.05), p)
    return reverb(out, 1.4, 0.35)

def amb_market(d, level=1.0):
    n = int(d * SR)
    out = np.zeros((n, 2))
    for _ in range(int(d * 9)):  # murmur "syllables"
        m = int(rng.uniform(0.12, 0.35) * SR)
        lo = rng.uniform(250, 700)
        y = filt(rng.standard_normal(m), "bandpass", [lo, lo * rng.uniform(2.5, 4.5)])
        y *= np.sin(np.pi * np.arange(m) / m) * rng.uniform(0.01, 0.03)
        i = rng.integers(0, n - m)
        out[i:i + m] += pan(y, rng.uniform(-0.9, 0.9))
    for _ in range(int(d / 2.5)):  # pottery clinks
        m = int(0.15 * SR)
        tt = np.arange(m) / SR
        y = np.sin(2 * np.pi * rng.uniform(1800, 2600) * tt) * np.exp(-tt / 0.03) * 0.03
        i = rng.integers(0, n - m)
        out[i:i + m] += pan(y, rng.uniform(-0.7, 0.7))
    return reverb(out, 1.2, 0.35) * level

def amb_bigfire(d):
    n = int(d * SR)
    roar = filt(brown(n), "lowpass", 500) * lfo(n, 1.5, 0.5, 1.0)[:, None] * 0.07
    return roar + amb_fire(d) * 2.2

def amb_underwater(d):
    n = int(d * SR)
    x = filt(brown(n), "lowpass", 300) * 0.05 * lfo(n, 0.3, 0.6, 1.0)[:, None]
    bub = amb_river(d, 1.0)
    return x + filt(bub, "lowpass", 1500) * 1.5

def amb_cicada(d):
    n = int(d * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 5200 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 45 * t)) * lfo(n, 0.15, 0.0, 1.0)
    return pan(y * 0.006, 0.4)

def amb_rain(d):
    n = int(d * SR)
    x = filt(pink(n), "bandpass", [800, 9000]) * 0.03
    for _ in range(rng.poisson(60 * d)):
        m = int(0.01 * SR)
        y = filt(rng.standard_normal(m), "highpass", 2000) * np.exp(-np.arange(m) / (m / 4)) * rng.uniform(0.01, 0.05)
        i = rng.integers(0, n - m)
        x[i:i + m] += pan(y, rng.uniform(-1, 1))
    return x + amb_wind(d, 0.8)

def amb_battle(d):
    n = int(d * SR)
    out = amb_market(d, 1.6) * 0.8 + amb_waves(d) * 0.4
    for _ in range(int(d / 1.6)):
        t0 = rng.uniform(0, max(0.1, d - 2.5))
        x = s_boom(2.0, 70, 35) * rng.uniform(0.15, 0.35)
        i = int(t0 * SR)
        j = min(n, i + len(x))
        out[i:j] += x[: j - i]
    return out

AMB = {"birds": lambda d: amb_birds(d, 0.6) + amb_wind(d, 0.5),
       "birdsLight": lambda d: amb_birds(d, 0.3, 0.7) + amb_wind(d, 0.4),
       "wind": lambda d: amb_wind(d, 1.0),
       "harbor": lambda d: amb_waves(d) * 0.8 + amb_gulls(d) + amb_wind(d, 0.3),
       "sea": lambda d: amb_waves(d) + amb_wind(d, 0.7) + amb_gulls(d, 0.05),
       "market": lambda d: amb_market(d) + amb_wind(d, 0.25),
       "marketHarbor": lambda d: amb_market(d, 0.8) + amb_waves(d) * 0.5 + amb_gulls(d, 0.08),
       "crowd": lambda d: amb_market(d, 1.3),
       "palace": lambda d: amb_birds(d, 0.25, 0.6) + amb_room(d) * 1.5,
       "night": lambda d: amb_crickets(d, 0.7) + amb_wind(d, 0.3),
       "rain": amb_rain,
       "battle": amb_battle,
       "fire": amb_fire,
       "vortex": amb_vortex,
       "storm": lambda d: amb_wind(d, 2.0) + amb_waves(d) * 0.8,
       "room": amb_room}

BEDS = [  # (first scene, last scene, kind, gain dB)
    (1, 2, "sea", -2), (3, 3, "palace", -4), (4, 5, "harbor", -2), (6, 6, "harbor", -2), (7, 7, "storm", -4),
    (8, 8, "vortex", 0), (9, 11, "marketHarbor", 0), (12, 12, "room", 0), (13, 13, "storm", -4),
    (14, 14, "battle", -6), (15, 15, "wind", -2), (16, 17, "room", 0), (18, 19, "marketHarbor", -1),
    (20, 22, "palace", 0), (23, 23, "room", 0), (24, 25, "night", -2), (26, 26, "palace", -1), (27, 27, "night", -3),
    (28, 28, "night", -4), (29, 29, "rain", -2), (30, 30, "wind", -3), (31, 31, "crowd", -5), (32, 34, "harbor", 0),
    (35, 36, "palace", -2), (37, 37, "marketHarbor", 0), (38, 38, "sea", 0), (39, 44, "palace", -2),
    (45, 48, "sea", 0), (49, 49, "harbor", -2), (50, 51, "battle", -5), (52, 53, "sea", -2), (54, 55, "harbor", -2),
    (56, 56, "palace", -2), (57, 57, "room", 0), (58, 58, "harbor", -2), (59, 59, "room", 0), (60, 60, "harbor", -3),
    (61, 61, "palace", -2), (62, 62, "marketHarbor", -1), (63, 63, "battle", -5), (64, 64, "sea", -2),
    (65, 68, "sea", 0), (69, 69, "room", 0), (70, 70, "sea", -1), (71, 71, "harbor", -1), (72, 74, "sea", -2),
    (75, 75, "room", 0), (76, 76, "sea", -2), (77, 77, "battle", -5), (78, 78, "rain", -1), (79, 80, "sea", -2),
    (81, 81, "room", 0), (82, 83, "sea", -2), (84, 84, "sea", -3), (85, 87, "harbor", -3), (88, 88, "birds", -2),
    (89, 89, "room", 0), (90, 90, "harbor", -2), (91, 91, "palace", -2), (92, 92, "room", 0), (93, 93, "harbor", -2),
    (94, 94, "room", 0), (95, 95, "harbor", -4), (96, 97, "room", 0), (98, 98, "crowd", -8), (99, 99, "harbor", -3),
    (100, 100, "harbor", -3), (101, 103, "sea", -2), (104, 104, "harbor", -4), (105, 105, "sea", -2),
]

def build_beds():
    for a, b, kind, g in BEDS:
        t0 = max(0, START[a] - 0.6)
        t1 = min(DUR, END[b] + 0.6)
        x = AMB[kind](t1 - t0)
        place("amb", fade(x, 0.8, 0.8), t0, g)

# --------------------------------------------------------------- one-shots
def s_whoosh(d=0.75, lo=250, hi=3500, peak=0.55):
    n = int(d * SR)
    x = rng.standard_normal(n)
    f, tt, Z = signal.stft(x, SR, nperseg=1024)
    prog = np.linspace(0, 1, Z.shape[1])
    centre = np.where(prog < peak, lo + (hi - lo) * (prog / peak) ** 1.5, hi - (hi - lo) * 0.7 * ((prog - peak) / (1 - peak)))
    mask = np.exp(-((np.log(f[:, None] + 1) - np.log(centre[None, :])) ** 2) / 0.35)
    _, y = signal.istft(Z * mask, SR, nperseg=1024)
    y = y[:n]
    tt = np.arange(len(y)) / SR
    e = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 2
    y = norm(y * e, 0.6)
    p = np.linspace(-0.6, 0.6, len(y))
    return np.stack([y * np.cos((p + 1) * np.pi / 4), y * np.sin((p + 1) * np.pi / 4)], 1)

def s_boom(d=2.2, f0=62, f1=32):
    n = int(d * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.25)
    body = np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t / 0.7)
    hit = filt(rng.standard_normal(n), "lowpass", 900) * np.exp(-t / 0.05) * 0.6
    return reverb(pan(norm(body + hit, 0.9), 0), 2.0, 0.3)

def s_pop():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    f = 380 + 700 * np.exp(-t / 0.015)
    return pan(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.03) * 0.6, 0)

def s_clack():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * fr * t) * np.exp(-t / dc) for fr, a, dc in
            [(1850, 0.5, 0.05), (3120, 0.35, 0.03), (4900, 0.25, 0.02), (720, 0.3, 0.04)])
    y += filt(rng.standard_normal(n), "bandpass", [1500, 7000]) * np.exp(-t / 0.006) * 0.8
    return reverb(pan(norm(y, 0.8), rng.uniform(-0.2, 0.2)), 0.6, 0.2)

def s_splash(big=False):
    d = 0.9 if big else 0.5
    n = int(d * SR)
    t = np.arange(n) / SR
    y = filt(rng.standard_normal(n), "bandpass", [400, 6000]) * env_ar(n, 0.01, d / 4)
    y += amb_river(d, 1.0)[:, 0] * 3 * np.exp(-t / (d / 2))
    return pan(norm(y, 0.7), rng.uniform(-0.3, 0.3))

def s_step(heavy=False):
    n = int((0.4 if heavy else 0.12) * SR)
    t = np.arange(n) / SR
    if heavy:
        y = np.sin(2 * np.pi * np.cumsum(55 + 40 * np.exp(-t / 0.03)) / SR) * np.exp(-t / 0.12)
        y += filt(rng.standard_normal(n), "lowpass", 600) * np.exp(-t / 0.03) * 0.5
    else:
        y = filt(rng.standard_normal(n), "bandpass", [900, 5000]) * np.exp(-t / 0.03)
        y *= 1 + 0.6 * (rng.random(n) > 0.97)
    return pan(norm(y, 0.6), rng.uniform(-0.25, 0.25))

def s_thud():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * np.cumsum(60 + 90 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.12)
    y += filt(rng.standard_normal(n), "bandpass", [800, 4000]) * np.exp(-t / 0.01) * 0.5
    return pan(norm(y, 0.9), 0)

def s_heartbeat(beats=4, bpm=72):
    gap = 60 / bpm
    out = np.zeros((int((beats * gap + 0.5) * SR), 2))
    for b in range(beats):
        for off, a in ((0, 1.0), (0.24, 0.7)):
            x = s_thud() * a
            i = int((b * gap + off) * SR)
            out[i:i + len(x)] += x
    return filt(out, "lowpass", 180)

def s_snort():
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    y = filt(rng.standard_normal(n), "bandpass", [250, 1600]) * env_ar(n, 0.03, 0.15)
    y *= 0.6 + 0.4 * np.sin(2 * np.pi * 32 * t)
    return pan(norm(y, 0.7), 0.3)

def s_riser(d=3.0):
    n = int(d * SR)
    t = np.arange(n) / SR
    f = 180 * (1 + 5 * (t / d) ** 2)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3
    nz = s_whoosh(d, 300, 7000, 0.98)[:, 0]
    y = (tone + nz[:n]) * (t / d) ** 2
    return pan(norm(y, 0.7), 0)

def s_tick():
    n = int(0.03 * SR)
    t = np.arange(n) / SR
    return pan(np.sin(2 * np.pi * 3200 * t) * np.exp(-t / 0.003) * 0.6, 0)

def s_twinkle():
    out = np.zeros((int(0.9 * SR), 2))
    for k, fr in enumerate([1760, 2349, 2637, 3520]):
        n = int(0.6 * SR)
        t = np.arange(n) / SR
        y = np.sin(2 * np.pi * fr * t) * np.exp(-t / 0.15) * 0.25
        i = int(k * 0.07 * SR)
        out[i:i + n] += pan(y, -0.4 + k * 0.25)
    return reverb(out, 1.2, 0.35)

def s_stamp():
    y = s_thud() * 0.9
    n = int(0.08 * SR)
    t = np.arange(n) / SR
    slap = filt(rng.standard_normal(n), "bandpass", [1200, 6000]) * np.exp(-t / 0.012)
    y[:n] += pan(slap * 0.7, 0)
    return y

def s_scrape():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    y = filt(rng.standard_normal(n), "bandpass", [1800, 6500]) * np.sin(np.pi * t / t[-1]) * (0.6 + 0.4 * (rng.random(n) > 0.6))
    return pan(norm(y, 0.4), 0.1)

def s_thunder():
    n = int(4.5 * SR)
    t = np.arange(n) / SR
    crack = filt(rng.standard_normal(n), "highpass", 1500) * np.exp(-t / 0.05) * 0.5
    rum = filt(brown(n, 1)[:, 0], "lowpass", 180) * (np.minimum(1, t / 0.25) * np.exp(-t / 1.4)) * (0.7 + 0.3 * lfo(n, 4))
    return reverb(pan(norm(crack + rum, 0.9), 0), 2.5, 0.35)

def s_rustle():
    n = int(1.2 * SR)
    y = filt(rng.standard_normal(n), "bandpass", [1500, 7000]) * lfo(n, 14, 0, 1) * np.sin(np.pi * np.arange(n) / n)
    return pan(norm(y, 0.5), 0.6)

def s_chime():
    out = np.zeros((int(2.5 * SR), 2))
    for k, fr in enumerate([523.25, 659.25, 783.99, 1046.5]):
        n = int(2.0 * SR)
        t = np.arange(n) / SR
        y = (np.sin(2 * np.pi * fr * t) + 0.3 * np.sin(2 * np.pi * 2.76 * fr * t) * np.exp(-t / 0.2)) * np.exp(-t / 0.7) * 0.22
        i = int(k * 0.11 * SR)
        out[i:i + n] += pan(y, -0.3 + 0.2 * k)
    return reverb(out, 1.8, 0.4)

FILE = {k: load(os.path.join(HERE, "sfx", f"{k}.wav")) for k in ("whoosh", "whip", "page-turn", "ding")}

def S(name):
    return {"whoosh": lambda: s_whoosh(), "whooshLong": lambda: s_whoosh(1.2, 200, 3000, 0.6),
            "whooshDown": lambda: s_whoosh(1.4, 3000, 200, 0.2), "boom": s_boom, "boomSoft": lambda: s_boom(1.6, 80, 45) * 0.6,
            "pop": s_pop, "clack": s_clack, "splash": s_splash, "splashBig": lambda: s_splash(True),
            "step": s_step, "stepHeavy": lambda: s_step(True), "thud": s_thud, "heartbeat": s_heartbeat,
            "snort": s_snort, "riser": s_riser, "tick": s_tick, "twinkle": s_twinkle, "stamp": s_stamp,
            "scrape": s_scrape, "thunder": s_thunder, "rustle": s_rustle, "chime": s_chime,
            "fwhoosh": lambda: FILE["whoosh"], "fwhip": lambda: FILE["whip"], "page": lambda: FILE["page-turn"],
            "ding": lambda: FILE["ding"]}[name]()

def cue(t, name, g=0.0):
    place("sfx", S(name), t, g)

def build_sfx():
    # transitions
    for sc in plan["scenes"]:
        t, tr = sc["start"], sc["trans"]
        if tr == "whip":
            cue(t - 0.30, "whoosh", -9); cue(t - 0.05, "fwhip", -14)
        elif tr in ("wipe", "zoom"):
            cue(t - 0.35, "whoosh", -13)
        elif tr == "flash":
            cue(t - 0.45, "whooshLong", -12)
        elif tr == "warp":
            cue(t - 0.4, "whooshLong", -9)
        elif tr == "dip":
            cue(t - 0.6, "whooshDown", -16)
    # overlays (icon motion graphics)
    for o in plan["overlays"]:
        t, k = o["start"], o["kind"]
        if k in ("tag", "label", "big"):
            cue(t, "pop", -13)
        elif k == "chapter":
            cue(t, "boomSoft", -10); cue(t + 0.05, "fwhoosh", -16)
        elif k == "stamp":
            cue(t + 0.12, "stamp", -7)
        elif k == "year":
            cue(t, "boom", -10)
        elif k == "counter":
            for j in range(22):
                cue(t + 0.13 * j * (1 - j / 60), "tick", -16)
        elif k == "compare":
            cue(t + 0.4, "whoosh", -14); cue(t + 1.6, "pop", -12); cue(t + 2.6, "pop", -12)
        elif k == "title":
            cue(t - 0.2, "boom", -9); cue(t + 1.0, "twinkle", -16)
        elif k == "outro":
            cue(t + 0.2, "chime", -10)
        elif k == "icons":
            for j in range(len(o.get("icons", []))):
                cue(t + o.get("stagger", 0.45) * j, "pop", -12)
            if o.get("glow"):
                cue(t, "twinkle", -18)
        elif k == "fleet":
            cue(t, "whooshLong", -15); cue(t + 0.4, "splash", -20)
        elif k == "converge":
            for j in range(len(o.get("icons", []))):
                cue(t + j * 8 / 30, "whoosh", -16)
            cue(t + 2.0, "chime", -14)
        elif k == "swarm":
            for j in range(min(12, o.get("count", 10))):
                cue(t + j * 0.18, "pop", -20)
        elif k == "bursts":
            n = o.get("count", 6)
            for j in range(n):
                cue(t + (j / n) * (o["dur"] - 0.8), "boom", -14)
        elif k == "crossout":
            n = o.get("count", 3)
            step = 0.55 if n > 4 else 1.0
            for j in range(n):
                cue(t + 0.6 + j * step, "stamp", -10)
        elif k == "heartbreak":
            cue(t, "pop", -12); cue(t + o["dur"] * 0.35, "clack", -8); cue(t + o["dur"] * 0.35, "whooshDown", -16)
        elif k == "hourglass":
            cue(t, "pop", -12)
            for j in range(int(o["dur"] / 0.5) - 1):
                cue(t + 0.7 + j * 0.5, "tick", -18)
        elif k == "crown":
            cue(t + 0.1, "whooshDown", -16); cue(t + 0.45, "boomSoft", -12); cue(t + 0.5, "twinkle", -12)
        elif k == "flagdrop":
            cue(t, "pop", -12); cue(t + 0.3, "whooshLong", -15)
        elif k == "pin":
            cue(t + 0.25, "pop", -10); cue(t + 0.3, "boomSoft", -18)
        elif k == "route":
            cue(t, "whooshLong", -16)
    s = START
    # story moments
    cue(s[2] + 0.4, "stepHeavy", -14)
    cue(s[3] + 0.0, "boomSoft", -11)
    cue(s[7] + 0.4, "thunder", -12)
    cue(s[8] + 0.2, "riser", -10); cue(s[9] - 0.3, "boom", -10)
    cue(s[13] + 0.3, "thunder", -8)
    cue(s[14] + 0.6, "boom", -10)
    cue(s[24] + 0.4, "boomSoft", -14)
    cue(s[25] + 0.6, "heartbeat", -10)
    cue(s[27] + 0.4, "heartbeat", -10)
    cue(s[29] + 0.5, "thunder", -12)
    cue(s[30] + 0.3, "chime", -14)
    cue(s[40] + 0.4, "page", -10)
    cue(s[51] + 0.5, "thud", -8)
    cue(s[61] + 0.4, "page", -12)
    cue(s[66] + 0.2, "boom", -11)
    cue(s[78] + 0.3, "thunder", -10)
    cue(s[88] + 0.2, "ding", -14)
    cue(s[92] + 0.5, "page", -12)
    cue(s[97] + 0.3, "chime", -14)

# ------------------------------------------------------------------ music
def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)

CH = {"Dm": (50, 57, 62, 65), "Bb": (46, 53, 58, 62), "F": (48, 53, 57, 60), "C": (48, 52, 55, 60),
      "Gm": (43, 50, 55, 58), "Am": (45, 52, 57, 60), "Eb": (46, 51, 55, 58), "Dsus": (50, 57, 62, 64),
      "D": (50, 54, 57, 62), "Cm": (48, 51, 55, 60)}

TABLE = 4096
def wavetable(harm):
    ph = np.arange(TABLE) / TABLE * 2 * np.pi
    w = sum(a * np.sin(k * ph) for k, a in harm)
    return w / np.abs(w).max()

PAD_WT = wavetable([(k, 1 / k ** 1.3) for k in range(1, 9)])

def osc(freq, n, wt=PAD_WT, phase=0.0):
    ph = (phase + np.cumsum(np.full(n, freq / SR))) % 1.0
    return wt[(ph * TABLE).astype(np.int32)]

def pad(chords, d, sec=8.0, bright=1000, level=1.0):
    n = int(d * SR)
    out = np.zeros((n, 2))
    xf = 1.6
    t0 = 0.0
    k = 0
    while t0 < d:
        notes = CH[chords[k % len(chords)]]
        seg = min(sec + xf, d - t0 + xf)
        m = int(seg * SR)
        e = np.ones(m)
        a = int(xf * SR)
        e[:a] = np.linspace(0, 1, a) ** 1.5
        e[-a:] = np.minimum(e[-a:], np.linspace(1, 0, a) ** 1.5)
        voice = np.zeros((m, 2))
        for j, nt in enumerate(notes):
            f = midi(nt)
            for det, pn in ((-0.004, -0.6), (0.0, 0.0), (0.0045, 0.6)):
                voice += pan(osc(f * (1 + det), m, phase=rng.random()) * 0.06, pn * (0.4 + 0.15 * j))
        voice += pan(np.sin(2 * np.pi * midi(notes[0] - 12) * np.arange(m) / SR) * 0.10, 0)
        i = int(max(0, t0 - xf / 2) * SR)
        j = min(n, i + m)
        out[i:j] += (voice * e[:, None])[: j - i]
        t0 += sec
        k += 1
    out = filt(out, "lowpass", bright)
    return out * level

MARIMBA = wavetable([(1, 1.0), (4, 0.25), (10, 0.05)])

def plucks(chords, d, bpm=100, sec=8.0, density=0.7, level=1.0):
    n = int(d * SR)
    out = np.zeros((n, 2))
    step = 60 / bpm / 2
    t = 0.0
    k = 0
    while t < d - 0.5:
        notes = CH[chords[int(t // sec) % len(chords)]]
        if rng.random() < density:
            nt = notes[rng.integers(1, 4)] + 12 * (k % 4 == 0)
            m = int(0.7 * SR)
            tt = np.arange(m) / SR
            y = osc(midi(nt), m, MARIMBA) * np.exp(-tt / 0.22) * np.minimum(1, tt / 0.004)
            i = int(t * SR)
            j = min(n, i + m)
            out[i:j] += pan(y * rng.uniform(0.05, 0.09), rng.uniform(-0.5, 0.5))[: j - i]
        t += step
        k += 1
    return reverb(out, 1.6, 0.35) * level

def drums(d, bpm=100, level=1.0, shaker=False, sparse=False):
    n = int(d * SR)
    out = np.zeros((n, 2))
    beat = 60 / bpm
    pattern = [(0, 1.0), (1.5, 0.6), (2, 0.85), (3, 0.5), (3.5, 0.45)] if not sparse else [(0, 0.9), (2.5, 0.5)]
    bar = 0
    while bar * 4 * beat < d - 1:
        for pos, acc in pattern:
            t = (bar * 4 + pos) * beat
            m = int(0.45 * SR)
            tt = np.arange(m) / SR
            y = np.sin(2 * np.pi * np.cumsum(70 + 70 * np.exp(-tt / 0.03)) / SR) * np.exp(-tt / 0.18)
            y += filt(rng.standard_normal(m), "bandpass", [700, 3500]) * np.exp(-tt / 0.02) * 0.25
            i = int(t * SR)
            if i >= n:
                continue
            j = min(n, i + m)
            out[i:j] += pan(y * acc * 0.16, rng.uniform(-0.15, 0.15))[: j - i]
        if shaker:
            for s16 in range(16):
                t = (bar * 4 + s16 / 4) * beat
                m = int(0.05 * SR)
                y = filt(rng.standard_normal(m), "highpass", 5000) * np.exp(-np.arange(m) / (SR * 0.012))
                i = int(t * SR)
                if i + m < n:
                    out[i:i + m] += pan(y * (0.03 if s16 % 2 else 0.018), 0.35)
        bar += 1
    return reverb(out, 1.0, 0.2) * level

def danger(d):
    n = int(d * SR)
    t = np.arange(n) / SR
    drone = pad(["Dm", "Eb"], d, sec=4.0, bright=600, level=0.9)
    pulse = drums(d, bpm=70, level=0.7, sparse=True)
    trem = 0.75 + 0.25 * np.sin(2 * np.pi * 5 * t)
    return drone * trem[:, None] + pulse

# --- synthesised gamelan (slendro) ---
SLENDRO = [0, 240, 480, 720, 960]  # cents, ~equal 5-tone

def sl(deg, base=293.66):
    o, k = divmod(deg, 5)
    return base * 2 ** ((SLENDRO[k] + 1200 * o) / 1200)

def metallo(freq, d=1.4, bright=1.0, partials=((1, 1.0, 1.0), (2.76, 0.35, 0.45), (5.4, 0.12, 0.25))):
    n = int(d * SR)
    t = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t / (d * dd / 3)) for r, a, dd in partials)
    y *= np.minimum(1, t / 0.002)
    return y * bright

def gong(freq=62.0, d=7.0):
    n = int(d * SR)
    t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * freq * t) + 0.8 * np.sin(2 * np.pi * (freq + 0.9) * t) + 0.3 * np.sin(2 * np.pi * freq * 2.4 * t) * np.exp(-t / 1.5))
    return y * np.exp(-t / 2.6) * np.minimum(1, t / 0.02) * 0.6

def kendang(kind):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    if kind == "dha":
        y = np.sin(2 * np.pi * np.cumsum(95 + 60 * np.exp(-t / 0.04)) / SR) * np.exp(-t / 0.16)
    else:
        y = filt(rng.standard_normal(n), "bandpass", [700, 3500]) * np.exp(-t / 0.025) + 0.4 * np.sin(2 * np.pi * 320 * t) * np.exp(-t / 0.05)
    return y

BALUNGAN = [[2, 1, 2, 6, 2, 1, 2, 6], [3, 5, 6, 5, 3, 2, 1, 2], [6, 5, 3, 2, 5, 3, 2, 1], [1, 2, 3, 5, 6, 5, 3, 2]]

def gamelan(d, bpm=70, level=1.0, kendang_on=True, bonang=True, saron=True, gongs=True):
    n = int(d * SR)
    out = np.zeros((n, 2))
    beat = 60 / bpm
    nb = int(d / beat)
    pat = BALUNGAN[rng.integers(0, len(BALUNGAN))]
    for b in range(nb):
        t = b * beat
        i = int(t * SR)
        deg = pat[b % 8] - 1
        if saron:
            y = metallo(sl(deg + 5), 1.2) * 0.10
            j = min(n, i + len(y)); out[i:j] += pan(y, -0.25)[: j - i]
        if bonang:
            for h in (0, 0.5):
                ii = int((t + h * beat) * SR)
                y = metallo(sl(deg + 10 - (h > 0) * 2), 0.6, partials=((1, 1.0, 1.0), (1.5, 0.2, 0.4), (3.0, 0.1, 0.3))) * 0.05
                jj = min(n, ii + len(y))
                if ii < n:
                    out[ii:jj] += pan(y, 0.35)[: jj - ii]
        if gongs and b % 4 == 3:
            y = metallo(sl(deg), 2.5, partials=((1, 1.0, 1.0), (2.0, 0.2, 0.5))) * 0.08
            j = min(n, i + len(y)); out[i:j] += pan(y, 0.1)[: j - i]
        if gongs and b % 16 == 15:
            y = gong() * 0.35
            j = min(n, i + len(y)); out[i:j] += pan(y, 0)[: j - i]
        if kendang_on:
            for pos, kind in ((0, "dha"), (0.5, "tak"), (0.75, "tak")) if b % 2 == 0 else ((0, "tak"), (0.5, "dha")):
                ii = int((t + pos * beat) * SR)
                y = kendang(kind) * (0.16 if kind == "dha" else 0.07)
                jj = min(n, ii + len(y))
                if ii < n:
                    out[ii:jj] += pan(y, -0.1)[: jj - ii]
    return reverb(out, 1.8, 0.3) * level

MOODS = {
    "epic": lambda d: pad(["Dm", "Bb", "C", "Dm"], d, 6, 900, 0.8) + gamelan(d, 88, 0.9) + drums(d, 88, 0.5, sparse=True),
    "trade": lambda d: gamelan(d, 76, 0.9) + pad(["Dm", "C", "Bb", "C"], d, 8, 900, 0.5),
    "tension": lambda d: pad(["Dm", "Eb"], d, 5.0, 700, 0.9) + gamelan(d, 54, 0.5, kendang_on=False, bonang=False),
    "palace": lambda d: gamelan(d, 58, 0.85, kendang_on=False) + pad(["F", "C", "Dm", "Bb"], d, 9, 800, 0.45),
    "sad": lambda d: pad(["Dm", "Am", "Bb", "Am"], d, 9, 650, 0.8) + gamelan(d, 44, 0.45, kendang_on=False, bonang=False),
    "rise": lambda d: pad(["Bb", "F", "C", "Dm"], d, 7, 1100, 0.8) + gamelan(d, 72, 0.9),
    "war": lambda d: pad(["Dm", "Eb"], d, 4.0, 900, 0.8) + drums(d, 104, 0.9) + gamelan(d, 104, 0.6, bonang=False),
    "legacy": lambda d: pad(["Bb", "F", "C", "Dm", "Bb", "C", "F", "F"], d, 6.5, 1200, 0.9) + gamelan(d, 62, 0.8, kendang_on=False),
}

SECTIONS = [  # (from scene, to scene, mood)
    (1, 7, "epic"), (9, 12, "trade"), (13, 16, "tension"), (17, 23, "palace"), (24, 29, "sad"), (30, 38, "rise"),
    (39, 48, "palace"), (49, 53, "war"), (54, 62, "rise"), (63, 70, "war"), (71, 77, "tension"), (78, 86, "sad"),
    (87, 105, "legacy"),
]

def build_music():
    for a, b, mood in SECTIONS:
        t0 = max(0, START[a] - 0.8)
        t1 = min(DUR, END[b] + 0.8) if b != LAST else DUR
        x = MOODS[mood](t1 - t0)
        place("mus", fade(x, 1.6, 1.6 if b != LAST else 5.0), t0, 0)

# ------------------------------------------------------------------- main
def rms_db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)

def main(narr_path, out_path):
    narr = load(narr_path)
    nar = np.zeros((N, 2), np.float32)
    nar[: min(N, len(narr))] = narr[:N]
    print("building beds"); build_beds()
    print("building sfx"); build_sfx()
    print("building music"); build_music()

    # loudness targets (RMS while active)
    act = np.abs(nar[:, 0]) > 1e-3
    nar_rms = 20 * np.log10(np.sqrt(np.mean(nar[act] ** 2)) + 1e-12)
    mus_rms = rms_db(MIX["mus"]); amb_rms = rms_db(MIX["amb"])
    print(f"narr {nar_rms:.1f} dB, music {mus_rms:.1f} dB, amb {amb_rms:.1f} dB")
    mus = MIX["mus"] * db((nar_rms - 15) - mus_rms)
    amb = MIX["amb"] * db((nar_rms - 19) - amb_rms)
    sfx = MIX["sfx"] * db(nar_rms + 9 - 20 * np.log10(np.abs(MIX["sfx"]).max() + 1e-9))

    # side-chain ducking from the narration
    hop = 480
    e = np.sqrt(np.mean(nar[: N // hop * hop, 0].reshape(-1, hop) ** 2, axis=1))
    e = e / (np.percentile(e[e > 1e-4], 70) + 1e-9)
    sm = np.zeros_like(e)
    for k in range(1, len(e)):
        c = 0.5 if e[k] > sm[k - 1] else 0.04
        sm[k] = sm[k - 1] + c * (e[k] - sm[k - 1])
    duck = 1 - 0.5 * np.clip(sm, 0, 1)
    duck = np.repeat(duck, hop)
    duck = np.pad(duck, (0, N - len(duck)), constant_values=1)[:, None]
    mix = nar + mus * duck + amb * (0.6 + 0.4 * duck) + sfx * (0.75 + 0.25 * duck)
    mix = np.tanh(mix * 0.95) / 0.95  # gentle safety saturation
    print("peak", np.abs(mix).max())
    tmp = out_path + ".raw.f32"
    mix.astype(np.float32).tofile(tmp)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", tmp,
                    "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", str(SR), "-c:a", "pcm_s16le", out_path], check=True)
    os.remove(tmp)
    # stems (for re-mixing in an editor)
    stem_dir = os.path.join(os.path.dirname(out_path), "stems")
    os.makedirs(stem_dir, exist_ok=True)
    for name, x in (("musik", mus), ("ambience", amb), ("sfx", sfx)):
        p = os.path.join(stem_dir, f"{name}.raw")
        (x * 0.5).astype(np.float32).tofile(p)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", p,
                        "-c:a", "pcm_s16le", os.path.join(stem_dir, f"{name}.wav")], check=True)
        os.remove(p)
    print("done", out_path)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
