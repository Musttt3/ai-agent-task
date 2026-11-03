# Lyric 3D — kinetic 3D type + 3D icons over the untouched photo

Square 1080x1080, 30 fps, 25.8 s (= the supplied track). Final file: `lyric3d.mp4`.

- **Photo**: `shorts/studio/public/lyric3d/photo.jpg` is byte-identical to the upload and is drawn as a plain image
  layer, full frame, with no crop, grade or motion.
- **Timing** (`prep/align.py`): vocals separated with Demucs, word onsets from faster-whisper on the vocal stem, used
  only for timing. Every word on screen starts on a sung syllable.
- **Text**: the sung "no" / "yeah" runs are shown as hooks; the other lines are original captions written for the
  photo, placed on the vocal rhythm (`shorts/studio/src/videos/lyric3d/lyrics.ts`).
- **Remotion + three.js** (`shorts/studio/src/videos/lyric3d/`): extruded, bevelled Titan One letters per glyph,
  five entry styles (flip, fly, drop, slide, swing) plus stamp / bounce hooks, kick pulses, soft shadows on a shadow
  catcher; original glossy 3D icons (droplet, leaf, note, sparkle, sun, cloud, heart) popping on kicks.
- **HyperFrames** (`hf/player/index.html`): the now-playing card, beat equaliser, progress bar and 2D sparkles,
  rendered as an RGBA PNG sequence and layered on top inside Remotion.

```bash
cd hf/player && npx --yes hyperframes@0.9.8 render --format png-sequence -o ../../../studio/public/lyric3d/hf --fps 30
cd ../../../studio && ./render_ly.sh && ./encode_ly.sh ../lyric3d/lyric3d.mp4
```
