#!/bin/bash
# Resumable render of the Rempah short: JPEG frames in out/rempah/frames/<chunk>/ (a chunk is done when its .done
# marker exists), then encode with public/rempah/mix.wav -> out/rempah/<name>.mp4.  Usage: ./render_rempah.sh [name]
export REMOTION_TMP=/home/user/rtmp TMPDIR=/home/user/rtmp
mkdir -p $REMOTION_TMP out/rempah/frames
NAME=${1:-rempah}
TOTAL=$(node -e "const w=require('./src/videos/rempah/words.json'); console.log(Math.round((w[w.length-1].e+1.7)*30))")
STEP=150
for ((a=0; a<TOTAL; a+=STEP)); do
  b=$((a+STEP-1)); ((b>=TOTAL)) && b=$((TOTAL-1))
  d=out/rempah/frames/$(printf %04d $a)
  [ -f $d.done ] && continue
  rm -rf $d; mkdir -p $d
  npx remotion render src/index.ts Rempah $d --sequence --image-format jpeg --jpeg-quality 94 --frames=$a-$b --concurrency 4 --timeout 300000 --props '{"audio":false}' >> out/rempah/render.log 2>&1 && touch $d.done
  echo "chunk $a-$b done $(date +%T)" >> out/rempah/render.log
done
ls out/rempah/frames/*/element-*.jpeg | awk -F'element-' '{n=$2; sub(/\.jpeg/,"",n); print n+0, $0}' | sort -n | \
  awk '{print "file '"'"'" ENVIRON["PWD"] "/" $2 "'"'"'\nduration 0.0333333"}' > out/rempah/frames.txt
N=$(grep -c "^file" out/rempah/frames.txt)
ffmpeg -v error -y -f concat -safe 0 -i out/rempah/frames.txt -i public/rempah/mix.wav -map 0:v:0 -map 1:a:0 -t $(echo "$N / 30" | bc -l) \
  -r 30 -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart out/rempah/$NAME.mp4
echo "ENCODED $N frames -> out/rempah/$NAME.mp4" >> out/rempah/render.log
