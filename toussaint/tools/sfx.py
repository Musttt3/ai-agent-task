#!/usr/bin/env python3
"""Code-synthesised SFX bed from data/beats.json, mixed under the voiceover.

whoosh  - whip-pans (band-passed noise sweep, follows the camera move)
zap     - glitch hits (bit-crushed square bursts + noise)
thud    - stamps (low sine drop + paper slap)
type    - typewriter keys (short resonant clicks per typed character, bell-less)
swell   - red light-leak (soft filtered-noise swell)
tape    - tape label slap (short paper crackle)
Each family is normalised and placed at -18..-24 dB relative to the VO peak level; then VO + SFX -> AAC 48 kHz.
usage: python3 tools/sfx.py data/beats.json audio/vo.mp3 out/mix.wav [--until SECONDS]
"""
import json, sys, subprocess, numpy as np

SR = 48000
rng = np.random.default_rng(1803)

def env(n, a, r):  # attack/release envelope in samples
    e = np.ones(n); a = max(1, int(a)); r = max(1, int(r)); e[:a] = np.linspace(0, 1, a); e[-r:] *= np.linspace(1, 0, r); return e

def onepole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
    return y

def svf_bp(x, f, q=2.0):  # time-varying band-pass (f is array)
    y = np.empty_like(x); lp = bp = 0.0
    for i in range(len(x)):
        g = 2 * np.sin(np.pi * min(f[i], SR / 6) / SR); hp = x[i] - lp - bp / q; bp += g * hp; lp += g * bp; y[i] = bp
    return y

def whoosh(dur):
    n = int(dur * SR); t = np.linspace(0, 1, n)
    f = 300 + 2600 * np.sin(np.pi * t) ** 1.5
    x = svf_bp(rng.standard_normal(n), f, 1.4) * np.sin(np.pi * t) ** 2
    return x / (np.abs(x).max() + 1e-9)

def zap(dur):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    k = 0
    while k < n:
        seg = int(SR * rng.uniform(0.012, 0.04)); f = rng.choice([180, 330, 660, 1250, 2400])
        s = np.sign(np.sin(2 * np.pi * f * t[:seg])) * rng.uniform(0.4, 1)
        s = np.round(s * 4) / 4 + rng.standard_normal(seg) * 0.25
        out[k:k + seg] = s[: n - k]; k += seg + int(SR * rng.uniform(0, 0.01))
    return out * env(n, 0.002 * SR, 0.03 * SR) * 0.8

def thud():
    n = int(0.45 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (95 * np.exp(-t * 9) + 45) * t) * np.exp(-t * 11)
    slap = onepole_lp(rng.standard_normal(n), 2500) * np.exp(-t * 55) * 2.2
    x = body + slap; return x / np.abs(x).max()

def key():
    n = int(0.07 * SR); t = np.arange(n) / SR
    click = rng.standard_normal(n) * np.exp(-t * 300)
    ring = np.sin(2 * np.pi * rng.uniform(1700, 2300) * t) * np.exp(-t * 120) * 0.5
    thunk = np.sin(2 * np.pi * 140 * t) * np.exp(-t * 60) * 0.6
    x = click + ring + thunk; return x / np.abs(x).max()

def swell(dur):
    n = int(dur * SR); t = np.linspace(0, 1, n)
    x = onepole_lp(rng.standard_normal(n), 600) * np.sin(np.pi * t) ** 2
    x += np.sin(2 * np.pi * 55 * np.arange(n) / SR) * np.sin(np.pi * t) ** 3 * 0.3
    return x / np.abs(x).max()

def tape():
    n = int(0.12 * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n) * (rng.random(n) < 0.15) * np.exp(-t * 30); x = onepole_lp(x, 5000); return x / (np.abs(x).max() + 1e-9)

def place(bus, clip, at, gain_db):
    i = int(at * SR)
    if i >= len(bus) or i + len(clip) <= 0: return
    a, b = max(0, i), min(len(bus), i + len(clip)); bus[a:b] += clip[a - i: b - i] * 10 ** (gain_db / 20)

def main():
    data = json.load(open(sys.argv[1])); vo_path, out = sys.argv[2], sys.argv[3]
    until = float(sys.argv[sys.argv.index("--until") + 1]) if "--until" in sys.argv else data["duration"]
    vo = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", vo_path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout, np.float32).astype(np.float64)
    n = int(round(data["frames"] * SR / data["fps"])) if until >= data["duration"] else int(until * SR)
    vo = np.pad(vo, (0, max(0, n - len(vo))))[:n]
    vo_peak_db = 20 * np.log10(np.abs(vo).max() + 1e-9)
    sfx = np.zeros(n); fps = data["fps"]; K = [key() for _ in range(6)]
    lv = lambda rel: vo_peak_db + rel   # level relative to VO peak
    for i, b in enumerate(data["beats"]):
        if i == 0: continue
        d = b["trFrames"] / fps
        if b["tr"] in ("W", "T"): place(sfx, whoosh(d + 0.25), b["t0"] - d / 2 - 0.1, lv(-19))
        if b["tr"] == "G": place(sfx, zap(0.22), b["t0"] - 0.08, lv(-21))
        if b["tr"] == "L": place(sfx, swell(d / fps * 30 + 0.6), b["t0"] - d / 2 - 0.2, lv(-22))
    for f in data["fx"]:
        if f["type"] == "glitch" and f.get("extra"): place(sfx, zap(0.18), f["t"] - 0.06, lv(-21))
    for t in data["stampTimes"]: place(sfx, thud(), t, lv(-18))
    for b in data["beats"]:
        for o in b["objects"]:
            if o["type"] == "tape": place(sfx, tape(), o["t"], lv(-22))
            if o["type"] == "type":
                text = o["text"]; times = []
                if o.get("words"):
                    words = text.split();
                    for wd, (s, e) in zip(words, o["words"]):
                        for c in range(len(wd)): times.append(s + (e - s) * c / max(1, len(wd)))
                elif "t0" in o:
                    m = len(text.replace(" ", "")); times = [o["t0"] + (o["t1"] - o["t0"]) * c / max(1, m) for c in range(m)]
                for k, tt in enumerate(times): place(sfx, K[k % 6] * rng.uniform(0.7, 1.0), tt, lv(-23))
    sfx = sfx[:n]; mix = vo + sfx
    peak = np.abs(mix).max()
    if peak > 0.98: mix *= 0.98 / peak
    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", out], input=pcm.tobytes(), check=True)
    print(f"mix written: {out} ({n / SR:.2f}s), VO peak {vo_peak_db:.1f} dBFS")

if __name__ == "__main__":
    main()
