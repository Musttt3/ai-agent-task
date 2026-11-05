// The protagonist ("kamu"), redrawn as an Art Deco figure from the user's character sheet:
// curly black hair, round expressive eyes, hoodie with a small chest mark, dark trousers, white sneakers.
// Deco treatment: faceted lacquer planes (hard terminator), airbrush inside each plane, thin gold rim on the lit edge.
// The hoodie is the film's one saturated accent (crimson). Units: hip at (0,0), y down; sole at +70, hair top at -75 (~6 heads).
import { TAU, clamp, lerp, mix, rgba, gline, sparkle } from './engine/deco.js';

export const BOY_H = 145, BOY_SOLE = 70;
const LIGHT = [-.6, -.8];
export const RED = '#c8102e';
const PAL = {
  hood: RED, hoodL: '#ef4a5e', hoodD: '#4e0613',
  sleeve: '#3a2a20', sleeveL: '#6e5442', sleeveD: '#140d09',
  pants: '#26202a', pantsL: '#5c5064', pantsD: '#09070a',
  skin: '#e9b58c', skinL: '#ffe0bd', skinD: '#a8684a',
  hair: '#120b08', hairL: '#3a2a20',
  shoe: '#f3eee4', shoeD: '#b7ab96',
  ink: '#1a0f0c',
};

// ---------- geometry helpers (deco construction, after the library's character code) ----------
function capsulePath(x0, y0, r0, x1, y1, r1) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || .001, a = Math.atan2(dy, dx);
  const s = clamp((r0 - r1) / L, -.99, .99), b = Math.acos(s);
  const p = new Path2D(); p.arc(x0, y0, r0, a + b, a - b + TAU, false); p.arc(x1, y1, r1, a - b, a + b, false); p.closePath(); return p;
}
export function smoothPath(pts, closed = true) {
  const p = new Path2D(), n = pts.length, P = i => pts[closed ? (i + n) % n : clamp(i, 0, n - 1)];
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2); p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]); }
  if (closed) p.closePath(); return p;
}
function lin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; }
// Faceted fill: shadow plane everywhere, lit plane on the light side of `split`, gold rim on the lit edge.
export function facet(g, path, bb, split, base, light, dark, L = LIGHT, rim = 1, rimCol = 'rgba(243,217,139,.9)') {
  const [x0, y0, x1, y1] = bb, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.max(x1 - x0, y1 - y0) * .6;
  g.fillStyle = lin(g, cx + L[0] * R, cy + L[1] * R, cx - L[0] * R, cy - L[1] * R, [[0, base], [.55, mix(base, dark, .55)], [1, dark]]); g.fill(path);
  if (split) {
    const [[ax, ay], [bx, by]] = split, dx = bx - ax, dy = by - ay; let nx = -dy, ny = dx; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    if (nx * L[0] + ny * L[1] < 0) { nx = -nx; ny = -ny; }
    const E = 400; g.save(); g.clip(path);
    g.beginPath(); g.moveTo(ax - dx * E, ay - dy * E); g.lineTo(bx + dx * E, by + dy * E); g.lineTo(bx + dx * E + nx * E, by + dy * E + ny * E); g.lineTo(ax - dx * E + nx * E, ay - dy * E + ny * E); g.closePath();
    g.fillStyle = lin(g, cx + L[0] * R, cy + L[1] * R, cx, cy, [[0, light], [1, base]]); g.fill();
    g.restore();
  }
  if (rim) { g.save(); g.clip(path); g.translate(-L[0] * 1.1, -L[1] * 1.1); g.strokeStyle = rimCol; g.lineWidth = rim; g.stroke(path); g.restore(); }
}
function limb(g, x0, y0, r0, x1, y1, r1, base, light, dark, rim = .9) {
  const p = capsulePath(x0, y0, r0, x1, y1, r1);
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1; let nx = -dy / l, ny = dx / l; if (nx * LIGHT[0] + ny * LIGHT[1] < 0) { nx = -nx; ny = -ny; }
  const k = -Math.min(r0, r1) * .18;
  facet(g, p, [Math.min(x0, x1) - r0, Math.min(y0, y1) - r0, Math.max(x0, x1) + r0, Math.max(y0, y1) + r0], [[x0 + nx * k, y0 + ny * k], [x1 + nx * k, y1 + ny * k]], base, light, dark, LIGHT, rim);
  return p;
}
const polar = (x, y, len, ang) => [x + Math.sin(ang) * len, y + Math.cos(ang) * len]; // ang 0 = straight down, + = toward +x

// ---------- faces ----------
export const FACES = {
  smile: { eye: 1, look: [0, 0], brow: 0, browAng: 0, mouth: 'smile' },
  joy: { eye: 0, arc: 'up', brow: -1.2, mouth: 'grin', mOpen: .8 },
  surprise: { eye: 1.35, pupil: .55, look: [0, 0], brow: -2, browAng: -.15, mouth: 'o', mOpen: .9 },
  wonder: { eye: 1.15, look: [0, -.8], brow: -1.4, browAng: -.1, mouth: 'o', mOpen: .4 },
  heran: { eye: 1.1, look: [.4, .35], brow: -1.2, browAng: .3, browR: -.3, mouth: 'flat' },
  think: { eye: .95, look: [.6, -.5], brow: .2, browAng: .35, browR: -1.4, mouth: 'smirk' },
  wait: { eye: 1.05, look: [0, 0], brow: -.6, browAng: .25, mouth: 'flat' },
  nope: { eye: 0, arc: 'up', brow: -.5, mouth: 'grin', mOpen: .45 },
  warm: { eye: .8, look: [0, -.15], brow: -.6, browAng: -.1, mouth: 'smile', soft: 1 },
};
const faceP = f => typeof f === 'string' ? { ...FACES.smile, ...FACES[f] } : { ...FACES.smile, ...(f || {}) };

function eye(g, x, y, w, F, flip, blink) {
  const open = (F.eye ?? 1) * (1 - blink);
  g.save(); g.translate(x, y); g.scale(flip, 1); g.lineCap = 'round'; g.lineJoin = 'round';
  if (open <= .05) {
    const up = F.arc === 'up';
    g.beginPath(); g.moveTo(-w, up ? .4 : 0); g.quadraticCurveTo(0, up ? -w * 1.1 : w * .6, w, up ? .4 : 0);
    g.strokeStyle = PAL.ink; g.lineWidth = .85; g.stroke(); g.restore(); return;
  }
  const h = w * .78 * open;                           // big, round-ish almond (the character's round eyes)
  const al = new Path2D(); al.moveTo(-w, .2); al.bezierCurveTo(-w * .6, -h * 1.3, w * .6, -h * 1.3, w, -.1); al.bezierCurveTo(w * .6, h * 1.05, -w * .6, h * 1.05, -w, .2); al.closePath();
  g.fillStyle = '#f7f1e6'; g.fill(al);
  g.save(); g.clip(al);
  const pr = w * (F.pupil ?? .62) * .78, px = (F.look?.[0] || 0) * w * .38 * flip, py = (F.look?.[1] || 0) * h * .45;
  g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fillStyle = '#2c1a10'; g.fill();
  g.beginPath(); g.arc(px, py, pr * .6, 0, TAU); g.fillStyle = '#080504'; g.fill();
  g.beginPath(); g.arc(px - pr * .35, py - pr * .38, pr * .26, 0, TAU); g.fillStyle = '#fffaf0'; g.fill();
  g.restore();
  g.beginPath(); g.moveTo(-w * 1.05, .3); g.bezierCurveTo(-w * .6, -h * 1.35, w * .6, -h * 1.35, w * 1.12, -.4);
  g.strokeStyle = PAL.ink; g.lineWidth = .95; g.stroke();
  g.beginPath(); g.moveTo(w * 1.05, -.3); g.lineTo(w * 1.45, -h * .55); g.lineWidth = .6; g.stroke();      // deco flick at the outer corner
  g.restore();
}
function mouth(g, x, y, F, s) {
  g.save(); g.translate(x, y); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = PAL.ink; g.lineWidth = .75;
  const m = F.mouth, o = F.mOpen ?? .6;
  if (m === 'smile') { g.beginPath(); g.moveTo(-2.6, -.3); g.quadraticCurveTo(0, 2.1, 2.6, -.3); g.stroke(); }
  else if (m === 'flat') { g.beginPath(); g.moveTo(-1.9, .3); g.quadraticCurveTo(0, .7, 1.9, .2); g.stroke(); }
  else if (m === 'smirk') { g.beginPath(); g.moveTo(-1.8, .5); g.quadraticCurveTo(.6, .9, 2.3, -.5); g.stroke(); }
  else if (m === 'o') { g.beginPath(); g.ellipse(0, .6, 1.25 + o * .5, 1.1 + o * 1.6, 0, 0, TAU); g.fillStyle = '#4a0d12'; g.fill(); g.stroke(); }
  else if (m === 'grin') {
    const h = 1.2 + o * 3.2; const p = new Path2D(); p.moveTo(-3.6, -.4); p.quadraticCurveTo(0, -.9, 3.6, -.4); p.quadraticCurveTo(2.6, h, 0, h); p.quadraticCurveTo(-2.6, h, -3.6, -.4); p.closePath();
    g.fillStyle = '#4a0d12'; g.fill(p); g.save(); g.clip(p); g.beginPath(); g.ellipse(0, h, 2.4, 1.6, 0, 0, TAU); g.fillStyle = '#d0404e'; g.fill();
    g.fillStyle = '#f7f1e6'; g.fillRect(-3.6, -1, 7.2, 1.25); g.restore(); g.stroke(p);
  }
  g.restore();
}

// ---------- hair: a cap plus curls (scallops), each with a gold rim on the lit side ----------
const CURLS = (() => {
  const out = []; const n = 15;
  for (let i = 0; i < n; i++) { const a = Math.PI * (1.02 + .96 * i / (n - 1)); out.push([Math.cos(a) * 10.6, -63 + Math.sin(a) * 11.2, 3.3 + ((i * 7) % 3) * .55]); }
  out.push([-5, -73.2, 3.6], [1, -74.4, 3.8], [6.6, -72.4, 3.4], [-1.5, -69.5, 3.4], [4.2, -68.6, 3.2]);
  return out;
})();
function hair(g, back = false, lift = 0) {
  g.save(); g.translate(0, -lift);
  const cap = new Path2D();
  if (back) { cap.ellipse(0, -60.5, 11.2, 13.2, 0, 0, TAU); }
  else { cap.moveTo(-10.6, -56); cap.bezierCurveTo(-12.4, -70, -6, -76, 0, -75.6); cap.bezierCurveTo(6, -76, 12.4, -70, 10.6, -56); cap.bezierCurveTo(8.5, -63.5, 4, -64.5, 1.5, -62.6); cap.bezierCurveTo(-1.5, -65, -7.5, -64.2, -10.6, -56); cap.closePath(); }
  g.fillStyle = lin(g, -8, -76, 8, -54, [[0, PAL.hairL], [.5, PAL.hair], [1, '#050302']]); g.fill(cap);
  const curls = back ? CURLS.concat([[-6, -58, 3.4], [0, -56, 3.5], [6, -58, 3.4], [-3, -52.5, 3.2], [3, -52.5, 3.2], [-8.5, -52, 2.8], [8.5, -52, 2.8]]) : CURLS;
  for (const [x, y, r] of curls) {
    g.beginPath(); g.arc(x, y, r, 0, TAU);
    g.fillStyle = lin(g, x - r, y - r, x + r, y + r, [[0, PAL.hairL], [.45, PAL.hair], [1, '#040201']]); g.fill();
    g.beginPath(); g.arc(x, y, r * .78, Math.PI * 1.05, Math.PI * 1.55); g.strokeStyle = 'rgba(243,217,139,.75)'; g.lineWidth = .55; g.stroke();
  }
  g.restore();
}

// ---------- the figure ----------
// pose: la/ra = upper-arm angle (0 down, + outward, PI up), lf/rf = forearm angle in the same frame (negative = across the body),
//       ll/rl = foot lift (0..1), lean (rad), tilt = head tilt (rad), bob (units), hold = 'phone' (both hands in front)
export const POSES = {
  stand: { la: .16, lf: .1, ra: .16, rf: .1 },
  cheer: { la: 2.45, lf: 2.75, ra: 2.45, rf: 2.75 },
  wave: { la: .16, lf: .1, ra: 1.5, rf: 2.8 },
  stop: { la: .16, lf: .1, ra: 1.25, rf: 2.95, palm: 1 }, // open palm beside the head: "tunggu dulu"
  wag: { la: .16, lf: .1, ra: .5, rf: -2.55, finger: 1 }, // finger raised by the face: "nggak!"
  think: { la: .32, lf: -1.55, ra: .38, rf: -2.75, finger: 1 },
  phone: { la: .26, lf: -1.72, ra: .26, rf: -1.72, hold: 'phone' },
  openArms: { la: 1.2, lf: 1.45, ra: 1.2, rf: 1.45 },
  shrug: { la: .75, lf: 2.1, ra: .75, rf: 2.1 },
  bed: { la: 1.0, lf: 2.2, ra: 1.0, rf: 2.2 },
};
export const lerpPose = (a, b, t) => { const o = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const x = a[k] ?? 0, y = b[k] ?? 0; o[k] = typeof x === 'number' && typeof y === 'number' ? lerp(x, y, t) : (t < .5 ? x : y); } return o; };
export function walkPose(ph, amt = 1) {
  const s = Math.sin(ph * TAU), c = Math.cos(ph * TAU);
  return { la: .14, lf: .12 - Math.max(0, s) * .55 * amt, ra: .14, rf: .12 - Math.max(0, -s) * .55 * amt, ll: Math.max(0, s) * amt, rl: Math.max(0, -s) * amt, bob: -Math.abs(c) * 1.8 * amt };
}

function arm(g, side, sx, sy, a, f, hold, F) {
  // side: -1 left of screen (character's right), +1 right; a, f: upper-arm and forearm angles (mirrored per side)
  const ua = a * side, U = 21, Fa = 19;
  const [ex, ey] = polar(sx, sy, U, ua);
  const fa = (f ?? a) * side;
  let [hx, hy] = polar(ex, ey, Fa, fa);
  limb(g, ex, ey, 2.7, hx, hy, 2.4, PAL.sleeve, PAL.sleeveL, PAL.sleeveD);
  limb(g, sx, sy, 4.5, ex, ey, 3.7, PAL.hood, PAL.hoodL, PAL.hoodD, 1);
  // sleeve cuff (hoodie sleeve ends at the elbow, like the reference)
  g.beginPath(); g.ellipse(ex, ey, 3.9, 1.5, Math.atan2(ey - sy, ex - sx) + Math.PI / 2, 0, TAU); g.fillStyle = PAL.hoodD; g.fill();
  // hand: a round mitten in skin with a rim
  const hp = new Path2D(); hp.arc(hx, hy, 3.5, 0, TAU);
  facet(g, hp, [hx - 3.5, hy - 3.5, hx + 3.5, hy + 3.5], [[hx - 3, hy + 3], [hx + 3, hy - 3]], PAL.skin, PAL.skinL, PAL.skinD, LIGHT, .7);
  if (hold === 'palm') {   // open hand facing the viewer: four fingers and a thumb
    for (let i = 0; i < 4; i++) { const a = fa + (i - 1.5) * .22; const [tx, ty] = polar(hx, hy, 7.2 - Math.abs(i - 1.5) * .7, a); limb(g, hx + Math.sin(a) * 1.5, hy + Math.cos(a) * 1.5, 1.25, tx, ty, 1.05, PAL.skin, PAL.skinL, PAL.skinD, .45); }
    const [ux, uy] = polar(hx, hy, 5.2, fa - side * 1.2); limb(g, hx, hy, 1.3, ux, uy, 1.1, PAL.skin, PAL.skinL, PAL.skinD, .45);
  }
  if (hold === 'finger') { const [tx, ty] = polar(hx, hy, 6.5, fa); limb(g, hx, hy, 1.3, tx, ty, 1.05, PAL.skin, PAL.skinL, PAL.skinD, .5); }
  return [hx, hy];
}

function leg(g, side, lift) {
  const hx = side * 4.6, kneeY = 34 - lift * 7, footY = 66 - lift * 10;
  const kx = hx + side * (.6 + lift * 1.8), fx = hx + side * .3;
  limb(g, kx, kneeY, 4.4, fx, footY, 3.5, PAL.pants, PAL.pantsL, PAL.pantsD, .9);
  limb(g, hx, 2, 5.4, kx, kneeY, 4.4, PAL.pants, PAL.pantsL, PAL.pantsD, .9);
  // sneaker (front view): rounded toe box with sole band
  const sw = 5.6 + lift * .8, sh = 4.4, sy = footY + 2.4;
  const sp = new Path2D(); sp.moveTo(fx - sw, sy + sh * .5); sp.bezierCurveTo(fx - sw, sy - sh * .9, fx + sw, sy - sh * .9, fx + sw, sy + sh * .5); sp.closePath();
  facet(g, sp, [fx - sw, sy - sh, fx + sw, sy + sh], [[fx - sw, sy + 1], [fx + sw, sy - 2]], PAL.shoe, '#ffffff', PAL.shoeD, LIGHT, .8);
  g.fillStyle = '#d9cfbd'; g.fillRect(fx - sw, sy + sh * .5 - .2, sw * 2, 1.3);
  return [fx, sy];
}

function torso(g, back) {
  // hoodie body: broad rounded shoulders, slight taper, hem below the hip
  const pts = [[-12.6, -40], [-13.2, -33], [-12.2, -14], [-11.6, 3], [-11, 8], [11, 8], [11.6, 3], [12.2, -14], [13.2, -33], [12.6, -40], [7, -45], [-7, -45]];
  const p = smoothPath(pts, true);
  facet(g, p, [-13.5, -46, 13.5, 9], [[-3, -46], [3.5, 9]], PAL.hood, PAL.hoodL, PAL.hoodD, LIGHT, 1.1);
  // ribbed hem band
  g.save(); g.clip(p); g.fillStyle = rgba(PAL.hoodD, .55); g.fillRect(-14, 4, 28, 5); g.restore();
  limb(g, 0, -40, 3.4, 0, -47, 3.4, PAL.skin, PAL.skinL, PAL.skinD, .5);   // neck, under the collar
  if (!back) {
    // kangaroo pocket
    const pk = new Path2D(); pk.moveTo(-8.2, 3.5); pk.lineTo(-6.4, -8); pk.lineTo(6.4, -8); pk.lineTo(8.2, 3.5);
    g.strokeStyle = rgba('#2a0309', .8); g.lineWidth = .8; g.stroke(pk);
    g.strokeStyle = 'rgba(255,160,170,.35)'; g.lineWidth = .4; g.save(); g.translate(.5, .5); g.stroke(pk); g.restore();
    // chest mark: a small ivory four-point star (the reference's chest symbol, made a deco sparkle)
    sparkle(g, 0, -27, 3.4, { color: '#f2e8d5', glow: 0 });
    // hood collar around the neck
    const hc = new Path2D(); hc.moveTo(-10, -42); hc.bezierCurveTo(-8, -50, 8, -50, 10, -42); hc.bezierCurveTo(6, -39.5, -6, -39.5, -10, -42); hc.closePath();
    facet(g, hc, [-10, -50, 10, -39], [[-10, -44], [10, -45]], PAL.hood, PAL.hoodL, PAL.hoodD, LIGHT, .8);
    gline(g, [[-2.4, -39.6], [-2.8, -33]], { w: .7, color: '#f2e8d5' }); gline(g, [[2.4, -39.6], [2.8, -33]], { w: .7, color: '#f2e8d5' });
  } else {
    // the hood lying on the back
    const hb = new Path2D(); hb.moveTo(-10, -44); hb.bezierCurveTo(-11, -33, -5, -26, 0, -25); hb.bezierCurveTo(5, -26, 11, -33, 10, -44); hb.closePath();
    facet(g, hb, [-11, -45, 11, -25], [[-11, -35], [11, -38]], PAL.hood, PAL.hoodL, PAL.hoodD, LIGHT, .9);
    g.strokeStyle = rgba('#2a0309', .7); g.lineWidth = .7; g.beginPath(); g.moveTo(0, -42); g.lineTo(0, -26); g.stroke();
  }
  return p;
}

export const HEAD_S = 1.3;
function head(g, F, blink, back, tilt) {
  // the head, scaled up about the chin (the character's big round head, kept in the deco version)
  g.save(); g.translate(0, -44); g.rotate(tilt || 0); g.scale(HEAD_S, HEAD_S); g.translate(0, 48);
  if (back) { hair(g, true); g.restore(); return; }
  // ears
  for (const sd of [-1, 1]) { const e = new Path2D(); e.ellipse(sd * 10.2, -58.5, 1.9, 2.7, 0, 0, TAU); facet(g, e, [sd * 10.2 - 2, -61, sd * 10.2 + 2, -56], null, PAL.skin, PAL.skinL, PAL.skinD, LIGHT, .5); }
  // face: a rounded egg, a little wider at the cheeks
  const hp = new Path2D(); hp.moveTo(0, -48); hp.bezierCurveTo(7.2, -48, 10.6, -53.5, 10.4, -60); hp.bezierCurveTo(10.2, -67.5, 5.6, -71, 0, -71); hp.bezierCurveTo(-5.6, -71, -10.2, -67.5, -10.4, -60); hp.bezierCurveTo(-10.6, -53.5, -7.2, -48, 0, -48); hp.closePath();
  facet(g, hp, [-10.6, -71, 10.6, -48], [[2.5, -71], [-1.5, -48]], PAL.skin, PAL.skinL, PAL.skinD, LIGHT, .9);
  // cheeks
  g.save(); g.clip(hp); for (const sd of [-1, 1]) { const gr = g.createRadialGradient(sd * 6.4, -54.6, 0, sd * 6.4, -54.6, 3.2); gr.addColorStop(0, 'rgba(226,110,100,.35)'); gr.addColorStop(1, 'rgba(226,110,100,0)'); g.fillStyle = gr; g.fillRect(sd * 6.4 - 4, -58, 8, 7); } g.restore();
  // eyes, brows, nose, mouth
  const ew = 3.3;
  eye(g, -4.4, -60, ew, F, 1, blink); eye(g, 4.4, -60, ew, F, -1, blink);
  g.strokeStyle = PAL.ink; g.lineCap = 'round'; g.lineWidth = .95;
  for (const sd of [-1, 1]) {
    const b = (sd > 0 && F.browR != null ? F.browR : F.brow) || 0, ang = (F.browAng || 0) * (sd > 0 && F.browR != null ? -1 : 1);
    g.save(); g.translate(sd * 4.9, -66.6 + b * .8); g.rotate(ang * -sd);
    g.beginPath(); g.moveTo(-2.3, .5); g.quadraticCurveTo(0, -.9, 2.3, .4); g.stroke(); g.restore();
  }
  g.lineWidth = .6; g.beginPath(); g.moveTo(-.3, -57.2); g.quadraticCurveTo(-1.4, -55.3, .3, -55); g.stroke();
  mouth(g, 0, -52.2, F);
  hair(g, false);
  g.restore();
}

// Draw the boy. (x, y) = midpoint between the soles on the ground, s = pixels per unit.
// opts: view 'front'|'back', face (name or object), pose (object), blink 0..1, scaleX (squash/stretch), glow (red halo 0..1)
export function drawBoy(g, { x, y, s = 1, view = 'front', face = 'smile', pose = POSES.stand, blink = 0, sq = 1, glow = 0 } = {}) {
  const F = faceP(face), back = view === 'back', P = { ...POSES.stand, ...pose };
  g.save(); g.translate(x, y); g.scale(s * (2 - sq), s * sq); g.translate(0, -BOY_SOLE + (P.bob || 0));
  if (glow > 0) { const gr = g.createRadialGradient(0, -30, 0, 0, -30, 110); gr.addColorStop(0, `rgba(226,40,64,${.45 * glow})`); gr.addColorStop(1, 'rgba(226,40,64,0)'); g.fillStyle = gr; g.fillRect(-120, -150, 240, 260); }
  // ground shadow
  g.save(); g.translate(0, BOY_SOLE + 2.5 - (P.bob || 0)); g.scale(1, .22); g.beginPath(); g.arc(0, 0, 15, 0, TAU); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); g.restore();
  g.rotate(P.lean || 0);
  const front = !back;
  // legs behind the hoodie hem
  leg(g, -1, P.ll || 0); leg(g, 1, P.rl || 0);
  // arms that hang behind (back view: both in front of the torso drawn later)
  const sh = [[-11.4, -39.5], [11.4, -39.5]];
  const drawArms = () => {
    const hold = P.hold === 'phone' ? 'phone' : null;
    const L = arm(g, -1, sh[0][0], sh[0][1], P.la, P.lf, null, F);
    const R = arm(g, 1, sh[1][0], sh[1][1], P.ra, P.rf, P.finger ? 'finger' : P.palm ? 'palm' : null, F);
    return [L, R];
  };
  torso(g, back);
  if (front && P.hold === 'phone') {
    head(g, F, blink, back, P.tilt);
    const hands = drawArms();
    // the phone: a slim gold-rimmed slab between the palms
    const cx = (hands[0][0] + hands[1][0]) / 2, cy = (hands[0][1] + hands[1][1]) / 2 - 2.5;
    const ph = new Path2D(); ph.roundRect(cx - 4.2, cy - 7, 8.4, 12.5, 1.4); g.fillStyle = '#0b0906'; g.fill(ph);
    g.fillStyle = 'rgba(80,200,170,.55)'; g.fillRect(cx - 3.2, cy - 5.8, 6.4, 10); gline(g, ph, { w: .7 });
  } else {
    const hands = drawArms();
    head(g, F, blink, back, P.tilt);
    if (back) { /* nothing */ }
  }
  g.restore();
}

// ---------- townspeople: simpler streamline figures (no saturated colour until `red` > 0) ----------
// kind: 0 man in coat + hat, 1 woman in dress, 2 child, 3 worker with cap. red: 0..1 blends the clothing into the accent.
const TOWN = [
  { coat: '#1d6b57', coatL: '#3f9a7f', coatD: '#0c2e25', hat: '#0d0b09' },
  { coat: '#d9ccb0', coatL: '#fffaf0', coatD: '#8c7c5e', hat: null },
  { coat: '#2b2130', coatL: '#5c4a66', coatD: '#0e0a10', hat: null },
  { coat: '#6f5220', coatL: '#c9a24b', coatD: '#2a1e0b', hat: '#2b2130' },
];
export function drawPerson(g, { x, y, s = 1, kind = 0, red = 0, ph = 0, walk = 0, arms = 0, face = true, seed = 0 } = {}) {
  const T = TOWN[kind % 4], child = kind === 2, k = child ? .72 : 1;
  const coat = mix(T.coat, RED, red), coatL = mix(T.coatL, '#ef4a5e', red), coatD = mix(T.coatD, '#4e0613', red);
  const skins = ['#e0a77c', '#c98d64', '#efc39a', '#b57a52'], sk = skins[seed % 4];
  g.save(); g.translate(x, y); g.scale(s * k, s * k);
  const sw = walk ? Math.sin(ph * TAU) : 0;
  g.save(); g.scale(1, .22); g.beginPath(); g.arc(0, 2, 13, 0, TAU); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill(); g.restore();
  // legs
  for (const sd of [-1, 1]) limb(g, sd * 3.2, -34, 3.4, sd * 3.2 + sd * sw * 2.5 * sd, -2, 2.6, '#16121a', '#4a4250', '#050405', .7);
  // body (coat or dress): streamlined teardrop
  const dress = kind === 1;
  const bp = smoothPath(dress ? [[-9, -62], [-10.5, -50], [-12, -24], [-13, -14], [13, -14], [12, -24], [10.5, -50], [9, -62], [0, -65]] : [[-9.6, -62], [-10.4, -48], [-9, -30], [-8, -24], [8, -24], [9, -30], [10.4, -48], [9.6, -62], [0, -65]], true);
  facet(g, bp, [-13, -66, 13, -14], [[-2, -66], [3, -14]], coat, coatL, coatD, LIGHT, 1);
  // arms
  for (const sd of [-1, 1]) {
    const up = arms * (sd > 0 ? 1 : .85);
    const [ex, ey] = polar(sd * 9, -58, 15, sd * (.12 + up * 2.2 - sw * .2 * sd));
    const [hx, hy] = polar(ex, ey, 13, sd * (.05 + up * 2.6));
    limb(g, sd * 9, -58, 3, ex, ey, 2.6, coat, coatL, coatD, .7); limb(g, ex, ey, 2.6, hx, hy, 2.2, coat, coatL, coatD, .7);
    g.beginPath(); g.arc(hx, hy, 2.4, 0, TAU); g.fillStyle = sk; g.fill();
  }
  // head
  const hp = new Path2D(); hp.ellipse(0, -72, 6.6, 7.8, 0, 0, TAU);
  facet(g, hp, [-7, -80, 7, -64], [[2, -80], [-1, -64]], sk, mix(sk, '#ffffff', .35), mix(sk, '#000000', .45), LIGHT, .7);
  if (face) {
    g.strokeStyle = PAL.ink; g.lineWidth = .7; g.lineCap = 'round';
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 2.6 - 1.3, -72.5); g.quadraticCurveTo(sd * 2.6, -74 + red * -.6, sd * 2.6 + 1.3, -72.5); g.stroke(); }
    g.beginPath(); g.moveTo(-1.6, -68.6); g.quadraticCurveTo(0, -67.4 + red * .8, 1.6, -68.6); g.stroke();
  }
  // hair / hat
  if (T.hat && kind === 0) { const h = new Path2D(); h.moveTo(-9, -77); h.lineTo(9, -77); h.lineTo(6, -79); h.lineTo(5.5, -86); h.lineTo(-5.5, -86); h.lineTo(-6, -79); h.closePath(); facet(g, h, [-9, -86, 9, -77], [[-9, -80], [9, -83]], T.hat, '#3a3026', '#000000', LIGHT, .7); }
  else if (kind === 3) { const h = new Path2D(); h.ellipse(0, -77.5, 7.4, 3.6, 0, Math.PI, TAU); h.lineTo(10, -77.5); h.closePath(); facet(g, h, [-8, -81, 10, -77], null, T.hat, '#5c4a66', '#0e0a10', LIGHT, .7); }
  else { const h = new Path2D(); h.ellipse(0, -75.5, 7.2, 5.6, 0, Math.PI * .95, TAU * 1.025); h.closePath(); g.fillStyle = kind === 1 ? '#1a0f0a' : '#120b08'; g.fill(h); if (kind === 1) { g.beginPath(); g.arc(0, -82, 3, 0, TAU); g.fill(); } }
  g.restore();
}
