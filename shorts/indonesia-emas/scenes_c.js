// Shots 10-13: the overhead pattern (opportunity), the towers (what it is not about), the city section (the red spreads),
// the year dial (kapan?).
import { D, T, B, W, H, CX, clamp, lerp, seg, ss, eio, eo, ei, back, TAU, mix, rgba, hash, bg, zoomAt, pulse, settle, slab, skyscraper, tree, lamp, leaves, coin, facet } from './common.js';
import { drawBoy, drawPerson, POSES, lerpPose, RED } from './boy.js';

// ---------- 10. Busby Berkeley overhead: a ring of people around a ziggurat; coins become open doors, they climb ----------
function topPerson(g, x, y, ang, s, { coat = '#1d6b57', hair = '#120b08', arms = 0 } = {}) {
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s);
  for (const sd of [-1, 1]) { const ex = sd * (16 + arms * 10), ey = -arms * 14; D.gline(g, [[sd * 12, 0], [ex, ey]], { w: 5, color: coat }); g.beginPath(); g.arc(ex, ey, 4, 0, TAU); g.fillStyle = '#e0a77c'; g.fill(); }
  const sh = new Path2D(); sh.ellipse(0, 0, 17, 9, 0, 0, TAU); facet(g, sh, [-17, -9, 17, 9], [[-17, 2], [17, -2]], coat, mix(coat, '#ffffff', .35), mix(coat, '#000000', .55), [-.6, -.8], 1);
  g.beginPath(); g.arc(0, -1, 8.5, 0, TAU); g.fillStyle = hair; g.fill();
  g.beginPath(); g.arc(-2.5, -3.5, 3, 0, TAU); g.fillStyle = 'rgba(243,217,139,.35)'; g.fill();
  g.restore();
}
export function overhead(g, u, d, K) {
  const k = K.keys, s0 = K.shot0, tM = k.miliarder - s0, tK = k.kesempatan - s0, tB = k.baik - s0;
  bg(g, '#0e0b08', '#030202', .5);
  const C0 = [CX, 860], rot = u * .12;
  g.save(); g.translate(C0[0], C0[1]); g.rotate(rot);
  // ziggurat from above: four stepped squares, rotated 45°
  for (let i = 0; i < 4; i++) {
    const r = 380 - i * 82, pts = [[0, -r], [r, 0], [0, r], [-r, 0], [0, -r]];
    D.airbrush(g, pts, { base: ['#14100b', '#1d160e', '#271d12', '#33261a'][i], light: '#5a4426', dark: '#050403', dir: -2.3 });
    D.gline(g, pts, { w: 2.4 - i * .3, sheen: .3 + i * .1 });
  }
  D.sunburst(g, 0, 0, { rays: 32, r0: 20, r1: 110, mode: 'lines', w: 2, alpha: .6 + .4 * seg(u, tK, tK + 1) });
  D.glow(g, 0, 0, 160, '#ffcf7a', .2 + .4 * seg(u, tK, tK + 1));
  // sixteen people: on the ring; after "kesempatan" each climbs one step per eighth note, in order
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, climb = seg(u, tK + i * .07, tK + i * .07 + .35);
    const r = lerp(455, 300, eio(climb)) - 50 * seg(u, tB - .3, tB + .6);
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    // what they hold: a coin (the fantasy) → an open door (the opportunity)
    const hx = Math.cos(a) * (r - 62), hy = Math.sin(a) * (r - 62);
    const dm = seg(u, tK - .25 + i * .03, tK + .25 + i * .03);
    if (u > tM - .6 && dm < 1) coin(g, hx, hy, 22 * ss(seg(u, tM - .6 + i * .02, tM - .3 + i * .02)) * (1 - dm), u * 4 + i);
    if (dm > 0) {
      g.save(); g.translate(hx, hy); g.rotate(a + Math.PI / 2);
      const door = D.stepArchPts(0, 26, 46 * dm, 64 * dm, { steps: 2 });
      g.fillStyle = `rgba(255,214,130,${.75 * dm})`; g.fill(D.toPath(door, true)); D.gline(g, door, { w: 1.4 });
      g.restore();
    }
    topPerson(g, x, y, a + Math.PI / 2, 2.3, { coat: ['#1d6b57', '#d9ccb0', '#2b2130', '#6f5220'][i % 4], arms: seg(u, tB - .2, tB + .4) });
  }
  g.restore();
  // 8-way mirror shimmer: gold rings ticking on the beat
  for (let i = 0; i < 3; i++) D.gline(g, D.arcPts(C0[0], C0[1], 560 + i * 26, 0, TAU, 120), { w: 1.2, alpha: .35 + .3 * pulse(u, tK + i * .4, .4) });
  T.titleBar(g, 'KESEMPATAN', CX, 1290, { p: seg(u, tK, tK + .9), size: 40, sub: 'UNTUK HIDUP YANG LEBIH BAIK', wings: true });
}

// ---------- 11. towers and a tech dome: crane up, sheen sweep; what Indonesia Emas is not only about ----------
export function towers(g, u, d, K) {
  const k = K.keys, s0 = K.shot0, tG = k.gedung - s0, tT = k.teknologi - s0;
  const crane = eio(seg(u, 0, d)) * 420;
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#04060a'); gr.addColorStop(.6, '#0b1a16'); gr.addColorStop(1, '#2a1f10'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // searchlights
  for (let i = 0; i < 4; i++) D.beam(g, 140 + i * 270, 1750 + crane * .3, -Math.PI / 2 + Math.sin(u * .8 + i * 1.7) * .35, 1700, 260, .12);
  g.save(); g.translate(0, crane);
  const sheen = lerp(-.2, 1.3, seg(u, tG - .2, tG + 1.2)), dim = 1 - .35 * seg(u, tT + .4, d);
  g.save(); g.globalAlpha = dim;
  // low-angle perspective: towers taper toward a high vanishing point
  const towersDef = [[160, 260, 1050, 'needle', 2], [920, 250, 1120, 'needle', 5], [330, 300, 1450, 'crown', 3], [750, 300, 1380, 'crown', 4], [540, 360, 1700, 'needle', 1]];
  for (const [x, w, h, sp, seed] of towersDef) {
    g.save(); const vx = CX, f = .00028;
    skyscraper(g, x, 1750, w, h, { steps: 3, spire: sp, seed, sheen: sheen + seed * .05, lit: (i) => hash(i * 1.3 + seed) > .5 ? .9 : 0, glow: sp === 'needle' ? .6 : 0 });
    g.restore();
  }
  g.restore();
  // the tech dome in front: glass with gold ribs, glinting on "teknologi"
  const dx = CX, dy = 1760, dr = 380;
  const dome = new Path2D(); dome.arc(dx, dy, dr, Math.PI, TAU); dome.closePath();
  g.save(); g.globalAlpha = .9 * dim; D.airbrush(g, dome, { base: '#123a30', light: '#5fbf9c', dark: '#041210', dir: -2.1, bbox: [dx - dr, dy - dr, dx + dr, dy] }); g.restore();
  for (let i = 1; i < 8; i++) { const a = Math.PI + Math.PI * i / 8; D.gline(g, [[dx, dy - dr], [dx + Math.cos(a) * dr, dy + Math.sin(a) * dr]].map(([x, y], j) => j ? [x, y] : [x, y]), { w: 1.4, sheen }); }
  for (let i = 1; i < 4; i++) D.gline(g, D.arcPts(dx, dy, dr * i / 4 * 1.0, Math.PI, TAU, 40), { w: 1.2, sheen });
  D.gline(g, D.arcPts(dx, dy, dr, Math.PI, TAU, 60), { w: 3, sheen });
  for (let i = 0; i < 4; i++) D.sparkle(g, dx - 250 + i * 160, dy - 260 + hash(i) * 120, 26 * pulse(u, tT + i * .1, .5), { alpha: 1 });
  g.restore();
}

// ---------- 12. SIGNATURE: close on him → pull back to a city section; the red spreads to everyone ----------
const FLOORS = (() => {   // three buildings in section, each floor with a few residents
  const out = []; const bs = [[230, 380, 6], [540, 420, 8], [850, 380, 6]], BASE = 1395;
  bs.forEach(([cx, w, nf], b) => {
    for (let f = 1; f < nf; f++) { const y = BASE - f * 150 - 4, per = 3 + (f + b) % 2; for (let i = 0; i < per; i++) out.push({ x: cx - w / 2 + 50 + i * ((w - 100) / (per - 1 || 1)), y, kind: (i + f + b) % 4, seed: i + f * 3 + b * 7, b, f }); }
  });
  return { bs, people: out, BASE };
})();
export function city(g, u, d, K) {
  const k = K.keys, s0 = K.shot0, tR = k.rakyat - s0, tM = k.kemajuannya - s0;
  bg(g, '#100c08', '#030202', .4);
  const pull = eio(seg(u, .35, 2.2)), BASE = FLOORS.BASE;
  const z = lerp(4.6, 1, pull);
  g.save(); zoomAt(g, CX, 1110, z);
  // sunburst behind the city, igniting at the peak
  const peak = ss(seg(u, tM - .2, tM + .8));
  D.sunburst(g, CX, BASE, { rays: 60, r1: 1700, a0: Math.PI, a1: TAU, mode: 'wedges', colorA: `rgba(201,162,75,${.06 + .14 * peak})` });
  D.sunburst(g, CX, BASE, { rays: 40, r0: 120, r1: 1400 * (.3 + .7 * peak), a0: Math.PI, a1: TAU, mode: 'lines', w: 2, alpha: .3 + .6 * peak });
  // buildings in section: lacquer walls, floor slabs, rooms with a warm light
  for (const [cx, w, nf] of FLOORS.bs) {
    const top = BASE - nf * 150;
    const sh = [[cx - w / 2, BASE], [cx - w / 2, top], [cx - w * .32, top], [cx - w * .32, top - 60], [cx + w * .32, top - 60], [cx + w * .32, top], [cx + w / 2, top], [cx + w / 2, BASE]];
    D.airbrush(g, sh, { base: '#16110b', light: '#3a2d1c', dark: '#040302', dir: -2.3 });
    D.gline(g, sh, { w: 2.6 });
    for (let f = 0; f <= nf; f++) D.gline(g, [[cx - w / 2, BASE - f * 150], [cx + w / 2, BASE - f * 150]], { w: 2 });
    D.sunburst(g, cx, top - 60, { rays: 9, r0: 6, r1: w * .3, a0: Math.PI, a1: TAU, mode: 'lines', w: 2 });
  }
  // residents: the red reaches each one in order of distance from the boy
  for (const p of FLOORS.people) {
    const dist = Math.hypot(p.x - CX, p.y - BASE) / 1250;
    const r = ss(seg(u, tR + dist * (tM - tR + .2), tR + dist * (tM - tR + .2) + .35));
    if (r > 0) D.glow(g, p.x, p.y - 50, 70, '#e2283f', .35 * r);
    drawPerson(g, { x: p.x, y: p.y, s: 1.25, kind: p.kind, seed: p.seed, red: r, arms: r * .6 });
  }
  // street level and the boy in front, the first red
  g.fillStyle = '#0a0806'; g.fillRect(0, BASE, W, H - BASE); D.gline(g, [[0, BASE], [W, BASE]], { w: 2.4 });
  drawBoy(g, { x: CX, y: BASE - 2, s: 2.3, face: 'warm', pose: lerpPose(POSES.stand, POSES.openArms, ss(seg(u, tM - .3, tM + .5))), glow: .8 + .2 * Math.sin(u * 4) });
  g.restore();
}

// ---------- 13. the year dial: hands spin, digits roll, land on "?"; doors close ----------
const SIGNQ = () => B.buildSign('?', { size: 260, spacing: 15 });
export function dial(g, u, d, K) {
  const k = K.keys, s0 = K.shot0, tK = k.kapan - s0, tI = k.itu - s0;
  bg(g, '#120d08', '#030202', .45);
  const z = 1 + eio(seg(u, 0, d - 1.2)) * .12;
  g.save(); zoomAt(g, CX, 580, z);
  D.sunburst(g, CX, 580, { rays: 72, r1: 1600, mode: 'wedges', colorA: 'rgba(201,162,75,.07)' });
  D.sunburst(g, CX, 580, { rays: 48, r0: 350, r1: 600, mode: 'lines', w: 1.6, alpha: .7 });
  // the hands spin fast, then decelerate to stop as "itu?" lands
  const spinT = clamp(u / (tI + .2)), turns = 9 * (1 - Math.pow(1 - spinT, 3));
  const m = (turns * 60) % 60, h = (turns * 5) % 12;
  T.clockFace(g, CX, 580, 300, { h, m, roman: true, lit: .3 + .5 * seg(u, tI, tI + .4) });
  // the "?" lights in bulbs over the centre when the question lands
  const q = SIGNQ(), sc = 1;
  if (u > tI - .2) { g.save(); g.globalAlpha = ss(seg(u, tI - .2, tI)); g.fillStyle = 'rgba(5,4,3,.75)'; g.beginPath(); g.arc(CX, 580, 185, 0, TAU); g.fill(); g.restore(); }
  B.drawSign(g, q, CX - q.w * sc / 2, 580 - q.h * sc * .55, sc, { lit: B.litSequence(u, [tI], { flash: .3 }), channel: u > tI - .2 });
  // year counter rolling under the dial
  const yr = Math.floor(lerp(2026, 2099, clamp(1 - Math.pow(1 - clamp(u / (tK + .6)), 2))));
  const label = u < tK + .6 ? String(yr) : '20??';
  slab(g, CX - 170, 945, 340, 125, { r: 6, base: '#0d0a07', double: 8 });
  T.decoDigits(g, label, CX, 1040, 76, { rules: false, sheen: lerp(-.2, 1.2, seg(u, tK + .6, tK + 1.4)) });
  // the boy below, from behind, looking up
  drawBoy(g, { x: CX, y: 1372, s: 1.85, view: 'back', pose: POSES.stand });
  g.restore();
  // the lights go out: the gold world dims to black; only the "?" (the question) and his red stay lit
  const out = ss(seg(u, d - 2.2, d - .9));
  if (out > 0) {
    g.fillStyle = `rgba(3,2,2,${.93 * out})`; g.fillRect(0, 0, W, H);
    g.save(); zoomAt(g, CX, 580, z);
    B.drawSign(g, q, CX - q.w * sc / 2, 580 - q.h * sc * .55, sc, { lit: B.litAll(1), channel: false });
    drawBoy(g, { x: CX, y: 1372, s: 1.85, view: 'back', pose: POSES.stand, glow: .9 * out });
    g.restore();
  }
}
