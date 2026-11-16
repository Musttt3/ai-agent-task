// Flat inked effect cards for "You're a Doctor in 1348" (our own drawings): the rat, the flea, the magnifier bubble with
// Yersinia pestis rods (dark "safety-pin" ends = bipolar staining), the smug bacterium, question marks, the pop puff.
import { Pen, INK, fxPuff, fxBurst } from "./toon";
import { drawCard } from "./cast";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;

/** rat in profile facing right on a 600 x 300 canvas; k = run drawing 0..3, sit = stopped and looking at us */
export const ratTex = (k: number, sit = false) => drawCard(`rat|${k}|${sit}`, 600, 300, (g) => {
  const p = new Pen(g); p.ol = 7;
  const fur = "#7a6a5e", belly = "#a8968a", pink = "#e8a0a8";
  // tail
  const tw = sit ? 0 : 14 * Math.sin((k * Math.PI) / 2);
  p.line([[150, 200], [100, 205 + tw], [55, 190 - tw], [20, 205]], pink, 7);
  // legs
  const leg = (x: number, ph: number) => { const s = sit ? 0 : 16 * Math.sin((k * Math.PI) / 2 + ph); p.line([[x, 215], [x + s, 262]], pink, 9); };
  leg(190, 0); leg(330, Math.PI);
  // body
  p.ell(260, 195, 125, 70, fur, 7);
  p.ell(270, 232, 85, 24, belly, 0);
  leg(215, Math.PI); leg(355, 0);
  // head
  const hx = sit ? 400 : 410, hy = sit ? 150 : 170;
  p.poly([[hx - 40, hy - 40], [hx + 90, hy + 18], [hx - 20, hy + 52]], fur, 7);
  p.ell(hx - 10, hy - 52, 26, 30, fur, 7); p.ell(hx - 10, hy - 50, 13, 17, pink, 0);
  p.dot(hx + 90, hy + 18, 10, "#2a1a1e");
  if (sit) { p.ell(hx + 22, hy - 4, 9, 11, "#ffffff", 3); p.dot(hx + 25, hy - 2, 5); }
  else p.dot(hx + 28, hy - 2, 7);
  for (const dy of [-8, 6]) p.stroke([[hx + 70, hy + 18], [hx + 112, hy + 10 + dy]], 2.5);
});

/** a flea in profile on a 300 x 300 canvas; legs tucked (k=0) or kicked out (k=1) */
export const fleaTex = (k: number) => drawCard(`flea|${k}`, 300, 300, (g) => {
  const p = new Pen(g); p.ol = 6;
  const col = "#7a4a2a";
  p.ell(150, 140, 78, 60, col, 6, 0, 360, -12);
  p.ell(214, 120, 30, 26, col, 6);
  p.dot(222, 112, 6);
  p.stroke([[238, 128], [262, 150]], 4);
  for (let i = 0; i < 3; i++) {
    const x = 120 + i * 40, out = k ? 40 + i * 10 : 0;
    p.line([[x, 185], [x - 20 - out, 230 + (k ? 10 : 0)], [x - 10 - out * 1.4, 268]], col, 7);
  }
  for (const [x, y] of [[110, 110], [150, 96], [180, 120]] as const) p.ell(x, y, 8, 5, "rgba(255,255,255,0.35)", 0);
});

/** one rod bacterium: capsule with dark ends (bipolar staining) */
const rod = (p: Pen, x: number, y: number, len: number, w: number, a: number, wig: number) => {
  const c = Math.cos(a), s = Math.sin(a), pts: P2[] = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8 - 0.5; pts.push([x + c * t * len - s * wig * Math.sin(t * Math.PI * 2), y + s * t * len + c * wig * Math.sin(t * Math.PI * 2)]); }
  p.line(pts, "#c46a9a", w);
  p.dot(pts[1][0], pts[1][1], w * 0.42, "#6a2a5a"); p.dot(pts[7][0], pts[7][1], w * 0.42, "#6a2a5a");
};

/** the magnifier: brass ring and handle, pale stained field with wiggling rods; k = wiggle drawing 0..3 */
export const scopeTex = (k: number) => drawCard(`scope|${k}`, 640, 640, (g) => {
  const p = new Pen(g); p.ol = 9;
  p.line([[470, 470], [600, 600]], "#8a5a34", 34);
  p.ell(300, 300, 260, 260, "#c9a24a", 10);
  p.ell(300, 300, 228, 228, "#f6e6ec", 8);
  g.save(); g.beginPath(); g.arc(300, 300, 224, 0, Math.PI * 2); g.clip();
  const R: [number, number, number][] = [[200, 210, 0.3], [330, 170, 2.2], [420, 290, 1.1], [250, 340, -0.6], [360, 400, 0.6], [170, 330, 1.8], [300, 270, 2.8], [430, 190, -1.2], [210, 450, 0.2], [330, 470, 2.5], [470, 380, 1.5]];
  R.forEach(([x, y, a], i) => rod(p, x + 6 * Math.sin(k * 1.6 + i), y + 6 * Math.cos(k * 1.3 + i * 2), 78, 26, a + 0.12 * Math.sin(k * 1.7 + i), 5 * Math.sin(k * 1.57 + i)));
  g.restore();
  p.ell(220, 200, 60, 34, "rgba(255,255,255,0.45)", 0, 0, 360, -35);
});

/** the invisible enemy: a big rod bacterium with a smug little face on a 512 x 256 canvas; k = wiggle 0..3 */
export const bugTex = (k: number, v = 0) => drawCard(`bug|${k}|${v}`, 512, 256, (g) => {
  const p = new Pen(g); p.ol = 8;
  const a = rad(-8 + 6 * Math.sin(k * 1.57 + v)), wig = 8 * Math.sin(k * 1.57 + v);
  const pts: P2[] = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10 - 0.5; pts.push([256 + Math.cos(a) * t * 380 - Math.sin(a) * wig * Math.sin(t * 6.28), 128 + Math.sin(a) * t * 380 + Math.cos(a) * wig * Math.sin(t * 6.28)]); }
  p.line(pts, "#c46a9a", 120);
  p.dot(pts[1][0], pts[1][1], 46, "#7a2f68"); p.dot(pts[9][0], pts[9][1], 46, "#7a2f68");
  // smug face in the middle
  const [fx, fy] = pts[5];
  p.arc(fx - 26, fy - 6, 13, 8, 200, 340, 7); p.arc(fx + 26, fy - 6, 13, 8, 200, 340, 7);
  p.stroke([[fx - 40, fy - 28], [fx - 14, fy - 22]], 6); p.stroke([[fx + 14, fy - 22], [fx + 40, fy - 30]], 6);
  p.arc(fx + 4, fy + 14, 22, 12, 15, 165, 7);
  // little cilia
  for (let i = 1; i < 10; i += 2) { const [x, y] = pts[i]; p.stroke([[x, y - 58], [x + 8, y - 80]], 5); p.stroke([[x, y + 58], [x - 8, y + 80]], 5); }
});

/** three question marks (cartoon symbols) on a 512 x 512 canvas; t pops them in 0..1 */
export const qTex = (t: number) => drawCard(`q|${t.toFixed(2)}`, 512, 512, (g) => {
  const p = new Pen(g); p.ol = 6;
  const q = (x: number, y: number, s: number, a: number) => {
    if (s <= 0.01) return;
    const R = (pts: P2[]) => pts.map(([px, py]) => { const dx = px * s, dy = py * s, c = Math.cos(a), sn = Math.sin(a); return [x + dx * c - dy * sn, y + dx * sn + dy * c] as P2; });
    const hook: P2[] = [];
    for (let i = 0; i <= 14; i++) { const b = rad(200 + (i / 14) * 250); hook.push([46 * Math.cos(b), -40 + 46 * Math.sin(b)]); }
    hook.push([0, 30], [0, 52]);
    p.line(R(hook), "#ffe27a", 26 * s, true);
    const [dx, dy] = R([[0, 100]])[0];
    p.dot(dx, dy, 22 * s, INK); p.dot(dx, dy, 15 * s, "#ffe27a");
  };
  const e = (d: number) => { const x = Math.max(0, Math.min(1, (t - d) / 0.4)); return x < 1 ? 1.25 * Math.sin(x * Math.PI * 0.6) / Math.sin(Math.PI * 0.6) * Math.min(1, x * 1.4) : 1; };
  q(150, 300, 1.05 * e(0), -0.25); q(270, 190, 1.3 * e(0.2), 0.05); q(390, 290, 0.95 * e(0.4), 0.3);
});

/** pop puff when a colleague vanishes (300 x 300) */
export const popTex = (t: number) => drawCard(`pop|${t.toFixed(2)}`, 300, 300, (g) => fxPuff(new Pen(g), t));
export const burstTex = (t: number) => drawCard(`burst|${t.toFixed(2)}`, 500, 500, (g) => fxBurst(new Pen(g), t, "#fff3b0", 12, 50, 240));
/** soft round contact shadow */
export const blobTex = () => drawCard("contact", 128, 64, (g) => {
  const gr = g.createRadialGradient(64, 32, 0, 64, 32, 62); gr.addColorStop(0, "rgba(20,14,30,0.55)"); gr.addColorStop(0.6, "rgba(20,14,30,0.3)"); gr.addColorStop(1, "rgba(20,14,30,0)");
  g.setTransform(1, 0, 0, 0.5, 0, 16); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
