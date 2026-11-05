# mix_qa.py STEMS.npz : flags 400 ms windows where SFX or music crowd the narration, prints loudest SFX moments
import sys, os
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "studio", "audio"))
from dsp import momentary
d = np.load(sys.argv[1])
hop = 0.1
V, M, S = (momentary(d[k].astype(np.float64), hop) for k in ("voice", "music", "sfx"))
n = min(len(V), len(M), len(S))
V, M, S = V[:n], M[:n], S[:n]
act = V > -30
print("voice momentary max %.1f, music max %.1f, sfx max %.1f" % (np.max(V), np.max(M), np.max(S)))
print("music under voice (median diff): %.1f dB" % np.median((V - M)[act]))
bad = [(i * hop, V[i], S[i]) for i in range(n) if act[i] and S[i] > V[i] - 3]
print("windows where SFX within 3 dB of voice:", len(bad))
for t, v, s in bad[:40]:
    print("  t=%.1fs voice %.1f sfx %.1f" % (t, v, s))
top = np.argsort(S)[::-1]
seen = []
for i in top:
    if all(abs(i - j) > 8 for j in seen):
        seen.append(i)
    if len(seen) >= 10:
        break
print("loudest sfx moments:", ", ".join("%.1fs(%.1f)" % (i * hop, S[i]) for i in sorted(seen)))
