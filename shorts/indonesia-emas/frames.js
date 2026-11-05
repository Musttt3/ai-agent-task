// Look development: the protagonist's model sheet (turnaround, expressions, key poses, palette, silhouette check).
import * as D from './engine/deco.js';
import * as T from './engine/type.js';
import { drawBoy, drawPerson, POSES, walkPose, RED } from './boy.js';

const W = 1080, H = 1920;

export function modelSheet(g) {
  D.ground(g, W, H, { vig: .4 });
  D.sunburst(g, W / 2, 760, { rays: 64, r1: 1500, mode: 'wedges', colorA: 'rgba(201,162,75,.07)' });
  T.titleBar(g, 'MODEL SHEET', W / 2, 110, { size: 60, sub: 'TOKOH UTAMA · "KAMU"' });
  // turnaround-ish: front, front walking, back, silhouette
  const y0 = 760, s = 3.2;
  drawBoy(g, { x: 190, y: y0, s, face: 'smile' });
  drawBoy(g, { x: 430, y: y0, s, face: 'joy', pose: walkPose(.25) });
  drawBoy(g, { x: 670, y: y0, s, view: 'back' });
  g.save(); g.filter = 'brightness(0)'; drawBoy(g, { x: 900, y: y0, s, face: 'smile', pose: POSES.cheer }); g.restore();
  for (const [x, l] of [[190, 'DEPAN'], [430, 'JALAN'], [670, 'BELAKANG'], [900, 'SILUET']]) T.goldText(g, l, x, y0 + 52, { size: 26, font: T.FONTS.sans, weight: 600, track: 4, shadow: false });
  // expressions (busts)
  const faces = ['smile', 'joy', 'surprise', 'wonder', 'heran', 'think', 'wait', 'warm'];
  faces.forEach((f, i) => {
    const cx = 135 + (i % 4) * 270, cy = 1150 + Math.floor(i / 4) * 330;
    g.save(); g.beginPath(); g.rect(cx - 120, cy - 150, 240, 250); g.clip();
    D.glow(g, cx, cy - 40, 160, '#ffcf7a', .12);
    drawBoy(g, { x: cx, y: cy + 490, s: 4.2, face: f, pose: f === 'think' ? POSES.think : POSES.stand });
    g.restore();
    D.gline(g, D.rectPts(cx - 120, cy - 150, 240, 250), { w: 1.4 });
    T.goldText(g, f.toUpperCase(), cx, cy + 128, { size: 22, font: T.FONTS.sans, weight: 600, track: 3, shadow: false });
  });
  // key poses
  const poses = [['stop', 'wait'], ['wag', 'nope'], ['phone', 'heran'], ['openArms', 'warm']];
  poses.forEach(([p, f], i) => drawBoy(g, { x: 150 + i * 260, y: 1880, s: 2.3, face: f, pose: POSES[p] }));
  // palette
  [['#c8102e', 'MERAH'], ['#c9a24b', 'EMAS'], ['#1d6b57', 'ZAMRUD'], ['#f2e8d5', 'GADING'], ['#0d0b09', 'HITAM']].forEach(([c, n], i) => {
    const x = 0; });
}

export function crowdTest(g) {
  D.ground(g, W, H, { vig: .4 });
  for (let i = 0; i < 8; i++) drawPerson(g, { x: 120 + i * 120, y: 900, s: 3, kind: i % 4, seed: i, red: i > 3 ? 1 : 0 });
  drawBoy(g, { x: W / 2, y: 1500, s: 4, face: 'warm', glow: 1 });
}
