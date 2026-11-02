"""Edit plan for "Keruntuhan Zaman Perunggu": scenes, transitions, overlays.
Input: tools/align_fixed.json (scene start times). Output: src/data/plan.json"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ALIGN = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "align_fixed.json")

FPS = 30
NARR_END = 529.87
END = 536.0

align = json.load(open(ALIGN))
T = {a["i"]: max(0.0, a["t"] - 0.10) for a in align}
T[1] = 0.0

CHAPTERS = {
    8: ("BAB 1", "Dunia Zaman Perunggu", "± 1300 SM · Laut Tengah bagian timur"),
    16: ("BAB 2", "Ugarit, Kota Dagang", "Simpul jaringan perdagangan"),
    22: ("BAB 3", "Rahasia Perunggu", "Tembaga + timah"),
    33: ("BAB 4", "Retakan Pertama", "Akhir abad ke-13 SM"),
    36: ("BAB 5", "Ancaman dari Laut", "Nasib Ugarit"),
    48: ("BAB 6", "Bangsa Laut", "Salah satu misteri terbesar"),
    58: ("BAB 7", "Kekeringan di Anatolia", "Krisis Kekaisaran Het"),
    75: ("BAB 8", "Api di Pylos", "Runtuhnya istana Mykenai"),
    83: ("BAB 9", "Efek Domino", "Ketika krisis saling memperburuk"),
    90: ("BAB 10", "Siapa yang Bertahan?", "Bukan akhir dari segalanya"),
    99: ("BAB 11", "Pelajaran Terbesar", "Apa yang bisa kita pelajari"),
}

CYCLE = ["in", "left", "out", "right", "in", "up", "out", "left", "in", "right"]
MOTION = {1: "pushSlow", 3: "punch", 7: "spin", 8: "out", 22: "in", 47: "in", 48: "punch", 90: "in",
          103: "right", 105: "in", 107: "in"}

SHAKE = {44: [(0.3, 1.5, 6)], 52: [(0.2, 0.6, 5)], 54: [(0.2, 1.2, 8)], 72: [(0.1, 0.7, 10)],
         81: [(0.2, 1.4, 10)], 86: [(0.3, 1.6, 6)], 102: [(0.1, 2.2, 12)], 105: [(0.4, 1.0, 5)]}

TRANS = {2: "wipe", 7: "warp", 8: "flash", 17: "zoom", 26: "zoom", 27: "dip", 30: "zoom", 40: "wipe",
         42: "wipe", 44: "flash", 49: "fade", 51: "zoom", 60: "zoom", 61: "wipe", 84: "wipe",
         98: "zoom", 102: "fade", 105: "dip", 106: "film", 107: "slowfade", 3: "flash", 28: "zoom"}
for k in CHAPTERS:
    TRANS.setdefault(k, "whip")
TLEN = {"fade": 10, "wipe": 14, "warp": 20, "flash": 12, "zoom": 14, "dip": 24, "film": 18,
        "slowfade": 24, "whip": 12}

OV = []
def ov(scene, kind, at=0.0, dur=3.0, **kw):
    OV.append(dict(scene=scene, kind=kind, at=at, dur=dur, **kw))

ov(1, "title", 0.4, 6.2, title="KERUNTUHAN", text="ZAMAN PERUNGGU",
   sub="Ketika peradaban besar dunia hancur hampir bersamaan")
for k in (1, 2, 44, 77, 78, 105):
    ov(k, "embers", 0.0, None)
for s, (num, title, sub) in CHAPTERS.items():
    ov(s, "chapter", 0.25, 3.2, num=num, title=title, sub=sub)
ov(2, "tag", 1.0, 5.0, text="± 3.200 tahun lalu", sub="sekitar 1200 SM", icon="clock")
ov(5, "big", 0.2, 3.6, text="ZAMAN PERUNGGU", sub="Late Bronze Age Collapse")
ov(7, "counter", 0.5, 5.2, **{"from": 2026, "to": -1300, "sub": "LAUT TENGAH TIMUR"})
ov(8, "label", 3.6, 2.6, text="YUNANI", x=0.27, y=0.30, small=True)
ov(8, "label", 3.8, 2.4, text="ANATOLIA", x=0.62, y=0.17, small=True)
ov(8, "label", 4.0, 2.2, text="SIPRUS", x=0.66, y=0.50, small=True)
ov(8, "label", 4.2, 2.0, text="MESIR", x=0.80, y=0.86, small=True)
ov(9, "tag", 0.4, 3.4, text="Mesir", sub="negeri para firaun", icon="pin")
ov(10, "tag", 0.6, 5.0, text="Hattusa", sub="ibu kota Kekaisaran Het (Turki)", icon="pin")
ov(11, "tag", 0.5, 5.0, text="Mykenai", sub="peradaban Yunani zaman perunggu", icon="pin")
ov(12, "label", 0.4, 2.4, text="MYKENAI", x=0.30, y=0.20, small=True)
ov(12, "label", 0.6, 2.2, text="HET", x=0.76, y=0.22, small=True)
ov(12, "label", 0.8, 2.0, text="MESIR", x=0.78, y=0.80, small=True)
ov(14, "tag", 0.6, 6.0, text="Muatan kapal dagang", sub="tembaga · timah · minyak · anggur", icon="info")
ov(15, "tag", 0.6, 6.0, text="Diplomasi para raja", sub="surat, hadiah & pernikahan politik", icon="info")
ov(17, "label", 0.3, 2.6, text="UGARIT", x=0.57, y=0.14, arrow=True)
ov(18, "tag", 0.4, 4.0, text="Ugarit", sub="kota pelabuhan di pesisir Suriah", icon="pin")
ov(23, "tag", 0.8, 5.0, text="Perunggu", sub="± 90% tembaga + ± 10% timah", icon="info")
ov(26, "label", 0.6, 6.0, text="Tembaga · Siprus", x=0.47, y=0.18, small=True)
ov(26, "label", 2.6, 4.0, text="Timah · dari jauh", x=0.73, y=0.40, small=True)
ov(27, "tag", 0.6, 5.6, text="Kapal Uluburun", sub="tenggelam ± 1300 SM · ditemukan 1982", icon="pin")
ov(28, "year", 0.3, 5.6, text="10 TON", sub="tembaga  +  1 ton timah")
ov(33, "tag", 0.5, 4.0, text="Akhir abad ke-13 SM", sub="tekanan muncul di mana-mana", icon="warn")
ov(37, "tag", 0.5, 4.2, text="Surat dari Ugarit", sub="lempeng tanah liat berhuruf paku", icon="info")
ov(44, "stamp", 0.8, 2.4, text="UGARIT RUNTUH")
ov(48, "big", 0.2, 2.4, text="BANGSA LAUT", sub="“Sea Peoples”")
ov(50, "tag", 0.6, 6.4, text="Ramses III", sub="firaun Mesir · ± 1186–1155 SM", icon="info")
ov(51, "tag", 0.4, 4.2, text="Medinet Habu", sub="kuil peringatan Ramses III, Luxor", icon="pin")
ov(53, "tag", 0.4, 3.4, text="Asal-usul?", sub="masih diperdebatkan", icon="info")
ov(56, "stamp", 3.2, 4.0, text="BUKAN SATU PENYEBAB")
ov(60, "year", 0.3, 5.6, text="2023", sub="studi lingkar pohon kuno · Anatolia")
ov(60, "tag", 6.4, 6.2, text="Kekeringan 1198–1196 SM", sub="3 tahun berturut-turut", icon="sun")
ov(61, "label", 0.3, 5.4, text="TAHUN 1", x=0.17, y=0.10, small=True)
ov(61, "label", 1.2, 4.5, text="TAHUN 2", x=0.50, y=0.10, small=True)
ov(61, "label", 2.1, 3.6, text="TAHUN 3", x=0.83, y=0.10, small=True)
ov(65, "label", 0.2, 2.6, text="GAGAL PANEN #1", x=0.50, y=0.10)
ov(66, "label", 0.2, 3.2, text="GAGAL PANEN #2", x=0.50, y=0.10)
ov(67, "label", 0.2, 2.6, text="GAGAL PANEN #3", x=0.50, y=0.10)
ov(72, "stamp", 0.4, 3.2, text="RUNTUH")
ov(73, "tag", 0.4, 3.6, text="Hattusa ditinggalkan", sub="± 1180 SM", icon="pin")
ov(76, "tag", 0.4, 2.8, text="Istana Pylos", sub="Yunani barat daya", icon="pin")
ov(78, "tag", 0.8, 6.0, text="Lempeng Linear B", sub="terpanggang & terawetkan oleh api", icon="info")
ov(84, "label", 0.3, 7.2, text="PERDAGANGAN", x=0.22, y=0.08, small=True)
ov(84, "label", 1.6, 5.9, text="PANGAN", x=0.80, y=0.08, small=True)
ov(84, "label", 3.0, 4.5, text="PERANG", x=0.22, y=0.58, small=True)
ov(84, "label", 4.4, 3.1, text="MIGRASI", x=0.80, y=0.58, small=True)
ov(92, "tag", 0.4, 3.6, text="Mesir bertahan", sub="meski pengaruhnya melemah", icon="info")
ov(93, "tag", 0.4, 3.6, text="Menuju Zaman Besi", sub="masyarakat beradaptasi", icon="info")
ov(96, "label", 0.3, 4.6, text="IKLIM", x=0.20, y=0.08, small=True)
ov(96, "label", 1.0, 3.9, text="PERANG", x=0.83, y=0.08, small=True)
ov(96, "label", 1.7, 3.2, text="MIGRASI", x=0.20, y=0.58, small=True)
ov(96, "label", 2.4, 2.5, text="EKONOMI", x=0.83, y=0.60, small=True)
ov(98, "timeline", 0.2, 7.0, title="RANGKAIAN KRISIS (perkiraan)",
   items=[["± 1300 SM", "kapal Uluburun berlayar"], ["1198–1196 SM", "kekeringan Anatolia"],
          ["± 1185 SM", "Ugarit hancur"], ["± 1180 SM", "Hattusa ditinggalkan, Pylos terbakar"],
          ["± 1177 SM", "Ramses III vs Bangsa Laut"]])
ov(101, "tag", 0.4, 5.6, text="Penopang peradaban", sub="pangan · perdagangan · pemerintahan · diplomasi", icon="info")
ov(102, "stamp", 3.0, 4.0, text="RUNTUH")
ov(107, "outro", NARR_END - T[107] + 0.4, 6.0, text="KERUNTUHAN ZAMAN PERUNGGU")

scenes = []
ids = sorted(T)
for n, i in enumerate(ids):
    start = T[i]
    end = T[ids[n + 1]] if n + 1 < len(ids) else END
    tr = TRANS.get(i, "fade" if i != 1 else "none")
    scenes.append(dict(i=i, img=f"img/{i:03d}.jpg", start=start, end=end, trans=tr,
                       tlen=TLEN.get(tr, 0), motion=MOTION.get(i, CYCLE[i % len(CYCLE)]),
                       shake=[dict(at=a, dur=d, amp=p) for a, d, p in SHAKE.get(i, [])],
                       night=i in (1, 44, 105), sepia=i == 106))

for o in OV:
    o["start"] = round(T[o["scene"]] + o["at"], 3)
    if o["dur"] is None:  # full scene
        o["dur"] = round(next(s["end"] for s in scenes if s["i"] == o["scene"]) - o["start"] + 0.3, 3)

plan = dict(fps=FPS, duration=END, narrEnd=NARR_END, scenes=scenes, overlays=OV)
os.makedirs(os.path.join(ROOT, "src", "data"), exist_ok=True)
json.dump(plan, open(os.path.join(ROOT, "src", "data", "plan.json"), "w"), ensure_ascii=False, indent=1)
print("scenes", len(scenes), "overlays", len(OV), "duration", END)
