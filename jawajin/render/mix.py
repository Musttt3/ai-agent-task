# Audio mix: VO on top, 5 music cues crossfaded + ducked under narration, SFX cues from the EDL.
import json, subprocess, sys, os, math
import numpy as np
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
DUR = 541.231
sys.path.insert(0, os.path.join(R, 'render'))
from timing import S

def load(path, ch=2):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', str(ch), '-ar', str(SR), '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32).reshape(-1, ch).copy()

def lufs(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    vals = [l for l in out.splitlines() if l.strip().startswith('I:')]
    return float(vals[-1].split()[1])

N = int(DUR * SR) + SR
mix = np.zeros((N, 2), np.float32)

# ---------------- VO
vo = load(os.path.join(R, 'assets/audio/VO_full.mp3'))
mix[:len(vo)] += vo

# VO activity envelope (for ducking)
mono = np.abs(vo[:, 0])
hop = SR // 100
frames = len(mono) // hop
env = mono[:frames * hop].reshape(frames, hop).max(1)
from scipy.ndimage import maximum_filter1d, uniform_filter1d  # noqa
env = maximum_filter1d(env, 35)            # hold 350 ms
active = np.clip(env / 0.06, 0, 1)
# attack fast / release slow smoothing
sm = np.zeros_like(active); a_att, a_rel = 0.35, 0.04
for i in range(1, len(active)):
    k = a_att if active[i] > sm[i - 1] else a_rel
    sm[i] = sm[i - 1] + k * (active[i] - sm[i - 1])
duck_db = -9.0 + (-19.0 + 9.0) * sm         # -9 dB in gaps, -19 dB under speech (relative to -14 LUFS music)
duck = np.interp(np.arange(N) / hop, np.arange(len(duck_db)), duck_db, right=-12.0)
duck_lin = (10 ** (duck / 20)).astype(np.float32)

# ---------------- music cues
cues = [('m1_hook', 0.0, S(12) - 0.9), ('m2_fakta1', S(12) - 0.9, S(38) - 0.9), ('m3_fakta2', S(38) - 0.9, S(63) - 0.9),
        ('m4_fakta3', S(63) - 0.9, S(87) - 0.9), ('m5_fakta4', S(87) - 0.9, DUR)]
music = np.zeros((N, 2), np.float32)
XF = 2.0
for name, t0, t1 in cues:
    p = os.path.join(R, f'assets/audio/music/{name}.mp3')
    g = 10 ** ((-14.0 - lufs(p)) / 20)
    m = load(p) * g
    i0 = int(t0 * SR); i1 = int(min(t1 + XF, DUR) * SR)
    seg = m[:i1 - i0]
    if len(seg) < i1 - i0:   # loop with crossfade if too short
        need = i1 - i0
        out = seg.copy()
        while len(out) < need:
            xf = int(2 * SR); tail = out[-xf:]; head = m[:xf]
            r_ = np.linspace(0, 1, xf, dtype=np.float32)[:, None]
            out = np.concatenate([out[:-xf], tail * (1 - r_) + head * r_, m[xf:]])
        seg = out[:need]
    env_ = np.ones(len(seg), np.float32)
    fi = int((0.05 if t0 == 0 else XF) * SR); fo = int(XF * SR) if t1 < DUR else int(3.0 * SR)
    env_[:fi] = np.linspace(0, 1, fi); env_[-fo:] = np.minimum(env_[-fo:], np.linspace(1, 0, fo))
    music[i0:i0 + len(seg)] += seg * env_[:, None]
mix += music * duck_lin[:, None]

# ---------------- SFX
cue_list = json.load(open(os.path.join(R, 'work/cues.json')))
SFX_GAIN = 0.5
cache = {}
for name, t, g in cue_list:
    if name not in cache:
        cache[name] = load(os.path.join(R, f'assets/audio/sfx/{name}.mp3'))
    s = cache[name]
    if name in ('wind', 'ocean', 'reel', 'fire'):
        s = s[:int(6.0 * SR)].copy()
        f = int(1.5 * SR); s[-f:] *= np.linspace(1, 0, f)[:, None]; s[:int(0.4 * SR)] *= np.linspace(0, 1, int(0.4 * SR))[:, None]
    i0 = int(max(0, t) * SR)
    n = min(len(s), N - i0)
    if n > 0: mix[i0:i0 + n] += s[:n] * g * SFX_GAIN

mix = mix[:int(DUR * SR)]
peak = np.abs(mix).max()
print('pre-norm peak', peak)
mix /= max(1.0, peak / 0.95)
raw = os.path.join(R, 'work/mix_raw.wav')
import wave
with wave.open(raw, 'wb') as wf:
    wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR)
    wf.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
# two-pass loudnorm to -14 LUFS / -1.5 dBTP
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
js = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}"
      f":measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', raw, '-af', af, '-ar', '48000', os.path.join(R, 'work/mix.wav')], check=True)
print('final', lufs(os.path.join(R, 'work/mix.wav')), 'LUFS')
