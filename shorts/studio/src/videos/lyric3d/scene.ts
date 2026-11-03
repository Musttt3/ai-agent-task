// 3D type + 3D icons over the untouched photo. The photo is a plain DOM layer under a transparent canvas;
// only the text, the icons and their soft shadows are drawn here.
import * as THREE from "three";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TTFLoader } from "three/examples/jsm/loaders/TTFLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { staticFile } from "remotion";
import { CaptionLine, HOOK_FACES, HOOK_SLOTS, HookLine, LINES } from "./lyrics";
import { IconKind, buildIcon } from "./icons";

export const PX = 201.5; // pixels per world unit at z = 0 (fov 30, camera at z = 10, 1080 px frame)
const wx = (px: number) => (px - 540) / PX;
const wy = (py: number) => (540 - py) / PX;

// ---------- audio cues (kicks) ----------
export const KICKS = [0.27, 0.94, 1.59, 2.25, 2.9, 3.59, 5.87, 7.21, 8.52, 9.86, 11.16, 12.48, 13.8, 15.13, 16.13, 16.78, 17.76, 19.09, 20.4, 21.72, 23.03, 24.36];
export const END = 25.78;

// ---------- easing ----------
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeOutBack = (x: number, s = 1.70158) => { x = clamp(x) - 1; return 1 + (s + 1) * x * x * x + s * x * x; };
const easeOutCubic = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const easeInCubic = (x: number) => Math.pow(clamp(x), 3);
const easeOutExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)));
const easeOutBounce = (x: number) => {
  x = clamp(x);
  const n = 7.5625, d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
  return n * (x -= 2.625 / d) * x + 0.984375;
};
const pulse = (t: number, cues: number[], k = 9) => cues.reduce((s, c) => s + (t >= c ? Math.exp(-k * (t - c)) : 0), 0);
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ---------- font / glyphs ----------
export type Kit = { font: Font };

export const loadKit = async (): Promise<Kit> => {
  const json = await new Promise<object>((res, rej) => new TTFLoader().load(staticFile("lyric3d/TitanOne-Regular.ttf"), res as (d: object) => void, undefined, rej));
  const font = new FontLoader().parse(json as never);
  return { font };
};

type Glyph = { geo: THREE.BufferGeometry; adv: number; h: number };

class GlyphCache {
  private map = new Map<string, Glyph>();
  constructor(private font: Font) {}
  get(ch: string): Glyph {
    let g = this.map.get(ch);
    if (g) return g;
    const data = (this.font as unknown as { data: { glyphs: Record<string, { ha: number }>; resolution: number } }).data;
    const adv = ((data.glyphs[ch]?.ha ?? data.glyphs["?"]?.ha ?? 600) / data.resolution);
    const geo = new TextGeometry(ch, { font: this.font, size: 1, depth: 0.32, curveSegments: 8, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.022, bevelSegments: 3 });
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    // pivot at the centre of the advance box, mid cap height, mid depth
    geo.translate(-adv / 2, -0.36, -(bb.max.z + bb.min.z) / 2);
    g = { geo, adv, h: bb.max.y - bb.min.y };
    this.map.set(ch, g);
    return g;
  }
}

// ---------- materials ----------
const faceMat = (color: string) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 });
const sideMat = (color: string) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, metalness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.15 });

type Letter = { obj: THREE.Group; mesh: THREE.Mesh; word: number; idx: number; x: number; y: number; h: number };

type Page = { group: THREE.Group; letters: Letter[]; words: number[]; start: number; end: number; cy: number; idx: number };

type CaptionRig = { line: CaptionLine; pages: Page[]; white: THREE.Material; accent: THREE.Material; side: THREE.Material };

type HookWord = { group: THREE.Group; letters: Letter[]; slot: (typeof HOOK_SLOTS)[number]; t0: number; i: number };
type HookRig = { line: HookLine; words: HookWord[] };

type IconInst = { kind: IconKind; obj: THREE.Group; x: number; y: number; size: number; tin: number; tout: number; fall?: boolean; seed: number };

// Icon schedule: px positions in the side margins (clear of the face), entries on kicks.
const ICONS: Omit<IconInst, "obj" | "seed">[] = [
  { kind: "droplet", x: 98, y: 560, size: 95, tin: 0.27, tout: 4.3 },
  { kind: "leaf", x: 985, y: 520, size: 115, tin: 0.94, tout: 4.3 },
  { kind: "sparkle", x: 115, y: 330, size: 70, tin: 1.59, tout: 4.3 },
  { kind: "note", x: 978, y: 770, size: 100, tin: 2.25, tout: 4.3 },
  { kind: "sun", x: 972, y: 330, size: 120, tin: 5.87, tout: 10.25 },
  { kind: "cloud", x: 112, y: 380, size: 140, tin: 5.87, tout: 10.25 },
  { kind: "droplet", x: 985, y: 610, size: 80, tin: 7.21, tout: 10.25 },
  { kind: "leaf", x: 92, y: 640, size: 105, tin: 8.52, tout: 10.25 },
  { kind: "note", x: 72, y: 950, size: 85, tin: 11.16, tout: 14.85 },
  { kind: "note", x: 1005, y: 950, size: 85, tin: 12.48, tout: 14.85 },
  { kind: "sparkle", x: 540, y: 250, size: 60, tin: 13.8, tout: 14.85 },
  { kind: "droplet", x: 95, y: 250, size: 75, tin: 15.13, tout: 18.25, fall: true },
  { kind: "droplet", x: 990, y: 300, size: 70, tin: 15.6, tout: 18.25, fall: true },
  { kind: "droplet", x: 120, y: 420, size: 60, tin: 16.13, tout: 18.25, fall: true },
  { kind: "droplet", x: 965, y: 450, size: 85, tin: 16.78, tout: 18.25, fall: true },
  { kind: "leaf", x: 92, y: 520, size: 110, tin: 17.76, tout: 21.15 },
  { kind: "leaf", x: 990, y: 540, size: 110, tin: 19.09, tout: 21.15 },
  { kind: "cloud", x: 990, y: 770, size: 120, tin: 20.4, tout: 21.15 },
  { kind: "heart", x: 92, y: 300, size: 85, tin: 21.72, tout: 25.45 },
  { kind: "sparkle", x: 985, y: 290, size: 70, tin: 21.72, tout: 25.45 },
  { kind: "heart", x: 1000, y: 570, size: 75, tin: 23.03, tout: 25.45 },
  { kind: "note", x: 80, y: 560, size: 85, tin: 23.03, tout: 25.45 },
  { kind: "sun", x: 90, y: 820, size: 95, tin: 24.36, tout: 25.45 },
  { kind: "sparkle", x: 995, y: 800, size: 80, tin: 24.36, tout: 25.45 },
];

const ZONE_Y = { top: [148, 252], bottom: [768, 866] } as const;
const MAX_ROW_W = 4.5; // world units (~900 px)

export class World {
  root = new THREE.Group();
  private glyphs: GlyphCache;
  private captions: CaptionRig[] = [];
  private hooks: HookRig[] = [];
  private icons: IconInst[] = [];
  key: THREE.DirectionalLight;

  constructor(kit: Kit) {
    this.glyphs = new GlyphCache(kit.font);

    // lights
    this.root.add(new THREE.HemisphereLight("#ffffff", "#2b5a52", 0.9));
    this.key = new THREE.DirectionalLight("#fff6e8", 2.4);
    this.key.position.set(-2.2, 3.2, 10);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    const sc = this.key.shadow.camera;
    sc.left = -3.4; sc.right = 3.4; sc.top = 3.4; sc.bottom = -3.4; sc.near = 1; sc.far = 30;
    this.key.shadow.bias = -0.0008;
    this.key.shadow.radius = 5;
    this.key.shadow.blurSamples = 16;
    this.root.add(this.key, this.key.target);
    const rim = new THREE.DirectionalLight("#bff7ff", 1.1);
    rim.position.set(4, -2, 4);
    this.root.add(rim);

    // shadow catcher just behind the type: darkens the photo where text and icons cast shadows
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ color: "#04140f", opacity: 0.3 }));
    catcher.position.z = -0.35;
    catcher.receiveShadow = true;
    this.root.add(catcher);

    for (const line of LINES) {
      if (line.kind === "caption") this.captions.push(this.buildCaption(line));
      else this.hooks.push(this.buildHook(line));
    }
    ICONS.forEach((ic, i) => {
      const obj = buildIcon(ic.kind);
      obj.visible = false;
      this.root.add(obj);
      this.icons.push({ ...ic, obj, seed: i * 7.3 + 1 });
    });
  }

  private makeLetters(text: string, size: number, white: THREE.Material, side: THREE.Material, word: number, startX: number, y: number, into: THREE.Group, list: Letter[]) {
    let x = startX;
    [...text].forEach((ch, idx) => {
      const g = this.glyphs.get(ch);
      if (ch !== " ") {
        const obj = new THREE.Group();
        const mesh = new THREE.Mesh(g.geo, [white, side]);
        mesh.castShadow = true;
        obj.add(mesh);
        obj.scale.setScalar(size);
        into.add(obj);
        list.push({ obj, mesh, word, idx, x: x + (g.adv * size) / 2, y, h: size });
      }
      x += g.adv * size - 0.02 * size;
    });
    return x;
  }

  private textWidth(text: string, size: number) {
    return [...text].reduce((w, ch) => w + this.glyphs.get(ch).adv * size - 0.02 * size, 0);
  }

  private buildCaption(line: CaptionLine): CaptionRig {
    const white = faceMat("#fffaf0"), accent = faceMat(line.accent), side = sideMat(line.side);
    const pages: Page[] = line.pages.map((rows, pi) => {
      const group = new THREE.Group();
      const letters: Letter[] = [];
      const space = 0.32;
      // fit each row to the max width, one size per page so rows match
      let size = 0.62;
      rows.forEach((r) => {
        const w = r.reduce((s, wi) => s + this.textWidth(line.words[wi], 1), 0) + space * (r.length - 1);
        size = Math.min(size, MAX_ROW_W / w);
      });
      const [y1, y2] = ZONE_Y[line.zone];
      rows.forEach((r, ri) => {
        const w = r.reduce((s, wi) => s + this.textWidth(line.words[wi], size), 0) + space * size * (r.length - 1);
        let x = -w / 2;
        const y = wy(rows.length === 1 ? (y1 + y2) / 2 : ri === 0 ? y1 : y2);
        r.forEach((wi) => { x = this.makeLetters(line.words[wi], size, white, side, wi, x, y, group, letters) + space * size; });
      });
      const words = rows.flat();
      const start = line.times[words[0]];
      const next = line.pages[pi + 1];
      const end = next ? line.times[next.flat()[0]] - 0.08 : line.end;
      group.visible = false;
      this.root.add(group);
      const cy = wy((y1 + y2) / 2);
      group.position.set(0, cy, 0);
      return { group, letters, words, start, end, cy, idx: pi };
    });
    return { line, pages, white, accent, side };
  }

  private buildHook(line: HookLine): HookRig {
    const side = sideMat("#14213d");
    const words: HookWord[] = line.words.map((w, i) => {
      let slot = HOOK_SLOTS[i];
      const face = faceMat(HOOK_FACES[i % HOOK_FACES.length]);
      const group = new THREE.Group();
      const letters: Letter[] = [];
      let size = (line.style === "stamp" ? 0.72 : 0.6) * slot.s;
      size = Math.min(size, 4.4 / this.textWidth(w, 1));
      const width = this.textWidth(w, size);
      this.makeLetters(w, size, face, side, i, -width / 2, 0, group, letters);
      // keep the whole word inside the frame with a margin
      const half = (width * PX) / 2 + 26;
      slot = { ...slot, x: Math.min(1080 - half, Math.max(half, slot.x)) };
      group.position.set(wx(slot.x), wy(slot.y), 0);
      group.visible = false;
      this.root.add(group);
      return { group, letters, slot, t0: line.times[i], i };
    });
    return { line, words };
  }

  // ---------- per-frame ----------
  update(t: number, cam: THREE.PerspectiveCamera) {
    const kick = clamp(pulse(t, KICKS, 8));
    for (const c of this.captions) this.updateCaption(c, t, kick);
    for (const h of this.hooks) this.updateHook(h, t, kick);
    for (const ic of this.icons) this.updateIcon(ic, t, kick);
    // the camera only breathes a little; the photo layer underneath never moves
    cam.position.set(0.08 * Math.sin(t * 0.5), 0.05 * Math.sin(t * 0.37), 10);
    cam.lookAt(0, 0, 0);
    cam.fov = 30;
    cam.near = 0.1;
    cam.far = 100;
    cam.updateProjectionMatrix();
  }

  private updateCaption(c: CaptionRig, t: number, kick: number) {
    const L = c.line;
    for (const p of c.pages) {
      const on = t >= p.start - 0.05 && t <= p.end + 0.7;
      p.group.visible = on;
      if (!on) continue;
      p.group.scale.setScalar(1 + 0.045 * kick);
      // gentle 3D tilt so the extrusion reads: look up at the top zone, down at the bottom zone
      const tiltX = L.zone === "top" ? -0.32 : 0.26;
      p.group.rotation.set(tiltX + 0.04 * Math.sin(t * 0.9), 0.22 * Math.sin(t * 0.55 + p.idx * 2.1 + p.start), 0.02 * Math.sin(t * 0.7));
      // the word being sung gets the accent face
      let cur = -1;
      for (const wi of p.words) if (t >= L.times[wi]) cur = wi;
      for (const l of p.letters) {
        const ws = L.times[l.word];
        const st = l.idx * 0.035;
        const tin = t - ws - st;
        const tout = t - p.end - l.idx * 0.02 - (l.word - p.words[0]) * 0.03;
        l.mesh.material = l.word === cur && t < p.end ? [c.accent, c.side] : [c.white, c.side];
        let x = l.x, y = l.y, z = 0, rx = 0, ry = 0, rz = 0, s = 1;
        if (tin < 0) { l.obj.visible = false; continue; }
        l.obj.visible = true;
        const a = clamp(tin / 0.42);
        if (L.style === "flip") {
          rx = (1 - easeOutBack(a, 2.2)) * -1.75;
          y -= 0.35 * (1 - easeOutCubic(a));
          s = Math.min(1, tin / 0.06);
        } else if (L.style === "fly") {
          const e = easeOutExpo(clamp(tin / 0.5));
          z = 6 * (1 - e);
          ry = (1 - e) * Math.PI * 2 * (l.idx % 2 ? 1 : -1);
          s = Math.min(1, tin / 0.05);
        } else if (L.style === "drop") {
          y += 2.4 * (1 - easeOutBounce(clamp(tin / 0.7)));
          rz = 0.4 * (1 - easeOutCubic(clamp(tin / 0.5))) * (hash(l.idx + l.word * 9) - 0.5);
          s = Math.min(1, tin / 0.05);
        } else if (L.style === "slide") {
          const e = easeOutExpo(clamp(tin / 0.55));
          x += 4 * (1 - e);
          y += 0.14 * Math.sin(9 * tin - l.idx * 0.9) * Math.exp(-2.6 * tin);
          ry = -1.2 * (1 - e);
          s = Math.min(1, tin / 0.05);
        } else if (L.style === "swing") {
          const e = easeOutBack(clamp(tin / 0.45), 1.6);
          y += 1.6 * (1 - e);
          // hang from the top of the letter and swing
          rz = 0.55 * Math.exp(-1.6 * tin) * Math.sin(8 * tin + l.idx * 0.7 + l.word);
          s = Math.min(1, tin / 0.05);
        }
        // idle float
        y += 0.025 * Math.sin(t * 2.4 + l.idx * 0.6 + l.word);
        if (tout > 0) {
          const o = clamp(tout / 0.38);
          const eo = easeInCubic(o);
          if (L.style === "flip") { rx += eo * 1.6; y -= 0.3 * eo; }
          else if (L.style === "fly") { z -= 4 * eo; ry += eo * 2; }
          else if (L.style === "drop") { y -= 3.5 * eo; rz += eo * (hash(l.idx * 3.1 + l.word) - 0.5) * 2; }
          else if (L.style === "slide") { x -= 4 * eo; }
          else { y += 1.2 * eo; }
          s *= 1 - eo;
          if (o >= 1) { l.obj.visible = false; continue; }
        }
        // swing pivots at the letter top: offset so the rotation reads as hanging
        if (L.style === "swing") {
          const top = 0.42 * l.h;
          l.mesh.position.set(0, -top / l.h, 0);
          y += top;
        }
        l.obj.position.set(x, y - p.cy, z);
        l.obj.rotation.set(rx, ry, rz);
        l.obj.scale.setScalar(l.h * Math.max(s, 0.0001));
      }
    }
  }

  private updateHook(h: HookRig, t: number, kick: number) {
    const L = h.line;
    const explode = t - L.end;
    for (const w of h.words) {
      const tin = t - w.t0;
      const on = tin >= 0 && explode < 0.8;
      w.group.visible = on;
      if (!on) continue;
      const big = w.i === h.words.length - 1;
      const baseX = wx(w.slot.x), baseY = wy(w.slot.y);
      let x = baseX, y = baseY, z = 0, s = 1, rz = (w.slot.rot * Math.PI) / 180, ry = -0.28 * Math.max(-1, Math.min(1, baseX / 2)), rx = 0.18 * Math.max(-1, Math.min(1, baseY / 2));
      if (L.style === "stamp") {
        const a = clamp(tin / 0.3);
        s = 1 + 1.4 * (1 - easeOutBack(a, 2.4));
        z = 2.5 * (1 - easeOutCubic(a));
        ry += (1 - easeOutCubic(clamp(tin / 0.45))) * Math.PI * 2;
        if (big) { rz += 0.12 * Math.sin(tin * 10) * Math.exp(-1.2 * tin); s *= 1 + 0.06 * Math.sin(tin * 14) * Math.exp(-0.8 * tin); }
      } else {
        const a = clamp(tin / 0.55);
        y -= 2.2 * (1 - easeOutBounce(a));
        const squash = Math.exp(-6 * tin) * Math.sin(tin * 26);
        w.group.scale.set(1 + 0.25 * squash, 1 - 0.25 * squash, 1);
        rx += -0.6 * (1 - easeOutCubic(a));
      }
      s *= 1 + 0.07 * kick;
      if (explode > 0) {
        const e = easeInCubic(clamp(explode / 0.6));
        const dx = baseX, dy = baseY - 0.1;
        const len = Math.hypot(dx, dy) + 0.3;
        x += (dx / len) * 4 * e;
        y += (dy / len) * 4 * e;
        z += 2 * e;
        ry += e * 3;
        s *= 1 - e;
      }
      w.group.position.set(x, y, z);
      w.group.rotation.set(rx, ry, rz);
      if (L.style === "stamp") w.group.scale.setScalar(Math.max(s, 0.0001));
      else w.group.scale.multiplyScalar(Math.max(s, 0.0001));
      // per-letter wobble on the big word
      w.letters.forEach((l) => {
        const wob = big ? 0.1 * Math.sin(t * 7 - l.idx * 0.8) * Math.min(1, tin * 2) : 0;
        l.obj.position.set(l.x, l.y + wob, 0);
        l.obj.rotation.set(0, 0, 0);
        l.obj.scale.setScalar(l.h);
      });
    }
  }

  private updateIcon(ic: IconInst, t: number, kick: number) {
    const tin = t - ic.tin;
    const tout = t - ic.tout;
    const on = tin >= 0 && tout < 0.35;
    ic.obj.visible = on;
    if (!on) return;
    let s = easeOutBack(clamp(tin / 0.45), 2.2);
    if (tout > 0) s *= 1 - easeInCubic(clamp(tout / 0.3));
    s *= 1 + 0.12 * kick;
    const size = ic.size / PX;
    let y = wy(ic.y) + 0.07 * Math.sin(t * 2.1 + ic.seed);
    if (ic.fall) y -= ((tin * 0.55) % 1.6);
    const x = wx(ic.x) + 0.04 * Math.sin(t * 1.3 + ic.seed * 2);
    ic.obj.position.set(x, y, 0.2);
    const flourish = (1 - easeOutCubic(clamp(tin / 0.7))) * Math.PI * 2;
    ic.obj.rotation.set(0.15 * Math.sin(t * 1.1 + ic.seed), flourish + 0.5 * Math.sin(t * 0.9 + ic.seed), 0.12 * Math.sin(t * 1.7 + ic.seed));
    ic.obj.scale.setScalar(Math.max(size * s, 0.0001));
  }
}
