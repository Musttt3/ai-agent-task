# Soundtrack for "Operation Mincemeat": voice-over + supplied SFX pack + ambience lifted from the clips + an
# original synthesized underscore (drone, clock tick, pads, impacts, risers), ducked under the voice and
# mastered to -14 LUFS / -1 dBTP.  Writes public/audio/mix.wav and audio/cues.md.
#
#   python3 audio/mix.py          (run from shorts/mincemeat after scripts/export_timeline.mjs)
import json
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from dsp import SR, TAU, ns, rng, lp, hp, bp, colored, fades, place, pan, make_ir, convolve_st, integrated, true_peak, dbg, write_wav  # noqa: E402
import instruments as I  # noqa: E402
from sfx_gen import whoosh  # noqa: E402

ROOT = os.path.dirname(HERE)
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
DUR = TL['duration']
N = ns(DUR)
SRC = os.path.join(HERE, 'sfx_src')
MEDIA = os.path.join(ROOT, 'public', 'media')
VO_PATH = os.environ.get('VO', os.path.join(HERE, 'vo.mp3'))

vo = np.zeros((2, N))
sfx = np.zeros((2, N))
amb = np.zeros((2, N))
mus = np.zeros((2, N))
cues = []


def load(path, start=0.0, dur=None, atempo=None):
    cmd = ['ffmpeg', '-v', 'error', '-ss', f'{start:.3f}']
    if dur is not None:
        cmd += ['-t', f'{dur * (atempo or 1):.3f}']
    cmd += ['-i', path, '-vn']
    if atempo:
        cmd += ['-af', f'atempo={atempo}']
    cmd += ['-ac', '2', '-ar', str(SR), '-f', 'f32le', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(np.float64)


def peak_norm(x, db=-1.0):
    m = np.abs(x).max()
    return x if m == 0 else x * dbg(db) / m


def fx(name, t, start=0.0, dur=None, db=-12.0, fin=0.004, fout=0.08, what=None, p=None):
    """place a slice of a supplied SFX file at timeline time t, peak-normalised then set to `db` dBFS peak"""
    x = load(os.path.join(SRC, name), start, dur)
    x = peak_norm(x, db)
    x = np.stack([fades(x[0], fin, fout), fades(x[1], fin, fout)])
    if p is not None:
        m = x.mean(axis=0)
        x = pan(m, p) / np.sqrt(2)
    place(sfx, x, t)
    cues.append((t, what or name.split('-', 1)[-1][:40]))


def syn(x, t, gain=1.0, what=None, bus=None):
    place(sfx if bus is None else bus, x, t, gain)
    if what:
        cues.append((t, what))


F = {
    'whoosh': 'freesound_community-quick-swhooshing-noise-80898.mp3',
    'body': 'freesound_community-bodyfall-on-carpetwav-14747.mp3',
    'block': 'freesound_community-small-wood-block-64458.mp3',
    'type': 'freesound_community-typewriter-typing-68696.mp3',
    'typescroll': 'freesound_community-typewriter-scrolling-44786.mp3',
    'paperslide': 'mixkit-paper-slide-1530.wav',
    'paper': 'lenspulse-foley-paper-handling-amp-page-turning-sfx-584919.mp3',
    'flip': 'freesound_community-page-flip-47177.mp3',
    'shutter': 'universfield-camera-shutter-199580.mp3',
    'shutter2': 'freesound_community-camera-shutter-6305.mp3',
    'polaroid': 'freesound_community-polaroid-foley-30001.mp3',
    'cloth': 'freesound_community-rough-cloth-43926.mp3',
    'zipper': 'u_k6drbrhips-zipper-sound-298608.mp3',
    'drawer': 'freesound_community-drawer-open-mid-84663.mp3',
    'pencil': 'freesound_community-pencil-29272.mp3',
    'chalk': 'dishantbabariya-chalk-slide-short-516557.mp3',
    'click': 'universfield-click-button-140881.mp3',
    'mouse': 'universfield-computer-mouse-click-352734.mp3',
    'breaker': 'freesound_community-circuit-breaker-3-dp-107144.mp3',
    'tape': 'freesound_community-tape-player-sounds-90780.mp3',
    'match': 'spinopel-strike-a-match-381917.mp3',
    'sticky': 'freesound_community-removing-sticky-notes-44866.mp3',
    'coin': 'universfield-spinning-coin-on-table-352448.mp3',
}

# ------------------------------------------------------------------ synthesized elements


def boom(r, f0=95, f1=30, dur=2.2, noise=0.5, drive=1.6):
    """cinematic low impact: pitch-dropping sine + noise thump, saturated"""
    n = ns(dur)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.18)
    ph = TAU * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t / 0.75)
    y += noise * lp(r.standard_normal(n), 900) * np.exp(-t / 0.05)
    y = np.tanh(drive * y) / np.tanh(drive)
    return fades(y, 0.001, 0.3)


def tick(r, f=2300, g=1.0):
    n = ns(0.09)
    t = np.arange(n) / SR
    y = bp(r.standard_normal(n), 1500, 7000) * np.exp(-t / 0.004) * 0.7
    y += np.sin(TAU * f * t) * np.exp(-t / 0.012) * 0.5 + np.sin(TAU * f * 1.51 * t) * np.exp(-t / 0.008) * 0.25
    return fades(y * g, 0.0005, 0.02)


def riser(r, dur, f0=180, f1=1400):
    n = ns(dur)
    t = np.arange(n) / SR
    u = t / dur
    nz = colored(n, r, 0.3)
    y = np.zeros(n)
    # crude time-varying band: crossfade 6 bands as the centre rises
    bands = np.geomspace(f0, f1, 6)
    for i, fc in enumerate(bands):
        w = np.clip(1 - np.abs(u * (len(bands) - 1) - i), 0, 1)
        y += bp(nz, fc / 1.4, fc * 1.4) * w
    sweep = np.sin(TAU * np.cumsum(f0 * 0.5 * (f1 / f0) ** u) / SR) * 0.25
    y = (y / (np.abs(y).max() + 1e-9) + sweep) * u ** 2.5
    return fades(y, 0.05, 0.01)


def sub_hit(r, f=48, dur=1.0):
    n = ns(dur)
    t = np.arange(n) / SR
    return fades(np.sin(TAU * f * t) * np.exp(-t / 0.35) * (1 - np.exp(-t / 0.004)), 0.0005, 0.1)


def drone(dur, f, r, warm=260, lfo=0.07):
    n = ns(dur)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for k, (m, a) in enumerate([(1, 1.0), (2, 0.45), (3, 0.18), (0.5, 0.6)]):
        y += a * np.sin(TAU * f * m * t * (1 + 0.0015 * np.sin(TAU * (0.11 + k * 0.03) * t)) + r.uniform(0, TAU))
    y = lp(y, warm)
    y *= 0.75 + 0.25 * np.sin(TAU * lfo * t + r.uniform(0, TAU))
    return y


def env(n, att, rel):
    e = np.ones(n)
    a, b = ns(att), ns(rel)
    e[:a] = np.linspace(0, 1, a) ** 2
    e[n - b:] *= np.linspace(1, 0, b) ** 2
    return e


R = rng(11)
m2f = I.m2f

# ------------------------------------------------------------------ voice-over
v = load(VO_PATH)
place(vo, v, 0.0)

# ------------------------------------------------------------------ ambience from the clips
AMB_DB = {'s01': -30, 's03': -32, 's05': -34, 's08': -34, 's09': -22, 's10': -34, 's11': -32, 's12': -17}
shots = TL['shots']
for i, s in enumerate(shots):
    if s['kind'] != 'video' or s['id'] not in AMB_DB:
        continue
    pin = 0 if i == 0 else TL['pad'][s['in']]
    nxt = shots[i + 1] if i + 1 < len(shots) else None
    pout = TL['pad'][nxt['in']] if nxt else 0
    a = s['start'] - pin
    dur = s['end'] + pout - a
    rate = s.get('rate', 1)
    x = load(os.path.join(ROOT, 'public', s['src']), s.get('trimStart', 0), dur, atempo=rate if rate != 1 else None)
    rms = np.sqrt(np.mean(x ** 2)) + 1e-9
    x = x / rms * dbg(AMB_DB[s['id']])
    x = np.stack([fades(x[0], 0.12, 0.2), fades(x[1], 0.12, 0.2)])
    place(amb, x, a)

# ------------------------------------------------------------------ underscore (D minor)
# drone bed across the whole piece; it drops out for the power-cut at 58.15 and the title hit
D2 = m2f(38)
d = drone(DUR, D2, R)
e = np.ones(N)
t_all = np.arange(N) / SR
e *= np.clip(t_all / 1.5, 0, 1)
gap = (t_all > 58.1) & (t_all < 60.45)
e[gap] = 0.08
e = lp(e, 8)  # smooth the gap edges
mus += np.stack([d * e, d * e]) * 0.22

# pads: chord per section
CH = [
    (0.0, 7.6, [50, 53, 57]),  # Dm
    (9.3, 13.3, [46, 50, 53]),  # Bb
    (13.3, 18.7, [43, 46, 50, 55]),  # Gm
    (18.7, 23.85, [50, 53, 57, 60]),  # Dm7
    (23.85, 29.25, [46, 50, 53, 57]),  # Bbmaj7
    (29.25, 33.65, [45, 49, 52, 55]),  # A7 (the love letter, warmer)
    (33.65, 39.25, [50, 53, 56]),  # Ddim-ish tension
    (39.25, 43.5, [43, 46, 50]),  # Gm (night sea)
    (43.5, 47.9, [44, 48, 51]),  # Ab (Berlin, foreign)
    (47.9, 52.85, [45, 48, 52, 55]),  # Am7 -> leads to the turn
    (52.85, 58.1, [50, 53, 57, 62]),  # Dm (invasion)
    (61.5, 70.5, [50, 53, 57, 64]),  # Dm(add9) coda
]
for a, b, notes in CH:
    p = I.pad([m2f(n) for n in notes], b - a, vel=0.12, r=rng(int(a * 10)), att=0.5, rel=1.0, warm=700, detune=9)
    place(mus, p, a)

# clock tick: slow in the hook, 2/s through the plot, stops for the invasion
ticks = []
tt_ = 0.0
while tt_ < 7.4:
    ticks.append((tt_, 0.6))
    tt_ += 1.0
tt_ = 9.3
k = 0
while tt_ < 52.7:
    acc = 1.0 if k % 2 == 0 else 0.7
    if tt_ > 33.6:
        acc *= 1.15  # tension rises
    ticks.append((tt_, acc))
    tt_ += 0.5
    k += 1
for i, (tk, g) in enumerate(ticks):
    place(mus, pan(tick(rng(i), 2300 if i % 2 == 0 else 1900, g), -0.25 if i % 2 else 0.25) / np.sqrt(2), tk, 0.11)

# heartbeat-like sub pulses under the body reveal and the dressing scenes
for tb in np.arange(18.9, 29.0, 1.05):
    place(mus, sub_hit(R, 46, 0.6), tb, 0.35)
    place(mus, sub_hit(R, 44, 0.5), tb + 0.24, 0.22)

# invasion: low war drums (timpani) on a driving 8th pattern
for j, tb in enumerate(np.arange(52.85, 58.0, 0.35)):
    g = 0.5 if j % 4 == 0 else 0.3
    place(mus, I.timpani(m2f(38 if j % 8 < 6 else 41), vel=g, r=rng(500 + j)), tb, 0.5)

# coda: sparse vibraphone motif
coda = [(61.7, 62), (62.6, 65), (63.5, 69), (64.4, 64), (65.6, 62), (66.5, 65), (67.4, 69), (68.3, 74)]
for tb, nn in coda:
    place(mus, I.vibes(m2f(nn), vel=0.22, r=rng(int(tb * 7)), dur=2.6), tb, 0.6)

# ------------------------------------------------------------------ impacts, risers, whooshes (synth)
syn(riser(rng(1), 1.6), 7.6 - 1.6, 0.18, 'riser into the body reveal')
syn(boom(rng(2), 90, 30, 2.4), 7.6, 0.75, 'impact: cut to the body')
syn(boom(rng(3), 70, 28, 2.6, noise=0.3), 8.28, 0.9, "impact: 'mayat'")
syn(boom(rng(4), 85, 32, 2.0), 35.32, 0.6, 'impact: TOP SECRET')
syn(boom(rng(5), 85, 30, 2.0), 48.44, 0.6, 'impact: TERTIPU')
syn(riser(rng(6), 1.2, 200, 1800), 52.85 - 1.2, 0.2, 'riser into the invasion')
syn(boom(rng(7), 100, 30, 2.8, noise=0.8), 52.85, 0.85, 'impact: invasion flash')
syn(boom(rng(8), 80, 30, 2.0), 53.98, 0.55, "impact: '1943'")
syn(riser(rng(9), 1.3, 150, 1200), 60.48 - 1.3, 0.14, 'riser into the title')
syn(boom(rng(10), 75, 26, 3.2, noise=0.4), 60.48, 0.85, 'impact: MINCEMEAT')
syn(boom(rng(12), 60, 25, 3.5, noise=0.2), 69.55, 0.55, 'final low hit')

ir = make_ir(2.8, 4, hf=1.6)
for s in shots:
    if s['in'] in ('whip', 'whipV', 'zoom'):
        w = whoosh(0.55, rng(int(s['start'] * 10)), peak=0.25, f_lo=300, f_hi=3000)
        syn(np.stack([w, w]), s['start'] - 0.27, 0.35, f"synth whoosh ({s['in']}) {s['id']}")

# ------------------------------------------------------------------ supplied SFX, synced to picture
# hook (0-7.6)
fx(F['tape'], 0.0, 1.9, 1.2, db=-24, fin=0.05, fout=0.3, what='tape start (archive)')
fx(F['zipper'], 1.0, 0.0, 2.6, db=-24, fout=0.4, what='body-bag zipper')
fx(F['type'], 0.5, 2.40, 1.25, db=-16, what="typewriter: '1943'")
fx(F['block'], 4.34, 8.10, 0.5, db=-18, what="hit: 'NAZI'")
# body (7.6-9.3)
fx(F['body'], 7.62, 0.30, 1.4, db=-8, what='bodyfall on the cut')
fx(F['cloth'], 7.9, 8.6, 1.0, db=-24, what='sheet rustle')
# Sicily (9.3-13.3)
fx(F['whoosh'], 9.05, 0.0, None, db=-16, what='whoosh: light leak')
fx(F['mouse'], 10.32, 0.0, None, db=-20, what='HUD tag')
fx(F['typescroll'], 11.65, 0.2, 0.7, db=-18, what='HUD typing')
fx(F['paperslide'], 11.85, 0.0, None, db=-14, what='map card slides in')
fx(F['block'], 12.5, 9.50, 0.45, db=-16, what="pin: 'Sicilia'")
fx(F['chalk'], 12.75, 0.0, 0.7, db=-16, what='arrow: Africa -> Sicily')
# somewhere else (13.3-18.7)
fx(F['pencil'], 16.42, 2.0, 1.4, db=-14, what='dashed arrows to Greece / Sardinia')
fx(F['click'], 17.9, 0.0, None, db=-20, what="pins: 'YUNANI? SARDINIA?'")
fx(F['paperslide'], 18.25, 0.0, 0.8, db=-20, what='map card out')
# the real man (18.7-23.85)
fx(F['drawer'], 19.4, 0.0, None, db=-20, what='morgue drawer')
fx(F['paper'], 21.65, 2.85, 1.1, db=-14, what='dossier lands')
fx(F['type'], 22.5, 4.0, 1.1, db=-14, what="typewriter: 'GLYNDWR MICHAEL'")
fx(F['type'], 23.2, 9.0, 0.7, db=-20, what='typewriter: dates')
# dressing (23.85-29.25)
fx(F['cloth'], 24.1, 0.35, 2.2, db=-16, fout=0.4, what='uniform cloth')
fx(F['mouse'], 24.95, 0.0, None, db=-20, what='callout ring')
fx(F['flip'], 26.6, 0.0, None, db=-12, what='ID card flips')
fx(F['block'], 27.36, 13.25, 0.5, db=-10, what="stamp: 'PALSU'")
fx(F['type'], 28.2, 11.2, 1.1, db=-14, what="typewriter: 'WILLIAM MARTIN'")
# love letter (29.25-33.65)
fx(F['shutter'], 29.05, 0.0, None, db=-10, what='shutter transition')
fx(F['polaroid'], 29.6, 9.9, 1.0, db=-18, what='photo handled')
fx(F['pencil'], 30.35, 12.0, 1.6, db=-15, what="pen writes 'Surat cinta'")
fx(F['mouse'], 31.4, 0.0, None, db=-22, what='callout ring')
# documents (33.65-39.25)
fx(F['sticky'], 33.9, 3.0, 0.8, db=-20, what='briefcase latch')
fx(F['block'], 35.32, 18.0, 0.5, db=-8, what="stamp: 'TOP SECRET'")
fx(F['typescroll'], 35.72, 0.2, 1.2, db=-16, what='typing: DOKUMEN MILITER PALSU')
fx(F['paperslide'], 37.15, 0.0, None, db=-14, what='map card in')
fx(F['chalk'], 37.5, 0.0, None, db=-14, what='arrow to Greece')
fx(F['block'], 38.55, 20.50, 0.45, db=-16, what="pin: 'YUNANI'")
# submarine (39.25-43.5)
fx(F['typescroll'], 39.9, 0.2, 1.6, db=-18, what='HUD typing: HMS SERAPH')
fx(F['mouse'], 42.05, 0.0, None, db=-16, what='reticle lock')
fx(F['click'], 42.25, 0.0, None, db=-18, what='coordinates')
# to Berlin (43.5-47.9)
fx(F['whoosh'], 43.25, 0.0, None, db=-16, what='whoosh: light leak')
fx(F['paper'], 44.4, 0.2, 1.4, db=-16, what='Germans handle the papers')
fx(F['paperslide'], 44.5, 0.0, None, db=-16, what='map card in')
fx(F['pencil'], 45.1, 20.0, 1.0, db=-16, what='route Huelva -> Madrid')
fx(F['chalk'], 45.8, 0.0, None, db=-14, what='route Madrid -> Berlin')
fx(F['block'], 46.8, 21.80, 0.45, db=-14, what="pin: 'BERLIN'")
# fooled (47.9-52.85)
fx(F['block'], 48.44, 22.85, 0.5, db=-8, what="stamp: 'TERTIPU'")
fx(F['paperslide'], 49.85, 0.0, None, db=-16, what='map card in')
fx(F['chalk'], 50.1, 0.0, None, db=-14, what='German arrows south')
fx(F['chalk'], 50.3, 0.0, None, db=-18, what='German arrows south 2')
fx(F['block'], 52.05, 24.15, 0.45, db=-12, what="hit: 'WILAYAH YANG SALAH'")
# invasion (52.85-58.15)
fx(F['type'], 53.6, 14.3, 0.6, db=-14, what='typing: 10 JULI 1943')
fx(F['block'], 56.1, 25.65, 0.45, db=-14, what="hit: 'Sekutu menyerbu Sicilia'")
# title (58.15-61.5)
fx(F['breaker'], 58.12, 0.0, None, db=-8, what='power cut / lamp breaker')
fx(F['coin'], 58.6, 0.0, 1.9, db=-24, fout=0.5, what='coin spins on the desk')
fx(F['typescroll'], 59.75, 0.2, 0.7, db=-14, what="typing: 'OPERATION'")
fx(F['block'], 60.48, 26.65, 0.5, db=-10, what="stamp: 'MINCEMEAT'")
# coda (61.5-70.5)
fx(F['match'], 61.6, 0.55, 1.6, db=-20, fout=0.6, what='match strike (the ironic turn)')
fx(F['paper'], 66.55, 5.30, 1.4, db=-22, what='memorial card')
fx(F['typescroll'], 67.5, 4.4, 1.0, db=-26, what='carriage return')

# reverb send for music + sfx (shared room)
wet = convolve_st(mus * 0.5 + sfx * 0.15, ir) * 0.22

# ------------------------------------------------------------------ ducking + master
voice_env = np.abs(vo).max(axis=0)
k_att = np.exp(-1 / (0.01 * SR))
k_rel = np.exp(-1 / (0.30 * SR))
from scipy import signal  # noqa: E402

# fast peak follower (attack/release) via two one-pole passes
fol = signal.lfilter([1 - k_rel], [1, -k_rel], voice_env)
fol = np.maximum(fol, signal.lfilter([1 - k_att], [1, -k_att], voice_env))
fol = fol / (np.percentile(fol[fol > 1e-4], 90) + 1e-9)
duck_m = dbg(-7.0 * np.clip(fol, 0, 1))
duck_a = dbg(-4.0 * np.clip(fol, 0, 1))

for nm, x in [('voice', vo), ('sfx', sfx), ('music (ducked)', (mus + wet) * duck_m[None, :]), ('ambience (ducked)', amb * duck_a[None, :])]:
    print(f'  stem {nm:18s} {integrated(x):6.1f} LUFS  peak {20*np.log10(np.abs(x).max()+1e-9):6.1f} dBFS')
# bus levels: voice on top, SFX ~8 dB under, music ~9 dB under, clip ambience ~10 dB under
G_SFX, G_MUS, G_AMB = dbg(-8.0), dbg(-9.0), dbg(-6.5)
mix = vo * 1.0 + sfx * G_SFX + (mus + wet) * duck_m[None, :] * G_MUS + amb * duck_a[None, :] * G_AMB

# fade the very end with the picture
fo = np.ones(N)
a = ns(DUR - 0.9)
fo[a:] = np.linspace(1, 0, N - a) ** 2
mix *= fo[None, :]

# loudness to -14 LUFS, then a simple look-ahead peak limiter to -1 dBTP
L = integrated(mix)
mix *= dbg(-14.0 - L)
ceil = dbg(-1.2)
look = ns(0.005)
pk = np.abs(mix).max(axis=0)
need = np.maximum(1.0, pk / ceil)
# spread each gain-reduction over the look-ahead window and release smoothly
from scipy.ndimage import maximum_filter1d  # noqa: E402

need = maximum_filter1d(need, size=2 * look + 1)
gr = 1.0 / need
rel = np.exp(-1 / (0.08 * SR))
gr_s = gr.copy()
for i in range(1, len(gr_s)):  # release smoothing (attack is instant thanks to the look-ahead window)
    gr_s[i] = min(gr[i], gr_s[i - 1] * rel + (1 - rel) * gr[i]) if gr[i] > gr_s[i - 1] else gr[i]
mix *= gr_s[None, :]
for _ in range(3):
    tp = true_peak(mix)
    if tp <= -1.0:
        break
    mix *= dbg(-1.0 - tp - 0.05)

os.makedirs(os.path.join(ROOT, 'public', 'audio'), exist_ok=True)
out = os.path.join(ROOT, 'public', 'audio', 'mix.wav')
write_wav(out, mix, 24)
Lf = integrated(mix)
TP = true_peak(mix)
with open(os.path.join(HERE, 'cues.md'), 'w') as fh:
    fh.write(f'# Cues\n\nLength {DUR:.2f} s, {SR // 1000} kHz stereo. Integrated {Lf:.1f} LUFS, true peak {TP:.1f} dBTP.\n\n')
    for t, w in sorted(cues):
        fh.write(f'- {t:6.2f} s  {w}\n')
print(f'wrote {out}: {Lf:.1f} LUFS, TP {TP:.1f} dBTP, {len(cues)} cues')
