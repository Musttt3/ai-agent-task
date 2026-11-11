import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, COLORS, easeInOut, easeOut, FONT, H, MARKER, pop, ramp, rand, W } from "../lib";
import { Card, Mark, Pill, Pos, useLife } from "./kit";

/* ---------------------------------------------------------------- checklist */

export type Item = { text: string; at: number; kind: "check" | "x"; strike?: boolean };

export const Checklist: React.FC<{
  pos: Pos;
  title?: string;
  titleColor?: string;
  items: Item[];
  tilt?: number;
  size?: number;
}> = ({ pos, title, titleColor = COLORS.blue, items, tilt = -1.5, size = 46 }) => {
  const frame = useCurrentFrame();
  return (
    <Card pos={pos} tilt={tilt} style={{ padding: "22px 34px 24px 26px" }}>
      {title ? (
        <div style={{ marginBottom: 14 }}>
          <Pill color={titleColor}>{title}</Pill>
        </div>
      ) : null}
      {items.map((it, i) => {
        const show = ramp(frame, it.at, it.at + 8);
        const markP = ramp(frame, it.at + 2, it.at + 16);
        const strike = it.kind === "x" && it.strike !== false ? ramp(frame, it.at + 8, it.at + 18) : 0;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginTop: i ? 12 : 0,
              opacity: show,
              translate: `${(1 - show) * -40}px 0px`,
              fontSize: size,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
            }}
          >
            <Mark kind={it.kind} p={markP} size={size * 1.25} />
            <span style={{ position: "relative" }}>
              {it.text}
              {strike > 0 ? (
                <span
                  style={{
                    position: "absolute",
                    left: -4,
                    top: "52%",
                    height: 6,
                    width: `calc(${strike * 100}% + 8px)`,
                    background: COLORS.red,
                    borderRadius: 3,
                    rotate: "-2deg",
                  }}
                />
              ) : null}
            </span>
          </div>
        );
      })}
    </Card>
  );
};

/* ---------------------------------------------------------------- price tag */

export const PriceTag: React.FC<{ pos: Pos; top: string; main: string; stampAt?: number; stamp?: string }> = ({
  pos,
  top,
  main,
  stampAt,
  stamp,
}) => {
  const { frame, life } = useLife(14);
  const swing = Math.sin(frame / 9) * 3 * (1 - ramp(frame, 0, 60) * 0.5);
  const st = stampAt === undefined ? 0 : pop(frame, stampAt, 10);
  const shine = interpolate((frame % 75) / 75, [0, 0.35], [-60, 160], clamp);
  if (life <= 0.001) return null;
  return (
    <div style={{ position: "absolute", ...pos, transformOrigin: "50% -60px", scale: String(life), rotate: `${swing - 4}deg` }}>
      {/* string */}
      <div style={{ position: "absolute", left: "50%", top: -70, width: 5, height: 78, background: COLORS.ink, translate: "-2px 0" }} />
      <div
        style={{
          position: "relative",
          background: COLORS.yellow,
          border: `6px solid ${COLORS.ink}`,
          borderRadius: "22px 22px 26px 26px",
          clipPath: "polygon(50% 0%, 100% 22%, 100% 100%, 0% 100%, 0% 22%)",
          padding: "70px 42px 26px",
          fontFamily: FONT,
          color: COLORS.ink,
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: "50%", top: 22, width: 26, height: 26, borderRadius: "50%", background: COLORS.paper, border: `5px solid ${COLORS.ink}`, translate: "-50% 0" }} />
        <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: 2 }}>{top}</div>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.05, whiteSpace: "nowrap" }}>{main}</div>
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${shine}%`,
            width: 60,
            background: "rgba(255,255,255,0.45)",
            rotate: "20deg",
            scale: "1 2",
          }}
        />
      </div>
      {/* tag outline (clip-path removes the border on the slanted edges, redraw it) */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }} viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline points="0,22 50,0 100,22" fill="none" stroke={COLORS.ink} strokeWidth={6} vectorEffect="non-scaling-stroke" />
      </svg>
      {st > 0 ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "100%",
            translate: "-50% 10px",
            scale: String(interpolate(st, [0, 1], [2.2, 1])),
            opacity: Math.min(1, st * 2),
            rotate: "-12deg",
            border: `7px solid ${COLORS.red}`,
            color: COLORS.red,
            background: "rgba(255,250,240,0.92)",
            borderRadius: 14,
            padding: "6px 20px",
            fontFamily: MARKER,
            fontSize: 44,
            whiteSpace: "nowrap",
          }}
        >
          {stamp}
        </div>
      ) : null}
    </div>
  );
};

/* ---------------------------------------------------------------- year counter */

const dots = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export const YearCounter: React.FC<{ pos: Pos; countFrom: number; countTo: number; target: number }> = ({
  pos,
  countFrom,
  countTo,
  target,
}) => {
  const frame = useCurrentFrame();
  const v = Math.round(interpolate(frame, [countFrom, countTo], [0, target], { ...clamp, easing: easeOut }) / 10) * 10;
  const done = pop(frame, countTo, 10);
  return (
    <Card pos={pos} tilt={2} style={{ padding: "18px 40px 22px", textAlign: "center", translate: "-50% 0" }}>
      <div
        style={{
          fontSize: 120,
          fontWeight: 700,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          color: COLORS.ink,
          scale: String(1 + 0.12 * Math.sin(Math.PI * Math.min(1, done))),
        }}
      >
        {dots(v)}
      </div>
      <div style={{ marginTop: 10 }}>
        <Pill color={COLORS.orange} size={40}>
          tahun lalu
        </Pill>
      </div>
    </Card>
  );
};

/* ---------------------------------------------------------------- fuel gauge */

export const FuelGauge: React.FC<{
  pos: Pos;
  keys: [number, number][]; // [frame, level 0..1]
  status: string;
  statusColor: string;
  blink?: boolean;
  scale?: number;
}> = ({ pos, keys, status, statusColor, blink, scale = 1 }) => {
  const frame = useCurrentFrame();
  const level = interpolate(
    frame,
    keys.map((k) => k[0]),
    keys.map((k) => k[1]),
    { ...clamp, easing: easeInOut },
  );
  const wobble = Math.sin(frame * 0.9) * 1.2;
  const ang = -90 + 180 * level + wobble; // deg, -90 = E, +90 = F
  const on = !blink || Math.floor(frame / 9) % 2 === 0;
  const arc = (a0: number, a1: number) => {
    const r = 120;
    const p = (a: number) => [150 + r * Math.sin((a * Math.PI) / 180), 160 - r * Math.cos((a * Math.PI) / 180)];
    const [x0, y0] = p(a0);
    const [x1, y1] = p(a1);
    return `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`;
  };
  return (
    <Card pos={pos} tilt={1.5} origin="top right" style={{ padding: "14px 22px 18px", textAlign: "center", zoom: scale }}>
      <div>
        <svg width={300} height={185} viewBox="0 0 300 185">
          <path d={arc(-90, -45)} stroke={COLORS.red} strokeWidth={26} fill="none" />
          <path d={arc(-45, 30)} stroke={COLORS.yellow} strokeWidth={26} fill="none" />
          <path d={arc(30, 90)} stroke={COLORS.green} strokeWidth={26} fill="none" />
          <path d={arc(-90, 90)} stroke={COLORS.ink} strokeWidth={4} fill="none" transform="translate(0,0)" />
          <text x={22} y={182} fontFamily={FONT} fontWeight={700} fontSize={34} fill={COLORS.ink}>
            E
          </text>
          <text x={258} y={182} fontFamily={FONT} fontWeight={700} fontSize={34} fill={COLORS.ink}>
            F
          </text>
          <g transform={`rotate(${ang} 150 160)`}>
            <path d="M150 160 L144 158 L150 58 L156 158 Z" fill={COLORS.ink} stroke={COLORS.ink} strokeWidth={3} strokeLinejoin="round" />
          </g>
          <circle cx={150} cy={160} r={16} fill={COLORS.ink} />
          <circle cx={150} cy={160} r={6} fill={COLORS.paper} />
        </svg>
        <div style={{ fontSize: 26, letterSpacing: 3, marginTop: -4 }}>BAHAN BAKAR</div>
        <div style={{ marginTop: 8, opacity: on ? 1 : 0.15 }}>
          <Pill color={statusColor} size={32}>
            {status}
          </Pill>
        </div>
      </div>
    </Card>
  );
};

/* ---------------------------------------------------------------- icon cards */

const Icon: React.FC<{ kind: "water" | "herd" | "cave" }> = ({ kind }) => {
  const s = { stroke: COLORS.ink, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  if (kind === "water")
    return (
      <svg width={84} height={84} viewBox="0 0 84 84">
        <path d="M42 8 C30 28 18 40 18 54 a24 24 0 0 0 48 0 C66 40 54 28 42 8 Z" fill={COLORS.blue} {...s} />
        <path d="M30 54 a12 12 0 0 0 10 12" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
      </svg>
    );
  if (kind === "herd")
    return (
      <svg width={84} height={84} viewBox="0 0 84 84">
        <ellipse cx={42} cy={54} rx={17} ry={14} fill="#8d5a3b" {...s} />
        <ellipse cx={20} cy={32} rx={8} ry={10} fill="#8d5a3b" {...s} />
        <ellipse cx={34} cy={20} rx={8} ry={10} fill="#8d5a3b" {...s} />
        <ellipse cx={50} cy={20} rx={8} ry={10} fill="#8d5a3b" {...s} />
        <ellipse cx={64} cy={32} rx={8} ry={10} fill="#8d5a3b" {...s} />
      </svg>
    );
  return (
    <svg width={84} height={84} viewBox="0 0 84 84">
      <path d="M6 76 C10 30 30 10 46 12 C66 14 78 40 78 76 Z" fill="#9c8f80" {...s} />
      <path d="M26 76 C28 54 36 44 44 44 C54 44 60 56 60 76 Z" fill={COLORS.ink} {...s} />
    </svg>
  );
};

export const IconCards: React.FC<{
  pos: Pos;
  items: { icon: "water" | "herd" | "cave"; text: string; at: number }[];
}> = ({ pos, items }) => {
  const { frame, outP } = useLife();
  return (
    <div style={{ position: "absolute", ...pos, display: "flex", gap: 26, alignItems: "flex-end" }}>
      {items.map((it, i) => {
        const p = pop(frame, it.at, 12) * outP;
        if (p <= 0.001) return <div key={i} />;
        return (
          <div
            key={i}
            style={{
              scale: String(p),
              rotate: `${[-3, 2, -1.5][i % 3]}deg`,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 26px 10px 14px",
              background: COLORS.paper,
              border: `5px solid ${COLORS.ink}`,
              borderRadius: 24,
              boxShadow: `8px 9px 0 rgba(38,34,31,0.88)`,
              fontFamily: FONT,
              fontWeight: 600,
              fontSize: 44,
              color: COLORS.ink,
              whiteSpace: "nowrap",
            }}
          >
            <Icon kind={it.icon} />
            {it.text}
          </div>
        );
      })}
    </div>
  );
};

/* ---------------------------------------------------------------- arrow label */

export const ArrowLabel: React.FC<{ pos: Pos; text: string; dir: "left" | "right"; color: string }> = ({
  pos,
  text,
  dir,
  color,
}) => {
  const { frame, life } = useLife(12);
  const nudge = Math.sin(frame / 5) * 10;
  if (life <= 0.001) return null;
  const arrow = (
    <svg width={130} height={90} viewBox="0 0 130 90" style={{ scale: dir === "left" ? "-1 1" : "1 1", translate: `${(dir === "left" ? -1 : 1) * nudge}px 0` }}>
      <path d="M6 30 L80 30 L80 8 L124 45 L80 82 L80 60 L6 60 Z" fill={color} stroke={COLORS.ink} strokeWidth={6} strokeLinejoin="round" />
    </svg>
  );
  return (
    <div
      style={{
        position: "absolute",
        ...pos,
        scale: String(life),
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexDirection: dir === "left" ? "row" : "row",
      }}
    >
      {dir === "left" ? arrow : null}
      <div
        style={{
          background: COLORS.paper,
          border: `5px solid ${COLORS.ink}`,
          borderRadius: 20,
          boxShadow: `8px 9px 0 rgba(38,34,31,0.88)`,
          padding: "6px 26px 10px",
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 58,
          letterSpacing: 3,
          color,
          WebkitTextStroke: `2px ${COLORS.ink}`,
        }}
      >
        {text}
      </div>
      {dir === "right" ? arrow : null}
    </div>
  );
};

/* ---------------------------------------------------------------- labels */

/** Two labels over the halves of a split-screen picture. */
export const SplitLabels: React.FC<{ left: string; right: string; rightAt: number }> = ({ left, right, rightAt }) => {
  const { frame, outP } = useLife();
  const l = pop(frame, 0, 12) * outP;
  const r = pop(frame, rightAt, 12) * outP;
  const tag = (text: string, s: number, x: number, color: string, tilt: number) =>
    s > 0.001 ? (
      <div
        style={{
          position: "absolute",
          left: x,
          bottom: 70,
          translate: "-50% 0",
          scale: String(s),
          rotate: `${tilt}deg`,
        }}
      >
        <Pill color={color} size={50}>
          {text}
        </Pill>
      </div>
    ) : null;
  return (
    <>
      {tag(left, l, W * 0.25, COLORS.blue, -2)}
      {tag(right, r, W * 0.75, COLORS.green, 2)}
    </>
  );
};

/** Yellow sticky note for time jumps. */
export const TimeNote: React.FC<{ text: string; pos?: Pos; tilt?: number }> = ({
  text,
  pos = { left: 70, top: 60 },
  tilt = -4,
}) => {
  const { life } = useLife(14);
  if (life <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        ...pos,
        scale: String(life),
        rotate: `${tilt}deg`,
        transformOrigin: "top left",
        background: "#ffe066",
        border: `5px solid ${COLORS.ink}`,
        boxShadow: `8px 9px 0 rgba(38,34,31,0.88)`,
        padding: "16px 34px 18px",
        fontFamily: MARKER,
        fontSize: 52,
        color: COLORS.ink,
        whiteSpace: "nowrap",
      }}
    >
      {/* tape */}
      <div style={{ position: "absolute", left: "50%", top: -22, width: 120, height: 36, translate: "-50% 0", rotate: "3deg", background: "rgba(255,255,255,0.75)", border: "2px solid rgba(38,34,31,0.25)" }} />
      {text}
    </div>
  );
};

/* ---------------------------------------------------------------- weather / danger */

export const Rain: React.FC<{ fadeOutAt: number }> = ({ fadeOutAt }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const k = Math.min(ramp(frame, 0, 20), interpolate(frame, [fadeOutAt, durationInFrames], [1, 0], clamp));
  if (k <= 0.001) return null;
  const drops = [];
  for (let i = 0; i < 150; i++) {
    const speed = 38 + rand(i) * 26; // px per frame
    const len = 50 + rand(i + 7) * 60;
    const x0 = rand(i + 3) * (W + 300);
    const y = ((rand(i + 11) * (H + 200) + frame * speed) % (H + 200)) - 100;
    const x = x0 - (y + 100) * 0.22;
    drops.push(
      <line
        key={i}
        x1={x}
        y1={y}
        x2={x - len * 0.22}
        y2={y - len}
        stroke="#e8f1ff"
        strokeWidth={2 + rand(i + 5) * 2.5}
        strokeLinecap="round"
        opacity={0.35 + rand(i + 9) * 0.4}
      />,
    );
  }
  return (
    <AbsoluteFill style={{ opacity: k }}>
      <AbsoluteFill style={{ background: "rgba(20,30,50,0.10)" }} />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        {drops}
      </svg>
    </AbsoluteFill>
  );
};

export const Warning: React.FC<{ pos: Pos; title: string; lines: string[] }> = ({ pos, title, lines }) => {
  const frame = useCurrentFrame();
  const pulse = 1 + 0.06 * Math.max(0, Math.sin(frame / 4));
  return (
    <Card pos={pos} tilt={-2} style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          height: 26,
          background: `repeating-linear-gradient(-45deg, ${COLORS.yellow} 0 26px, ${COLORS.ink} 26px 52px)`,
          backgroundPosition: `${frame * 2}px 0`,
          borderBottom: `5px solid ${COLORS.ink}`,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "18px 34px 22px 24px" }}>
        <svg width={110} height={100} viewBox="0 0 110 100" style={{ scale: String(pulse), flex: "none" }}>
          <path d="M55 6 L104 92 L6 92 Z" fill={COLORS.yellow} stroke={COLORS.ink} strokeWidth={7} strokeLinejoin="round" />
          <rect x={50} y={34} width={10} height={32} rx={4} fill={COLORS.ink} />
          <circle cx={55} cy={78} r={6} fill={COLORS.ink} />
        </svg>
        <div>
          <div style={{ fontSize: 52, fontWeight: 700, color: COLORS.red, letterSpacing: 2 }}>{title}</div>
          {lines.map((l, i) => (
            <div key={i} style={{ fontSize: 40, lineHeight: 1.15 }}>
              {l}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

/** Pulsing red edges for a low-fuel alarm. */
export const RedAlert: React.FC = () => {
  const { frame, life } = useLife(6, 10);
  const pulse = 0.5 + 0.5 * Math.sin((frame / 30) * Math.PI * 2 * 1.4);
  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(1, life) * (0.35 + 0.65 * pulse),
        boxShadow: `inset 0 0 220px 70px rgba(230,30,40,0.75)`,
      }}
    />
  );
};

/* ---------------------------------------------------------------- text moments */

/** Text revealed word by word at given frames. */
export const WordReveal: React.FC<{
  words: { t: string; at: number; hi?: boolean }[];
  pos: Pos;
  size?: number;
  width?: number;
  center?: boolean;
}> = ({ words, pos, size = 64, width = 1500, center = true }) => {
  const { frame } = useLife();
  return (
    <Card pos={pos} tilt={-1} style={{ padding: "22px 44px 28px", width, textAlign: center ? "center" : "left" }}>
      <div style={{ fontSize: size, lineHeight: 1.18, fontWeight: 600 }}>
        {words.map((w, i) => {
          if (w.t === "\n") return <br key={i} />;
          const p = pop(frame, w.at, 9);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: "0.28em",
                opacity: Math.min(1, p * 1.5),
                translate: `0 ${(1 - Math.min(1, p)) * 24}px`,
                color: w.hi ? COLORS.red : COLORS.ink,
                fontWeight: w.hi ? 700 : 600,
              }}
            >
              {w.t}
            </span>
          );
        })}
      </div>
    </Card>
  );
};

/** Film look for the flashback: warm vignette + moving grain + flicker. */
export const FilmLook: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const k = Math.min(ramp(frame, 0, 8), interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], clamp));
  const flicker = 0.92 + 0.08 * rand(frame);
  const seed = frame % 12;
  return (
    <AbsoluteFill style={{ opacity: k }}>
      <AbsoluteFill style={{ background: "rgba(150,95,35,0.16)", mixBlendMode: "multiply" }} />
      <AbsoluteFill style={{ boxShadow: "inset 0 0 260px 90px rgba(40,22,8,0.75)", opacity: flicker }} />
      <svg width={W} height={H} style={{ position: "absolute", opacity: 0.22, mixBlendMode: "overlay" }}>
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={1} seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter={`url(#g${seed})`} />
      </svg>
      {/* scratches */}
      {[0, 1].map((i) => {
        const x = rand(Math.floor(frame / 4) * 3 + i) * W;
        return rand(frame + i * 5) > 0.55 ? (
          <div key={i} style={{ position: "absolute", left: x, top: 0, width: 2, height: H, background: "rgba(255,240,210,0.35)" }} />
        ) : null;
      })}
    </AbsoluteFill>
  );
};

export { Card, Pill };
