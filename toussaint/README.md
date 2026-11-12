# Toussaint Louverture — "Case File" documentary (built in code)

9:48 documentary edit, 1920×1080, 30 fps, every frame drawn by code (three.js in headless Chromium) and rendered to H.264.
Narration (Bahasa Indonesia) is the channel's own voiceover; all b-roll is public-domain / CC / Pexels-licensed and credited.

## Layout
| Path | What |
|---|---|
| `BEAT_TABLE.md` | Approved beat table (chapters, hero per line, moments, transitions) |
| `tools/beats_def.py` | The beat sheet as code: every moment anchored to a spoken word (`w("budak", 17)`) |
| `tools/build_beats.py` | Compiles the beat sheet + `data/words.json` → **`data/beats.json`** (the only file the renderer reads) |
| `render/engine.js` | Renderer: paper planes on a procedural desk, perspective camera on a C1 Hermite path, DOF, sub-frame motion blur, grain/dust/flicker/vignette/bloom/CA, glitch + red light-leak |
| `tools/render.js` | Headless Chromium (WebGL/SwiftShader) → JPEG frames → ffmpeg (H.264 High, yuv420p, CRF 18, veryfast) |
| `tools/render_all.py` | Full render in 10 s chunks, 2 workers, resumable; concat + SFX mix + mux |
| `tools/sfx.py` | Code-synthesised SFX (whoosh, glitch zap, stamp thud, typewriter clicks, leak swell) at −18…−24 dB under the VO |
| `tools/transcribe.py` | faster-whisper word timestamps → `data/words.json` |
| `tools/fetch_assets.py`, `fetch_loop.sh`, `fix_assets.py` | Wikimedia Commons (standard thumbnail sizes) + Pexels trims → `assets/broll/`, `credits.csv`; stamp removal on the 1794 map |
| `tools/qa*.py`, `tools/qa.js`, `tools/contact_sheet.py` | Contact sheets, camera-speed graph, 360 px readability, sync and clutter reports |
| `credits.csv` / `credits.txt` | Per-asset credits; `credits.txt` is paste-ready for the YouTube description |

## Rebuild
```bash
npm i                                   # three, fonts (@fontsource), world-atlas, d3-geo, topojson-client
pip install faster-whisper opencv-python-headless matplotlib pillow numpy
python3 tools/transcribe.py audio/vo.mp3 data/words.json      # only if the VO changes
tools/extract_video_frames.sh                                   # b-roll clips -> frames/vid/<id>/%04d.jpg
python3 tools/build_beats.py                                    # -> data/beats.json
python3 tools/render_all.py --workers 2                         # -> out/Toussaint_Louverture_CaseFile_1080p30.mp4
```
Change timing or text by editing `tools/beats_def.py` (or `data/beats.json` directly) and re-running the last two steps;
only chunks whose content changed are re-rendered.

Deterministic: time = frame / fps, seeded PRNG everywhere, all assets awaited before frame 0.
