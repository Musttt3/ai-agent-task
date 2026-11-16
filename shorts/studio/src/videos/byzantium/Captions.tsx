// Word-by-word captions in the framework's house style (2d-in-3d-animation-agent: Poppins Black, white with a thick
// black outline, micro-pop 1.12x), one word per beat from words.json; key words in yellow. Sized for 1080x1920 (the 2K
// export scales the whole DOM).
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import WORDS from "./words.json";

type Wd = { w: string; s: number; e: number };
const KEY = new Set(["constantinople", "1453", "cannons", "collapsing", "palace", "warn", "bells", "mehmed", "roar", "breaking", "smoke", "late",
  "constantine", "dies", "thousand", "end", "warning", "fall"]);
const clean = (w: string) => w.replace(/[.,;:"]/g, "").replace(/^'|'$/g, "");
const words = (WORDS as Wd[]).map((x, i, a) => {
  const next = a[i + 1];
  const end = next && next.s - x.e < 0.45 ? next.s : x.e + 0.18;
  return { text: clean(x.w), key: KEY.has(clean(x.w).toLowerCase().replace(/[^a-z0-9]/g, "")), s: x.s, e: end };
});

export const Captions: React.FC = () => {
  const f = useCurrentFrame(), time = f / 30;
  // hold the frame until Poppins Black is really loaded, so no frame is captured with a fallback font
  const [handle] = useState(() => delayRender("caption font"));
  useEffect(() => {
    const ff = new FontFace("PoppinsBlack", `url(${staticFile("fonts/Poppins-Black.woff2")}) format("woff2")`, { weight: "900" });
    ff.load().then((x) => { (document.fonts as unknown as { add: (f: FontFace) => void }).add(x); continueRender(handle); }).catch(() => continueRender(handle));
  }, [handle]);
  const w = words.find((c) => time >= c.s - 0.02 && time < c.e);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 500, pointerEvents: "none" }}>
      {w && (() => {
        const el = Math.max(0, time - w.s), k = Math.min(1, el / 0.08), sc = 1 + 0.12 * Math.pow(1 - k, 2);
        return (
          <span style={{ fontFamily: "'PoppinsBlack', 'Poppins', sans-serif", fontWeight: 900, fontSize: 92, lineHeight: 1.1, color: w.key ? "#ffd43b" : "#ffffff",
            WebkitTextStroke: "12px #000000", paintOrder: "stroke fill", textShadow: "0 6px 16px rgba(0,0,0,0.6)", letterSpacing: "0.5px", textAlign: "center",
            maxWidth: "90%", transform: `scale(${sc.toFixed(3)})`, display: "inline-block" }}>{w.text}</span>
        );
      })()}
    </AbsoluteFill>
  );
};
