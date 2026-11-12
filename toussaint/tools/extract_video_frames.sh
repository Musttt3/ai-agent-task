#!/usr/bin/env bash
# Pre-extract every b-roll clip to JPEG frames at the project fps (the renderer draws frame k for time t).
set -euo pipefail
cd "$(dirname "$0")/.."
for f in assets/broll/*.mp4; do
  id=$(basename "$f" .mp4); d=frames/vid/$id
  [ -f "$d/0001.jpg" ] && continue
  mkdir -p "$d"
  ffmpeg -v error -i "$f" -vf "fps=30,scale='if(gt(iw,ih),min(1280,iw),-2)':'if(gt(iw,ih),-2,min(1280,ih))'" -q:v 3 "$d/%04d.jpg"
  echo "$id $(ls "$d" | wc -l) frames"
done
