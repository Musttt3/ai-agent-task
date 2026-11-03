# Breathe — 3D motion piece from one triptych photo

Vertical 1080x1920, 30 fps, 25.8 s (the full length of the supplied track `rizkii_mp3.mp3`).
Final file: `breathe_motion.mp4`.

## How it is built

1. **Music analysis** (`prep/analyze.py`, `prep/spec.py`): tempo, kicks, hats and per-frame loudness →
   `shorts/studio/src/videos/waterfall/audio.json`. Sections found in the track:
   intro groove 0–4.5 s · break/riser 4.5–5.87 s · drop at 5.87 s · four-bar phrases at 11.15, 16.43, 21.71 s.
2. **Photo prep** (all in a Python venv: rembg, simple-lama-inpainting, transformers):
   - `seg.py` — person mask (ISNet ∩ dilated U2Net-human, largest component).
   - `inpaint.py` — LaMa removes the person from each of the three panels separately (seams at x = 496 / 1042).
   - `depth.py` — Depth Anything V2 Small depth map per clean panel.
   - `export_assets.py` — panels, blurred depth, RGBA cut-out (eroded, decontaminated, alpha-bled edges), a
     distance-transform "bulge" map for slight volume, into `shorts/studio/public/waterfall/`.
3. **Scene** (`shorts/studio/src/videos/waterfall/`, Remotion + three.js):
   - `timeline.ts` — every frame is a pure function of time; all cues come from the music analysis.
   - `scene.ts` — three depth-displaced panels hinged like altar doors, the cut-out on still water with mirrored
     rippling reflections, god rays, mist particles, a droplet burst, canvas-drawn type.
   - `materials.ts` — panel / person / particle / ray / sky / water shaders.
   - `post.ts` — whip blur + chromatic aberration, bloom, grade (split tone, vignette, grain, flash, fade).

## Shot list (music-synced)

| time (s) | shot |
|---|---|
| 0.00–4.50 | Panels fly in on the first three kicks; LOST / IN / NATURE slam in on the next three. Ripples on every kick. |
| 4.50–5.87 | Break: words scatter, the side panels swing shut, light leaks through the slit, particles implode. |
| 5.87 | Drop: flash, doors burst open, the person appears with a droplet burst and a shockwave ripple. |
| 5.87–11.15 | Low-angle orbit around the person; BREATHE builds letter by letter behind him on the hats. |
| 11.15–13.79 | Whip pan into the jungle panel; crane up through it with real depth parallax. |
| 13.79–16.43 | Whip into the waterfall panel; crane down the falls to the stream. |
| 16.43–21.71 | Push-through to the centre: sandals → face looking up → pull back with a light swell. |
| 21.71–25.78 | Pull back; the triptych folds flat into the original photo; end card BREATHE / LOST IN NATURE; fade. |

## Render

```bash
cd shorts/studio && npm ci
./render_wf.sh            # resumable, chunked JPEG frames -> out/wf_frames/
./encode_wf.sh ../waterfall/breathe_motion.mp4
```

Stills for checking a frame: `COMP=Waterfall node stills.mjs out/wf/x_ 180,400 0.5`.
