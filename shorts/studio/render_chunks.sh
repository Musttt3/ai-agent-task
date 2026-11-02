#!/bin/bash
# Resumable render: frames go to out/frames/<chunk>/ as JPEGs; a chunk is done when its .done marker exists.
export REMOTION_TMP=/home/user/rtmp TMPDIR=/home/user/rtmp
TOTAL=2291; STEP=150; FROM=${1:-0}; UPTO=${2:-$TOTAL}
for ((a=FROM; a<UPTO && a<TOTAL; a+=STEP)); do
  b=$((a+STEP-1)); ((b>=TOTAL)) && b=$((TOTAL-1))
  d=out/frames/$(printf %04d $a)
  [ -f $d.done ] && continue
  mkdir -p $d
  npx remotion render src/index.ts LascauxShort $d --sequence --image-format jpeg --jpeg-quality 95 --frames=$a-$b --concurrency 3 --timeout 300000 --props '{"post":{"audio":false}}' >> out/render_chunks.log 2>&1 && touch $d.done
  echo "chunk $a-$b done $(date +%T)" >> out/render_chunks.log
done
echo ALLDONE >> out/render_chunks.log
