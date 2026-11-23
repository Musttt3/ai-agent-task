#!/bin/bash
# Build every set with QA previews (review/_set_<name>_<i>.png)
cd "$(dirname "$0")/.."
for s in ${@:-venesia gua dapur romawi london nusantara ruang_makan}; do
  timeout 1500 blender -b --python sets/build_$s.py -- preview 2>&1 | grep -E "SAVED|PREVIEW|Traceback|rror:|line [0-9]+" | sed "s/^/[$s] /"
done
