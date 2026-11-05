// Film assembly: timeline.json (from tools/timeline.py) → shot list, in-medium transitions (door splits), subtitles,
// sound events (window.EV) and on-screen texts (window.TEXTS). Deterministic in t.
import { D, W, H, CX, clamp, seg, ss, eio, subCard, leaves } from './common.js';
import { tower, bedroom, tv, street } from './scenes_a.js';
import { phone, school, village, wait, marquee } from './scenes_b.js';
import { overhead, towers, city, dial } from './scenes_c.js';

let TL = null;
export let DUR = 72;
const FN = { tower, bedroom, tv, street, phone, school, village, wait, marquee, overhead, towers, city, dial };
// transitions at the start of a shot: split = the outgoing frame opens as two door leaves along the centre seam
const TRANS = { bedroom: 'split', street: 'split', village: 'split', overhead: 'split', towers: 'split' };
const TLEN = .55;

export async function init() {
  TL = await (await fetch('timeline.json')).json();
  DUR = TL.DUR;
}
const shots = () => TL.shots.map(([name, t0], i) => ({ name, t0, t1: i + 1 < TL.shots.length ? TL.shots[i + 1][1] : TL.DUR }));
const ctx = (t, s) => ({ t, keys: TL.keys, tl: TL, shot0: s.t0 });

let off = null, frozen = null;
const canvas = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };

function drawShot(g, s, t) {
  g.save();
  if (s.name === 'wait') {
    if (!frozen) {   // the village, frozen at the moment of "Tapi"
      frozen = canvas(); const v = shots().find(x => x.name === 'village');
      village(frozen.getContext('2d'), v.t1 - v.t0, v.t1 - v.t0, ctx(v.t1, v));
    }
    wait(g, t - s.t0, s.t1 - s.t0, ctx(t, s), frozen);
  } else FN[s.name](g, t - s.t0, s.t1 - s.t0, ctx(t, s));
  g.restore();
}

function splitOpen(g, img, p) {
  const e = eio(seg(p, .08, 1));
  for (const sd of [-1, 1]) {
    const w = W / 2 * (1 - e); if (w < 1) continue;
    g.save();
    const x0 = sd < 0 ? 0 : W - w;
    g.beginPath(); g.rect(x0, 0, w, H); g.clip();
    // the half of the old frame, foreshortened as its leaf swings open about the outer edge
    g.translate(sd < 0 ? 0 : W, 0); g.scale(1 - e, 1); g.translate(sd < 0 ? 0 : -W, 0);
    g.drawImage(img, sd < 0 ? 0 : W / 2, 0, W / 2, H, sd < 0 ? 0 : W / 2, 0, W / 2, H);
    g.fillStyle = `rgba(0,0,0,${.55 * e})`; g.fillRect(sd < 0 ? 0 : W / 2, 0, W / 2, H);
    g.restore();
    const ex = sd < 0 ? w : W - w;
    D.gline(g, [[ex, 0], [ex, H]], { w: 3, double: 6, glow: .6 * (1 - e) });
  }
  if (p < .2) D.glow(g, CX, H / 2, 600, '#ffcf7a', .5 * (1 - p / .2));
}

export function renderFilm(g, t) {
  const S = shots(), i = S.findIndex(s => t < s.t1), s = S[i < 0 ? S.length - 1 : i];
  drawShot(g, s, t);
  const tr = TRANS[s.name];
  if (tr && t < s.t0 + TLEN && i > 0) {
    if (!off) off = canvas();
    const o = off.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1;
    drawShot(o, S[i - 1], t);
    splitOpen(g, off, seg(t, s.t0, s.t0 + TLEN));
  }
  // subtitles
  for (const c of TL.cards) {
    if (t < c.t0 || t > c.t1) continue;
    subCard(g, c.rows, { p: seg(t, c.t0, c.t0 + .26), out: seg(t, c.t1 - .14, c.t1) });
  }
  // film grain-free vignette lift: keep blacks off pure black (blackdetect)
  g.fillStyle = 'rgba(40,28,14,.06)'; g.fillRect(0, 0, W, H);
}

export function texts(t) {
  const out = [];
  for (const c of (TL?.cards || [])) if (t >= c.t0 + .26 && t <= c.t1 - .14) out.push({ id: 'sub' + c.t0, text: c.rows.join(' '), x0: 60, y0: 1380, x1: 1020, y1: 1540 });
  return out;
}

// sound events for the mixer (foley + music hits), all on the same clock as the picture
export function events() {
  const K = TL.keys, S = Object.fromEntries(shots().map(s => [s.name, s])), ev = [];
  const add = (t, type, o = {}) => ev.push({ t: +t.toFixed(4), type, ...o });
  for (const [n, tr] of Object.entries(TRANS)) if (tr === 'split') add(S[n].t0, 'door', { kind: 'split' });
  // 1 tower: knife-switch + bulb per letter
  add(.05, 'shimmer', { dur: 1.4 });
  'INDONESIA'.split('').forEach((_, i) => add(K.indonesia1 + i * .07, 'bulb', { i }));
  [0, .06, .12, .18, .45].forEach((d, i) => add(K.emas + d, 'bulb', { i: i + 9, big: i === 4 ? 1 : 0 }));
  // 2 bedroom
  add(S.bedroom.t0 + .15, 'alarm', { dur: K.kaget + .45 - (S.bedroom.t0 + .15) });
  const L2 = TL.lines.find(l => l.id === 'L2'), wB = L2.wordsF.find(w => /^bangun/i.test(w.w));
  add((wB ? wB.s : L2.on) - .1, 'rustle'); add(K.kaget - .3, 'creak'); add(K.kaget - .08, 'pop');
  // 3 tv
  add(S.tv.t0 + .05, 'tvon'); add(K.resmi - .2, 'ratchet', { dur: K.maju + .1 - (K.resmi - .2) }); add(K.maju, 'chime');
  // 4 street
  add(S.street.t0 + .02, 'latch');
  for (let x = S.street.t0 + .25; x < S.street.t1; x += 1 / 3.5) add(x, 'step', { soft: 1 });
  add(K.transportasi - .6, 'tram', { dur: 2.0 }); add(K.hampir, 'ratchet', { dur: K.kemacetan + .4 - K.hampir }); add(K.kemacetan + .3, 'ding', { pitch: 76 });
  // 5 phone
  add(S.phone.t0 + .35, 'tap'); add(K.lapangan, 'ding', { pitch: 72 }); add(K.gaji, 'ding', { pitch: 76 }); add(K.harga, 'ding', { pitch: 79 });
  // 6 school / hospital
  add(S.school.t0 + .3, 'schoolbell'); add(K.rumah - .35, 'door', { kind: 'split' });
  for (let x = K.rumah + .5; x < S.school.t1; x += .9) add(x, 'beep');
  // 7 village
  const vS = S.village, tL = K.listrik, tA = K.andal; for (let i = 0; i < 6; i++) add(tL + (tA - tL + .3) * i / 5, 'bulb', { i: 20 + i });
  add(K.internet - .05, 'radio', { dur: 1.6 });
  // 8 wait: silence, one tick
  add(S.wait.t0, 'door', { kind: 'half' }); add(S.wait.t0 + .4, 'tick'); add(S.wait.t0 + 1.4, 'tick', { soft: 1 });
  // 9 marquee
  for (let i = 0; i < 9; i++) add(S.marquee.t0 + .15 + i * .1, 'bulb', { i: 30 + i, small: 1 });
  for (let i = 0; i < 10; i++) add(S.marquee.t0 + .5 + i * .27, 'coin', { i });
  add(K.nggak, 'short'); add(K.nggak + .05, 'pop');
  // 10 overhead
  for (let i = 0; i < 16; i++) add(K.kesempatan + i * .07, 'step', { soft: 1, tick: 1 });
  add(K.kesempatan + .3, 'shimmer', { dur: 1.2 }); add(K.baik, 'chime');
  // 11 towers
  add(S.towers.t0 + .1, 'whoosh', { dur: 1.6 }); add(K.gedung, 'shimmer', { dur: 1.0 }); add(K.teknologi + .2, 'ding', { pitch: 84 });
  // 12 city
  add(S.city.t0 + .35, 'whoosh', { dur: 1.8 }); add(K.rakyat, 'swell', { dur: K.kemajuannya + .8 - K.rakyat });
  // 13 dial
  add(S.dial.t0, 'ratchet', { dur: K.itu - S.dial.t0, slowing: 1 }); add(K.itu, 'bell'); add(TL.DUR - 2.2, 'switchoff'); add(TL.DUR - .5, 'tick');
  return ev.sort((a, b) => a.t - b.t);
}
