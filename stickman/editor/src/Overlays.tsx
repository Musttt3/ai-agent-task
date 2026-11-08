import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/fonts";
import { QuoteStyle } from "./cues";

// Fonts are bundled locally (public/fonts) so rendering works offline.
const BEBAS = "Bebas Neue";
const ELITE = "Special Elite";
loadFont({ family: BEBAS, url: staticFile("fonts/bebas.woff2") });
loadFont({ family: ELITE, url: staticFile("fonts/elite.woff2") });
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const RED = "#d8312b";

export const Vignette: React.FC<{ strength: number }> = ({ strength }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

export const Grain: React.FC<{ opacity: number }> = ({ opacity }) => {
  const frame = useCurrentFrame();
  const step = Math.floor(frame / 2);
  const x = Math.floor(random(`gx${step}`) * 512);
  const y = Math.floor(random(`gy${step}`) * 512);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile("grain.png")})`,
        backgroundPosition: `${x}px ${y}px`,
        mixBlendMode: "overlay",
        opacity,
      }}
    />
  );
};

export const Flicker: React.FC = () => {
  const frame = useCurrentFrame();
  const r = random(`fl${Math.floor(frame / 3)}`);
  const o = r > 0.93 ? 0.18 : r > 0.85 ? 0.07 : 0;
  return <AbsoluteFill style={{ backgroundColor: "black", opacity: o }} />;
};

export const Letterbox: React.FC = () => (
  <>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 34, background: "black" }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 34, background: "black" }} />
  </>
);

// Opening title
export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = "WABAH HILANG INGATAN";
  const out = interpolate(frame, [125, 145], [1, 0], clamp);
  const sub = interpolate(frame, [30, 45], [0, 1], clamp);
  const lineW = spring({ frame: frame - 18, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: out }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 65%)" }} />
      <div style={{ display: "flex", gap: 4 }}>
        {title.split("").map((ch, i) => {
          const f = frame - i * 1.6;
          const o = interpolate(f, [0, 10], [0, 1], clamp);
          const b = interpolate(f, [0, 12], [18, 0], clamp);
          const jitter = frame > 60 && random(`tj${Math.floor(frame / 2)}-${i}`) > 0.97 ? 6 : 0;
          return (
            <span
              key={i}
              style={{
                fontFamily: BEBAS,
                fontSize: 150,
                color: "#f3efe6",
                letterSpacing: 6,
                opacity: o,
                filter: `blur(${b}px)`,
                transform: `translateX(${jitter}px)`,
                textShadow: `0 6px 30px rgba(0,0,0,0.9), ${jitter ? "-4px 0 0 rgba(255,0,60,0.7)" : "0 0 0 transparent"}`,
                whiteSpace: "pre",
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{ width: 760 * lineW, height: 5, background: RED, marginTop: 4, boxShadow: "0 0 18px rgba(216,49,43,0.8)" }} />
      <div
        style={{
          fontFamily: ELITE,
          fontSize: 50,
          color: "#f3efe6",
          marginTop: 22,
          opacity: sub,
          transform: `translateY(${(1 - sub) * 20}px)`,
          textShadow: "0 4px 18px rgba(0,0,0,0.95)",
        }}
      >
        Hari Ke-6 di Klinik Pulau
      </div>
    </AbsoluteFill>
  );
};

// Chapter lower-third
export const ChapterCard: React.FC<{ index: number; title: string }> = ({ index, title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inS = spring({ frame: frame - 6, fps, config: { damping: 18, stiffness: 120 } });
  const out = interpolate(frame, [95, 110], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const x = (1 - inS) * -520 - out * 620;
  return (
    <div style={{ position: "absolute", left: 70, bottom: 110, transform: `translateX(${x}px)` }}>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <div style={{ width: 10, background: RED }} />
        <div style={{ background: "rgba(10,10,12,0.82)", padding: "14px 30px 12px 22px" }}>
          <div style={{ fontFamily: ELITE, fontSize: 26, color: "#e8a09c", letterSpacing: 4 }}>
            BAGIAN {String(index).padStart(2, "0")}
          </div>
          <div style={{ fontFamily: BEBAS, fontSize: 72, color: "#f3efe6", letterSpacing: 3, lineHeight: 1 }}>
            {title}
          </div>
        </div>
      </div>
    </div>
  );
};

// Top-left HUD tag
export const HudTag: React.FC<{ label: string; tone: "sepia" | "red" }> = ({ label, tone }) => {
  const frame = useCurrentFrame();
  const pulse = 0.55 + 0.45 * Math.abs(Math.sin(frame / 14));
  const color = tone === "red" ? RED : "#c9a26b";
  return (
    <div
      style={{
        position: "absolute",
        top: 64,
        left: 70,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "8px 20px",
        background: "rgba(10,10,12,0.6)",
        border: `2px solid ${color}`,
        borderRadius: 40,
      }}
    >
      <div style={{ width: 16, height: 16, borderRadius: 8, background: color, opacity: pulse }} />
      <div style={{ fontFamily: BEBAS, fontSize: 36, letterSpacing: 4, color: "#f3efe6" }}>{label}</div>
    </div>
  );
};

// "HARI KE-6" stamp slam
export const DayStamp: React.FC = () => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, 6], [3.2, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const o = interpolate(frame, [0, 4, 70, 85], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          transform: `scale(${s}) rotate(-8deg)`,
          opacity: o,
          border: `10px solid ${RED}`,
          padding: "6px 46px",
          fontFamily: BEBAS,
          fontSize: 190,
          color: RED,
          letterSpacing: 10,
          background: "rgba(0,0,0,0.35)",
          textShadow: "0 0 30px rgba(0,0,0,0.6)",
        }}
      >
        HARI KE-6
      </div>
    </AbsoluteFill>
  );
};

// Kinetic quotes
export const Quote: React.FC<{ text: string; style: QuoteStyle; dur: number }> = ({ text, style, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeOut = interpolate(frame, [dur - 8, dur], [1, 0], clamp);
  const base: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 120,
    display: "flex",
    justifyContent: "center",
    textAlign: "center",
    opacity: fadeOut,
  };
  if (style === "shout") {
    const s = spring({ frame, fps, config: { damping: 9, stiffness: 220 } });
    const j = frame < 18 ? (random(`q${frame}`) - 0.5) * 10 : 0;
    return (
      <div style={base}>
        <div
          style={{
            fontFamily: BEBAS,
            fontSize: 120,
            lineHeight: 0.95,
            color: "#fff",
            whiteSpace: "pre-line",
            transform: `scale(${0.4 + 0.6 * s}) translateX(${j}px)`,
            WebkitTextStroke: "3px #111",
            textShadow: `0 0 0 #000, 6px 6px 0 ${RED}, 0 10px 40px rgba(0,0,0,0.9)`,
            letterSpacing: 3,
          }}
        >
          {text}
        </div>
      </div>
    );
  }
  if (style === "type") {
    const chars = Math.floor(interpolate(frame, [0, Math.min(dur * 0.6, text.length * 1.4)], [0, text.length], clamp));
    const caret = Math.floor(frame / 8) % 2 === 0 ? "▌" : " ";
    return (
      <div style={base}>
        <div
          style={{
            fontFamily: ELITE,
            fontSize: 54,
            color: "#f6f0dc",
            background: "rgba(8,8,10,0.72)",
            padding: "14px 34px",
            borderLeft: `8px solid ${RED}`,
            maxWidth: 1500,
          }}
        >
          {text.slice(0, chars)}
          <span style={{ opacity: 0.8 }}>{caret}</span>
        </div>
      </div>
    );
  }
  if (style === "words") {
    const words = text.split(/\s+/).filter((w) => w !== "·");
    const per = Math.max(6, Math.floor((dur * 0.55) / words.length));
    return (
      <div style={{ ...base, gap: 50 }}>
        {words.map((w, i) => {
          const s = spring({ frame: frame - i * per, fps, config: { damping: 10, stiffness: 200 } });
          return (
            <div
              key={i}
              style={{
                fontFamily: BEBAS,
                fontSize: 130,
                color: "#fff",
                transform: `scale(${s}) rotate(${(i % 2 ? 1 : -1) * 3}deg)`,
                opacity: s > 0.01 ? 1 : 0,
                WebkitTextStroke: "3px #111",
                textShadow: `6px 6px 0 ${RED}, 0 10px 40px rgba(0,0,0,0.9)`,
              }}
            >
              {w}
            </div>
          );
        })}
      </div>
    );
  }
  if (style === "big") {
    const s = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
    return (
      <div style={base}>
        <div
          style={{
            fontFamily: BEBAS,
            fontSize: 140,
            color: "#f3efe6",
            letterSpacing: 8,
            transform: `scale(${0.7 + 0.3 * s})`,
            opacity: s,
            textShadow: "0 8px 40px rgba(0,0,0,0.95), 0 0 2px #000",
          }}
        >
          {text}
        </div>
      </div>
    );
  }
  // whisper
  const o = interpolate(frame, [0, 12], [0, 1], clamp);
  const sp = interpolate(frame, [0, dur], [2, 6], clamp);
  return (
    <div style={base}>
      <div
        style={{
          fontFamily: ELITE,
          fontStyle: "italic",
          fontSize: 58,
          color: "#efe9dc",
          letterSpacing: sp,
          opacity: o,
          textShadow: "0 4px 24px rgba(0,0,0,1), 0 0 4px #000",
          maxWidth: 1600,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// Radio waveform panel
export const RadioPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const bars = 48;
  const freq = (98.3 + Math.sin(frame / 25) * 0.4).toFixed(1);
  return (
    <div
      style={{
        position: "absolute",
        right: 70,
        top: 60,
        width: 520,
        padding: "18px 24px",
        background: "rgba(8,10,10,0.78)",
        border: "2px solid #7ad1a2",
        borderRadius: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: ELITE, color: "#7ad1a2", fontSize: 26 }}>
        <span>RADIO</span>
        <span>{freq} FM</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, height: 90, marginTop: 8 }}>
        {new Array(bars).fill(0).map((_, i) => {
          const h = 8 + Math.abs(Math.sin(frame / 3 + i * 0.7)) * 40 * random(`rb${frame}-${i}`) + random(`rc${Math.floor(frame / 2)}-${i}`) * 30;
          return <div key={i} style={{ width: 6, height: h, background: "#7ad1a2", opacity: 0.85, borderRadius: 3 }} />;
        })}
      </div>
    </div>
  );
};

// Phone video recording UI
export const RecOverlay: React.FC<{ startSec: number }> = ({ startSec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = startSec + frame / fps;
  const mm = String(Math.floor(t / 60)).padStart(2, "0");
  const ss = String(Math.floor(t % 60)).padStart(2, "0");
  const ff = String(Math.floor(frame % fps)).padStart(2, "0");
  const blink = Math.floor(frame / 15) % 2 === 0;
  const corner = (pos: React.CSSProperties) => (
    <div style={{ position: "absolute", width: 90, height: 90, borderColor: "#fff", borderStyle: "solid", opacity: 0.85, ...pos }} />
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px)",
        }}
      />
      {corner({ top: 70, left: 90, borderWidth: "6px 0 0 6px" })}
      {corner({ top: 70, right: 90, borderWidth: "6px 6px 0 0" })}
      {corner({ bottom: 70, left: 90, borderWidth: "0 0 6px 6px" })}
      {corner({ bottom: 70, right: 90, borderWidth: "0 6px 6px 0" })}
      <div style={{ position: "absolute", top: 100, left: 130, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 26, height: 26, borderRadius: 13, background: RED, opacity: blink ? 1 : 0.15 }} />
        <span style={{ fontFamily: BEBAS, fontSize: 48, color: "#fff", letterSpacing: 4 }}>REC</span>
      </div>
      <div style={{ position: "absolute", top: 104, right: 130, fontFamily: ELITE, fontSize: 38, color: "#fff" }}>
        02:{mm}:{ss}:{ff}
      </div>
      <div style={{ position: "absolute", bottom: 100, right: 130, fontFamily: ELITE, fontSize: 30, color: "#fff", opacity: 0.85 }}>
        VID_0200.MP4
      </div>
    </AbsoluteFill>
  );
};

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [10, 35], [0, 1], clamp);
  const s = interpolate(frame, [0, 120], [1, 1.06], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "black", justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `scale(${s})`, opacity: o, textAlign: "center" }}>
        <div style={{ fontFamily: BEBAS, fontSize: 150, color: "#f3efe6", letterSpacing: 14 }}>BERSAMBUNG…</div>
        <div style={{ fontFamily: ELITE, fontSize: 40, color: RED, marginTop: 6 }}>Wabah Hilang Ingatan</div>
      </div>
    </AbsoluteFill>
  );
};
