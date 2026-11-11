import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, COLORS, easeIn, easeOut, FONT, pop } from "../lib";

export type Pos = { left?: number; right?: number; top?: number; bottom?: number };

/** Enter (overshoot pop) and exit (quick shrink) for a graphic that lives the whole Sequence. */
export const useLife = (enterDur = 12, exitDur = 9) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const inP = pop(frame, 0, enterDur);
  const outP = interpolate(frame, [durationInFrames - exitDur, durationInFrames], [1, 0], { ...clamp, easing: easeIn });
  return { frame, inP, outP, life: Math.min(inP, outP), dur: durationInFrames };
};

export const cardStyle: React.CSSProperties = {
  background: COLORS.paper,
  border: `5px solid ${COLORS.ink}`,
  borderRadius: 26,
  boxShadow: `9px 10px 0 rgba(38,34,31,0.88)`,
  fontFamily: FONT,
  fontWeight: 600,
  color: COLORS.ink,
};

/** A paper card that pops in with a slight tilt and shrinks out. */
export const Card: React.FC<{
  pos: Pos;
  tilt?: number;
  origin?: string;
  style?: React.CSSProperties;
  enterDur?: number;
  children: React.ReactNode;
}> = ({ pos, tilt = -2, origin = "center", style, enterDur = 12, children }) => {
  const { inP, outP } = useLife(enterDur);
  const s = inP * outP; // inP overshoots past 1 on purpose
  if (s <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        ...pos,
        transformOrigin: origin,
        scale: String(Math.max(0, s)),
        rotate: `${tilt * Math.min(1, inP)}deg`,
        opacity: Math.min(1, outP * 1.5),
        ...cardStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Coloured pill heading used on cards. */
export const Pill: React.FC<{ color: string; children: React.ReactNode; size?: number }> = ({
  color,
  children,
  size = 34,
}) => (
  <div
    style={{
      display: "inline-block",
      fontFamily: FONT,
      background: color,
      color: "#fff",
      border: `4px solid ${COLORS.ink}`,
      borderRadius: 999,
      padding: "4px 22px 6px",
      fontSize: size,
      fontWeight: 700,
      letterSpacing: 1.5,
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

/** Hand-drawn style check or cross that draws itself from progress p (0..1). */
export const Mark: React.FC<{ kind: "check" | "x"; p: number; size?: number }> = ({ kind, p, size = 60 }) => {
  const color = kind === "check" ? COLORS.green : COLORS.red;
  const circle = interpolate(p, [0, 0.35], [0, 1], { ...clamp, easing: easeOut });
  const a = interpolate(p, [0.25, 0.65], [1, 0], clamp);
  const b = interpolate(p, [0.6, 1], [1, 0], clamp);
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" style={{ flex: "none", overflow: "visible" }}>
      <circle
        cx={30}
        cy={30}
        r={26 * circle}
        fill={color}
        stroke={COLORS.ink}
        strokeWidth={4}
      />
      {kind === "check" ? (
        <path
          d="M17 31 L27 41 L44 20"
          fill="none"
          stroke="#fff"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={Math.max(a * 0.5 + b * 0.5, 0)}
        />
      ) : (
        <>
          <path d="M19 19 L41 41" stroke="#fff" strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={a} />
          <path d="M41 19 L19 41" stroke="#fff" strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={b} />
        </>
      )}
    </svg>
  );
};
