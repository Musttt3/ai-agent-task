// Captions from captions/voice.json: 1-2 words on screen, each word appears exactly at its start frame.
// Montserrat ExtraBold, white with a thick dark outline, centred a little below the middle, inside the Shorts safe
// area (above the bottom 15 %). Key words ("emas", "kaget", "kaya", "nggak") are golden with a small pop-in;
// every other word has no animation.
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { wordFrames } from "./timing";

const KEY = new Set(["emas", "kaget", "kaya", "nggak"]);
const clean = (w: string) => w.replace(/[.,…]+$/g, "").replace(/\.\.\.$/, "");
const norm = (w: string) => w.toLowerCase().replace(/[^a-z-]/g, "");
// group words in pairs; a group ends at punctuation, at a pause, or before/after a key word
type G = { words: { w: string; a: number; key: boolean }[]; a: number; b: number };
const groups: G[] = [];
for (let i = 0; i < wordFrames.length; i++) {
  const x = wordFrames[i], key = KEY.has(norm(x.w));
  const g = groups[groups.length - 1];
  const prev = wordFrames[i - 1];
  const join = g && g.words.length < 2 && !key && !g.words[0].key && prev && !/[.,!?…]$/.test(prev.w) && x.a - prev.b < 6;
  if (join) g.words.push({ w: clean(x.w), a: x.a, key }); else groups.push({ words: [{ w: clean(x.w), a: x.a, key }], a: x.a, b: x.b });
  groups[groups.length - 1].b = x.b;
}
groups.forEach((g, i) => { const nx = groups[i + 1]; g.b = nx ? Math.min(nx.a, g.b + 10) : g.b + 18; });

const FONT = `@font-face { font-family: "MontserratEB"; src: url("${staticFile("fonts/Montserrat.ttf")}") format("truetype"); font-weight: 100 900; }`;

export const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const g = groups.find((x) => f >= x.a && f < x.b);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <style>{FONT}</style>
      {g && (
        <div style={{ position: "absolute", left: 60, right: 60, top: 1290, textAlign: "center", fontFamily: "MontserratEB", fontWeight: 800,
          fontSize: 104, lineHeight: 1.1, letterSpacing: -1 }}>
          {g.words.filter((w) => f >= w.a).map((w, i) => {
            const t = Math.min(1, (f - w.a) / 6);
            const s = w.key ? (t < 0.6 ? 0.7 + (1.12 - 0.7) * (t / 0.6) : 1.12 - 0.12 * ((t - 0.6) / 0.4)) : 1;
            return (
              <span key={i} style={{ display: "inline-block", margin: "0 14px", transform: `scale(${s})`, color: w.key ? "#FFC93C" : "#FFFFFF",
                WebkitTextStroke: "16px #1b130c", paintOrder: "stroke fill", textShadow: "0 8px 18px rgba(0,0,0,0.35)" }}>{w.w}</span>
            );
          })}
        </div>
      )}
    </AbsoluteFill>
  );
};
