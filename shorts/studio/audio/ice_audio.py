# Sound for "Apa jadinya kalau kamu jualan es krim 30.000 tahun lalu?": an original playful score in F major (112 bpm) that
# changes mood per chapter (music-box jingle at the school, log drums + tuba in the valley, sneaky pizzicato for the money
# gesture and the wolf, soft vibes at night, a sad music box for the melt and the bankruptcy, a warm pluck by the river,
# the reprise for the recap), stingers on the punch words, and a synthesized SFX stem placed on the picture's own event
# list (ice_timeline.json, exported from the Remotion beats by studio/scripts/export_timeline.ts). Mix: voice untouched,
# music ducked under speech, master to -15 LUFS integrated with a true-peak ceiling of -1.6 dBTP.
# usage: python ice_audio.py voice.wav out/icecream_mix.wav
import json, os, sys
import numpy as np
from dsp import SR, ns, tt, rng, lp, hp, bp, pan, place, st, fades, dbg, integrated, true_peak, read_wav, write_wav, make_ir, convolve_st, colored, widen
import instruments as I
import sfx_gen as G

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, "ice_timeline.json")))
SENT = json.load(open(os.path.join(HERE, "..", "..", "icecream", "studio", "src", "videos", "icecream", "sentences.json")))
FPS = TL["fps"]
DUR = TL["total"] / FPS
N = ns(DUR)
F = I.m2f
BEAT = 60 / 112
S = lambda si: SENT[si][0][1] / FPS                       # sentence start (s)
def W(si, needle, n=0):                                    # word start (s), same rule as timing.ts wf()
    import re
    q = re.sub(r"[^a-z0-9]", "", needle.lower()); k = 0
    for w, a, b in SENT[si]:
        if re.sub(r"[^a-z0-9]", "", w.lower()).startswith(q):
            if k == n: return a / FPS
            k += 1
    raise SystemExit(f"word {needle} not in sentence {si}")
cues = []
def cue(t, what): cues.append((t, what))
def runs(key):
    """[(t0, t1, value)] spans of a per-frame state"""
    r = TL["runs"][key]; out = []
    for i, (f, v) in enumerate(r):
        f1 = r[i + 1][0] if i + 1 < len(r) else TL["total"]
        out.append((f / FPS, f1 / FPS, v))
    return out

# ---------------------------------------------------------------- music
mus = np.zeros((2, N))
def put(x, t, g=1.0, p=0.0):
    x = np.asarray(x)
    if t >= DUR or t < -1: return
    place(mus, pan(x, p) if x.ndim == 1 else x, max(0.0, t), g)

# F major; THEME is the cart's own little jingle (original)
THEME = [(0, 72, .5), (.5, 74, .5), (1, 76, 1), (2, 72, .5), (2.5, 69, .5), (3, 72, 1), (4, 77, .5), (4.5, 76, .5), (5, 74, .5),
         (5.5, 72, .5), (6, 74, 2), (8, 72, .5), (8.5, 74, .5), (9, 76, 1), (10, 79, .5), (10.5, 77, .5), (11, 76, 1), (12, 74, .5),
         (12.5, 76, .5), (13, 74, .5), (13.5, 70, .5), (14, 72, 2)]
CH_PROG = [(53, 57, 60), (48, 52, 55, 58), (46, 50, 53), (48, 52, 55, 58)]     # F  C7  Bb  C7 (one bar each)
BASS = [41, 36, 34, 36]

def theme(t0, until, inst="glock", vel=0.45, p=0.15, slow=1.0, shift=0, seed=1):
    r = rng(seed); t = t0
    while t < until - 0.2:
        for (b, m, d) in THEME:
            tt0 = t + b * BEAT * slow
            if tt0 >= until - 0.1: break
            fm = F(m + shift)
            if inst == "glock": put(I.glock(fm, vel * r.uniform(.85, 1.05), r, dur=1.2), tt0, 0.8, p)
            elif inst == "box": put(I.musicbox(fm, vel * r.uniform(.85, 1.05), r, dur=1.6), tt0, 0.9, p)
            elif inst == "vibes": put(I.vibes(fm, vel, r, dur=1.8), tt0, 0.8, p)
            elif inst == "fife": put(I.fife(fm, d * BEAT * slow * 0.9, vel, r), tt0, 0.6, p)
            elif inst == "pluck": put(I.pluck(fm, vel, r, dur=0.8, bright=0.55), tt0, 0.9, p)
        t += 16 * BEAT * slow

def groove(a, b, energy=1.0, drums=True, tuba=True, chords=True, seed=10, swing=0.0):
    """the bouncy valley groove: tuba on 1 and 3, pluck chords on the offbeats, log drums (low timpani + brush)"""
    r = rng(seed); bar = 4 * BEAT; k = 0; t = a
    while t < b - 0.1:
        ch, bs = CH_PROG[k % 4], BASS[k % 4]
        for q in range(4):
            tq = t + q * BEAT
            if tq >= b - 0.05: break
            if tuba and q in (0, 2): put(I.brass(F(bs + (0 if q == 0 else 7)), BEAT * 0.8, 0.5 * energy, r, kind="tuba", scoop=-10), tq, 0.55, -0.1)
            if chords:
                for m in ch: put(I.pluck(F(m + 12), 0.28 * energy * r.uniform(.85, 1.05), r, dur=0.35, bright=0.45), tq + BEAT * (0.5 + swing), 0.5, 0.25)
            if drums:
                put(I.timpani(F([45, 40, 43, 40][q]), 0.32 * energy, r, dur=0.4), tq, 0.45, -0.25)
                if q in (1, 3): put(I.brush(0.35 * energy, r, dur=0.25), tq, 0.5, 0.15)
        t += bar; k += 1

def sneaky(a, b, energy=1.0, seed=20, fast=1.0):
    """pizzicato tiptoe: low staccato chromatic walk + muted woodblock"""
    r = rng(seed); walk = [41, 43, 44, 45, 46, 45, 44, 43]; t = a; k = 0
    while t < b - 0.05:
        put(I.pluck(F(walk[k % 8]), 0.5 * energy, r, dur=0.18, bright=0.35), t, 0.8, -0.1)
        if k % 2 == 1: put(I.pluck(F(walk[k % 8] + 19), 0.25 * energy, r, dur=0.12, bright=0.6), t, 0.6, 0.3)
        if k % 4 == 2: put(I.brush(0.25 * energy, r, dur=0.12), t, 0.5, 0.2)
        t += BEAT / (2 * fast); k += 1

def pad(a, b, notes, vel=0.18, warm=900, att=0.8, rel=0.9):
    if b > a + 0.2: put(I.pad([F(m) for m in notes], b - a, vel, rng(int(a * 10) + 3), att=att, rel=rel, warm=warm), a)

def arp(a, b, chords, inst="vibes", vel=0.3, step=0.5, seed=30, p=0.0):
    r = rng(seed); t = a; k = 0
    while t < b - 0.1:
        ch = chords[(k // 8) % len(chords)]; m = ch[k % len(ch)]
        x = I.vibes(F(m), vel, r, dur=1.4) if inst == "vibes" else I.pluck(F(m), vel, r, dur=0.9, bright=0.4) if inst == "pluck" else I.musicbox(F(m), vel, r, dur=1.4)
        put(x, t, 0.8, p); t += step * BEAT; k += 1

def sting_fail(t, g=1.0, seed=50):
    """sad tuba 'wah-wah-waah' (three falling notes, the last bent down)"""
    r = rng(seed)
    for i, m in enumerate((46, 45, 44)):
        put(I.brass(F(m), 0.32 if i < 2 else 0.9, 0.7 * g, r, kind="tuba", scoop=-14, fall=(0 if i < 2 else -3.0)), t + i * 0.3, 0.75)
    cue(t, "music: sad tuba sting")
def sting_win(t, g=1.0, seed=60):
    r = rng(seed)
    for i, m in enumerate((72, 76, 79, 84)): put(I.glock(F(m), 0.55 * g, r, dur=1.0), t + i * 0.07, 0.8, 0.2)
    put(I.cymbal(0.25 * g, r, dur=1.4, bright=1.2), t + 0.2, 0.5, 0.3)
    cue(t, "music: glock rise sting")
def hit(t, g=1.0, seed=70):
    r = rng(seed); put(I.timpani(F(29), 0.9 * g, r, dur=2.4), t, 0.9); put(I.cymbal(0.4 * g, r, dur=2.2), t, 0.5, 0.2)

E = DUR - 0.3
# ch1: school jingle (music box theme), the reality switch: log-drum hit, valley groove, back and forth, the disaster
school = [x for x in runs("set") if x[2] == "school"]
for a, b, _ in school:
    theme(a + 0.1, b, "box", 0.42, 0.1, seed=int(a) + 1); pad(a, b, (53, 60, 65), 0.1, 1400)
for f in TL["flashes"]: hit(f / FPS - 0.02, 0.8, seed=f); cue(f / FPS, "music: hit on the white flash")
valley1 = [x for x in runs("set") if x[2] == "valley" and x[0] < S(8)]
for a, b, _ in valley1:
    groove(a, min(b, S(8)), 0.7, seed=int(a) + 11); pad(a, min(b, S(8)), (41, 48), 0.14, 500)
sting_fail(W(7, "bencana"), 0.9)
# ch2: arrival in the valley, light groove + the theme on fife; first ice cream: glock
groove(S(8) - 0.1, S(16), 0.6, seed=12)
theme(S(9), S(16), "fife", 0.32, -0.15, seed=13)
pad(S(16) - 0.1, S(22), (53, 57, 60, 65), 0.15, 1200, att=0.4)
arp(S(16), S(22) - 0.3, [(65, 69, 72, 77)], "box", 0.3, seed=14)
sting_win(S(20), 0.8)
# ch3: the group approaches (sneaky), the money gesture and barter (sneaky + stingers), the deal and the crowd (full groove)
sneaky(S(22) - 0.1, S(28), 0.8, seed=21)
sting_fail(S(29) + 0.05, 0.6, 51); sting_fail(S(31) + 0.05, 0.7, 52)
sneaky(S(28), S(33), 0.6, seed=22, fast=1.2)
sting_win(W(33, "transaksi"), 1.0, 61)
groove(S(33), S(41), 1.0, seed=23); theme(S(36), S(41), "glock", 0.42, 0.2, seed=24)
sting_win(W(39, "kesuksesan"), 1.0, 62)
# ch4: guarding the queue (light groove), the wolf (low sneaky), you notice; new job
groove(S(41) - 0.1, S(45), 0.55, drums=True, seed=25)
sneaky(S(45) - 0.1, S(48), 1.0, seed=26, fast=0.8); pad(S(45), S(48), (29, 36), 0.2, 300)
hit(S(48), 0.6, 71)
groove(S(49), S(52) - 0.2, 0.5, drums=False, seed=27)
sting_fail(W(51, "masalah"), 0.5, 53)
# ch5: night (vibes, crickets in the SFX), the switch-off, big mistake; morning melt (sad music box); prices and confusion
arp(S(52), S(56), [(53, 57, 60, 64), (50, 53, 57, 60)], "vibes", 0.24, step=1.0, seed=31)
pad(S(52), S(56), (41, 48, 53), 0.12, 700, att=1.5)
hit(S(56), 1.0, 72); sting_fail(S(56) + 0.15, 0.9, 54)
theme(S(57) + 0.3, S(62), "box", 0.34, 0.1, slow=1.5, shift=-1, seed=32); pad(S(57), S(65), (40, 47, 52), 0.14, 600)
sting_fail(W(64, "berkurang"), 0.6, 55)
sneaky(S(65), S(68), 0.5, seed=33)
put(I.brass(F(48), 0.3, 0.6, rng(80), kind="tuba"), W(67, "dua"), 0.7); put(I.brass(F(53), 0.5, 0.6, rng(81), kind="tuba"), W(67, "dua") + 0.3, 0.7)
arp(S(68), S(73) - 0.2, [(53, 56, 59, 62)], "pluck", 0.28, step=1.0, seed=34)          # diminished, confused
# ch6: the hot sun (slow, lazy groove), the knocking queue, the generator stutters and dies: the music winds down; silence;
# panic; pushing the cart into the shade; it only slows the warming
groove(S(73) - 0.1, S(79), 0.45, tuba=True, drums=False, seed=40, swing=0.08)
pad(S(73), S(82), (41, 48, 55), 0.12, 500)
sneaky(S(79), S(82), 0.7, seed=41, fast=1.3)
x = I.pad([F(53), F(60), F(65)], 3.0, 0.22, rng(82), att=0.05, rel=0.3, warm=900)   # the music 'runs out of fuel'
put(x * np.linspace(1, 0.2, x.shape[-1]), W(84, "hidup"), 0.8)
sting_fail(W(84, "mati"), 0.9, 56)
hit(W(85, "kosong"), 0.5, 73)
pad(S(87), S(91), (36, 43), 0.10, 400, att=1.2)
sneaky(S(91), S(92), 1.2, seed=42, fast=2.0)
arp(S(92), S(96) - 0.3, [(50, 53, 57), (48, 52, 55)], "pluck", 0.26, step=1.0, seed=43)
pad(S(92), S(96), (38, 45, 50), 0.14, 600)
# ch7: the last ice cream (sad music box, minor), bankrupt, the friend is not sad; the cool river (warm pluck + fife), the lesson
theme(S(96) + 0.2, S(102), "box", 0.32, 0.0, slow=1.6, shift=-4, seed=44); pad(S(96), S(102), (37, 44, 49), 0.16, 600)
sting_fail(W(101, "bangkrut"), 0.8, 57)
put(I.pluck(F(65), 0.4, rng(83), dur=0.6), W(102, "sedih"), 0.8, 0.2); put(I.pluck(F(69), 0.4, rng(84), dur=0.6), W(102, "sedih") + 0.18, 0.8, 0.2)
arp(S(103), S(109), [(53, 57, 60, 65), (50, 53, 57, 62), (46, 50, 53, 58), (48, 52, 55, 60)], "pluck", 0.3, step=0.5, seed=45, p=-0.1)
theme(S(104), S(109), "fife", 0.28, 0.15, slow=1.25, seed=46); pad(S(103), S(113), (41, 48, 53), 0.14, 1100)
sting_win(W(109, "mengerti"), 0.6, 63)
arp(S(109), S(113) - 0.2, [(53, 57, 60, 65), (46, 50, 53, 58)], "vibes", 0.24, step=1.0, seed=47)
# ch8: the next morning (light pluck), the surprise (vibes), the stick toy (music-box theme, warm), the reflection; the recap
# (full groove reprise with the theme on glock), the punchline button
groove(S(113) - 0.1, S(115), 0.45, drums=False, seed=48)
arp(S(115), S(119), [(53, 57, 60, 64)], "vibes", 0.22, step=1.0, seed=49)
sting_win(W(119, "stik"), 0.7, 64)
theme(S(120), S(122), "box", 0.4, 0.1, seed=50); pad(S(119), S(124), (41, 48, 53, 57), 0.15, 1200)
groove(S(124), S(127), 0.9, seed=51); theme(S(125), S(127), "glock", 0.42, 0.2, seed=52)
sting_win(W(125, "terkenal"), 0.8, 65)
put(I.brass(F(40), 0.4, 0.6, rng(85), kind="tuba"), W(126, "bahan"), 0.6)
sting_fail(W(127, "bangkrut"), 0.9, 58)
theme(S(128) + 0.3, W(128, "coklat"), "box", 0.36, 0.1, slow=1.2, seed=53); pad(S(128), W(128, "coklat"), (41, 48, 53), 0.14, 900)
put(I.pluck(F(48), 0.4, rng(86), dur=0.5), W(128, "coklat"), 0.7); put(I.pluck(F(47), 0.4, rng(87), dur=0.5), W(128, "vanila"), 0.7)
groove(S(129) - 0.05, E - 1.6, 1.0, seed=54)
sting_win(W(129, "stik"), 1.1, 66)
r = rng(88)
for i, m in enumerate((65, 72, 77)): put(I.brass(F(m - 24), 0.5 if i < 2 else 1.4, 0.7, r, kind="tuba"), E - 1.6 + i * 0.25, 0.6)
for m in (77, 81, 84, 89): put(I.glock(F(m), 0.55, r, dur=2.0), E - 1.1, 0.6, 0.2)
put(I.cymbal(0.5, r, dur=2.4), E - 1.1, 0.5)
cue(E - 1.6, "music: final button")

ir = make_ir(1.4, 5)
from scipy.signal import oaconvolve
for c in range(2): mus[c] = 0.8 * mus[c] + 0.25 * oaconvolve(mus[c], ir[c])[:N]   # overlap-add: low memory
print("music done", flush=True)

# ---------------------------------------------------------------- SFX
sfx = np.zeros((2, N))
def fx(x, t, g=1.0, p=0.0, what=None):
    x = np.asarray(x)
    if t >= DUR or t < 0: return
    place(sfx, pan(x, p) if x.ndim == 1 else x, t, g)
    if what: cue(t, what)
def gen_hum(dur, r, g=1.0):
    n = ns(dur); t = np.arange(n) / SR
    wob = 1 + 0.02 * np.sin(2 * np.pi * 3.1 * t)
    y = sum(a * np.sin(2 * np.pi * 50 * k * wob * t + k) for k, a in ((1, 0.6), (2, 0.45), (3, 0.3), (4, 0.2), (6, 0.1)))
    y += bp(r.standard_normal(n), 300, 2400) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 25 * t))) * 0.25
    return fades(y * g, 0.15, 0.25)
def pop(r, g=1.0):
    t = tt(0.09); y = np.sin(2 * np.pi * (500 + 900 * t / 0.09) * t) * np.exp(-t / 0.025) + hp(r.standard_normal(len(t)), 3000) * np.exp(-t / 0.004) * 0.3
    return fades(y * 0.35 * g, 0.001, 0.02)
def knock(r, g=1.0):
    return G.hammer_hit(r, 0.35) * 0.6 * g
def click(r):
    t = tt(0.04); return fades(hp(r.standard_normal(len(t)), 1500) * np.exp(-t / 0.004) * 0.5, 0.0005, 0.01)
def growl(dur, r, g=1.0):
    n = ns(dur); t = np.arange(n) / SR
    y = bp(colored(n, r, 0.5), 70, 420) * (0.6 + 0.4 * np.sin(2 * np.pi * 27 * t)) * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.6
    return fades(y * 2.2 * g, 0.05, 0.2)
def sniff(r, g=1.0):
    y = np.zeros(ns(0.6))
    for k in range(3):
        n = ns(0.12); t = np.arange(n) / SR; s = bp(r.standard_normal(n), 1500, 6000) * np.sin(np.pi * t / 0.12) * 0.4
        y[ns(k * 0.17): ns(k * 0.17) + n] += s
    return fades(y * g, 0.002, 0.02)
def drip(r):
    t = tt(0.12); return fades(np.sin(2 * np.pi * (900 + 1400 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.03) * 0.3, 0.001, 0.02)
def crackle(dur, r, g=1.0):
    return widen(G.rattle(dur, r, 9) * 0.3 * g + lp(colored(ns(dur), r, 1.0), 700) * 0.12 * g, r)
def cold_hiss(dur, r, g=1.0):
    n = ns(dur); return fades(hp(r.standard_normal(n), 2500) * np.sin(np.pi * np.arange(n) / n) * 0.12 * g, 0.05, 0.1)
def sputter(dur, r, g=1.0):
    y = np.zeros(ns(dur)); t = 0.0
    while t < dur - 0.1:
        y[ns(t): ns(t) + ns(0.06)] += (lp(r.standard_normal(ns(0.06)), 900) * np.exp(-np.arange(ns(0.06)) / SR / 0.02))[: len(y) - ns(t)]
        t += r.uniform(0.08, 0.25)
    return fades(y * 0.8 * g, 0.002, 0.05)
def msum(*xs):
    """sum mono signals of different lengths (zero-padded)"""
    n = max(len(x) for x in xs); y = np.zeros(n)
    for x in xs: y[:len(x)] += x
    return y
def lid_open(r): return msum(G.creak(0.45, r, 140, 220, scale=0.6) * 0.5, click(r) * 0.6)
def lid_close(r): return G.push_thump(r) * 0.6

r = rng(500)
def wd(x, _r=None):
    """widen a mono signal to stereo; stereo passes through"""
    x = np.asarray(x); return widen(x, r) if x.ndim == 1 else x
def bed(fn, d, piece=12.0, xf=0.5):
    """a long bed built from <= piece-second segments with equal-power crossfades (keeps memory low)"""
    if d <= piece: return np.asarray(fn(d))
    parts = []; t = 0.0
    while t < d: parts.append(np.asarray(fn(min(piece + xf, d - t + xf)))); t += piece
    st2 = parts[0].ndim == 2; n = ns(d); out = np.zeros((2, n)) if st2 else np.zeros(n)
    k = ns(xf); fin = np.sin(np.linspace(0, np.pi / 2, k)); fo = np.cos(np.linspace(0, np.pi / 2, k))
    for i, x in enumerate(parts):
        x = x.copy(); a = ns(i * piece)
        if i > 0: x[..., :k] *= fin
        if i < len(parts) - 1: x[..., -k:] *= fo
        m = min(x.shape[-1], n - a)
        if m > 0: out[..., a:a + m] += x[..., :m]
    return out
# beds: school chatter + birds; valley birds and breeze by day, breeze at golden hour, crickets and fire at night; the river
for a, b, v in runs("set"):
    d = b - a
    if v == "school":
        fx(bed(lambda q: wd(sum(lp(G.babble(q, r, 260 * r.uniform(0.9, 1.3), 1.25, rate=r.uniform(4.5, 6), active=0.7), 3000) * 0.25 for _ in range(6)), r), d), a, 0.5, what="school yard chatter")
        fx(bed(lambda q: G.bird_chirps(q, r, 0.5), d), a, 0.3, 0.4)
    if v == "river": fx(bed(lambda q: wd(G.water_bed(q, r, 0.7), r), d), a, 0.5, what="the river")
for a, b, v in runs("light"):
    d = b - a
    if v == "night": fx(bed(lambda q: wd(G.crickets(q, r, 4), r), d), a, 0.35, what="crickets"); fx(bed(lambda q: G.breeze(q, r, 0.05, bright=500), d), a)
    else:
        fx(bed(lambda q: G.breeze(q, r, 0.07 if v == "day" else 0.09, bright=800), d), a)
        if v == "day": fx(bed(lambda q: G.bird_chirps(q, r, 0.35), d), a, 0.25, -0.4)
for a, b, v in runs("fire"):
    if v and b - a > 0.3: fx(bed(lambda q: crackle(q, r, 0.6), b - a), a, 1.0, -0.2, "camp fire")
# the generator: hum while it runs (only in the valley), a start-up rev and a cough when it stops
for a, b, v in runs("gen"):
    if v and b - a > 0.2: fx(bed(lambda q: gen_hum(q, r, 0.18), b - a), a, 1.0, 0.3)
prev = None
for a, b, v in runs("gen"):
    if prev is not None and v != prev and a > 9.5:
        fx(G.whoosh(0.4, r, peak=0.3, f_lo=150, f_hi=700) * 0.5 if v else sputter(0.6, r, 0.6), a, 1.0, 0.3, "generator on" if v else "generator off")
    prev = v
# freezer lid open / close
prev = 0.0
for a, b, v in runs("lid"):
    if v >= 0.5 and prev < 0.5: fx(lid_open(r), a, 0.8, 0.0)
    if v < 0.5 and prev >= 0.5: fx(lid_close(r), a, 0.8, 0.0)
    prev = v
# the cart rolling into the shade
for a, b, v in runs("cart"):
    pass
fx(G.creak(1.6, r, 90, 140, scale=0.8) * 0.5, S(92), 1.0, -0.2, "cart rolls into the shade")
# footsteps for the walking crowd; crowd murmur when many people are on screen
for a, b, n in runs("walkers"):
    if n and b - a > 0.2:
        for tm in np.arange(a, b, 0.5 / min(4, n)): fx(G.stroll_step(r, 0.4) * 0.35, tm + r.uniform(0, 0.05), 1.0, r.uniform(-0.5, 0.5))
for a, b, n in runs("people"):
    if n >= 6 and b - a > 0.6:
        fx(bed(lambda q: wd(sum(lp(G.babble(q, r, 150 * r.uniform(0.8, 1.5), r.uniform(0.95, 1.2), rate=4.5, active=0.7), 2400) * 0.22 for _ in range(4)), r), b - a), a, 0.5)
# the wolf: a low growl when it appears, sniffs at the fish
for a, b, n in runs("wolf"):
    if n and b - a > 0.3: fx(growl(min(2.2, b - a), r, 0.8), a + 0.3, 1.0, 0.5, "wolf growl")
fx(sniff(r), W(46, "bau"), 0.8, 0.4, "wolf sniffs")
print("beds done", flush=True)
# events: badges pop, marks get their own sound, bursts sparkle, hops thump
for e in TL["events"]:
    t = e["f"] / FPS; k = e["k"]
    if k == "badge": fx(pop(r), t, 0.8, r.uniform(-0.3, 0.3))
    elif k == "burst":
        for i, m in enumerate((96, 100, 103)): fx(I.glock(F(m), 0.25, r, dur=0.6), t + i * 0.05, 0.5, 0.2)
    elif k == "hop": fx(G.stroll_step(r, 0.2) * 0.25, t + 0.25, 1.0, 0.0)
    elif k == "mark":
        tx = e["text"]
        if tx.startswith("TOK"):
            for i in range(2 if "TOK!" in tx and tx.count("TOK") == 2 else 1): fx(knock(r), t + i * 0.22, 1.0, 0.1, "knock")
        elif tx.startswith("BRRR"): fx(G.whoosh(0.35, r, peak=0.25, f_lo=120, f_hi=600) * 0.4, t, 1.0, 0.3)
        elif tx == "KLIK": fx(click(r), t, 1.0, 0.3, "switch click")
        elif tx == "SRET!": fx(G.whoosh(0.3, r, peak=0.15, f_lo=800, f_hi=3000) * 0.5 + 0, t, 1.0, 0.3, "pull cord")
        elif tx.startswith("TEK"): fx(sputter(1.2, r, 0.7), t, 1.0, 0.3, "generator sputters")
        elif tx == "BOCOR":
            for i in range(4): fx(drip(r), t + i * 0.35, 0.8, 0.1)
        elif tx == "SNIFF": fx(sniff(r), t, 0.9, -0.2)
        elif tx in ("!", "!!"): fx(G.whoosh(0.18, r, peak=0.05, f_lo=1500, f_hi=5000) * 0.3, t, 1.0, 0.0)
        elif tx == "Zzz": fx(lp(G.oof(r, "oof") * 0.15, 900), t, 1.0, 0.1)
    elif k == "puffs" and e["text"].startswith("cold"): fx(cold_hiss(1.5, r, 1.0), t, 1.0, 0.0)
    elif k == "puffs" and e["text"] in ("asap", "mati"): fx(sputter(0.8, r, 0.5), t, 1.0, 0.3)
# camera kicks: a soft air hit; white flashes: a whoosh into the switch
for k in TL["kicks"]: fx(G.whoosh(0.25, r, peak=0.08, f_lo=200, f_hi=1500) * 0.4, k / FPS - 0.05, 1.0)
for f in TL["flashes"]: fx(G.whoosh(0.8, r, peak=0.55, f_lo=400, f_hi=5000) * 0.6, f / FPS - 0.55, 1.0, 0.0, "flash whoosh")
# barter props landing in your hand, the leaf rub
fx(G.whoosh(0.4, r, peak=0.2, f_lo=1500, f_hi=6000) * 0.3, W(26, "mengoleskan"), 1.0, -0.2, "leaf rub")
for w, si in (("batu", 28), ("ranting", 30)): fx(knock(r, 0.5), W(si, w), 1.0, -0.2)
fx(G.splash_big(r) * 0.12, W(32, "ikan"), 1.0, -0.3, "fish slap")
fx(G.hurrah(r, 160, 1.05) * 0.35, W(39, "kesuksesan"), 1.0, 0.0, "day one cheer")
fx(wd(msum(*[G.hurrah(r, 300 * r.uniform(0.9, 1.2), 1.3, kid=True) * 0.25 for _ in range(3)]), r), W(107, "tersenyum"), 1.0, 0.0, "kids laugh by the river")
fx(wd(msum(*[G.hurrah(r, 300 * r.uniform(0.9, 1.2), 1.3, kid=True) * 0.25 for _ in range(3)]), r), W(129, "bekas") + 0.4, 1.0, 0.0, "kids cheer at the end")

print("sfx done", flush=True)
# ---------------------------------------------------------------- mix
voice, _sr = read_wav(sys.argv[1])
if voice.ndim == 1: voice = st(voice)
v = np.zeros((2, N)); v[:, : min(N, voice.shape[1])] = voice[:, :N]
key = np.zeros(N)
for s in SENT:
    for w, a, b in s: key[ns(a / FPS): ns(b / FPS + 0.15)] = 1
from scipy import ndimage, signal
key = ndimage.uniform_filter1d(key, ns(0.25))
duck = dbg(-5.0 * key)
VL = integrated(v)
def to_lufs(x, target):
    L = integrated(x)
    return x * dbg(target - L) if np.isfinite(L) else x
mus = to_lufs(mus, VL - 7.0) * duck[None, :]
sfx = to_lufs(sfx, VL - 11.0)
mix = to_lufs(v + mus + sfx, -15.0)
ceil = dbg(-1.8)
def tp_env(x):
    """per-sample true-peak estimate (4x oversampled), computed in 20 s blocks to keep memory low"""
    out = np.empty(x.shape[1]); B = ns(20.0); pad = 64
    for a in range(0, x.shape[1], B):
        lo, hi = max(0, a - pad), min(x.shape[1], a + B + pad)
        up = signal.resample_poly(x[:, lo:hi], 4, 1, axis=1)
        pk = np.abs(up).max(axis=0).reshape(-1, 4).max(axis=1)
        out[a:min(x.shape[1], a + B)] = pk[a - lo: a - lo + min(B, x.shape[1] - a)]
    return out
for _ in range(3):
    pk = tp_env(mix)
    g0 = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    g = ndimage.minimum_filter1d(g0, ns(0.005)); g = ndimage.uniform_filter1d(g, ns(0.005))
    g = np.minimum(g, ndimage.minimum_filter1d(g0, 3))
    mix = mix * g[None, :]
mix[:, -ns(0.5):] *= np.linspace(1, 0, ns(0.5))[None, :]
out = sys.argv[2]
os.makedirs(os.path.dirname(out), exist_ok=True)
write_wav(out, mix)
for nm, x in (("voice", v), ("music", mus), ("sfx", sfx)): write_wav(os.path.join(os.path.dirname(out), f"ice_stem_{nm}.wav"), x)
with open(os.path.join(os.path.dirname(out), "ice_cues.md"), "w") as fh:
    fh.write(f"# Cues\n\nLength {DUR:.3f} s, 48 kHz stereo. Integrated {integrated(mix):.1f} LUFS, true peak {20 * np.log10(tp_env(mix).max()):.1f} dBTP.\n\n")
    for t, w in sorted(cues): fh.write(f"- {t:6.2f} s  {w}\n")
print("done", DUR, integrated(mix), 20 * np.log10(tp_env(mix).max()))
