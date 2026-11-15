// The cast as lit, camera-facing cards drawn with toon.ts (our own flat style: white/skin bean heads, stick limbs, plum
// ink). All cards live on the NOINK layer: they carry their own ink and must not get rectangle outlines from the world
// ink pass.
import * as THREE from "three";
import { Pen, bodyFront, Outfit, Expr, FrontOpts, INK } from "./toon";
import { NOINK } from "./ink";
import { puffTexture, rng } from "./paint";

/** lit card material: Lambert so the scene light reaches the characters, plus a little self-light so faces read */
export const cardMat = (map: THREE.Texture, self = 0.22) => {
  const m = new THREE.MeshLambertMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: self });
  return m;
};
export const yawTo = (o: THREE.Object3D, cam: THREE.Camera) => {
  const p = new THREE.Vector3(); o.getWorldPosition(p);
  o.rotation.y = Math.atan2(cam.position.x - p.x, cam.position.z - p.z);
};

// ---------------- toon.ts people ----------------
export const SU = 0.00216; // metres per design unit (1000 units = 2.16 m)
const PALE = "#fbf3ea";
/** our hero: blue wool tunic with a gold trim, red cloak, iron cap, ginger beard */
export const HERO: Outfit = { jacket: "#4a72b0", pants: "#7d6b55", boots: "#5a3b2a", hat: "helm", beard: "#c8742e", hair: "#c8742e", longHair: true,
  trim: "#d9b04a", waist: "#5a3b2a", skin: PALE };
/** Greenland crew / sailors: wool tunics in plant-dye colours, beards, some helmets, some bare heads */
export const sailor = (v: number): Outfit => {
  const tun = ["#5d7a3a", "#b5653f", "#7b5a8c", "#c9a23f", "#2f5f6a", "#8c3b4a", "#6a6f78", "#a0703a"];
  const brd = ["#e3c070", "#5a3b2a", "#9a9a9a", "#2a201a", "#b0582a", "#d8b060"];
  const o: Outfit = { jacket: tun[v % 8], pants: ["#6b5d4c", "#4d4a44", "#7a6040"][v % 3], boots: "#4a3426", beard: brd[v % 6], hair: brd[v % 6],
    trim: ["#e0d3b0", "#c0533a", "#d9b04a"][v % 3], waist: "#4a3426", skin: ["#fbf3ea", "#f6e3cf", "#f1dcc6"][v % 3] };
  return v % 3 === 0 ? { ...o, hat: "helm", longHair: true } : { ...o, hat: "hair", longHair: v % 2 === 0 };
};
/** a Greenland woman (no beard) */
export const settler = (v: number): Outfit => ({ jacket: ["#5a8fc2", "#c25a7a", "#d9a441"][v % 3], dress: ["#7a5a3a", "#5d7a3a", "#8c3b4a"][v % 3], pants: "#4d4a44",
  boots: "#4a3426", hat: "hair", hair: ["#e3c070", "#8a5a2a", "#c8742e"][v % 3], longHair: true, trim: "#e0d3b0", skin: PALE });
/** Indigenous people of the land: smoked-hide clothing with red-ochre trim, long dark hair (dignified, no costume clichés) */
export const native = (v: number): Outfit => ({ jacket: ["#a8784a", "#9a6a40", "#b88a58", "#8f6440"][v % 4], pants: ["#7a5638", "#6b4a30"][v % 2], boots: "#6b4a2e",
  hat: "hair", hair: ["#1d1a1f", "#2a2224", "#161418"][v % 3], longHair: true, trim: "#b5432e", skin: ["#c99067", "#b98058", "#d0a07a", "#a87050"][v % 4],
  build: v === 5 ? "kid" : v % 4 === 3 ? "stout" : "adult" });
/** modern archaeologists: khaki field shirts, sun caps */
export const digger = (v: number): Outfit => ({ jacket: ["#c9b07a", "#7d8f5a", "#d0d4c8"][v % 3], pants: ["#5a5f4a", "#3e4a5c", "#6b5d4c"][v % 3], boots: "#4a3426",
  buttons: "#e8e2d0", hat: v % 2 ? "cap" : "hair", cap: ["#e0c98a", "#c25a3a"][v % 2], hair: ["#3b2a1e", "#8a6a3a", "#222222"][v % 3], skin: ["#fbf3ea", "#e8c39e", "#c99067"][v % 3] });

const cache = new Map<string, THREE.Texture>();
export const drawCard = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  let t = cache.get(key);
  if (t) return t;
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d")!);
  t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  cache.set(key, t);
  return t;
};
const personTex = (o: Outfit, opts: FrontOpts, key: string) => drawCard("p|" + key, 480, 800, (g) => {
  g.setTransform(0.8, 0, 0, 0.8, 0, 0);
  bodyFront(new Pen(g), o, opts);
});

/** generic card: a plane anchored at its bottom centre, yaw-billboarded */
export class Card {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial;
  constructor(parent: THREE.Object3D, w: number, h: number, anchorY = 0) {
    const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2 - anchorY, 0);
    this.mat = cardMat(new THREE.Texture());
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.layers.set(NOINK);
    this.mesh.visible = false;
    this.mesh.userData.bill = true;
    parent.add(this.mesh);
  }
  show(map: THREE.Texture, pos: [number, number, number], cam: THREE.Camera, o: { scale?: number; flip?: boolean; lean?: number; self?: number; yaw?: boolean } = {}) {
    if (this.mat.map !== map) { this.mat.map = map; this.mat.emissiveMap = map; this.mat.needsUpdate = true; }
    this.mesh.visible = true;
    this.mesh.position.set(...pos);
    const s = o.scale ?? 1;
    this.mesh.scale.set(o.flip ? -s : s, s, s);
    this.mat.emissiveIntensity = o.self ?? 0.22;
    if (o.yaw !== false) yawTo(this.mesh, cam);
    this.mesh.rotation.z = THREE.MathUtils.degToRad(o.lean ?? 0);
  }
  hide() { this.mesh.visible = false; }
}

export type PoseOpts = { expr?: Expr; mode?: FrontOpts["mode"]; phase?: number; look?: number; scale?: number; flip?: boolean; lean?: number; self?: number;
  blink?: boolean; prop?: FrontOpts["prop"]; wave?: number; facing?: -1 | 0 | 1; tilt?: number; headTilt?: number };
/** person card from toon.ts; walk phase is quantised to 8 drawings so the canvas cache stays small */
export class Person extends Card {
  constructor(parent: THREE.Object3D) { super(parent, 600 * SU, 1000 * SU, 25 * SU); }
  pose(o: Outfit, oid: string, pos: [number, number, number], cam: THREE.Camera, opts: PoseOpts = {}) {
    const ph = opts.mode === "stroll" || opts.mode === "march" ? Math.round(((opts.phase ?? 0) % 1) * 8) / 8 : 0;
    const wave = opts.wave === undefined ? undefined : Math.round(opts.wave * 4) / 4;
    const prop = opts.prop ?? null, pk = Array.isArray(prop) ? `h${Math.round(prop[1] * 6) / 6}` : String(prop);
    const key = `${oid}|${opts.expr ?? "neutral"}|${opts.mode ?? "stand"}|${ph}|${opts.look ?? 0}|${opts.blink ? 1 : 0}|${wave}|${pk}|${opts.facing ?? 0}|${opts.tilt ?? 0}|${opts.headTilt ?? 0}`;
    const pr = Array.isArray(prop) ? (["hammer", Math.round(prop[1] * 6) / 6] as ["hammer", number]) : prop;
    const t = personTex(o, { expr: opts.expr ?? "neutral", mode: opts.mode ?? "stand", phase: ph, look: opts.look ?? 0, blink: opts.blink, seed: oid.length * 7 + oid.charCodeAt(oid.length - 1),
      prop: pr, wave, facing: opts.facing ?? 0, tilt: opts.tilt ?? 0, headTilt: opts.headTilt ?? 0 }, key);
    this.show(t, pos, cam, opts);
  }
}

// ---------------- breath / steam puffs (stateless: positions are a pure function of the frame) ----------------
export class Puffs {
  private pool: THREE.Mesh[] = [];
  private mat: THREE.MeshBasicMaterial;
  constructor(private parent: THREE.Object3D, n = 160) {
    this.mat = new THREE.MeshBasicMaterial({ map: puffTexture(), transparent: true, depthWrite: false, fog: false, toneMapped: false });
    const g = new THREE.PlaneGeometry(1, 1);
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(g, this.mat.clone());
      m.layers.set(NOINK); m.visible = false; m.renderOrder = 5; m.userData.face = true;
      parent.add(m); this.pool.push(m);
    }
  }
  /** emitters: mouth positions; each breathes out every `period` frames for `life` frames with a seeded phase */
  update(f: number, cam: THREE.Camera, emitters: [number, number, number][], o: { period?: number; life?: number; size?: number; rise?: number; drift?: [number, number]; opacity?: number; seed?: number; on?: number } = {}) {
    const period = o.period ?? 75, life = o.life ?? 55, size = o.size ?? 0.35, rise = o.rise ?? 0.6, op = (o.opacity ?? 0.7) * (o.on ?? 1);
    let k = 0;
    const r = rng(o.seed ?? 5);
    for (const e of emitters) {
      const ph = Math.floor(r() * period), dx = (r() - 0.5) * 0.3;
      for (let c = 0; c < 2; c++) {
        const age = ((f + ph + c * period) % (period * 2));
        if (age >= life || k >= this.pool.length || op <= 0) continue;
        const t = age / life, m = this.pool[k++];
        m.visible = true;
        m.position.set(e[0] + dx * t + (o.drift?.[0] ?? 0) * t, e[1] + rise * t, e[2] + (o.drift?.[1] ?? 0) * t + 0.05);
        const s = size * (0.35 + 1.2 * t);
        m.scale.set(s, s, s);
        m.quaternion.copy(cam.quaternion);
        (m.material as THREE.MeshBasicMaterial).opacity = op * Math.sin(Math.PI * Math.min(1, t * 1.6)) * (1 - t * 0.6);
      }
    }
    for (; k < this.pool.length; k++) this.pool[k].visible = false;
  }
  hide() { for (const m of this.pool) m.visible = false; }
}
