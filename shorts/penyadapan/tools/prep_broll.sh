#!/bin/bash
# prep_broll.sh SRC_DIR OUT_DIR
# Cuts the archive.org (Prelinger, public domain) B-roll into short clips:
#   <name>.mp4    1080x1080 graded square foreground (lanczos upscale of a 480x480 crop)
#   <name>_bg.mp4 360x640 heavily blurred, darkened background plate (scaled up in the comp)
set -e
SRC=$1; OUT=$2
clip() { # name film in dur cropx speed grade
  local name=$1 film=$2 in=$3 dur=$4 cx=$5 sp=$6 grade=$7
  ffmpeg -v error -y -ss $in -t $dur -i "$SRC/$film.mp4" -an -vf \
    "setpts=PTS/$sp,fps=30,crop=480:480:$cx:0,scale=1080:1080:flags=lanczos,unsharp=5:5:0.55:5:5:0,$grade,format=yuv420p" \
    -c:v libx264 -preset slow -crf 17 -movflags +faststart "$OUT/$name.mp4"
  ffmpeg -v error -y -ss $in -t $dur -i "$SRC/$film.mp4" -an -vf \
    "setpts=PTS/$sp,fps=30,crop=270:480:(iw-270)/2:0,scale=360:640,gblur=sigma=14,eq=brightness=-0.10:saturation=0.6,$grade,format=yuv420p" \
    -c:v libx264 -preset slow -crf 24 -movflags +faststart "$OUT/${name}_bg.mp4"
  echo "$name ok"
}
BW="eq=contrast=1.14:brightness=-0.015:gamma=0.97,colorbalance=bs=0.07:bm=0.025:bh=-0.015"
COL="eq=contrast=1.08:saturation=0.78:gamma=0.98,colorbalance=bs=0.05:bh=-0.02"
clip dial    Telephon1946  25.35 2.55 120 1.0  "$BW"
clip listen  Nationat1951 248.10 2.90 120 1.0  "$BW"
clip control OnGuard1956  290.50 2.80  60 1.0  "$COL"
clip street  Nationat1951  20.60 2.60  80 1.0  "$BW"
clip switch  OnGuard1956  323.86 2.02  80 0.85 "$COL"
clip couple  Nationat1951 206.30 2.70  80 1.0  "$BW"
clip radar   OnGuard1956  317.70 3.40  80 1.0  "$COL"
