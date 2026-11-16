# Sound for "You're a Doctor in 1348": an original score in A aeolian/dorian (lute, recorder, drones, frame drum,
# church bell, low brass for the deadpan beats; 100 bpm) following the picture section by section, a synthesized SFX stem
# placed on the shot plan (plague_timeline.json, exported from story.ts), and the mix: voice untouched, music ducked
# under speech, master to -15 LUFS integrated with a <= -1.2 dBTP ceiling. Writes mix.wav + stems + cues.md.
import json, os, sys
import numpy as np
from dsp import SR, ns, tt, rng, lp, hp, bp, pan, place, st, fades, dbg, integrated, true_peak, read_wav, write_wav, make_ir, convolve_st, colored, smooth_noise, widen
import instruments as I
import sfx_gen as G

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, "plague_timeline.json")))
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
B = lambda w: T[w] - 3 / FPS   # visual beat of a word

# ---------------------------------------------------------------- music
mus = np.zeros((2, N))
def put(x, t, g=1.0, p=0.0):
    x = np.asarray(x)
    if t >= DUR: return
    place(mus, pan(x, p) if x.ndim == 1 else x, max(0.0, t), g)

def lute(notes, t0, vel=0.5, p=0.0, bright=0.45, seed=1, until=None):
    r = rng(seed)
    for (b, m, d) in notes:
        if until is not None and t0 + b * BEAT >= until: continue
        put(I.pluck(F(m), vel * r.uniform(0.85, 1.05), r, dur=max(0.35, d * BEAT * 1.4), bright=bright), t0 + b * BEAT, 1.0, p)

def recorder(notes, t0, vel=0.42, p=-0.15, seed=3, until=None):
    r = rng(seed)
    for (b, m, d) in notes:
        if until is not None and t0 + b * BEAT >= until: continue
        put(I.fife(F(m), d * BEAT * 0.95, vel * r.uniform(0.9, 1.05), r), t0 + b * BEAT, 0.8, p)

def glocks(notes, t0, vel=0.3, p=0.25, seed=2, fn=I.glock, until=None):
    r = rng(seed)
    for (b, m, d) in notes:
        if until is not None and t0 + b * BEAT >= until: continue
        put(fn(F(m), vel * r.uniform(0.85, 1.05), r), t0 + b * BEAT, 1.0, p)

def pads(chords, t0, beats_each=4, vel=0.18, warm=800, until=None):
    r = rng(7)
    for i, ch in enumerate(chords):
        a = t0 + i * beats_each * BEAT
        if until is not None and a >= until: break
        d = beats_each * BEAT if until is None else min(beats_each * BEAT, until - a + 0.3)
        put(I.pad([F(m) for m in ch], d, vel, r, att=0.4, rel=0.8, warm=warm), a)

def drum(t0, t1, vel=0.35, pattern=(1, 0, 0.6, 0), seed=4, f=45):
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

def bell(f=196.0, dur=4.0, g=1.0):
    """church bell: hum, prime, minor third, fifth, nominal partials, each with its own decay"""
    t = tt(dur)
    parts = [(0.5, 0.5, 2.6), (1.0, 1.0, 1.6), (1.19, 0.6, 1.2), (1.5, 0.35, 0.9), (2.0, 0.5, 0.8), (2.52, 0.2, 0.5), (3.0, 0.15, 0.35)]
    y = sum(a * np.sin(2 * np.pi * f * k * t + k) * np.exp(-t / d) for k, a, d in parts)
    y += hp(np.random.default_rng(int(f)).standard_normal(len(t)), 2000) * np.exp(-t / 0.01) * 0.3
    return fades(y * 0.25 * g, 0.001, 0.2)

THEME = [(0, 69, 1), (1, 72, .5), (1.5, 71, .5), (2, 69, 1), (3, 64, 1), (4, 65, 1), (5, 64, .5), (5.5, 62, .5), (6, 64, 2),
         (8, 69, 1), (9, 72, 1), (10, 74, .5), (10.5, 72, .5), (11, 71, 1), (12, 69, 3)]
SNEAK = [(0, 57, .5), (1, 58, .5), (2, 57, .5), (3, 60, .5), (4, 59, .5), (5, 58, .5), (6, 57, .5), (7, 52, .5)]

# hook: lute ostinato + recorder theme, light frame drum (a jaunty tune for a grim town)
a, b = 0.0, T["the0"] - 0.12
drum(a + 0.05, b, 0.32, (1, 0, 0.5, 0, 0.8, 0, 0.5, 0.4))
lute([(i * 0.5, [45, 52, 57, 52][i % 4], 0.5) for i in range(int((b - a) / (BEAT * 0.5)))], a, 0.32, 0.2, 0.5, 11, until=b)
recorder(THEME, a + 0.25, 0.4, until=b)
pads([[45, 52, 57]], a, beats_each=8, vel=0.14, warm=500, until=b)
put(I.brass(F(40), 0.5, 0.5, rng(9), kind="tuba", scoop=-30), B("dying"), 0.6)
cue(0, "music: lute + recorder theme (hook)"); cue(B("dying"), "music: low tuba on 'dying'")
# worst: everything drops out; a lonely low string and a quizzical rising glide on 'why'
a = T["the0"]
put(I.pad([F(45), F(52)], T["patients"] - a, 0.14, rng(20), att=0.05, rel=0.4, warm=400), a)
lute([(0, 57, 1), (1.5, 56, 1), (3, 55, 1)], a + 0.5, 0.35, 0.0, 0.3, 21, until=T["why"])
for i, m in enumerate([69, 72, 76, 79, 83]): put(I.musicbox(F(m), 0.35, rng(22)), B("why") + i * 0.06, 1.0, -0.3 + 0.15 * i)
cue(B("why"), "music: quizzical glide on 'why'")
# patients: drone + creeping lute; a sour glock note on each symptom
a, b = SH["patients"][0], T["try"] - 0.1
pads([[45, 52, 57], [44, 52, 57], [45, 52, 57], [41, 48, 57]] * 2, a, beats_each=4, vel=0.14, warm=600, until=b)
lute(SNEAK * 3, a + 0.1, 0.3, 0.1, 0.35, 30, until=b)
for w, m in (("fevers", 80), ("lumps", 79), ("patches", 78)): put(I.glock(F(m), 0.4, rng(31)), B(w), 0.8, 0.2); put(I.glock(F(m + 1), 0.3, rng(32)), B(w) + 0.02, 0.6, -0.2)
# try everything: busy hopeful pizz, rising with each remedy; a sweet chord on 'purify'
a, b = T["try"] - 0.1, T["nothing"] - 0.1
drum(a, b, 0.3, (1, 0, 0.6, 0, 1, 0, 0.6, 0.5), seed=40)
k = 0
for w in ("try", "herbal", "bloodletting", "burning"):
    t0 = B(w); lute([(0, 57 + k, .5), (.5, 60 + k, .5), (1, 64 + k, .5), (1.5, 67 + k, .5)], t0, 0.4, 0.15, 0.6, 41 + k); k += 2
bass([45, 45, 48, 48, 50, 50, 52, 52, 53, 53], a, 0.42, until=b)
pads([[57, 61, 64, 69]], B("purify"), beats_each=3, vel=0.2, warm=1400, until=b)
glocks([(0, 81, .5), (.5, 85, .5), (1, 88, 1)], B("purify"), 0.3, 0.2, 43)
# nothing seems to work: dead stop, sad trombone-ish tuba fall
for i, (m, d) in enumerate([(47, 0.35), (46, 0.35), (45, 0.35), (44, 1.2)]):
    put(I.brass(F(m), d, 0.55, rng(50 + i), kind="tuba", scoop=-25, fall=-1.5 if i == 3 else 0.0), B("work") - 0.6 + i * 0.32, 0.7)
cue(B("work"), "music: sad tuba fall (nothing seems to work)")
# poisonous air / divine punishment: low choir-like pad, swelling; timpani + bell clang on 'punishment'
a, b = SH["miasma"][0], T["but"] - 0.1
put(I.pad([F(45), F(52), F(56), F(60)], b - a, 0.2, rng(60), att=1.0, rel=0.5, warm=500), a)
put(I.pad([F(57), F(63), F(64)], b - B("poisonous"), 0.12, rng(61), att=0.6, rel=0.5, warm=1500), B("poisonous"))
put(I.timpani(F(33), 1.0, rng(62), dur=2.5), B("punishment"), 1.0)
cue(B("punishment"), "music: timpani on 'punishment'")
# the real culprit: sneaky pizzicato; sparkle on 'bacterium'; a boing for the flea
a, b = T["but"] - 0.05, T["every"] - 0.1
for rep in range(5): lute(SNEAK, a + rep * 8 * BEAT, 0.42, 0.2, 0.55, 70 + rep, until=b)
bass([45, 45, 46, 46, 45, 45, 40, 40] * 2, a, 0.4, until=b)
for i, m in enumerate([76, 81, 84, 88]): put(I.glock(F(m), 0.4, rng(72)), B("bacterium") + i * 0.07, 0.9, 0.2)
cue(B("bacterium"), "music: sparkle on 'bacterium'")
# every morning: slow dirge, minor pads, recorder lament
a, b = T["every"] - 0.1, T["even2"] - 0.1
pads([[45, 52, 57, 60], [41, 48, 57, 60], [43, 50, 55, 59], [40, 47, 52, 56]], a, beats_each=4, vel=0.17, warm=700, until=b)
recorder([(0, 76, 2), (2, 74, 1), (3, 72, 1), (4, 71, 2), (6, 69, 2), (8, 72, 2), (10, 71, 1), (11, 69, 1), (12, 68, 3)], a + 0.3, 0.32, 0.2, 80, until=b)
# fellow doctors disappearing: plucked line that thins out with each pop
a, b = T["even2"] - 0.1, T["now"] - 0.15
lute([(i * 0.5, [57, 60, 64, 60][i % 4], 0.5) for i in range(12)], a, 0.36, 0.1, 0.5, 90, until=B("disappearing") + 0.6)
lute([(i * 0.5, [57, 64][i % 2], 0.5) for i in range(6)], B("disappearing") + 0.6, 0.3, 0.1, 0.5, 91, until=b)
# fever and the swelling: heartbeat drum, a rising dissonant pad, sting on 'arm'
a, b = T["now"] - 0.2, T["suddenly"] - 0.1
put(I.pad([F(45), F(51)], b - a, 0.14, rng(100), att=0.8, rel=0.3, warm=500), a)
put(I.pad([F(63), F(64), F(70)], b - B("swelling"), 0.12, rng(101), att=1.2, rel=0.3, warm=1600), B("swelling"))
put(I.pad([F(56), F(57), F(63)], 1.6, 0.3, rng(102), att=0.02, rel=0.8, warm=1600), B("arm"))
put(I.timpani(F(33), 1.0, rng(103), dur=2.2), B("arm"), 1.0)
cue(B("arm"), "music: sting on 'arm'")
# you're the patient: a low brass + timpani hit, then a bleak pad
put(I.brass(F(33), 1.2, 0.7, rng(110), kind="tuba", scoop=-40), B("patient"), 0.8)
put(I.timpani(F(33), 0.9, rng(111), dur=2.2), B("patient"), 0.9)
cue(B("patient"), "music: hit on 'patient'")
# tens of millions across Europe: big slow minor chords, drum, recorder theme in octaves
a, b = SH["europe"][0] - 0.05, T["and_"] if "and_" in T else SH["truth"][0] - 0.05
pads([[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [40, 47, 52, 56]], a, beats_each=4, vel=0.24, warm=900, until=b)
drum(a, b, 0.42, (1, 0, 0, 0.6, 1, 0, 0.5, 0), seed=120, f=38)
recorder(THEME[:8], a + 0.2, 0.4, -0.1, 121, until=b)
put(I.cymbal(0.4, rng(122), dur=2.4), B("millions"), 0.5, 0.2)
# the terrifying truth: near silence, one low note
put(I.pad([F(33), F(40)], SH["truth"][1] - SH["truth"][0] + 0.4, 0.18, rng(130), att=0.1, rel=0.5, warm=300), SH["truth"][0])
put(I.timpani(F(31), 0.7, rng(131), dur=2.0), B("truth"), 0.8)
# invisible enemy: the sneaky line again, now with the drum, building
a, b = SH["invisible"][0], T["for2"] - 0.1
for rep in range(4): lute(SNEAK, a + rep * 8 * BEAT, 0.45, 0.2, 0.6, 140 + rep, until=b)
drum(a, b, 0.32, (1, 0, 0.5, 0.5), seed=141)
bass([45, 45, 46, 46, 47, 47, 48, 48], a, 0.42, until=b)
put(I.pad([F(57), F(63)], b - B("invisible"), 0.12, rng(142), att=0.4, rel=0.3, warm=1200), B("invisible"))
# 500 years later: the theme turns major, warm and bright; final chord on 'years'
a = T["for2"] - 0.05
pads([[45, 52, 57, 61, 64]], a, beats_each=5, vel=0.24, warm=1400)
recorder([(0, 69, 1), (1, 73, 1), (2, 76, 2), (4, 81, 3)], a, 0.42, -0.1, 150)
glocks([(0, 81, .5), (.5, 85, .5), (1, 88, .5), (1.5, 93, 2)], B("y500"), 0.35, 0.25, 151)
put(I.timpani(F(33), 0.6, rng(152), dur=3.0), B("years"), 0.8)
put(I.cymbal(0.35, rng(153), dur=2.6), B("years"), 0.5, 0.2)
cue(B("years"), "music: final major chord on 'years'")

ir = make_ir(1.6, 5)
mus = 0.8 * mus + 0.27 * convolve_st(mus, ir)[:, :N]

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
def thunder(r, dur=3.0, g=1.0):
    n = ns(dur); t = np.arange(n) / SR
    crack = hp(r.standard_normal(n), 800) * np.exp(-t / 0.06) * 0.6
    roll = lp(colored(n, r, 1.5), 180) * (1 - np.exp(-t / 0.05)) * np.exp(-t / 1.0) * (1 + 0.6 * smooth_noise(n, r, 6))
    return fades((crack + roll * 2.5) * g, 0.002, 0.3)
def rain(dur, r, g=1.0):
    n = ns(dur)
    w = widen(bp(colored(n, r, 0.5), 400, 3000) * 0.25 * g, r)[:, :n]
    return st(hp(colored(n, r, 0.2), 1500) * 0.35 * g) + w
def pop(r, f=600):
    t = tt(0.12)
    return fades(np.sin(2 * np.pi * f * t * (1 + 3 * t)) * np.exp(-t / 0.02) * 0.6, 0.0005, 0.02)
def ding(r, f=2100):
    t = tt(1.4)
    return fades(sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t / d) for k, a, d in [(1, 1, 0.6), (2.76, 0.4, 0.3), (5.4, 0.2, 0.15)]) * 0.4, 0.001, 0.1)
def cough(r, pitch=1.0, n=2):
    """a cough: n short breathy bursts with a chesty low thump"""
    out = np.zeros(ns(0.22 * n + 0.2))
    for k in range(n):
        d = 0.16 * r.uniform(0.85, 1.15); t = tt(d)
        env = (1 - np.exp(-t / 0.004)) * np.exp(-t / (0.05 * r.uniform(0.8, 1.2)))
        y = bp(r.standard_normal(len(t)), 300 * pitch, 2600 * pitch) * env
        y += np.sin(2 * np.pi * 110 * pitch * t) * env * 0.5
        i = ns(k * 0.22 * r.uniform(0.85, 1.1)); out[i:i + len(y)] += y * (1 - 0.25 * k)
    return fades(out * 0.7, 0.001, 0.03)
def squeak(r, f=4200, dur=0.09):
    t = tt(dur)
    return fades(np.sin(2 * np.pi * f * t * (1 + 0.3 * np.sin(np.pi * t / dur))) * np.sin(np.pi * t / dur) * 0.3, 0.002, 0.01)
def patter(dur, r, rate=16):
    n = ns(dur); y = np.zeros(n); t = 0.0
    while t < dur - 0.03:
        k = bp(r.standard_normal(ns(0.015)), 1500, 6000) * np.exp(-tt(0.015) / 0.003) * r.uniform(0.3, 0.7)
        i = ns(t); y[i:i + len(k)] += k[: n - i]; t += 1 / rate * r.uniform(0.7, 1.3)
    return y
def boing(r, f0=180, f1=520, dur=0.4):
    t = tt(dur); f = f0 + (f1 - f0) * (1 - np.exp(-t / 0.06))
    return fades(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12) * (1 + 0.3 * np.sin(2 * np.pi * 22 * t)) * 0.45, 0.001, 0.05)
def grind(r, dur=0.15):
    t = tt(dur)
    return fades(bp(r.standard_normal(len(t)), 600, 3500) * np.sin(np.pi * t / dur) * (0.6 + 0.4 * np.sin(2 * np.pi * 40 * t)) * 0.35, 0.002, 0.01)
def swish(r, dur=0.3, g=1.0):
    return G.whoosh(dur, r, peak=0.35, f_lo=500, f_hi=3500, tail=0.1) * 0.35 * g
def heartbeat(r, g=1.0):
    y = np.zeros(ns(0.6)); a = thump(r, 48, 0.3, 1.0); b = thump(r, 44, 0.3, 0.7)
    y[: len(a)] += a; y[ns(0.22): ns(0.22) + len(b)] += b
    return y * g
def wheel_rumble(dur, r):
    n = ns(dur)
    return lp(colored(n, r, 1.2), 220) * (0.7 + 0.3 * smooth_noise(n, r, 3)) * 0.8 + patter(dur, r, 9) * 0.4

r = rng(300)
TF = lambda fr: fr / FPS
ids = [s["id"] for s in TL["shots"]]
SHF = {s["id"]: (s["a"], s["b"]) for s in TL["shots"]}
# town ambience: wind, distant bell, birds a little, coughs
for sid in ("hook", "miasma", "culprit", "bacteria", "morning", "families"):
    a, b = SH[sid]; fx(G.breeze(b - a, r, 0.12, bright=700), a)
    if sid in ("hook", "culprit", "families"): fx(G.bird_chirps(b - a, r, 0.2), a, 0.25, 0.5)
fx(bell(196, 5.0), 0.4, 0.45, -0.3, "distant church bell (hook)")
fx(bell(196, 5.0), 3.1, 0.35, -0.3)
for tm, p in ((0.9, -0.5), (2.2, -0.3), (3.4, 0.4)): fx(cough(r, 1.0 + 0.1 * p), tm, 0.5, p)
cue(0.9, "coughs in the street")
a, b = SH["hook"]
fx(wheel_rumble(b - a, r) * 0.25, a, 1.0, -0.2)
# white flash + the night study: candle, a cricket, three pops for the question marks
fx(G.whoosh(0.7, r, peak=0.45, f_lo=500, f_hi=4000) * 0.6, TF(TL["flash"]) - 0.5, what="flash whoosh")
for sid in ("worst", "fever", "lookDown", "truth", "invisible"):
    a, b = SH[sid]; fx(widen(crackle(b - a, r, 6) * 0.2, r), a)
for i in range(3): fx(pop(r, 700 + 160 * i), B("why") + i * 0.11, 0.8, -0.3 + 0.3 * i)
cue(B("why"), "question-mark pops")
# the sick room: coughs and a groan, sweat drip, a squelchy pop for each symptom
fx(cough(r, 0.9, 3), SH["patients"][0] + 0.3, 0.6, -0.3, "coughs (patients)")
fx(G.oof(r, "oof", base=140) * 0.4, B("fevers") + 0.1, 1.0, -0.2)
fx(boing(r, 220, 420, 0.3) * 0.5, B("swollen") + 0.15, 1.0, 0.0, "lump pops up")
for i in range(3): fx(pop(r, 300 + 80 * i) * 0.6, B("dark") + 0.2 + i * 0.09, 1.0, 0.3)
# herbal medicines: mortar grinding; bloodletting: drip; burning herbs: swishes + brazier fire
a, b = SH["herbal"]
for fr in range(SHF["herbal"][0], SHF["herbal"][1]):
    if fr % 10 == 0: fx(grind(r), TF(fr), 1.0, -0.2)
cue(a, "mortar grinding")
a, b = SH["bloodlet"]
for i in range(3): fx(G.bubbles(0.2, r, 8, 900, 1800) * 0.4, a + 0.15 + i * 0.25, 1.0, -0.1)
fx(G.oof(r, "oof", base=170) * 0.45, a + 0.05, 1.0, -0.2, "patient winces (bloodletting)")
a, b = SH["herbs"]
fx(widen(crackle(b - a, r, 18) * 0.5, r), a, what="brazier fire")
for fr in range(SHF["herbs"][0], SHF["herbs"][1]):
    if fr % 20 == 5: fx(swish(r), TF(fr), 1.0, 0.2)
# nothing seems to work: a cough right on cue
fx(cough(r, 0.95, 2), B("nothing") + 0.2, 0.8, -0.1, "cough (nothing)")
fx(cough(r, 0.95, 3), B("work") + 0.1, 0.7, -0.1)
# poisonous air: low wind swell; divine: rain, thunder, bell clang
a, b = SH["miasma"]; fx(G.breeze(b - a, r, 0.3, bright=400), a, what="miasma wind")
fx(cough(r, 1.1, 2), B("poisonous") + 0.3, 0.5, 0.2)
a, b = SH["divine"]; fx(rain(b - a + 0.6, r, 0.28), a); fx(G.breeze(b - a, r, 0.25, bright=600), a)
for fr in TL["lightning"]: fx(thunder(r, 3.0, 0.18), TF(fr) + 0.05, what="thunder")
fx(bell(147, 4.0), a + 0.1, 0.8, 0.0, "church bell (divine)")
# the rat: scurry and squeaks; the magnifier pop; the flea jumps
a, b = SH["culprit"]
for tm in np.arange(a + 0.1, b, 0.48): fx(G.stroll_step(r, 0.3) * 0.25, tm, 1.0, 0.0)
fx(patter(T["real"] - a, r, 18) * 0.18, a, 1.0, 0.3, "rat scurry")
fx(squeak(r, 4200), B("real") + 0.05, 1.0, 0.1, "rat squeak"); fx(squeak(r, 4800, 0.07), B("culprit") + 0.15, 1.0, 0.1)
fx(pop(r, 500), B("bacterium") + 0.05, 1.0, -0.2, "magnifier pops in")
fx(G.bubbles(2.0, r, 10, 400, 1400) * 0.15, B("bacterium") + 0.2, 1.0, -0.2)
fx(boing(r, 300, 900, 0.35), B("fleas") + 0.02, 1.0, 0.3, "flea jumps")
fx(squeak(r, 5200, 0.06), B("pestis"), 0.8, 0.1)
# every morning: cart wheels, the bell tolling slowly, footsteps
a, b = SH["morning"]; fx(wheel_rumble(b - a, r) * 0.7, a, 1.0, -0.2, "cart rumbles")
for i in range(2): fx(bell(196, 4.5), a + 0.2 + i * 2.2, 0.55, -0.4)
for tm in np.arange(a + 0.2, b, 0.55): fx(G.stroll_step(r, 0.6) * 0.5, tm, 1.0, -0.2)
a, b = SH["families"]
for tm in np.arange(a + 0.1, b, 0.36): fx(G.stroll_step(r, 0.4) * 0.5, tm, 1.0, -0.4 + 0.8 * (tm - a) / (b - a))
fx(G.creak(0.8, r, 60, 110) * 0.3, a + 0.1, 1.0, -0.5, "door creaks (families)")
# fellow doctors disappearing: three pops
for k in range(3): fx(pop(r, 520 + 90 * k) * 1.2, TF(TL["T"]["disappearing"] - 3 + 9 * k) + 0.01, 1.0, [-0.3, -0.6, 0.5][k], "colleague vanishes" if k == 0 else None)
# fever: heartbeat speeding up; the swelling: squelch; the patient: bed creak + cough
a = SH["fever"][0] + 0.2; tm = a; per = 0.95
while tm < SH["lookDown"][1] - 0.2:
    fx(heartbeat(r, 0.6), tm, 1.0, 0.0); tm += per; per = max(0.55, per * 0.97)
cue(a, "heartbeat speeds up")
fx(boing(r, 160, 300, 0.45) * 0.6, B("swelling") + 0.1, 1.0, 0.2, "swelling squelch")
fx(G.whoa(r, base=170) * 0.4, B("arm") + 0.05, 1.0, 0.0)
a, b = SH["patient"]; fx(G.creak(0.6, r, 80, 140) * 0.25, a + 0.1, 1.0, 0.3, "bed creaks")
fx(cough(r, 0.9, 3), B("patient") + 0.4, 0.6, 0.3)
# Europe: high wind, distant bells one after another
a, b = SH["europe"]; fx(G.breeze(b - a, r, 0.35, bright=500), a, what="high wind (Europe)")
for i in range(5): fx(bell(196 * [1, 1.122, 0.891, 1.335, 0.749][i], 4.0), a + 0.3 + i * 0.6, 0.18, -0.6 + 0.3 * i)
# the truth: heartbeat; invisible: swishes and squishy wiggles; the lab: a click, the discovery ding
for i in range(3): fx(heartbeat(r, 0.5), SH["truth"][0] + 0.1 + i * 0.6, 1.0, 0.0)
for fr in range(SHF["invisible"][0], SHF["invisible"][1]):
    if fr % 15 == 3: fx(swish(r, 0.25, 0.8), TF(fr), 1.0, 0.2 * np.sin(fr))
fx(G.bubbles(3.0, r, 7, 300, 1000) * 0.2, B("invisible"), 1.0, 0.0, "bacteria squish")
fx(pop(r, 800) * 0.6, SH["future"][0] + 0.25, 1.0, 0.1, "microscope click")
fx(ding(r), B("y500") + 0.02, 0.6, 0.2, "discovery ding (500)")
fx(G.whoa(r, base=150) * 0.35, B("years") + 0.15, 1.0, -0.1)

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
