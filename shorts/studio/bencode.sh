#!/bin/bash
# pencode.sh OUT: 2K JPEG frames (out/byz/frames/*/element-N.jpeg) + out/byz/final/mix.wav -> H.264 mp4 (30 fps)
OUT=$1
ls out/byz/frames/*/element-*.jpeg | awk -F'element-' '{n=$2; sub(/\.jpeg/,"",n); print n+0, $0}' | sort -n | \
  awk '{print "file '"'"'" ENVIRON["PWD"] "/" $2 "'"'"'\nduration 0.0333333"}' > out/byz/frames.txt
N=$(grep -c "^file" out/byz/frames.txt)
DUR=$(echo "$N / 30" | bc -l)
nice -n 5 ffmpeg -v error -y -f concat -safe 0 -i out/byz/frames.txt -i out/byz/final/mix.wav -map 0:v:0 -map 1:a:0 -t $DUR \
  -r 30 -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$OUT"
echo "$N frames -> $OUT"
