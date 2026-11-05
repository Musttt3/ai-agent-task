// Screen content drawn on canvases: the fictional TV news (shot 04-06: a gold map of Indonesia spinning in, no
// channel name, no ticker text) and the phone UI (shot 10-12: job, wallet and basket icons, no numbers, no app names).
import * as THREE from "three";
type Geo = number[][][][];
let islands: [number, number][][] = [];
export function setGeo(g: { geometry: { coordinates: Geo } }) {
  const area = (r: number[][]) => Math.abs(r.reduce((s, p, i) => s + p[0] * r[(i + 1) % r.length][1] - r[(i + 1) % r.length][0] * p[1], 0)) / 2;
  islands = g.geometry.coordinates.map((p) => p[0] as [number, number][]).filter((r) => area(r) > 0.05);
}
function drawMap(g: CanvasRenderingContext2D, cx: number, cy: number, w: number, spin: number, col: string) {
  const sx = (w / 46) * Math.cos(spin), sy = w / 46;
  g.fillStyle = col; g.strokeStyle = "rgba(90,60,10,0.9)"; g.lineWidth = 1.5;
  for (const r of islands) {
    g.beginPath(); r.forEach(([lo, la], i) => { const x = cx + (lo - 118) * sx, y = cy - (la + 2.5) * sy; if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); g.fill(); g.stroke();
  }
}
export class Screen {
  cv = document.createElement("canvas"); g: CanvasRenderingContext2D; tex: THREE.CanvasTexture;
  constructor(w: number, h: number) { this.cv.width = w; this.cv.height = h; this.g = this.cv.getContext("2d")!; this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.flipY = false; }
}
export function drawTV(s: Screen, f: number) {
  const g = s.g, W = s.cv.width, H = s.cv.height;
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#0d2a5c"); gr.addColorStop(1, "#06152e");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 9; i++) { g.strokeStyle = "rgba(120,170,255,0.12)"; g.beginPath(); g.arc(W / 2, H * 0.48, 40 + i * 28 + (f % 28), 0, 7); g.stroke(); }
  const t = Math.max(0, Math.min(1, (f - 234) / 18)), spin = (1 - t) * Math.PI * 0.5 + Math.sin(f / 25) * 0.15;
  if (f >= 220) drawMap(g, W / 2, H * 0.48, W * 0.8 * (0.6 + 0.4 * t), spin, "#e8b64a");
  g.fillStyle = "#c8282e"; g.fillRect(0, H * 0.8, W * 0.32, H * 0.1);                 // lower-third bars, no text
  g.fillStyle = "#f2f2f2"; g.fillRect(W * 0.32, H * 0.8, W * 0.68, H * 0.1);
  g.fillStyle = "#c9cfd8"; for (let i = 0; i < 5; i++) g.fillRect(W * 0.36 + i * W * 0.12, H * 0.835, W * 0.08, H * 0.03);
  s.tex.needsUpdate = true;
}
const pop = (f: number, a: number) => (f < a ? 0 : Math.min(1, (f - a) / 6) * (1 + 0.15 * Math.sin(Math.min(1, (f - a) / 6) * Math.PI)));
export function drawPhone(s: Screen, f: number) {
  const g = s.g, W = s.cv.width, H = s.cv.height;
  g.fillStyle = "#f4f7fb"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#2e7d6b"; g.fillRect(0, 0, W, H * 0.08);
  const card = (y: number, k: number, icon: (x: number, y: number, s: number) => void, col: string) => {
    if (k <= 0) return;
    g.save(); g.translate(W / 2, y); g.scale(k, k);
    g.fillStyle = "#ffffff"; g.strokeStyle = "#d8dee8"; g.lineWidth = 3; roundRect(g, -W * 0.4, -H * 0.11, W * 0.8, H * 0.22, 24); g.fill(); g.stroke();
    g.fillStyle = col; roundRect(g, -W * 0.33, -H * 0.075, H * 0.15, H * 0.15, 18); g.fill(); icon(-W * 0.33 + H * 0.075, 0, H * 0.05);
    g.fillStyle = "#cfd6e2"; for (let i = 0; i < 3; i++) roundRect(g, -W * 0.05, -H * 0.05 + i * H * 0.04, W * (0.38 - i * 0.08), H * 0.022, 8), g.fill();
    g.restore();
  };
  const brief = (x: number, y: number, s_: number) => { g.fillStyle = "#6b3e1e"; roundRect(g, x - s_, y - s_ * 0.6, s_ * 2, s_ * 1.4, 6); g.fill(); g.strokeStyle = "#6b3e1e"; g.lineWidth = s_ * 0.25; g.strokeRect(x - s_ * 0.4, y - s_ * 0.95, s_ * 0.8, s_ * 0.4); };
  const wallet = (x: number, y: number, s_: number) => { g.fillStyle = "#3a5bb0"; roundRect(g, x - s_, y - s_ * 0.7, s_ * 2, s_ * 1.4, 8); g.fill(); g.fillStyle = "#e8b64a"; g.beginPath(); g.arc(x + s_ * 0.55, y, s_ * 0.22, 0, 7); g.fill(); };
  const basket = (x: number, y: number, s_: number) => { g.fillStyle = "#c0392b"; g.beginPath(); g.moveTo(x - s_, y - s_ * 0.2); g.lineTo(x + s_, y - s_ * 0.2); g.lineTo(x + s_ * 0.7, y + s_ * 0.8); g.lineTo(x - s_ * 0.7, y + s_ * 0.8); g.fill(); g.strokeStyle = "#c0392b"; g.lineWidth = s_ * 0.2; g.beginPath(); g.arc(x, y - s_ * 0.2, s_ * 0.6, Math.PI, 0); g.stroke(); };
  card(H * 0.24, pop(f, 598), brief, "#f6e2c4");
  card(H * 0.5, pop(f, 641), wallet, "#dbe5fb");
  card(H * 0.76, pop(f, 667), basket, "#fbdcd8");
  s.tex.needsUpdate = true;
}
function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
