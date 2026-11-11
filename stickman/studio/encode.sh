#!/bin/bash
# encode.sh OUT: joins out/chunks/*.mp4 + public/narasi.mp3 into the final YouTube upload (1080p30, H.264 + AAC).
set -e
OUT=${1:-../out/helikopter_zaman_purba.mp4}
ls out/chunks/*.mp4 | sort | sed "s|^|file '$PWD/|; s|$|'|" > out/chunks.txt
ffmpeg -v error -y -f concat -safe 0 -i out/chunks.txt -i public/narasi.mp3 \
  -map 0:v:0 -map 1:a:0 -af "apad" -shortest \
  -c:v libx264 -preset slow -crf ${CRF:-20} -tune animation -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$OUT"
