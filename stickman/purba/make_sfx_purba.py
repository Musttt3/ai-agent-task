"""Extra synthesized SFX for the ice-age short: wind, fire crackle, ice crack, snow crunch, pop, bite, pulse."""
import numpy as np, wave, os, sys
SR = 44100
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
rng = np.random.default_rng(11)

def save(name, x, gain=0.9):
    x = np.asarray(x, float)
    if x.ndim == 1: x = np.stack([x, x], 1)
    x = (x / (np.max(np.abs(x)) or 1) * gain * 32767).astype(np.int16)
    with wave.open(os.path.join(out, name + ".wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(x.tobytes())

def t(d): return np.arange(int(SR * d)) / SR
def lp(x, c):
    c = np.broadcast_to(np.asarray(c, float), x.shape); a = np.exp(-2*np.pi*c/SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s = (1-a[i])*x[i] + a[i]*s; y[i] = s
    return y
def hp(x, c): return x - lp(x, c)

# blizzard wind 16 s: band noise with slowly moving cutoff + gusts, stereo decorrelated
d = 16; tt = t(d)
cut = 500 + 450*np.sin(2*np.pi*tt/5.3) + 250*np.sin(2*np.pi*tt/2.1)
L = lp(rng.standard_normal(len(tt)), cut); R = lp(rng.standard_normal(len(tt)), cut*1.1)
g = 0.55 + 0.45*np.sin(2*np.pi*tt/6.7)**2
fade = int(SR*1.5); env = np.ones(len(tt)); env[:fade] = np.linspace(0,1,fade); env[-fade:] = np.linspace(1,0,fade)
save("wind", np.stack([L*g*env, R*g*env], 1), 0.8)

# fire crackle 8 s: low roar + random pops
d = 8; tt = t(d); roar = lp(rng.standard_normal(len(tt)), 300) * 0.6
pops = np.zeros(len(tt))
for _ in range(140):
    i = rng.integers(0, len(tt) - 2000); n = rng.integers(80, 900)
    pops[i:i+n] += hp(rng.standard_normal(n), 1500) * np.exp(-np.arange(n)/SR*rng.uniform(150, 600)) * rng.uniform(0.3, 1.0)
env = np.ones(len(tt)); env[:fade] = np.linspace(0,1,fade); env[-fade:] = np.linspace(1,0,fade)
save("fire", (roar + pops) * env, 0.6)

# ice crack: sharp transient + creaky chirps
d = 1.2; tt = t(d); x = hp(rng.standard_normal(len(tt)), 2000) * np.exp(-tt*25)
for k in range(6):
    i = int(rng.uniform(0.0, 0.5)*SR); n = int(0.05*SR)
    x[i:i+n] += np.sin(2*np.pi*np.linspace(3000, 600, n)*np.arange(n)/SR) * np.exp(-np.arange(n)/SR*60) * 0.8
x += np.sin(2*np.pi*70*tt)*np.exp(-tt*6)*0.8
save("icecrack", x, 0.9)

# snow footsteps crunch x4
step = lp(hp(rng.standard_normal(int(0.22*SR)), 500), 4000) * np.exp(-np.arange(int(0.22*SR))/SR*14)
x = np.zeros(int(SR*2.4))
for k in range(4):
    i = int(k*0.55*SR); x[i:i+len(step)] += step * rng.uniform(0.7, 1.0)
save("crunch", x, 0.6)

# UI pop
d = 0.18; tt = t(d); f = 900*np.exp(-tt*25) + 500
save("pop", np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*22), 0.7)

# bite/crunch
d = 0.35; tt = t(d); save("bite", lp(hp(rng.standard_normal(len(tt)), 800), 3500)*np.exp(-tt*12)*(1+0.5*(rng.random(len(tt))>.97)), 0.7)

# low cinematic pulse bed (100 bpm), 9.6 s loop
d = 9.6; tt = t(d); x = np.zeros(len(tt)); beat = 0.6
for k in range(int(d/beat)):
    i = int(k*beat*SR); n = int(0.4*SR); tb = np.arange(n)/SR
    x[i:i+n] += np.sin(2*np.pi*(45+60*np.exp(-tb*30))*tb) * np.exp(-tb*7) * (1.0 if k % 2 == 0 else 0.6)
pad = sum(np.sin(2*np.pi*fr*tt) for fr in [110, 130.8, 164.8]) * 0.12 * (0.6+0.4*np.sin(2*np.pi*tt/4.8))
save("pulse", x + pad, 0.6)
print(sorted(os.listdir(out)))
