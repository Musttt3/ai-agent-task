#!/usr/bin/env python3
"""Download Poly Haven (CC0) assets into assets/ph/<id>/.
   fetch_ph.py model <id> [res]      -> <id>.blend + textures/   (res 1k|2k, default 2k)
   fetch_ph.py tex <id> [res]        -> <id>_{diff,nor_gl,rough,arm,disp}_<res>.jpg
   fetch_ph.py hdri <id> [res]       -> <id>_<res>.hdr
Skips files already present (md5 not rechecked)."""
import json, os, sys, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__)); BASE = os.path.join(HERE, "ph")
def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "studio-shorts-fetch/1.0"})
    with urllib.request.urlopen(req, timeout=120) as r: return r.read()
def save(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 0: return
    os.makedirs(os.path.dirname(path), exist_ok=True); data = get(url)
    with open(path, "wb") as f: f.write(data)
def main(kind, aid, res="2k"):
    files = json.loads(get(f"https://api.polyhaven.com/files/{aid}"))
    out = os.path.join(BASE, aid)
    if kind == "model":
        b = files["blend"][res]["blend"]
        save(b["url"], os.path.join(out, aid + ".blend"))
        for rel, inc in b.get("include", {}).items(): save(inc["url"], os.path.join(out, rel))
    elif kind == "tex":
        for m in ("Diffuse", "nor_gl", "Rough", "arm", "Displacement", "AO", "Metal"):
            if m in files and res in files[m]:
                f = files[m][res].get("jpg") or files[m][res].get("png")
                if f: save(f["url"], os.path.join(out, f"{aid}_{m.lower()}_{res}." + f["url"].rsplit(".", 1)[1]))
    elif kind == "hdri":
        f = files["hdri"][res]["hdr"]; save(f["url"], os.path.join(out, f"{aid}_{res}.hdr"))
    print("ok", kind, aid, res)
if __name__ == "__main__":
    main(*sys.argv[1:])
