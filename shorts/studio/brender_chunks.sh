#!/bin/bash
# Resumable 2K (1440x2560) render of ByzantiumShort: frames go to out/byz/frames/<chunk>/ as JPEGs; a chunk is done when its .done marker exists.
export REMOTION_TMP=/home/user/rtmp TMPDIR=/home/user/rtmp
TOTAL=1736; STEP=100; FROM=${1:-0}; UPTO=${2:-$TOTAL}
for ((a=FROM; a<UPTO && a<TOTAL; a+=STEP)); do
  b=$((a+STEP-1)); ((b>=TOTAL)) && b=$((TOTAL-1))
  d=out/byz/frames/$(printf %04d $a)
  [ -f $d.done ] && continue
  mkdir -p $d
  npx remotion render src/index.ts ByzantiumShort $d --sequence --image-format jpeg --jpeg-quality 95 --scale 1.3333 --frames=$a-$b --concurrency 3 --timeout 300000 --props '{"post":{"audio":false}}' >> out/byz/render.log 2>&1 && touch $d.done
  echo "chunk $a-$b done $(date +%T)" >> out/byz/render.log
done
echo ALLDONE >> out/byz/render.log
