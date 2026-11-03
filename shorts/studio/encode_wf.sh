#!/bin/bash
# encode_wf.sh OUT: out/wf_frames/*/element-N.jpeg + public/waterfall/music.mp3 -> H.264 mp4 at 30 fps (length = track)
OUT=$1
ls out/wf_frames/*/element-*.jpeg | awk -F'element-' '{n=$2; sub(/\.jpeg/,"",n); print n+0, $0}' | sort -n | \
  awk '{print "file '"'"'" ENVIRON["PWD"] "/" $2 "'"'"'\nduration 0.0333333"}' > out/wf_frames.txt
N=$(grep -c "^file" out/wf_frames.txt)
ffmpeg -v error -y -f concat -safe 0 -i out/wf_frames.txt -i public/waterfall/music.mp3 -map 0:v:0 -map 1:a:0 \
  -r 30 -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
echo "$N frames -> $OUT"
