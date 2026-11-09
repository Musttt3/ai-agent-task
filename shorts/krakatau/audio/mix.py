#!/usr/bin/env python3
"""Mix the Krakatau sample (scenes 1-3): voice + music (ducked under voice) + ambiences + SFX.
Usage: python3 mix.py OUT.wav   (run from shorts/krakatau/audio). 48 kHz stereo, loudness-normalised to -14 LUFS.
Times are seconds on the video timeline (30 fps; scene cuts at 8.5 s and 14.5 s, see Krakatau.tsx)."""
import subprocess, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else "mix_sample.wav"
TOTAL = 21.0

# (file, start_s, gain_dB, trim_dur_s or None, fade_in_s, fade_out_s)
layers = [
    ("voice_s1-3.mp3", 0.20, 0.0, None, 0.0, 0.0),
    ("sfx/laut_malam.mp3", 0.00, -15.0, 8.9, 0.8, 0.6),   # scene 1: night sea
    ("sfx/boom.mp3", 2.70, -4.0, None, 0.0, 1.5),         # the sound heard 4,800 km away (in the VO pause)
    ("sfx/pantai.mp3", 8.30, -19.0, 6.4, 0.5, 0.5),        # scene 2: beach at dusk
    ("sfx/boom_b.mp3", 12.60, -16.0, None, 0.0, 0.8),      # faint "cannon" after "suara meriam"
    ("sfx/swoop.mp3", 14.30, -11.0, None, 0.0, 0.3),       # camera dive into the chart
]

inputs, chains, labels = [], [], []
for i, (f, start, gain, dur, fin, fout) in enumerate(layers):
    inputs += ["-i", f]
    c = f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo"
    if dur:
        c += f",atrim=0:{dur}"
        if fout:
            c += f",afade=t=out:st={dur - fout}:d={fout}"
    elif fout:
        c += f",areverse,afade=t=in:d={fout},areverse"
    if fin:
        c += f",afade=t=in:d={fin}"
    c += f",volume={gain}dB,adelay={int(start * 1000)}|{int(start * 1000)},apad=whole_dur={TOTAL}"
    lab = f"l{i}"
    chains.append(c + f"[{lab}]")
    labels.append(lab)

# music: whole timeline, ducked by the voice
m = len(layers)
inputs += ["-i", "musik.mp3"]
chains.append(f"[{m}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{TOTAL},volume=4dB,"
              f"afade=t=out:st={TOTAL - 1.4}:d=1.4[mus]")
chains.append("[l0]asplit=2[vo][key]")
chains.append("[mus][key]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=500[musd]")
mixin = "[vo]" + "".join(f"[{l}]" for l in labels[1:]) + "[musd]"
chains.append(f"{mixin}amix=inputs={len(labels) + 1}:normalize=0,atrim=0:{TOTAL},"
              f"loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[out]")

cmd = ["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(chains), "-map", "[out]",
       "-ar", "48000", "-ac", "2", OUT]
subprocess.run(cmd, check=True)
print("wrote", OUT)
