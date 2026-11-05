#!/bin/sh
# Rebuild "Kalau Besok Indonesia Jadi Negara Emas" from source:
# narration timing → score → sound events → mix → picture (1080x1920, 24 fps) → mux (-14 LUFS) → .srt → poster.
# Needs the Lemo-Opuscar library (core tools) with `setup.sh deps voice` and the instrument packs
# karoryfer, salamander, vcsl, vsco2ce; Node 20+, ffmpeg 7+.
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
SIZE=1080x1920
cd "$HERE"
# 1. narration: word timings of the chosen take (re-run only if the take changes), line clips + timeline
[ -f voice/take1.words.json ] || "$PY" -I tools/words.py voice/take1.mp3 voice/script.json voice/take1.words.json --model small
"$PY" -I tools/timeline.py
# 2. score
"$PY" score.py
# 3. sound events from the page, then the mix
cd "$LIB" && node core/render/events.mjs "$HERE" --size $SIZE && cd "$HERE"
"$PY" mix.py
# 4. picture
cd "$LIB" && node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size $SIZE --out "$HERE/out/video.mp4"
# 5. master: two-pass loudnorm to -14 LUFS, light grain
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/indonesia-emas.mp4" 24 2
# 6. subtitles and poster
cd "$HERE"
"$PY" -c "import json; t=json.load(open('timeline.json')); json.dump([{'t0': c['t0'], 't1': c['t1'], 'text': '\n'.join(c['rows'])} for c in t['cards']], open('out/cues.json', 'w'), ensure_ascii=False)"
"$PY" "$LIB/core/render/srt.py" out/cues.json indonesia-emas.srt
cd "$LIB" && node core/render/still.mjs "$HERE" 64.6 --size $SIZE --out "$HERE/out" --prefix poster_ && cp "$HERE/out/poster_64.6.jpg" "$HERE/poster.jpg"
echo "done: $HERE/indonesia-emas.mp4"
