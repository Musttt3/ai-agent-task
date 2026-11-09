#!/bin/bash
# Full 2160x3840 render in parallel chunks, then join losslessly.
cd "$(dirname "$0")"
# usage: ./render_all.sh [renderer] [output]   e.g. ./render_all.sh src/render_board.mjs out/video_board_silent.mp4
R=${1:-src/render.mjs}; OUT=${2:-out/video_silent.mp4}; CH=out/chunks_$(basename $R .mjs); mkdir -p $CH
NF=1900; N=8; STEP=$(( (NF + N - 1) / N ))
seq 0 $((N-1)) | xargs -P 4 -I{} bash -c 'i={}; f=$((i*'$STEP')); t=$(( (i+1)*'$STEP' )); [ $t -gt '$NF' ] && t='$NF'; node '$R' --from $f --to $t --out '$CH'/c$i.mp4 > '$CH'/c$i.log 2>&1'
ls $CH/c*.mp4 | sort -V | sed "s|^$CH/|file '|;s|$|'|" > $CH/list.txt
ffmpeg -v error -y -f concat -safe 0 -i $CH/list.txt -c copy $OUT
echo rendered
