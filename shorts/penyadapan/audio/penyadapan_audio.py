# Soundtrack for "Dugaan Penyadapan Presiden" (TikTok 9:16, 68 s): narration chain + synthesized tension score +
# procedural SFX placed from the same plan.json the Remotion composition reads, music ducked under the voice,
# mastered to -14 LUFS integrated / -1 dBTP. Own numpy/scipy synthesis only (no sample libraries).
#
#   python penyadapan_audio.py VOICE.mp3 OUT.wav
import sys, os, json, subprocess
import numpy as np
from scipy import signal
from scipy.ndimage import maximum_filter1d

HERE = os.path.dirname(os.path.abspath(__file__))
STUDIO = os.path.abspath(os.path.join(HERE, "..", "..", "studio"))
sys.path.insert(0, os.path.join(STUDIO, "audio"))
from dsp import (SR, TAU, ns, tt, dbg, rng, lp, hp, bp, peq, shelf, reson, colored, ramp, fades, curve, shape, modal,
                 pan, st, place, widen, make_ir, convolve_st, integrated, momentary_max, true_peak, write_wav)
from sfx_gen import whoosh
from instruments import glock

PLAN = json.load(open(os.path.join(STUDIO, "src", "videos", "penyadapan", "plan.json")))
VO = PLAN["vo"]
END = PLAN["end"] + VO
N = ns(END)
T = lambda t: t + VO                     # narration seconds -> video seconds
R = rng(2026)


def norm_peak(x, db=0.0):
    return x / (np.max(np.abs(x)) + 1e-12) * dbg(db)


def env_exp(n, tau):
    return np.exp(-np.arange(n) / SR / tau)


# ================================================================ SFX generators (mono, peak-normalized)
def impact(big=1.0):
    d = 1.4
    t = tt(d)
    f = 30 + 48 * np.exp(-t / 0.07)
    sub = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t / (0.45 * big))
    thump = np.sin(TAU * 105 * t) * np.exp(-t / 0.09)
    nz = lp(colored(len(t), R, 1.0), 2600) * np.exp(-t / 0.05)
    y = 1.0 * sub + 0.45 * thump + 0.5 * nz
    return norm_peak(fades(np.tanh(1.6 * y), 0.0005, 0.2))


def glitch(dur=0.24):
    n = ns(dur)
    y = np.zeros(n)
    k = 0
    while k < n:
        seg = int(SR * R.uniform(0.006, 0.03))
        kind = R.integers(0, 4)
        t = np.arange(seg) / SR
        if kind == 0:
            s = signal.square(TAU * R.uniform(180, 2600) * t) * 0.6
        elif kind == 1:
            s = R.standard_normal(seg)
            hold = R.integers(4, 24)
            s = np.repeat(s[::hold], hold)[:seg]
        elif kind == 2:
            s = np.sin(TAU * np.cumsum(np.linspace(R.uniform(300, 900), R.uniform(2000, 6000), seg)) / SR)
        else:
            s = np.zeros(seg)
        y[k:k + seg] += s[: max(0, min(seg, n - k))]
        k += seg
    y = np.round(y * 6) / 6                       # bit-crush
    y = hp(y, 150) * ramp(n)[::-1] ** 0.3
    return norm_peak(fades(y, 0.001, 0.02))


def wh(dur=0.4, peak=0.3, lo=300, hi=2600, width=0.85, tail=0.18):
    return norm_peak(whoosh(dur, R, peak=peak, f_lo=lo, f_hi=hi, width=width, tail=tail, air=0.2))


def shutter():
    y = np.zeros(ns(0.16))
    for tm, a in [(0.0, 1.0), (0.055, 0.7)]:
        c = bp(R.standard_normal(ns(0.02)), 1800, 7000) * env_exp(ns(0.02), 0.003)
        c += 0.4 * np.sin(TAU * 3100 * tt(0.02)) * env_exp(ns(0.02), 0.004)
        i = ns(tm)
        y[i:i + len(c)] += a * c
    return norm_peak(y)


def click(f=2400):
    n = ns(0.03)
    c = bp(R.standard_normal(n), f * 0.6, min(f * 2.2, 15000)) * env_exp(n, 0.0035)
    c += 0.35 * np.sin(TAU * 190 * tt(0.03)) * env_exp(n, 0.008)
    return norm_peak(c)


def beep(f=1800, d=0.07, harm=0.15):
    t = tt(d)
    y = (np.sin(TAU * f * t) + harm * np.sin(TAU * 2 * f * t)) * np.minimum(1, t / 0.003) * np.minimum(1, (d - t) / 0.01)
    return norm_peak(y)


def lock_beeps(lock=False):
    seq = [(0.0, 1900, 0.055), (0.09, 1900, 0.055)] + ([(0.2, 2500, 0.2)] if lock else [])
    y = np.zeros(ns(0.5))
    for tm, f, d in seq:
        b = beep(f, d)
        y[ns(tm):ns(tm) + len(b)] += b
    return norm_peak(y)


def buzz():
    t = tt(0.3)
    gate = ((t < 0.11) | ((t > 0.15) & (t < 0.27))).astype(float)
    y = (signal.square(TAU * 146 * t) + 0.6 * signal.sawtooth(TAU * 293 * t)) * gate
    y = lp(y, 2200) * np.minimum(1, (0.3 - t) / 0.02)
    return norm_peak(fades(y, 0.002, 0.01))


def ding(f=1318.5):
    y = np.asarray(glock(f, 0.75, R, dur=1.2), float)
    if y.ndim > 1:
        y = y.mean(axis=0)
    return norm_peak(y)


def stamp():
    t = tt(0.5)
    y = np.sin(TAU * (70 + 50 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.11)
    y += 0.7 * bp(R.standard_normal(len(t)), 250, 3500) * np.exp(-t / 0.035)
    return norm_peak(np.tanh(2 * y))


def dial_return(pulses=6):
    d = pulses * 0.1 + 0.15
    n = ns(d)
    y = 0.08 * bp(R.standard_normal(n), 700, 2200) * np.minimum(1, np.arange(n) / ns(0.03))
    for k in range(pulses):
        c = click(1600) * 0.9
        i = ns(0.04 + k * 0.1)
        y[i:i + len(c)] += c[: n - i]
    return norm_peak(fades(y, 0.005, 0.03))


def radar_ping():
    t = tt(1.6)
    f = 1150 * (1 - 0.03 * t)
    y = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t / 0.42) * np.minimum(1, t / 0.004)
    return norm_peak(y)


def line_static(d):
    n = ns(d)
    y = 0.35 * bp(colored(n, R, 0.3), 350, 3400)
    crack = np.zeros(n)
    for _ in range(int(d * 40)):
        i = R.integers(0, n - 300)
        crack[i:i + 200] += R.standard_normal(200) * np.exp(-np.arange(200) / 30) * R.uniform(0.5, 1.5)
    y += hp(crack, 1500)
    y += 0.12 * np.sin(TAU * 50 * np.arange(n) / SR)
    return norm_peak(fades(y, 0.08, 0.15))


def rewind(d=1.1):
    t = tt(d)
    f = 900 + 1400 * (t / d) ** 1.5 + 120 * np.sin(TAU * 31 * t)
    y = 0.5 * signal.sawtooth(TAU * np.cumsum(f) / SR) + 0.6 * bp(R.standard_normal(len(t)), 1500, 6000)
    y = lp(y, 5000) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.7
    return norm_peak(fades(y, 0.02, 0.06))


def glass_crack():
    n = ns(0.9)
    y = np.zeros(n)
    for _ in range(60):
        i = R.integers(0, ns(0.35))
        f = R.uniform(2200, 9500)
        m = modal(0.12, [(f, 1, R.uniform(0.006, 0.04))], R)
        y[i:i + len(m)] += m[: n - i] * R.uniform(0.3, 1.0)
    y += 1.4 * hp(R.standard_normal(n), 2500) * env_exp(n, 0.03)
    y += 0.8 * np.sin(TAU * 80 * tt(0.9)) * env_exp(n, 0.12)
    return norm_peak(np.tanh(1.3 * y))


def riser(d):
    t = tt(d)
    nz = colored(len(t), R, 0.5)
    fc = 250 * (24 ** (t / d))
    y = shape(nz, lambda TT, FF: np.exp(-0.5 * (np.log2(np.maximum(FF[:, None], 20) / np.interp(TT, t, fc)[None, :]) / 0.7) ** 2))
    tone = np.sin(TAU * np.cumsum(180 * (5 ** (t / d))) / SR)
    y = (y + 0.35 * tone) * (t / d) ** 2.2
    return norm_peak(fades(y, 0.05, 0.004))


def reverse_swell(d=0.6):
    n = ns(d)
    y = lp(colored(n, R, 0.8), 3000) * env_exp(n, d / 4)
    y = y[::-1] * ramp(n) ** 0.5
    return norm_peak(fades(y, 0.02, 0.003))


def heartbeat():
    y = np.zeros(ns(0.7))
    for tm, a in [(0.0, 1.0), (0.24, 0.7)]:
        t = tt(0.3)
        k = np.sin(TAU * (48 + 40 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.07)
        y[ns(tm):ns(tm) + len(k)] += a * k
    return norm_peak(lp(y, 400))


def pop():
    t = tt(0.09)
    y = np.sin(TAU * np.cumsum(260 + 500 * np.exp(-t / 0.012)) / SR) * np.exp(-t / 0.03)
    c = click(3000)
    y[: len(c)] += 0.2 * c
    return norm_peak(y)


def low_hit():
    t = tt(0.9)
    y = np.sin(TAU * (62 + 30 * np.exp(-t / 0.04)) * t) * np.exp(-t / 0.28)
    y += 0.25 * lp(R.standard_normal(len(t)), 900) * np.exp(-t / 0.06)
    return norm_peak(y)


# ================================================================ SFX placement (from plan.json)
sfx = np.zeros((2, N))
verb_send = np.zeros((2, N))


def put(x, t_video, db, p=0.0, verb=0.0):
    y = pan(x, p) if np.ndim(x) == 1 else x
    place(sfx, y, t_video, dbg(db))
    if verb:
        place(verb_send, y, t_video, dbg(db) * verb)


def fr_t(frames):
    return frames / 30.0


shots = PLAN["shots"]
for i, s in enumerate(shots):
    tv = max(0.0, T(s["from"]))
    tin = s["tin"]
    if tin == "glitch":
        put(glitch(0.26), tv - 0.1, -17, R.uniform(-0.3, 0.3))
    elif tin == "zoom":
        put(wh(0.42, 0.38, 250, 3200), tv - 0.38, -15, 0, 0.2)
        put(impact(0.5), tv, -23, 0, 0.3)
    elif tin == "whipLeft":
        w = wh(0.34, 0.14, 500, 4200, 0.7, 0.12)
        g = curve(len(w), [(0, 0.8), (0.34, -0.8)])
        put(np.stack([w * np.sqrt((1 - g) / 2), w * np.sqrt((1 + g) / 2)]) * np.sqrt(2), tv - 0.14, -15)
    elif tin == "whipUp":
        put(wh(0.34, 0.14, 700, 5200, 0.7, 0.12), tv - 0.14, -15)
    elif tin == "flash":
        put(shutter(), tv - 0.02, -17, 0.15)
        put(impact(0.4), tv, -24, 0, 0.3)
    elif tin == "dip":
        put(reverse_swell(0.55), tv - 0.55, -21)
        put(low_hit(), tv, -18, 0, 0.3)

# hook
put(glitch(0.3), 0.0, -15)
put(impact(1.3), T(0.0) - 0.04, -15, 0, 0.35)
put(glitch(0.18), T(0.64) - 0.03, -18)
put(impact(0.8), T(0.64), -19, 0, 0.3)

for g in PLAN["graphics"]:
    ty = g["type"]
    if ty == "headline":
        for k, a in enumerate(g.get("at", [])):
            if g["t0"] == 0.0:
                continue
            put(pop(), T(a), -27 if k else -24, 0, 0.15)
            if g.get("glitch") and k == 0:
                put(glitch(0.16), T(a) - 0.02, -20)
    elif ty == "tag":
        for k in range(10):
            put(click(2600 + 300 * (k % 3)), T(g["t0"]) + k * 0.04, -30, R.uniform(-0.2, 0.2))
    elif ty == "date":
        put(stamp(), T(g["t0"]) + 0.12, -16, 0, 0.25)
        for k in range(13):
            put(click(2000 + 400 * (k % 2)), T(g["t0"]) + 0.2 + k * 0.036, -26, R.uniform(-0.25, 0.25))
    elif ty == "flash":
        if g["t"] > 60:
            put(glass_crack(), T(g["t"]) - 0.01, -14, 0, 0.4)
            put(impact(1.0), T(g["t"]), -16, 0, 0.4)
        else:
            put(shutter(), T(g["t"]) - 0.03, -18, R.uniform(-0.5, 0.5), 0.15)
    elif ty == "counter":
        for k in range(3):
            put(beep(1100 + 220 * k, 0.05), T(g["t0"]) + fr_t(4 * k), -25)
        put(impact(0.7), T(g["t0"]) + fr_t(8), -16, 0, 0.3)
    elif ty == "stamp":
        put(stamp(), T(g["t0"]) + fr_t(5), -16, 0, 0.35)
        put(impact(0.6), T(g["t0"]) + fr_t(5), -22)
    elif ty == "lowerthird":
        put(wh(0.32, 0.12, 400, 2600, 0.8, 0.12), T(g["t0"]) - 0.06, -22, -0.4)
    elif ty == "typing":
        f0 = T(g["t0"])
        for li in range(len(g["lines"])):
            s0 = f0 + fr_t(6 + li * 13)
            for k in range(7):
                put(click(2200 + R.uniform(-400, 600)), s0 + k * 0.05 + R.uniform(0, 0.012), -25, R.uniform(-0.3, 0.3))
            put(beep(2600 if li < 2 else 880, 0.06), s0 + fr_t(11), -27 if li < 2 else -23)
    elif ty == "checklist":
        put(pop(), T(g["t0"]), -24)
        for it in g["items"]:
            if it["mark"] == "x":
                put(buzz(), T(it["t"]), -20, 0, 0.15)
                put(stamp(), T(it["t"]), -20)
            else:
                put(ding(1318.5 if it["t"] < 40 else 1568.0 if it["t"] < 41 else 1760.0), T(it["t"]), -21, 0, 0.3)
    elif ty == "question":
        put(wh(0.3, 0.1, 600, 3600, 0.8, 0.1), T(g["t0"]) - 0.05, -22)
        put(low_hit(), T(g["t0"]), -22, 0, 0.35)
        put(beep(1500, 0.05), T(g["t0"]) + 0.05, -28)
    elif ty == "progress":
        for k in range(7):
            put(beep(2000 if k % 2 else 1600, 0.035), T(g["t0"]) + 0.15 + k * 0.2, -31)
    elif ty == "neq":
        put(wh(0.3, 0.1, 300, 2400), T(g["t0"]) - 0.05, -23)
        put(impact(0.8), T(g["at"]), -15, 0, 0.35)
    elif ty == "loop":
        put(rewind(1.2), T(g["t0"]), -21)
        put(wh(0.18, 0.06, 1500, 7000, 0.6, 0.06), T(g["strike"]) - 0.04, -16)
        put(impact(0.8), T(g["strike"]), -15, 0, 0.3)
    elif ty == "waveform":
        put(line_static(g["t1"] - g["t0"]), T(g["t0"]), -30)
    elif ty == "endcard":
        put(pop(), T(g["t0"]) + 0.15, -22)
        put(ding(1174.66), T(g["t0"]) + 0.3, -24, -0.2, 0.4)
        put(ding(1760.0), T(g["t0"]) + 0.55, -27, 0.2, 0.4)

for s in shots:
    for m in s.get("marks", []):
        if m["type"] == "reticle":
            put(lock_beeps(bool(m.get("lock"))), T(m["t0"]), -25, (m["x"] - 0.5) * 1.2)
        elif m["type"] == "alert":
            for k in range(4):
                put(beep(990, 0.12, 0.4), T(m["t0"]) + k * 0.6, -27)

sh = {s["id"]: s for s in shots}
put(line_static(2.0), T(sh["listen"]["from"]), -31)
put(dial_return(6), T(sh["dial"]["from"]) + 0.08, -19, 0.2)
put(dial_return(3), T(sh["dial"]["from"]) + 0.85, -21, 0.2)
for k in range(2):
    put(radar_ping(), T(sh["radar"]["from"]) + 0.15 + k * 2.0, -20, 0, 0.5)
put(riser(sh["radar"]["to"] - sh["radar"]["from"] - 0.2), T(sh["radar"]["from"]) + 0.2, -19)
for k, t in enumerate([63.6, 64.42, 65.24]):
    put(heartbeat(), T(t), -21 + k * 1.0)

# ================================================================ score (D minor, 100 bpm)
BPM = 100
BEAT = 60 / BPM
music = np.zeros((2, N))


def m2f(m):
    return 440.0 * 2 ** ((m - 69) / 12)


CHORDS = [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]]   # Dm  Bb  Gm  A
ROOTS = [38, 34, 31, 33]
BAR = 4 * BEAT


def q(t):                                  # quantize a section boundary to the beat grid
    return round(t / BEAT) * BEAT


S = dict(pulse0=q(T(2.1)), ticks0=q(T(4.4)), C0=q(T(26.45)), D0=q(T(35.4)), E0=q(T(48.2)), arp2=q(T(52.3)),
         F0=q(T(60.7)), G0=T(63.45), H0=T(65.95))

# drone (whole piece) + pad chords
t_all = np.arange(N) / SR
drone = 0.5 * np.sin(TAU * m2f(26) * t_all) + 0.35 * np.sin(TAU * m2f(38) * t_all + 0.3 * np.sin(TAU * 0.07 * t_all))
drone += 0.12 * lp(colored(N, R, 1.5), 180)
dr_lvl = curve(N, [(0, 0.0), (0.4, 0.8), (S["G0"], 0.9), (S["H0"], 1.0), (END - 0.3, 0.0), (END, 0.0)])
music += st(drone * dr_lvl * 0.5)

pad = np.zeros(N)
nb = int(END / BAR) + 1
for b in range(nb):
    t0 = b * BAR
    ch = CHORDS[b % 4]
    if t0 >= S["H0"]:
        break
    d = BAR + 0.9
    t = tt(d)
    v = np.zeros(len(t))
    for m in ch:
        for det in (-0.07, 0.0, 0.07):
            v += signal.sawtooth(TAU * m2f(m + det) * t + R.uniform(0, TAU))
    mo = 0.5 + 0.5 * np.sin(TAU * 0.11 * (t + t0))          # slow filter drift: blend a darker and a brighter copy
    v = (1 - mo) * lp(v, 480) + mo * lp(v, 1050)
    v *= np.minimum(1, t / 0.7) * np.minimum(1, np.maximum(0, d - t) / 0.9)
    i = ns(t0)
    pad[i:i + len(v)] += v[: N - i] * 0.06
pad_lvl = curve(N, [(0, 0.35), (S["ticks0"], 0.6), (S["C0"], 0.75), (S["D0"], 0.95), (S["E0"], 0.7), (S["G0"], 0.3), (S["H0"], 0.0)])
music += widen(pad * pad_lvl, SR, 14, 0.9)

# final resolution chord (end card)
t = tt(END - S["H0"] + 0.2)
res = sum(np.sin(TAU * m2f(m) * t) for m in [50, 57, 62, 64, 65]) * np.minimum(1, t / 0.3) * np.exp(-t / 1.6)
place(music, widen(lp(res, 2500) * 0.16, SR, 12, 0.8), S["H0"])

# 8th-note bass pulse
pulse_lvl_pts = [(0, 0), (S["pulse0"], 0.75), (S["ticks0"], 1.0), (S["D0"], 0.55), (S["E0"], 1.0), (S["F0"], 1.1), (S["G0"], 0.0)]
k = 0
while True:
    t0 = S["pulse0"] + k * BEAT / 2
    if t0 >= S["G0"]:
        break
    lvl = float(np.interp(t0, [p[0] for p in pulse_lvl_pts], [p[1] for p in pulse_lvl_pts]))
    root = ROOTS[int(t0 // BAR) % 4]
    d = 0.28
    tn = tt(d)
    cut = 380 + (900 if t0 >= S["F0"] else 250) * (k % 4 == 0)
    note = lp(signal.sawtooth(TAU * m2f(root + 12) * tn), cut) + 0.8 * np.sin(TAU * m2f(root) * tn)
    note *= np.exp(-tn / 0.11) * np.minimum(1, tn / 0.004) * (1.15 if k % 4 == 0 else 0.85)
    place(music, st(note * 0.32 * lvl), t0)
    k += 1

# ticking 16ths (surveillance clock) + kick
k = 0
while True:
    t0 = S["ticks0"] + k * BEAT / 4
    if t0 >= S["G0"]:
        break
    sect_d = S["D0"] <= t0 < S["E0"]
    a = (0.55 if k % 4 == 0 else 0.3 if k % 2 == 0 else 0.18) * (0.5 if sect_d else 1.0)
    tk = hp(R.standard_normal(ns(0.03)), 7000) * env_exp(ns(0.03), 0.012 if k % 4 else 0.02)
    place(music, pan(tk * a * 0.22, 0.35 if k % 2 else -0.35), t0)
    k += 1


def kick():
    t = tt(0.45)
    y = np.sin(TAU * np.cumsum(45 + 90 * np.exp(-t / 0.035)) / SR) * np.exp(-t / 0.16)
    return y + 0.15 * hp(R.standard_normal(len(t)), 2000) * np.exp(-t / 0.004)


KICK = kick()
for t0 in np.arange(S["C0"], S["D0"] - 1e-6, BEAT):
    place(music, st(KICK * 0.42), t0)
for t0 in np.arange(S["E0"], S["G0"] - 1e-6, BEAT * 2):
    place(music, st(KICK * 0.38), t0)
for t0 in np.arange(S["F0"], S["G0"] - 1e-6, BEAT):
    place(music, st(KICK * 0.3), t0)

# pluck arpeggio (questions + build)
ARP = [0, 7, 12, 3, 7, 12, 3, 10]
for (a0, a1) in [(S["C0"], S["D0"]), (S["arp2"], S["G0"])]:
    k = 0
    while a0 + k * BEAT / 2 < a1:
        t0 = a0 + k * BEAT / 2
        root = CHORDS[int(t0 // BAR) % 4][0] + 12
        f = m2f(root + ARP[k % 8])
        tn = tt(0.4)
        pl = (np.sin(TAU * f * tn) + 0.3 * signal.sawtooth(TAU * f * tn)) * np.exp(-tn / 0.14) * np.minimum(1, tn / 0.002)
        place(music, pan(lp(pl, 3200) * 0.07, 0.5 * np.sin(k * 0.9)), t0)
        k += 1

# ================================================================ narration
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
v = np.frombuffer(pcm, np.float32).astype(np.float64)
v = hp(v, 75, 2)
v = peq(v, 240, -1.5, 1.0)
v = peq(v, 3400, 2.0, 0.8)
v = shelf(v, 9500, 1.5, "high")


def compress(x, thr_db=-22.0, ratio=3.0, tau=0.012, rel=0.06):
    a = np.exp(-1 / (tau * SR))
    lvl = 10 * np.log10(signal.lfilter([1 - a], [1, -a], x ** 2) + 1e-12)
    gdb = np.minimum(0, (thr_db - lvl) * (1 - 1 / ratio))
    b = np.exp(-1 / (rel * SR))
    gdb = signal.lfilter([1 - b], [1, -b], gdb)
    return x * dbg(gdb)


v = compress(v)
v = v * dbg(-16.0 - integrated(v))
voice = np.zeros((2, N))
place(voice, st(v), VO)

# ducking: music dips ~6 dB under the voice (fast attack, slow release, 100 Hz control rate)
ctrl = 100
vl = np.abs(np.pad(v, (ns(VO), 0)))[:N]
blk = SR // ctrl
m = len(vl) // blk
lv = 20 * np.log10(np.sqrt(np.mean(vl[: m * blk].reshape(m, blk) ** 2, axis=1)) + 1e-9)
target = np.where(lv > -42, -6.0, 0.0)
g = np.zeros(m)
cur = 0.0
for i in range(m):
    c = 0.35 if target[i] < cur else 0.03
    cur += (target[i] - cur) * c
    g[i] = cur
duck = dbg(np.interp(np.arange(N) / SR, np.arange(m) / ctrl, g))

# ================================================================ mix + master
ir = make_ir(1.4, 11, hf=1.4)
verb = convolve_st(verb_send, ir) * 0.5
music = music * dbg(-24.5 - integrated(music))
sfx_duck = dbg((1 - (duck - dbg(-6.0)) / (1 - dbg(-6.0))) * -2.5)   # SFX dip 2.5 dB while the narrator talks
sfx, verb = sfx * sfx_duck, verb * sfx_duck
mix = voice + music * duck + sfx + verb

mix = hp(mix, 25, 2)
mix *= dbg(-14.0 - integrated(mix))
# look-ahead peak limiter (ceiling -1.3 dBFS sample peak; true peak checked after)
ceil = dbg(-1.3)
look = ns(0.004)
pk = maximum_filter1d(np.max(np.abs(mix), axis=0), size=2 * look + 1)
gain = np.minimum(1.0, ceil / (pk + 1e-12))
b = np.exp(-1 / (0.08 * SR))
gs = np.empty_like(gain)
gs[0] = gain[0]
# release smoothing (attack is handled by the look-ahead max filter)
gr = signal.lfilter([1 - b], [1, -b], gain - 1.0) + 1.0
gs = np.minimum(gain, gr)
mix = mix * gs
mix *= dbg(-14.0 - integrated(mix))
tp = true_peak(mix)
if tp > -1.0:
    mix *= dbg(-1.0 - tp - 0.05)
mix = fades(mix, 0.002, 0.25)
write_wav(sys.argv[2], mix, 24)
if os.environ.get("STEMS"):                 # for short_qa-style checks: voice / music (ducked) / sfx buses
    np.savez_compressed(os.environ["STEMS"], voice=voice.astype(np.float32), music=(music * duck).astype(np.float32),
                        sfx=(sfx + verb).astype(np.float32))
print(json.dumps(dict(seconds=round(N / SR, 3), lufs=round(integrated(mix), 2), true_peak=round(true_peak(mix), 2),
                      voice_lufs=round(integrated(voice), 2), music_lufs=round(integrated(music * duck), 2),
                      sfx_lufs=round(integrated(sfx + verb), 2), sfx_max_momentary=round(momentary_max(sfx + verb), 2))))
