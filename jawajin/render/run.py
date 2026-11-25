import sys, os, time, argparse, json
import numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from engine import *
import edl
from timing import DURATION

def timeline():
    sh, ov, cues = edl.build()
    return Timeline(sh, ov, DURATION), cues

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--frames', help='comma list of seconds for stills')
    ap.add_argument('--sheet', help='output contact sheet path')
    ap.add_argument('--seg', nargs=3, metavar=('F0', 'F1', 'OUT'))
    ap.add_argument('--cues', help='write cue json')
    a = ap.parse_args()
    tl, cues = timeline()
    if a.cues:
        json.dump(cues, open(a.cues, 'w'))
    if a.frames:
        ts = [float(x) for x in a.frames.split(',')]
        tiles = []
        t0 = time.time()
        for t in ts:
            fr = tl.frame(int(round(t * FPS)))
            small = cv2.resize(fr, (640, 360), interpolation=cv2.INTER_AREA)
            cv2.putText(small, f'{t:.1f}', (8, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)
            tiles.append(small)
        print(f'{(time.time() - t0) / len(ts) * 1000:.0f} ms/frame avg')
        cols = 4
        while len(tiles) % cols: tiles.append(np.zeros_like(tiles[0]))
        rows = [np.hstack(tiles[i:i + cols]) for i in range(0, len(tiles), cols)]
        cv2.imwrite(a.sheet, cv2.cvtColor(np.vstack(rows), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 85])
    if a.seg:
        f0, f1, out = int(a.seg[0]), int(a.seg[1]), a.seg[2]
        tmp = out + '.part.mp4'
        p = writer(tmp)
        t0 = time.time()
        for fi in range(f0, f1):
            p.stdin.write(tl.frame(fi).tobytes())
            if (fi - f0) % 300 == 0:
                el = time.time() - t0
                print(f'{out}: {fi - f0}/{f1 - f0} frames, {el:.0f}s', flush=True)
        p.stdin.close(); rc = p.wait()
        if rc == 0: os.replace(tmp, out)
        print('done', out, rc, f'{time.time() - t0:.0f}s', flush=True)
