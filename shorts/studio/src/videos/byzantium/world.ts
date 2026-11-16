// The world of "You're a Messenger During the Fall of Constantinople": the Theodosian land walls (moat, outer wall,
// inner wall with towers, the gate), the Ottoman camp and the great bombard outside, the narrow streets inside, a bell
// tower, and the square before Hagia Sophia (no minarets in 1453). Everything is built once; update() poses it for the
// shot and frame and sets the camera. Layout: walls run along x at z ~ -50; the city is +z (east, the sunrise side),
// the camp is -z.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { NOINK } from "./ink";
import { T, shotAt, Shot, Light, smooth, ramp, lerp, lerp3, kick, clamp01, V3, add3 } from "./story";
import {
  groundTexture, skyTexture, rng, plankTexture, cloudTexture, fireTexture, tileTexture, byzWallTexture, stuccoTexture, archTexture,
  leadTexture, tentTexture, byzBannerTexture, cobbleTexture,
} from "./paint";
import { Person, Puffs, PoseOpts, yawTo, MESSENGER, COMMANDER, defender, janissary, MEHMED, EMPEROR, citizen, kid } from "./cast";
import { Outfit } from "./toon";
import { burstTex, popTex, blobTex } from "./fxcards";

export type Kit = Record<string, never>;
export const loadKit = async (): Promise<Kit> => ({});

const lambert = (o: THREE.MeshLambertMaterialParameters) => new THREE.MeshLambertMaterial(o);
const rad = THREE.MathUtils.degToRad;

const WZ = -50;      // inner wall centre line
const OZ = -64;      // outer wall
const TOWER_X = [-79, -55, -31, -7, 7, 31, 55, 79];
const CRUMBLE_X = 55; // the tower whose top falls on "collapsing"
const BALL_TO: V3 = [-31, 13, -55.6];

class FxCard {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial;
  constructor(parent: THREE.Object3D, w: number, h: number) {
    this.mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.05, depthWrite: false, fog: false, toneMapped: true });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.mat);
    this.mesh.layers.set(NOINK); this.mesh.visible = false; this.mesh.renderOrder = 6; this.mesh.userData.face = true;
    parent.add(this.mesh);
  }
  show(map: THREE.Texture, pos: V3, cam: THREE.Camera, scale = 1, opacity = 1, tint?: THREE.ColorRepresentation) {
    if (this.mat.map !== map) { this.mat.map = map; this.mat.needsUpdate = true; }
    this.mat.opacity = opacity; this.mat.color.set(tint ?? 0xffffff);
    this.mesh.visible = scale > 0.002 && opacity > 0.01; this.mesh.position.set(...pos); this.mesh.scale.set(Math.max(0.001, scale), Math.max(0.001, scale), 1);
    this.mesh.quaternion.copy(cam.quaternion);
  }
  hide() { this.mesh.visible = false; }
}

type Actor = { o: Outfit; id: string; pos: V3; opts?: PoseOpts };
type LightP = { amb: number; ambC: string; hemi: number; sky: string; gnd: string; sun: number; sunC: string; sunDir: V3; fog: string; near: number; far: number;
  skyT: THREE.Texture; cloud: number; sunDisc: boolean };

export class World {
  root = new THREE.Group();
  private set = new THREE.Group(); private actors = new THREE.Group();
  private amb = new THREE.AmbientLight(0xffffff, 0.4);
  private hemi = new THREE.HemisphereLight(0xcfe3ff, 0x8a7a5a, 1.1);
  private sun = new THREE.DirectionalLight(0xfff1dc, 2.3);
  private fireL = new THREE.PointLight(0xffa860, 0, 0, 1.4);
  private fog = new THREE.Fog(0xcfe0f2, 30, 300);
  private sky!: THREE.Mesh; private skyMat!: THREE.MeshBasicMaterial; private sky2!: THREE.Mesh; private sky2Mat!: THREE.MeshBasicMaterial;
  private sunDisc!: THREE.Mesh; private sunOn = false;
  private clouds: THREE.Mesh[] = [];
  // moving set pieces
  private doors: THREE.Mesh[] = []; private crumble = new THREE.Group(); private bell!: THREE.Mesh; private ball!: THREE.Mesh;
  private banner = new THREE.Group(); private bannerCloth!: THREE.Mesh; private bannerBase!: Float32Array;
  private helmet = new THREE.Group(); private pennants: THREE.Group[] = [];
  private embers: THREE.Mesh[] = [];
  // cast + fx
  private people: Person[] = []; private pi = 0;
  private shadows: THREE.Mesh[] = [];
  private puffs: Puffs; private smoke: Puffs; private dust: Puffs;
  private fx: FxCard; private fx2: FxCard; private flame: FxCard; private flames: THREE.Texture[];
  private L: Record<Light, LightP>;

  constructor(_kit: Kit) {
    this.root.add(this.set, this.actors, this.amb, this.hemi, this.sun, this.sun.target, this.fireL);
    this.L = this.lightPresets();
    this.buildSky();
    this.buildGround();
    this.buildWalls();
    this.buildCamp();
    this.buildCity();
    this.buildHagiaSophia();
    for (let i = 0; i < 18; i++) this.people.push(new Person(this.actors));
    const bm = new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, fog: false });
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.38).rotateX(-Math.PI / 2), bm);
      m.layers.set(NOINK); m.visible = false; m.renderOrder = 1; this.actors.add(m); this.shadows.push(m);
    }
    this.puffs = new Puffs(this.actors, 40);
    this.smoke = new Puffs(this.actors, 70);
    this.dust = new Puffs(this.actors, 50);
    this.fx = new FxCard(this.actors, 1, 1); this.fx2 = new FxCard(this.actors, 1, 1);
    this.flames = [0, 1, 2, 3].map(fireTexture);
    this.flame = new FxCard(this.actors, 1, 1);
    this.flame.mat.color.setRGB(1.6, 1.4, 1.2); this.flame.mat.toneMapped = false;
  }

  // ---------------- presets: cold = blue pre-dawn, golden = sunrise behind the city (east, +z), storm = battle smoke
  private lightPresets(): Record<Light, LightP> {
    const golden: LightP = { amb: 0.4, ambC: "#d8c0e0", hemi: 0.95, sky: "#b0a0d8", gnd: "#7a5a4a", sun: 2.6, sunC: "#ffb070", sunDir: [0.62, 0.2, 0.76], fog: "#f0b890", near: 60, far: 520,
      skyT: skyTexture("#5a5a9a", "#e8a07a", "#ffcf90"), cloud: 0.95, sunDisc: true };
    return {
      day: golden,
      golden,
      cold: { amb: 0.36, ambC: "#9aa8d8", hemi: 0.75, sky: "#7a88c0", gnd: "#4a4050", sun: 0.9, sunC: "#d8b0c8", sunDir: [0.2, 0.12, 0.97], fog: "#7a7aa0", near: 60, far: 520,
        skyT: skyTexture("#1a2248", "#4a4a80", "#d89a90"), cloud: 0.55, sunDisc: false },
      storm: { amb: 0.5, ambC: "#b8a8a0", hemi: 0.75, sky: "#a89888", gnd: "#4a4038", sun: 1.1, sunC: "#ffb888", sunDir: [0.25, 0.25, 0.93], fog: "#8a7a70", near: 18, far: 200,
        skyT: skyTexture("#4a4048", "#8a7068", "#c89878"), cloud: 0.5, sunDisc: false },
      candle: golden,
    };
  }

  // ---------------- builders ----------------
  private buildSky() {
    this.skyMat = new THREE.MeshBasicMaterial({ map: this.L.golden.skyT, side: THREE.BackSide, fog: false, depthWrite: false });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 32, 16), this.skyMat); this.sky.renderOrder = -10; this.sky.layers.set(NOINK); this.root.add(this.sky);
    this.sky2Mat = new THREE.MeshBasicMaterial({ map: this.skyMat.map, side: THREE.BackSide, fog: false, depthWrite: false, transparent: true, opacity: 0 });
    this.sky2 = new THREE.Mesh(new THREE.SphereGeometry(1399, 32, 16), this.sky2Mat); this.sky2.renderOrder = -9.5; this.sky2.layers.set(NOINK); this.sky2.visible = false; this.root.add(this.sky2);
    this.sunDisc = new THREE.Mesh(new THREE.CircleGeometry(48, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.4, 1.6), fog: false, toneMapped: false, depthWrite: false }));
    this.sunDisc.layers.set(NOINK); this.sunDisc.renderOrder = -9; this.root.add(this.sunDisc);
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(260, 130), new THREE.MeshBasicMaterial({ map: cloudTexture(200 + i, "#ffffff", "#e0d0e0"), transparent: true, alphaTest: 0.2, fog: false, depthWrite: false }));
      m.layers.set(NOINK); m.renderOrder = -8; this.root.add(m); this.clouds.push(m);
    }
  }

  private buildGround() {
    const gt = groundTexture(41, "#9a9058", ["#8a8048", "#aaa068", "#8a7a50"], ["#6a6a40", "#b0a878"]); gt.repeat.set(70, 70);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(900, 900).rotateX(-Math.PI / 2), lambert({ map: gt })); this.set.add(g);
    const pv = cobbleTexture(105); pv.repeat.set(16, 22);
    const city = new THREE.Mesh(new THREE.PlaneGeometry(300, 220).rotateX(-Math.PI / 2), lambert({ map: pv, color: "#d8c8b0" })); city.position.set(0, 0.012, 64); city.layers.set(NOINK); this.set.add(city);
    const moat = new THREE.Mesh(new THREE.PlaneGeometry(300, 9).rotateX(-Math.PI / 2), lambert({ color: "#3a5a6a" })); moat.position.set(0, 0.02, -76); moat.layers.set(NOINK); this.set.add(moat);
  }

  private buildWalls() {
    const wt = byzWallTexture(); wt.repeat.set(1, 1);
    const wallM = lambert({ map: wt });
    const W = (w: number, h: number, d: number, x: number, z: number, y = 0) => {
      const t = wt.clone(); t.needsUpdate = true; t.repeat.set(w / 8, h / 8);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), lambert({ map: t })); m.position.set(x, y, z); this.set.add(m); return m;
    };
    // inner wall, gap for the gate at |x| < 3
    W(147, 12, 5, -76.5, WZ); W(147, 12, 5, 76.5, WZ);
    W(6, 4.5, 5, 0, WZ, 7.5); // over the gate arch
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 5.02, 20, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2), wallM); arch.position.set(0, 7.5, WZ); arch.rotation.z = Math.PI / 2; this.set.add(arch);
    // merlons on the outer edge of the wall walk
    const merl: THREE.BufferGeometry[] = [];
    for (let x = -148; x < 148; x += 2.4) if (Math.abs(x) > 2) merl.push(new THREE.BoxGeometry(1.3, 1.4, 0.9).translate(x, 12.7, WZ - 2.1));
    this.set.add(new THREE.Mesh(mergeGeometries(merl), wallM));
    // towers (one has a top that falls)
    for (const x of TOWER_X) {
      if (x === CRUMBLE_X) {
        W(9, 13, 9, x, WZ - 1);
        const t = wt.clone(); t.needsUpdate = true; t.repeat.set(1.1, 0.8);
        const top = new THREE.Mesh(new THREE.BoxGeometry(9, 6, 9).translate(0, 3, 0), lambert({ map: t }));
        const tm: THREE.BufferGeometry[] = [];
        for (let k = -3; k <= 3; k += 2) for (const [sx, sz] of [[k, -4.2], [k, 4.2], [-4.2, k], [4.2, k]] as const) tm.push(new THREE.BoxGeometry(1.1, 1.3, 1.1).translate(sx, 6.6, sz));
        this.crumble.add(top, new THREE.Mesh(mergeGeometries(tm), wallM));
        this.crumble.position.set(x, 13, WZ - 1); this.set.add(this.crumble);
      } else {
        W(9, 19, 9, x, WZ - 1);
        const tm: THREE.BufferGeometry[] = [];
        for (let k = -3; k <= 3; k += 2) for (const [sx, sz] of [[k, -4.2], [k, 4.2], [-4.2, k], [4.2, k]] as const) tm.push(new THREE.BoxGeometry(1.1, 1.3, 1.1).translate(x + sx, 19.6, WZ - 1 + sz));
        this.set.add(new THREE.Mesh(mergeGeometries(tm), wallM));
      }
      for (const y of [8, 14]) { const sl = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.6), lambert({ color: "#1a1418" })); sl.position.set(x, y, WZ - 5.52); sl.rotation.y = Math.PI; sl.layers.set(NOINK); this.set.add(sl); }
    }
    // the gate doors (hinged at the jambs, open inward toward the city)
    const dm = lambert({ map: plankTexture(106, "#6a4a2a") });
    for (const s of [-1, 1]) {
      const d = new THREE.Mesh(new THREE.BoxGeometry(3, 7.5, 0.4).translate(-s * 1.5, 3.75, 0), dm); d.position.set(s * 3, 0, WZ + 1.8); this.set.add(d); this.doors.push(d);
    }
    // outer wall (lower) and its towers, gap at the gate
    W(146, 7, 2.6, -77, OZ); W(146, 7, 2.6, 77, OZ);
    const om: THREE.BufferGeometry[] = [];
    for (let x = -148; x < 148; x += 2.4) if (Math.abs(x) > 4) om.push(new THREE.BoxGeometry(1.1, 1.1, 0.8).translate(x, 7.5, OZ - 0.9));
    this.set.add(new THREE.Mesh(mergeGeometries(om), wallM));
    for (const x of [-67, -43, -19, 19, 43, 67]) W(6, 10, 6, x, OZ - 1.5);
    // torches along the inner wall top (pre-dawn glow)
    const em = lambert({ color: "#ffb050", emissive: "#ff9a30", emissiveIntensity: 2.2 });
    for (let x = -100; x <= 100; x += 12) { const t = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), em); t.position.set(x + 3, 13.6, WZ - 1.6); t.layers.set(NOINK); this.set.add(t); this.embers.push(t); }
    // the cannonball
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 8), lambert({ color: "#3a3a3e" })); this.ball.visible = false; this.set.add(this.ball);
  }

  private buildCamp() {
    const r = rng(55);
    const tents = [lambert({ map: tentTexture("#b8322c", "#efe6d2") }), lambert({ map: tentTexture("#2f6a4a", "#efe6d2") }), lambert({ map: tentTexture("#efe6d2", "#e0d4bc") })];
    for (let i = 0; i < 70; i++) {
      const x = -180 + r() * 360, z = -150 - r() * 200, s = 4 + r() * 4;
      const t = new THREE.Mesh(new THREE.ConeGeometry(s, s * 1.2, 10).translate(0, s * 0.6, 0), tents[i % 3]); t.position.set(x, 0, z); this.set.add(t);
      if (i % 4 === 0) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), lambert({ color: "#ffb050", emissive: "#ff8a20", emissiveIntensity: 2.4 })); f.position.set(x + s + 2, 0.6, z); f.layers.set(NOINK); this.set.add(f); this.embers.push(f); }
    }
    // the sultan's tent (larger, red and gold) and a low dais in front of it
    const st = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 6, 20).translate(0, 3, 0), lambert({ map: tentTexture("#b8322c", "#d9b04a") })); st.position.set(0, 0, -150); this.set.add(st);
    const sr = new THREE.Mesh(new THREE.ConeGeometry(10, 6, 20).translate(0, 9, 0), lambert({ color: "#b8322c" })); sr.position.set(0, 0, -150); this.set.add(sr);
    const dais = new THREE.Mesh(new THREE.BoxGeometry(6, 0.6, 4).translate(0, 0.3, 0), lambert({ map: plankTexture(107, "#7a5230") })); dais.position.set(0, 0, -138); this.set.add(dais);
    // red pennants on poles
    const pm = lambert({ color: "#c0302a", side: THREE.DoubleSide }), poleM = lambert({ color: "#5a3a20" });
    const pennant = () => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 6, 6).translate(0, 3, 0), poleM));
      const sh = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(2.4, -0.45), new THREE.Vector2(0, -0.9)]);
      const fl = new THREE.Mesh(new THREE.ShapeGeometry(sh), pm); fl.position.set(0.05, 5.9, 0); g.add(fl);
      return g;
    };
    for (const [x, z] of [[-6, -140], [6, -140], [-14, -146], [14, -146]] as const) { const p = pennant(); p.position.set(x, 0, z); this.set.add(p); }
    for (let i = 0; i < 4; i++) { const p = pennant(); p.visible = false; this.set.add(p); this.pennants.push(p); }
    // the great bombard on its timber bed, and two smaller guns
    const bronze = lambert({ color: "#9a7a3a", emissive: "#3a2a10", emissiveIntensity: 0.2 }), timber = lambert({ map: plankTexture(108, "#6a4a2a") });
    const gun = (x: number, z: number, L: number, R: number) => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(R * 3.2, 0.8, L * 0.9).translate(0, 0.4, 0), timber));
      const b = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 1.15, L, 20).rotateX(Math.PI / 2), bronze); b.position.set(0, 0.8 + R, 0); b.rotation.x = -0.06; g.add(b);
      for (const k of [-0.35, 0, 0.35]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.12, 0.12, 6, 20), bronze); ring.position.set(0, 0.8 + R, k * L); g.add(ring); }
      const mouth = new THREE.Mesh(new THREE.CircleGeometry(R * 0.7, 16), lambert({ color: "#141014" })); mouth.position.set(0, 0.8 + R, L / 2 + 0.02); mouth.layers.set(NOINK); g.add(mouth);
      g.position.set(x, 0, z); this.set.add(g);
    };
    gun(-20, -118, 8.5, 1.15); gun(-6, -116, 4, 0.6); gun(-36, -120, 4, 0.6);
  }

  private house(w: number, d: number, h: number, seed: number, mats: { walls: THREE.Material[]; roof: THREE.Material; arch: THREE.Material; archLit: THREE.Material; wood: THREE.Material }, side: number) {
    const g = new THREE.Group(), r = rng(seed);
    const wm = mats.walls[Math.floor(r() * mats.walls.length)];
    g.add(new THREE.Mesh(new THREE.BoxGeometry(d, h, w).translate(0, h / 2, 0), wm));
    if (r() < 0.55) { const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, d) * 0.55, 1.8, 4).rotateY(Math.PI / 4).translate(0, h + 0.9, 0), mats.roof); roof.scale.set(d / Math.hypot(w, d) * 1.45, 1, w / Math.hypot(w, d) * 1.45); g.add(roof); }
    else { const par = new THREE.Mesh(new THREE.BoxGeometry(d + 0.2, 0.6, w + 0.2).translate(0, h + 0.3, 0), wm); g.add(par); }
    const fx = (d / 2 + 0.03) * side;
    const plane = (m: THREE.Material, pw: number, ph: number, y: number, z: number) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), m); p.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2; p.position.set(-fx, y, z); p.layers.set(NOINK); g.add(p); };
    plane(mats.arch, 1.4, 2.3, 1.15, (r() - 0.5) * (w - 2));
    for (const z of [-w * 0.25, w * 0.25]) plane(r() < 0.25 ? mats.archLit : mats.arch, 0.9, 1.35, h - 1.6, z);
    if (r() < 0.4) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.15, 2.2), mats.wood); b.position.set(-fx - side * 0.45, h - 2.3, 0); g.add(b); const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 2.2), mats.wood); rail.position.set(-fx - side * 0.88, h - 1.9, 0); g.add(rail); }
    return g;
  }

  private buildCity() {
    const cols = ["#efe6d2", "#e8c89a", "#e0a888", "#f2e2c8", "#d8b890", "#e8d0b8"];
    const mats = { walls: cols.map((c, i) => lambert({ map: stuccoTexture(110 + i, c) })), roof: lambert({ map: (() => { const t = tileTexture(111, "#b05a3a"); t.repeat.set(2, 2); return t; })() }),
      arch: lambert({ map: archTexture(false) }), archLit: lambert({ map: archTexture(true), emissive: "#ffffff", emissiveMap: archTexture(true), emissiveIntensity: 0.6 }), wood: lambert({ color: "#6a4a2a" }) };
    const r = rng(19);
    for (const side of [-1, 1]) {
      let z = -44;
      while (z < 64) {
        const w = 5 + r() * 3, d = 7, h = 6.5 + r() * 4.5;
        const g = this.house(w, d, h, 300 + side * 40 + Math.round(z), mats, side);
        g.position.set(side * (2.8 + d / 2), 0, z + w / 2); this.set.add(g);
        const b = this.house(w * 1.2, 8, h + 2 + r() * 4, 500 + side * 40 + Math.round(z), mats, side);
        b.position.set(side * (13 + 4), 0, z + w / 2 + 1); this.set.add(b);
        z += w + 0.05;
      }
    }
    // a rooftop terrace (hook) on the right side
    const ter = new THREE.Mesh(new THREE.BoxGeometry(8, 7, 8).translate(0, 3.5, 0), mats.walls[0]); ter.position.set(12, 0, 4); this.set.add(ter);
    for (const [x, z, w, d] of [[12, 0.1, 8, 0.3], [8.1, 4, 0.3, 8], [15.9, 4, 0.3, 8]] as const) { const p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.9, d).translate(0, 7.45, 0), mats.walls[0]); p.position.set(x, 0, z); this.set.add(p); }
    // the bell tower above the right-hand roofs near the walls
    const bt = new THREE.Mesh(new THREE.BoxGeometry(4, 18, 4).translate(0, 9, 0), mats.walls[3]); bt.position.set(7.5, 0, -24); this.set.add(bt);
    const open = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2), lambert({ color: "#1a1418" })); open.position.set(5.48, 15.6, -24); open.rotation.y = -Math.PI / 2; open.layers.set(NOINK); this.set.add(open);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(3.2, 3, 4).rotateY(Math.PI / 4).translate(0, 19.5, 0), mats.roof); cap.position.set(7.5, 0, -24); this.set.add(cap);
    this.bell = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.8, 1.2, 14).translate(0, -0.7, 0), lambert({ color: "#b08a3a" })); this.bell.position.set(5.6, 16.9, -24); this.set.add(this.bell);
    // small church domes over the roofs (skyline)
    const lead = lambert({ map: leadTexture() });
    for (const [x, z, s] of [[-24, 10, 4], [26, 30, 5], [-30, 48, 3.5], [34, -10, 3.5]] as const) {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(s, s, s * 1.2, 16).translate(0, s * 0.6, 0), mats.walls[2]); drum.position.set(x, 11, z); this.set.add(drum);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(s * 1.02, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), lead); dome.position.set(x, 11 + s * 1.2, z); this.set.add(dome);
      const base = new THREE.Mesh(new THREE.BoxGeometry(s * 3, 11, s * 3).translate(0, 5.5, 0), mats.walls[2]); base.position.set(x, 0, z); this.set.add(base);
    }
    // the fallen gilded helmet (shown after the emperor's last stand)
    const gold = lambert({ color: "#d9b04a", emissive: "#5a4010", emissiveIntensity: 0.25 });
    this.helmet.add(new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), gold));
    const brim = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.035, 6, 18).rotateX(Math.PI / 2), gold); this.helmet.add(brim);
    const nasal = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.03).translate(0, -0.08, 0.27), gold); this.helmet.add(nasal);
    const cloak = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9).rotateX(-Math.PI / 2), lambert({ color: "#4a2058", side: THREE.DoubleSide })); cloak.position.set(0.5, -0.14, 0.2); cloak.rotation.y = 0.4; this.helmet.add(cloak);
    this.helmet.rotation.z = 0.5; this.helmet.visible = false; this.set.add(this.helmet);
  }

  private buildHagiaSophia() {
    const wall = lambert({ map: stuccoTexture(120, "#e8b890"), emissive: "#5a3020", emissiveIntensity: 0.25 }), lead = lambert({ map: leadTexture(), color: "#c8ccd4", emissive: "#3a3a48", emissiveIntensity: 0.3 }), dark = lambert({ color: "#2a2228" });
    const H = new THREE.Group(); H.position.set(0, 0, 150);
    H.add(new THREE.Mesh(new THREE.BoxGeometry(72, 26, 66).translate(0, 13, 0), wall));
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(17, 17.5, 5, 40).translate(0, 26 + 2.5, 0), wall); H.add(drum);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(17.2, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.62, 1), lead); dome.position.y = 31; H.add(dome);
    for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2, w = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), dark); w.position.set(17.55 * Math.cos(a), 29, 17.55 * Math.sin(a)); w.lookAt(35 * Math.cos(a), 29, 35 * Math.sin(a)); w.layers.set(NOINK); H.add(w); }
    for (const s of [-1, 1]) {
      const sd = new THREE.Mesh(new THREE.SphereGeometry(16, 32, 12, s > 0 ? Math.PI : 0, Math.PI, 0, Math.PI / 2).scale(1, 0.62, 1), lead); sd.rotation.y = Math.PI / 2; sd.position.set(0, 26, s * 16); H.add(sd);
    }
    for (const [x, z] of [[-30, -28], [30, -28], [-30, 28], [30, 28]] as const) H.add(new THREE.Mesh(new THREE.BoxGeometry(8, 32, 8).translate(x, 16, z), wall));
    const nar = new THREE.Mesh(new THREE.BoxGeometry(60, 14, 8).translate(0, 7, -37), wall); H.add(nar);
    const narR = new THREE.Mesh(new THREE.BoxGeometry(61, 0.8, 9).translate(0, 14.4, -37), lead); H.add(narR);
    const am = lambert({ map: archTexture(false) });
    for (let i = -2; i <= 2; i++) { const a = new THREE.Mesh(new THREE.PlaneGeometry(4, 6), am); a.position.set(i * 9, 3, -41.05); a.rotation.y = Math.PI; a.layers.set(NOINK); H.add(a); }
    // steps in front of the narthex
    for (let k = 0; k < 4; k++) H.add(new THREE.Mesh(new THREE.BoxGeometry(46 - k * 2, 0.35, 2).translate(0, 0.175 + k * 0.35, -42 - 6 + k * 1.6), lambert({ color: "#cfc2aa" })));
    this.set.add(H);
    // the banner pole in the square
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 15, 8).translate(0, 7.5, 0), lambert({ color: "#5a3a20" })); this.banner.add(pole);
    const fg = new THREE.PlaneGeometry(4.2, 3.0, 12, 6).translate(2.1, -1.5, 0);
    this.bannerBase = (fg.attributes.position.array as Float32Array).slice();
    this.bannerCloth = new THREE.Mesh(fg, lambert({ map: byzBannerTexture(), side: THREE.DoubleSide })); this.bannerCloth.position.set(0.1, 14.8, 0); this.banner.add(this.bannerCloth);
    this.banner.position.set(9, 0, 96); this.set.add(this.banner);
  }

  // ---------------- per-frame helpers ----------------
  private light(a: Light, b: Light = a, t = 0) {
    const A = this.L[a], B = this.L[b], l = (x: number, y: number) => lerp(x, y, t), c = (x: string, y: string) => new THREE.Color(x).lerp(new THREE.Color(y), t);
    this.amb.intensity = l(A.amb, B.amb); this.amb.color.copy(c(A.ambC, B.ambC));
    this.hemi.intensity = l(A.hemi, B.hemi); this.hemi.color.copy(c(A.sky, B.sky)); this.hemi.groundColor.copy(c(A.gnd, B.gnd));
    this.sun.intensity = l(A.sun, B.sun); this.sun.color.copy(c(A.sunC, B.sunC));
    this.sunDir.set(...lerp3(A.sunDir, B.sunDir, t)).normalize();
    this.fog.color.copy(c(A.fog, B.fog)); this.fog.near = l(A.near, B.near); this.fog.far = l(A.far, B.far);
    this.skyMat.map = A.skyT; this.sky2Mat.map = B.skyT; this.sky2Mat.opacity = t; this.sky2.visible = B.skyT !== A.skyT && t > 0.001;
    this.cloudK = l(A.cloud, B.cloud); this.sunOn = (t < 0.5 ? A : B).sunDisc;
    const night = (a === "cold" ? 1 - t : 0) + (b === "cold" ? t : 0);
    this.embers.forEach((e) => (e.visible = night > 0.3));
  }
  private sunDir = new THREE.Vector3(); private cloudK = 1;

  private actor(f: number, cam: THREE.Camera, a: Actor, shadow = true) {
    const p = this.people[this.pi], sh = this.shadows[this.pi];
    this.pi++;
    if (!p) return;
    const blink = a.opts?.blink ?? ((f + a.id.length * 23 + a.id.charCodeAt(0) * 7) % 64 < 4);
    p.pose(a.o, a.id, a.pos, cam, { ...a.opts, blink });
    if (shadow && sh) { sh.visible = true; sh.position.set(a.pos[0], a.pos[1] + 0.03, a.pos[2]); sh.scale.setScalar(a.opts?.scale ?? 1); }
  }
  private endActors() { for (let i = this.pi; i < this.people.length; i++) { this.people[i].hide(); this.shadows[i].visible = false; } }

  private fireAt(f: number, cam: THREE.Camera, pos: V3 | null, size = 1, power = 14) {
    if (!pos) { this.flame.hide(); this.fireL.intensity = 0; return; }
    this.flame.show(this.flames[Math.floor(f / 3) % 4], [pos[0], pos[1] + 0.45 * size, pos[2]], cam, 1.0 * size);
    const fl = 1 + 0.1 * Math.sin(f * 1.7) + 0.06 * Math.sin(f * 4.3 + 1);
    this.fireL.position.set(pos[0], pos[1] + 0.3 + 0.6 * size, pos[2]); this.fireL.intensity = power * fl;
  }

  private skyUpdate(cam: THREE.Camera) {
    this.sky.position.copy(cam.position); this.sky2.position.copy(cam.position);
    const d = this.sunDir;
    this.sunDisc.visible = this.sunOn;
    this.sunDisc.position.set(cam.position.x + d.x * 1100, Math.max(40, d.y * 1100), cam.position.z + d.z * 1100);
    this.sunDisc.lookAt(cam.position);
    this.sun.position.set(cam.position.x + d.x * 50, cam.position.y + d.y * 50, cam.position.z + d.z * 50);
    this.sun.target.position.copy(cam.position);
    this.clouds.forEach((m, i) => {
      const a = (i / this.clouds.length) * Math.PI * 2 + 0.3, R = 1000 + (i % 3) * 60;
      m.position.set(cam.position.x + R * Math.cos(a), 150 + (i % 4) * 60, cam.position.z + R * Math.sin(a));
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      const s = this.cloudK; (m.material as THREE.MeshBasicMaterial).color.setRGB(s, s * 0.9, s * 0.92);
    });
  }

  private bannerWave(f: number, amp = 1) {
    const p = this.bannerCloth.geometry.attributes.position as THREE.BufferAttribute, b = this.bannerBase;
    for (let i = 0; i < p.count; i++) { const x = b[i * 3], y = b[i * 3 + 1]; p.setXYZ(i, x, y, amp * 0.35 * Math.sin(f * 0.22 - x * 1.6) * (x / 4.2)); }
    p.needsUpdate = true; this.bannerCloth.geometry.computeVertexNormals();
  }

  // ---------------- the frame ----------------
  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene): { focus: V3; shot: Shot } {
    scene.fog = this.fog;
    cam.layers.enable(NOINK);
    const shot = shotAt(f), t = f - shot.a, len = shot.b - shot.a, u = t / len;
    let pos: V3 = [0, 1.6, 3], look: V3 = [0, 1.6, 0], fov = 50, roll = 0, focus: V3 = [0, 1.6, 0];
    const B = (w: number) => w - 3;
    this.pi = 0;
    this.puffs.hide(); this.smoke.hide(); this.dust.hide(); this.fx.hide(); this.fx2.hide(); this.fireAt(f, cam, null);
    this.doors.forEach((d, i) => (d.rotation.y = 0 * i)); this.crumble.position.set(CRUMBLE_X, 13, WZ - 1); this.crumble.rotation.set(0, 0, 0); this.crumble.visible = true;
    this.bell.rotation.x = 0; this.ball.visible = false; this.helmet.visible = false; this.pennants.forEach((p) => (p.visible = false));
    this.banner.visible = true; this.bannerCloth.position.set(0.1, 14.8, 0); this.bannerCloth.rotation.set(0, 0, 0); this.bannerWave(f);
    const face = (p: V3, dy = 1.62): V3 => [p[0], p[1] + dy, p[2]];
    const smokeCols = (em: V3[], o: { op?: number; size?: number; col?: string } = {}) => {
      const st: V3[] = [];
      for (const e of em.slice(0, 11)) { const s0 = (o.size ?? 9) * 0.6; st.push(e, add3(e, [s0 * 0.3, s0 * 1.1, s0 * 0.2]), add3(e, [s0 * 0.7, s0 * 2.1, s0 * 0.4])); }
      this.smoke.update(f, cam, st, { period: 18, life: 36, size: o.size ?? 9, rise: (o.size ?? 9) * 0.9, drift: [2, 1.5], opacity: Math.min(1, (o.op ?? 0.55) * 1.5), col: o.col ?? "#3e363e", seed: 31 });
    };
    const CITY_SMOKE: V3[] = [[-30, 8, -20], [20, 8, 10], [-14, 8, 40], [36, 8, 60], [-40, 8, 80], [10, 10, -40], [30, 10, -45], [-20, 10, -42]];

    switch (shot.id) {
      case "hook": { // a messenger in Constantinople; the fate of an empire in your hands
        this.light("golden");
        const mp: V3 = [11.4, 7, 3.6];
        this.actor(f, cam, { o: MESSENGER, id: "msg", pos: mp, opts: { expr: f < B(T.fate) ? "neutral" : "nervous", prop: "scroll" } });
        const k1 = ramp(f, B(T.constantinople) - 4, 42), k2 = ramp(f, B(T.hands) - 16, 22);
        const P0: V3 = [12.3, 8.65, 0.6], P1: V3 = [11.5, 19, -7], P2: V3 = [11.7, 8.5, 2.2];
        const L0 = face(mp, 1.55), L1: V3 = [0, 20, 150], L2: V3 = [11.55, 8.2, 3.6];
        pos = lerp3(lerp3(P0, P1, k1), P2, k2); look = lerp3(lerp3(L0, L1, k1), L2, k2); fov = lerp(lerp(40, 54, k1), 38, k2);
        focus = lerp3(lerp3(face(mp), [0, 20, 150], k1), [11.5, 8.25, 3.6], k2);
        break;
      }
      case "date": { // It's May 29, 1453 (pre-dawn, outside the walls)
        this.light("cold");
        smokeCols([[-31, 10, -56], [10, 10, -60], [-60, 8, -66], [40, 8, -66]], { op: 0.35, size: 10 });
        pos = lerp3([46, 46, -205], [34, 40, -186], smooth(u)); look = [0, 10, -60]; fov = 50;
        focus = [0, 10, -80];
        break;
      }
      case "cannons": { // for weeks, Ottoman cannons have pounded your city's massive walls
        this.light("cold", "golden", ramp(f, shot.a, len) * 0.35);
        const muzzle: V3 = [-20, 2.5, -113.4], fires = [B(T.cannons), B(T.pounded)];
        this.actor(f, cam, { o: janissary(0), id: "g0", pos: [-23.6, 0, -119], opts: { expr: "stern", facing: 1 } });
        this.actor(f, cam, { o: janissary(2), id: "g2", pos: [-16.4, 0, -121], opts: { expr: f > fires[0] ? "shock" : "neutral", facing: -1 } });
        for (const fr of fires) if (f >= fr && f < fr + 10) this.fx.show(burstTex(Math.round(((f - fr) / 10) * 10) / 10), muzzle, cam, 7, 1, "#ffb060");
        this.smoke.update(f, cam, [add3(muzzle, [0, 1, 4]), add3(muzzle, [2, 1.5, 9]), add3(muzzle, [-2, 2, 14])], { period: 20, life: 70, size: 7 * ramp(f, fires[0], 6), rise: 4, drift: [3, 5], opacity: 0.6, col: "#d8d0c8", seed: 5 });
        const fly = clamp01((f - fires[1]) / (B(T.walls1) - fires[1]));
        if (f >= fires[1] && fly < 1) { this.ball.visible = true; const bp = lerp3(muzzle, BALL_TO, fly); bp[1] += Math.sin(Math.PI * fly) * 9; this.ball.position.set(...bp); }
        if (f >= B(T.walls1)) {
          const d = clamp01((f - B(T.walls1)) / 14);
          this.fx2.show(burstTex(Math.round(d * 12) / 12), BALL_TO, cam, 9, 1, "#e8d8c0");
          this.dust.update(f, cam, [BALL_TO, add3(BALL_TO, [3, -3, -1]), add3(BALL_TO, [-3, -5, -1])], { period: 30, life: 60, size: 6, rise: 3, drift: [1, -2], opacity: 0.7, col: "#c8b8a0", seed: 7 });
        }
        pos = lerp3([-25.5, 3.4, -133], [-24.5, 3.2, -128], smooth(u)); look = [-14, 9, -60]; fov = 46;
        pos = add3(pos, kick(f, fires, 0.12)); pos = add3(pos, kick(f, [B(T.walls1)], 0.06));
        focus = [-20, 3, -114];
        break;
      }
      case "collapsing": { // now, just before dawn, the defences are collapsing
        this.light("golden", "storm", 0.35);
        const y = 12, z = WZ + 0.6;
        this.actor(f, cam, { o: defender(0), id: "d0", pos: [41, y, z - 1.2], opts: { expr: "stern", prop: "shield" } });
        this.actor(f, cam, { o: defender(1), id: "d1", pos: [43.4, y, z - 1.6], opts: { expr: f < B(T.collapsing) ? "nervous" : "shock", prop: "spear" } });
        this.actor(f, cam, { o: defender(2), id: "d2", pos: [45.6, y, z - 1.0], opts: { expr: "stern", prop: "shield" } });
        this.actor(f, cam, { o: MESSENGER, id: "msg", pos: [38.6, y, z - 0.6], opts: { expr: f < B(T.collapsing) ? "nervous" : "shock", prop: "scroll" } });
        const c = ramp(f, B(T.collapsing), 26);
        this.crumble.position.set(CRUMBLE_X + c * 2.5, 13 - c * 15, WZ - 1 - c * 3); this.crumble.rotation.set(-c * 0.5, 0, c * 0.6);
        if (c > 0.02) this.dust.update(f, cam, [[CRUMBLE_X, 14, WZ - 2], [CRUMBLE_X + 3, 8, WZ - 4], [CRUMBLE_X - 2, 4, WZ - 5]], { period: 26, life: 70, size: 9, rise: 4, drift: [1, -2], opacity: 0.7 * c, col: "#c8b8a0", seed: 9 });
        smokeCols([[30, 14, -70], [70, 12, -80], [10, 12, -75]], { op: 0.45, size: 8 });
        pos = lerp3([36.6, 13.9, -44.6], [37.4, 13.8, -45.6], smooth(u)); look = [47, 14.5, -51]; fov = 50;
        pos = add3(pos, kick(f, [B(T.collapsing) + 8], 0.07));
        focus = [42, 13.6, -49.6];
        break;
      }
      case "grab": { // a commander grabs your shoulder
        this.light("golden", "storm", 0.35);
        const mp: V3 = [37.6, 12, -49.6], cp: V3 = [38.85, 12, -50.0], g = f >= B(T.grabs);
        this.actor(f, cam, { o: MESSENGER, id: "msg", pos: mp, opts: { expr: g ? "shock" : "nervous", prop: "scroll", facing: g ? 1 : 0, ...(g ? { blink: false } : {}) } });
        this.actor(f, cam, { o: COMMANDER, id: "cmd", pos: cp, opts: { expr: "stern", facing: -1, ...(g ? { wave: 0 } : {}), flip: true } });
        smokeCols([[30, 14, -70], [50, 12, -80]], { op: 0.4, size: 8 });
        pos = lerp3([38.4, 13.55, -45.4], [38.3, 13.5, -46.2], smooth(u)); look = [38.2, 13.35, -49.8]; fov = 44;
        pos = add3(pos, kick(f, [B(T.grabs)], 0.025));
        focus = [38.2, 13.6, -49.8];
        break;
      }
      case "order": { // "Get to the palace! Warn them!"
        this.light("golden", "storm", 0.35);
        const cp: V3 = [38.85, 12, -50.0];
        this.actor(f, cam, { o: COMMANDER, id: "cmd", pos: cp, opts: { expr: "shout", wave: f > B(T.palace) ? 1 : 0.5, blink: false } });
        smokeCols([[30, 14, -70], [50, 12, -80], [20, 12, -76]], { op: 0.45, size: 8 });
        pos = lerp3([39.15, 13.62, -47.1], [39.1, 13.6, -47.6], smooth(u)); look = face(cp, 1.5); fov = 40;
        pos = add3(pos, kick(f, [B(T.palace), B(T.warn)], 0.03));
        focus = face(cp);
        break;
      }
      case "run": { // you run through narrow streets as bells ring and families rush past
        this.light("golden");
        const mz = lerp(-40, -10, u);
        this.actor(f, cam, { o: MESSENGER, id: "msg", pos: [0.2, 0, mz], opts: { expr: "nervous", mode: "march", phase: t / 11, prop: "scroll" } });
        const fr = clamp01((f - B(T.families) + 6) / 30);
        if (f > B(T.families) - 6) {
          const fam: [Outfit, string, number][] = [[citizen(0), "c0", 0], [kid(4), "k4", 0.1], [citizen(1), "c1", 0.18], [kid(5), "k5", 0.26]];
          fam.forEach(([o, id, d]) => this.actor(f, cam, { o, id, pos: [lerp(-2.4, 2.6, clamp01(fr * 1.3 - d)), 0, mz - 2.2 - d * 2], opts: { expr: "shock", mode: "march", phase: t / 10 + d, facing: 1 } }));
        }
        this.bell.rotation.z = f > B(T.bells) ? 0.45 * Math.sin((f - B(T.bells)) * 0.3) : 0;
        smokeCols([[10, 14, -60], [-20, 14, -62], [30, 12, -66]], { op: 0.35, size: 9 });
        pos = [0.7, 1.7, mz + 4.6]; look = [0.1, 2.4, mz - 12]; fov = 52; roll = 2 * Math.sin(t * 0.25);
        focus = face([0.2, 0, mz]);
        break;
      }
      case "behind": { // behind you, soldiers fight to hold back Sultan Mehmed II's army
        this.light("storm");
        if (f < B(T.sultan) - 2) {
          const dz = OZ + 0.3;
          [-3.6, -1.4, 0.8, 3.0].forEach((x, i) => this.actor(f, cam, { o: defender(i), id: "d" + i, pos: [x, 7, dz], opts: { expr: i % 2 ? "shout" : "stern", prop: i % 2 ? "spear" : "shield" } }));
          [-5, -2.6, -0.2, 2.2, 4.6, -3.8, 1.0, 3.6].forEach((x, i) => this.actor(f, cam, { o: janissary(i), id: "j" + i, pos: [x, 0, -71 - (i > 4 ? 2.4 : 0) - 0.3 * Math.sin(f * 0.2 + i)], opts: { expr: i % 3 ? "stern" : "shout", prop: i % 2 ? "spear" : null } }));
          this.dust.update(f, cam, [[-2, 2, -70], [3, 2, -72], [0, 3, -75], [-5, 2, -73]], { period: 22, life: 60, size: 4, rise: 3, drift: [1, -1], opacity: 0.5, col: "#b8a890", seed: 11 });
          pos = lerp3([1.2, 11.2, -55.5], [0.9, 11.0, -57], smooth(u)); look = [0, 5.0, -70]; fov = 50;
          pos = add3(pos, kick(f, [B(T.fight)], 0.04));
          focus = [0, 7.8, -64];
        } else {
          const mp: V3 = [0, 0.6, -138];
          this.actor(f, cam, { o: MEHMED, id: "meh", pos: mp, opts: { expr: "stern" } });
          this.actor(f, cam, { o: janissary(0), id: "jg0", pos: [-2.4, 0, -138.6], opts: { expr: "stern", prop: "spear" } });
          this.actor(f, cam, { o: janissary(1), id: "jg1", pos: [2.4, 0, -138.6], opts: { expr: "stern", prop: "spear" } });
          const k = ramp(f, B(T.sultan) - 2, 50);
          pos = lerp3([1.2, 2.3, -131.2], [0.8, 2.4, -132.6], k); look = face(mp, 1.45); fov = 44;
          focus = face(mp);
        }
        break;
      }
      case "hear": { // then you hear it
        this.light("golden", "storm", 0.3);
        const mp: V3 = [0, 0, -12];
        this.actor(f, cam, { o: MESSENGER, id: "msg", pos: mp, opts: { expr: f < B(T.hear) ? "nervous" : "shock", prop: "scroll", facing: f < B(T.hear) ? 1 : 0, blink: false } });
        smokeCols([[10, 14, -60], [-20, 14, -62], [0, 14, -58]], { op: 0.45, size: 10 });
        pos = lerp3([0.45, 1.68, -15.2], [0.38, 1.68, -14.3], smooth(u)); look = face(mp, 1.58); fov = 42;
        focus = face(mp);
        break;
      }
      case "roar": { // a deafening roar from the walls
        this.light("storm");
        const hit = B(T.roar), d = clamp01((f - hit) / 18);
        if (f >= hit) {
          this.fx.show(burstTex(Math.round(d * 12) / 12), [0, 9, WZ - 1], cam, 30 * (0.6 + d), 1 - d * 0.5, "#ffd8a0");
          this.dust.update(f, cam, [[0, 6, WZ + 2], [-8, 8, WZ], [8, 8, WZ], [0, 12, WZ - 4], [-4, 3, WZ + 4]], { period: 30, life: 80, size: 14, rise: 8, drift: [0, 6], opacity: 0.75, col: "#c0b098", seed: 13 });
        }
        [[-1.6, -18, "c3"], [1.8, -16, "c2"], [-0.4, -14, "c6"]].forEach(([x, z, id], i) => this.actor(f, cam, { o: citizen([3, 2, 6][i]), id: id as string, pos: [x as number, 0, z as number], opts: { expr: f < hit ? "nervous" : "shock" } }));
        pos = lerp3([0.8, 1.5, -6], [0.6, 1.6, -7.5], smooth(u)); look = [0, 9, -50]; fov = 52; roll = 3;
        pos = add3(pos, kick(f, [hit, hit + 3], 0.14));
        focus = [0, 6, -40];
        break;
      }
      case "breaking": { // Ottoman soldiers are breaking into the city
        this.light("storm");
        const op = ramp(f, B(T.breaking), 12);
        this.doors[0].rotation.y = -op * 1.4; this.doors[1].rotation.y = op * 1.4;
        if (f >= B(T.breaking)) this.dust.update(f, cam, [[0, 3, WZ + 3], [-2, 2, WZ + 5], [2, 4, WZ + 2]], { period: 26, life: 60, size: 6, rise: 3, drift: [0, 4], opacity: 0.65, col: "#c0b098", seed: 15 });
        const adv = clamp01((f - B(T.breaking) - 4) / 50);
        [-1.4, 1.2, 0, -2.2, 2.0].forEach((x, i) => {
          const z = WZ - 2 + adv * 10 - i * 1.6;
          if (z > WZ - 1.5) this.actor(f, cam, { o: janissary(i), id: "jb" + i, pos: [x, 0, z], opts: { expr: i % 2 ? "shout" : "stern", prop: "spear", mode: "march", phase: t / 12 + i * 0.3 } });
        });
        this.pennants.slice(0, 2).forEach((p, i) => { const z = WZ - 3 + adv * 9 - i * 2; p.visible = z > WZ - 2; p.position.set(i ? 1.6 : -1.8, 0, z); });
        pos = lerp3([1.6, 0.9, -34], [1.2, 0.8, -36], smooth(u)); look = [0, 4.5, -50]; fov = 50;
        pos = add3(pos, kick(f, [B(T.breaking)], 0.08));
        focus = [0, 2, -47];
        break;
      }
      case "faster": { // run faster; smoke fills the streets, the crowds grow thicker
        this.light("storm");
        const mz = lerp(-8, 30, u);
        this.actor(f, cam, { o: MESSENGER, id: "msg", pos: [0, 0, mz], opts: { expr: f < B(T.crowds) ? "nervous" : "pained", mode: "march", phase: t / 9, prop: "scroll" } });
        const n = 2 + Math.floor(ramp(f, B(T.crowds) - 10, 40) * 8);
        for (let i = 0; i < n; i++) {
          const x = [-1.8, 1.9, -1.2, 1.4, -2.2, 2.2, -0.6, 0.9, -1.7, 1.6][i], dz = [2.5, 3.2, 4.4, 5.0, 1.5, 2.0, 6.0, 6.5, 7.5, 8.2][i] - (i % 4 === 1 ? 4.5 : 0);
          this.actor(f, cam, { o: i % 3 === 2 ? kid(i) : citizen(i + 2), id: "cr" + i, pos: [x, 0, mz - dz + Math.sin(f * 0.1 + i) * 0.3], opts: { expr: i % 2 ? "shock" : "nervous", mode: "march", phase: t / 10 + i * 0.37, facing: 0 } });
        }
        const sm = ramp(f, B(T.smoke), 40);
        this.smoke.update(f, cam, [[-3, 2, mz + 6], [3, 3, mz + 3], [0, 4, mz - 4], [-2, 3, mz - 10], [2, 2, mz + 10], [0, 6, mz - 16]], { period: 26, life: 80, size: 5 + 3 * sm, rise: 3, drift: [0.5, 2], opacity: 0.2 + 0.45 * sm, col: "#6a6068", seed: 17 });
        pos = [0.6, 1.8, mz + 7.4]; look = [0, 1.9, mz - 10]; fov = 50; roll = -2 * Math.sin(t * 0.22);
        focus = face([0, 0, mz]);
        break;
      }
      case "heart": { // by the time you reach the heart of Constantinople
        this.light("golden");
        const k = smooth(u * 1.1), mp: V3 = [lerp(-1.5, 0.4, k), 0, lerp(70, 78, k)];
        this.actor(f, cam, { o: MESSENGER, id: "msg", pos: mp, opts: { expr: "pained", mode: k < 1 ? "stroll" : "stand", phase: t / 14, prop: "scroll" } });
        smokeCols(CITY_SMOKE, { op: 0.45, size: 12 });
        pos = lerp3([2.4, 2.0, 70.5], [7, 15, 56], k); look = lerp3(face(mp, 1.3), [0, 24, 140], k); fov = lerp(46, 54, k);
        focus = lerp3(face(mp), [0, 24, 140], k);
        break;
      }
      case "late": { // it's already too late
        this.light("golden");
        const mp: V3 = [0.4, 0, 78];
        this.actor(f, cam, { o: MESSENGER, id: "msg", pos: mp, opts: { expr: f < B(T.late) ? "nervous" : "pained", prop: "scroll" } });
        smokeCols(CITY_SMOKE, { op: 0.45, size: 12 });
        pos = lerp3([0.9, 1.72, 74.9], [0.75, 1.7, 75.9], smooth(u)); look = face(mp, 1.6); fov = 40;
        focus = face(mp);
        break;
      }
      case "emperor": { // Emperor Constantine XI dies in the final battle
        this.light("storm");
        const ep: V3 = [0, 0, -42], gone = B(T.dies) + 14;
        if (f < gone) {
          this.actor(f, cam, { o: EMPEROR, id: "emp", pos: ep, opts: { expr: "shout", prop: "sword", wave: 1, blink: false } });
          this.actor(f, cam, { o: defender(0), id: "d0", pos: [-1.6, 0, -42.8], opts: { expr: "stern", prop: "shield" } });
          this.actor(f, cam, { o: defender(3), id: "d3", pos: [1.7, 0, -42.6], opts: { expr: "shout", prop: "spear" } });
        } else { this.helmet.visible = true; this.helmet.position.set(0.3, 0.22, -42.3); }
        const sm = ramp(f, B(T.dies) - 6, 14);
        this.dust.update(f, cam, [[0, 1.5, -41], [-1.6, 1.5, -41.5], [1.6, 2, -41.2], [0, 3, -42.5], [-0.8, 1, -40.5]], { period: 20, life: 70, size: 1.5 + 4 * sm, rise: 1.5, drift: [0.6, 0.4], opacity: 0.25 + 0.6 * sm * (1 - ramp(f, gone + 4, 30) * 0.7), col: "#8a7a70", seed: 19 });
        const down = ramp(f, gone - 2, 26);
        pos = lerp3(lerp3([0.8, 1.35, -38.6], [0.7, 1.35, -39.2], smooth(u)), [0.9, 1.6, -39.8], down); look = lerp3([0, 1.3, -42], [0.3, 0.25, -42.3], down); fov = lerp(50, 40, down);
        focus = lerp3([0, 1.7, -42], [0.3, 0.3, -42.3], down);
        break;
      }
      case "endEmpire": { // the Byzantine Empire, a thousand years old, comes to an end
        this.light("golden");
        const low = ramp(f, B(T.survived), B(T.end) - B(T.survived));
        const fall = ramp(f, B(T.end), 24);
        this.bannerCloth.position.set(0.1 + fall * 1.5, lerp(14.8, 4.5, low) - fall * 3.3, fall * 0.6); this.bannerCloth.rotation.z = -fall * 1.2;
        this.bannerWave(f, 1 - 0.6 * fall);
        smokeCols(CITY_SMOKE, { op: 0.4, size: 12 });
        pos = lerp3([14.5, 2.0, 83], [13.6, 2.2, 85.5], smooth(u)); look = lerp3([9.5, 12.5, 96], [9.5, 6.5, 96], low); fov = 52; roll = -3;
        focus = [9.5, lerp(13, 5, low), 96];
        break;
      }
      case "warning": { // you were supposed to deliver a warning
        this.light("golden");
        const mp: V3 = [0.4, 0, 78];
        this.actor(f, cam, { o: MESSENGER, id: "msg", pos: mp, opts: { expr: f < B(T.warning) ? "pained" : "dazed", prop: "scroll" } });
        smokeCols(CITY_SMOKE, { op: 0.4, size: 12 });
        pos = lerp3([0.95, 1.55, 75.6], [0.85, 1.52, 76.2], smooth(u)); look = [0.42, 1.35, 78]; fov = 40;
        focus = [0.42, 1.4, 78];
        break;
      }
      case "witnessed": { // instead, you just witnessed the fall of an empire (back on the rooftop of the opening)
        this.light("golden");
        const mp: V3 = [11.4, 7.15, 3.6];
        this.actor(f, cam, { o: MESSENGER, id: "msg", pos: mp, opts: { expr: "pained", mode: "sit", prop: "scroll" } });
        this.banner.visible = false;
        smokeCols([[-20, 14, 60], [24, 14, 40], [-6, 30, 150], [30, 26, 170], [-40, 12, 90], [6, 12, 30], [-24, 10, 20]], { op: 0.65, size: 18 });
        const k = ramp(f, shot.a + 8, len - 8);
        pos = lerp3([12.0, 8.35, 0.4], [12.3, 9.6, -2.6], k); look = lerp3(face(mp, 0.95), [10, 9.5, 40], k); fov = lerp(42, 54, k);
        focus = face(mp, 0.95);
        break;
      }
    }
    this.endActors();
    const dir = new THREE.Vector3(look[0] - pos[0], look[1] - pos[1], look[2] - pos[2]);
    const creep = (Math.min(0.06, 0.0008 * t) + 0.0004 * Math.max(0, t - 75)) * Math.min(dir.length(), 14);
    dir.normalize();
    cam.position.set(pos[0] + dir.x * creep, pos[1] + dir.y * creep, pos[2] + dir.z * creep);
    cam.fov = fov; cam.near = 0.05; cam.far = 3000; cam.up.set(0, 1, 0);
    cam.lookAt(...look); cam.rotateZ(rad(roll)); cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    this.skyUpdate(cam);
    for (const o of this.actors.children) {
      if (!o.visible) continue;
      if (o.userData.bill) yawTo(o, cam);
      else if (o.userData.face) o.quaternion.copy(cam.quaternion);
    }
    return { focus, shot };
  }
}
