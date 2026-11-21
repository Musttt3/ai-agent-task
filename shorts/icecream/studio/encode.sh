#!/bin/bash
# encode.sh OUT: the 2K chunks (out/final/chunks/*.mp4) + public/icecream_mix.wav -> one H.264 mp4 (30 fps, AAC 192k)
cd "$(dirname "$0")"
OUT=$1
ls out/final/chunks/*.mp4 | sort | awk '{print "file '"'"'" ENVIRON["PWD"] "/" $1 "'"'"'"}' > out/final/chunks.txt
nice -n 5 ffmpeg -v error -y -f concat -safe 0 -i out/final/chunks.txt -i public/icecream_mix.wav -map 0:v:0 -map 1:a:0 \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames -show_entries format=duration -of compact "$OUT"
