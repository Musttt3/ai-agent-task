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

AMB = {"birds": lambda d: amb_birds(d, 0.7) + amb_wind(d, 0.5),
       "birdsLight": lambda d: amb_birds(d, 0.35, 0.7) + amb_wind(d, 0.45),
       "wind": lambda d: amb_wind(d, 1.0),
       "windStrong": lambda d: amb_wind(d, 1.8),
       "dry": lambda d: amb_wind(d, 1.3) + amb_birds(d, 0.08, 0.5),
       "river": lambda d: amb_river(d) + amb_birds(d, 0.4, 0.8) + amb_wind(d, 0.3),
       "waves": amb_waves,
       "night": lambda d: amb_crickets(d) + amb_wind(d, 0.3),
       "dusk": lambda d: amb_crickets(d, 0.5) + amb_birds(d, 0.25, 0.6) + amb_wind(d, 0.4),
       "city": amb_city,
       "fire": amb_fire,
       "sizzle": amb_sizzle,
       "vortex": amb_vortex,
       "room": amb_room}

BEDS = [  # (first scene, last scene, kind, gain dB)
    (1, 1, "wind", 0), (2, 12, "birds", 0), (13, 13, "vortex", 0), (14, 14, "room", -6), (15, 15, "windStrong", -4),
    (16, 19, "waves", -1), (20, 22, "wind", 0), (23, 23, "river", 2), (24, 33, "birdsLight", -1),
    (34, 35, "birds", -1), (36, 37, "river", 0), (38, 44, "birds", 0), (45, 45, "river", 1), (46, 46, "wind", -4),
    (47, 47, "river", 0), (48, 52, "birdsLight", -2), (53, 55, "river", 1), (56, 58, "birdsLight", -1),
    (59, 59, "river", -2), (60, 61, "birdsLight", -2), (62, 62, "room", 0), (63, 65, "birdsLight", -2),
    (66, 66, "wind", -6), (67, 67, "river", -2), (68, 75, "birdsLight", -2), (76, 76, "sizzle", -2),
    (77, 77, "fire", 0), (78, 79, "wind", -3), (80, 80, "fire", -4), (81, 82, "wind", -2), (83, 87, "dry", -3),
    (88, 90, "birdsLight", -1), (91, 98, "birds", -2), (99, 99, "dusk", 0), (100, 105, "night", 0),
    (106, 108, "birds", 0), (109, 109, "birdsLight", -6), (110, 110, "room", -2), (111, 111, "river", -6),
    (112, 112, "room", -2), (113, 113, "wind", -4), (114, 114, "room", -2), (115, 116, "wind", -6),
    (117, 117, "dusk", -4), (118, 118, "room", -2), (119, 119, "city", 0), (120, 120, "river", -5),
    (121, 122, "city", -5), (123, 123, "birdsLight", -6), (124, 128, "birdsLight", -2),
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
    # overlays
    for o in plan["overlays"]:
        t, k = o["start"], o["kind"]
        if k in ("tag", "label", "big"):
            cue(t, "pop", -14)
        elif k == "chapter":
            cue(t, "boomSoft", -10); cue(t + 0.05, "fwhoosh", -16)
        elif k == "stamp":
            cue(t + 0.12, "stamp", -7)
        elif k == "year":
            cue(t, "boom", -9)
        elif k == "counter":
            for j in range(26):
                cue(t + 0.15 * j * (1 - j / 60), "tick", -16)
        elif k == "compare":
            cue(t + 0.4, "whoosh", -14); cue(t + 2.4, "pop", -12); cue(t + 3.0, "pop", -12)
        elif k == "title":
            cue(t - 0.2, "boom", -8); cue(t + 1.0, "twinkle", -16)
        elif k == "outro":
            cue(t + 0.2, "chime", -10)
    s = START
    # story moments
    cue(s[7] + 0.2, "stepHeavy", -6); cue(s[7] + 1.1, "stepHeavy", -7); cue(s[7] + 0.2, "boomSoft", -12)
    cue(s[8] + 0.0, "boomSoft", -11)
    cue(s[12] + 0.3, "twinkle", -18)
    cue(s[13] + 0.2, "riser", -9); cue(s[14] - 0.3, "boom", -8)
    cue(s[15] + 0.2, "whooshLong", -16)
    cue(s[16] + 0.4, "whooshDown", -14)
    cue(s[18] + 0.3, "boomSoft", -12)
    for j in range(6):
        cue(s[21] + 0.3 + j * 0.55, "step", -18)
    for j in range(4):
        cue(s[23] + 0.4 + j * 0.9, "splash", -16)
    cue(s[24] + 0.1, "boom", -10)
    for j in range(5):
        cue(s[27] + 0.2 + j * 0.5, "step", -17)
    cue(s[31] + 0.6, "ding", -18)
    cue(s[35] + 0.3, "page", -10)
    cue(s[45] + 0.4, "splash", -14); cue(s[45] + 1.6, "splash", -16)
    cue(s[46] + 1.2, "rustle", -14)
    cue(s[50] + 0.2, "stepHeavy", -6); cue(s[50] + 1.4, "stepHeavy", -8)
    cue(s[51] + 0.1, "heartbeat", -8); cue(s[51] + 0.8, "snort", -9)
    for j in range(7):
        cue(s[52] + j * 0.42, "stepHeavy", -6)
    cue(s[52] + 0.1, "boom", -12)
    cue(s[53] + 0.4, "whooshDown", -18)
    cue(s[54] + 1.0, "splash", -14); cue(s[54] + 1.0, "boomSoft", -16)
    cue(s[56] + 0.5, "twinkle", -15)
    cue(s[57] + 0.4, "ding", -20)
    for a in (0.9, 2.3, 3.7):
        cue(s[60] + a, "clack", -6)
        cue(s[60] + a + 0.08, "clack", -14)
    for a in (0.6, 1.6, 2.6, 3.6):
        cue(s[61] + a, "scrape", -12)
    cue(s[63] + 2.8, "scrape", -12)
    cue(s[66] + 0.3, "whoosh", -18)
    cue(s[72] + 0.3, "snort", -8); cue(s[72] + 0.8, "stepHeavy", -9); cue(s[72] + 1.3, "stepHeavy", -10)
    cue(s[73] + 0.1, "thud", -5); cue(s[73] + 0.7, "twinkle", -17)
    cue(s[82] + 0.6, "thunder", -6)
    for j in range(8):
        cue(s[89] + 0.3 + j * 0.45, "step", -20)
    cue(s[93] + 2.0, "splash", -18)
    cue(s[101] + 1.0, "rustle", -11); cue(s[101] + 3.0, "rustle", -13)
    cue(s[104] + 0.4, "stamp", -10)
    cue(s[110] + 0.3, "boomSoft", -12)
    cue(s[114] + 0.2, "boom", -10)
    cue(s[117] + 0.2, "whooshLong", -18)
    cue(s[123] + 0.4, "whooshLong", -18)
    cue(s[127] + 0.1, "thunder", -9); cue(s[127] + 1.2, "splash", -16)

# ------------------------------------------------------------------ music
def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)

CH = {"Dm": (50, 57, 62, 65), "Bb": (46, 53, 58, 62), "F": (48, 53, 57, 60), "C": (48, 52, 55, 60),
      "Gm": (43, 50, 55, 58), "Am": (45, 52, 57, 60), "Eb": (46, 51, 55, 58), "Dsus": (50, 57, 62, 64)}

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

MOODS = {
    "intro": lambda d: pad(["Dm", "Bb", "F", "C"], d, 8, 900, 0.9),
    "introDrums": lambda d: pad(["Dm", "Bb", "F", "C"], d, 8, 1000) + drums(d, 96, 0.55, sparse=True),
    "adventure": lambda d: pad(["Dm", "Bb", "F", "C"], d, 7.5, 1100) + plucks(["Dm", "Bb", "F", "C"], d, 100, 7.5, 0.55)
                           + drums(d, 100, 0.8),
    "gentle": lambda d: pad(["F", "C", "Dm", "Bb"], d, 8, 1300) + plucks(["F", "C", "Dm", "Bb"], d, 88, 8, 0.4, 0.9),
    "danger": danger,
    "tools": lambda d: pad(["Dm", "Gm", "Bb", "C"], d, 7, 1100, 0.9) + plucks(["Dm", "Gm", "Bb", "C"], d, 104, 7, 0.6)
                       + drums(d, 104, 0.6),
    "mystery": lambda d: pad(["Dm", "Am", "Bb", "Dsus"], d, 9, 800, 0.9),
    "dry": lambda d: pad(["Dm", "Am"], d, 9, 700, 0.8) + drums(d, 80, 0.5, sparse=True),
    "night": lambda d: pad(["Dm", "Am", "Bb", "Am"], d, 10, 600, 0.6),
    "discovery": lambda d: pad(["Dm", "Bb", "F", "C"], d, 8, 1000, 0.9) + plucks(["Dm", "Bb", "F", "C"], d, 92, 8, 0.35, 0.8),
    "modern": lambda d: pad(["F", "C", "Dm", "Bb"], d, 7, 1500) + drums(d, 100, 0.45, shaker=True),
    "ending": lambda d: pad(["Bb", "F", "C", "Dm", "Bb", "F", "C", "F"], d, 6.5, 1300, 1.1)
                        + plucks(["Bb", "F", "C", "Dm", "Bb", "F", "C", "F"], d, 76, 6.5, 0.45, 0.9),
}

SECTIONS = [  # (from scene, to scene, mood)
    (1, 4, "intro"), (5, 12, "introDrums"), (14, 33, "adventure"), (34, 46, "gentle"), (47, 56, "danger"),
    (57, 67, "tools"), (68, 80, "mystery"), (81, 90, "dry"), (91, 98, "gentle"), (99, 105, "night"),
    (106, 108, "gentle"), (109, 118, "discovery"), (119, 123, "modern"), (124, 128, "ending"),
]

def build_music():
    for a, b, mood in SECTIONS:
        t0 = max(0, START[a] - 0.8)
        t1 = min(DUR, END[b] + 0.8) if b != 128 else DUR
        x = MOODS[mood](t1 - t0)
        place("mus", fade(x, 1.6, 1.6 if b != 128 else 5.0), t0, 0)

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
