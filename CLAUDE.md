# Project notes for Claude

## Video rules (from the user)
- **Every video is exported in 2K.** Vertical shorts: 1440x2560 (Remotion `--scale 1.3333` on a 1080x1920 composition). Never deliver 1080x1920 because rendering is slow; render in resumable chunks and take the time.
- The user writes in Indonesian: reply in Indonesian.

## Camera and workflow rules for every new video (user, 2026-11-17)
Apply the full camera grammar of `.claude/skills/2d-in-3d-animation-agent/GUIDELINES.md`, not the older one-move-per-shot style:
- Split every beat of 4-6 s into 2-3 contrasting sub-angles (e.g. medium shot -> macro insert close-up on a prop -> Dutch-tilt push-in on the reaction). No long single-angle shots.
- Use the whole vocabulary: dolly push-ins, subtle orbits around the character, Dutch tilt, crane moves, strong parallax with foreground props; camera kicks on punch words; a 3-5 frame white flash on hard reality switches. The camera is never static.
- Phase 2 of the skill: after the stills, render 1-3 s motion previews of the key beats and show them to the user for approval before the full 2K render.
- Audio master: -14 to -15 LUFS, true peak at or below -1.5 dBTP.

## Look rules for every new video (user, 2026-11-17)
Build every new video from the `2d-in-3d-animation-agent` template (`.claude/skills/2d-in-3d-animation-agent/src/videos/template/`, demo as reference), NOT from the code of an earlier short (viking/plague/byzantium), and keep its full look:
- Character cards 3x supersampled (1800x3000) near the camera with distance LOD, lit by `cardShade` (two-tone + side gradient toward the sun, no emissive self-glow).
- Contact shadow blob under the feet plus a cast-shadow blob along the sun direction.
- `lidAt` 4-frame blinks with varied timing; `hopY` small hops on reactions.
- World materials with `twoTone` cel shading (`shade.ts`); light presets and palettes in `lights.ts`/`LOOK`; motivated light sources in the set (lamps, windows, screens, fire) and a strong rim light separating characters from the set.
- Detailed procedural sets in `build.ts`, a dedicated set per mood.
- **In-scene signs, boards and comic badges with text are wanted** (like the demo): use them in every new video, inside the 9:16 safe area (boards <= 1.8 m wide centred at x = 0, badges between x -0.2 and +0.25). This replaces the old "no labels" rule. Spoken-word captions are still only added when the user asks for them in that video.
