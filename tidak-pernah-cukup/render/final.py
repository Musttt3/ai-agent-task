"""Perakitan akhir: mix audio global (per bagian, lalu disambung), gabung video, mux, encode final.

python3 render/final.py audio   -> out/final_audio.wav
python3 render/final.py video   -> out/final_video.mp4 (concat -c copy)
python3 render/final.py master  -> out/Mengapa-Manusia-Tidak-Pernah-Merasa-Cukup.mp4
"""
from __future__ import annotations

import importlib
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from engine import ROOT  # noqa: E402
from timeline import SECTIONS, Ev, mix  # noqa: E402

OUT = ROOT / "out"
ORDER = ["sec01", "sec03", "sec04", "sec05", "sec06", "sec07"]
VIDEO = {"sec01": "01_hook-pembuka", "sec03": "03_latar", "sec04": "04_tersangka-otak", "sec05": "05_bukti",
         "sec06": "06_klimaks", "sec07": "07_penutup"}
TOTAL = SECTIONS["sec07"][1]


def global_events() -> list[Ev]:
    ev: list[Ev] = []
    for s in ORDER:
        mod = importlib.import_module(s)
        for e in mod.audio_events():
            # musik & room tone bagian 1 diganti rencana musik global di bawah
            if s == "sec01" and e.file in ("MUSIK01_misteri-tenang.mp3", "SFX01_room-tone.mp3"):
                continue
            ev.append(e)
    ev += [
        Ev("SFX01_room-tone.mp3", 0.0, -21, dur=TOTAL, loop=True, fade_in=1.5, fade_out=3.0, bus="bed"),
        # Hook – Bagian 4: misterius & tenang
        Ev("MUSIK01_misteri-tenang.mp3", 0.0, -4, dur=212.0, fade_in=4.0, fade_out=4.0, bus="bed"),
        # Bukti: denyut lembut
        Ev("MUSIK03_cadangan-denyut.mp3", 208.5, -9, dur=196.0, fade_in=4.0, fade_out=5.0, bus="bed"),
        # Klimaks (setelah cap PETUNJUK BARU)
        Ev("MUSIK01_misteri-tenang.mp3", 417.0, -5, ss=95.0, dur=62.0, fade_in=3.0, fade_out=3.5, bus="bed"),
        # Penutup: hangat
        Ev("MUSIK02_hangat-penutup.mp3", 477.5, -7, dur=TOTAL - 477.5, fade_in=4.0, fade_out=5.0, bus="bed"),
    ]
    return ev


def build_audio():
    ev = global_events()
    parts = []
    for s in ORDER:
        t0, t1 = SECTIONS[s]
        p = OUT / f"mix_{s}.wav"
        mix(ev, t1 - t0, p, t0=t0)
        parts.append(p)
        print("mix", s, flush=True)
    lst = OUT / "mix_list.txt"
    lst.write_text("".join(f"file '{p.name}'\n" for p in parts))
    raw = OUT / "final_audio_raw.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(raw)], check=True)
    # normalisasi loudness ke -14 LUFS (standar YouTube), true peak -1.5 dBTP, dua tahap
    m = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(raw), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True).stderr
    js = json.loads(m[m.rindex("{"):m.rindex("}") + 1])
    flt = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
           f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
    out = OUT / "final_audio.wav"
    tmp = out.with_suffix(".tmp.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", flt, "-ar", "48000", "-c:a", "pcm_s16le", str(tmp)], check=True)
    tmp.replace(out)
    print("audio:", out, "input_i", js["input_i"])


def build_video():
    lst = OUT / "video_list.txt"
    lst.write_text("".join(f"file '{VIDEO[s]}_video.mp4'\n" for s in ORDER))
    out = OUT / "final_video.mp4"
    tmp = out.with_suffix(".tmp.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(tmp)], check=True)
    tmp.replace(out)
    print("video:", out)


def master(crf: int = 21):
    out = OUT / "Mengapa-Manusia-Tidak-Pernah-Merasa-Cukup.mp4"
    tmp = out.with_suffix(".tmp.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(OUT / "final_video.mp4"), "-i", str(OUT / "final_audio.wav"),
                    "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", str(crf), "-pix_fmt", "yuv420p",
                    "-r", "30", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(tmp)],
                   check=True)
    tmp.replace(out)
    print("master:", out)


if __name__ == "__main__":
    {"audio": build_audio, "video": build_video, "master": master}[sys.argv[1]]()
