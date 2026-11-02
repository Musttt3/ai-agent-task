// Painted Canvas2D textures: limestone, the ice-age animals (our own drawings in the Lascaux manner: ochre, red-brown
// and black pigment, thick black contours), algae growth, ground, bark, sky. Deterministic (seeded) so every frame and
// every render worker paints the same pixels.
import * as THREE from "three";

export const rng = (seed: number) => {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
};

const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return [c, c.getContext("2d")!] as const;
};

export const tex = (c: HTMLCanvasElement, repeat = false, srgb = true) => {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

/** soft blotches of a colour, wrapped so the texture tiles */
const blotches = (g: CanvasRenderingContext2D, w: number, h: number, r: () => number, n: number, cols: string[], rMin: number, rMax: number, alpha: number) => {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rad = rMin + r() * (rMax - rMin);
    for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) {
      const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad);
      const c = cols[Math.floor(r() * cols.length) % cols.length];
      gr.addColorStop(0, c); gr.addColorStop(1, c + "00");
      g.globalAlpha = alpha; g.fillStyle = gr;
      g.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2);
    }
  }
  g.globalAlpha = 1;
};

/** cream limestone with ochre stains, grey patches and a few dark hairline cracks */
export const rockTexture = (seed = 3, base = "#e9d6b0") => {
  const [c, g] = canvas(1024, 1024), r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
  blotches(g, 1024, 1024, r, 70, ["#d9b98a", "#f3e6c8", "#cdb08a", "#e2c79a"], 60, 220, 0.55);
  blotches(g, 1024, 1024, r, 40, ["#b9a68e", "#a8907a"], 20, 80, 0.35);
  g.strokeStyle = "#6e5a48"; g.lineCap = "round";
  for (let i = 0; i < 18; i++) {
    let x = r() * 1024, y = r() * 1024;
    g.globalAlpha = 0.35 + r() * 0.25; g.lineWidth = 1.5 + r() * 2;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 90; y += 20 + r() * 50; g.lineTo(x, y); }
    g.stroke();
  }
  g.globalAlpha = 1;
  return tex(c, true);
};

export const groundTexture = (seed: number, base: string, cols: string[], specks: string[]) => {
  const [c, g] = canvas(1024, 1024), r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
  blotches(g, 1024, 1024, r, 90, cols, 50, 200, 0.5);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = specks[i % specks.length]; g.globalAlpha = 0.5;
    const x = r() * 1024, y = r() * 1024, s = 2 + r() * 4;
    g.fillRect(x, y, s, s * 0.6);
  }
  g.globalAlpha = 1;
  return tex(c, true);
};

// ---------------- the paintings ----------------
const PIG = { black: "#1c1410", red: "#93361c", ochre: "#c8862c", yellow: "#d9a54a", brown: "#6b3a1f" };

/** brushy stroke: a few jittered passes so the line reads as pigment, not vector */
const brush = (g: CanvasRenderingContext2D, pts: [number, number][], w: number, col: string, r: () => number, passes = 3) => {
  g.strokeStyle = col; g.lineCap = "round"; g.lineJoin = "round";
  for (let p = 0; p < passes; p++) {
    g.globalAlpha = 0.55 + 0.3 * r(); g.lineWidth = w * (0.75 + 0.4 * r());
    g.beginPath();
    pts.forEach(([x, y], i) => {
      const jx = x + (r() - 0.5) * w * 0.35, jy = y + (r() - 0.5) * w * 0.35;
      if (i === 0) g.moveTo(jx, jy); else g.lineTo(jx, jy);
    });
    g.stroke();
  }
  g.globalAlpha = 1;
};

/** smooth closed blob through control points (Catmull-Rom) */
const blob = (g: CanvasRenderingContext2D, pts: [number, number][]) => {
  const n = pts.length;
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    if (i === 0) g.moveTo(p1[0], p1[1]);
    g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  g.closePath();
};
const ring = (pts: [number, number][], n = 8): [number, number][] => {
  const out: [number, number][] = [], m = pts.length;
  for (let i = 0; i <= m * n; i++) {
    const k = (i / n) | 0, t = (i % n) / n;
    const p0 = pts[(k - 1 + m) % m], p1 = pts[k % m], p2 = pts[(k + 1) % m], p3 = pts[(k + 2) % m];
    const t2 = t * t, t3 = t2 * t;
    const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
    out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
  }
  return out;
};

/** pigment fill clipped to a body: a base wash plus darker mottling, ragged like blown pigment */
const wash = (g: CanvasRenderingContext2D, body: [number, number][], col: string, dark: string, r: () => number, a = 0.8) => {
  g.save(); blob(g, body); g.clip();
  g.globalAlpha = a; g.fillStyle = col; g.fill();
  const xs = body.map((p) => p[0]), ys = body.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  for (let i = 0; i < 60; i++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), rad = 10 + r() * 40;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, i % 3 ? dark + "66" : "#00000000"); gr.addColorStop(1, dark + "00");
    g.fillStyle = gr; g.globalAlpha = 0.6; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  g.restore(); g.globalAlpha = 1;
};

/** the great aurochs (bull): black contour, red-brown patches, big lyre horns. Canvas 2048 x 900, facing left. */
export const paintBull = (seed = 11) => {
  const [c, g] = canvas(2048, 900), r = rng(seed);
  const body: [number, number][] = [[420, 330], [560, 190], [760, 150], [900, 200], [1250, 230], [1560, 260], [1760, 330], [1800, 470], [1700, 560],
    [1560, 600], [1200, 610], [800, 600], [520, 560], [380, 470], [330, 380]];
  wash(g, body, PIG.red, PIG.brown, r, 0.55);
  // black head and forequarters wash (the Lascaux bulls are darker at the front)
  const head: [number, number][] = [[200, 330], [300, 250], [430, 240], [560, 270], [640, 360], [620, 480], [520, 540], [380, 520], [260, 470], [170, 420]];
  wash(g, head, PIG.black, PIG.black, r, 0.82);
  // spots
  for (let i = 0; i < 26; i++) { g.fillStyle = PIG.black; g.globalAlpha = 0.75; g.beginPath(); g.arc(700 + r() * 900, 300 + r() * 240, 8 + r() * 14, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  // contour
  brush(g, ring(body), 18, PIG.black, r);
  brush(g, ring(head), 16, PIG.black, r);
  // horns: two lyre curves
  brush(g, [[300, 270], [250, 190], [250, 110], [310, 50], [400, 40]], 34, PIG.black, r, 4);
  brush(g, [[420, 255], [450, 170], [520, 110], [610, 95], [680, 120]], 30, PIG.black, r, 4);
  // legs
  const legs: [number, number][][] = [[[620, 570], [610, 700], [600, 820]], [[760, 590], [770, 720], [780, 830]], [[1450, 600], [1430, 720], [1420, 830]], [[1600, 580], [1630, 700], [1660, 820]]];
  for (const l of legs) { brush(g, l, 50, PIG.black, r, 4); const [hx, hy] = l[2]; g.fillStyle = PIG.black; g.beginPath(); g.ellipse(hx, hy + 10, 34, 20, 0, 0, 7); g.fill(); }
  // tail
  brush(g, [[1780, 360], [1880, 420], [1920, 560], [1900, 680]], 12, PIG.black, r);
  // eye + muzzle
  g.fillStyle = "#e8d6b0"; g.beginPath(); g.ellipse(330, 340, 16, 10, 0, 0, 7); g.fill();
  return tex(c);
};

/** a horse: yellow-ochre body, black mane, legs and head. Canvas 1400 x 900, facing left. */
export const paintHorse = (seed = 21) => {
  const [c, g] = canvas(1400, 900), r = rng(seed);
  const body: [number, number][] = [[360, 330], [520, 300], [800, 290], [1050, 300], [1200, 360], [1220, 480], [1120, 560], [820, 590], [520, 570], [380, 500]];
  wash(g, body, PIG.yellow, PIG.ochre, r, 0.85);
  const head: [number, number][] = [[130, 300], [210, 210], [330, 170], [420, 220], [460, 330], [400, 420], [300, 420], [190, 380]];
  wash(g, head, PIG.black, PIG.black, r, 0.85);
  brush(g, ring(body), 16, PIG.black, r);
  brush(g, [[300, 180], [380, 150], [470, 180], [560, 240], [640, 290]], 34, PIG.black, r, 4); // mane
  const legs: [number, number][][] = [[[480, 560], [470, 690], [490, 820]], [[600, 580], [620, 700], [640, 830]], [[1000, 570], [990, 700], [1000, 820]], [[1130, 540], [1160, 680], [1180, 810]]];
  for (const l of legs) brush(g, l, 30, PIG.black, r, 4);
  brush(g, [[1210, 380], [1300, 470], [1330, 620]], 22, PIG.black, r, 4); // tail
  return tex(c);
};

/** a red stag with branching antlers. Canvas 1200 x 1000, facing left. */
export const paintStag = (seed = 31) => {
  const [c, g] = canvas(1200, 1000), r = rng(seed);
  const body: [number, number][] = [[330, 520], [500, 480], [760, 480], [960, 510], [1020, 600], [960, 680], [700, 700], [460, 690], [340, 620]];
  wash(g, body, PIG.red, PIG.brown, r, 0.7);
  brush(g, ring(body), 14, PIG.red, r);
  brush(g, ring(body), 6, PIG.black, r, 2);
  const neck: [number, number][] = [[200, 420], [270, 360], [360, 380], [420, 470], [380, 560], [290, 540], [210, 490]];
  wash(g, neck, PIG.red, PIG.black, r, 0.8);
  brush(g, ring(neck), 12, PIG.black, r);
  // antlers: main beams with tines
  const beam = (x0: number, dir: number) => {
    const pts: [number, number][] = [[x0, 360], [x0 - 20 * dir, 260], [x0 + 10 * dir, 160], [x0 + 60 * dir, 70]];
    brush(g, pts, 12, PIG.black, r, 3);
    for (let i = 1; i < 4; i++) { const [x, y] = pts[i]; brush(g, [[x, y], [x + (50 + 20 * i) * dir, y - 40]], 9, PIG.black, r, 2); brush(g, [[x, y], [x - 40 * dir, y - 50]], 8, PIG.black, r, 2); }
  };
  beam(260, -1); beam(320, 1);
  const legs: [number, number][][] = [[[430, 680], [420, 820], [430, 950]], [[540, 690], [560, 830], [570, 950]], [[860, 690], [850, 820], [860, 950]], [[960, 650], [990, 800], [1000, 940]]];
  for (const l of legs) brush(g, l, 20, PIG.black, r, 3);
  return tex(c);
};

/** a row of red dots and a hand stencil: small marks for the frieze */
export const paintMarks = (seed = 41) => {
  const [c, g] = canvas(800, 400), r = rng(seed);
  for (let i = 0; i < 9; i++) { g.fillStyle = PIG.red; g.globalAlpha = 0.85; g.beginPath(); g.arc(60 + i * 80 + r() * 10, 120 + r() * 20, 22 + r() * 6, 0, 7); g.fill(); }
  // hand stencil: blown pigment around a hand
  const cx = 560, cy = 290;
  const gr = g.createRadialGradient(cx, cy, 20, cx, cy, 140);
  gr.addColorStop(0, PIG.red + "cc"); gr.addColorStop(1, PIG.red + "00");
  g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(cx - 150, cy - 150, 300, 300);
  g.globalCompositeOperation = "destination-out";
  g.beginPath(); g.ellipse(cx, cy + 30, 55, 65, 0, 0, 7); g.fill();
  for (let k = 0; k < 4; k++) { g.save(); g.translate(cx - 45 + k * 30, cy - 30); g.rotate((k - 1.5) * 0.12); g.fillRect(-11, -90, 22, 95); g.restore(); }
  g.save(); g.translate(cx + 70, cy + 20); g.rotate(-0.9); g.fillRect(-11, -70, 22, 75); g.restore();
  g.globalCompositeOperation = "source-over";
  return tex(c);
};

/** algae + mould overlay: rgb = colour (green film with white and black mould spots), plus a growth-order map
 *  (0 = grows first) so a single uniform reveals it over time. */
export const growthTextures = (seed = 51) => {
  const [c, g] = canvas(1024, 512), r = rng(seed);
  g.fillStyle = "#3f8f3a"; g.fillRect(0, 0, 1024, 512);
  blotches(g, 1024, 512, r, 80, ["#2f7a2e", "#5aa846", "#1f5e26", "#79b84f"], 20, 90, 0.7);
  const [o, go] = canvas(256, 128), r2 = rng(seed + 7);
  // growth order = distance to the nearest seed (wrapped, so the map tiles), plus ragged noise: 0 grows first
  const seeds = Array.from({ length: 16 }, () => [r2() * 256, r2() * 128, 0.7 + 0.6 * r2()]);
  const id = go.createImageData(256, 128), r3 = rng(seed + 9);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 256; x++) {
    let d = 1e9;
    for (const [sx, sy, k] of seeds) { const dx = Math.min(Math.abs(x - sx), 256 - Math.abs(x - sx)), dy = Math.min(Math.abs(y - sy), 128 - Math.abs(y - sy)); d = Math.min(d, Math.hypot(dx, dy) / k); }
    const n = 0.12 * Math.sin(x * 0.31 + y * 0.17) * Math.cos(y * 0.43 - x * 0.07) + (r3() - 0.5) * 0.1;
    const v = Math.max(0, Math.min(255, 255 * (d / 70 + n)));
    const i = (y * 256 + x) * 4; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255;
  }
  go.putImageData(id, 0, 0);
  // mould spots (separate layer, revealed by its own uniform): alpha canvas
  const [m, gm] = canvas(1024, 512), r4 = rng(seed + 13);
  for (let i = 0; i < 160; i++) {
    gm.fillStyle = i % 3 ? "#f1f1ea" : "#141414"; gm.globalAlpha = 0.9;
    gm.beginPath(); gm.arc(r4() * 1024, r4() * 512, 3 + r4() * 9, 0, 7); gm.fill();
  }
  const t = tex(c, true), ord = tex(o, true, false), mould = tex(m, true);
  ord.magFilter = THREE.LinearFilter;
  return { color: t, order: ord, mould };
};

/** vertical sky gradient as a texture for a back-side sphere */
export const skyTexture = (top: string, mid: string, horizon: string) => {
  const [c, g] = canvas(16, 512);
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, top); gr.addColorStop(0.42, mid); gr.addColorStop(0.5, horizon); gr.addColorStop(1, horizon);
  g.fillStyle = gr; g.fillRect(0, 0, 16, 512);
  return tex(c);
};

/** soft round puff (breath, steam, dust) as an alpha sprite */
export const puffTexture = () => {
  const [c, g] = canvas(256, 256), r = rng(77);
  for (let i = 0; i < 7; i++) {
    const x = 128 + (r() - 0.5) * 90, y = 128 + (r() - 0.5) * 60, rad = 50 + r() * 40;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, "rgba(255,255,255,0.75)"); gr.addColorStop(0.6, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  }
  return tex(c);
};

/** flame for the torch: inked flat flame shape (orange, yellow core) */
export const flameTexture = (k: number) => {
  const [c, g] = canvas(128, 256), r = rng(90 + k);
  const pts = (s: number, w: number): [number, number][] => [[64, 250], [64 - w, 200], [64 - w * 0.8 - r() * 8, 140], [64 - w * 0.3, 60 + r() * 20], [64 + (r() - 0.5) * 20, 10 + r() * 20], [64 + w * 0.4, 70 + r() * 20], [64 + w * 0.85 + r() * 8, 150], [64 + w, 205]].map(([x, y]) => [64 + (x - 64) * s, 250 - (250 - y) * s] as [number, number]);
  g.lineJoin = "round";
  blob(g, pts(1, 52)); g.fillStyle = "#ff8a1e"; g.fill(); g.lineWidth = 7; g.strokeStyle = "#241726"; g.stroke();
  blob(g, pts(0.62, 30)); g.fillStyle = "#ffd75a"; g.fill();
  return tex(c);
};
