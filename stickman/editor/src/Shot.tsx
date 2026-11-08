import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Cue, InTransition } from "./cues";

type Props = {
  n: number;
  file: string;
  dur: number;
  cue: Cue;
  prevFile: string | null;
  nextIn: InTransition | null;
  grade: string;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Camera path for a shot: returns transform at progress p (0..1)
const camera = (n: number, dur: number, frame: number, kind: Cue["camera"]) => {
  const p = interpolate(frame, [0, dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  if (kind === "still") {
    return { s: 1.06 + 0.02 * p, x: 0, y: 0, origin: "50% 50%" };
  }
  if (kind === "punch" || dur <= 40) {
    const k = interpolate(frame, [0, 7], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    return { s: 1.02 + 0.1 * k + 0.03 * p, x: 0, y: 0, origin: "50% 45%" };
  }
  if (kind === "slowpush") {
    return { s: 1.04 + 0.16 * p, x: 0, y: 0, origin: "50% 45%" };
  }
  switch (n % 6) {
    case 0:
      return { s: 1.05 + 0.11 * p, x: 0, y: 0, origin: "50% 50%" };
    case 1:
      return { s: 1.16 - 0.1 * p, x: 0, y: 0, origin: "50% 50%" };
    case 2:
      return { s: 1.14, x: -4 + 8 * p, y: 0, origin: "50% 50%" };
    case 3:
      return { s: 1.14, x: 4 - 8 * p, y: 0, origin: "50% 50%" };
    case 4:
      return { s: 1.05 + 0.12 * p, x: 0, y: 0, origin: "38% 40%" };
    default:
      return { s: 1.13, x: 0, y: 3 - 6 * p, origin: "50% 50%" };
  }
};

const Frame: React.FC<{ src: string; style?: React.CSSProperties; grade: string }> = ({ src, style, grade }) => (
  <Img
    src={staticFile(`img/${src}`)}
    style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", filter: grade, ...style }}
  />
);

export const Shot: React.FC<Props> = ({ n, file, dur, cue, prevFile, nextIn, grade }) => {
  const frame = useCurrentFrame();
  const cam = camera(n, dur, frame, cue.camera);

  // shake on impact
  let sx = 0;
  let sy = 0;
  let rot = 0;
  if (cue.shake) {
    const a = interpolate(frame, [0, 16], [22, 0], clamp);
    sx = (random(`sx${n}-${frame}`) - 0.5) * a;
    sy = (random(`sy${n}-${frame}`) - 0.5) * a;
    rot = (random(`r${n}-${frame}`) - 0.5) * a * 0.04;
  }

  // in transitions
  let inX = 0;
  let blur = 0;
  let opacity = 1;
  if (cue.in === "whip") {
    const k = interpolate(frame, [0, 8], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
    inX = 35 * k;
    blur = 28 * k;
  }
  if (cue.in === "xfade") opacity = interpolate(frame, [0, 14], [0, 1], clamp);
  // out transitions (driven by the next shot)
  if (nextIn === "whip") {
    const k = interpolate(frame, [dur - 7, dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
    inX -= 35 * k;
    blur += 28 * k;
  }

  const transform = `translate(${cam.x + inX + (sx / 19.2)}%, ${cam.y + sy / 10.8}%) scale(${cam.s}) rotate(${rot}deg)`;

  // glitch slices
  const glitchOn = cue.in === "glitch" && frame < 9;
  const slices = glitchOn
    ? new Array(6).fill(0).map((_, i) => {
        const top = random(`gt${n}-${frame}-${i}`) * 90;
        const h = 3 + random(`gh${n}-${frame}-${i}`) * 9;
        const dx = (random(`gx${n}-${frame}-${i}`) - 0.5) * 9;
        return { top, h, dx };
      })
    : [];

  // dip to black
  let black = 0;
  if (cue.in === "dip") black = interpolate(frame, [0, 10], [1, 0], clamp);
  if (nextIn === "dip") black = Math.max(black, interpolate(frame, [dur - 8, dur], [0, 1], clamp));

  const flash = cue.in === "flash" ? interpolate(frame, [0, 9], [0.95, 0], clamp) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      {cue.in === "xfade" && prevFile && frame < 15 ? (
        <AbsoluteFill style={{ transform: "scale(1.12)" }}>
          <Frame src={prevFile} grade={grade} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill
        style={{
          transform,
          transformOrigin: cam.origin,
          filter: blur > 0.5 ? `blur(${blur}px)` : undefined,
          opacity,
        }}
      >
        <Frame src={file} grade={grade} />
        {glitchOn ? (
          <>
            <Frame
              src={file}
              grade={grade}
              style={{ mixBlendMode: "screen", opacity: 0.55, transform: "translateX(-1.2%)", filter: `${grade} sepia(1) saturate(6) hue-rotate(-50deg)` }}
            />
            <Frame
              src={file}
              grade={grade}
              style={{ mixBlendMode: "screen", opacity: 0.55, transform: "translateX(1.2%)", filter: `${grade} sepia(1) saturate(6) hue-rotate(150deg)` }}
            />
            {slices.map((s, i) => (
              <Frame
                key={i}
                src={file}
                grade={grade}
                style={{ clipPath: `inset(${s.top}% 0 ${100 - s.top - s.h}% 0)`, transform: `translateX(${s.dx}%)` }}
              />
            ))}
          </>
        ) : null}
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ backgroundColor: "white", opacity: flash }} /> : null}
      {black > 0 ? <AbsoluteFill style={{ backgroundColor: "black", opacity: black }} /> : null}
    </AbsoluteFill>
  );
};
