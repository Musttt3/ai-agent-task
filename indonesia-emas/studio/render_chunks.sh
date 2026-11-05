#!/bin/bash
# Resumable render of the episode as JPEG frames: render_chunks.sh FROM UPTO  (chunks of 150 frames, skips done chunks)
cd "$(dirname "$0")"
export REMOTION_TMP=/home/user/rtmp TMPDIR=/home/user/rtmp; mkdir -p /home/user/rtmp
TOTAL=1755; STEP=150; FROM=${1:-0}; UPTO=${2:-$TOTAL}
for ((a=FROM; a<UPTO && a<TOTAL; a+=STEP)); do
  b=$((a+STEP-1)); ((b>=TOTAL)) && b=$((TOTAL-1))
  d=out/frames/$(printf %04d $a)
  [ -f $d.done ] && continue
  rm -rf $d; mkdir -p $d
  npx remotion render src/index.ts IndonesiaEmas $d --sequence --image-format jpeg --jpeg-quality 95 --frames=$a-$b --concurrency 3 --timeout 300000 >> out/render.log 2>&1 && touch $d.done
  echo "chunk $a-$b done $(date +%T)" >> out/render.log
done
echo "BATCH $FROM-$UPTO finished" >> out/render.log
