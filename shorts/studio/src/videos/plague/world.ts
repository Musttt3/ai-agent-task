// The world of "You're a Doctor in 1348": a timber-framed town street with its church, the doctor's house (study + sick
// room with three beds), a dusk aerial over towns and fields where the darkness spreads, and a laboratory of 1894.
// Everything is built once; update() poses it for the shot and frame and sets the camera.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { NOINK } from "./ink";
import { T, shotAt, Shot, Light, smooth, ramp, lerp, lerp3, kick, clamp01, V3, add3 } from "./story";
import {
  groundTexture, skyTexture, rng, plankTexture, cloudTexture, fireTexture, cobbleTexture, frameTexture, tileTexture, thatchTexture,
  ashlarTexture, windowTexture, fieldsTexture, wallpaperTexture, roomWallTexture,
} from "./paint";
import { Person, Puffs, Card, DOC, DOC_SICK, colleague, folk, sick, DIGGER, SCIENTIST, PoseOpts, yawTo } from "./cast";
import { Outfit } from "./toon";
import { ratTex, fleaTex, scopeTex, bugTex, qTex, popTex, burstTex, blobTex } from "./fxcards";

export type Kit = Record<string, never>;
export const loadKit = async (): Promise<Kit> => ({});

const lambert = (o: THREE.MeshLambertMaterialParameters) => new THREE.MeshLambertMaterial(o);
const rad = THREE.MathUtils.degToRad;
const q4 = (x: number) => Math.round(clamp01(x) * 4) / 4;

// set origins
const TW: V3 = [0, 0, 0];      // the town: street along z (camera usually looks toward -z, the church at the end)
const RM: V3 = [300, 0, 0];    // the doctor's house: one room, x -6..6, z -5..7, beds along the back wall
const LB: V3 = [600, 0, 0];    // the laboratory of 1894
const EU: V3 = [-900, 0, 0];   // aerial land at dusk

// ---------------- simple cards ----------------
class FxCard {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial;
  constructor(parent: THREE.Object3D, w: number, h: number) {
    this.mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.05, depthWrite: false, fog: false, toneMapped: true });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.mat);
    this.mesh.layers.set(NOINK); this.mesh.visible = false; this.mesh.renderOrder = 6; this.mesh.userData.face = true;
    parent.add(this.mesh);
  }
  show(map: THREE.Texture, pos: V3, cam: THREE.Camera, scale = 1, opacity = 1, sx = 1) {
    if (this.mat.map !== map) { this.mat.map = map; this.mat.needsUpdate = true; }
    this.mat.opacity = opacity;
    this.mesh.visible = scale > 0.002 && opacity > 0.01; this.mesh.position.set(...pos); this.mesh.scale.set(Math.max(0.001, scale) * sx, Math.max(0.001, scale), 1);
    this.mesh.quaternion.copy(cam.quaternion);
  }
  hide() { this.mesh.visible = false; }
}

type Actor = { o: Outfit; id: string; pos: V3; opts?: PoseOpts };
type LightP = { amb: number; ambC: string; hemi: number; sky: string; gnd: string; sun: number; sunC: string; sunDir: V3; fog: string; near: number; far: number;
  skyT: THREE.Texture; cloud: number };

// ---------------- aerial terrain ----------------
const hLand = (x: number, z: number) => {
  let y = 6 * Math.sin(0.021 * x + 0.4) * Math.cos(0.017 * z - 0.3) + 3 * Math.sin(0.05 * x - 0.06 * z) + 1.5 * Math.sin(0.11 * x + 0.07 * z);
  y += Math.max(0, -z - 120) * 0.12;                          // rising north
  y -= Math.max(0, z - 150) * 0.35;                           // the southern sea
  return y;
};
const TOWNS: [number, number][] = (() => {
  const r = rng(321), out: [number, number][] = [];
  while (out.length < 22) {
    const x = -260 + r() * 520, z = -260 + r() * 390;
    if (out.some(([a, b]) => Math.hypot(a - x, b - z) < 55)) continue;
    out.push([x, z]);
  }
  return out;
})();
const SPREAD_FROM: [number, number] = [240, 150]; // the darkness comes from the south-east

// ---------------- the world ----------------
export class World {
  root = new THREE.Group();
  private town = new THREE.Group(); private room = new THREE.Group(); private lab = new THREE.Group(); private land = new THREE.Group(); private actors = new THREE.Group();
  private amb = new THREE.AmbientLight(0xffffff, 0.4);
  private hemi = new THREE.HemisphereLight(0xcfe3ff, 0x8a7a5a, 1.1);
  private sun = new THREE.DirectionalLight(0xfff1dc, 2.3);
  private fireL = new THREE.PointLight(0xffa860, 0, 0, 1.4);
  private fog = new THREE.Fog(0xcfe0f2, 30, 300);
  private sky!: THREE.Mesh; private skyMat!: THREE.MeshBasicMaterial; private sky2!: THREE.Mesh; private sky2Mat!: THREE.MeshBasicMaterial;
  private sunDisc!: THREE.Mesh;
  private clouds: THREE.Mesh[] = [];
  private rain!: THREE.LineSegments;
  // props
  private cart = new THREE.Group(); private wheels: THREE.Mesh[] = [];
  private winMat!: THREE.MeshLambertMaterial; private winDay!: THREE.Texture; private winNight!: THREE.Texture;
  private landMesh!: THREE.Mesh; private landBase!: Float32Array;
  private candleDesk: V3 = [0, 0, 0]; private candleStool: V3 = [0, 0, 0]; private stool = new THREE.Group();
  private brazierTop: V3 = [0, 0, 0];
  // cast + fx
  private people: Person[] = []; private pi = 0;
  private shadows: THREE.Mesh[] = [];
  private puffs: Puffs; private smoke: Puffs; private plumes: Puffs;
  private fx: FxCard; private fx2: FxCard; private fx3: FxCard; private bubble: FxCard; private flea: FxCard; private bugs: FxCard[] = [];
  private flame: FxCard; private flames: THREE.Texture[];
  private rat: Card;
  private L: Record<Light, LightP>;

  constructor(_kit: Kit) {
    this.root.add(this.town, this.room, this.lab, this.land, this.actors, this.amb, this.hemi, this.sun, this.sun.target, this.fireL);
    this.L = this.lightPresets();
    this.buildSky();
    this.buildTown();
    this.buildRoom();
    this.buildLab();
    this.buildLand();
    for (let i = 0; i < 14; i++) this.people.push(new Person(this.actors));
    const bm = new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, fog: false });
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.38).rotateX(-Math.PI / 2), bm);
      m.layers.set(NOINK); m.visible = false; m.renderOrder = 1; this.actors.add(m); this.shadows.push(m);
    }
    this.puffs = new Puffs(this.actors, 30);
    this.smoke = new Puffs(this.actors, 44);
    this.plumes = new Puffs(this.actors, 90);
    this.fx = new FxCard(this.actors, 1, 1); this.fx2 = new FxCard(this.actors, 1, 1); this.fx3 = new FxCard(this.actors, 1, 1);
    this.bubble = new FxCard(this.actors, 1, 1); this.flea = new FxCard(this.actors, 1, 1);
    for (let i = 0; i < 4; i++) this.bugs.push(new FxCard(this.actors, 2, 1));
    this.flames = [0, 1, 2, 3].map(fireTexture);
    this.flame = new FxCard(this.actors, 1, 1);
    this.flame.mat.color.setRGB(1.6, 1.4, 1.2); this.flame.mat.toneMapped = false;
    this.rat = new Card(this.actors, 0.62, 0.31, 0);
  }

  // ---------------- presets ----------------
  private lightPresets(): Record<Light, LightP> {
    return {
      day: { amb: 0.36, ambC: "#ffffff", hemi: 1.05, sky: "#d6e2f0", gnd: "#8a7a5a", sun: 2.2, sunC: "#fff1dc", sunDir: [-0.5, 0.75, 0.45], fog: "#d8e0e8", near: 40, far: 320,
        skyT: skyTexture("#5f8cc8", "#a3bede", "#dfe6ec"), cloud: 1 },
      golden: { amb: 0.3, ambC: "#c8b8e8", hemi: 0.8, sky: "#a898d8", gnd: "#7a5a4a", sun: 2.6, sunC: "#ffb36b", sunDir: [0.7, 0.18, -0.68], fog: "#e8b088", near: 120, far: 900,
        skyT: skyTexture("#5a5a96", "#e09a78", "#ffc98a"), cloud: 0.95 },
      storm: { amb: 0.55, ambC: "#8a98b8", hemi: 0.75, sky: "#8a9ab0", gnd: "#4a4a50", sun: 0.7, sunC: "#c8d4e8", sunDir: [-0.3, 0.9, 0.3], fog: "#5e6a7c", near: 20, far: 170,
        skyT: skyTexture("#22283a", "#3e4658", "#5a6478"), cloud: 0.4 },
      cold: { amb: 0.45, ambC: "#c8d4f0", hemi: 0.95, sky: "#b8c8e8", gnd: "#6a6a78", sun: 1.3, sunC: "#ffd2b0", sunDir: [0.55, 0.28, -0.6], fog: "#c6cedc", near: 10, far: 120,
        skyT: skyTexture("#5a78a8", "#b4c2d8", "#ecd6c8"), cloud: 0.9 },
      candle: { amb: 0.2, ambC: "#7a6a9a", hemi: 0.3, sky: "#4a5a8a", gnd: "#2a2028", sun: 0.35, sunC: "#8aa0d8", sunDir: [0.8, 0.55, 0.2], fog: "#1a1620", near: 40, far: 260,
        skyT: skyTexture("#0e1224", "#1c2238", "#2a3048"), cloud: 0.25 },
    };
  }

  // ---------------- builders ----------------
  private buildSky() {
    this.skyMat = new THREE.MeshBasicMaterial({ map: this.L.day.skyT, side: THREE.BackSide, fog: false, depthWrite: false });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), this.skyMat);
    this.sky.renderOrder = -10; this.sky.layers.set(NOINK);
    this.root.add(this.sky);
    this.sky2Mat = new THREE.MeshBasicMaterial({ map: this.skyMat.map, side: THREE.BackSide, fog: false, depthWrite: false, transparent: true, opacity: 0 });
    this.sky2 = new THREE.Mesh(new THREE.SphereGeometry(1199, 32, 16), this.sky2Mat);
    this.sky2.renderOrder = -9.5; this.sky2.layers.set(NOINK); this.sky2.visible = false;
    this.root.add(this.sky2);
    this.sunDisc = new THREE.Mesh(new THREE.CircleGeometry(40, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.5, 1.7), fog: false, toneMapped: false, depthWrite: false }));
    this.sunDisc.layers.set(NOINK); this.sunDisc.renderOrder = -9;
    this.root.add(this.sunDisc);
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(240, 120), new THREE.MeshBasicMaterial({ map: cloudTexture(100 + i), transparent: true, alphaTest: 0.2, fog: false, depthWrite: false }));
      m.layers.set(NOINK); m.renderOrder = -8; this.root.add(m); this.clouds.push(m);
    }
    const N = 700, rp = new Float32Array(N * 6);
    this.rain = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(rp, 3)),
      new THREE.LineBasicMaterial({ color: 0xd8e2ee, transparent: true, opacity: 0.5, fog: false, depthWrite: false }));
    this.rain.layers.set(NOINK); this.rain.frustumCulled = false; this.root.add(this.rain);
  }

  /** a timber-framed house; gable end faces the street (+x local), upper floor jettied out over the street */
  private house(w: number, d: number, h1: number, h2: number, roofH: number, seed: number, mats: { wall: THREE.Material[]; roof: THREE.Material[]; win: THREE.Material; dark: THREE.Material; beam: THREE.Material }) {
    const g = new THREE.Group(), r = rng(seed);
    const wall = mats.wall[Math.floor(r() * mats.wall.length)], roof = mats.roof[Math.floor(r() * mats.roof.length)];
    const lo = new THREE.Mesh(new THREE.BoxGeometry(d, h1, w).translate(0, h1 / 2, 0), wall); g.add(lo);
    const jut = 0.55;
    const up = new THREE.Mesh(new THREE.BoxGeometry(d + jut, h2, w + 0.1).translate(jut / 2, h1 + h2 / 2, 0), wall); g.add(up);
    const joist = new THREE.Mesh(new THREE.BoxGeometry(d + jut + 0.05, 0.22, w + 0.15).translate(jut / 2, h1 + 0.02, 0), mats.beam); g.add(joist);
    const sh = new THREE.Shape([new THREE.Vector2(-w / 2 - 0.35, 0), new THREE.Vector2(0, roofH), new THREE.Vector2(w / 2 + 0.35, 0)]);
    const rg = new THREE.ExtrudeGeometry(sh, { depth: d + jut + 0.7, bevelEnabled: false }).rotateY(Math.PI / 2).translate(-d / 2 - 0.35, h1 + h2, 0);
    const rf = new THREE.Mesh(rg, roof); g.add(rf);
    const gable = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(0, roofH - 0.25), new THREE.Vector2(w / 2, 0)])).rotateY(Math.PI / 2).translate(d / 2 + jut + 0.01, h1 + h2, 0), wall); g.add(gable);
    // street face: door, ground window, two upper windows, a beam over the door
    const fx = d / 2 + 0.02, ufx = d / 2 + jut + 0.02, dz = (r() - 0.5) * (w - 2.4);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 2.0).rotateY(Math.PI / 2), mats.dark); door.position.set(fx, 1.0, dz); door.layers.set(NOINK); g.add(door);
    const lint = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 1.6), mats.beam); lint.position.set(fx, 2.1, dz); g.add(lint);
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 1.5), lambert({ color: "#8f887a" })); step.position.set(fx + 0.3, 0.09, dz); g.add(step);
    const wz = dz > 0 ? dz - 1.9 : dz + 1.9;
    const win = (x: number, y: number, z: number, s: number) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3 * s, 1.3 * s).rotateY(Math.PI / 2), mats.win); m.position.set(x, y, z); m.layers.set(NOINK); g.add(m); };
    if (Math.abs(wz) < w / 2 - 0.6) win(fx, 1.6, wz, 0.9);
    win(ufx, h1 + h2 * 0.5, -w * 0.24, 1); win(ufx, h1 + h2 * 0.5, w * 0.24, 1);
    if (r() < 0.6) { const ch = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.6, 0.6), lambert({ color: "#8a5a44" })); ch.position.set(-d * 0.2, h1 + h2 + roofH * 0.6, w * 0.25); g.add(ch); }
    return { g, doorZ: dz };
  }

  private buildTown() {
    this.town.position.set(...TW);
    const gt = groundTexture(31, "#7f8a52", ["#6f7a44", "#8f9a5e", "#7a6a48"], ["#5a6a38", "#a0a870"]); gt.repeat.set(60, 60);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500).rotateX(-Math.PI / 2), lambert({ map: gt })); this.town.add(ground);
    const cb = cobbleTexture(); cb.repeat.set(2.4, 28);
    const street = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 116).rotateX(-Math.PI / 2), lambert({ map: cb })); street.position.set(0, 0.01, -26); street.layers.set(NOINK); this.town.add(street);
    const cb2 = cobbleTexture(88); cb2.repeat.set(6, 5);
    const sq = new THREE.Mesh(new THREE.PlaneGeometry(30, 26).rotateX(-Math.PI / 2), lambert({ map: cb2 })); sq.position.set(0, 0.012, -76); sq.layers.set(NOINK); this.town.add(sq);
    const plasters = ["#e8dcc0", "#dcc79e", "#e6cfbe", "#efe6d2", "#d4bc94", "#e2d4b0"];
    const mats = {
      wall: plasters.map((c, i) => lambert({ map: frameTexture(90 + i, c, "#3e2a1e", 2 + (i % 3)) })),
      roof: [lambert({ map: (() => { const t = tileTexture(82, "#9a4a32"); t.repeat.set(2, 2); return t; })() }), lambert({ map: (() => { const t = tileTexture(83, "#7f4a36"); t.repeat.set(2, 2); return t; })() }),
        lambert({ map: (() => { const t = thatchTexture(); t.repeat.set(2, 2); return t; })() })],
      win: lambert({ map: windowTexture(false) }), dark: lambert({ color: "#1c1410" }), beam: lambert({ color: "#3e2a1e" }),
    };
    const r = rng(17);
    for (const side of [-1, 1]) {
      let z = 24;
      let k = 0;
      while (z > -66) {
        const w = 5 + r() * 2.2, d = 7, h1 = 2.9 + r() * 0.4, h2 = 2.6 + r() * 0.5, roofH = 3 + r() * 1.4;
        const { g } = this.house(w, d, h1, h2, roofH, 200 + side * 50 + k, mats);
        g.position.set(side * (4.7 + d / 2), 0, z - w / 2); g.rotation.y = side > 0 ? Math.PI : 0;
        this.town.add(g);
        // a second row behind for the skyline
        const b = this.house(w * 1.1, 7, 3.2, 3.2 + r(), 4 + r() * 2, 400 + side * 50 + k, mats).g;
        b.position.set(side * (14 + d / 2), 0, z - w / 2 + 1.5); b.rotation.y = side > 0 ? Math.PI : 0; this.town.add(b);
        z -= w + 0.05; k++;
      }
    }
    // the church at the end of the street
    const ash = ashlarTexture(); ash.repeat.set(2, 5);
    const stone = lambert({ map: ash });
    const tower = new THREE.Mesh(new THREE.BoxGeometry(6, 21, 6).translate(0, 10.5, 0), stone); tower.position.set(0, 0, -82); this.town.add(tower);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(4.6, 13, 4).rotateY(Math.PI / 4).translate(0, 21 + 6.5, 0), lambert({ map: (() => { const t = tileTexture(84, "#5a6068"); t.repeat.set(2, 3); return t; })() }));
    spire.position.set(0, 0, -82); this.town.add(spire);
    const dark = lambert({ color: "#141018" });
    for (const x of [-1.3, 1.3]) { const o = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 3.4), dark); o.position.set(x, 16.5, -78.98); o.layers.set(NOINK); this.town.add(o); }
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.75, 1.1, 14), lambert({ color: "#9a7a3a" })); bell.position.set(0, 16.2, -80.2); this.town.add(bell);
    const portal = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.4), dark); portal.position.set(0, 1.7, -78.98); portal.layers.set(NOINK); this.town.add(portal);
    const nave = new THREE.Mesh(new THREE.BoxGeometry(10, 11, 20).translate(0, 5.5, 0), stone); nave.position.set(0, 0, -95); this.town.add(nave);
    const nr = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-5.6, 0), new THREE.Vector2(0, 5), new THREE.Vector2(5.6, 0)]), { depth: 20.6, bevelEnabled: false }).translate(0, 11, -105.3);
    this.town.add(new THREE.Mesh(nr, lambert({ map: (() => { const t = tileTexture(85, "#5a6068"); t.repeat.set(3, 3); return t; })() })));
    // distant hills and tree clumps
    const hillM = lambert({ color: "#7f9a5a" }), treeM = lambert({ color: "#3f6040" });
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + r() * 0.2, R = 150 + r() * 70, s = 30 + r() * 30;
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), hillM); m.scale.set(s * 1.6, s * 0.35, s); m.position.set(R * Math.cos(a), -1, R * Math.sin(a)); this.town.add(m);
    }
    const trees: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 70; i++) { const a = r() * Math.PI * 2, R = 70 + r() * 70, s = 2 + r() * 2.5; trees.push(new THREE.SphereGeometry(s, 9, 7).translate(R * Math.cos(a), s * 0.9, R * Math.sin(a))); }
    this.town.add(new THREE.Mesh(mergeGeometries(trees), treeM));
    this.buildCart();
  }

  private buildCart() {
    const wood = lambert({ map: plankTexture(91, "#8a6a48") }), dark = lambert({ color: "#4a3426" });
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 2.6), wood); bed.position.y = 0.72; this.cart.add(bed);
    for (const s of [-1, 1]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 2.6), wood); rail.position.set(s * 0.74, 0.92, 0); this.cart.add(rail); }
    for (const s of [-1, 1]) {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.1, 16).rotateZ(Math.PI / 2), dark); wh.position.set(s * 0.85, 0.62, 0.2); this.cart.add(wh); this.wheels.push(wh);
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6).rotateX(Math.PI / 2 - 0.25), dark); h.position.set(s * 0.6, 0.85, -1.9); this.cart.add(h);
    }
    const shroud = lambert({ color: "#ece6d8" }), tie = lambert({ color: "#6a5a4a" });
    for (const [x, y, rz] of [[-0.36, 0.98, 0.08], [0.36, 0.98, -0.06], [0, 1.3, 0.02]] as const) {
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 1.55, 4, 10).rotateX(Math.PI / 2), shroud); m.position.set(x, y, 0.05); m.rotation.z = rz; m.scale.set(1, 0.8, 1); this.cart.add(m);
      for (const z of [-0.55, 0.0, 0.55]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 5, 16), tie); t.position.set(x, y, z); t.scale.set(1, 0.8, 1); this.cart.add(t); }
    }
    this.town.add(this.cart);
  }

  private buildRoom() {
    const R = this.room; R.position.set(...RM);
    const pl = plankTexture(92, "#9a7650"); pl.repeat.set(3, 6);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12).rotateX(-Math.PI / 2), lambert({ map: pl })); floor.position.set(0, 0, 1); R.add(floor);
    const wt = roomWallTexture(); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(3, 1);
    const wm = lambert({ map: wt });
    const wall = (w: number, x: number, z: number, ry: number) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 4.2), wm); m.position.set(x, 2.1, z); m.rotation.y = ry; R.add(m); };
    wall(12, 0, -5, 0); wall(12, -6, 1, Math.PI / 2); wall(12, 6, 1, -Math.PI / 2); wall(12, 0, 7, Math.PI);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(12, 12).rotateX(Math.PI / 2), lambert({ color: "#5a4030" })); ceil.position.set(0, 4.2, 1); R.add(ceil);
    const beam = lambert({ color: "#3e2a1e" });
    for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(12, 0.28, 0.3), beam); b.position.set(0, 4.05, -4.2 + i * 2.1); R.add(b); }
    // window on the right wall
    this.winDay = windowTexture(true); this.winNight = windowTexture(false);
    this.winMat = lambert({ map: this.winDay, emissive: "#ffffff", emissiveMap: this.winDay, emissiveIntensity: 0.9 });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), this.winMat); win.position.set(5.98, 2.1, -1.2); win.rotation.y = -Math.PI / 2; win.layers.set(NOINK); R.add(win);
    // beds along the back wall
    const wood = lambert({ map: plankTexture(93, "#7a5232") }), linen = lambert({ color: "#e8e2d4" }), blanket = [lambert({ color: "#7a5a8a" }), lambert({ color: "#8a6a3a" }), lambert({ color: "#5a7a6a" })];
    [-3.2, 0, 3.2].forEach((x, i) => {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.36, 2.15).translate(0, 0.22, 0), wood); frame.position.set(x, 0, -3.65); R.add(frame);
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.1, 0.12).translate(0, 0.55, 0), wood); head.position.set(x, 0, -4.75); R.add(head);
      const pil = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.6, 4, 8).rotateZ(Math.PI / 2), linen); pil.position.set(x, 0.52, -4.4); pil.scale.set(1, 0.6, 1); R.add(pil);
      const bl = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 1.3).translate(0, 0.48, 0), blanket[i]); bl.position.set(x, 0, -3.15); R.add(bl);
      const fold = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 1.08, 4, 8).rotateZ(Math.PI / 2), linen); fold.position.set(x, 0.58, -3.78); R.add(fold);
    });
    // desk with books, jars, a candle; shelves of jars on the left wall
    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.0), wood); desk.position.set(-3.4, 0.85, 1.65); R.add(desk);
    const front = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.78, 0.06), wood); front.position.set(-3.4, 0.42, 2.12); R.add(front);
    for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.9), wood); l.position.set(-3.4 + s * 1.15, 0.4, 1.65); R.add(l); }
    const bookC = ["#7a2a2a", "#2a4a6a", "#5a6a2a", "#6a4a2a", "#3a2a4a"];
    for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5 - i * 0.04, 0.09, 0.36), lambert({ color: bookC[i] })); b.position.set(-4.15, 0.95 + i * 0.09, 1.7); b.rotation.y = i * 0.15; R.add(b); }
    const open = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.45), lambert({ color: "#efe6cc" })); open.position.set(-3.45, 0.92, 1.7); open.rotation.y = 0.08; R.add(open);
    const jarC = ["#5a7a6a", "#8a5a3a", "#c9a24a", "#4a6a8a", "#7a4a6a", "#9a8a6a"];
    for (const y of [1.45, 2.25]) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 3.2), wood); sh.position.set(-5.78, y, -0.6); R.add(sh);
      for (let k = 0; k < 6; k++) { const j = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.3 + (k % 3) * 0.06, 10).translate(0, 0.17, 0), lambert({ color: jarC[(k + (y > 2 ? 2 : 0)) % 6] })); j.position.set(-5.75, y + 0.03, -1.9 + k * 0.5); R.add(j); }
    }
    for (const [x, c] of [[-2.8, "#7a9a6a"], [-2.55, "#c9a24a"]] as const) { const j = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.26, 10).translate(0, 0.13, 0), lambert({ color: c })); j.position.set(x, 0.9, 1.95); R.add(j); }
    const cand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.24, 8).translate(0, 0.12, 0), lambert({ color: "#f2e8d0", emissive: "#ffb060", emissiveIntensity: 0.25 }));
    cand.position.set(-2.55, 0.9, 1.45); R.add(cand);
    const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.04, 12), lambert({ color: "#9a7a3a" })); holder.position.set(-2.55, 0.92, 1.45); R.add(holder);
    this.candleDesk = [RM[0] - 2.55, 1.18, RM[2] + 1.45];
    // stool with a candle by the third bed (night)
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.06, 12), wood); st.position.y = 0.55; this.stool.add(st);
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2, l = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.56, 6), wood); l.position.set(0.16 * Math.cos(a), 0.27, 0.16 * Math.sin(a)); this.stool.add(l); }
    const c2 = cand.clone(); c2.position.set(0, 0.58, 0); this.stool.add(c2);
    this.stool.position.set(1.95, 0, -3.3); R.add(this.stool);
    this.candleStool = [RM[0] + 1.95, 0.86, RM[2] - 3.3];
    // brazier for burning herbs
    const iron = lambert({ color: "#3a3434" });
    const bw = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.26, 0.28, 16, 1, true), lambert({ color: "#3a3434", side: THREE.DoubleSide })); bw.position.set(1.95, 0.85, -0.6); R.add(bw);
    for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2, l = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 6), iron); l.position.set(1.95 + 0.25 * Math.cos(a), 0.45, -0.6 + 0.25 * Math.sin(a)); l.rotation.set(0.25 * Math.sin(a), 0, -0.25 * Math.cos(a)); R.add(l); }
    const coals = new THREE.Mesh(new THREE.CircleGeometry(0.38, 16).rotateX(-Math.PI / 2), lambert({ color: "#c8501e", emissive: "#ff6a20", emissiveIntensity: 0.9 })); coals.position.set(1.95, 0.92, -0.6); R.add(coals);
    this.brazierTop = [RM[0] + 1.95, 1.0, RM[2] - 0.6];
    // the doctor's cap and robe on a peg by the third bed
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 6).rotateX(Math.PI / 2), wood); peg.position.set(4.6, 1.95, -4.9); R.add(peg);
    const rs = new THREE.Shape([new THREE.Vector2(-0.12, 0.72), new THREE.Vector2(0.12, 0.72), new THREE.Vector2(0.4, 0.6), new THREE.Vector2(0.55, 0.25), new THREE.Vector2(0.42, 0.22),
      new THREE.Vector2(0.34, 0.4), new THREE.Vector2(0.4, -0.75), new THREE.Vector2(-0.4, -0.75), new THREE.Vector2(-0.34, 0.4), new THREE.Vector2(-0.42, 0.22), new THREE.Vector2(-0.55, 0.25), new THREE.Vector2(-0.4, 0.6)]);
    const robe = new THREE.Mesh(new THREE.ShapeGeometry(rs), lambert({ color: "#9a3236", side: THREE.DoubleSide })); robe.position.set(4.6, 1.22, -4.93); R.add(robe);
    const capM = lambert({ color: "#5a2230" });
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), capM); cap.position.set(3.95, 1.12, -4.75); R.add(cap);
    const brim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 18).rotateX(Math.PI / 2), capM); brim.position.set(3.95, 1.12, -4.75); R.add(brim);
  }

  private buildLab() {
    const L = this.lab; L.position.set(...LB);
    const pl = plankTexture(94, "#6a4a32"); pl.repeat.set(3, 5);
    const lf = new THREE.Mesh(new THREE.PlaneGeometry(10, 10).rotateX(-Math.PI / 2), lambert({ map: pl })); lf.position.set(0, 0, 1); L.add(lf);
    const wp = wallpaperTexture(); wp.repeat.set(6, 2.5);
    const wm = lambert({ map: wp });
    const wall = (w: number, x: number, z: number, ry: number) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.8), wm); m.position.set(x, 1.9, z); m.rotation.y = ry; L.add(m); };
    wall(10, 0, -4, 0); wall(10, -5, 1, Math.PI / 2); wall(10, 5, 1, -Math.PI / 2); wall(10, 0, 6, Math.PI);
    const dado = new THREE.Mesh(new THREE.BoxGeometry(10, 1.0, 0.05), lambert({ color: "#5a3a26" })); dado.position.set(0, 0.5, -3.97); L.add(dado);
    const lc = new THREE.Mesh(new THREE.PlaneGeometry(10, 10).rotateX(Math.PI / 2), lambert({ color: "#e8e0d0" })); lc.position.set(0, 3.8, 1); L.add(lc);
    const winM = lambert({ color: "#dfeaf6", emissive: "#eaf2ff", emissiveIntensity: 0.9 });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.0), winM); win.position.set(-2.4, 2.0, -3.97); win.layers.set(NOINK); L.add(win);
    const fr = lambert({ color: "#f2efe6" });
    for (const [w, h, x, y] of [[1.7, 0.08, -2.4, 3.0], [1.7, 0.08, -2.4, 1.0], [0.08, 2.0, -2.4, 2.0], [1.6, 0.06, -2.4, 2.0]] as const) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), fr); m.position.set(x, y, -3.94); L.add(m); }
    // bench
    const wood = lambert({ map: plankTexture(95, "#7a5232") });
    const top = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 1.1), wood); top.position.set(0.6, 1.0, -1.6); L.add(top);
    for (const [x, z] of [[-1.4, -2.05], [2.6, -2.05], [-1.4, -1.15], [2.6, -1.15]] as const) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.08), wood); l.position.set(x, 0.5, z); L.add(l); }
    // brass microscope
    const brass = lambert({ color: "#c9a24a", emissive: "#5a3a10", emissiveIntensity: 0.15 }), black = lambert({ color: "#2a2a2e" });
    const mx = 0.5, mz = -1.55, my = 1.04;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.06, 18), black); base.position.set(mx, my + 0.03, mz); L.add(base);
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.36, 8), brass); pil.position.set(mx, my + 0.24, mz - 0.08); L.add(pil);
    const stage = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.22), black); stage.position.set(mx, my + 0.3, mz + 0.02); L.add(stage);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.5, 14), brass); tube.position.set(mx, my + 0.62, mz + 0.04); tube.rotation.x = -0.32; L.add(tube);
    const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 10), black); eye.position.set(mx, my + 0.9, mz + 0.13); eye.rotation.x = -0.32; L.add(eye);
    const arm = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.028, 6, 14, Math.PI), brass); arm.position.set(mx, my + 0.45, mz - 0.04); arm.rotation.y = Math.PI / 2; L.add(arm);
    // flasks, a rack of tubes, a lamp, books
    const glass = (c: string) => lambert({ color: c, emissive: c, emissiveIntensity: 0.15 });
    for (const [x, c, s] of [[-0.8, "#9ad0a0", 1], [-0.45, "#e0b8d8", 0.8], [1.6, "#a8c8e8", 1.1]] as const) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.13 * s, 14, 10), glass(c)); b.position.set(x, 1.04 + 0.13 * s, -1.75); L.add(b);
      const n = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * s, 0.035 * s, 0.2 * s, 8), lambert({ color: "#e8f0f0" })); n.position.set(x, 1.04 + 0.33 * s, -1.75); L.add(n);
    }
    const rack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.16), wood); rack.position.set(2.2, 1.1, -1.8); L.add(rack);
    for (let k = 0; k < 5; k++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 8), glass(["#f0e0a0", "#c8e0f0", "#f0c0c0", "#d0f0d0", "#e0d0f0"][k])); t.position.set(2.0 + k * 0.1, 1.22, -1.8); L.add(t); }
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.3), lambert({ color: ["#2a3a5a", "#5a2a2a", "#3a4a2a"][i] })); b.position.set(-1.0, 1.08 + i * 0.08, -1.3); b.rotation.y = i * 0.2; L.add(b); }
    const lampG = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), lambert({ color: "#fff2c8", emissive: "#ffd890", emissiveIntensity: 1.2 })); lampG.position.set(2.4, 1.5, -1.5); L.add(lampG);
    const lampS = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.4, 8), brass); lampS.position.set(2.4, 1.22, -1.5); L.add(lampS);
  }

  private buildLand() {
    const E = this.land; E.position.set(...EU);
    const g = new THREE.PlaneGeometry(760, 760, 150, 150).rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setXYZ(i, x, hLand(x, z), z); }
    g.computeVertexNormals();
    const col = new Float32Array(p.count * 3);
    const grass = new THREE.Color("#ffffff"), shore = new THREE.Color("#d8c89a"), hill = new THREE.Color("#c8c0a8");
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); const c = grass.clone(); if (y < 1.2) c.lerp(shore, clamp01((1.2 - y) / 1.5)); if (y > 14) c.lerp(hill, clamp01((y - 14) / 12)); col.set([c.r, c.g, c.b], i * 3); }
    this.landBase = col.slice();
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const ft = fieldsTexture(); ft.repeat.set(7, 7);
    this.landMesh = new THREE.Mesh(g, lambert({ map: ft, vertexColors: true })); E.add(this.landMesh);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(1400, 600).rotateX(-Math.PI / 2), lambert({ color: "#3a6a96" })); sea.position.set(0, 0.2, 480); E.add(sea);
    // towns: little timber houses with red roofs and a spire, merged per material
    const r = rng(77), walls: THREE.BufferGeometry[] = [], roofs: THREE.BufferGeometry[] = [], spires: THREE.BufferGeometry[] = [];
    for (const [tx, tz] of TOWNS) {
      const n = 10 + Math.floor(r() * 8);
      for (let k = 0; k < n; k++) {
        const a = r() * Math.PI * 2, d = r() * 16, x = tx + d * Math.cos(a), z = tz + d * Math.sin(a), y = hLand(x, z), w = 3 + r() * 2, h = 3 + r() * 2, ry = r() * 3;
        walls.push(new THREE.BoxGeometry(w, h, w * 0.8).rotateY(ry).translate(x, y + h / 2, z));
        roofs.push(new THREE.ConeGeometry(w * 0.78, 2.4, 4).rotateY(ry + Math.PI / 4).translate(x, y + h + 1.2, z));
      }
      const y = hLand(tx, tz);
      walls.push(new THREE.BoxGeometry(3, 12, 3).translate(tx, y + 6, tz));
      spires.push(new THREE.ConeGeometry(2.4, 8, 4).rotateY(Math.PI / 4).translate(tx, y + 16, tz));
    }
    E.add(new THREE.Mesh(mergeGeometries(walls), lambert({ color: "#ece0c4" })));
    E.add(new THREE.Mesh(mergeGeometries(roofs), lambert({ color: "#b0503a" })));
    E.add(new THREE.Mesh(mergeGeometries(spires), lambert({ color: "#5a6068" })));
    const trees: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 260; i++) { const x = -360 + r() * 720, z = -360 + r() * 500; if (TOWNS.some(([a, b]) => Math.hypot(a - x, b - z) < 22)) continue; const s = 3 + r() * 3; trees.push(new THREE.SphereGeometry(s, 8, 6).translate(x, hLand(x, z) + s * 0.8, z)); }
    E.add(new THREE.Mesh(mergeGeometries(trees), lambert({ color: "#3f6040" })));
  }

  // ---------------- per-frame helpers ----------------
  private light(a: Light, b: Light = a, t = 0) {
    const A = this.L[a], B = this.L[b], l = (x: number, y: number) => lerp(x, y, t), c = (x: string, y: string) => new THREE.Color(x).lerp(new THREE.Color(y), t);
    this.amb.intensity = l(A.amb, B.amb); this.amb.color.copy(c(A.ambC, B.ambC));
    this.hemi.intensity = l(A.hemi, B.hemi); this.hemi.color.copy(c(A.sky, B.sky)); this.hemi.groundColor.copy(c(A.gnd, B.gnd));
    this.sun.intensity = l(A.sun, B.sun); this.sun.color.copy(c(A.sunC, B.sunC));
    this.sunDir.set(...lerp3(A.sunDir, B.sunDir, t)).normalize();
    this.fog.color.copy(c(A.fog, B.fog)); this.fog.near = l(A.near, B.near); this.fog.far = l(A.far, B.far);
    this.skyMat.map = A.skyT;
    this.sky2Mat.map = B.skyT; this.sky2Mat.opacity = t; this.sky2.visible = B.skyT !== A.skyT && t > 0.001;
    this.cloudK = l(A.cloud, B.cloud);
    this.golden = (a === "golden" ? 1 - t : 0) + (b === "golden" ? t : 0);
    const night = (a === "candle" ? 1 - t : 0) + (b === "candle" ? t : 0);
    const m = night > 0.5 ? this.winNight : this.winDay;
    if (this.winMat.map !== m) { this.winMat.map = m; this.winMat.emissiveMap = m; this.winMat.needsUpdate = true; }
    this.winMat.emissiveIntensity = night > 0.5 ? 0.15 : 0.9;
  }
  private sunDir = new THREE.Vector3(); private cloudK = 1; private golden = 0;

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

  private weather(f: number, cam: THREE.Camera, rain: number, wind = 0) {
    this.rain.visible = rain > 0.01;
    if (!this.rain.visible) return;
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

  private fireAt(f: number, cam: THREE.Camera, pos: V3 | null, size = 1, power = 14) {
    if (!pos) { this.flame.hide(); this.fireL.intensity = 0; return; }
    this.flame.show(this.flames[Math.floor(f / 3) % 4], [pos[0], pos[1] + 0.45 * size, pos[2]], cam, 1.0 * size);
    const fl = 1 + 0.1 * Math.sin(f * 1.7) + 0.06 * Math.sin(f * 4.3 + 1);
    this.fireL.position.set(pos[0], pos[1] + 0.3 + 0.6 * size, pos[2]); this.fireL.intensity = power * fl;
  }

  private skyUpdate(cam: THREE.Camera) {
    this.sky.position.copy(cam.position); this.sky2.position.copy(cam.position);
    const d = this.sunDir;
    this.sunDisc.visible = this.golden > 0.5;
    this.sunDisc.position.set(cam.position.x + d.x * 1000, Math.max(30, d.y * 1000), cam.position.z + d.z * 1000);
    this.sunDisc.lookAt(cam.position);
    this.sun.position.set(cam.position.x + d.x * 50, cam.position.y + d.y * 50, cam.position.z + d.z * 50);
    this.sun.target.position.copy(cam.position);
    this.clouds.forEach((m, i) => {
      const a = (i / this.clouds.length) * Math.PI * 2 + 0.3, R = 900 + (i % 3) * 60;
      m.position.set(cam.position.x + R * Math.cos(a), 140 + (i % 4) * 55, cam.position.z + R * Math.sin(a));
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      const s = this.cloudK;
      (m.material as THREE.MeshBasicMaterial).color.setRGB(s, s, s * 1.02);
      if (this.golden > 0.5) (m.material as THREE.MeshBasicMaterial).color.setRGB(1.0, 0.8, 0.74);
    });
  }

  /** darkness spreading over the aerial land: r = radius of the front in metres */
  private spread(r: number) {
    const p = this.landMesh.geometry.attributes.position as THREE.BufferAttribute, c = this.landMesh.geometry.attributes.color as THREE.BufferAttribute, b = this.landBase;
    const dk = new THREE.Color("#3a2c3a");
    for (let i = 0; i < p.count; i++) {
      const d = Math.hypot(p.getX(i) - SPREAD_FROM[0], p.getZ(i) - SPREAD_FROM[1]), k = 0.6 * clamp01((r - d) / 25);
      c.setXYZ(i, b[i * 3] * (1 - k) + dk.r * k, b[i * 3 + 1] * (1 - k) + dk.g * k, b[i * 3 + 2] * (1 - k) + dk.b * k);
    }
    c.needsUpdate = true;
  }

  // ---------------- the frame ----------------
  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene): { focus: V3; shot: Shot } {
    scene.fog = this.fog;
    cam.layers.enable(NOINK);
    const shot = shotAt(f), t = f - shot.a, len = shot.b - shot.a, u = t / len;
    let pos: V3 = [0, 1.6, 3], look: V3 = [0, 1.6, 0], fov = 50, roll = 0, focus: V3 = [0, 1.6, 0];
    const B = (w: number) => w - 3;
    this.pi = 0;
    this.puffs.hide(); this.smoke.hide(); this.plumes.hide(); this.fx.hide(); this.fx2.hide(); this.fx3.hide(); this.bubble.hide(); this.flea.hide(); this.rat.hide();
    this.bugs.forEach((b) => b.hide());
    this.clouds.forEach((c) => (c.visible = true));
    this.fireAt(f, cam, null);
    this.town.visible = false; this.room.visible = false; this.lab.visible = false; this.land.visible = false; this.cart.visible = false;
    this.stool.visible = false;
    let rain = 0, wind = 0;
    const Tp = (x: number, z: number, y = 0): V3 => [TW[0] + x, TW[1] + y, TW[2] + z];
    const Rp = (x: number, z: number, y = 0): V3 => [RM[0] + x, RM[1] + y, RM[2] + z];
    const Lp = (x: number, z: number, y = 0): V3 => [LB[0] + x, LB[1] + y, LB[2] + z];
    const Ep = (x: number, z: number, y = 0): V3 => [EU[0] + x, EU[1] + y, EU[2] + z];
    const face = (p: V3, dy = 1.62): V3 => [p[0], p[1] + dy, p[2]];
    const STUDY = Rp(-3.4, 0.95);
    const BED = (i: number): V3 => Rp([-3.2, 0, 3.2][i], -3.95, 0.4);
    const beds = (f0: number, skip: number[] = [], night = false) => {
      const outs: [Outfit, string, PoseOpts][] = [
        [sick(0, { flush: 1 }), "p0", { expr: "pained" }], [sick(1, { lump: 1 }), "p1", { expr: "nervous" }], [sick(2, { spots: 1 }), "p2", { expr: "dazed" }],
      ];
      outs.forEach(([o, id, op], i) => { if (!skip.includes(i)) this.actor(f0, cam, { o, id: id + "full", pos: BED(i), opts: { ...op, mode: "sit", self: night ? 0.1 : 0.22 } }, false); });
    };

    switch (shot.id) {
      case "hook": { // you're a doctor in 1348, and half your town is dying
        this.light("day"); this.town.visible = true; this.cart.visible = true;
        const dp = Tp(0, 6);
        this.actor(f, cam, { o: DOC, id: "doc", pos: dp, opts: { expr: f < B(T.y1348) ? "neutral" : f < B(T.dying) ? "smile" : "nervous", prop: "flask" } });
        this.actor(f, cam, { o: sick(0, { flush: 1 }), id: "s0", pos: Tp(-4.0, 1.6, 0.18), opts: { expr: "pained", mode: "sit" } });
        this.actor(f, cam, { o: sick(1, { lump: 1 }), id: "s1", pos: Tp(4.0, -2.4, 0.18), opts: { expr: "nervous", mode: "sit" } });
        this.actor(f, cam, { o: folk(2), id: "f2", pos: Tp(-2.4, -6), opts: { expr: "pained" } });
        this.actor(f, cam, { o: folk(1), id: "f1", pos: Tp(lerp(2.6, 0.5, u), -11), opts: { expr: "nervous", mode: "stroll", phase: t / 18, facing: -1 } });
        this.cart.position.set(...Tp(-1.4, -24)); this.cart.rotation.y = 0;
        this.actor(f, cam, { o: DIGGER, id: "dig", pos: Tp(-1.4, -26.2), opts: { expr: "stern" } });
        this.puffs.update(f, cam, [face(Tp(-4.0, 1.6, 0.18), 1.0), face(Tp(-2.4, -6), 1.55)], { period: 38, life: 18, size: 0.32, rise: 0.25, drift: [0.35, 0.1], opacity: 0.7 });
        const k = ramp(f, B(T.half) - 4, 46);
        pos = lerp3(Tp(0.3, 8.7, 1.72), Tp(2.0, 16.5, 5.6), k); look = lerp3(face(dp, 1.55), Tp(0, -7, 1.1), k); fov = lerp(36, 52, k);
        focus = lerp3(face(dp), Tp(0, -2, 1.2), k);
        break;
      }
      case "worst": { // the worst part? you have absolutely no idea why
        this.light("candle"); this.room.visible = true;
        this.fireAt(f, cam, this.candleDesk, 0.22, 9);
        const ex = f < B(T.no) ? "neutral" : f < B(T.why) ? "nervous" : "dazed";
        this.actor(f, cam, { o: DOC, id: "doc", pos: STUDY, opts: { expr: ex, facing: 0 } });
        const qt = clamp01((f - B(T.why) + 2) / 14);
        if (qt > 0) this.fx.show(qTex(Math.round(qt * 20) / 20), face(STUDY, 2.3), cam, 0.95);
        pos = lerp3(Rp(-2.95, 5.4, 1.7), Rp(-3.15, 4.4, 1.7), smooth(u)); look = face(STUDY, 1.45); fov = 44;
        focus = face(STUDY);
        break;
      }
      case "patients": { // high fevers, swollen lumps, dark patches
        this.light("day"); this.room.visible = true;
        const fl = q4(ramp(f, B(T.fevers) - 2, 10)), lp = q4(ramp(f, B(T.swollen), 12)), sp = q4(ramp(f, B(T.dark), 12));
        this.actor(f, cam, { o: sick(0, { flush: fl }), id: `p0|${fl}`, pos: BED(0), opts: { expr: f < B(T.fevers) ? "neutral" : "pained", mode: "sit" } }, false);
        this.actor(f, cam, { o: sick(1, { lump: lp }), id: `p1|${lp}`, pos: BED(1), opts: { expr: f < B(T.swollen) ? "neutral" : "nervous", mode: "sit" } }, false);
        this.actor(f, cam, { o: sick(2, { spots: sp }), id: `p2|${sp}`, pos: BED(2), opts: { expr: f < B(T.dark) ? "neutral" : "dazed", mode: "sit" } }, false);
        const cx = -3.2 + 3.2 * ramp(f, B(T.swollen) - 16, 16) + 3.2 * ramp(f, B(T.dark) - 16, 16);
        pos = Rp(cx + 0.3, -0.4, 1.95); look = Rp(cx, -3.95, 1.25); fov = 44;
        focus = Rp(cx, -3.95, 1.25);
        break;
      }
      case "herbal": { // you try everything, herbal medicines
        this.light("day"); this.room.visible = true;
        beds(f);
        this.actor(f, cam, { o: DOC, id: "doc", pos: STUDY, opts: { expr: "stern", prop: Math.floor(f / 5) % 2 ? "mortar" : "mortar2", facing: 1 } });
        if (f > B(T.medicines)) this.puffs.update(f, cam, [add3(STUDY, [0.25, 1.28, 0.2])], { period: 14, life: 16, size: 0.25, rise: 0.25, opacity: 0.6, col: "#c8e0a0" });
        pos = lerp3(Rp(-2.5, 3.6, 1.6), Rp(-2.75, 3.0, 1.6), smooth(u)); look = face(STUDY, 1.3); fov = 44;
        focus = face(STUDY, 1.45);
        break;
      }
      case "bloodlet": { // bloodletting
        this.light("day"); this.room.visible = true;
        beds(f, [0]);
        this.actor(f, cam, { o: sick(0, { flush: 1 }), id: "p0b", pos: BED(0), opts: { expr: "pained", mode: "sit" } }, false);
        this.actor(f, cam, { o: DOC, id: "doc", pos: Rp(-2.25, -2.75), opts: { expr: "stern", prop: "bowl", facing: -1 } });
        pos = lerp3(Rp(-2.3, 0.2, 1.95), Rp(-2.4, -0.3, 1.9), smooth(u)); look = Rp(-2.75, -3.4, 1.15); fov = 44;
        pos = add3(pos, kick(f, [B(T.bloodletting) + 2], 0.02));
        focus = Rp(-2.7, -3.5, 1.3);
        break;
      }
      case "herbs": { // even burning aromatic herbs to purify the air
        this.light("day"); this.room.visible = true;
        beds(f);
        const dp = Rp(1.2, -0.25), wv = Math.round((0.5 + 0.5 * Math.sin(f * 0.32)) * 4) / 4;
        this.actor(f, cam, { o: DOC, id: "doc", pos: dp, opts: { expr: f < B(T.purify) ? "stern" : "smile", prop: "herbs", wave: wv } });
        const fill = ramp(f, shot.a, len * 0.8);
        this.fireAt(f, cam, this.brazierTop, 0.5, 10);
        this.smoke.update(f, cam, [add3(dp, [0.55, 2.05, 0.05]), this.brazierTop, add3(this.brazierTop, [-0.4, 0.3, 0.2]), add3(dp, [-1.5, 1.2, -1.0]), add3(dp, [-3.5, 1.6, -2.0]), add3(dp, [1.6, 1.8, -2.2])],
          { period: 22, life: 70, size: 1.1 + fill, rise: 1.4, drift: [0.4, 0.2], opacity: 0.38 + 0.2 * fill, col: "#e2e0d0", seed: 9 });
        pos = lerp3(Rp(1.5, 2.6, 1.75), Rp(0.9, 5.6, 2.15), smooth(u)); look = lerp3(face(dp, 1.45), Rp(0.6, -2.4, 1.4), smooth(u)); fov = lerp(44, 54, smooth(u));
        focus = face(dp, 1.5);
        break;
      }
      case "nothing": { // nothing seems to work
        this.light("day"); this.room.visible = true;
        beds(f);
        const dp = Rp(0.6, -1.3);
        this.actor(f, cam, { o: DOC, id: "doc", pos: dp, opts: { expr: f < B(T.work) ? "neutral" : "stern", prop: "herbs", ...(f > B(T.work) ? { blink: false } : {}) } });
        this.puffs.update(f, cam, [face(BED(1), 1.02)], { period: 24, life: 16, size: 0.35, rise: 0.2, drift: [0.4, 0.2], opacity: 0.7, seed: 3 });
        pos = lerp3(Rp(0.72, 1.4, 1.72), Rp(0.68, 0.35, 1.74), smooth(u)); look = face(dp, 1.58); fov = 40;
        focus = face(dp);
        break;
      }
      case "miasma": { // people believe the disease comes from poisonous air
        this.light("day"); this.town.visible = true;
        const k = ramp(f, shot.a, 30), k2 = ramp(f, B(T.poisonous), 20);
        const em: V3[] = [];
        for (let i = 0; i < 14; i++) em.push(Tp(-3.6 + (i % 4) * 2.4, -34 + i * 2.2, 0.9 + (i % 3) * 0.7));
        this.smoke.update(f, cam, em, { period: 30, life: 80, size: 4.0 + 2 * k2, rise: 0.6, drift: [0.3, 5], opacity: 0.26 * k + 0.16 * k2, col: "#9cc070", seed: 21 });
        this.actor(f, cam, { o: folk(1), id: "f1", pos: Tp(-0.75, 0.4), opts: { expr: "nervous", prop: "posy" } });
        this.actor(f, cam, { o: folk(0), id: "f0", pos: Tp(1.05, 1.4), opts: { expr: f < B(T.poisonous) ? "neutral" : "nervous", prop: "posy" } });
        this.actor(f, cam, { o: folk(3), id: "f3", pos: Tp(-0.4, -2.6), opts: { expr: "pained" } });
        this.actor(f, cam, { o: folk(6), id: "f6", pos: Tp(2.9, -6.5), opts: { expr: "nervous", prop: "posy" } });
        this.puffs.update(f, cam, [face(Tp(-0.4, -2.6), 1.5)], { period: 26, life: 16, size: 0.3, rise: 0.2, drift: [0.3, 0.1], opacity: 0.7 });
        pos = lerp3(Tp(0.6, 7.6, 1.65), Tp(0.4, 6.6, 1.6), smooth(u)); look = Tp(0, -8, 1.3); fov = 50;
        pos = add3(pos, kick(f, [B(T.poisonous)], 0.03));
        focus = Tp(0.3, 1.5, 1.5);
        break;
      }
      case "divine": { // or divine punishment
        this.light("storm"); this.town.visible = true; rain = 1; wind = 0.6;
        this.actor(f, cam, { o: folk(0), id: "f0", pos: Tp(-1.6, -69), opts: { expr: "nervous", mode: "sit" } });
        this.actor(f, cam, { o: folk(1), id: "f1", pos: Tp(1.4, -70), opts: { expr: "nervous", mode: "sit" } });
        this.actor(f, cam, { o: folk(4), id: "f4", pos: Tp(0.2, -67.5), opts: { expr: "pained", mode: "sit" } });
        pos = lerp3(Tp(4.0, -50, 1.4), Tp(3.4, -52.5, 1.2), smooth(u)); look = Tp(0, -80, 15); fov = 60; roll = -4;
        pos = add3(pos, kick(f, [B(T.punishment) + 4], 0.05));
        focus = Tp(0, -78, 10);
        break;
      }
      case "culprit": { // but you don't know the real culprit
        this.light("day"); this.town.visible = true;
        const dz = lerp(-4.6, -1.9, smooth(u * 1.1));
        this.actor(f, cam, { o: DOC, id: "doc", pos: Tp(0.1, dz), opts: { expr: "smile", prop: "posy", mode: u < 0.92 ? "stroll" : "stand", phase: t / 16 } });
        const run = smooth((f - shot.a) / Math.max(1, B(T.real) - shot.a)), stop = f >= B(T.real);
        const rp = lerp3(Tp(3.6, 0.9), Tp(0.45, 0.7), run);
        this.rat.show(ratTex(stop ? 0 : Math.floor(f / 2) % 4, stop), rp, cam, { flip: true, self: 0.3 });
        pos = lerp3(Tp(0.9, 3.4, 0.34), Tp(0.8, 3.0, 0.32), smooth(u)); look = Tp(0.2, -1.6, 0.62); fov = 52;
        pos = add3(pos, kick(f, [B(T.culprit)], 0.02));
        focus = stop ? add3(rp, [0, 0.2, 0]) : Tp(0.3, 0.3, 0.5);
        break;
      }
      case "bacteria": { // a bacterium called Yersinia pestis, often spread by infected fleas
        this.light("day"); this.town.visible = true;
        const rp = Tp(0.45, 0.7);
        this.rat.show(ratTex(0, true), rp, cam, { flip: true, self: 0.3 });
        this.actor(f, cam, { o: DOC, id: "doc", pos: Tp(0.1, -1.9), opts: { expr: "smile", prop: "posy" } });
        const jump = B(T.fleas);
        const bo = ramp(f, B(T.bacterium) - 2, 10) * (1 + 0.15 * ramp(f, B(T.yersinia), 8)) * (1 - ramp(f, jump - 2, 8));
        if (bo > 0.01) this.bubble.show(scopeTex(Math.floor(f / 4) % 4), Tp(0.74, 0.72, 0.52), cam, 0.46 * bo);
        const onRat = add3(rp, [0.05, 0.27, 0.02]);
        if (f >= B(T.spread) && f < jump) this.flea.show(fleaTex(0), onRat, cam, 0.1);
        else if (f >= jump) {
          const j = clamp01((f - jump) / 14), p = lerp3(onRat, Tp(0.88, 0.75, 0.0), j); p[1] += Math.sin(Math.PI * j) * 0.3;
          this.flea.show(fleaTex(j < 1 ? 1 : 0), p, cam, lerp(0.1, 0.12, j));
        }
        pos = lerp3(Tp(0.62, 2.9, 0.62), Tp(0.6, 2.5, 0.58), smooth(u)); look = Tp(0.36, 0.6, 0.55); fov = 42;
        focus = add3(rp, [0, 0.2, 0]);
        break;
      }
      case "morning": { // every morning, more bodies appear in the streets
        this.light("cold"); this.town.visible = true; this.cart.visible = true;
        const cz = lerp(-24, -6, smooth(u * 0.95));
        this.cart.position.set(...Tp(-1.2, cz)); this.cart.rotation.y = 0;
        this.wheels.forEach((w) => (w.rotation.x = -cz / 0.62));
        this.actor(f, cam, { o: DIGGER, id: "dig", pos: Tp(-1.2, cz - 1.85), opts: { expr: "stern", mode: "stroll", phase: t / 20 } });
        this.actor(f, cam, { o: DOC, id: "doc", pos: Tp(3.7, 3.4), opts: { expr: f < B(T.bodies) ? "neutral" : "pained", facing: -1 } });
        this.actor(f, cam, { o: folk(5), id: "f5", pos: Tp(-3.9, -9, 0.18), opts: { expr: "pained", mode: "sit" } });
        pos = lerp3(Tp(2.8, 9.4, 1.8), Tp(2.3, 8.4, 1.75), smooth(u)); look = Tp(-0.8, -9, 1.1); fov = 46;
        focus = Tp(-1.2, cz, 1.0);
        break;
      }
      case "families": { // families abandon their homes
        this.light("cold"); this.town.visible = true;
        const w = (d: number) => lerp(-4.0, 3.0, clamp01(u * 1.05 - d)) - d * 6;
        const fam: [Outfit, string, number][] = [[folk(0), "fa", 0], [{ ...folk(4), build: "kid" }, "fk", 0.05], [folk(1), "fm", 0.11], [{ ...folk(3), build: "kid", beard: undefined }, "fk2", 0.17]];
        fam.forEach(([o, id, d]) => this.actor(f, cam, { o, id, pos: Tp(w(d), -1.6 - d * 3), opts: { expr: id === "fk" ? "nervous" : "pained", mode: "stroll", phase: t / 16 + d, facing: 1 } }));
        pos = lerp3(Tp(0.3, 7.6, 1.7), Tp(0.6, 6.8, 1.7), smooth(u)); look = Tp(0.4, -3, 1.3); fov = 50;
        focus = Tp(0.4, -1.8, 1.4);
        break;
      }
      case "doctors": { // even fellow doctors begin disappearing
        this.light("day"); this.room.visible = true;
        const v1 = B(T.disappearing), v0 = v1 + 9, v2 = v1 + 18;
        const row: [Outfit, string, number, number][] = [[colleague(0), "c0", -1.7, v0], [colleague(1), "c1", -0.57, v1], [DOC, "doc", 0.57, 9999], [colleague(2), "c2", 1.7, v2]];
        const cards = [this.fx, this.fx2, this.fx3];
        let ci = 0;
        for (const [o, id, x, vt] of row) {
          const p = Rp(x, -0.8);
          if (f < vt) {
            const ex = id === "doc" ? (f < v1 ? "neutral" : "nervous") : "stern";
            const lk = id === "doc" ? (f < v1 ? 0 : f < v0 ? -1 : f < v2 ? -1 : 1) : 0;
            this.actor(f, cam, { o, id, pos: p, opts: { expr: ex, look: lk, facing: id === "doc" ? (lk as -1 | 0 | 1) : 0 } });
          } else if (f < vt + 12) cards[ci++].show(popTex(Math.round(((f - vt) / 12) * 12) / 12), add3(p, [0, 1.2, 0.1]), cam, 1.6);
        }
        pos = lerp3(Rp(0, 6.6, 1.7), Rp(0, 6.0, 1.65), smooth(u)); look = Rp(0, -0.8, 1.2); fov = 50;
        focus = Rp(0.57, -0.8, 1.6);
        break;
      }
      case "fever": { // and now, you're developing a fever
        this.light("candle"); this.room.visible = true;
        this.fireAt(f, cam, this.candleDesk, 0.22, 9);
        const fl = q4(ramp(f, B(T.developing), 26));
        const ex = f < B(T.developing) ? "neutral" : f < B(T.fever) ? "nervous" : "pained";
        this.actor(f, cam, { o: { ...DOC, flush: fl }, id: `doc|${fl}`, pos: STUDY, opts: { expr: ex } });
        pos = lerp3(Rp(-3.0, 3.6, 1.7), Rp(-3.25, 2.6, 1.7), smooth(u)); look = face(STUDY, 1.58); fov = 40; roll = 2.2 * Math.sin(f * 0.07);
        pos = add3(pos, kick(f, [B(T.fever)], 0.04));
        focus = face(STUDY);
        break;
      }
      case "lookDown": { // you look down; a painful swelling beneath your arm
        this.light("candle"); this.room.visible = true;
        this.fireAt(f, cam, this.candleDesk, 0.22, 9);
        const up = f >= B(T.painful), bb = q4(ramp(f, B(T.swelling), 18));
        const ex = f < B(T.look) ? "pained" : f < B(T.arm) ? "nervous" : "shock";
        this.actor(f, cam, { o: { ...DOC, flush: 1, bubo: bb }, id: `doc|b${bb}`, pos: STUDY, opts: { expr: ex, headTilt: f >= B(T.look) ? 9 : 0, ...(up ? { wave: 1 } : {}), blink: false } });
        pos = lerp3(Rp(-3.2, 4.3, 1.95), Rp(-3.3, 3.7, 1.9), smooth(u)); look = Rp(-3.4, 0.95, 1.5); fov = 44;
        pos = add3(pos, kick(f, [B(T.arm)], 0.04));
        focus = Rp(-3.2, 0.95, 1.55);
        break;
      }
      case "patient": { // suddenly you're no longer the doctor; you're the patient
        this.light("day"); this.room.visible = true;
        beds(f, [2]);
        this.actor(f, cam, { o: DOC_SICK, id: "docS", pos: BED(2), opts: { expr: f < B(T.patient) ? "nervous" : "pained", mode: "sit" } }, false);
        this.actor(f, cam, { o: colleague(1), id: "c1", pos: Rp(4.35, -2.9), opts: { expr: "stern", prop: "flask", facing: -1, flip: true } });
        const lk = ramp(f, B(T.longer) - 4, 20);
        pos = lerp3(Rp(3.0, 0.6, 2.0), Rp(3.2, -0.1, 1.95), smooth(u)); look = lerp3(Rp(4.5, -4.9, 1.65), Rp(3.6, -3.7, 1.2), lk); fov = 48;
        pos = add3(pos, kick(f, [B(T.patient)], 0.04));
        focus = lerp3(Rp(4.6, -4.9, 1.6), face(BED(2), 1.0), lk);
        break;
      }
      case "europe": { // the Black Death would kill tens of millions across Europe
        this.light("golden"); this.land.visible = true;
        const R = lerp(20, 430, clamp01((f - shot.a - 4) / (len - 4)));
        this.clouds.forEach((c) => (c.visible = false));
        this.spread(R);
        const em: V3[] = [];
        for (const [x, z] of TOWNS) if (Math.hypot(x - SPREAD_FROM[0], z - SPREAD_FROM[1]) < R - 20 && em.length < 42) for (const h of [8, 22, 36]) em.push(Ep(x + h * 0.15, z - h * 0.1, hLand(x, z) + h));
        this.plumes.update(f, cam, em, { period: 18, life: 34, size: 13, rise: 16, drift: [3, -2], opacity: 0.36, col: "#4a3e48", seed: 12 });
        pos = lerp3(Ep(-120, 250, 120), Ep(-70, 170, 95), smooth(u)); look = lerp3(Ep(30, -40, 0), Ep(60, -60, 0), smooth(u)); fov = 52;
        focus = Ep(40, -40, 0);
        break;
      }
      case "truth": { // and the terrifying truth?
        this.light("candle"); this.room.visible = true; this.stool.visible = true;
        this.fireAt(f, cam, this.candleStool, 0.22, 10);
        this.actor(f, cam, { o: DOC_SICK, id: "docS", pos: BED(2), opts: { expr: f < B(T.truth) ? "nervous" : "shock", mode: "sit", self: 0.12, blink: false } }, false);
        pos = lerp3(Rp(2.85, -1.6, 1.38), Rp(3.05, -2.45, 1.32), smooth(u)); look = face(BED(2), 0.95); fov = 40;
        focus = face(BED(2), 1.0);
        break;
      }
      case "invisible": { // fighting an invisible enemy that humanity won't scientifically identify
        this.light("candle"); this.room.visible = true;
        this.fireAt(f, cam, this.candleDesk, 0.22, 12);
        const dp = Rp(0.2, 0.3), wv = Math.round((0.5 + 0.5 * Math.sin(f * 0.42)) * 4) / 4;
        this.actor(f, cam, { o: DOC_SICK, id: "docS", pos: dp, opts: { expr: f < B(T.enemy) ? "stern" : "pained", prop: "herbs", wave: wv } });
        const op = ramp(f, B(T.invisible) - 2, 12);
        const B4: [number, number, number, number][] = [[-0.8, 2.35, 0.4, 0.6], [0.8, 2.6, 0.2, 0.6], [-0.78, 1.2, 0.9, 0.5], [0.8, 0.95, 1.1, 0.55]];
        B4.forEach(([x, y, z, s], i) => this.bugs[i].show(bugTex(Math.floor(f / 4 + i) % 4, i), add3(dp, [x + 0.15 * Math.sin(f * 0.05 + i), y + 0.12 * Math.cos(f * 0.06 + i * 2), z]), cam, s * op, 0.85 * op, i % 2 ? -1 : 1));
        const back = ramp(f, B(T.humanity), 40);
        pos = lerp3(Rp(0.35, 4.0, 1.7), Rp(0.35, 5.6, 1.95), back); look = add3(dp, [0, 1.55, 0]); fov = 48;
        focus = face(dp);
        break;
      }
      case "future": { // for another 500 years
        this.light("day"); this.lab.visible = true;
        const sp = Lp(-0.7, -0.9);
        this.actor(f, cam, { o: SCIENTIST, id: "sci", pos: sp, opts: { expr: f < B(T.y500) ? "neutral" : f < B(T.years) ? "shock" : "grin", facing: 1 } });
        const bo = ramp(f, B(T.y500) - 4, 10);
        if (bo > 0.01) this.bubble.show(scopeTex(Math.floor(f / 4) % 4), Lp(0.55, -1.5, 2.25), cam, 0.95 * bo);
        if (f >= B(T.years)) this.fx.show(burstTex(Math.round(clamp01((f - B(T.years)) / 16) * 16) / 16), add3(sp, [0.35, 2.2, 0.1]), cam, 1.0);
        pos = lerp3(Lp(0.0, 3.6, 1.72), Lp(-0.05, 2.7, 1.68), smooth(u)); look = Lp(-0.05, -1.2, 1.55); fov = 46;
        focus = face(sp);
        break;
      }
    }
    this.endActors();
    // every hold creeps: a tiny push toward the look target
    const dir = new THREE.Vector3(look[0] - pos[0], look[1] - pos[1], look[2] - pos[2]);
    const creep = Math.min(0.06, 0.0008 * t);
    cam.position.set(pos[0] + dir.x * creep, pos[1] + dir.y * creep, pos[2] + dir.z * creep);
    cam.fov = fov; cam.near = 0.05; cam.far = 3000; cam.up.set(0, 1, 0);
    cam.lookAt(...look); cam.rotateZ(rad(roll)); cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    this.skyUpdate(cam);
    this.weather(f, cam, rain, wind);
    for (const o of this.actors.children) {
      if (!o.visible) continue;
      if (o.userData.bill) yawTo(o, cam);
      else if (o.userData.face) o.quaternion.copy(cam.quaternion);
    }
    return { focus, shot };
  }
}
