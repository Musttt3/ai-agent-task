"""Mix: narration (Must4 line clips) + procedural foley from events.json + ambience beds + the score, ducked under the voice.
Writes out/mix.wav (48 kHz stereo). Loudness is finished by mux.sh (two-pass loudnorm to -14 LUFS).
usage: LIB=<library> <lib>/.venv/bin/python mix.py
"""
import json, os, sys
import numpy as np, soundfile as sf
LIB = os.environ.get("LIB", "/root/lemo-opuscar")
sys.path.insert(0, LIB)
from core.audio import sfx as X
from core.audio.sfx import SR, add, t_, env_exp, bp, lp, hp, noise, norm, compress, limit

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, "timeline.json")))
EV = json.load(open(os.path.join(HERE, "events.json")))["ev"]
DUR = TL["DUR"]; N = int((DUR + .3) * SR)
SHOT = dict((n, t) for n, t in TL["shots"]); SEC = TL["sections"]
rng = np.random.default_rng(7)

def sine(f, d, tau=None, ph=0):
    tt = t_(d); x = np.sin(2 * np.pi * f * tt + ph)
    return x * (env_exp(d, tau) if tau else 1)
def ov(*xs):            # overlay arrays of different lengths
    out = np.zeros(max(len(x) for x in xs))
    for x in xs: out[:len(x)] += x
    return out
def fadeio(x, a=.01, b=.05):
    n = len(x); ia, ib = min(n, int(a * SR)), min(n, int(b * SR))
    x = x.copy(); x[:ia] *= np.linspace(0, 1, ia); x[n - ib:] *= np.linspace(1, 0, ib); return x

# ---------------- foley by material ----------------
def f_bulb(e):          # knife-switch "chunk" + a short filament hum
    big = e.get("big", 0); small = e.get("small", 0)
    hum = bp(noise(.35), 110, 140) * env_exp(.35, .12) * .25 + sine(120, .35, .15) * .15
    return ov(X.click(.55, 1) * .8, X.thump(.6, 95) * .5, hum) * (.5 if small else 1.3 if big else .8)
def f_alarm(e):         # bell alarm: 2.3 kHz partials, struck 18 times a second
    d = e.get("dur", 1.5); tt = t_(d)
    strike = (np.sin(2 * np.pi * 18 * tt) > 0).astype(float)
    x = (np.sin(2 * np.pi * 2350 * tt) + .6 * np.sin(2 * np.pi * 3720 * tt) + .3 * np.sin(2 * np.pi * 5100 * tt)) * (.35 + .65 * strike)
    return fadeio(x * .22, .005, .12)
def f_rustle(e): d = .45; return lp(hp(noise(d), 800), 5000) * np.sin(np.pi * t_(d) / d) * .25
def f_creak(e): return X.creak(.45)
def f_tvon(e):
    d = .45; st = hp(noise(d), 1500) * np.sin(np.pi * t_(d) / d) * .3
    x = np.zeros(int(.55 * SR)); x[:len(st)] += st; c = X.click(.4, 1) * .6; x[:len(c)] += c; return x
def f_ratchet(e):
    d = e.get("dur", 1.0); out = np.zeros(int((d + .1) * SR)); t = 0.0; slow = e.get("slowing", 0); i = 0
    while t < d:
        c = X.click(1.6, .35); s = int(t * SR); out[s:s + len(c)] += c[:len(out) - s]
        k = t / max(d, .01); t += (.035 + .22 * k ** 2) if slow else .06; i += 1
    return out
def f_chime(e): return X.ding(.45)
def f_latch(e):
    x = np.zeros(int(.6 * SR)); c = X.click(.5, .9); x[:len(c)] += c; th = X.thump(.5, 80); s = int(.04 * SR); x[s:s + len(th)] += th[:len(x) - s]
    tw = sine(310, .4, .08) * .2; s = int(.1 * SR); x[s:s + len(tw)] += tw[:len(x) - s]; return x     # spring twang
def f_step(e): return X.step(.25 if e.get("soft") else .4) * (.6 if e.get("tick") else 1)
def f_tram(e):
    d = e.get("dur", 2.0); w = X.whoosh(d, .5); tt = t_(d)
    rum = lp(noise(d), 160) * np.sin(np.pi * tt / d) * .4
    bell = sum(a * np.sin(2 * np.pi * f * t_(.9)) * env_exp(.9, .25) for f, a in [(1180, 1), (2360, .4)]) * .25
    x = ov(w, rum, np.zeros(int(1.8 * SR))); s = int(.5 * SR); x[s:s + len(bell)] += bell; s = int(.75 * SR); x[s:s + len(bell)] += bell * .8; return x
def f_ding(e):
    p = e.get("pitch", 76); f = 440 * 2 ** ((p - 69) / 12); d = 1.2
    return sum(a * np.sin(2 * np.pi * f * m * t_(d)) * env_exp(d, tau) for m, a, tau in [(1, 1, .5), (2, .35, .3), (3, .15, .15)]) * .28
def f_tap(e): return X.click(1.3, .5)
def f_schoolbell(e):
    out = np.zeros(int(1.4 * SR))
    for k in range(6):
        b = sum(a * np.sin(2 * np.pi * f * t_(.5)) * env_exp(.5, .15) for f, a in [(1560, 1), (3900, .3)]) * .14
        s = int(k * .08 * SR); out[s:s + len(b)] += b
    return out
def f_beep(e): return fadeio(sine(880, .12) * .07, .005, .03)
def f_radio(e):
    d = e.get("dur", 1.5); tt = t_(d); f = 2400 + 900 * np.sin(2 * np.pi * 3 * tt)
    return fadeio(np.sin(2 * np.pi * np.cumsum(f) / SR) * (.5 + .5 * np.sin(2 * np.pi * 7 * tt)) * .05, .05, .3)
def f_tick(e):
    c = X.click(2.2, .7 if e.get("soft") else 1.0); w = bp(noise(.03), 2500, 6000) * env_exp(.03, .004) * .5
    x = np.zeros(max(len(c), len(w))); x[:len(c)] += c; x[:len(w)] += w; return x * 1.2
def f_coin(e):
    i = e.get("i", 0); d = .5; f = 3100 + 400 * (i % 4)
    return sum(a * np.sin(2 * np.pi * f * m * t_(d)) * env_exp(d, tau) for m, a, tau in [(1, 1, .09), (1.51, .6, .06), (2.3, .3, .04)]) * .12
def f_short(e):
    d = .45; cr = hp(noise(d), 2000) * (rng.random(int(round(d * SR))) > .985) * 3.0 * env_exp(d, .2)
    buzz = bp(noise(d), 90, 400) * (np.sign(np.sin(2 * np.pi * 60 * t_(d)))) * env_exp(d, .15) * .4
    return (cr + buzz) * .7
def f_pop(e): return X.pop(.45)
def f_shimmer(e):
    d = e.get("dur", 1.0); out = np.zeros(int((d + .4) * SR))
    for k in range(int(d * 14)):
        f = 3000 + 3500 * rng.random(); g = sine(f, .3, .08) * .03; s = int(rng.random() * d * SR); out[s:s + len(g)] += g[:len(out) - s]
    return out
def f_whoosh(e): return X.whoosh(e.get("dur", .8), .35)
def f_swell(e):
    d = e.get("dur", 2.5); tt = t_(d); env = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 2
    return lp(noise(d), 900) * env * .12
def f_switchoff(e):      # the house lights go out: a big knife-switch and the hum dying
    hum = (sine(60, 1.4) + .5 * sine(120, 1.4)) * np.linspace(1, 0, int(round(1.4 * SR))) ** 2 * .12
    return ov(X.click(.4, 1) * .9, X.thump(.8, 55) * .7, hum)
def f_bell(e): return np.zeros(10)                      # the tubular bell is in the score
def f_door(e):
    kind = e.get("kind", "split")
    if kind == "close":
        x = np.zeros(int(1.2 * SR)); w = X.whoosh(.6, .3); x[:len(w)] += w; th = X.thump(1.0, 60); s = int(.85 * SR); x[s:s + len(th)] += th[:len(x) - s]; return x
    x = np.zeros(int(.9 * SR)); c = X.click(.45, .7); x[:len(c)] += c                       # latch
    sw = bp(noise(.6), 300, 1800) * np.sin(np.pi * t_(.6) / .6) * .18; s = int(.03 * SR); x[s:s + len(sw)] += sw   # leaves swinging
    tw = sine(260, .5, .1) * .12; s = int(.05 * SR); x[s:s + len(tw)] += tw[:len(x) - s]
    return x * (.6 if kind == "half" else 1)
FOLEY = {k[2:]: v for k, v in globals().items() if k.startswith("f_")}

fol = np.zeros((N, 2), np.float32)
for e in EV:
    fn = FOLEY.get(e["type"])
    if fn is None: print("no foley for", e["type"]); continue
    x = np.asarray(fn(e), np.float32)
    pan = {"bulb": -.3 + .06 * (e.get("i", 0) % 10), "coin": -.6 + .12 * (e.get("i", 0) % 10), "tram": .2}.get(e["type"], 0)
    add(fol, x, e["t"], .9, pan)

# ---------------- ambience beds ----------------
bed = np.zeros((N, 2), np.float32)
def span(a, b, x, gain):
    s, e_ = int(a * SR), min(N, int(b * SR)); L = e_ - s
    if L <= 0: return
    y = np.resize(x, L).astype(np.float32); f = min(L // 2, int(.4 * SR)); env = np.ones(L); env[:f] = np.linspace(0, 1, f); env[L - f:] = np.linspace(1, 0, f)
    bed[s:e_, 0] += y * env * gain; bed[s:e_, 1] += np.roll(y, 977) * env * gain
room = lp(X.brown(8), 400) * .5
span(0, SEC["B"], room, .05)
birds = sum(sine(3200 + 400 * k, .25, .06) * (k % 2 * 2 - 1) for k in range(3))
morning = np.zeros(int(6 * SR)); [morning.__setitem__(slice(int(x * SR), int(x * SR) + len(birds)), birds) for x in (.4, 1.9, 3.1, 4.6)]
span(SHOT["bedroom"], SHOT["tv"], morning, .05)
city = bp(noise(8), 200, 1400) * (1 + .3 * np.sin(2 * np.pi * .3 * t_(8)))
span(SHOT["street"], SHOT["school"] + .5, city, .06)
kids = bp(noise(6), 500, 2500) * (1 + .5 * np.sin(2 * np.pi * 2.3 * t_(6)))
span(SHOT["school"], SHOT["village"], kids, .03)
crick = (np.sin(2 * np.pi * 4300 * t_(4)) * (np.sin(2 * np.pi * 22 * t_(4)) > .6) * (np.sin(2 * np.pi * .9 * t_(4)) > 0)) * .5 + bp(noise(4), 100, 600) * .4
span(SHOT["village"] - .5, SHOT["wait"], crick, .05)              # J-cut: the crickets arrive before the doors open
span(SHOT["overhead"], SHOT["dial"], bp(noise(8), 250, 1200) * (1 + .4 * np.sin(2 * np.pi * .5 * t_(8))), .035)   # crowd
span(SHOT["dial"], DUR, room, .04)
# the freeze: only the tick (no bed)
w0, w1 = int(SHOT["wait"] * SR), int(SHOT["marquee"] * SR); bed[w0:w1] *= 0

# ---------------- voice ----------------
voc = np.zeros(N, np.float32)
for L in TL["lines"]:
    x, sr = sf.read(os.path.join(HERE, "voice/lines", L["id"] + ".wav"), dtype="float32")
    assert sr == SR
    s = int(L["t0"] * SR); voc[s:s + len(x)] += x[:N - s]
voc = compress(voc, thr=.18, ratio=3.0, att=.003, rel=.09)
rv = np.sqrt(np.mean(voc[np.abs(voc) > .01] ** 2))

# ---------------- music, ducked under the voice ----------------
mus, sr = sf.read(os.path.join(HERE, "out/score.wav"), dtype="float32"); assert sr == SR
mus = mus[:N] if len(mus) >= N else np.pad(mus, ((0, N - len(mus)), (0, 0)))
from scipy.signal import butter, sosfilt
low = sosfilt(butter(2, 150, 'low', fs=SR, output='sos'), mus, axis=0)
mus = mus + low * (10 ** (5 / 20) - 1)                    # +5 dB low shelf: a bass that speaks on phone speakers
rm = np.sqrt(np.mean(mus[np.abs(mus).max(1) > .005] ** 2))
mus *= (rv / rm) * 10 ** (-10 / 20)                       # voice about 10 dB above the music
# duck: -9 dB while the voice speaks (smoothed envelope)
env = np.abs(voc); k = int(.12 * SR); env = np.convolve(env, np.ones(k) / k, mode="same")
duck = 1 - (1 - 10 ** (-9 / 20)) * np.clip(env / (rv * .5), 0, 1)
a = np.exp(-1 / (.08 * SR)); dsm = np.copy(duck)
for i in range(1, len(dsm)): dsm[i] = min(duck[i], a * dsm[i - 1] + (1 - a) * duck[i])
mus *= dsm[:, None]

mix = mus + fol * (rv / .35) * .55 + bed * (rv / .35)
mix[:, 0] += voc; mix[:, 1] += voc
mix = np.stack([limit(mix[:, 0], .55), limit(mix[:, 1], .55)], 1)   # tame peaks so the master keeps true peak under -1.2 dB
sf.write(os.path.join(HERE, "out/mix.wav"), mix, SR)
print("mix:", round(len(mix) / SR, 2), "s; voice rms", round(float(rv), 4), "-> out/mix.wav")
