# Sound for "Pulau Kecil yang Ditukar dengan New York" (Vox-style spice-history short): an original documentary
# score (plucked ostinato, warm pads, glockenspiel, soft timpani; D minor, 96 bpm) that follows the picture section by
# section, a synthesized SFX stem (stamps, paper, pen, pins, map whooshes, footage ambiences) placed on the same
# word-timed cuts as timing.ts, and the mix: voice untouched, music ducked under speech, master -14 LUFS, <= -1 dBTP.
# Usage: python rempah_audio.py ../public/rempah/voice.wav ../public/rempah/mix.wav
import json, os, sys
import numpy as np
from scipy import ndimage, signal
from dsp import SR, ns, tt, rng, lp, hp, bp, pan, place, st, fades, dbg, integrated, true_peak, read_wav, write_wav, make_ir, convolve_st, colored
import instruments as I
import sfx_gen as G

HERE = os.path.dirname(os.path.abspath(__file__))
WORDS = json.load(open(os.path.join(HERE, "..", "src", "videos", "rempah", "words.json")))
ws = lambda i: WORDS[i]["s"]
VOICE_END = WORDS[-1]["e"]
FPS = 30
TOTAL = round((VOICE_END + 1.7) * FPS)
DUR = TOTAL / FPS
N = ns(DUR)
F = I.m2f
BEAT = 60 / 96
cues = []
def cue(t, what): cues.append((t, what))

CUT = dict(manhattan=0, castello=ws(7), map1=ws(12), pala=ws(20), plancius=ws(28), cengkih=ws(33), map2=ws(37), merveilles=ws(53),
           map3=ws(56), malaka=ws(70), ortelius=ws(78), ledger=ws(87), vroom=ws(93), coen=ws(98), banda=ws(101), dots=ws(110),
           map5=ws(121), pulau=ws(126), tangan=ws(132), end=DUR)
CUT_AT = ws(67) + 0.1  # red X on the old route ("memotong")

# ---------------------------------------------------------------- music
mus = np.zeros((2, N))
def put(x, t, g=1.0, p=0.0):
    x = np.asarray(x)
    place(mus, pan(x, p) if x.ndim == 1 else x, t, g)

R = rng(11)
def ostinato(t0, t1, notes, vel=0.32, bright=0.4, p=-0.25, step=0.5, accent=None):
    """eighth-note plucked pattern cycling through `notes` (midi) from t0 until t1"""
    t, k = t0, 0
    while t < t1 - 0.05:
        m = notes[k % len(notes)]
        v = vel * (1.15 if (accent and k % accent == 0) else 1.0) * R.uniform(0.88, 1.02)
        put(I.pluck(F(m), v, R, dur=0.55, bright=bright, pos=0.21), t, 1.0, p)
        t += step * BEAT; k += 1

def pads(t0, t1, chords, vel=0.17, warm=850):
    """chords spread evenly over [t0, t1]"""
    d = (t1 - t0) / len(chords)
    for i, ch in enumerate(chords):
        put(I.pad([F(m) for m in ch], d + 0.4, vel, R, att=0.45, rel=0.9, warm=warm), t0 + i * d)

def glock_line(t0, notes, vel=0.22, p=0.3, fn=I.glock, step=0.5):
    for i, m in enumerate(notes):
        if m is not None: put(fn(F(m), vel * R.uniform(0.9, 1.05), R), t0 + i * step * BEAT, 1.0, p)

def bass(t0, t1, roots, every=1.0, vel=0.42):
    t, k = t0, 0
    while t < t1 - 0.05:
        put(I.pluck(F(roots[k % len(roots)]), vel, R, dur=0.7, bright=0.2, pos=0.32), t, 1.0, -0.05)
        t += every * BEAT; k += 1

def timp(t, m=38, vel=0.55):
    put(I.timpani(F(m), vel, R, dur=2.4), t, 1.0, 0.0)

def brushes(t0, t1, vel=0.16):
    t, k = t0, 0
    while t < t1 - 0.05:
        put(I.brush(vel * (1.0 if k % 2 == 0 else 0.65), R, swish=(k % 4 == 3)), t, 1.0, 0.25); t += BEAT / 2; k += 1

Dm, Bb, F_, C_, Gm, A_, Am = [50, 57, 62, 65], [46, 53, 58, 62], [48, 53, 57, 60], [48, 55, 60, 64], [43, 50, 55, 58], [45, 52, 57, 61], [45, 52, 57, 60]

# 1 hook (Manhattan, castello): pulse + Dm, timpani on the year stamp
a, b = 0.0, CUT["map1"]
ostinato(a + 0.05, b, [62, 69, 65, 69], vel=0.28, accent=4)
pads(a, b, [Dm, Bb], vel=0.15)
timp(0.33, 38, 0.6); cue(0.33, "music: timpani on 1667")
timp(ws(11) - 0.02, 33, 0.45)
# 2 map flight: glock motif rises with the camera, Bb -> F -> C -> Dm
a, b = CUT["map1"], CUT["pala"]
ostinato(a, b, [62, 69, 65, 69, 60, 69, 65, 69], vel=0.26)
pads(a, b, [Bb, F_, C_, Dm], vel=0.16)
glock_line(ws(13) - 0.1, [74, 77, 81, 79, None, 77, 74], vel=0.2)
put(I.glock(F(86), 0.22, R), ws(19), 1.0, 0.4); cue(ws(19), "music: glock ping on Pulau Run")
# 3 spices (pala, plancius, cengkih): brighter, brushes, Dm Gm Bb A
a, b = CUT["pala"], CUT["map2"]
ostinato(a, b, [62, 69, 74, 69, 65, 69, 72, 69], vel=0.27, bright=0.5)
brushes(a, b, 0.12)
bass(a, b, [38, 38, 43, 43, 46, 46, 45, 45], every=1.0, vel=0.32)
pads(a, b, [Dm, Gm, Bb, A_], vel=0.15)
glock_line(ws(30) - 0.05, [81, 79, 77, 76], vel=0.16)
# 4 map to Syria: travel, bass pulse, counter ticks rise
a, b = CUT["map2"], CUT["merveilles"]
ostinato(a, b, [62, 69, 65, 69, 62, 70, 65, 70], vel=0.25)
bass(a, b, [38, 38, 46, 46, 41, 41, 45, 45], every=1.0, vel=0.34)
pads(a, b, [Dm, Bb, F_, A_], vel=0.15)
timp(ws(44) - 0.03, 38, 0.4)
# 5 trade route + price: walking bass climbs with the bars, brushes; stops dead on "memotong"
a, b = CUT["merveilles"], CUT_AT
ostinato(a, b, [62, 69, 65, 69, 64, 69, 65, 69], vel=0.27)
brushes(a, b, 0.14)
walk = [38, 40, 41, 43, 45, 46, 48, 50, 52, 53, 55, 57]
t, k = a, 0
while t < b - 0.05:
    put(I.pluck(F(walk[min(k // 2, len(walk) - 1)]), 0.36, R, dur=0.6, bright=0.25, pos=0.3), t, 1.0, -0.05); t += BEAT; k += 1
pads(a, b, [Dm, Gm, A_, Bb, C_], vel=0.15)
put(I.timpani(F(45), 0.75, R, dur=1.5), CUT_AT, 1.0); put(I.cymbal(0.25, R, dur=1.4), CUT_AT, 0.5, 0.2); cue(CUT_AT, "music: hit + stop on 'memotong'")
# 6 Portugal -> Malaka -> Victoria -> ledger: new pulse, lifts to F major for the paid-off voyage
a, b = CUT_AT + 0.45, CUT["ledger"]
timp(a, 41, 0.45)
ostinato(a, b, [65, 72, 69, 72, 67, 72, 69, 72], vel=0.27, bright=0.5)
bass(a, b, [41, 41, 46, 46, 48, 48, 50, 50], every=1.0, vel=0.34)
pads(a, b, [F_, Bb, C_, Dm, Bb, C_], vel=0.15)
timp(ws(74) - 0.02, 41, 0.55)
a, b = CUT["ledger"], CUT["vroom"]
ostinato(a, b, [65, 72, 77, 72, 67, 72, 76, 72], vel=0.25, bright=0.55)
pads(a, b, [F_, C_, Bb, C_], vel=0.15)
glock_line(ws(92) - 0.02, [77, 81, 84], vel=0.22, step=0.33); cue(ws(92), "music: glock on LUNAS")
# 7 VOC, Coen, Banda: darker, low pad + timpani pulses, no plucks
a, b = CUT["vroom"], CUT["dots"]
pads(a, b, [Dm, Bb, Gm, A_], vel=0.2, warm=600)
for tm in np.arange(a, b - 0.2, 2 * BEAT): timp(tm, 38, 0.32)
timp(ws(95) - 0.02, 33, 0.6); cue(ws(95), "music: low timpani on VOC")
timp(ws(104) - 0.02, 33, 0.65)
bass(a, b, [38, 38, 38, 37], every=2.0, vel=0.3)
# 8 dots: almost nothing; sparse vibes, a low drone; silence before "Rempah"
a, b = CUT["dots"], CUT["map5"] - 0.75
put(I.pad([F(38), F(45)], b - a + 0.3, 0.13, R, att=1.2, rel=0.8, warm=400), a)
for i, m in enumerate([74, 69, 65, 62]): put(I.vibes(F(m), 0.2, R, dur=2.5), ws(112) + i * 2 * BEAT, 1.0, 0.2 * (-1) ** i)
# 9 map5 swell -> resolution on the island, ends on a held D major (picardy) chord
a, b = CUT["map5"] - 0.05, CUT["pulau"]
put(I.cymbal(0.18, R, dur=2.0), a, 0.6, -0.2); timp(a, 38, 0.6); cue(a, "music: swell on 'Rempah'")
ostinato(a, b, [62, 69, 74, 69, 65, 69, 74, 69], vel=0.3, bright=0.5)
brushes(a, b, 0.14)
bass(a, b, [38, 38, 46, 46], every=1.0, vel=0.36)
pads(a, b, [Dm, Bb], vel=0.18)
glock_line(a + 0.1, [74, 77, 81, 86], vel=0.2)
a, b = CUT["pulau"], DUR
ostinato(a, VOICE_END + 0.2, [62, 69, 74, 69, 67, 70, 74, 70], vel=0.26, bright=0.45)
bass(a, VOICE_END, [38, 38, 43, 43, 46, 46, 45, 45], every=1.0, vel=0.32)
pads(a, VOICE_END + 0.2, [Dm, Gm, Bb, A_], vel=0.16)
put(I.pad([F(m) for m in [50, 57, 62, 66, 69]], DUR - VOICE_END + 0.2, 0.2, R, att=0.3, rel=1.2), VOICE_END + 0.15)
timp(VOICE_END + 0.15, 38, 0.55); glock_line(VOICE_END + 0.15, [74, 78, 81, 86], vel=0.22, step=0.5); cue(VOICE_END + 0.15, "music: final D major chord")
mus = convolve_st(mus, make_ir(1.6, 5)) * 0.35 + mus

# ---------------------------------------------------------------- sfx
sfx = np.zeros((2, N))
r = rng(23)
def fx(x, t, g=1.0, p=0.0, what=None):
    x = np.asarray(x)
    place(sfx, pan(x, p) if x.ndim == 1 else x, t, g)
    if what: cue(t, what)

def thump(r, f0=55, dur=0.5, amp=0.8):
    n = ns(dur); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * f0 * t * (1 + 0.8 * np.exp(-t / 0.03))) * np.exp(-t / (dur * 0.3))
    click = lp(r.standard_normal(n), 3000) * np.exp(-t / 0.006) * 0.4
    return (body + click) * amp

def stamp(r):
    n = ns(0.35); t = np.arange(n) / SR
    knock = bp(r.standard_normal(n), 120, 900) * np.exp(-t / 0.025) * 1.2
    slap = bp(r.standard_normal(n), 900, 5000) * np.exp(-t / 0.012) * 0.6
    return (knock + slap + thump(r, 70, 0.35, 0.5)[:n]) * 0.9

def paper_slide(r, dur=0.45):
    n = ns(dur); t = np.arange(n) / SR
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return bp(colored(n, r, 0.5), 1200, 7000) * env * 0.35

def pen(r, dur):
    n = ns(dur); t = np.arange(n) / SR
    strokes = (0.55 + 0.45 * np.sin(2 * np.pi * r.uniform(7, 10) * t + r.uniform(0, 6))) ** 2
    return bp(r.standard_normal(n), 2500, 9000) * strokes * fades(np.ones(n), 0.02, 0.06) * 0.12

def pop_s(r, f=900):
    n = ns(0.12); t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t * (1 + 0.5 * np.exp(-t / 0.01))) * np.exp(-t / 0.03) * 0.35

def tick(r):
    n = ns(0.03); t = np.arange(n) / SR
    return hp(r.standard_normal(n), 3000) * np.exp(-t / 0.004) * 0.3

def snip(r):
    out = np.zeros(ns(0.25))
    for k in (0.0, 0.11):
        n = ns(0.05); t = np.arange(n) / SR
        out[ns(k): ns(k) + n] += bp(r.standard_normal(n), 2500, 8000) * np.exp(-t / 0.008) * 0.8
    return out

def whoosh(dur, peak=0.4):
    return G.whoosh(dur, r, peak=peak, f_lo=250, f_hi=1800, tail=0.25) * 0.35

# stamps
for t_, w in ((0.33, "year strip"), (ws(11), "KE INGGRIS"), (ws(74), "1511"), (ws(92), "LUNAS"), (ws(95), "VOC seal"), (ws(104), "1621")):
    fx(stamp(r), t_ - 0.01, 1.0, 0.0, f"stamp: {w}")
# paper cutouts arriving
for k in ("castello", "plancius", "merveilles", "malaka", "ortelius", "vroom", "coen", "banda"):
    fx(paper_slide(r), CUT[k] - 0.08, 1.0, r.uniform(-0.3, 0.3), f"paper in: {k}")
fx(paper_slide(r, 0.55), CUT["ledger"] - 0.05, 1.2, 0.0, "ledger slides up")
fx(paper_slide(r, 0.35), 0.3, 0.8, 0.0)
fx(paper_slide(r, 0.35), ws(59) - 0.2, 0.8, 0.1, "price card up")
# pen notes (handwriting) and label strips
for t_, d in ((1.0, 0.6), (ws(9), 0.7), (ws(21), 0.4), (CUT["plancius"] + 0.25, 0.9), (ws(30) + 0.45, 0.4), (ws(42), 0.8), (CUT["merveilles"] + 0.35, 0.9),
              (CUT_AT + 0.6, 0.7), (ws(79) + 0.5, 0.5), (ws(85), 0.7), (ws(88) + 0.2, 0.5), (CUT["vroom"] + 0.3, 0.6), (CUT["coen"] + 0.5, 0.6)):
    fx(pen(r, d), t_, 1.0, r.uniform(-0.3, 0.3))
cue(ws(9), "pen: handwritten notes (13x)")
for t_ in (ws(21) + 0.3, ws(34), ws(55), ws(72), ws(82), CUT["coen"] + 0.15, CUT["banda"] + 0.1):
    fx(paper_slide(r, 0.22) * 1.2, t_, 1.0, 0.2)
# map pins
for t_ in (CUT["map1"], ws(17) - 0.1, ws(19), CUT["map2"], ws(44) - 0.05, CUT["map3"], CUT["map3"] + 0.1, ws(58), CUT_AT + 0.3, CUT["map5"]):
    fx(pop_s(r, r.uniform(700, 1100)), t_, 1.0, r.uniform(-0.4, 0.4))
cue(CUT["map1"], "map pins (10x)")
# map camera flights
fx(whoosh(1.6, 0.5), ws(13) - 0.3, 1.0, 0.0, "whoosh: Manhattan -> Maluku")
fx(whoosh(1.0, 0.4), ws(18) - 0.3, 0.8, 0.0)
fx(whoosh(1.4, 0.5), ws(38), 0.9, 0.0, "whoosh: to Syria")
fx(whoosh(1.2, 0.4), CUT_AT + 0.3, 0.8, 0.0)
fx(whoosh(1.6, 0.6), CUT["map5"] + 0.1, 1.0, 0.0, "whoosh: world routes")
# counters, bars, X
for tm in np.linspace(ws(47), ws(50) + 0.2, 14): fx(tick(r), tm, 1.0, 0.1)
cue(ws(47), "counter ticks 3.700")
for i in range(4): fx(pop_s(r, 500 + 160 * i), ws(60) + i * 0.38, 1.0, -0.3 + 0.2 * i)
cue(ws(60), "price bars grow")
fx(snip(r), CUT_AT - 0.02, 1.2, 0.0, "snip: red X on old route")
# dots: soft pitter in, then soft fall-away clicks
for i in range(40): fx(tick(r) * 0.6, CUT["dots"] + 0.1 + i * 0.03, 0.8, r.uniform(-0.5, 0.5))
for i in range(28): fx(lp(tick(r), 2500) * 0.5, ws(117) + i * 0.045, 0.8, r.uniform(-0.5, 0.5))
fx(thump(r, 42, 1.4, 0.7), ws(120) + 0.35, 1.0, 0.0, "low boom after 'tersisa'")
# ambiences on footage and the ship map
a, b = 0.0, CUT["castello"]; fx(G.breeze(b - a + 0.3, r, 0.5, bright=1500) * 0.5, a, what="amb: high wind over the city")
a, b = CUT["pala"], CUT["plancius"]; fx(G.bird_chirps(b - a, r, 0.7) * 0.5, a, 1.0, 0.3, "amb: forest birds (pala)"); fx(G.breeze(b - a, r, 0.3) * 0.4, a)
a, b = CUT["cengkih"], CUT["map2"]; fx(G.breeze(b - a, r, 0.4, bright=1100) * 0.5, a, what="amb: village breeze (cengkih)")
for i in range(5): fx(bp(r.standard_normal(ns(0.08)), 400, 2500) * np.exp(-tt(0.08) / 0.03) * 0.25, CUT["cengkih"] + 0.2 + i * 0.25, 1.0, 0.2)
a, b = CUT["ortelius"], CUT["ledger"]; fx(G.water_bed(b - a + 0.5, r, 0.5) * 0.35, a, what="amb: sea under the Victoria")
fx(G.creak(1.0, r, 60, 110) * 0.18, ws(79), 1.0, 0.2)
a, b = CUT["vroom"], CUT["coen"]; fx(G.water_bed(b - a, r, 0.4) * 0.25, a); fx(G.flag_flutter(b - a, r) * 0.2, a, 1.0, 0.3)
a, b = CUT["pulau"], DUR; fx(G.water_bed(b - a, r, 0.6) * 0.35, a, what="amb: island shore + birds"); fx(G.bird_chirps(b - a, r, 0.5) * 0.4, a, 1.0, -0.3)
fx(G.breeze(b - a, r, 0.35) * 0.4, a)

# ---------------------------------------------------------------- mix
voice, _sr = read_wav(sys.argv[1])
assert _sr == SR, _sr
if voice.ndim == 1 or voice.shape[0] == 1: voice = st(voice.reshape(-1))
v = np.zeros((2, N)); m = min(N, voice.shape[1]); v[:, :m] = voice[:, :m]
key = np.zeros(N)
for w in WORDS: key[ns(w["s"]): ns(w["e"] + 0.15)] = 1
key = ndimage.uniform_filter1d(key, ns(0.25))
duck = dbg(-5.0 * key)
VL = integrated(v)
def to_lufs(x, target):
    L = integrated(x)
    return x * dbg(target - L) if np.isfinite(L) else x
mus = to_lufs(mus, VL - 7.0) * duck[None, :]
sfx = to_lufs(sfx, VL - 11.0)
mix = v + mus + sfx
mix = to_lufs(mix, -14.0)
ceil = dbg(-1.2)
up = signal.resample_poly(mix, 4, 1, axis=1)
pk = np.abs(up).max(axis=0)[: 4 * N].reshape(-1, 4).max(axis=1)[:N]
g0 = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
g = ndimage.minimum_filter1d(g0, ns(0.006))
g = ndimage.uniform_filter1d(g, ns(0.006))
g = np.minimum(g, ndimage.minimum_filter1d(g0, 3))
mix = mix * g[None, :]
mix[:, -ns(0.5):] *= np.linspace(1, 0, ns(0.5))[None, :]
out = sys.argv[2]
write_wav(out, mix)
os.makedirs(os.path.join(HERE, "..", "..", "rempah", "audio"), exist_ok=True)
for nm, x in (("voice", v), ("music", mus), ("sfx", sfx)): write_wav(os.path.join(HERE, "..", "..", "rempah", "audio", f"stem_{nm}.wav"), x)
with open(os.path.join(HERE, "..", "..", "rempah", "cues.md"), "w") as fh:
    fh.write(f"# Cues\n\nLength {DUR:.3f} s, 48 kHz stereo. Integrated {integrated(mix):.1f} LUFS, true peak {true_peak(mix):.1f} dBTP.\n\n")
    for t_, w in sorted(cues): fh.write(f"- {t_:6.2f} s  {w}\n")
print("done", round(DUR, 3), round(integrated(mix), 2), round(true_peak(mix), 2))
