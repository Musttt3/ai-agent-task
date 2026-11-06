"""Edit plan for "Ratu Kalinyamat": simple cuts, icon motion graphics (no on-screen text),
Artlist-animated opening (scenes 1-5). Output: src/data/plan.json"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ALIGN = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "align_fixed.json")

FPS = 30
NARR_END = 637.47
END = 641.5

align = json.load(open(ALIGN))
T = {a["i"]: max(0.0, a["t"] - 0.10) for a in align}
T[1] = 0.0

CLIPS = {1: "clips/001.mp4", 2: "clips/002.mp4", 3: "clips/003.mp4", 4: "clips/004.mp4", 5: "clips/005.mp4"}

CYCLE = ["in", "left", "out", "right", "in", "up", "out", "left", "in", "right"]
MOTION = {8: "spin", 31: "punch", 88: "punch", 67: "out", 105: "in"}

SHAKE = {14: [(0.3, 1.0, 5)], 50: [(0.2, 2.5, 8)], 63: [(0.4, 2.0, 7)], 77: [(0.3, 2.0, 7)], 51: [(0.6, 0.5, 6)]}

# transitions INTO scene i — everything else is a hard cut
TRANS = {6: "flash", 8: "warp", 9: "flash", 13: "flash", 17: "whip", 24: "dip", 30: "fade", 31: "flash",
         40: "whip", 48: "whip", 50: "flash", 60: "whip", 66: "whip", 78: "fade", 84: "fade", 85: "dip",
         88: "flash", 98: "whip", 104: "wipe", 105: "slowfade"}
TLEN = {"cut": 0, "fade": 10, "wipe": 14, "warp": 20, "flash": 10, "zoom": 14, "dip": 24, "slowfade": 24, "whip": 12}

OV = []
def ov(scene, kind, at=0.0, dur=3.0, **kw):
    OV.append(dict(scene=scene, kind=kind, at=at, dur=dur, **kw))

def icons(scene, at, dur, names, slot="tr", stagger=0.45, **kw):
    ov(scene, "icons", at, dur, icons=names, slot=slot, stagger=stagger, **kw)

# ---- opening (Artlist clips) ----
ov(1, "fleet", 1.2, 6.0, count=12)
icons(2, 0.6, 4.4, ["people", "cannon", "swords"], stagger=0.9)
icons(3, 3.6, 3.4, ["queen"], slot="tr", glow=True)
ov(4, "crown", 0.2, 2.6, x=0.82, y=0.22)
icons(5, 0.8, 7.6, ["queen", "swords", "portugal"], slot="tc", stagger=0.8)
icons(7, 1.0, 3.0, ["ship", "question"], stagger=0.6)
# ---- Malacca, trade, Portuguese ----
icons(9, 0.6, 5.6, ["anchor", "coins"], stagger=0.7)
ov(10, "converge", 0.4, 7.0, icons=["ship", "ship", "ship", "ship"], x=0.5, y=0.35)
icons(11, 0.3, 7.4, ["clove", "bowl", "cloth"], stagger=1.6)
ov(12, "pin", 0.5, 7.0, x=0.62, y=0.42)
icons(14, 0.6, 5.2, ["portugal", "flame"], stagger=0.8)
icons(15, 0.5, 6.0, ["fortress", "cannon"], stagger=1.2)
icons(16, 0.8, 6.0, ["swords"], glow=True)
ov(17, "pin", 0.6, 5.0, x=0.46, y=0.30)
ov(18, "pin", 0.4, 1.8, x=0.52, y=0.42)
icons(19, 0.5, 7.0, ["handshake", "ship"], stagger=0.9)
# ---- Retna Kencana & Demak ----
icons(20, 1.0, 5.4, ["queen"], glow=True)
icons(21, 0.4, 4.4, ["mosque", "crown"], stagger=0.8)
icons(22, 1.0, 3.6, ["swords"])
ov(23, "pin", 0.4, 3.6, x=0.52, y=0.33)
icons(24, 1.2, 8.0, ["tear"])
icons(25, 0.6, 5.0, ["swords", "flame"], stagger=0.8)
icons(26, 0.6, 3.2, ["heart"], glow=True)
icons(27, 1.0, 7.4, ["swords", "flame"], stagger=1.0)
ov(28, "heartbreak", 0.6, 3.4)
icons(29, 1.0, 8.6, ["tear"])
icons(30, 0.6, 3.4, ["sparkle"], glow=True)
ov(31, "crown", 0.3, 4.0, x=0.62, y=0.20)
icons(32, 0.6, 5.0, ["anchor", "ship"], stagger=0.9)
icons(33, 0.4, 3.4, ["people", "ship"], stagger=0.7)
icons(34, 0.4, 6.4, ["sack", "bowl", "cloth"], stagger=1.1)
icons(35, 0.6, 6.2, ["coins", "crown"], stagger=1.4)
icons(36, 0.5, 3.4, ["bulb"], glow=True)
icons(37, 0.5, 4.4, ["ship", "sack"], stagger=0.8)
ov(38, "fleet", 0.4, 4.4, count=10)
icons(38, 1.6, 3.0, ["cannon"])
# ---- alliances ----
ov(39, "route", 0.6, 7.6, points=[[0.42, 0.66], [0.33, 0.36]])
ov(39, "route", 2.4, 5.8, points=[[0.42, 0.66], [0.26, 0.18]])
icons(39, 4.0, 4.0, ["handshake"], slot="br")
icons(40, 0.5, 5.4, ["scroll"], glow=True)
icons(41, 0.5, 5.6, ["swords", "fortress"], stagger=0.9)
icons(42, 0.6, 6.2, ["coins", "xmark"], stagger=1.3)
icons(43, 0.6, 6.4, ["compass", "ship"], stagger=1.0)
icons(44, 0.8, 4.0, ["check"], glow=True)
ov(45, "fleet", 0.3, 4.6, count=6)
ov(46, "fleet", 0.3, 4.0, count=8)
ov(46, "swarm", 3.4, 4.4, icon="people", count=18)
icons(47, 0.5, 4.4, ["handshake"], glow=True)
icons(48, 0.5, 5.6, ["ship", "fortress"], stagger=1.0)
# ---- battle 1551 ----
icons(49, 0.4, 6.4, ["fortress", "cannon", "shield"], stagger=0.9)
ov(50, "bursts", 0.2, 6.0, count=7)
icons(51, 1.0, 3.8, ["shield", "xmark"], stagger=1.0)
icons(52, 0.6, 2.8, ["xmark"], glow=True)
icons(53, 0.4, 2.6, ["portugal", "fortress"], stagger=0.6)
icons(54, 0.6, 3.4, ["tear"])
icons(55, 0.8, 4.8, ["anchor", "sparkle"], stagger=0.8)
icons(56, 0.6, 3.6, ["handshake"], glow=True)
ov(57, "route", 0.4, 5.0, points=[[0.30, 0.50], [0.47, 0.47], [0.62, 0.44]])
icons(57, 1.6, 3.6, ["clove"], slot="br")
icons(58, 0.6, 6.4, ["spear", "shield", "clove"], stagger=1.0)
icons(59, 0.6, 4.4, ["compass"], glow=True)
# ---- 1573-1574 ----
ov(60, "hourglass", 0.4, 6.4)
icons(61, 0.5, 5.4, ["handshake", "scroll"], stagger=0.9)
icons(62, 0.5, 4.6, ["coins", "ship"], stagger=0.9)
ov(63, "bursts", 0.2, 6.0, count=6)
icons(64, 0.5, 3.4, ["xmark"], glow=True)
ov(65, "fleet", 0.3, 6.4, count=14)
ov(66, "flagdrop", 0.4, 5.0)
ov(67, "fleet", 0.2, 4.0, count=24)
ov(67, "swarm", 2.6, 5.2, icon="people", count=30)
ov(68, "fleet", 0.2, 3.8, count=8, big=True)
icons(69, 0.4, 7.2, ["cannon", "sack", "bowl"], stagger=1.4)
icons(70, 0.6, 4.4, ["spear", "sparkle"], stagger=0.7)
icons(71, 0.6, 9.2, ["ship", "people", "sack"], stagger=1.6)
icons(72, 0.4, 2.8, ["question"], glow=True)
icons(73, 0.5, 6.4, ["bowl", "sack"], stagger=1.2)
icons(74, 0.5, 4.6, ["bowl", "ship"], stagger=1.6)
ov(75, "hourglass", 0.4, 6.6)
icons(76, 0.4, 3.8, ["fortress", "shield"], stagger=0.8)
ov(77, "bursts", 0.2, 4.6, count=5)
icons(78, 0.6, 3.4, ["tear"])
icons(79, 0.8, 6.2, ["sack", "xmark"], stagger=1.6)
ov(80, "crossout", 0.4, 5.6, icon="sack", count=6)
icons(81, 0.5, 3.6, ["bowl", "tear"], stagger=0.9)
ov(82, "hourglass", 0.6, 6.2)
icons(83, 0.4, 6.4, ["xmark"], glow=True)
icons(84, 0.6, 5.4, ["portugal", "fortress"], stagger=1.0)
icons(85, 0.6, 2.6, ["flame"], glow=True)
ov(86, "crossout", 0.6, 7.0, icon="ship", count=2)
# ---- legacy ----
icons(87, 0.4, 3.6, ["question"], glow=True)
icons(88, 0.4, 4.4, ["bulb"], glow=True)
ov(89, "route", 0.8, 9.2, points=[[0.38, 0.62], [0.22, 0.36], [0.17, 0.22]])
icons(89, 2.2, 7.6, ["handshake", "anchor"], slot="br", stagger=1.0)
icons(90, 0.6, 4.6, ["anchor", "sparkle"], stagger=0.9)
icons(91, 0.4, 7.4, ["crown", "compass"], stagger=1.2)
icons(92, 0.4, 3.8, ["scroll", "portugal"], stagger=0.9)
icons(93, 1.2, 4.0, ["coins", "crown", "shield"], stagger=0.9)
icons(94, 0.6, 6.4, ["portugal", "check"], stagger=1.0)
ov(95, "hourglass", 0.6, 7.0)
icons(96, 0.6, 7.6, ["compass"], glow=True)
icons(97, 0.4, 3.4, ["sparkle"], glow=True)
icons(98, 0.6, 7.6, ["queen", "anchor", "sparkle"], stagger=1.2)
icons(99, 0.6, 4.6, ["swords"], glow=True)
icons(100, 0.6, 8.4, ["crown", "ship", "shield"], stagger=2.0)
icons(101, 0.4, 3.8, ["portugal", "fortress"], stagger=0.8)
ov(102, "fleet", 2.0, 8.0, count=16)
icons(102, 0.4, 6.0, ["crown"], slot="tl", glow=True)
ov(103, "crossout", 0.6, 5.0, icon="ship", count=3)
icons(105, 1.0, 8.0, ["crown", "sparkle"], stagger=1.2)

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
