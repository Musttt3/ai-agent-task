"""Timing narasi (dari transkripsi Whisper) dan mixer audio ffmpeg."""
from __future__ import annotations

import json
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TIMING = ROOT / "timing"
ASSETS = ROOT / "assets"

# Posisi awal tiap bagian VO di timeline global (detik). Jeda antarbagian memberi ruang visual bernapas.
VO_ORDER = ["VO01_hook", "VO02_pembuka", "VO03_latar", "VO04_tersangka-otak", "VO05_bukti", "VO06_klimaks", "VO07_penutup"]
VO_START = {
    "VO01_hook": 1.0,
    "VO02_pembuka": 17.5,
}


def _norm(w: str) -> str:
    return re.sub(r"[^a-z0-9]", "", w.lower())


class VO:
    def __init__(self, name: str, start: float):
        self.name, self.start = name, start
        d = json.loads((TIMING / f"{name}.json").read_text())
        self.words = d["words"]
        self.duration = d["duration"]

    @property
    def end(self) -> float:
        return self.start + self.duration

    def at(self, word: str, nth: int = 1, edge: str = "s") -> float:
        """Waktu global kata ke-nth (awalan cocok, tanpa tanda baca)."""
        key = _norm(word)
        k = 0
        for w in self.words:
            if _norm(w["w"]).startswith(key):
                k += 1
                if k == nth:
                    return self.start + w[edge]
        raise KeyError(f"{word}#{nth} tidak ada di {self.name}")


def vo(name: str) -> VO:
    return VO(name, VO_START[name])


# ---------------------------------------------------------------- audio
@dataclass
class Ev:
    file: str          # relatif ke assets/
    at: float          # waktu mulai di timeline (detik)
    vol_db: float = -18
    ss: float = 0.0    # potong mulai dari detik ke-
    dur: float | None = None
    fade_in: float = 0.0
    fade_out: float = 0.0
    loop: bool = False
    bus: str = "sfx"   # "vo" | "sfx" | "bed" (bed = musik & ambience, di-duck oleh VO)


def mix(events: list[Ev], duration: float, out: Path, t0: float = 0.0):
    """Mix semua event untuk rentang [t0, t0+duration] ke WAV stereo 48 kHz."""
    inputs, chains, buses = [], [], {"vo": [], "sfx": [], "bed": []}
    for i, e in enumerate(events):
        start = e.at - t0
        length = e.dur
        if start + (length or 999) < 0 or start > duration:
            continue
        ss = e.ss
        if start < 0:  # event mulai sebelum rentang
            ss += -start
            if length:
                length -= -start
            start = 0.0
        args = []
        if e.loop:
            args += ["-stream_loop", "-1"]
        args += ["-i", str(ASSETS / e.file)]
        inputs += args
        idx = len([a for a in inputs if a == "-i"]) - 1
        f = f"[{idx}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=start={ss:.3f}"
        if length:
            f += f":duration={length:.3f}"
        f += ",asetpts=PTS-STARTPTS"
        if e.fade_in:
            f += f",afade=t=in:st=0:d={e.fade_in:.2f}"
        if e.fade_out and length:
            f += f",afade=t=out:st={max(0, length - e.fade_out):.2f}:d={e.fade_out:.2f}"
        f += f",volume={e.vol_db}dB,adelay={int(start * 1000)}:all=1[e{i}]"
        chains.append(f)
        buses[e.bus].append(f"[e{i}]")
    g = chains[:]
    for b, lst in buses.items():
        if lst:
            g.append("".join(lst) + f"amix=inputs={len(lst)}:normalize=0:dropout_transition=0,apad[{b}]")
        else:
            g.append(f"anullsrc=r=48000:cl=stereo[{b}]")
    # ducking: bed ditekan saat ada narasi
    g.append("[vo]asplit=2[vo1][vokey]")
    g.append("[bed][vokey]sidechaincompress=threshold=0.02:ratio=6:attack=80:release=900:makeup=1[bedd]")
    g.append(f"[vo1][sfx][bedd]amix=inputs=3:normalize=0,atrim=duration={duration:.3f},alimiter=limit=0.89[out]")
    tmp = out.with_suffix(".tmp.wav")
    cmd = ["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(g), "-map", "[out]",
           "-ar", "48000", "-c:a", "pcm_s16le", str(tmp)]
    subprocess.run(cmd, check=True)
    tmp.replace(out)
    return out


def mux(video: Path, audio: Path, out: Path, crf: int | None = None):
    tmp = out.with_suffix(".tmp.mp4")
    v = ["-c:v", "copy"] if crf is None else ["-c:v", "libx264", "-crf", str(crf), "-preset", "slow", "-pix_fmt", "yuv420p"]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(video), "-i", str(audio), *v, "-c:a", "aac", "-b:a", "192k",
                    "-shortest", "-movflags", "+faststart", str(tmp)], check=True)
    tmp.replace(out)
    return out
