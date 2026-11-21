#!/bin/bash
# preview.sh NAME FROM TO : half-size motion preview with the narration for that span
export TMPDIR=/home/user/rtmp
N=$1; A=$2; B=$3
npx remotion render src/index.ts IceCream out/prev/$N.v.mp4 --codec h264 --frames=$A-$B --scale 0.5 --concurrency 3 --timeout 300000 --props '{"post":{"audio":false}}' --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell --gl=swangle > out/prev/$N.log 2>&1
S=$(echo "$A / 30" | bc -l); D=$(echo "($B - $A + 1) / 30" | bc -l)
ffmpeg -v error -y -i out/prev/$N.v.mp4 -ss $S -t $D -i ../voice/voice.mp3 -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 160k -shortest out/prev/$N.mp4 && echo "$N done"
