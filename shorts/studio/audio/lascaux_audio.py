# Sound for "Lukisan yang Hampir Mati karena Napas": an original score (plucked strings, glockenspiel, warm pads,
# soft timpani; D minor / F major, 100 bpm) that follows the picture section by section, a synthesized SFX stem placed
# on the shot plan (timeline.json, exported from story.ts), and the mix: voice untouched, music ducked under speech,
# master to -15 LUFS integrated with a <= -1.2 dBTP ceiling. Writes mix.wav + stems + cues.md.
import json, os, sys
import numpy as np
from dsp import SR, ns, tt, rng, lp, hp, bp, pan, place, st, fades, dbg, integrated, true_peak, read_wav, write_wav, make_ir, convolve_st, colored, smooth_noise, widen
import instruments as I
import sfx_gen as G

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, "timeline.json")))
FPS = TL["fps"]
DUR = TL["total"] / FPS
N = ns(DUR)
T = {k: v / FPS for k, v in TL["T"].items()}
SH = {s["id"]: (s["a"] / FPS, s["b"] / FPS) for s in TL["shots"]}
WORDS = TL["words"]
F = I.m2f
BEAT = 0.6
cues = []

def cue(t, what): cues.append((t, what))

# ---------------------------------------------------------------- music
mus = np.zeros((2, N))
def put(x, t, g=1.0, p=0.0):
    x = np.asarray(x)
    place(mus, pan(x, p) if x.ndim == 1 else x, t, g)

def pluck_line(notes, t0, vel=0.5, p=0.0, bright=0.45, seed=1):
    r = rng(seed)
    for (b, m, d) in notes:  # beat offset, midi, length in beats
        put(I.pluck(F(m), vel * r.uniform(0.85, 1.05), r, dur=max(0.35, d * BEAT * 1.4), bright=bright), t0 + b * BEAT, 1.0, p)

def glock_line(notes, t0, vel=0.35, p=0.25, seed=2, fn=I.glock):
    r = rng(seed)
    for (b, m, d) in notes:
        put(fn(F(m), vel * r.uniform(0.85, 1.05), r), t0 + b * BEAT, 1.0, p)

def pads(chords, t0, beats_each=4, vel=0.22, warm=800):
    r = rng(7)
    for i, ch in enumerate(chords):
        put(I.pad([F(m) for m in ch], beats_each * BEAT, vel, r, att=0.5, rel=0.8, warm=warm), t0 + i * beats_each * BEAT)

def bass_walk(roots, t0, vel=0.55, every=1, seed=3, until=None):
    r = rng(seed)
    for i, m in enumerate(roots):
        tt0 = t0 + i * every * BEAT
        if until is not None and tt0 >= until: break
        put(I.pluck(F(m), vel, r, dur=0.6, bright=0.25, pos=0.3), tt0, 1.0, -0.1)

def brushes(t0, t1, vel=0.22, seed=4):
    r = rng(seed); t = t0; k = 0
    while t < t1:
        put(I.brush(vel * (1.0 if k % 2 == 0 else 0.7), r, swish=(k % 4 == 3)), t, 1.0, 0.2); t += BEAT / 2; k += 1

# hook: mystery, two pad chords + a falling glock motif; stops for the flash
a, b = SH["hook"][0], T["prancis"]
pads([[50, 57, 62, 65], [46, 53, 58, 65]], a + 0.05, beats_each=6, vel=0.2)
glock_line([(0, 74, 1), (1.5, 72, 1), (2, 69, 1), (4, 74, 1), (5.5, 77, 1), (6, 76, 2)], a + 0.3)
put(I.timpani(F(38), 0.6, rng(9)), T["hancur"] - 0.05, 0.8)
cue(T["hancur"], "music: timpani on 'hancur'")

# ice age: playful 'cave' pizzicato theme in D dorian over a hand-drum pulse, until the rocks fall
a, b = T["prancis"], T["tertimbun"]
THEME = [(0, 62, .5), (.5, 65, .5), (1, 67, 1), (2, 69, .5), (2.5, 67, .5), (3, 65, 1), (4, 62, .5), (4.5, 64, .5), (5, 65, .5), (5.5, 67, .5), (6, 69, 2),
         (8, 72, .5), (8.5, 69, .5), (9, 67, 1), (10, 65, .5), (10.5, 67, .5), (11, 69, 1), (12, 67, .5), (12.5, 65, .5), (13, 64, .5), (13.5, 62, .5), (14, 62, 2)]
pluck_line([n for n in THEME if a + n[0] * BEAT < b - 0.3], a, vel=0.55, p=0.15, bright=0.55, seed=11)
bass_walk([38, 45, 38, 45, 43, 45, 38, 45, 41, 45, 43, 45, 38, 45, 38, 45], a, vel=0.5, until=b - 0.2)
r = rng(12)
tm = a
while tm < b - 0.2:
    put(I.timpani(F(50), 0.25, r, dur=0.6), tm, 0.5, -0.3); tm += BEAT
glock_line([(0, 81, 1)], T["kuda"] - 0.1, 0.3); glock_line([(0, 79, 1)], T["rusa"] - 0.1, 0.3); glock_line([(0, 86, 1), (0.5, 81, 1)], T["banteng"] - 0.1, 0.45)
pads([[50, 57, 62], [48, 55, 60], [46, 53, 62], [45, 52, 61]], T["seorang"], beats_each=4, vel=0.14)

# seal + dark + ages: a low drone; the music stops for "gelap... sunyi"
a = T["tertimbun"]
put(I.timpani(F(33), 0.9, rng(13), dur=3.0), a + 0.25, 1.0)
put(I.pad([F(38), F(45)], T["gelap"] - a, 0.2, rng(14), att=0.2, rel=0.6, warm=400), a)
put(I.pad([F(38), F(41), F(45)], T["t1940"] - T["ribuan"] + 0.4, 0.18, rng(15), att=0.8, rel=0.5, warm=600), T["ribuan"])

# 1940: curious tiptoe theme (pizz + glock), sparkle on the discovery
a, b = T["t1940"], T["t1948"]
TIP = [(0, 65, .5), (1, 69, .5), (2, 72, .5), (3, 69, .5), (4, 67, .5), (5, 70, .5), (6, 74, .5), (7, 70, .5)]
for rep in range(4):
    t0 = a + rep * 8 * BEAT
    if t0 > T["menemukan"] - 0.5: break
    pluck_line([n for n in TIP if t0 + n[0] * BEAT < T["menemukan"] - 0.2], t0, 0.45, 0.2, 0.5, 20 + rep)
    bass_walk([41, 41, 41, 41, 43, 43, 43, 43], t0, 0.4, until=T["menemukan"] - 0.2)
r = rng(21)
for i, m in enumerate([77, 81, 84, 86, 89, 93]):
    put(I.musicbox(F(m), 0.4, r), T["galeri"] - 0.4 + i * 0.09, 1.0, 0.3 - 0.12 * i)
pads([[53, 60, 65, 69], [50, 57, 62, 65]], T["menemukan"], beats_each=5, vel=0.18)

# 1948 -> crowd: the bouncy tourist march, layers added on 'datang' / 'banyak' / '1200'; hard stop before 'lalu dindingnya'
a, b = T["t1948"], T["lalu3"]
MARCH = [(0, 72, .5), (.5, 72, .5), (1, 74, .5), (1.5, 76, .5), (2, 77, 1), (3, 76, .5), (3.5, 74, .5), (4, 72, 1), (5, 69, 1), (6, 70, .5), (6.5, 72, .5), (7, 74, 1)]
k = 0; t0 = a
while t0 < b - 0.4:
    lvl = 0.35 if t0 < T["datang"] else 0.45 if t0 < T["banyak"] else 0.55 if t0 < T["n1200"] else 0.65
    pluck_line([n for n in MARCH if t0 + n[0] * BEAT < b - 0.3], t0, lvl, 0.15, 0.55, 30 + k)
    if t0 > T["banyak"] - 1: glock_line([n for n in MARCH if t0 + n[0] * BEAT < b - 0.3], t0, 0.18, 0.35, 40 + k)
    bass_walk([41, 48, 41, 48, 46, 48, 41, 48], t0, 0.5, until=b - 0.3)
    t0 += 8 * BEAT; k += 1
brushes(T["datang"], b - 0.3, 0.2)
for kk in ("datang", "banyak", "n1200"):
    put(I.cymbal(0.25, rng(50), dur=1.4), T[kk] - 0.03, 0.5, 0.4)

# the wall turns green: a sour cluster sting on 'hijau'
put(I.pad([F(61), F(62), F(68)], 1.8, 0.35, rng(51), att=0.05, rel=1.0, warm=1400), T["hijau"] - 0.05)
put(I.timpani(F(37), 0.7, rng(52)), T["hijau"] - 0.04, 0.9)
cue(T["hijau"], "music: sting on 'hijau'")

# deadpan: tiptoe pizz under 'untungnya', tuba raspberry on the breath
a = T["untungnya"]
pluck_line([(0, 69, .5), (1, 65, .5), (2, 62, .5), (3, 65, .5), (4, 69, .5), (5, 65, .5)], a + 0.1, 0.35, 0.2, 0.4, 60)
put(I.brass(F(36), 0.9, 0.7, rng(61), kind="tuba", scoop=-60), T["napas2"] + 0.05, 0.9)
put(I.brass(F(31), 0.6, 0.6, rng(62), kind="tuba", scoop=-40), T["napas2"] + 0.75, 0.8)

# explanation: soft minor groove through the car and the cave greenhouse
a, b = T["napas3"], T["t1963"]
GROOVE = [(0, 62, 1), (1.5, 65, .5), (2, 69, 1), (3, 67, 1), (4, 65, 1), (5.5, 64, .5), (6, 62, 2)]
k = 0; t0 = a
while t0 < b - 0.5:
    pluck_line([n for n in GROOVE if t0 + n[0] * BEAT < b - 0.4], t0, 0.38, 0.15, 0.4, 70 + k)
    bass_walk([38, 45, 41, 45, 34, 41, 33, 40], t0, 0.42, until=b - 0.4)
    t0 += 8 * BEAT; k += 1
pads([[50, 57, 62, 65], [46, 53, 58, 62], [43, 50, 58, 62], [45, 52, 57, 61]] * 3, a, beats_each=4, vel=0.11)
put(I.vibes(F(81), 0.4, rng(71)), T["berembun"] - 0.05, 0.6, 0.3)
put(I.vibes(F(74), 0.35, rng(72)), T["alga"] - 0.05, 0.6, -0.3)
put(I.vibes(F(73), 0.35, rng(73)), T["jamur"] - 0.05, 0.6, 0.3)

# 1963: timpani roll into the gate slam, then silence
a = T["t1963"]
r = rng(80)
for i in range(int((T["ditutup"] - a) / 0.12)):
    put(I.timpani(F(38), 0.15 + 0.5 * i / max(1, (T["ditutup"] - a) / 0.12), r, dur=0.5), a + i * 0.12, 0.5)
put(I.timpani(F(33), 1.0, r, dur=2.5), T["ditutup"] - 0.02, 1.0)

# replica: the march again, cheerful and brighter, a little too happy
a, b = T["turis"], T["k17"]
pluck_line([n for n in MARCH if a + n[0] * BEAT < b - 0.2], a, 0.45, 0.15, 0.6, 90)
glock_line([n for n in MARCH if a + n[0] * BEAT < b - 0.2], a, 0.25, 0.35, 91)
bass_walk([41, 48, 41, 48, 46, 48], a, 0.45, until=b - 0.2)

# ending: warm 'aman' chord with the cave theme on music box, then minor for 'hampir habis', last low note rings out
a = T["k17"]
pads([[50, 57, 62, 66], [55, 59, 62, 67]], a, beats_each=4, vel=0.2, warm=900)
glock_line([(0, 74, 1), (0.5, 77, 1), (1, 79, 1), (2, 81, 2)], a + 0.2, 0.3, 0.2, 95, I.musicbox)
a = T["k15"]
pads([[50, 53, 57, 62], [46, 50, 53, 58]], a, beats_each=4, vel=0.22, warm=700)
glock_line([(0, 74, 1), (1, 72, 1), (2, 70, 1), (3, 69, 3)], a + 0.1, 0.3, -0.2, 96)
put(I.timpani(F(38), 0.8, rng(97), dur=3.5), T["habis"] + 0.35, 1.0)
put(I.pad([F(38), F(45), F(50)], 2.2, 0.25, rng(98), att=0.02, rel=1.4, warm=500), T["habis"] + 0.35)

ir = make_ir(1.4, 5)
mus = 0.8 * mus + 0.25 * convolve_st(mus, ir)[:, :N]

# ---------------------------------------------------------------- SFX
sfx = np.zeros((2, N))
def fx(x, t, g=1.0, p=0.0, what=None):
    x = np.asarray(x)
    place(sfx, pan(x, p) if x.ndim == 1 else x, t, g)
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
    roar = lp(colored(n, r, 1.0), 300) * 0.25
    return y + roar

def exhale(r, dur=0.9, g=1.0):
    n = ns(dur); t = np.arange(n) / SR
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return fades(bp(colored(n, r, 0.3), 500, 3000) * env * g, 0.01, 0.05)

def drip(r, f=1300):
    t = tt(0.25)
    return fades(np.sin(2 * np.pi * f * t * (1 + 1.5 * t)) * np.exp(-t / 0.04) * 0.5, 0.0005, 0.02)

def hiss(dur, r):
    n = ns(dur); t = np.arange(n) / SR
    return fades(hp(colored(n, r, 0.0), 3000) * np.minimum(1, t / 0.15) * np.exp(-t / (dur * 0.7)), 0.01, 0.1)

def click(r):
    t = tt(0.05)
    return fades(bp(r.standard_normal(len(t)), 2000, 6000) * np.exp(-t / 0.004), 0.0002, 0.01)

def clang(r):
    t = tt(2.0)
    y = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, a, d in [(220, 1.0, 0.8), (553, 0.6, 0.5), (911, 0.4, 0.35), (1430, 0.25, 0.2)])
    return fades(y * 0.6 + thump(r, 70, 2.0, 0.6), 0.001, 0.1)

r = rng(100)
# torch crackle under every torch-lit cave shot
for sid in ("hook", "paint", "bullWide", "safe"):
    a, b = SH[sid]
    fx(widen(crackle(b - a, r) * 0.6, r), a, 1.0, what=f"torch crackle ({sid})")
a, b = SH["dark"]; fx(crackle(max(0.1, T["gelap"] - a + 0.2), r) * 0.25, a)
fx(G.whoosh(0.6, r, peak=0.05, f_lo=300, f_hi=900, tail=0.2) * 0.6, T["gelap"] - 0.1, 1.0, what="torch dies (gelap)")
for i, tm in enumerate(np.arange(T["sunyi"], T["ribuan"], 0.9)):
    fx(drip(r, 1100 + 300 * (i % 3)), tm + 0.1 * (i % 2), 0.5, 0.3 * (-1) ** i)
cue(T["sunyi"], "cave drips (sunyi)")
# breath in the flash-forward and the deadpan
a, b = SH["hookBreath"]
for i, tm in enumerate(np.arange(a + 0.3, b - 0.2, 0.55)):
    fx(exhale(r, 0.8, 0.3 + 0.25 * (tm > T["napas1"] - 0.2)), tm, 1.0, 0.5 * np.sin(i))
cue(T["napas1"], "breaths (bernapas 1)")
for i in range(6):
    fx(exhale(r, 1.1, 0.5), T["napas2"] - 0.05 + i * 0.05, 1.0, (i - 2.5) / 3)
cue(T["napas2"], "big exhale (bernapas 2)")
# white flash
fx(G.whoosh(0.7, r, peak=0.45, f_lo=500, f_hi=4000) * 0.6, T["prancis"] - 0.55, what="flash whoosh")
# ice-age wind + footsteps in snow
for sid in ("iceExt", "seal"):
    a, b = SH[sid]; fx(G.breeze(b - a, r, 0.12, bright=700), a, what=f"wind ({sid})")
a, b = SH["iceExt"]
for tm in np.arange(a + 0.1, b, 0.52):
    fx(lp(r.standard_normal(ns(0.12)), 1500) * np.exp(-tt(0.12) / 0.03) * 0.35, tm, 1.0, 0.1)
# painting dabs on each animal
for k in ("kuda", "rusa", "banteng"):
    for j in range(3):
        fx(bp(r.standard_normal(ns(0.08)), 800, 3000) * np.exp(-tt(0.08) / 0.02) * 0.4, T[k] - 0.1 + j * 0.07, 1.0, 0.2)
fx(thump(r, 60, 0.7, 0.6), T["banteng"] - 0.03, what="bull appears")
# rocks: one boom per landing (frames from world.ts: k0 + i*2 + 9, k0 = tertimbun - 3 frames)
k0 = TL["T"]["tertimbun"] - 3
for i in range(10):
    fx(thump(r, 45 + 6 * (i % 4), 0.9, 0.9), (k0 + i * 2 + 9) / FPS, 0.9, (i % 3 - 1) * 0.3)
cue((k0 + 9) / FPS, "rock landings x10")
# ages pass
fx(G.whoosh(1.6, r, peak=1.0, f_lo=200, f_hi=2500, tail=0.4) * 0.5, T["ribuan"] - 0.2, what="time-lapse whoosh")
# 1940 woods
for sid in ("timelapse", "dog", "marcel", "open", "close"):
    a, b = SH[sid]
    fx(G.breeze(b - a, r, 0.06, bright=1200), a)
    fx(G.bird_chirps(b - a, r, 0.6), a, 0.5, 0.4)
a = T["mengendus"]
for i in range(8):
    fx(bp(r.standard_normal(ns(0.07)), 1500, 5000) * np.exp(-tt(0.07) / 0.02) * 0.5, a + i * 0.15, 1.0, 0.2)
cue(a, "dog sniffs")
a, b = SH["marcel"]
for tm in np.arange(a + 0.2, T["merangkak"], 0.42):
    fx(lp(r.standard_normal(ns(0.1)), 900) * np.exp(-tt(0.1) / 0.025) * 0.45, tm, 1.0, -0.1)
fx(G.whoosh(0.9, r, peak=0.5, f_lo=150, f_hi=700, tail=0.3) * 0.5, T["merangkak"] + 0.1, what="crawls in")
# door creak, gate rattle + clang
fx(G.creak(1.0, r, 70, 140) * 0.35, T["dibuka"] - 0.1, 1.0, 0.0, "door creaks open")
fx(G.rattle(0.35, r, 40) * 0.4, (TL["T"]["ditutup"] - 3 - 10) / FPS, 1.0, 0.3)
fx(clang(r) * 0.9, (TL["T"]["ditutup"] - 3 + 9) / FPS, 1.0, 0.0, "gate clang (ditutup)")
# crowds: murmur grows with the head count
def murmur(dur, voices, r):
    out = np.zeros((2, ns(dur)))
    for v in range(voices):
        y = G.babble(dur, r, r.uniform(110, 230), r.uniform(0.9, 1.15))
        out += pan(lp(y, 2500), r.uniform(-0.8, 0.8)) / np.sqrt(voices)
    return out
a, b = SH["crowd"]
fx(murmur(T["banyak"] - a, 3, r) * 0.25, a)
fx(murmur(T["n1200"] - T["banyak"], 6, r) * 0.35, T["banyak"])
fx(murmur(b - T["n1200"], 10, r) * 0.45, T["n1200"], what="murmur grows")
a, b = SH["replica"]; fx(murmur(b - a, 6, r) * 0.3, a)
a, b = SH["hookBreath"]; fx(murmur(b - a, 5, r) * 0.18, a)
# car: windows misting (soft rising hiss) + engine idle
a, b = SH["car"]
n = ns(b - a); t = np.arange(n) / SR
fx(np.sin(2 * np.pi * 32 * t) * 0.15 * (1 + 0.3 * np.sin(2 * np.pi * 7 * t)) + lp(colored(n, r, 1.0), 200) * 0.2, a, what="engine idle")
fx(hiss(T["penumpang"] - T["seperti"] + 0.6, r) * 0.15, T["seperti"], what="windows mist up")
# greenhouse: steam, heat hum, lamp clicks, wet growth squelch
fx(hiss(1.4, r) * 0.45, T["uap"] - 0.05, what="steam (uap)")
n = ns(1.6); t = np.arange(n) / SR
fx(fades(np.sin(2 * np.pi * 100 * t) * 0.12 * np.minimum(1, t / 0.3), 0.01, 0.3), T["panas"] - 0.05, what="heat hum (panas)")
for j in range(4): fx(click(r) * 0.8, T["lampu"] - 0.1 + j * 0.06, 1.0, -0.6 + 0.4 * j, "lamp clicks (lampu)" if j == 0 else None)
fx(G.bubbles(1.2, r, 18) * 0.35, T["alga"] - 0.05, what="algae squelch")
fx(G.bubbles(1.2, r, 30, 200, 1200) * 0.4, T["jamur"] - 0.05, what="mould pops")
# 'dilap': a dry squeak of a cloth that never happens -> a little head-shake whoosh
fx(G.whoosh(0.4, r, peak=0.15, f_lo=600, f_hi=2500, tail=0.12) * 0.3, T["dilap"], what="head shake (dilap)")
# ending drips + low boom on 'habis'
for i, tm in enumerate(np.arange(T["k15"], DUR - 0.5, 1.1)): fx(drip(r, 900 + 200 * (i % 3)), tm, 0.35, 0.3 * (-1) ** i)
fx(thump(r, 40, 2.0, 1.0), T["habis"] + 0.3, what="end boom (habis)")

# ---------------------------------------------------------------- mix
voice, _sr = read_wav(sys.argv[1])
if voice.ndim == 1: voice = st(voice)
v = np.zeros((2, N)); v[:, : min(N, voice.shape[1])] = voice[:, :N]
# duck the music while words are spoken (word table, 120 ms attack / 300 ms release)
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
# simple look-ahead peak limiter to -1.2 dBTP (4x oversampled peak estimate)
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
write_wav(out, mix)
for nm, x in (("voice", v), ("music", mus), ("sfx", sfx)): write_wav(os.path.join(os.path.dirname(out), f"stem_{nm}.wav"), x)
with open(os.path.join(os.path.dirname(out), "cues.md"), "w") as fh:
    fh.write(f"# Cues\n\nLength {DUR:.3f} s, 48 kHz stereo. Integrated {integrated(mix):.1f} LUFS, true peak {true_peak(mix):.1f} dBTP.\n\n")
    for t, w in sorted(cues): fh.write(f"- {t:6.2f} s  {w}\n")
print("done", DUR, integrated(mix), true_peak(mix))
