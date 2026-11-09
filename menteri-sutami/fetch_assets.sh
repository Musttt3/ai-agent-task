#!/usr/bin/env bash
# Downloads the Mixkit stock clips and sound effects used in the edit (Mixkit License: free to use in a project,
# not to be redistributed as files, so they are not committed) and trims the clips the way the edit uses them.
# Run from this folder: bash fetch_assets.sh
set -euo pipefail
UA="Mozilla/5.0 (X11; Linux x86_64) Chrome/120"
V=studio/public/vid; A=audio/sfx_mixkit; T=$(mktemp -d)
mkdir -p "$V" "$A"
clip() { # id start dur width name
  curl -sfL -A "$UA" -o "$T/$1.mp4" "https://assets.mixkit.co/videos/$1/$1-$6.mp4"
  ffmpeg -v error -y -ss "$2" -i "$T/$1.mp4" -t "$3" -an -vf "fps=30,scale=$4:-2" -c:v libx264 -crf 18 -preset medium -g 15 -pix_fmt yuv420p "$V/$5.mp4"
}
clip 34274 3 2.6 1280 pencil 720
clip 14729 2 2.4 1280 concrete 720
clip 32433 12 2.6 1280 needle 720
clip 2208 3 2.6 1280 puddle 720
clip 49226 2 2.6 1280 monitor 720
clip 48919 5 3.2 1280 candle 720
clip 46354 4 1.6 1280 rice 720
while read -r name id; do
  curl -sfL -A "$UA" -o "$A/$name.mp3" "https://assets.mixkit.co/active_storage/sfx/$id/$id-preview.mp3"
done <<'LIST'
impact_big 788
impact_trailer 2908
glitch_static 1457
glitch_rewind 1093
glitch_cine 1022
paper_slide 1530
paper_quick 2380
wood_hit 2182
whoosh_air 1489
whoosh_cine 1492
whoosh_stutter 787
type_single 1382
type_hit 1365
shutter_vintage 1438
shutter_click 1133
pencil_write 3194
pencil_short 2376
scribble 2369
riser_cine 790
switch_tap 2585
buzzer_fail 2964
rain_light 2393
projector 1441
LIST
rm -rf "$T"
echo "done"
