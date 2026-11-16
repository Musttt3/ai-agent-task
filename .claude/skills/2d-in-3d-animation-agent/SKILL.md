---
name: 2d-in-3d-animation-agent
description: Ready-to-run Remotion + three.js framework for vertical 9:16 "2D-in-3D comic" shorts (flat bean-head cartoon cards in a procedural, hand-painted 3D set), with a complete demo project (an Indonesian stock-market explainer), a clean template, procedural DSP audio, word-synced caption overlays (transparent WebM / green screen / burned-in) and a 3-phase production flow (hero stills -> beat previews -> full render). Use when the user names this skill / "2d in 3d animation agent", wants a comic explainer short WITH captions or comic badges, wants to start from the demo/template project instead of the cartoon-3d-short templates, or wants caption overlays for such a video.
---

# 2D-in-3D animation agent (framework)

Installed from github.com/ancisaltylayty/2d-in-3d-animation-agent (MIT). It is a full Remotion project, already
`npm install`ed in this folder, plus the same style skill as `cartoon-3d-short` (`skill/SKILL.md` is that skill's
text; `skill/references` + `skill/templates` are identical to `.claude/skills/cartoon-3d-short/`). Read:
- `GUIDELINES.md` (Indonesian): the 4 golden rules (physical grounding, motivated lighting, characters that touch
  their set, a moving camera on every beat), modular architecture, stop-for-approval checkpoints, caption/badge
  safe margins, audio standards.
- `README_framework.md`: architecture and the 3 phases.
- `skill/SKILL.md`: pipeline, look values, look targets, gotchas, readability traps (the proven bridge/viking/plague
  workflow; reuse it).

## Layout
- `src/videos/demo/`: finished example (`DemoShort`, `DemoShortWithCaptions`, `DemoCaptionOverlay`,
  `DemoCaptionGreenScreen`; voice `public/demo_vo.mp3`). `build.ts` sets, `cast.ts`/`toon.ts` characters, `story.ts`
  shots + camera + kicks, `lights.ts`, `world.ts`, `Bridge.tsx` (Remotion <-> three + post), caption overlay +
  `caption_chunks.json`.
- `src/videos/template/`: clean starting point for a new video (copy to `src/videos/<name>/`, register in `src/Root.tsx`).
- `scripts/`: `gen-chunks.py` (SRT/word JSON -> 1-2 word caption chunks), `gen-audio.py` (procedural SFX/mix, -15 LUFS),
  `render-stills.mjs` (phase 1), `render-previews.mjs` (phase 2), `render-video.mjs` (phase 3),
  `render-captions.mjs` (transparent WebM, green screen, burned-in final).
- `voice/`: sample voice + SRT + word JSON.

## Running here (cloud container, Linux)
- Scripts were patched to work on Linux: Chrome defaults to the pre-installed headless shell
  (`/opt/pw-browsers/chromium_headless_shell-1243/...`, override with `CHROME_PATH`), GL `swangle`, temp dir
  `REMOTION_TMP` (default `/home/user/rtmp`; the original defaulted to Windows `D:/`).
- One still: `npx remotion still src/index.ts DemoShort out/x.jpg --frame=120 --scale=0.5 --browser-executable=<chrome> --gl=swangle`
  (verified: renders). `npx tsc --noEmit` is clean (the template's broken `./SahamCaptionOverlay` import was fixed to
  `./TemplateCaptionOverlay`).
- Software WebGL: ~10 s/frame at 1080x1920, ~15 s at 2K. Render long videos in resumable chunks (see
  `shorts/studio/prender_chunks.sh` in this repo) and remember background commands stop after 2 h.

## User rules (override the framework where they differ)
- **Final export is always 2K: 1440x2560** (`--scale 1.3333` on the 1080x1920 composition). Never deliver 1080x1920.
- The user writes Indonesian: reply in Indonesian.
- Captions (spoken words): only when the user asks for them in that video; default = no captions.
- **In-scene signs, boards and comic badges with text: always use them** (user, 2026-11-17), like the demo, inside the 9:16
  safe area (GUIDELINES.md 4C). This overrides the older "no labels" rule.
- **Look (user, 2026-11-17): start every new video from `src/videos/template/` (demo as reference), not from an older short.**
  Keep 3x supersampled cards with distance LOD, `cardShade` lighting, contact + sun-direction cast-shadow blobs, `lidAt`
  blinks, `hopY` reaction hops, `twoTone` world shading, `lights.ts` presets, motivated light sources + rim light, detailed
  `build.ts` sets with a dedicated set per mood.
- Story, characters and voice are our own; the style references (`skill/references/frames`, `sheets`) are private study
  material: never upload, publish, send or commit them (they are gitignored).
- GUIDELINES.md section 0 ("ARGON vs Flash" model choice) belongs to another tool and does not apply here; keep its
  intent (do the 3D/camera work carefully, check stills and previews before the full render).
- Opus verifies stills before the final render; run the frame QA (`shorts/studio/short_qa.py`) on the final mp4.
- **Camera (user, 2026-11-17): follow GUIDELINES.md section 4A fully.** Every 4-6 s beat gets 2-3 sub-angles (medium -> macro
  insert on a prop -> Dutch-tilt push-in), plus orbits, crane moves and foreground parallax; kicks on punch words. The Constantinople
  short (`src/videos/byzantium/` in shorts/studio) still used one move per shot: do not copy its camera code as is.
- Before the full render, show 1-3 s motion previews of the key beats (phase 2) and wait for the user's approval.
- Master true peak at or below -1.5 dBTP (the mix scripts in shorts/studio/audio use -1.2: change `ceil = dbg(-1.5)`).
