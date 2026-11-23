#!/bin/bash
# Final render (resumable): shots/render.sh [SID ...]  -> out/frames/NNNNN.png at 1080x1920.
# Frames already on disk are skipped (no overwrite, placeholders), so it can be restarted at any time.
cd "$(dirname "$0")/.."
mkdir -p out/frames
SAMPLES=${SAMPLES:-48}
for s in ${@:-01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26}; do
  echo "=== render $s $(date +%T)" >> out/render.log
  blender -b shots/blend/$s.blend --python-expr "
import bpy
sc = bpy.context.scene
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1080, 1920, 100
c = sc.cycles; c.samples = $SAMPLES; c.use_adaptive_sampling = True; c.adaptive_threshold = 0.025; c.use_denoising = True
c.denoiser = 'OPENIMAGEDENOISE'; c.denoising_input_passes = 'RGB_ALBEDO_NORMAL'
sc.render.use_persistent_data = True; sc.render.use_overwrite = False; sc.render.use_placeholder = True
sc.render.filepath = '//../../out/frames/#####'
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGB'; sc.render.image_settings.compression = 30
" -a 2>&1 | grep -E "^Saved|Error|rror:" | sed "s/^/[$s] /" >> out/render.log
done
echo "=== DONE $(date +%T)" >> out/render.log
