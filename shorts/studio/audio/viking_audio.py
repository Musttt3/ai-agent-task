# Sound for "You're a Viking Who Reached America Before Columbus": an original score in D dorian (plucked lyre, drones,
# frame drum / timpani, fife, glockenspiel; 120 bpm) that follows the picture section by section, a synthesized SFX stem
# placed on the shot plan (viking_timeline.json, exported from story.ts), and the mix: voice untouched, music ducked
# under speech, master to -15 LUFS integrated with a <= -1.2 dBTP ceiling. Writes mix.wav + stems + cues.md.
import json, os, sys
import numpy as np
from dsp import SR, ns, tt, rng, lp, hp, bp, pan, place, st, fades, dbg, integrated, true_peak, read_wav, write_wav, make_ir, convolve_st, colored, smooth_noise, widen
import instruments as I
import sfx_gen as G

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, "viking_timeline.json")))
FPS = TL["fps"]
DUR = TL["total"] / FPS
N = ns(DUR)
T = {k: v / FPS for k, v in TL["T"].items()}
SH = {s["id"]: (s["a"] / FPS, s["b"] / FPS) for s in TL["shots"]}
WORDS = TL["words"]
F = I.m2f
BEAT = 0.5
cues = []
def cue(t, what): cues.append((t, what))

# ---------------------------------------------------------------- music
mus = np.zeros((2, N))
def put(x, t, g=1.0, p=0.0):
    x = np.asarray(x)
    if t >= DUR: return
    place(mus, pan(x, p) if x.ndim == 1 else x, t, g)

def pluck_line(notes, t0, vel=0.5, p=0.0, bright=0.45, seed=1, until=None):
    r = rng(seed)
    for (b, m, d) in notes:
        if until is not None and t0 + b * BEAT >= until: continue
        put(I.pluck(F(m), vel * r.uniform(0.85, 1.05), r, dur=max(0.35, d * BEAT * 1.4), bright=bright), t0 + b * BEAT, 1.0, p)

def glock_line(notes, t0, vel=0.35, p=0.25, seed=2, fn=I.glock, until=None):
    r = rng(seed)
    for (b, m, d) in notes:
        if until is not None and t0 + b * BEAT >= until: continue
        put(fn(F(m), vel * r.uniform(0.85, 1.05), r), t0 + b * BEAT, 1.0, p)

def fife_line(notes, t0, vel=0.45, p=-0.15, seed=3, until=None):
    r = rng(seed)
    for (b, m, d) in notes:
        if until is not None and t0 + b * BEAT >= until: continue
        put(I.fife(F(m), d * BEAT * 0.95, vel * r.uniform(0.9, 1.05), r), t0 + b * BEAT, 1.0, p)

def pads(chords, t0, beats_each=4, vel=0.2, warm=800, until=None):
    r = rng(7)
    for i, ch in enumerate(chords):
        a = t0 + i * beats_each * BEAT
        if until is not None and a >= until: break
        d = beats_each * BEAT if until is None else min(beats_each * BEAT, until - a + 0.3)
        put(I.pad([F(m) for m in ch], d, vel, r, att=0.4, rel=0.8, warm=warm), a)

def drum(t0, t1, vel=0.35, pattern=(1, 0, 0.6, 0), seed=4, f=46):
    r = rng(seed); t = t0; k = 0
    while t < t1 - 0.05:
        v = pattern[k % len(pattern)]
        if v: put(I.timpani(F(f), vel * v, r, dur=0.5), t, 0.7, -0.2)
        t += BEAT / 2; k += 1

def bass(roots, t0, vel=0.5, every=2, seed=5, until=None):
    r = rng(seed)
    for i, m in enumerate(roots):
        a = t0 + i * every * BEAT
        if until is not None and a >= until: break
        put(I.pluck(F(m), vel, r, dur=0.8, bright=0.25, pos=0.3), a, 1.0, -0.1)

# Viking theme (D dorian), 16 beats
THEME = [(0, 62, 1), (1, 65, .5), (1.5, 67, .5), (2, 69, 1.5), (4, 72, 1), (5, 71, .5), (5.5, 69, .5), (6, 67, 2),
         (8, 69, 1), (9, 67, .5), (9.5, 65, .5), (10, 64, 1), (11, 65, 1), (12, 62, 3)]

# hook: drum pulse, lyre ostinato and the fife theme; cut for the flash
a, b = 0.0, T["but1"] - 0.1
drum(a + 0.05, b, 0.45, (1, 0, 0.5, 0.5, 1, 0, 0.6, 0))
pluck_line([(i * 0.5, [50, 57, 62, 57][i % 4], 0.5) for i in range(int((b - a) / (BEAT * 0.5)))], a, 0.35, 0.2, 0.5, 11, until=b)
fife_line(THEME, a + 0.3, 0.42, until=b)
pads([[38, 45, 50]], a, beats_each=12, vel=0.16, warm=500, until=b)
cue(0, "music: drum + lyre + fife theme (hook)")
# storm flash: low drone + timpani roll into 'killed'
a, b = SH["stormFlash"]
put(I.pad([F(38), F(39), F(45)], b - a, 0.22, rng(12), att=0.1, rel=0.4, warm=350), a)
r = rng(13)
for i in range(int((T["killed"] - a) / 0.1)):
    put(I.timpani(F(38), 0.1 + 0.5 * i / max(1, (T["killed"] - a) / 0.1), r, dur=0.4), a + i * 0.1, 0.5)
put(I.timpani(F(33), 1.0, r, dur=2.0), T["killed"] - 0.03, 1.0)
cue(T["killed"], "music: timpani hit on 'killed'")
# Greenland: cold, light: glock + pizz over a drone, the sailors' story gets a rising line; 'join' gets a brass lift
a, b = SH["greenland"][0], T["big"] - 0.05
pads([[50, 57, 64], [48, 55, 62], [46, 53, 62], [45, 52, 61]] * 3, a, beats_each=4, vel=0.13, warm=900, until=b)
COLD = [(0, 74, 1), (1, 69, 1), (2, 72, 1), (3, 69, 1), (4, 67, 1), (5, 69, 1), (6, 62, 2)]
glock_line(COLD, a + 0.1, 0.3, 0.25, 21, until=SH["sailors"][0])
TALE = [(0, 62, .5), (.5, 64, .5), (1, 65, .5), (1.5, 67, .5), (2, 69, 1), (3, 71, 1), (4, 72, .5), (4.5, 74, .5), (5, 76, 2)]
pluck_line(TALE, SH["sailors"][0] + 0.1, 0.45, 0.15, 0.55, 22, until=T["forests1"])
for i, m in enumerate([81, 84, 86, 88, 91]): put(I.musicbox(F(m), 0.4, rng(23)), T["forests1"] - 0.2 + i * 0.07, 1.0, 0.3 - 0.12 * i)
cue(T["forests1"], "music: sparkle on 'forests'")
drum(T["join"] - 0.2, b, 0.4, (1, 0, 1, 0))
put(I.brass(F(50), 0.9, 0.55, rng(24), kind="horn"), T["join"] - 0.05, 0.6, 0.1)
put(I.brass(F(57), 0.9, 0.55, rng(25), kind="horn"), T["expedition"] + 0.05, 0.6, 0.1)
# 'big mistake': music stops dead; tuba raspberry
put(I.brass(F(31), 0.8, 0.7, rng(26), kind="tuba", scoop=-60), T["mistake"] + 0.25, 0.8)
cue(T["mistake"], "music: stop + tuba on 'mistake'")
# crossing: rowing pulse that grows into the storm
a, b = SH["crossing"][0] + 0.1, T["then"] - 0.15
drum(a, b, 0.35, (1, 0, 0.5, 0, 0.8, 0, 0.5, 0.4), seed=31)
bass([38, 38, 41, 43, 38, 38, 36, 36, 38, 38, 41, 43, 45, 45, 43, 41], a, 0.5, until=b)
pads([[50, 57, 62], [48, 55, 60], [46, 53, 58], [45, 52, 57]] * 3, a, beats_each=4, vel=0.14, warm=700, until=b)
pluck_line(THEME, a + 4 * BEAT, 0.4, 0.15, 0.4, 32, until=T["battling"])
put(I.pad([F(38), F(44), F(50)], b - T["battling"], 0.25, rng(33), att=0.3, rel=0.3, warm=500), T["battling"])
r = rng(34)
for i in range(int((b - T["battling"]) / 0.125)): put(I.timpani(F(36), 0.2 + 0.35 * i / 30, r, dur=0.4), T["battling"] + i * 0.125, 0.5)
put(I.cymbal(0.6, rng(35), dur=2.0), T["storms"] - 0.03, 0.6)
# LAND!: silence on 'then suddenly', fanfare on LAND
a = T["land"]
for i, (m, d) in enumerate([(62, 0.3), (69, 0.3), (74, 1.4)]):
    put(I.brass(F(m), d, 0.75, rng(40 + i), kind="horn"), a - 0.05 + i * 0.22, 0.75, 0.0)
put(I.cymbal(0.7, rng(43), dur=2.4), a - 0.03, 0.7, 0.3)
put(I.timpani(F(38), 0.9, rng(44)), a - 0.03, 0.9)
cue(a, "music: fanfare on 'LAND'")
# new world: bright adventure, the theme on lyre + glock with brushes, hammering on the beat
a, b = T["step"] - 0.1, T["but2"] - 0.1
k = 0; t0 = a
while t0 < b - 0.3:
    pluck_line(THEME, t0, 0.5, 0.15, 0.6, 50 + k, until=b)
    if t0 > T["there"] - 1: glock_line(THEME, t0, 0.2, 0.3, 60 + k, until=b)
    bass([50, 50, 48, 48, 46, 46, 45, 45], t0, 0.45, until=b)
    t0 += 16 * BEAT; k += 1
pads([[50, 57, 62, 66], [48, 55, 60, 64], [46, 53, 58, 62], [45, 52, 57, 61]] * 3, a, beats_each=4, vel=0.12, warm=1000, until=b)
drum(T["help"] - 0.1, b, 0.3, (1, 0, 0.6, 0))
# problem / not alone: a held low note, a creeping pizz, a sting on 'alone'
a = T["but2"]
put(I.pad([F(38), F(45)], T["indigenous"] - a, 0.18, rng(70), att=0.1, rel=0.4, warm=400), a)
pluck_line([(0, 50, .5), (1, 51, .5), (2, 50, .5), (3, 51, .5)], a + 0.2, 0.35, 0.0, 0.3, 71, until=T["alone"])
put(I.pad([F(61), F(62), F(68)], 1.4, 0.3, rng(72), att=0.03, rel=0.8, warm=1400), T["alone"] - 0.04)
put(I.timpani(F(37), 0.7, rng(73)), T["alone"] - 0.04, 0.8)
cue(T["alone"], "music: sting on 'alone'")
# the people of the land: calm warm chords and a gentle flute line
a, b = T["indigenous"] - 0.1, T["encounters"] - 0.1
pads([[50, 57, 62, 66], [47, 54, 59, 62]], a, beats_each=3, vel=0.18, warm=900, until=b)
fife_line([(0, 69, 1), (1, 71, 1), (2, 74, 2), (4, 71, 1), (5, 69, 1)], a + 0.2, 0.3, 0.2, 80, until=b)
# tension: low drum heartbeat + dissonant pad, hit on 'dangerous'
a, b = T["encounters"] - 0.1, SH["tension"][1]
drum(a, b, 0.35, (1, 0, 0, 0.6, 0, 0, 0, 0), seed=81, f=38)
put(I.pad([F(38), F(44), F(51)], b - a, 0.2, rng(82), att=0.6, rel=0.4, warm=450), a)
put(I.timpani(F(33), 1.0, rng(83), dur=2.5), T["dangerous"] - 0.03, 1.0)
cue(T["dangerous"], "music: hit on 'dangerous'")
# heading home: melancholic lyre, the theme slowed down, swelling at 'sail'
a, b = T["with"] - 0.05, T["a1000"] - 0.05
pluck_line([(0, 74, 1), (1, 72, 1), (2, 69, 1), (3, 67, 1), (4, 65, 2), (6, 62, 2)], a, 0.38, 0.2, 0.35, 90, until=T["sail"])
pads([[50, 53, 57], [46, 50, 53], [43, 50, 55], [45, 49, 52]], a, beats_each=4, vel=0.16, warm=700, until=b)
fife_line([(0, 62, 1), (1, 65, 1), (2, 69, 2), (4, 67, 1), (5, 65, 1)], T["sail"] - 0.1, 0.38, -0.1, 91, until=b)
# a thousand years later: time-lapse shimmer, then a curious pizz for the dig, sting on 1021
put(I.pad([F(62), F(69), F(74), F(78)], 1.8, 0.2, rng(100), att=0.4, rel=0.6, warm=2000), T["a1000"])
for i, m in enumerate([86, 81, 78, 74, 69, 66]): put(I.musicbox(F(m), 0.35, rng(101)), T["a1000"] + i * 0.18, 1.0, 0.3 - 0.12 * i)
a, b = T["archaeologists"] - 0.1, T["you60"] - 0.1
TIP = [(0, 65, .5), (1, 69, .5), (2, 72, .5), (3, 69, .5), (4, 67, .5), (5, 70, .5), (6, 74, .5), (7, 70, .5)]
for rep in range(4):
    t0 = a + rep * 8 * BEAT
    pluck_line(TIP, t0, 0.4, 0.2, 0.5, 110 + rep, until=T["y1021"] - 0.1)
    bass([41, 41, 43, 43], t0, 0.38, until=T["y1021"] - 0.1)
for i, m in enumerate([74, 78, 81, 86]): put(I.glock(F(m), 0.45, rng(112)), T["y1021"] - 0.08 + i * 0.08, 1.0, 0.2)
put(I.pad([F(50), F(57), F(62), F(66)], b - T["y1021"], 0.18, rng(113), att=0.05, rel=0.5, warm=1200), T["y1021"])
cue(T["y1021"], "music: sparkle on '1021'")
# the extraordinary voyage: full theme, warm and wide
a, b = T["you60"] - 0.05, T["and68"] - 0.1
pads([[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]] * 2, a, beats_each=4, vel=0.2, warm=1100, until=b)
fife_line(THEME, T["but3"] - 0.1, 0.45, -0.1, 120, until=b)
pluck_line([(i * 0.5, [50, 57, 62, 57][i % 4], 0.5) for i in range(32)], T["but3"] - 0.1, 0.32, 0.25, 0.5, 121, until=b)
drum(T["but3"] - 0.1, b, 0.35, (1, 0, 0.5, 0.5, 1, 0, 0.6, 0), seed=122)
put(I.cymbal(0.4, rng(123), dur=2.0), T["extraordinary"] - 0.03, 0.5, 0.3)
bass([50, 50, 47, 47, 43, 43, 45, 45], T["but3"] - 0.1, 0.45, until=b)
# ending: little deadpan pizz, a shrug on 'idea', final chord on 'history'
a = T["and68"]
pluck_line([(0, 69, .5), (1, 65, .5), (2, 62, .5), (3, 65, .5)], a + 0.1, 0.35, 0.2, 0.4, 130, until=T["idea"])
put(I.brass(F(41), 0.35, 0.5, rng(131), kind="tuba", scoop=-30), T["idea"] - 0.02, 0.6)
put(I.brass(F(36), 0.5, 0.5, rng(132), kind="tuba", scoop=-30), T["idea"] + 0.35, 0.6)
pads([[50, 57, 62, 66]], T["history"] - 0.05, beats_each=6, vel=0.25, warm=900)
fife_line([(0, 74, 3)], T["history"] - 0.05, 0.35, 0.0, 133)
put(I.timpani(F(38), 0.6, rng(134), dur=3.0), T["history"] - 0.03, 0.8)

ir = make_ir(1.5, 5)
mus = 0.8 * mus + 0.25 * convolve_st(mus, ir)[:, :N]

# ---------------------------------------------------------------- SFX
sfx = np.zeros((2, N))
def fx(x, t, g=1.0, p=0.0, what=None):
    x = np.asarray(x)
    if t >= DUR: return
    place(sfx, pan(x, p) if x.ndim == 1 else x, max(0.0, t), g)
    if what: cue(t, what)

def thump(r, f0=55, dur=0.6, g=1.0):
    t = tt(dur)
    y = np.sin(2 * np.pi * f0 * t * (1 + 0.5 * np.exp(-t / 0.03))) * np.exp(-t / 0.18)
    y += lp(r.standard_normal(len(t)), 600) * np.exp(-t / 0.05) * 0.6
    return fades(y * g, 0.001, 0.05)
def crackle(dur, r, density=14):
    n = ns(dur); y = np.zeros(n); t = 0.0
    while t < dur - 0.05:
        k = hp(r.standard_normal(ns(0.012)), 1800) * np.exp(-tt(0.012) / 0.002) * r.uniform(0.2, 1.0)
        i = ns(t); y[i:i + len(k)] += k[: n - i]; t += r.exponential(1 / density)
    return y + lp(colored(n, r, 1.0), 300) * 0.25
def exhale(r, dur=0.9, g=1.0):
    n = ns(dur); t = np.arange(n) / SR
    return fades(bp(colored(n, r, 0.3), 500, 3000) * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5 * g, 0.01, 0.05)
def thunder(r, dur=3.0, g=1.0):
    n = ns(dur); t = np.arange(n) / SR
    crack = hp(r.standard_normal(n), 800) * np.exp(-t / 0.06) * 0.6
    roll = lp(colored(n, r, 1.5), 180) * (1 - np.exp(-t / 0.05)) * np.exp(-t / 1.0) * (1 + 0.6 * smooth_noise(n, r, 6))
    return fades((crack + roll * 2.5) * g, 0.002, 0.3)
def rain(dur, r, g=1.0):
    n = ns(dur)
    w = widen(bp(colored(n, r, 0.5), 400, 3000) * 0.25 * g, r)[:, :n]
    return st(hp(colored(n, r, 0.2), 1500) * 0.35 * g) + w
def surf(dur, r, g=1.0, rate=0.12):
    return G.water_bed(dur, r, close=0.6, slosh_rate=rate) * g
def snow_step(r):
    return fades(lp(r.standard_normal(ns(0.14)), 1400) * np.exp(-tt(0.14) / 0.035) * 0.4, 0.002, 0.02)
def pebble_step(r):
    k = np.zeros(ns(0.18))
    for j in range(6):
        c = bp(r.standard_normal(ns(0.02)), 1500, 6000) * np.exp(-tt(0.02) / 0.004) * r.uniform(0.3, 0.8)
        i = ns(r.uniform(0, 0.12)); k[i:i + len(c)] += c
    return k + lp(r.standard_normal(len(k)), 500) * np.exp(-tt(0.18) / 0.03) * 0.4
def pop(r):
    t = tt(0.12)
    return fades(np.sin(2 * np.pi * 600 * t * (1 + 3 * t)) * np.exp(-t / 0.02) * 0.6, 0.0005, 0.02)
def ding(r, f=2100):
    t = tt(1.4)
    return fades(sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t / d) for k, a, d in [(1, 1, 0.6), (2.76, 0.4, 0.3), (5.4, 0.2, 0.15)]) * 0.4, 0.001, 0.1)

r = rng(200)
TF = lambda fr: fr / FPS
# open water under every sea / coast shot
for sid in ("hook", "land", "voyage", "sailBack"):
    a, b = SH[sid]; fx(surf(b - a, r, 0.8), a, what=f"sea ({sid})")
for sid in ("hook", "voyage", "crossing", "land", "sailBack"):
    a, b = SH[sid]
    for tm in np.arange(a + 0.6, b - 0.5, 2.3): fx(G.creak(0.7, r, 70, 120) * 0.18, tm, 1.0, 0.3 * np.sin(tm))
cue(SH["hook"][0] + 0.6, "hull creaks")
# white flash + storm
fx(G.whoosh(0.7, r, peak=0.45, f_lo=500, f_hi=4000) * 0.6, TF(TL["flash"]) - 0.5, what="flash whoosh")
for sid, g in (("stormFlash", 1.0), ("mistake", 0.4)):
    a, b = SH[sid]; fx(rain(b - a, r, g), a); fx(G.breeze(b - a, r, 0.25 * g, bright=600), a); fx(surf(b - a, r, 1.2 * g, 0.25), a)
a, b = SH["crossing"]; st0 = T["battling"] - 0.4
fx(rain(b - st0, r, 1.0), st0, what="storm rain + wind"); fx(G.breeze(b - st0, r, 0.3, bright=600), st0); fx(surf(b - a, r, 1.0, 0.18), a)
for fr in TL["lightning"]: fx(thunder(r, 3.0, 0.9), TF(fr) + 0.05, what="thunder")
fx(G.splash_big(r) * 0.7, T["killed"] - 0.1, what="wave over the side (killed)")
fx(G.splash_big(r) * 0.9, T["mistake"] - 0.25, what="wave hits (mistake)")
fx(G.splash_big(r) * 0.8, T["waves"] - 0.1, what="wave splash (waves)")
# Greenland: wind, footsteps in snow, the longhouse smoke and the fire
a, b = SH["greenland"]; fx(G.breeze(b - a, r, 0.18, bright=800), a, what="Greenland wind")
for tm in np.arange(a + 0.3, b, 0.9): fx(snow_step(r), tm, 0.5, -0.3)
for i in range(3): fx(exhale(r, 0.6, 0.35), T["freezing1"] + i * 1.1, 1.0, 0.2)
for sid in ("sailors", "end"):
    a, b = SH[sid]; fx(widen(crackle(b - a, r) * 0.55, r), a, what=f"fire crackle ({sid})"); fx(G.breeze(b - a, r, 0.07, bright=700), a)
fx(pop(r), T["mysterious"] - 0.1, 1.0, 0.3, "dream bubble pops up")
a, b = SH["join"]
for tm in np.arange(a + 0.1, b - 0.3, 0.42): fx(G.stroll_step(r, 0.3) * 0.6, tm, 1.0, 0.1)
fx(G.breeze(b - a, r, 0.12, bright=800), a); fx(surf(b - a, r, 0.5), a)
# 'LAND!': crew whoa
fx(G.whoa(r, base=150) * 0.5, T["land"] + 0.35, 1.0, -0.3, "crew whoa (LAND)")
# the new coast: birds, breeze, surf; the step onto the pebbles; the stream; logs; hammers
for sid in ("step", "forest", "build", "problem", "notAlone", "supplies", "dig", "evidence"):
    a, b = SH[sid]; fx(G.bird_chirps(b - a, r, 0.5 if sid not in ("problem", "notAlone") else 0.25), a, 0.5, 0.4); fx(G.breeze(b - a, r, 0.06, bright=1200), a)
    fx(surf(b - a, r, 0.35, 0.1), a)
fx(pebble_step(r) * 1.2, TF(TL["T"]["step"] - 3 + 10) + 0.03, 1.0, 0.0, "boots on pebbles (step)")
fx(pebble_step(r), TF(TL["T"]["step"] - 3 + 10) + 0.35, 1.0, 0.1)
fx(G.bubbles(1.8, r, 22, 300, 1500) * 0.25, T["water"] - 0.2, 1.0, -0.4, "stream (water)")
fx(thump(r, 70, 0.5, 0.5), T["timber"] - 0.05, 1.0, 0.0, "log on shoulder (timber)")
a, b = SH["build"]
for fr in range(TL["shots"][[s["id"] for s in TL["shots"]].index("build")]["a"], TL["shots"][[s["id"] for s in TL["shots"]].index("build")]["b"]):
    if fr % 14 == 13: fx(G.hammer_hit(r, 0.8), TF(fr), 0.7, -0.15)
    if (fr + 6) % 16 == 15: fx(G.hammer_hit(r, 0.6), TF(fr), 0.45, 0.3)
cue(a, "hammering on the shelter")
fx(G.whoosh(0.4, r, peak=0.2, f_lo=300, f_hi=1500, tail=0.15) * 0.3, T["alone"] - 0.1, what="head turn (alone)")
# the camp: fire, quiet voices
for sid in ("indigenous", "notFirst"):
    a, b = SH[sid]; fx(widen(crackle(b - a, r) * 0.45, r), a); fx(G.bird_chirps(b - a, r, 0.3), a, 0.4, -0.4)
    fx(surf(b - a, r, 0.3), a)
# tension: wind rises
a, b = SH["tension"]; fx(G.breeze(b - a, r, 0.22, bright=600), a, what="wind rises (tension)"); fx(surf(b - a, r, 0.4), a)
# supplies: knock on the empty barrel
for j in range(2): fx(thump(r, 140, 0.25, 0.4) + 0, T["limited"] + 0.1 + j * 0.18, 1.0, 0.2, "empty barrel knocks" if j == 0 else None)
fx(G.flag_flutter(1.5, r) * 0.4, T["sail"] - 0.1, 1.0, 0.0, "sail fills")
# a thousand years: time-lapse whoosh; the dig: brushes, wind, flag
fx(G.whoosh(1.6, r, peak=1.0, f_lo=200, f_hi=2500, tail=0.4) * 0.5, T["a1000"] - 0.2, what="time-lapse whoosh")
a, b = SH["dig"]
for tm in np.arange(a + 0.2, b, 0.4): fx(bp(r.standard_normal(ns(0.18)), 2000, 7000) * np.exp(-tt(0.18) / 0.06) * 0.12, tm, 1.0, 0.3)
fx(G.flag_flutter(b - a, r) * 0.25, a, 1.0, 0.4, "flag flutters")
fx(ding(r), T["y1021"] - 0.05, 0.6, 0.2, "discovery ding (1021)")
fx(G.whoa(r, base=190) * 0.35, T["confirms"] + 0.2, 1.0, 0.0)
# the end: a slurp and a chew, a little gulp on 'idea'
for i in range(5): fx(bp(r.standard_normal(ns(0.08)), 300, 1500) * np.exp(-tt(0.08) / 0.02) * 0.25, T["craziest"] + i * 0.4, 1.0, 0.1)
fx(thump(r, 180, 0.2, 0.3), T["idea"] + 0.1, 0.4, 0.0, "gulp (idea)")

# ---------------------------------------------------------------- mix
voice, _sr = read_wav(sys.argv[1])
if voice.ndim == 1: voice = st(voice)
v = np.zeros((2, N)); v[:, : min(N, voice.shape[1])] = voice[:, :N]
key = np.zeros(N)
for w in WORDS: key[ns(w["s"]): ns(w["e"] + 0.15)] = 1
from scipy import ndimage
key = ndimage.uniform_filter1d(key, ns(0.25))
duck = dbg(-4.0 * key)
VL = integrated(v)
def to_lufs(x, target):
    L = integrated(x)
    return x * dbg(target - L) if np.isfinite(L) else x
mus = to_lufs(mus, VL - 6.0) * duck[None, :]
sfx = to_lufs(sfx, VL - 12.0)
mix = v + mus + sfx
mix = to_lufs(mix, -15.0)
ceil = dbg(-1.2)
from scipy import signal
up = signal.resample_poly(mix, 4, 1, axis=1)
pk = np.abs(up).max(axis=0).reshape(-1, 4).max(axis=1)[:N]
g = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
g = ndimage.minimum_filter1d(g, ns(0.005))
g = ndimage.uniform_filter1d(g, ns(0.005))
g = np.minimum(g, ndimage.minimum_filter1d(np.minimum(1.0, ceil / np.maximum(pk, 1e-9)), 3))
mix = mix * g[None, :]
mix[:, -ns(0.4):] *= np.linspace(1, 0, ns(0.4))[None, :]
out = sys.argv[2]
os.makedirs(os.path.dirname(out), exist_ok=True)
write_wav(out, mix)
for nm, x in (("voice", v), ("music", mus), ("sfx", sfx)): write_wav(os.path.join(os.path.dirname(out), f"stem_{nm}.wav"), x)
with open(os.path.join(os.path.dirname(out), "cues.md"), "w") as fh:
    fh.write(f"# Cues\n\nLength {DUR:.3f} s, 48 kHz stereo. Integrated {integrated(mix):.1f} LUFS, true peak {true_peak(mix):.1f} dBTP.\n\n")
    for t, w in sorted(cues): fh.write(f"- {t:6.2f} s  {w}\n")
print("done", DUR, integrated(mix), true_peak(mix))
