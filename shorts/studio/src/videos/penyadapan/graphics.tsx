// Screen-space motion graphics (headlines, date card, counters, stamps, checklists, ...) and in-camera marks
// (reticles, alert rings). Every component is a pure function of the composition frame.
import React from "react";
import { AbsoluteFill } from "remotion";
import {
  Any, C, F, W, H, FPS, fr, sec, clamp01, lerp, easeOut, easeIn, backOut, rnd, inP, outP, heavyShadow, voiceEnv, VO,
} from "./theme";

type GP = { g: Any; frame: number };

const rgbSplit = (amt: number) =>
  amt > 0.01 ? `${amt * 9}px 0 rgba(255,40,60,0.85), ${-amt * 9}px 0 rgba(60,215,255,0.85), ${heavyShadow}` : heavyShadow;

/** one line of big condensed type; hl = white on red box */
const HeadLine: React.FC<{ text: string; size: number; hl: boolean; p: number; glitch: number; color?: string }> = ({
  text, size, hl, p, glitch, color,
}) => {
  const e = easeOut(p);
  return (
    <div style={{ overflow: "hidden", padding: "6px 0 4px", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          transform: `translateY(${(1 - e) * 110}%) skewY(${(1 - e) * 6}deg)`,
          fontFamily: F.head, fontSize: size, lineHeight: 1.02, letterSpacing: 1, color: color ?? C.white,
          textTransform: "uppercase", whiteSpace: "nowrap",
          background: hl ? C.red : "transparent", padding: hl ? "0 22px 4px" : "0 4px",
          textShadow: hl ? (glitch > 0.01 ? rgbSplit(glitch) : "0 4px 0 rgba(0,0,0,0.25)") : rgbSplit(glitch),
          boxShadow: hl ? "0 12px 30px rgba(0,0,0,0.45)" : "none",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const Headline: React.FC<GP> = ({ g, frame }) => {
  const f0 = fr(g.t0), f1 = fr(g.t1);
  const out = outP(frame, f1, 5);
  const lines: string[] = g.lines;
  const at: number[] = g.at ?? lines.map((_, i) => g.t0 + i * 0.12);
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: g.y, opacity: out, transform: `translateY(${(1 - out) * -24}px)` }}>
      {lines.map((t, i) => {
        const lf = fr(at[i]);
        const p = inP(frame, lf, 7);
        const gl = g.glitch ? clamp01(1 - (frame - lf) / 8) * (rnd(frame, i) > 0.3 ? 1 : 0.2) : 0;
        if (frame < lf) return <div key={i} style={{ height: g.size * 1.06 + 10 }} />;
        return <HeadLine key={i} text={t} size={g.size} hl={(g.hl ?? []).includes(i)} p={p} glitch={gl} />;
      })}
    </div>
  );
};

/** small mono label chip */
export const Tag: React.FC<GP> = ({ g, frame }) => {
  const f0 = fr(g.t0), f1 = fr(g.t1);
  const p = easeOut(inP(frame, f0, 8));
  const n = Math.floor(clamp01((frame - f0) / 12) * g.text.length);
  return (
    <div style={{ position: "absolute", top: g.y, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: outP(frame, f1, 4) }}>
      <div style={{
        fontFamily: F.mono, fontWeight: 800, fontSize: 40, letterSpacing: 4, color: g.red ? C.white : C.ink,
        background: g.red ? C.red : C.white, padding: "10px 22px", transform: `scaleX(${lerp(0.4, 1, p)})`,
        boxShadow: "0 10px 24px rgba(0,0,0,0.45)",
      }}>
        {g.text.slice(0, Math.max(1, n))}
        <span style={{ opacity: frame % 10 < 5 ? 1 : 0 }}>▍</span>
      </div>
    </div>
  );
};

export const DateCard: React.FC<GP> = ({ g, frame }) => {
  const f0 = fr(g.t0), f1 = fr(g.t1);
  const p = backOut(clamp01((frame - f0) / 10));
  const q = easeOut(inP(frame, f0 + 5, 10));
  const out = outP(frame, f1, 5);
  const m = `${g.month} ${g.year}`;
  const n = Math.floor(clamp01((frame - f0 - 6) / 14) * m.length);
  return (
    <div style={{ position: "absolute", top: g.y, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: out }}>
      <div style={{ display: "flex", alignItems: "stretch", boxShadow: "0 18px 50px rgba(0,0,0,0.6)" }}>
        <div style={{
          background: C.red, color: C.white, fontFamily: F.head, fontSize: 190, lineHeight: 1, padding: "14px 30px 6px",
          transform: `scale(${p})`, transformOrigin: "right center",
        }}>
          {g.day}
        </div>
        <div style={{
          background: "rgba(6,8,12,0.86)", padding: "18px 30px", display: "flex", flexDirection: "column", justifyContent: "center",
          clipPath: `inset(0 ${(1 - q) * 100}% 0 0)`, borderTop: `4px solid ${C.white}`, borderBottom: `4px solid ${C.white}`,
        }}>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: C.cyan }}>TANGGAL</div>
          <div style={{ fontFamily: F.head, fontSize: 84, color: C.white, lineHeight: 1.05, whiteSpace: "nowrap", minWidth: 520 }}>
            {m.slice(0, n)}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Counter: React.FC<GP> = ({ g, frame }) => {
  const f0 = fr(g.t0), f1 = fr(g.t1);
  const k = Math.min(g.n, Math.floor((frame - f0) / 4) + 1);
  const pop = backOut(clamp01(((frame - f0) % 4) / 3 + (k === g.n && frame - f0 > 12 ? 1 : 0)));
  const p = easeOut(inP(frame, f0, 8));
  return (
    <div style={{ position: "absolute", top: g.y, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 28, opacity: outP(frame, f1, 4) }}>
      <div style={{ fontFamily: F.head, fontSize: 250, lineHeight: 0.95, color: C.red, transform: `scale(${lerp(1.25, 1, pop)})`, textShadow: "0 8px 30px rgba(0,0,0,0.7), 0 0 2px #000", WebkitTextStroke: "3px #fff" }}>
        {k}
      </div>
      <div style={{ fontFamily: F.head, fontSize: 116, color: C.white, textShadow: heavyShadow, clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }}>
        {g.label}
      </div>
    </div>
  );
};

export const Stamp: React.FC<GP> = ({ g, frame }) => {
  const f0 = fr(g.t0), f1 = fr(g.t1);
  const p = clamp01((frame - f0) / 5);
  const s = lerp(2.4, 1, easeIn(p));
  const o = p < 1 ? lerp(0, 1, p) : 1;
  return (
    <div style={{ position: "absolute", top: g.y, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: o * outP(frame, f1, 4) }}>
      <div style={{
        transform: `rotate(${g.rot}deg) scale(${s})`, border: `10px solid ${C.red}`, outline: `3px solid ${C.red}`, outlineOffset: 8,
        padding: "8px 34px 2px", background: "rgba(10,4,6,0.42)", textAlign: "center",
      }}>
        {(g.lines as string[]).map((l, i) => (
          <div key={i} style={{ fontFamily: F.head, fontSize: i === 1 ? 170 : 92, lineHeight: 1.02, color: C.red, letterSpacing: i === 1 ? 10 : 3 }}>{l}</div>
        ))}
      </div>
    </div>
  );
};

export const LowerThird: React.FC<GP> = ({ g, frame }) => {
  const f0 = fr(g.t0), f1 = fr(g.t1);
  const p = easeOut(inP(frame, f0, 9));
  const q = easeOut(inP(frame, f0 + 5, 9));
  const out = outP(frame, f1, 5);
  return (
    <div style={{ position: "absolute", top: g.y, left: 56, opacity: out, transform: `translateX(${(1 - p) * -700}px)` }}>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <div style={{ width: 14, background: C.red }} />
        <div style={{ background: "rgba(6,8,12,0.88)", padding: "14px 30px 12px 24px" }}>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 32, letterSpacing: 6, color: C.cyan }}>{g.kicker}</div>
          <div style={{ fontFamily: F.head, fontSize: 92, lineHeight: 1.04, color: C.white, whiteSpace: "nowrap" }}>{g.title}</div>
        </div>
      </div>
      {g.sub && (
        <div style={{
          marginTop: 10, marginLeft: 14, display: "inline-block", fontFamily: F.mono, fontWeight: 800, fontSize: 36, color: C.ink,
          background: C.white, padding: "6px 16px", clipPath: `inset(0 ${(1 - q) * 100}% 0 0)`,
        }}>
          {g.sub.toUpperCase()}
        </div>
      )}
    </div>
  );
};

export const Typing: React.FC<GP> = ({ g, frame }) => {
  const f0 = fr(g.t0), f1 = fr(g.t1);
  const p = easeOut(inP(frame, f0, 8));
  const lines: string[] = g.lines;
  return (
    <div style={{ position: "absolute", top: g.y, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: outP(frame, f1, 5) }}>
      <div style={{
        background: "rgba(4,10,16,0.82)", border: `2px solid ${C.cyan}`, boxShadow: `0 0 40px rgba(63,216,255,0.25), 0 20px 50px rgba(0,0,0,0.6)`,
        padding: "20px 34px 24px", transform: `scaleY(${p})`, transformOrigin: "top", minWidth: 760,
      }}>
        <div style={{ fontFamily: F.mono, fontWeight: 800, fontSize: 30, letterSpacing: 5, color: C.cyan, marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
          <span>{g.label}</span><span style={{ color: C.red }}>● LIVE</span>
        </div>
        {lines.map((l, i) => {
          const s0 = f0 + 6 + i * 13;
          const n = Math.floor(clamp01((frame - s0) / 11) * l.length);
          const done = n >= l.length;
          return (
            <div key={i} style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 60, color: done && i === 2 ? C.red : C.white, height: 78, whiteSpace: "pre" }}>
              {frame >= s0 ? "› " + l.slice(0, n) : ""}
              {frame >= s0 && !done && <span style={{ color: C.cyan }}>▍</span>}
              {done && <span style={{ fontSize: 34, color: C.cyan, marginLeft: 18 }}>{i === 2 ? "MASUK" : "OK"}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Mark: React.FC<{ kind: string; p: number }> = ({ kind, p }) => {
  const d = 1 - clamp01(p);
  return (
    <svg width={86} height={86} viewBox="0 0 86 86">
      <rect x={3} y={3} width={80} height={80} fill={kind === "x" ? "rgba(229,35,46,0.18)" : "rgba(47,227,124,0.16)"} stroke={C.white} strokeWidth={5} />
      {kind === "x" ? (
        <>
          <path d="M20 20 L66 66" stroke={C.red} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={clamp01(d * 2)} fill="none" />
          <path d="M66 20 L20 66" stroke={C.red} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={clamp01(d * 2 - 1) } fill="none" />
        </>
      ) : (
        <path d="M18 45 L36 63 L70 22" stroke={C.green} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={d} fill="none" />
      )}
    </svg>
  );
};

export const Checklist: React.FC<GP> = ({ g, frame }) => {
  const f0 = fr(g.t0), f1 = fr(g.t1);
  const out = outP(frame, f1, 5);
  const tp = easeOut(inP(frame, f0, 7));
  return (
    <div style={{ position: "absolute", top: g.y, left: 90, opacity: out }}>
      <div style={{ overflow: "hidden", marginBottom: 14 }}>
        <div style={{ display: "inline-block", fontFamily: F.head, fontSize: 84, color: C.white, background: C.red, padding: "0 22px 4px", transform: `translateY(${(1 - tp) * 110}%)` }}>
          {g.title}
        </div>
      </div>
      {(g.items as Any[]).map((it, i) => {
        const a = fr(it.t);
        if (frame < a - 1) return null;
        const p = easeOut(inP(frame, a - 1, 7));
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 26, marginBottom: 18, transform: `translateX(${(1 - p) * -120}px)`, opacity: p }}>
            <Mark kind={it.mark} p={(frame - a) / 7} />
            <div style={{
              fontFamily: F.head, fontSize: 92, lineHeight: 1, color: C.white, textShadow: heavyShadow,
              textDecoration: it.mark === "x" ? "none" : "none",
            }}>
              {it.text}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const Question: React.FC<GP> = ({ g, frame }) => {
  const f0 = fr(g.t0), f1 = fr(g.t1);
  const out = outP(frame, f1, 4);
  const lines: string[] = g.lines;
  const p0 = backOut(clamp01((frame - f0) / 9));
  return (
    <div style={{ position: "absolute", top: g.y, left: 60, right: 60, opacity: out, textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: F.mono, fontWeight: 800, fontSize: 40, color: C.white, background: C.red, padding: "6px 20px", transform: `scale(${p0})`, letterSpacing: 4 }}>
          PERTANYAAN {g.num}<span style={{ opacity: 0.6 }}>/03</span>
        </div>
      </div>
      {lines.map((t, i) => {
        const lf = f0 + 3 + i * 3;
        return frame < lf ? <div key={i} style={{ height: 112 }} /> :
          <HeadLine key={i} text={t} size={98} hl={false} p={inP(frame, lf, 7)} glitch={0} color={i === lines.length - 1 ? C.yellow : C.white} />;
      })}
    </div>
  );
};

export const Progress: React.FC<GP> = ({ g, frame }) => {
  const f0 = fr(g.t0), f1 = fr(g.t1);
  const out = outP(frame, f1, 5);
  const p = easeOut(inP(frame, f0, 8));
  const fill = lerp(0.04, 0.62, easeOut(clamp01((frame - f0 - 4) / 40)));
  return (
    <div style={{ position: "absolute", top: g.y, left: 90, right: 90, opacity: out }}>
      <div style={{ overflow: "hidden" }}>
        <div style={{ fontFamily: F.head, fontSize: 110, color: C.white, textShadow: heavyShadow, transform: `translateY(${(1 - p) * 110}%)` }}>{g.label}</div>
      </div>
      <div style={{ height: 34, border: `4px solid ${C.white}`, marginTop: 8, background: "rgba(0,0,0,0.55)", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: `${fill * 100}%`,
          backgroundImage: `repeating-linear-gradient(-45deg, ${C.amber} 0 18px, #c98400 18px 36px)`,
          backgroundPosition: `${frame * 2}px 0`,
        }} />
      </div>
      <div style={{ marginTop: 16, fontFamily: F.mono, fontWeight: 800, fontSize: 40, color: C.amber, letterSpacing: 4, textShadow: heavyShadow }}>
        <span style={{ opacity: frame % 20 < 12 ? 1 : 0.25 }}>●</span> {g.status} <span style={{ color: C.white }}>{Math.round(fill * 100)}%</span>
      </div>
    </div>
  );
};

export const Neq: React.FC<GP> = ({ g, frame }) => {
  const f0 = fr(g.t0), f1 = fr(g.t1), fa = fr(g.at);
  const out = outP(frame, f1, 5);
  const p = easeOut(inP(frame, f0, 8));
  const q = backOut(clamp01((frame - fa) / 8));
  const r = easeOut(inP(frame, fa + 4, 8));
  return (
    <div style={{ position: "absolute", top: g.y, left: 60, right: 60, opacity: out, textAlign: "center" }}>
      <div style={{ overflow: "hidden" }}>
        <div style={{ fontFamily: F.head, fontSize: 132, color: C.white, textShadow: heavyShadow, transform: `translateY(${(1 - p) * 110}%)` }}>{g.left}</div>
      </div>
      <div style={{ fontFamily: F.head, fontSize: 200, lineHeight: 0.8, color: C.red, transform: `scale(${frame >= fa ? q : 0})`, textShadow: "0 8px 30px rgba(0,0,0,0.6)" }}>≠</div>
      <div style={{ overflow: "hidden", marginTop: 10 }}>
        <div style={{ display: "inline-block", fontFamily: F.head, fontSize: 104, color: C.white, background: C.red, padding: "0 22px 4px", transform: `translateY(${(1 - r) * 110}%)` }}>{g.right}</div>
      </div>
      <div style={{ marginTop: 22, fontFamily: F.mono, fontWeight: 700, fontSize: 36, color: C.white, letterSpacing: 3, opacity: r, textShadow: heavyShadow }}>
        ⚖ {g.note.toUpperCase()}
      </div>
    </div>
  );
};

export const LoopCard: React.FC<GP> = ({ g, frame }) => {
  const f0 = fr(g.t0), f1 = fr(g.t1), fs = fr(g.strike);
  const p = backOut(clamp01((frame - f0) / 10));
  const rot = (frame - f0) * 6;
  const s = clamp01((frame - fs) / 6);
  const t = easeOut(inP(frame, f0 + 4, 8));
  return (
    <div style={{ position: "absolute", top: g.y, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", opacity: outP(frame, f1, 5) }}>
      <svg width={360} height={360} viewBox="0 0 200 200" style={{ transform: `scale(${p})`, overflow: "visible" }}>
        <g transform={`rotate(${rot} 100 100)`}>
          <path d="M100 30 A70 70 0 1 1 36 72" fill="none" stroke={C.white} strokeWidth={14} strokeLinecap="round" />
          <path d="M20 58 L40 90 L58 56 Z" fill={C.white} />
        </g>
        <path d="M30 30 L170 170" stroke={C.red} strokeWidth={20} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - s} />
      </svg>
      <div style={{ marginTop: 40, overflow: "hidden" }}>
        {(g.text as string[]).map((l, i) => (
          <div key={i} style={{ textAlign: "center", fontFamily: F.head, fontSize: 128, lineHeight: 1.05, color: C.white, transform: `translateY(${(1 - t) * 110}%)`, textShadow: heavyShadow }}>
            {i === 1 ? <span style={{ background: C.red, padding: "0 22px" }}>{l}</span> : l}
          </div>
        ))}
      </div>
    </div>
  );
};

export const Waveform: React.FC<GP> = ({ g, frame }) => {
  const f0 = fr(g.t0), f1 = fr(g.t1);
  const p = easeOut(inP(frame, f0, 8));
  const N = 44;
  const base = frame - Math.round(VO * FPS);
  return (
    <div style={{ position: "absolute", top: g.y, left: 90, right: 90, height: 200, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: p * outP(frame, f1, 5) }}>
      {Array.from({ length: N }).map((_, i) => {
        const k = base - Math.abs(i - N / 2);
        const v = voiceEnv[Math.max(0, Math.min(voiceEnv.length - 1, k))] ?? 0;
        const h = 10 + v * 170 * (0.6 + 0.4 * rnd(i, Math.floor(frame / 2)));
        return <div key={i} style={{ width: 11, height: h, borderRadius: 6, background: i % 7 === 3 ? C.red : C.cyan, boxShadow: `0 0 14px ${C.cyan}` }} />;
      })}
    </div>
  );
};

export const EndCard: React.FC<GP> = ({ g, frame }) => {
  const f0 = fr(g.t0);
  const d = easeOut(inP(frame, f0, 10));
  const a = easeOut(inP(frame, f0 + 4, 8));
  const b = easeOut(inP(frame, f0 + 9, 8));
  const c = easeOut(inP(frame, f0 + 16, 10));
  const bob = Math.sin((frame - f0) / 4) * 8;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(4,5,8,${0.72 * d})` }} />
      <div style={{ position: "absolute", top: 560, left: 60, right: 60, textAlign: "center" }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ fontFamily: F.head, fontSize: 130, color: C.white, transform: `translateY(${(1 - a) * 110}%)` }}>BAGAIMANA</div>
        </div>
        <div style={{ overflow: "hidden" }}>
          <div style={{ display: "inline-block", fontFamily: F.head, fontSize: 130, color: C.white, background: C.red, padding: "0 26px 6px", transform: `translateY(${(1 - b) * 110}%)` }}>MENURUTMU?</div>
        </div>
        <div style={{ marginTop: 48, fontFamily: F.body, fontWeight: 800, fontSize: 44, color: C.white, opacity: c, transform: `translateY(${(1 - c) * 30}px)` }}>
          Tulis pendapatmu di kolom komentar
        </div>
        <div style={{ marginTop: 24, display: "flex", justifyContent: "center", opacity: c, transform: `translateY(${bob}px)` }}>
          <svg width={70} height={70} viewBox="0 0 70 70"><path d="M35 8 L35 56 M14 36 L35 58 L56 36" stroke={C.yellow} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div style={{ marginTop: 40, fontFamily: F.mono, fontWeight: 500, fontSize: 30, color: "rgba(245,247,250,0.75)", opacity: c, letterSpacing: 1 }}>
          Kasus masih dalam proses hukum.
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** white flash; envelope peaks at the event frame */
export const flashAt = (frame: number, f: number, amt: number) => {
  const d = frame - f;
  if (d < -2 || d > 9) return 0;
  return amt * (d < 0 ? (d + 3) / 3 : Math.exp(-d / 2.6));
};

// ------------------------------------------------------------------ in-camera marks
export const Reticle: React.FC<{ m: Any; frame: number }> = ({ m, frame }) => {
  const f0 = fr(m.t0);
  const p = easeOut(inP(frame, f0, 8));
  const r = m.r * lerp(1.9, 1, p);
  const col = m.color === "red" ? C.red : C.cyan;
  const arm = r * 0.42;
  const locked = m.lock && frame - f0 > 10;
  const blink = locked ? (Math.floor((frame - f0) / 4) % 2 === 0 ? 1 : 0.55) : 1;
  const x = m.x * W, y = m.y * H;
  const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  return (
    <div style={{ position: "absolute", left: x - r, top: y - r, width: 2 * r, height: 2 * r, opacity: p * blink }}>
      <svg width={2 * r} height={2 * r} style={{ position: "absolute", overflow: "visible" }}>
        {corners.map(([sx, sy], i) => {
          const cx = r + sx * r, cy = r + sy * r;
          return <path key={i} d={`M${cx} ${cy - sy * arm} L${cx} ${cy} L${cx - sx * arm} ${cy}`} stroke={col} strokeWidth={8} fill="none" strokeLinecap="square" />;
        })}
        <circle cx={r} cy={r} r={r * 0.55} fill="none" stroke={C.white} strokeOpacity={0.7} strokeWidth={3} strokeDasharray="14 10"
          transform={`rotate(${(frame - f0) * 4} ${r} ${r})`} />
        <path d={`M${r} ${r * 0.3} L${r} ${r * 0.62} M${r} ${r * 1.38} L${r} ${r * 1.7} M${r * 0.3} ${r} L${r * 0.62} ${r} M${r * 1.38} ${r} L${r * 1.7} ${r}`} stroke={C.white} strokeWidth={4} />
      </svg>
      {m.label && (
        <div style={{
          position: "absolute", top: -62, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap",
          fontFamily: F.mono, fontWeight: 800, fontSize: 36, color: C.white, background: col, padding: "4px 14px", letterSpacing: 2,
          clipPath: `inset(0 ${(1 - easeOut(inP(frame, f0 + 4, 8))) * 100}% 0 0)`,
        }}>
          {locked ? `${m.label} · LOCKED` : m.label}
        </div>
      )}
    </div>
  );
};

export const AlertMark: React.FC<{ m: Any; frame: number }> = ({ m, frame }) => {
  const f0 = fr(m.t0);
  const k = (frame - f0) % 18;
  const x = m.x * W, y = m.y * H;
  return (
    <div style={{ position: "absolute", left: x, top: y }}>
      {[0, 9].map((o) => {
        const t = ((frame - f0 + o) % 18) / 18;
        return <div key={o} style={{ position: "absolute", left: -m.r * (0.6 + t * 1.4), top: -m.r * (0.6 + t * 1.4), width: m.r * (1.2 + t * 2.8), height: m.r * (1.2 + t * 2.8), borderRadius: "50%", border: `6px solid ${C.red}`, opacity: (1 - t) * 0.9 }} />;
      })}
      <div style={{ position: "absolute", left: -m.r * 0.5, top: -m.r * 0.5, width: m.r, height: m.r, borderRadius: "50%", background: k < 9 ? C.red : "rgba(229,35,46,0.6)", color: "#fff", fontFamily: F.head, fontSize: m.r * 0.8, display: "flex", alignItems: "center", justifyContent: "center" }}>!</div>
    </div>
  );
};

export { sec };
