"""Synthesize sound effects and build the SFX track (48 kHz stereo wav)."""
import sys, json, numpy as np, wave

SR = 48000
rng = np.random.default_rng(7)


def env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
    return e


def lowpass(x, cutoff):
    # one-pole lowpass, cutoff may be array
    y = np.zeros_like(x)
    c = np.broadcast_to(np.asarray(cutoff, float), x.shape)
    a = 1 - np.exp(-2 * np.pi * c / SR)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def bandnoise(n, lo, hi):
    x = rng.standard_normal(n)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, n)


def norm(x, peak=0.9):
    m = np.abs(x).max() + 1e-9
    return x / m * peak


def whoosh(dur=0.45, up=True):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    fc = np.linspace(400, 5000, n) if up else np.linspace(5000, 400, n)
    y = lowpass(x, fc) - lowpass(x, fc * 0.25)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return norm(y * e, 0.7)


def boom(dur=1.6, f0=95, f1=38, punch=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.12)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.55)
    click = bandnoise(n, 800, 6000) * np.exp(-t / 0.015) * 0.6 * punch
    rumble = bandnoise(n, 30, 200) * np.exp(-t / 0.8) * 0.5
    return norm(np.tanh(1.6 * (body + click + rumble)), 0.95)


def pop(f=900):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    fr = f * (1 + 1.5 * np.exp(-t / 0.01))
    y = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.03)
    return norm(y, 0.6)


def sparkle(dur=1.2, count=14):
    n = int(dur * SR)
    out = np.zeros(n)
    for k in range(count):
        st = int(rng.uniform(0, dur * 0.7) * SR)
        f = rng.uniform(2500, 7000)
        m = int(0.35 * SR)
        t = np.arange(m) / SR
        tone = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.08)
        end = min(n, st + m)
        out[st:end] += tone[: end - st] * rng.uniform(0.3, 1)
    return norm(out, 0.5)


def riser(dur=1.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 200 * (2 ** (3 * t / dur))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3
    noise = lowpass(rng.standard_normal(n), np.linspace(300, 8000, n)) * 0.7
    e = (t / dur) ** 2
    return norm((tone + noise) * e, 0.7)


def ticks(dur=1.8, rate=9):
    n = int(dur * SR)
    out = np.zeros(n)
    k = 0
    while k / rate < dur:
        st = int(k / rate * SR)
        m = int(0.03 * SR)
        t = np.arange(m) / SR
        c = bandnoise(m, 2000, 9000) * np.exp(-t / 0.004) * (1 if k % 2 else 0.6)
        end = min(n, st + m)
        out[st:end] += c[: end - st]
        k += 1
    return norm(out, 0.45)


def clang(dur=1.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    partials = [220, 563, 917, 1381, 2011, 2733]
    y = sum(np.sin(2 * np.pi * p * t + rng.uniform(0, 6)) * np.exp(-t / (0.5 / (i + 1) ** 0.4)) / (i + 1) ** 0.5
            for i, p in enumerate(partials))
    hit = bandnoise(n, 300, 5000) * np.exp(-t / 0.03)
    low = np.sin(2 * np.pi * 60 * t) * np.exp(-t / 0.25)
    return norm(np.tanh(1.3 * (y + hit + low)), 0.9)


def choir(dur=2.2, root=293.66):
    n = int(dur * SR)
    t = np.arange(n) / SR
    chord = [1, 1.25, 1.5, 2, 2.5]
    y = np.zeros(n)
    for r in chord:
        for det in (-0.004, 0, 0.005):
            f = root * r * (1 + det)
            vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t + rng.uniform(0, 6))
            ph = 2 * np.pi * np.cumsum(f * vib) / SR
            y += np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
    y = lowpass(y, 2200)
    e = np.minimum(1, t / 0.25) * np.minimum(1, (dur - t) / 0.6)
    return norm(y * e, 0.45)


def drone(dur=3.3):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 82.4 * t) + 0.3 * bandnoise(n, 40, 300)
    e = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.8)
    return norm(y * e, 0.5)


def crowd(dur=3.2):
    # murmur/roar: many band-limited noise "voices" with syllabic AM
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for k in range(12):
        lo = rng.uniform(250, 500)
        v = bandnoise(n, lo, lo * 3.5)
        am = 0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(2.5, 5.5) * t + rng.uniform(0, 6)) ** 2
        y += v * am
    e = np.minimum(1, t / 0.3) * np.minimum(1, (dur - t) / 0.5)
    return norm(y * e, 0.55)


SFX = {
    "whoosh": lambda: whoosh(0.42, True),
    "whoosh_dn": lambda: whoosh(0.4, False),
    "boom": lambda: boom(),
    "hit": lambda: boom(0.9, 140, 60, 1.4),
    "pop": lambda: pop(900),
    "pop_hi": lambda: pop(1400),
    "sparkle": lambda: sparkle(),
    "riser": lambda: riser(0.9),
    "ticks": lambda: ticks(1.8),
    "clang": lambda: clang(),
    "choir": lambda: choir(),
    "drone": lambda: drone(),
    "crowd": lambda: crowd(),
}


def main(cues_path, out_path, total):
    cues = json.load(open(cues_path))
    n = int(total * SR)
    track = np.zeros((n, 2))
    cache = {}
    for c in cues:
        name, at, gain = c["sfx"], c["t"], c.get("gain", 1.0)
        pan = c.get("pan", 0.0)
        if name not in cache:
            cache[name] = SFX[name]()
        s = cache[name] * gain
        st = int((at + c.get("offset", 0)) * SR)
        if st < 0:
            s = s[-st:]
            st = 0
        end = min(n, st + len(s))
        L = np.sqrt(0.5 * (1 - pan)) * np.sqrt(2)
        R = np.sqrt(0.5 * (1 + pan)) * np.sqrt(2)
        track[st:end, 0] += s[: end - st] * L
        track[st:end, 1] += s[: end - st] * R
    track = np.tanh(track)
    pcm = (track * 32767 * 0.95).astype(np.int16)
    with wave.open(out_path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], float(sys.argv[3]))
