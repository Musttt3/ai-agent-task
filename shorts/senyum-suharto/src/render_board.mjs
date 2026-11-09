// Senyum Suharto, evidence-board cut: one continuous camera move over a cork board with
// pins, red string, name strips, index cards and a flashlight sequence. Drawn frame by frame.
//
//   node src/render.mjs --stills 0.5,3.6 --scale 0.25 --outdir out/stills
//   node src/render.mjs --from 0 --to 1900 --out out/chunk0.mp4          (full 2160x3840)
//
import { createCanvas, loadImage, GlobalFonts, Path2D } from '@napi-rs/canvas';
import { feature } from 'topojson-client';
import { interpolateZoom } from 'd3-interpolate';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const A = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, arr) => {
  if (v.startsWith('--')) acc.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));

const SC = +(A.scale || 1);
const W = Math.round(2160 * SC), H = Math.round(3840 * SC);
const FPS = 30, DUR = 63.32, NF = Math.ceil(DUR * FPS); // 1900 frames = 63.333 s
const DEG = Math.PI / 180;

// ------------------------------------------------------------------ helpers
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const sst = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const ss = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const eOut3 = (t) => 1 - Math.pow(1 - clamp(t), 3);
const eIn2 = (t) => clamp(t) ** 2;
const eInOut2 = (t) => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const C = (w, h) => createCanvas(Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
const rot2 = (x, y, r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];

// ------------------------------------------------------------------ fonts
const F = (f) => path.join(ROOT, 'fonts', f);
GlobalFonts.registerFromPath(F('oswald-latin-700-normal.ttf'), 'Oswald');
GlobalFonts.registerFromPath(F('oswald-latin-500-normal.ttf'), 'OswaldMed');
GlobalFonts.registerFromPath(F('permanent-marker-latin-400-normal.ttf'), 'Marker');
GlobalFonts.registerFromPath(F('special-elite-latin-400-normal.ttf'), 'Elite');
GlobalFonts.registerFromPath(F('playfair-display-latin-900-normal.ttf'), 'Playfair');
GlobalFonts.registerFromPath(F('caveat-latin-700-normal.ttf'), 'Caveat');

// ------------------------------------------------------------------ palette
const RED = '#b0251c';
const INK = '#221b15';
const PAPER = '#e7e0cf';

// ------------------------------------------------------------------ load images
const G = (f) => path.join(ROOT, 'assets', 'gen', f);
const IMG = {};
for (const n of ['portrait', 'cover', 'contact1', 'contact2', 'contact3', 'peci', 'roosa1', 'roosa2', 'militer', 'protes', 'sawah'])
  IMG[n] = await loadImage(G(n + '.jpg'));
IMG.corkBase = await loadImage(G('cork_base.png'));
IMG.corkTile = await loadImage(G('cork_tile.png'));
IMG.paperTile = await loadImage(G('paper_tile.png'));
IMG.grain = [];
for (let i = 0; i < 6; i++) IMG.grain.push(await loadImage(G(`grain${i}.png`)));

// ------------------------------------------------------------------ texture builders (1 texture px = 1 world unit unless noted)
function paperize(ctx, w, h, base, opts = {}) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = opts.tile ?? 0.55;
  ctx.fillStyle = ctx.createPattern(IMG.paperTile, 'repeat'); ctx.fillRect(0, 0, w, h);
  ctx.restore();
  // aged edges
  const e = opts.edge ?? Math.min(w, h) * 0.06;
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  const sides = [[0, 0, e, 0, 0, 0, e, h], [w, 0, w - e, 0, w - e, 0, e, h], [0, 0, 0, e, 0, 0, w, e], [0, h, 0, h - e, 0, h - e, w, e]];
  for (const [x0, y0, x1, y1, rx, ry, rw, rh] of sides) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, `rgba(150,120,80,${opts.edgeA ?? 0.35})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh);
  }
  ctx.restore();
}

function makePrint(img, photoW, border, crop) {
  const sw = crop ? crop[2] : img.width, sh = crop ? crop[3] : img.height;
  const photoH = Math.round(photoW * sh / sw);
  const w = photoW + 2 * border, h = photoH + 2 * border;
  const c = C(w, h), x = c.getContext('2d');
  paperize(x, w, h, '#e9e3d3', { edge: border * 0.9, edgeA: 0.28 });
  if (crop) x.drawImage(img, crop[0], crop[1], crop[2], crop[3], border, border, photoW, photoH);
  else x.drawImage(img, border, border, photoW, photoH);
  // paper grain shows through the emulsion slightly
  x.save(); x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.25;
  x.fillStyle = x.createPattern(IMG.paperTile, 'repeat'); x.fillRect(border, border, photoW, photoH); x.restore();
  // gentle sheen
  const g = x.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, 'rgba(255,250,235,0.10)'); g.addColorStop(0.45, 'rgba(255,250,235,0)'); g.addColorStop(1, 'rgba(0,0,0,0.06)');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(40,30,20,0.35)'; x.lineWidth = 2; x.strokeRect(border, border, photoW, photoH);
  return { tex: c, w, h, photo: { x: border - w / 2, y: border - h / 2, w: photoW, h: photoH } };
}

function makeShadow(w, h, R) {
  const s = 1 / 8; // low-res texture, stretched when drawn
  const c = C((w + 4 * R) * s, (h + 4 * R) * s), x = c.getContext('2d');
  x.filter = `blur(${R * s}px)`;
  x.fillStyle = 'rgba(0,0,0,1)';
  x.fillRect(2 * R * s, 2 * R * s, w * s, h * s);
  return { tex: c, w: w + 4 * R, h: h + 4 * R };
}

function makeTag(lines, w, h) {
  const c = C(w, h), x = c.getContext('2d');
  paperize(x, w, h, '#efe8d7', { edge: 30, edgeA: 0.25 });
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = INK;
  for (const L of lines) { x.font = L.font; x.fillStyle = L.color || INK; x.fillText(L.text, w / 2, L.y); }
  // ink texture
  x.save(); x.globalCompositeOperation = 'destination-out'; x.globalAlpha = 0.18;
  x.fillStyle = x.createPattern(IMG.paperTile, 'repeat'); x.fillRect(0, 0, w, h); x.restore();
  x.save(); x.globalCompositeOperation = 'destination-over'; x.fillStyle = '#efe8d7'; x.fillRect(0, 0, w, h); x.restore();
  return { tex: c, w, h };
}

function roughen(x, w, h, seed, density, maxR) {
  const r = rng(seed);
  x.save(); x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < density; i++) {
    const px = r() * w, py = r() * h, rad = (0.3 + r() * r()) * maxR;
    x.globalAlpha = 0.35 + r() * 0.65;
    x.beginPath(); x.arc(px, py, rad, 0, Math.PI * 2); x.fill();
  }
  // a few dry streaks
  x.globalAlpha = 0.5; x.lineWidth = maxR * 0.5;
  for (let i = 0; i < density / 60; i++) {
    const py = r() * h; x.beginPath(); x.moveTo(r() * w * 0.3, py); x.lineTo(w * (0.6 + r() * 0.4), py + (r() - 0.5) * 20); x.stroke();
  }
  x.restore();
}

function makeStamp(text, size, seed) {
  x0.font = `${size}px Oswald`;
  const tw = x0.measureText(text).width;
  const padX = size * 0.42, padY = size * 0.30;
  const w = tw + padX * 2, h = size * 1.08 + padY * 2;
  const c = C(w + 40, h + 40), x = c.getContext('2d');
  x.translate(20, 20);
  x.strokeStyle = RED; x.fillStyle = RED;
  x.lineWidth = size * 0.07; x.strokeRect(0, 0, w, h);
  x.lineWidth = size * 0.025; x.strokeRect(size * 0.11, size * 0.11, w - size * 0.22, h - size * 0.22);
  x.font = `${size}px Oswald`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, w / 2, h / 2 + size * 0.04);
  x.setTransform(1, 0, 0, 1, 0, 0);
  roughen(x, w + 40, h + 40, seed, Math.round((w + 40) * (h + 40) / ((size * 0.035) ** 2 * 12)), size * 0.035);
  return { tex: c, w: w + 40, h: h + 40 };
}

function makeHand(text, font, size, color, seed, maxW) {
  x0.font = `${size}px ${font}`;
  let tw = x0.measureText(text).width;
  if (maxW && tw > maxW) { size *= maxW / tw; x0.font = `${size}px ${font}`; tw = x0.measureText(text).width; }
  const w = tw + size * 0.4, h = size * 1.5;
  const c = C(w, h), x = c.getContext('2d');
  x.font = `${size}px ${font}`; x.fillStyle = color; x.textBaseline = 'middle';
  x.fillText(text, size * 0.2, h * 0.52);
  roughen(x, w, h, seed, Math.round(w * h / ((size * 0.03) ** 2 * 10)), size * 0.03);
  return { tex: c, w, h, size };
}
const x0 = C(10, 10).getContext('2d');

// black label strip with white type, typed on letter by letter
function makeStrip(text, size, seed) {
  const font = `${size}px OswaldMed`;
  x0.font = font;
  const sp = size * 0.14, chars = [...text], ws = chars.map((c) => x0.measureText(c).width);
  const tw = ws.reduce((a, b) => a + b, 0) + sp * (chars.length - 1);
  const padX = size * 0.42, h = Math.round(size * 1.5), w = Math.round(tw + padX * 2);
  const c = C(w, h), x = c.getContext('2d');
  x.fillStyle = '#161412'; x.fillRect(0, 0, w, h);
  x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.4; x.fillStyle = x.createPattern(IMG.paperTile, 'repeat'); x.fillRect(0, 0, w, h);
  const txt = C(w, h), y = txt.getContext('2d');
  y.font = font; y.fillStyle = '#efe8d8'; y.textBaseline = 'middle';
  let xx = padX; const pos = [];
  chars.forEach((ch, i) => { y.fillText(ch, xx, h * 0.53); xx += ws[i] + sp; pos.push(Math.min(w, xx - sp / 2)); });
  roughen(y, w, h, seed, Math.round(w * h / ((size * 0.02) ** 2 * 14)), size * 0.02);
  return { tex: c, txt, w, h, pos, n: chars.length };
}
function drawStrip(ctx, st, lx, ly, t0, t1, t) { // left-aligned at lx
  ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#000'; ctx.fillRect(lx + 8, ly - st.h / 2 + 12, st.w, st.h); ctx.restore();
  ctx.drawImage(st.tex, lx, ly - st.h / 2, st.w, st.h);
  const k = Math.floor(clamp(prog(t, t0, t1)) * st.n + 1e-6);
  if (k > 0) { const pw = st.pos[k - 1]; ctx.drawImage(st.txt, 0, 0, pw, st.h, lx, ly - st.h / 2, pw, st.h); }
}

// lined index card
function makeCard(w, h) {
  const c = C(w, h), x = c.getContext('2d');
  paperize(x, w, h, '#f2eee4', { edge: 40, edgeA: 0.18, tile: 0.4 });
  x.fillStyle = 'rgba(176,37,28,0.45)'; x.fillRect(0, 95, w, 4);
  x.fillStyle = 'rgba(90,120,160,0.22)';
  for (let y = 175; y < h - 20; y += 72) x.fillRect(0, y, w, 3);
  return { tex: c, w, h };
}

// manila luggage tag (hole on the left)
function makeYearTag(text) {
  const w = 860, h = 400, c = C(w, h), x = c.getContext('2d');
  const shape = new Path2D();
  shape.moveTo(110, 0); shape.lineTo(w, 0); shape.lineTo(w, h); shape.lineTo(110, h); shape.lineTo(0, h - 110); shape.lineTo(0, 110); shape.closePath();
  x.save(); x.clip(shape);
  paperize(x, w, h, '#cfb987', { edge: 50, edgeA: 0.35, tile: 0.7 });
  x.restore();
  x.fillStyle = 'rgba(70,50,25,0.45)'; x.beginPath(); x.arc(95, h / 2, 46, 0, Math.PI * 2); x.fill();
  x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(95, h / 2, 24, 0, Math.PI * 2); x.fill();
  x.globalCompositeOperation = 'source-over';
  x.font = '250px Oswald'; x.fillStyle = '#2a2119'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, w / 2 + 70, h / 2 + 8);
  roughen(x, w, h, 77, 400, 7);
  return { tex: c, w, h };
}

// push pin (head seen from the front, light from top-left)
const PIN = (() => {
  const c = C(200, 200), x = c.getContext('2d');
  const g = x.createRadialGradient(80, 78, 6, 100, 100, 62);
  g.addColorStop(0, '#f08072'); g.addColorStop(0.35, '#c8281e'); g.addColorStop(1, '#6a0c08');
  x.fillStyle = g; x.beginPath(); x.arc(100, 100, 60, 0, Math.PI * 2); x.fill();
  x.fillStyle = 'rgba(255,255,255,0.75)'; x.beginPath(); x.ellipse(80, 76, 16, 10, -0.6, 0, Math.PI * 2); x.fill();
  const sh = C(200, 200), y = sh.getContext('2d');
  y.filter = 'blur(10px)'; y.fillStyle = 'rgba(0,0,0,0.75)'; y.beginPath(); y.arc(100, 100, 52, 0, Math.PI * 2); y.fill();
  return { head: c, shadow: sh };
})();
function drawPin(ctx, x, y, s, t, ta) {
  if (ta !== undefined && t < ta - 0.09) return;
  let k = s;
  if (ta !== undefined && t < ta) k *= lerp(1.8, 1, eIn2(prog(t, ta - 0.09, ta)));
  const r = 40 * k;
  ctx.drawImage(PIN.shadow, x - r * 1.4 + 22 * k, y - r * 1.4 + 34 * k, r * 2.8, r * 2.8);
  ctx.drawImage(PIN.head, x - r * 1.65, y - r * 1.65, r * 3.3, r * 3.3);
}
// red string with a gentle gravity sag, drawn from a to b up to fraction p
function drawString(ctx, a, b, p, lw) {
  if (p <= 0) return;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const sag = Math.min(0.05 * len, 380) + 15;
  const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2 + sag;
  const N = Math.max(8, Math.min(60, Math.round(len / 120)));
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const u = (i / N) * clamp(p), v = 1 - u;
    pts.push([v * v * a[0] + 2 * v * u * cx + u * u * b[0], v * v * a[1] + 2 * v * u * cy + u * u * b[1]]);
  }
  const path = (dx, dy) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + dx, y + dy) : ctx.moveTo(x + dx, y + dy))); };
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineWidth = lw * 1.2; path(lw * 1.1, lw * 1.9); ctx.stroke();
  ctx.strokeStyle = '#9e1f19'; ctx.lineWidth = lw; path(0, 0); ctx.stroke();
  ctx.strokeStyle = 'rgba(236,110,95,0.55)'; ctx.lineWidth = lw * 0.3; path(-lw * 0.18, -lw * 0.22); ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------------ world objects
// Each object: {id, cx, cy, rot, w, h, tex, shadow, z}
const O = {};
function place(id, built, cx, cy, rotDeg, extra = {}) {
  O[id] = { id, ...built, cx, cy, rot: rotDeg * DEG, shadow: makeShadow(built.w, built.h, extra.R || 45), ...extra };
  return O[id];
}
const L2W = (o, lx, ly) => { const [a, b] = rot2(lx, ly, o.rot); return [o.cx + a, o.cy + b]; };

// P1: smiling portrait in a suit (opens and closes the film)
place('portrait', makePrint(IMG.portrait, 1600, 70), 2600, 2500, -2);
O.portrait.strip = makeStrip('SUHARTO', 150, 7);

// Book: The Smiling General (1969)
{
  const w = 1700, h = 2400, c = C(w + 60, h + 60), x = c.getContext('2d');
  // page block, offset right and down
  x.fillStyle = '#d9cfb8'; x.fillRect(46, 46, w, h);
  x.strokeStyle = 'rgba(120,100,70,0.35)'; x.lineWidth = 2;
  for (let i = 0; i < 14; i++) { x.beginPath(); x.moveTo(w + 8 + i * 3, 50); x.lineTo(w + 8 + i * 3, h + 40); x.stroke(); }
  for (let i = 0; i < 14; i++) { x.beginPath(); x.moveTo(50, h + 8 + i * 3); x.lineTo(w + 40, h + 8 + i * 3); x.stroke(); }
  // cloth cover
  const cv = C(w, h), y = cv.getContext('2d');
  paperize(y, w, h, '#ddd2b9', { edge: 70, edgeA: 0.45, tile: 0.7 });
  y.globalAlpha = 0.06; y.strokeStyle = '#000';
  for (let i = 0; i < w; i += 7) { y.beginPath(); y.moveTo(i, 0); y.lineTo(i, h); y.stroke(); }
  for (let i = 0; i < h; i += 7) { y.beginPath(); y.moveTo(0, i); y.lineTo(w, i); y.stroke(); }
  y.globalAlpha = 1;
  // spine hinge groove
  const g = y.createLinearGradient(70, 0, 130, 0);
  g.addColorStop(0, 'rgba(60,40,20,0)'); g.addColorStop(0.5, 'rgba(60,40,20,0.28)'); g.addColorStop(1, 'rgba(60,40,20,0)');
  y.fillStyle = g; y.fillRect(70, 0, 60, h);
  // tipped-in photo
  const pw = 1000, ph = Math.round(pw * IMG.cover.height / IMG.cover.width);
  const px = (w - pw) / 2 + 30, py = h / 2 + 1040 - ph;
  y.fillStyle = 'rgba(30,20,10,0.5)'; y.fillRect(px - 6, py - 6, pw + 12, ph + 12);
  y.drawImage(IMG.cover, px, py, pw, ph);
  // two thin printed rules framing the title area
  y.fillStyle = 'rgba(34,27,21,0.75)'; y.fillRect(230, 155, w - 400, 6); y.fillRect(230, 900, w - 400, 6);
  x.drawImage(cv, 0, 0);
  place('book', { tex: c, w: w + 60, h: h + 60 }, 5250, 2550, 3, { R: 55 });
  O.book.coverPhoto = { x: px - w / 2 - 30, y: py - h / 2 - 30, w: pw, h: ph };
  O.book.pencil = makeHand('Jenderal yang tersenyum', 'Caveat', 150, '#3b3631', 5, 1350);
}
{
  const [tx, ty] = L2W(O.book, 560, 1190);
  place('tag69', makeYearTag('1969'), tx, ty, -7, { R: 25, appear: 13.74, swing: true });
  O.tag69.pinL = [-O.tag69.w / 2 + 95, 0];
}
// SENANG? index card pinned over the portrait's lower right
{
  const [cx, cy] = L2W(O.portrait, 300, 640);
  place('cardS', makeCard(1250, 560), cx, cy, 4, { R: 30, appear: 3.12 });
  O.cardS.hand = makeHand('Senang?', 'Caveat', 330, RED, 51, 1100);
  O.cardS.write = [3.40, 3.88];
}

// Contact sheet: three smiles from different decades
{
  const w = 1900, h = 4700, c = C(w, h), x = c.getContext('2d');
  paperize(x, w, h, '#e8e2d4', { edge: 90, edgeA: 0.25 });
  const fr = [];
  ['contact1', 'contact2', 'contact3'].forEach((n, i) => {
    const pw = 1560, ph = Math.round(pw / 1.4), cy = h / 2 + [-1580, -60, 1460][i];
    x.fillStyle = '#16120f'; x.fillRect((w - pw) / 2 - 42, cy - ph / 2 - 42, pw + 84, ph + 84);
    // faint sprocket marks along the rebate
    x.fillStyle = 'rgba(200,190,170,0.18)';
    for (let k = 0; k < 16; k++) { x.fillRect((w - pw) / 2 - 30 + k * 104, cy - ph / 2 - 34, 46, 18); x.fillRect((w - pw) / 2 - 30 + k * 104, cy + ph / 2 + 16, 46, 18); }
    x.drawImage(IMG[n], (w - pw) / 2, cy - ph / 2, pw, ph);
    fr.push({ y: cy - h / 2, w: pw, h: ph });
  });
  place('contact', { tex: c, w, h }, 2500, 7900, -1.5, { R: 50 });
  O.contact.frames = fr;
  [['SETUJU?', -830, 48.18, [48.52, 48.95], 2.5], ['KESAL?', 690, 49.18, [49.5, 49.86], -2], ['MENJAGA SIKAP?', 2210, 50.58, [50.9, 51.7], 1.5]].forEach(([txt, ly, ta, wr, r], i) => {
    const [cx, cy] = L2W(O.contact, 40, ly);
    place('card' + (i + 1), makeCard(1560, 380), cx, cy, r, { R: 28, appear: ta });
    O['card' + (i + 1)].hand = makeHand(txt, 'Caveat', 270, RED, 21 + i, 1420);
    O['card' + (i + 1)].write = wr;
  });
}

// John Roosa: two prints + name tag
place('roosa2', makePrint(IMG.roosa2, 1600, 65), 6050, 5560, 5);
place('roosa1', makePrint(IMG.roosa1, 1300, 65), 5500, 6900, -3);
O.roosa1.strip = makeStrip('JOHN ROOSA', 150, 8);
O.roosa1.strip2 = makeStrip('SEJARAWAN', 105, 9);

// Older Suharto: the smile that hides
place('peci', makePrint(IMG.peci, 1500, 65), 5650, 9750, 2.5);
{
  const o = O.peci, c = C(o.w, o.h), x = c.getContext('2d');
  x.filter = 'blur(26px)'; x.drawImage(o.tex, 0, 0); x.filter = 'none';
  o.blurTex = c;
}

// Map of Indonesia
const MAP = { lon0: 94.5, lon1: 141.5, lat0: 6.5, lat1: -11.5, s: 191.5, x: 500, y: 11776 };
MAP.w = (MAP.lon1 - MAP.lon0) * MAP.s; MAP.h = (MAP.lat0 - MAP.lat1) * MAP.s;
const proj = (lon, lat) => [MAP.x + (lon - MAP.lon0) * MAP.s, MAP.y + (MAP.lat0 - lat) * MAP.s];
const JAKARTA = proj(106.85, -6.2);
{
  const topo = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules/world-atlas/countries-50m.json')));
  const geo = feature(topo, topo.objects.countries).features;
  const margin = 250, TS = 0.6; // texture px per unit
  const sw = MAP.w + 2 * margin, sh = MAP.h + 2 * margin;
  const c = C(sw * TS, sh * TS), x = c.getContext('2d');
  paperize(x, c.width, c.height, '#d6c6a0', { edge: 140, edgeA: 0.4, tile: 0.7 });
  const toTex = (lon, lat) => { const [wx, wy] = proj(lon, lat); return [(wx - MAP.x + margin) * TS, (wy - MAP.y + margin) * TS]; };
  const tracePolys = (ctx, f, tf) => {
    const g = f.geometry; if (!g) return;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    for (const poly of polys) for (const ring of poly) {
      ring.forEach(([lo, la], i) => { const [px, py] = tf(lo, la); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
      ctx.closePath();
    }
  };
  const inView = (f) => {
    const g = f.geometry; if (!g) return false;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    return polys.some((p) => p[0].some(([lo, la]) => lo > 90 && lo < 146 && la > -16 && la < 11));
  };
  const near = geo.filter(inView);
  const indo = geo.filter((f) => f.properties.name === 'Indonesia');
  // sea tint inside the neat line
  const nx = margin * TS, ny = margin * TS, nw = MAP.w * TS, nh = MAP.h * TS;
  x.save(); x.beginPath(); x.rect(nx, ny, nw, nh); x.clip();
  x.fillStyle = 'rgba(92,110,104,0.20)'; x.fillRect(nx, ny, nw, nh);
  // water lines along every coast
  for (const [lw, a] of [[70, 0.07], [44, 0.08], [22, 0.12]]) {
    x.beginPath(); near.forEach((f) => tracePolys(x, f, toTex));
    x.strokeStyle = `rgba(55,70,66,${a})`; x.lineWidth = lw * TS; x.lineJoin = 'round'; x.stroke();
  }
  // graticule
  x.strokeStyle = 'rgba(90,70,45,0.22)'; x.lineWidth = 3 * TS;
  for (let lo = 95; lo <= 140; lo += 5) { const [a] = toTex(lo, 0); x.beginPath(); x.moveTo(a, ny); x.lineTo(a, ny + nh); x.stroke(); }
  for (let la = 5; la >= -10; la -= 5) { const [, b] = toTex(100, la); x.beginPath(); x.moveTo(nx, b); x.lineTo(nx + nw, b); x.stroke(); }
  // land
  x.beginPath(); near.filter((f) => !indo.includes(f)).forEach((f) => tracePolys(x, f, toTex));
  x.fillStyle = '#cfc3a6'; x.fill('evenodd');
  x.beginPath(); indo.forEach((f) => tracePolys(x, f, toTex));
  x.fillStyle = '#e6d9b6'; x.fill('evenodd');
  x.beginPath(); near.forEach((f) => tracePolys(x, f, toTex));
  x.strokeStyle = 'rgba(70,52,34,0.85)'; x.lineWidth = 4 * TS; x.stroke();
  x.restore();
  // neat line, double rule
  x.strokeStyle = 'rgba(60,45,30,0.8)'; x.lineWidth = 6 * TS; x.strokeRect(nx, ny, nw, nh);
  x.lineWidth = 2.5 * TS; x.strokeRect(nx - 40 * TS, ny - 40 * TS, nw + 80 * TS, nh + 80 * TS);
  place('map', { tex: c, w: sw, h: sh }, MAP.x + MAP.w / 2, MAP.y + MAP.h / 2, 0, { R: 70 });

  // red ink spread field (Indonesia only), at RS px per unit
  const RS = 0.4, rw = Math.round(MAP.w * RS), rh = Math.round(MAP.h * RS);
  const mc = C(rw, rh), m = mc.getContext('2d');
  m.beginPath(); indo.forEach((f) => tracePolys(m, f, (lo, la) => { const [wx, wy] = proj(lo, la); return [(wx - MAP.x) * RS, (wy - MAP.y) * RS]; }));
  m.fillStyle = '#fff'; m.fill('evenodd');
  m.strokeStyle = '#fff'; m.lineWidth = 3; m.stroke();
  const md = m.getImageData(0, 0, rw, rh).data;
  const field = new Float32Array(rw * rh);
  const nr = rng(99), grid = 24, gw = Math.ceil(rw / (grid / 3)) + 2, gh = Math.ceil(rh / (grid / 3)) + 2;
  const nz = new Float32Array(gw * gh).map(() => nr());
  const nz2 = new Float32Array(gw * gh).map(() => nr());
  const vnoise = (arr, fx, fy) => {
    const ix = Math.floor(fx), iy = Math.floor(fy), tx = ss(fx - ix), ty = ss(fy - iy);
    const a = arr[iy * gw + ix], b = arr[iy * gw + ix + 1], c2 = arr[(iy + 1) * gw + ix], d = arr[(iy + 1) * gw + ix + 1];
    return lerp(lerp(a, b, tx), lerp(c2, d, tx), ty);
  };
  const jx = (JAKARTA[0] - MAP.x) * RS, jy = (JAKARTA[1] - MAP.y) * RS;
  let fmax = 0;
  for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) {
    const k = j * rw + i;
    if (md[k * 4 + 3] < 40) { field[k] = 1e9; continue; }
    const d = Math.hypot(i - jx, j - jy) / RS;
    const n = vnoise(nz, i / grid, j / grid) * 0.7 + vnoise(nz2, i / (grid / 3), j / (grid / 3)) * 0.3;
    field[k] = d + n * 900; fmax = Math.max(fmax, field[k]);
  }
  MAP.red = { RS, rw, rh, field, fmax, canvas: C(rw, rh), lastR: -1 };
  if (A.debug) { let land = 0; for (let k = 0; k < rw * rh; k++) land += md[k * 4 + 3] >= 40; console.log("red field", rw, rh, "land px", land, "fmax", fmax); }
}

// Prints that drop onto the map where the story happens
{ const mp = makePrint(IMG.militer, 1300, 65); place('militer', mp, JAKARTA[0] - 20, JAKARTA[1] + mp.h / 2 - 80, -3, { drop: 35.02 }); }
place('protes', makePrint(IMG.protes, 1700, 65), 4620, 14720, 3, { drop: 36.90 });
place('sawah', makePrint(IMG.sawah, 1250, 65), 6500, 13850, -2.5, { drop: 39.72 });

// Official papers: decisions and actions
function makeDoc(seed, kind) {
  const w = 1900, h = 2690, c = C(w, h), x = c.getContext('2d');
  paperize(x, w, h, '#e9e2cf', { edge: 110, edgeA: 0.3 });
  const r = rng(seed);
  x.fillStyle = 'rgba(95,88,78,0.55)';
  let y = 250;
  if (kind === 'A') {
    x.fillRect(w / 2 - 430, y, 860, 52); y += 100;
    x.fillRect(w / 2 - 300, y, 600, 34); y += 110;
    x.fillRect(200, y, w - 400, 5); y += 120;
  } else {
    x.fillRect(200, y, 700, 44); y += 170;
  }
  x.fillStyle = 'rgba(110,103,92,0.40)';
  while (y < h - 520) {
    const n = 3 + Math.floor(r() * 4);
    for (let i = 0; i < n && y < h - 520; i++) {
      const ind = kind === 'B' ? 90 : 0;
      const len = (i === n - 1 ? 0.35 + r() * 0.35 : 0.86 + r() * 0.14) * (w - 400 - ind);
      x.fillRect(200 + ind, y, len, 22); y += 64;
    }
    y += 60;
  }
  // signature
  x.strokeStyle = 'rgba(40,50,80,0.55)'; x.lineWidth = 6; x.beginPath();
  for (let i = 0; i <= 40; i++) { const t = i / 40; const sx = w - 760 + t * 460, sy = h - 330 + Math.sin(t * 18) * 40 * (1 - t) - t * 40; i ? x.lineTo(sx, sy) : x.moveTo(sx, sy); }
  x.stroke();
  x.fillStyle = 'rgba(95,88,78,0.5)'; x.fillRect(w - 800, h - 250, 520, 5);
  return { tex: c, w, h };
}
place('docB', makeDoc(5, 'B'), 5300, 20350, 4);
place('docA', makeDoc(3, 'A'), 4700, 18750, -3);
O.docA.stamp = makeStamp('KEPUTUSAN', 250, 31);
O.docB.stamp = makeStamp('TINDAKAN', 250, 32);

const DRAW_ORDER = ['map', 'contact', 'card1', 'card2', 'card3', 'portrait', 'cardS', 'book', 'tag69', 'roosa2', 'roosa1', 'peci', 'docB', 'docA', 'militer', 'protes', 'sawah'];

// ------------------------------------------------------------------ pins and strings
const topPin = (id, dy = 55) => () => L2W(O[id], 0, -O[id].h / 2 + dy);
const PINS = {
  portrait: { at: topPin('portrait') }, book: { at: topPin('book', 70) }, contact: { at: topPin('contact') },
  portraitR: { at: () => L2W(O.portrait, O.portrait.w / 2 - 55, -700) }, portraitB: { at: () => L2W(O.portrait, 0, O.portrait.h / 2 - 50) },
  bookL: { at: () => L2W(O.book, -O.book.w / 2 + 70, -700) }, bookB: { at: () => L2W(O.book, -450, O.book.h / 2 - 75) },
  contactR: { at: () => L2W(O.contact, O.contact.w / 2 - 55, 1800) },
  roosa1R: { at: () => L2W(O.roosa1, O.roosa1.w / 2 - 50, 350) }, peciB: { at: () => L2W(O.peci, 0, O.peci.h / 2 - 50) },
  cardS: { at: topPin('cardS', 50), t: 3.12 }, card1: { at: topPin('card1', 50), t: 48.18 }, card2: { at: topPin('card2', 50), t: 49.18 }, card3: { at: topPin('card3', 50), t: 50.58 },
  tag69: { at: () => L2W(O.tag69, ...O.tag69.pinL), t: 13.74 },
  roosa1: { at: topPin('roosa1') }, roosa2: { at: topPin('roosa2') }, peci: { at: topPin('peci') },
  vellum: { at: () => L2W(O.peci, 20, -330 - 725 + 60), t: 24.45 },
  map1: { at: () => [MAP.x - 150, MAP.y - 150] }, map2: { at: () => [MAP.x + MAP.w + 150, MAP.y - 150] },
  map3: { at: () => [MAP.x - 150, MAP.y + MAP.h + 150] }, map4: { at: () => [MAP.x + MAP.w + 150, MAP.y + MAP.h + 150] },
  hub: { at: () => JAKARTA, t: 28.5, s: 1.35 },
  protes: { at: topPin('protes'), t: 36.9 }, sawah: { at: topPin('sawah'), t: 39.72 },
  docA1: { at: () => L2W(O.docA, -780, -1240) }, docA2: { at: () => L2W(O.docA, 780, -1240) },
  docB1: { at: () => L2W(O.docB, 780, -1240) },
};
['TL', 'TR', 'BR', 'BL'].forEach((k, i) => {
  const sx = [-1, 1, 1, -1][i], sy = [-1, -1, 1, 1][i];
  PINS['px' + k] = { at: () => L2W(O.protes, sx * (O.protes.w / 2 + 60), sy * (O.protes.h / 2 + 60)), t: 37.56 + i * 0.02 };
});
const STRINGS = [
  ['portraitR', 'bookL', 4.35, 5.5], ['tag69', 'bookB', 13.74, 14.05], ['bookB', 'contact', 14.75, 16.3],
  ['contact', 'roosa1', 20.5, 21.35], ['roosa1R', 'peci', 23.5, 24.15], ['peciB', 'hub', 27.1, 28.5],
  ['pxTL', 'pxBR', 37.62, 37.86], ['pxTR', 'pxBL', 37.66, 37.86],
  ['sawah', 'contactR', 45.25, 47.1], ['contact', 'portraitB', 52.0, 53.7], ['portraitB', 'docA1', 58.2, 60.9],
];
// red string network from Jakarta to the whole archipelago, complete on "dominan" (32.02)
{
  const cities = [[95.32, 5.55], [98.67, 3.59], [100.35, -0.95], [101.45, 0.51], [104.75, -2.99], [105.26, -5.43], [109.33, -0.03],
    [114.59, -3.32], [117.15, -0.5], [117.6, 3.3], [110.42, -6.97], [112.75, -7.25], [115.22, -8.65], [116.1, -8.58], [123.6, -10.17],
    [119.42, -5.14], [119.87, -0.9], [124.84, 1.47], [122.5, -3.97], [127.38, 0.79], [128.18, -3.69], [131.25, -0.88], [134.06, -0.86],
    [140.7, -2.53], [140.4, -8.49], [136.9, -4.5]].map(([lo, la]) => proj(lo, la));
  const dmax = Math.max(...cities.map((c) => Math.hypot(c[0] - JAKARTA[0], c[1] - JAKARTA[1])));
  cities.forEach((c, i) => {
    const d = Math.hypot(c[0] - JAKARTA[0], c[1] - JAKARTA[1]);
    const arrive = 29.0 + (d / dmax) ** 0.9 * (32.02 - 29.0);
    PINS['c' + i] = { at: () => c, t: arrive, s: 0.9, net: true };
    STRINGS.push(['hub', 'c' + i, arrive - 0.55, arrive, 24, true]);
  });
}
let CUR_VB = null;
function drawStringsAndPins(ctx, t, vb, net = false) { // net=true: the map's string network, drawn under the prints
  for (const [a, b, t0, t1, lw, isNet] of STRINGS) {
    if (t < t0 || !!isNet !== net) continue;
    const pa = PINS[a].at(), pb = PINS[b].at();
    const x0 = Math.min(pa[0], pb[0]), x1 = Math.max(pa[0], pb[0]), y0 = Math.min(pa[1], pb[1]), y1 = Math.max(pa[1], pb[1]) + 400;
    if (x1 < vb.x0 || x0 > vb.x1 || y1 < vb.y0 || y0 > vb.y1) continue;
    drawString(ctx, pa, pb, eInOut2(prog(t, t0, t1)), lw || 13);
  }
  for (const k in PINS) {
    const P0 = PINS[k];
    if (!!P0.net !== net) continue;
    const [x, y] = P0.at();
    if (x < vb.x0 - 200 || x > vb.x1 + 200 || y < vb.y0 - 200 || y > vb.y1 + 200) continue;
    drawPin(ctx, x, y, P0.s || 1, t, P0.t);
  }
}

// warm lamp pools on the board (multiplied over everything)
const LIGHT = (() => {
  const s = 1 / 50, c = C(16000 * s, 27000 * s), x = c.getContext('2d');
  x.fillStyle = 'rgb(92,80,70)'; x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'lighter';
  for (const [cx, cy, rx, ry] of [[2600, 2500, 2500, 2500], [5250, 2550, 2300, 2400], [2500, 7900, 2300, 3300], [5760, 6700, 2300, 2500],
    [5650, 9750, 2000, 2000], [5000, 13700, 6300, 2900], [5000, 19600, 2700, 3300]]) {
    x.save(); x.translate((cx + 3000) * s, (cy + 3000) * s); x.scale(rx * s, ry * s);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, 'rgba(163,175,185,1)'); g.addColorStop(0.55, 'rgba(120,128,135,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, Math.PI * 2); x.fill(); x.restore();
  }
  return c;
})();

// ------------------------------------------------------------------ camera
// Holds: the camera drifts slowly from a to b; between holds it travels with a
// van Wijk zoom-pan (pulls back for long trips) eased in and out. The whole path is
// then low-pass filtered so nothing ever stops dead.
const P = (id, lx, ly, vh, r = 0) => { const [x, y] = L2W(O[id], lx, ly); return { x, y, vh, r }; };
const Wp = (x, y, vh, r = 0) => ({ x, y, vh, r });
const HOLDS = [
  [0.00, 1.55, P('portrait', -40, 300, 3000, 0.4), P('portrait', -10, -140, 2350, 0.2)],
  [2.25, 4.30, P('portrait', -20, 120, 3500, -0.3), P('portrait', 90, 120, 3330, -0.4)],
  [5.55, 9.90, P('book', 0, -640, 2950, 0.5), P('book', 20, -420, 2700, 0.3)],
  [10.90, 14.70, P('book', 0, 80, 4350, 0), P('book', -160, 170, 4050, -0.3)],
  [16.35, 18.85, P('contact', 0, -1500, 2750, -0.4), P('contact', 0, -250, 2900, -0.2)],
  [19.55, 20.45, P('contact', 0, 330, 5350, 0), P('contact', 180, 280, 5200, 0.2)],
  [21.35, 23.45, Wp(5760, 6720, 4400, 0.3), Wp(5730, 6950, 4150, 0.4)],
  [24.15, 27.05, P('peci', 40, -200, 3050, 0.3), P('peci', 75, -40, 2250, 0.1)],
  [28.70, 32.40, Wp(5000, 13480, 17600, 0), Wp(4700, 13520, 16400, 0)],
  [34.20, 35.70, P('militer', 60, -60, 3300, -0.4), P('militer', 230, -20, 3420, -0.3)],
  [36.50, 38.70, Wp(4600, 14680, 4300, 0.3), Wp(4700, 14650, 4150, 0.4)],
  [39.45, 41.20, P('sawah', 0, -320, 2800, -0.2), P('sawah', -60, -220, 2900, -0.3)],
  [44.55, 45.25, Wp(5000, 13250, 15200, 0), Wp(4800, 12900, 14700, 0)],
  [47.10, 48.90, P('contact', 0, -1300, 3500, -0.3), P('contact', 0, -1120, 3450, -0.3)],
  [49.45, 50.40, P('contact', 0, 250, 3500, 0), P('contact', 0, 400, 3480, 0)],
  [50.85, 51.90, P('contact', 0, 1720, 3550, 0.2), P('contact', 0, 1780, 3650, 0.2)],
  [53.75, 55.85, P('portrait', 150, -300, 3000, 0.3), P('portrait', 180, -320, 2800, 0.3)],
  [55.95, 58.00, P('portrait', 10, -360, 2350, 0.1), P('portrait', 20, -190, 2120, 0)],
  [60.95, 61.65, P('docA', 0, -520, 3300, -0.3), P('docA', 60, -330, 3450, -0.2)],
  [62.55, 63.50, Wp(5030, 19880, 4700, 0.2), Wp(5060, 19960, 4580, 0.2)],
];
const CAM_HZ = 240;
const camTrack = (() => {
  const n = Math.ceil((DUR + 1) * CAM_HZ);
  const xs = new Float64Array(n), ys = new Float64Array(n), lv = new Float64Array(n), rs = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / CAM_HZ;
    let p;
    const hi = HOLDS.findIndex((h) => t >= h[0] && t <= h[1]);
    if (hi >= 0) {
      const [t0, t1, a, b] = HOLDS[hi], u = (t - t0) / (t1 - t0);
      p = { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), vh: Math.exp(lerp(Math.log(a.vh), Math.log(b.vh), u)), r: lerp(a.r, b.r, u) };
    } else if (t < HOLDS[0][0]) p = HOLDS[0][2];
    else if (t > HOLDS.at(-1)[1]) p = HOLDS.at(-1)[3];
    else {
      const k = HOLDS.findIndex((h) => h[0] > t) - 1;
      const [, t0, , a] = HOLDS[k], [t1, , b] = HOLDS[k + 1];
      const u = sst((t - t0) / (t1 - t0));
      const z = interpolateZoom.rho(1.25)([a.x, a.y, a.vh], [b.x, b.y, b.vh]);
      const [zx, zy, zw] = z(u);
      p = { x: zx, y: zy, vh: zw, r: lerp(a.r, b.r, u) };
    }
    xs[i] = p.x; ys[i] = p.y; lv[i] = Math.log(p.vh); rs[i] = p.r * DEG;
  }
  const smooth = (arr, sig) => {
    const R = Math.ceil(sig * 3 * CAM_HZ), ker = [];
    let s = 0; for (let k = -R; k <= R; k++) { const v = Math.exp(-0.5 * (k / (sig * CAM_HZ)) ** 2); ker.push(v); s += v; }
    const out = new Float64Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
      let acc = 0; for (let k = -R; k <= R; k++) acc += arr[clamp(i + k, 0, arr.length - 1)] * ker[k + R];
      out[i] = acc / s;
    }
    return out;
  };
  return { xs: smooth(xs, 0.16), ys: smooth(ys, 0.16), lv: smooth(lv, 0.16), rs: smooth(rs, 0.25), n };
})();

// slams: [time, strength] -> short decaying shake + zoom punch
const IMPACTS = [[6.68, 0.25], [6.94, 0.25], [7.46, 0.3], [13.74, 0.45], [35.02, 0.8], [36.9, 0.6], [37.86, 0.35], [39.72, 0.5], [61.4, 1], [62.4, 1]];

function camAt(t) {
  const f = clamp(t, 0, DUR + 0.9) * CAM_HZ, i = Math.floor(f), u = f - i, j = Math.min(i + 1, camTrack.n - 1);
  const g = (a) => lerp(a[i], a[j], u);
  let x = g(camTrack.xs), y = g(camTrack.ys), vh = Math.exp(g(camTrack.lv)), r = g(camTrack.rs);
  // handheld: slow, layered, never repeating
  const hh = (a, b, c, d) => Math.sin(t * a + b) * 0.6 + Math.sin(t * c + d) * 0.3 + Math.sin(t * (a + c) * 1.7 + b + d) * 0.1;
  x += vh * 0.0024 * hh(0.71, 1.3, 1.63, 0.4);
  y += vh * 0.0020 * hh(0.57, 2.1, 1.37, 5.2);
  r += 0.0016 * hh(0.43, 0.7, 1.11, 3.3);
  vh *= 1 + 0.004 * Math.sin(t * 0.37 + 1.0);
  for (const [ti, s] of IMPACTS) {
    const d = t - ti; if (d < 0 || d > 0.6) continue;
    const e = Math.exp(-d * 11) * s;
    y += vh * 0.0035 * e * Math.sin(d * 2 * Math.PI * 9);
    x += vh * 0.0015 * e * Math.sin(d * 2 * Math.PI * 7 + 1);
    vh *= 1 - 0.006 * e;
  }
  return { x, y, vh, r };
}

// ------------------------------------------------------------------ hero spotlight
const HERO = [
  [0, 'portrait', 0.55], [4.0, 'book', 0.55], [15.6, 'contact', 0.55], [20.6, 'roosa', 0.55], [23.8, 'peci', 0.58],
  [27.6, 'map', 0.66], [33.9, 'militer', 0.55], [35.95, 'protes', 0.58], [39.3, 'sawah', 0.55], [41.6, 'map', 0.62],
  [45.3, 'contact', 0.55], [52.9, 'portrait', 0.55], [58.6, 'docs', 0.5],
];
function heroRect(id) {
  if (id === 'roosa') return { cx: 5760, cy: 6720, w: 2350, h: 3550, r: 0 };
  if (id === 'docs') return { cx: 5000, cy: 19600, w: 2600, h: 4500, r: 0 };
  if (id === 'sawahWide') { const o = O.sawah; return { cx: o.cx, cy: o.cy, w: o.w + 500, h: o.h + 500, r: o.rot }; }
  const o = O[id];
  let w = o.w, h = o.h, cy = o.cy;
  if (id === 'portrait') { h += 260; cy -= 120; }
  return { cx: o.cx, cy, w: w + 160, h: h + 160, r: o.rot };
}
function heroAt(t) {
  let k = 0; while (k + 1 < HERO.length && HERO[k + 1][0] <= t + 0.3) k++;
  const cur = heroRect(HERO[k][1]);
  const ts = HERO[k][0];
  if (k === 0) return { ...cur, dim: HERO[0][2] };
  const prev = heroRect(HERO[k - 1][1]);
  const u = sst(prog(t, ts - 0.3, ts + 0.6));
  return {
    cx: lerp(prev.cx, cur.cx, u), cy: lerp(prev.cy, cur.cy, u),
    w: Math.exp(lerp(Math.log(prev.w), Math.log(cur.w), u)), h: Math.exp(lerp(Math.log(prev.h), Math.log(cur.h), u)),
    r: lerp(prev.r, cur.r, u), dim: lerp(HERO[k - 1][2], HERO[k][2], u),
  };
}
const holeTex = (() => { // soft white rect, 25% feather on every side
  const c = C(256, 256), x = c.getContext('2d');
  x.filter = 'blur(22px)'; x.fillStyle = '#fff'; x.fillRect(64, 64, 128, 128); return c;
})();

// ------------------------------------------------------------------ drawing
function setCam(ctx, cam) {
  const k = H / cam.vh;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(W / 2, H / 2); ctx.rotate(cam.r); ctx.scale(k, k); ctx.translate(-cam.x, -cam.y);
}
function viewBox(cam) {
  const hh = cam.vh / 2, hw = hh * W / H, R = Math.hypot(hw, hh);
  return { x0: cam.x - R, y0: cam.y - R, x1: cam.x + R, y1: cam.y + R };
}
const visible = (vb, o, pad = 0) => {
  const R = Math.hypot(o.w, o.h) / 2 + pad;
  return !(o.cx + R < vb.x0 || o.cx - R > vb.x1 || o.cy + R < vb.y0 || o.cy - R > vb.y1);
};

// object state over time (drops)
function dropState(o, t) {
  if (o.appear !== undefined) {
    if (t < o.appear - 0.3) return { show: false };
    const u = prog(t, o.appear - 0.3, o.appear), d = t - o.appear;
    const dr = o.swing && d > 0 ? 9 * DEG * Math.exp(-d * 2.6) * Math.sin(d * 8) : 0;
    return { show: true, z: (1 - eIn2(u)) * 0.5, a: clamp(u * 3), dr, dx: 0, dy: -80 * (1 - eOut3(u)) };
  }
  if (!o.drop) return { show: true, z: 0, a: 1, dr: 0, dx: 0, dy: 0 };
  const T0 = o.drop - 0.62;
  if (t < T0) return { show: false };
  const u = prog(t, T0, o.drop);
  const z = 1 - eIn2(u);            // height above the desk, 1 -> 0
  const slide = 1 - eOut3(u);        // falls in from above the frame
  const d = t - o.drop;
  const dr = d > 0 ? 0.9 * DEG * Math.exp(-d * 7) * Math.sin(d * 25) : slide * 7 * DEG;
  return { show: true, z: z * 0.6, a: 1, dr, dx: slide * 500, dy: -slide * 3200 };
}

function drawShadow(ctx, o, z, a, dx = 0, dy = 0) {
  const s = o.shadow, sc = 1 + z * 0.12;
  const ox = 16 + z * 150 + dx, oy = 26 + z * 230 + dy; // board on a wall, lamp top-left
  ctx.save(); ctx.translate(o.cx + ox, o.cy + oy); ctx.rotate(o.rot); ctx.scale(sc, sc);
  ctx.globalAlpha = a * (0.62 - z * 0.3);
  ctx.drawImage(s.tex, -s.w / 2, -s.h / 2, s.w, s.h);
  ctx.restore();
}

function inLocal(ctx, o, fn, extraRot = 0, scale = 1) {
  ctx.save(); ctx.translate(o.cx, o.cy); ctx.rotate(o.rot + extraRot); if (scale !== 1) ctx.scale(scale, scale); fn(); ctx.restore();
}

function stampAt(ctx, st, lx, ly, rotDeg, t, tHit) {
  if (t < tHit - 0.09) return;
  const u = prog(t, tHit - 0.09, tHit);
  const s = lerp(1.45, 1, eIn2(u));
  ctx.save(); ctx.translate(lx, ly); ctx.rotate(rotDeg * DEG); ctx.scale(s, s);
  ctx.globalAlpha = 0.9 * clamp(u * 1.6);
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(st.tex, -st.w / 2, -st.h / 2, st.w, st.h);
  ctx.restore();
}

function revealH(ctx, L, lx, ly, p) { // left-to-right handwriting reveal, centred at lx
  if (p <= 0) return;
  const t = L;
  const pw = t.w * clamp(p);
  ctx.drawImage(t.tex, 0, 0, pw * (t.tex.width / t.w), t.tex.height, lx - t.w / 2, ly - t.h / 2, pw, t.h);
}

function drawRedSpread(ctx, t) {
  const R = MAP.red;
  const u = eInOut2(prog(t, 28.9, 32.02));
  const reach = u * (R.fmax + 300);
  if (reach <= 0) return;
  if (Math.abs(reach - R.lastR) > 1) {
    const x = R.canvas.getContext('2d'), id = x.createImageData(R.rw, R.rh), d = id.data, f = R.field, edge = 320;
    for (let k = 0; k < f.length; k++) {
      const v = reach - f[k];
      if (v <= 0) continue;
      let a = Math.min(1, v / edge);
      a = a * 0.72 + (v < edge * 1.6 ? 0.18 * (1 - Math.abs(v - edge * 0.8) / (edge * 0.8)) : 0);
      const o = k * 4; d[o] = 168; d[o + 1] = 30; d[o + 2] = 22; d[o + 3] = Math.round(clamp(a) * 255);
    }
    x.putImageData(id, 0, 0); R.lastR = reach;
  }
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.55;
  ctx.drawImage(R.canvas, MAP.x, MAP.y, MAP.w, MAP.h);
  ctx.restore();
}

function drawCircle(ctx, cx, cy, rx, ry, p, seed) {
  if (p <= 0) return;
  const r = rng(seed), ph = [r() * 6, r() * 6];
  const N = 120, th0 = -2.4, turns = 1.1, pts = [];
  const last = Math.max(2, Math.floor(N * clamp(p)));
  for (let i = 0; i <= last; i++) {
    const s = i / N, th = th0 + s * turns * Math.PI * 2;
    const k = 1 + 0.035 * Math.sin(th * 3 + ph[0]) + 0.02 * Math.sin(th * 7 + ph[1]) + 0.07 * s;
    pts.push([cx + Math.cos(th) * rx * k, cy + Math.sin(th) * ry * k]);
  }
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [lw, a, off] of [[24, 0.85, 0], [10, 0.5, 5]]) {
    ctx.strokeStyle = RED; ctx.globalAlpha = a; ctx.lineWidth = lw;
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + off, y - off) : ctx.moveTo(x + off, y - off))); ctx.stroke();
  }
  ctx.restore();
}

function drawWorld(ctx, t, cam) {
  setCam(ctx, cam);
  const vb = viewBox(cam); CUR_VB = vb;
  const k = H / cam.vh;
  // cork board
  ctx.drawImage(IMG.corkBase, -3000, -3000, 16000, 27000);
  const da = 0.2 + clamp((k / SC - 0.15) / 0.45) * 0.75;
  if (da > 0.01) {
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = da;
    ctx.fillStyle = ctx.createPattern(IMG.corkTile, 'repeat');
    ctx.fillRect(vb.x0, vb.y0, vb.x1 - vb.x0, vb.y1 - vb.y0);
    ctx.restore();
  }
  for (const id of DRAW_ORDER) {
    const o = O[id];
    if (!visible(vb, o, 600)) continue;
    const st = dropState(o, t);
    if (!st.show) continue;
    drawShadow(ctx, o, st.z, st.a, st.dx, st.dy);
    ctx.save(); ctx.globalAlpha = st.a; ctx.translate(st.dx, st.dy);
    inLocal(ctx, o, () => ctx.drawImage(o.tex, -o.w / 2, -o.h / 2, o.w, o.h), st.dr, 1 + st.z * 0.3);
    ctx.restore();
    DYN[id]?.(ctx, o, t, st);
  }
  drawStringsAndPins(ctx, t, vb);
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(LIGHT, -3000, -3000, 16000, 27000);
  ctx.restore();
}

// per-object animated details (all in object-local coordinates)
const DYN = {
  map(ctx, o, t) { drawRedSpread(ctx, t); drawStringsAndPins(ctx, t, CUR_VB, true); },
  portrait(ctx, o, t) {
    inLocal(ctx, o, () => {
      // black name strip on the photo, typed on "Suharto"
      drawStrip(ctx, o.strip, -o.w / 2 + 110, o.h / 2 - 70 - o.strip.h / 2 - 30, 0.05, 0.5, t);
      drawCircle(ctx, 8, -165, 250, 150, sst(prog(t, 0.6, 1.3)), 4);
      // question mark beside the smile on "tafsir"
      if (t > 55.3) {
        const q = QMARK, p = eOut3(prog(t, 55.3, 55.62));
        ctx.save(); ctx.translate(560, -330); ctx.rotate(8 * DEG);
        ctx.drawImage(q.tex, 0, 0, q.tex.width, q.tex.height * p, -q.w / 2, -q.h / 2, q.w, q.h * p);
        ctx.restore();
      }
    });
  },
  book(ctx, o, t) {
    inLocal(ctx, o, () => {
      const words = [['THE', 165, -1000, 6.68], ['SMILING', 300, -800, 6.94], ['GENERAL', 300, -490, 7.46]];
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const [w, sz, y, tw] of words) {
        if (t < tw - 0.1) continue;
        const u = prog(t, tw - 0.1, tw + 0.02);
        const s = lerp(1.22, 1, eIn2(u));
        ctx.save(); ctx.translate(-10, y); ctx.scale(s, s);
        ctx.globalAlpha = clamp(u * 1.5);
        ctx.font = `${sz}px Playfair`; ctx.fillStyle = INK;
        ctx.fillText(w, 0, 0);
        ctx.restore();
      }
      revealH(ctx, o.pencil, 0, -255, prog(t, 8.62, 9.92));
    });
  },
  contact(ctx, o, t) {
    inLocal(ctx, o, () => {
      // light sweep across all three smiles on "khas"
      const u = prog(t, 19.35, 20.25);
      if (u > 0 && u < 1) {
        ctx.save(); ctx.beginPath(); ctx.rect(-o.w / 2, -o.h / 2, o.w, o.h); ctx.clip();
        const cy = lerp(-3300, 3300, eInOut2(u));
        const g = ctx.createLinearGradient(0, cy - 700, 400, cy + 700);
        g.addColorStop(0, 'rgba(255,236,200,0)'); g.addColorStop(0.5, 'rgba(255,236,200,0.33)'); g.addColorStop(1, 'rgba(255,236,200,0)');
        ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(-o.w / 2, cy - 800, o.w, 1600);
        ctx.restore();
      }
    });
  },
  peci(ctx, o, t) {
    // frosted tracing paper slides over the face on "menyembunyikan"
    const u = eOut3(prog(t, 23.72, 24.5));
    if (u <= 0) return;
    const vx = lerp(2300, 20, u), vr = lerp(9, 1.5, u) * DEG, vw = 1480, vhh = 1450, vy = -330;
    inLocal(ctx, o, () => {
      ctx.save(); ctx.translate(vx, vy); ctx.rotate(vr);
      ctx.globalAlpha = 0.35; ctx.fillStyle = '#000'; ctx.filter = 'blur(14px)'; ctx.fillRect(-vw / 2 - 10, -vhh / 2 + 18, vw, vhh); ctx.filter = 'none';
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.rect(-vw / 2, -vhh / 2, vw, vhh); ctx.clip();
      ctx.rotate(-vr); ctx.translate(-vx, -vy);
      ctx.drawImage(o.blurTex, -o.w / 2, -o.h / 2, o.w, o.h);
      ctx.translate(vx, vy); ctx.rotate(vr);
      ctx.fillStyle = 'rgba(236,232,222,0.52)'; ctx.fillRect(-vw / 2 - 600, -vhh / 2 - 600, vw + 1200, vhh + 1200);
      ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.35;
      ctx.fillStyle = ctx.createPattern(IMG.paperTile, 'repeat'); ctx.fillRect(-vw / 2, -vhh / 2, vw, vhh);
      ctx.restore();
      ctx.save(); ctx.translate(vx, vy); ctx.rotate(vr);
      ctx.strokeStyle = 'rgba(255,255,250,0.55)'; ctx.lineWidth = 4; ctx.strokeRect(-vw / 2, -vhh / 2, vw, vhh);
      ctx.restore();
    });
  },
  docA(ctx, o, t) { inLocal(ctx, o, () => stampAt(ctx, o.stamp, 30, -520, -6, t, 61.4)); },
  docB(ctx, o, t) { inLocal(ctx, o, () => stampAt(ctx, o.stamp, 60, 820, 5, t, 62.4)); },
  roosa1(ctx, o, t) {
    inLocal(ctx, o, () => {
      const y1 = o.h / 2 - 65 - o.strip.h / 2 - 40;
      drawStrip(ctx, o.strip, -o.w / 2 + 95, y1, 21.55, 22.05, t);
      drawStrip(ctx, o.strip2, -o.w / 2 + 95, y1 + o.strip.h / 2 + o.strip2.h / 2 + 22, 22.05, 22.4, t);
    });
  },
  cardS(ctx, o, t) { inLocal(ctx, o, () => revealH(ctx, o.hand, 0, 40, prog(t, ...o.write)), 0); },
  card1(ctx, o, t) { inLocal(ctx, o, () => revealH(ctx, o.hand, 0, 40, prog(t, ...o.write)), 0); },
  card2(ctx, o, t) { inLocal(ctx, o, () => revealH(ctx, o.hand, 0, 40, prog(t, ...o.write)), 0); },
  card3(ctx, o, t) { inLocal(ctx, o, () => revealH(ctx, o.hand, 0, 40, prog(t, ...o.write)), 0); },
};
const QMARK = makeHand('?', 'Caveat', 640, RED, 41);

// screen-space-ish hero words that are typed (only "SENANG?")
function drawOverlays(ctx, t, cam) {
  if (t > 3.3 && t < 5.0) {
    setCam(ctx, cam);
    const o = O.portrait, [wx, wy] = L2W(o, 0, 760);
    const text = 'SENANG?', size = 450, t0 = 3.40, step = 0.055;
    ctx.save(); ctx.translate(wx, wy); ctx.rotate(-1 * DEG);
    ctx.font = `${size}px Oswald`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const widths = [...text].map((c) => ctx.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0);
    const fade = 1 - sst(prog(t, 4.3, 4.85));
    let xx = -total / 2;
    [...text].forEach((ch, i) => {
      const u = prog(t, t0 + i * step, t0 + i * step + 0.09);
      if (u > 0) {
        const s = lerp(1.3, 1, eOut3(u));
        ctx.save(); ctx.translate(xx + widths[i] / 2, 0); ctx.scale(s, s);
        ctx.globalAlpha = clamp(u * 2) * fade;
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.filter = 'blur(18px)'; ctx.fillText(ch, -widths[i] / 2 + 10, 22); ctx.filter = 'none';
        ctx.fillStyle = '#f3ead6'; ctx.fillText(ch, -widths[i] / 2, 0);
        ctx.restore();
      }
      xx += widths[i];
    });
    ctx.restore();
  }
}

// ------------------------------------------------------------------ frame pipeline
const scene = C(W, H), sctx = scene.getContext('2d');
const spot = C(W, H), pctx = spot.getContext('2d');
const acc = C(W, H), actx = acc.getContext('2d');
const small = C(W / 8, H / 8), smx = small.getContext('2d');
const small2 = C(W / 8, H / 8), sm2 = small2.getContext('2d');
const dofS = C(W / 4, H / 4), dfx = dofS.getContext('2d');
const dofL = C(W, H), dlx = dofL.getContext('2d');
const dofMask = (() => {
  const c = C(W, H), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.17, 'rgba(0,0,0,0)'); g.addColorStop(0.83, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
  x.fillStyle = g; x.fillRect(0, 0, W, H); return c;
})();
const vign = (() => {
  const c = C(W, H), x = c.getContext('2d');
  const g = x.createRadialGradient(W / 2, H * 0.46, H * 0.18, W / 2, H * 0.48, H * 0.66);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.6, 'rgba(0,0,0,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0.72)');
  x.fillStyle = g; x.fillRect(0, 0, W, H); return c;
})();

const dark = C(W, H), dkx = dark.getContext('2d');
const beamTex = (() => {
  const c = C(512, 512), x = c.getContext('2d');
  const g = x.createRadialGradient(256, 256, 0, 256, 256, 256);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.62, 'rgba(255,255,255,0.92)'); g.addColorStop(0.85, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 512, 512); return c;
})();
const warmTex = (() => {
  const c = C(512, 512), x = c.getContext('2d');
  const g = x.createRadialGradient(256, 256, 0, 256, 256, 256);
  g.addColorStop(0, 'rgba(255,196,128,0.16)'); g.addColorStop(0.7, 'rgba(255,170,100,0.10)'); g.addColorStop(1, 'rgba(255,170,100,0)');
  x.fillStyle = g; x.fillRect(0, 0, 512, 512); return c;
})();
function flashAt(t) {
  const darkness = sst(prog(t, 20.3, 20.85)) * (1 - sst(prog(t, 26.95, 27.7)));
  if (darkness <= 0) return null;
  let on = sst(prog(t, 20.92, 21.02));
  if (t > 20.92 && t < 21.15) on *= 0.75 + 0.25 * Math.sin(t * 160); // bulb flicker as it switches on
  const A1 = [5520, 6980, 1250], A2 = L2W(O.peci, 70, -150).concat([1150]);
  const u = sst(prog(t, 23.55, 24.3)), push = sst(prog(t, 25.6, 26.9));
  let x = lerp(A1[0], A2[0], u), y = lerp(A1[1], A2[1], u), R = lerp(A1[2], A2[2], u) * (1 - 0.12 * push);
  if (t < 21.2) { x -= (1 - sst(prog(t, 20.9, 21.25))) * 900; } // beam sweeps in from the left
  x += Math.sin(t * 1.9) * 35 + Math.sin(t * 4.1) * 12; y += Math.cos(t * 1.5) * 30 + Math.sin(t * 3.3) * 10;
  return { darkness, on, x, y, R };
}

function renderSub(t) {
  const cam = camAt(t);
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  sctx.fillStyle = '#0b0806'; sctx.fillRect(0, 0, W, H);
  drawWorld(sctx, t, cam);
  // dim everything except the hero
  const hr = heroAt(t);
  pctx.setTransform(1, 0, 0, 1, 0, 0); pctx.globalCompositeOperation = 'source-over';
  pctx.clearRect(0, 0, W, H);
  pctx.fillStyle = `rgba(6,4,3,${hr.dim})`; pctx.fillRect(0, 0, W, H);
  pctx.globalCompositeOperation = 'destination-out';
  setCam(pctx, cam);
  pctx.translate(hr.cx, hr.cy); pctx.rotate(hr.r);
  const fw = hr.w * 2, fh = hr.h * 2; // hole texture: inner 50% is solid
  pctx.drawImage(holeTex, -fw / 2, -fh / 2, fw, fh);
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  sctx.drawImage(spot, 0, 0);
  const fl = flashAt(t);
  if (fl) {
    dkx.setTransform(1, 0, 0, 1, 0, 0); dkx.globalCompositeOperation = 'source-over'; dkx.globalAlpha = 1;
    dkx.clearRect(0, 0, W, H);
    dkx.fillStyle = `rgba(3,2,1,${0.95 * fl.darkness})`; dkx.fillRect(0, 0, W, H);
    setCam(dkx, cam);
    dkx.globalCompositeOperation = 'destination-out'; dkx.globalAlpha = fl.on;
    dkx.drawImage(beamTex, fl.x - fl.R, fl.y - fl.R, fl.R * 2, fl.R * 2);
    sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.drawImage(dark, 0, 0);
    setCam(sctx, cam); sctx.globalCompositeOperation = 'screen'; sctx.globalAlpha = fl.on * fl.darkness;
    sctx.drawImage(warmTex, fl.x - fl.R * 1.05, fl.y - fl.R * 1.05, fl.R * 2.1, fl.R * 2.1);
    sctx.globalCompositeOperation = 'source-over'; sctx.globalAlpha = 1; sctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  return cam;
}

function screenMotion(t0, t1) { // max pixel travel of the frame corners between two times
  const a = camAt(t0), b = camAt(t1);
  let m = 0;
  for (const [sx, sy] of [[0, 0], [W, 0], [0, H], [W, H], [W / 2, H / 2]]) {
    const k = H / a.vh;
    let [wx, wy] = rot2((sx - W / 2) / k, (sy - H / 2) / k, -a.r); wx += a.x; wy += a.y;
    const k2 = H / b.vh;
    let [px, py] = rot2(wx - b.x, wy - b.y, b.r); px = px * k2 + W / 2; py = py * k2 + H / 2;
    m = Math.max(m, Math.hypot(px - sx, py - sy));
  }
  return m;
}
const EVENTS = [0.6, 3.12, 6.68, 6.94, 7.46, 13.74, 21.0, 23.9, 35.02, 36.9, 37.86, 39.72, 48.18, 49.18, 50.58, 61.4, 62.4];

function renderFrame(fi) {
  const t = fi / FPS, shutter = 0.5 / FPS;
  const mot = screenMotion(t - shutter / 2, t + shutter / 2);
  let n = clamp(Math.ceil(mot / (3.5 * SC)), 1, A.maxsub ? +A.maxsub : 16);
  if (EVENTS.some((e) => t > e - 0.6 && t < e + 0.15)) n = Math.max(n, 4);
  for (const id of ['militer', 'protes', 'sawah']) if (t > O[id].drop - 0.65 && t < O[id].drop + 0.03) n = Math.max(n, 14);
  actx.setTransform(1, 0, 0, 1, 0, 0); actx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < n; i++) {
    const ts = n === 1 ? t : t - shutter / 2 + shutter * (i + 0.5) / n;
    renderSub(ts);
    actx.globalAlpha = 1 / (i + 1);
    actx.drawImage(scene, 0, 0);
  }
  actx.globalAlpha = 1;
  // shallow depth of field: soften the top and bottom of frame
  dfx.filter = `blur(${Math.max(1, 5 * SC)}px)`; dfx.drawImage(acc, 0, 0, W / 4, H / 4); dfx.filter = 'none';
  dlx.globalCompositeOperation = 'source-over'; dlx.clearRect(0, 0, W, H); dlx.drawImage(dofS, 0, 0, W, H);
  dlx.globalCompositeOperation = 'destination-in'; dlx.drawImage(dofMask, 0, 0);
  actx.drawImage(dofL, 0, 0);
  // glow: square the image (keeps only brights), blur, add back softly
  smx.globalCompositeOperation = 'source-over'; smx.globalAlpha = 1; smx.drawImage(acc, 0, 0, W / 8, H / 8);
  smx.globalCompositeOperation = 'multiply'; smx.drawImage(small, 0, 0);
  sm2.clearRect(0, 0, W / 8, H / 8); sm2.filter = `blur(${Math.max(2, 9 * SC * 4 / 4)}px)`; sm2.drawImage(small, 0, 0); sm2.filter = 'none';
  actx.globalCompositeOperation = 'screen'; actx.globalAlpha = 0.42; actx.drawImage(small2, 0, 0, W, H);
  actx.globalCompositeOperation = 'source-over'; actx.globalAlpha = 1;
  actx.drawImage(vign, 0, 0);
  // film grain
  const gi = IMG.grain[fi % 6], r = rng(fi * 7 + 3);
  actx.save(); actx.globalCompositeOperation = 'overlay'; actx.globalAlpha = 0.16;
  const gs = 2 * SC, ox = -r() * 200 * SC, oy = -r() * 200 * SC;
  actx.drawImage(gi, ox, oy, 1080 * gs + 200 * SC, 1920 * gs + 200 * SC);
  actx.restore();
  // fade in from black, fade out at the very end
  const fade = Math.min(sst(prog(t, 0, 0.35)), 1 - sst(prog(t, 62.98, 63.33)));
  if (fade < 1) { actx.fillStyle = `rgba(0,0,0,${1 - fade})`; actx.fillRect(0, 0, W, H); }
  return n;
}

// ------------------------------------------------------------------ entry points
if (A.camlog) { // per-frame screen motion (px at 2160x3840) and zoom, for smoothness review
  const rows = ['t,motion_px,vh'];
  for (let fi = 0; fi < NF; fi++) { const t = fi / FPS; rows.push(`${t.toFixed(3)},${(screenMotion(t, t + 1 / FPS) / SC).toFixed(2)},${camAt(t).vh.toFixed(0)}`); }
  fs.writeFileSync(A.camlog, rows.join('\n')); console.log('camlog ->', A.camlog); process.exit(0);
}
if (A.stills) {
  const dir = path.resolve(A.outdir || path.join(ROOT, 'out', 'stills'));
  fs.mkdirSync(dir, { recursive: true });
  for (const s of String(A.stills).split(',')) {
    const t = +s, fi = Math.round(t * FPS);
    renderFrame(fi);
    fs.writeFileSync(path.join(dir, `t${t.toFixed(2).padStart(6, '0')}.jpg`), await acc.encode('jpeg', 88));
  }
  console.log('stills ->', dir);
} else if (A.seq) { // frame sequence for motion review: --seq 16.0:18.0:3  (start:end:everyNth)
  const [a, b, every] = String(A.seq).split(':').map(Number);
  const dir = path.resolve(A.outdir || path.join(ROOT, 'out', 'seq'));
  fs.mkdirSync(dir, { recursive: true });
  for (let fi = Math.round(a * FPS); fi <= Math.round(b * FPS); fi += every || 1) {
    renderFrame(fi);
    fs.writeFileSync(path.join(dir, `f${String(fi).padStart(5, '0')}.jpg`), await acc.encode('jpeg', 85));
  }
  console.log('seq ->', dir);
} else {
  const from = +(A.from || 0), to = Math.min(+(A.to || NF), NF);
  const out = path.resolve(A.out || path.join(ROOT, 'out', 'video.mp4'));
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', A.preset || 'medium', '-crf', A.crf || '16', '-pix_fmt', 'yuv420p', '-tune', 'grain', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now(); let subs = 0;
  for (let fi = from; fi < to; fi++) {
    subs += renderFrame(fi);
    const buf = Buffer.from(actx.getImageData(0, 0, W, H).data.buffer);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((fi - from) % 30 === 0) console.log(`[${from}-${to}] frame ${fi}  ${((Date.now() - t0) / 1000 / (fi - from + 1)).toFixed(2)} s/f  avg sub ${(subs / (fi - from + 1)).toFixed(1)}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log('done', out, ((Date.now() - t0) / 1000).toFixed(0), 's');
}
