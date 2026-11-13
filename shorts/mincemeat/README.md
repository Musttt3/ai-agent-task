# Operation Mincemeat — 9:16 documentary short (70.5 s)

Edit built entirely in code: Remotion for picture, motion graphics and transitions; Python/numpy for the
sound design and mix. Source material (clips, stills, voice-over, SFX pack) comes from the `DOCUMENTARY`
folder in Google Drive and is not committed (see `.gitignore`).

## Layout

| Path | What |
| --- | --- |
| `src/timeline.ts` | Edit decision list: 14 shots, cut points from the VO word timings, Ken Burns moves, transition per cut |
| `src/Shots.tsx` | Shot track, transitions (whip, zoom-through, light leak, flash + shake, shutter, power cut, dissolve), film look |
| `src/Graphics.tsx` | Motion graphics: 1943 opener, "MAYAT." slam, dossier cards, stamps, callouts, sub HUD + reticle, titles, memorial |
| `src/MapCard.tsx` | Animated theatre map (Natural Earth 1:50m via `world-atlas`, precomputed by `scripts/build_map.mjs`) |
| `src/Captions.tsx` | Word-timed captions from `src/words.json` (faster-whisper), key words in red |
| `audio/mix.py` | VO + supplied SFX synced to picture + clip ambience + synthesized underscore, ducking, -14 LUFS master |
| `audio/cues.md` | Every sound cue with its time |

## Rebuild

1. Put the Drive material in place: clips/stills into `public/media/`, SFX into `audio/sfx_src/`, VO as `audio/vo.mp3`.
2. `npm install` and `python3 scripts/make_textures.py`
3. `node scripts/build_map.mjs` (only if the map changes)
4. `node --experimental-strip-types scripts/export_timeline.mjs && python3 audio/mix.py`
5. `npx remotion render src/index.ts Mincemeat out/mincemeat.mp4 --props='{"captions":true,"withAudio":true}' --crf=17 --audio-bitrate=320k`

Set `"captions":false` to render without captions. `scripts/stills.sh <dir> <seconds...>` renders review frames.
