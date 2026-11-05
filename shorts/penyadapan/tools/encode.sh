#!/bin/bash
# encode.sh VIDEO.mp4 MIX.wav OUT.mp4 : mux the Remotion render (muted H.264) with the mastered soundtrack
# -> TikTok-ready H.264 High / yuv420p / 30 fps / AAC 48 kHz 256k, faststart.
set -e
ffmpeg -v error -y -i "$1" -i "$2" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest \
  -metadata title="Dugaan Penyadapan Presiden: Siapa Mengawasi Orang yang Punya Kuasa?" -movflags +faststart "$3"
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate -of compact "$3"
