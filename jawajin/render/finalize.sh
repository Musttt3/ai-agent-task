#!/bin/bash
# concat 16 segments + mix.wav -> final mp4
set -e
cd "$(dirname "$0")/.."
ls out/seg/seg*.mp4 | grep -v part | sort > /dev/null
: > out/list.txt
for i in $(seq -w 0 15); do f="out/seg/seg$i.mp4"; [ -f "$f" ] || { echo "missing $f"; exit 1; }; echo "file 'seg/seg$i.mp4'" >> out/list.txt; done
ffmpeg -v error -y -f concat -safe 0 -i out/list.txt -c copy out/video_noaudio.mp4
ffmpeg -v error -y -i out/video_noaudio.mp4 -i work/mix.wav -map 0:v -map 1:a -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest out/Jawajin_final.part.mp4
mv out/Jawajin_final.part.mp4 "out/Benarkah Leluhur Orang Jawa Menikahi Jin - FINAL.mp4"
echo FINAL_DONE
