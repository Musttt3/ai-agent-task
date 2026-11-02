import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { body, C, clamp, display } from "./theme";
import type { Overlay } from "./types";

const outline = (w: number, color = C.ink) =>
  [
    `${w}px 0 0 ${color}`, `-${w}px 0 0 ${color}`, `0 ${w}px 0 ${color}`, `0 -${w}px 0 ${color}`,
    `${w}px ${w}px 0 ${color}`, `-${w}px ${w}px 0 ${color}`, `${w}px -${w}px 0 ${color}`, `-${w}px -${w}px 0 ${color}`,
    `0 ${w * 2 + 2}px 0 rgba(0,0,0,0.35)`,
  ].join(", ");

/** in/out envelope used by most overlays */
const useEnv = (inF = 10, outF = 10) => {
  const f = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const pop = spring({ frame: f, fps, config: { damping: 12, stiffness: 160, mass: 0.7 } });
  const out = interpolate(f, [durationInFrames - outF, durationInFrames], [1, 0], clamp);
  const fin = interpolate(f, [0, inF], [0, 1], clamp);
  return { f, fps, pop, out, fin, dur: durationInFrames };
};

// ---------------- icons ----------------
const Icon: React.FC<{ name?: string }> = ({ name }) => {
  const s = { stroke: C.ink, strokeWidth: 5, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;
  switch (name) {
    case "pin":
      return (
        <svg viewBox="0 0 48 48" width="46" height="46">
          <path d="M24 44 C14 31 9 24 9 18 a15 15 0 0 1 30 0 c0 6 -5 13 -15 26z" {...s} fill={C.white} />
          <circle cx="24" cy="18" r="5.5" {...s} fill={C.red} />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 48 48" width="46" height="46">
          <circle cx="24" cy="24" r="17" {...s} fill={C.white} />
          <path d="M24 14 V24 L31 29" {...s} />
        </svg>
      );
    case "sun":
      return (
        <svg viewBox="0 0 48 48" width="46" height="46">
          <circle cx="24" cy="24" r="9" {...s} fill={C.amber} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1="24" y1="5" x2="24" y2="10" {...s} transform={`rotate(${a} 24 24)`} />
          ))}
        </svg>
      );
    case "warn":
      return (
        <svg viewBox="0 0 48 48" width="46" height="46">
          <path d="M24 6 L44 41 H4 Z" {...s} fill={C.amber} />
          <path d="M24 18 V29" {...s} />
          <circle cx="24" cy="35" r="1.8" fill={C.ink} />
        </svg>
      );
    case "down":
      return (
        <svg viewBox="0 0 48 48" width="46" height="46">
          <path d="M24 6 V38 M12 27 L24 40 L36 27" {...s} />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 48 48" width="46" height="46">
          <circle cx="24" cy="24" r="17" {...s} fill={C.white} />
          <path d="M24 22 V33" {...s} />
          <circle cx="24" cy="15.5" r="2.4" fill={C.ink} />
        </svg>
      );
  }
};

// ---------------- title card ----------------
export const TitleCard: React.FC<{ o: Overlay }> = ({ o }) => {
  const { f, fps, out } = useEnv(10, 14);
  const word = o.title ?? "";
  const sub = interpolate(f, [26, 40], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const tag = interpolate(f, [44, 58], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(10,6,2,0.0) 25%, rgba(10,6,2,0.55) 62%, rgba(10,6,2,0.75) 100%)",
          opacity: interpolate(f, [0, 12], [0, 1], clamp),
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, textAlign: "center" }}>
        <div style={{ fontFamily: display, fontSize: 170, letterSpacing: 6, color: C.cream, lineHeight: 1 }}>
          {word.split("").map((ch, k) => {
            const s = spring({ frame: f - k * 2, fps, config: { damping: 11, stiffness: 170 } });
            return (
              <span
                key={k}
                style={{
                  display: "inline-block",
                  translate: `0 ${(1 - s) * -120}px`,
                  opacity: Math.min(1, s * 1.5),
                  textShadow: outline(7),
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div
          style={{
            fontFamily: display,
            fontSize: 92,
            color: C.amber,
            marginTop: 6,
            textShadow: outline(5),
            opacity: sub,
            scale: 0.85 + 0.15 * sub,
          }}
        >
          {o.text}
        </div>
        <div
          style={{
            display: "inline-block",
            marginTop: 22,
            padding: "10px 30px",
            borderRadius: 999,
            background: C.cream,
            border: `5px solid ${C.ink}`,
            fontFamily: body,
            fontWeight: 900,
            fontSize: 38,
            color: C.ink,
            opacity: tag,
            translate: `0 ${(1 - tag) * 30}px`,
          }}
        >
          {o.sub}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- chapter card ----------------
export const ChapterCard: React.FC<{ o: Overlay }> = ({ o }) => {
  const { f, fps, out } = useEnv(10, 12);
  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 140 } });
  const line = interpolate(f, [8, 26], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const subIn = interpolate(f, [14, 26], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div style={{ position: "absolute", left: 80, top: 70, translate: `${(1 - s) * -700}px 0` }}>
        <div
          style={{
            display: "inline-block",
            fontFamily: display,
            fontSize: 40,
            color: C.white,
            background: C.orange,
            border: `5px solid ${C.ink}`,
            borderRadius: 14,
            padding: "6px 20px 0",
            rotate: "-3deg",
            boxShadow: `5px 6px 0 ${C.ink}`,
          }}
        >
          {o.num}
        </div>
        <div style={{ fontFamily: display, fontSize: 96, color: C.cream, textShadow: outline(6), marginTop: 10, lineHeight: 1.05 }}>
          {o.title}
        </div>
        <svg width="620" height="30" style={{ display: "block", marginTop: 2 }}>
          <path
            d="M6 18 C 120 6, 260 26, 400 14 S 560 8, 612 16"
            stroke={C.amber}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={line}
          />
        </svg>
        <div
          style={{
            fontFamily: body,
            fontWeight: 900,
            fontSize: 36,
            color: C.white,
            textShadow: outline(3),
            opacity: subIn,
            marginTop: 4,
          }}
        >
          {o.sub}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- lower-third tag ----------------
export const Tag: React.FC<{ o: Overlay }> = ({ o }) => {
  const { pop, out } = useEnv(8, 10);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div
        style={{
          position: "absolute",
          left: 70,
          bottom: 80,
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "18px 34px 18px 20px",
          background: C.cream,
          border: `6px solid ${C.ink}`,
          borderRadius: 26,
          boxShadow: `8px 9px 0 ${C.ink}`,
          scale: 0.6 + 0.4 * pop,
          opacity: Math.min(1, pop * 1.4),
          transformOrigin: "left center",
        }}
      >
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 999,
            background: C.orange,
            border: `5px solid ${C.ink}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={o.icon} />
        </div>
        <div>
          <div style={{ fontFamily: display, fontSize: 50, color: C.ink, lineHeight: 1.05, paddingTop: 6 }}>{o.text}</div>
          {o.sub ? (
            <div style={{ fontFamily: body, fontWeight: 800, fontSize: 30, color: "#5b4a33", marginTop: 2 }}>{o.sub}</div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- label attached to the picture ----------------
export const MapLabel: React.FC<{ o: Overlay; localFrom: number }> = ({ o, localFrom }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - localFrom;
  const dur = Math.round(o.dur * fps);
  if (f < 0 || f > dur) return null;
  const pop = spring({ frame: f, fps, config: { damping: 11, stiffness: 180, mass: 0.6 } });
  const out = interpolate(f, [dur - 8, dur], [1, 0], clamp);
  const size = o.big ? 120 : o.small ? 40 : 52;
  return (
    <div
      style={{
        position: "absolute",
        left: `${(o.x ?? 0.5) * 100}%`,
        top: `${(o.y ?? 0.5) * 100}%`,
        translate: "-50% -50%",
        scale: 0.4 + 0.6 * pop,
        opacity: Math.min(1, pop * 1.5) * out,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: display,
          fontSize: size,
          color: o.big ? C.cream : C.ink,
          background: o.big ? "transparent" : C.cream,
          border: o.big ? "none" : `5px solid ${C.ink}`,
          borderRadius: 16,
          padding: o.big ? 0 : "8px 20px 2px",
          boxShadow: o.big ? undefined : `5px 6px 0 ${C.ink}`,
          textShadow: o.big ? outline(7) : undefined,
          letterSpacing: o.big ? 8 : 1,
          whiteSpace: "nowrap",
        }}
      >
        {o.text}
      </div>
      {o.arrow ? (
        <svg width="40" height="34" style={{ marginTop: -2 }}>
          <path d="M4 4 L20 30 L36 4 Z" fill={C.cream} stroke={C.ink} strokeWidth="5" strokeLinejoin="round" />
        </svg>
      ) : null}
    </div>
  );
};

// ---------------- big centered text ----------------
export const BigText: React.FC<{ o: Overlay }> = ({ o }) => {
  const { f, fps, out } = useEnv(10, 12);
  const letters = (o.text ?? "").split("");
  const subIn = interpolate(f, [letters.length * 2 + 6, letters.length * 2 + 18], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: out, justifyContent: "flex-end", alignItems: "center", paddingBottom: 110 }}>
      <div style={{ fontFamily: display, fontSize: 130, color: C.amber, letterSpacing: 4 }}>
        {letters.map((ch, k) => {
          const s = spring({ frame: f - k * 2, fps, config: { damping: 10, stiffness: 200 } });
          return (
            <span key={k} style={{ display: "inline-block", scale: s, textShadow: outline(7), whiteSpace: "pre" }}>
              {ch}
            </span>
          );
        })}
      </div>
      <div
        style={{
          fontFamily: body,
          fontWeight: 900,
          fontSize: 56,
          color: C.ink,
          background: C.cream,
          border: `5px solid ${C.ink}`,
          borderRadius: 20,
          padding: "6px 28px",
          boxShadow: `6px 7px 0 ${C.ink}`,
          opacity: subIn,
          translate: `0 ${(1 - subIn) * 24}px`,
        }}
      >
        {o.sub}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- time-travel counter ----------------
const yearLabel = (v: number) => (v >= 1 ? `${v} M` : `${Math.max(1, -v)} SM`);
export const Counter: React.FC<{ o: Overlay }> = ({ o }) => {
  const { f, fps, out, dur } = useEnv(8, 10);
  const from = o.from ?? 2026;
  const to = o.to ?? -1300;
  const p = interpolate(f, [8, dur - 34], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const v = Math.round(from + (to - from) * p);
  const done = p >= 1;
  const pulse = done ? spring({ frame: f - (dur - 34), fps, config: { damping: 8, stiffness: 220 } }) : 0;
  return (
    <AbsoluteFill style={{ opacity: out, alignItems: "center", paddingTop: 90 }}>
      <div style={{ fontFamily: body, fontWeight: 900, fontSize: 36, color: C.white, textShadow: outline(3), letterSpacing: 6 }}>
        MUNDUR KE MASA LALU
      </div>
      <div
        style={{
          fontFamily: display,
          fontSize: 150,
          color: done ? C.amber : C.cream,
          textShadow: outline(7),
          scale: 1 + pulse * 0.12 - (done ? 0.12 : 0),
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.05,
        }}
      >
        {yearLabel(v === 0 ? -1 : v)}
      </div>
      <div style={{ fontFamily: display, fontSize: 56, color: C.cream, textShadow: outline(5) }}>{o.sub}</div>
    </AbsoluteFill>
  );
};

// ---------------- embers (fire particles) ----------------
export const Embers: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = interpolate(f, [0, 15, durationInFrames - 15, durationInFrames], [0, 1, 1, 0], clamp);
  const parts = Array.from({ length: 46 }, (_, k) => {
    const life = 70 + random(`l${k}`) * 90;
    const t = ((f + random(`o${k}`) * life) % life) / life;
    const x0 = random(`x${k}`) * 1920;
    const sway = Math.sin((f / 18) + k) * 30 * t;
    const size = 3 + random(`s${k}`) * 6;
    return { x: x0 + sway + t * 60, y: 1100 - t * (500 + random(`h${k}`) * 500), o: Math.sin(Math.PI * t), size, k };
  });
  return (
    <AbsoluteFill style={{ opacity: fade, pointerEvents: "none" }}>
      {parts.map((p) => (
        <div
          key={p.k}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: 999,
            background: p.k % 3 === 0 ? "#ffd27a" : "#ff8a2a",
            boxShadow: `0 0 ${p.size * 2}px ${p.size}px rgba(255,120,30,0.55)`,
            opacity: p.o,
          }}
        />
      ))}
      <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(255,90,20,0.22) 0%, rgba(255,90,20,0) 45%)" }} />
    </AbsoluteFill>
  );
};

// ---------------- timeline infographic ----------------
export const Timeline: React.FC<{ o: Overlay }> = ({ o }) => {
  const { f, fps, out } = useEnv(10, 14);
  const items = o.items ?? [];
  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 120 } });
  const W = 1640;
  const line = interpolate(f, [10, 40], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ opacity: out, justifyContent: "flex-end", alignItems: "center", paddingBottom: 50 }}>
      <div
        style={{
          width: W + 80,
          background: C.cream,
          border: `6px solid ${C.ink}`,
          borderRadius: 28,
          boxShadow: `9px 10px 0 ${C.ink}`,
          padding: "18px 40px 26px",
          translate: `0 ${(1 - s) * 460}px`,
        }}
      >
        <div style={{ fontFamily: display, fontSize: 42, color: C.orange, paddingTop: 6 }}>{o.title}</div>
        <div style={{ position: "relative", height: 200, marginTop: 10 }}>
          <div style={{ position: "absolute", left: 0, top: 46, height: 8, width: W * line, background: C.ink, borderRadius: 8 }} />
          {items.map((it, k) => {
            const x = (k / Math.max(1, items.length - 1)) * (W - 300) + 150;
            const ap = spring({ frame: f - 18 - k * 9, fps, config: { damping: 12, stiffness: 170 } });
            return (
              <div key={k} style={{ position: "absolute", left: x, top: 22, translate: "-50% 0", textAlign: "center", width: 300, scale: ap, opacity: Math.min(1, ap * 1.4) }}>
                <div style={{ width: 54, height: 54, margin: "0 auto", borderRadius: 999, background: k === items.length - 1 ? C.red : C.orange, border: `6px solid ${C.ink}` }} />
                <div style={{ fontFamily: display, fontSize: 36, color: C.ink, marginTop: 10, paddingTop: 4 }}>{it[0]}</div>
                <div style={{ fontFamily: body, fontWeight: 800, fontSize: 25, color: "#5b4a33", lineHeight: 1.15 }}>{it[1]}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- stamp ----------------
export const Stamp: React.FC<{ o: Overlay }> = ({ o }) => {
  const { f, out } = useEnv(6, 10);
  const slam = interpolate(f, [0, 6], [2.4, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const op = interpolate(f, [0, 4], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: out, alignItems: "flex-end", justifyContent: "center", paddingRight: 140 }}>
      <div
        style={{
          fontFamily: display,
          fontSize: 92,
          color: C.red,
          border: `10px solid ${C.red}`,
          borderRadius: 20,
          padding: "16px 34px 4px",
          rotate: "-11deg",
          scale: slam,
          opacity: op * 0.92,
          background: "rgba(255,244,220,0.78)",
          letterSpacing: 3,
          boxShadow: "0 0 0 4px rgba(255,244,220,0.6)",
        }}
      >
        {o.text}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- year / big number ----------------
export const Year: React.FC<{ o: Overlay }> = ({ o }) => {
  const { f, fps, out } = useEnv(10, 12);
  const s = spring({ frame: f, fps, config: { damping: 12, stiffness: 150 } });
  const subIn = interpolate(f, [12, 24], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,6,2,0.6) 0%, rgba(10,6,2,0) 45%)" }} />
      <div style={{ position: "absolute", top: 50, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: display, fontSize: 170, color: C.amber, textShadow: outline(8), scale: 0.5 + 0.5 * s, lineHeight: 1 }}>
          {o.text}
        </div>
        <div
          style={{
            display: "inline-block",
            fontFamily: body,
            fontWeight: 900,
            fontSize: 40,
            color: C.ink,
            background: C.cream,
            border: `5px solid ${C.ink}`,
            borderRadius: 999,
            padding: "6px 28px",
            marginTop: 10,
            opacity: subIn,
            translate: `0 ${(1 - subIn) * 20}px`,
          }}
        >
          {o.sub}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- time comparison bars ----------------
export const Compare: React.FC = () => {
  const { f, fps, out } = useEnv(10, 14);
  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 120 } });
  const a = interpolate(f, [14, 70], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const b = interpolate(f, [70, 90], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const W = 1180;
  const row = (label: string, value: string, frac: number, p: number, color: string, minPx: number) => (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: body, fontWeight: 900, fontSize: 32, color: C.ink }}>
        <span>{label}</span>
        <span style={{ opacity: p }}>{value}</span>
      </div>
      <div style={{ width: W, height: 40, borderRadius: 12, border: `5px solid ${C.ink}`, background: "#e9d6ad", marginTop: 6, overflow: "hidden" }}>
        <div style={{ width: Math.max(minPx * p, W * frac * p), height: "100%", background: color }} />
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: out, justifyContent: "flex-end", alignItems: "center", paddingBottom: 70 }}>
      <div
        style={{
          background: C.cream,
          border: `6px solid ${C.ink}`,
          borderRadius: 28,
          boxShadow: `9px 10px 0 ${C.ink}`,
          padding: "22px 40px 30px",
          translate: `0 ${(1 - s) * 420}px`,
        }}
      >
        <div style={{ fontFamily: display, fontSize: 46, color: C.orange, paddingTop: 6 }}>PERBANDINGAN WAKTU</div>
        {row("Homo erectus di Jawa", "> 1.000.000 tahun", 1, a, C.orange, 0)}
        {row("Seluruh sejarah peradaban (sejak tulisan)", "± 5.000 tahun", 0.005, b, C.leaf, 10)}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- outro ----------------
export const Outro: React.FC<{ o: Overlay }> = ({ o }) => {
  const { f, fps, dur } = useEnv(20, 1);
  const bg = interpolate(f, [0, 24], [0, 0.78], clamp);
  const s = spring({ frame: f - 10, fps, config: { damping: 13, stiffness: 120 } });
  const fadeBlack = interpolate(f, [dur - 30, dur], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: `rgba(12,8,3,${bg})` }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: Math.min(1, s * 1.3) }}>
        <div style={{ fontFamily: display, fontSize: 104, color: C.cream, textShadow: outline(6), scale: 0.8 + 0.2 * s, textAlign: "center", lineHeight: 1.1 }}>
          TERIMA KASIH
          <br />
          SUDAH MENONTON
        </div>
        <div style={{ fontFamily: display, fontSize: 52, color: C.amber, textShadow: outline(4), marginTop: 24 }}>
          {o.text}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "black", opacity: fadeBlack }} />
    </AbsoluteFill>
  );
};
