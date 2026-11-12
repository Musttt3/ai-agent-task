# Commons helper: look up file info (url, size, license, author) or search files.
import json, sys, urllib.error, urllib.parse, urllib.request, re, html
UA = {"User-Agent": "CaseFileDocRenderer/1.0 (educational documentary tool)"}
API = "https://commons.wikimedia.org/w/api.php"
def get(params):
    params.update(format="json")
    import time
    req = urllib.request.Request(API + "?" + urllib.parse.urlencode(params), headers=UA)
    for k in range(6):
        try:
            r = json.load(urllib.request.urlopen(req, timeout=60)); time.sleep(1.0); return r
        except urllib.error.HTTPError as e:
            if e.code != 429: raise
            time.sleep(int(e.headers.get("Retry-After") or 0) or 5 * 2 ** k)
    raise RuntimeError("rate limited")
def strip(s): return html.unescape(re.sub("<[^>]+>", "", s or "")).strip()
def info(titles):
    out = {}
    for i in range(0, len(titles), 10):
        r = get(dict(action="query", titles="|".join("File:" + t for t in titles[i:i+10]), prop="imageinfo",
                     iiprop="url|size|extmetadata|mime", iiurlwidth=3000))
        norm = {n["to"]: n["from"] for n in r["query"].get("normalized", [])}
        for p in r["query"]["pages"].values():
            t = p["title"]; key = norm.get(t, t)[5:]
            if "imageinfo" not in p: out[key] = None; continue
            ii = p["imageinfo"][0]; m = ii.get("extmetadata", {})
            out[key] = dict(title=t, url=ii["url"], thumb=ii.get("thumburl"), w=ii["width"], h=ii["height"], mime=ii["mime"],
                            page=ii["descriptionurl"], license=strip(m.get("LicenseShortName", {}).get("value")),
                            author=strip(m.get("Artist", {}).get("value"))[:120], desc=strip(m.get("ObjectName", {}).get("value"))[:120])
    return out
def search(q, n=10):
    r = get(dict(action="query", generator="search", gsrsearch=q, gsrnamespace=6, gsrlimit=n, prop="imageinfo",
                 iiprop="url|size|extmetadata"))
    res = []
    for p in sorted(r.get("query", {}).get("pages", {}).values(), key=lambda p: p["index"]):
        ii = p["imageinfo"][0]; m = ii.get("extmetadata", {})
        res.append((p["title"][5:], ii["width"], ii["height"], strip(m.get("LicenseShortName", {}).get("value"))))
    return res
if __name__ == "__main__":
    if sys.argv[1] == "search":
        for q in sys.argv[2:]:
            print("##", q)
            for r in search(q): print("  ", r)
    else:
        print(json.dumps(info(sys.argv[2:]), ensure_ascii=False, indent=1))
