import React from "react";
import { AbsoluteFill, Easing, random } from "remotion";
import { BODY, HEAD, INK, RED, W, YELLOW, lerp, shakeAt, usePop, useT } from "./lib";

/* ------------------------------------------------------------------ */
/* Scene wrapper: mounts in its time window and runs entry transition */
/* ------------------------------------------------------------------ */

export type Enter = "whip" | "zoom" | "glitch" | "whipUp" | "none";

export const Scene: React.FC<{
  start: number;
  end: number;
  enter: Enter;
  impacts?: number[];
  children: React.ReactNode;
}> = ({ start, end, enter, impacts = [], children }) => {
  const t = useT();
  const pre = enter === "glitch" ? 0.1 : enter === "none" ? 0 : 0.22;
  if (t < start - pre || t >= end + 0.04) return null;
  const p = lerp(t, [start - pre, start + 0.04], [0, 1], Easing.bezier(0.6, 0, 0.2, 1));
  const shake = shakeAt(t, impacts);
  let translate = `${shake.x}px ${shake.y}px`;
  let scale = 1;
  let filter = "none";
  let opacity = 1;
  if (enter === "whip") {
    translate = `${(1 - p) * W * 1.05 + shake.x}px ${shake.y}px`;
    filter = `blur(${(1 - p) * 30}px)`;
  } else if (enter === "whipUp") {
    translate = `${shake.x}px ${(1 - p) * 1920 + shake.y}px`;
    filter = `blur(${(1 - p) * 30}px)`;
  } else if (enter === "zoom") {
    scale = 1 + (1 - p) * 0.6;
    opacity = p;
    filter = `blur(${(1 - p) * 22}px)`;
  } else if (enter === "glitch") {
    const g = t < start + 0.18;
    if (g) {
      const r = random(Math.floor(t * 30));
      translate = `${(r - 0.5) * 120}px ${shake.y}px`;
      filter = `hue-rotate(${r * 180}deg) saturate(2.5) contrast(1.4)`;
    }
  }
  return (
    <AbsoluteFill style={{ translate, scale: String(scale), filter, opacity, overflow: "hidden" }}>
      {children}
      {enter === "glitch" && t < start + 0.18 ? <GlitchBars seed={t} /> : null}
    </AbsoluteFill>
  );
};

const GlitchBars: React.FC<{ seed: number }> = ({ seed }) => {
  const k = Math.floor(seed * 30);
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      {new Array(7).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: (random(`x${k}${i}`) - 0.5) * 200,
            top: random(`y${k}${i}`) * 1920,
            width: W * 1.2,
            height: 20 + random(`h${k}${i}`) * 90,
            background: i % 2 ? "rgba(255,0,80,0.55)" : "rgba(0,255,230,0.5)",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/* ---------------------------- helpers ------------------------------ */

export const Stamp: React.FC<{
  at: number;
  text: string;
  color?: string;
  size?: number;
  rotate?: number;
  style?: React.CSSProperties;
}> = ({ at, text, color = RED, size = 110, rotate = -12, style }) => {
  const t = useT();
  if (t < at) return null;
  const s = lerp(t, [at, at + 0.14], [2.6, 1], Easing.bezier(0.5, 0, 0.9, 0.6));
  const o = lerp(t, [at, at + 0.08], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        fontFamily: HEAD,
        fontSize: size,
        color,
        border: `10px solid ${color}`,
        borderRadius: 18,
        padding: "4px 30px",
        letterSpacing: 4,
        rotate: `${rotate}deg`,
        scale: String(s),
        opacity: o,
        background: "rgba(255,255,255,0.08)",
        textShadow: "0 4px 18px rgba(0,0,0,0.35)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {text}
    </div>
  );
};

export const Chip: React.FC<{
  at: number;
  children: React.ReactNode;
  bg?: string;
  color?: string;
  style?: React.CSSProperties;
  from?: "left" | "right" | "pop";
}> = ({ at, children, bg = YELLOW, color = INK, style, from = "pop" }) => {
  const t = useT();
  const pop = usePop(at);
  if (t < at) return null;
  const slide = from === "left" ? -700 : from === "right" ? 700 : 0;
  return (
    <div
      style={{
        position: "absolute",
        background: bg,
        color,
        fontFamily: BODY,
        fontWeight: 900,
        fontSize: 48,
        padding: "14px 28px",
        borderRadius: 18,
        boxShadow: "0 12px 0 rgba(0,0,0,0.8)",
        translate: `${(1 - pop) * slide}px 0px`,
        scale: String(from === "pop" ? pop : 1),
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** hand-drawn style circle that draws itself */
export const DrawCircle: React.FC<{ at: number; cx: number; cy: number; r: number; color?: string }> = ({
  at,
  cx,
  cy,
  r,
  color = YELLOW,
}) => {
  const t = useT();
  const p = lerp(t, [at, at + 0.4], [0, 1]);
  if (t < at) return null;
  const len = 2 * Math.PI * r * 1.15;
  return (
    <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1920}>
      <ellipse
        cx={cx}
        cy={cy}
        rx={r * 1.1}
        ry={r}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - p)}
        transform={`rotate(-8 ${cx} ${cy})`}
        style={{ filter: "drop-shadow(0 6px 6px rgba(0,0,0,0.6))" }}
      />
    </svg>
  );
};

export const Arrow: React.FC<{ at: number; x1: number; y1: number; x2: number; y2: number; color?: string }> = ({
  at,
  x1,
  y1,
  x2,
  y2,
  color = YELLOW,
}) => {
  const t = useT();
  if (t < at) return null;
  const p = lerp(t, [at, at + 0.3], [0, 1]);
  const mx = (x1 + x2) / 2 + 60;
  const my = (y1 + y2) / 2 - 80;
  const d = `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`;
  const ang = Math.atan2(y2 - my, x2 - mx);
  const hx = (a: number) => x2 - Math.cos(ang + a) * 50;
  const hy = (a: number) => y2 - Math.sin(ang + a) * 50;
  return (
    <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1920}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p}
        style={{ filter: "drop-shadow(0 6px 6px rgba(0,0,0,0.6))" }}
      />
      {p > 0.95 ? (
        <path
          d={`M${hx(0.5)} ${hy(0.5)} L${x2} ${y2} L${hx(-0.5)} ${hy(-0.5)}`}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
};

