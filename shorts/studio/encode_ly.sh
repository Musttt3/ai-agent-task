#!/bin/bash
# encode_ly.sh OUT: out/ly_frames/*/element-N.jpeg + the original track -> H.264 mp4, 30 fps, length = track
OUT=$1
ls out/ly_frames/*/element-*.jpeg | awk -F'element-' '{n=$2; sub(/\.jpeg/,"",n); print n+0, $0}' | sort -n | \
  awk '{print "file '"'"'" ENVIRON["PWD"] "/" $2 "'"'"'\nduration 0.0333333"}' > out/ly_frames.txt
N=$(grep -c "^file" out/ly_frames.txt)
ffmpeg -v error -y -f concat -safe 0 -i out/ly_frames.txt -i public/lyric3d/music.mp3 -map 0:v:0 -map 1:a:0 \
  -r 30 -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
echo "$N frames -> $OUT"
