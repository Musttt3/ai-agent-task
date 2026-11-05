#!/bin/bash
# encode.sh OUT [MAXFRAME]: JPEG frames (out/frames/*/element-N.jpeg) + public/audio/mix.wav -> H.264 mp4 (30 fps)
OUT=$1; MAX=${2:-99999}
ls out/frames/*/element-*.jpeg | awk -F'element-' -v m=$MAX '{n=$2; sub(/\.jpeg/,"",n); if (n+0 <= m) print n+0, $0}' | sort -n | \
  awk '{print "file '"'"'" ENVIRON["PWD"] "/" $2 "'"'"'\nduration 0.0333333"}' > out/frames.txt
N=$(grep -c "^file" out/frames.txt)
DUR=$(echo "$N / 30" | bc -l)
nice -n 5 ffmpeg -v error -y -f concat -safe 0 -i out/frames.txt -i public/audio/mix.wav -map 0:v:0 -map 1:a:0 -t $DUR \
  -r 30 -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$OUT"
echo "$N frames -> $OUT"
