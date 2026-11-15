#!/bin/bash
# vpatch.sh A-B [A-B ...]: re-render frame ranges into out/viking/patch/, then copy them over the chunk frames.
export REMOTION_TMP=/home/user/rtmp TMPDIR=/home/user/rtmp
for r in "$@"; do
  d=out/viking/patch/$r; [ -f $d.done ] && continue; mkdir -p $d
  npx remotion render src/index.ts VikingShort $d --sequence --image-format jpeg --jpeg-quality 95 --frames=$r --concurrency 3 --timeout 300000 --props '{"post":{"audio":false}}' >> out/viking/render.log 2>&1 && touch $d.done
  for f in $d/element-*.jpeg; do n=$(basename $f .jpeg); n=${n#element-}; c=$(printf %04d $(( (10#$n/130)*130 ))); cp -f $f out/viking/frames/$c/; done
  echo "patch $r done $(date +%T)" >> out/viking/render.log
done
echo PATCHDONE >> out/viking/render.log
