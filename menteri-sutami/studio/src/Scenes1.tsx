import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { OffthreadVideo } from "remotion";
import {
  AMBER, ELITE, H, INK, KenBurns, MONT, Paper, PhotoCard, RED, Typed, W, WipeLine,
  clamp, easeIn, easeInOut, easeOut, shake,
} from "./lib";

// Image sizes
export const AI = { w: 941, h: 1672 };

const textShadow = "0 6px 24px rgba(0,0,0,0.65), 0 2px 4px rgba(0,0,0,0.6)";

// ===================================================== S1 hook: "Membangun proyek raksasa negara"
export const S1Hook: React.FC = () => {
  const f = useCurrentFrame();
  const blur = interpolate(f, [0, 7], [14, 0], clamp);
  const pop = (at: number) => ({
    opacity: interpolate(f, [at, at + 2], [0, 1], clamp),
    scale: interpolate(f, [at, at + 5], [1.7, 1], { ...clamp, easing: easeOut }),
  });
  return (
    <AbsoluteFill style={{ background: "#000", translate: shake(f, 25, 9, 16, "s1") }}>
      <AbsoluteFill style={{ filter: `blur(${blur}px)` }}>
        <KenBurns src="img/ai_proyek.jpg" iw={AI.w} ih={AI.h} dur={63}
          from={{ z: 1.5, fx: 0.66, fy: 0.27 }} to={{ z: 1.06, fx: 0.5, fy: 0.42 }} ease={easeOut}
          filter="saturate(0.78) contrast(1.1) brightness(0.88)" />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 38%)" }} />
      <div style={{ position: "absolute", top: 300, width: W, textAlign: "center", fontFamily: MONT, fontWeight: 900, lineHeight: 0.95, letterSpacing: -2 }}>
        <div style={{ fontSize: 138, color: "white", textShadow, ...pop(14) }}>PROYEK</div>
        <div style={{ fontSize: 150, color: AMBER, textShadow, ...pop(25) }}>RAKSASA</div>
      </div>
    </AbsoluteFill>
  );
};

// ===================================================== S2: electricity bill + power cut
const Bolt: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill={color} /></svg>
);

export const S2Listrik: React.FC = () => {
  const f = useCurrentFrame();
  const CUT = 57; // local frame of "diputus" (global 120 = 4.0 s)
  // power-cut flicker: brightness per frame after CUT
  const flick = [1, 0.18, 0.95, 0.12, 0.08, 0.6, 0.1, 0.05, 0.3];
  const lightsOn = f < CUT ? 1 : f - CUT < flick.length ? flick[f - CUT] : 0.4;
  const dark = 1 - lightsOn;
  const cardIn = interpolate(f, [12, 26], [1, 0], { ...clamp, easing: easeOut });
  const drift = interpolate(f, [90, 144], [0, 40], { ...clamp, easing: easeIn });
  const stampP = interpolate(f, [CUT + 2, CUT + 6], [0, 1], { ...clamp, easing: easeOut });
  const iris = interpolate(f, [131, 143], [0, 2400], { ...clamp, easing: easeIn });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ translate: shake(f, CUT, 10, 14, "s2") }}>
        <KenBurns src="img/ai_rumah_meteran.jpg" iw={AI.w} ih={AI.h} dur={143}
          from={{ z: 1.02, fx: 0.5, fy: 0.5 }} to={{ z: 1.34, fx: 0.2, fy: 0.64 }}
          filter="saturate(0.8) contrast(1.06)" />
        <AbsoluteFill style={{ background: "#06101c", opacity: dark * 0.92 }} />
        {f >= CUT ? <AbsoluteFill style={{ background: "#3a5f8a", mixBlendMode: "multiply", opacity: 0.55 }} /> : null}
        {/* bill */}
        <div style={{
          position: "absolute", left: 150, top: 1010, width: 780, height: 470, background: "#f3efe5",
          rotate: `${-5 + cardIn * 10}deg`, translate: `0px ${cardIn * 1100 + drift}px`, padding: "40px 46px", boxSizing: "border-box",
          boxShadow: "0 30px 60px rgba(0,0,0,0.5)", filter: `brightness(${0.55 + 0.45 * lightsOn})`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: MONT, fontWeight: 800, fontSize: 54, color: INK, letterSpacing: 1 }}>
            <Bolt size={58} color="#d99a1e" /> TAGIHAN LISTRIK
          </div>
          <div style={{ height: 4, background: INK, margin: "22px 0 26px" }} />
          {[0.92, 0.7, 0.84, 0.55].map((w, i) => (
            <div key={i} style={{ height: 22, width: `${w * 100}%`, background: "#c9c3b6", borderRadius: 4, marginBottom: 22 }} />
          ))}
          <div style={{
            position: "absolute", left: 120, top: 150, padding: "6px 34px", border: `12px solid ${RED}`, color: RED,
            fontFamily: MONT, fontWeight: 900, fontSize: 132, letterSpacing: 6, rotate: "-13deg", mixBlendMode: "multiply",
            opacity: stampP * 0.93, scale: `${2.3 - 1.3 * stampP}`, borderRadius: 10,
          }}>DIPUTUS</div>
        </div>
      </AbsoluteFill>
      {/* iris close into the next scene */}
      <div style={{ position: "absolute", left: 860 - iris, top: 1650 - iris, width: iris * 2, height: iris * 2, borderRadius: "50%", background: "#141414" }} />
    </AbsoluteFill>
  );
};

// ===================================================== S3a: Ir. Sutami title on the paper wall
const CIRCLE = { x: 560, y: 1390, r: 610 };
export const DarkCircle: React.FC<{ rFrom?: number; at?: number }> = ({ rFrom = 2400, at = 0 }) => {
  const f = useCurrentFrame();
  const r = interpolate(f, [at, at + 16], [rFrom, CIRCLE.r], { ...clamp, easing: easeOut });
  return (
    <div style={{
      position: "absolute", left: CIRCLE.x - r, top: CIRCLE.y - r, width: r * 2, height: r * 2, borderRadius: "50%",
      background: "radial-gradient(circle at 45% 40%, #2a2a2a 0%, #121212 70%)", boxShadow: "0 0 80px rgba(0,0,0,0.35)",
    }} />
  );
};

export const S3Title: React.FC = () => {
  const f = useCurrentFrame();
  const up = interpolate(f, [4, 22], [90, 0], { ...clamp, easing: easeOut });
  const push = interpolate(f, [0, 100], [1, 1.04], clamp);
  return (
    <AbsoluteFill>
      <Paper />
      <AbsoluteFill style={{ scale: `${push}`, transformOrigin: "50% 70%" }}>
        <DarkCircle />
        <Img src={staticFile("img/ai_portrait_cut.png")} style={{
          position: "absolute", left: -40, top: 860 + up, width: 1160,
          filter: "grayscale(1) contrast(1.15) brightness(1.04) drop-shadow(0 30px 40px rgba(0,0,0,0.45))",
        }} />
      </AbsoluteFill>
      <Typed text="Ir. Sutami" start={22} cps={10} cursor style={{
        position: "absolute", left: 84, top: 300, fontFamily: MONT, fontWeight: 800, fontSize: 124, color: INK, letterSpacing: -2,
      }} />
      <WipeLine start={64} style={{ position: "absolute", left: 90, top: 460, fontFamily: MONT, fontWeight: 600, fontSize: 50, color: "#1d1d1d" }}>
        Menteri legendaris
      </WipeLine>
      <PhotoCard src="arsip/sutami_kp2.jpg" start={44} x={700} y={560} w={300} h={400} rot={6} from="right"
        filter="grayscale(1) contrast(1.1)" />
    </AbsoluteFill>
  );
};

// ===================================================== S3b: era Soekarno hingga Soeharto
export const S3Trio: React.FC = () => {
  const f = useCurrentFrame();
  const sc = interpolate(f, [0, 12], [1.1, 1], { ...clamp, easing: easeOut });
  return (
    <AbsoluteFill>
      <Paper />
      <AbsoluteFill style={{ scale: `${sc * interpolate(f, [0, 80], [1, 1.03], clamp)}`, transformOrigin: "50% 75%" }}>
        <DarkCircle rFrom={610} />
        <Img src={staticFile("img/ai_trio_cut.png")} style={{
          position: "absolute", left: 60, top: 300, width: 960,
          filter: "grayscale(1) contrast(1.12) brightness(1.03) drop-shadow(0 30px 40px rgba(0,0,0,0.45))",
        }} />
      </AbsoluteFill>
      <WipeLine start={2} style={{ position: "absolute", left: 0, width: W, textAlign: "center", top: 236, fontFamily: MONT, fontWeight: 700, fontSize: 46, color: INK }}>
        dipercaya sejak era
      </WipeLine>
      <PhotoCard src="arsip/soekarno.jpg" start={22} x={70} y={330} w={300} h={380} rot={-6} from="left"
        filter="grayscale(1) contrast(1.1)" objectPosition="50% 20%" label="SOEKARNO" labelStart={30} />
      <PhotoCard src="arsip/soeharto.jpg" start={55} x={710} y={330} w={300} h={380} rot={6} from="right"
        filter="grayscale(1) contrast(1.1)" objectPosition="50% 25%" label="SOEHARTO" labelStart={63} />
    </AbsoluteFill>
  );
};

// ===================================================== S4: "Kejeniusannya luar biasa" — JENIUS behind him
export const S4Jenius: React.FC = () => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, 7], [1, 0], { ...clamp, easing: easeOut });
  const letters = "JENIUS".split("");
  return (
    <AbsoluteFill style={{ scale: `${1 + enter * 0.18}`, filter: `blur(${enter * 14}px)` }}>
      <Paper />
      <div style={{ position: "absolute", top: 205, width: W, textAlign: "center", fontFamily: MONT, fontWeight: 900, fontSize: 236, letterSpacing: 2, lineHeight: 1 }}>
        {letters.map((c, i) => {
          const at = 8 + i * 2;
          return (
            <span key={i} style={{
              display: "inline-block", color: AMBER,
              opacity: interpolate(f, [at, at + 2], [0, 1], clamp),
              translate: `0px ${interpolate(f, [at, at + 6], [60, 0], { ...clamp, easing: easeOut })}px`,
            }}>{c}</span>
          );
        })}
      </div>
      <KenBurns src="img/ai_bw_white.jpg" iw={AI.w} ih={AI.h} dur={66} blend="multiply" style={{ top: 250 }}
        from={{ z: 1.0, fx: 0.5, fy: 0.5 }} to={{ z: 1.07, fx: 0.5, fy: 0.45 }}
        filter="grayscale(1) contrast(1.1)" />
    </AbsoluteFill>
  );
};

// ===================================================== B-roll helpers
export const VideoCard: React.FC<{ src: string; filter?: string; y?: number; w?: number; rot?: number; children?: React.ReactNode }> = ({
  src, filter = "", y = 640, w = 1000, rot = 0, children,
}) => {
  const f = useCurrentFrame();
  const h = (w * 9) / 16;
  const s = interpolate(f, [0, 60], [1, 1.05], clamp);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ scale: "3.6", filter: `blur(26px) brightness(0.45) ${filter}` }}>
        <OffthreadVideo src={staticFile(src)} muted style={{ width: W, height: (W * 9) / 16, position: "absolute", top: (H - (W * 9) / 16) / 2 }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: (W - w) / 2, top: y, width: w, height: h, rotate: `${rot}deg`, scale: `${s}`,
        boxShadow: "0 30px 70px rgba(0,0,0,0.6)", border: "6px solid rgba(255,255,255,0.9)", overflow: "hidden" }}>
        <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover", filter }} />
        {children}
      </div>
    </AbsoluteFill>
  );
};

export const VideoFull: React.FC<{ src: string; filter?: string; zoom?: [number, number]; dur?: number; origin?: string; vw?: number; vh?: number; posX?: number }> = ({
  src, filter = "", zoom = [1, 1.06], dur = 60, origin = "50% 50%", vw = 1280, vh = 720, posX = 0.5,
}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, dur], zoom, clamp);
  const sc = Math.max(W / vw, H / vh);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <OffthreadVideo src={staticFile(src)} muted style={{
        position: "absolute", width: vw * sc, height: vh * sc, left: Math.min(0, Math.max(W - vw * sc, W / 2 - posX * vw * sc)), top: (H - vh * sc) / 2,
        scale: `${z}`, transformOrigin: origin, filter,
      }} />
    </AbsoluteFill>
  );
};

// ===================================================== S5a: pencil on blueprint + formulas
export const S5Pencil: React.FC = () => (
  <AbsoluteFill>
    <VideoCard src="vid/pencil.mp4" filter="saturate(0.35) contrast(1.12) brightness(0.95)" y={560} />
    <Typed text="M = q·L² / 8" start={6} cps={14} style={{ position: "absolute", left: 120, top: 1180, fontFamily: ELITE, fontSize: 64, color: "#f1ead8" }} />
    <Typed text="A = M / (f·d)" start={24} cps={14} style={{ position: "absolute", left: 120, top: 1270, fontFamily: ELITE, fontSize: 64, color: "#f1ead8" }} />
  </AbsoluteFill>
);

// ===================================================== S5b: concrete + blueprint wireframe drawing on
const Wire: React.FC<{ p: number }> = ({ p }) => {
  const L = 2600;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M60 0H0V60" fill="none" stroke="rgba(150,210,255,0.22)" strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#grid)" opacity={Math.min(1, p * 3)} />
      <path
        d="M140 1380 H940 M140 1380 V700 M940 1380 V700 M140 700 H940 M140 1040 H940 M540 700 V1380 M140 700 L540 1040 L940 700 M140 1380 L540 1040 L940 1380"
        fill="none" stroke="#e8f4ff" strokeWidth="5" strokeLinecap="round"
        strokeDasharray={L} strokeDashoffset={L * (1 - p)} opacity={0.9}
      />
      {[[140, 700], [940, 700], [140, 1380], [940, 1380], [540, 1040], [140, 1040], [940, 1040]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={12} fill="#e8f4ff" opacity={p > 0.2 + i * 0.1 ? 1 : 0} />
      ))}
    </svg>
  );
};
export const S5Beton: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [2, 44], [0, 1], { ...clamp, easing: easeInOut });
  return (
    <AbsoluteFill>
      <VideoFull src="vid/concrete.mp4" filter="saturate(0.35) contrast(1.12) brightness(0.88) hue-rotate(-12deg)" dur={51} zoom={[1.05, 1.12]} />
      <AbsoluteFill style={{ background: "rgba(10,40,80,0.35)", mixBlendMode: "multiply" }} />
      <Wire p={p} />
    </AbsoluteFill>
  );
};

// ===================================================== S5c: "secara manual, tanpa kalkulator"
const Calculator: React.FC = () => (
  <svg width="340" height="440" viewBox="0 0 340 440">
    <rect x="10" y="10" width="320" height="420" rx="34" fill="#2b2b2b" />
    <rect x="44" y="44" width="252" height="92" rx="12" fill="#9fb59a" />
    {Array.from({ length: 12 }, (_, i) => (
      <rect key={i} x={44 + (i % 3) * 90} y={170 + Math.floor(i / 3) * 62} width="72" height="46" rx="10" fill={i % 3 === 2 ? AMBER : "#d8d4c8"} />
    ))}
  </svg>
);
export const S5Kalkulator: React.FC = () => {
  const f = useCurrentFrame();
  const TANPA = 29;
  const KAL = 38;
  const calcIn = interpolate(f, [6, 16], [0, 1], { ...clamp, easing: easeOut });
  const x1 = interpolate(f, [TANPA, TANPA + 5], [0, 1], clamp);
  const x2 = interpolate(f, [TANPA + 4, TANPA + 9], [0, 1], clamp);
  const pop = (at: number) => ({
    opacity: interpolate(f, [at, at + 2], [0, 1], clamp),
    scale: interpolate(f, [at, at + 5], [1.6, 1], { ...clamp, easing: easeOut }),
  });
  return (
    <AbsoluteFill style={{ translate: shake(f, KAL, 8, 10, "s5c") }}>
      <Paper />
      <PhotoCard src="arsip/sliderule.jpg" start={0} x={80} y={250} w={920} h={300} rot={-3} from="left" flash={false} border={10} />
      <div style={{ position: "absolute", left: 370, top: 660, scale: `${0.6 + 0.4 * calcIn}`, opacity: calcIn, filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.35))" }}>
        <Calculator />
        <svg width="340" height="440" style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1="20" y1="20" x2={20 + 300 * x1} y2={20 + 400 * x1} stroke={RED} strokeWidth="30" strokeLinecap="round" />
          <line x1="320" y1="20" x2={320 - 300 * x2} y2={20 + 400 * x2} stroke={RED} strokeWidth="30" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ position: "absolute", top: 1170, width: W, textAlign: "center", fontFamily: MONT, fontWeight: 900, lineHeight: 1, letterSpacing: -1 }}>
        <div style={{ fontSize: 120, color: RED, ...pop(TANPA) }}>TANPA</div>
        <div style={{ fontSize: 112, color: INK, ...pop(KAL) }}>KALKULATOR</div>
      </div>
    </AbsoluteFill>
  );
};

// ===================================================== S6a: "Namanya melekat pada proyek besar"
export const S6Nama: React.FC = () => (
  <KenBurns src="img/ai_bw_semanggi.jpg" iw={AI.w} ih={AI.h} dur={70}
    from={{ z: 1.3, fx: 0.5, fy: 0.86 }} to={{ z: 1.04, fx: 0.5, fy: 0.42 }}
    filter="grayscale(1) contrast(1.12) brightness(0.95)" />
);

// ===================================================== S6b: three project cards
export const S6Cards: React.FC = () => {
  const f = useCurrentFrame();
  const push = interpolate(f, [0, 140], [1, 1.06], clamp);
  return (
    <AbsoluteFill>
      <Paper />
      <AbsoluteFill style={{ scale: `${push}` }}>
        <PhotoCard src="arsip/semanggi_old.jpg" start={2} x={190} y={250} w={620} h={800} rot={-4} from="left"
          filter="saturate(0.55) contrast(1.08)" label="JEMBATAN SEMANGGI" labelStart={8} />
        <PhotoCard src="arsip/gbk_soekarno.jpg" start={49} x={100} y={880} w={880} h={500} rot={3} from="right"
          filter="grayscale(1) contrast(1.12)" label="STADION GELORA BUNG KARNO" labelStart={55} />
        <PhotoCard src="arsip/dpr.jpg" start={106} x={150} y={470} w={780} h={585} rot={-2} from="bottom"
          filter="saturate(0.55) contrast(1.08)" label="GEDUNG DPR" labelStart={110} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
