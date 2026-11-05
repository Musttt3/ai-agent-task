// The world: the five Blender sets (glb + per-frame json), their lights and environments, and the cast.
// Blender -> three light units: sun W/m2 -> directional intensity 1:1 (both give albedo*E/pi);
// point / spot W -> candela P/(4pi); area W (one-sided) -> spot candela P/pi. Shadows on each set's key light.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { staticFile } from "remotion";
import { SetName, Shot } from "./timing";
import { Character } from "./character";

type Keyed<T> = Record<string, T>;
export type SetJson = {
  set: SetName;
  cameras: Record<string, { start: number; end: number; show: string[]; keys: [number, number[], number[], number, number, number][] }>;
  nodes: Record<string, Keyed<[number[], number[], number[]]>>;
  emission: Record<string, Keyed<number>>;
  lights: Record<string, { type: string; color: number[]; energy: Keyed<number>; pos: number[]; dir: number[]; size: number; spot: number }>;
  standins: Record<string, Keyed<[number[], number, number]>>;
  marks: Record<string, number[]>;
  world?: { hdri: string[]; strength: number[]; sky: boolean };
};
/** value at frame f from a squeezed "frame -> value" map (last key at or before f) */
export function at<T>(m: Keyed<T>, f: number): T | undefined {
  let best: T | undefined, bk = -Infinity;
  for (const k in m) { const n = +k; if (n <= f && n > bk) { bk = n; best = m[k]; } }
  if (best === undefined) { let lo = Infinity; for (const k in m) if (+k < lo) { lo = +k; best = m[k]; } }
  return best;
}

export const SETS: SetName[] = ["kamar", "kota", "sekolah", "rumah_sakit", "desa"];
export const KINDS = ["hero", "anak_a", "anak_b", "anak_c", "perawat", "kakek", "petani", "guru", "pengemudi"];
const KEY_LIGHTS = ["MATAHARI", "BULAN", "SKYLIGHT_MATAHARI", "MATAHARI_TERBENAM"];

export type Loaded = { sets: Record<SetName, { scene: THREE.Group; json: SetJson }>; chars: Record<string, THREE.Group>; hdr: Record<string, THREE.DataTexture> };
export async function loadAll(): Promise<Loaded> {
  const gl = new GLTFLoader(), rl = new RGBELoader();
  const sets = {} as Loaded["sets"];
  await Promise.all(SETS.map(async (s) => {
    const [g, j] = await Promise.all([gl.loadAsync(staticFile(`export/${s}.glb`)), fetch(staticFile(`export/${s}.json`)).then((r) => r.json())]);
    sets[s] = { scene: g.scene, json: j };
  }));
  const chars: Record<string, THREE.Group> = {};
  await Promise.all(KINDS.map(async (k) => { chars[k] = (await gl.loadAsync(staticFile(`export/char_${k}.glb`))).scene; }));
  const hdr: Record<string, THREE.DataTexture> = {};
  for (const h of ["dikhololo_night", "kloofendal_48d_partly_cloudy_puresky"]) {
    const t = await rl.loadAsync(staticFile(`hdri/${h}.hdr`)); t.mapping = THREE.EquirectangularReflectionMapping; hdr[h] = t;
  }
  return { sets, chars, hdr };
}

/** sunset sky for the village (Blender used a physical sky there): equirect gradient, used as background + env */
function sunsetSky() {
  const c = document.createElement("canvas"); c.width = 16; c.height = 256; const g = c.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, "#3c3f78"); gr.addColorStop(0.32, "#8a6f9a"); gr.addColorStop(0.45, "#f0a060"); gr.addColorStop(0.5, "#ffcf8a");
  gr.addColorStop(0.52, "#6a5a4a"); gr.addColorStop(1, "#2a2420");
  g.fillStyle = gr; g.fillRect(0, 0, 16, 256);
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

type SetRuntime = {
  group: THREE.Group; json: SetJson; nodes: Map<string, THREE.Object3D>; mats: Map<string, THREE.MeshStandardMaterial[]>;
  lights: { L: THREE.Light; energy: Keyed<number>; k: number }[]; key?: THREE.DirectionalLight; keyDir?: THREE.Vector3;
};

export class World {
  root = new THREE.Group();
  sets = {} as Record<SetName, SetRuntime>;
  cast = new Map<string, Character>();         // one instance per stand-in name and set ("kota/HERO_07")
  env: Record<string, THREE.Texture> = {};
  bg: Record<string, THREE.Texture> = {};
  constructor(public L: Loaded, renderer: THREE.WebGLRenderer) {
    const pm = new THREE.PMREMGenerator(renderer);
    for (const [k, t] of Object.entries(L.hdr)) { this.env[k] = pm.fromEquirectangular(t).texture; this.bg[k] = t; }
    const sky = sunsetSky(); this.env.sunset = pm.fromEquirectangular(sky).texture; this.bg.sunset = sky;
    for (const s of SETS) this.buildSet(s);
  }
  private buildSet(s: SetName) {
    const { scene, json } = this.L.sets[s];
    const group = new THREE.Group(); group.name = "SET_" + s; group.add(scene); group.visible = false; this.root.add(group);
    const nodes = new Map<string, THREE.Object3D>(), mats = new Map<string, THREE.MeshStandardMaterial[]>();
    scene.traverse((o) => {
      nodes.set(o.name, o);
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true; m.receiveShadow = true;
        for (const mt of (Array.isArray(m.material) ? m.material : [m.material]) as THREE.MeshStandardMaterial[]) {
          const l = mats.get(mt.name) ?? []; if (!l.includes(mt)) l.push(mt); mats.set(mt.name, l);
          if (mt.name === "Emas") mt.envMapIntensity = 2.2;
        }
      }
    });
    const lights: SetRuntime["lights"] = []; let key: THREE.DirectionalLight | undefined; let keyDir: THREE.Vector3 | undefined;
    for (const [name, d] of Object.entries(json.lights)) {
      const col = new THREE.Color(d.color[0], d.color[1], d.color[2]);
      let L: THREE.Light, k = 1;
      const pos = new THREE.Vector3(...(d.pos as [number, number, number])), dir = new THREE.Vector3(...(d.dir as [number, number, number])).normalize();
      if (d.type === "SUN") {
        const dl = new THREE.DirectionalLight(col, 1); dl.position.copy(dir.clone().multiplyScalar(-60)); dl.target.position.set(0, 0, 0);
        group.add(dl.target); L = dl; k = 1.0;
        if (!key && KEY_LIGHTS.includes(name)) {
          key = dl; keyDir = dir.clone().multiplyScalar(-1); dl.castShadow = true; dl.shadow.mapSize.set(2048, 2048); dl.shadow.bias = -0.0004; dl.shadow.normalBias = 0.02;
        }
      } else if (d.type === "POINT") { const pl = new THREE.PointLight(col, 1, 0, 2); pl.position.copy(pos); L = pl; k = 1 / (4 * Math.PI); }
      else if (d.type === "SPOT") { const sl = new THREE.SpotLight(col, 1, 0, d.spot / 2, 0.5, 2); sl.position.copy(pos); sl.target.position.copy(pos.clone().add(dir)); group.add(sl.target); L = sl; k = 1 / (4 * Math.PI); }
      else { const sl = new THREE.SpotLight(col, 1, 0, THREE.MathUtils.degToRad(80), 1, 2); sl.position.copy(pos); sl.target.position.copy(pos.clone().add(dir)); group.add(sl.target); L = sl; k = 1 / Math.PI; }
      L.name = name; group.add(L); lights.push({ L, energy: d.energy, k });
    }
    this.sets[s] = { group, json, nodes, mats, lights, key, keyDir };
  }
  /** one character per stand-in name per set, created on first use */
  actor(set: SetName, standin: string, kind: string) {
    const id = `${set}/${standin}`;
    let c = this.cast.get(id);
    if (!c) { c = new Character(this.L.chars[kind], kind); this.sets[set].group.add(c.root); this.cast.set(id, c); }
    return c;
  }
  /** stand-in placement at frame f (y-up position, yaw, scale) */
  standin(set: SetName, name: string, f: number) {
    const s = this.sets[set].json.standins[name]; if (!s) return null;
    const v = at(s, f)!; return { pos: new THREE.Vector3(...(v[0] as [number, number, number])), yaw: v[1] };
  }
  /** pose the set for frame f and the camera for the shot; returns DOF focus distance and f-stop */
  update(f: number, shot: Shot, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    for (const s of SETS) this.sets[s].group.visible = s === shot.set;
    const R = this.sets[shot.set], J = R.json;
    for (const c of this.cast.values()) c.root.visible = false;
    // animated props
    for (const [name, keys] of Object.entries(J.nodes)) {
      const o = R.nodes.get(name); const v = at(keys, f); if (!o || !v) continue;
      o.position.set(v[0][0], v[0][1], v[0][2]); o.quaternion.set(v[1][0], v[1][1], v[1][2], v[1][3]); o.scale.set(v[2][0], v[2][1], v[2][2]);
    }
    for (const [name, keys] of Object.entries(J.emission)) {
      const v = at(keys, f) ?? 0; for (const m of R.mats.get(name) ?? []) m.emissiveIntensity = v;
    }
    for (const l of R.lights) l.L.intensity = (at(l.energy, f) ?? 0) * l.k;
    // environment
    let env = "kloofendal_48d_partly_cloudy_puresky", strength = J.world?.strength?.[0] ?? 1;
    if (shot.set === "kamar") { const night = f < 130; env = night ? "dikhololo_night" : env; strength = night ? 0.6 : 0.3; }
    if (shot.set === "desa") { env = "sunset"; strength = 0.6; }
    scene.environment = this.env[env]; scene.background = this.bg[env];
    scene.environmentIntensity = strength; scene.backgroundIntensity = shot.set === "desa" ? 1.0 : Math.max(strength, 0.5);
    // camera
    const C = J.cameras[shot.id]; const k = C.keys.find((x) => x[0] === f) ?? C.keys[C.keys.length - 1];
    cam.position.set(k[1][0], k[1][1], k[1][2]); cam.up.set(0, 1, 0); cam.lookAt(k[2][0], k[2][1], k[2][2]);
    cam.fov = k[3]; cam.near = 0.05; cam.far = 800; cam.updateProjectionMatrix();
    // key light shadow box follows what the camera looks at
    if (R.key) {
      const tgt = new THREE.Vector3(k[2][0], k[2][1], k[2][2]); const span = Math.min(60, Math.max(8, k[4] * 1.6));
      const dir = R.keyDir!.clone();
      R.key.target.position.copy(tgt); R.key.position.copy(tgt.clone().add(dir.multiplyScalar(60)));
      const sc = R.key.shadow.camera; sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span; sc.near = 1; sc.far = 160; sc.updateProjectionMatrix();
    }
    return { focus: k[4], fstop: k[5], show: C.show };
  }
}
