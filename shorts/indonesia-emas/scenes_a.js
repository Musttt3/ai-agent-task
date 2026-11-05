// Shots 1-4: the golden tower (hook), the bedroom (alarm), the TV (the news), the street (the new country).
// Every shot: fn(g, u, d, K) with u = time since the shot started, d = its duration, K = {t, keys, tl}.
import { D, T, B, W, H, CX, clamp, lerp, seg, ss, eio, eo, ei, back, TAU, mix, rgba, hash, bg, zoomAt, pulse, settle, slab, skyscraper, tree, lamp, coin } from './common.js';
import { drawBoy, drawPerson, POSES, walkPose, lerpPose, RED } from './boy.js';
import { makeCam } from './engine/cam.js';

// ---------- 1. the tower: a gold point → sunburst → flame-topped tower; the bulb sign counts the words ----------
const SIGN1 = () => B.buildSign('INDONESIA', { size: 150, spacing: 13 });
const SIGN2 = () => B.buildSign('EMAS?', { size: 230, spacing: 17 });
export function tower(g, u, d, K) {
  const k = K.keys;
  // dawn sky: warm black → emerald → gold at the horizon
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0b0a08'); gr.addColorStop(.5, '#0d1d18'); gr.addColorStop(.74, '#3a2a12'); gr.addColorStop(.8, '#0c0906'); gr.addColorStop(1, '#040302');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const tilt = eio(seg(u, .2, d)) * 90;             // Cassandre tilt up the tower
  g.save(); g.translate(0, tilt);
  // the point → hairline → rays from the flame
  const fx = CX, fy = 620;
  const p0 = seg(u, 0, .35), rays = eo(seg(u, .25, 1.6));
  D.glow(g, fx, fy, 60 + 520 * rays, '#ffcf7a', .5 * Math.max(p0, .4));
  if (u < .6) D.gline(g, [[fx - 300 * ss(seg(u, .1, .45)), fy], [fx + 300 * ss(seg(u, .1, .45)), fy]], { w: 2, glow: 1, alpha: 1 - seg(u, .4, .6) });
  D.sunburst(g, fx, fy, { rays: 72, r0: 40, r1: 1900 * rays, mode: 'wedges', colorA: 'rgba(201,162,75,.09)' });
  D.sunburst(g, fx, fy, { rays: 48, r0: 90, r1: 1400 * rays, mode: 'lines', w: 2, alpha: .55 * rays, sheen: .3 + u * .2 });
  // rising sun behind the plinth
  const sunY = 1430 - eo(seg(u, .3, d)) * 60;
  const sp = new Path2D(); sp.arc(CX, sunY, 330, Math.PI, TAU); sp.closePath();
  g.save(); g.globalAlpha = .9 * rays; D.airbrush(g, sp, { base: '#c9a24b', light: '#fff0c0', dark: '#6f5220', dir: -Math.PI / 2, bbox: [CX - 330, sunY - 330, CX + 330, sunY] }); g.restore();
  // tower: stepped plinth, tapered shaft, cup, flame (a generic monument, drawn the deco way)
  const show = ss(seg(u, .35, 1.4));
  g.save(); g.globalAlpha = show;
  const plinth = [[CX - 360, 1700], [CX - 360, 1610], [CX - 290, 1610], [CX - 290, 1530], [CX - 210, 1530], [CX - 210, 1450], [CX + 210, 1450], [CX + 210, 1530], [CX + 290, 1530], [CX + 290, 1610], [CX + 360, 1610], [CX + 360, 1700]];
  D.airbrush(g, plinth, { base: '#1a130c', light: '#4a3720', dark: '#050403', dir: -2.3, rim: 2 });
  D.gline(g, plinth, { w: 2.4, part: ss(seg(u, .35, 1.2)) });
  const shaft = [[CX - 92, 1450], [CX - 46, 760], [CX + 46, 760], [CX + 92, 1450]];
  D.airbrush(g, shaft, { base: '#1c150d', light: '#5a4426', dark: '#060504', dir: -2.6, rim: 2.5 });
  D.gline(g, [...shaft, shaft[0]], { w: 2.6, part: ss(seg(u, .5, 1.5)) });
  for (const f of [.25, .5, .75]) D.gline(g, [[lerp(CX - 92, CX - 46, f), lerp(1450, 760, f)], [lerp(CX + 92, CX + 46, f), lerp(1450, 760, f)]], { w: 1.2, alpha: .8 * show });
  D.gline(g, [[CX, 1450], [CX, 770]], { w: 1, alpha: .5 * show });
  const cup = [[CX - 120, 760], [CX - 80, 700], [CX + 80, 700], [CX + 120, 760]];
  D.drawShape(g, [...cup, cup[0]], { lw: 2 });
  // flame: the gold "torch" that the rays come from
  const fl = []; const fh = 150 + 8 * Math.sin(u * 9);
  for (let i = 0; i <= 20; i++) { const a = i / 20; const w = Math.sin(a * Math.PI) * 70 * (1 - a * .35); fl.push([CX - w + Math.sin(a * 7 + u * 6) * 4, 700 - a * fh]); }
  for (let i = 20; i >= 0; i--) { const a = i / 20; const w = Math.sin(a * Math.PI) * 70 * (1 - a * .35); fl.push([CX + w + Math.sin(a * 6 - u * 5) * 4, 700 - a * fh]); }
  D.drawShape(g, fl, { halo: .7 * rays, lw: 2.2, sheen: .3 + .5 * seg(u, 1, 3) });
  g.restore();
  g.restore();
  // the boy at the foot of the tower, from behind, looking up
  drawBoy(g, { x: CX, y: 1365 + tilt, s: 1.9, view: 'back', pose: POSES.stand });
  // bulb sign: INDONESIA letter by letter from the word, then EMAS? on its word
  const s1 = SIGN1(), sc1 = Math.min(1, 980 / s1.w);
  const t1 = k.indonesia1 - K.shot0, step = .07;
  B.drawSign(g, s1, CX - s1.w * sc1 / 2, 150, sc1, { lit: B.litSequence(u, s1.letters.map((_, i) => t1 + i * step), { chaseFrom: t1 + 1.6, chaseSpeed: 16 }) });
  const s2 = SIGN2(), sc2 = Math.min(1, 760 / s2.w), te = k.emas - K.shot0;
  B.drawSign(g, s2, CX - s2.w * sc2 / 2, 340, sc2, { lit: B.litSequence(u, [te, te + .06, te + .12, te + .18, te + .45]), color: null });
  D.vignette(g, W, H, .45);
}

// ---------- 2. the bedroom: the alarm clock rings, the boy bolts upright ----------
export function bedroom(g, u, d, K) {
  const k = K.keys, kag = k.kaget - K.shot0;
  const z = 1 + eio(seg(u, 0, d)) * .06;
  g.save(); zoomAt(g, CX, 1000, z);
  bg(g, '#1b130c', '#070504', .3);
  // wall piers and a stepped-arch window with the dawn inside
  for (let i = 0; i < 7; i++) { const x = 60 + i * 160; D.gline(g, [[x, 0], [x, 1300]], { w: 1.2, alpha: .35 }); }
  const inner = D.stepArchPts(CX, 960, 520, 760, { steps: 3 });
  g.save(); g.clip(D.toPath(inner, true));
  const sky = g.createLinearGradient(0, 200, 0, 960); sky.addColorStop(0, '#0d1d18'); sky.addColorStop(.7, '#5a3f18'); sky.addColorStop(1, '#c9a24b'); g.fillStyle = sky; g.fillRect(0, 0, W, 1000);
  D.sunburst(g, CX, 960, { rays: 30, r1: 900, a0: Math.PI, a1: TAU, mode: 'both', w: 1.6, alpha: .7 });
  D.glow(g, CX, 960, 260, '#fff0c0', .6);
  g.restore();
  D.archFrame(g, CX, 960, 600, 840, { rings: 2, gap: 16, burst: false });
  // headboard (fan) and bed
  D.fan(g, CX, 1180, 300, { ribs: 11, fill: '#3a2a16' });
  const bed = [[CX - 420, 1180], [CX + 420, 1180], [CX + 440, 1560], [CX - 440, 1560]];
  D.airbrush(g, bed, { base: '#2a1d12', light: '#5a4026', dark: '#080604', dir: -2.2, rim: 2 }); D.gline(g, [...bed, bed[0]], { w: 2.4 });
  // pillow
  const pil = new Path2D(); pil.ellipse(CX - 180, 1185, 150, 46, -.05, 0, TAU);
  D.airbrush(g, pil, { base: '#e9dfc9', light: '#ffffff', dark: '#9c8f76', rim: 1.2 });
  // the boy: lying → sits up on "bangun" → jolts (arms up, eyes wide) on "kaget"
  const L2 = K.tl.lines.find(l => l.id === 'L2'), wB = L2.wordsF.find(w => /^bangun/i.test(w.w)), tB = (wB ? wB.s : L2.on + .3) - K.shot0;
  const up = back(seg(u, tB - .1, tB + .55), 1.4), anti = pulse(u, kag - .3, .22), jolt = pulse(u, kag - .08, .3);
  const lieA = -1.42, ang = lerp(lieA, 0, clamp(up)) + anti * .06;
  const face = u < tB ? { eye: 0, arc: 'down', mouth: 'flat' } : u < kag - .1 ? { eye: .55, look: [0, 0], mouth: 'flat', brow: .2 } : u < kag + 1.2 ? 'surprise' : 'wonder';
  const pose = lerpPose(POSES.stand, POSES.bed, back(seg(u, kag - .12, kag + .12), 2));
  g.save(); g.beginPath(); g.rect(0, 0, W, 1450); g.clip();   // his legs stay under the blanket
  g.translate(CX + 40, 1300); g.rotate(ang); g.translate(-(CX + 40), -1300);
  drawBoy(g, { x: CX + 40, y: 1300 + 70 * 4.4 - jolt * 26, s: 4.4, face, pose, sq: 1 - anti * .07 + jolt * .07 });
  g.restore();
  // blanket over the legs (and the body while lying)
  const bl = [[CX - 400, 1290 - (1 - up) * 70], [CX + 400, 1260], [CX + 430, 1560], [CX - 430, 1560]];
  D.airbrush(g, bl, { base: '#1d6b57', light: '#4fae8e', dark: '#062019', dir: -2.2, rim: 2 });
  D.chevrons(g, CX - 380, CX + 380, 1360, { n: 12, h: 18, rows: 2, gap: 10 });
  g.restore();
  // alarm clock in the foreground (shakes while it rings)
  const ring = u > .15 && u < kag + .5, sh = ring ? Math.sin(u * 95) * .07 : 0;
  g.save(); g.translate(205, 1330); g.rotate(sh);
  for (const sd of [-1, 1]) { const b = new Path2D(); b.arc(sd * 70, -118, 38, Math.PI, TAU); b.closePath(); D.drawShape(g, b, { lw: 1.6, bbox: [sd * 70 - 38, -156, sd * 70 + 38, -118] }); }
  T.clockFace(g, 0, 0, 120, { h: 6, m: 0, s: null, roman: false, lit: ring ? .5 : 0 });
  for (const sd of [-1, 1]) D.gline(g, [[sd * 70, 120], [sd * 95, 175]], { w: 4 });
  g.restore();
  if (ring) for (let i = 0; i < 3; i++) { const a = -2.1 + i * .5; D.gline(g, D.arcPts(205, 1200, 180 + i * 26, a - .25, a + .25, 8), { w: 2, alpha: .7 * (.5 + .5 * Math.sin(u * 30 + i)) }); }
}

// ---------- 3. the TV: over his shoulder, push in on the screen; the dial climbs to MAJU ----------
export function tv(g, u, d, K) {
  const k = K.keys, sh0 = K.shot0, tRes = k.resmi - sh0, tMaju = k.maju - sh0;
  const z = 1 + eio(seg(u, .2, d)) * .34, fx = CX, fy = 760;
  g.save(); zoomAt(g, fx, fy, z);
  bg(g, '#120d08', '#040302', .2);
  D.sunburst(g, CX, 760, { rays: 40, r1: 1400, mode: 'wedges', colorA: 'rgba(201,162,75,.05)' });
  // cabinet
  const cab = [[CX - 320, 1360], [CX - 320, 520], [CX - 250, 520], [CX - 250, 450], [CX + 250, 450], [CX + 250, 520], [CX + 320, 520], [CX + 320, 1360]];
  D.airbrush(g, cab, { base: '#3a2414', light: '#7a5432', dark: '#100904', dir: -2.3, rim: 2 }); D.gline(g, [...cab, cab[0]], { w: 2.6, double: 7 });
  // screen
  const R = 235, SX = CX, SY = 780;
  D.gline(g, D.arcPts(SX, SY, R + 22, 0, TAU, 80), { w: 4, double: 8 });
  g.save(); g.beginPath(); g.arc(SX, SY, R, 0, TAU); g.clip();
  const on = seg(u, .05, .4);
  const sg = g.createRadialGradient(SX, SY - 60, 10, SX, SY, R); sg.addColorStop(0, mix('#0a1a16', '#2c5a4c', on)); sg.addColorStop(1, '#040807'); g.fillStyle = sg; g.fillRect(SX - R, SY - R, 2 * R, 2 * R);
  if (u < .5) { for (let i = 0; i < 70; i++) { const y = SY - R + hash(i * 3.3 + Math.floor(u * 24) * 7.1) * 2 * R; g.fillStyle = `rgba(240,230,210,${.25 * hash(i + Math.floor(u * 24))})`; g.fillRect(SX - R, y, 2 * R, 2); } }
  if (u > .3) {
    T.titleBar(g, 'BERITA', SX, SY - 150, { p: seg(u, .3, 1.1), size: 30, wings: false, track: 8 });
    const v = .08 + .9 * settle(seg(u, tRes - .2, tMaju + .1));
    T.dial(g, SX, SY + 60, 140, v, { labels: ['', '', '', '', '', 'MAJU'], lit: seg(u, tMaju, tMaju + .3) });
    if (u > tMaju) {
      T.titleBar(g, 'NEGARA MAJU', SX, SY + 150, { p: seg(u, tMaju, tMaju + .9), size: 34, wings: false, track: 4 });
      for (let i = 0; i < 6; i++) D.sparkle(g, SX - 190 + hash(i * 5.1) * 380, SY - 180 + hash(i * 2.7) * 300, 16 * pulse(u, tMaju + .2 + i * .12, .5), { alpha: 1 });
    }
  }
  // glass highlight
  const hl = g.createLinearGradient(SX - R, SY - R, SX + R, SY + R); hl.addColorStop(0, 'rgba(255,255,255,.10)'); hl.addColorStop(.4, 'rgba(255,255,255,0)'); g.fillStyle = hl; g.fillRect(SX - R, SY - R, 2 * R, 2 * R);
  g.restore();
  // speaker grille and knobs
  D.chevrons(g, CX - 200, CX + 200, 1110, { n: 10, h: 26, rows: 4, gap: 18 });
  for (const sd of [-1, 1]) { const kp = new Path2D(); kp.arc(CX + sd * 220, 1300, 26, 0, TAU); D.drawShape(g, kp, { lw: 1.6, bbox: [CX + sd * 220 - 26, 1274, CX + sd * 220 + 26, 1326] }); }
  g.restore();
  // the boy in the foreground, from behind (parallax: he scales a little more than the room)
  g.save(); zoomAt(g, fx, fy, 1 + (z - 1) * 1.35);
  drawBoy(g, { x: 250, y: 2290, s: 7.4, view: 'back', pose: POSES.stand, sq: 1 + pulse(u, tMaju, .35) * .03 });
  g.restore();
  // flash on the way out (the next shot is through the front door)
  const fl = seg(u, d - .3, d); if (fl > 0) { g.fillStyle = `rgba(255,236,190,${.35 * fl})`; g.fillRect(0, 0, W, H); }
}

// ---------- 4. the street: one-point boulevard, camera tracking back as he walks toward us ----------
export function street(g, u, d, K) {
  const k = K.keys, sh0 = K.shot0;
  const speed = 1.35, camZ = -u * speed;
  const cam = makeCam({ x: 0, y: 1.55, z: camZ - 4.2, f: 900, W, H, oy: 760, pitch: .02 });
  // sky
  const gr = g.createLinearGradient(0, 0, 0, 900); gr.addColorStop(0, '#0d1512'); gr.addColorStop(.75, '#4a3618'); gr.addColorStop(1, '#c9a24b'); g.fillStyle = gr; g.fillRect(0, 0, W, 900);
  D.sunburst(g, CX, 760, { rays: 36, r1: 1100, a0: Math.PI, a1: TAU, mode: 'both', w: 1.4, alpha: .55 });
  D.glow(g, CX, 760, 300, '#fff0c0', .5);
  // ground
  g.fillStyle = '#0c0906'; g.fillRect(0, 760, W, H - 760);
  const P = (x, y, z) => cam.P(x, y, z);
  // road surface (mode-7 strip) with gold kerbs and moving dashes
  const road = [P(-4.5, 0, camZ + .6), P(4.5, 0, camZ + .6), P(4.5, 0, 260), P(-4.5, 0, 260)];
  g.beginPath(); road.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
  const rg = g.createLinearGradient(0, 760, 0, H); rg.addColorStop(0, '#2a1f14'); rg.addColorStop(1, '#14100b'); g.fillStyle = rg; g.fill();
  for (const sx of [-4.5, 4.5]) D.gline(g, [P(sx, 0, camZ + .6), P(sx, 0, 260)].map(p => [p[0], p[1]]), { w: 2.6 });
  for (let z = Math.floor(camZ) - 1; z < 120; z += 3) {
    if (z < camZ + .7) continue;
    const a = P(0, 0, z), b = P(0, 0, z + 1.4);
    D.gline(g, [[a[0], a[1]], [b[0], b[1]]], { w: Math.max(1, 900 / (z - camZ + 4.2) * .12), alpha: .9 });
  }
  // buildings both sides, far to near
  const blocks = [];
  for (let i = 0; i < 14; i++) for (const sd of [-1, 1]) blocks.push({ sd, z: 6 + i * 9, h: 9 + 14 * hash(i * 3.7 + sd), w: 7, seed: i * 2 + (sd > 0) });
  blocks.sort((a, b) => b.z - a.z);
  for (const bk of blocks) {
    if (bk.z + bk.w < camZ) continue;
    const xi = bk.sd * 7.2, xo = bk.sd * 14;
    const q = [P(xi, 0, bk.z), P(xi, bk.h, bk.z), P(xi, bk.h, bk.z + bk.w), P(xi, 0, bk.z + bk.w)];
    const pth = D.toPath(q.map(p => [p[0], p[1]]), true);
    D.airbrush(g, pth, { base: bk.seed % 3 ? '#16110b' : '#0f2620', light: bk.seed % 3 ? '#3e2e1a' : '#2c5a4c', dark: '#040302', dir: bk.sd < 0 ? -.3 : -2.8, bbox: [Math.min(...q.map(p => p[0])), Math.min(...q.map(p => p[1])), Math.max(...q.map(p => p[0])), Math.max(...q.map(p => p[1]))] });
    // window rows and piers on the facade
    for (let r = 1; r < bk.h / 2.4; r++) { const y = r * 2.4; const a = P(xi, y, bk.z + .4), b = P(xi, y, bk.z + bk.w - .4); D.gline(g, [[a[0], a[1]], [b[0], b[1]]], { w: Math.max(.6, 900 / (bk.z - camZ + 4.2) * .05), alpha: .55 }); }
    for (let c = 0; c <= 3; c++) { const zz = bk.z + bk.w * c / 3; const a = P(xi, 0, zz), b = P(xi, bk.h, zz); D.gline(g, [[a[0], a[1]], [b[0], b[1]]], { w: Math.max(.7, 900 / (zz - camZ + 4.2) * .06), alpha: .8 }); }
    const top = [P(xi, bk.h, bk.z), P(xi, bk.h, bk.z + bk.w)]; D.gline(g, top.map(p => [p[0], p[1]]), { w: 2 });
  }
  // trees and lamps along the kerbs
  for (let z = 4; z < 90; z += 6) {
    if (z < camZ + .5) continue;
    for (const sd of [-1, 1]) {
      const b = P(sd * 5.4, 0, z), sc = cam.scaleAt(sd * 5.4, 0, z);
      if (Math.floor(z / 6) % 2) tree(g, b[0], b[1], sc * .7); else lamp(g, b[0], b[1], sc * 3.2, 1);
    }
  }
  // the tram crossing the boulevard on "transportasi"
  const tt = k.transportasi - sh0, tp = seg(u, tt - .6, tt + 1.4);
  if (tp > 0 && tp < 1) {
    const z = 34, x = lerp(-26, 26, eio(tp)), sc = cam.scaleAt(x, 0, z), b = P(x, 0, z);
    const tw = 9 * sc, th = 2.6 * sc, x0 = b[0] - tw / 2, y0 = b[1] - th - .3 * sc;
    D.speedLines(g, x0, y0 + th * .5, Math.PI, { n: 5, len: tw * 1.4, spread: th * .8, w: th * .12 });
    const body = new Path2D(); body.roundRect(x0, y0, tw, th, th * .45);
    D.airbrush(g, body, { base: '#1d6b57', light: '#5fbf9c', dark: '#062019', rim: 2, bbox: [x0, y0, x0 + tw, y0 + th] });
    D.gline(g, [[x0 + th * .3, y0 + th * .62], [x0 + tw - th * .3, y0 + th * .62]], { w: Math.max(1.4, th * .07), glow: .4 });
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,220,150,.75)'; g.fillRect(x0 + th * .5 + i * (tw - th) / 6, y0 + th * .18, (tw - th) / 6 * .7, th * .3); }
    D.gline(g, [[P(-30, 0, z)[0], P(-30, 0, z)[1]], [P(30, 0, z)[0], P(30, 0, z)[1]]], { w: 1.4, alpha: .8 });
  }
  // a few far pedestrians
  for (let i = 0; i < 4; i++) { const z = 14 + i * 9, sd = i % 2 ? 1 : -1, b = P(sd * 5.9, 0, z), sc = cam.scaleAt(0, 0, z); if (z > camZ + 1) drawPerson(g, { x: b[0], y: b[1], s: sc * 1.55 / 80, kind: i, seed: i, walk: 1, ph: u * 1.6 + i * .3 }); }
  // the boy walking toward us (camera keeps pace)
  const walk = walkPose(u * 1.75, 1), joy = u > k.kemacetan - sh0;
  drawBoy(g, { x: CX, y: 1385, s: 4.3, face: joy ? 'joy' : 'smile', pose: walk });
  // the traffic gauge drops to almost nothing on "hampir nggak ada kemacetan"
  const th0 = k.hampir - sh0, tk = k.kemacetan - sh0;
  const ga = ss(seg(u, 1.0, 1.8));
  if (ga > 0) {
    g.save(); g.globalAlpha = ga;
    const v = lerp(.88, .06, settle(seg(u, th0, tk + .4)));
    T.dial(g, CX, 300, 140, v, { labels: ['0', '', '', '', '', 'MACET'], lit: seg(u, tk, tk + .3) });
    T.titleBar(g, 'KEMACETAN', CX, 400, { p: seg(u, 1.0, 1.9), size: 28, wings: false, track: 6 });
    g.restore();
  }
}
