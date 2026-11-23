# Mix for "Sejarah Garpu": the user's voice over on top (unchanged), ElevenLabs music under it (-18 dB under the
# narration, -12 dB in pauses, its last note lands on the last frame), ElevenLabs SFX for physical events only,
# each shifted so its waveform peak hits the event frame. Loudness -14 LUFS, true peak <= -1.2 dBTP.
#   python3 mix.py  -> mix.wav (48 kHz stereo) + ../cues.md
import json, os, subprocess
import numpy as np
from scipy import ndimage, signal
from dsp import SR, ns, write_wav, integrated, true_peak, dbg
HERE = os.path.dirname(os.path.abspath(__file__)); FPS = 30; TOTAL = 1515; N = ns(TOTAL / FPS)
def load(path, extra=None):
    cmd = ["ffmpeg", "-v", "error", "-i", path] + (["-af", extra] if extra else []) + ["-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(np.float64)
def place(buf, x, t, gain=1.0):
    a, b = max(0, t), min(buf.shape[1], t + x.shape[1])
    if b > a: buf[:, a:b] += gain * x[:, a - t: b - t]
def peak_idx(x): return int(np.argmax(ndimage.uniform_filter1d(np.abs(x).max(axis=0), ns(0.01))))
def loop_to(x, length, xf=0.2):
    out = np.zeros((2, length)); k = ns(xf); pos = 0; w = np.linspace(0, 1, k)
    while pos < length:
        seg = x.copy(); seg[:, :k] *= w; seg[:, -k:] *= w[::-1]; place(out, seg, pos); pos += x.shape[1] - k
    return out
fr = lambda f: ns(f / FPS)
words = json.load(open(os.path.join(HERE, "..", "captions", "voice.json")))["segments"][0]["words"]
voice = load(os.path.join(HERE, "voice.wav")); v = np.zeros((2, N)); v[:, :min(N, voice.shape[1])] = voice[:, :N]
VL = integrated(v)
# music: ends on the last frame, ducked under the voice
mus = load(os.path.join(HERE, "musik.mp3"))
env = np.abs(mus).max(axis=0); last = np.nonzero(ndimage.uniform_filter1d(env, ns(0.05)) > 10 ** (-50 / 20))[0][-1]
start = (N - ns(0.08)) - last
m = np.zeros((2, N)); place(m, mus, start)
key = np.zeros(N)
for w in words: key[ns(w["start"]): ns(w["end"] + 0.2)] = 1
key = ndimage.uniform_filter1d(key, ns(0.3))
m = m * dbg(VL - integrated(m)) * dbg(-18.0 * key - 12.0 * (1 - key))[None, :]
# SFX
S = {f[:-4]: load(os.path.join(HERE, "sfx", f)) for f in os.listdir(os.path.join(HERE, "sfx")) if f.endswith(".mp3")}
sfx = np.zeros((2, N)); cues = []
def hit(name, frame, db, what):
    x = S[name]; place(sfx, x, fr(frame) - peak_idx(x), dbg(db)); cues.append((frame, name, db, what, "puncak di frame"))
def bed(name, f0, f1, db, what):
    x = loop_to(S[name], fr(f1) - fr(f0)); x[:, :ns(0.12)] *= np.linspace(0, 1, ns(0.12)); x[:, -ns(0.2):] *= np.linspace(1, 0, ns(0.2))
    place(sfx, x, fr(f0), dbg(db)); cues.append((f0, name, db, what, f"latar {f0}-{f1}"))
hit("garpu_piring", 66, -16, "garpu emas menyentuh piring (shot 02)")
bed("api_unggun", 142, 311, -20, "api unggun di gua")
hit("gesek_cangkang", 262, -12, "cangkang kerang menyendok kuah")
bed("kuali_mendidih", 311, 532, -20, "api tungku dan kuali mendidih")
hit("denting_logam", 415, -14, "sumpit perunggu berdenting")
hit("cungkil_siput", 640, -12, "siput tercungkil dari cangkang")
bed("suasana_aula", 689, 911, -26, "suasana aula Venesia")
hit("kilau", 800, -14, "kilau garpu emas")
hit("langkah_jubah", 828, -14, "langkah uskup")
hit("pintu_kayu", 915, -12, "pintu kedai terbuka")
bed("latar_kedai", 911, 1158, -26, "suasana kedai London")
hit("tawa_warga", 1069, -10, "warga menertawakan Coryat")
bed("ombak_burung", 1158, 1366, -22, "pantai: ombak dan burung")
hit("denting_sendok", 1330, -12, "sendok dan garpu diletakkan di tikar")
hit("kunyah", 1455, -18, "menyuap nasi dengan tangan")
mix = v + m + sfx
mix *= dbg(-14.0 - integrated(mix))
ceil = dbg(-1.2); up = signal.resample_poly(mix, 4, 1, axis=1)
pk = np.abs(up).max(axis=0)[: N * 4].reshape(-1, 4).max(axis=1)[:N]
g = np.minimum(1.0, ceil / np.maximum(pk, 1e-9)); g = ndimage.minimum_filter1d(g, ns(0.006)); g = ndimage.uniform_filter1d(g, ns(0.006))
g = np.minimum(g, ndimage.minimum_filter1d(np.minimum(1.0, ceil / np.maximum(pk, 1e-9)), 3))
mix *= g[None, :]; mix[:, -ns(0.03):] *= np.linspace(1, 0, ns(0.03))
write_wav(os.path.join(HERE, "mix.wav"), mix)
with open(os.path.join(HERE, "..", "cues.md"), "w") as fh:
    fh.write(f"# Cue SFX dan musik — Sejarah Garpu\n\nDurasi {N / SR:.3f} dtk ({TOTAL} frame), 48 kHz stereo. Loudness {integrated(mix):.1f} LUFS, true peak {true_peak(mix):.1f} dBTP.\n")
    fh.write(f"Musik: ElevenLabs, mulai di {start / SR:.2f} dtk supaya nada terakhir habis di frame {TOTAL - 1}; -18 dB di bawah narasi, -12 dB di jeda.\n")
    fh.write("SFX: ElevenLabs sound effects, hanya kejadian fisik; tidak ada whoosh.\n\n| Frame | SFX | Gain (dB) | Kejadian | Penempatan |\n|---|---|---|---|---|\n")
    for f, n, db, w, p in sorted(cues): fh.write(f"| {f} | {n} | {db} | {w} | {p} |\n")
print("mix", round(integrated(mix), 1), "LUFS, peak", round(true_peak(mix), 1), "music start", round(start / SR, 2))
