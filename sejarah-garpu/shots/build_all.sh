#!/bin/bash
# Build shots with QA stills: shots/build_all.sh 01 02 ...  -> shots/blend/<id>.blend, review/shots/*, shots/build.log
cd "$(dirname "$0")/.."
for s in "$@"; do
  echo "=== $s $(date +%T)" >> shots/build.log
  timeout 2400 blender -b --python shots/s$s.py -- stills > shots/blend/$s.log 2>&1
  grep -E "^HOLD|^CHECK|^[a-z_]+\.body|BERSIH|SAVED shot|STILLS|Traceback|Error:|line [0-9]+" shots/blend/$s.log | grep -v "bke.modifier" >> shots/build.log
done
echo "=== DONE $* $(date +%T)" >> shots/build.log
