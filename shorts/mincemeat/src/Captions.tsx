import React from 'react';
import {Easing, useCurrentFrame} from 'remotion';
import words from './words.json';
import {CAPTION_MUTE, FPS} from './timeline';
import {C, ramp, SERIF} from './lib';

type Wd = {w: string; s: number; e: number};

// Whisper spelling → script spelling
const FIX: Record<string, string> = {
  Intellijen: 'Intelijen',
  Glindor: 'Glyndwr',
  seraga: 'seragam',
  ketangan: 'ke tangan',
  menyerbus: 'menyerbu',
  Justru: 'justru',
  nazi: 'Nazi',
  'nazi.': 'Nazi.',
  'nazi,': 'Nazi,',
  pulau: 'Pulau',
};
// Words drawn in red
const KEY = new Set(['nazi', 'mayat', 'sicilia', 'glyndwr', 'michael', 'william', 'martin', 'palsu', 'yunani', 'spanyol', 'mincemeat', 'operation', 'kematiannya', 'cinta', 'salah', 'jerman', 'tipuan']);

const raw = (words as Wd[]).map((x) => ({...x, w: FIX[x.w] ?? x.w}));
// fix two timing slips: "Pada" (53.0) belongs right before "Juli", "1943" ends before "sekutu"
for (const x of raw) if (x.w === 'Pada' && x.s > 50) x.s = 53.2;

type Chunk = {words: Wd[]; s: number; e: number};
const chunks: Chunk[] = [];
{
  let cur: Wd[] = [];
  const flush = () => {
    if (cur.length) chunks.push({words: cur, s: cur[0].s, e: cur[cur.length - 1].e});
    cur = [];
  };
  for (const w of raw) {
    cur.push(w);
    const len = cur.map((x) => x.w).join(' ').length;
    if (/[.,!?]$/.test(w.w) || cur.length >= 4 || len > 20) flush();
  }
  flush();
  // each chunk stays until the next starts (but not more than 0.6 s after its last word)
  for (let i = 0; i < chunks.length; i++) {
    const nx = chunks[i + 1];
    chunks[i].e = nx ? Math.min(nx.s, chunks[i].e + 0.6) : chunks[i].e + 0.6;
  }
}

const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '');

export const Captions: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  if (CAPTION_MUTE.some(([a, b]) => t >= a && t < b)) return null;
  const ch = chunks.find((c) => t >= c.s - 0.05 && t < c.e);
  if (!ch) return null;
  const pop = ramp(t, ch.s - 0.05, ch.s + 0.12, Easing.out(Easing.back(1.6)));
  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        top: 1440,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        columnGap: 18,
        rowGap: 0,
        transform: `translateY(${(1 - pop) * 18}px) scale(${0.94 + 0.06 * pop})`,
        opacity: Math.min(1, pop * 1.4),
      }}
    >
      {ch.words.map((w, i) => {
        const active = t >= w.s - 0.03;
        const key = KEY.has(clean(w.w));
        return (
          <span
            key={i}
            style={{
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: 74,
              lineHeight: 1.12,
              color: key ? (active ? C.redBright : 'rgba(226,56,45,0.55)') : active ? C.bone : 'rgba(243,234,214,0.45)',
              textShadow: '0 4px 14px rgba(0,0,0,0.95), 0 0 2px #000',
              WebkitTextStroke: '1.5px rgba(0,0,0,0.6)',
            }}
          >
            {w.w}
          </span>
        );
      })}
    </div>
  );
};
