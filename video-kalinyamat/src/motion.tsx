import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Icon } from "./icons";
import type { Overlay } from "./types";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const INK = "#1c1712";
const CREAM = "#fff4dc";

const useOut = (n = 8) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(f, [durationInFrames - n, durationInFrames], [1, 0], clamp);
};

const Badge: React.FC<{ name: string; size?: number; glow?: boolean; f: number }> = ({ name, size = 150, glow, f }) => (
  <div style={{ position: "relative", width: size, height: size }}>
    {glow ? (
      <div
        style={{
          position: "absolute",
          inset: -size * 0.28,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(255,214,90,0.75) 0%, rgba(255,214,90,0) 65%)",
          scale: 0.9 + 0.12 * Math.sin(f / 6),
        }}
      />
    ) : null}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 999,
        background: CREAM,
        border: `6px solid ${INK}`,
        boxShadow: `6px 7px 0 ${INK}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={name} size={size * 0.72} />
    </div>
  </div>
);

// ---------------- row of popping icon badges ----------------
export const IconsRow: React.FC<{ o: Overlay }> = ({ o }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut();
  const names = o.icons ?? [];
  const size = 150;
  const gap = 34;
  const total = names.length * size + (names.length - 1) * gap;
  const slot = o.slot ?? "tr";
  const top = slot.startsWith("b") ? 1080 - 70 - size : 70;
  const left = slot.endsWith("l") ? 80 : slot.endsWith("c") ? (1920 - total) / 2 : 1920 - 80 - total;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div style={{ position: "absolute", top, left, display: "flex", gap }}>
        {names.map((n, k) => {
          const d = Math.round((o.stagger ?? 0.45) * fps * k);
          const p = spring({ frame: f - d, fps, config: { damping: 9, stiffness: 190, mass: 0.6 } });
          const bob = Math.sin((f - d) / 10 + k) * 5;
          return (
            <div key={k} style={{ scale: p, rotate: `${(1 - p) * -40}deg`, translate: `0 ${bob}px`, opacity: f >= d ? 1 : 0 }}>
              <Badge name={n} size={size} glow={o.glow} f={f} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- fleet of ships sailing across the bottom ----------------
export const Fleet: React.FC<{ o: Overlay }> = ({ o }) => {
  const f = useCurrentFrame();
  const out = useOut(12);
  const n = o.count ?? 8;
  const size = o.big ? 200 : 120;
  const rows = n > 12 ? 2 : 1;
  const perRow = Math.ceil(n / rows);
  const spacing = o.big ? 230 : 150;
  return (
    <AbsoluteFill style={{ opacity: out, pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, k) => {
        const row = Math.floor(k / perRow);
        const col = k % perRow;
        const speed = o.big ? 9 : 11 + row * 2;
        const x = -260 + f * speed - col * spacing - row * 70;
        const y = (o.big ? 820 : 900) - row * 120 + Math.sin(f / 9 + k) * 6;
        return (
          <div key={k} style={{ position: "absolute", left: x, top: y - size, rotate: `${Math.sin(f / 12 + k) * 4}deg`, filter: "drop-shadow(4px 5px 0 rgba(28,23,18,0.55))" }}>
            <Icon name="ship" size={size} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- icons flying in from the edges to one point ----------------
export const Converge: React.FC<{ o: Overlay }> = ({ o }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut();
  const cx = (o.x ?? 0.5) * 1920;
  const cy = (o.y ?? 0.4) * 1080;
  const starts = [[-150, 120], [2070, 160], [-150, 980], [2070, 940]];
  const names = o.icons ?? [];
  const meet = spring({ frame: f - names.length * 8 - 40, fps, config: { damping: 10 } });
  return (
    <AbsoluteFill style={{ opacity: out }}>
      {names.map((n, k) => {
        const p = interpolate(f, [k * 8, k * 8 + 45], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
        const [sx, sy] = starts[k % 4];
        const ang = (k / names.length) * Math.PI * 2;
        const tx = cx + Math.cos(ang) * 120;
        const ty = cy + Math.sin(ang) * 80;
        return (
          <div key={k} style={{ position: "absolute", left: sx + (tx - sx) * p - 60, top: sy + (ty - sy) * p - 60 }}>
            <Badge name={n} size={120} f={f} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: cx - 70, top: cy - 70, scale: meet, opacity: meet }}>
        <Badge name="coins" size={140} glow f={f} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------- crowd of small icons ----------------
export const Swarm: React.FC<{ o: Overlay }> = ({ o }) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = useOut();
  const n = o.count ?? 40;
  const span = Math.max(10, durationInFrames * 0.55);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      {Array.from({ length: n }, (_, k) => {
        const d = Math.floor((k / n) * span);
        const p = spring({ frame: f - d, fps, config: { damping: 9, stiffness: 220, mass: 0.5 } });
        const x = 140 + random(`sx${k}`) * 1640;
        const y = 560 + random(`sy${k}`) * 380;
        return (
          <div key={k} style={{ position: "absolute", left: x - 48, top: y - 48, scale: p, opacity: f >= d ? 1 : 0 }}>
            <Badge name={o.icon ?? "people"} size={96} f={f} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- cannon-fire explosions ----------------
export const Bursts: React.FC<{ o: Overlay }> = ({ o }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const n = o.count ?? 6;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, k) => {
        const t0 = Math.floor((k / n) * (durationInFrames - 24));
        const lf = f - t0;
        if (lf < 0 || lf > 26) return null;
        const x = 200 + random(`bx${k}`) * 1520;
        const y = 160 + random(`by${k}`) * 520;
        const sc = interpolate(lf, [0, 5, 26], [0.2, 1.15, 0.9], clamp);
        const op = interpolate(lf, [0, 3, 18, 26], [0, 1, 1, 0], clamp);
        const size = 150 + random(`bs${k}`) * 90;
        return (
          <div key={k} style={{ position: "absolute", left: x - size / 2, top: y - size / 2, scale: sc, opacity: op, rotate: `${random(`br${k}`) * 40 - 20}deg` }}>
            <Icon name="burst" size={size} />
            <div style={{ position: "absolute", left: size * 0.1, top: -size * 0.25 - lf * 2, width: size * 0.8, height: size * 0.8, borderRadius: 999, background: "rgba(90,90,90,0.45)", opacity: interpolate(lf, [6, 26], [0, 0.8], clamp), scale: 0.6 + lf / 30 }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- row of icons that get crossed out one by one ----------------
export const Crossout: React.FC<{ o: Overlay }> = ({ o }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut();
  const n = o.count ?? 3;
  const size = n > 4 ? 130 : 160;
  const gap = 30;
  const total = n * size + (n - 1) * gap;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div style={{ position: "absolute", top: 70, left: (1920 - total) / 2, display: "flex", gap }}>
        {Array.from({ length: n }, (_, k) => {
          const pop = spring({ frame: f - k * 3, fps, config: { damping: 10, stiffness: 200 } });
          const xd = 18 + k * Math.round((n > 4 ? 0.55 : 1.0) * fps);
          const xs = spring({ frame: f - xd, fps, config: { damping: 8, stiffness: 260 } });
          return (
            <div key={k} style={{ position: "relative", scale: pop }}>
              <div style={{ opacity: f > xd ? 0.55 : 1 }}>
                <Badge name={o.icon ?? "ship"} size={size} f={f} />
              </div>
              <div style={{ position: "absolute", inset: 0, scale: f > xd ? 1.4 - 0.4 * xs : 0, opacity: f > xd ? 1 : 0 }}>
                <Icon name="xmark" size={size} />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- heart that cracks in two ----------------
export const Heartbreak: React.FC<{ o: Overlay }> = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = useOut(10);
  const pop = spring({ frame: f, fps, config: { damping: 9, stiffness: 160 } });
  const crack = Math.round(durationInFrames * 0.35);
  const split = interpolate(f, [crack, crack + 18], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const size = 230;
  const half = (side: number) => (
    <div style={{ position: "absolute", inset: 0, clipPath: side < 0 ? "polygon(0 0, 52% 0, 44% 30%, 56% 50%, 46% 72%, 50% 100%, 0 100%)" : "polygon(52% 0, 100% 0, 100% 100%, 50% 100%, 46% 72%, 56% 50%, 44% 30%)", translate: `${side * split * 40}px ${split * split * 120}px`, rotate: `${side * split * 18}deg` }}>
      <Icon name="heart" size={size} />
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div style={{ position: "absolute", left: 1920 - 80 - size, top: 60, width: size, height: size, scale: pop }}>
        {half(-1)}
        {half(1)}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- hourglass with running sand ----------------
export const Hourglass: React.FC<{ o: Overlay }> = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = useOut();
  const pop = spring({ frame: f, fps, config: { damping: 10, stiffness: 160 } });
  const flip = interpolate(f, [4, 20], [180, 0], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const p = interpolate(f, [20, durationInFrames - 8], [0, 1], clamp);
  const size = 200;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div style={{ position: "absolute", left: 1920 - 80 - size, top: 60, scale: pop, rotate: `${flip}deg` }}>
        <div style={{ width: size, height: size, borderRadius: 999, background: CREAM, border: `6px solid ${INK}`, boxShadow: `6px 7px 0 ${INK}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="-6 -6 112 112" width={size * 0.74} height={size * 0.74}>
            <path d={`M${50 - 18 * (1 - p)} ${48 - 26 * (1 - p)} H${50 + 18 * (1 - p)} L50 50 Z`} fill="#e7b35a" />
            <path d={`M${50 - 20 * Math.sqrt(p)} 86 H${50 + 20 * Math.sqrt(p)} L50 ${86 - 30 * p} Z`} fill="#e7b35a" />
            {p > 0 && p < 1 ? <path d="M50 50 V86" stroke="#e7b35a" strokeWidth={3} strokeDasharray="4 4" strokeDashoffset={-f} /> : null}
            <path d="M20 10 H80 M20 90 H80" stroke={INK} strokeWidth={6} strokeLinecap="round" />
            <path d="M28 12 Q28 40 50 50 Q72 40 72 12 Z M28 88 Q28 60 50 50 Q72 60 72 88 Z" fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- crown dropping into place ----------------
export const CrownDrop: React.FC<{ o: Overlay }> = ({ o }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = useOut();
  const drop = spring({ frame: f, fps, config: { damping: 7, stiffness: 120, mass: 0.8 } });
  const x = (o.x ?? 0.5) * 1920;
  const y = (o.y ?? 0.25) * 1080;
  const size = 190;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2 - (1 - drop) * 600, rotate: `${(1 - drop) * -25}deg`, filter: "drop-shadow(6px 7px 0 rgba(28,23,18,0.6))" }}>
        <Icon name="crown" size={size} />
      </div>
      {Array.from({ length: 6 }, (_, k) => {
        const lf = f - 14 - k * 3;
        if (lf < 0 || lf > 24) return null;
        const a = (k / 6) * Math.PI * 2;
        const r = 90 + lf * 6;
        return (
          <div key={k} style={{ position: "absolute", left: x + Math.cos(a) * r - 26, top: y + Math.sin(a) * r * 0.7 - 26, opacity: interpolate(lf, [0, 24], [1, 0], clamp), scale: 0.6 + lf / 40 }}>
            <Icon name="sparkle" size={52} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------- the fleet arriving at the fortress ----------------
export const Arrival: React.FC<{ o: Overlay }> = () => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const out = useOut();
  const fort = spring({ frame: f, fps, config: { damping: 10, stiffness: 150 } });
  const p = interpolate(f, [6, durationInFrames * 0.7], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const x0 = 1100;
  const x1 = 1610;
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <svg width="1920" height="1080" style={{ position: "absolute" }}>
        <path d={`M${x0} 150 L${x0 + (x1 - x0 - 120) * p} 150`} stroke={INK} strokeWidth={6} strokeDasharray="14 12" fill="none" />
      </svg>
      <div style={{ position: "absolute", left: x0 - 75 + (x1 - x0 - 150) * p, top: 75, rotate: `${Math.sin(f / 8) * 4}deg` }}>
        <Badge name="ship" size={150} f={f} />
      </div>
      <div style={{ position: "absolute", left: x1, top: 70, scale: fort }}>
        <Badge name="fortress" size={160} f={f} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------- in-picture: map pin ----------------
export const MapPin: React.FC<{ o: Overlay; localFrom: number }> = ({ o, localFrom }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - localFrom;
  const dur = Math.round(o.dur * fps);
  if (f < 0 || f > dur) return null;
  const drop = spring({ frame: f, fps, config: { damping: 8, stiffness: 170 } });
  const out = interpolate(f, [dur - 8, dur], [1, 0], clamp);
  const ring = (f % 36) / 36;
  return (
    <div style={{ position: "absolute", left: `${(o.x ?? 0.5) * 100}%`, top: `${(o.y ?? 0.5) * 100}%`, opacity: out }}>
      <div style={{ position: "absolute", left: -60 * (0.4 + ring), top: -22 * (0.4 + ring), width: 120 * (0.4 + ring), height: 44 * (0.4 + ring), borderRadius: 999, border: `5px solid rgba(200,53,43,${1 - ring})` }} />
      <div style={{ position: "absolute", left: -55, top: -110 - (1 - drop) * 300, filter: "drop-shadow(4px 5px 0 rgba(28,23,18,0.6))" }}>
        <Icon name="pin" size={110} />
      </div>
    </div>
  );
};

// ---------------- in-picture: dotted route with a sailing ship ----------------
export const Route: React.FC<{ o: Overlay; localFrom: number }> = ({ o, localFrom }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - localFrom;
  const dur = Math.round(o.dur * fps);
  if (f < 0 || f > dur) return null;
  const pts = (o.points ?? []).map(([x, y]) => [x * 1920, y * 1080]);
  if (pts.length < 2) return null;
  const segs = pts.slice(1).map((p, k) => Math.hypot(p[0] - pts[k][0], p[1] - pts[k][1]));
  const L = segs.reduce((a, b) => a + b, 0);
  const p = interpolate(f, [0, Math.min(dur - 10, 2.2 * fps)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  let d = p * L;
  let pos = pts[0];
  let ang = 0;
  const partial: number[][] = [pts[0]];
  for (let k = 0; k < segs.length; k++) {
    const a = pts[k];
    const b = pts[k + 1];
    ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    if (d <= segs[k]) {
      pos = [a[0] + (b[0] - a[0]) * (d / segs[k]), a[1] + (b[1] - a[1]) * (d / segs[k])];
      partial.push(pos);
      break;
    }
    d -= segs[k];
    pos = b;
    partial.push(b);
  }
  const out = interpolate(f, [dur - 8, dur], [1, 0], clamp);
  const path = "M" + partial.map((q) => `${q[0]} ${q[1]}`).join(" L");
  const end = pts[pts.length - 1];
  const endPop = spring({ frame: f - Math.min(dur - 10, 2.2 * fps), fps, config: { damping: 9 } });
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out }}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <path d={path} fill="none" stroke="#fff4dc" strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" />
        <path d={path} fill="none" stroke="#c8352b" strokeWidth={7} strokeLinecap="round" strokeDasharray="16 14" />
        <circle cx={pts[0][0]} cy={pts[0][1]} r={12} fill="#c8352b" stroke={INK} strokeWidth={4} />
        <circle cx={end[0]} cy={end[1]} r={16 * endPop} fill="#f2b632" stroke={INK} strokeWidth={4} />
      </svg>
      <div style={{ position: "absolute", left: pos[0] - 45, top: pos[1] - 80, scale: `${Math.cos(ang) < 0 ? -1 : 1} 1`, filter: "drop-shadow(3px 4px 0 rgba(28,23,18,0.6))" }}>
        <Icon name="ship" size={90} />
      </div>
    </div>
  );
};
