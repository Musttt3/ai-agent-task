# Sound for "You're a Messenger During the Fall of Constantinople": an original score on a held drone (an ison, as in
# Byzantine chant) in a D mode with a raised third (D Eb F# G A Bb C), plucked strings, a breathy flute, war drums and
# church bells (96 bpm); a synthesized SFX stem placed on the shot plan (byz_timeline.json, exported from story.ts); and
# the mix: voice untouched, music ducked under speech, master to -15 LUFS integrated with a <= -1.2 dBTP ceiling.
import json, os, sys
import numpy as np
from dsp import SR, ns, tt, rng, lp, hp, bp, pan, place, st, fades, dbg, integrated, true_peak, read_wav, write_wav, make_ir, convolve_st, colored, smooth_noise, widen
import instruments as I
import sfx_gen as G

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, "byz_timeline.json")))
FPS = TL["fps"]
DUR = TL["total"] / FPS
N = ns(DUR)
T = {k: v / FPS for k, v in TL["T"].items()}
SH = {s["id"]: (s["a"] / FPS, s["b"] / FPS) for s in TL["shots"]}
SHF = {s["id"]: (s["a"], s["b"]) for s in TL["shots"]}
WORDS = TL["words"]
F = I.m2f
BEAT = 0.625
cues = []
def cue(t, what): cues.append((t, what))
B = lambda w: T[w] - 3 / FPS

# ---------------------------------------------------------------- music
mus = np.zeros((2, N))
def put(x, t, g=1.0, p=0.0):
    x = np.asarray(x)
    if t >= DUR: return
    place(mus, pan(x, p) if x.ndim == 1 else x, max(0.0, t), g)
def lute(notes, t0, vel=0.5, p=0.0, bright=0.5, seed=1, until=None):
    r = rng(seed)
    for (b, m, d) in notes:
        if until is not None and t0 + b * BEAT >= until: continue
        put(I.pluck(F(m), vel * r.uniform(0.85, 1.05), r, dur=max(0.35, d * BEAT * 1.4), bright=bright), t0 + b * BEAT, 1.0, p)
def flute(notes, t0, vel=0.4, p=-0.15, seed=3, until=None):
    r = rng(seed)
    for (b, m, d) in notes:
        if until is not None and t0 + b * BEAT >= until: continue
        put(I.fife(F(m), d * BEAT * 0.95, vel * r.uniform(0.9, 1.05), r), t0 + b * BEAT, 0.75, p)
def drone(t0, t1, notes=(38, 45), vel=0.2, warm=500, att=0.8):
    if t1 > t0: put(I.pad([F(m) for m in notes], t1 - t0, vel, rng(int(t0 * 10) + 7), att=att, rel=0.6, warm=warm), t0)
def drum(t0, t1, vel=0.4, pattern=(1, 0, 0.6, 0), seed=4, f=40):
    r = rng(seed); t = t0; k = 0
    while t < t1 - 0.05:
        v = pattern[k % len(pattern)]
        if v: put(I.timpani(F(f), vel * v, r, dur=0.5), t, 0.75, -0.2)
        t += BEAT / 2; k += 1
def bell(f=196.0, dur=4.0, g=1.0, seed=0):
    t = tt(dur)
    parts = [(0.5, 0.5, 2.6), (1.0, 1.0, 1.6), (1.19, 0.6, 1.2), (1.5, 0.35, 0.9), (2.0, 0.5, 0.8), (2.52, 0.2, 0.5), (3.0, 0.15, 0.35)]
    y = sum(a * np.sin(2 * np.pi * f * k * t + k) * np.exp(-t / d) for k, a, d in parts)
    y += hp(np.random.default_rng(int(f) + seed).standard_normal(len(t)), 2000) * np.exp(-t / 0.01) * 0.3
    return fades(y * 0.25 * g, 0.001, 0.2)

# mode: D Eb F# G A Bb C (D=62)
THEME = [(0, 62, 1), (1, 63, .5), (1.5, 66, .5), (2, 67, 1), (3, 69, 1), (4, 70, .5), (4.5, 69, .5), (5, 67, 1), (6, 66, 2),
         (8, 69, 1), (9, 70, 1), (10, 72, .5), (10.5, 70, .5), (11, 69, 1), (12, 67, .5), (12.5, 66, .5), (13, 63, 1), (14, 62, 2)]
RUNF = [(i * 0.5, [62, 63, 66, 67, 69, 67, 66, 63][i % 8], 0.5) for i in range(64)]

# hook: drone + plucked ostinato + flute theme; tension under "fate of an empire"
a, b = 0.0, T["its"] - 0.1
drone(a, b + 0.3, (38, 45, 50), 0.18)
lute([(i * 0.5, [50, 57, 62, 57][i % 4], 0.5) for i in range(int(b / (BEAT * 0.5)))], a, 0.3, 0.2, 0.45, 11, until=b)
flute(THEME, a + 0.3, 0.38, until=b)
cue(0, "music: drone + plucked ostinato + flute theme")
# the date: a single low bell and timpani, then the war drums begin under the cannons
put(bell(98, 5.0), T["its"] - 0.05, 0.9)
put(I.timpani(F(33), 0.9, rng(20), dur=2.5), B("y1453"), 0.9)
cue(B("y1453"), "music: bell + timpani on '1453'")
a, b = SH["cannons"][0], T["now"] - 0.1
drone(a, b, (38, 39, 45), 0.18, 400)
drum(a, b, 0.42, (1, 0, 0, 0.5, 1, 0, 0.5, 0), seed=21, f=38)
# defences collapsing: rising string ostinato, a stinger on "collapsing"
a, b = T["now"] - 0.1, T["commander"] - 0.2
lute(RUNF, a, 0.32, 0.15, 0.55, 30, until=b)
drone(a, b, (38, 45, 51), 0.2, 600)
put(I.pad([F(62), F(63), F(69)], 1.4, 0.3, rng(31), att=0.02, rel=0.8, warm=1600), B("collapsing"))
put(I.timpani(F(33), 1.0, rng(32), dur=2.4), B("collapsing"), 1.0)
cue(B("collapsing"), "music: sting on 'collapsing'")
# the commander's order: horn call on "palace", "warn"
for i, w in enumerate(("palace", "warn")):
    put(I.brass(F([50, 57][i]), 0.5, 0.6, rng(40 + i), kind="horn"), B(w), 0.7, 0.1)
# running: driving drums + fast strings + bells
a, b = T["run1"] - 0.15, T["then"] - 0.1
drum(a, b, 0.42, (1, 0, 0.6, 0.4, 1, 0, 0.6, 0.6), seed=50, f=40)
lute(RUNF, a, 0.36, 0.2, 0.6, 51, until=b)
drone(a, b, (38, 45), 0.18, 600)
flute(THEME, B("behind"), 0.4, -0.15, 52, until=b)
# then you hear it: everything drops; one held note
put(I.pad([F(62), F(63)], 1.6, 0.16, rng(60), att=0.3, rel=0.6, warm=1500), T["then"])
# the roar: big hit, low brass; Ottoman soldiers break in: low drums + brass ostinato
put(I.timpani(F(31), 1.0, rng(70), dur=3.0), B("roar"), 1.0); put(I.cymbal(0.7, rng(71), dur=3.0), B("roar"), 0.6, 0.2)
put(I.brass(F(38), 1.4, 0.75, rng(72), kind="tuba", scoop=-20), B("roar"), 0.7)
cue(B("roar"), "music: hit on 'roar'")
a, b = T["ottoman2"] - 0.1, T["by"] - 0.1
drum(a, b, 0.46, (1, 0, 1, 0, 1, 0.6, 1, 0), seed=80, f=38)
drone(a, b, (38, 39, 45, 51), 0.22, 450)
for k in range(8): put(I.brass(F([50, 51, 50, 48][k % 4]), BEAT * 0.9, 0.45, rng(81 + k), kind="horn"), a + k * 2 * BEAT, 0.5, -0.1)
lute(RUNF, T["run2"] - 0.1, 0.4, 0.2, 0.6, 85, until=b)
# the heart of the city, too late: open fifths, the theme slowed on flute; low bell
a, b = T["by"] - 0.1, T["emperor"] - 0.1
drone(a, b, (38, 45, 50, 57), 0.22, 900)
flute([(0, 69, 2), (2, 67, 1), (3, 66, 1), (4, 63, 2), (6, 62, 2)], a + 0.2, 0.36, -0.1, 90, until=b)
put(bell(98, 5.0), B("late"), 0.8)
cue(B("late"), "music: low bell on 'late'")
# the emperor's last stand: drums, rising brass, cut on "dies" to a held chord
a, b = T["emperor"] - 0.1, B("dies")
drum(a, b, 0.5, (1, 0, 1, 1), seed=100, f=36)
for i, m in enumerate([50, 53, 55, 57]): put(I.brass(F(m), 0.45, 0.55, rng(101 + i), kind="horn"), a + i * 0.4, 0.6)
put(I.pad([F(38), F(45), F(50), F(54)], 3.2, 0.26, rng(105), att=0.05, rel=1.4, warm=800), B("dies"))
put(I.timpani(F(31), 0.9, rng(106), dur=3.0), B("dies"), 0.9)
cue(B("dies"), "music: held chord on 'dies'")
# the empire ends: slow chant-like flute over the ison, the theme falling; final low bell on "end"
a, b = T["byzantine"] - 0.2, T["supposed"] - 0.1
drone(a, b, (38, 45, 50), 0.22, 700)
flute(THEME, a + 0.2, 0.4, -0.1, 110, until=B("end"))
put(bell(98, 6.0), B("end"), 1.0); put(I.timpani(F(31), 0.8, rng(111), dur=3.0), B("end"), 0.8)
cue(B("end"), "music: bell on 'end'")
# the warning / witnessed: quiet pluck and drone, last chord on "empire"
a = T["supposed"] - 0.1
drone(a, DUR - 0.2, (38, 45, 50), 0.18, 600)
lute([(0, 62, 1), (1, 66, 1), (2, 69, 1), (3, 66, 1), (4, 63, 2)], a + 0.1, 0.32, 0.1, 0.4, 120, until=T["instead"])
put(I.pad([F(50), F(54), F(57), F(62)], DUR - B("empire3"), 0.25, rng(121), att=0.2, rel=1.2, warm=1000), B("empire3"))
put(bell(147, 5.0), B("empire3"), 0.5)

ir = make_ir(1.9, 5)
mus = 0.78 * mus + 0.3 * convolve_st(mus, ir)[:, :N]

# ---------------------------------------------------------------- SFX
sfx = np.zeros((2, N))
def fx(x, t, g=1.0, p=0.0, what=None):
    x = np.asarray(x)
    if t >= DUR: return
    place(sfx, pan(x, p) if x.ndim == 1 else x, max(0.0, t), g)
    if what: cue(t, what)
def boom(r, g=1.0, dur=3.2):
    n = ns(dur); t = np.arange(n) / SR
    crack = hp(r.standard_normal(n), 500) * np.exp(-t / 0.04) * 0.8
    body = np.sin(2 * np.pi * 42 * t * (1 + 0.6 * np.exp(-t / 0.05))) * np.exp(-t / 0.35)
    roll = lp(colored(n, r, 1.6), 160) * (1 - np.exp(-t / 0.04)) * np.exp(-t / 0.9) * 2.0
    return fades((crack + body + roll) * g, 0.001, 0.3)
def crumble(r, dur=2.5, g=1.0):
    return fades((G.rattle(dur, r, 40, heavy=True) * 0.6 + lp(colored(ns(dur), r, 1.4), 220) * np.exp(-np.arange(ns(dur)) / SR / 0.8) * 1.5) * g, 0.002, 0.3)
def crowd(dur, r, n=8, g=1.0, base=140):
    y = np.zeros((2, ns(dur)))
    for k in range(n):
        v = G.babble(dur, r, base * r.uniform(0.75, 1.6), r.uniform(0.95, 1.2), rate=r.uniform(4, 6), active=0.85)
        y += pan(lp(v, 2600) * r.uniform(0.4, 0.8), r.uniform(-0.8, 0.8))
    return y * g
def army_roar(r, dur=2.6, g=1.0):
    y = np.zeros((2, ns(dur)))
    for k in range(18):
        h = G.hurrah(r, 120 * r.uniform(0.8, 1.3), r.uniform(0.95, 1.1)); t0 = r.uniform(0, 0.5)
        place(y, pan(lp(h, 2400) * r.uniform(0.3, 0.7), r.uniform(-0.9, 0.9)), t0)
    n = ns(dur); y += st(lp(colored(n, r, 1.5), 200) * np.sin(np.pi * np.clip(np.arange(n) / n, 0, 1)) * 1.2)
    return y * g
def run_step(r, g=1.0):
    k = bp(r.standard_normal(ns(0.09)), 300, 3000) * np.exp(-tt(0.09) / 0.02)
    return fades((k + np.sin(2 * np.pi * 90 * tt(0.09)) * np.exp(-tt(0.09) / 0.03) * 0.6) * 0.5 * g, 0.001, 0.02)
def clash(r):
    return G.clink(r, f0=r.uniform(1800, 2600), dur=0.25, bright=1.2)
def thump(r, f0=55, dur=0.6, g=1.0):
    t = tt(dur)
    y = np.sin(2 * np.pi * f0 * t * (1 + 0.5 * np.exp(-t / 0.03))) * np.exp(-t / 0.18) + lp(r.standard_normal(len(t)), 600) * np.exp(-t / 0.05) * 0.6
    return fades(y * g, 0.001, 0.05)

r = rng(400)
TF = lambda fr: fr / FPS
# dawn wind everywhere, distant drums of the siege and far cannon thuds in the opening
fx(G.breeze(DUR, r, 0.08, bright=700), 0.0)
for tm in (1.2, 3.4): fx(boom(r, 0.25), tm, 1.0, -0.6)
cue(1.2, "distant cannon thuds (hook)")
fx(G.whoosh(0.7, r, peak=0.45, f_lo=500, f_hi=4000) * 0.6, TF(TL["flash"]) - 0.5, what="flash whoosh")
fx(crowd(SH["date"][1] - SH["date"][0], r, 6, 0.15, 120), SH["date"][0], what="camp murmur")
# the bombard fires twice; the ball hits the tower
for fr in TL["lightning"]: fx(boom(r, 1.0), TF(fr) + 0.1, 1.0, -0.2, "bombard fires")
fx(boom(r, 0.6, 2.0), B("walls1"), 1.0, 0.2, "ball hits the tower"); fx(crumble(r, 2.0, 0.7), B("walls1") + 0.05, 1.0, 0.2)
# collapsing tower: crumble + shouts
fx(crumble(r, 3.0, 1.0), B("collapsing"), 1.0, 0.4, "tower crumbles")
fx(G.whoa(r, base=140) * 0.5, B("collapsing") + 0.2, 1.0, -0.3)
for sid in ("collapsing", "grab", "order"):
    a, b = SH[sid]
    for tm in np.arange(a + 0.3, b, 0.7): fx(clash(r) * 0.25, tm + r.uniform(0, 0.3), 1.0, r.uniform(-0.8, 0.8))
    fx(crowd(b - a, r, 5, 0.25, 130), a)
fx(thump(r, 120, 0.25, 0.5), B("grabs"), 1.0, 0.1, "grab on the shoulder")
# running through the streets: footsteps, bells ringing, families
a, b = SH["run"]
for tm in np.arange(a + 0.1, b, 0.19): fx(run_step(r), tm, 1.0, 0.0)
for i in range(6): fx(bell(330 if i % 2 else 294, 2.5, seed=i), B("bells") + i * 0.42, 0.5, 0.5, "alarm bells" if i == 0 else None)
fx(crowd(b - B("families"), r, 6, 0.5, 170), B("families"), what="families rush past")
# behind: the battle at the walls; Mehmed's camp drums
a, b = SH["behind"]
fx(crowd(b - a, r, 10, 0.5, 130), a, what="battle at the walls")
for tm in np.arange(a + 0.1, b, 0.35): fx(clash(r) * 0.35, tm + r.uniform(0, 0.2), 1.0, r.uniform(-0.8, 0.8))
for tm in np.arange(B("sultan"), b, BEAT): fx(thump(r, 50, 0.4, 0.6), tm, 1.0, -0.2)
# then you hear it: silence but wind; the roar
fx(army_roar(r, 3.0, 1.0), B("roar") - 0.05, 1.0, what="the army's roar")
fx(boom(r, 0.8, 3.0), B("roar"), 1.0, 0.0)
# breaking in: the gate splinters
fx(G.wood_crack(r) * 1.0, B("breaking"), 1.0, 0.0, "gate splinters"); fx(G.timber_tear(r, 1.0) * 0.8, B("breaking") + 0.1, 1.0, 0.1)
fx(army_roar(r, 2.4, 0.6), B("breaking") + 0.4, 1.0)
a, b = SH["breaking"]
for tm in np.arange(B("breaking") + 0.4, b, 0.3): fx(run_step(r, 0.6), tm, 1.0, r.uniform(-0.4, 0.4))
# faster: running, crowds thicken, smoke and fire
a, b = SH["faster"]
for tm in np.arange(a + 0.1, b, 0.17): fx(run_step(r), tm, 1.0, 0.0)
fx(crowd(b - a, r, 12, 0.6, 160), a, what="crowds thicken")
fx(widen(G.rattle(b - a, r, 6) * 0.15 + lp(colored(ns(b - a), r, 1.0), 900) * 0.15, r), a, what="fire crackle")
# the square: distant fighting, crackle, low wind
for sid in ("heart", "late", "endEmpire", "warning", "witnessed"):
    a, b = SH[sid]; fx(crowd(b - a, r, 4, 0.15, 140), a); fx(G.breeze(b - a, r, 0.15, bright=600), a)
# the emperor's last stand: clashes, a shout, the dust swallow
a, b = SH["emperor"]
for tm in np.arange(a + 0.1, B("dies"), 0.3): fx(clash(r) * 0.5, tm, 1.0, r.uniform(-0.6, 0.6))
fx(G.whoa(r, base=120) * 0.5, a + 0.2, 1.0, 0.0, "emperor's battle cry")
fx(G.whoosh(1.2, r, peak=0.5, f_lo=200, f_hi=1500, tail=0.5) * 0.6, B("dies") - 0.1, 1.0, 0.0, "dust swallows the stand")
fx(thump(r, 300, 0.2, 0.4), B("final") + 0.6, 1.0, 0.1, "helmet on the stones")
# the banner comes down and falls
fx(G.flag_flutter(SH["endEmpire"][1] - SH["endEmpire"][0], r) * 0.35, SH["endEmpire"][0], 1.0, 0.3, "banner flutters")
fx(G.whoosh(0.8, r, peak=0.3, f_lo=300, f_hi=2000) * 0.5, B("end"), 1.0, 0.3, "banner falls")

# ---------------------------------------------------------------- mix
voice, _sr = read_wav(sys.argv[1])
if voice.ndim == 1: voice = st(voice)
v = np.zeros((2, N)); v[:, : min(N, voice.shape[1])] = voice[:, :N]
key = np.zeros(N)
for w in WORDS: key[ns(w["s"]): ns(w["e"] + 0.15)] = 1
from scipy import ndimage, signal
key = ndimage.uniform_filter1d(key, ns(0.25))
duck = dbg(-4.0 * key)
VL = integrated(v)
def to_lufs(x, target):
    L = integrated(x)
    return x * dbg(target - L) if np.isfinite(L) else x
mus = to_lufs(mus, VL - 6.0) * duck[None, :]
sfx = to_lufs(sfx, VL - 12.0)
mix = to_lufs(v + mus + sfx, -15.0)
ceil = dbg(-1.2)
up = signal.resample_poly(mix, 4, 1, axis=1)
pk = np.abs(up).max(axis=0).reshape(-1, 4).max(axis=1)[:N]
g = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
g = ndimage.minimum_filter1d(g, ns(0.005)); g = ndimage.uniform_filter1d(g, ns(0.005))
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
