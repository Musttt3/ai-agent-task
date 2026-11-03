import librosa, numpy as np, json, sys
y, sr = librosa.load(sys.argv[1], sr=22050, mono=True)
dur = len(y)/sr
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
onset_env = librosa.onset.onset_strength(y=y, sr=sr)
onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, units='time')
hop=512
rms = librosa.feature.rms(y=y, hop_length=hop)[0]
t = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
# low-band energy for kicks
S = np.abs(librosa.stft(y, hop_length=hop))
freqs = librosa.fft_frequencies(sr=sr)
low = S[freqs<150].sum(0); low/=low.max()
print("dur", dur, "tempo", tempo)
print("beats", np.round(beats,2).tolist())
print("onsets", np.round(onsets,2).tolist())
# energy per 0.5s
for i in range(int(dur*2)+1):
    m=(t>=i/2)&(t<i/2+0.5)
    if m.any(): print(f"{i/2:5.1f} rms={rms[m].mean():.3f} low={low[m].mean():.3f} " + "#"*int(rms[m].mean()*150))
# per-video-frame envelope at 30fps
fps=30; n=int(np.ceil(dur*fps))
tf=np.arange(n)/fps
env=np.interp(tf,t,rms); env/=env.max()
lowf=np.interp(tf,t,low)
oe=np.interp(tf, librosa.times_like(onset_env, sr=sr), onset_env); oe/=oe.max()
json.dump({"duration":dur,"tempo":float(np.atleast_1d(tempo)[0]),"beats":[float(b) for b in beats],"onsets":[float(o) for o in onsets],
  "rms":[round(float(v),4) for v in env],"low":[round(float(v),4) for v in lowf],"onset":[round(float(v),4) for v in oe]}, open(sys.argv[2],"w"))
