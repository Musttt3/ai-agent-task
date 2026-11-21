// Procedural 3D sets & props for "Es Krim di Zaman Purba" (helpers from the 2d-in-3d-animation-agent template)
// Built on the proven two-tone Lambert + InkPass + hand-painted Canvas2D texture pipeline.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { rng, ctex, rep, grassHD, stoneHD, planksHD, beamHD } from "./paint";
export { rng, ctex, rep };
import { twoTone } from "./shade";
import { NOINK } from "./ink";

export type Kit = Record<string, THREE.Object3D>;
export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ---------------- materials (shared, cached, all two-tone shaded) ----------------
const mats = new Map<string, THREE.Material>();
export const lam = (key: string, make: () => THREE.MeshLambertMaterialParameters) => {
  let m = mats.get(key) as THREE.MeshLambertMaterial | undefined;
  if (!m) {
    m = twoTone(new THREE.MeshLambertMaterial(make()));
    mats.set(key, m);
  }
  return m;
};

const f32 = (a: THREE.BufferAttribute | THREE.InterleavedBufferAttribute) => {
  const out = new Float32Array(a.count * a.itemSize);
  for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) out[i * a.itemSize + k] = a.getComponent(i, k);
  return new THREE.Float32BufferAttribute(out, a.itemSize);
};

export class Batch {
  private g = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(geo: THREE.BufferGeometry, mat: THREE.Material, m?: THREE.Matrix4) {
    const src = geo.index ? geo.toNonIndexed() : geo;
    const x = new THREE.BufferGeometry();
    x.setAttribute("position", f32(src.attributes.position));
    if (src.attributes.normal) x.setAttribute("normal", f32(src.attributes.normal)); else x.computeVertexNormals();
    x.setAttribute("uv", src.attributes.uv ? f32(src.attributes.uv) : new THREE.Float32BufferAttribute(new Float32Array(src.attributes.position.count * 2), 2));
    if (m) x.applyMatrix4(m);
    const l = this.g.get(mat);
    if (l) l.push(x); else this.g.set(mat, [x]);
  }
  build(parent: THREE.Object3D, cast = true) {
    for (const [mat, list] of this.g) {
      const mesh = new THREE.Mesh(mergeGeometries(list, false), mat);
      mesh.castShadow = cast; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false;
      parent.add(mesh);
    }
    this.g.clear();
  }
}

// ---------------- cartoon trees ----------------
const LEAF = ["#5aa83c", "#4c9a37", "#69b545", "#55a243", "#3f8f3c"];
const leafTex = (i: number) => ctex("leafS" + i, 256, 128, (g) => {
  const base = new THREE.Color(LEAF[i % LEAF.length]), top = base.clone().offsetHSL(0.01, 0.03, 0.08), bot = base.clone().offsetHSL(-0.01, 0, -0.08);
  const gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, "#" + top.getHexString()); gr.addColorStop(0.5, "#" + base.getHexString()); gr.addColorStop(1, "#" + bot.getHexString());
  g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
});
const leafMat = (i: number) => lam("leafS" + i, () => ({ map: leafTex(i) }));
const barkMat = () => lam("barkS", () => ({ color: "#8f5d3b" }));
const SPH = new THREE.SphereGeometry(1, 14, 10);
const TRUNK = new THREE.CylinderGeometry(0.55, 1, 1, 8, 1).translate(0, 0.5, 0);

export const addTree = (b: Batch, x: number, y: number, z: number, h: number, seed: number) => {
  const r = rng(Math.abs(Math.floor(seed * 97 + 13)));
  const leaf = leafMat(Math.floor(r() * 4));
  const tr = 0.07 * h, th = 0.42 * h;
  b.add(TRUNK, barkMat(), new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion(), V(tr, th, tr)));
  const cy = y + 0.62 * h;
  const put = (dx: number, dy: number, dz: number, rad: number) =>
    b.add(SPH, leaf, new THREE.Matrix4().compose(V(x + dx, cy + dy, z + dz), new THREE.Quaternion(), V(rad, rad * 0.88, rad)));
  put(0, 0, 0, 0.28 * h);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + r() * 0.5, d = 0.18 * h;
    put(Math.cos(a) * d, -0.05 * h, Math.sin(a) * d, 0.21 * h);
  }
  put(0, 0.16 * h, 0, 0.19 * h);
};

// ---------------- text on painted signs (Poppins Black, loaded by the composition before the world is built) ----------------
export const FONT = "'PoppinsBlack', 'Segoe UI', Arial, sans-serif";
const fit = (g: CanvasRenderingContext2D, text: string, cx: number, cy: number, maxW: number, px: number) => {
  let sz = px;
  g.font = `900 ${sz}px ${FONT}`;
  while (g.measureText(text).width > maxW && sz > 14) { sz -= 2; g.font = `900 ${sz}px ${FONT}`; }
  g.fillText(text, cx, cy);
};
const INKC = "#241726";
/** board texture: up to 3 lines on a coloured panel with an ink frame */
export const signTex = (key: string, lines: string[], bg: string, fg: string, w = 1024, h = 512, accent?: string) =>
  ctex("sign_" + key, w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = INKC; g.lineWidth = Math.round(h * 0.045); g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth);
    g.textAlign = "center"; g.textBaseline = "middle";
    const n = lines.length;
    lines.forEach((t, i) => {
      g.fillStyle = i === n - 1 && accent ? accent : fg;
      fit(g, t, w / 2, (h * (i + 0.5)) / n + (n === 1 ? 0 : (i - (n - 1) / 2) * -h * 0.04), w * 0.86, Math.round((h / n) * (i === 0 ? 0.62 : 0.5)));
    });
  });
/** carved stone tablet */
const tabletTex = (lines: string[]) => ctex("tablet_" + lines.join("|"), 1024, 640, (g, r) => {
  g.fillStyle = "#a99c88"; g.fillRect(0, 0, 1024, 640);
  for (let i = 0; i < 60; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"; g.beginPath(); g.arc(r() * 1024, r() * 640, 20 + r() * 60, 0, 7); g.fill(); }
  g.textAlign = "center"; g.textBaseline = "middle";
  lines.forEach((t, i) => { g.fillStyle = "#3a2e26"; fit(g, t, 512, 200 + i * 230, 900, i === 0 ? 190 : 110); });
});
/** fuel gauge panel: needle level 0..1 */
export const gaugeTex = (level: number) => ctex("gauge" + level.toFixed(2), 512, 256, (g) => {
  g.fillStyle = "#f2efe6"; g.fillRect(0, 0, 512, 256);
  g.strokeStyle = INKC; g.lineWidth = 14; g.strokeRect(7, 7, 498, 242);
  g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = INKC; fit(g, "BENSIN", 256, 52, 400, 54);
  const bars = 5, on = Math.round(level * bars);
  for (let i = 0; i < bars; i++) {
    g.fillStyle = i < on ? (on <= 1 ? "#e2453c" : on <= 2 ? "#f2a33a" : "#3fb950") : "#d9d4c8";
    g.fillRect(48 + i * 86, 110, 70, 100); g.strokeStyle = INKC; g.lineWidth = 6; g.strokeRect(48 + i * 86, 110, 70, 100);
  }
});
/** striped awning cloth */
const stripeTex = (a: string, b: string) => ctex("stripe" + a + b, 256, 64, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(i * 32, 0, 32, 64); } });
/** school facade: cream wall, blue window frames, a door */
const schoolTex = () => ctex("schoolFacade", 2048, 512, (g, r) => {
  g.fillStyle = "#f1e6c8"; g.fillRect(0, 0, 2048, 512);
  g.fillStyle = "#c9a86a"; g.fillRect(0, 440, 2048, 72);
  for (let i = 0; i < 8; i++) {
    const x = 70 + i * 250;
    if (i === 4) { g.fillStyle = "#6a4a2a"; g.fillRect(x, 200, 140, 260); g.strokeStyle = INKC; g.lineWidth = 8; g.strokeRect(x, 200, 140, 260); continue; }
    g.fillStyle = "#8ec4e8"; g.fillRect(x, 150, 160, 200); g.strokeStyle = "#2f5aa8"; g.lineWidth = 14; g.strokeRect(x, 150, 160, 200);
    g.beginPath(); g.moveTo(x + 80, 150); g.lineTo(x + 80, 350); g.moveTo(x, 250); g.lineTo(x + 160, 250); g.stroke();
  }
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(120,90,60,0.08)"; g.fillRect(r() * 2048, r() * 440, 4, 20 + r() * 40); }
});
/** sand */
const sandTex = () => ctex("sand", 512, 512, (g, r) => {
  g.fillStyle = "#e8d3a2"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "#d8bf8a" : "#f2e2b8"; g.fillRect(r() * 512, r() * 512, 3, 3); }
});
const asphaltTex = () => ctex("asphalt", 512, 512, (g, r) => {
  g.fillStyle = "#5a5a60"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1500; i++) { g.fillStyle = r() < 0.5 ? "#4e4e54" : "#66666c"; g.fillRect(r() * 512, r() * 512, 3, 3); }
});

// ---------------- the ice cream cart (built once, placed per set) ----------------
export type Cart = { root: THREE.Group; lid: THREE.Group; stock: THREE.Group; melt: THREE.Group; signs: Record<string, THREE.Mesh>; cold: THREE.Vector3 };
export const buildCart = (): Cart => {
  const root = new THREE.Group(), b = new Batch();
  const white = lam("cartWhite", () => ({ color: "#f4f6f8" })), blue = lam("cartBlue", () => ({ color: "#2f7fd0" })), dark = lam("cartDark", () => ({ color: "#2b2b33" }));
  const steel = lam("cartSteel", () => ({ color: "#b9c2cc" })), awn = lam("cartAwn", () => ({ map: rep(stripeTex("#e2453c", "#f8f4ec"), 3, 1) })), pole = lam("cartPole", () => ({ color: "#d9dde0" }));
  b.add(new THREE.BoxGeometry(1.7, 0.86, 0.86).translate(0, 0.86, 0), white);
  b.add(new THREE.BoxGeometry(1.74, 0.12, 0.9).translate(0, 0.42, 0), blue);
  b.add(new THREE.BoxGeometry(1.74, 0.08, 0.9).translate(0, 1.27, 0), blue);
  for (const s of [-1, 1]) {
    b.add(new THREE.CylinderGeometry(0.36, 0.36, 0.08, 20).rotateZ(Math.PI / 2).translate(s * 0.92, 0.36, 0.12), dark);
    b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 10).rotateZ(Math.PI / 2).translate(s * 0.92, 0.36, 0.12), steel);
  }
  b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8).rotateZ(Math.PI / 2).translate(0, 1.05, -0.62), steel); // push bar
  for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 8).rotateX(Math.PI / 2).translate(s * 0.45, 1.05, -0.5), steel);
  b.add(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8).translate(0.62, 2.0, -0.2), pole);
  b.add(new THREE.ConeGeometry(1.15, 0.45, 16, 1, true).translate(0.62, 2.85, -0.2), awn);
  b.build(root, true);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.62), lam("cartSign", () => ({ map: signTex("cartfront", ["ES KRIM", "DINGIN  •  SEGAR"], "#2f7fd0", "#ffffff", 1024, 420, "#ffd43b") })));
  front.position.set(0, 0.86, 0.435); root.add(front);
  // freezer lid, hinged on the back edge
  const lid = new THREE.Group(); lid.position.set(0, 1.31, -0.42);
  const lidM = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.82).translate(0, 0.03, 0.41), steel); lidM.castShadow = true; lid.add(lidM);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.05).translate(0, 0.08, 0.78), dark); lid.add(handle);
  root.add(lid);
  // the stock inside: rows of wrapped ice creams (and a melted version)
  const stock = new THREE.Group(), melt = new THREE.Group();
  const cols = ["#6b3a22", "#f2e6c8", "#e86e9a", "#6fae48", "#f2b134"];
  for (let i = 0; i < 6; i++) for (let k = 0; k < 3; k++) {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.12, 4, 10).rotateX(Math.PI / 2), lam("ice" + ((i + k) % 5), () => ({ color: cols[(i + k) % 5] })));
    m.position.set(-0.6 + i * 0.24, 1.3, -0.29 + k * 0.24); m.scale.set(1.25, 0.7, 1); stock.add(m);
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, 0.07), lam("stick", () => ({ color: "#e8c88a" })));
    st.position.set(-0.6 + i * 0.24, 1.29, -0.29 + k * 0.24 + 0.13); stock.add(st);
    const mm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.02, 10), lam("melt" + ((i + k) % 5), () => ({ color: cols[(i + k) % 5] })));
    mm.position.set(-0.6 + i * 0.24, 1.28, -0.26 + k * 0.24); mm.scale.set(1.2, 1, 0.9); melt.add(mm);
  }
  root.add(stock, melt); melt.visible = false;
  const signs: Record<string, THREE.Mesh> = {};
  const top = (key: string, lines: string[], bg: string, fg: string) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.42), lam("cartTop" + key, () => ({ map: signTex("carttop" + key, lines, bg, fg, 1024, 344) })));
    m.position.set(0, 2.05, 0.38); m.visible = false; root.add(m); signs[key] = m;
  };
  top("first", ["PENJUAL ES KRIM", "PERTAMA DI DUNIA"], "#ffd43b", INKC);
  top("closed", ["TUTUP"], "#e2453c", "#ffffff");
  top("store", ["GUDANG & TEDUH"], "#8a5a34", "#ffffff");
  return { root, lid, stock, melt, signs, cold: new THREE.Vector3(0, 1.45, 0) };
};

// ---------------- the generator ----------------
export type Gen = { root: THREE.Group; body: THREE.Group; gauges: THREE.Mesh[]; lamp: THREE.MeshBasicMaterial; exhaust: THREE.Vector3 };
export const buildGenerator = (): Gen => {
  const root = new THREE.Group(), body = new THREE.Group(), b = new Batch();
  const red = lam("genRed", () => ({ color: "#d9382e" })), dark = lam("genDark", () => ({ color: "#2b2b33" })), steel = lam("genSteel", () => ({ color: "#9aa3ad" }));
  b.add(new THREE.BoxGeometry(0.72, 0.42, 0.48).translate(0, 0.27, 0), red);
  b.add(new THREE.BoxGeometry(0.62, 0.16, 0.4).translate(0, 0.56, 0), red);
  b.add(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 10).translate(-0.2, 0.68, 0), dark);
  for (const [x, z] of [[-0.3, -0.2], [0.3, -0.2], [-0.3, 0.2], [0.3, 0.2]] as const) b.add(new THREE.BoxGeometry(0.06, 0.06, 0.06).translate(x, 0.03, z), dark);
  b.add(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 8).rotateZ(Math.PI / 2).translate(0.5, 0.35, -0.12), steel);
  b.add(new THREE.TorusGeometry(0.12, 0.02, 6, 16).translate(-0.37, 0.3, 0.05), steel);
  b.build(body, true);
  const gauges = [1, 0.6, 0.4, 0.2, 0].map((lv) => {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.17), lam("gauge" + lv, () => ({ map: gaugeTex(lv) })));
    g.position.set(0.08, 0.3, 0.245); g.visible = lv === 1; body.add(g); return g;
  });
  const lamp = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 2.6, 0.6), fog: false });
  const lm = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), lamp); lm.position.set(0.28, 0.42, 0.245); lm.layers.set(NOINK); body.add(lm);
  root.add(body);
  return { root, body, gauges, lamp, exhaust: new THREE.Vector3(0.68, 0.35, -0.12) };
};

// ---------------- signs on posts ----------------
export type Board = { root: THREE.Group; faces: Record<string, THREE.Mesh> };
export const buildBoard = (variants: Record<string, [string[], string, string]>, w = 1.15, h = 0.72, postH = 1.35): Board => {
  const root = new THREE.Group(), b = new Batch(), wood = lam("boardWood", () => ({ map: beamHD() }));
  b.add(new THREE.BoxGeometry(0.08, postH + h, 0.08).translate(0, (postH + h) / 2, -0.06), wood);
  b.add(new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.06).translate(0, postH + h / 2, -0.02), wood);
  b.build(root, true);
  const faces: Record<string, THREE.Mesh> = {};
  for (const [k, [lines, bg, fg]] of Object.entries(variants)) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lam("board" + k, () => ({ map: signTex("board" + k, lines, bg, fg, 1024, Math.round((1024 * h) / w)) })));
    m.position.set(0, postH + h / 2, 0.015); m.visible = false; root.add(m); faces[k] = m;
  }
  return { root, faces };
};

// ---------------- SET A: a modern school front (the "usual" day of an ice cream seller) ----------------
export const SCHOOL_X = -120;
export const buildSchool = () => {
  const g = new THREE.Group(), b = new Batch();
  const road = lam("road", () => ({ map: rep(asphaltTex(), 8, 8) })), walk = lam("walk", () => ({ map: rep(stoneHD("walkHD"), 6, 2) }));
  const facade = lam("schoolWall", () => ({ map: schoolTex() })), roofM = lam("schoolRoof", () => ({ color: "#b8452f" })), fence = lam("fence", () => ({ color: "#2f7d4a" }));
  const grassM = lam("schoolGrass", () => ({ map: rep(grassHD(), 6, 6) })), white = lam("gateWhite", () => ({ color: "#f4f4f0" }));
  b.add(new THREE.BoxGeometry(60, 0.2, 14).translate(0, -0.1, 6), road);
  b.add(new THREE.BoxGeometry(60, 0.24, 4).translate(0, 0.02, -2), walk);
  b.add(new THREE.BoxGeometry(60, 0.2, 30).translate(0, -0.08, -19), grassM);
  b.add(new THREE.BoxGeometry(26, 5, 6).translate(0, 2.5, -14), facade);
  const rs = new THREE.Shape([new THREE.Vector2(-3.6, 0), new THREE.Vector2(0, 2.4), new THREE.Vector2(3.6, 0)]);
  b.add(new THREE.ExtrudeGeometry(rs, { depth: 27, bevelEnabled: false }).rotateY(Math.PI / 2).translate(-13.5, 5, -14), roofM);
  for (let x = -14; x <= 14; x += 0.5) if (Math.abs(x) > 2.2) b.add(new THREE.BoxGeometry(0.06, 1.3, 0.06).translate(x, 0.65, -4.2), fence);
  for (const y of [0.4, 1.1]) for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(11.8, 0.06, 0.06).translate(s * 8.1, y, -4.2), fence);
  for (const s of [-1, 1]) b.add(new THREE.BoxGeometry(0.35, 3.2, 0.35).translate(s * 2.3, 1.6, -4.2), white);
  b.add(new THREE.BoxGeometry(5.0, 0.3, 0.35).translate(0, 3.2, -4.2), white);
  b.add(new THREE.CylinderGeometry(0.05, 0.05, 7, 8).translate(6.5, 3.5, -8), white);
  addTree(b, -9, 0, -7, 5.5, 3); addTree(b, 10, 0, -7.5, 5.2, 7); addTree(b, -18, 0, -6, 6, 11); addTree(b, 19, 0, -6.5, 6.2, 13);
  b.build(g, true);
  const gate = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.62), lam("gateSign", () => ({ map: signTex("gate", ["SEKOLAH DASAR"], "#2f7d4a", "#ffffff", 1024, 152) })));
  gate.position.set(0, 3.2, -4.0); g.add(gate);
  const flag = new THREE.Group();
  const fr = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.5), new THREE.MeshLambertMaterial({ color: "#e2201c", side: THREE.DoubleSide })); fr.position.set(7.25, 6.55, -8);
  const fw = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.5), new THREE.MeshLambertMaterial({ color: "#f8f8f4", side: THREE.DoubleSide })); fw.position.set(7.25, 6.05, -8);
  flag.add(fr, fw); g.add(flag);
  g.position.set(SCHOOL_X, 0, 0);
  return g;
};

// ---------------- SET B: the valley near the beach, 30,000 years ago ----------------
export const SHELTER: [number, number, number] = [-9, 0, -6.5];
export const FIRE: [number, number, number] = [-5.2, 0, -2.6];
export const buildValley = () => {
  const g = new THREE.Group(), b = new Batch();
  const grassM = lam("vGrass", () => ({ map: rep(grassHD(), 14, 14) })), sandM = lam("vSand", () => ({ map: rep(sandTex(), 20, 3) }));
  const rockM = lam("vRock", () => ({ map: rep(stoneHD("vRockHD", ["#a59c8c", "#9a907f", "#b2a894", "#8f8676"], "#7a7062"), 1, 1) })), rockD = lam("vRockD", () => ({ color: "#8a8172" }));
  const leafBed = lam("vLeafBed", () => ({ color: "#5d8a3a" })), furM = lam("vFur", () => ({ color: "#8a5a34" })), mtn = lam("vMtn", () => ({ color: "#7d9a6a" })), mtnFar = lam("vMtnFar", () => ({ color: "#9aaec0" }));
  const fern = lam("vFern", () => ({ color: "#4f8a3c" })), log = lam("vLog", () => ({ color: "#7a5232" }));
  b.add(new THREE.BoxGeometry(160, 0.4, 70).translate(0, -0.2, 15), grassM);
  b.add(new THREE.BoxGeometry(160, 0.4, 14).translate(0, -0.25, -27), sandM);
  const r = rng(321);
  // rock shelter (overhang) with leaf beds and furs: the group's sleeping place
  const [sx, , sz] = SHELTER;
  for (let i = 0; i < 9; i++) b.add(new THREE.DodecahedronGeometry(1, 0).scale(1.4 + r(), 1.2 + r() * 1.4, 1.2 + r()).translate(sx - 3.2 + i * 0.8, 1, sz - 2.4 - r() * 0.5), rockM);
  b.add(new THREE.BoxGeometry(7.5, 0.7, 3.4).rotateX(-0.12).translate(sx, 3.3, sz - 1.0), rockM);
  for (const s of [-1, 1]) b.add(new THREE.DodecahedronGeometry(1, 0).scale(1.0, 1.9, 1.0).translate(sx + s * 3.4, 1.6, sz - 0.6), rockM);
  for (let i = 0; i < 4; i++) { b.add(new THREE.CylinderGeometry(0.7, 0.75, 0.12, 14).scale(1.4, 1, 0.8).translate(sx - 2.2 + i * 1.5, 0.06, sz - 0.8), leafBed); b.add(new THREE.BoxGeometry(0.9, 0.05, 0.6).translate(sx - 2.2 + i * 1.5, 0.14, sz - 0.7), furM); }
  // camp fire ring and a few logs to sit on
  const [fx, , fz] = FIRE;
  for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; b.add(new THREE.DodecahedronGeometry(0.16, 0).translate(fx + 0.6 * Math.cos(a), 0.1, fz + 0.6 * Math.sin(a)), rockD); }
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI; b.add(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6).rotateZ(Math.PI / 2).rotateY(a).translate(fx, 0.12, fz), log); }
  for (const [x, z, ry] of [[fx - 1.6, fz + 0.8, 0.3], [fx + 1.7, fz - 0.6, -0.5]] as const) b.add(new THREE.CylinderGeometry(0.22, 0.24, 1.6, 10).rotateZ(Math.PI / 2).rotateY(ry).translate(x, 0.22, z), log);
  // scattered boulders, ferns, trees; far hills and mountains; the beach and the sea behind
  for (let i = 0; i < 26; i++) { const x = -40 + r() * 80, z = -15 + r() * 30; if (Math.hypot(x, z) < 6 || (Math.abs(x - sx) < 5 && Math.abs(z - sz) < 4)) continue; b.add(new THREE.DodecahedronGeometry(0.3 + r() * 0.7, 0).scale(1.2, 0.7, 1).translate(x, 0.15, z), rockM); }
  for (let i = 0; i < 40; i++) { const x = -30 + r() * 60, z = -12 + r() * 24; if (Math.hypot(x, z) < 5) continue; for (let k = 0; k < 5; k++) b.add(new THREE.ConeGeometry(0.08, 0.7, 4).rotateZ((k - 2) * 0.35).translate(x + (k - 2) * 0.08, 0.3, z), fern); }
  const trees: [number, number, number][] = [[-14, -9, 6.5], [-17, 2, 7], [12, -8, 6.8], [16, 3, 7.4], [9, -14, 6], [-6, -14, 5.8], [22, -4, 6.2], [-24, -6, 7.5], [4, -16, 5.5], [-9.0, 2.4, 7.6]]; // the last one is the shade tree the cart is pushed under
  trees.forEach(([x, z, h], i) => addTree(b, x, 0, z, h, 101 + i));
  for (let i = 0; i < 9; i++) { const x = -70 + i * 18, s = 14 + r() * 12; b.add(new THREE.ConeGeometry(s, s * 1.1, 8).translate(x, s * 0.5 - 2, 45 + r() * 15), mtn); }
  for (let i = 0; i < 7; i++) { const x = -90 + i * 30, s = 30 + r() * 20; b.add(new THREE.ConeGeometry(s, s * 1.3, 8).translate(x, s * 0.6 - 4, 110 + r() * 30), mtnFar); }
  b.build(g, true);
  const tablet = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.25), [rockD, rockD, rockD, rockD, lam("tablet", () => ({ map: tabletTex(["30.000", "TAHUN LALU"]) })), rockD]);
  tablet.position.set(-3.4, 0.62, 1.6); tablet.rotation.set(-0.08, 0.18, 0.02); tablet.castShadow = true; tablet.name = "tablet"; g.add(tablet);
  return g;
};

// ---------------- SET C: the shady river ----------------
export const RIVER_X = 120;
export const buildRiver = () => {
  const g = new THREE.Group(), b = new Batch(), r = rng(77);
  const grassM = lam("rGrass", () => ({ map: rep(grassHD(), 10, 10) })), rockM = lam("rRock", () => ({ map: rep(stoneHD("rRockHD", ["#9aa094", "#8e9488", "#a6ac9e", "#848a7e"], "#6e7468"), 1, 1) }));
  const pot = lam("rPot", () => ({ color: "#b0603a" })), leaf = lam("rLeaf", () => ({ color: "#5d9a3c" })), fern = lam("rFern", () => ({ color: "#4a8a3a" }));
  b.add(new THREE.BoxGeometry(80, 0.4, 60).translate(0, -0.2, 0), grassM);
  for (let i = 0; i < 18; i++) { const z = -14 + i * 1.8; for (const s of [-1, 1]) b.add(new THREE.DodecahedronGeometry(0.45 + r() * 0.5, 0).scale(1.3, 0.6, 1).translate(4.2 + s * 2.1 + r() * 0.4, 0.05, z), rockM); }
  // clay pots with leaf lids in the cool shade (fruit kept cool, not frozen)
  for (const [x, z, s] of [[1.2, -1.2, 1], [1.9, -0.6, 0.8], [0.6, -0.4, 0.9], [2.4, -1.5, 0.7]] as const) {
    b.add(new THREE.CylinderGeometry(0.22 * s, 0.17 * s, 0.42 * s, 14).translate(x, 0.21 * s, z), pot);
    b.add(new THREE.CylinderGeometry(0.26 * s, 0.26 * s, 0.03, 12).translate(x, 0.43 * s, z), leaf);
  }
  for (let i = 0; i < 30; i++) { const x = -14 + r() * 26, z = -10 + r() * 20; if (Math.abs(x - 4.2) < 3 || Math.hypot(x, z) < 3) continue; for (let k = 0; k < 5; k++) b.add(new THREE.ConeGeometry(0.08, 0.7, 4).rotateZ((k - 2) * 0.35).translate(x + (k - 2) * 0.08, 0.3, z), fern); }
  [[-3, -4, 7.5], [-6, 2, 8], [9, -3, 7.2], [10, 4, 6.8], [-2, 6, 6.6], [6, -9, 7]].forEach(([x, z, h], i) => addTree(b, x, 0, z, h, 201 + i));
  b.build(g, true);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 40).rotateX(-Math.PI / 2), lam("rWater", () => ({ color: "#4f9ed0", emissive: "#1a4a6a", emissiveIntensity: 0.25 })));
  water.position.set(4.2, 0.04, 0); g.add(water);
  g.position.set(RIVER_X, 0, 0);
  return g;
};

// ---------------- the barter goods (fish, fruit, shells, wood) left next to the cart ----------------
export const buildPile = () => {
  const g = new THREE.Group(), b = new Batch(), r = rng(55);
  const fish = lam("pFish", () => ({ color: "#8cc4e0" })), fruitC = ["#e2453c", "#f2b134", "#8cc63f"], shell = lam("pShell", () => ({ color: "#f2d4c0" })), wood = lam("pWood", () => ({ color: "#7a5232" })), leaf = lam("pLeaf", () => ({ color: "#5d9a3c" }));
  b.add(new THREE.CylinderGeometry(0.75, 0.75, 0.04, 16).scale(1.3, 1, 1).translate(0, 0.02, 0), leaf);
  for (let i = 0; i < 9; i++) { const a = r() * Math.PI * 2, d = r() * 0.55; b.add(new THREE.SphereGeometry(0.13, 10, 8).scale(2.2, 0.6, 0.8).rotateY(a).translate(Math.cos(a) * d, 0.1 + (i % 3) * 0.08, Math.sin(a) * d * 0.7), fish); }
  for (let i = 0; i < 8; i++) { const a = r() * Math.PI * 2, d = 0.4 + r() * 0.4; b.add(new THREE.SphereGeometry(0.09, 10, 8).translate(Math.cos(a) * d + 0.9, 0.09, Math.sin(a) * d * 0.6), lam("pFruit" + (i % 3), () => ({ color: fruitC[i % 3] }))); }
  for (let i = 0; i < 5; i++) b.add(new THREE.ConeGeometry(0.08, 0.04, 8).translate(-0.9 + r() * 0.3, 0.03, -0.2 + r() * 0.5), shell);
  for (let i = 0; i < 3; i++) b.add(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 6).rotateZ(Math.PI / 2).rotateY(r()).translate(-0.4 + r() * 0.3, 0.06, 0.45), wood);
  b.build(g, true);
  return g;
};
