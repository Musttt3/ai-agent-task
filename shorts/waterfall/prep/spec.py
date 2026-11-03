import librosa, librosa.display, numpy as np, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt, sys, json
y, sr = librosa.load(sys.argv[1], sr=22050)
fig,ax=plt.subplots(3,1,figsize=(18,9),sharex=True)
S=librosa.amplitude_to_db(np.abs(librosa.stft(y)),ref=np.max)
librosa.display.specshow(S,sr=sr,x_axis='time',y_axis='log',ax=ax[0])
hop=256
S2=np.abs(librosa.stft(y,hop_length=hop)); f=librosa.fft_frequencies(sr=sr)
low=S2[f<120].sum(0); low/=low.max(); t=librosa.frames_to_time(np.arange(len(low)),sr=sr,hop_length=hop)
ax[1].plot(t,low); 
from librosa.util import peak_pick
pk=peak_pick(low,pre_max=20,post_max=20,pre_avg=20,post_avg=20,delta=0.08,wait=40)
kicks=t[pk]; ax[1].vlines(kicks,0,1,color='r',alpha=.5)
hi=S2[(f>2000)].sum(0); hi/=hi.max(); ax[2].plot(t,hi)
pk2=peak_pick(hi,pre_max=10,post_max=10,pre_avg=10,post_avg=10,delta=0.1,wait=20)
ax[2].vlines(t[pk2],0,1,color='g',alpha=.5)
for a in ax: a.set_xticks(np.arange(0,26,0.5)); a.grid(alpha=.3)
plt.tight_layout(); plt.savefig(sys.argv[2],dpi=60)
print("kicks", np.round(kicks,2).tolist())
print("hats/snares", np.round(t[pk2],2).tolist())
d=json.load(open(sys.argv[3])); d["kicks"]=[float(k) for k in kicks]; d["highs"]=[float(k) for k in t[pk2]]; json.dump(d,open(sys.argv[3],"w"))
