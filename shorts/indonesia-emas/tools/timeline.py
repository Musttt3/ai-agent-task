"""Single source of truth for the film's timing.

Cuts the chosen narration take into one clip per line (at the quietest point between lines), places the clips on the
film timeline with designed gaps, snaps line starts to the music grid (foxtrot 128 bpm, then a 76 bpm ballad), and
derives shot times, subtitle cards and music sections. Writes voice/lines/*.wav and timeline.json.

usage: python tools/timeline.py   (from the project folder, with the library's .venv python)
"""
import json, os, re
import numpy as np, soundfile as sf, soxr

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAKE = "voice/take1"
SR = 48000

# gap BEFORE each line (seconds of film time), designed per the treatment's beat sheet
GAP = {"L1": .55, "L2": .6, "L3": .35, "L4": .55, "L5": .4, "L6": .55, "L7": .3, "L8": .65, "L9": .5,
       "L10": 1.35, "L11": .55, "L12": .5, "L13": 1.0, "L14": .5, "L15": .6, "L16": 1.1}
TAIL = 3.0                        # after the last line: the dial lands on "?", the doors close, hold
BPM_A, BPM_D = 128.0, 76.0        # foxtrot (L1-L9, L11-L12 comic), ballad (L13-L16)

def load(path):
    import subprocess
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()

def rms_frames(x, hop=.01):
    n = int(SR * hop); m = len(x) // n
    return np.sqrt((x[:m * n].reshape(m, n) ** 2).mean(1) + 1e-12), hop

def main():
    os.chdir(HERE)
    W = json.load(open(TAKE + ".words.json"))
    x = load(TAKE + ".mp3")
    r, hop = rms_frames(x)
    lines = W["lines"]
    # cut points: quietest 10 ms frame between the end of line i and the start of line i+1 (searched with a margin)
    cuts = [0.0]
    for a, b in zip(lines, lines[1:]):
        lo, hi = a["t1"] - .12, b["t0"] + .25
        if hi <= lo: hi = lo + .3
        i0, i1 = int(lo / hop), int(hi / hop)
        k = i0 + int(np.argmin(r[i0:i1]))
        cuts.append(k * hop)
    cuts.append(len(x) / SR)
    os.makedirs("voice/lines", exist_ok=True)
    thr = 10 ** (-42 / 20)
    clips = []
    for i, L in enumerate(lines):
        s, e = int(cuts[i] * SR), int(cuts[i + 1] * SR)
        seg = x[s:e]
        # trim leading/trailing near-silence, keep 40 ms / 120 ms of air
        env = np.abs(seg) > thr
        nz = np.nonzero(env)[0]
        a0 = max(0, nz[0] - int(.04 * SR)) if len(nz) else 0
        a1 = min(len(seg), nz[-1] + int(.12 * SR)) if len(nz) else len(seg)
        seg = seg[a0:a1].copy()
        fade = int(.008 * SR); seg[:fade] *= np.linspace(0, 1, fade); seg[-fade:] *= np.linspace(1, 0, fade)
        sf.write(f"voice/lines/{L['id']}.wav", seg, SR)
        off = (s + a0) / SR            # take time of the clip's first sample
        clips.append({"id": L["id"], "text": L["text"], "dur": len(seg) / SR, "off": off,
                      "words": [{"w": w["w"], "s": w["s"] - off, "e": w["e"] - off} for w in L["words"]]})
    # place on the film timeline; snap the first word onset of each line to the grid
    beatA, beatD = 60 / BPM_A, 60 / BPM_D
    t = 0.0; sections = {}
    for c in clips:
        onset = max(0.0, c["words"][0]["s"])
        want = t + GAP[c["id"]] + onset
        if c["id"] == "L13":            # the ballad starts on the downbeat of L13
            sections["D"] = want - onset - .05
            sections["D_beat0"] = want
        if c["id"] in ("L13", "L14", "L15", "L16"):
            g0, bt = sections["D_beat0"], beatD / 2
        else:
            g0, bt = 0.0, beatA / 2      # eighth-note grid of the foxtrot
        snapped = g0 + round((want - g0) / bt) * bt
        if snapped < t + .12 + onset: snapped += bt
        c["t0"] = snapped - onset        # clip start (film time)
        c["on"] = snapped                # first word onset (film time)
        c["wordsF"] = [{"w": w["w"], "s": round(c["t0"] + w["s"], 3), "e": round(c["t0"] + w["e"], 3)} for w in c["words"]]
        t = c["t0"] + c["dur"]
    DUR = round(t + TAIL, 3)
    L = {c["id"]: c for c in clips}
    def word(lid, needle, k=0):
        hits = [w for w in L[lid]["wordsF"] if re.sub(r"\W", "", w["w"].lower()).startswith(needle)]
        return hits[k]["s"]
    # shot boundaries (cuts land a little before the line that opens the shot)
    shots = [
        ["tower", 0.0],
        ["bedroom", L["L2"]["on"] - .45],
        ["tv", L["L3"]["on"] - .3],
        ["street", L["L4"]["on"] - .5],
        ["phone", L["L6"]["on"] - .4],
        ["school", L["L8"]["on"] - .5],
        ["village", L["L9"]["on"] - .4],
        ["wait", L["L10"]["on"] - .55],
        ["marquee", L["L11"]["on"] - .35],
        ["overhead", L["L13"]["on"] - .55],
        ["towers", L["L14"]["on"] - .4],
        ["city", L["L15"]["on"] - .45],
        ["dial", L["L16"]["on"] - .6],
    ]
    keys = {
        "emas": word("L1", "emas"), "indonesia1": word("L1", "indonesia"), "kaget": word("L2", "kaget"),
        "resmi": word("L3", "resmi"), "maju": word("L3", "maju"), "dunia": word("L3", "dunia"),
        "transportasi": word("L5", "transportasi"), "hampir": word("L5", "hampir"), "kemacetan": word("L5", "kemacetan"),
        "heran": word("L6", "heran"), "lapangan": word("L7", "lapangan"), "gaji": word("L7", "gaji"), "harga": word("L7", "harga"),
        "sekolah": word("L8", "sekolah"), "rumah": word("L8", "rumah"), "biaya": word("L8", "biaya"),
        "desa": word("L9", "bahkan"), "internet": word("L9", "internet"), "listrik": word("L9", "listrik"), "andal": word("L9", "andal"),
        "tunggu": word("L10", "tunggu"), "kaya": word("L11", "kaya"), "tentu": word("L12", "tentu"), "nggak": word("L12", "nggak"),
        "miliarder": word("L13", "miliarder"), "kesempatan": word("L13", "kesempatan"), "baik": word("L13", "baik"),
        "gedung": word("L14", "gedung"), "teknologi": word("L14", "teknologi"), "rakyat": word("L15", "rakyat"),
        "merasakan": word("L15", "merasakan"), "kemajuannya": word("L15", "kemajuannya"), "kapan": word("L16", "kapan"),
        "itu": word("L16", "itu"),
    }
    # subtitle cards: clauses merged up to ~56 chars, each card up to two rows of ~30 chars
    cards = []
    for c in clips:
        toks = c["wordsF"]
        txt = lambda ws: " ".join(v["w"] for v in ws)
        # clauses at punctuation; a clause longer than 60 chars is split into balanced parts
        clauses, cur = [], []
        for w in toks:
            cur.append(w)
            if re.search(r"[,.!?]$|\.\.\.$", w["w"]):
                clauses.append(cur); cur = []
        if cur: clauses.append(cur)
        parts = []
        for cl in clauses:
            n = -(-len(txt(cl)) // 56)
            if n <= 1: parts.append(cl); continue
            target = len(txt(cl)) / n; acc = []
            for w in cl:
                acc.append(w)
                if len(txt(acc)) >= target and len(parts) < 99 and w is not cl[-1]:
                    parts.append(acc); acc = []
            if acc: parts.append(acc)
        groups = []
        for p in parts:
            dur = p[-1]["e"] - p[0]["s"]
            if groups and len(txt(groups[-1] + p)) <= 62 and (len(txt(groups[-1])) < 30 or dur < 1.0 or groups[-1][-1]["e"] - groups[-1][0]["s"] < 1.3):
                groups[-1] = groups[-1] + p
            else:
                groups.append(p)
        for gi, gw in enumerate(groups):
            text = " ".join(v["w"] for v in gw)
            # two rows, balanced at a word boundary
            words = text.split(); best = [text]
            if len(text) > 28:
                cands = [(abs(len(" ".join(words[:k])) - len(" ".join(words[k:]))), k) for k in range(1, len(words))
                         if not (words[k - 1].lower() == "indonesia" and words[k].lower().startswith("emas"))]
                k = min(cands)[1]; best = [" ".join(words[:k]), " ".join(words[k:])]
            cards.append({"line": c["id"], "rows": best, "t0": round(gw[0]["s"] - .08, 3), "speechEnd": gw[-1]["e"]})
    for i, cd in enumerate(cards):
        nxt = cards[i + 1]["t0"] if i + 1 < len(cards) else DUR - 1.2
        end = max(cd["speechEnd"] + .6, cd["t0"] + 1.8)
        cd["t1"] = round(min(end, nxt - .02) if nxt - cd["t0"] > 1.0 else nxt - .02, 3)
    for i, cd in enumerate(cards):        # a short card may start earlier, into free time, to reach 1.8 s
        short = 1.8 - (cd["t1"] - cd["t0"])
        if short > 0:
            prev = cards[i - 1]["t1"] + .02 if i else 0.0
            cd["t0"] = round(max(prev, cd["t0"] - short), 3)
    tl = {"DUR": DUR, "bpmA": BPM_A, "bpmD": BPM_D, "sections": {"A": 0.0, "B": L["L10"]["on"] - .62, "C": L["L11"]["on"] - .3, **sections},
          "lines": [{k: c[k] for k in ("id", "text", "t0", "on", "dur", "wordsF")} for c in clips],
          "shots": shots, "keys": {k: round(v, 3) for k, v in keys.items()}, "cards": cards}
    json.dump(tl, open("timeline.json", "w"), indent=1, ensure_ascii=False)
    for c in clips:
        print(f"{c['id']:>4}  clip {c['t0']:6.2f}-{c['t0'] + c['dur']:6.2f}  onset {c['on']:6.2f}  ({c['dur']:.2f}s)")
    print("DUR", DUR, "sections", {k: round(v, 2) for k, v in tl["sections"].items()})
    print("cards", len(cards), "| longest row", max(len(r) for cd in cards for r in cd["rows"]), "chars")

if __name__ == "__main__":
    main()
