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
