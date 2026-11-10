// Tragedi Ciamis: Kasus Tarsum. One continuous camera move over a dark case board
// (pins, red string, name strips, flashlight). Every frame drawn in code.
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
const FPS = 30, DUR = 68.362, NF = Math.ceil(DUR * FPS); // 2051 frames = 68.367 s
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
for (const n of ['tarsum', 'baskom', 'rt', 'warga', 'diamankan', 'rsj', 'rumahduka', 'kandang'])
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
function drawStrip(ctx, st, lx, ly, t0, t1, t) { // left-aligned at lx; the tape appears just before its name is typed
  if (t < t0 - 0.25) return;
  const ap = eOut3(prog(t, t0 - 0.25, t0 - 0.04));
  ctx.save(); ctx.translate(-(1 - ap) * 60, 0); ctx.globalAlpha = ap;
  ctx.save(); ctx.globalAlpha = 0.5 * ap; ctx.fillStyle = '#000'; ctx.fillRect(lx + 8, ly - st.h / 2 + 12, st.w, st.h); ctx.restore();
  ctx.drawImage(st.tex, lx, ly - st.h / 2, st.w, st.h);
  const k = Math.floor(clamp(prog(t, t0, t1)) * st.n + 1e-6);
  if (k > 0) { const pw = st.pos[k - 1]; ctx.drawImage(st.txt, 0, 0, pw, st.h, lx, ly - st.h / 2, pw, st.h); }
  ctx.restore();
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
// One dark case board. Story runs down the board: map -> Tarsum + Yanti -> basin -> village -> RT -> villagers ->
// arrest -> goat pen -> RSJ -> exam -> case folder; the ending travels back up to Yanti.
const O = {};
function place(id, built, cx, cy, rotDeg, extra = {}) {
  O[id] = { id, ...built, cx, cy, rot: rotDeg * DEG, shadow: makeShadow(built.w, built.h, extra.R || 45), ...extra };
  return O[id];
}
const L2W = (o, lx, ly) => { const [a, b] = rot2(lx, ly, o.rot); return [o.cx + a, o.cy + b]; };

// AI illustrations always carry a readable label, so nobody takes them for real photos
function makeAIPrint(img, photoW) {
  const p = makePrint(img, photoW, 65), x = p.tex.getContext('2d');
  const size = 90, text = 'ILUSTRASI AI';
  x.font = `${size}px OswaldMed`;
  const tw = x.measureText(text).width, bw = tw + 70, bh = size * 1.45;
  const bx = p.w - 65 - bw - 34, by = 65 + 34;
  x.fillStyle = 'rgba(12,10,8,0.74)'; x.fillRect(bx, by, bw, bh);
  x.fillStyle = '#f1eadb'; x.textBaseline = 'middle'; x.fillText(text, bx + 35, by + bh * 0.53);
  return p;
}

function makeDateTag(text) {
  x0.font = '230px Oswald';
  const tw = x0.measureText(text).width;
  const w = Math.round(tw + 330), h = 380, c = C(w, h), x = c.getContext('2d');
  const shape = new Path2D();
  shape.moveTo(110, 0); shape.lineTo(w, 0); shape.lineTo(w, h); shape.lineTo(110, h); shape.lineTo(0, h - 110); shape.lineTo(0, 110); shape.closePath();
  x.save(); x.clip(shape); paperize(x, w, h, '#cdb685', { edge: 50, edgeA: 0.35, tile: 0.7 }); x.restore();
  x.fillStyle = 'rgba(70,50,25,0.45)'; x.beginPath(); x.arc(95, h / 2, 46, 0, Math.PI * 2); x.fill();
  x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(95, h / 2, 24, 0, Math.PI * 2); x.fill();
  x.globalCompositeOperation = 'source-over';
  x.font = '230px Oswald'; x.fillStyle = '#2a2119'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, w / 2 + 70, h / 2 + 8);
  roughen(x, w, h, 77, Math.round(w * h / 300), 7);
  return { tex: c, w, h };
}

function makeDoc(seed) {
  const w = 1900, h = 2690, c = C(w, h), x = c.getContext('2d');
  paperize(x, w, h, '#e9e2cf', { edge: 110, edgeA: 0.3 });
  const r = rng(seed);
  x.fillStyle = 'rgba(95,88,78,0.55)';
  let y = 250;
  x.fillRect(w / 2 - 430, y, 860, 52); y += 100;
  x.fillRect(w / 2 - 300, y, 600, 34); y += 110;
  x.fillRect(200, y, w - 400, 5); y += 120;
  x.fillStyle = 'rgba(110,103,92,0.40)';
  const skip0 = h / 2 - 260, skip1 = h / 2 + 330; // leave room for the typed finding
  while (y < h - 520) {
    if (y > skip0 && y < skip1) { y = skip1; continue; }
    const n = 3 + Math.floor(r() * 4);
    for (let i = 0; i < n && y < h - 520 && !(y > skip0 && y < skip1); i++) {
      const len = (i === n - 1 ? 0.35 + r() * 0.35 : 0.86 + r() * 0.14) * (w - 400);
      x.fillRect(200, y, len, 22); y += 64;
    }
    y += 60;
  }
  x.strokeStyle = 'rgba(40,50,80,0.55)'; x.lineWidth = 6; x.beginPath();
  for (let i = 0; i <= 40; i++) { const t = i / 40; const sx = w - 760 + t * 460, sy = h - 330 + Math.sin(t * 18) * 40 * (1 - t) - t * 40; i ? x.lineTo(sx, sy) : x.moveTo(sx, sy); }
  x.stroke();
  return { tex: c, w, h };
}

function makeVictimCard() {
  const w = 1300, h = 1650, c = C(w, h), x = c.getContext('2d');
  paperize(x, w, h, '#ece6d8', { edge: 60, edgeA: 0.22 });
  const g = x.createRadialGradient(w / 2, 640, 80, w / 2, 640, 700);
  g.addColorStop(0, '#4a4642'); g.addColorStop(1, '#25221f');
  x.fillStyle = g; x.fillRect(100, 100, w - 200, 1130);
  x.strokeStyle = 'rgba(30,25,20,0.5)'; x.lineWidth = 3; x.strokeRect(100, 100, w - 200, 1130);
  return { tex: c, w, h };
}

function makeFolder() {
  const w = 2400, h = 1800, tabH = 150, c = C(w, h + tabH), x = c.getContext('2d');
  const back = C(w, h + tabH), b = back.getContext('2d');
  paperize(b, w, h + tabH, '#bfa36c', { edge: 60, edgeA: 0.35, tile: 0.6 });
  x.save(); const tab = new Path2D(); tab.moveTo(140, tabH); tab.lineTo(200, 0); tab.lineTo(820, 0); tab.lineTo(880, tabH); tab.closePath();
  tab.rect(0, tabH, w, h); x.clip(tab); x.drawImage(back, 0, 0); x.restore();
  const front = C(w, h - 60), f = front.getContext('2d');
  paperize(f, w, h - 60, '#d6bd86', { edge: 70, edgeA: 0.35, tile: 0.6 });
  x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, tabH + 50, w, 14);
  x.drawImage(front, 0, tabH + 60);
  return { tex: c, w, h: h + tabH };
}

// hand-drawn village sketch with the route Tarsum walked
const VILLAGE = (() => {
  const chaikin = (pts, it) => { for (let k = 0; k < it; k++) { const o = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const [a, b] = [pts[i], pts[i + 1]]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } o.push(pts.at(-1)); pts = o; } return pts; };
  const roads = {
    main: [[-1350, 650], [-700, 520], [-100, 350], [500, 300], [1350, 150]],
    laneA: [[-100, 350], [-250, -450], [-150, -950], [0, -1350]],
    laneB: [[500, 300], [650, -400], [350, -950]],
    cross: [[-150, -950], [350, -950]],
    south1: [[-900, 560], [-1050, 1300]],
    south2: [[900, 230], [1000, 1300]],
  };
  const route = chaikin([[-650, 540], [-100, 350], [500, 300], [650, -400], [350, -950], [-150, -950], [-250, -450], [-100, 350], [-420, 470]], 3);
  let len = 0; const cum = [0];
  for (let i = 1; i < route.length; i++) { len += Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]); cum.push(len); }
  const lit = [[-450, 430, 25.86], [180, 230, 25.92], [700, -150, 25.98], [520, -1040, 26.04], [80, -1040, 26.10], [-360, -650, 26.16], [-260, 160, 26.22]];
  return { roads, route, cum, len, lit, chaikin };
})();
function makeVillage() {
  const w = 2700, h = 2700, c = C(w, h), x = c.getContext('2d');
  paperize(x, w, h, '#e4ddc9', { edge: 120, edgeA: 0.3 });
  x.translate(w / 2, h / 2);
  const r = rng(17);
  // rice fields: hatched patches
  for (const [px, py, pw, ph] of [[-1250, -1250, 900, 650], [-1250, 900, 700, 330], [750, -1250, 520, 700], [800, 500, 450, 700], [-700, -300, 380, 500]]) {
    x.strokeStyle = 'rgba(95,115,85,0.35)'; x.lineWidth = 4; x.strokeRect(px, py, pw, ph);
    x.save(); x.beginPath(); x.rect(px, py, pw, ph); x.clip();
    x.lineWidth = 3; for (let k = -ph; k < pw; k += 34) { x.beginPath(); x.moveTo(px + k, py + ph); x.lineTo(px + k + ph, py); x.stroke(); }
    x.restore();
  }
  // river
  x.strokeStyle = 'rgba(80,100,110,0.45)'; x.lineWidth = 46; x.lineCap = 'round'; x.beginPath();
  for (let i = 0; i <= 40; i++) { const t = i / 40, yy = -1350 + t * 2700, xx = 1180 + Math.sin(t * 7) * 70; i ? x.lineTo(xx, yy) : x.moveTo(xx, yy); }
  x.stroke();
  // roads (pencil)
  for (const [k, pts] of Object.entries(VILLAGE.roads)) {
    const sm = VILLAGE.chaikin(pts, 3);
    for (const [lw, col] of [[k === 'main' ? 70 : 46, 'rgba(120,108,90,0.55)'], [k === 'main' ? 56 : 34, 'rgba(228,221,201,1)']]) {
      x.strokeStyle = col; x.lineWidth = lw; x.lineJoin = 'round'; x.beginPath();
      sm.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.stroke();
    }
  }
  // houses along the roads
  x.fillStyle = 'rgba(70,62,54,0.78)';
  for (const pts of Object.values(VILLAGE.roads)) {
    const sm = VILLAGE.chaikin(pts, 2);
    for (let i = 1; i < sm.length; i += 1) {
      const [a, b] = [sm[i - 1], sm[i]], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      for (const side of [-1, 1]) {
        if (r() < 0.55) continue;
        const off = 150 + r() * 40, px = (a[0] + b[0]) / 2 - Math.sin(ang) * off * side, py = (a[1] + b[1]) / 2 + Math.cos(ang) * off * side;
        x.save(); x.translate(px, py); x.rotate(ang + (r() - 0.5) * 0.3);
        x.fillRect(-62, -44, 124, 88); x.strokeStyle = 'rgba(228,221,201,0.9)'; x.lineWidth = 6; x.beginPath(); x.moveTo(-62, 0); x.lineTo(62, 0); x.stroke();
        x.restore();
      }
    }
  }
  return { tex: c, w, h };
}

// Java with Ciamis
const JM = { lon0: 104.9, lon1: 114.8, lat0: -5.65, lat1: -9.0, s: 470 };
JM.w = (JM.lon1 - JM.lon0) * JM.s; JM.h = (JM.lat0 - JM.lat1) * JM.s;
JM.x = 3600 - JM.w / 2; JM.y = 2000 - JM.h / 2;
const jproj = (lon, lat) => [JM.x + (lon - JM.lon0) * JM.s, JM.y + (JM.lat0 - lat) * JM.s];
const CIAMIS = jproj(108.35, -7.33);
{
  const topo = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules/world-atlas/countries-50m.json')));
  const indo = feature(topo, topo.objects.countries).features.filter((f) => f.properties.name === 'Indonesia');
  const margin = 200, TS = 0.6, sw = JM.w + 2 * margin, sh = JM.h + 2 * margin;
  const c = C(sw * TS, sh * TS), x = c.getContext('2d');
  paperize(x, c.width, c.height, '#d4c49e', { edge: 120, edgeA: 0.4, tile: 0.7 });
  const tf = (lon, lat) => { const [wx, wy] = jproj(lon, lat); return [(wx - JM.x + margin) * TS, (wy - JM.y + margin) * TS]; };
  const trace = () => {
    x.beginPath();
    for (const f of indo) {
      const g = f.geometry, polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
      for (const poly of polys) for (const ring of poly) { ring.forEach(([lo, la], i) => { const [px, py] = tf(lo, la); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); }
    }
  };
  const nx = margin * TS, ny = margin * TS, nw = JM.w * TS, nh = JM.h * TS;
  x.save(); x.beginPath(); x.rect(nx, ny, nw, nh); x.clip();
  x.fillStyle = 'rgba(80,98,96,0.22)'; x.fillRect(nx, ny, nw, nh);
  for (const [lw, a] of [[70, 0.07], [44, 0.08], [22, 0.12]]) { trace(); x.strokeStyle = `rgba(50,66,64,${a})`; x.lineWidth = lw * TS; x.lineJoin = 'round'; x.stroke(); }
  x.strokeStyle = 'rgba(90,70,45,0.22)'; x.lineWidth = 3 * TS;
  for (let lo = 105; lo <= 114; lo++) { const [a] = tf(lo, -7); x.beginPath(); x.moveTo(a, ny); x.lineTo(a, ny + nh); x.stroke(); }
  for (let la = -6; la >= -9; la--) { const [, b] = tf(110, la); x.beginPath(); x.moveTo(nx, b); x.lineTo(nx + nw, b); x.stroke(); }
  trace(); x.fillStyle = '#e4d6b2'; x.fill('evenodd');
  trace(); x.strokeStyle = 'rgba(70,52,34,0.85)'; x.lineWidth = 4 * TS; x.stroke();
  x.restore();
  x.strokeStyle = 'rgba(60,45,30,0.8)'; x.lineWidth = 6 * TS; x.strokeRect(nx, ny, nw, nh);
  x.lineWidth = 2.5 * TS; x.strokeRect(nx - 40 * TS, ny - 40 * TS, nw + 80 * TS, nh + 80 * TS);
  place('map', { tex: c, w: sw, h: sh }, 3600, 2000, 0, { R: 60 });
  O.map.strip = makeStrip('CIAMIS', 160, 3);
}

place('tarsum', makePrint(IMG.tarsum, 1500, 65), 2300, 5400, -2.5);
O.tarsum.strip = makeStrip('TARSUM', 160, 4);
{ const [x, y] = L2W(O.tarsum, -300, -O.tarsum.h / 2 + 40); place('tag1', makeDateTag('3 MEI 2024'), x, y, -7, { R: 25, appear: 7.68, swing: true }); }
place('yanti', makeVictimCard(), 5000, 5250, 3, { R: 35, appear: 11.3 });
O.yanti.strip = makeStrip('YANTI', 180, 5);
place('rumahduka', makeAIPrint(IMG.rumahduka, 1100), 6150, 5350, 4, { R: 35, appear: 58.78 });
place('qcard', makeCard(1400, 1000), 3700, 3900, -3, { R: 30, appear: 62.0 });
O.qcard.hand = makeHand('?', 'Caveat', 820, RED, 9);
place('baskom', makeAIPrint(IMG.baskom, 1500), 4300, 8000, 2, { appear: 17.7 });
place('village', makeVillage(), 1900, 10500, -1.5, { R: 50 });
place('rt', makeAIPrint(IMG.rt, 1500), 4650, 12000, 2.5);
O.rt.strip = makeStrip('YOYO TARYA', 160, 6);
O.rt.strip2 = makeStrip('KETUA RT', 115, 7);
place('warga', makeAIPrint(IMG.warga, 1500), 2000, 14400, -2, { drop: 33.7 });
place('diamankan', makeAIPrint(IMG.diamankan, 1500), 4600, 15100, 2, { drop: 36.76 });
place('kandang', makePrint(IMG.kandang, 2300, 70), 2700, 17700, -1.5);
O.kandang.stamp = makeStamp('BANGKRUT', 300, 61);
place('rsj', makeAIPrint(IMG.rsj, 1500), 4900, 19700, 2, { drop: 44.84 });
place('doc', makeDoc(3), 2300, 21500, -2);
place('folder', makeFolder(), 4500, 24000, 1.5, { R: 55 });
O.folder.stamp = makeStamp('DIHENTIKAN', 300, 62);
{ const [x, y] = L2W(O.folder, -620, -O.folder.h / 2 + 60); place('tag2', makeDateTag('SEPTEMBER 2024'), x, y, -6, { R: 25, appear: 49.74, swing: true }); }

const DRAW_ORDER = ['map', 'village', 'doc', 'folder', 'tag2', 'tarsum', 'tag1', 'yanti', 'rumahduka', 'baskom', 'rt', 'warga', 'diamankan', 'kandang', 'rsj', 'qcard'];

// ------------------------------------------------------------------ pins and strings
const topPin = (id, dy = 55) => () => L2W(O[id], 0, -O[id].h / 2 + dy);
const edge = (id, lx, ly) => () => L2W(O[id], lx, ly);
const PINS = {
  ciamis: { at: () => CIAMIS, s: 1.35 },
  tarsum: { at: topPin('tarsum') }, tarsumR: { at: edge('tarsum', O.tarsum.w / 2 - 55, -300) }, tarsumB: { at: edge('tarsum', 0, O.tarsum.h / 2 - 50) },
  tag1: { at: () => L2W(O.tag1, -O.tag1.w / 2 + 95, 0), t: 7.68 },
  yanti: { at: topPin('yanti'), t: 11.3 }, yantiL: { at: edge('yanti', -O.yanti.w / 2 + 55, -300), t: 11.3 },
  rumahduka: { at: topPin('rumahduka'), t: 58.78 }, qcard: { at: topPin('qcard', 50), t: 62.0 },
  baskom: { at: topPin('baskom'), t: 17.7 }, baskomB: { at: edge('baskom', 0, O.baskom.h / 2 - 50), t: 17.7 },
  village: { at: topPin('village', 70) }, villageR: { at: edge('village', O.village.w / 2 - 70, 0) },
  rt: { at: topPin('rt') }, rtB: { at: edge('rt', 0, O.rt.h / 2 - 50) },
  warga: { at: topPin('warga'), t: 33.7 }, wargaR: { at: edge('warga', O.warga.w / 2 - 55, 0), t: 33.7 },
  diamankan: { at: topPin('diamankan'), t: 36.76 }, diamankanB: { at: edge('diamankan', 0, O.diamankan.h / 2 - 50), t: 36.76 },
  kandang: { at: topPin('kandang') }, kandangR: { at: edge('kandang', O.kandang.w / 2 - 60, 0) },
  rsj: { at: topPin('rsj'), t: 44.84 }, rsjB: { at: edge('rsj', 0, O.rsj.h / 2 - 50), t: 44.84 },
  doc: { at: topPin('doc', 60) }, docB: { at: edge('doc', 0, O.doc.h / 2 - 60) },
  folder: { at: topPin('folder', 90) }, tag2: { at: () => L2W(O.tag2, -O.tag2.w / 2 + 95, 0), t: 49.74 },
};
const STRINGS = [
  ['ciamis', 'tarsum', 6.75, 8.6], ['tarsumR', 'yantiL', 11.0, 11.45], ['tarsumB', 'baskom', 14.6, 17.6],
  ['baskomB', 'villageR', 20.9, 22.4], ['villageR', 'rt', 26.2, 27.0], ['rtB', 'warga', 32.9, 33.65],
  ['wargaR', 'diamankan', 35.9, 36.7], ['diamankanB', 'kandang', 38.3, 40.65], ['kandangR', 'rsj', 43.6, 44.8],
  ['rsjB', 'doc', 45.9, 46.9], ['docB', 'folder', 48.6, 50.2],
];
function stringPoint(a, b, p) { // same curve drawString uses
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), sag = Math.min(0.05 * len, 380) + 15;
  const cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2 + sag, v = 1 - p;
  return [v * v * a[0] + 2 * v * p * cx + p * p * b[0], v * v * a[1] + 2 * v * p * cy + p * p * b[1]];
}
let CUR_VB = null;
function drawStringsAndPins(ctx, t, vb) {
  for (const [a, b, t0, t1, lw] of STRINGS) {
    if (t < t0) continue;
    const pa = PINS[a].at(), pb = PINS[b].at();
    const x0 = Math.min(pa[0], pb[0]), x1 = Math.max(pa[0], pb[0]), y0 = Math.min(pa[1], pb[1]), y1 = Math.max(pa[1], pb[1]) + 400;
    if (x1 < vb.x0 || x0 > vb.x1 || y1 < vb.y0 || y0 > vb.y1) continue;
    drawString(ctx, pa, pb, eInOut2(prog(t, t0, t1)), lw || 13);
  }
  for (const k in PINS) {
    const P0 = PINS[k], [x, y] = P0.at();
    if (x < vb.x0 - 200 || x > vb.x1 + 200 || y < vb.y0 - 200 || y > vb.y1 + 200) continue;
    drawPin(ctx, x, y, P0.s || 1, t, P0.t);
  }
}
const LIGHT = (() => { // lamp pools over each cluster, multiplied over everything
  const s = 1 / 50, c = C(12000 * s, 30000 * s), x = c.getContext('2d');
  x.fillStyle = 'rgb(70,62,56)'; x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'lighter';
  for (const [cx, cy, rx, ry] of [[3600, 2000, 3400, 1800], [2300, 5300, 2000, 2100], [5300, 5250, 2200, 1900], [3700, 3900, 1500, 1200],
    [4300, 8000, 1900, 2100], [1900, 10500, 2400, 2400], [4650, 12000, 1900, 2100], [2000, 14400, 1900, 2100], [4600, 15100, 1900, 2100],
    [2700, 17700, 2400, 1700], [4900, 19700, 1900, 2100], [2300, 21500, 1900, 2300], [4500, 24000, 2400, 2000]]) {
    x.save(); x.translate((cx + 3000) * s, (cy + 3000) * s); x.scale(rx * s, ry * s);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, 'rgba(178,188,196,1)'); g.addColorStop(0.55, 'rgba(130,138,145,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)');
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
  [0.00, 1.20, Wp(3600, 2050, 9200, 0.3), Wp(3450, 2050, 8600, 0.2)],
  [3.10, 6.55, Wp(CIAMIS[0] + 250, CIAMIS[1] + 150, 3000, 0.3), Wp(CIAMIS[0] + 150, CIAMIS[1] + 600, 3250, 0.1)],
  [7.85, 10.50, P('tarsum', 0, -200, 3600, -0.3), P('tarsum', 180, -100, 3450, -0.2)],
  [11.35, 13.70, P('yanti', -150, 0, 3600, 0.2), P('yanti', -300, 150, 3450, 0.1)],
  [14.60, 17.30, Wp(2700, 6600, 4300, 0.2), Wp(3900, 7600, 3900, 0.3)],
  [17.90, 20.55, P('baskom', 0, -100, 3300, 0.3), P('baskom', 82, 40, 2550, 0.1)],
  [22.30, 26.15, P('village', 0, -100, 4700, -0.2), P('village', 120, 0, 4500, -0.3)],
  [27.00, 32.75, P('rt', 0, 100, 3500, 0.2), P('rt', -120, 300, 3250, 0)],
  [33.60, 35.80, P('warga', 0, 0, 3500, -0.2), P('warga', 150, 60, 3400, -0.3)],
  [36.65, 38.40, P('diamankan', 0, -100, 3450, 0.3), P('diamankan', -100, 60, 3350, 0.2)],
  [39.70, 43.50, P('kandang', 0, 0, 4900, -0.2), P('kandang', 150, 80, 4650, -0.1)],
  [44.70, 46.30, P('rsj', 0, 0, 3500, 0.2), P('rsj', -150, 150, 3400, 0.1)],
  [46.95, 48.95, P('doc', 0, 150, 3000, -0.2), P('doc', 0, 160, 2700, -0.3)],
  [49.95, 56.00, P('folder', -180, -40, 4600, 0.2), P('folder', -160, -300, 4800, 0.1)],
  [58.50, 60.70, Wp(5500, 5300, 4700, 0.2), Wp(5320, 5180, 4600, 0.1)],
  [63.00, 69.00, Wp(3800, 4450, 6100, 0), Wp(3750, 4500, 6800, 0)],
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
const IMPACTS = [[7.68, 0.3], [17.7, 0.4], [19.84, 0.2], [33.7, 0.6], [36.76, 0.7], [41.56, 1], [44.84, 0.6], [52.9, 1], [62.04, 0.3]];

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
  [0, 'map', 0.5], [6.9, 'tarsum', 0.55], [11.0, 'yanti', 0.55], [16.5, 'baskom', 0.55], [20.9, 'village', 0.55], [26.4, 'rt', 0.55],
  [33.3, 'warga', 0.55], [36.3, 'diamankan', 0.55], [38.8, 'kandang', 0.55], [44.4, 'rsj', 0.55], [46.5, 'doc', 0.55],
  [49.3, 'folder', 0.55], [57.6, 'mourn', 0.6], [61.2, 'final', 0.32],
];
function heroRect(id) {
  if (id === 'mourn') return { cx: 5550, cy: 5300, w: 2700, h: 2000, r: 0 };
  if (id === 'final') return { cx: 3800, cy: 4500, w: 4600, h: 4600, r: 0 };
  const o = O[id];
  return { cx: o.cx, cy: o.cy, w: o.w + 160, h: o.h + 160, r: o.rot };
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
  ctx.drawImage(IMG.corkBase, -3000, -3000, 12000, 30000);
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
  ctx.drawImage(LIGHT, -3000, -3000, 12000, 30000);
  ctx.restore();
}

// per-object animated details (object-local coordinates unless noted)
function typeText(ctx, text, font, cx, y, t0, t1, t, color) {
  ctx.font = font; ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const full = ctx.measureText(text).width, k = Math.floor(clamp(prog(t, t0, t1)) * text.length + 1e-6);
  if (k > 0) ctx.fillText(text.slice(0, k), cx - full / 2, y);
  return full;
}
const DYN = {
  map(ctx, o, t) { drawStrip(ctx, o.strip, CIAMIS[0] + 120, CIAMIS[1] - 240, 3.52, 3.95, t); },
  tarsum(ctx, o, t) { inLocal(ctx, o, () => drawStrip(ctx, o.strip, -o.w / 2 + 100, o.h / 2 - 65 - o.strip.h / 2 - 34, 9.36, 9.8, t)); },
  yanti(ctx, o, t) { inLocal(ctx, o, () => drawStrip(ctx, o.strip, -o.w / 2 + 100, o.h / 2 - 210, 11.56, 11.95, t)); },
  baskom(ctx, o, t) { inLocal(ctx, o, () => drawCircle(ctx, 82, 40, 300, 175, sst(prog(t, 19.72, 20.35)), 4)); },
  rt(ctx, o, t) {
    inLocal(ctx, o, () => {
      const y2 = o.h / 2 - 65 - o.strip2.h / 2 - 34, y1 = y2 - o.strip2.h / 2 - 20 - o.strip.h / 2;
      drawStrip(ctx, o.strip, -o.w / 2 + 100, y1, 28.22, 28.72, t);
      drawStrip(ctx, o.strip2, -o.w / 2 + 100, y2, 26.74, 27.38, t);
    });
  },
  village(ctx, o, t) {
    const p = eInOut2(prog(t, 22.66, 25.9));
    inLocal(ctx, o, () => {
      if (p > 0) {
        const V = VILLAGE, L = V.len * p;
        ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([70, 46]); ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.moveTo(...V.route[0]);
        for (let i = 1; i < V.route.length; i++) {
          if (V.cum[i] <= L) ctx.lineTo(...V.route[i]);
          else { const a = V.route[i - 1], b = V.route[i], u = (L - V.cum[i - 1]) / (V.cum[i] - V.cum[i - 1]); ctx.lineTo(lerp(a[0], b[0], u), lerp(a[1], b[1], u)); break; }
        }
        ctx.stroke(); ctx.restore();
        if (p < 1) { // walker dot at the head of the route
          let hx = V.route[0][0], hy = V.route[0][1];
          for (let i = 1; i < V.route.length; i++) if (V.cum[i] >= L) { const a = V.route[i - 1], b = V.route[i], u = (L - V.cum[i - 1]) / (V.cum[i] - V.cum[i - 1]); hx = lerp(a[0], b[0], u); hy = lerp(a[1], b[1], u); break; }
          ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(hx, hy, 34, 0, Math.PI * 2); ctx.fill();
        }
      }
      for (const [hx, hy, ta] of VILLAGE.lit) drawPin(ctx, hx, hy, 0.85, t, ta); // the houses he went to light up on "warga"
    });
  },
  kandang(ctx, o, t) { inLocal(ctx, o, () => stampAt(ctx, o.stamp, 120, 80, -8, t, 41.56)); },
  doc(ctx, o, t) {
    inLocal(ctx, o, () => {
      const full = typeText(ctx, 'gangguan jiwa', '190px Elite', 0, 40, 47.84, 48.38, t, INK);
      drawCircle(ctx, 0, 40, full / 2 + 110, 150, sst(prog(t, 48.42, 49.0)), 8);
    });
  },
  folder(ctx, o, t) { inLocal(ctx, o, () => stampAt(ctx, o.stamp, 40, 160, -7, t, 52.9)); },
  qcard(ctx, o, t) {
    inLocal(ctx, o, () => {
      const q = o.hand, p = eOut3(prog(t, 62.04, 62.4));
      if (p > 0) ctx.drawImage(q.tex, 0, 0, q.tex.width, q.tex.height * p, -q.w / 2, -q.h / 2 + 40, q.w, q.h * p);
    });
  },
};

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
  // lights out on "Tak berhenti di situ" (14.0); the beam follows the string down into the dark to the basin; lights back on "Yang lebih" (20.8)
  const darkness = sst(prog(t, 13.95, 14.5)) * (1 - sst(prog(t, 20.75, 21.4)));
  if (darkness <= 0) return null;
  let on = sst(prog(t, 14.5, 14.62));
  if (t > 14.5 && t < 14.75) on *= 0.75 + 0.25 * Math.sin(t * 160);
  const a = PINS.tarsumB.at(), b = PINS.baskom.at();
  const head = stringPoint(a, b, eInOut2(prog(t, 14.6, 17.6)));
  const basin = L2W(O.baskom, 82, 40);
  const u = sst(prog(t, 17.3, 18.3)), push = sst(prog(t, 19.5, 20.4));
  let x = lerp(head[0], basin[0], u), y = lerp(head[1], basin[1], u), R = lerp(950, 1350, u) * (1 - 0.15 * push);
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
const EVENTS = [3.52, 7.68, 11.3, 17.7, 19.84, 22.66, 33.7, 36.76, 40.72, 41.56, 44.84, 47.84, 49.74, 52.9, 58.78, 62.04];

function renderFrame(fi) {
  const t = fi / FPS, shutter = 0.5 / FPS;
  const mot = screenMotion(t - shutter / 2, t + shutter / 2);
  let n = clamp(Math.ceil(mot / (3.5 * SC)), 1, A.maxsub ? +A.maxsub : 16);
  if (EVENTS.some((e) => t > e - 0.6 && t < e + 0.15)) n = Math.max(n, 4);
  for (const id of ['warga', 'diamankan', 'rsj']) if (t > O[id].drop - 0.65 && t < O[id].drop + 0.03) n = Math.max(n, 14);
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
  const fade = Math.min(sst(prog(t, 0, 0.35)), 1 - sst(prog(t, 67.55, 68.3))); // lights out on "kekerasan"
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

