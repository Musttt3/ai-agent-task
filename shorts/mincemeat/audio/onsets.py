# List loud events (onset time, peak dBFS) in long SFX files so the mix can cut the right slice.
import subprocess, sys, numpy as np
def load(p):
    raw = subprocess.run(['ffmpeg','-v','error','-i',p,'-ac','1','-ar','48000','-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw, np.float32)
for p in sys.argv[1:]:
    x = load(p); hop = 480
    n = len(x)//hop
    e = np.sqrt(np.mean(x[:n*hop].reshape(n,hop)**2, axis=1)+1e-12)
    db = 20*np.log10(e)
    thr = db.max()-18
    ev=[]; last=-1
    for i in range(1,n):
        if db[i]>thr and db[i-1]<=thr and (i-last)>25:
            ev.append((i*hop/48000, db[i:i+20].max())); last=i
    print(p.split('/')[-1][:40], 'peak %.1f'%db.max(), ' '.join('%.2f(%.0f)'%(t,d) for t,d in ev[:40]))
