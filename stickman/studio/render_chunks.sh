#!/bin/bash
# Resumable render: video-only chunks in out/chunks/<from>.mp4 (.done marker), then encode.sh adds the narration.
mkdir -p /home/user/rtmp out/chunks
export REMOTION_TMP=/home/user/rtmp TMPDIR=/home/user/rtmp
TOTAL=13980; STEP=1200; CONC=${CONC:-4}
for ((a=0; a<TOTAL; a+=STEP)); do
  b=$((a+STEP-1)); ((b>=TOTAL)) && b=$((TOTAL-1))
  c=out/chunks/$(printf %05d $a)
  [ -f $c.done ] && continue
  npx remotion render src/index.ts Helikopter $c.mp4 --frames=$a-$b --codec h264 --crf 12 --muted \
    --concurrency $CONC --timeout 300000 --props '{"audio":false}' >> out/render.log 2>&1 && touch $c.done
  echo "chunk $a-$b $( [ -f $c.done ] && echo done || echo FAILED ) $(date +%T)" >> out/render.log
done
echo ALLDONE >> out/render.log
