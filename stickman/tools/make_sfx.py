"""Synthesize the sound effects used in the edit (no external samples needed)."""
import numpy as np, wave, os, sys
SR = 44100
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = np.random.default_rng(7)

def save(name, x, gain=0.9):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    peak = np.max(np.abs(x)) or 1
    x = (x / peak * gain * 32767).astype(np.int16)
    with wave.open(os.path.join(out, name + ".wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(x.tobytes())

def t(d): return np.arange(int(SR * d)) / SR
def env(n, a, r):  # attack/release in samples-fraction
    e = np.ones(n); A = max(1, int(n * a)); R = max(1, int(n * r))
    e[:A] = np.linspace(0, 1, A); e[-R:] = np.linspace(1, 0, R) ** 2
    return e
def lowpass(x, cutoff):
    # one-pole, cutoff may be array
    c = np.broadcast_to(np.asarray(cutoff, float), x.shape)
    a = np.exp(-2 * np.pi * c / SR); y = np.zeros_like(x); s = 0.0
    for i in range(len(x)):
        s = (1 - a[i]) * x[i] + a[i] * s; y[i] = s
    return y
def highpass(x, cutoff): return x - lowpass(x, cutoff)

# whoosh: noise swept band
d = 0.55; n = int(SR * d); x = rng.standard_normal(n)
sweep = np.concatenate([np.geomspace(300, 4000, n // 2), np.geomspace(4000, 500, n - n // 2)])
w = highpass(lowpass(x, sweep), 150) * np.sin(np.linspace(0, np.pi, n)) ** 2
pan = np.linspace(-1, 1, n)
save("whoosh", np.stack([w * (1 - pan) / 2 + w * .3, w * (1 + pan) / 2 + w * .3], 1), 0.7)

# impact / boom
d = 2.2; tt = t(d); f = 55 * np.exp(-tt * 1.5) + 30
boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 2.2)
boom += lowpass(rng.standard_normal(len(tt)), 900) * np.exp(-tt * 9) * 3
save("impact", boom, 0.95)

# knock (single wooden/metal door knock)
d = 0.35; tt = t(d)
k = (np.sin(2 * np.pi * 120 * tt) * .9 + np.sin(2 * np.pi * 210 * tt) * .5 + np.sin(2*np.pi*95*tt)) * np.exp(-tt * 28)
k += lowpass(rng.standard_normal(len(tt)), 1800) * np.exp(-tt * 70) * 1.5
save("knock", k, 0.95)
# three knocks
seq = np.zeros(int(SR * 1.6))
for i, s in enumerate([0, .5, 1.0]):
    a = int(s * SR); seq[a:a + len(k)] += k * (1 - .1 * i)
save("knock3", seq, 0.95)

# radio static (3s, loopable feel)
d = 3.0; tt = t(d); st = highpass(rng.standard_normal(len(tt)), 900)
st *= 0.6 + 0.4 * (rng.random(len(tt)) > 0.002).astype(float)
st *= 0.75 + 0.25 * np.sin(2 * np.pi * 3.1 * tt)
save("static", st * env(len(tt), .03, .1), 0.35)

# heartbeat (2 beats, 1.0s cycle)
d = 1.0; tt = t(d); hb = np.zeros(len(tt))
for s, a in [(0.0, 1.0), (0.22, 0.7)]:
    i = int(s * SR); tb = tt[: len(tt) - i]
    hb[i:] += a * np.sin(2 * np.pi * 50 * tb) * np.exp(-tb * 18)
save("heartbeat", np.tile(hb, 4), 0.9)

# clock tick x4
tick = np.zeros(int(SR * 4)); tk = highpass(rng.standard_normal(int(SR * .03)), 2500) * np.exp(-np.arange(int(SR*.03)) / SR * 200)
for i in range(4):
    a = int(i * SR); tick[a:a + len(tk)] += tk
save("ticks", tick, 0.6)

# glitch / memory loss: bitcrushed chirps
d = 0.7; tt = t(d)
g = np.sign(np.sin(2 * np.pi * (200 + 2600 * (rng.random(len(tt)) > .5)) * tt)) * (rng.random(len(tt)) > .4)
g = np.repeat(g[::8], 8)[: len(tt)] * env(len(tt), .02, .3)
save("glitch", g, 0.35)

# riser (tension build, 3s)
d = 3.0; tt = t(d); f = np.geomspace(80, 900, len(tt))
r = np.sin(2 * np.pi * np.cumsum(f) / SR) * .4 + highpass(lowpass(rng.standard_normal(len(tt)), f * 3), 200) * .6
r *= (tt / d) ** 2
save("riser", r, 0.6)

# camera / phone tap
d = .12; tt = t(d); ct = highpass(rng.standard_normal(len(tt)), 3000) * np.exp(-tt * 60) + np.sin(2*np.pi*1800*tt)*np.exp(-tt*80)*.5
save("tap", ct, 0.5)

# page flip
d = .5; tt = t(d); pf = highpass(lowpass(rng.standard_normal(len(tt)), 3500), 600) * np.sin(np.linspace(0, np.pi, len(tt))) ** 3
save("page", pf, 0.45)

# sting (dissonant cluster hit) for scares
d = 2.5; tt = t(d); sting = sum(np.sin(2*np.pi*fr*tt + rng.random()*6) for fr in [311, 329.6, 466, 622]) * np.exp(-tt * 1.6)
sting += np.sin(2*np.pi*41*tt)*np.exp(-tt*2)*2
save("sting", sting, 0.6)

# soft chime (warm moments / title)
d = 2.5; tt = t(d); ch = sum(np.sin(2*np.pi*fr*tt)/(i+1) for i, fr in enumerate([523.25, 659.25, 783.99, 1046.5])) * np.exp(-tt*2)
save("chime", ch, 0.4)

# sea waves ambience (12s)
d = 12; tt = t(d); wv = lowpass(rng.standard_normal(len(tt)), 700)
wv *= 0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * tt / 6 - np.pi / 2)) ** 2
save("waves", wv * env(len(tt), .1, .1), 0.4)

# dark drone bed (20s, loopable): detuned low sines + filtered noise
d = 20; tt = t(d)
dr = (np.sin(2*np.pi*55*tt) + np.sin(2*np.pi*55.4*tt) + .6*np.sin(2*np.pi*82.4*tt) + .3*np.sin(2*np.pi*110.3*tt))
dr *= 0.8 + 0.2 * np.sin(2 * np.pi * tt / 10)
dr += lowpass(rng.standard_normal(len(tt)), 250) * 1.2
fade = int(SR * 2); dr[:fade] *= np.linspace(0, 1, fade); dr[-fade:] *= np.linspace(1, 0, fade)
save("drone", dr, 0.5)
print("ok", sorted(os.listdir(out)))
