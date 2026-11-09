#!/bin/bash
# Full 2160x3840 render in parallel chunks, then join losslessly.
cd "$(dirname "$0")"
NF=1900; N=8; STEP=$(( (NF + N - 1) / N ))
seq 0 $((N-1)) | xargs -P 4 -I{} bash -c 'i={}; f=$((i*'$STEP')); t=$(( (i+1)*'$STEP' )); [ $t -gt '$NF' ] && t='$NF'; node src/render.mjs --from $f --to $t --out out/chunks/c$i.mp4 > out/chunks/c$i.log 2>&1'
ls out/chunks/c*.mp4 | sort -V | sed "s|out/chunks/|file '|;s|$|'|" > out/chunks/list.txt
ffmpeg -v error -y -f concat -safe 0 -i out/chunks/list.txt -c copy out/video_silent.mp4
echo rendered
