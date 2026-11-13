#!/bin/bash
# Re-encode the AI footage (assets/*.mp4, 1080x1920 24 fps from Google Flow) to all-intra 30 fps for frame-exact
# seeking in Remotion: studio/public/rempah/*.mp4 (git-ignored, regenerable).
cd "$(dirname "$0")"
for f in manhattan pala cengkih pulau tangan; do
  ffmpeg -v error -y -i assets/$f.mp4 -an -r 30 -c:v libx264 -crf 16 -g 1 -pix_fmt yuv420p ../studio/public/rempah/$f.mp4
done
