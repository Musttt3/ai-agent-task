#!/usr/bin/env python3
"""Unduh semua asset di assets_manifest.json ke folder assets/, ganti nama sesuai
kolom "Nama File", lalu (opsional) remove background untuk file _nobg dengan rembg.

Pemakaian:
    python3 tools/download_assets.py            # unduh saja
    python3 tools/download_assets.py --nobg     # unduh + remove background (butuh: pip install "rembg[cpu]")

Hasil: assets/<nama file>, assets/_original/<nama file sumber _nobg>, dan
assets/laporan_unduhan.md (berhasil / gagal).
"""
import json
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "tools" / "assets_manifest.json"
OUT = ROOT / "assets"
ORIG = OUT / "_original"
UA = "CasefileDocAssets/1.0 (educational documentary asset download)"


def fetch(session, url, dest):
    for attempt in range(5):
        try:
            with session.get(url, stream=True, timeout=120, allow_redirects=True) as r:
                if r.status_code == 429:
                    time.sleep(20 * (attempt + 1))
                    continue
                r.raise_for_status()
                tmp = dest.with_suffix(dest.suffix + ".part")
                with open(tmp, "wb") as f:
                    for chunk in r.iter_content(1 << 20):
                        f.write(chunk)
                tmp.rename(dest)
                return None
        except Exception as e:  # noqa: BLE001
            err = str(e)
            time.sleep(5 * (attempt + 1))
    return locals().get("err", "HTTP 429 terus-menerus")


def main():
    do_nobg = "--nobg" in sys.argv
    OUT.mkdir(exist_ok=True)
    ORIG.mkdir(exist_ok=True)
    manifest = json.loads(MANIFEST.read_text())
    s = requests.Session()
    s.headers["User-Agent"] = UA
    ok, fail = [], []

    for a in manifest:
        if "url" not in a:
            continue
        # file _nobg: simpan dulu aslinya di _original/, nama sama tapi ekstensi asli
        if a.get("nobg"):
            ext = Path(a["url"].split("?")[0]).suffix.lower() or ".jpg"
            dest = ORIG / (Path(a["name"]).stem.replace("_nobg", "") + ext)
        else:
            dest = OUT / a["name"]
        if dest.exists() and dest.stat().st_size > 0:
            ok.append((a["name"], "sudah ada"))
            continue
        err = fetch(s, a["url"], dest)
        (fail if err else ok).append((a["name"], err or f"{dest.stat().st_size/1e6:.1f} MB"))
        print(("GAGAL " if err else "OK    ") + a["name"], err or "", flush=True)
        time.sleep(1.5)

    if do_nobg:
        from rembg import remove, new_session  # type: ignore
        from PIL import Image

        sess = new_session("isnet-general-use")
        for a in manifest:
            if not a.get("nobg"):
                continue
            src_name = a.get("from")
            if src_name:
                src = OUT / src_name
            else:
                src = next(ORIG.glob(Path(a["name"]).stem.replace("_nobg", "") + ".*"), None)
            if not src or not src.exists():
                fail.append((a["name"], "file sumber tidak ada"))
                continue
            img = Image.open(src).convert("RGB")
            out = remove(img, session=sess, alpha_matting=True)
            out.save(OUT / a["name"])
            print("NOBG  " + a["name"], flush=True)

    rep = ["# Laporan unduhan asset", "", f"Berhasil: {len(ok)} · Gagal: {len(fail)}", ""]
    rep += ["| Status | File | Keterangan |", "|---|---|---|"]
    rep += [f"| ✅ | `{n}` | {d} |" for n, d in ok]
    rep += [f"| ❌ | `{n}` | {d} |" for n, d in fail]
    (OUT / "laporan_unduhan.md").write_text("\n".join(rep) + "\n")
    print(f"\nSelesai. Berhasil {len(ok)}, gagal {len(fail)}. Laporan: assets/laporan_unduhan.md")


if __name__ == "__main__":
    main()
