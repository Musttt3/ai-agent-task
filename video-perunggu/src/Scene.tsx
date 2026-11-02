import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { clamp } from "./theme";
import { MapLabel } from "./overlays";
import type { Overlay, SceneData } from "./types";

const ease = Easing.bezier(0.33, 0, 0.2, 1);

/** Ken Burns camera move across the whole life of the scene. */
const camera = (motion: string, t: number, f: number) => {
  switch (motion) {
    case "in":
      return { s: 1.0 + 0.1 * t, x: 0, y: 0, r: 0 };
    case "out":
      return { s: 1.1 - 0.1 * t, x: 0, y: 0, r: 0 };
    case "left":
      return { s: 1.1, x: 3 - 6 * t, y: 0, r: 0 };
    case "right":
      return { s: 1.1, x: -3 + 6 * t, y: 0, r: 0 };
    case "up":
      return { s: 1.1, x: 0, y: 2.5 - 5 * t, r: 0 };
    case "pushSlow":
      return { s: 1.0 + 0.14 * t, x: 0, y: -1.5 * t, r: 0 };
    case "punch": {
      const k = interpolate(f, [0, 10], [1.28, 1.06], { ...clamp, easing: Easing.out(Easing.back(2)) });
      return { s: k + 0.05 * t, x: 0, y: 0, r: 0 };
    }
    case "spin":
      return { s: 1.38 + 0.12 * t, x: 0, y: 0, r: -12 * t };
    default:
      return { s: 1.05, x: 0, y: 0, r: 0 };
  }
};

export const Scene: React.FC<{
  scene: SceneData;
  inLen: number;
  outLen: number;
  outTrans: string;
  labels: Overlay[];
  sceneFrom: number;
}> = ({ scene, inLen, outLen, outTrans, labels, sceneFrom }) => {
  const f = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const t = interpolate(f, [0, durationInFrames], [0, 1], clamp);
  const cam = camera(scene.motion, t, f);

  // ---- shake ----
  let sx = 0;
  let sy = 0;
  for (const s of scene.shake) {
    const a = Math.round(s.at * fps) + inLen / 2;
    const d = Math.round(s.dur * fps);
    if (f >= a && f < a + d) {
      const env = 1 - (f - a) / d;
      sx += (random(`sx${scene.i}-${f}`) - 0.5) * 2 * s.amp * env;
      sy += (random(`sy${scene.i}-${f}`) - 0.5) * 2 * s.amp * env;
    }
  }

  // ---- entrance ----
  const p = inLen > 0 ? interpolate(f, [0, inLen], [0, 1], { ...clamp, easing: ease }) : 1;
  const tr = scene.trans;
  let wrap: React.CSSProperties = {};
  let flash = 0;
  let dipBlack = 0;
  let imgOpacity = 1;
  if (inLen > 0 && p < 1) {
    if (tr === "fade" || tr === "slowfade" || tr === "film") wrap = { opacity: p };
    else if (tr === "wipe") wrap = { clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` };
    else if (tr === "whip")
      wrap = { translate: `${(1 - p) * 100}% 0`, filter: p < 0.95 ? `blur(${(1 - p) * 14}px)` : undefined };
    else if (tr === "zoom") wrap = { opacity: p, scale: 1.25 - 0.25 * p };
    else if (tr === "warp")
      wrap = {
        opacity: p,
        scale: 2.2 - 1.2 * p,
        rotate: `${(1 - p) * 25}deg`,
        filter: `blur(${(1 - p) * 16}px) brightness(${1 + (1 - p) * 1.2})`,
      };
    else if (tr === "flash") {
      wrap = { opacity: interpolate(p, [0.35, 0.55], [0, 1], clamp) };
      flash = 1 - Math.abs(p * 2 - 1);
    } else if (tr === "dip") {
      dipBlack = Math.min(1, p * 2);
      imgOpacity = interpolate(p, [0.5, 1], [0, 1], clamp);
    }
  }

  // ---- exit (only for transitions that move the outgoing shot) ----
  const exitStart = durationInFrames - outLen;
  if (outLen > 0 && f > exitStart) {
    const q = interpolate(f, [exitStart, durationInFrames], [0, 1], { ...clamp, easing: ease });
    if (outTrans === "whip") {
      wrap = { ...wrap, translate: `${-q * 35}% 0`, filter: `blur(${q * 10}px)` };
    } else if (outTrans === "zoom") {
      wrap = { ...wrap, scale: 1 + 0.2 * q };
    }
  }

  const filter = scene.sepia ? "sepia(0.55) contrast(1.05)" : undefined;

  return (
    <AbsoluteFill style={{ backgroundColor: dipBlack > 0 ? `rgba(0,0,0,${dipBlack})` : undefined }}>
      <AbsoluteFill style={{ ...wrap, overflow: "hidden" }}>
        <AbsoluteFill
          style={{
            opacity: imgOpacity,
            scale: cam.s,
            translate: `${cam.x + (sx / 19.2)}% ${cam.y + (sy / 10.8)}%`,
            rotate: `${cam.r}deg`,
            filter,
          }}
        >
          <Img
            src={staticFile(scene.img)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {labels.map((l, k) => (
            <MapLabel key={k} o={l} localFrom={Math.round(l.start * fps) - sceneFrom} />
          ))}
        </AbsoluteFill>
        {scene.night ? (
          <AbsoluteFill
            style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(4,10,30,0.55) 100%)" }}
          />
        ) : null}
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ backgroundColor: "white", opacity: flash }} /> : null}
    </AbsoluteFill>
  );
};
