// Vox-style building blocks: paper, grain, torn-edge photo cutouts with Ken Burns, handwritten notes with drawn
// arrows, stamps, label strips, captions. Everything is driven by absolute time t (seconds) for word sync.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { CAPTIONS, WORDS, ws, we } from "./timing";

export const C = {
  ink: "#1f1a15",
  paper: "#efe5cf",
  paperHi: "#f6eedc",
  red: "#c4372b",
  yellow: "#f4cf3a",
  ochre: "#c98a2b",
  sea: "#bccdc8",
  land: "#ede2c6",
  teal: "#2f6f73",
};
export const F = {
  head: "'PlayfairR', Georgia, serif",
  label: "'OswaldR', 'Inter', sans-serif",
  hand: "'CaveatR', cursive",
  cap: "'Inter', sans-serif",
};

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lin = (t: number, a: number, b: number) => clamp01((t - a) / Math.max(1e-6, b - a));
export const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const eout = (x: number) => 1 - Math.pow(1 - x, 3);
export const ein = (x: number) => x * x * x;
export const ease = (t: number, a: number, b: number) => eio(lin(t, a, b));
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
/** damped overshoot 0..1 (like a spring) starting at time a */
export const pop = (t: number, a: number, dur = 0.45, bounce = 0.35) => {
  const x = (t - a) / dur;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return 1 - Math.exp(-5 * x) * Math.cos(x * Math.PI * (1.2 + bounce * 2)) * (1 - x * 0.15);
};

export const rand = (seed: number) => {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

// ---------------------------------------------------------------- surfaces
export const Paper: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <AbsoluteFill style={{ backgroundColor: dark ? "#2f2822" : C.paper }}>
    <Img src={staticFile(dark ? "rempah/paper_dark.jpg" : "rempah/paper.jpg")} style={{ width: 1080, height: 1920 }} />
  </AbsoluteFill>
);

export const Grain: React.FC<{ amount?: number }> = ({ amount = 0.16 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: amount }}>
      <Img src={staticFile(`rempah/grain${f % 6}.png`)} style={{ width: 1080, height: 1920 }} />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{ k?: number }> = ({ k = 0.35 }) => (
  <AbsoluteFill style={{ pointerEvents: "none", background: `radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 55%, rgba(25,15,5,${k}) 100%)` }} />
);

/** clip-path polygon with torn edges for a w x h box */
export const tornPath = (w: number, h: number, seed: number, amp = 9, step = 16) => {
  const r = rand(seed);
  const pts: string[] = [];
  const j = () => r() * amp;
  for (let x = 0; x <= w; x += step) pts.push(`${x}px ${j()}px`);
  for (let y = step; y <= h; y += step) pts.push(`${w - j()}px ${y}px`);
  for (let x = w - step; x >= 0; x -= step) pts.push(`${x}px ${h - j()}px`);
  for (let y = h - step; y > 0; y -= step) pts.push(`${j()}px ${y}px`);
  return `polygon(${pts.join(",")})`;
};

export type Crop = { cx: number; cy: number; zw: number };
type Box = { x: number; y: number; w: number; h: number };

/** archival image as a torn paper cutout with a Ken Burns move between crops (image fractions) */
export const Photo: React.FC<{
  t: number;
  src: string;
  iw: number;
  ih: number;
  box: Box;
  rot?: number;
  keys: { t: number; c: Crop }[];
  enter?: number; // time of entrance (slides up + settles)
  seed?: number;
  border?: number;
  filter?: string;
  shadow?: boolean;
}> = ({ t, src, iw, ih, box, rot = 0, keys, enter, seed = 1, border = 16, filter, shadow = true }) => {
  // crop at time t
  let c = keys[0].c;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t >= a.t) {
      const k = ease(t, a.t, b.t);
      c = { cx: mix(a.c.cx, b.c.cx, k), cy: mix(a.c.cy, b.c.cy, k), zw: Math.exp(mix(Math.log(a.c.zw), Math.log(b.c.zw), k)) };
    }
  }
  const innerW = box.w - 2 * border, innerH = box.h - 2 * border;
  let scale = innerW / (c.zw * iw);
  scale = Math.max(scale, innerH / ih, innerW / iw);
  const vw = innerW / scale, vh = innerH / scale; // visible region in image px
  const cx = Math.min(Math.max(c.cx * iw, vw / 2), iw - vw / 2);
  const cy = Math.min(Math.max(c.cy * ih, vh / 2), ih - vh / 2);
  const left = innerW / 2 - cx * scale, top = innerH / 2 - cy * scale;
  const e = enter === undefined ? 1 : pop(t, enter, 0.5, 0.15);
  const dy = (1 - e) * 140, rr = rot + (1 - e) * 4;
  return (
    <div style={{ position: "absolute", left: box.x, top: box.y + dy, width: box.w, height: box.h, transform: `rotate(${rr}deg)`,
      filter: shadow ? "drop-shadow(0 18px 22px rgba(30,18,6,0.42))" : undefined, opacity: enter === undefined ? 1 : clamp01(e * 3) }}>
      <div style={{ position: "absolute", inset: 0, background: C.paperHi, clipPath: tornPath(box.w, box.h, seed) }}>
        <div style={{ position: "absolute", left: border, top: border, width: innerW, height: innerH, overflow: "hidden" }}>
          <Img src={staticFile(src)} style={{ position: "absolute", left, top, width: iw * scale, height: ih * scale, maxWidth: "none", filter: filter ?? "sepia(0.12) contrast(1.04)" }} />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- annotations
/** handwritten note revealed left-to-right like writing, optional drawn arrow */
export const Hand: React.FC<{
  t: number; at: number; x: number; y: number; text: string; size?: number; color?: string; rot?: number; width?: number;
  arrow?: { x1: number; y1: number; x2: number; y2: number; bend?: number }; until?: number; align?: "left" | "center";
  halo?: boolean; shade?: boolean;
}> = ({ t, at, x, y, text, size = 64, color = C.ink, rot = -3, width = 900, arrow, until, align = "left", halo, shade }) => {
  const k = lin(t, at, at + Math.min(0.9, 0.12 + text.length * 0.035));
  const out = until !== undefined ? 1 - lin(t, until, until + 0.2) : 1;
  if (k <= 0 || out <= 0) return null;
  let path = "";
  let head = "";
  let ka = 0;
  if (arrow) {
    const { x1, y1, x2, y2, bend = 0.25 } = arrow;
    const mx = (x1 + x2) / 2 - (y2 - y1) * bend, my = (y1 + y2) / 2 + (x2 - x1) * bend;
    path = `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
    const ang = Math.atan2(y2 - my, x2 - mx), L = 30;
    head = `M${x2 - L * Math.cos(ang - 0.45)},${y2 - L * Math.sin(ang - 0.45)} L${x2},${y2} L${x2 - L * Math.cos(ang + 0.45)},${y2 - L * Math.sin(ang + 0.45)}`;
    ka = lin(t, at + 0.15, at + 0.55);
  }
  const shadow = halo ? "0 0 14px rgba(246,238,220,0.95), 0 0 4px rgba(246,238,220,1)" : shade ? "0 3px 12px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.95)" : undefined;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      {arrow ? (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, filter: shade ? "drop-shadow(0 3px 6px rgba(0,0,0,0.85))" : undefined }}>
          {halo ? <path d={path} stroke="rgba(246,238,220,0.85)" strokeWidth={14} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${ka} 1`} /> : null}
          <path d={path} stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={`${ka} 1`} />
          {ka >= 1 ? <path d={head} stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
        </svg>
      ) : null}
      <div style={{ position: "absolute", left: align === "center" ? x - width / 2 : x, top: y, width, transform: `rotate(${rot}deg)`, transformOrigin: "left center",
        fontFamily: F.hand, fontWeight: 700, fontSize: size, color, lineHeight: 1.0, textAlign: align, textShadow: shadow,
        clipPath: `inset(-20% ${100 - k * 100}% -20% -5%)` }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};

/** rubber stamp that slams in */
export const Stamp: React.FC<{ t: number; at: number; x: number; y: number; text: string; size?: number; rot?: number; color?: string; font?: string; until?: number }> = ({
  t, at, x, y, text, size = 120, rot = -9, color = C.red, font = F.head, until,
}) => {
  if (t < at) return null;
  const k = lin(t, at, at + 0.13);
  const s = mix(2.1, 1, eout(k));
  const out = until !== undefined ? 1 - lin(t, until, until + 0.15) : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`, opacity: clamp01(k * 2) * 0.92 * out,
      border: `${Math.round(size * 0.07)}px solid ${color}`, outline: `${Math.round(size * 0.03)}px solid ${color}`, outlineOffset: Math.round(size * 0.06),
      padding: `${size * 0.02}px ${size * 0.18}px`, color, fontFamily: font, fontWeight: 900, fontSize: size, lineHeight: 1.05, whiteSpace: "nowrap",
      mixBlendMode: "multiply", letterSpacing: font === F.label ? 4 : 0 }}>
      {text}
    </div>
  );
};

/** uppercase label strip that wipes in */
export const Tag: React.FC<{ t: number; at: number; x: number; y: number; text: string; size?: number; bg?: string; fg?: string; rot?: number; until?: number; anchor?: "left" | "center" }> = ({
  t, at, x, y, text, size = 44, bg = C.ink, fg = C.paperHi, rot = -2, until, anchor = "left",
}) => {
  const k = eout(lin(t, at, at + 0.25));
  const out = until !== undefined ? 1 - lin(t, until, until + 0.18) : 1;
  if (k <= 0 || out <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${anchor === "center" ? "-50%" : "0"}) rotate(${rot}deg)`, opacity: out,
      clipPath: `inset(0 ${100 - k * 100}% 0 0)`, background: bg, color: fg, fontFamily: F.label, fontWeight: 700, fontSize: size, letterSpacing: size * 0.06,
      padding: `${size * 0.14}px ${size * 0.35}px`, whiteSpace: "nowrap", boxShadow: "0 6px 12px rgba(0,0,0,0.25)" }}>
      {text}
    </div>
  );
};

/** small archival source line */
export const Source: React.FC<{ t: number; at: number; x: number; y: number; text: string; color?: string }> = ({ t, at, x, y, text, color = "rgba(31,26,21,0.75)" }) => {
  const k = lin(t, at, at + 0.3);
  if (k <= 0) return null;
  return <div style={{ position: "absolute", left: x, top: y, opacity: k, fontFamily: F.label, fontWeight: 500, fontSize: 26, letterSpacing: 2.5, color }}>{text}</div>;
};

export const AiTag: React.FC = () => (
  <div style={{ position: "absolute", left: 56, top: 200, background: "rgba(20,16,12,0.55)", color: "rgba(255,250,240,0.92)", fontFamily: F.label, fontWeight: 500,
    fontSize: 24, letterSpacing: 3, padding: "6px 14px", borderRadius: 4 }}>
    ILUSTRASI AI
  </div>
);

// ---------------------------------------------------------------- captions
export const Captions: React.FC<{ t: number }> = ({ t }) => {
  let idx = -1;
  for (let i = 0; i < CAPTIONS.length; i++) {
    const [a, b] = CAPTIONS[i];
    const next = i + 1 < CAPTIONS.length ? ws(CAPTIONS[i + 1][0]) : Infinity;
    const end = Math.min(next, we(b) + 0.5);
    if (t >= ws(a) - 0.05 && t < end) idx = i;
  }
  if (idx < 0) return null;
  const [a, b, text] = CAPTIONS[idx];
  // spread display tokens over spoken words proportionally to the word range
  const toks = text.split(" ");
  const n = b - a + 1;
  const tokStart = toks.map((_, j) => ws(a + Math.min(n - 1, Math.floor((j * n) / toks.length))));
  const k = pop(t, ws(a) - 0.05, 0.25, 0.1);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 1478, display: "flex", justifyContent: "center" }}>
      <div style={{ textAlign: "center", fontFamily: F.cap, fontWeight: 800, fontSize: 66, lineHeight: 1.12, letterSpacing: -0.5,
        transform: `scale(${0.92 + 0.08 * k})`, opacity: clamp01(k * 2) }}>
        {toks.map((w, j) => {
          const on = t >= tokStart[j] - 0.03;
          const cur = on && (j === toks.length - 1 || t < tokStart[j + 1] - 0.03);
          return (
            <span key={j} style={{ display: "inline-block", marginRight: j < toks.length - 1 ? "0.26em" : 0, color: cur ? "#ffd43b" : "#fff",
              WebkitTextStroke: "11px #15110d", paintOrder: "stroke fill", textShadow: "0 5px 10px rgba(0,0,0,0.35)" }}>
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const wordTimesOk = () => WORDS.length;
