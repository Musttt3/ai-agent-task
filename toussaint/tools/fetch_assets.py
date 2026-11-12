# Fetch every asset in data/assets.json into assets/broll/ and write credits.csv.
import json, os, sys, csv, subprocess, urllib.request, urllib.error, time, io
sys.path.insert(0, os.path.dirname(__file__)); import commons
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "broll"); os.makedirs(OUT, exist_ok=True)
A = json.load(open(os.path.join(ROOT, "data", "assets.json"))); A.pop("_note")
only = set(sys.argv[1:])
CAP = 3200
def dl(url):
    for k in range(10):
        try:
            d = urllib.request.urlopen(urllib.request.Request(url, headers=commons.UA), timeout=180).read(); time.sleep(20); return d
        except urllib.error.HTTPError as e:
            ra = int(e.headers.get("Retry-After") or 0); w = max(ra, 60 * (k + 1)); print("  retry", e.code, "wait", w, flush=True); time.sleep(w)
        except Exception as e: print("  retry", e, flush=True); time.sleep(10)
    raise RuntimeError(url)
STEPS = [1920, 3840]   # Wikimedia standard thumbnail widths (https://w.wiki/GHai)
def meta(title, page=None, width=1920):
    p = dict(action="query", titles="File:" + title, prop="imageinfo", iiprop="url|size|extmetadata|mime", iiurlwidth=width)
    if page: p["iiurlparam"] = f"page{page}-{width}px"
    pg = next(iter(commons.get(p)["query"]["pages"].values()))
    return pg["imageinfo"][0]
rows = []
for aid, a in A.items():
    if only and aid not in only: continue
    if not only and any(os.path.exists(os.path.join(OUT, aid + e)) for e in (".jpg", ".mp4")): continue
    if a["kind"] == "commons":
        ii = meta(a["title"], a.get("page"), a.get("width", 1920))
        m = ii.get("extmetadata", {})
        paged = ii["mime"] in ("image/vnd.djvu", "application/pdf", "image/tiff")
        url = ii["thumburl"] if (paged or ii["width"] > a.get("width", 1920)) else ii["url"]
        im = Image.open(io.BytesIO(dl(url))); im.load()
        if im.mode not in ("RGB", "L"): im = im.convert("RGB")
        im.thumbnail((CAP, CAP), Image.LANCZOS)
        dst = os.path.join(OUT, aid + ".jpg"); im.save(dst, quality=92)
        rows.append(dict(id=aid, file=f"assets/broll/{aid}.jpg", title=commons.strip(m.get("ObjectName", {}).get("value")) or a["title"],
                         author=commons.strip(m.get("Artist", {}).get("value")).replace("\n", " ")[:200],
                         source=ii["descriptionurl"], license=commons.strip(m.get("LicenseShortName", {}).get("value")),
                         size=f"{im.width}x{im.height}", note=a.get("note", "") + (" ILUSTRASI" if a.get("ilus") else "")))
    else:
        dst = os.path.join(OUT, aid + ".mp4")
        vf = "scale='if(gt(iw,ih),min(1920,iw),-2)':'if(gt(iw,ih),-2,min(1920,ih))',fps=30"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(a["ss"]), "-i", a["file"], "-t", str(a["t"]), "-an", "-vf", vf,
                        "-c:v", "libx264", "-crf", "18", "-preset", "veryfast", "-pix_fmt", "yuv420p", dst], check=True)
        rows.append(dict(id=aid, file=f"assets/broll/{aid}.mp4", title=f"Pexels video {a['pexels_id']}", author="Pexels contributor",
                         source=f"https://www.pexels.com/video/{a['pexels_id']}/", license="Pexels License", size="", note="ILUSTRASI" if a.get("ilus") else ""))
    print("ok", aid, rows[-1]["size"], rows[-1]["license"])
path = os.path.join(ROOT, "credits.csv")
old = {r["id"]: r for r in csv.DictReader(open(path))} if os.path.exists(path) else {}
old.update({r["id"]: r for r in rows})
with open(path, "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["id", "file", "title", "author", "source", "license", "size", "note"]); w.writeheader()
    for k in sorted(old, key=lambda s: (int(s[1:].split("_")[0]), s)): w.writerow(old[k])
