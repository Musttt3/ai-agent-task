#!/bin/bash
# Resumable render of the Waterfall composition: JPEG frames in chunks under out/wf_frames/<start>/ (a chunk is done
# when its .done marker exists), then encode_wf.sh muxes them with the original track.
# usage: ./render_wf.sh [FROM] [UPTO]   (frame range, default all)
export REMOTION_TMP=/home/user/rtmp TMPDIR=/home/user/rtmp TEMP=/home/user/rtmp TMP=/home/user/rtmp
TOTAL=774; STEP=130; FROM=${1:-0}; UPTO=${2:-$TOTAL}
mkdir -p out/wf_frames
for ((a=FROM; a<UPTO && a<TOTAL; a+=STEP)); do
  b=$((a+STEP-1)); ((b>=TOTAL)) && b=$((TOTAL-1))
  d=out/wf_frames/$(printf %04d $a)
  [ -f $d.done ] && continue
  mkdir -p $d
  npx remotion render src/index.ts Waterfall $d --sequence --image-format jpeg --jpeg-quality 95 --frames=$a-$b \
    --concurrency 4 --timeout 300000 --props '{"audio":false}' >> out/wf_render.log 2>&1 && touch $d.done
  echo "chunk $a-$b done $(date +%T)" >> out/wf_render.log
done
echo ALLDONE >> out/wf_render.log
