#!/bin/bash
# rerender_wf.sh A B: re-render frames A..B of the Waterfall composition and drop them into their chunk folders.
export REMOTION_TMP=/home/user/rtmp TMPDIR=/home/user/rtmp TEMP=/home/user/rtmp TMP=/home/user/rtmp
A=$1; B=$2; d=out/wf_fix/$A
rm -rf $d && mkdir -p $d
npx remotion render src/index.ts Waterfall $d --sequence --image-format jpeg --jpeg-quality 95 --frames=$A-$B \
  --concurrency 4 --timeout 300000 --props '{"audio":false}' >> out/wf_render.log 2>&1 || { echo "FAILED $A-$B"; exit 1; }
for f in $d/element-*.jpeg; do
  n=$(basename $f .jpeg); n=$((10#${n#element-}))
  cp $f out/wf_frames/$(printf %04d $(( n / 130 * 130 )))/
done
echo "rerendered $A-$B"
