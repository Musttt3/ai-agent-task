// The three.js world: a triptych of depth-displaced photo panels hinged like altar doors, the person cut-out standing
// in front on still water, type layers, particles, god rays. `update(state)` poses everything for one frame.
import * as THREE from "three";
import { staticFile } from "remotion";
import { FLOOR_Y, makeBurst, makeDust, makeSlit, makePanelMaterial, makePersonMaterial, makeRays, makeSky, makeWater, setRipples } from "./materials";
import { letterRow, loadFonts, textPlane } from "./text";
import { State, clamp, easeOutBack, easeOutCubic, inv } from "./timeline";

// Collage geometry (px of the 1500x1500 source); world units are px/500 with the centre panel centred on x = 0.
const PX = 500;
const CX = 769;
const PANELS = [
  { x0: 0, x1: 496 },
  { x0: 496, x1: 1042 },
  { x0: 1042, x1: 1500 },
];
const PERSON = { x0: 285, y0: 365, x1: 1291, y1: 1500 };
const wx = (px: number) => (px - CX) / PX;
const wy = (py: number) => (750 - py) / PX;

export type Kit = {
  panels: THREE.Texture[];
  depths: THREE.Texture[];
  person: THREE.Texture;
  bulge: THREE.Texture;
};

const loadTex = (loader: THREE.TextureLoader, url: string, color: boolean) =>
  new Promise<THREE.Texture>((res, rej) =>
    loader.load(url, (t) => {
      t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.anisotropy = 8;
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
      res(t);
    }, undefined, rej),
  );

export const loadKit = async (): Promise<Kit> => {
  const l = new THREE.TextureLoader();
  const f = (n: string) => staticFile(`waterfall/${n}`);
  await loadFonts([
    { family: "Anton", url: f("Anton-Regular.ttf") },
    { family: "Montserrat", url: f("Montserrat.ttf"), weight: "100 900" },
  ]);
  const [p1, p2, p3, d1, d2, d3, person, bulge] = await Promise.all([
    loadTex(l, f("p1.jpg"), true), loadTex(l, f("p2.jpg"), true), loadTex(l, f("p3.jpg"), true),
    loadTex(l, f("p1_depth.png"), false), loadTex(l, f("p2_depth.png"), false), loadTex(l, f("p3_depth.png"), false),
    loadTex(l, f("person.png"), true), loadTex(l, f("person_bulge.png"), false),
  ]);
  return { panels: [p1, p2, p3], depths: [d1, d2, d3], person, bulge };
};

type PanelRig = { pivot: THREE.Group; holder: THREE.Group; mesh: THREE.Mesh; refl: THREE.Mesh; mat: THREE.ShaderMaterial; rmat: THREE.ShaderMaterial; w: number; side: -1 | 0 | 1; hinge: number };

// deterministic per-frame jitter that flips sign every frame (impact shake)
const jitter = (f: number, k: number) => Math.sin(f * 12.9898 + k * 78.233) * 43758.5453 % 1;

export class World {
  root = new THREE.Group();
  rigs: PanelRig[] = [];
  person: THREE.Mesh;
  personRefl: THREE.Mesh;
  pmat: THREE.ShaderMaterial;
  prmat: THREE.ShaderMaterial;
  personH: number;
  personCX: number;
  dust: THREE.Points;
  burst: THREE.Points;
  raysBack: THREE.Mesh;
  raysFront: THREE.Mesh;
  sky: THREE.Mesh;
  water: THREE.Mesh;
  slit: THREE.Mesh;
  words: { lost: ReturnType<typeof textPlane>; inn: ReturnType<typeof textPlane>; nature: ReturnType<typeof textPlane> };
  breathe: ReturnType<typeof letterRow>;
  endTitle: ReturnType<typeof letterRow>;
  endSub: ReturnType<typeof textPlane>;
  endLines: THREE.Mesh[];
  private tmpM = new THREE.Matrix4();

  constructor(kit: Kit) {
    // sky
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(60, 48, 24), makeSky());
    this.sky.renderOrder = -10;
    this.root.add(this.sky);

    // god rays behind the panels and a softer haze layer in front
    this.raysBack = new THREE.Mesh(new THREE.PlaneGeometry(11, 10), makeRays(0));
    this.raysBack.position.set(0, 1.6, -1.6);
    this.raysBack.renderOrder = -5;
    this.root.add(this.raysBack);
    this.raysFront = new THREE.Mesh(new THREE.PlaneGeometry(9, 8), makeRays(1));
    this.raysFront.position.set(0, 1.4, 1.5);
    this.raysFront.renderOrder = 20;
    this.root.add(this.raysFront);

    // water surface
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(40, 40, 1, 1), makeWater());
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = FLOOR_Y;
    this.water.renderOrder = -2;
    this.root.add(this.water);

    // light leaking through the slit between the doors
    this.slit = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 3.4), makeSlit());
    this.slit.position.set(0.02, 0, 0.8);
    this.slit.renderOrder = 18;
    this.root.add(this.slit);

    // panels
    PANELS.forEach((p, i) => {
      const w = (p.x1 - p.x0) / PX, h = 3;
      const geo = new THREE.PlaneGeometry(w, h, Math.round(w * 120), 360);
      const mat = makePanelMaterial(kit.panels[i], kit.depths[i], [w, h], false);
      const rmat = makePanelMaterial(kit.panels[i], kit.depths[i], [w, h], true);
      const mesh = new THREE.Mesh(geo, mat);
      const refl = new THREE.Mesh(geo, rmat);
      refl.renderOrder = -3;
      refl.frustumCulled = false;
      const side = (i === 0 ? -1 : i === 2 ? 1 : 0) as -1 | 0 | 1;
      const hinge = i === 0 ? wx(p.x1) : i === 2 ? wx(p.x0) : 0;
      const pivot = new THREE.Group();
      const holder = new THREE.Group();
      pivot.position.set(hinge, 0, 0);
      mesh.position.x = side === -1 ? -w / 2 : side === 1 ? w / 2 : 0;
      refl.position.copy(mesh.position);
      holder.add(mesh, refl);
      pivot.add(holder);
      this.root.add(pivot);
      this.rigs.push({ pivot, holder, mesh, refl, mat, rmat, w, side, hinge });
    });

    // person
    const pw = (PERSON.x1 - PERSON.x0) / PX, ph = (PERSON.y1 - PERSON.y0) / PX;
    this.personH = ph;
    this.personCX = wx((PERSON.x0 + PERSON.x1) / 2);
    const pgeo = new THREE.PlaneGeometry(pw, ph, 120, 136);
    this.pmat = makePersonMaterial(kit.person, kit.bulge, false);
    this.prmat = makePersonMaterial(kit.person, kit.bulge, true);
    this.person = new THREE.Mesh(pgeo, this.pmat);
    this.personRefl = new THREE.Mesh(pgeo, this.prmat);
    this.personRefl.renderOrder = -3;
    this.personRefl.frustumCulled = false;
    this.person.renderOrder = 5;
    this.root.add(this.person, this.personRefl);

    // particles
    this.dust = makeDust(2000);
    this.dust.renderOrder = 15;
    this.burst = makeBurst(520);
    this.burst.renderOrder = 16;
    this.root.add(this.dust, this.burst);

    // type
    this.words = {
      lost: textPlane("LOST", "Anton", 400, 0.62, 0.02),
      inn: textPlane("IN", "Montserrat", 500, 0.24, 0.5),
      nature: textPlane("NATURE", "Anton", 400, 0.62, 0.02),
    };
    Object.values(this.words).forEach((w) => { w.mesh.renderOrder = 12; this.root.add(w.mesh); });
    this.breathe = letterRow("BREATHE", "Anton", 400, 0.5, 0.05);
    this.breathe.group.renderOrder = 4;
    this.breathe.glyphs.forEach((g) => (g.mesh.renderOrder = 4));
    this.root.add(this.breathe.group);
    this.endTitle = letterRow("BREATHE", "Anton", 400, 0.36, 0.32);
    this.endTitle.glyphs.forEach((g) => (g.mesh.renderOrder = 12));
    this.root.add(this.endTitle.group);
    this.endSub = textPlane("LOST IN NATURE", "Montserrat", 400, 0.085, 0.55);
    this.endSub.mesh.renderOrder = 12;
    this.root.add(this.endSub.mesh);
    this.endLines = [0, 1].map(() => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.006), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false }));
      m.renderOrder = 12;
      this.root.add(m);
      return m;
    });
  }

  update(s: State, cam: THREE.PerspectiveCamera, frame: number, heightPx: number) {
    const t = s.t;

    // ---- panels ----
    this.rigs.forEach((r, i) => {
      const fi = s.panelIn[i];
      r.pivot.rotation.set(0, r.side === -1 ? s.fan : r.side === 1 ? -s.fan : 0, 0);
      r.holder.position.set(...fi.pos);
      r.holder.rotation.set(...fi.rot);
      for (const m of [r.mat, r.rmat]) {
        m.uniforms.uDisp.value = s.disp[i];
        m.uniforms.uOpacity.value = fi.opacity;
        m.uniforms.uEdge.value = s.edge;
        m.uniforms.uTime.value = t;
        m.uniforms.uSweep.value = s.sweep;
        m.uniforms.uBright.value = 1;
      }
    });
    // the centre panel stays slightly darker until the person arrives (empty stage)
    this.rigs[1].mat.uniforms.uBright.value = s.shot === "intro" || s.shot === "build" ? 0.82 : 1;

    // ---- person: feet stay on the water while it scales ----
    const sc = s.person.scale;
    this.person.scale.setScalar(sc);
    this.person.position.set(this.personCX, FLOOR_Y + 0.02 + (this.personH * sc) / 2, s.person.z);
    this.personRefl.scale.copy(this.person.scale);
    this.personRefl.position.copy(this.person.position);
    this.person.visible = this.personRefl.visible = s.person.on > 0.001;
    for (const m of [this.pmat, this.prmat]) {
      m.uniforms.uOpacity.value = s.person.on;
      m.uniforms.uBulge.value = s.person.bulge;
      m.uniforms.uRim.value = s.person.rim;
      m.uniforms.uTime.value = t;
      m.uniforms.uSweep.value = s.sweep;
    }

    // ---- ripples (from the person's feet, or the centre of the stage before he appears) ----
    const rip = s.ripples.slice(-4).map((c) => ({ x: this.personCX, z: s.person.on > 0 ? s.person.z : 0.4, age: t - c, s: 1 }));
    for (const m of [this.water.material as THREE.ShaderMaterial, this.prmat, ...this.rigs.map((r) => r.rmat)]) setRipples(m, rip);
    (this.water.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
    (this.water.material as THREE.ShaderMaterial).uniforms.uStrength.value = s.shot === "p1" || s.shot === "p3" ? 0 : 1;

    // ---- rays, sky ----
    const rb = this.raysBack.material as THREE.ShaderMaterial, rf = this.raysFront.material as THREE.ShaderMaterial;
    rb.uniforms.uTime.value = rf.uniforms.uTime.value = t;
    rb.uniforms.uStrength.value = s.rays * 0.42;
    rf.uniforms.uStrength.value = s.haze * s.rays * 0.1;
    this.raysFront.visible = s.haze > 0.001;
    (this.sky.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
    (this.slit.material as THREE.ShaderMaterial).uniforms.uStrength.value = s.slit;
    this.slit.visible = s.slit > 0.002;

    // ---- particles ----
    const fovRad = (cam.fov * Math.PI) / 180;
    const pxScale = heightPx / (2 * Math.tan(fovRad / 2));
    const dm = this.dust.material as THREE.ShaderMaterial;
    dm.uniforms.uTime.value = t;
    dm.uniforms.uDensity.value = s.particles.density;
    dm.uniforms.uImplode.value = s.particles.implode;
    dm.uniforms.uFall.value = s.particles.fall;
    dm.uniforms.uPx.value = pxScale;
    dm.uniforms.uHat.value = s.hat;
    const bm = this.burst.material as THREE.ShaderMaterial;
    bm.uniforms.uAge.value = s.burst;
    bm.uniforms.uPx.value = pxScale;
    bm.uniforms.uOrigin.value.set(this.personCX, 0.15, s.person.z + 0.05);
    this.burst.visible = s.burst >= 0 && s.burst < 4;

    // ---- intro words ----
    const W = this.words;
    const word = (w: typeof W.lost, on: number, y: number, x: number, k: number) => {
      const pop = easeOutBack(on, 2.2);
      const sc2 = on <= 0 ? 0.001 : 1.5 - 0.5 * pop;
      const sct = s.words.scatter;
      w.mesh.visible = on > 0 && sct < 1;
      w.mesh.scale.setScalar(sc2 * (1 + sct * 1.8));
      w.mesh.position.set(x * (1 + sct * 1.5) + k * sct * 0.6, y + sct * k * 0.4, 1.35 + sct * 3.2);
      w.mesh.rotation.set(0, 0, k * sct * 0.25);
      w.mat.opacity = clamp(on * 3) * (1 - sct);
    };
    word(W.lost, s.words.lost, 0.92, -0.05, -1);
    word(W.inn, s.words.inn, 0.36, 0.0, 0.5);
    word(W.nature, s.words.nature, -0.18, 0.05, 1);

    // ---- BREATHE behind the person ----
    const br = this.breathe;
    br.group.position.set(this.personCX, 0.68, 0.42);
    br.group.visible = s.breathe.opacity > 0 && s.breathe.letters > 0;
    br.glyphs.forEach((g, i) => {
      const a = clamp(s.breathe.letters - i);
      const e = easeOutCubic(a);
      g.mesh.position.set(g.x, 0.22 * (1 - e), -0.15 * (1 - e));
      g.mesh.scale.setScalar(a <= 0 ? 0.001 : 1.25 - 0.25 * easeOutBack(a, 2));
      g.mat.opacity = e * 0.94 * s.breathe.opacity;
    });

    // ---- end card ----
    const ec = s.endCard;
    const et = this.endTitle;
    et.group.position.set(-0.038, 2.08, 0.05);
    et.group.visible = ec > 0;
    et.glyphs.forEach((g, i) => {
      const a = clamp(ec * 1.6 - i * 0.09);
      g.mesh.position.set(g.x * (1 + 0.25 * (1 - easeOutCubic(a))), 0.12 * (1 - easeOutCubic(a)), 0);
      g.mat.opacity = easeOutCubic(a);
      g.mesh.scale.setScalar(1);
    });
    const sub = this.endSub;
    sub.mesh.visible = ec > 0;
    sub.mesh.position.set(-0.038, -2.62, 0.05);
    sub.mat.opacity = easeOutCubic(inv(0.35, 1, ec)) * 0.85;
    this.endLines.forEach((l, i) => {
      const len = 0.42 * easeOutCubic(inv(0.25, 1, ec));
      l.visible = ec > 0;
      l.scale.x = Math.max(len, 0.001);
      l.position.set(-0.038 + (i === 0 ? -1 : 1) * (sub.inkW / 2 + 0.12 + len / 2), -2.62, 0.05);
      (l.material as THREE.MeshBasicMaterial).opacity = 0.7 * easeOutCubic(inv(0.25, 1, ec));
    });

    // ---- camera ----
    this.root.updateMatrixWorld(true);
    const pos = new THREE.Vector3(...s.cam.pos);
    const tgt = new THREE.Vector3(...s.cam.target);
    if (s.cam.frame.kind === "panel") {
      const r = this.rigs[s.cam.frame.panel];
      this.tmpM.copy(r.mesh.matrixWorld);
      pos.applyMatrix4(this.tmpM);
      tgt.applyMatrix4(this.tmpM);
    }
    if (s.shake > 0) {
      const a = s.shake * 0.03 * (frame % 2 === 0 ? 1 : -1);
      pos.x += a * (0.6 + 0.4 * jitter(frame, 1));
      pos.y += a * 0.7 * (0.6 + 0.4 * jitter(frame, 2));
    }
    cam.position.copy(pos);
    cam.up.set(0, 1, 0);
    cam.lookAt(tgt);
    cam.rotateZ(s.cam.roll);
    cam.fov = s.cam.fov;
    cam.near = 0.03;
    cam.far = 200;
    cam.updateProjectionMatrix();
    this.sky.position.copy(cam.position);
  }
}
