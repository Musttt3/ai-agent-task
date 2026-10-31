"""Builds the edit plan (scenes, transitions, overlays, sfx cues) from the
aligned narration timings. Output: src/data/plan.json (used by Remotion) and
tools/cues.json (used by the audio mixer)."""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ALIGN = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "align_fixed.json")

FPS = 30
NARR_END = 644.75
END = 651.0  # outro card after narration

align = json.load(open(ALIGN))
T = {a["i"]: max(0.0, a["t"] - 0.10) for a in align}
T[1] = 0.0

# ---------- chapters ----------
CHAPTERS = {
    14: ("BAB 1", "Zaman Pleistosen", "± 2,58 juta – 11.700 tahun lalu"),
    24: ("BAB 2", "Sang Manusia Tegak", "Homo erectus tiba di Jawa"),
    34: ("BAB 3", "Satu Hari di Jawa Purba", "Sebuah rekonstruksi"),
    47: ("BAB 4", "Bahaya di Tepi Sungai", "Air, makanan, dan risiko"),
    57: ("BAB 5", "Teknologi Batu", "Alat serpih dari Sangiran"),
    68: ("BAB 6", "Misteri Daging & Api", "Apa yang benar-benar kita tahu?"),
    81: ("BAB 7", "Cuaca & Musim Kering", "Alam yang terus berubah"),
    91: ("BAB 8", "Hidup Berkelompok", "Kerja sama untuk bertahan"),
    99: ("BAB 9", "Ketika Malam Tiba", "Gelap tanpa penerangan"),
    109: ("BAB 10", "Jejak di Dalam Tanah", "Bukti dari fosil"),
    119: ("BAB 11", "Jawa Hari Ini", "Tanah yang sama, dunia yang berbeda"),
}

# ---------- camera motion per scene ----------
CYCLE = ["in", "left", "out", "right", "in", "up", "out", "left", "in", "right"]
MOTION = {1: "pushSlow", 8: "punch", 12: "in", 13: "spin", 14: "out", 18: "in", 25: "in",
          33: "right", 52: "in", 110: "up", 117: "in", 124: "right", 127: "in", 128: "out"}

SHAKE = {7: [(0.2, 1.2, 6)], 8: [(0.0, 0.5, 8)], 52: [(0.0, 3.0, 10)],
         60: [(0.9, 0.35, 12), (2.3, 0.35, 12), (3.7, 0.35, 12)],
         73: [(0.1, 0.8, 14)], 82: [(0.6, 0.7, 6)], 127: [(0.0, 0.6, 5)]}

# ---------- transitions INTO scene i ----------
TRANS = {2: "wipe", 11: "wipe", 13: "warp", 14: "flash", 15: "wipe", 17: "zoom", 63: "wipe",
         70: "wipe", 100: "dip", 106: "flash", 109: "flash", 111: "film", 117: "slowfade",
         121: "wipe", 124: "slowfade", 125: "fade", 128: "slowfade", 25: "flash",
         40: "zoom", 66: "zoom", 110: "zoom", 114: "zoom", 76: "whip", 62: "whip", 122: "whip"}
for k in CHAPTERS:
    TRANS.setdefault(k, "whip")
TLEN = {"fade": 10, "wipe": 14, "warp": 20, "flash": 12, "zoom": 14, "dip": 24, "film": 18,
        "slowfade": 24, "whip": 12}

# ---------- overlays (times relative to scene start, seconds) ----------
OV = []
def ov(scene, kind, at=0.0, dur=3.0, **kw):
    OV.append(dict(scene=scene, kind=kind, at=at, dur=dur, **kw))

ov(1, "title", 0.4, 5.8)
for s, (num, title, sub) in CHAPTERS.items():
    ov(s, "chapter", 0.25, 3.2, num=num, title=title, sub=sub)
ov(13, "counter", 0.6, 5.2)
ov(16, "tag", 0.6, 3.6, text="Permukaan laut turun", sub="hingga ±120 meter lebih rendah", icon="down")
ov(17, "label", 0.5, 3.4, text="SUMATRA", x=0.20, y=0.42)
ov(17, "label", 0.8, 3.1, text="KALIMANTAN", x=0.67, y=0.30)
ov(17, "label", 1.1, 2.8, text="JAWA", x=0.64, y=0.80, arrow=True)
ov(18, "label", 0.6, 4.2, text="SUNDALAND", x=0.52, y=0.42, big=True)
ov(19, "label", 0.5, 3.6, text="DARATAN ASIA", x=0.74, y=0.12)
ov(19, "label", 0.8, 3.3, text="JAWA", x=0.58, y=0.76)
ov(25, "big", 0.3, 4.0, text="HOMO ERECTUS", sub="= “manusia yang berdiri tegak”")
ov(26, "label", 0.6, 3.4, text="Homo erectus", x=0.29, y=0.93, small=True)
ov(26, "label", 0.9, 3.1, text="Manusia modern", x=0.70, y=0.93, small=True)
ov(28, "tag", 0.5, 3.8, text="Dahi rendah", sub="tengkorak panjang & rendah", icon="info")
ov(29, "tag", 0.2, 1.9, text="Tulang alis menonjol", sub="", icon="info")
ov(30, "label", 0.5, 3.6, text="lebih kecil", x=0.37, y=0.92, small=True)
ov(30, "label", 0.8, 3.3, text="lebih besar", x=0.60, y=0.92, small=True)
ov(33, "tag", 0.4, 4.0, text="Bertahan sangat lama", sub="lebih dari 1 juta tahun di Jawa", icon="clock")
ov(35, "tag", 0.6, 4.6, text="Rekonstruksi ilmiah", sub="berdasarkan fosil & lingkungan purba", icon="info")
ov(40, "tag", 0.4, 3.8, text="Sangiran, Jawa Tengah", sub="Situs Warisan Dunia UNESCO (1996)", icon="pin")
ov(48, "label", 0.5, 4.2, text="STEGODON", x=0.70, y=0.12)
ov(49, "label", 0.3, 3.0, text="Badak", x=0.44, y=0.22, small=True)
ov(49, "label", 0.6, 2.7, text="Rusa", x=0.64, y=0.20, small=True)
ov(49, "label", 0.9, 2.4, text="Kerbau", x=0.84, y=0.30, small=True)
ov(54, "tag", 0.6, 4.4, text="Buaya", sub="pemangsa yang bersembunyi di air", icon="warn")
ov(58, "tag", 0.4, 3.8, text="Alat serpih batu", sub="pecahan batu bersisi tajam", icon="info")
ov(65, "tag", 0.3, 3.2, text="Sangiran, Jawa Tengah", sub="bukti alat batu purba", icon="pin")
ov(66, "tag", 0.5, 5.2, text="Bekas sayatan pada tulang", sub="dibuat dengan alat dari cangkang kerang", icon="info")
ov(71, "stamp", 1.2, 4.2, text="BELUM DIKETAHUI PASTI")
ov(78, "stamp", 0.3, 2.4, text="BELUM PASTI")
ov(80, "stamp", 2.5, 5.0, text="MITOS FILM")
ov(84, "tag", 0.6, 6.0, text="Musim kering panjang", sub="hasil penelitian di Sangiran", icon="sun")
ov(94, "tag", 0.4, 4.0, text="Bahasa?", sub="belum ada bukti langsung", icon="info")
ov(111, "year", 0.3, 7.2, text="1891", sub="Eugène Dubois · Trinil, Jawa Timur")
ov(112, "tag", 0.4, 4.6, text="Pithecanthropus erectus", sub="nama awal temuan Dubois", icon="info")
ov(114, "tag", 0.5, 9.0, text="SANGIRAN 17", sub="± 1 – 1,3 juta tahun", icon="clock")
ov(115, "label", 0.5, 4.6, text="PULAU JAWA", x=0.45, y=0.80, arrow=True)
ov(116, "year", 0.3, 8.8, text="± 110.000", sub="tahun lalu · populasi terakhir di Jawa")
ov(128, "compare", 3.0, 8.4)
ov(128, "outro", NARR_END - T[128] + 0.4, 6.0)

# ---------- scenes ----------
scenes = []
ids = sorted(T)
for n, i in enumerate(ids):
    start = T[i]
    end = T[ids[n + 1]] if n + 1 < len(ids) else END
    tr = TRANS.get(i, "fade" if i != 1 else "none")
    scenes.append(dict(i=i, img=f"img/{i:03d}.jpg", start=start, end=end, trans=tr,
                       tlen=TLEN.get(tr, 0), motion=MOTION.get(i, CYCLE[i % len(CYCLE)]),
                       shake=[dict(at=a, dur=d, amp=p) for a, d, p in SHAKE.get(i, [])],
                       night=99 <= i <= 105, sepia=i == 111))

for o in OV:
    o["start"] = round(T[o["scene"]] + o["at"], 3)

plan = dict(fps=FPS, duration=END, narrEnd=NARR_END, scenes=scenes, overlays=OV)
os.makedirs(os.path.join(ROOT, "src", "data"), exist_ok=True)
json.dump(plan, open(os.path.join(ROOT, "src", "data", "plan.json"), "w"), ensure_ascii=False, indent=1)
print("scenes", len(scenes), "overlays", len(OV), "duration", END)
