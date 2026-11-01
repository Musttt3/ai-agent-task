# MUSTTT: 3D motion graphic (30 s, 1:1)

**Final video:** [`output/musttt-motion-3d.mp4`](output/musttt-motion-3d.mp4). 1080×1080, 30 fps, 30 s, H.264 + AAC.

This video uses two frameworks:

- **HyperFrames** (`musttt-hyperframes/`): the 2D kinetic-type scenes, written in HTML + GSAP.
- **Remotion + Three.js** (`musttt-remotion/`): the 3D scenes, plus the final edit and sound design.

## Storyboard

| Time | Scene | Built with | What happens |
| --- | --- | --- | --- |
| 0–6 s | Genesis | Remotion · Three.js | A 3D flower (the motif from the hoodie) grows, the extruded 3D name **MUSTTT** flies in from depth, and the camera dives into the crimson core. |
| 6–14 s | Manifesto | HyperFrames | THINK / WRITE / BUILD / SHARE, one word per beat, each with a pose cutout popping out of a card (berpikir, menulis, membangun, berbagi). |
| 14–21 s | Orbit | Remotion · Three.js | A ring of 8 pose cards spins in 3D: "SATU NAMA. SERIBU EKSPRESI." The camera then dives into the cards. |
| 21–26 s | Hero | HyperFrames | Full-body hero with the name **MUSTTT**, the roles "creator · thinker · builder", and @musttt. |
| 26–30 s | Mark | Remotion · Three.js | 3D logo **MUSTTT** with a light sweeping across it, plus @musttt. |

Palette (taken from the hoodie): black `#0A0A0B`, warm white `#F4F1EC`, crimson `#C8102E`.
Fonts: Archivo Black, League Gothic, Space Mono (all SIL OFL).

## Re-rendering

Background removal on the photos used `npx hyperframes remove-background` (a local model). The cutouts are in
`musttt-hyperframes/assets/poses/` and `musttt-remotion/public/poses/`. The original photos are in `source-photos/`.

1. Render the HyperFrames scenes, then copy them into Remotion:

   ```bash
   cd musttt-hyperframes
   npx hyperframes render --quality delivery -o renders/hyperframes-scenes.mp4
   cp renders/hyperframes-scenes.mp4 ../musttt-remotion/public/
   ```

2. Render the final video with Remotion:

   ```bash
   cd musttt-remotion
   npm i
   npx remotion render MusttMotion out/musttt-motion-3d.mp4 --codec=h264 --crf=16
   ```

   Preview or edit it in Remotion Studio with `npx remotion studio`. The `MusttMotion` composition is the full video. The `Genesis`, `Orbit` and `Mark` compositions are the individual 3D scenes.

The 3D scenes use software WebGL (`swangle`, set in `remotion.config.ts`), so they render without a GPU.

## Audio

The sound effects come from the HyperFrames bundled library (Pixabay Content License, free for commercial use). There is no background music yet. To add some, drop an `.mp3` into `musttt-remotion/public/` and add an `<Audio>` in `src/MusttMotion.tsx`.
