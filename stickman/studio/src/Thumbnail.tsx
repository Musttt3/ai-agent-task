import React, { useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, Img, staticFile } from "remotion";

// YouTube thumbnail, 1280x720. Variant picks the picture and its framing.
const VARIANTS = {
  A: { img: "013.jpg", scale: 1.32, x: 230, y: 40 },
  B: { img: "135.jpg", scale: 1.26, x: 150, y: 40 },
} as const;
export type ThumbVariant = keyof typeof VARIANTS;

const INK = "#1d1916";

const useFont = () => {
  const [handle] = useState(() => delayRender("font"));
  React.useEffect(() => {
    new FontFace("Fredoka", `url(${staticFile("fonts/Fredoka.ttf")})`, { weight: "300 700" })
      .load()
      .then((ff) => {
        (document.fonts as unknown as { add: (f: FontFace) => void }).add(ff);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [handle]);
};

const Outlined: React.FC<{ size: number; color: string; stroke: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  size,
  color,
  stroke,
  children,
  style,
}) => (
  <div
    style={{
      fontFamily: "Fredoka, sans-serif",
      fontWeight: 700,
      fontSize: size,
      lineHeight: 0.98,
      color,
      WebkitTextStroke: `${stroke}px ${INK}`,
      paintOrder: "stroke fill",
      textShadow: `0 ${stroke * 0.6}px 0 ${INK}, 0 10px 24px rgba(0,0,0,0.45)`,
      letterSpacing: 1,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Thumbnail: React.FC<{ variant: ThumbVariant }> = ({ variant }) => {
  useFont();
  const v = VARIANTS[variant];
  const w = 1280 * v.scale;
  const h = (w * 768) / 1376;
  return (
    <AbsoluteFill style={{ backgroundColor: INK, overflow: "hidden" }}>
      <Img
        src={staticFile(`img/${v.img}`)}
        style={{ position: "absolute", width: w, height: h, left: (1280 - w) / 2 + v.x, top: (720 - h) / 2 + v.y }}
      />
      {/* darken the left side so the title reads */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(20,16,14,0.88) 0%, rgba(20,16,14,0.70) 30%, rgba(20,16,14,0.0) 56%)",
        }}
      />
      <AbsoluteFill style={{ boxShadow: "inset 0 0 120px 30px rgba(0,0,0,0.45)" }} />

      <div style={{ position: "absolute", left: 46, top: 58, width: 620 }}>
        <div
          style={{
            display: "inline-block",
            background: "#e63946",
            color: "#fff",
            border: `5px solid ${INK}`,
            borderRadius: 14,
            padding: "4px 18px 8px",
            fontFamily: "Fredoka, sans-serif",
            fontWeight: 700,
            fontSize: 40,
            letterSpacing: 2,
            rotate: "-3deg",
            boxShadow: `6px 7px 0 ${INK}`,
          }}
        >
          30.000 TAHUN LALU
        </div>
        <Outlined size={112} color="#ffffff" stroke={14} style={{ marginTop: 26 }}>
          PUNYA
        </Outlined>
        <Outlined size={112} color="#ffffff" stroke={14}>
          HELIKOPTER
        </Outlined>
        <Outlined size={98} color="#ffc93c" stroke={14} style={{ marginTop: 10 }}>
          DI ZAMAN
        </Outlined>
        <Outlined size={98} color="#ffc93c" stroke={14}>
          PURBA?!
        </Outlined>
      </div>
    </AbsoluteFill>
  );
};
