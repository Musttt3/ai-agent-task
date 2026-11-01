import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  Img,
} from "remotion";
import { loadFont } from "@remotion/fonts";

export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const YELLOW = "#FFD400";
export const RED = "#FF2E3F";
export const INK = "#0B0B0F";

export const HEAD = "Anton";
export const ROYAL = "Cinzel";
export const GOLD = "#E8B931";
export const MAROON = "#7A1020";
export const CREAM = "#F5E6C8";
export const BODY = "Montserrat";

loadFont({ family: HEAD, url: staticFile("fonts/anton.woff2"), weight: "400" });
loadFont({ family: BODY, url: staticFile("fonts/mont900.woff2"), weight: "900" });
loadFont({ family: BODY, url: staticFile("fonts/mont800.woff2"), weight: "800" });
loadFont({ family: ROYAL, url: staticFile("fonts/cinzel900.woff2"), weight: "900" });

/** seconds -> frames */
export const sf = (s: number) => Math.round(s * FPS);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const OUT = Easing.bezier(0.16, 1, 0.3, 1);

/** Interpolate on absolute seconds (relative to the parent Sequence). */
export const useT = () => {
  const frame = useCurrentFrame();
  return frame / FPS;
};

export const lerp = (
  t: number,
  input: number[],
  output: number[],
  easing: (n: number) => number = OUT,
) => interpolate(t, input, output, { ...clamp, easing });

/** spring that starts at second `at` (relative to parent) */
export const usePop = (at: number, damping = 11, stiffness = 170) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - sf(at),
    fps,
    config: { damping, stiffness, mass: 0.7 },
  });
};

/** camera shake that decays after each impact time */
export const shakeAt = (t: number, times: number[], amp = 26) => {
  let x = 0;
  let y = 0;
  for (const at of times) {
    const d = t - at;
    if (d >= 0 && d < 0.45) {
      const k = Math.exp(-d * 9) * amp;
      x += Math.sin(d * 95) * k;
      y += Math.cos(d * 77) * k * 0.7;
    }
  }
  return { x, y };
};

/** Image placed with explicit scale + translation (in px) so coords are predictable. */
export const Photo: React.FC<{
  src: string;
  iw: number;
  ih: number;
  scale: number; // multiplier over "cover" scale
  x: number; // translate px (0 = centered)
  y: number;
  filter?: string;
}> = ({ src, iw, ih, scale, x, y, filter }) => {
  const cover = Math.max(W / iw, H / ih) * scale;
  const w = iw * cover;
  const h = ih * cover;
  return (
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute",
        width: w,
        height: h,
        left: (W - w) / 2 + x,
        top: (H - h) / 2 + y,
        filter,
      }}
    />
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.75 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);

export const BottomShade: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)",
    }}
  />
);

export const textStroke = (px = 10, color = "#000") => ({
  WebkitTextStroke: `${px}px ${color}`,
  paintOrder: "stroke fill" as const,
});
