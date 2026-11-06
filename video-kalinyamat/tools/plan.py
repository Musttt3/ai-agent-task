"""Edit plan for "Ratu Kalinyamat": simple cuts, icon motion graphics (no on-screen text),
Artlist-animated opening (scenes 1-5). Output: src/data/plan.json"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ALIGN = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "align_fixed.json")

FPS = 30
NARR_END = 637.47
END = 643.5

align = json.load(open(ALIGN))
T = {a["i"]: max(0.0, a["t"] - 0.10) for a in align}
T[1] = 0.0

CLIPS = {1: "clips/001.mp4", 2: "clips/002.mp4", 3: "clips/003.mp4", 4: "clips/004.mp4", 5: "clips/005.mp4"}

CYCLE = ["in", "left", "out", "right", "in", "up", "out", "left", "in", "right"]
MOTION = {8: "spin", 31: "punch", 88: "punch", 67: "out", 105: "in"}

SHAKE = {14: [(0.3, 1.0, 5)], 50: [(0.2, 2.5, 8)], 63: [(0.4, 2.0, 7)], 77: [(0.3, 2.0, 7)], 51: [(0.6, 0.5, 6)]}

# transitions INTO scene i — everything else is a hard cut
TRANS = {6: "flash", 8: "warp", 9: "flash", 13: "flash", 24: "dip", 30: "fade", 31: "flash",
         40: "whip", 48: "whip", 50: "flash", 60: "whip", 66: "whip", 78: "fade", 84: "fade", 85: "dip",
         88: "flash", 98: "whip", 104: "wipe", 105: "slowfade"}
TLEN = {"cut": 0, "fade": 10, "wipe": 14, "warp": 20, "flash": 10, "zoom": 14, "dip": 24, "slowfade": 24, "whip": 12}

OV = []
def ov(scene, kind, at=0.0, dur=3.0, **kw):
    OV.append(dict(scene=scene, kind=kind, at=at, dur=dur, **kw))

def icons(scene, at, dur, names, slot="tr", stagger=0.45, **kw):
    ov(scene, "icons", at, dur, icons=names, slot=slot, stagger=stagger, **kw)

CHAPTERS = {
    9: ("BAB 1", "Malaka, Pusat Dunia Dagang", "Awal abad ke-16"),
    13: ("BAB 2", "Portugis Datang", "1511 · Malaka jatuh"),
    17: ("BAB 3", "Jepara & Retna Kencana", "Pesisir utara Jawa"),
    24: ("BAB 4", "Duka di Istana Demak", "1546 · Perebutan kekuasaan"),
    31: ("BAB 5", "Lahirnya Sang Ratu", "± 1549 · Ratu Kalinyamat"),
    40: ("BAB 6", "Ajakan dari Johor", "1550"),
    45: ("BAB 7", "Ekspedisi Pertama", "1551 · Menuju Malaka"),
    57: ("BAB 8", "Pengaruh hingga Maluku", "Bantuan untuk Hitu"),
    60: ("BAB 9", "Bersama Aceh", "1573"),
    65: ("BAB 10", "Armada Raksasa", "Oktober 1574"),
    72: ("BAB 11", "Pengepungan & Kelaparan", "Masalah perbekalan"),
    87: ("BAB 12", "Warisan Sang Ratu", "Lebih dari sekadar kemenangan"),
}
for k in CHAPTERS:
    TRANS.setdefault(k, "whip")
    if TRANS[k] == "cut":
        TRANS[k] = "whip"

ov(1, "title", 0.4, 6.4, title="RATU KALINYAMAT", text="300 KAPAL MENGGEMPUR MALAKA",
   sub="Ratu dari Jawa yang berani melawan Portugis")
for k, (num, title, sub) in CHAPTERS.items():
    ov(k, "chapter", 0.25, 3.2, num=num, title=title, sub=sub)

# ---- opening ----
ov(2, "tag", 0.8, 4.0, text="Armada perang Jawa", sub="ribuan prajurit · meriam · senjata", icon="info")
icons(3, 3.4, 3.6, ["queen"], glow=True)
ov(4, "big", 0.1, 2.5, text="RATU KALINYAMAT", sub="penguasa Jepara")
ov(5, "tag", 1.2, 6.0, text="Melawan Portugis", sub="kekuatan maritim Eropa abad ke-16", icon="warn")
icons(5, 1.6, 6.0, ["queen", "swords", "portugal"], slot="tr", stagger=0.6)
icons(6, 1.0, 6.0, ["question"], glow=True)
icons(7, 1.0, 3.0, ["ship", "question"], stagger=0.6)
ov(8, "counter", 0.4, 3.6, **{"from": 2026, "to": 1500, "sub": "AWAL ABAD KE-16"})
# ---- Malacca & Portuguese ----
icons(9, 3.6, 3.2, ["anchor", "coins"], stagger=0.6)
ov(10, "tag", 1.0, 6.4, text="Jalur dagang internasional", sub="Jawa · Sumatra · India · Tiongkok", icon="info")
ov(10, "converge", 0.6, 7.0, icons=["ship", "ship", "ship", "ship"], x=0.5, y=0.30)
ov(11, "tag", 0.6, 6.8, text="Barang dagangan", sub="rempah Maluku · beras Jawa · kain India", icon="info")
icons(11, 1.0, 6.4, ["clove", "bowl", "cloth"], stagger=1.4)
ov(12, "label", 0.6, 6.4, text="MALAKA", x=0.62, y=0.30, arrow=True)
ov(14, "year", 0.3, 5.2, text="1511", sub="Afonso de Albuquerque merebut Malaka")
icons(14, 2.0, 3.6, ["portugal", "flame"], slot="br", stagger=0.6)
ov(15, "tag", 0.6, 5.6, text="Benteng A Famosa", sub="dibangun Portugis di Malaka", icon="pin")
icons(15, 1.0, 5.0, ["fortress", "cannon"], stagger=1.0)
ov(16, "tag", 0.8, 6.0, text="Persaingan & konflik", sub="Portugis vs kerajaan-kerajaan Asia Tenggara", icon="warn")
# ---- Jepara & Retna Kencana ----
ov(17, "label", 3.6, 2.4, text="JEPARA", x=0.46, y=0.24, arrow=True)
ov(18, "big", 0.1, 2.5, text="JEPARA", sub="kota pelabuhan pesisir utara Jawa")
ov(19, "tag", 0.6, 6.4, text="Kota pelabuhan", sub="berdagang dengan banyak daerah", icon="pin")
icons(19, 1.2, 5.6, ["handshake", "ship"], stagger=0.8)
ov(20, "tag", 0.8, 5.6, text="Retna Kencana", sub="kelak menjadi Ratu Kalinyamat", icon="info")
ov(21, "tag", 0.4, 4.4, text="Sultan Trenggana", sub="penguasa Kesultanan Demak", icon="info")
icons(21, 0.8, 4.0, ["mosque", "crown"], stagger=0.8)
icons(22, 1.0, 3.6, ["swords"])
ov(23, "label", 0.4, 3.4, text="DEMAK", x=0.50, y=0.22, arrow=True)
icons(24, 3.8, 6.0, ["tear"])
icons(25, 0.6, 5.0, ["swords", "flame"], stagger=0.8)
ov(26, "tag", 0.4, 3.4, text="Pangeran Hadlirin", sub="suami Retna Kencana", icon="info")
icons(26, 0.8, 3.0, ["heart"], glow=True)
ov(27, "tag", 0.8, 7.6, text="Arya Penangsang", sub="Adipati Jipang", icon="warn")
ov(28, "heartbreak", 0.6, 3.4)
icons(29, 1.0, 8.6, ["tear"])
icons(30, 0.6, 3.4, ["sparkle"], glow=True)
# ---- the queen ----
ov(31, "crown", 3.6, 4.0, x=0.62, y=0.20)
ov(32, "tag", 0.6, 5.0, text="Kekuatan maritim", sub="armada dagang & armada perang", icon="info")
icons(32, 1.0, 4.6, ["anchor", "ship"], stagger=0.8)
icons(33, 0.4, 3.4, ["people", "ship"], stagger=0.7)
icons(34, 0.4, 6.4, ["sack", "bowl", "cloth"], stagger=1.1)
ov(35, "tag", 0.6, 6.2, text="Kaya & berpengaruh", sub="hasil perdagangan pelabuhan", icon="info")
icons(35, 1.0, 5.8, ["coins", "crown"], stagger=1.2)
icons(36, 0.5, 3.4, ["bulb"], glow=True)
icons(37, 0.5, 4.4, ["ship", "sack"], stagger=0.8)
ov(38, "fleet", 0.4, 4.4, count=10)
icons(38, 1.4, 3.2, ["cannon", "swords"], stagger=0.6)
ov(39, "route", 0.6, 7.4, points=[[0.42, 0.66], [0.33, 0.36]])
ov(39, "route", 2.4, 5.6, points=[[0.42, 0.66], [0.26, 0.18]])
ov(39, "label", 3.0, 4.8, text="JOHOR", x=0.33, y=0.31, small=True)
ov(39, "label", 4.4, 3.4, text="ACEH", x=0.26, y=0.13, small=True)
# ---- Johor & 1551 ----
icons(40, 3.6, 2.4, ["scroll"], glow=True)
ov(41, "tag", 0.5, 5.4, text="Sultan Johor", sub="mengajak menyerang Malaka", icon="info")
icons(41, 0.8, 5.0, ["swords", "fortress"], stagger=0.9)
icons(42, 0.6, 6.2, ["coins", "xmark"], stagger=1.3)
icons(43, 0.6, 6.4, ["compass", "ship"], stagger=1.0)
ov(44, "stamp", 0.8, 3.6, text="DITERIMA!")
ov(45, "fleet", 0.6, 4.2, count=6)
ov(46, "year", 0.3, 6.6, text="± 40 KAPAL", sub="membawa 4.000 – 5.000 prajurit")
ov(46, "fleet", 0.6, 6.8, count=8)
icons(47, 0.5, 4.4, ["handshake"], glow=True)
icons(48, 0.5, 5.6, ["ship", "fortress"], stagger=1.0)
ov(49, "tag", 0.4, 6.4, text="Pertahanan Portugis", sub="benteng · meriam · pengalaman", icon="warn")
icons(49, 0.8, 6.0, ["fortress", "cannon", "shield"], stagger=0.8)
ov(50, "bursts", 0.2, 6.0, count=7)
icons(51, 1.0, 3.8, ["shield", "xmark"], stagger=1.0)
ov(52, "stamp", 0.3, 2.6, text="GAGAL")
icons(53, 0.4, 2.6, ["portugal", "fortress"], stagger=0.6)
icons(54, 0.6, 3.4, ["tear"])
icons(55, 0.8, 4.8, ["anchor", "sparkle"], stagger=0.8)
icons(56, 0.6, 3.6, ["handshake"], glow=True)
# ---- Maluku, Aceh ----
ov(57, "route", 3.4, 2.0, points=[[0.30, 0.50], [0.47, 0.47], [0.62, 0.44]])
ov(58, "tag", 0.6, 6.4, text="Masyarakat Hitu", sub="Maluku · dibantu Jepara melawan Portugis", icon="pin")
icons(58, 1.0, 6.0, ["spear", "shield", "clove"], stagger=1.0)
icons(59, 0.6, 4.4, ["compass"], glow=True)
ov(60, "hourglass", 3.6, 3.2)
ov(61, "tag", 0.5, 5.4, text="Kesultanan Aceh", sub="sekutu penting Jepara", icon="pin")
icons(61, 0.8, 5.0, ["handshake", "scroll"], stagger=0.9)
icons(62, 0.5, 4.6, ["coins", "ship"], stagger=0.9)
ov(63, "year", 0.2, 3.0, text="1573", sub="Aceh menyerang Portugis")
ov(63, "bursts", 2.6, 4.2, count=4)
ov(64, "stamp", 0.5, 3.0, text="BELUM BERHASIL")
# ---- 1574 ----
ov(65, "fleet", 3.6, 3.4, count=14)
ov(66, "year", 0.3, 5.2, text="OKTOBER 1574", sub="armada Jepara tiba di Malaka")
ov(67, "year", 0.2, 7.4, text="± 300 KAPAL", sub="sekitar 15.000 prajurit")
ov(67, "fleet", 0.4, 7.4, count=24)
ov(68, "tag", 0.3, 3.6, text="± 80 kapal besar", sub="jung Jawa berukuran raksasa", icon="info")
icons(69, 0.4, 7.2, ["cannon", "sack", "bowl"], stagger=1.4)
ov(70, "tag", 0.5, 4.4, text="Kidemang Laksamana", sub="panglima armada Jepara", icon="info")
icons(70, 0.8, 4.0, ["spear", "sparkle"], stagger=0.7)
icons(71, 0.6, 9.2, ["ship", "people", "sack"], stagger=1.6)
ov(73, "tag", 0.5, 6.4, text="Kebutuhan pangan", sub="ribuan prajurit harus makan setiap hari", icon="warn")
icons(73, 0.8, 6.0, ["bowl", "sack"], stagger=1.2)
icons(74, 0.5, 4.6, ["bowl", "ship"], stagger=1.6)
ov(75, "hourglass", 0.4, 6.6)
icons(76, 0.4, 3.8, ["fortress", "shield"], stagger=0.8)
ov(77, "bursts", 0.2, 4.6, count=5)
icons(78, 0.6, 3.4, ["tear"])
icons(79, 0.8, 6.2, ["sack", "xmark"], stagger=1.6)
ov(80, "crossout", 0.4, 5.6, icon="sack", count=6)
ov(80, "tag", 0.8, 5.0, text="6 kapal perbekalan", sub="jatuh ke tangan Portugis", icon="warn")
icons(81, 0.5, 3.6, ["bowl", "tear"], stagger=0.9)
ov(82, "hourglass", 0.6, 6.2)
ov(83, "stamp", 0.6, 4.0, text="GAGAL LAGI")
icons(84, 0.6, 5.4, ["portugal", "fortress"], stagger=1.0)
icons(85, 0.6, 2.6, ["flame"], glow=True)
ov(86, "compare", 0.8, 7.0, title="DUA EKSPEDISI KE MALAKA",
   items=[["Ekspedisi 1551", "± 40 kapal · 4–5 ribu prajurit", "0.133"], ["Ekspedisi 1574", "± 300 kapal · ± 15.000 prajurit", "1"]])
# ---- legacy ----
icons(88, 0.4, 4.4, ["bulb"], glow=True)
ov(89, "route", 0.8, 9.2, points=[[0.38, 0.62], [0.22, 0.36], [0.17, 0.22]])
ov(89, "tag", 2.0, 7.6, text="Kerja sama lintas wilayah", sub="Jepara · Johor · Aceh · Hitu", icon="info")
icons(90, 0.6, 4.6, ["anchor", "sparkle"], stagger=0.9)
icons(91, 0.4, 7.4, ["crown", "compass"], stagger=1.2)
ov(92, "tag", 0.4, 3.6, text="Sumber Portugis", sub="mencatat keberanian Sang Ratu", icon="info")
icons(93, 1.0, 4.0, ["coins", "crown", "shield"], stagger=0.9)
icons(94, 0.6, 6.4, ["portugal", "check"], stagger=1.0)
ov(95, "year", 0.4, 7.2, text="1579", sub="± 30 tahun memerintah Jepara")
icons(96, 0.6, 7.6, ["compass"], glow=True)
icons(97, 0.4, 3.4, ["sparkle"], glow=True)
ov(98, "tag", 0.6, 7.0, text="Pahlawan Nasional", sub="ditetapkan pada tahun 2023", icon="info")
icons(98, 1.0, 6.6, ["queen", "sparkle"], stagger=1.0)
icons(99, 0.6, 4.6, ["swords"], glow=True)
icons(100, 0.6, 8.4, ["crown", "ship", "shield"], stagger=2.0)
icons(101, 0.4, 3.8, ["portugal", "fortress"], stagger=0.8)
ov(102, "fleet", 2.0, 8.0, count=16)
icons(102, 0.4, 6.0, ["crown"], slot="tl", glow=True)
ov(103, "crossout", 0.6, 5.0, icon="ship", count=3)
icons(105, 1.0, 5.0, ["crown", "sparkle"], stagger=1.2)
ov(105, "outro", NARR_END - T[105] + 0.3, END - NARR_END - 0.3, text="RATU KALINYAMAT")

scenes = []
ids = sorted(T)
for n, i in enumerate(ids):
    start = T[i]
    end = T[ids[n + 1]] if n + 1 < len(ids) else END
    tr = TRANS.get(i, "cut" if i != 1 else "none")
    scenes.append(dict(i=i, img=f"img/{i:03d}.jpg", video=CLIPS.get(i), start=start, end=end, trans=tr,
                       tlen=TLEN.get(tr, 0), motion="static" if i in CLIPS else MOTION.get(i, CYCLE[i % len(CYCLE)]),
                       shake=[dict(at=a, dur=d, amp=p) for a, d, p in SHAKE.get(i, [])],
                       night=i in (7, 13, 24, 25, 27, 78), sepia=False))

for o in OV:
    o["start"] = round(T[o["scene"]] + o["at"], 3)
    end = next(s["end"] for s in scenes if s["i"] == o["scene"])
    o["dur"] = round(min(o["dur"], end - o["start"] + 0.05), 3)

plan = dict(fps=FPS, duration=END, narrEnd=NARR_END, scenes=scenes, overlays=OV)
os.makedirs(os.path.join(ROOT, "src", "data"), exist_ok=True)
json.dump(plan, open(os.path.join(ROOT, "src", "data", "plan.json"), "w"), ensure_ascii=False, indent=1)
print("scenes", len(scenes), "overlays", len(OV), "duration", END)
