#!/bin/bash
# Build every character: supporting variants first (each from a fresh base), the HERO last.
set -e
cd "$(dirname "$0")/.."
B=${BLENDER:-/home/user/tools/blender-4.2.3-linux-x64/blender}
for v in anak_a anak_b anak_c perawat kakek petani guru pengemudi; do
  $B -b --python characters/build_hero.py > /dev/null 2>&1
  $B -b characters/hero.blend --python characters/build_varian.py -- $v 2>&1 | grep -E "SAVED|Error" 
  $B -b characters/$v.blend --python characters/hero_rig.py 2>&1 | grep -E "SAVED|Error"
done
$B -b --python characters/build_hero.py 2>&1 | grep -E "SAVED|Error"
$B -b characters/hero.blend --python characters/hero_rig.py 2>&1 | grep -E "SAVED|Error"
rm -f characters/*.blend1
