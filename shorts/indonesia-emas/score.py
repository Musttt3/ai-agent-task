"""Original score for "Kalau Besok Indonesia Jadi Negara Emas" (Art Deco: 1930s symphonic jazz, not big band).

Reads timeline.json (same clock as the picture) and writes out/score.wav (+ stems) and out/score.json (hit times).
A  foxtrot 128 bpm, F major: stride piano, walking jazz bass, brushes, clarinet theme in fragments, muted-trumpet answers;
   counted light = xylophone notes (one per bulb / window), door splits = harp glissandi, medallions = glockenspiel.
B  stop: nothing (the film's real silence).
C  comic fill: pizzicato question figure, xylophone run up the marquee, trombone "wah" on "nggak".
D  ballad 76 bpm: strings + piano, the clarinet theme stated whole for the first time; swell + fanfare chord at the peak.
E  the question: tubular bell, a suspended chord that does not resolve.
usage: <lib>/.venv/bin/python score.py   (LIB env var = library root)
"""
import json, os, sys
import numpy as np, soundfile as sf
LIB = os.environ.get("LIB", "/root/lemo-opuscar")
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, "timeline.json")))
K, SEC, DUR = TL["keys"], TL["sections"], TL["DUR"]
LINES = {L["id"]: L for L in TL["lines"]}
SHOT = {n: t for n, t in TL["shots"]}

N = lambda name: S.midi(name) if hasattr(S, "midi") else name
ev = []          # (t, inst, pitch, dur, vel, pan, gain)
hits = {}
def note(t, inst, p, d, v=.7, pan=0., gain=1.):
    if t < 0 or t >= DUR: return
    ev.append((float(t), inst, p, float(d), float(v), float(pan), float(gain)))

def midi(p):
    names = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
    if isinstance(p, (int, float)): return p
    n = names[p[0]]; i = 1
    while i < len(p) and p[i] in "#b": n += 1 if p[i] == "#" else -1; i += 1
    return n + 12 * (int(p[i:]) + 1)
def pn(m):
    return ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][int(m) % 12] + str(int(m) // 12 - 1)

# ---------------- A: foxtrot ----------------
A0, A1 = 0.0, SEC["B"]
bA = 60 / TL["bpmA"]; bar = 4 * bA
CH = [  # 8-bar loop: (root, chord tones for the piano's off-beat chords)
    ("F2", ["A3", "C4", "D4", "F4"]), ("D2", ["F#3", "C4", "D4", "A4"]), ("G2", ["F3", "Bb3", "D4", "G4"]), ("C2", ["E3", "Bb3", "C4", "G4"]),
    ("F2", ["A3", "C4", "D4", "F4"]), ("F2", ["A3", "C4", "Eb4", "F4"]), ("Bb1", ["F3", "Bb3", "D4", "G4"]), ("C2", ["E3", "Bb3", "C4", "G4"]),
]
WALK = {"F2": ["F2", "A2", "C3", "D3"], "D2": ["D2", "F#2", "A2", "C3"], "G2": ["G2", "Bb2", "D3", "E3"], "C2": ["C2", "E2", "G2", "Bb2"], "Bb1": ["Bb1", "D2", "F2", "G2"]}
THEME = [("C5", 0, 1), ("A4", 1, .5), ("C5", 1.5, .5), ("D5", 2, 1), ("F5", 3, 1.6), ("E5", 4.5, .5), ("D5", 5, .5), ("C5", 5.5, 1), ("A4", 6.5, 1.4)]  # beats
nbars = int((A1 - A0) / bar) + 1
# intro bar: harp glissando up into bar 2, strings swell
for i in range(14):
    note(.05 + i * .055, "harp", pn(midi("F3") + [0, 2, 4, 5, 7, 9, 11][i % 7] + 12 * (i // 7)), .9, .55 + i * .02, -.2 + i * .03)
note(0.0, "violins_trem", "F4", bar, .3, .2, .7); note(0.0, "cellos", "F2", bar, .35, -.2, .8)
for b in range(1, nbars):
    t0 = A0 + b * bar
    if t0 >= A1 - .05: break
    root, chord = CH[(b - 1) % 8]
    # stride: bass on 1 & 3, chord on 2 & 4
    note(t0, "piano", root.replace("2", "2"), .4, .62, -.15)
    note(t0 + 2 * bA, "piano", pn(midi(root) + 7), .4, .55, -.15)
    for beat in (1, 3):
        for c in chord: note(t0 + beat * bA, "piano", c, .3, .42, -.05)
    # walking bass
    for k, p in enumerate(WALK[root]): note(t0 + k * bA, "jazz_bass", p, bA * .95, .72, .1)
    # brushes: soft taps on every beat, accent on 2 & 4, swung eighth pickups
    for k in range(4):
        note(t0 + k * bA, "snare2", "taps", .2, .26 if k % 2 == 0 else .4, .25, .6)
        note(t0 + k * bA + bA * .66, "hihat", "closed", .1, .18, .35, .5)
    # the theme in fragments: clarinet on bars 1-2 of each 8, cut short; muted trumpet answers on bar 5
    ph = (b - 1) % 8
    if ph == 0 and b < nbars - 2:
        for p, st, ln in THEME[:5]: note(t0 + st * bA, "clarinet", p, ln * bA * .95, .55, -.25, .9)
    if ph == 4:
        for p, st, ln in [("A4", 0, .5), ("G4", .5, .5), ("F4", 1, 1.5)]: note(t0 + st * bA, "trumpet_mute", p, ln * bA, .5, .3, .8)
# counted light: xylophone up the scale for INDONESIA; EMAS? on tubular bell + chord
scaleF = [midi(x) for x in ["F5", "G5", "A5", "Bb5", "C6", "D6", "E6", "F6", "G6"]]
for i in range(9): note(K["indonesia1"] + i * .07, "xylophone", pn(scaleF[i]), .4, .55, -.4 + i * .1)
for i, d in enumerate([0, .06, .12, .18]): note(K["emas"] + d, "xylophone", pn(midi("A6") + [0, 3, 7, 12][i] - 12), .4, .6, 0)
note(K["emas"] + .45, "tubular_bells", "F4", 3, .7, 0); hits["emas"] = K["emas"] + .45
for c in ["F3", "A3", "C4", "F4"]: note(K["emas"] + .45, "piano", c, 1.5, .6, 0)
# door splits: harp glissandi
for n in ("bedroom", "street", "village", "overhead", "towers"):
    t = SHOT[n]
    for i in range(10): note(t - .25 + i * .03, "harp", pn(midi("C4") + [0, 2, 4, 7, 9][i % 5] + 12 * (i // 5)), .7, .5, (i - 5) * .08)
# phone medallions: glockenspiel
for k, p in (("lapangan", "C6"), ("gaji", "E6"), ("harga", "G6")): note(K[k], "glockenspiel", p, .8, .55, .2)
# village windows: xylophone, one per house
for i in range(6):
    t = K["listrik"] + (K["andal"] - K["listrik"] + .3) * i / 5
    note(t, "xylophone", pn(midi("C6") + [0, 2, 4, 7, 9, 12][i]), .4, .5, -.3 + i * .12)
# tram: trumpet fall; traffic gauge lands: glock
note(K["transportasi"] - .1, "trumpet_mute", "C5", .25, .55, .4); note(K["transportasi"] + .15, "trumpet_mute", "A4", .25, .5, .4); note(K["transportasi"] + .4, "trumpet_mute", "F4", .6, .5, .4)
note(K["kemacetan"] + .3, "glockenspiel", "F6", 1, .5, 0)
note(K["maju"], "trumpet_mute", "F5", .9, .55, .3); note(K["maju"], "glockenspiel", "A6", 1, .5, -.2)

# ---------------- C: comic fill ----------------
C0 = SEC["C"]
for i, p in enumerate(["C4", "E4", "G4", "Bb4", "D5"]): note(C0 + .1 + i * .32, "violins_pizz", p, .3, .55, .3)
note(C0 + .1, "cellos_pizz", "C3", .4, .6, -.3); note(C0 + 1.0, "cellos_pizz", "G2", .4, .55, -.3)
for i in range(9): note(SHOT["marquee"] + .15 + i * .1, "xylophone", pn(midi("C5") + [0, 2, 4, 5, 7, 9, 11, 12, 14][i]), .3, .5, -.4 + i * .1)
for i, p in enumerate(["Bb3", "A3", "Ab3", "G3"]): note(K["nggak"] + .02 + i * .16, "trombone", p, .22 if i < 3 else .7, .6, 0)
hits["nggak"] = K["nggak"]

# ---------------- D: ballad ----------------
D0 = SEC["D_beat0"]; bD = 60 / TL["bpmD"]; barD = 4 * bD
CHD = [("F2", ["F3", "A3", "C4"]), ("A2", ["E3", "A3", "C4"]), ("Bb2", ["D3", "F3", "Bb3"]), ("C3", ["E3", "G3", "C4"]),
       ("D2", ["D3", "F3", "A3"]), ("Bb2", ["D3", "F3", "Bb3"]), ("G2", ["F3", "Bb3", "D4"]), ("C3", ["E3", "Bb3", "C4"])]
E0 = SHOT["dial"]
peak = K["kemajuannya"]
for b in range(8):
    t0 = D0 + b * barD
    if t0 >= E0 - .2: break
    root, ch = CHD[b]
    sw = 1 + .8 * max(0, min(1, (t0 - K["rakyat"]) / 2))
    note(t0, "cellos", root, barD, .42 * sw, -.25, .8); note(t0, "contrabass", pn(midi(root) - 12), barD, .38, -.1, .6)
    for c in ch: note(t0, "violins", pn(midi(c) + 12), barD, .3 * sw, .25, .55)
    for k in range(8):   # piano arpeggio in eighths
        note(t0 + k * bD / 2, "piano", ch[k % 3] if k % 4 < 3 else pn(midi(ch[0]) + 12), .6, .3, -.05)
# the theme, whole, on clarinet (first full statement = the payoff)
for p, st, ln in THEME: note(D0 + barD + st * bD, "clarinet", p, ln * bD * .98, .6, -.2, 1.0)
for p, st, ln in THEME[:5]: note(D0 + 3 * barD + st * bD, "violin", pn(midi(p)), ln * bD * .98, .5, .2, .8)
# the peak: fanfare chord with timpani roll and cymbal as the red fills the city
for c in ["F3", "C4", "F4", "A4", "C5"]: note(peak + .1, "horn", c, 2.4, .6, 0, .7)
for c in ["F4", "A4", "C5", "F5"]: note(peak + .1, "violins", c, 2.6, .55, .2, .7)
note(peak + .1, "trombone", "F3", 2.0, .55, -.2, .7); note(peak + .1, "trumpet", "C5", 1.8, .5, .3, .6)
note(peak - .9, "timpani", "F2", 1.0, .5, 0); note(peak - .45, "timpani", "C3", .6, .45, 0); note(peak + .1, "sus_cymbal", "cresc", 1.4, .45, 0, .6)
hits["peak"] = peak + .1

# ---------------- E: the question ----------------
note(E0 + .05, "violins_trem", "Bb4", 6, .25, .2, .6); note(E0 + .05, "violins_trem", "C5", 6, .22, .25, .55)
note(E0 + .05, "cellos", "G2", 6, .3, -.2, .7); note(E0 + .05, "clarinet", "D5", 2.5, .35, -.3, .7)
note(K["itu"], "tubular_bells", "C5", 4, .65, 0); note(K["itu"], "harp", "G4", 3, .5, -.2); note(K["itu"], "harp", "C5", 3, .5, .2)
for c in ["G3", "C4", "F4", "Bb4"]: note(K["itu"], "piano", c, 3, .4, 0)        # suspended, unresolved
hits["itu"] = K["itu"]

# ---------------- render ----------------
B_, C_ = SEC["B"], SEC["C"]
ev2 = []
for e in ev:
    t, inst, p, d = e[0], e[1], e[2], e[3]
    if B_ - .02 <= t < C_ - .05: continue                       # B is silent
    if t < B_ and t + d > B_: d = max(.05, B_ - t - .01)         # A stops dead at B
    ev2.append(dict(t=t, inst=inst, pitch=p, dur=d, vel=e[4], pan=e[5], gain=e[6]))
mix = S.render(ev2, dur=DUR + 1)
# hard stop at B (tape-stop-quick fade), and nothing until C
fade = int(.04 * SR); b0 = int(B_ * SR)
mix[b0:b0 + fade] *= np.linspace(1, 0, fade)[:, None]; mix[b0 + fade:int((C_ - .06) * SR)] = 0
mix = S.room(mix, size=.5, mix=.16)
# the reverb must not leak into the silence: let the last chord ring .3 s, then nothing until C
r0, r1, ce = int((B_ + .02) * SR), int((B_ + .32) * SR), int((C_ - .06) * SR)
mix[r0:r1] *= np.linspace(1, 0, r1 - r0)[:, None] ** 2; mix[r1:ce] = 0
mix = np.stack([limit(mix[:, 0], .9), limit(mix[:, 1], .9)], 1)
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
sf.write(os.path.join(HERE, "out/score.wav"), mix[:int((DUR + .5) * SR)], SR)
json.dump({"hits": hits, "events": len(ev2)}, open(os.path.join(HERE, "out/score.json"), "w"), indent=1)
print("score:", len(ev2), "notes,", round(DUR, 2), "s ->", "out/score.wav")
