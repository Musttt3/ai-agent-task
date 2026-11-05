// Shots 5-9: the phone (three medallions), school & hospital, the village lights, the freeze, the MILIARDER marquee.
import { D, T, B, W, H, CX, clamp, lerp, seg, ss, eio, eo, ei, back, TAU, mix, rgba, hash, bg, zoomAt, pulse, settle, slab, skyscraper, tree, lamp, leaves, coin, facet } from './common.js';
import { drawBoy, drawPerson, POSES, walkPose, lerpPose, RED } from './boy.js';

// ---------- icons for the medallions ----------
function iconBriefcase(g, x, y, s) {
  const b = new Path2D(); b.roundRect(x - 34 * s, y - 18 * s, 68 * s, 46 * s, 5 * s);
  D.drawShape(g, b, { lw: 1.6, bbox: [x - 34 * s, y - 18 * s, x + 34 * s, y + 28 * s] }); D.gline(g, [[x - 12 * s, y - 18 * s], [x - 12 * s, y - 28 * s], [x + 12 * s, y - 28 * s], [x + 12 * s, y - 18 * s]], { w: 3 * s });
  D.gline(g, [[x - 34 * s, y + 2 * s], [x + 34 * s, y + 2 * s]], { w: 1.4 * s });
}
function iconWage(g, x, y, s, t) {
  // a coin with three rising chevrons
  const c = new Path2D(); c.arc(x - 14 * s, y + 8 * s, 22 * s, 0, TAU); D.drawShape(g, c, { lw: 1.6, bbox: [x - 36 * s, y - 14 * s, x + 8 * s, y + 30 * s] });
  for (let i = 0; i < 3; i++) D.gline(g, [[x + 8 * s, y + (4 - i * 14) * s], [x + 22 * s, y + (-8 - i * 14) * s], [x + 36 * s, y + (4 - i * 14) * s]], { w: 3 * s, alpha: .5 + .5 * seg(t, i * .15, i * .15 + .2) });
}
function iconScale(g, x, y, s) {
  D.gline(g, [[x, y - 30 * s], [x, y + 26 * s]], { w: 3 * s }); D.gline(g, [[x - 36 * s, y - 20 * s], [x + 36 * s, y - 20 * s]], { w: 3 * s });
  D.gline(g, [[x - 22 * s, y + 26 * s], [x + 22 * s, y + 26 * s]], { w: 3 * s });
  for (const sd of [-1, 1]) { const p = new Path2D(); p.arc(x + sd * 30 * s, y - 2 * s, 14 * s, 0, Math.PI); p.closePath(); D.drawShape(g, p, { lw: 1.2, bbox: [x + sd * 30 * s - 14 * s, y - 2 * s, x + sd * 30 * s + 14 * s, y + 12 * s] }); D.gline(g, [[x + sd * 30 * s, y - 20 * s], [x + sd * 18 * s, y - 2 * s]], { w: 1 * s }); D.gline(g, [[x + sd * 30 * s, y - 20 * s], [x + sd * 42 * s, y - 2 * s]], { w: 1 * s }); }
}
function badge(g, x, y, r, lit, label, icon, t) {
  const L = clamp(lit);
  g.save(); g.globalAlpha *= .35 + .65 * L;
  if (L > 0) D.glow(g, x, y, r * 2.6, '#ffcf7a', .45 * L + .4 * pulse(t, 0, .35));
  D.sunburst(g, x, y, { rays: 24, r0: r * 1.08, r1: r * (1.08 + .45 * eo(L)), mode: 'lines', w: 1.6, alpha: .9 });
  g.beginPath(); g.arc(x, y, r, 0, TAU); const gr = g.createRadialGradient(x - r * .3, y - r * .3, 0, x, y, r); gr.addColorStop(0, '#2a2012'); gr.addColorStop(1, '#050403'); g.fillStyle = gr; g.fill();
  D.gline(g, D.arcPts(x, y, r, 0, TAU, 64), { w: 2.6 }); D.gline(g, D.arcPts(x, y, r * .86, 0, TAU, 64), { w: 1 });
  icon(g, x, y, r / 80, t);
  g.restore();
  if (L > 0) {
    const tx = x + r + 30, a = ss(seg(t, 0, .45));
    g.save(); g.globalAlpha *= a; g.beginPath(); g.rect(tx - 10, y - 70, 560, 140); g.clip();
    T.goldText(g, label[0], tx + (1 - a) * -40, y - 2, { size: 40, font: T.FONTS.title, align: 'left', track: 1, sheen: lerp(-.2, 1.2, seg(t, .1, .9)) });
    T.goldText(g, label[1], tx + (1 - a) * -40, y + 38, { size: 22, font: T.FONTS.sans, weight: 600, align: 'left', track: 3, shadow: false });
    g.restore();
  }
}

// ---------- 5. the phone ----------
export function phone(g, u, d, K) {
  const k = K.keys, s0 = K.shot0;
  const z = 1 + eio(seg(u, 0, d)) * .07;
  g.save(); zoomAt(g, CX, 900, z);
  bg(g, '#120d08', '#040302', .3);
  D.sunburst(g, CX, 900, { rays: 56, r1: 1500, mode: 'wedges', colorA: 'rgba(201,162,75,.06)' });
  // the boy above, looking down at the phone in his hands
  drawBoy(g, { x: CX, y: 1060, s: 5.6, face: u < 1.2 ? 'smile' : 'heran', pose: { ...POSES.phone, tilt: .06 } });
  // the phone, big, in front of him
  const pw = 600, ph = 870, px = CX - pw / 2, py = 520;
  g.save(); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 40; g.shadowOffsetY = 20; g.fillStyle = '#000'; g.fillRect(px + 10, py + 10, pw - 20, ph - 20); g.restore();
  slab(g, px, py, pw, ph, { r: 46, base: '#0d0a07', rim: 3, double: 12 });
  const on = ss(seg(u, .35, .8)), sx = px + 36, sy = py + 70, sw = pw - 72, sh = ph - 140;
  g.save(); g.beginPath(); g.roundRect(sx, sy, sw, sh, 22); g.clip();
  const sg = g.createLinearGradient(0, sy, 0, sy + sh); sg.addColorStop(0, mix('#05100d', '#123a30', on)); sg.addColorStop(1, mix('#020504', '#071a15', on)); g.fillStyle = sg; g.fillRect(sx, sy, sw, sh);
  D.sunburst(g, CX, sy + sh + 40, { rays: 30, r1: 900, a0: Math.PI, a1: TAU, mode: 'lines', w: 1, alpha: .25 * on });
  // three medallions, lit in counted order on their words
  const items = [[k.lapangan, ['LAPANGAN', 'KERJA MELIMPAH'], iconBriefcase], [k.gaji, ['GAJI', 'LAYAK'], iconWage], [k.harga, ['HARGA', 'POKOK STABIL'], iconScale]];
  items.forEach(([tk, lab, ic], i) => { const lt = u - (tk - s0); badge(g, sx + 100, sy + 130 + i * 235, 70, lt < 0 ? 0 : 1 + .5 * (1 - seg(lt, 0, .2)), lab, ic, lt); });
  // sheen across the glass as the screen wakes
  const sw0 = lerp(-.3, 1.3, seg(u, .3, 1.2)); const hl = g.createLinearGradient(sx, sy, sx + sw, sy + sh); hl.addColorStop(clamp(sw0 - .08), 'rgba(255,255,255,0)'); hl.addColorStop(clamp(sw0), 'rgba(255,250,230,.16)'); hl.addColorStop(clamp(sw0 + .08), 'rgba(255,255,255,0)'); g.fillStyle = hl; g.fillRect(sx, sy, sw, sh);
  g.restore();
  // his hands on the phone's edges
  for (const sd of [-1, 1]) { const hp = new Path2D(); hp.arc(CX + sd * (pw / 2 - 6), py + ph - 160, 44, 0, TAU); facet(g, hp, [CX + sd * (pw / 2 - 6) - 44, py + ph - 204, CX + sd * (pw / 2 - 6) + 44, py + ph - 116], [[CX + sd * (pw / 2) - 40, py + ph - 120], [CX + sd * (pw / 2) + 40, py + ph - 200]], '#e9b58c', '#ffe0bd', '#a8684a', [-.6, -.8], 2); }
  g.restore();
}

// ---------- 6. school above, hospital below, one axis ----------
function facade(g, cx, base, w, h, { label, sub, color = '#1d6b57', clockR = 0, emblem = null, t = 0, p = 1, roman = false }) {
  const x0 = cx - w / 2;
  const body = [[x0, base], [x0, base - h * .7], [x0 + w * .1, base - h * .7], [x0 + w * .1, base - h * .85], [cx - w * .22, base - h * .85], [cx - w * .22, base - h], [cx + w * .22, base - h], [cx + w * .22, base - h * .85], [x0 + w * .9, base - h * .85], [x0 + w * .9, base - h * .7], [x0 + w, base - h * .7], [x0 + w, base]];
  D.airbrush(g, body, { base: '#1a130c', light: '#4a3720', dark: '#050403', dir: -2.3, rim: 2 });
  D.gline(g, [...body, body[0]], { w: 2.4, part: p });
  for (let i = 1; i < 8; i++) { const x = x0 + w * i / 8; if (Math.abs(x - cx) < w * .16) continue; D.gline(g, [[x, base - h * .66], [x, base - 6]], { w: 1.2, alpha: .7 * p }); }
  const door = D.stepArchPts(cx, base, w * .24, h * .44, { steps: 2 });
  g.save(); g.fillStyle = '#ffd78a'; g.globalAlpha = .25 + .2 * Math.sin(t * 2); g.fill(D.toPath(door, true)); g.restore();
  D.archFrame(g, cx, base, w * .3, h * .5, { rings: 2, gap: 9, burst: true, part: p });
  if (clockR) T.clockFace(g, cx, base - h * .78, clockR, { h: 7, m: 15 + t * 4, roman });
  if (emblem) emblem(g, cx, base - h * .78);
  T.titleBar(g, label, cx, base - h * .58, { p, size: 38, wings: false, track: 5, sub, subSize: 17 });
}
export function school(g, u, d, K) {
  const k = K.keys, s0 = K.shot0, tR = k.rumah - s0;
  bg(g, '#120e09', '#040302', .3);
  // match-cut: start inside the school clock (circle from the phone medallion), pull back
  const pull = eio(seg(u, 0, 1.5)), z = lerp(3.2, 1, pull);
  // top half: the school
  g.save(); zoomAt(g, CX, 280, z);
  D.sunburst(g, CX, 860, { rays: 40, r1: 1000, a0: Math.PI, a1: TAU, mode: 'both', w: 1.2, alpha: .5 });
  facade(g, CX, 860, 860, 640, { label: 'SEKOLAH', sub: 'UNTUK SEMUA ANAK', clockR: 66, t: u, p: 1 });
  for (let i = 0; i < 6; i++) {   // children walking into the arch from both sides (symmetric)
    const sd = i % 2 ? 1 : -1, ph = (u * .32 + i * .17) % 1, x = CX + sd * lerp(470, 40, ph), y = 900;
    if (ph < .94) drawPerson(g, { x, y, s: 1.45, kind: 2, seed: i, walk: 1, ph: u * 1.8 + i * .4 });
  }
  g.restore();
  // seam
  D.gline(g, [[60, 935], [W - 60, 935]], { w: 2, double: 5, part: ss(seg(u, .9, 1.6)) });
  // bottom half: the hospital, opening on "rumah sakit" (two leaves part along the axis)
  const op = ss(seg(u, tR - .35, tR + .35));
  if (op > 0) {
    g.save(); g.beginPath(); g.rect(0, 945, W, 470); g.clip();
    D.sunburst(g, CX, 1400, { rays: 36, r1: 800, a0: Math.PI, a1: TAU, mode: 'lines', w: 1.2, alpha: .4 });
    facade(g, CX, 1395, 760, 430, { label: 'RUMAH SAKIT', sub: 'MODERN · TANPA TAKUT BIAYA', t: u, p: ss(seg(u, tR, tR + 1.2)), emblem: (g, x, y) => {
      const r = 40, cr = [[x - r * .3, y - r], [x + r * .3, y - r], [x + r * .3, y - r * .3], [x + r, y - r * .3], [x + r, y + r * .3], [x + r * .3, y + r * .3], [x + r * .3, y + r], [x - r * .3, y + r], [x - r * .3, y + r * .3], [x - r, y + r * .3], [x - r, y - r * .3], [x - r * .3, y - r * .3]];
      D.drawShape(g, cr, { color: '#1d6b57', halo: .4, lw: 2 });
    } });
    // calm heart line drawing itself across the foot of the building
    const ecg = []; for (let i = 0; i <= 120; i++) { const x = 90 + i * 7.5, ph = (i % 40) / 40; const y = 1408 - (ph > .45 && ph < .5 ? -18 : ph > .5 && ph < .55 ? 30 : 0); ecg.push([x, y]); }
    D.gline(g, ecg, { w: 2, color: '#4fae8e', glow: .6, part: seg(u, tR + .3, tR + 2.6) });
    g.restore();
    leaves(g, 1 - op, { gap: 0 });     // the hospital half is revealed as the leaves part
  } else {
    g.save(); g.beginPath(); g.rect(0, 945, W, 470); g.clip(); leaves(g, 1); g.restore();
  }
}

// ---------- 7. the remote village: lights come on house by house ----------
export function village(g, u, d, K) {
  const k = K.keys, s0 = K.shot0, tL = k.listrik - s0, tA = k.andal - s0, tI = k.internet - s0;
  const houses = 6, hx = i => 150 + i * 156, hy = 1130;
  const pull = eio(seg(u, 0, 2.6)), z = lerp(2.4, 1, pull);
  g.save(); zoomAt(g, hx(0), hy - 60, z);
  // night sky → dawn, stars
  const gr = g.createLinearGradient(0, 0, 0, 1200); gr.addColorStop(0, '#05080b'); gr.addColorStop(.7, '#0d2620'); gr.addColorStop(1, '#2a3a20'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) D.sparkle(g, hash(i * 1.7) * W, hash(i * 3.1) * 700, 3 + 5 * hash(i), { alpha: .5 + .5 * Math.sin(u * 2 + i), glow: 0, color: '#f3d98b' });
  // stepped mountains
  for (let m = 0; m < 3; m++) {
    const cx = [300, 760, 540][m], bw = [700, 640, 900][m], bh = [520, 460, 620][m], base = 1060 + m * 10;
    const pts = [[cx - bw / 2, base]]; const st = 5;
    for (let i = 0; i < st; i++) { const f = i / st, f2 = (i + 1) / st; pts.push([cx - bw / 2 * (1 - f), base - bh * f2]); pts.push([cx - bw / 2 * (1 - f2), base - bh * f2]); }
    for (let i = st - 1; i >= 0; i--) { const f = i / st, f2 = (i + 1) / st; pts.push([cx + bw / 2 * (1 - f2), base - bh * f2]); pts.push([cx + bw / 2 * (1 - f), base - bh * f2]); }
    pts.push([cx + bw / 2, base]);
    D.airbrush(g, pts, { base: ['#0f2a22', '#123329', '#0b211b'][m], light: '#2c5a4c', dark: '#030a08', dir: -2.3, rim: 1.6 });
    D.gline(g, pts, { w: 1.6, alpha: .7 });
  }
  // lattice tower on the hill, radio arcs pulsing on "internet"
  const tx = 860, ty = 700;
  for (const sd of [-1, 1]) D.gline(g, [[tx + sd * 36, 1000], [tx, ty]], { w: 2.2 });
  for (let i = 1; i < 6; i++) { const y = lerp(1000, ty, i / 6), w = 36 * (1 - i / 6); D.gline(g, [[tx - w, y], [tx + w, y]], { w: 1.2 }); if (i < 5) D.gline(g, [[tx - w, y], [tx + 36 * (1 - (i + 1) / 6), lerp(1000, ty, (i + 1) / 6)]], { w: .8 }); }
  for (let i = 0; i < 4; i++) { const ph = ((u - tI) * .9 - i * .25); if (ph > 0 && u > tI - .1) { const r = 30 + (ph % 1) * 220; D.gline(g, D.arcPts(tx, ty, r, -Math.PI * .85, -Math.PI * .15, 24), { w: 2, alpha: (1 - ph % 1) * .9, color: '#f3d98b' }); } }
  // sea with gold wave chevrons
  g.fillStyle = '#04100d'; g.fillRect(0, 1200, W, H - 1200);
  for (let r = 0; r < 7; r++) D.chevrons(g, -40 + ((u * 30 + r * 37) % 80), W + 40, 1230 + r * 52, { n: 18, h: 10 + r * 2, rows: 1, w: 1.2 + r * .2 });
  // shore
  g.fillStyle = '#1a140c'; g.fillRect(0, 1150, W, 50); D.gline(g, [[0, 1150], [W, 1150]], { w: 2 });
  // stilt houses; windows ignite one by one between "listrik" and "andal"
  for (let i = 0; i < houses; i++) {
    const x = hx(i), lt = tL + (tA - tL + .3) * i / (houses - 1), on = u > lt ? (u - lt < .18 ? 1.6 : 1) : 0;
    for (const sd of [-1, 1]) D.gline(g, [[x + sd * 44, hy], [x + sd * 44, hy + 60]], { w: 2.2 });
    const body = [[x - 60, hy], [x - 60, hy - 70], [x + 60, hy - 70], [x + 60, hy]];
    D.airbrush(g, body, { base: '#3a2414', light: '#7a5432', dark: '#100904', dir: -2.3, rim: 1.4 });
    const roof = [[x - 82, hy - 66], [x, hy - 150], [x + 82, hy - 66]];
    D.drawShape(g, roof, { lw: 1.8, sheen: .3 });
    D.gline(g, [[x - 20, hy - 165], [x, hy - 150], [x + 20, hy - 165]], { w: 2 });   // crossed gable ends
    if (on) { D.glow(g, x, hy - 36, 120, '#ffcf7a', .45 * Math.min(on, 1.3)); }
    g.fillStyle = on ? (on > 1 ? '#fffaf0' : '#ffd27a') : '#1a120a'; g.fillRect(x - 20, hy - 56, 40, 34);
    D.gline(g, D.rectPts(x - 20, hy - 56, 40, 34), { w: 1.4 });
  }
  g.restore();
}

// ---------- 8. "Tapi tunggu dulu...": the world freezes, leaves close halfway, he steps into the slot ----------
export function wait(g, u, d, K, frozen) {
  if (frozen) { g.save(); g.filter = 'grayscale(.75) brightness(.45)'; g.drawImage(frozen, 0, 0); g.restore(); }
  else bg(g);
  leaves(g, .62 * eio(seg(u, 0, .45)), { gap: 0 });
  // the slot: a warm light behind him
  const a = ss(seg(u, .25, .6));
  g.save(); g.globalAlpha = a;
  D.glow(g, CX, 900, 420, '#ffcf7a', .3);
  const pose = lerpPose(POSES.stand, POSES.stop, back(seg(u, .35, .7), 1.6));
  drawBoy(g, { x: CX, y: 1560, s: 6.6, face: 'wait', pose });
  g.restore();
  // a single tick mark: the clock that stopped everything
  D.sparkle(g, CX, 300, 22 * pulse(u, .4, .4), { alpha: 1 });
}

// ---------- 9. the MILIARDER marquee lights up... and shorts out ----------
const SIGNM = () => B.buildSign('MILIARDER', { size: 140, spacing: 12 });
export function marquee(g, u, d, K) {
  const k = K.keys, s0 = K.shot0, tKaya = k.kaya - s0, tNo = k.nggak - s0;
  bg(g, '#120c08', '#040302', .4);
  D.sunburst(g, CX, 520, { rays: 48, r1: 1500, mode: 'wedges', colorA: `rgba(201,162,75,${u < tNo ? .08 : .03})` });
  // low oblique on the sign
  const s = SIGNM(), sc = Math.min(1, 940 / s.w);
  g.save(); g.translate(CX, 420); g.transform(1, -.06, 0, 1, 0, 0); g.translate(-s.w * sc / 2, -s.h * sc / 2);
  const T0 = s.letters.map((_, i) => .15 + i * .1);
  const base = B.litSequence(u, T0, { chaseFrom: 1.2, chaseSpeed: 18 });
  const lit = (li, bi, gi) => {
    if (u < tNo) return base(li, bi, gi);
    const dt = u - tNo, off = .05 + li * .035 + hash(gi) * .05;   // flicker, then dark letter by letter
    if (dt < off) return hash(gi * 7 + Math.floor(u * 30)) > .5 ? 1.3 : .2;
    return 0;
  };
  B.drawSign(g, s, 0, 0, sc, { lit });
  g.restore();
  // the spark of the short circuit
  for (let i = 0; i < 5; i++) D.sparkle(g, 300 + i * 120, 400 + hash(i) * 60, 30 * pulse(u, tNo + .03 * i, .2), { alpha: 1, color: '#fff4d2' });
  // coins raining down while the question hangs; they stop and vanish on "nggak"
  for (let i = 0; i < 26; i++) {
    const t0 = .2 + hash(i * 3.3) * 1.2, ft = u - t0; if (ft < 0) continue;
    const x = 80 + hash(i * 7.7) * 920, y = -60 + ft * ft * 420 + ft * 260, r = 26 + hash(i) * 14;
    const gone = seg(u, tNo + .02, tNo + .22);
    if (gone >= 1 || y > 1500) continue;
    coin(g, x, Math.min(y, 1450), r * (1 - gone), ft * 6 + i, { alpha: 1 - gone });
    if (gone > 0) D.sparkle(g, x, Math.min(y, 1450), 18 * pulse(u, tNo + .02, .2), { alpha: 1 });
  }
  // the boy below: thinking during the question, then a grin and a wagging finger
  const no = u > tNo - .1;
  const wag = no ? Math.sin((u - tNo) * 16) * .18 * (1 - seg(u, tNo + .8, tNo + 1.3)) : 0;
  const pose = no ? { ...lerpPose(POSES.think, POSES.wag, back(seg(u, tNo - .1, tNo + .15))), rf: POSES.wag.rf + wag } : POSES.think;
  drawBoy(g, { x: CX, y: 1378, s: 4.5, face: no ? 'nope' : 'think', pose, sq: 1 + pulse(u, tNo - .1, .3) * .04 });
}
