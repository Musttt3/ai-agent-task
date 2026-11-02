// The cast as lit, camera-facing cards. The caveman is the user's own character sheet (public/caveman/*.png, cut out by
// tools/sprites.py): a headless body card plus a swappable head card on a neck pivot (6 expressions), or the full
// side / back views. Everyone else is drawn with toon.ts in the same white-faced, stick-limbed style. All cards live
// on the NOINK layer: they carry their own ink and must not get rectangle outlines from the world ink pass.
import * as THREE from "three";
import { staticFile } from "remotion";
import { Pen, bodyFront, Outfit, Expr, FrontOpts, INK } from "./toon";
import { NOINK } from "./ink";
import { puffTexture, rng } from "./paint";

export type Face = "worried" | "happy" | "suspicious" | "shocked" | "scared" | "angry";
const FACES: Face[] = ["worried", "happy", "suspicious", "shocked", "scared", "angry"];
type SpriteMeta = { w: number; h: number; feet: number; face_center?: [number, number]; face_w?: number };

const load = (url: string) => new Promise<THREE.Texture>((res, rej) => new THREE.TextureLoader().load(url, (t) => {
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t);
}, undefined, rej));

export type CavemanKit = { tex: Record<string, THREE.Texture>; meta: Record<string, SpriteMeta> };
export const loadCaveman = async (): Promise<CavemanKit> => {
  const meta = await (await fetch(staticFile("caveman/sprites.json"))).json();
  const names = ["front", "side", "back", "front_body", ...FACES.map((f) => "head_" + f)];
  const texs = await Promise.all(names.map((n) => load(staticFile(`caveman/${n}.png`))));
  const tex: Record<string, THREE.Texture> = {};
  names.forEach((n, i) => (tex[n] = texs[i]));
  return { tex, meta };
};

/** lit card material: Lambert so torches and lamps light the characters, plus a little self-light so faces read */
export const cardMat = (map: THREE.Texture, self = 0.22) => {
  const m = new THREE.MeshLambertMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: self });
  return m;
};

const CAVE_H = 1.72;            // caveman height in metres
const PXM = CAVE_H / (649 - 62); // metres per sheet pixel (sole 649, hair top ~62 in the 660 px crops)
export const yawTo = (o: THREE.Object3D, cam: THREE.Camera) => {
  const p = new THREE.Vector3(); o.getWorldPosition(p);
  o.rotation.y = Math.atan2(cam.position.x - p.x, cam.position.z - p.z);
};

export type CaveView = "front" | "side" | "back";
export type CavePose = { pos: [number, number, number]; view?: CaveView; face?: Face; flip?: boolean; bob?: number; lean?: number; nod?: number; scale?: number; visible?: boolean; self?: number };

export class Caveman {
  root = new THREE.Group();
  private lean = new THREE.Group();
  private body: THREE.Mesh;
  private full: THREE.Mesh;
  private neck = new THREE.Group();
  private heads: Record<string, THREE.Mesh> = {};
  constructor(kit: CavemanKit) {
    const plane = (name: string) => {
      const m = kit.meta[name];
      const g = new THREE.PlaneGeometry(m.w * PXM, m.h * PXM);
      g.translate(0, (m.feet - m.h / 2) * PXM, 0); // origin at the soles
      const mesh = new THREE.Mesh(g, cardMat(kit.tex[name]));
      mesh.layers.set(NOINK);
      return mesh;
    };
    this.body = plane("front_body");
    this.full = plane("front");
    this.lean.add(this.body, this.full);
    // head: pivot at the chin, head card placed so its face circle sits on the body's face position
    const bm = kit.meta.front_body, [bfx, bfy] = bm.face_center!;
    const chin: [number, number] = [bfx, bfy + bm.face_w! * 0.47];
    this.neck.position.set((chin[0] - bm.w / 2) * PXM, (bm.feet - chin[1]) * PXM, 0.004);
    this.lean.add(this.neck);
    for (const f of FACES) {
      const hm = kit.meta["head_" + f], s = bm.face_w! / hm.face_w!;
      const g = new THREE.PlaneGeometry(hm.w * s * PXM, hm.h * s * PXM);
      // card centre relative to the chin pivot
      const cx = (bfx - (hm.face_center![0] - hm.w / 2) * s) - chin[0];
      const cy = (bfy - (hm.face_center![1] - hm.h / 2) * s) - chin[1];
      g.translate(cx * PXM, -cy * PXM, 0);
      const mesh = new THREE.Mesh(g, cardMat(kit.tex["head_" + f]));
      mesh.layers.set(NOINK);
      this.neck.add(mesh);
      this.heads[f] = mesh;
    }
    // side / back views reuse the full-card slot with their own textures
    this.views = { front: kit.tex.front, side: kit.tex.side, back: kit.tex.back };
    this.root.add(this.lean);
    this.root.userData.bill = true;
  }
  private views: Record<CaveView, THREE.Texture>;
  pose(p: CavePose, cam: THREE.Camera) {
    this.root.visible = p.visible ?? true;
    if (!this.root.visible) return;
    this.root.position.set(...p.pos);
    const s = p.scale ?? 1;
    this.root.scale.set(p.flip ? -s : s, s, s);
    yawTo(this.root, cam);
    const view = p.view ?? "front";
    const swap = view === "front" && !!p.face;
    this.body.visible = swap; this.neck.visible = swap; this.full.visible = !swap;
    if (!swap) {
      const m = this.full.material as THREE.MeshLambertMaterial;
      if (m.map !== this.views[view]) { m.map = this.views[view]; m.emissiveMap = this.views[view]; m.needsUpdate = true; }
    }
    for (const f of FACES) this.heads[f].visible = swap && p.face === f;
    for (const m of [this.body, this.full, ...Object.values(this.heads)]) (m.material as THREE.MeshLambertMaterial).emissiveIntensity = p.self ?? 0.22;
    this.lean.position.y = (p.bob ?? 0);
    this.lean.rotation.z = THREE.MathUtils.degToRad(p.lean ?? 0);
    this.neck.rotation.z = THREE.MathUtils.degToRad(p.nod ?? 0);
  }
}

// ---------------- toon.ts people ----------------
export const SU = 0.00216; // metres per design unit (1000 units = 2.16 m)
const WHITE_SKIN = "#fbfaf7";
export const MARCEL: Outfit = { jacket: "#b8553a", pants: "#3e4a5c", boots: "#4a3426", hat: "hair", hair: "#3b2a1e", skin: WHITE_SKIN, build: "kid" };
export const tourist = (v: number): Outfit => {
  const coats = ["#3f6fb5", "#8c3b4a", "#5d7a3a", "#b5653f", "#2f5f6a", "#7b5ac9", "#c9a23f", "#4d4d6a"];
  const o: Outfit = { jacket: coats[v % 8], pants: ["#3b3f52", "#5a4a3a", "#2e3440"][v % 3], boots: "#3a2a20", skin: WHITE_SKIN };
  return v % 3 === 1 ? { ...o, hat: "bonnet", dress: ["#d9a441", "#c25a7a", "#5a8fc2", "#e0e0d0"][v % 4] } : v % 3 === 2 ? { ...o, hat: "hair", hair: ["#3b2a1e", "#8a6a3a", "#222222"][v % 3] } : { ...o, hat: "cap", cap: ["#59606e", "#8a5a3a", "#2e4a6a"][v % 3] };
};

const cache = new Map<string, THREE.Texture>();
const drawCard = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  let t = cache.get(key);
  if (t) return t;
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d")!);
  t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  cache.set(key, t);
  return t;
};
const personTex = (o: Outfit, opts: FrontOpts, key: string) => drawCard("p|" + key, 360, 600, (g) => {
  g.setTransform(0.6, 0, 0, 0.6, 0, 0);
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

/** person card from toon.ts; walk phase is quantised to 8 drawings so the canvas cache stays small */
export class Person extends Card {
  constructor(parent: THREE.Object3D) { super(parent, 600 * SU, 1000 * SU, 25 * SU); }
  pose(o: Outfit, oid: string, pos: [number, number, number], cam: THREE.Camera, opts: { expr?: Expr; mode?: FrontOpts["mode"]; phase?: number; look?: number; scale?: number; flip?: boolean; lean?: number; self?: number; blink?: boolean; prop?: FrontOpts["prop"] } = {}) {
    const ph = opts.mode === "stroll" || opts.mode === "march" ? Math.round(((opts.phase ?? 0) % 1) * 8) / 8 : 0;
    const key = `${oid}|${opts.expr ?? "neutral"}|${opts.mode ?? "stand"}|${ph}|${opts.look ?? 0}|${opts.blink ? 1 : 0}`;
    const t = personTex(o, { expr: opts.expr ?? "neutral", mode: opts.mode ?? "stand", phase: ph, look: opts.look ?? 0, blink: opts.blink, seed: oid.length * 7 + oid.charCodeAt(oid.length - 1), prop: opts.prop ?? null }, key);
    this.show(t, pos, cam, opts);
  }
}

// ---------------- Robot the dog ----------------
/** our own stick-style dog: white body, plum ink, floppy ears; `sniff` 0..1 lowers the nose to the ground */
export const dogTex = (sniff: number, tail: number) => drawCard(`dog|${sniff.toFixed(1)}|${tail.toFixed(1)}`, 512, 384, (g) => {
  g.lineJoin = "round"; g.lineCap = "round";
  const ink = (w: number) => { g.strokeStyle = INK; g.lineWidth = w; };
  // legs
  ink(13);
  for (const [x, dx] of [[170, -6], [205, 6], [340, -6], [372, 6]]) { g.beginPath(); g.moveTo(x, 230); g.lineTo(x + dx, 330); g.stroke(); }
  // tail
  g.beginPath(); g.moveTo(400, 190); g.quadraticCurveTo(450, 150 - 30 * tail, 470, 110 - 40 * tail); g.stroke();
  // body
  g.beginPath(); g.ellipse(285, 205, 140, 62, 0, 0, 7); g.fillStyle = "#fbfaf7"; g.fill(); ink(9); g.stroke();
  // brown patch
  g.save(); g.beginPath(); g.ellipse(285, 205, 140, 62, 0, 0, 7); g.clip();
  g.beginPath(); g.ellipse(330, 175, 55, 38, 0.3, 0, 7); g.fillStyle = "#8a5a36"; g.fill(); g.restore();
  // head on a neck that dips when sniffing
  const hx = 120 - 10 * sniff, hy = 140 + 110 * sniff;
  ink(30); g.beginPath(); g.moveTo(175, 175); g.lineTo(hx + 25, hy + 10); g.stroke();
  g.strokeStyle = "#fbfaf7"; g.lineWidth = 16; g.stroke();
  g.beginPath(); g.ellipse(hx, hy, 58, 46, -0.25 - 0.5 * sniff, 0, 7); g.fillStyle = "#fbfaf7"; g.fill(); ink(9); g.stroke();
  // snout + nose
  g.beginPath(); g.ellipse(hx - 48, hy + 14 + 6 * sniff, 30, 22, -0.3 - 0.5 * sniff, 0, 7); g.fillStyle = "#fbfaf7"; g.fill(); ink(8); g.stroke();
  g.beginPath(); g.arc(hx - 74, hy + 8 + 16 * sniff, 10, 0, 7); g.fillStyle = INK; g.fill();
  // ear
  g.beginPath(); g.ellipse(hx + 22, hy + 10, 18, 40, 0.4, 0, 7); g.fillStyle = "#8a5a36"; g.fill(); ink(7); g.stroke();
  // eye
  g.beginPath(); g.arc(hx - 16, hy - 12, 7, 0, 7); g.fillStyle = INK; g.fill();
});

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
