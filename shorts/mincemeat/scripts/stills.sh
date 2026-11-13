#!/usr/bin/env bash
# Usage: scripts/stills.sh <outdir> <t1> <t2> ...  Renders frames (half size) and a contact sheet <outdir>/sheet.jpg
set -e
cd "$(dirname "$0")/.."
out=$1; shift
mkdir -p "$out"
for s in "$@"; do
  fr=$(python3 -c "print(round($s*30))")
  npx remotion still src/index.ts Mincemeat "$out/t_${s}.jpg" --frame=$fr --scale=0.5 --log=error >/dev/null
done
python3 - "$out" "$@" <<'PY'
import sys
from PIL import Image, ImageDraw
out=sys.argv[1]; ts=sys.argv[2:]
ims=[Image.open(f'{out}/t_{t}.jpg') for t in ts]
o=Image.new('RGB',(550*len(ims),990),'white'); d=ImageDraw.Draw(o)
for i,(t,im) in enumerate(zip(ts,ims)): o.paste(im,(i*550,30)); d.text((i*550+5,5),t+'s',fill='black')
o.save(f'{out}/sheet.jpg')
PY
