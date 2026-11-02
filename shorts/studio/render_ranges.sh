#!/bin/bash
# render_ranges.sh a-b [c-d ...]: (re)render frame ranges into out/frames/r_<a>/, skipping ranges already marked done.
export REMOTION_TMP=/home/user/rtmp TMPDIR=/home/user/rtmp
for rg in "$@"; do
  a=${rg%-*}; d=out/frames/r_$(printf %04d $a)
  [ -f $d.done ] && continue
  rm -rf $d; mkdir -p $d
  npx remotion render src/index.ts LascauxShort $d --sequence --image-format jpeg --jpeg-quality 95 --frames=$rg --concurrency 3 --timeout 300000 --props '{"post":{"audio":false}}' >> out/render_chunks.log 2>&1 && touch $d.done
  echo "chunk $rg done $(date +%T)" >> out/render_chunks.log
done
echo "BATCH $* finished" >> out/render_chunks.log
