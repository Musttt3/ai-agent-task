#!/bin/bash
# rebuild shots with stills + collision check, then the anatomy/motion audit -> review/rebuild/<sid>.txt
cd "$(dirname "$0")/.."
mkdir -p review/rebuild
for s in "$@"; do
  timeout 3000 blender -b --python shots/s$s.py -- stills > shots/blend/$s.log 2>&1
  { grep -v "^Fra" shots/blend/$s.log | grep -E "CHECK|BERSIH|frames|Error|Traceback|KNEE|PINCH"
    blender -b shots/blend/$s.blend --python shots/audit.py -- $s 2>&1 | grep "^AUDIT" | grep -v "rotasi.*(1x)"; } > review/rebuild/$s.txt
  echo "$s done $(date +%H:%M)" >> review/rebuild/progress.log
done
