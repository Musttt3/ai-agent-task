// "Dugaan Penyadapan Presiden. Siapa Mengawasi Orang yang Punya Kuasa?" — 9:16 TikTok explainer, 30 fps.
// Supplied AI illustrations + public-domain archive.org B-roll, camera moves, transitions (glitch / zoom punch /
// whip / flash / dip), screen-space motion graphics, word-by-word captions, surveillance HUD, grain + vignette.
// The soundtrack (voice + SFX + music) is mixed separately (shorts/penyadapan/audio) and muxed at encode time.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, continueRender, delayRender } from "remotion";
import {
  Any, C, F, W, H, FPS, VO, TOTAL, fr, sec, plan, words, clamp01, lerp, easeOut, easeIn, easeInOut, rnd, inP, heavyShadow,
} from "./theme";
import {
  Headline, Tag, DateCard, Counter, Stamp, LowerThird, Typing, Checklist, Question, Progress, Neq, LoopCard, Waveform,
  EndCard, Reticle, AlertMark, flashAt,
} from "./graphics";

export const PENYADAPAN_FRAMES = TOTAL;
const SHOTS: Any[] = plan.shots;
const GFX: Any[] = plan.graphics;
const CARD_TOP = 430; // B-roll square card

const fontCss = `
@font-face{font-family:'Anton';src:url(${staticFile("penyadapan/fonts/anton-latin-400-normal.woff2")}) format('woff2');font-weight:400;}
@font-face{font-family:'Montserrat';src:url(${staticFile("penyadapan/fonts/montserrat-latin-700-normal.woff2")}) format('woff2');font-weight:700;}
@font-face{font-family:'Montserrat';src:url(${staticFile("penyadapan/fonts/montserrat-latin-800-normal.woff2")}) format('woff2');font-weight:800;}
@font-face{font-family:'Montserrat';src:url(${staticFile("penyadapan/fonts/montserrat-latin-900-normal.woff2")}) format('woff2');font-weight:900;}
@font-face{font-family:'JetBrains Mono';src:url(${staticFile("penyadapan/fonts/jetbrains-mono-latin-500-normal.woff2")}) format('woff2');font-weight:500;}
@font-face{font-family:'JetBrains Mono';src:url(${staticFile("penyadapan/fonts/jetbrains-mono-latin-700-normal.woff2")}) format('woff2');font-weight:700;}
@font-face{font-family:'JetBrains Mono';src:url(${staticFile("penyadapan/fonts/jetbrains-mono-latin-800-normal.woff2")}) format('woff2');font-weight:800;}
`;

const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(
      ["400 100px Anton", "700 40px Montserrat", "800 40px Montserrat", "900 40px Montserrat", "500 30px 'JetBrains Mono'", "700 30px 'JetBrains Mono'", "800 30px 'JetBrains Mono'"]
        .map((f) => document.fonts.load(f)),
    ).then(() => continueRender(h));
  }, [h]);
};

// ------------------------------------------------------------------ camera
const camera = (move: Any, shot: Any, frame: number) => {
  const a = fr(shot.from), b = fr(shot.to);
  const t = clamp01((frame - a) / Math.max(1, b - a));
  const zt = move.ease === "out" ? easeOut(Math.min(1, t * 2.2)) * 0.75 + t * 0.25 : t;
  const z = lerp(move.z0, move.z1, zt);
  let pt = move.ease === "out" ? zt : easeInOut(t) * 0.6 + t * 0.4;
  if (move.k0 !== undefined) pt = easeInOut(clamp01((sec(frame) - move.k0) / (move.k1 - move.k0)));
  const mx = ((z - 1) * W) / 2, my = ((z - 1) * H) / 2;
  const x = Math.max(-mx, Math.min(mx, lerp(move.x0, move.x1, pt)));
  const y = Math.max(-my, Math.min(my, lerp(move.y0, move.y1, pt)));
  return { z, x, y };
};

// ------------------------------------------------------------------ transitions
type FX = { scale: number; tx: number; ty: number; blurX: number; blurY: number; blur: number; glitch: number; opacity: number; bright: number };
const transitionFx = (tin: string, tout: string | undefined, lf: number, lo: number): FX => {
  const fx: FX = { scale: 1, tx: 0, ty: 0, blurX: 0, blurY: 0, blur: 0, glitch: 0, opacity: 1, bright: 1 };
  // entrance (lf = frames since shot start)
  if (tin === "glitch" && lf < 6) fx.glitch = Math.max(fx.glitch, 1 - lf / 6);
  if (tin === "zoom" && lf < 9) { const p = easeOut(lf / 9); fx.scale *= lerp(1.32, 1, p); fx.blur = Math.max(fx.blur, 16 * (1 - p)); fx.bright *= lerp(1.6, 1, p); }
  if (tin === "whipLeft" && lf < 7) { const p = easeOut(lf / 7); fx.tx += W * 0.6 * (1 - p); fx.blurX = Math.max(fx.blurX, 50 * (1 - p)); }
  if (tin === "whipUp" && lf < 7) { const p = easeOut(lf / 7); fx.ty += H * 0.38 * (1 - p); fx.blurY = Math.max(fx.blurY, 60 * (1 - p)); }
  if (tin === "dip" && lf < 8) fx.opacity *= easeOut(lf / 8);
  // exit (lo = frames left in the shot, 0 on the last frame) — driven by the NEXT shot's entrance type
  if (tout === "glitch" && lo < 3) fx.glitch = Math.max(fx.glitch, 1 - lo / 3);
  if (tout === "zoom" && lo < 5) { const p = easeIn(1 - lo / 5); fx.scale *= lerp(1, 1.3, p); fx.blur = Math.max(fx.blur, 14 * p); fx.bright *= lerp(1, 1.5, p); }
  if (tout === "whipLeft" && lo < 5) { const p = easeIn(1 - lo / 5); fx.tx -= W * 0.6 * p; fx.blurX = Math.max(fx.blurX, 50 * p); }
  if (tout === "whipUp" && lo < 5) { const p = easeIn(1 - lo / 5); fx.ty -= H * 0.38 * p; fx.blurY = Math.max(fx.blurY, 60 * p); }
  if (tout === "dip" && lo < 6) fx.opacity *= lo / 6;
  return fx;
};

/** RGB-split + displaced slices, used for the glitch transitions */
const Glitch: React.FC<{ amt: number; frame: number; render: () => React.ReactNode }> = ({ amt, frame, render }) => {
  if (amt <= 0.01) return <>{render()}</>;
  const off = 26 * amt;
  const slices = [0, 1, 2, 3, 4].map((i) => {
    const top = rnd(frame, i) * 92;
    const h = 2 + rnd(frame, i + 9) * 9;
    const dx = (rnd(frame, i + 17) - 0.5) * 220 * amt;
    return { top, h, dx };
  });
  return (
    <AbsoluteFill>
      {render()}
      <AbsoluteFill style={{ mixBlendMode: "screen", opacity: 0.75 * amt, transform: `translateX(${off}px)`, filter: "sepia(1) saturate(9) hue-rotate(-38deg) brightness(0.85)" }}>{render()}</AbsoluteFill>
      <AbsoluteFill style={{ mixBlendMode: "screen", opacity: 0.75 * amt, transform: `translateX(${-off}px)`, filter: "sepia(1) saturate(9) hue-rotate(150deg) brightness(0.85)" }}>{render()}</AbsoluteFill>
      {slices.map((s, i) => (
        <AbsoluteFill key={i} style={{ clipPath: `inset(${s.top}% 0 ${Math.max(0, 100 - s.top - s.h)}% 0)`, transform: `translateX(${s.dx}px)` }}>{render()}</AbsoluteFill>
      ))}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          position: "absolute", left: rnd(frame, i + 31) * 900, top: rnd(frame, i + 41) * 1800, width: 80 + rnd(frame, i + 51) * 400, height: 8 + rnd(frame, i + 61) * 40,
          background: i === 0 ? C.red : i === 1 ? C.cyan : "#fff", opacity: 0.8 * amt, mixBlendMode: "screen",
        }} />
      ))}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ shot contents
const Marks: React.FC<{ shot: Any; frame: number }> = ({ shot, frame }) => (
  <>
    {(shot.marks ?? []).map((m: Any, i: number) => {
      if (frame < fr(m.t0) || frame >= fr(m.t1)) return null;
      return m.type === "alert" ? <AlertMark key={i} m={m} frame={frame} /> : <Reticle key={i} m={m} frame={frame} />;
    })}
  </>
);

const ImgShot: React.FC<{ shot: Any; frame: number }> = ({ shot, frame }) => {
  const { z, x, y } = camera(shot.move, shot, frame);
  return (
    <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) scale(${z})` }}>
      <Img src={staticFile(`penyadapan/img/${shot.id}.jpg`)} style={{ width: W, height: H, objectFit: "cover", filter: "contrast(1.05) saturate(1.04)" }} />
      <Marks shot={shot} frame={frame} />
    </AbsoluteFill>
  );
};

const RadarSweep: React.FC<{ frame: number }> = ({ frame }) => {
  const a = (frame * 6) % 360;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      <div style={{
        position: "absolute", left: 40, top: 40, width: W - 80, height: W - 80, borderRadius: "50%",
        background: `conic-gradient(from ${a}deg, rgba(63,216,255,0.0) 0deg, rgba(63,216,255,0.0) 300deg, rgba(63,216,255,0.55) 358deg, rgba(255,255,255,0.8) 360deg)`,
      }} />
      <div style={{ position: "absolute", left: 40, top: 40, width: W - 80, height: W - 80, borderRadius: "50%", border: "3px solid rgba(63,216,255,0.5)" }} />
    </AbsoluteFill>
  );
};

const BrollShot: React.FC<{ shot: Any; frame: number }> = ({ shot, frame }) => {
  const { z, x, y } = camera(shot.move, shot, frame);
  const src = staticFile(`penyadapan/broll/${shot.id}.mp4`);
  const bg = staticFile(`penyadapan/broll/${shot.id}_bg.mp4`);
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <OffthreadVideo src={bg} muted style={{ width: W, height: H, objectFit: "cover", transform: "scale(1.15)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(4,6,10,0.35), rgba(4,6,10,0.65))" }} />
      <div style={{ position: "absolute", left: 0, top: CARD_TOP, width: W, height: W, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }}>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${x}px, ${y * 0.56}px) scale(${z})` }}>
          <OffthreadVideo src={src} muted style={{ width: W, height: W }} />
        </div>
        {shot.id === "radar" && <RadarSweep frame={frame} />}
        <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0 2px, transparent 2px 5px)" }} />
        <AbsoluteFill style={{ boxShadow: "inset 0 0 160px rgba(0,0,0,0.75)" }} />
        <div style={{ position: "absolute", left: 30, bottom: 58, fontFamily: F.mono, fontWeight: 800, fontSize: 28, color: C.white, letterSpacing: 3, textShadow: heavyShadow, opacity: 0.9 }}>
          <span style={{ color: C.red }}>■</span> ARSIP {shot.year}
        </div>
        <div style={{ position: "absolute", left: 30, bottom: 26, fontFamily: F.mono, fontWeight: 500, fontSize: 22, color: "rgba(255,255,255,0.72)", textShadow: heavyShadow }}>
          “{shot.film}” · Prelinger Archives / Internet Archive
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: CARD_TOP - 3, height: 3, background: "rgba(255,255,255,0.35)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: CARD_TOP + W, height: 3, background: "rgba(255,255,255,0.35)" }} />
    </AbsoluteFill>
  );
};

const CardShot: React.FC<{ shot: Any; frame: number }> = ({ shot, frame }) => {
  const { z } = camera(shot.move, shot, frame);
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Img src={staticFile(`penyadapan/img/${shot.bg}.jpg`)} style={{ width: W, height: H, objectFit: "cover", transform: `scale(${z})`, filter: "blur(14px) brightness(0.32) saturate(0.7)" }} />
      <AbsoluteFill style={{
        backgroundImage: "linear-gradient(rgba(63,216,255,0.09) 2px, transparent 2px), linear-gradient(90deg, rgba(63,216,255,0.09) 2px, transparent 2px)",
        backgroundSize: "90px 90px", backgroundPosition: `0 ${(frame * 1.5) % 90}px`,
      }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 42%, rgba(229,35,46,0.28), transparent 55%)" }} />
    </AbsoluteFill>
  );
};

const Shot: React.FC<{ i: number }> = ({ i }) => {
  const frame = useCurrentFrame() + fr(SHOTS[i].from);
  const shot = SHOTS[i];
  const a = fr(shot.from), b = fr(shot.to);
  const fx = transitionFx(shot.tin, SHOTS[i + 1]?.tin, frame - a, b - 1 - frame);
  const render = () =>
    shot.kind === "img" ? <ImgShot shot={shot} frame={frame} /> : shot.kind === "broll" ? <BrollShot shot={shot} frame={frame} /> : <CardShot shot={shot} frame={frame} />;
  const filters: string[] = [];
  if (fx.blurX > 0.5 || fx.blurY > 0.5) filters.push(`url(#mb${i})`);
  if (fx.blur > 0.3) filters.push(`blur(${fx.blur}px)`);
  if (fx.bright !== 1) filters.push(`brightness(${fx.bright})`);
  return (
    <AbsoluteFill style={{ background: shot.tin === "dip" || SHOTS[i + 1]?.tin === "dip" ? "#000" : "transparent" }}>
      {(fx.blurX > 0.5 || fx.blurY > 0.5) && (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={`mb${i}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={`${fx.blurX} ${fx.blurY}`} /></filter>
        </svg>
      )}
      <AbsoluteFill style={{
        transform: `translate(${fx.tx}px, ${fx.ty}px) scale(${fx.scale})`, opacity: fx.opacity,
        filter: filters.length ? filters.join(" ") : undefined,
      }}>
        <Glitch amt={fx.glitch} frame={frame} render={render} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ captions
type Group = { ws: number[]; s: number; e: number };
const GROUPS: Group[] = (() => {
  const gs: Group[] = [];
  let cur: number[] = [];
  const flush = () => { if (cur.length) gs.push({ ws: cur, s: words[cur[0]].s, e: words[cur[cur.length - 1]].e }); cur = []; };
  words.forEach((w, i) => {
    const len = cur.reduce((n, k) => n + words[k].w.length + 1, 0);
    if (cur.length && (cur.length >= 3 || len + w.w.length > 19)) flush();
    cur.push(i);
    if (/[.,?!:]$/.test(w.w)) flush();
  });
  flush();
  return gs;
})();

const Captions: React.FC<{ frame: number }> = ({ frame }) => {
  const t = sec(frame);
  if (t >= plan.end - 1.8) return null;
  const gi = GROUPS.findIndex((g, i) => t >= g.s - 0.04 && t < Math.min(GROUPS[i + 1]?.s ?? 1e9, g.e + 0.5));
  if (gi < 0) return null;
  const g = GROUPS[gi];
  const pop = easeOut(clamp01((frame - fr(g.s - 0.04)) / 5));
  return (
    <div style={{ position: "absolute", left: 60, right: 140, top: 1340, display: "flex", justifyContent: "center" }}>
      <div style={{ textAlign: "center", transform: `scale(${lerp(0.82, 1, pop)})`, opacity: pop }}>
        {g.ws.map((k, j) => {
          const w = words[k];
          const active = t >= w.s - 0.03 && (t < w.e + 0.08 || k === g.ws[g.ws.length - 1]);
          const said = t >= w.s - 0.03;
          return (
            <span key={k} style={{
              fontFamily: F.body, fontWeight: 900, fontSize: 66, lineHeight: 1.18, color: active ? C.yellow : said ? C.white : "rgba(255,255,255,0.92)",
              WebkitTextStroke: "11px #000", paintOrder: "stroke fill", textShadow: "0 6px 14px rgba(0,0,0,0.6)",
              display: "inline-block", transform: `scale(${active ? 1.06 : 1})`, margin: "0 19px",
            }}>
              {w.w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ HUD + finishing
const Hud: React.FC<{ frame: number }> = ({ frame }) => {
  const t = sec(frame);
  if (t >= plan.end - 1.8) return null;
  const shot = SHOTS.find((s) => t >= s.from && t < s.to) ?? SHOTS[0];
  const tc = Math.max(0, frame);
  const hh = (n: number) => String(n).padStart(2, "0");
  const time = `${hh(Math.floor(tc / FPS / 60))}:${hh(Math.floor(tc / FPS) % 60)}:${hh(tc % FPS)}`;
  const arm = 64, ins = 44, sw = 5;
  const corner = (l: boolean, tp: boolean) => ({
    position: "absolute" as const, width: arm, height: arm, [l ? "left" : "right"]: ins, [tp ? "top" : "bottom"]: tp ? 150 : 330,
    [tp ? "borderTop" : "borderBottom"]: `${sw}px solid rgba(255,255,255,0.55)`, [l ? "borderLeft" : "borderRight"]: `${sw}px solid rgba(255,255,255,0.55)`,
  });
  const label = shot.kind === "broll" ? "ARSIP · PUBLIC DOMAIN" : shot.kind === "card" ? "GRAFIS" : "ILUSTRASI AI";
  return (
    <AbsoluteFill>
      <div style={corner(true, true)} /><div style={corner(false, true)} /><div style={corner(true, false)} /><div style={corner(false, false)} />
      <div style={{ position: "absolute", top: 176, right: 72, fontFamily: F.mono, fontWeight: 800, fontSize: 28, color: C.white, letterSpacing: 2, textShadow: heavyShadow, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 18, height: 18, borderRadius: 9, background: C.red, opacity: Math.floor(frame / 15) % 2 ? 0.25 : 1, boxShadow: `0 0 12px ${C.red}` }} />
        REC {time}
      </div>
      <div style={{ position: "absolute", top: 176, left: 72, fontFamily: F.mono, fontWeight: 700, fontSize: 22, color: "rgba(255,255,255,0.8)", letterSpacing: 2, background: "rgba(0,0,0,0.38)", padding: "4px 10px", textShadow: heavyShadow }}>
        {label}
      </div>
    </AbsoluteFill>
  );
};

const Grain: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{
    backgroundImage: `url(${staticFile(`penyadapan/grain${frame % 3}.png`)})`, backgroundSize: "256px 256px",
    backgroundPosition: `${Math.floor(rnd(frame, 1) * 256)}px ${Math.floor(rnd(frame, 2) * 256)}px`,
    mixBlendMode: "overlay", opacity: 0.2,
  }} />
);

const shakeAt = (frame: number) => {
  let x = 0, y = 0;
  for (const s of plan.shakes as Any[]) {
    const d = frame - fr(s.t);
    if (d < 0 || d > 10) continue;
    const a = s.amt * 26 * Math.exp(-d / 3);
    x += (rnd(d, s.t) - 0.5) * 2 * a;
    y += (rnd(d + 50, s.t) - 0.5) * 2 * a;
  }
  return { x, y };
};

const Graphic: React.FC<{ g: Any; frame: number }> = ({ g, frame }) => {
  const P = { g, frame };
  switch (g.type) {
    case "headline": return <Headline {...P} />;
    case "tag": return <Tag {...P} />;
    case "date": return <DateCard {...P} />;
    case "counter": return <Counter {...P} />;
    case "stamp": return <Stamp {...P} />;
    case "lowerthird": return <LowerThird {...P} />;
    case "typing": return <Typing {...P} />;
    case "checklist": return <Checklist {...P} />;
    case "question": return <Question {...P} />;
    case "progress": return <Progress {...P} />;
    case "neq": return <Neq {...P} />;
    case "loop": return <LoopCard {...P} />;
    case "waveform": return <Waveform {...P} />;
    case "endcard": return <EndCard {...P} />;
    default: return null;
  }
};

export const Penyadapan: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const sk = shakeAt(frame);
  // flashes: explicit events + every 'flash' (full) and 'zoom' (soft) cut
  let flash = 0;
  for (const g of GFX) if (g.type === "flash") flash = Math.max(flash, flashAt(frame, fr(g.t), g.amt));
  for (const s of SHOTS) {
    if (s.tin === "flash") flash = Math.max(flash, flashAt(frame, fr(s.from), 0.95));
    if (s.tin === "zoom") flash = Math.max(flash, flashAt(frame, fr(s.from), 0.32));
  }
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      <style>{fontCss}</style>
      <AbsoluteFill style={{ transform: `translate(${sk.x}px, ${sk.y}px) scale(${sk.x || sk.y ? 1.03 : 1})` }}>
        {SHOTS.map((s, i) => {
          const a = Math.max(0, fr(s.from)), b = Math.min(TOTAL, fr(s.to));
          return (
            <Sequence key={s.id + i} from={a} durationInFrames={b - a} layout="none">
              <Shot i={i} />
            </Sequence>
          );
        })}
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 52%, rgba(0,0,0,0.62) 100%)" }} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.38) 0%, transparent 22%, transparent 62%, rgba(0,0,0,0.45) 100%)" }} />
        {GFX.map((g, i) => {
          if (g.type === "flash") return null;
          if (frame < fr(g.t0) - 1 || frame >= fr(g.t1)) return null;
          return <Graphic key={i} g={g} frame={frame} />;
        })}
      </AbsoluteFill>
      <Captions frame={frame} />
      <Hud frame={frame} />
      <Grain frame={frame} />
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.07) 0 2px, transparent 2px 4px)", pointerEvents: "none" }} />
      {flash > 0.01 && <AbsoluteFill style={{ background: "#fff", opacity: flash, mixBlendMode: "screen" }} />}
    </AbsoluteFill>
  );
};
