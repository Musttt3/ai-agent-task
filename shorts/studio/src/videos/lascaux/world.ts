// The world: one cave interior (the Hall of the Bulls, our own painted version), one hillside exterior that changes
// through the ages (ice age snow -> sealed -> 1940 woods -> 1948 door -> 1963 gate), and a roadside car set for the
// fogged-window analogy. Everything is built once; update() poses it for the shot and frame.
import * as THREE from "three";
import { FPS } from "./timing";
import { NOINK } from "./ink";
import { T, SHOTS, shotAt, Shot, smooth, ramp, lerp, lerp3, kick, clamp01, V3 } from "./story";
import { rockTexture, groundTexture, paintBull, paintHorse, paintStag, paintMarks, growthTextures, skyTexture, flameTexture, tex, rng } from "./paint";
import { Caveman, CavemanKit, loadCaveman, Person, Card, Puffs, MARCEL, tourist, dogTex, Face, yawTo } from "./cast";
import { Outfit, Expr } from "./toon";

export type Kit = { caveman: CavemanKit };
export const loadKit = async (): Promise<Kit> => ({ caveman: await loadCaveman() });

// ---------------- cave surface ----------------
const CV = { a: 4.2, b: 3.2, yc: 1.2 };
const rad = THREE.MathUtils.degToRad;
const bump = (x: number, ph: number) => 0.045 * Math.sin(1.7 * x + 3 * ph) + 0.035 * Math.sin(0.9 * x - 5 * ph + 1.3) + 0.02 * Math.sin(3.1 * x + 7 * ph + 0.4);
export const caveP = (x: number, phDeg: number, inset = 0): V3 => {
  const ph = rad(phDeg), k = 1 + bump(x, ph);
  return [x, CV.yc + (CV.b * k - inset) * Math.sin(ph), (CV.a * k - inset) * Math.cos(ph)];
};
/** grid patch on the cave surface; u along x, v = 1 at ph0 (upper edge) */
const cavePatch = (x0: number, x1: number, ph0: number, ph1: number, nx: number, ny: number, inset: number) => {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const u = i / nx, v = j / ny;
    pos.push(...caveP(lerp(x0, x1, u), lerp(ph1, ph0, v), inset));
    uv.push(u, v);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
    idx.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
};

/** Lambert material revealed by a growth-order map: fragments whose order value is above uGrow are discarded */
const growMat = (map: THREE.Texture, order: THREE.Texture, rep: [number, number], offs: number) => {
  const u = { uGrow: { value: 0 }, uOrder: { value: order }, uRep: { value: new THREE.Vector2(...rep) }, uOff: { value: offs } };
  const m = new THREE.MeshLambertMaterial({ map, side: THREE.DoubleSide, transparent: true, depthWrite: false, opacity: 0.72, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.fragmentShader = "uniform float uGrow; uniform sampler2D uOrder; uniform vec2 uRep; uniform float uOff;\n" + sh.fragmentShader.replace(
      "#include <map_fragment>",
      "#include <map_fragment>\n float ord = texture2D(uOrder, vMapUv * uRep + vec2(uOff)).r; float g = uGrow * 0.9; float k = smoothstep(g, g - 0.12, ord); if (k <= 0.01 || uGrow <= 0.001) discard; diffuseColor.a *= k; if (diffuseColor.a < 0.05) discard;");
  };
  m.customProgramCacheKey = () => "grow" + offs;
  return { m, u };
};

const lambert = (o: THREE.MeshLambertMaterialParameters) => new THREE.MeshLambertMaterial(o);
const noink = <T extends THREE.Object3D>(o: T) => { o.traverse((c) => c.layers.set(NOINK)); return o; };

// ---------------- the world ----------------
export class World {
  root = new THREE.Group();
  private cave = new THREE.Group();
  private ext = new THREE.Group();
  private carSet = new THREE.Group();
  private actors = new THREE.Group();
  // lights
  private amb = new THREE.AmbientLight(0xffffff, 0.5);
  private hemi = new THREE.HemisphereLight(0xcfe3ff, 0x8a7a5a, 1.2);
  private sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
  private torchL = new THREE.PointLight(0xffc488, 9, 0, 1.6);
  private handL = new THREE.PointLight(0xffb46a, 18, 0, 2);
  private lampL: THREE.PointLight[] = [];
  private bulbs: THREE.Mesh[] = [];
  // cave parts
  private art: Record<"bull" | "horse" | "stag" | "marks", THREE.Mesh> = {} as never;
  private green: { m: THREE.MeshLambertMaterial; u: { uGrow: { value: number } } };
  private mould: { m: THREE.MeshLambertMaterial; u: { uGrow: { value: number } } };
  private rail = new THREE.Group();
  private torch = new THREE.Group();
  private flame: THREE.Mesh;
  private flames: THREE.Texture[];
  private caveWallMat: THREE.MeshLambertMaterial;
  // exterior parts
  private snowGround: THREE.Mesh;
  private grassGround: THREE.Mesh;
  private cliff: THREE.Mesh;
  private cliffCol: THREE.BufferAttribute;
  private mouth: THREE.Mesh;
  private rocks: { m: THREE.Mesh; end: V3; r: number }[] = [];
  private pines: THREE.Group[] = [];
  private oaks: THREE.Group[] = [];
  private fallen = new THREE.Group();
  private door = new THREE.Group();
  private doorL: THREE.Group; private doorR: THREE.Group;
  private gate = new THREE.Group();
  private gateBars = new THREE.Group();
  private skyMat: THREE.MeshBasicMaterial;
  private skyIce: THREE.Texture; private skySummer: THREE.Texture;
  private snow: THREE.Points;
  // car set
  private carWin: THREE.MeshBasicMaterial[] = [];
  private car = new THREE.Group();
  // cast
  private cm: Caveman;
  private people: Person[] = [];
  private marcel: Person;
  private dog: Card;
  private puffs: Puffs;
  private fog = new THREE.Fog(0x000000, 6, 30);

  constructor(kit: Kit) {
    this.root.add(this.cave, this.ext, this.carSet, this.actors, this.amb, this.hemi, this.sun, this.sun.target, this.torchL, this.handL);
    this.buildCave();
    this.buildExterior();
    this.buildCar();
    this.cm = new Caveman(kit.caveman);
    this.actors.add(this.cm.root);
    for (let i = 0; i < 52; i++) this.people.push(new Person(this.actors));
    this.marcel = new Person(this.actors);
    this.dog = new Card(this.actors, 1.05, 0.79, 0.07);
    this.puffs = new Puffs(this.actors, 150);
    // flames
    this.flames = [0, 1, 2, 3].map(flameTexture);
    this.flame = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.56).translate(0, 0.26, 0), new THREE.MeshBasicMaterial({ map: this.flames[0], transparent: true, alphaTest: 0.3, toneMapped: false, color: new THREE.Color(2.2, 2.0, 1.8), fog: false }));
    this.flame.layers.set(NOINK);
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.4, 8).translate(0, 0.7, 0), lambert({ color: "#6b4a2c" }));
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.16, 8).translate(0, 1.42, 0), lambert({ color: "#3a2a20" }));
    this.flame.position.y = 1.46;
    this.torch.add(stick, tip, this.flame);
    this.root.add(this.torch);
  }

  // ---------------- builders ----------------
  private buildCave() {
    const rock = rockTexture(3);
    rock.repeat.set(10, 7);
    this.caveWallMat = lambert({ map: rock, side: THREE.DoubleSide, color: "#ffffff" });
    const wall = new THREE.Mesh(cavePatch(-15, 15, -22, 202, 150, 100, 0), this.caveWallMat);
    const floorTex = groundTexture(8, "#b89a74", ["#a68663", "#c9ad86", "#9a7b5a"], ["#7a5e44", "#d6bf98"]);
    floorTex.repeat.set(8, 3);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 8.4, 30, 8).rotateX(-Math.PI / 2), lambert({ map: floorTex }));
    floor.position.y = 0.0;
    // soften the floor: small bumps
    const fp = floor.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < fp.count; i++) fp.setY(i, 0.05 * Math.sin(fp.getX(i) * 1.3) * Math.cos(fp.getZ(i) * 1.7));
    floor.geometry.computeVertexNormals();
    // end caps
    for (const x of [-15, 15]) {
      const cap = new THREE.Mesh(new THREE.CircleGeometry(5, 32), lambert({ color: "#2a2220", side: THREE.DoubleSide }));
      cap.position.set(x, 1.2, 0); cap.rotation.y = Math.PI / 2;
      this.cave.add(cap);
    }
    this.cave.add(wall, floor);
    // paintings: patches just in front of the wall (NOINK: they carry their own pigment contours)
    const art = (name: "bull" | "horse" | "stag" | "marks", map: THREE.Texture, x0: number, x1: number, p0: number, p1: number) => {
      const m = new THREE.Mesh(cavePatch(x0, x1, p0, p1, 40, 20, 0.02), lambert({ map, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 1 }));
      m.layers.set(NOINK); m.renderOrder = 2;
      this.cave.add(m); this.art[name] = m;
    };
    art("bull", paintBull(), -3.0, 2.9, 119, 161);
    art("horse", paintHorse(), 3.4, 6.8, 128, 162);
    art("stag", paintStag(), -6.7, -3.6, 116, 164);
    art("marks", paintMarks(), -0.6, 1.5, 166, 181);
    // algae + mould overlays over the painted vault
    const gt = growthTextures();
    gt.color.repeat.set(3, 2);
    this.green = growMat(gt.color, gt.order, [1.6, 1.2], 0);
    const gMesh = new THREE.Mesh(cavePatch(-7.5, 7.5, 108, 192, 80, 40, 0.035), this.green.m);
    gMesh.layers.set(NOINK); gMesh.renderOrder = 3;
    gt.mould.repeat.set(4, 3);
    const mm = growMat(gt.mould, gt.order, [2.3, 1.7], 0.37);
    mm.m.transparent = true; mm.m.alphaTest = 0.5;
    this.mould = mm;
    const mMesh = new THREE.Mesh(cavePatch(-7.5, 7.5, 108, 192, 80, 40, 0.045), mm.m);
    mMesh.layers.set(NOINK); mMesh.renderOrder = 4;
    this.cave.add(gMesh, mMesh);
    // 1950s lamps on the near wall + their point lights
    for (let i = 0; i < 4; i++) {
      const x = -7.5 + i * 5;
      const [px, py, pz] = caveP(x, 62, 0.25);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 3.6, 3), toneMapped: false }));
      bulb.position.set(px, py, pz);
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.18, 16, 1, true), lambert({ color: "#3a3f45", side: THREE.DoubleSide }));
      shade.position.set(px, py + 0.1, pz);
      this.cave.add(bulb, shade); this.bulbs.push(bulb, shade);
      const L = new THREE.PointLight(0xffe6c0, 22, 0, 1.6);
      L.position.set(px, py - 0.1, pz - 0.2);
      this.cave.add(L); this.lampL.push(L);
    }
    // modern replica handrail
    const railMat = lambert({ color: "#8a9096" });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 20, 8).rotateZ(Math.PI / 2), railMat);
    bar.position.set(0, 1.0, -1.6);
    this.rail.add(bar);
    for (let x = -9; x <= 9; x += 2) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 8), railMat);
      post.position.set(x, 0.5, -1.6); this.rail.add(post);
    }
    this.cave.add(this.rail);
  }

  private buildExterior() {
    this.skyIce = skyTexture("#8fb0d8", "#c9d9ea", "#e8eff5");
    this.skySummer = skyTexture("#3e7fd2", "#8fb5e4", "#cfe0f2");
    this.skyMat = new THREE.MeshBasicMaterial({ map: this.skySummer, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: true });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), this.skyMat);
    sky.renderOrder = -10; sky.layers.set(NOINK);
    this.ext.add(sky);
    // grounds
    const grass = groundTexture(12, "#7fae4a", ["#6f9d3e", "#93c05a", "#5f8a36"], ["#4e7a2c", "#a6cf6a"]);
    grass.repeat.set(40, 40);
    this.grassGround = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), lambert({ map: grass }));
    const snowT = groundTexture(13, "#f2f5f8", ["#e2e9f1", "#ffffff", "#d8e2ee"], ["#cbd7e6"]);
    snowT.repeat.set(40, 40);
    this.snowGround = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), lambert({ map: snowT, transparent: true }));
    this.snowGround.position.y = 0.02; this.snowGround.layers.set(NOINK);
    this.ext.add(this.grassGround, this.snowGround);
    // cliff with a rolling hilltop, vertex colours carry the season on its top
    const nx = 88, ny = 36, W = 44, H = 9;
    const g = new THREE.PlaneGeometry(W, H, nx, ny);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i) + H / 2;
      const dm = Math.hypot(x / 2.2, (y - 1.5) / 2.0);
      const keep = clamp01((dm - 1.0) / 0.9);
      let z = keep * (0.35 * Math.sin(x * 0.9 + y * 0.6) + 0.25 * Math.sin(x * 2.1 - y * 1.3) + 0.15 * Math.sin(y * 3.1 + x));
      z -= 0.12 * Math.max(0, y - 4.6) ** 2;
      const yy = y > 4.6 ? 4.6 + (y - 4.6) * 0.45 : y;
      p.setXYZ(i, x, yy + 0.5 * Math.sin(x * 0.45) * clamp01((y - 4.2) / 3), -8 + z);
    }
    g.computeVertexNormals();
    this.cliffCol = new THREE.BufferAttribute(new Float32Array(p.count * 3).fill(1), 3);
    g.setAttribute("color", this.cliffCol);
    const cliffRock = rockTexture(7, "#cdbb9c"); cliffRock.repeat.set(5, 2);
    this.cliff = new THREE.Mesh(g, lambert({ map: cliffRock, vertexColors: true }));
    this.ext.add(this.cliff);
    // cave mouth: a painted dark opening with its own ink ring
    const mc = document.createElement("canvas"); mc.width = 512; mc.height = 512;
    const mg = mc.getContext("2d")!;
    const r = rng(5);
    mg.beginPath();
    for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2, rr = 225 + (r() - 0.5) * 22; const x = 256 + rr * Math.cos(a), y = 256 + rr * Math.sin(a) * (a > 0 && a < Math.PI ? 0.8 : 1); if (i) mg.lineTo(x, y); else mg.moveTo(x, y); }
    mg.closePath();
    const gr = mg.createRadialGradient(256, 280, 20, 256, 256, 240); gr.addColorStop(0, "#050304"); gr.addColorStop(0.75, "#1a1210"); gr.addColorStop(1, "#3a2a22");
    mg.fillStyle = gr; mg.fill(); mg.lineWidth = 16; mg.strokeStyle = "#0b0a0c"; mg.stroke();
    this.mouth = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.2), new THREE.MeshLambertMaterial({ map: tex(mc), transparent: true, alphaTest: 0.3 }));
    this.mouth.position.set(0, 1.45, -7.92); this.mouth.layers.set(NOINK);
    this.ext.add(this.mouth);
    // rocks that seal the mouth
    const rockMat = lambert({ map: rockTexture(9, "#b9a88e"), color: "#d0c4b0" });
    const ends: V3[] = [[-1.0, 0.5, -7.4], [0.1, 0.55, -7.3], [1.1, 0.5, -7.4], [-0.6, 1.4, -7.5], [0.6, 1.45, -7.45], [0.0, 2.3, -7.6], [-1.3, 1.5, -7.6], [1.35, 1.55, -7.6], [-0.7, 2.4, -7.7], [0.75, 2.45, -7.7]];
    ends.forEach((e, i) => {
      const rr = 0.55 + 0.15 * ((i * 37) % 5) / 5;
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(rr, 0), rockMat);
      m.scale.set(1.2, 0.85, 0.9); m.rotation.set(i * 0.7, i * 1.3, i * 0.4);
      this.ext.add(m); this.rocks.push({ m, end: e, r: rr });
    });
    // trees: snowy pines (ice age) and round oaks (1940s woods)
    const pineMat = lambert({ color: "#2f5b46" }), snowCap = lambert({ color: "#f4f7fb" }), trunkMat = lambert({ color: "#6b4a2c" });
    const oakMat = [lambert({ color: "#5e9a3e" }), lambert({ color: "#6fae48" }), lambert({ color: "#4f8a36" })];
    const spots: V3[] = [[-9, 0, -5], [-12, 0, -2], [8.5, 0, -5.5], [11, 0, -1.5], [-6, 0, 2], [6.5, 0, 1], [-15, 0, -9], [14, 0, -10], [-4, 5.9, -12.5], [3.5, 6.0, -13], [-10, 5.7, -12.5], [9, 5.6, -12]];
    spots.forEach((s, i) => {
      const pine = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.2, 8).translate(0, 0.6, 0), trunkMat);
      pine.add(trunk);
      for (let k = 0; k < 3; k++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(1.5 - k * 0.38, 1.7, 9).translate(0, 1.6 + k * 1.05, 0), pineMat);
        const cap = new THREE.Mesh(new THREE.ConeGeometry((1.5 - k * 0.38) * 0.55, 0.8, 9).translate(0, 2.05 + k * 1.05, 0), snowCap);
        pine.add(cone, cap);
      }
      pine.position.set(...s); pine.scale.setScalar(0.9 + ((i * 13) % 7) / 14);
      const oak = new THREE.Group();
      oak.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 2.0, 8).translate(0, 1.0, 0), trunkMat));
      for (let k = 0; k < 3; k++) {
        const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25 - k * 0.15, 2), oakMat[k]);
        ball.position.set((k - 1) * 0.8, 2.7 + (k === 1 ? 0.7 : 0), (k % 2) * 0.4);
        oak.add(ball);
      }
      oak.position.set(s[0] + 0.6, s[1], s[2] - 0.4); oak.scale.setScalar(1 + ((i * 7) % 5) / 8);
      this.ext.add(pine, oak);
      this.pines.push(pine); this.oaks.push(oak);
    });
    // 1940: uprooted tree and the hole it left
    const hc = document.createElement("canvas"); hc.width = hc.height = 256;
    const hg = hc.getContext("2d")!;
    hg.beginPath(); hg.ellipse(128, 128, 112, 112, 0, 0, 7);
    const hgr = hg.createRadialGradient(128, 128, 10, 128, 128, 112); hgr.addColorStop(0, "#020101"); hgr.addColorStop(0.8, "#1c130e"); hgr.addColorStop(1, "#4a3424");
    hg.fillStyle = hgr; hg.fill(); hg.lineWidth = 10; hg.strokeStyle = "#0b0a0c"; hg.stroke();
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.75, 32).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: tex(hc), transparent: true, alphaTest: 0.3 }));
    hole.position.set(3.2, 0.03, -4.2); hole.layers.set(NOINK);
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 5.0, 12).rotateZ(Math.PI / 2), lambert({ color: "#7a5a3a" }));
    log.position.set(6.3, 0.26, -4.6); log.rotation.y = -0.25;
    const plate = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), lambert({ color: "#6a4a32" }));
    plate.scale.set(0.4, 0.75, 0.75); plate.position.set(3.75, 0.65, -4.35); plate.rotation.y = -0.25;
    this.fallen.add(hole, log, plate);
    for (let k = 0; k < 7; k++) {
      const root = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 1.2, 6), lambert({ color: "#4a3424" }));
      const a = (k / 7) * Math.PI * 2;
      root.position.set(3.15, 1.0 + Math.sin(a) * 1.2, -4.2 + Math.cos(a) * 1.2 * 0.3);
      root.rotation.set(a, 0, 0.3);
      this.fallen.add(root);
    }
    this.ext.add(this.fallen);
    // 1948 wooden door frame with two doors
    const wood = lambert({ color: "#8a5c34" }), woodD = lambert({ color: "#6e4526" });
    const post = (x: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.0, 0.25), wood); m.position.set(x, 1.5, -7.6); return m; };
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.3, 0.3), wood); lintel.position.set(0, 3.0, -7.6);
    this.door.add(post(-1.3), post(1.3), lintel);
    const leaf = (side: number) => {
      const hinge = new THREE.Group(); hinge.position.set(side * 1.2, 0, -7.55);
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.8, 0.08), woodD); m.position.set(-side * 0.6, 1.42, 0);
      hinge.add(m);
      for (let k = 0; k < 3; k++) { const plank = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.1), wood); plank.position.set(-side * 0.6, 0.5 + k * 0.9, 0.05); hinge.add(plank); }
      this.door.add(hinge); return hinge;
    };
    this.doorL = leaf(-1); this.doorR = leaf(1);
    this.ext.add(this.door);
    // 1963 iron gate: frame + sliding bars
    const iron = lambert({ color: "#3a3f45" });
    const gf = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 0.14), iron); gf.position.set(0, 3.05, -7.4);
    this.gate.add(gf);
    for (let k = 0; k < 13; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.9, 6), iron); b.position.set(-1.45 + k * 0.24, 1.48, 0); this.gateBars.add(b); }
    for (const y of [0.4, 1.5, 2.6]) { const b = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.08, 0.08), iron); b.position.set(0, y, 0); this.gateBars.add(b); }
    this.gateBars.position.z = -7.35;
    this.gate.add(this.gateBars);
    this.ext.add(this.gate);
    // falling snow
    const N = 900, sp = new Float32Array(N * 3);
    this.snow = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(sp, 3)),
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false, fog: false }));
    this.snow.layers.set(NOINK); this.snow.frustumCulled = false;
    this.ext.add(this.snow);
  }

  private buildCar() {
    this.carSet.position.set(400, 0, 0);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.MeshBasicMaterial({ map: this.skySummer, side: THREE.BackSide, fog: false, depthWrite: false }));
    sky.renderOrder = -10; sky.layers.set(NOINK);
    this.carSet.add(sky);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(200, 7).rotateX(-Math.PI / 2), lambert({ color: "#6d6a66" }));
    road.position.set(0, 0.01, 0);
    const verge = new THREE.Mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), lambert({ map: (() => { const t = groundTexture(14, "#86b44f", ["#76a443", "#99c65e"], ["#5d8a36"]); t.repeat.set(40, 40); return t; })() }));
    const line = new THREE.Mesh(new THREE.PlaneGeometry(200, 0.15).rotateX(-Math.PI / 2), lambert({ color: "#f2efe4" }));
    line.position.set(0, 0.02, 1.2); line.layers.set(NOINK);
    this.carSet.add(verge, road, line);
    for (let i = 0; i < 6; i++) {
      const oak = this.oaks[i].clone(); oak.position.set(-14 + i * 6, 0, -9 - (i % 2) * 3); this.carSet.add(oak);
    }
    const paint = lambert({ color: "#3f8f9a" }), dark = lambert({ color: "#222428" }), chrome = lambert({ color: "#d9dde0" });
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.85, 1.8), paint); body.position.y = 0.72;
    // open cabin: roof on four pillars, so the passengers show through the panes
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.62), paint); roof.position.set(-0.2, 2.0, 0);
    this.car.add(body, roof);
    for (const x of [-1.45, -0.22, 1.05]) for (const z of [0.76, -0.76]) {
      const pil = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.86, 0.1), paint); pil.position.set(x, 1.57, z); this.car.add(pil);
    }
    for (const [x, z] of [[-1.35, 0.9], [1.35, 0.9], [-1.35, -0.9], [1.35, -0.9]]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 20).rotateX(Math.PI / 2), dark); w.position.set(x, 0.38, z);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.32, 16).rotateX(Math.PI / 2), chrome); hub.position.set(x, 0.38, z);
      this.car.add(w, hub);
    }
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), new THREE.MeshBasicMaterial({ color: "#fff6d8" })); lamp.position.set(2.15, 0.85, 0.6);
    this.car.add(lamp);
    // window panes on the camera side (+z): fog up through their opacity
    for (const [x, w] of [[-0.835, 1.13], [0.415, 1.17]] as const) {
      const m = new THREE.MeshBasicMaterial({ color: "#eef3f6", transparent: true, opacity: 0.08, depthWrite: false, toneMapped: true });
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.8), m); pane.position.set(x, 1.57, 0.79); pane.layers.set(NOINK); pane.renderOrder = 6;
      this.car.add(pane); this.carWin.push(m);
    }
    this.car.position.set(0, 0, 0);
    this.carSet.add(this.car);
  }

  // ---------------- per-frame helpers ----------------
  private setSet(which: "cave" | "ext" | "car") {
    this.cave.visible = which === "cave"; this.ext.visible = which === "ext"; this.carSet.visible = which === "car";
  }
  private lights(mode: "torch" | "dark" | "lamps" | "hand" | "replica" | "day" | "ice", f: number) {
    const flick = 1 + 0.08 * Math.sin(f * 1.7) + 0.05 * Math.sin(f * 4.3 + 1);
    this.torchL.intensity = 0; this.handL.intensity = 0; this.sun.intensity = 0; this.hemi.intensity = 0;
    for (const l of this.lampL) l.intensity = 0;
    for (const b of this.bulbs) b.visible = false;
    this.amb.color.set(0xffffff);
    switch (mode) {
      case "torch": this.amb.intensity = 0.42; this.amb.color.set(0x9a94b8); this.torchL.intensity = 9 * flick; break;
      case "dark": this.amb.intensity = 0.7; this.amb.color.set(0x4a5c9a); break;
      case "hand": this.amb.intensity = 0.1; this.amb.color.set(0x7a7aa0); this.handL.intensity = 16 * flick; break;
      case "lamps": this.amb.intensity = 0.32; this.amb.color.set(0xb8b0c8); for (const l of this.lampL) l.intensity = 20; for (const b of this.bulbs) b.visible = true; break;
      case "replica": this.amb.intensity = 0.75; this.amb.color.set(0xfff0dc); for (const l of this.lampL) l.intensity = 26; break;
      case "day": this.amb.intensity = 0.35; this.hemi.intensity = 1.1; this.sun.intensity = 2.3; this.hemi.color.set(0xcfe3ff); break;
      case "ice": this.amb.intensity = 0.45; this.hemi.intensity = 1.2; this.sun.intensity = 1.5; this.hemi.color.set(0xdde8ff); break;
    }
  }
  private fogFor(set: "cave" | "ext" | "car", dark = false) {
    if (set === "cave") { this.fog.color.set(dark ? 0x020203 : 0x0a0807); this.fog.near = 7; this.fog.far = 24; }
    else { this.fog.color.set(0xcfe0f2); this.fog.near = 30; this.fog.far = 260; }
  }
  private season(snow: number) {
    (this.snowGround.material as THREE.MeshLambertMaterial).opacity = snow;
    this.snowGround.visible = snow > 0.01;
    this.skyMat.map = snow > 0.5 ? this.skyIce : this.skySummer;
    const p = this.cliff.geometry.attributes.position as THREE.BufferAttribute;
    const top = new THREE.Color(), snowC = new THREE.Color("#f3f6fa"), grassC = new THREE.Color("#8fbf5a"), base = new THREE.Color("#ffffff");
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), k = clamp01((y - 4.5) / 0.6);
      top.copy(grassC).lerp(snowC, snow);
      const c = base.clone().lerp(top, k);
      this.cliffCol.setXYZ(i, c.r, c.g, c.b);
    }
    this.cliffCol.needsUpdate = true;
    // pines (cold) give way to oaks (warm)
    this.pines.forEach((t, i) => { const s = clamp01(snow * 1.2 - (i % 4) * 0.05); t.visible = s > 0.02; t.scale.setScalar((0.9 + ((i * 13) % 7) / 14) * Math.max(0.02, s)); });
    this.oaks.forEach((t, i) => { const s = clamp01((1 - snow) * 1.2 - (i % 3) * 0.05); t.visible = s > 0.02; t.scale.setScalar((1 + ((i * 7) % 5) / 8) * Math.max(0.02, s)); });
  }
  private snowfall(f: number, on: boolean, cam: THREE.Camera) {
    this.snow.visible = on;
    if (!on) return;
    const p = this.snow.geometry.attributes.position as THREE.BufferAttribute, r = rng(3);
    const c = cam.position;
    for (let i = 0; i < p.count; i++) {
      const x = (r() - 0.5) * 14, z = (r() - 0.5) * 14, speed = 0.012 + r() * 0.01, y0 = r() * 8;
      const y = ((y0 - f * speed * 1.4) % 8 + 8) % 8;
      p.setXYZ(i, c.x + x + 0.3 * Math.sin(f * 0.03 + i), y, c.z - 4 + z);
    }
    p.needsUpdate = true;
  }
  private torchAt(pos: V3 | null, f: number, size = 1) {
    this.torch.visible = !!pos;
    if (!pos) return;
    this.torch.position.set(...pos);
    this.flame.scale.setScalar(size);
    this.flame.visible = size > 0.02;
    const m = this.flame.material as THREE.MeshBasicMaterial;
    m.map = this.flames[Math.floor(f / 3) % 4];
    this.torchL.position.set(pos[0], pos[1] + 1.6, pos[2] + 0.2);
  }
  private crowd(f: number, cam: THREE.Camera, spots: { pos: V3; v: number; expr?: Expr; mode?: "stand" | "stroll"; phase?: number; flip?: boolean }[]) {
    spots.forEach((s, i) => this.people[i].pose(tourist(s.v), "t" + s.v, s.pos, cam, { expr: s.expr ?? "neutral", mode: s.mode ?? "stand", phase: s.phase, flip: s.flip, blink: (f + s.v * 17) % 70 < 4 }));
    for (let i = spots.length; i < this.people.length; i++) this.people[i].hide();
  }
  /** a crowd in rows along the painted wall: n people, deterministic layout, front row nearest the camera */
  private crowdSpots(n: number, x0: number, x1: number, z0: number, z1: number, seed = 7) {
    const r = rng(seed), out: { pos: V3; v: number }[] = [];
    for (let i = 0; i < n; i++) out.push({ pos: [lerp(x0, x1, r()), 0, lerp(z0, z1, r())], v: i });
    return out.sort((a, b) => a.pos[2] - b.pos[2]);
  }

  // ---------------- the frame ----------------
  /** poses everything for frame f; sets the camera; returns the focus point */
  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene): { focus: V3; shot: Shot } {
    scene.fog = this.fog;
    cam.layers.enable(NOINK);
    const shot = shotAt(f), t = f - shot.a, len = shot.b - shot.a, u = t / len;
    let pos: V3 = [0, 1.6, 3], look: V3 = [0, 1.6, 0], fov = 40, roll = 0;
    // defaults
    this.cm.pose({ pos: [0, 0, 0], visible: false }, cam);
    this.crowd(f, cam, []);
    this.marcel.hide(); this.dog.hide(); this.puffs.hide();
    this.torchAt(null, f);
    this.snowfall(f, false, cam);
    for (const k of Object.keys(this.art) as (keyof typeof this.art)[]) (this.art[k].material as THREE.MeshLambertMaterial).opacity = 1;
    this.green.u.uGrow.value = 0; this.mould.u.uGrow.value = 0;
    this.rail.visible = false;
    this.caveWallMat.color.set("#ffffff");
    this.rocks.forEach((r) => (r.m.visible = false));
    this.fallen.visible = false; this.door.visible = false; this.gate.visible = false;
    this.sun.position.set(-20, 30, 25); this.sun.target.position.set(0, 0, -8);
    const B = (w: number) => w - 3; // reaction lands 3 frames ahead of its word

    switch (shot.id) {
      case "hook": { // torch-lit close-up of the bull's head, slow push
        this.setSet("cave"); this.fogFor("cave"); this.lights("torch", f);
        this.torchAt([-3.2, 0, -2.2], f);
        pos = lerp3([0.2, 1.6, 3.5], [-0.1, 1.75, 2.7], smooth(u)); look = [-0.2, 3.0, -3.0]; fov = 58; roll = -3;
        break;
      }
      case "hookBreath": { // flash-forward: lamps, crowd backs breathing on the bull, a first hint of green
        this.setSet("cave"); this.fogFor("cave"); this.lights("lamps", f);
        const spots = this.crowdSpots(9, -2.6, 2.2, -1.0, 0.6, 3).map((s) => ({ ...s }));
        this.crowd(f, cam, spots);
        const on = ramp(f, B(T.napas1) - 10, 12);
        this.puffs.update(f, cam, spots.map((s) => [s.pos[0], 1.55, s.pos[2] - 0.3] as V3), { period: 40, life: 34, size: 0.45, rise: 0.9, drift: [0, -0.8], on: 0.3 + 0.7 * on });
        this.green.u.uGrow.value = 0.2 * ramp(f, B(T.napas1), 18);
        pos = lerp3([0.2, 1.75, 3.3], [0.0, 1.85, 2.7], smooth(u)); look = [-0.3, 2.6, -2.8]; fov = 50;
        const k = kick(f, [B(T.hancur)], 0.05); pos = [pos[0] + k[0], pos[1] + k[1], pos[2]];
        break;
      }
      case "iceExt": { // the ice age valley; the caveman walks to the mouth through falling snow
        this.setSet("ext"); this.fogFor("ext"); this.lights("ice", f); this.season(1);
        this.snowfall(f, true, cam);
        const walk = smooth(u * 0.9);
        this.cm.pose({ pos: [lerp(1.2, 0.2, walk), 0, lerp(-1.0, -5.6, walk)], view: "back", bob: 0.025 * Math.abs(Math.sin(t * 0.32)), lean: 2 * Math.sin(t * 0.16) }, cam);
        pos = lerp3([2.6, 1.3, 9.5], [2.0, 1.4, 8.0], smooth(u)); look = [0.3, 2.4, -7.5]; fov = 50; roll = 2;
        break;
      }
      case "paint": { // he paints: the horse appears on "kuda", the stag on "rusa"
        this.setSet("cave"); this.fogFor("cave"); this.lights("torch", f);
        this.torchAt([4.9, 0, -2.1], f);
        const hx = B(T.kuda), sx = B(T.rusa);
        (this.art.horse.material as THREE.MeshLambertMaterial).opacity = ramp(f, hx, 10);
        (this.art.stag.material as THREE.MeshLambertMaterial).opacity = ramp(f, sx, 10);
        (this.art.bull.material as THREE.MeshLambertMaterial).opacity = 0;
        (this.art.marks.material as THREE.MeshLambertMaterial).opacity = 0;
        // he hops between the two walls' panels
        const atStag = ramp(f, sx - 14, 12);
        const cx = lerp(4.3, -3.4, atStag);
        this.cm.pose({ pos: [cx, 0, -2.45], view: "side", flip: atStag > 0.5, bob: 0.03 * Math.abs(Math.sin(t * 0.5)) * (atStag > 0.02 && atStag < 0.98 ? 1 : 0.3), lean: -4 + 3 * Math.sin(t * 0.3) }, cam);
        this.torchAt([lerp(5.0, -2.4, atStag), 0, -2.0], f);
        pos = lerp3([5.6, 1.6, 2.6], [-1.6, 1.7, 2.4], smooth((f - (sx - 18)) / 22)); look = lerp3([4.4, 2.7, -3.0], [-4.6, 2.8, -3.0], smooth((f - (sx - 18)) / 22));
        fov = 52; roll = -2;
        break;
      }
      case "bullWide": { // the great bull appears; pull back along the wall to show its five metres, proud painter below
        this.setSet("cave"); this.fogFor("cave"); this.lights("torch", f);
        this.torchAt([1.0, 0, -2.0], f);
        (this.art.bull.material as THREE.MeshLambertMaterial).opacity = ramp(f, B(T.banteng), 8);
        (this.art.marks.material as THREE.MeshLambertMaterial).opacity = 0;
        const face: Face = f > B(T.sepanjang) ? "happy" : "suspicious";
        this.cm.pose({ pos: [0.2, 0, -2.3], view: "front", face, nod: f > B(T.sepanjang) ? 4 * Math.sin((f - T.sepanjang) * 0.25) : 0 }, cam);
        const pull = smooth((f - B(T.sepanjang)) / 40);
        pos = lerp3([0.6, 1.8, 0.7], [5.6, 1.4, 2.4], pull); look = lerp3([0.0, 2.6, -2.6], [-0.6, 2.7, -3.0], pull); fov = lerp(46, 58, pull);
        pos = [pos[0], pos[1], pos[2] + 0.2 * smooth(u)];
        const k = kick(f, [B(T.banteng) + 2], 0.04); pos = [pos[0] + k[0], pos[1] + k[1], pos[2]];
        break;
      }
      case "seal": { // rocks fall and seal the mouth
        this.setSet("ext"); this.fogFor("ext"); this.lights("ice", f); this.season(1);
        this.snowfall(f, true, cam);
        const k0 = B(T.tertimbun);
        this.rocks.forEach((r, i) => {
          r.m.visible = true;
          const d = clamp01((f - (k0 + i * 2)) / 9);
          const y = d >= 1 ? r.end[1] : lerp(r.end[1] + 9, r.end[1], d * d);
          r.m.position.set(r.end[0], f < k0 + i * 2 ? r.end[1] + 9 : y, r.end[2]);
        });
        pos = lerp3([0.6, 1.4, 7.5], [0.4, 1.5, 6.2], smooth(u)); look = [0, 2.0, -7.6]; fov = 46;
        const kk = kick(f, [k0 + 9, k0 + 15, k0 + 22], 0.08); pos = [pos[0] + kk[0], pos[1] + kk[1], pos[2]];
        break;
      }
      case "dark": { // inside: the torch dies; dark; silent
        this.setSet("cave"); this.fogFor("cave", true);
        const out = ramp(f, B(T.gelap), 6);
        this.lights(out < 1 ? "torch" : "dark", f);
        this.torchL.intensity *= 1 - out;
        this.torchAt([0.9, 0, -2.0], f, 1 - out);
        if (out >= 1) this.torch.visible = true;
        (this.art.marks.material as THREE.MeshLambertMaterial).opacity = 0;
        pos = lerp3([0.0, 1.7, 2.6], [-1.6, 1.8, 2.2], smooth(u)); look = lerp3([0.4, 2.7, -2.8], [-1.2, 2.9, -3.0], smooth(u)); fov = 50;
        break;
      }
      case "timelapse": { // thousands of years: snow melts, pines give way to oaks, the sealed mouth gets overgrown
        this.setSet("ext"); this.fogFor("ext"); this.lights("day", f);
        const s = 1 - smooth(u * 1.15);
        this.season(s);
        this.lights(s > 0.5 ? "ice" : "day", f);
        this.rocks.forEach((r) => { r.m.visible = true; r.m.position.set(...r.end); });
        pos = lerp3([-3.2, 1.2, 10.0], [-1.4, 2.4, 11.0], smooth(u)); look = [0, 2.4, -7.5]; fov = 52;
        break;
      }
      case "dog": { // 1940: Robot sniffs at a hole beside an uprooted tree
        this.setSet("ext"); this.fogFor("ext"); this.lights("day", f); this.season(0);
        this.rocks.forEach((r) => { r.m.visible = true; r.m.position.set(...r.end); });
        this.fallen.visible = true;
        const sniff = f > B(T.mengendus) ? 0.5 + 0.5 * Math.sin((f - T.mengendus) * 0.7) : 0.15;
        const walk = smooth((f - shot.a) / (B(T.mengendus) - shot.a));
        this.dog.show(dogTex(Math.round(sniff * 4) / 4, f % 8 < 4 ? 1 : 0), [lerp(0.6, 2.25, walk), 0, lerp(-1.2, -3.9, walk)], cam, { flip: false });
        pos = lerp3([1.0, 0.6, 1.2], [1.4, 0.75, 0.6], smooth(u)); look = [2.6, 0.4, -4.0]; fov = 48;
        break;
      }
      case "marcel": { // Marcel, eighteen, arrives and crawls into the hole
        this.setSet("ext"); this.fogFor("ext"); this.lights("day", f); this.season(0);
        this.rocks.forEach((r) => { r.m.visible = true; r.m.position.set(...r.end); });
        this.fallen.visible = true;
        const walk = smooth((f - shot.a) / Math.max(1, B(T.merangkak) - shot.a));
        const down = smooth((f - B(T.merangkak)) / 26);
        const px = lerp(0.0, 2.75, walk), pz = lerp(-1.0, -3.85, walk);
        this.marcel.pose(MARCEL, "marcel", [px + 0.25 * down, -1.3 * down, pz - 0.3 * down], cam, { expr: f > B(T.marcel) ? "smile" : "neutral", mode: walk < 1 ? "stroll" : "sit", phase: t / 18, lean: -25 * down });
        this.dog.show(dogTex(0, f % 6 < 3 ? 1 : 0), [2.0, 0, -3.3], cam, { flip: true });
        pos = lerp3([0.2, 1.4, 2.6], [1.5, 1.2, 0.9], smooth(u)); look = lerp3([1.2, 1.0, -2.6], [2.9, 0.4, -4.0], smooth(u)); fov = 46;
        break;
      }
      case "discover": { // inside with an oil lamp: the galleries of the ice age
        this.setSet("cave"); this.fogFor("cave"); this.lights("hand", f);
        const mx = 3.0;
        this.marcel.pose(MARCEL, "marcel", [mx, 0, -0.6], cam, { expr: "shock", mode: "stand", self: 0.3 });
        this.handL.position.set(mx - 0.35, 1.25, -0.5);
        const swing = smooth((f - B(T.galeri)) / 30);
        pos = lerp3([4.6, 1.5, 1.8], [3.6, 1.6, 2.4], swing); look = lerp3([3.0, 1.4, -0.6], [-0.2, 3.0, -3.0], swing); fov = lerp(40, 54, swing);
        this.handL.intensity *= 1 + 1.4 * swing;
        break;
      }
      case "open": { // 1948: the cave opens to the public
        this.setSet("ext"); this.fogFor("ext"); this.lights("day", f); this.season(0);
        this.door.visible = true;
        const o = smooth((f - B(T.dibuka)) / 14);
        this.doorL.rotation.y = -1.6 * o; this.doorR.rotation.y = 1.6 * o;
        const spots = [0, 1, 2, 3, 4].map((i) => ({ pos: [lerp(-0.8 + i * 0.5, -0.3 + i * 0.25, smooth(u)), 0, 1.5 - i * 0.9 - 2.2 * smooth(u)] as V3, v: i, mode: "stroll" as const, phase: t / 18 + i * 0.3, expr: "smile" as const }));
        this.crowd(f, cam, o > 0.2 ? spots : []);
        pos = lerp3([1.8, 1.5, 8.0], [1.2, 1.6, 6.8], smooth(u)); look = [0, 1.8, -7.5]; fov = 48;
        break;
      }
      case "crowd": { // people come, then more, then 1,200 a day; the caveman gets squeezed in
        this.setSet("cave"); this.fogFor("cave"); this.lights("lamps", f);
        const n = f < B(T.banyak) ? 5 : f < B(T.n1200) ? 16 : 40;
        const spots = this.crowdSpots(n, -4.2, 4.2, -2.4, 1.0, 11).map((s, i) => ({ ...s, expr: (i % 4 === 0 ? "smile" : "neutral") as "smile" | "neutral" }));
        this.crowd(f, cam, spots);
        if (f > B(T.banyak)) this.cm.pose({ pos: [0.85, 0, 0.2], view: "front", face: f > B(T.sehari) ? "worried" : "suspicious", bob: 0 }, cam);
        const k = kick(f, [B(T.banyak), B(T.n1200)], 0.04);
        pos = lerp3([0.4, 1.9, 3.6], [0.4, 2.6, 3.7], smooth(u)); look = [0.0, 1.9, -2.2]; fov = lerp(48, 58, smooth(u));
        pos = [pos[0] + k[0], pos[1] + k[1], pos[2]];
        break;
      }
      case "green": { // close on the bull: the wall starts to turn green
        this.setSet("cave"); this.fogFor("cave"); this.lights("lamps", f);
        this.green.u.uGrow.value = 0.06 + 0.42 * smooth((f - B(T.mulai)) / Math.max(1, T.hijau + 12 - T.mulai));
        this.cm.pose({ pos: [1.0, 0, -0.6], view: "front", face: f > B(T.hijau) ? "shocked" : "suspicious", lean: f > B(T.hijau) ? -4 : 0 }, cam);
        pos = lerp3([1.9, 1.8, 2.0], [1.7, 1.9, 1.5], smooth(u)); look = [-0.2, 2.6, -2.8]; fov = 50;
        const k = kick(f, [B(T.hijau)], 0.03); pos = [pos[0] + k[0], pos[1] + k[1], pos[2]];
        break;
      }
      case "notouch": { // nobody touches (hands to themselves) ... but everybody breathes
        this.setSet("cave"); this.fogFor("cave"); this.lights("lamps", f);
        this.green.u.uGrow.value = 0.48;
        const spots = [-1.8, -0.9, 0, 0.9, 1.8].map((x, i) => ({ pos: [x, 0, -0.3 - (i % 2) * 0.3] as V3, v: i + 20, expr: (f > B(T.napas2) ? "relief_open" : f > B(T.sayangnya) ? "neutral" : "smile_closed") as "smile_closed" | "neutral" | "relief_open" }));
        this.crowd(f, cam, spots);
        const big = ramp(f, B(T.napas2), 6);
        this.puffs.update(f, cam, spots.map((s) => [s.pos[0] + 0.04, 1.45, s.pos[2] + 0.1] as V3), { period: big > 0 ? 30 : 60, life: 28, size: 0.35 + 0.4 * big, rise: 0.4, drift: [0, 0.6], on: f > B(T.sayangnya) ? 0.5 + 0.5 * big : 0, seed: 9 });
        pos = lerp3([0, 1.5, 5.2], [0, 1.55, 4.4], smooth(u)); look = [0, 1.35, -0.4]; fov = 50;
        if (f > B(T.napas2)) { const z = smooth((f - B(T.napas2)) / 8); pos = [pos[0], pos[1], pos[2] - 0.6 * z]; }
        break;
      }
      case "car": { // a car full of passengers: the windows fog up
        this.setSet("car"); this.fogFor("car"); this.lights("day", f);
        this.sun.position.set(380, 30, 25); this.sun.target.position.set(400, 0, 0);
        const fogAmt = 0.08 + 0.82 * smooth((f - B(T.seperti)) / Math.max(1, T.penumpang + 15 - T.seperti));
        for (const m of this.carWin) m.opacity = fogAmt;
        const seats: V3[] = [[399.0, 0.3, 0.1], [399.55, 0.3, -0.2], [400.25, 0.3, 0.1], [400.75, 0.3, -0.25]];
        seats.forEach((s, i) => this.people[i].pose(tourist(i + 3), "c" + i, s, cam, { expr: i % 2 ? "grin" : "smile", mode: "sit", scale: 0.95, self: 0.25 }));
        for (let i = 4; i < this.people.length; i++) this.people[i].hide();
        this.puffs.update(f, cam, seats.map((s) => [s[0] + 0.05, 1.6, 0.55] as V3), { period: 36, life: 30, size: 0.18, rise: 0.15, drift: [0, 0.1], on: 0.6 * (1 - fogAmt) });
        pos = lerp3([399.8, 1.5, 12.0], [399.9, 1.55, 10.6], smooth(u)); look = [399.9, 1.3, 0]; fov = 40;
        break;
      }
      case "nowipe": { // a car window can be wiped; a cave wall cannot
        this.setSet("cave"); this.fogFor("cave"); this.lights("lamps", f);
        this.green.u.uGrow.value = 0.52;
        const shake = f > B(T.dilap) ? 9 * Math.sin((f - T.dilap) * 0.9) * Math.exp(-(f - T.dilap) / 25) : 0;
        this.cm.pose({ pos: [-0.6, 0, -1.4], view: "front", face: "worried", nod: shake }, cam);
        pos = lerp3([-0.2, 1.65, 1.6], [-0.3, 1.7, 1.1], smooth(u)); look = [-0.7, 1.9, -2.0]; fov = 48;
        break;
      }
      case "grow": { // vapour, heat, light: the cave becomes a greenhouse for algae and mould
        this.setSet("cave"); this.fogFor("cave"); this.lights("lamps", f);
        const vap = ramp(f, B(T.uap), 8), heat = ramp(f, B(T.panas), 8), lamp = ramp(f, B(T.lampu), 4);
        for (const l of this.lampL) l.intensity = 14 + 20 * lamp;
        this.caveWallMat.color.setRGB(1, 1 - 0.1 * heat, 1 - 0.2 * heat);
        this.green.u.uGrow.value = 0.55 + 0.4 * smooth((f - B(T.alga)) / 16);
        this.mould.u.uGrow.value = 0.9 * smooth((f - B(T.jamur)) / 14);
        const vents: V3[] = [-2, -1, 0, 1, 2].map((x) => [x * 1.1, 1.6, 1.2] as V3);
        this.puffs.update(f, cam, vents, { period: 30, life: 40, size: 0.8, rise: 1.4, drift: [0, -2.2], on: vap * 0.7, seed: 4 });
        pos = lerp3([0.4, 2.0, 1.8], [0.2, 2.15, 1.0], smooth(u)); look = [-0.3, 2.9, -3.0]; fov = 50;
        const k = kick(f, [B(T.lampu), B(T.jamur)], 0.03); pos = [pos[0] + k[0], pos[1] + k[1], pos[2]];
        break;
      }
      case "close": { // 1963: the gate slams shut
        this.setSet("ext"); this.fogFor("ext"); this.lights("day", f); this.season(0);
        this.door.visible = true; this.doorL.rotation.y = -1.6; this.doorR.rotation.y = 1.6;
        this.gate.visible = true;
        const shut = smooth((f - (B(T.ditutup) - 10)) / 10);
        this.gateBars.position.x = lerp(3.3, 0, shut);
        this.cm.pose({ pos: [-2.4, 0, -4.4], view: "front", face: f > B(T.ditutup) ? "shocked" : "suspicious" }, cam);
        pos = lerp3([0.8, 1.6, 2.6], [0.5, 1.7, 1.6], smooth(u)); look = [-0.4, 1.6, -7.4]; fov = 46;
        const k = kick(f, [B(T.ditutup) + 1], 0.08); pos = [pos[0] + k[0], pos[1] + k[1], pos[2]];
        break;
      }
      case "replica": { // tourists happily visit the copy
        this.setSet("cave"); this.fogFor("cave"); this.lights("replica", f);
        this.rail.visible = true;
        const spots = this.crowdSpots(10, -3.5, 3.5, -1.2, 0.6, 21).map((s, i) => ({ ...s, v: s.v + 30, expr: (i % 3 ? "smile" : "grin") as "smile" | "grin" }));
        this.crowd(f, cam, spots);
        this.cm.pose({ pos: [1.6, 0, 0.5], view: "front", face: "suspicious" }, cam);
        pos = lerp3([2.4, 1.8, 4.3], [1.9, 1.9, 3.8], smooth(u)); look = [0.2, 2.0, -2.0]; fov = 54;
        break;
      }
      case "safe": { // seventeen thousand years in the dark: safe (the clean bull, his torch)
        this.setSet("cave"); this.fogFor("cave"); this.lights("torch", f);
        this.torchAt([-0.9, 0, -1.9], f);
        this.cm.pose({ pos: [0.1, 0, -2.0], view: "front", face: "happy", nod: 3 * Math.sin(t * 0.12) }, cam);
        pos = lerp3([0.3, 1.7, 1.6], [0.2, 1.8, 0.9], smooth(u)); look = [-0.2, 2.4, -2.8]; fov = 50;
        break;
      }
      case "end": { // fifteen years with us: almost gone
        this.setSet("cave"); this.fogFor("cave"); this.lights("lamps", f);
        this.green.u.uGrow.value = 0.95; this.mould.u.uGrow.value = 0.85;
        this.puffs.update(f, cam, [-1.5, -0.5, 0.5, 1.5].map((x) => [x, 1.6, 0.6] as V3), { period: 50, life: 44, size: 0.6, rise: 1.0, drift: [0, -1.6], on: 0.5, seed: 12 });
        const face: Face = f > B(T.hampir) ? "angry" : "scared";
        this.cm.pose({ pos: [0.1, 0, -1.6], view: "front", face, lean: f > B(T.hampir) ? 2 : 0 }, cam);
        pos = lerp3([0.2, 1.7, 1.4], [0.15, 1.72, 0.55], smooth(u)); look = [0.0, 1.95, -2.0]; fov = 48;
        break;
      }
    }

    // every hold creeps: a tiny push toward the look target
    const dir = new THREE.Vector3(look[0] - pos[0], look[1] - pos[1], look[2] - pos[2]);
    const creep = 0.0025 * t;
    cam.position.set(pos[0] + dir.x * creep, pos[1] + dir.y * creep, pos[2] + dir.z * creep);
    cam.fov = fov; cam.updateProjectionMatrix();
    cam.up.set(0, 1, 0);
    cam.lookAt(...look);
    cam.rotateZ(rad(roll * (1 - 0.3 * smooth(u))));
    // re-face cards to the final camera
    cam.updateMatrixWorld();
    for (const o of this.actors.children) {
      if (!o.visible) continue;
      if (o.userData.bill) yawTo(o, cam);
      else if (o.userData.face) o.quaternion.copy(cam.quaternion);
    }
    return { focus: look, shot };
  }
}

export { SHOTS, FPS };
export type { Outfit };
