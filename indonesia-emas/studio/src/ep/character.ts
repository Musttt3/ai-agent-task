// A character instance built from an exported glb (HERO or a variant). Bones are glTF nodes with rigid parts as
// children; the face system is node visibility + pivot transforms, mirroring characters/hero_rig.py.
// Character frame (three, Y-up): up = +Y, the face looks along +Z, the character's right hand side is -X.
import * as THREE from "three";

export type Preset = "SENANG" | "SENYUM" | "TERTAWA" | "KAGET" | "MIKIR" | "TIDUR";
// eyes, eye scale, look (yaw, pitch deg), brows (raise R, tilt R, raise L, tilt L), mouth
const PRESETS: Record<Preset, ["buka" | "tawa" | "tidur", number, [number, number], [number, number, number, number], number]> = {
  SENANG: ["buka", 1.0, [0, 0], [0.004, 0, 0.004, 0], 2],
  SENYUM: ["buka", 1.0, [0, 0], [0, 0, 0, 0], 1],
  TERTAWA: ["tawa", 1.0, [0, 0], [0.008, 0, 0.008, 0], 5],
  KAGET: ["buka", 1.16, [0, 0], [0.022, 0, 0.022, 0], 3],
  MIKIR: ["buka", 1.0, [14, 14], [-0.004, 14, 0.016, -8], 4],
  TIDUR: ["tidur", 1.0, [0, 0], [-0.004, 0, -0.004, 0], 0],
};
const MOUTHS = ["tutup", "senyum", "senang", "o", "miring", "tertawa"];
const rad = THREE.MathUtils.degToRad;
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0);

export type FaceState = { preset: Preset; mouth?: number; look?: [number, number]; blink?: boolean; eyeScale?: number; brows?: [number, number, number, number] };

export class Character {
  root = new THREE.Group();        // placed by the director (position / yaw / lying etc.)
  model: THREE.Object3D;
  private nodes: Record<string, THREE.Object3D> = {};
  /** node by Blender name (GLTFLoader strips "[].:/" from names, e.g. "thigh.R" -> "thighR") */
  n = new Proxy({} as Record<string, THREE.Object3D>, { get: (_t, k: string) => this.nodes[k.replace(/[\[\].:\/]/g, "").replace(/\s/g, "_")] });
  rest = new Map<THREE.Object3D, [THREE.Vector3, THREE.Quaternion, THREE.Vector3]>();
  scale: number;
  constructor(scene: THREE.Object3D, public kind: string) {
    this.model = scene.clone(true);
    this.model.traverse((o) => {
      this.nodes[o.name] = o;
      this.rest.set(o, [o.position.clone(), o.quaternion.clone(), o.scale.clone()]);
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true; m.receiveShadow = true;
        const mt = m.material as THREE.MeshPhysicalMaterial;
        if (mt && "sheen" in mt) { mt.sheen = 0; }          // the clay look has no fabric sheen in three
        if (mt) mt.envMapIntensity = 0.7;
      }
    });
    const hr = this.n["HERO_ROOT"];
    this.scale = (hr.userData?.skala as number) ?? 1;
    this.root.add(this.model);
    this.model.scale.setScalar(this.scale);
    this.root.visible = false;
    // contact shadow blob (always under the feet)
    const blob = new THREE.Mesh(new THREE.CircleGeometry(0.28, 32).rotateX(-Math.PI / 2), blobMaterial());
    blob.position.y = 0.004; blob.renderOrder = 1; blob.name = "BLOB"; this.root.add(blob); this.blob = blob;
  }
  blob: THREE.Mesh;
  reset() {
    for (const [o, [p, q, s]] of this.rest) { o.position.copy(p); o.quaternion.copy(q); o.scale.copy(s); }
    this.model.scale.setScalar(this.scale);
    this.root.position.set(0, 0, 0); this.root.quaternion.identity(); this.blob.visible = true;
  }
  private upd() { this.root.updateMatrixWorld(true); }
  /** rotate a node by `deg` about an axis given in the CHARACTER frame (X = character's left, Y up, Z forward) */
  turn(name: string, axis: THREE.Vector3, deg: number) {
    const o = this.n[name]; if (!o || !deg) return;
    this.upd();
    const rootQ = this.model.getWorldQuaternion(new THREE.Quaternion());
    const wAxis = axis.clone().applyQuaternion(rootQ).normalize();
    const pq = o.parent!.getWorldQuaternion(new THREE.Quaternion());
    const qw = new THREE.Quaternion().setFromAxisAngle(wAxis, rad(deg));
    const local = pq.clone().invert().multiply(qw).multiply(pq);
    o.quaternion.premultiply(local);
  }
  /** limb swings forward (positive) / back about the character's X axis */
  swing(name: string, deg: number) { this.turn(name, X, -deg); }
  /** CCD reach: rotate the chain so `effector` gets to `target` (world) */
  reach(chain: string[], effector: string, target: THREE.Vector3, iters = 14) {
    const eff = this.n[effector]; if (!eff) return;
    for (let k = 0; k < iters; k++) {
      for (const jn of chain) {
        const j = this.n[jn]; this.upd();
        const jp = j.getWorldPosition(new THREE.Vector3()), ep = eff.getWorldPosition(new THREE.Vector3());
        const a = ep.sub(jp).normalize(), b = target.clone().sub(jp).normalize();
        const qw = new THREE.Quaternion().setFromUnitVectors(a, b);
        const pq = j.parent!.getWorldQuaternion(new THREE.Quaternion());
        j.quaternion.premultiply(pq.clone().invert().multiply(qw).multiply(pq));
      }
    }
  }
  /** world point at an offset from the face centre (character frame, metres) */
  facePoint(off: [number, number, number]) { this.upd(); return this.n["WAJAH"].localToWorld(new THREE.Vector3(...off)); }
  handWorld(side: "R" | "L") { this.upd(); return this.n[side === "R" ? "Tangan_-1" : "Tangan_1"].getWorldPosition(new THREE.Vector3()); }

  // ---------------- poses ----------------
  walk(phase: number, amp = 1) {   // phase in steps (1 = one step = 12 frames)
    const s = Math.sin(phase * Math.PI), c = Math.cos(phase * Math.PI);
    this.swing("thigh.L", 22 * s * amp); this.swing("thigh.R", -22 * s * amp);
    this.swing("shin.L", -Math.max(0, -c) * 26 * amp); this.swing("shin.R", -Math.max(0, c) * 26 * amp);
    this.swing("upperarm.L", -16 * s * amp); this.swing("upperarm.R", 16 * s * amp);
    this.swing("forearm.L", 10 * amp); this.swing("forearm.R", 10 * amp);
    this.model.position.y = 0.015 * Math.abs(c) * amp;
  }
  sit(t = 1, legsStraight = false) {   // t: 0 standing .. 1 seated (thighs forward)
    for (const s of ["L", "R"]) { this.swing(`thigh.${s}`, 88 * t); this.swing(`shin.${s}`, legsStraight ? 0 : -88 * t); }
    this.swing("forearm.L", 20 * t); this.swing("forearm.R", 20 * t);
  }
  handToChin(t = 1) {
    if (t <= 0) return;
    const target = this.facePoint([-0.03, -0.175, 0.215]);
    const start = this.handWorld("R");
    this.reach(["upperarm.R", "forearm.R"], "Tangan_-1", start.lerp(target, t));
  }
  pointUp(t = 1) { this.swing("upperarm.R", 150 * t); this.turn("upperarm.R", new THREE.Vector3(0, 0, 1), -15 * t); }
  head(yaw = 0, pitch = 0, roll = 0) { this.turn("head", Y, yaw); this.turn("head", X, pitch); this.turn("head", new THREE.Vector3(0, 0, 1), roll); }

  // ---------------- face ----------------
  private show(name: string, on: boolean) { const o = this.n[name]; if (o) o.visible = on; }
  face(f: FaceState) {
    const [eyes, es0, look0, brows0, mouth0] = PRESETS[f.preset];
    const eyesState = f.blink && eyes === "buka" ? "tidur" : eyes;
    const look = f.look ?? look0, brows = f.brows ?? brows0, mouth = f.mouth ?? mouth0, es = f.eyeScale ?? es0;
    for (const side of [-1, 1]) {
      const open = eyesState === "buka";
      for (const p of ["Mata_", "Mata_Garis_", "Pupil_", "Kilau_"]) this.show(p + side, open);
      this.show("Kelopak_" + side, false);
      this.show("Mata_Tidur_" + side, eyesState === "tidur"); this.show("Mata_Tawa_" + side, eyesState === "tawa");
      const g = this.n["Mata_Grup_" + side]; if (g) g.scale.setScalar(es);
      const pv = this.n["Pupil_Pivot_" + side]; if (pv) pv.rotation.set(rad(look[1]), rad(look[0]), 0, "YXZ");
      const [raise, tilt] = side < 0 ? [brows[0], brows[1]] : [brows[2], brows[3]];
      const bp = this.n["Alis_Pivot_" + side];
      if (bp) { const r = this.rest.get(bp)!; bp.position.set(r[0].x, r[0].y + raise, r[0].z); bp.rotation.set(0, 0, -rad(tilt * side)); }
    }
    MOUTHS.forEach((nm, i) => this.show(`Mulut_${i}_${nm}`, i === mouth));
  }
}

let blobMat: THREE.MeshBasicMaterial | null = null;
function blobMaterial() {
  if (blobMat) return blobMat;
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, "rgba(0,0,0,0.55)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  blobMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, toneMapped: false });
  return blobMat;
}
