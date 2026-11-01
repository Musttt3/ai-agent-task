import React from "react";
import { BODY, RED, YELLOW, lerp, textStroke, useT } from "./lib";
import { WORDS, Word } from "./words";

const KEYWORDS = [
  "bos",
  "anonim",
  "ocda",
  "kalimar",
  "white",
  "keluhan",
  "jutaan",
  "hiburan",
  "humor",
  "indonesia",
  "bosmu",
  "seragam",
  "sorotan",
  "serius",
];

const clean = (w: string) => w.toLowerCase().replace(/[^a-z]/g, "");

type Page = { words: Word[]; start: number; end: number };

const buildPages = (): Page[] => {
  const pages: Page[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (cur.length) pages.push({ words: cur, start: cur[0].s, end: 0 });
    cur = [];
  };
  for (const w of WORDS) {
    cur.push(w);
    const chars = cur.map((x) => x.w).join(" ").length;
    if (/[.,?!]$/.test(w.w) || cur.length >= 3 || chars > 16) flush();
  }
  flush();
  for (let i = 0; i < pages.length; i++) {
    const last = pages[i].words[pages[i].words.length - 1];
    const next = pages[i + 1];
    pages[i].end = next ? Math.min(next.start, last.e + 0.6) : last.e + 0.8;
  }
  return pages;
};

const PAGES = buildPages();

export const Captions: React.FC = () => {
  const t = useT();
  const page = PAGES.find((p) => t >= p.start - 0.02 && t < p.end);
  if (!page) return null;
  const local = t - page.start;
  const enter = lerp(local, [0, 0.18], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        top: 1390,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "6px 22px",
        scale: String(0.85 + 0.15 * enter),
        opacity: enter,
      }}
    >
      {page.words.map((w, i) => {
        const active = t >= w.s && (t < w.e + 0.08 || i === page.words.length - 1);
        const said = t >= w.s;
        const key = KEYWORDS.includes(clean(w.w));
        const pop = lerp(t, [w.s, w.s + 0.12], [1.25, 1]);
        const text = w.w.replace(/[.,]$/, "").toUpperCase();
        return (
          <span
            key={i}
            style={{
              fontFamily: BODY,
              fontWeight: 900,
              fontSize: 84,
              lineHeight: 1.12,
              letterSpacing: -1,
              color: key && said ? INK_ON_KEY : active ? YELLOW : "#FFFFFF",
              background: key && said ? (active ? YELLOW : RED) : "transparent",
              padding: key && said ? "0 14px" : 0,
              borderRadius: 14,
              rotate: key && said ? "-2deg" : "0deg",
              scale: String(active ? pop : 1),
              opacity: said ? 1 : 0.55,
              ...(key && said ? {} : textStroke(14)),
              textShadow: key && said ? "none" : "0 8px 22px rgba(0,0,0,0.6)",
              boxShadow: key && said ? "0 10px 0 rgba(0,0,0,0.85)" : "none",
            }}
          >
            {text}
          </span>
        );
      })}
    </div>
  );
};

const INK_ON_KEY = "#111";
