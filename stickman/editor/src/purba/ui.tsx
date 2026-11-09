// Motion-graphic building blocks for the vertical (9:16) ice-age short.
// Visual language follows the story: frost/ice for cold scenes, ember/amber for fire
// and cave scenes, cracked ice + red for danger, stone tablets for the survival keys.
import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";

export const FONT = "Lilita One";
loadFont({ family: FONT, url: staticFile("fonts/lilita.ttf") });

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------- themes ----------
export type Mood = "cold" | "warm" | "danger" | "hope";
export const THEME: Record<Mood, { text: string; active: string; stroke: string; glow: string }> = {
  cold: { text: "#ffffff", active: "#8fe3ff", stroke: "#0c2740", glow: "rgba(140,220,255,0.75)" },
  warm: { text: "#fff1d6", active: "#ffb22e", stroke: "#2b1306", glow: "rgba(255,150,40,0.8)" },
  danger: { text: "#ffffff", active: "#ff4a3d", stroke: "#1a0606", glow: "rgba(255,60,40,0.7)" },
  hope: { text: "#fff6dc", active: "#ffd23f", stroke: "#2b1a04", glow: "rgba(255,210,80,0.8)" },
};
const outline = (w: number, c: string): React.CSSProperties => ({ WebkitTextStroke: `${w}px ${c}`, paintOrder: "stroke fill" });
// irregular "pebble" corners for stone shapes
const PEBBLE = "46% 54% 42% 58% / 55% 45% 58% 42%";

// ---------- atmosphere ----------
export const Snow: React.FC<{ count?: number; wind?: number }> = ({ count = 140, wind = 1 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(count).fill(0).map((_, i) => {
        const near = random(`n${i}`) > 0.8;
        const size = near ? 10 + random(`s${i}`) * 10 : 3 + random(`s${i}`) * 5;
        const speed = near ? 9 + random(`v${i}`) * 6 : 3 + random(`v${i}`) * 3;
        const y = ((random(`y${i}`) * (height + 200) + frame * speed) % (height + 200)) - 100;
        const x = ((random(`x${i}`) * (width + 400) + frame * speed * 0.55 * wind + Math.sin(frame / 20 + i) * 20) % (width + 400)) - 200;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: size, background: "white", opacity: near ? 0.75 : 0.85, filter: near ? "blur(3px)" : undefined }} />
        );
      })}
    </AbsoluteFill>
  );
};

export const Embers: React.FC<{ count?: number }> = ({ count = 40 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(count).fill(0).map((_, i) => {
        const speed = 2 + random(`ev${i}`) * 4;
        const y = height - (((random(`ey${i}`) * height + frame * speed) % height));
        const x = random(`ex${i}`) * width + Math.sin(frame / 12 + i) * 30;
        const s = 4 + random(`es${i}`) * 6;
        const life = (height - y) / height;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: s, background: "#ffb44a", boxShadow: "0 0 10px #ff7a1a", opacity: Math.max(0, 1 - life * 1.1) }} />;
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

export const Warm: React.FC = () => {
  const frame = useCurrentFrame();
  const flick = 0.85 + 0.15 * Math.sin(frame / 3.1) * Math.sin(frame / 5.3);
  return <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 70%, rgba(255,150,40,0.35) 0%, rgba(255,120,20,0) 60%)", opacity: flick, mixBlendMode: "screen" }} />;
};

export const Vignette: React.FC = () => <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)" }} />;

// ---------- helpers ----------
export const Pop: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties; from?: number }> = ({ delay = 0, children, style, from = 0.3 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 11, stiffness: 190 } });
  return <div style={{ transform: `scale(${from + (1 - from) * s})`, opacity: frame < delay ? 0 : Math.min(1, s * 2), ...style }}>{children}</div>;
};
const Lane: React.FC<{ top: number; children: React.ReactNode }> = ({ top, children }) => (
  <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>{children}</div>
);

// ---------- pictograms (simple, story-specific) ----------
export type IconName = "pelt" | "cave" | "fire" | "meat" | "group" | "warmth" | "wet" | "alone";
export const Icon: React.FC<{ name: IconName; size?: number; color?: string }> = ({ name, size = 70, color = "#2b1306" }) => {
  const c = color;
  const common = { width: size, height: size, viewBox: "0 0 64 64" };
  switch (name) {
    case "pelt":
      return (<svg {...common}><path d="M10 14 L20 8 L32 12 L44 8 L54 14 L50 24 L56 34 L48 40 L52 52 L40 50 L32 58 L24 50 L12 52 L16 40 L8 34 L14 24 Z" fill={c} /><path d="M26 18 L32 30 L38 18" fill="none" stroke="#f3e2c4" strokeWidth="4" /></svg>);
    case "cave":
      return (<svg {...common}><path d="M4 56 L14 26 L28 12 L40 14 L52 28 L60 56 Z" fill={c} /><path d="M20 56 Q22 34 32 32 Q42 34 44 56 Z" fill="#f3a63a" /></svg>);
    case "fire":
      return (<svg {...common}><path d="M32 6 C40 20 50 26 48 40 C47 52 38 58 32 58 C24 58 15 52 16 40 C17 30 24 26 26 16 C30 24 32 26 34 26 C35 18 33 12 32 6 Z" fill={c} /><path d="M32 30 C36 38 40 40 39 47 C38 53 35 55 32 55 C28 55 25 52 25 47 C25 42 29 38 32 30 Z" fill="#ffe08a" /></svg>);
    case "meat":
      return (<svg {...common}><ellipse cx="26" cy="28" rx="18" ry="16" fill={c} /><rect x="36" y="38" width="8" height="18" rx="3" transform="rotate(-40 40 47)" fill="#f3e2c4" /><circle cx="50" cy="52" r="5" fill="#f3e2c4" /><circle cx="54" cy="46" r="5" fill="#f3e2c4" /></svg>);
    case "group":
      return (<svg {...common}>{[14, 32, 50].map((x, i) => (<g key={i}><circle cx={x} cy={i === 1 ? 20 : 24} r="8" fill={c} /><rect x={x - 7} y={i === 1 ? 30 : 34} width="14" height="22" rx="6" fill={c} /></g>))}</svg>);
    case "warmth":
      return (<svg {...common}><path d="M32 56 L10 34 C2 26 6 12 18 12 C24 12 28 16 32 20 C36 16 40 12 46 12 C58 12 62 26 54 34 Z" fill={c} /></svg>);
    case "wet":
      return (<svg {...common}><path d="M32 6 C40 20 50 30 50 40 C50 50 42 58 32 58 C22 58 14 50 14 40 C14 30 24 20 32 6 Z" fill={c} /></svg>);
    case "alone":
      return (<svg {...common}><circle cx="20" cy="24" r="8" fill={c} /><rect x="13" y="34" width="14" height="22" rx="6" fill={c} /><circle cx="50" cy="20" r="5" fill={c} opacity="0.35" /><rect x="46" y="27" width="8" height="14" rx="4" fill={c} opacity="0.35" /></svg>);
  }
};

// ---------- hook ----------
export const Hook: React.FC<{ top: number; jaketAt: number; sepatuAt: number }> = ({ top, jaketAt, sepatuAt }) => {
  const frame = useCurrentFrame();
  const t = THEME.cold;
  const v = Math.round(interpolate(frame, [0, 40], [0, -30], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const shake = frame > 38 && frame < 52 ? (random(`h${frame}`) - 0.5) * 16 : 0;
  const ice = interpolate(frame, [36, 50], [0, 1], clamp);
  const tag = (label: string, at: number) => {
    const strike = interpolate(frame, [at + 6, at + 14], [0, 1], clamp);
    return (
      <Pop delay={at}>
        <div style={{ position: "relative", fontFamily: FONT, fontSize: 60, color: "#f3e2c4", background: "#5a3417", padding: "6px 30px", borderRadius: PEBBLE, border: "5px solid #2b1306", ...outline(4, "#2b1306") }}>
          {label}
          <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
            <line x1="6" y1="34" x2={6 + 88 * strike} y2={34 - 28 * strike} stroke="#ff4a3d" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>
      </Pop>
    );
  };
  return (
    <Lane top={top}>
      <div style={{ fontFamily: FONT, fontSize: 250, lineHeight: 1, color: t.active, ...outline(18, t.stroke), transform: `translateX(${shake}px)`, textShadow: `0 0 40px ${t.glow}, 0 12px 0 ${t.stroke}` }}>{v}°C</div>
      {/* icicles hanging from the number */}
      <svg width="560" height="70" viewBox="0 0 560 70" style={{ marginTop: -18, opacity: ice }}>
        {[30, 90, 140, 210, 260, 330, 390, 450, 510].map((x, i) => (
          <path key={i} d={`M${x - 14} 0 L${x + 14} 0 L${x} ${30 + ((i * 37) % 40) * ice}`} fill="#dff6ff" stroke={t.stroke} strokeWidth="4" />
        ))}
      </svg>
      <div style={{ display: "flex", gap: 26, marginTop: 10 }}>
        {tag("JAKET", jaketAt)}
        {tag("SEPATU", sepatuAt)}
      </div>
    </Lane>
  );
};

// stone-shaped stamp
export const Stamp: React.FC<{ top: number; text: string; mood: Mood; delay?: number; size?: number }> = ({ top, text, mood, delay = 0, size = 110 }) => {
  const frame = useCurrentFrame();
  const f = frame - delay;
  const t = THEME[mood];
  const s = interpolate(f, [0, 6], [2.4, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <Lane top={top}>
      <div style={{ opacity: f < 0 ? 0 : 1, transform: `scale(${s}) rotate(-5deg)`, fontFamily: FONT, fontSize: size, color: t.active, background: "linear-gradient(160deg,#6b6158,#3c352f)", border: `8px solid ${t.stroke}`, borderRadius: PEBBLE, padding: "4px 44px", ...outline(10, t.stroke), boxShadow: `0 0 30px ${t.glow}` }}>
        {text}
      </div>
    </Lane>
  );
};

// Survival bar: six stone tiles with pictograms that light up as each tip is mentioned
export const SurvivalBar: React.FC<{ top: number; items: { icon: IconName; label: string; at: number }[] }> = ({ top, items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lit = items.filter((it) => frame >= it.at).length;
  return (
    <Lane top={top}>
      <div style={{ display: "flex", gap: 12 }}>
        {items.map((it, i) => {
          const on = frame >= it.at;
          const s = on ? spring({ frame: frame - it.at, fps, config: { damping: 9, stiffness: 200 } }) : 0;
          return (
            <div key={i} style={{ width: 104, height: 104, borderRadius: PEBBLE, background: on ? "linear-gradient(160deg,#ffcf6a,#e8892a)" : "linear-gradient(160deg,#5d564f,#36302b)", border: "5px solid #2b1306", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.25 * s * (i === lit - 1 ? Math.max(0, 1 - (frame - it.at) / 20) : 0)})`, boxShadow: on ? "0 0 22px rgba(255,150,40,0.85)" : "none", opacity: on ? 1 : 0.75 }}>
              <Icon name={it.icon} size={70} color={on ? "#2b1306" : "#8b8178"} />
            </div>
          );
        })}
      </div>
    </Lane>
  );
};

// Danger card: cracked-ice slab with a red cross
export const DangerCard: React.FC<{ top: number; icon: IconName; label: string; delay: number }> = ({ top, icon, label, delay }) => {
  const frame = useCurrentFrame();
  const j = frame - delay < 10 && frame >= delay ? (random(`d${frame}`) - 0.5) * 12 : 0;
  const crack = interpolate(frame, [delay, delay + 8], [0, 1], clamp);
  return (
    <Lane top={top}>
      <Pop delay={delay} from={0.5}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 20, padding: "14px 38px 14px 18px", background: "linear-gradient(160deg,rgba(225,245,255,0.95),rgba(150,205,235,0.95))", border: "6px solid #0c2740", borderRadius: 18, transform: `translateX(${j}px) rotate(-2deg)` }}>
          <div style={{ position: "relative", width: 88, height: 88, borderRadius: 44, background: "#0c2740", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={icon} size={60} color="#8fe3ff" />
            <svg width="88" height="88" viewBox="0 0 88 88" style={{ position: "absolute", inset: 0 }}>
              <line x1="18" y1="18" x2="70" y2="70" stroke="#ff4a3d" strokeWidth="9" strokeLinecap="round" />
              <line x1="70" y1="18" x2="18" y2="70" stroke="#ff4a3d" strokeWidth="9" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ fontFamily: FONT, fontSize: 70, color: "#ff4a3d", ...outline(10, "#1a0606") }}>{label}</div>
          <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, opacity: crack }}>
            <path d="M62 0 L58 12 L66 18 L60 30 L63 40" fill="none" stroke="#ffffff" strokeWidth="1.2" />
            <path d="M66 18 L78 22 L84 16" fill="none" stroke="#ffffff" strokeWidth="1" />
          </svg>
        </div>
      </Pop>
    </Lane>
  );
};

// Three keys as carved stone tablets
export const KeyTablets: React.FC<{ top: number; items: { icon: IconName; label: string; at: number }[] }> = ({ top, items }) => {
  const frame = useCurrentFrame();
  return (
    <Lane top={top}>
      <Pop>
        <div style={{ fontFamily: FONT, fontSize: 64, color: "#ffd23f", ...outline(11, "#2b1a04"), textShadow: "0 0 24px rgba(255,190,60,0.8)", marginBottom: 12 }}>3 KUNCI BERTAHAN</div>
      </Pop>
      <div style={{ display: "flex", gap: 16 }}>
        {items.map((it, i) => {
          const on = frame >= it.at;
          return (
            <Pop key={i} delay={on ? it.at : 0} from={on ? 0.4 : 1}>
              <div style={{ width: 290, padding: "12px 0 10px", borderRadius: PEBBLE, background: on ? "linear-gradient(160deg,#8a7d70,#4a423b)" : "linear-gradient(160deg,#4d4640,#2e2925)", border: `6px solid ${on ? "#ffb22e" : "#2b1306"}`, boxShadow: on ? "0 0 26px rgba(255,170,50,0.85)" : "none", display: "flex", flexDirection: "column", alignItems: "center", opacity: on ? 1 : 0.55 }}>
                <Icon name={it.icon} size={84} color={on ? "#ffb22e" : "#6d645b"} />
                <div style={{ fontFamily: FONT, fontSize: it.label.length > 10 ? 40 : 50, color: on ? "#fff1d6" : "#8b8178", ...outline(7, "#2b1306") }}>{it.label}</div>
              </div>
            </Pop>
          );
        })}
      </div>
    </Lane>
  );
};

// Thermometer pill (top-right corner, outside characters)
export const TempPill: React.FC<{ danger: boolean }> = ({ danger }) => {
  const frame = useCurrentFrame();
  const pulse = danger ? 0.6 + 0.4 * Math.abs(Math.sin(frame / 6)) : 1;
  const c = danger ? "#ff4a3d" : "#8fe3ff";
  return (
    <div style={{ position: "absolute", top: 120, right: 50, display: "flex", alignItems: "center", gap: 10, background: "rgba(8,14,24,0.7)", border: `4px solid ${c}`, borderRadius: 40, padding: "4px 20px 4px 10px", opacity: pulse }}>
      <svg width="30" height="56" viewBox="0 0 34 64"><rect x="11" y="4" width="12" height="40" rx="6" fill="none" stroke="white" strokeWidth="4" /><circle cx="17" cy="50" r="10" fill={c} stroke="white" strokeWidth="4" /><rect x="15" y="30" width="4" height="16" fill={c} /></svg>
      <span style={{ fontFamily: FONT, fontSize: 44, color: "white" }}>-30°C</span>
    </div>
  );
};

// TikTok-style captions, themed and positioned per shot
export type Word = { w: string; from: number; to: number; shot: number };
export const Captions: React.FC<{ words: Word[]; layout: (shot: number) => { top: number; mood: Mood } }> = ({ words, layout }) => {
  const frame = useCurrentFrame();
  const groups: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    if (cur.length === 3 || /[,.?!]$/.test(w.w) || (next && next.shot !== w.shot)) {
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
  const { top, mood } = layout(g[0].shot);
  const t = THEME[mood];
  const jitter = mood === "danger" ? (random(`cj${Math.floor(frame / 2)}`) - 0.5) * 4 : 0;
  return (
    <Lane top={top}>
      <Pop delay={g[0].from} from={0.75}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 30, maxWidth: 960, transform: `translateX(${jitter}px)` }}>
          {g.map((w, i) => {
            const active = frame >= w.from;
            const speaking = frame >= w.from && frame < w.to + 3;
            return (
              <span key={i} style={{ fontFamily: FONT, fontSize: 86, lineHeight: 1.08, color: active ? t.active : t.text, ...outline(11, t.stroke), textShadow: `0 7px 0 ${t.stroke}${speaking ? `, 0 0 26px ${t.glow}` : ""}`, transform: `scale(${speaking ? 1.08 : 1})`, display: "inline-block" }}>
                {w.w.replace(/[,.]$/, "").toUpperCase()}
              </span>
            );
          })}
        </div>
      </Pop>
    </Lane>
  );
};
