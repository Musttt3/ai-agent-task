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
/** our messenger: young courier in a blue tunic with a gold hem, dark curly hair */
export const MESSENGER: Outfit = { jacket: "#3a7fa8", pants: "#c8b48a", boots: "#5a3b2a", hat: "hair", hair: "#2a1a14", trim: "#e0c070", waist: "#6a4a2a", skin: "#f1d8bc" };
/** the commander at the walls: mail shirt, red cloak, iron cap, beard */
export const COMMANDER: Outfit = { jacket: "#8a8f98", pants: "#4a3a30", boots: "#2a2020", hat: "helm", beard: "#3a2a1e", hair: "#3a2a1e", cloak: "#9a2a2a",
  trim: "#c9a24a", waist: "#4a3426", skin: "#ecd0b0", build: "stout" };
/** defenders on the walls */
export const defender = (v: number): Outfit => ({ jacket: ["#8a8f98", "#7a3a3a", "#5a6a7a", "#6a5a3a"][v % 4], pants: ["#4a3a30", "#3a3a44"][v % 2], boots: "#2a2020",
  hat: "helm", beard: v % 2 ? ["#3a2a1e", "#6a5040"][v % 2] : undefined, hair: "#3a2a1e", trim: v % 3 ? "#c9a24a" : undefined, waist: "#3a2a20",
  skin: ["#ecd0b0", "#f1d8bc", "#e0bc98"][v % 3] });
/** janissaries: long coats, the tall white börk cap, moustaches (drawn with dignity, never as monsters) */
export const janissary = (v: number): Outfit => ({ jacket: ["#2f4f8a", "#8a2a2a", "#2f6a4a"][v % 3], dress: ["#28457a", "#7a2424", "#285e40"][v % 3], pants: "#3a3030",
  boots: "#6a3a20", hat: "bork", moustache: "#2a1a14", hair: "#2a1a14", trim: "#c9a24a", skin: ["#e8c8a4", "#dcb48c", "#f0d4b4"][v % 3] });
/** Sultan Mehmed II (21 in 1453): red kaftan, great white turban, short dark beard */
export const MEHMED: Outfit = { jacket: "#b8322c", dress: "#a82c28", pants: "#3a3030", boots: "#6a3a20", hat: "turban", beard: "#6a4a30", moustache: "#3a2418", hair: "#3a2418",
  trim: "#d9b04a", skin: "#ecd0b0" };
/** Emperor Constantine XI: imperial purple, gilded helmet, grey-brown beard */
export const EMPEROR: Outfit = { jacket: "#5a2a6a", pants: "#3a2a3a", boots: "#8a2a2a", hat: "helm", helmCol: "#d9b04a", beard: "#6a5a4a", hair: "#6a5a4a",
  cloak: "#4a2058", trim: "#d9b04a", skin: "#ecd0b0" };
/** townsfolk of Constantinople: bright tunics, women veiled, kids */
export const citizen = (v: number): Outfit => {
  const tun = ["#c98a3a", "#5a8a4a", "#8a3a5a", "#3a6a9a", "#b85a3a", "#7a5a9a", "#c0a040", "#4a7a7a"];
  const o: Outfit = { jacket: tun[v % 8], pants: ["#6a5a4a", "#4d4a44", "#7a6040"][v % 3], boots: "#4a3020", hair: ["#2a1a14", "#5a3b2a", "#1a1414", "#8a5a2a"][v % 4],
    skin: ["#f1d8bc", "#ecd0b0", "#e0bc98", "#f6e3cf"][v % 4], waist: "#5a3a26" };
  if (v % 3 === 1) return { ...o, dress: shadeHex(tun[(v + 3) % 8], 0.85), hat: "hood", cap: ["#e8e0d0", "#c8b8d8", "#d8c8a8"][v % 3], waist: undefined };
  return { ...o, hat: "hair", beard: v % 4 === 0 ? o.hair : undefined };
};
export const kid = (v: number): Outfit => ({ ...citizen(v), build: "kid", beard: undefined });
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
