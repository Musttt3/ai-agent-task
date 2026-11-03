#!/bin/bash
# Resumable chunked render of the Lyric3D composition to JPEG frames in out/ly_frames/<start>/, then encode_ly.sh.
export REMOTION_TMP=/home/user/rtmp TMPDIR=/home/user/rtmp TEMP=/home/user/rtmp TMP=/home/user/rtmp
TOTAL=774; STEP=130; FROM=${1:-0}; UPTO=${2:-$TOTAL}
mkdir -p out/ly_frames
for ((a=FROM; a<UPTO && a<TOTAL; a+=STEP)); do
  b=$((a+STEP-1)); ((b>=TOTAL)) && b=$((TOTAL-1))
  d=out/ly_frames/$(printf %04d $a)
  [ -f $d.done ] && continue
  mkdir -p $d
  npx remotion render src/index.ts Lyric3D $d --sequence --image-format jpeg --jpeg-quality 95 --frames=$a-$b \
    --concurrency 4 --timeout 300000 --props '{"audio":false}' >> out/ly_render.log 2>&1 && touch $d.done
  echo "chunk $a-$b done $(date +%T)" >> out/ly_render.log
done
echo ALLDONE >> out/ly_render.log
