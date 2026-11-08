// Motion-graphic building blocks for the vertical (9:16) ice-age short.
import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";

export const FONT = "Lilita One";
loadFont({ family: FONT, url: staticFile("fonts/lilita.ttf") });

export const ICE = "#9fe3ff";
export const RED = "#ff3b3b";
export const YELLOW = "#ffd23f";
export const GREEN = "#4ee08a";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const stroke = (w: number): React.CSSProperties => ({
  WebkitTextStroke: `${w}px #0b0b0f`,
  paintOrder: "stroke fill",
});

// ---------- atmosphere ----------
export const Snow: React.FC<{ count?: number; wind?: number; opacity?: number }> = ({ count = 140, wind = 1, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      {new Array(count).fill(0).map((_, i) => {
        const near = random(`n${i}`) > 0.8;
        const size = near ? 10 + random(`s${i}`) * 10 : 3 + random(`s${i}`) * 5;
        const speed = near ? 9 + random(`v${i}`) * 6 : 3 + random(`v${i}`) * 3;
        const y = ((random(`y${i}`) * (height + 200) + frame * speed) % (height + 200)) - 100;
        const x = ((random(`x${i}`) * (width + 400) + frame * speed * 0.55 * wind + Math.sin(frame / 20 + i) * 20) % (width + 400)) - 200;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: size,
              background: "white",
              opacity: near ? 0.75 : 0.85,
              filter: near ? "blur(3px)" : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const Frost: React.FC<{ amount: number }> = ({ amount }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at center, rgba(255,255,255,0) ${70 - amount * 35}%, rgba(200,240,255,${0.35 + amount * 0.5}) 100%)`,
      boxShadow: `inset 0 0 ${80 + amount * 220}px rgba(220,245,255,${0.4 + amount * 0.5})`,
      mixBlendMode: "screen",
    }}
  />
);

export const Warm: React.FC<{ amount?: number }> = ({ amount = 1 }) => {
  const frame = useCurrentFrame();
  const flick = 0.85 + 0.15 * Math.sin(frame / 3.1) * Math.sin(frame / 5.3);
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at 50% 70%, rgba(255,150,40,0.35) 0%, rgba(255,120,20,0) 60%)",
        opacity: amount * flick,
        mixBlendMode: "screen",
      }}
    />
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
);

// ---------- text pieces ----------
export const Pop: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties; from?: number }> = ({
  delay = 0,
  children,
  style,
  from = 0.3,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 11, stiffness: 190 } });
  return (
    <div style={{ transform: `scale(${from + (1 - from) * s})`, opacity: frame < delay ? 0 : Math.min(1, s * 2), ...style }}>
      {children}
    </div>
  );
};

// Hook: MINUS 30°C counter + "tanpa jaket / tanpa sepatu" chips
export const Hook: React.FC<{ jaketAt: number; sepatuAt: number }> = ({ jaketAt, sepatuAt }) => {
  const frame = useCurrentFrame();
  const v = Math.round(interpolate(frame, [0, 40], [0, -30], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const shake = frame > 38 && frame < 52 ? (random(`h${frame}`) - 0.5) * 16 : 0;
  const chip = (label: string, at: number) => {
    const strike = interpolate(frame, [at + 6, at + 14], [0, 100], clamp);
    return (
      <Pop delay={at}>
        <div style={{ position: "relative", fontFamily: FONT, fontSize: 64, color: "white", background: "rgba(10,20,35,0.75)", padding: "6px 28px", borderRadius: 18, border: "4px solid #0b0b0f" }}>
          {label}
          <div style={{ position: "absolute", left: 18, top: "50%", height: 9, width: `calc(${strike}% - 36px)`, background: RED, borderRadius: 5, transform: "rotate(-4deg)" }} />
        </div>
      </Pop>
    );
  };
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 250 }}>
      <Pop>
        <div style={{ fontFamily: FONT, fontSize: 92, color: "white", ...stroke(14), letterSpacing: 2 }}>SUHU</div>
      </Pop>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 250,
          lineHeight: 1,
          color: ICE,
          ...stroke(18),
          transform: `translateX(${shake}px)`,
          textShadow: "0 0 40px rgba(120,220,255,0.9), 0 12px 0 #0b0b0f",
        }}
      >
        {v}°C
      </div>
      <div style={{ display: "flex", gap: 24, marginTop: 30 }}>
        {chip("JAKET", jaketAt)}
        {chip("SEPATU", sepatuAt)}
      </div>
    </AbsoluteFill>
  );
};

export const Headline: React.FC<{ text: string; color?: string; size?: number; top?: number; delay?: number; rotate?: number }> = ({
  text,
  color = "white",
  size = 130,
  top = 260,
  delay = 0,
  rotate = 0,
}) => (
  <AbsoluteFill style={{ alignItems: "center", paddingTop: top }}>
    <Pop delay={delay}>
      <div
        style={{
          fontFamily: FONT,
          fontSize: size,
          lineHeight: 1.02,
          color,
          ...stroke(16),
          textAlign: "center",
          whiteSpace: "pre-line",
          transform: `rotate(${rotate}deg)`,
          textShadow: "0 10px 0 #0b0b0f, 0 0 30px rgba(0,0,0,0.5)",
        }}
      >
        {text}
      </div>
    </Pop>
  </AbsoluteFill>
);

export const Stamp: React.FC<{ text: string; color: string; delay?: number; top?: number }> = ({ text, color, delay = 0, top = 300 }) => {
  const frame = useCurrentFrame();
  const f = frame - delay;
  const s = interpolate(f, [0, 6], [2.6, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: top, opacity: f < 0 ? 0 : 1 }}>
      <div
        style={{
          transform: `scale(${s}) rotate(-7deg)`,
          fontFamily: FONT,
          fontSize: 120,
          color,
          border: `12px solid ${color}`,
          borderRadius: 26,
          padding: "0 36px",
          background: "rgba(0,0,0,0.45)",
          ...stroke(6),
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

// Check / cross list cards (top of frame)
export type Item = { label: string; at: number };
export const ListCard: React.FC<{ title: string; items: Item[]; tone: "good" | "bad" | "key"; top?: number }> = ({ title, items, tone, top = 230 }) => {
  const frame = useCurrentFrame();
  const accent = tone === "good" ? GREEN : tone === "bad" ? RED : YELLOW;
  const visible = items.filter((it) => frame >= it.at);
  const latest = visible.length - 1;
  const firstShown = Math.max(0, visible.length - 3);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: top }}>
      <Pop>
        <div style={{ fontFamily: FONT, fontSize: 66, color: accent, ...stroke(12), marginBottom: 14, textShadow: "0 6px 0 #0b0b0f" }}>{title}</div>
      </Pop>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        {items.map((it, i) =>
          frame >= it.at && i >= firstShown ? (
            <Pop key={it.label} delay={it.at} from={0.5}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  background: i === latest ? "rgba(10,14,24,0.88)" : "rgba(10,14,24,0.62)",
                  border: `5px solid ${i === latest ? accent : "rgba(255,255,255,0.25)"}`,
                  borderRadius: 22,
                  padding: "8px 30px 8px 12px",
                  transform: `scale(${i === latest ? 1 : 0.86})`,
                }}
              >
                <div
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: 31,
                    background: accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: FONT,
                    fontSize: tone === "key" ? 46 : 50,
                    color: "#0b0b0f",
                  }}
                >
                  {tone === "good" ? "✓" : tone === "bad" ? "✕" : i + 1}
                </div>
                <div style={{ fontFamily: FONT, fontSize: 58, color: "white", ...stroke(3) }}>{it.label}</div>
              </div>
            </Pop>
          ) : null,
        )}
      </div>
    </AbsoluteFill>
  );
};

// Thermometer pill (top-right)
export const TempPill: React.FC<{ danger: boolean }> = ({ danger }) => {
  const frame = useCurrentFrame();
  const pulse = danger ? 0.6 + 0.4 * Math.abs(Math.sin(frame / 6)) : 1;
  const c = danger ? RED : ICE;
  return (
    <div style={{ position: "absolute", top: 150, right: 60, display: "flex", alignItems: "center", gap: 12, background: "rgba(8,14,24,0.7)", border: `4px solid ${c}`, borderRadius: 40, padding: "6px 22px 6px 12px", opacity: pulse }}>
      <svg width="34" height="64" viewBox="0 0 34 64">
        <rect x="11" y="4" width="12" height="40" rx="6" fill="none" stroke="white" strokeWidth="4" />
        <circle cx="17" cy="50" r="10" fill={c} stroke="white" strokeWidth="4" />
        <rect x="15" y="30" width="4" height="16" fill={c} />
      </svg>
      <span style={{ fontFamily: FONT, fontSize: 50, color: "white" }}>-30°C</span>
    </div>
  );
};

// TikTok-style captions: 1-3 words per group, active word highlighted
export type Word = { w: string; from: number; to: number };
export const Captions: React.FC<{ words: Word[]; top?: number }> = ({ words, top = 1210 }) => {
  const frame = useCurrentFrame();
  // group words
  const groups: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w) => {
    cur.push(w);
    if (cur.length === 3 || /[,.?!]$/.test(w.w)) {
      groups.push(cur);
      cur = [];
    }
  });
  if (cur.length) groups.push(cur);
  const g = groups.find((gr, i) => {
    const end = i + 1 < groups.length ? groups[i + 1][0].from : gr[gr.length - 1].to + 20;
    return frame >= gr[0].from && frame < end;
  });
  if (!g) return null;
  const startF = g[0].from;
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: top }}>
      <Pop delay={startF} from={0.7}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 34, rowGap: 0, maxWidth: 940 }}>
          {g.map((w, i) => {
            const active = frame >= w.from;
            return (
              <span
                key={i}
                style={{
                  fontFamily: FONT,
                  fontSize: 92,
                  color: active ? YELLOW : "white",
                  ...stroke(11),
                  textShadow: "0 8px 0 #0b0b0f",
                  transform: `scale(${frame >= w.from && frame < w.to + 3 ? 1.08 : 1})`,
                  display: "inline-block",
                }}
              >
                {w.w.replace(/[,.]$/, "").toUpperCase()}
              </span>
            );
          })}
        </div>
      </Pop>
    </AbsoluteFill>
  );
};
