// 2D Character Cast & Cartoon Effect Cards for "Es Krim di Zaman Purba" (engine from the 2d-in-3d-animation-agent template).
// Uses 3x supersampled (1800x3000) lit cardShade sprites, contact/cast shadow blobs, and NOINK layer 3.
// Follows skill/references/reports/motion.md & Gold Benchmark kosan/cast.ts:
// - Bouncy walk cycles ("march" / "stroll" with 4.8% height bob & weight-shift sway)
// - Hop / jump arcs with crouch anticipation on celebration & shock beats
// - 4-frame half/shut/shut/half blinks timed 2 frames (LEAD = 2/FPS) before expression swaps
// - Popping 2D FX cards (fxBurst, fxStars, fxCreak, fxMoneyFly, fxCryptoSwarm, fxBadge)
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxShadow, fxContact, fxBurst, fxStars, fxCreak,
  Outfit, FrontOpts, SideOpts, INK,
} from "./toon";
import { FPS } from "./timing";
import { clamp01 } from "./cam";
import { LightName } from "./lights";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
const ROOTS = new Set<THREE.Object3D>();

export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false;
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = Math.min(rt ? rt.width : r.domElement.width, rt ? rt.height : r.domElement.height) / 1080; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}

export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false;
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    } else {
      this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0;
    }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };
export type Stage = { places: Place[]; fx: FxPlace[] };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;

export const tier = (d: number): [number, number, number] =>
  d < 8.5 ? [1800, 3000, 3.0] : d < 14 ? [1080, 1800, 1.8] : [480, 800, 0.8];

export const SUN = new THREE.Vector3(0.5, 0.75, 0.4).normalize();
const tmp = new THREE.Vector3();
export let LNAME: LightName = "golden";

const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
export const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
export const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

// ---------------- blinks, expression swaps & micro-motion helpers ----------------
const LEAD = 2 / FPS;
const LID = [0.5, 1, 1, 0.5];
export const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 48 * hh(i * 31 + n, 13));
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
const liveTilt = (t: number, seed: number, amp = 2.6) => q(amp * Math.sin(t * 3.2 + seed), 30);
const liveHead = (t: number, seed: number, amp = 4.0) => q(amp * Math.sin(t * 2.4 + seed * 1.7) + (amp * 0.4) * Math.cos(t * 4.1 + seed), 30);

/** Parabolic hop/jump arc with a 3-frame crouch anticipation */
export const hopY = (t: number, t0: number, dur = 0.42, height = 0.16): number => {
  const dt = t - t0;
  if (dt < -0.08 || dt > dur) return 0;
  if (dt < 0) return -0.025 * Math.sin(((dt + 0.08) / 0.08) * Math.PI);
  const u = dt / dur;
  return height * 4 * u * (1 - u);
};

export type Who = { i: number; o: Outfit; okey: string };
export const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, side: boolean, mirror: boolean, fo: FrontOpts, so: SideOpts, scale = 1): Place => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const m = side && mirror, light = light2D(cam, m), seed = ((who.i * 5 + 3) % 7) + 1;
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror: m,
    draw: (p) => (side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
    size: [w, h, k],
  };
};

const CONTACT: Record<LightName, [number, number, number]> = {
  space: [0.18, 0.16, 0.32],
  night: [0.18, 0.16, 0.30],
  golden: [0.24, 0.20, 0.33],
  day: [0.20, 0.21, 0.33],
};
const TAIL: [number, number, number] = [0.38, 0.36, 0.56];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");

export const blob = (out: Stage, x: number, _y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  const el = Math.asin(Math.min(0.99, Math.max(0.15, SUN.y)));
  const len = Math.min(2.2, Math.max(0.5, 1.4 / Math.tan(el))) * sc, h = len + 0.5 * sc, c = 0.3 * h;
  const tc = hexOf(TAIL, k);
  out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: 0.018, z: z + oz * c, w: 0.72 * sc, h, flat: true, rot });
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: 0.022, z: z + oz * 0.03 * sc, w: 0.54 * sc, h: 0.42 * sc, flat: true, rot });
};

// ---------------- 2D Cartoon FX Cards ----------------

/** Flying Rupiah Money Notes & Gold Coins Card (520x520) */
const fxMoneyFly = (p: Pen, phase: number) => {
  const g = p.g;
  const bills = [
    [130, 260, -0.28, "#2ecc71"],
    [260, 150, 0.16, "#27ae60"],
    [380, 250, 0.34, "#2ecc71"],
  ] as const;
  for (let i = 0; i < bills.length; i++) {
    const [bx, by, rot, col] = bills[i];
    const y = by - ((phase * 95 + i * 40) % 110);
    const x = bx + Math.sin(phase * 4 + i * 2) * 16;
    g.save();
    g.translate(x, y);
    g.rotate(rot + Math.sin(phase * 3 + i) * 0.12);
    g.fillStyle = col;
    g.strokeStyle = INK;
    g.lineWidth = 8;
    g.beginPath();
    g.roundRect(-62, -32, 124, 64, 10);
    g.fill(); g.stroke();
    g.fillStyle = "#fff8e7";
    g.beginPath();
    g.arc(0, 0, 18, 0, Math.PI * 2);
    g.fill(); g.stroke();
    g.fillStyle = INK;
    g.font = "900 22px 'PoppinsBlack', 'Segoe UI', Arial, sans-serif";
    g.textAlign = "center";
    g.fillText("Rp", 0, 8);
    g.restore();
  }
  for (const [cx, cy, off] of [[185, 360, 0.5], [335, 350, 1.8], [260, 95, 3.1]] as const) {
    const y = cy + Math.sin(phase * 5 + off) * 14;
    g.fillStyle = "#ffd43b";
    g.strokeStyle = INK;
    g.lineWidth = 7;
    g.beginPath();
    g.arc(cx, y, 22, 0, Math.PI * 2);
    g.fill(); g.stroke();
  }
};

/** Floating Crypto Coins Card (BTC, ETH, SOL tokens orbiting on a 520x520 canvas) */
const fxCryptoSwarm = (p: Pen, phase: number) => {
  const g = p.g;
  const coins = [
    [140, 220, "#f39c12", "#ffd43b", "₿", 0.0],
    [265, 135, "#00a8ff", "#70e8ff", "◆", 2.1],
    [380, 230, "#8e44ad", "#2ecc71", "S", 4.2],
  ] as const;
  for (const [cx, cy, outer, inner, sym, off] of coins) {
    const x = cx + Math.sin(phase * 3.5 + off) * 14;
    const y = cy + Math.cos(phase * 4.5 + off) * 16;
    g.fillStyle = outer;
    g.strokeStyle = INK;
    g.lineWidth = 8;
    g.beginPath();
    g.arc(x, y, 42, 0, Math.PI * 2);
    g.fill(); g.stroke();

    g.fillStyle = inner;
    g.beginPath();
    g.arc(x, y, 30, 0, Math.PI * 2);
    g.fill(); g.stroke();

    g.fillStyle = INK;
    g.font = "900 32px 'PoppinsBlack', 'Segoe UI', Arial, sans-serif";
    g.textAlign = "center";
    g.fillText(sym, x, y + 11);
  }
};

/** Comic Floating Price / Alert Badge (560x260) — auto-fits text with generous internal padding so it NEVER overflows the box! */
export const fxBadge = (p: Pen, text: string, sub: string, bg: string, fg: string) => {
  const g = p.g;
  g.fillStyle = INK;
  g.beginPath();
  g.roundRect(24, 34, 512, 196, 28);
  g.fill();

  g.fillStyle = bg;
  g.strokeStyle = INK;
  g.lineWidth = 10;
  g.beginPath();
  g.roundRect(16, 22, 512, 196, 28);
  g.fill();
  g.stroke();

  g.fillStyle = fg;
  g.textAlign = "center";

  // Auto-fit main heading within max width 456 px
  let mainSz = 50;
  g.font = `900 ${mainSz}px 'PoppinsBlack', 'Segoe UI', Arial, sans-serif`;
  while (g.measureText(text).width > 456 && mainSz > 26) {
    mainSz -= 2;
    g.font = `900 ${mainSz}px 'PoppinsBlack', 'Segoe UI', Arial, sans-serif`;
  }
  g.fillText(text, 272, 112);

  // Auto-fit subtitle within max width 456 px
  let subSz = 31;
  g.font = `800 ${subSz}px 'PoppinsBlack', 'Segoe UI', Arial, sans-serif`;
  while (g.measureText(sub).width > 456 && subSz > 18) {
    subSz -= 2;
    g.font = `800 ${subSz}px 'PoppinsBlack', 'Segoe UI', Arial, sans-serif`;
  }
  g.fillText(sub, 272, 174);
};


// ================= "Es Krim di Zaman Purba": roster, stage context, extra cards =================
export const setLight = (l: LightName) => { LNAME = l; };

// ---- outfits (our own characters) ----
/** you: yellow T-shirt, blue shorts, blue flip-flops */
export const KAMU: Outfit = { jacket: "#f2c230", tee: true, shorts: true, pants: "#2f5aa8", boots: "#2fa0d8", hat: "hair", hair: "#1e1a18", skin: "#f1d2b0", noButtons: true };
/** your prehistoric friend: fur tunic, long hair, beard, bare arms and legs */
export const PURBA: Outfit = { jacket: "#9a6a3a", fur: "#5e3d22", bareArms: true, bareLegs: true, pants: "#9a6a3a", boots: "#7a5232", hat: "hair", hair: "#3a2618",
  longHair: "#3a2618", beard: "#3a2618", skin: "#c99067", build: "stout", noButtons: true };
/** the group: hunters, gatherers, kids (fur in different colours) */
export const tribe = (v: number): Outfit => {
  const fur = ["#a8784a", "#8f6440", "#b88a58", "#7a5a3a", "#c09a6a", "#9a7048"][v % 6], spot = ["#5e3d22", "#4a3020", "#6a4a2a"][v % 3];
  const hair = ["#2a1a14", "#3a2618", "#4a3020", "#1e1612"][v % 4], skin = ["#c99067", "#b98058", "#d0a07a", "#a87050"][v % 4];
  const base: Outfit = { jacket: fur, fur: spot, bareArms: true, bareLegs: true, pants: fur, boots: "#7a5232", hat: "hair", hair, longHair: hair, skin, noButtons: true };
  if (v % 3 === 1) return { ...base, dress: fur, beard: undefined };                       // women: long fur dress
  return { ...base, beard: v % 2 ? ["#5a3a22", "#6a4a2a", "#4e3420", "#73502e"][v % 4] : undefined, longHair: v % 4 === 0 ? undefined : hair };
};
export const tribeKid = (v: number): Outfit => ({ ...tribe(v * 2), dress: undefined, beard: undefined, build: "kid" });
/** modern school kids in the red-and-white primary school uniform */
export const schoolKid = (v: number): Outfit => ({ jacket: "#f7f7f2", pants: "#c8322c", boots: "#1e1e22", hat: "hair", hair: ["#1e1a18", "#2a1a14", "#3a2618"][v % 3], build: "kid",
  skin: ["#f1d2b0", "#e0b890", "#c99067"][v % 3], shorts: v % 2 === 0, dress: v % 2 ? "#c8322c" : undefined, buttons: "#d9dde0" });

export const WHO = {
  kamu: { i: 1, o: KAMU, okey: "kamu" } as Who,
  purba: { i: 2, o: PURBA, okey: "purba" } as Who,
  tribe: (v: number): Who => ({ i: 10 + v, o: tribe(v), okey: "tribe" + v }),
  kid: (v: number): Who => ({ i: 30 + v, o: tribeKid(v), okey: "tkid" + v }),
  school: (v: number): Who => ({ i: 50 + v, o: schoolKid(v), okey: "skid" + v }),
};

// ---- extra cards ----
const softPuff = (p: Pen, col: string) => {
  const g = p.g, gr = g.createRadialGradient(128, 128, 0, 128, 128, 124);
  gr.addColorStop(0, col + "e0"); gr.addColorStop(0.55, col + "80"); gr.addColorStop(1, col + "00");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
};
/** a cartoon text mark (question marks, "Zz", "!" ...) with an ink outline */
const fxText = (p: Pen, text: string, col: string) => {
  const g = p.g; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 190px 'PoppinsBlack', 'Segoe UI', sans-serif";
  g.lineJoin = "round"; g.lineWidth = 26; g.strokeStyle = INK; g.strokeText(text, 256, 140); g.fillStyle = col; g.fillText(text, 256, 140);
};
/** a wolf in profile facing right, drawn in the 600 x 1000 card space (soles at y = 975); k = trot drawing 0..3 */
export const drawWolf = (p: Pen, k: number, sit = false) => {
  const fur = "#8a8f98", belly = "#c8ccd2", leg = (x: number, ph: number) => { const s = sit ? 0 : 14 * Math.sin((k * Math.PI) / 2 + ph); p.line([[x, 860], [x + s, 968]], fur, 18); };
  p.ol = 8;
  p.line([[150, 830], [90, 800], [60, 760]], fur, 26);                       // tail
  leg(190, 0); leg(380, Math.PI);
  p.ell(285, 830, 150, 70, fur, 8);
  p.ell(290, 865, 105, 26, belly, 0);
  leg(220, Math.PI); leg(410, 0);
  p.poly([[400, 760], [520, 800], [545, 830], [470, 850], [410, 840]], fur, 8);      // head + snout
  p.poly([[420, 770], [430, 715], [455, 765]], fur, 7);                             // ear
  p.dot(545, 826, 9, "#1e1a18");
  p.ell(470, 790, 8, 9, "#ffffff", 3); p.dot(473, 792, 5);
};

/** thought bubble with a snowy mountain top and wind gusts (512 x 512) */
const drawMountainBubble = (p: Pen) => {
  const g = p.g;
  p.ell(256, 220, 220, 180, "#fbfaf2", 9);
  p.ell(120, 440, 26, 22, "#fbfaf2", 7); p.ell(80, 490, 14, 12, "#fbfaf2", 6);
  g.save(); g.beginPath(); g.ellipse(256, 220, 212, 172, 0, 0, Math.PI * 2); g.clip();
  const sky = g.createLinearGradient(0, 40, 0, 400); sky.addColorStop(0, "#8ec4f0"); sky.addColorStop(1, "#dff0ff"); g.fillStyle = sky; g.fillRect(0, 0, 512, 512);
  p.poly([[60, 380], [230, 120], [400, 380]], "#8a9aa8", 7);
  p.poly([[175, 205], [230, 120], [285, 205], [258, 190], [232, 212], [205, 190]], "#ffffff", 6);
  p.poly([[300, 380], [400, 210], [500, 380]], "#9aaab8", 7);
  for (const [y, x0] of [[150, 300], [190, 330], [230, 310]] as const) p.stroke([[x0, y], [x0 + 60, y - 6], [x0 + 110, y + 4]], 7, "#ffffff");
  g.restore();
  p.ell(256, 220, 220, 180, null, 9);
};

// ---- the stage context a beat draws its people and effects with ----
export type POpts = FrontOpts & { y?: number; hop?: number[]; hopH?: number; scale?: number; mirror?: boolean; swaps?: number[]; noShadow?: boolean };
export type Ctx = {
  f: number; t: number; a: number; b: number; u: number; cam: CamInfo; out: Stage;
  P: (who: Who, x: number, z: number, o?: POpts) => void;
  badge: (key: string, text: string, sub: string, bg: string, fg: string, x: number, y: number, z: number, w: number, at: number, until?: number) => void;
  mark: (text: string, col: string, x: number, y: number, z: number, w: number, at: number, until?: number) => void;
  puffs: (key: string, x: number, y: number, z: number, o: { n?: number; period?: number; life?: number; size?: number; rise?: number; drift?: [number, number]; col?: string; on?: boolean }) => void;
  wolf: (x: number, z: number, sit?: boolean, mirror?: boolean) => void;
  burst: (x: number, y: number, z: number, w: number, at: number, col?: string) => void;
  thought: (x: number, y: number, z: number, w: number, at: number, until?: number) => void;
};
const backOut = (x: number) => { const c = 1.7; const u = clamp01(x) - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
const hash = (s: string) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003; return h; };

export const makeCtx = (f: number, a: number, b: number, cam: CamInfo): Ctx => {
  const out: Stage = { places: [], fx: [] }, t = f / FPS;
  findSun(cam, SUN);
  const ctx: Ctx = {
    f, t, a, b, u: clamp01((f - a) / Math.max(1, b - a)), cam, out,
    P: (who, x, z, o = {}) => {
      const sc = o.scale ?? 1;
      let y = o.y ?? 0;
      for (const h of o.hop ?? []) y += hopY(t, h / FPS, 0.42, (o.hopH ?? 0.16) * sc);
      const blink = o.blink ?? lidAt(t, who.i, (o.swaps ?? []).map((s) => s / FPS));
      const fo: FrontOpts = { mode: "stand", phase: t * 0.9, ...o, blink };
      out.places.push(person(cam, who, x, y, z, false, !!o.mirror, fo, {}, sc));
      if (!o.noShadow && (o.mode ?? "stand") !== "sit") blob(out, x, 0, z, sc);
    },
    badge: (key, text, sub, bg, fg, x, y, z, w, at, until) => {
      if (f < at || (until !== undefined && f >= until)) return;
      const s = backOut((f - at) / 7) * (until !== undefined ? clamp01((until - f) / 5) : 1);
      if (s <= 0.01) return;
      out.fx.push({ key: "badge|" + key + "|" + text + "|" + sub + "|" + bg, cw: 560, ch: 260, draw: (p) => fxBadge(p, text, sub, bg, fg), x, y, z, w: w * s, h: w * (260 / 560) * s });
    },
    mark: (text, col, x, y, z, w, at, until) => {
      if (f < at || (until !== undefined && f >= until)) return;
      const s = backOut((f - at) / 6), bob = 0.04 * Math.sin((f - at) * 0.3);
      out.fx.push({ key: "mark|" + text + col, cw: 512, ch: 280, draw: (p) => fxText(p, text, col), x, y: y + bob, z, w: w * s, h: w * (280 / 512) * s });
    },
    puffs: (key, x, y, z, o) => {
      if (o.on === false) return;
      const n = o.n ?? 4, period = o.period ?? 40, life = o.life ?? 40, size = o.size ?? 0.4, rise = o.rise ?? 0.6, col = o.col ?? "#ffffff", seed = hash(key);
      for (let i = 0; i < n; i++) {
        const age = (f + Math.floor((i * period) / n) + (seed % period)) % period;
        if (age >= life) continue;
        const k = age / life, s = size * (0.4 + 1.2 * k);
        const dx = (o.drift?.[0] ?? 0) * k + 0.15 * Math.sin(i * 2.1 + seed), dz = (o.drift?.[1] ?? 0) * k;
        out.fx.push({ key: "puff|" + col, cw: 256, ch: 256, draw: (p) => softPuff(p, col), x: x + dx, y: y + rise * k, z: z + dz, w: s, h: s, soft: true });
      }
    },
    wolf: (x, z, sit = false, mirror = false) => {
      const k = Math.floor(f / 4) % 4, d = cam.pos.distanceTo(new THREE.Vector3(x, 0.6, z)), [w, h, kk] = tier(d);
      out.places.push({ key: `wolf|${sit ? "s" : k}`, x, y: 0, z, mirror, draw: (p) => drawWolf(p, sit ? 0 : k, sit), size: [w, h, kk] });
      blob(out, x, 0, z, 1.1);
    },
    thought: (x, y, z, w, at, until) => {
      if (f < at || (until !== undefined && f >= until)) return;
      const sc = backOut((f - at) / 8);
      out.fx.push({ key: "thought|mountain", cw: 512, ch: 512, draw: drawMountainBubble, x, y: y + 0.03 * Math.sin(f * 0.15), z, w: w * sc, h: w * sc });
    },
    burst: (x, y, z, w, at, col = "#fff3b0") => {
      const k = (f - at) / 14;
      if (k < 0 || k > 1) return;
      const q = Math.round(k * 10) / 10;
      out.fx.push({ key: `burst|${q}|${col}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, q, col, 12, 50, 240), x, y, z, w, h: w });
    },
  };
  return ctx;
};
