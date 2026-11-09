import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/fonts";

export const W = 1080;
export const H = 1920;
export const FPS = 30;

// Fonts are served locally (the render browser cannot reach Google Fonts through the proxy).
export const MONT = "Montserrat";
export const ELITE = "Special Elite";
export const PLAYFAIR = "Playfair Display";
loadFont({ family: MONT, url: staticFile("fonts/Montserrat.woff2"), weight: "100 900" });
loadFont({ family: ELITE, url: staticFile("fonts/SpecialElite.woff2"), weight: "400" });
loadFont({ family: PLAYFAIR, url: staticFile("fonts/PlayfairItalic.woff2"), weight: "700", style: "italic" });

export const AMBER = "#F2B33D";
export const RED = "#D7262E";
export const INK = "#121212";

export const sec = (s: number) => Math.round(s * FPS);
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.5, 0, 0.75, 0);

// ---------- camera on a still image ----------
// Draws an image with "cover" fit, then zooms toward a focal point (fx, fy in image fractions).
// The focal point drifts from `from` to `to` over [0, dur] frames and is kept on screen without exposing edges.
type Cam = { z: number; fx: number; fy: number };
export const KenBurns: React.FC<{
  src: string;
  iw: number;
  ih: number;
  dur: number;
  from: Cam;
  to: Cam;
  filter?: string;
  ease?: (t: number) => number;
  style?: React.CSSProperties;
  blend?: React.CSSProperties["mixBlendMode"];
}> = ({ src, iw, ih, dur, from, to, filter, ease = easeInOut, style, blend }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, dur], [0, 1], { ...clamp, easing: ease });
  const z = from.z + (to.z - from.z) * t;
  const fx = from.fx + (to.fx - from.fx) * t;
  const fy = from.fy + (to.fy - from.fy) * t;
  const cover = Math.max(W / iw, H / ih) * z;
  const dw = iw * cover;
  const dh = ih * cover;
  let x = W / 2 - fx * dw;
  let y = H / 2 - fy * dh;
  x = Math.min(0, Math.max(W - dw, x));
  y = Math.min(0, Math.max(H - dh, y));
  return (
    <AbsoluteFill style={{ overflow: "hidden", ...style }}>
      <Img
        src={staticFile(src)}
        style={{ position: "absolute", left: x, top: y, width: dw, height: dh, filter, mixBlendMode: blend }}
      />
    </AbsoluteFill>
  );
};

// ---------- paper wall like the reference ----------
export const Paper: React.FC<{ tint?: string; style?: React.CSSProperties }> = ({ tint, style }) => (
  <AbsoluteFill style={style}>
    <Img src={staticFile("img/paper.jpg")} style={{ width: W, height: H }} />
    {tint ? <AbsoluteFill style={{ background: tint, mixBlendMode: "multiply" }} /> : null}
  </AbsoluteFill>
);

// ---------- film grain + vignette (global finish) ----------
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.16 }) => {
  const f = useCurrentFrame();
  const i = f % 8;
  const ox = Math.floor(random(`gx${f}`) * 60);
  const oy = Math.floor(random(`gy${f}`) * 60);
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity, pointerEvents: "none" }}>
      <Img
        src={staticFile(`img/grain${i}.jpg`)}
        style={{ position: "absolute", left: -ox, top: -oy, width: W * 1.12, height: H * 1.12 }}
      />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.55 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 75% 62% at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

// ---------- typewriter text (characters appear one by one) ----------
export const Typed: React.FC<{
  text: string;
  start: number;
  cps: number; // characters per second
  style?: React.CSSProperties;
  cursor?: boolean;
}> = ({ text, start, cps, style, cursor = false }) => {
  const f = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor(((f - start) / FPS) * cps)));
  const doneAt = start + Math.ceil((text.length / cps) * FPS);
  const showCursor = cursor && f >= start && f < doneAt + 14 && (f < doneAt || Math.floor(f / 7) % 2 === 0);
  return (
    <div style={style}>
      <span>{text.slice(0, n)}</span>
      <span style={{ display: "inline-block", width: 0, overflow: "visible" }}>
        <span style={{ opacity: showCursor ? 1 : 0, marginLeft: 4, fontWeight: 400 }}>|</span>
      </span>
      <span style={{ opacity: 0 }}>{text.slice(n)}</span>
    </div>
  );
};

// ---------- line that reveals with a soft left-to-right wipe + blur (reference subtitle style) ----------
export const WipeLine: React.FC<{ start: number; dur?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  start,
  dur = 12,
  style,
  children,
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [start, start + dur], [0, 1], { ...clamp, easing: easeOut });
  return (
    <div
      style={{
        ...style,
        WebkitMaskImage: `linear-gradient(90deg, #000 ${p * 120 - 20}%, transparent ${p * 120}%)`,
        maskImage: `linear-gradient(90deg, #000 ${p * 120 - 20}%, transparent ${p * 120}%)`,
        filter: `blur(${(1 - p) * 4}px)`,
      }}
    >
      {children}
    </div>
  );
};

// ---------- photo card dropping onto the wall with a 3D tilt (like the banknote in the reference) ----------
export const PhotoCard: React.FC<{
  src: string;
  start: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rot?: number;
  from?: "top" | "bottom" | "left" | "right";
  border?: number;
  filter?: string;
  label?: string;
  labelStart?: number;
  objectPosition?: string;
  flash?: boolean;
}> = ({ src, start, x, y, w, h, rot = 0, from = "bottom", border = 14, filter, label, labelStart, objectPosition = "50% 50%", flash = true }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [start, start + 14], [0, 1], { ...clamp, easing: easeOut });
  if (f < start) return null;
  const off = 1 - p;
  const dx = from === "left" ? -900 * off : from === "right" ? 900 * off : 0;
  const dy = from === "top" ? -1200 * off : from === "bottom" ? 1300 * off : 0;
  const tiltX = (from === "bottom" ? 38 : from === "top" ? -38 : 0) * off;
  const tiltY = (from === "left" ? -30 : from === "right" ? 30 : 0) * off;
  const settle = Math.sin(Math.min(1, (f - start) / 20) * Math.PI) * 0;
  const fl = flash ? interpolate(f, [start + 12, start + 14, start + 22], [0, 0.85, 0], clamp) : 0;
  const shadow = 18 + 40 * off;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        perspective: 1400,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          translate: `${dx}px ${dy + settle}px`,
          rotate: `${rot * p + (from === "left" ? -12 : 12) * off}deg`,
          transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${1 + 0.25 * off})`,
          position: "relative",
          background: "#f4f1ea",
          padding: border,
          boxSizing: "border-box",
          boxShadow: `0 ${shadow * 0.6}px ${shadow * 1.4}px rgba(0,0,0,0.38), 0 2px 4px rgba(0,0,0,0.25)`,
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
          <Img
            src={staticFile(src)}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition, filter }}
          />
          <AbsoluteFill style={{ background: "white", opacity: fl }} />
        </div>
        {label && f >= (labelStart ?? start + 10) ? (
          <Typed
            text={label}
            start={labelStart ?? start + 10}
            cps={24}
            style={{
              position: "absolute",
              left: -18,
              bottom: -30,
              background: INK,
              color: "#f4f1ea",
              padding: "10px 22px 8px",
              fontFamily: ELITE,
              fontSize: 40,
              letterSpacing: 1,
              whiteSpace: "nowrap",
              boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

// ---------- B-roll video shown as a sharp card over a blurred copy of itself ----------
export const Bg: React.FC<{ color: string }> = ({ color }) => <AbsoluteFill style={{ background: color }} />;

// ---------- glitch transition overlay: RGB-split slices + flash over the cut ----------
export const GlitchBars: React.FC<{ at: number; dur?: number; seed: string }> = ({ at, dur = 8, seed }) => {
  const f = useCurrentFrame();
  const t = f - (at - Math.floor(dur / 2));
  if (t < 0 || t > dur) return null;
  const k = 1 - Math.abs(t - dur / 2) / (dur / 2);
  const bars = Array.from({ length: 9 }, (_, i) => {
    const r = random(`${seed}${i}${Math.floor(t / 2)}`);
    const y = random(`${seed}y${i}${t}`) * H;
    const hgt = 20 + r * 160;
    const dx = (random(`${seed}x${i}${t}`) - 0.5) * 260 * k;
    const col = i % 3 === 0 ? "rgba(255,40,60,0.55)" : i % 3 === 1 ? "rgba(40,220,255,0.5)" : "rgba(255,255,255,0.35)";
    return <div key={i} style={{ position: "absolute", left: dx, top: y, width: W, height: hgt, background: col, mixBlendMode: "screen" }} />;
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {bars}
      <AbsoluteFill style={{ background: "white", opacity: 0.35 * k * k, mixBlendMode: "overlay" }} />
    </AbsoluteFill>
  );
};

// RGB split / jitter wrapper used during a glitch window
export const GlitchWrap: React.FC<{ at: number; dur?: number; seed: string; children: React.ReactNode }> = ({ at, dur = 8, seed, children }) => {
  const f = useCurrentFrame();
  const t = f - (at - Math.floor(dur / 2));
  const on = t >= 0 && t <= dur;
  const k = on ? 1 - Math.abs(t - dur / 2) / (dur / 2) : 0;
  const jx = on ? (random(`${seed}jx${t}`) - 0.5) * 50 * k : 0;
  const s = 14 * k;
  if (!on) return <AbsoluteFill>{children}</AbsoluteFill>;
  return (
    <AbsoluteFill style={{ translate: `${jx}px 0px` }}>
      <AbsoluteFill>{children}</AbsoluteFill>
      <AbsoluteFill style={{ mixBlendMode: "screen", opacity: 0.6, translate: `${s}px 0px`, filter: "sepia(1) saturate(8) hue-rotate(-50deg)" }}>
        {children}
      </AbsoluteFill>
      <AbsoluteFill style={{ mixBlendMode: "screen", opacity: 0.5, translate: `${-s}px 0px`, filter: "sepia(1) saturate(6) hue-rotate(150deg)" }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// white/amber flash used on hard cuts
export const Flash: React.FC<{ at: number; color?: string; peak?: number; len?: number }> = ({ at, color = "white", peak = 0.9, len = 9 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 1, at, at + len], [0, peak, 0], clamp);
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity: o, pointerEvents: "none" }} />;
};

// warm light leak sweeping across the frame
export const LightLeak: React.FC<{ at: number; len?: number }> = ({ at, len = 22 }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at - len / 2, at + len / 2], [0, 1], clamp);
  if (p <= 0 || p >= 1) return null;
  const o = Math.sin(p * Math.PI);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", opacity: o }}>
      <div
        style={{
          position: "absolute",
          left: -600 + p * 1400,
          top: -200,
          width: 1100,
          height: 2400,
          rotate: "18deg",
          background: "radial-gradient(closest-side, rgba(255,190,90,0.95), rgba(255,90,30,0.55) 45%, rgba(255,60,0,0) 100%)",
          filter: "blur(30px)",
        }}
      />
      <AbsoluteFill style={{ background: "rgba(255,170,90,0.25)" }} />
    </AbsoluteFill>
  );
};

// small screen shake helper
export const shake = (f: number, at: number, len: number, amp: number, seed: string) => {
  const t = f - at;
  if (t < 0 || t > len) return "0px 0px";
  const k = 1 - t / len;
  return `${(random(`${seed}a${t}`) - 0.5) * 2 * amp * k}px ${(random(`${seed}b${t}`) - 0.5) * 2 * amp * k}px`;
};
