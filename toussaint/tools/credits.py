#!/usr/bin/env python3
"""credits.csv -> credits.txt (paste-ready for the YouTube description)."""
import csv, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rows = list(csv.DictReader(open(os.path.join(ROOT, "credits.csv"))))
def clean(s):
    s = re.sub(r"\s+", " ", s or "").strip()
    s = re.sub(r"^(.{3,}?)\1$", r"\1", s)                       # "Unknown authorUnknown author" -> "Unknown author"
    s = re.sub(r"label QS:\S+", "", s).strip()
    if s.startswith("http"): s = "Geographicus Rare Antique Maps (after John Stockdale, 1800)"
    return s
out = ["SUMBER GAMBAR & VIDEO / IMAGE & VIDEO CREDITS", "",
       "Semua grafik, peta, dokumen, dan animasi dibuat dengan kode. Arsip di bawah ini digunakan sesuai lisensinya.",
       "Potret Toussaint Louverture dalam video ini adalah cetakan dan lukisan abad ke-18–19; tidak ada potret yang diketahui dibuat langsung di hadapannya.", ""]
groups = {}
for r in rows: groups.setdefault(clean(r["license"]) or "Public domain", []).append(r)
order = sorted(groups, key=lambda k: (0 if "public" in k.lower() else 1 if k.upper().startswith("CC0") else 2 if "pexels" in k.lower() else 3, k))
for lic in order:
    out.append(f"— {lic} —")
    for r in groups[lic]:
        author = {"b02_napoleon_ingres": "Jean-Auguste-Dominique Ingres"}.get(r["id"]) or clean(r["author"]) or "Unknown"
        if "pexels" in lic.lower(): out.append(f"• {clean(r['title'])} — {r['source']}")
        else: out.append(f"• \"{clean(r['title'])}\" — {author}. {r['source']}")
    out.append("")
out += ["Lisensi CC BY / CC BY-SA: karya telah diolah (dipotong, diwarnai ulang ke nada sepia/hitam-putih, diberi animasi).",
        "Narasi: suara asli kanal. Musik: tidak ada. Efek suara: disintesis dengan kode."]
open(os.path.join(ROOT, "credits.txt"), "w").write("\n".join(out) + "\n")
print("\n".join(out[:12])); print(f"... {len(rows)} entries -> credits.txt")
