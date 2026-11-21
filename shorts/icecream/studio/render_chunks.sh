#!/bin/bash
# Resumable 2K (2560x1440) render of IceCream: each chunk of STEP frames becomes out/final/chunks/<start>.mp4
# (H.264 CRF 10, video only); a chunk is done when its .done marker exists, so the script can be re-run after a
# restart and skips finished chunks. Usage: ./render_chunks.sh [FROM] [UPTO] [CONCURRENCY]
cd "$(dirname "$0")"
export REMOTION_TMP=/home/user/rtmp TMPDIR=/home/user/rtmp
TOTAL=$(node -e 'const s=require("./src/videos/icecream/sentences.json");console.log(s[s.length-1].slice(-1)[0][2]+45)')
STEP=150; FROM=${1:-0}; UPTO=${2:-$TOTAL}; CONC=${3:-3}
mkdir -p out/final/chunks
for ((a=FROM; a<UPTO && a<TOTAL; a+=STEP)); do
  b=$((a+STEP-1)); ((b>=TOTAL)) && b=$((TOTAL-1))
  c=out/final/chunks/$(printf %05d $a)
  [ -f $c.done ] && continue
  npx remotion render src/index.ts IceCream $c.mp4 --codec h264 --crf 10 --muted --scale 1.3333 --frames=$a-$b \
    --concurrency $CONC --timeout 300000 --gl=swangle --props '{"post":{"audio":false}}' \
    --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell \
    --log=error >> out/final/render.log 2>&1 && touch $c.done
  echo "chunk $a-$b $( [ -f $c.done ] && echo done || echo FAILED ) $(date +%T)" >> out/final/render.log
done
echo ALLDONE >> out/final/render.log
