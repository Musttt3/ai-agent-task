import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { AMBER, H, INK, KenBurns, MONT, Paper, PLAYFAIR, RED, W, clamp, easeOut, shake } from "./lib";
import { AI, DarkCircle, VideoCard, VideoFull } from "./Scenes1";

const warm = "saturate(0.72) sepia(0.12) contrast(1.06)";

// ===================================================== S7a: "Namun, di balik kemegahan itu"
export const S7Megah: React.FC = () => {
  const f = useCurrentFrame();
  const sat = interpolate(f, [30, 66], [0.95, 0.35], clamp);
  return (
    <KenBurns src="img/ai_grand.jpg" iw={AI.w} ih={AI.h} dur={66}
      from={{ z: 1.0, fx: 0.5, fy: 0.45 }} to={{ z: 1.16, fx: 0.5, fy: 0.3 }}
      filter={`saturate(${sat}) contrast(1.08) brightness(0.92)`} />
  );
};

// ===================================================== S7b: "hidupnya justru sangat sederhana"
export const S7Sederhana: React.FC = () => (
  <KenBurns src="img/ai_rumah_meteran.jpg" iw={AI.w} ih={AI.h} dur={78}
    from={{ z: 1.55, fx: 0.7, fy: 0.84 }} to={{ z: 1.38, fx: 0.62, fy: 0.78 }}
    filter={warm} />
);

// ===================================================== S8a: wife mending his shirt
export const S8Jahit: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ translate: shake(f, 49, 6, 6, "s8") }}>
      <KenBurns src="img/ai_kantor_jahit.jpg" iw={AI.w} ih={AI.h} dur={63}
        from={{ z: 1.55, fx: 0.74, fy: 0.24 }} to={{ z: 1.72, fx: 0.8, fy: 0.27 }}
        filter={warm} />
    </AbsoluteFill>
  );
};

// ===================================================== S8b: needle B-roll
export const S8Jarum: React.FC = () => (
  <VideoFull src="vid/needle.mp4" filter="saturate(0.55) sepia(0.25) contrast(1.1) brightness(0.9)" zoom={[1.0, 1.08]} dur={58} />
);

// ===================================================== S9a: eating his packed lunch
export const S9Makan: React.FC = () => (
  <KenBurns src="img/ai_kantor_jahit.jpg" iw={AI.w} ih={AI.h} dur={69}
    from={{ z: 1.3, fx: 0.38, fy: 0.7 }} to={{ z: 1.48, fx: 0.46, fy: 0.73 }}
    filter={warm} />
);

export const S9Nasi: React.FC = () => (
  <VideoFull src="vid/rice.mp4" filter="saturate(0.6) sepia(0.2) contrast(1.08)" zoom={[1.08, 1.0]} dur={21} />
);

// ===================================================== S9c: nasi + tempe vs restoran mewah
export const S9Tempe: React.FC = () => {
  const f = useCurrentFrame();
  const ring = interpolate(f, [0, 10], [0, 1], { ...clamp, easing: easeOut });
  const RESTO = 39;
  const STRIKE = 54;
  const rIn = interpolate(f, [RESTO, RESTO + 8], [0, 1], { ...clamp, easing: easeOut });
  const st = interpolate(f, [STRIKE, STRIKE + 6], [0, 1], { ...clamp, easing: easeOut });
  const C = 2 * Math.PI * 300;
  return (
    <AbsoluteFill>
      <KenBurns src="img/ai_kantor_jahit.jpg" iw={AI.w} ih={AI.h} dur={75}
        from={{ z: 1.95, fx: 0.64, fy: 0.735 }} to={{ z: 2.1, fx: 0.64, fy: 0.735 }}
        filter={warm} />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <ellipse cx={540} cy={960} rx={330} ry={210} fill="none" stroke={AMBER} strokeWidth={10}
          strokeDasharray={C} strokeDashoffset={C * (1 - ring)} strokeLinecap="round" transform="rotate(-8 540 960)" />
      </svg>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)", opacity: rIn }} />
      <div style={{ position: "absolute", top: 1320, width: W, textAlign: "center", opacity: rIn, translate: `0px ${(1 - rIn) * 40}px` }}>
        <span style={{ position: "relative", fontFamily: PLAYFAIR, fontStyle: "italic", fontWeight: 700, fontSize: 124, color: "#E9CB83", textShadow: "0 6px 20px rgba(0,0,0,0.7)" }}>
          Restoran Mewah
          <span style={{ position: "absolute", left: -20, top: "52%", height: 12, width: `${st * 108}%`, background: RED, borderRadius: 6, rotate: "-3deg", boxShadow: "0 3px 8px rgba(0,0,0,0.5)" }} />
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ===================================================== S10: leaking roof
export const S10Bocor: React.FC = () => (
  <KenBurns src="img/ai_bocor_sakit.jpg" iw={AI.w} ih={AI.h} dur={81}
    from={{ z: 1.45, fx: 0.66, fy: 0.17 }} to={{ z: 1.62, fx: 0.72, fy: 0.15 }}
    filter="saturate(0.55) contrast(1.08) brightness(0.88) hue-rotate(-6deg)" />
);
export const S10Hujan: React.FC = () => (
  <VideoFull src="vid/roofrain.mp4" vw={1920} vh={1080} posX={0.7} filter="saturate(0.5) contrast(1.1) brightness(1.05)" zoom={[1.0, 1.06]} dur={69} />
);

// ===================================================== S11: illness
export const S11Monitor: React.FC = () => (
  <VideoCard src="vid/monitor.mp4" filter="saturate(0.6) contrast(1.1)" y={620} />
);
export const S11Ranjang: React.FC = () => (
  <KenBurns src="img/ai_bocor_sakit.jpg" iw={AI.w} ih={AI.h} dur={51}
    from={{ z: 1.5, fx: 0.48, fy: 0.5 }} to={{ z: 1.62, fx: 0.5, fy: 0.53 }}
    filter="saturate(0.6) contrast(1.06) brightness(0.92)" />
);
export const S11Soeharto: React.FC = () => (
  <KenBurns src="img/ai_bocor_sakit.jpg" iw={AI.w} ih={AI.h} dur={74}
    from={{ z: 1.5, fx: 0.4, fy: 0.86 }} to={{ z: 1.3, fx: 0.5, fy: 0.84 }}
    filter="saturate(0.6) contrast(1.06) brightness(0.92)" />
);

// ===================================================== S12a: "Tahun 1980" — glowing number over a candle
export const S12Tahun: React.FC = () => {
  const f = useCurrentFrame();
  const AT = 13;
  const p = interpolate(f, [AT, AT + 10], [0, 1], { ...clamp, easing: easeOut });
  const jitter = f >= AT && f < AT + 6 ? ((f * 37) % 11) - 5 : 0;
  const glow = 0.75 + 0.25 * Math.sin(f / 6);
  return (
    <AbsoluteFill style={{ background: "#050505" }}>
      <AbsoluteFill style={{ opacity: 0.6 }}>
        <VideoFull src="vid/candle.mp4" filter="saturate(0.5) brightness(0.7) contrast(1.1)" zoom={[1.0, 1.05]} dur={70} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)" }} />
      <div style={{
        position: "absolute", top: 560, width: W, textAlign: "center", fontFamily: MONT, fontWeight: 900, fontSize: 280,
        color: AMBER, opacity: p, letterSpacing: interpolate(p, [0, 1], [60, 4]), filter: `blur(${(1 - p) * 26}px)`,
        textShadow: `0 0 ${50 * glow}px rgba(242,179,61,0.75), 0 0 ${120 * glow}px rgba(242,140,40,0.45)`, translate: `${jitter * 4}px 0px`,
      }}>1980</div>
    </AbsoluteFill>
  );
};

// ===================================================== S12b: archival portrait
export const S12Arsip: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 10], [0, 1], clamp);
  const s = interpolate(f, [0, 66], [1.0, 1.06], clamp);
  return (
    <AbsoluteFill style={{ background: "#0b0b0b" }}>
      <div style={{ position: "absolute", left: 170, top: 420, width: 740, height: 1037, opacity: o, scale: `${s}`,
        boxShadow: "0 40px 90px rgba(0,0,0,0.8)", border: "10px solid #e9e4d8" }}>
        <Img src={staticFile("arsip/sutami_kp2.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.15) brightness(0.95)" }} />
      </div>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 45% at 50% 48%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)" }} />
    </AbsoluteFill>
  );
};

// ===================================================== S12c: "tanpa meninggalkan kekayaan melimpah"
export const S12Makam: React.FC = () => (
  <KenBurns src="img/ai_makam.jpg" iw={AI.w} ih={AI.h} dur={35}
    from={{ z: 1.95, fx: 0.38, fy: 0.2 }} to={{ z: 2.05, fx: 0.4, fy: 0.2 }}
    filter="saturate(0.55) sepia(0.2) contrast(1.05) brightness(0.9)" />
);

// ===================================================== S13: closing line
export const S13Penutup: React.FC = () => {
  const f = useCurrentFrame();
  const fadeIn = interpolate(f, [0, 14], [0, 1], clamp);
  const word = (at: number) => {
    const p = interpolate(f, [at, at + 9], [0, 1], { ...clamp, easing: easeOut });
    return { opacity: p, filter: `blur(${(1 - p) * 12}px)`, translate: `0px ${(1 - p) * 26}px`, display: "inline-block" } as React.CSSProperties;
  };
  const dimFirst = interpolate(f, [124, 136], [1, 0.38], clamp);
  const glow = 0.8 + 0.2 * Math.sin(f / 7);
  const fadeOut = interpolate(f, [237, 259], [1, 0], clamp);
  const amber: React.CSSProperties = { color: AMBER, textShadow: `0 0 ${36 * glow}px rgba(242,179,61,0.65)` };
  const sc = interpolate(f, [0, 259], [1, 1.05], clamp);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ opacity: fadeIn * fadeOut }}>
        <Paper tint="#2b2b2b" />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 55% at 50% 30%, rgba(255,220,160,0.10) 0%, rgba(0,0,0,0.55) 100%)" }} />
        <AbsoluteFill style={{ scale: `${sc}`, transformOrigin: "50% 80%" }}>
          <DarkCircle rFrom={610} />
          <Img src={staticFile("img/ai_portrait_cut.png")} style={{
            position: "absolute", left: -40, top: 900, width: 1160,
            filter: "grayscale(1) contrast(1.15) brightness(0.92) drop-shadow(0 -6px 30px rgba(242,179,61,0.25))",
          }} />
        </AbsoluteFill>
        <div style={{ position: "absolute", top: 330, width: W, textAlign: "center", fontFamily: MONT, lineHeight: 1.05 }}>
          <div style={{ fontWeight: 800, fontSize: 70, color: "#f2efe8", opacity: dimFirst, letterSpacing: 1 }}>
            <span style={word(66)}>JABATAN</span> <span style={word(80)}>BISA</span> <span style={word(90)}>BERAKHIR</span>
          </div>
          <div style={{ height: 40 }} />
          <div style={{ fontWeight: 900, fontSize: 132, letterSpacing: -2, ...amber }}><span style={word(133)}>KEJUJURAN</span></div>
          <div style={{ fontWeight: 800, fontSize: 64, color: "#f2efe8", marginTop: 14 }}>
            <span style={word(160)}>AKAN</span> <span style={word(166)}>TERUS</span>
          </div>
          <div style={{ fontWeight: 900, fontSize: 132, letterSpacing: -2, marginTop: 8, ...amber }}><span style={word(173)}>DIKENANG</span></div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Black: React.FC = () => <AbsoluteFill style={{ background: INK }} />;
