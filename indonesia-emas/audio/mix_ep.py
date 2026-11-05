# Mix for Indonesia Emas: voice on top (unchanged), ElevenLabs music under it (-18 dB under narration, a little
# louder in pauses; stops for 20 frames on "Tapi tunggu dulu..." and returns softer; its last note lands on the last
# frame), ElevenLabs SFX for physical events only, each shifted so its waveform peak hits the event frame.
#   python3 mix_ep.py  -> mix.wav (48 kHz stereo), cues.md
import json, os, subprocess
import numpy as np
from scipy import ndimage
from dsp import SR, ns, read_wav, write_wav, integrated, true_peak, dbg
HERE = os.path.dirname(os.path.abspath(__file__)); FPS = 30; TOTAL = 1755; N = ns(TOTAL / FPS)
def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(np.float64)
def place(buf, x, t_samp, gain=1.0):
    a, b = max(0, t_samp), min(buf.shape[1], t_samp + x.shape[1])
    if b > a: buf[:, a:b] += gain * x[:, a - t_samp: b - t_samp]
def peak_idx(x):
    env = ndimage.uniform_filter1d(np.abs(x).max(axis=0), ns(0.01)); return int(np.argmax(env))
def loop_to(x, length, xf=0.15):
    out = np.zeros((2, length)); k = ns(xf); pos = 0; w = np.linspace(0, 1, k)
    while pos < length:
        seg = x.copy(); seg[:, :k] *= w; seg[:, -k:] *= w[::-1]; place(out, seg, pos); pos += x.shape[1] - k
    return out
def fr(f): return ns(f / FPS)

words = json.load(open(os.path.join(HERE, "..", "captions", "voice.json")))["segments"][0]["words"]
voice = load(os.path.join(HERE, "voice.wav")); v = np.zeros((2, N)); v[:, :min(N, voice.shape[1])] = voice[:, :N]
VL = integrated(v)
# ---------------- music ----------------
mus = load(os.path.join(HERE, "musik.mp3"))
env = np.abs(mus).max(axis=0); last = np.nonzero(ndimage.uniform_filter1d(env, ns(0.05)) > 10 ** (-50 / 20))[0][-1]
start = (N - ns(0.08)) - last                     # the final note dies away just before the last frame
m = np.zeros((2, N)); place(m, mus, start)
key = np.zeros(N)
for w in words: key[ns(w["start"]) : ns(w["end"] + 0.2)] = 1
key = ndimage.uniform_filter1d(key, ns(0.3))
gain = dbg(-18.0 * key - 12.0 * (1 - key))          # relative to the voice loudness: -18 dB while speaking, -12 dB in pauses
gap0, gap1 = fr(1061), fr(1061 + 20)
g2 = np.ones(N); g2[gap0 - ns(0.06): gap0] = np.linspace(1, 0, ns(0.06)); g2[gap0:gap1] = 0
g2[gap1: gap1 + ns(0.5)] = np.linspace(0, 1, ns(0.5)) * dbg(-5); g2[gap1 + ns(0.5):] = dbg(-5)   # back in, softer
ML = integrated(m)
m = m * dbg(VL - ML) * gain[None, :] * g2[None, :]
# ---------------- SFX ----------------
S = {k: load(os.path.join(HERE, "sfx", k + ".mp3")) for k in ["burung", "tv_nyala", "pintu", "kereta", "notif_hp", "desa_malam", "kilau", "kasur", "langkah", "saklar", "pintu_otomatis", "bus", "tawa_anak", "kota_pagi", "ketuk_hp"]}

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(HERE, "sfx", "kereta.mp3"), "-af", "atempo=0.5,atempo=0.65", "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
S["kereta"] = np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(np.float64)
sfx = np.zeros((2, N)); cues = []
def hit(name, frame, db, what):
    x = S[name]; place(sfx, x, fr(frame) - peak_idx(x), dbg(db)); cues.append((frame, name, db, what, "puncak di frame"))
def bed(name, f0, f1, db, what):
    x = loop_to(S[name], fr(f1) - fr(f0)); x[:, :ns(0.15)] *= np.linspace(0, 1, ns(0.15)); x[:, -ns(0.2):] *= np.linspace(1, 0, ns(0.2))
    place(sfx, x, fr(f0), dbg(db)); cues.append((f0, name, db, what, f"latar {f0}-{f1}"))
hit("kilau", 104, -10, "peta berkilau di \"emas\"")
bed("burung", 130, 205, -22, "kicau burung pagi dari jendela")
hit("kasur", 182, -12, "derit kasur saat duduk tegak")
hit("tv_nyala", 206, -12, "TV menyala")
hit("pintu", 366, -10, "pintu rumah terbuka")
bed("kota_pagi", 366, 724, -26, "suasana kota pagi")
for f in (380, 404): hit("langkah", f, -16, "langkah sepatu (shot 07)")
hit("kereta", 458, -9, "kereta listrik lewat")
hit("notif_hp", 545, -12, "notifikasi HP")
for f in (598, 641): hit("ketuk_hp", f, -14, "jari menggeser layar HP")
hit("pintu_otomatis", 836, -14, "pintu otomatis rumah sakit")
for f in (806, 830): hit("langkah", f, -20, "langkah di lorong (shot 14)")
bed("desa_malam", 925, 1061, -20, "jangkrik dan angin desa")
for f in (1022, 1030, 1038): hit("saklar", f, -14, "lampu rumah menyala")
bed("kota_pagi", 1061, 1532, -28, "suasana kota pagi (pelan)")
for f in (1222, 1246): hit("langkah", f, -18, "langkah (shot 21)")
hit("bus", 1340, -12, "bus listrik berhenti")
bed("desa_malam", 1532, 1639, -20, "jangkrik dan angin desa")
hit("tawa_anak", 1600, -14, "tawa anak-anak berlari")
hit("kilau", 1717, -12, "kilau peta di akhir")
# ---------------- master ----------------
mix = v + m + sfx
mix *= dbg(-14.0 - integrated(mix))                 # Shorts loudness
from scipy import signal                            # look-ahead peak limiter to -1.2 dBTP (4x oversampled estimate)
ceil = dbg(-1.2); up = signal.resample_poly(mix, 4, 1, axis=1)
pk = np.abs(up).max(axis=0)[: N * 4].reshape(-1, 4).max(axis=1)[:N]
g = np.minimum(1.0, ceil / np.maximum(pk, 1e-9)); g = ndimage.minimum_filter1d(g, ns(0.006)); g = ndimage.uniform_filter1d(g, ns(0.006))
g = np.minimum(g, ndimage.minimum_filter1d(np.minimum(1.0, ceil / np.maximum(pk, 1e-9)), 3))
mix *= g[None, :]
mix[:, -ns(0.03):] *= np.linspace(1, 0, ns(0.03))
write_wav(os.path.join(HERE, "mix.wav"), mix)
write_wav(os.path.join(HERE, "stem_musik.wav"), m); write_wav(os.path.join(HERE, "stem_sfx.wav"), sfx)
with open(os.path.join(HERE, "..", "cues.md"), "w") as fh:
    fh.write(f"# Cue SFX dan musik\n\nDurasi {N / SR:.3f} dtk (1755 frame), 48 kHz stereo. Loudness {integrated(mix):.1f} LUFS, true peak {true_peak(mix):.1f} dBTP.\n")
    fh.write(f"Musik: ElevenLabs, mulai di {start / SR:.2f} dtk supaya nada terakhir habis di frame 1754; -18 dB di bawah narasi, -12 dB di jeda; berhenti total frame 1061-1080, masuk lagi -5 dB lebih pelan.\n")
    fh.write("SFX: ElevenLabs sound effects. Hanya kejadian fisik; tidak ada whoosh.\n\n| Frame | SFX | Gain (dB) | Kejadian | Penempatan |\n|---|---|---|---|---|\n")
    for f, n, db, w, p in sorted(cues): fh.write(f"| {f} | {n} | {db} | {w} | {p} |\n")
print("mix", round(integrated(mix), 1), "LUFS, peak", round(true_peak(mix), 1), "music start", round(start / SR, 2))
