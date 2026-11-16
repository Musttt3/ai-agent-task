// The cast as lit, camera-facing cards drawn with toon.ts (our own flat style: white/skin bean heads, stick limbs, plum
// ink). All cards live on the NOINK layer: they carry their own ink and must not get rectangle outlines from the world
// ink pass.
import * as THREE from "three";
import { Pen, bodyFront, Outfit, Expr, FrontOpts } from "./toon";
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
/** our doctor: long scarlet physician's robe, round cap, rivet spectacles (no beak mask: that costume is 17th-century) */
export const DOC: Outfit = { jacket: "#a33a3c", dress: "#9a3236", pants: "#4d3a30", boots: "#3a2a20", hat: "doccap", cap: "#5a2230", hair: "#5a3b2a",
  specs: true, skin: "#fbe8d6" };
/** the same man, sick: no cap, nightshirt, flushed, spotted, swollen */
export const DOC_SICK: Outfit = { jacket: "#e8e0d0", pants: "#c8bfae", boots: "#3a2a20", hat: "hair", hair: "#5a3b2a", specs: true,
  skin: "#efe0c8", flush: 0.9, spots: 0.5, bubo: 1 };
/** fellow physicians in other robe colours */
export const colleague = (v: number): Outfit => ({ jacket: ["#5a3a7a", "#2f5a4a", "#2f4f7a", "#6a4a2a"][v % 4], dress: ["#4e3270", "#284f40", "#28446c", "#5e4026"][v % 4],
  pants: "#3a3030", boots: "#2a2020", hat: "doccap", cap: ["#2a2030", "#1f2a24", "#1f2638", "#3a2a1a"][v % 4], hair: ["#3b2a1e", "#8a8a8a", "#2a201a", "#b08a5a"][v % 4],
  moustache: v % 2 ? ["#6a6a6a", "#3b2a1e"][Math.floor(v / 2) % 2] : undefined, skin: ["#fbf3ea", "#f1dcc6", "#e8c39e", "#fbf3ea"][v % 4], build: v === 3 ? "stout" : "adult" });
/** townsfolk 1348: plant-dyed wool, linen coifs and hoods */
export const folk = (v: number): Outfit => {
  const tun = ["#7a6a4a", "#5d7a3a", "#8c5a3a", "#4f6a8a", "#a07a3a", "#6a5a6a", "#8a4a3a", "#5a6a5a"];
  const o: Outfit = { jacket: tun[v % 8], pants: ["#5a4a3a", "#4d4a44", "#6b5d4c"][v % 3], boots: "#3a2a20", hair: ["#5a3b2a", "#2a201a", "#b08a5a", "#8a5a2a"][v % 4],
    skin: ["#fbf3ea", "#f6e3cf", "#f1dcc6", "#e8c39e"][v % 4], waist: "#4a3426" };
  if (v % 3 === 1) return { ...o, dress: shadeHex(tun[(v + 3) % 8], 0.9), hat: "coif", waist: undefined };       // woman: long dress + linen coif
  if (v % 3 === 2) return { ...o, hat: "hood", cap: ["#6a4a2a", "#4a5a3a", "#7a3a2a"][v % 3] };
  return { ...o, hat: "hair", beard: v % 2 ? o.hair : undefined };
};
/** a sick townsperson in a nightshirt: sev 0..1 adds flush / lump / spots */
export const sick = (v: number, s: { flush?: number; lump?: number; spots?: number } = {}): Outfit => ({ jacket: ["#e8e0d0", "#ded4c0", "#efe6d6"][v % 3], pants: "#c8bfae",
  boots: "#3a2a20", hat: v % 2 ? "coif" : "hair", hair: ["#5a3b2a", "#2a201a", "#b08a5a"][v % 3], skin: ["#f1e2ca", "#ecd8bc", "#e6d0b4"][v % 3], ...s });
/** a gravedigger with a dark hood */
export const DIGGER: Outfit = { jacket: "#6a5a44", pants: "#4a4034", boots: "#2a2020", hat: "hood", cap: "#8a6a44", hair: "#2a201a", moustache: "#3a2a1e", skin: "#f1dcc6", waist: "#3a2a20" };
/** a scientist of the 1890s: dark suit, white collar, moustache */
export const SCIENTIST: Outfit = { jacket: "#3a3f4c", pants: "#2e323c", boots: "#1e1e22", buttons: "#d9dde0", hat: "hair", hair: "#3b2a1e", moustache: "#3b2a1e",
  skin: "#fbf3ea", trim: "#f2efe6" };
const shadeHex = (c: string, k: number) => { const n = parseInt(c.slice(1), 16), ch = (v: number) => Math.round(v * k).toString(16).padStart(2, "0"); return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`; };

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
const personTex = (o: Outfit, opts: FrontOpts, key: string) => drawCard("p|" + key, 720, 1200, (g) => {
  g.setTransform(1.2, 0, 0, 1.2, 0, 0);
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
  update(f: number, cam: THREE.Camera, emitters: [number, number, number][], o: { period?: number; life?: number; size?: number; rise?: number; drift?: [number, number]; opacity?: number; seed?: number; on?: number; col?: string } = {}) {
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
        (m.material as THREE.MeshBasicMaterial).color.set(o.col ?? "#ffffff");
      }
    }
    for (; k < this.pool.length; k++) this.pool[k].visible = false;
  }
  hide() { for (const m of this.pool) m.visible = false; }
}
