#!/bin/bash
# Rebuild shots and write a collision + anatomy/motion report per shot: shots/rebuild_audit.sh 02 03 ...
# -> review/rebuild/<sid>.txt, progress in review/rebuild/progress.log (FAILED when the build did not save)
cd "$(dirname "$0")/.."
mkdir -p review/rebuild
for s in "$@"; do timeout 3000 blender -b --python shots/s$s.py -- stills > shots/blend/$s.log 2>&1
  if ! grep -q "SAVED shot" shots/blend/$s.log; then echo "$s FAILED $(date +%H:%M)" >> review/rebuild/progress.log; continue; fi
  { grep -v "^Fra" shots/blend/$s.log | grep -E "CHECK|BERSIH|frames|Error|Traceback|KNEE|PINCH"
    blender -b shots/blend/$s.blend --python shots/audit.py -- $s 2>&1 | grep "^AUDIT" | grep -v "rotasi.*(1x)"; } > review/rebuild/$s.txt
  echo "$s done $(date +%H:%M)" >> review/rebuild/progress.log; done
