// The world of "You're a Viking": one shared ocean, a knarr (our own build), snowy Greenland (turf longhouse, jetty,
// icebergs, mountains), the Vinland coast (pebble beach, huge pines, a stream, the turf shelter going up, the people
// of the land and their camp) and the same coast a thousand years later (grassy mounds, a dig). Everything is built
// once; update() poses it for the shot and frame and sets the camera.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { FPS } from "./timing";
import { NOINK } from "./ink";
import { T, shotAt, Shot, Light, smooth, ramp, lerp, lerp3, kick, clamp01, V3, add3 } from "./story";
import {
  groundTexture, skyTexture, tex, rng, sailTexture, plankTexture, shieldTexture, turfTexture, hideTexture, birchTexture, cloudTexture,
  bubbleTexture, canadaFlagTexture, pebbleTexture, fireTexture, puffTexture,
} from "./paint";
import { Person, Puffs, HERO, sailor, native, digger, drawCard, PoseOpts, yawTo } from "./cast";
import { Outfit, Pen, fxBurst, fxSplash } from "./toon";

export type Kit = Record<string, never>;
export const loadKit = async (): Promise<Kit> => ({});

const lambert = (o: THREE.MeshLambertMaterialParameters) => new THREE.MeshLambertMaterial(o);
const noink = <T extends THREE.Object3D>(o: T) => { o.traverse((c) => c.layers.set(NOINK)); return o; };
const rad = THREE.MathUtils.degToRad;

// set origins
const V: V3 = [0, 0, 0];      // Vinland coast (shore along x, land at -z, sea at +z)
const G: V3 = [-600, 0, 0];   // Greenland fjord (same layout)
const SEA: V3 = [600, 0, 0];  // open Atlantic

// ---------------- waves ----------------
export const waveH = (x: number, z: number, t: number, A: number, k = 1) =>
  A * (0.45 * Math.sin(0.21 * k * x + 1.1 * t) + 0.3 * Math.sin(0.17 * k * z - 0.9 * t + 1.3) + 0.2 * Math.sin(0.13 * k * (x + z) + 0.7 * t + 0.4)
    + 0.12 * Math.sin(0.5 * k * x - 0.37 * k * z + 2.3 * t) + 0.08 * Math.sin(0.7 * k * z + 0.43 * k * x - 2.9 * t));

// ---------------- terrain heights ----------------
const hVin = (x: number, z: number, noChannel = false) => {
  let y: number;
  if (z > -3) y = 0.9 - (z + 3) * 0.17;
  else y = 0.9 + 0.12 * Math.sin(0.3 * x + 1) * Math.cos(0.2 * z) + 0.08 * Math.sin(0.7 * x - 0.4 * z) + Math.max(0, -z - 26) * 0.07 + Math.max(0, -z - 70) * 0.25;
  if (z > -3 && z < 1) y += 0.04 * Math.sin(x * 1.3);
  if (!noChannel && z < 4) { const cx = -16 + 2 * Math.sin(0.15 * z); y -= 0.75 * Math.exp(-(((x - cx) / 1.8) ** 2)) * clamp01((4 - z) / 4); }
  return y;
};
const hGre = (x: number, z: number) => {
  let y: number;
  if (z > -4) y = 0.8 - (z + 4) * 0.2;
  else y = 0.8 + 0.25 * Math.sin(0.25 * x) * Math.cos(0.18 * z + 1) + Math.max(0, -z - 30) ** 1.25 * 0.16;
  if (z < -55) y += 14 * Math.max(0, Math.sin(0.045 * x + 0.6) * Math.sin(0.05 * x - 1.1) + 0.6) * clamp01((-z - 55) / 40);
  return y;
};
export const groundAt = (set: "vin" | "gre", x: number, z: number) => (set === "vin" ? hVin(x - V[0], z - V[2]) : hGre(x - G[0], z - G[2]));

// ---------------- hull ----------------
/** lofted clinker hull: bow at -z. L length, B beam, D keel depth, top/rise gunwale height at mid and at the ends */
const hullGeo = (L: number, B: number, D: number, top: number, rise: number, nz = 44, ns = 18) => {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const W = (t: number) => (B / 2) * Math.pow(Math.sin(Math.PI * t), 0.55);
  const TOP = (t: number) => top + rise * Math.pow(Math.abs(2 * t - 1), 3);
  const BOT = (t: number) => -D * Math.pow(Math.sin(Math.PI * t), 0.45);
  for (let i = 0; i <= nz; i++) {
    const t = i / nz, z = -L / 2 + t * L;
    for (let j = 0; j <= ns; j++) {
      const th = (j / ns - 0.5) * Math.PI;
      const x = W(t) * Math.sin(th), y = BOT(t) + (TOP(t) - BOT(t)) * Math.pow(1 - Math.cos(th), 0.85);
      pos.push(x, y, z); uv.push(t * 3, Math.abs(th) / (Math.PI / 2));
    }
  }
  for (let i = 0; i < nz; i++) for (let j = 0; j < ns; j++) {
    const a = i * (ns + 1) + j, b = a + 1, c = a + ns + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return { g, W, TOP, BOT };
};

// ---------------- simple cards ----------------
class FxCard {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial;
  constructor(parent: THREE.Object3D, w: number, h: number) {
    this.mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.3, depthWrite: false, fog: false, toneMapped: true });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.mat);
    this.mesh.layers.set(NOINK); this.mesh.visible = false; this.mesh.renderOrder = 6; this.mesh.userData.face = true;
    parent.add(this.mesh);
  }
  show(map: THREE.Texture, pos: V3, cam: THREE.Camera, scale = 1, color = 1) {
    if (this.mat.map !== map) { this.mat.map = map; this.mat.needsUpdate = true; }
    this.mat.color.setScalar(color);
    this.mesh.visible = true; this.mesh.position.set(...pos); this.mesh.scale.setScalar(Math.max(0.001, scale));
    this.mesh.quaternion.copy(cam.quaternion);
  }
  hide() { this.mesh.visible = false; }
}
const burstTex = (t: number) => drawCard(`burst|${t.toFixed(2)}`, 500, 500, (g) => fxBurst(new Pen(g), t, "#fff3b0", 12, 50, 240));
const splashTex = (t: number) => drawCard(`splash|${t.toFixed(2)}`, 800, 800, (g) => fxSplash(new Pen(g), t));
const blobTex = () => drawCard("contact", 128, 64, (g) => {
  const gr = g.createRadialGradient(64, 32, 0, 64, 32, 62); gr.addColorStop(0, "rgba(20,14,30,0.55)"); gr.addColorStop(0.6, "rgba(20,14,30,0.3)"); gr.addColorStop(1, "rgba(20,14,30,0)");
  g.setTransform(1, 0, 0, 0.5, 0, 16); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});

type Actor = { o: Outfit; id: string; pos: V3; opts?: PoseOpts };
type LightP = { amb: number; ambC: string; hemi: number; sky: string; gnd: string; sun: number; sunC: string; sunDir: V3; fog: string; near: number; far: number;
  sea: [string, string, string, string]; skyT: THREE.Texture; cloud: number };

// ---------------- the world ----------------
export class World {
  root = new THREE.Group();
  private vin = new THREE.Group(); private gre = new THREE.Group(); private actors = new THREE.Group();
  private amb = new THREE.AmbientLight(0xffffff, 0.4);
  private hemi = new THREE.HemisphereLight(0xcfe3ff, 0x8a7a5a, 1.1);
  private sun = new THREE.DirectionalLight(0xfff1dc, 2.3);
  private fireL = new THREE.PointLight(0xffa860, 0, 0, 1.4);
  private fog = new THREE.Fog(0xcfe0f2, 30, 300);
  // sky + weather
  private sky: THREE.Mesh; private skyMat: THREE.MeshBasicMaterial; private sky2!: THREE.Mesh; private sky2Mat!: THREE.MeshBasicMaterial;
  private sunDisc: THREE.Mesh;
  private clouds: THREE.Mesh[] = [];
  private rain: THREE.LineSegments; private snow: THREE.Points;
  // ocean
  private ocean: THREE.Mesh; private oBase: Float32Array; private oCol: THREE.BufferAttribute;
  // ship
  private ship = new THREE.Group(); private sail: THREE.Mesh; private sailBase: Float32Array; private yard: THREE.Mesh;
  private shipDeckY = 0.18;
  // sets
  private vinTrees: THREE.Mesh[][] = [[], [], [], []]; // near batches that vanish over the millennium
  private hut = new THREE.Group(); private hutWalls: THREE.Mesh[] = []; private hutRoof = new THREE.Group();
  private hall = new THREE.Group(); private mounds = new THREE.Group(); private modern = new THREE.Group(); private era = new THREE.Group();
  private camp = new THREE.Group(); private barrel = new THREE.Group(); private logs = new THREE.Group();
  private grassV: THREE.Mesh; private terrV: THREE.Mesh;
  private fires: { pos: V3; set: THREE.Object3D }[] = [];
  private hutDoor: THREE.Object3D[] = [];
  private flame: FxCard; private flames: THREE.Texture[];
  // cast + fx
  private people: Person[] = []; private pi = 0;
  private shadows: THREE.Mesh[] = [];
  private puffs: Puffs; private smoke: Puffs;
  private fx: FxCard; private fx2: FxCard; private bubble: FxCard;
  private L: Record<Light, LightP>;

  constructor(_kit: Kit) {
    this.root.add(this.vin, this.gre, this.actors, this.amb, this.hemi, this.sun, this.sun.target, this.fireL);
    this.L = this.lightPresets();
    this.buildSky();
    this.buildOcean();
    this.buildShip();
    this.buildVinland();
    this.buildGreenland();
    for (let i = 0; i < 16; i++) this.people.push(new Person(this.actors));
    const bm = new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, fog: false });
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.38).rotateX(-Math.PI / 2), bm);
      m.layers.set(NOINK); m.visible = false; m.renderOrder = 1; this.actors.add(m); this.shadows.push(m);
    }
    this.puffs = new Puffs(this.actors, 40);
    this.smoke = new Puffs(this.actors, 40);
    this.fx = new FxCard(this.actors, 1, 1); this.fx2 = new FxCard(this.actors, 1, 1);
    this.bubble = new FxCard(this.actors, 1, 1);
    this.flames = [0, 1, 2, 3].map(fireTexture);
    this.flame = new FxCard(this.actors, 1, 1);
    (this.flame.mat as THREE.MeshBasicMaterial).color.setRGB(1.6, 1.4, 1.2);
    this.flame.mat.toneMapped = false;
  }

  // ---------------- presets ----------------
  private lightPresets(): Record<Light, LightP> {
    return {
      day: { amb: 0.35, ambC: "#ffffff", hemi: 1.1, sky: "#cfe3ff", gnd: "#8a7a5a", sun: 2.3, sunC: "#fff1dc", sunDir: [-0.5, 0.75, 0.45], fog: "#cfe0f2", near: 35, far: 300,
        sea: ["#1d5f96", "#2f86c4", "#7cc4ec", "#f2fbff"], skyT: skyTexture("#3e7fd2", "#8fb5e4", "#cfe0f2"), cloud: 1 },
      golden: { amb: 0.32, ambC: "#c8b8e8", hemi: 0.8, sky: "#a898d8", gnd: "#7a5a4a", sun: 2.7, sunC: "#ffb36b", sunDir: [0.75, 0.16, -0.65], fog: "#f2c08a", near: 40, far: 290,
        sea: ["#2e5a86", "#4f7fae", "#f0b080", "#fff0d0"], skyT: skyTexture("#7a6aa6", "#f0a878", "#ffd08a"), cloud: 0.95 },
      storm: { amb: 0.55, ambC: "#8a98b8", hemi: 0.75, sky: "#8a9ab0", gnd: "#4a4a50", sun: 0.7, sunC: "#c8d4e8", sunDir: [-0.3, 0.9, 0.3], fog: "#5e6a7c", near: 14, far: 150,
        sea: ["#16303c", "#26485a", "#6f8a96", "#e6eef0"], skyT: skyTexture("#2a3442", "#4a5668", "#66748a"), cloud: 0.45 },
      cold: { amb: 0.45, ambC: "#eef4ff", hemi: 1.15, sky: "#dde8ff", gnd: "#9aa4b4", sun: 1.6, sunC: "#fff6ea", sunDir: [-0.4, 0.6, 0.55], fog: "#dfe8f2", near: 30, far: 260,
        sea: ["#24506e", "#3e7596", "#a8d0e4", "#ffffff"], skyT: skyTexture("#7fa6d4", "#c3d6ea", "#e6eef6"), cloud: 1 },
    };
  }

  // ---------------- builders ----------------
  private buildSky() {
    this.skyMat = new THREE.MeshBasicMaterial({ map: this.lightPresets().day.skyT, side: THREE.BackSide, fog: false, depthWrite: false });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 16), this.skyMat);
    this.sky.renderOrder = -10; this.sky.layers.set(NOINK);
    this.root.add(this.sky);
    // second sky layer: cross-fades the B preset over A while lights blend (no hard texture swap)
    this.sky2Mat = new THREE.MeshBasicMaterial({ map: this.skyMat.map, side: THREE.BackSide, fog: false, depthWrite: false, transparent: true, opacity: 0 });
    this.sky2 = new THREE.Mesh(new THREE.SphereGeometry(419, 32, 16), this.sky2Mat);
    this.sky2.renderOrder = -9.5; this.sky2.layers.set(NOINK); this.sky2.visible = false;
    this.root.add(this.sky2);
    this.sunDisc = new THREE.Mesh(new THREE.CircleGeometry(14, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.5, 1.7), fog: false, toneMapped: false, depthWrite: false }));
    this.sunDisc.layers.set(NOINK); this.sunDisc.renderOrder = -9;
    this.root.add(this.sunDisc);
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(90, 45), new THREE.MeshBasicMaterial({ map: cloudTexture(100 + i), transparent: true, alphaTest: 0.2, fog: false, depthWrite: false }));
      m.layers.set(NOINK); m.renderOrder = -8; this.root.add(m); this.clouds.push(m);
    }
    // rain streaks and snow flakes live around the camera
    const N = 700, rp = new Float32Array(N * 6);
    this.rain = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(rp, 3)),
      new THREE.LineBasicMaterial({ color: 0xd8e2ee, transparent: true, opacity: 0.5, fog: false, depthWrite: false }));
    this.rain.layers.set(NOINK); this.rain.frustumCulled = false; this.root.add(this.rain);
    const M = 900, sp = new Float32Array(M * 3);
    this.snow = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(sp, 3)),
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false, fog: false }));
    this.snow.layers.set(NOINK); this.snow.frustumCulled = false; this.root.add(this.snow);
  }

  private buildOcean() {
    const g = new THREE.PlaneGeometry(640, 640, 210, 210).rotateX(-Math.PI / 2);
    this.oBase = (g.attributes.position.array as Float32Array).slice();
    this.oCol = new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3);
    g.setAttribute("color", this.oCol);
    this.ocean = new THREE.Mesh(g, lambert({ vertexColors: true, color: "#ffffff" }));
    this.ocean.frustumCulled = false;
    this.root.add(this.ocean);
  }

  private buildShip() {
    const plank = plankTexture(62, "#a0703f");
    const hull = hullGeo(16, 4.6, 0.8, 1.05, 1.45);
    const hm = new THREE.Mesh(hull.g, lambert({ map: plank, side: THREE.DoubleSide }));
    this.ship.add(hm);
    // deck: a strip at deck height between the hull sides
    const dp: number[] = [], di: number[] = [], du: number[] = [];
    const n = 40, y = this.shipDeckY;
    for (let i = 0; i <= n; i++) {
      const t = 0.06 + (i / n) * 0.88, z = -8 + t * 16;
      const top = hull.TOP(t), bot = hull.BOT(t), k = clamp01((y - bot) / Math.max(0.01, top - bot));
      const th = Math.acos(clamp01(1 - Math.pow(k, 1 / 0.85))), w = hull.W(t) * Math.sin(th) * 0.98;
      dp.push(-w, y, z, w, y, z); du.push(0, t * 6, 1, t * 6);
    }
    for (let i = 0; i < n; i++) { const a = i * 2; di.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute("uv", new THREE.Float32BufferAttribute(du, 2));
    dg.setIndex(di); dg.computeVertexNormals();
    const deckT = plankTexture(68, "#b98a55"); deckT.repeat.set(1, 1);
    this.ship.add(new THREE.Mesh(dg, lambert({ map: deckT, side: THREE.DoubleSide })));
    // curled stem and stern posts
    const dark = lambert({ color: "#6b4426" });
    for (const s of [-1, 1]) {
      const z0 = s * 8;
      const c = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.6, z0 - s * 0.3), new THREE.Vector3(0, 2.6, z0 + s * 0.15), new THREE.Vector3(0, 3.3, z0 + s * 0.2),
        new THREE.Vector3(0, 3.75, z0 - s * 0.25), new THREE.Vector3(0, 3.55, z0 - s * 0.6), new THREE.Vector3(0, 3.25, z0 - s * 0.45),
      ]);
      this.ship.add(new THREE.Mesh(new THREE.TubeGeometry(c, 40, 0.13, 8), dark));
    }
    // gunwale rail
    const rail: THREE.Vector3[][] = [[], []];
    for (let i = 2; i <= 42; i++) { const t = i / 44, z = -8 + t * 16; for (const s of [0, 1]) rail[s].push(new THREE.Vector3((s ? 1 : -1) * hull.W(t), hull.TOP(t) + 0.03, z)); }
    for (const r of rail) this.ship.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(r), 60, 0.07, 6), dark));
    // shields along both sides
    const cols: [string, string][] = [["#c9a23f", "#2f5f6a"], ["#b8322c", "#efe3c4"], ["#2f5f6a", "#efe3c4"], ["#3a3a3a", "#c9a23f"]];
    const st = cols.map(([a, b]) => lambert({ map: shieldTexture(a, b) }));
    const rim = lambert({ color: "#5a4a3a" });
    for (let k = 0; k < 7; k++) for (const s of [-1, 1]) {
      const t = 0.24 + k * 0.085, z = -8 + t * 16;
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 24), [rim, st[(k + (s > 0 ? 1 : 0)) % 4], rim]);
      sh.rotation.z = (s * Math.PI) / 2; sh.position.set(s * (hull.W(t) + 0.05), hull.TOP(t) - 0.2, z);
      this.ship.add(sh);
    }
    // mast, yard, stays, sail
    const wood = lambert({ color: "#7a5230" });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 9.4, 10).translate(0, 4.7, 0), wood); mast.position.z = -0.6;
    this.yard = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 7.6, 8).rotateZ(Math.PI / 2), wood); this.yard.position.set(0, 8.4, -0.85);
    this.ship.add(mast, this.yard);
    const stay = (a: V3, b: V3) => {
      const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), len = va.distanceTo(vb);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, len, 5), lambert({ color: "#3a2a1a" }));
      m.position.copy(va.clone().add(vb).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
      this.ship.add(m);
    };
    stay([0, 9.2, -0.6], [0, 2.0, -7.6]); stay([0, 9.2, -0.6], [0, 2.0, 7.6]);
    stay([0, 8.8, -0.6], [2.0, 1.2, 1.5]); stay([0, 8.8, -0.6], [-2.0, 1.2, 1.5]);
    const sg = new THREE.PlaneGeometry(7.2, 5.8, 16, 12);
    this.sailBase = (sg.attributes.position.array as Float32Array).slice();
    this.sail = new THREE.Mesh(sg, lambert({ map: sailTexture(), side: THREE.DoubleSide }));
    this.sail.position.set(0, 5.45, -1.0);
    this.ship.add(this.sail);
    // cargo: a couple of barrels and a bundle mid-ship
    const bt = plankTexture(69, "#8a5a32");
    for (const [x, z] of [[0.8, 2.6], [-0.9, 3.1], [0.6, 3.8]] as const) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.8, 14).translate(0, 0.4, 0), lambert({ map: bt }));
      b.position.set(x, this.shipDeckY, z); this.ship.add(b);
    }
    this.root.add(this.ship);
  }

  private terrain(set: THREE.Group, origin: V3, w: number, d: number, nx: number, nz: number, zc: number, h: (x: number, z: number) => number, col: (x: number, z: number, y: number, slope: number) => THREE.Color, seed: number) {
    const g = new THREE.PlaneGeometry(w, d, nx, nz).rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i) + zc; p.setXYZ(i, x, h(x, z), z); }
    g.computeVertexNormals();
    const nrm = g.attributes.normal as THREE.BufferAttribute;
    const c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const cc = col(p.getX(i), p.getZ(i), p.getY(i), 1 - nrm.getY(i)); c[i * 3] = cc.r; c[i * 3 + 1] = cc.g; c[i * 3 + 2] = cc.b; }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    const t = groundTexture(seed, "#ececec", ["#dedede", "#f8f8f8", "#d2d2d2"], ["#c4c4c4", "#ffffff"]); t.repeat.set(w / 8, d / 8);
    const m = new THREE.Mesh(g, lambert({ map: t, vertexColors: true }));
    m.position.set(...origin); set.add(m);
    return m;
  }

  private pines(positions: [number, number, number, number][], mats: THREE.Material[], snow = false) {
    // merged geometry per colour; returns meshes
    const parts: THREE.BufferGeometry[][] = mats.map(() => []), trunks: THREE.BufferGeometry[] = [], caps: THREE.BufferGeometry[] = [];
    positions.forEach(([x, y, z, s], i) => {
      const k = i % mats.length;
      trunks.push(new THREE.CylinderGeometry(0.14 * s, 0.22 * s, 2.2 * s, 7).translate(x, y + 1.1 * s, z));
      for (let j = 0; j < 4; j++) {
        const r = (1.9 - j * 0.38) * s, hh = 2.6 * s, yy = y + (2.2 + j * 1.55) * s + hh / 2;
        parts[k].push(new THREE.ConeGeometry(r, hh, 9).rotateY(i * 0.7).translate(x, yy, z));
        if (snow) caps.push(new THREE.ConeGeometry(r * 0.55, hh * 0.45, 9).rotateY(i * 0.7).translate(x, yy + hh * 0.28, z));
      }
    });
    const out: THREE.Mesh[] = [];
    mats.forEach((m, k) => { if (parts[k].length) out.push(new THREE.Mesh(mergeGeometries(parts[k]), m)); });
    if (trunks.length) out.push(new THREE.Mesh(mergeGeometries(trunks), lambert({ color: "#6b4a2c" })));
    if (caps.length) out.push(new THREE.Mesh(mergeGeometries(caps), lambert({ color: "#f4f7fb" })));
    return out;
  }

  private turfHouse(len: number, wid: number, wallH: number, roofH: number, turf: THREE.Texture, snowRoof = false) {
    const grp = new THREE.Group();
    const wallM = lambert({ map: turf, color: "#d8c8a8" }), roofM = lambert({ map: turf, color: "#d8e4c0" });
    const walls: THREE.Mesh[] = [];
    const wall = (w: number, d: number, x: number, z: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d).translate(0, wallH / 2, 0), wallM); m.position.set(x, 0, z); grp.add(m); walls.push(m); };
    wall(len, 0.9, 0, -wid / 2); wall(0.9, wid, -len / 2, 0); wall(0.9, wid, len / 2, 0);
    wall(len * 0.38, 0.9, -len * 0.31, wid / 2); wall(len * 0.38, 0.9, len * 0.31, wid / 2);
    const shape = new THREE.Shape([new THREE.Vector2(-wid / 2 - 0.7, 0), new THREE.Vector2(0, roofH), new THREE.Vector2(wid / 2 + 0.7, 0)]);
    const roofG = new THREE.ExtrudeGeometry(shape, { depth: len + 1.0, bevelEnabled: false }).translate(0, 0, -(len + 1.0) / 2).rotateY(Math.PI / 2);
    const roof = new THREE.Mesh(roofG, snowRoof ? lambert({ color: "#f2f6fa" }) : roofM); roof.position.y = wallH - 0.05;
    const roofGrp = new THREE.Group(); roofGrp.add(roof);
    if (snowRoof) { const under = new THREE.Mesh(roofG, roofM); under.position.y = wallH - 0.25; under.scale.set(1.02, 1, 1.02); roofGrp.add(under); }
    grp.add(roofGrp);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.7), lambert({ color: "#1c1410" })); door.position.set(0, 0.85, wid / 2 + 0.47); door.layers.set(NOINK);
    const frame = lambert({ color: "#7a5230" });
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.9, 0.2), frame); p.position.set(s * 0.68, 0.95, wid / 2 + 0.45); grp.add(p); }
    const lin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 0.22), frame); lin.position.set(0, 1.9, wid / 2 + 0.45); grp.add(lin, door);
    return { grp, walls, roof: roofGrp, door: [door, lin, ...grp.children.filter((c) => c !== roofGrp && !walls.includes(c as THREE.Mesh) && c !== door && c !== lin)] };
  }

  private buildVinland() {
    this.vin.position.set(...V);
    const sand = new THREE.Color("#d9c49a"), wet = new THREE.Color("#a8946e"), grass = new THREE.Color("#8fbf5a"), grassD = new THREE.Color("#6f9d3e"), dirt = new THREE.Color("#9a7a52");
    this.terrV = this.terrain(this.vin, [0, 0, 0], 300, 230, 150, 115, -95, (x, z) => hVin(x, z), (x, z, y, sl) => {
      const beach = clamp01((z + 2.5) / 2.5);
      const c = grass.clone().lerp(grassD, clamp01(0.5 + 0.5 * Math.sin(x * 0.21 + z * 0.13)));
      c.lerp(dirt, clamp01(sl * 3)).lerp(sand, beach);
      if (y < 0.25) c.lerp(wet, clamp01((0.25 - y) / 0.4));
      return c;
    }, 12);
    // pebble strip over the beach
    const pb = new THREE.PlaneGeometry(300, 9, 150, 18).rotateX(-Math.PI / 2);
    const pp = pb.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), z = pp.getZ(i) - 0.5; pp.setXYZ(i, x, hVin(x, z, true) + 0.015, z); }
    pb.computeVertexNormals();
    const pt = pebbleTexture(); pt.repeat.set(60, 2);
    const pmat = lambert({ map: pt, transparent: true, alphaMap: (() => { const c = document.createElement("canvas"); c.width = 4; c.height = 64; const g = c.getContext("2d")!; const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, "#000"); gr.addColorStop(0.25, "#fff"); gr.addColorStop(0.85, "#fff"); gr.addColorStop(1, "#000"); g.fillStyle = gr; g.fillRect(0, 0, 4, 64); return tex(c, false, false); })() });
    const pebbles = new THREE.Mesh(pb, pmat); pebbles.layers.set(NOINK); this.vin.add(pebbles);
    // stream ribbon
    const sp: number[] = [], si: number[] = [];
    const n = 60;
    for (let i = 0; i <= n; i++) {
      const z = -40 + (i / n) * 43, cx = -16 + 2 * Math.sin(0.15 * z), y = Math.min(0.42, hVin(cx, z, true) - 0.32);
      sp.push(cx - 1.4, y, z, cx + 1.4, y, z);
    }
    for (let i = 0; i < n; i++) { const a = i * 2; si.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); sg.setIndex(si); sg.computeVertexNormals();
    const stream = new THREE.Mesh(sg, lambert({ color: "#4f9ed0", emissive: "#1a4a6a", emissiveIntensity: 0.3 })); stream.layers.set(NOINK);
    this.vin.add(stream);
    // forest: far (stays) + near batches (vanish over the millennium)
    const r = rng(21), far: [number, number, number, number][] = [], near: [number, number, number, number][][] = [[], [], [], []];
    const pineM = [lambert({ color: "#2f5b46" }), lambert({ color: "#3a6b4e" }), lambert({ color: "#28513e" })];
    for (let i = 0; i < 520; i++) {
      const x = -140 + r() * 280, z = -16 - r() * 190;
      if (Math.abs(x + 16) < 3.5 && z > -40) continue;              // keep the stream open
      if (x > 22 && x < 52 && z > -22) continue;                      // camp clearing
      const s = 1.0 + r() * 0.7 + (z < -40 ? 0.3 : 0);
      const pos: [number, number, number, number] = [x, hVin(x, z) - 0.1, z, s];
      if (z > -50 && Math.abs(x) < 70) near[i % 4].push(pos); else far.push(pos);
    }
    // a few lone pines on the meadow edge
    for (const [x, z] of [[-27, -10], [-25.5, -16.5], [12, -15], [16, -13], [-28, -18]] as const) near[0].push([x, hVin(x, z) - 0.1, z, 1.3]);
    this.pines(far, pineM).forEach((m) => this.vin.add(m));
    near.forEach((b, k) => this.pines(b, pineM).forEach((m) => { this.vin.add(m); this.vinTrees[k].push(m); }));
    const rockM = lambert({ color: "#8f8a80" });
    for (let i = 0; i < 26; i++) {
      const x = -60 + r() * 120, z = -2 + r() * 4, m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25 + r() * 0.5, 0), rockM);
      m.position.set(x, hVin(x, z) + 0.05, z); m.rotation.set(r() * 3, r() * 3, 0); m.scale.y = 0.6; this.vin.add(m);
    }
    // the Norse site: a finished hall and the shelter going up
    const turf = turfTexture(); turf.repeat.set(2, 1);
    const hall = this.turfHouse(11, 5.5, 1.6, 2.4, turf);
    hall.grp.position.set(-6, hVin(-6, -12) - 0.05, -12); hall.grp.rotation.y = 0.12;
    this.hall.add(hall.grp); this.era.add(this.hall);
    const hut = this.turfHouse(7, 4.5, 1.5, 2.0, turf);
    this.hutWalls = hut.walls; this.hutRoof = hut.roof; this.hutDoor = hut.door;
    this.hut.add(hut.grp);
    const post = lambert({ color: "#8a5c34" });
    for (const [x, z] of [[-3.5, -2.25], [3.5, -2.25], [-3.5, 2.25], [3.5, 2.25], [0, -2.25], [0, 2.25]] as const) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, x === 0 ? 3.4 : 1.9, 7).translate(0, x === 0 ? 1.7 : 0.95, 0), post); m.position.set(x, 0, z); this.hut.add(m);
    }
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 7.4, 7).rotateZ(Math.PI / 2), post); ridge.position.set(0, 3.4, 0); this.hut.add(ridge);
    for (let k = 0; k < 5; k++) for (const s of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.9, 6), post);
      m.position.set(-3.2 + k * 1.6, 2.6, s * 1.15); m.rotation.x = s * 0.92; this.hut.add(m);
    }
    this.hut.position.set(5, hVin(5, -7) - 0.05, -7); this.hut.rotation.y = -0.08;
    this.era.add(this.hut);
    // logs, barrels, baskets
    const bark = lambert({ color: "#7a5a3a" }), cut = lambert({ color: "#d8b07a" });
    for (let k = 0; k < 7; k++) {
      const row = k < 4 ? 0 : k < 6 ? 1 : 2, i = row === 0 ? k : row === 1 ? k - 4 : 0;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 3.6, 10).rotateZ(Math.PI / 2), [bark, cut, cut]);
      m.position.set(0, 0.22 + row * 0.38, -0.9 + i * 0.46 + row * 0.23); this.logs.add(m);
    }
    this.logs.position.set(11.5, hVin(11.5, -4) - 0.05, -4); this.logs.rotation.y = 0.4; this.era.add(this.logs);
    const bt = plankTexture(69, "#8a5a32"), band = lambert({ color: "#3a2a1a" });
    const barrel = (open: boolean) => {
      const b = new THREE.Group();
      b.add(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 1.0, 18, 1, open).translate(0, 0.5, 0), lambert({ map: bt, side: THREE.DoubleSide })));
      for (const y of [0.12, 0.88]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.03, 6, 24).rotateX(Math.PI / 2), band); t.position.y = y; b.add(t); }
      if (open) {
        const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.38, 18).rotateX(-Math.PI / 2), lambert({ color: "#3a2618" })); bottom.position.y = 0.12; b.add(bottom);
        for (const [x, z] of [[0.1, 0.05], [-0.12, -0.08]] as const) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), lambert({ color: "#c9a26a" })); c.position.set(x, 0.17, z); b.add(c); }
      } else { const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 18), lambert({ map: bt })); lid.position.y = 1.0; b.add(lid); }
      return b;
    };
    this.barrel = barrel(true);
    this.barrel.position.set(9.2, hVin(9.2, -2.6), -2.6); this.era.add(this.barrel);
    for (const [x, z] of [[10.5, -3.5], [11.1, -2.6]] as const) { const b = barrel(false); b.position.set(x, hVin(x, z), z); this.era.add(b); }
    this.vin.add(this.era);
    // the camp of the people of the land
    const hide = hideTexture(); hide.repeat.set(2, 1);
    const hideM = lambert({ map: hide, side: THREE.DoubleSide }), poleM = lambert({ color: "#6b4a2c" });
    for (const [x, z, s] of [[30, -10, 1], [37, -13, 1.15], [44, -9, 0.95]] as const) {
      const L = new THREE.Group();
      L.add(new THREE.Mesh(new THREE.ConeGeometry(2.3, 4.2, 12, 1, true).translate(0, 2.1, 0), hideM));
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; const m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.4, 5), poleM); m.position.set(0.18 * Math.cos(a), 4.6, 0.18 * Math.sin(a)); m.rotation.set(0.25 * Math.sin(a), 0, -0.25 * Math.cos(a)); L.add(m); }
      const dg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.6, 0.02, 0), new THREE.Vector3(0.6, 0.02, 0), new THREE.Vector3(0, 1.6, -0.45)]); dg.computeVertexNormals();
      const door = new THREE.Mesh(dg, lambert({ color: "#24180f", side: THREE.DoubleSide })); door.position.set(0, 0, 2.08); door.layers.set(NOINK); L.add(door);
      L.position.set(x, hVin(x, z) - 0.05, z); L.scale.setScalar(s); L.rotation.y = (x - 37) * -0.04; this.camp.add(L);
    }
    const canoe = hullGeo(5.2, 0.95, 0.28, 0.32, 0.45, 30, 10);
    const cm = new THREE.Mesh(canoe.g, lambert({ map: birchTexture(), side: THREE.DoubleSide }));
    cm.position.set(34, hVin(34, 1.5) + 0.22, 1.5); cm.rotation.y = 1.35; this.camp.add(cm);
    const stoneM = lambert({ color: "#a7a197" });
    for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2, m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), stoneM); m.position.set(37 + 0.75 * Math.cos(a), hVin(37, -5) + 0.08, -5 + 0.75 * Math.sin(a)); this.camp.add(m); }
    this.fires.push({ pos: [37, hVin(37, -5), -5], set: this.camp });
    this.vin.add(this.camp);
    // a thousand years later: grass mounds where the walls stood, a dig, a flag
    const moundM = lambert({ color: "#8fbf5a" });
    const mound = (cx: number, cz: number, len: number, wid: number, rot: number) => {
      const g = new THREE.Group();
      for (const [x, z, l, rz] of [[0, -wid / 2, len, 0], [0, wid / 2, len * 0.9, 0], [-len / 2, 0, wid, 1], [len / 2, 0, wid, 1]] as const) {
        const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, l, 4, 10).rotateZ(Math.PI / 2), moundM);
        m.scale.set(1, 0.55, 1); if (rz) m.rotation.y = Math.PI / 2; m.position.set(x, 0.05, z); g.add(m);
      }
      g.position.set(cx, hVin(cx, cz) - 0.1, cz); g.rotation.y = rot; return g;
    };
    this.mounds.add(mound(-6, -12, 11, 5.5, 0.12), mound(5, -7, 7, 4.5, -0.08));
    this.vin.add(this.mounds);
    const white = lambert({ color: "#f4f2ea" });
    for (let k = 0; k <= 4; k++) {
      const a = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.03, 0.03), white); a.position.set(5, hVin(5, -7) + 0.35, -9.2 + k * 1.1); this.modern.add(a);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 4.4), white); b.position.set(2 + k * 1.5, hVin(5, -7) + 0.35, -7); this.modern.add(b);
    }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 5, 8).translate(0, 2.5, 0), lambert({ color: "#d9dde0" })); pole.position.set(9.5, hVin(9.5, -11), -11);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.0, 10, 4), lambert({ map: canadaFlagTexture(), side: THREE.DoubleSide })); flag.position.set(10.5, hVin(9.5, -11) + 4.4, -11); flag.userData.flag = true;
    this.modern.add(pole, flag);
    const tent = new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-1.4, 0), new THREE.Vector2(0, 1.8), new THREE.Vector2(1.4, 0)]), { depth: 3, bevelEnabled: false }), lambert({ color: "#e8e4d6" }));
    tent.position.set(14, hVin(14, -12), -13.5); tent.rotation.y = 0.3; this.modern.add(tent);
    for (const [x, z, c] of [[7.8, -4.2, "#c25a3a"], [8.4, -4.6, "#3f6fb5"]] as const) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.4, 14).translate(0, 0.2, 0), lambert({ color: c })); b.position.set(x, hVin(x, z), z); this.modern.add(b);
    }
    this.vin.add(this.modern);
  }

  private buildGreenland() {
    this.gre.position.set(...G);
    const snow = new THREE.Color("#f3f6fa"), snowS = new THREE.Color("#dfe7f2"), rock = new THREE.Color("#8a8a8e"), sand = new THREE.Color("#b8b0a2");
    this.terrain(this.gre, [0, 0, 0], 320, 260, 140, 110, -110, (x, z) => hGre(x, z), (x, z, y, sl) => {
      const c = snow.clone().lerp(snowS, clamp01(0.5 + 0.5 * Math.sin(x * 0.17 - z * 0.11)));
      c.lerp(rock, clamp01((sl - 0.18) * 3.2));
      if (y < 0.35) c.lerp(sand, clamp01((0.35 - y) / 0.4));
      return c;
    }, 13);
    const turf = turfTexture(71); turf.repeat.set(3, 1);
    const lh = this.turfHouse(11, 5.5, 1.6, 2.5, turf, true);
    lh.grp.position.set(-6, hGre(-6, -14) - 0.05, -14); lh.grp.rotation.y = 0.05;
    this.gre.add(lh.grp);
    this.smokeAt = [-6 + G[0], hGre(-6, -14) + 4.6, -14];
    // jetty
    const wood = lambert({ map: plankTexture(72, "#8a6a48") });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 14), wood); deck.position.set(9, 0.95, 4); this.gre.add(deck);
    for (let k = 0; k < 6; k++) for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 7), lambert({ color: "#5a4030" })); p.position.set(9 + s * 1.0, -0.2, -2 + k * 2.6); this.gre.add(p); }
    // icebergs
    const ice = lambert({ color: "#eef7ff", emissive: "#9fc8e8", emissiveIntensity: 0.25, flatShading: true });
    for (const [x, z, s] of [[-30, 55, 6], [45, 85, 9], [-85, 130, 12], [20, 40, 2.5]] as const) {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), ice); m.scale.set(s * 1.3, s * 0.8, s); m.position.set(x, s * 0.2, z); m.rotation.y = x; this.gre.add(m);
    }
    // rocks poking through the snow
    const r = rng(9), rockM = lambert({ color: "#9a958e" });
    for (let i = 0; i < 22; i++) { const x = -50 + r() * 100, z = -40 + r() * 26; if (Math.abs(x) < 9 && z > -16) continue; const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + r() * 0.9, 0), rockM); m.position.set(x, hGre(x, z), z); m.scale.y = 0.6; m.rotation.set(r(), r() * 3, 0); this.gre.add(m); }
    this.fires.push({ pos: [2 + G[0], hGre(2, -7), -7], set: this.gre });
    const stoneM = lambert({ color: "#a7a197" });
    for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2, m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), stoneM); m.position.set(2 + 0.75 * Math.cos(a), hGre(2, -7) + 0.08, -7 + 0.75 * Math.sin(a)); this.gre.add(m); }
  }
  private smokeAt: V3 = [0, 0, 0];

  // ---------------- per-frame helpers ----------------
  private light(a: Light, b: Light = a, t = 0) {
    const A = this.L[a], B = this.L[b], l = (x: number, y: number) => lerp(x, y, t), c = (x: string, y: string) => new THREE.Color(x).lerp(new THREE.Color(y), t);
    this.amb.intensity = l(A.amb, B.amb); this.amb.color.copy(c(A.ambC, B.ambC));
    this.hemi.intensity = l(A.hemi, B.hemi); this.hemi.color.copy(c(A.sky, B.sky)); this.hemi.groundColor.copy(c(A.gnd, B.gnd));
    this.sun.intensity = l(A.sun, B.sun); this.sun.color.copy(c(A.sunC, B.sunC));
    const d = lerp3(A.sunDir, B.sunDir, t);
    this.sunDir.set(...d).normalize();
    this.fog.color.copy(c(A.fog, B.fog)); this.fog.near = l(A.near, B.near); this.fog.far = l(A.far, B.far);
    this.skyMat.map = A.skyT;
    this.sky2Mat.map = B.skyT; this.sky2Mat.opacity = t; this.sky2.visible = B.skyT !== A.skyT && t > 0.001;
    this.seaCols = [0, 1, 2, 3].map((i) => c(A.sea[i], B.sea[i]));
    this.cloudK = l(A.cloud, B.cloud);
    this.golden = (a === "golden" ? 1 - t : 0) + (b === "golden" ? t : 0);
  }
  private sunDir = new THREE.Vector3(); private seaCols: THREE.Color[] = []; private cloudK = 1; private golden = 0;

  private oceanUpdate(f: number, cam: THREE.PerspectiveCamera, A: number, k = 1) {
    const sx = Math.round(cam.position.x / 3.05) * 3.05, sz = Math.round(cam.position.z / 3.05) * 3.05;
    const p = this.ocean.geometry.attributes.position as THREE.BufferAttribute, b = this.oBase, t = f / FPS;
    const [deep, mid, crest, foam] = this.seaCols, col = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = b[i * 3] + sx, z = b[i * 3 + 2] + sz;
      const y = waveH(x, z, t, A, k);
      p.setXYZ(i, x, y, z);
      const h = A > 0.001 ? y / A : 0;
      if (h < 0) col.copy(deep).lerp(mid, clamp01(1 + h * 1.6)); else col.copy(mid).lerp(crest, clamp01(h * 1.4));
      if (h > 0.62) col.lerp(foam, clamp01((h - 0.62) * 3.2));
      this.oCol.setXYZ(i, col.r, col.g, col.b);
    }
    p.needsUpdate = true; this.oCol.needsUpdate = true;
    this.ocean.geometry.computeVertexNormals();
  }

  /** places the ship: waterline origin at pos, bow toward -z rotated by yaw; rides the waves; extra heel in degrees */
  private shipAt(f: number, pos: V3, yaw: number, A: number, k = 1, heel = 0, beached = 0) {
    const t = f / FPS, c = Math.cos(yaw), s = Math.sin(yaw);
    const at = (lx: number, lz: number) => waveH(pos[0] + lx * c + lz * s, pos[2] - lx * s + lz * c, t, A, k);
    const bow = at(0, -6), stern = at(0, 6), port = at(-2, 0), stb = at(2, 0), mid = (bow + stern + port + stb) / 4;
    const wave = 1 - beached;
    this.ship.position.set(pos[0], pos[1] + mid * wave, pos[2]);
    this.ship.rotation.set(0, 0, 0);
    this.ship.rotateY(yaw);
    this.ship.rotateX(Math.atan2(bow - stern, 12) * 0.8 * wave + beached * rad(3.5));
    this.ship.rotateZ(Math.atan2(stb - port, 4) * 0.7 * wave + rad(heel));
    this.ship.visible = true;
    this.ship.updateMatrixWorld(true);
  }
  private sailSet(f: number, set: number, storm = 0) {
    const p = this.sail.geometry.attributes.position as THREE.BufferAttribute, b = this.sailBase;
    for (let i = 0; i < p.count; i++) {
      const x = b[i * 3], y = b[i * 3 + 1], v = (2.9 - y) / 5.8;           // v: 0 at the yard, 1 at the foot
      const yy = 2.9 - (2.9 - y) * set;
      const belly = (1 - (x / 3.6) ** 2) * Math.sin(Math.PI * Math.min(1, v * set)) * 0.9 * set;
      const flap = storm * 0.18 * Math.sin(f * 0.9 + x * 1.3 + y) * v;
      p.setXYZ(i, x, yy, -belly + flap);
    }
    p.needsUpdate = true; this.sail.geometry.computeVertexNormals();
  }
  private onShip(lx: number, lz: number, ly = this.shipDeckY): V3 {
    const v = new THREE.Vector3(lx, ly, lz); this.ship.localToWorld(v); return [v.x, v.y, v.z];
  }

  private actor(f: number, cam: THREE.Camera, a: Actor, shadow = true) {
    const p = this.people[this.pi], sh = this.shadows[this.pi];
    this.pi++;
    if (!p) return;
    const blink = a.opts?.blink ?? ((f + a.id.length * 23 + a.id.charCodeAt(0) * 7) % 64 < 4);
    p.pose(a.o, a.id, a.pos, cam, { ...a.opts, blink });
    if (shadow && sh) { sh.visible = true; sh.position.set(a.pos[0], a.pos[1] + 0.03, a.pos[2]); sh.scale.setScalar(a.opts?.scale ?? 1); }
  }
  private endActors() {
    for (let i = this.pi; i < this.people.length; i++) { this.people[i].hide(); this.shadows[i].visible = false; }
  }

  private weather(f: number, cam: THREE.Camera, rain: number, snow: number, wind = 0) {
    this.rain.visible = rain > 0.01;
    if (this.rain.visible) {
      (this.rain.material as THREE.LineBasicMaterial).opacity = 0.5 * rain;
      const p = this.rain.geometry.attributes.position as THREE.BufferAttribute, r = rng(4), c = cam.position;
      for (let i = 0; i < p.count / 2; i++) {
        const x = (r() - 0.5) * 16, z = (r() - 0.5) * 16, sp = 0.5 + r() * 0.25, y0 = r() * 10;
        const y = ((y0 - f * sp) % 10 + 10) % 10 - 3;
        const X = c.x + x + wind * y * 0.25, Z = c.z + z, Y = c.y + y;
        p.setXYZ(i * 2, X, Y, Z); p.setXYZ(i * 2 + 1, X - wind * 0.15, Y - 0.6, Z);
      }
      p.needsUpdate = true;
    }
    this.snow.visible = snow > 0.01;
    if (this.snow.visible) {
      const p = this.snow.geometry.attributes.position as THREE.BufferAttribute, r = rng(3), c = cam.position;
      for (let i = 0; i < p.count; i++) {
        const x = (r() - 0.5) * 16, z = (r() - 0.5) * 16, speed = 0.012 + r() * 0.01, y0 = r() * 9;
        const y = ((y0 - f * speed * 1.4) % 9 + 9) % 9 - 3;
        p.setXYZ(i, c.x + x + 0.3 * Math.sin(f * 0.03 + i), c.y + y, c.z + z);
      }
      p.needsUpdate = true;
    }
  }

  private fireAt(f: number, cam: THREE.Camera, pos: V3 | null, size = 1) {
    if (!pos) { this.flame.hide(); this.fireL.intensity = 0; return; }
    this.flame.show(this.flames[Math.floor(f / 3) % 4], [pos[0], pos[1] + 0.45 * size, pos[2]], cam, 1.0 * size);
    const fl = 1 + 0.1 * Math.sin(f * 1.7) + 0.06 * Math.sin(f * 4.3 + 1);
    this.fireL.position.set(pos[0], pos[1] + 1.0, pos[2]); this.fireL.intensity = 14 * fl;
  }

  private skyUpdate(cam: THREE.Camera) {
    this.sky.position.copy(cam.position); this.sky2.position.copy(cam.position);
    const d = this.sunDir;
    this.sunDisc.visible = this.golden > 0.5;
    this.sunDisc.position.set(cam.position.x + d.x * 380, Math.max(6, d.y * 380) + cam.position.y * 0.0, cam.position.z + d.z * 380);
    this.sunDisc.lookAt(cam.position);
    this.sun.position.set(cam.position.x + d.x * 50, cam.position.y + d.y * 50, cam.position.z + d.z * 50);
    this.sun.target.position.copy(cam.position);
    this.clouds.forEach((m, i) => {
      const a = (i / this.clouds.length) * Math.PI * 2 + 0.3, R = 330 + (i % 3) * 25;
      m.position.set(cam.position.x + R * Math.cos(a), 55 + (i % 4) * 22, cam.position.z + R * Math.sin(a));
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      const s = this.cloudK;
      (m.material as THREE.MeshBasicMaterial).color.setRGB(s, s, s * (this.golden > 0.5 ? 0.9 : 1.02));
      if (this.golden > 0.5) (m.material as THREE.MeshBasicMaterial).color.setRGB(1.0, 0.82, 0.74);
    });
  }

  // ---------------- the frame ----------------
  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene): { focus: V3; shot: Shot } {
    scene.fog = this.fog;
    cam.layers.enable(NOINK);
    const shot = shotAt(f), t = f - shot.a, len = shot.b - shot.a, u = t / len;
    let pos: V3 = [0, 1.6, 3], look: V3 = [0, 1.6, 0], fov = 50, roll = 0, focus: V3 = [0, 1.6, 0];
    const B = (w: number) => w - 3;
    this.pi = 0;
    this.puffs.hide(); this.smoke.hide(); this.fx.hide(); this.fx2.hide(); this.bubble.hide();
    this.fireAt(f, cam, null);
    this.ship.visible = false;
    this.vin.visible = false; this.gre.visible = false;
    this.era.visible = true; this.modern.visible = false; this.mounds.visible = false; this.camp.visible = true;
    this.hut.visible = true; this.hutWalls.forEach((w) => (w.scale.y = 1)); this.hutRoof.visible = true; this.hut.scale.y = 1; this.hall.scale.y = 1;
    this.logs.visible = true; this.barrel.visible = true; this.mounds.scale.y = 1;
    this.hutDoor.forEach((d) => (d.visible = true));
    this.vinTrees.forEach((b) => b.forEach((m) => (m.visible = true)));
    let seaA = 0.12, seaK = 1, rain = 0, snow = 0, wind = 0;
    this.sailSet(f, 1, 0);
    const vy = (x: number, z: number) => hVin(x, z);
    const gy = (x: number, z: number) => hGre(x, z);
    const Gp = (x: number, z: number, dy = 0): V3 => [G[0] + x, gy(x, z) + dy, G[2] + z];
    const Vp = (x: number, z: number, dy = 0): V3 => [V[0] + x, vy(x, z) + dy, V[2] + z];
    const S = (x: number, y: number, z: number): V3 => [SEA[0] + x, SEA[1] + y, SEA[2] + z];
    const blinkOff = { blink: false };

    switch (shot.id) {
      case "hook": { // golden morning: our Viking on the prow, the forested coast ahead
        this.light("golden"); this.vin.visible = true;
        seaA = 0.3;
        const zs = lerp(64, 52, u);
        this.shipAt(f, [2, 0, zs], 0.18, seaA);
        const hero = this.onShip(0, -5.4);
        this.actor(f, cam, { o: HERO, id: "hero", pos: hero, opts: { expr: f < B(T.reached) ? "smile" : "grin", facing: -1 } }, false);
        this.actor(f, cam, { o: sailor(1), id: "s1", pos: this.onShip(0.9, -1.8), opts: { expr: "smile" } }, false);
        this.actor(f, cam, { o: sailor(3), id: "s3", pos: this.onShip(-1.0, 1.2), opts: { expr: "neutral" } }, false);
        const p0 = this.onShip(1.9, -1.4, 2.7), p1 = this.onShip(1.6, -2.0, 2.6);
        pos = lerp3(p0, p1, smooth(u)); look = this.onShip(-1.4, -9.5, 1.8); fov = 56; roll = -2;
        focus = [hero[0], hero[1] + 1.6, hero[2]];
        break;
      }
      case "stormFlash": { // the crossing nearly killed you
        this.light("storm"); seaA = 1.9; seaK = 0.7; rain = 1; wind = 1;
        const heel = 10 * Math.sin(t * 0.09 + 0.5);
        this.shipAt(f, S(0, 0, 0), 0.6, seaA, seaK, heel);
        this.sailSet(f, 1, 1);
        const hero = this.onShip(0.5, -0.1);
        this.actor(f, cam, { o: HERO, id: "hero", pos: hero, opts: { expr: f < B(T.killed) ? "nervous" : "shock", tilt: -heel * 0.8, facing: 1 } }, false);
        this.actor(f, cam, { o: sailor(2), id: "s2", pos: this.onShip(-1.1, 2.4), opts: { expr: "pained", tilt: -heel } }, false);
        pos = this.onShip(6.2, -3.6, 2.9); look = this.onShip(0.3, -0.6, 1.9); fov = 50; roll = 6 - heel * 0.9;
        const k = kick(f, [B(T.killed)], 0.08); pos = add3(pos, k);
        if (f >= B(T.killed) && f < B(T.killed) + 18) this.fx.show(splashTex(clamp01((f - B(T.killed)) / 18)), this.onShip(3.0, -1.2, 1.2), cam, 2.6);
        focus = [hero[0], hero[1] + 1.6, hero[2]];
        break;
      }
      case "greenland": { // around the year 1000, freezing Greenland
        this.light("cold"); this.gre.visible = true; snow = 1; seaA = 0.1;
        const hp = Gp(0.5, -7.5);
        const shiver = Math.sin(f * 2.2) * 0.012;
        this.actor(f, cam, { o: HERO, id: "hero", pos: [hp[0] + shiver, hp[1], hp[2]], opts: { expr: f < B(T.freezing1) ? "neutral" : "nervous", facing: 0 } });
        this.actor(f, cam, { o: sailor(4), id: "s4", pos: Gp(-4.5, -10.2), opts: { expr: "nervous", mode: "stroll", phase: t / 20 } });
        this.puffs.update(f, cam, [[hp[0] + 0.12, hp[1] + 1.95, hp[2] + 0.2]], { period: 34, life: 30, size: 0.35, rise: 0.5, drift: [0.3, 0.2], on: 1 });
        this.smoke.update(f, cam, [this.smokeAt], { period: 26, life: 60, size: 1.6, rise: 4, drift: [1.5, 0], opacity: 0.5 });
        const push = smooth(u);
        pos = lerp3(Gp(7.0, 5.0, 4.4), Gp(2.6, -2.2, 2.4), push); look = lerp3(Gp(-2.5, -12, 1.6), Gp(0.3, -7.5, 1.6), push); fov = lerp(54, 46, push);
        pos = add3(pos, kick(f, [B(T.freezing1)], 0.03));
        focus = [hp[0], hp[1] + 1.6, hp[2]];
        break;
      }
      case "sailors": { // the sailors' story by the fire: a land of forests
        this.light("golden"); this.gre.visible = true; seaA = 0.1;
        const fire = this.fires[1].pos;
        this.fireAt(f, cam, fire, 1);
        this.smoke.update(f, cam, [[fire[0], fire[1] + 1.2, fire[2]]], { period: 30, life: 50, size: 0.9, rise: 2.4, drift: [0.4, 0], opacity: 0.45 });
        const talk = Math.floor(f / 7) % 2;
        this.actor(f, cam, { o: sailor(0), id: "s0", pos: Gp(3.4, -6.4), opts: { expr: talk ? "laugh" : "grin", wave: talk, facing: -1 } });
        this.actor(f, cam, { o: sailor(5), id: "s5", pos: Gp(2.6, -8.7), opts: { expr: "grin", facing: -1 } });
        const hp = Gp(0.8, -6.0);
        this.actor(f, cam, { o: HERO, id: "hero", pos: hp, opts: { expr: f < B(T.forests1) ? "neutral" : "shock", facing: 1 } });
        const bo = ramp(f, B(T.mysterious), 10);
        if (bo > 0.01) this.bubble.show(bubbleTexture2(), Gp(2.7, -7.4, 3.5 + 0.2 * bo), cam, 1.9 * bo);
        const pushIn = smooth(u);
        pos = lerp3(Gp(2.1, 0.8, 2.1), Gp(2.1, -0.4, 2.05), pushIn); look = Gp(2.1, -7.0, 1.9); fov = 52; roll = 2;
        focus = Gp(2.0, -6.5, 1.6);
        break;
      }
      case "join": { // you join their expedition: up the jetty, onto the ship
        this.light("cold"); this.gre.visible = true; snow = 0.5; seaA = 0.12;
        this.shipAt(f, Gp(11.6, 6.5, -0.3 - gy(11.6, 6.5)), 0, seaA);
        this.sailSet(f, 0.2, 0);
        const w = smooth(u * 1.15);
        const hp: V3 = [G[0] + 9, 1.05, G[2] + lerp(-1.5, 5.5, w)];
        this.actor(f, cam, { o: HERO, id: "hero", pos: hp, opts: { expr: "grin", mode: w < 1 ? "stroll" : "stand", phase: t / 16, facing: 1 } });
        this.actor(f, cam, { o: sailor(1), id: "s1", pos: this.onShip(-0.6, 0.8), opts: { expr: "grin", wave: Math.floor(f / 8) % 2 } }, false);
        this.actor(f, cam, { o: sailor(2), id: "s2", pos: this.onShip(0.8, 3.0), opts: { expr: "smile" } }, false);
        pos = lerp3([G[0] + 4.0, 2.7, G[2] + 8.2], [G[0] + 4.6, 2.8, G[2] + 10.6], smooth(u)); look = lerp3(Gp(9.6, 1.0, 1.8), Gp(10.2, 5.0, 1.9), smooth(u)); fov = 50;
        focus = [hp[0], hp[1] + 1.6, hp[2]];
        break;
      }
      case "mistake": { // big mistake: a wave over the side
        this.light("storm", "cold", 0.45); seaA = 0.7; seaK = 0.9; wind = 0.4;
        this.shipAt(f, S(40, 0, 30), 0.9, seaA, seaK, 4);
        const hp = this.onShip(1.0, -0.6);
        const hit = B(T.mistake);
        this.actor(f, cam, { o: HERO, id: "hero", pos: hp, opts: { expr: f < hit ? "grin" : f < hit + 8 ? "shock" : "dazed", facing: 0, ...blinkOff } }, false);
        if (f >= hit - 6) { this.fx.show(splashTex(clamp01((f - hit + 6) / 22)), this.onShip(1.9, -1.9, 1.7), cam, 4.6); this.fx2.show(splashTex(clamp01((f - hit + 2) / 22)), this.onShip(0.2, -0.9, 1.5), cam, 3.4); }
        pos = lerp3(this.onShip(2.7, 1.4, 2.2), this.onShip(2.4, 1.0, 2.15), smooth(u)); look = this.onShip(1.0, -0.6, 1.75); fov = 44;
        pos = add3(pos, kick(f, [hit + 2], 0.05));
        focus = [hp[0], hp[1] + 1.6, hp[2]];
        break;
      }
      case "crossing": { // days across the Atlantic; it turns into a storm
        const st = ramp(f, B(T.battling) - 10, 30);
        this.light("day", "storm", st);
        seaA = lerp(0.35, 1.6, ramp(f, B(T.days), 70)); seaK = lerp(1, 0.75, st); rain = st; wind = st;
        const zs = -t * 0.12;
        this.shipAt(f, S(0, 0, zs), 0.25, seaA, seaK, 6 * st * Math.sin(t * 0.1));
        this.sailSet(f, 1, st);
        this.actor(f, cam, { o: HERO, id: "hero", pos: this.onShip(0.4, 0.2), opts: { expr: st < 0.5 ? "neutral" : "nervous" } }, false);
        this.actor(f, cam, { o: sailor(1), id: "s1", pos: this.onShip(-0.8, 4.0), opts: { expr: st < 0.5 ? "neutral" : "pained" } }, false);
        this.actor(f, cam, { o: sailor(0), id: "s0", pos: this.onShip(0.7, -3.5), opts: { expr: st < 0.5 ? "smile" : "shock" } }, false);
        const orbit = lerp(-0.5, 0.75, smooth(u));
        const R = lerp(26, 15, smooth(u)), H = lerp(10, 4.5, smooth(u));
        pos = [this.ship.position.x + R * Math.sin(orbit + 0.25), H, this.ship.position.z + R * Math.cos(orbit + 0.25)];
        look = [this.ship.position.x, 2.8, this.ship.position.z]; fov = 50;
        pos = add3(pos, kick(f, [B(T.waves), B(T.storms)], 0.12));
        if (f >= B(T.waves) && f < B(T.waves) + 20) this.fx.show(splashTex(clamp01((f - B(T.waves)) / 20)), this.onShip(2.8, -2.0, 0.4), cam, 4.5);
        focus = [this.ship.position.x, 2, this.ship.position.z];
        break;
      }
      case "land": { // someone shouts LAND!
        this.light("golden"); this.vin.visible = true; seaA = 0.3;
        this.shipAt(f, [6, 0, lerp(118, 110, u)], 0.05, seaA);
        const shout = B(T.land);
        this.actor(f, cam, { o: sailor(0), id: "s0", pos: this.onShip(-0.4, -6.0, 0.55), opts: { expr: f < shout ? "neutral" : "laugh", wave: f < B(T.shouts) ? undefined : 1, facing: -1 } }, false);
        this.actor(f, cam, { o: HERO, id: "hero", pos: this.onShip(1.6, -2.6), opts: { expr: f < shout ? "neutral" : f < shout + 12 ? "shock" : "grin", facing: -1 } }, false);
        if (f >= shout) this.fx.show(burstTex(clamp01((f - shout) / 16)), this.onShip(-0.4, -6.8, 3.6), cam, 2.6 * (1 - 0.3 * clamp01((f - shout - 16) / 10)));
        pos = lerp3(this.onShip(2.8, 1.6, 2.4), this.onShip(2.2, 0.4, 2.3), smooth(u)); look = this.onShip(-0.4, -10, 1.9); fov = 50;
        pos = add3(pos, kick(f, [shout], 0.06));
        focus = this.onShip(0.3, -4.8, 1.8);
        break;
      }
      case "step": { // you step onto an unfamiliar coastline
        this.light("day"); this.vin.visible = true; seaA = 0.08;
        this.shipAt(f, [-4, 0.05, 10.5], 0, seaA, 1, 0, 1);
        this.sailSet(f, 0.18, 0);
        const st = smooth((f - (B(T.step) - 4)) / 14);
        const bow = this.onShip(0, -7.0, 1.1);
        const land = Vp(-4.2, -0.8);
        const hp = lerp3(bow, land, st);
        hp[1] += Math.sin(Math.PI * st) * 0.5;
        this.actor(f, cam, { o: HERO, id: "hero", pos: hp, opts: { expr: st < 1 ? "nervous" : f > B(T.coastline) ? "grin" : "smile", look: st >= 1 ? 1 : 0 } }, st > 0.95);
        this.actor(f, cam, { o: sailor(2), id: "s2", pos: this.onShip(0.5, -4.5), opts: { expr: "smile" } }, false);
        pos = lerp3(Vp(-1.6, -3.4, 0.55), Vp(-2.2, -3.8, 0.6), smooth(u)); look = lerp3(Vp(-4.0, 1.5, 1.6), Vp(-4.2, -0.2, 1.3), st); fov = 50; roll = 3;
        pos = add3(pos, kick(f, [B(T.step) + 10], 0.03));
        focus = [hp[0], hp[1] + 1.4, hp[2]];
        break;
      }
      case "forest": { // enormous forests, fresh water, valuable timber
        this.light("day"); this.vin.visible = true; seaA = 0.08;
        const k1 = B(T.water) - 6, k2 = B(T.timber) - 6;
        const a = smooth((f - k1) / 24), b = smooth((f - k2) / 22);
        const hp = Vp(-21, -14);
        const carry = f > k2 - 4;
        this.actor(f, cam, { o: HERO, id: "hero", pos: hp, opts: { expr: carry ? "grin" : "neutral", prop: carry ? "log" : null, facing: 1 } });
        const P0 = Vp(-23, -5, 0.8), L0 = Vp(-26, -28, 13), P1 = Vp(-12.8, -4.5, 1.9), L1 = Vp(-16.6, -15, 0.3), P2 = Vp(-18.0, -8.6, 1.6), L2 = Vp(-21, -14, 1.5);
        pos = lerp3(lerp3(add3(P0, [0, -0.3 * smooth(u * 3), 0]), P1, a), P2, b); look = lerp3(lerp3(L0, L1, a), L2, b);
        fov = lerp(lerp(60, 50, a), 46, b);
        focus = lerp3(lerp3(Vp(-25, -22, 4), Vp(-16.5, -13, 0.4), a), Vp(-21, -14, 1.6), b);
        break;
      }
      case "build": { // you help build shelters and gather supplies
        this.light("day"); this.vin.visible = true; seaA = 0.08;
        const prog = lerp(0.35, 0.7, u);
        this.hutWalls.forEach((w) => (w.scale.y = Math.max(0.02, prog))); this.hutRoof.visible = false; this.hutDoor.forEach((d) => (d.visible = false));
        const strike = (f % 14) / 14, hx = Vp(5.6, -3.9);
        this.actor(f, cam, { o: HERO, id: "hero", pos: hx, opts: { expr: "grin", prop: ["hammer", strike < 0.6 ? strike / 0.6 * 0.3 : 0.3 + (strike - 0.6) / 0.4 * 0.7], facing: -1 } });
        const walk = (f - shot.a) / 80;
        this.actor(f, cam, { o: sailor(4), id: "s4", pos: Vp(lerp(12, 7.5, clamp01(walk)), -3.0 + 0.2 * Math.sin(walk), 0), opts: { expr: "neutral", prop: "log", mode: walk < 1 ? "stroll" : "stand", phase: t / 16, flip: true } });
        this.actor(f, cam, { o: sailor(1), id: "s1", pos: Vp(2.0, -3.6), opts: { expr: "smile", prop: ["hammer", ((f + 6) % 16) / 16] } });
        this.actor(f, cam, { o: sailor(5), id: "s5", pos: Vp(lerp(7, 9.5, smooth(u)), -1.4), opts: { expr: "neutral", mode: "stroll", phase: t / 18 } });
        pos = lerp3(Vp(3.0, 3.6, 2.0), Vp(4.4, 2.0, 1.85), smooth(u)); look = Vp(5.4, -5.5, 1.5); fov = 52;
        if (strike < 0.08) pos = add3(pos, [0, 0.01, 0]);
        focus = add3(hx, [0, 1.6, 0]);
        break;
      }
      case "problem": { // but there's one problem
        this.light("day"); this.vin.visible = true; seaA = 0.08;
        this.hutWalls.forEach((w) => (w.scale.y = 0.72)); this.hutRoof.visible = false; this.hutDoor.forEach((d) => (d.visible = false));
        const hx = Vp(5.6, -3.9);
        this.actor(f, cam, { o: HERO, id: "hero", pos: hx, opts: { expr: f < B(T.problem) ? "neutral" : "stern", prop: ["hammer", 0], facing: 0 } });
        pos = lerp3(Vp(5.2, -0.6, 1.95), Vp(5.4, -1.8, 1.9), smooth(u)); look = add3(hx, [0, 1.75, 0]); fov = 44;
        focus = add3(hx, [0, 1.7, 0]);
        break;
      }
      case "notAlone": { // you're not alone
        this.light("day"); this.vin.visible = true; seaA = 0.08;
        this.hutWalls.forEach((w) => (w.scale.y = 0.72)); this.hutRoof.visible = false; this.hutDoor.forEach((d) => (d.visible = false));
        const hx = Vp(7.0, -1.2);
        this.actor(f, cam, { o: HERO, id: "hero", pos: hx, opts: { expr: f < B(T.alone) ? "neutral" : "shock", facing: 1 } });
        const NP: [number, number][] = [[9.6, -6.0], [10.9, -6.8], [9.9, -7.6]];
        NP.forEach(([x, z], i) => this.actor(f, cam, { o: native(i), id: "n" + i, pos: Vp(x, z), opts: { expr: i === 1 ? "stern" : "neutral", facing: -1 } }));
        pos = lerp3(Vp(5.4, 0.4, 1.85), Vp(5.8, -0.2, 1.85), smooth(u)); look = Vp(10.1, -6.6, 1.5); fov = 48;
        pos = add3(pos, kick(f, [B(T.alone)], 0.05));
        focus = Vp(10.1, -6.6, 1.6);
        break;
      }
      case "indigenous": { // the people who had lived here for thousands of years
        this.light("golden"); this.vin.visible = true; seaA = 0.12;
        const fire = this.fires[0].pos;
        this.fireAt(f, cam, fire, 0.9);
        this.smoke.update(f, cam, [[fire[0], fire[1] + 1.2, fire[2]]], { period: 30, life: 55, size: 1.0, rise: 2.6, drift: [0.4, 0], opacity: 0.45 });
        const fam: Actor[] = [
          { o: native(0), id: "n0", pos: Vp(35.0, -3.4), opts: { expr: "neutral", facing: 1 } },
          { o: native(2), id: "n2", pos: Vp(38.6, -3.0), opts: { expr: "smile", facing: -1 } },
          { o: native(5), id: "n5", pos: Vp(36.8, -2.6), opts: { expr: "smile" } },
          { o: native(3), id: "n3", pos: Vp(40.2, -6.6), opts: { expr: "neutral", mode: "stroll", phase: t / 18 } },
          { o: native(1), id: "n1", pos: Vp(33.4, -7.0), opts: { expr: "neutral", prop: "bowl" } },
        ];
        fam.forEach((a) => this.actor(f, cam, a));
        pos = lerp3(Vp(30.5, 4.6, 2.0), Vp(33.5, 3.2, 1.9), smooth(u)); look = lerp3(Vp(36.5, -6, 1.8), Vp(37.2, -5.5, 1.5), smooth(u)); fov = 52;
        focus = Vp(36.8, -3.0, 1.5);
        break;
      }
      case "tension": { // encounters could turn dangerous
        const dk = ramp(f, B(T.local), 30);
        this.light("day", "storm", 0.25 + 0.55 * dk); this.vin.visible = true; seaA = 0.15; wind = 0.3;
        const vik: [number, number][] = [[15.9, -0.6], [14.9, -1.6], [16.4, -1.9], [14.2, -0.4]];
        const nat: [number, number][] = [[19.0, -5.2], [20.3, -5.9], [18.2, -6.4], [19.8, -7.2]];
        const tense = f > B(T.dangerous);
        vik.forEach(([x, z], i) => this.actor(f, cam, { o: i === 0 ? HERO : sailor(i), id: i === 0 ? "hero" : "s" + i, pos: Vp(x, z), opts: { expr: tense ? (i === 0 ? "nervous" : "stern") : "neutral", facing: 1 } }));
        nat.forEach(([x, z], i) => this.actor(f, cam, { o: native(i), id: "n" + i, pos: Vp(x, z), opts: { expr: tense ? "stern" : "neutral", facing: -1 } }));
        const d = smooth(u);
        pos = lerp3(Vp(16.2, 7.6, 1.9), Vp(16.4, 6.4, 1.85), d); look = Vp(17.6, -3.6, 1.3); fov = lerp(56, 52, d); roll = lerp(0, -4, dk);
        pos = add3(pos, kick(f, [B(T.dangerous)], 0.05));
        focus = Vp(17.4, -3.2, 1.5);
        break;
      }
      case "supplies": { // limited supplies, no reinforcements
        this.light("day", "storm", 0.35); this.vin.visible = true; seaA = 0.12;
        const bp: V3 = [this.barrel.position.x, this.barrel.position.y, this.barrel.position.z];
        const look2 = f > B(T.reinforcements);
        this.actor(f, cam, { o: HERO, id: "hero", pos: add3(bp, [0.75, 0, -0.55]), opts: { expr: look2 ? "nervous" : "pained", look: look2 ? 1 : 0, facing: look2 ? 1 : -1 } });
        const pull = smooth((f - B(T.reinforcements)) / 26);
        pos = lerp3(add3(bp, [-1.7, 1.9, 2.5]), add3(bp, [-2.2, 1.8, 3.8]), pull); look = lerp3(add3(bp, [0.3, 0.75, -0.3]), add3(bp, [2.6, 1.4, 2.4]), pull); fov = lerp(46, 52, pull);
        focus = lerp3(add3(bp, [0, 0.4, 0]), add3(bp, [0.75, 1.6, -0.55]), pull);
        break;
      }
      case "sailBack": { // you sail back toward Greenland
        this.light("golden"); this.vin.visible = true; seaA = lerp(0.12, 0.3, u);
        const zs = lerp(12, 30, smooth(u * 1.1));
        this.shipAt(f, [-4, zs > 13 ? 0 : 0.05, zs], Math.PI * lerp(0.98, 0.92, u), seaA, 1, 0, clamp01(13 - zs));
        this.sailSet(f, ramp(f, B(T.sail), 16) * 0.82 + 0.18, 0);
        this.actor(f, cam, { o: HERO, id: "hero", pos: this.onShip(0, 5.8, 0.5), opts: { expr: "pained", facing: 0 } }, false);
        this.actor(f, cam, { o: sailor(2), id: "s2", pos: this.onShip(0.9, 2.0), opts: { expr: "neutral" } }, false);
        pos = lerp3(Vp(-1.8, 0.2, 1.4), Vp(-1.2, -1.6, 3.6), smooth(u)); look = lerp3([-4, 2.0, 14], [-4, 3.0, 26], smooth(u)); fov = 48;
        focus = this.onShip(0, 4, 2);
        break;
      }
      case "later": { // a thousand years later
        this.light("day"); this.vin.visible = true; seaA = 0.1;
        const tl = smooth(u * 1.05);
        this.hutWalls.forEach((w) => (w.scale.y = 1)); this.hutRoof.visible = true;
        this.hut.scale.y = Math.max(0.01, 1 - tl); this.hall.scale.y = Math.max(0.01, 1 - tl);
        this.logs.visible = tl < 0.4; this.barrel.visible = tl < 0.5;
        this.mounds.visible = tl > 0.45; this.mounds.scale.y = clamp01((tl - 0.45) / 0.4);
        this.vinTrees.forEach((b, k) => b.forEach((m) => (m.visible = tl < 0.25 + k * 0.17)));
        this.camp.visible = tl < 0.3;
        pos = lerp3(Vp(16, 14, 14), Vp(13, 20, 13), smooth(u)); look = Vp(0, -9, 0); fov = 50;
        focus = Vp(0, -8, 0);
        break;
      }
      case "dig": { // archaeologists find a Norse settlement in Newfoundland, Canada
        this.light("day"); this.vin.visible = true; seaA = 0.12;
        this.era.visible = false; this.camp.visible = false; this.mounds.visible = true; this.mounds.scale.y = 1; this.modern.visible = true;
        this.vinTrees.forEach((b) => b.forEach((m) => (m.visible = false)));
        this.flagWave(f);
        const brush = Math.floor(f / 6) % 2;
        this.actor(f, cam, { o: digger(0), id: "d0", pos: Vp(4.2, -7.6), opts: { expr: "neutral", mode: "sit", prop: "brush", look: brush } });
        this.actor(f, cam, { o: digger(1), id: "d1", pos: Vp(6.6, -6.4), opts: { expr: "smile", mode: "sit", prop: "brush" } });
        this.actor(f, cam, { o: digger(2), id: "d2", pos: Vp(8.4, -4.0), opts: { expr: f > B(T.canada) ? "grin" : "neutral", facing: -1 } });
        pos = lerp3(Vp(1.5, 2.6, 3.2), Vp(3.0, 0.6, 2.6), smooth(u)); look = lerp3(Vp(4.8, -6.6, 0.6), Vp(5.6, -6.4, 0.9), smooth(u)); fov = 52;
        focus = Vp(5.4, -6.8, 0.8);
        break;
      }
      case "evidence": { // evidence confirms Norse activity there in 1021
        this.light("day"); this.vin.visible = true; seaA = 0.12;
        this.era.visible = false; this.camp.visible = false; this.mounds.visible = true; this.mounds.scale.y = 1; this.modern.visible = true;
        this.vinTrees.forEach((b) => b.forEach((m) => (m.visible = false)));
        this.flagWave(f);
        const hp = Vp(8.4, -4.0), aha = B(T.y1021);
        this.actor(f, cam, { o: digger(2), id: "d2", pos: hp, opts: { expr: f < B(T.confirms) ? "neutral" : f < aha ? "shock" : "grin", prop: "wood", facing: 0 } });
        this.actor(f, cam, { o: digger(1), id: "d1", pos: Vp(6.6, -6.4), opts: { expr: "smile", mode: "sit", prop: "brush" } });
        if (f >= aha) this.fx.show(burstTex(clamp01((f - aha) / 16)), add3(hp, [0.4, 1.4, -0.3]), cam, 1.4);
        pos = lerp3(add3(hp, [-0.4, 1.35, 3.8]), add3(hp, [-0.3, 1.35, 3.2]), smooth(u)); look = add3(hp, [0.15, 1.2, 0]); fov = 44;
        focus = add3(hp, [0.1, 1.4, 0]);
        break;
      }
      case "notFirst": { // you weren't the first person in America
        this.light("golden"); this.vin.visible = true; seaA = 0.12;
        const fire = this.fires[0].pos;
        this.fireAt(f, cam, fire, 0.9);
        this.smoke.update(f, cam, [[fire[0], fire[1] + 1.2, fire[2]]], { period: 30, life: 55, size: 1.0, rise: 2.6, drift: [0.4, 0], opacity: 0.45 });
        this.actor(f, cam, { o: native(0), id: "n0", pos: Vp(35.6, -3.6), opts: { expr: "smile", facing: 1 } });
        this.actor(f, cam, { o: native(2), id: "n2", pos: Vp(38.4, -3.4), opts: { expr: "smile", facing: -1 } });
        this.actor(f, cam, { o: native(5), id: "n5", pos: Vp(37.0, -2.5), opts: { expr: "laugh" } });
        this.actor(f, cam, { o: native(3), id: "n3", pos: Vp(36.2, -6.4), opts: { expr: "smile", prop: "bowl" } });
        pos = lerp3(Vp(37.0, 5.2, 1.7), Vp(37.0, 4.2, 1.7), smooth(u)); look = Vp(37.0, -3.6, 1.2); fov = 52;
        focus = Vp(37, -3, 1.4);
        break;
      }
      case "voyage": { // an extraordinary voyage across the Atlantic
        this.light("golden"); seaA = 0.4;
        const zs = -t * 0.18;
        this.shipAt(f, S(0, 0, zs), 0.35, seaA);
        this.actor(f, cam, { o: HERO, id: "hero", pos: this.onShip(0, -5.4), opts: { expr: "grin" } }, false);
        this.actor(f, cam, { o: sailor(1), id: "s1", pos: this.onShip(0.8, -1.5), opts: { expr: "smile" } }, false);
        this.actor(f, cam, { o: sailor(3), id: "s3", pos: this.onShip(-0.9, 2.5), opts: { expr: "neutral" } }, false);
        const g = smooth(u), sp = this.ship.position;
        pos = [sp.x + lerp(-30, 16, g), lerp(28, 7, g), sp.z + lerp(30, 22, g)]; look = [sp.x, lerp(1, 3, g), sp.z]; fov = lerp(48, 44, g); roll = lerp(-3, 2, g);
        focus = [sp.x, 2, sp.z];
        break;
      }
      case "end": { // you had absolutely no idea you were making history
        this.light("golden"); this.gre.visible = true; seaA = 0.1;
        const fire = this.fires[1].pos;
        this.fireAt(f, cam, fire, 1);
        this.smoke.update(f, cam, [[fire[0], fire[1] + 1.2, fire[2]]], { period: 30, life: 50, size: 0.9, rise: 2.4, drift: [0.4, 0], opacity: 0.45 });
        const chew = Math.floor(f / 6) % 2;
        const ex = f < B(T.idea) ? (chew ? "smile_closed" : "neutral") : f < B(T.history) ? "dazed" : "neutral";
        const hp = Gp(0.6, -5.6);
        this.actor(f, cam, { o: HERO, id: "hero", pos: hp, opts: { expr: ex, mode: "sit", prop: "bowl", look: f > B(T.craziest) && f < B(T.idea) ? 1 : 0 } });
        this.actor(f, cam, { o: sailor(5), id: "s5", pos: Gp(3.8, -8.4), opts: { expr: "neutral", mode: "sit" } });
        pos = lerp3(Gp(0.0, -1.4, 1.35), Gp(0.4, -3.0, 1.3), smooth(u)); look = add3(hp, [0.2, 1.0, 0]); fov = 46;
        focus = add3(hp, [0, 1.1, 0]);
        break;
      }
    }
    this.endActors();
    // every hold creeps: a tiny push toward the look target
    const dir = new THREE.Vector3(look[0] - pos[0], look[1] - pos[1], look[2] - pos[2]);
    const creep = Math.min(0.08, 0.0009 * t);
    cam.position.set(pos[0] + dir.x * creep, pos[1] + dir.y * creep, pos[2] + dir.z * creep);
    cam.fov = fov; cam.near = 0.1; cam.far = 1500; cam.up.set(0, 1, 0);
    cam.lookAt(...look); cam.rotateZ(rad(roll)); cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    this.skyUpdate(cam);
    this.oceanUpdate(f, cam, seaA, seaK);
    this.weather(f, cam, rain, snow, wind);
    // re-face cards to the final camera
    for (const o of this.actors.children) {
      if (!o.visible) continue;
      if (o.userData.bill) yawTo(o, cam);
      else if (o.userData.face) o.quaternion.copy(cam.quaternion);
    }
    return { focus, shot };
  }

  private flagWave(f: number) {
    const fl = this.modern.children.find((c) => c.userData.flag) as THREE.Mesh | undefined;
    if (!fl) return;
    const p = fl.geometry.attributes.position as THREE.BufferAttribute;
    if (!fl.userData.base) fl.userData.base = (p.array as Float32Array).slice();
    const b = fl.userData.base as Float32Array;
    for (let i = 0; i < p.count; i++) { const x = b[i * 3], y = b[i * 3 + 1]; p.setXYZ(i, x, y, 0.12 * Math.sin(f * 0.25 + x * 3) * (x + 1) / 2); }
    p.needsUpdate = true; fl.geometry.computeVertexNormals();
  }
}

let bubbleCache: THREE.Texture | null = null;
const bubbleTexture2 = () => (bubbleCache ??= bubbleTexture());
