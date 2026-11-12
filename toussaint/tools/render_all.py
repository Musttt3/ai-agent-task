#!/usr/bin/env python3
"""Full render in 10-second chunks with 2 parallel workers, then concat + SFX mix + mux.

- A chunk is "ready" when every asset it shows is downloaded at full size (assets/broll, not the interim copies).
  Ready chunks render first; chunks that still wait on a Wikimedia download are retried as assets arrive.
- Each chunk records the exact asset files it was rendered with (.sig); if an asset changes later
  (interim copy replaced by the full-size file), that chunk is re-rendered automatically.
- Resumable: finished chunks are skipped.
usage: python3 tools/render_all.py [--workers 2] [--allow-interim-after MINUTES]
"""
import json, os, sys, time, subprocess, hashlib, threading, glob, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out", "chunks"); os.makedirs(OUT, exist_ok=True)
CH = 300  # frames per chunk
WORKERS = int(sys.argv[sys.argv.index("--workers") + 1]) if "--workers" in sys.argv else 2
ALLOW_INTERIM_AFTER = float(sys.argv[sys.argv.index("--allow-interim-after") + 1]) * 60 if "--allow-interim-after" in sys.argv else 4 * 3600
LOCK = threading.Lock(); JOBLOCK = threading.Lock(); START = time.time()

def log(*a):
    with LOCK: print(time.strftime("%H:%M:%S"), *a, flush=True)

def build():
    with LOCK:
        subprocess.run(["python3", "tools/build_beats.py"], cwd=ROOT, check=True, capture_output=True)
        return json.load(open(os.path.join(ROOT, "data", "beats.json")))

def chunk_assets(data, f0, f1):
    t0, t1 = f0 / 30, f1 / 30; used = set()
    for b in data["beats"]:
        if b["t1"] + 1.2 < t0 - 0.2 or b["t0"] - 1.2 > t1 + 0.2: continue
        for o in b["objects"]:
            for a in ([o["asset"]] if o.get("asset") else []) + ([o["overlay"]["asset"]] if o.get("overlay") else []): used.add(a)
    return sorted(used)

def signature(data, assets):
    h = hashlib.sha1()
    for a in assets:
        A = data["assets"][a]; p = os.path.join(ROOT, A.get("src") or A["dir"] + "/0001.jpg")
        h.update(f"{a}:{A.get('src', A.get('dir'))}:{os.path.getsize(p)}".encode())
    h.update(hashlib.sha1(json.dumps([b for b in data["beats"]], sort_keys=True).encode()).digest())  # beat edits invalidate too
    return h.hexdigest()

def is_final(data, a):
    A = data["assets"][a]; return not (A.get("interim") or A.get("placeholder"))

def main():
    data = build(); frames = data["frames"]
    chunks = [(i, i * CH, min(frames, (i + 1) * CH)) for i in range((frames + CH - 1) // CH)]
    taken = set()
    def next_job():
        nonlocal data
        data = build()
        waiting = 0
        for i, f0, f1 in chunks:
            if i in taken: continue
            out = os.path.join(OUT, f"c{i:03d}.mp4"); assets = chunk_assets(data, f0, f1); sig = signature(data, assets)
            if os.path.exists(out) and open(out + ".sig").read() == sig if os.path.exists(out + ".sig") else False: continue
            if not all(is_final(data, a) for a in assets) and time.time() - START < ALLOW_INTERIM_AFTER: waiting += 1; continue
            taken.add(i); bj = os.path.join(OUT, f"beats_c{i:03d}.json"); shutil.copy(os.path.join(ROOT, "data", "beats.json"), bj)
            return (i, f0, f1, sig, bj, assets)
        return ("wait", waiting)
    def worker(k):
        while True:
            with JOBLOCK:
                job = next_job()
            if job[0] == "wait":
                if job[1] == 0: return          # nothing left that this pass can render
                time.sleep(60); continue
            i, f0, f1, sig, bj, assets = job; out = os.path.join(OUT, f"c{i:03d}.mp4"); t = time.time()
            log(f"w{k} chunk {i:03d} frames {f0}-{f1} ({len(assets)} assets)")
            r = subprocess.run(["node", "tools/render.js", "--data", os.path.relpath(bj, ROOT), "--from", str(f0), "--to", str(f1), "--out", out + ".tmp.mp4"],
                               cwd=ROOT, capture_output=True, text=True)
            if r.returncode != 0: log(f"w{k} chunk {i:03d} FAILED\n" + r.stderr[-2000:]); taken.discard(i); time.sleep(30); continue
            os.replace(out + ".tmp.mp4", out); open(out + ".sig", "w").write(sig); taken.discard(i)
            log(f"w{k} chunk {i:03d} done in {time.time() - t:.0f}s")
    def done(i):
        out = os.path.join(OUT, f"c{i:03d}.mp4"); return os.path.exists(out + ".sig")
    def all_done():
        d = build()
        for i, f0, f1 in chunks:
            out = os.path.join(OUT, f"c{i:03d}.mp4"); a = chunk_assets(d, f0, f1)
            if not (os.path.exists(out + ".sig") and open(out + ".sig").read() == signature(d, a)): return False
        return True
    while not all_done():
        ts = [threading.Thread(target=worker, args=(k,)) for k in range(WORKERS)]
        for t in ts: t.start(); time.sleep(20)
        for t in ts: t.join()
    log("all chunks rendered; concatenating")
    lst = os.path.join(OUT, "list.txt"); open(lst, "w").write("".join(f"file 'c{i:03d}.mp4'\n" for i, _, _ in chunks))
    silent = os.path.join(ROOT, "out", "toussaint_silent.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", silent], check=True)
    mix = os.path.join(ROOT, "out", "mix.wav")
    subprocess.run(["python3", "tools/sfx.py", "data/beats.json", "audio/vo.mp3", mix], cwd=ROOT, check=True)
    final = os.path.join(ROOT, "out", "Toussaint_Louverture_CaseFile_1080p30.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", silent, "-i", mix, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                    "-movflags", "+faststart", final], check=True)
    log("FINAL", final)

if __name__ == "__main__":
    main()
