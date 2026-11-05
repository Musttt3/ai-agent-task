// Shared helpers for the vertical (1080x1920) Art Deco film: framing, deco architecture, props.
import * as D from './engine/deco.js';
import * as T from './engine/type.js';
import * as B from './engine/bulbs.js';
import { facet, smoothPath } from './boy.js';
export { D, T, B };
export const W = 1080, H = 1920, CX = 540;
export const { clamp, lerp, seg, ss, eio, eo, ei, back, TAU, mix, rgba, hash } = D;
export const SUB_Y = 1462;                         // subtitle card centre (above TikTok's bottom UI)

export function bg(g, top = '#16100a', bot = '#050403', vig = .5) { D.ground(g, W, H, { top, bot, vig }); }
// scale about a focal point that stays put on screen
export function zoomAt(g, fx, fy, s) { g.translate(fx, fy); g.scale(s, s); g.translate(-fx, -fy); }
export const pulse = (t, t0, len = .25) => { const k = (t - t0) / len; return k < 0 || k > 1 ? 0 : Math.sin(k * Math.PI); };
// mechanical settle: overshoot then settle on 1 (ease-in-out with a small bounce), like machinery
export function settle(k) { k = clamp(k); const e = eio(Math.min(1, k * 1.15)); return e + Math.sin(clamp((k - .8) / .2) * Math.PI) * .04 * (1 - k); }

// gold-rimmed lacquer slab (cabinet, phone, plaque) with airbrush
export function slab(g, x, y, w, h, { r = 10, base = '#1a130d', light = null, dark = null, rim = 2.4, double = 0, sheen = .4 } = {}) {
  const p = new Path2D(); p.roundRect(x, y, w, h, r);
  D.airbrush(g, p, { base, light: light || mix(base, '#ffffff', .18), dark: dark || mix(base, '#000000', .6), bbox: [x, y, x + w, y + h] });
  D.gline(g, D.rectPts(x, y, w, h), { w: rim, sheen, bb: [x, y, x + w, y + h] });
  if (double) D.gline(g, D.rectPts(x + double, y + double, w - 2 * double, h - 2 * double), { w: rim * .45, sheen: sheen + .2, bb: [x, y, x + w, y + h] });
  return p;
}

// stepped setback skyscraper (front elevation). x = centre, base = ground y, w, h. Windows lit by litFn(i) 0..1.
export function skyscraper(g, x, base, w, h, { steps = 3, body = '#14100b', bodyL = '#3a2d1c', spire = 'needle', lit = null, seed = 1, piers = 5, sheen = .4, glow = 0 } = {}) {
  const tiers = []; let tw = w, ty = base, th = h * .52;
  for (let i = 0; i <= steps; i++) { tiers.push([tw, ty, th]); ty -= th; tw *= .72; th = h * (.48 / steps) * (1 - i * .08); }
  let k = 0;
  tiers.forEach(([tw, ty, th], i) => {
    const x0 = x - tw / 2, y0 = ty - th;
    const p = new Path2D(); p.rect(x0, y0, tw, th);
    D.airbrush(g, p, { base: body, light: bodyL, dark: '#040302', dir: -2.4, bbox: [x0, y0, x0 + tw, ty] });
    // windows grid
    const cols = Math.max(2, Math.round(tw / 26)), rows = Math.max(2, Math.round(th / 34)), cw = tw / cols, rh = th / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const v = lit ? lit(k++, r, c) : (hash(seed * 31 + k++ * 7.3) > .55 ? .8 : 0);
      g.fillStyle = v > 0 ? rgba('#ffd27a', .25 + .6 * v) : 'rgba(40,30,18,.85)';
      g.fillRect(x0 + c * cw + cw * .3, y0 + r * rh + rh * .25, cw * .4, rh * .5);
    }
    for (let j = 0; j <= piers; j++) { const px = x0 + tw * j / piers; D.gline(g, [[px, y0], [px, ty]], { w: j % piers ? .9 : 1.8, sheen, alpha: .8 }); }
    D.gline(g, [[x0 - 4, y0], [x0 + tw + 4, y0]], { w: 2.2, sheen });
  });
  const [tw2, ty2] = tiers[tiers.length - 1], top = ty2 - tiers[tiers.length - 1][2];
  if (spire === 'needle') { D.drawShape(g, [[x - 5, top], [x, top - h * .2], [x + 5, top]], { lw: 1.4, sheen }); }
  else if (spire === 'crown') { D.sunburst(g, x, top, { rays: 9, r0: 4, r1: tw2 * .55, a0: Math.PI, a1: TAU, mode: 'lines', w: 2.2, sheen }); }
  if (glow) D.glow(g, x, top, tw2 * 1.2, '#ffcf7a', .3 * glow);
  return top;
}

// deco tree: lacquer emerald disc on a gold-ringed post
export function tree(g, x, base, r, { sheen = .4 } = {}) {
  D.gline(g, [[x, base], [x, base - r * 1.6]], { w: Math.max(1.2, r * .09), sheen });
  const p = new Path2D(); p.arc(x, base - r * 2.3, r, 0, TAU);
  D.airbrush(g, p, { base: '#1d6b57', light: '#4fae8e', dark: '#062019', rim: Math.max(1, r * .06), bbox: [x - r, base - r * 3.3, x + r, base - r * 1.3] });
  D.gline(g, D.arcPts(x, base - r * 2.3, r * .62, Math.PI * 1.1, Math.PI * 1.6, 12), { w: Math.max(.6, r * .035), alpha: .7 });
}

// lamp post with a globe
export function lamp(g, x, base, h, on = 1) {
  D.gline(g, [[x, base], [x, base - h]], { w: Math.max(1, h * .02) });
  if (on) D.glow(g, x, base - h, h * .5, '#ffcf7a', .35 * on);
  g.beginPath(); g.arc(x, base - h, h * .07, 0, TAU); g.fillStyle = on ? '#fff0c8' : '#3a2a18'; g.fill();
}

// two door leaves hinged at the edges. k: 0 = open (off-frame), 1 = closed. Draws only the leaves.
export function leaves(g, k, { panel = '#0f0b08', gap = 0 } = {}) {
  if (k <= 0) return;
  const w = (W / 2 - gap / 2) * eio(k);
  for (const sd of [-1, 1]) {
    const x0 = sd < 0 ? 0 : W - w;
    g.save(); g.beginPath(); g.rect(x0, 0, w, H); g.clip();
    const p = new Path2D(); p.rect(x0, 0, w, H);
    D.airbrush(g, p, { base: panel, light: '#2e2216', dark: '#030202', dir: sd < 0 ? -.4 : -2.7, bbox: [x0, 0, x0 + w, H] });
    D.fishScale(g, x0, 80, w, H - 160, 34, { stroke: 'rgba(201,162,75,.38)', fillA: 'rgba(12,9,6,.0)' });
    const ex = sd < 0 ? x0 + w : x0;
    D.gline(g, [[ex, 0], [ex, H]], { w: 3, double: 6 });
    D.gline(g, D.rectPts(x0 + 30, 60, w - 60, H - 120), { w: 1.6, alpha: .9 });
    g.restore();
  }
}

// two-row subtitle card in the style's subtitle grammar (lacquer bar, stepped ends, double keyline), unfolding from the centre
function plaquePts(cx, cy, w, h, step = .14) {
  const hw = w / 2, hh = h / 2, s = Math.min(h * step, 16);
  return [[cx - hw, cy - hh], [cx + hw, cy - hh], [cx + hw, cy - hh + s], [cx + hw + s, cy - hh + s], [cx + hw + s, cy - hh + 2 * s], [cx + hw + 2 * s, cy - hh + 2 * s],
  [cx + hw + 2 * s, cy + hh - 2 * s], [cx + hw + s, cy + hh - 2 * s], [cx + hw + s, cy + hh - s], [cx + hw, cy + hh - s], [cx + hw, cy + hh],
  [cx - hw, cy + hh], [cx - hw, cy + hh - s], [cx - hw - s, cy + hh - s], [cx - hw - s, cy + hh - 2 * s], [cx - hw - 2 * s, cy + hh - 2 * s],
  [cx - hw - 2 * s, cy - hh + 2 * s], [cx - hw - s, cy - hh + 2 * s], [cx - hw - s, cy - hh + s], [cx - hw, cy - hh + s], [cx - hw, cy - hh]];
}
export function subCard(g, rows, { p = 1, out = 0, cx = CX, cy = SUB_Y, size = 44 } = {}) {
  const k = eio(clamp(p)) * (1 - eio(clamp(out)));
  if (k <= 0) return null;
  g.save();
  const tw = Math.max(...rows.map(r => T.measure(g, r, size, T.FONTS.sans, 1, 600)));
  const rowH = size * 1.22, Wd = Math.min(960, tw + size * 1.6), Hd = rows.length * rowH + size * .9;
  const w = Wd * ss(seg(k, 0, .7)), hh = Hd / 2 * ss(seg(k, .15, .75));
  D.gline(g, [[cx - w / 2 - 20, cy], [cx + w / 2 + 20, cy]], { w: 1.4, alpha: 1 - ss(seg(k, .3, .8)) });
  if (hh > 1) {
    const pts = plaquePts(cx, cy, w, hh * 2);
    g.fillStyle = 'rgba(6,5,4,.9)'; g.fill(D.toPath(pts, true));
    D.gline(g, pts, { w: 2, closed: true, bb: [cx - Wd / 2, cy - Hd, cx + Wd / 2, cy + Hd], sheen: .35 });
    if (hh > 12) D.gline(g, plaquePts(cx, cy, w - 14, hh * 2 - 14), { w: .9, closed: true, bb: [cx - Wd / 2, cy - Hd, cx + Wd / 2, cy + Hd], sheen: .6 });
  }
  const ta = ss(seg(k, .6, 1));
  if (ta > 0) {
    g.globalAlpha *= ta; g.font = `600 ${size}px ${T.FONTS.sans}`; if ('letterSpacing' in g) g.letterSpacing = '1px';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = D.C.ivory;
    rows.forEach((r, i) => g.fillText(r, cx, cy + (i - (rows.length - 1) / 2) * rowH + size * .08));
  }
  g.restore();
  return [cx - Wd / 2, cy - Hd / 2, cx + Wd / 2, cy + Hd / 2];
}

// a falling gold coin (seen at an angle): disc with an edge
export function coin(g, x, y, r, spin, { alpha = 1 } = {}) {
  const sx = Math.max(.12, Math.abs(Math.cos(spin)));
  g.save(); g.globalAlpha *= alpha; g.translate(x, y);
  g.beginPath(); g.ellipse(r * .1 * Math.sign(Math.cos(spin)), r * .06, r * sx, r, 0, 0, TAU); g.fillStyle = '#6f5220'; g.fill();
  g.beginPath(); g.ellipse(0, 0, r * sx, r, 0, 0, TAU); g.fillStyle = D.goldGrad(g, -r, -r, r, r, { sheen: .3 + .4 * Math.sin(spin) }); g.fill();
  g.beginPath(); g.ellipse(0, 0, r * sx * .72, r * .72, 0, 0, TAU); g.strokeStyle = 'rgba(111,82,32,.9)'; g.lineWidth = Math.max(1, r * .08); g.stroke();
  g.restore();
}
export { facet, smoothPath };
