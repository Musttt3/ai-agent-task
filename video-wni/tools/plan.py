"""Edit plan for "Manusia Purba Jadi WNI": simple cuts + Ken Burns, title/chapter cards,
tags, stamps, counters and situational icons. Output: src/data/plan.json"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ALIGN = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "align_fixed.json")

FPS = 30
NARR_END = 587.73
END = 593.5

align = json.load(open(ALIGN))
T = {a["i"]: max(0.0, a["t"] - 0.10) for a in align}
T[1] = 0.0

CLIPS = {}
CYCLE = ["in", "left", "out", "right", "in", "up", "out", "left", "in", "right"]
MOTION = {5: "spin", 6: "punch", 13: "punch", 19: "punch", 48: "punch", 50: "in", 83: "punch",
          166: "spin", 160: "punch", 169: "pushSlow"}
SHAKE = {5: [(0.4, 3.5, 7)], 6: [(0.0, 1.2, 9)], 8: [(0.4, 2.0, 4)], 13: [(1.6, 1.4, 9)], 14: [(0.2, 1.0, 5)],
         29: [(0.3, 0.8, 5)], 48: [(1.4, 1.0, 6)], 49: [(0.2, 3.0, 4)], 65: [(1.6, 1.2, 4)],
         114: [(0.3, 0.7, 5)], 158: [(0.2, 1.4, 3)], 166: [(0.3, 3.0, 6)]}

# hand-drawn sepia flashbacks ("di zamanmu / dulu")
FLASHBACK = {22, 43, 55, 56, 64, 79, 91, 92, 109, 110, 111, 124, 125, 141, 143, 146, 150, 155, 164, 165}
NIGHT = {76, 79, 80, 106, 107, 118, 119, 132, 157, 162}

# transitions INTO scene i -- everything else is a hard cut
TRANS = {2: "dip", 5: "flash", 6: "warp", 7: "flash", 19: "flash", 36: "fade", 50: "zoom", 52: "wipe",
         69: "flash", 78: "fade", 83: "zoom", 103: "wipe", 108: "slowfade", 130: "fade", 140: "fade",
         166: "flash", 167: "warp", 169: "whip"}
for i in sorted(FLASHBACK):          # into a flashback and back out of it
    TRANS[i] = "film"
    if i + 1 not in FLASHBACK and i + 1 <= 169:
        TRANS.setdefault(i + 1, "fade")
TLEN = {"cut": 0, "fade": 10, "wipe": 14, "warp": 20, "flash": 10, "zoom": 14, "dip": 24, "slowfade": 24,
        "whip": 12, "film": 16}

OV = []
def ov(scene, kind, at=0.0, dur=3.0, **kw):
    OV.append(dict(scene=scene, kind=kind, at=at, dur=dur, **kw))

def icons(scene, at, dur, names, slot="tr", stagger=0.45, **kw):
    ov(scene, "icons", at, dur, icons=names, slot=slot, stagger=stagger, **kw)

CHAPTERS = {
    4: ("BAB 1", "Terlempar ke Masa Depan", "Dari hutan purba ke Jakarta"),
    16: ("BAB 2", "Menjadi WNI", "Nama · alamat · KTP"),
    24: ("BAB 3", "Masalah Pertama: Makan", "Hewan tak bisa ditangkap sembarangan"),
    42: ("BAB 4", "Bekerja & Gaji Pertama", "Pekerja bangunan"),
    66: ("BAB 5", "Ponsel & Internet", "Keajaiban sekecil telapak tangan"),
    81: ("BAB 6", "Viral di Media Sosial", "Foto berbaju kulit hewan"),
    97: ("BAB 7", "Rindu Hutan", "Kota yang tak pernah sepi"),
    118: ("BAB 8", "Anak yang Hilang", "Sesuatu yang terasa akrab"),
    137: ("BAB 9", "Kesimpulan", "Nyaman, tapi tidak mudah"),
    157: ("BAB 10", "Tanggal Tua", "Sebuah pesan masuk..."),
}
for k in CHAPTERS:
    if TRANS.get(k, "cut") in ("cut", "fade"):
        TRANS[k] = "whip"

ov(1, "title", 0.3, 7.2, title="MANUSIA PURBA JADI WNI", text="BAGAIMANA RASANYA?",
   sub="Bertahan hidup ribuan tahun... lalu tinggal di Indonesia modern")
for k, (num, title, sub) in CHAPTERS.items():
    ov(k, "chapter", 0.2, 3.0, num=num, title=title, sub=sub)

# ---- opening ----
ov(1, "crossout", 2.4, 5.0, icons=["bulb", "money", "cloth"])
icons(2, 1.6, 3.6, ["question"], glow=True)
ov(3, "crossout", 0.1, 3.4, icons=["fang", "people"])
ov(3, "stamp", 3.6, 3.3, text="WNI!")
# ---- thrown into the future ----
ov(5, "embers", 0.6, 4.4)
ov(6, "counter", 0.0, 4.4, **{"from": -10000, "to": 2026, "title": "MAJU KE MASA DEPAN", "sub": "JAKARTA"})
ov(7, "label", 1.0, 3.2, text="JAKARTA", x=0.5, y=0.2, arrow=True)
icons(8, 0.4, 4.2, ["horn", "bus", "horn"], stagger=0.35)
icons(9, 0.3, 2.0, ["arrowup"], slot="tl")
icons(10, 0.6, 3.6, ["phone"], glow=True)
icons(11, 0.6, 4.8, ["sun"], glow=True)
ov(11, "tag", 1.4, 4.0, text="PANAS!", sub="jauh lebih panas daripada hutan", icon="sun")
icons(12, 0.8, 3.4, ["crown", "star"], stagger=0.6)
icons(13, 1.4, 4.2, ["horn"], glow=True)
ov(14, "stamp", 2.4, 4.0, text="AWAS!")
ov(15, "tag", 0.6, 4.0, text="Petugas datang", sub="dibawa ke tempat aman", icon="pin")
# ---- becoming a citizen ----
icons(16, 3.4, 1.4, ["sparkle", "question"])
icons(17, 0.4, 3.4, ["scroll", "check"], stagger=0.8)
icons(18, 0.4, 4.4, ["idcard", "house", "flag"], stagger=1.1)
ov(19, "bursts", 0.0, 2.0, count=3)
ov(19, "stamp", 0.5, 4.0, text="RESMI WNI")
icons(19, 0.8, 3.6, ["flag"], slot="tl", glow=True)
ov(20, "tag", 0.4, 3.6, text="KTP", sub="Kartu Tanda Penduduk", icon="info")
icons(20, 0.6, 3.2, ["idcard"], glow=True)
icons(21, 0.3, 2.2, ["question", "question"], stagger=0.3)
icons(22, 1.0, 6.0, ["spear", "muscle", "drumstick"], stagger=1.4)
ov(22, "tag", 0.6, 6.4, text="Dulu dikenal dari...", sub="kemampuan berburu & keberanian", icon="sun")
icons(23, 1.6, 4.0, ["idcard"], glow=True)
# ---- first problem: food ----
icons(25, 0.2, 1.8, ["bowl", "question"], stagger=0.3)
icons(26, 0.6, 2.8, ["chicken"])
icons(27, 0.2, 2.4, ["bulb"], glow=True)
icons(28, 0.6, 3.8, ["stone"])
icons(29, 0.4, 4.6, ["xmark", "chicken"], stagger=0.4)
ov(30, "stamp", 0.6, 2.8, text="MILIK ORANG!")
ov(31, "crossout", 0.4, 3.6, icons=["chicken", "spear"])
ov(32, "converge", 0.3, 4.0, icons=["money", "money", "money"], icon="bowl", x=0.72, y=0.32)
ov(33, "label", 0.4, 2.0, text="WARUNG NASI", x=0.5, y=0.18, arrow=True)
icons(34, 0.3, 4.6, ["drumstick", "bowl"], stagger=1.6)
ov(35, "crossout", 0.6, 4.6, icons=["flame", "spear", "hourglass"])
icons(36, 0.1, 2.4, ["sparkle", "star", "sparkle"], slot="tc", stagger=0.2, glow=True)
icons(37, 1.6, 2.8, ["money", "question"], stagger=0.5)
icons(38, 0.6, 3.2, ["stone", "stone", "stone"], stagger=0.35)
icons(39, 0.4, 2.2, ["question"])
ov(40, "big", 0.4, 4.6, text="HUKUM MODERN", sub="tak punya uang = susah")
ov(41, "crossout", 0.6, 4.6, icons=["bowl", "house", "cloth", "bus"])
# ---- work & first salary ----
icons(43, 0.6, 4.0, ["stone", "muscle"], stagger=1.2)
icons(44, 0.3, 2.6, ["check", "muscle"], stagger=0.5)
ov(45, "tag", 0.2, 2.2, text="Pekerja bangunan", sub="hari pertama", icon="info")
icons(46, 0.2, 2.0, ["check"])
icons(47, 0.6, 4.8, ["muscle", "sun"], stagger=1.6)
icons(48, 2.6, 2.8, ["xmark"], glow=True)
ov(49, "tag", 0.4, 3.2, text="MONSTER?!", sub="mesin pengaduk semen", icon="warn")
ov(50, "stamp", 0.8, 3.0, text="MONSTER JINAK")
icons(51, 0.3, 2.4, ["calendar", "check"], stagger=0.6)
icons(52, 1.2, 2.6, ["money"], glow=True)
ov(53, "converge", 0.2, 4.8, icons=["money", "money", "money", "money"], icon="money", x=0.74, y=0.30)
icons(54, 0.1, 1.7, ["laugh"], glow=True)
icons(55, 0.2, 2.1, ["spear", "drumstick"], stagger=0.5)
icons(56, 0.6, 3.8, ["fang"])
ov(57, "tag", 0.3, 3.4, text="Kerja = uang = makanan", sub="tanpa diterkam binatang buas", icon="info")
icons(58, 0.4, 2.6, ["thumbsup"], glow=True)
icons(59, 0.6, 3.6, ["money", "question"], stagger=0.6)
icons(60, 0.4, 6.0, ["house", "bulb", "tap", "bus"], stagger=1.0)
icons(61, 0.2, 1.9, ["money"])
ov(62, "ticker", 0.1, 2.4, **{"from": 1, "to": 10, "icon": "muscle", "sub": "jari... tidak cukup!"})
icons(63, 0.4, 4.2, ["calendar", "scroll", "money"], stagger=0.9)
ov(63, "tag", 0.6, 4.0, text="Cicilan · Tagihan · Pajak", sub="belum pernah dengar", icon="warn")
icons(64, 0.6, 3.2, ["fang"])
icons(65, 1.0, 4.2, ["house", "calendar"], stagger=0.8)
ov(65, "stamp", 2.6, 2.8, text="TOK TOK TOK!")
# ---- phone & internet ----
icons(67, 0.4, 2.4, ["wifi"], glow=True)
icons(69, 0.2, 3.2, ["phone", "sparkle"], glow=True, stagger=0.4)
icons(70, 0.2, 2.0, ["phone"])
icons(71, 0.2, 3.2, ["plane", "tree"], stagger=0.7)
icons(72, 0.1, 1.7, ["chat"])
icons(73, 0.6, 3.4, ["phone", "spear"], stagger=0.8)
icons(74, 0.1, 1.9, ["star", "sparkle"], glow=True, stagger=0.3)
ov(75, "tag", 0.4, 2.6, text="Mulai kecanduan...", sub="satu video lagi", icon="warn")
icons(76, 0.4, 2.8, ["moon", "phone"], stagger=0.6)
ov(77, "ticker", 0.1, 2.5, **{"from": 1, "to": 87, "icon": "phone", "sub": "video ditonton"})
icons(78, 0.1, 1.9, ["sun"], glow=True)
icons(79, 0.5, 2.6, ["moon"])
icons(80, 0.5, 3.6, ["phone", "flame"], stagger=0.8)
# ---- viral ----
icons(82, 0.4, 2.8, ["phone"])
ov(83, "ticker", 0.1, 2.7, **{"from": 0, "to": 25000, "icon": "heart", "sub": "suka", "big": True})
icons(85, 0.2, 2.0, ["laugh"])
icons(86, 0.2, 2.6, ["laugh", "star"], stagger=0.5)
icons(87, 0.2, 2.2, ["question"])
ov(88, "notif", 0.1, 2.0, title="KOMENTAR BARU", text="\"Beli rambut palsu di mana?\"", icon="chat")
icons(89, 0.3, 2.4, ["question"])
ov(90, "swarm", 0.0, 3.4, count=12, icon="chat")
icons(91, 0.4, 3.0, ["tree"])
icons(92, 0.1, 1.4, ["check"])
icons(93, 0.2, 3.2, ["chat", "burst", "chat"], stagger=0.4)
icons(94, 0.4, 3.0, ["question"])
icons(95, 0.4, 4.6, ["wifi", "people"], stagger=1.0)
ov(96, "crossout", 0.4, 3.8, icons=["handshake"])
# ---- missing the forest ----
icons(98, 0.2, 2.6, ["bus"])
icons(99, 0.1, 1.8, ["phone", "bowl"], stagger=0.4)
ov(100, "stamp", 0.8, 2.4, text="LUNAS!")
icons(101, 0.4, 2.6, ["cloth", "check"], stagger=0.6)
icons(103, 0.6, 2.6, ["question"])
icons(104, 0.4, 3.4, ["horn", "bell", "phone"], stagger=0.5)
icons(105, 0.1, 2.6, ["horn", "horn"], stagger=0.3)
icons(106, 0.2, 3.8, ["bell", "phone"], stagger=0.4)
icons(107, 0.2, 2.4, ["hardhat"])
icons(108, 0.4, 1.6, ["tree"], glow=True)
icons(110, 0.4, 3.4, ["tree", "moon"], stagger=1.0)
icons(112, 0.2, 1.8, ["tree"])
icons(113, 0.3, 2.0, ["moon"])
ov(114, "stamp", 0.3, 2.1, text="DILARANG TIDUR!")
icons(115, 0.1, 1.8, ["question"])
ov(116, "ticker", 0.2, 3.3, **{"from": 0, "to": 10000, "icon": "hourglass", "sub": "tahun membangun peradaban", "big": True})
ov(117, "hourglass", 0.4, 4.2)
# ---- the lost child ----
icons(120, 0.6, 2.6, ["tear"])
icons(121, 0.3, 2.0, ["people", "question"], stagger=0.5)
icons(122, 0.2, 2.4, ["question", "question"], stagger=0.3)
icons(123, 0.3, 2.4, ["heart"])
ov(124, "tag", 0.4, 3.4, text="Di zamanmu...", sub="kehilangan anggota kelompok = bahaya", icon="warn")
icons(125, 0.4, 3.4, ["people", "handshake"], stagger=0.8)
icons(126, 0.1, 2.0, ["people"])
icons(127, 0.1, 1.8, ["phone"])
icons(128, 0.2, 2.4, ["people", "pin"], stagger=0.5)
icons(130, 0.6, 2.6, ["heart"], glow=True)
icons(131, 0.4, 2.4, ["heart", "sparkle"], stagger=0.5)
icons(133, 0.4, 3.2, ["heart"], glow=True)
icons(134, 0.4, 3.0, ["hourglass"])
ov(136, "stamp", 0.4, 2.6, text="SALING MEMBUTUHKAN")
# ---- conclusion ----
ov(138, "crossout", 0.4, 3.6, icons=["money", "hardhat", "phone"])
ov(140, "compare", 0.2, 3.6, title="ZAMAN PURBA vs ZAMAN MODERN",
   items=[["Kenyamanan zaman purba", "rendah", "0.25"], ["Kenyamanan zaman modern", "jauh lebih tinggi", "1"]])
icons(142, 0.2, 2.4, ["pill", "check"], stagger=0.5)
icons(143, 0.4, 2.6, ["calendar"])
icons(144, 0.1, 2.0, ["plane", "clock"], stagger=0.4)
ov(145, "tag", 0.4, 3.6, text="Masalah baru", sub="kemajuan juga punya harga", icon="warn")
icons(146, 0.4, 3.4, ["fang"])
icons(147, 0.3, 3.3, ["hardhat"])
icons(148, 0.1, 2.1, ["money", "arrowup"], stagger=0.3)
icons(149, 0.3, 2.5, ["people", "arrowup"], stagger=0.5)
icons(150, 0.4, 4.0, ["drumstick", "xmark"], stagger=0.8)
icons(151, 0.4, 3.4, ["bowl", "drumstick", "chicken"], stagger=0.5)
icons(152, 0.4, 3.4, ["calendar", "question"], stagger=0.6)
icons(153, 0.6, 3.0, ["idcard"])
icons(154, 0.2, 2.4, ["bulb"], glow=True)
ov(156, "big", 0.3, 4.2, text="TIDAK SEMUDAH ITU", sub="menjadi manusia modern")
# ---- ending ----
icons(157, 3.2, 1.4, ["bowl"])
icons(158, 0.1, 2.0, ["bell"], glow=True)
ov(159, "notif", 0.2, 5.4, title="PEMILIK KONTRAKAN · baru saja", text="\"Besok jangan lupa bayar sewa ya.\"", icon="house")
icons(162, 0.6, 4.0, ["moon"])
icons(164, 0.4, 3.6, ["spear", "tree"], stagger=0.9)
icons(166, 1.2, 2.6, ["clock", "question"], stagger=0.6)
ov(167, "embers", 0.0, 2.5)
icons(168, 0.2, 2.8, ["hardhat", "clock"], stagger=0.5)
ov(169, "stamp", 1.4, 4.6, text="TANGGAL TUA")
icons(169, 1.0, 5.0, ["calendar", "money"], stagger=1.0)
ov(169, "outro", NARR_END - T[169] + 0.4, END - NARR_END, text="Tulis di komentar: kamu tim purba atau tim modern?")

OV[:] = [o for o in OV if o is not None]

scenes = []
ids = sorted(T)
for n, i in enumerate(ids):
    start = T[i]
    end = T[ids[n + 1]] if n + 1 < len(ids) else END
    tr = TRANS.get(i, "cut" if i != 1 else "none")
    scenes.append(dict(i=i, img=f"img/{i:03d}.jpg", video=CLIPS.get(i), start=start, end=end, trans=tr,
                       tlen=TLEN.get(tr, 0), motion=MOTION.get(i, CYCLE[i % len(CYCLE)]),
                       shake=[dict(at=a, dur=d, amp=p) for a, d, p in SHAKE.get(i, [])],
                       night=i in NIGHT, sepia=False))

for o in OV:
    o["start"] = round(T[o["scene"]] + o["at"], 3)
    end = next(s["end"] for s in scenes if s["i"] == o["scene"])
    if o["kind"] in ("chapter", "outro"):
        o["dur"] = round(min(o["dur"], END - o["start"]), 3)
    else:
        o["dur"] = round(min(o["dur"], end - o["start"] + 0.05), 3)
OV.sort(key=lambda o: o["start"])

plan = dict(fps=FPS, duration=END, narrEnd=NARR_END, scenes=scenes, overlays=OV)
os.makedirs(os.path.join(ROOT, "src", "data"), exist_ok=True)
json.dump(plan, open(os.path.join(ROOT, "src", "data", "plan.json"), "w"), ensure_ascii=False, indent=1)
print("scenes", len(scenes), "overlays", len(OV), "duration", END)
bad = [o for o in OV if o["dur"] < 0.8]
for o in bad:
    print("SHORT", o["scene"], o["kind"], o["dur"])
