// Acting per shot (acting.md), frame-exact. Positions come from the Blender stand-ins/marks (Y-up: x, z_b, -y_b);
// facing is computed toward the camera or along the walk path. Every move starts with the eyes (look leads 3 frames).
import * as THREE from "three";
import { Shot, SetName, ramp, easeOut, easeIn, lerp, clamp01, wordFrames } from "./timing";
import { World } from "./world";
import { Character, Preset } from "./character";

const KIND: Record<string, string> = {
  FIG_warga_0: "petani", FIG_warga_1: "guru", FIG_warga_2: "pengemudi", FIG_warga_3: "kakek", FIG_warga_4: "anak_c",
  FIG_anak_0: "anak_a", FIG_anak_1: "anak_b", FIG_anak_2: "anak_c", FIG_anak_3: "anak_a", FIG_anak_4: "anak_b",
  FIG_perawat: "perawat", FIG_pasien: "kakek",
  FIG_warga_desa_0: "petani", FIG_warga_desa_1: "kakek", FIG_warga_desa_2: "guru",
  FIG_anak_desa_0: "anak_a", FIG_anak_desa_1: "anak_b", FIG_anak_desa_2: "anak_c",
};
const kindOf = (n: string) => (n.startsWith("HERO") ? "hero" : KIND[n] ?? "anak_a");
const B = (x: number, y: number, z: number) => new THREE.Vector3(x, z, -y);   // Blender coords -> Y-up

/** blink every 2-4 s (seeded per actor), never within `quiet` frames of the listed key frames */
function blinking(f: number, seed: number, quiet: number[] = []) {
  if (quiet.some((q) => Math.abs(f - q) < 10)) return false;
  const period = 70 + (seed * 37) % 50, ph = (seed * 53) % period;
  return (f + ph) % period < 4;
}
/** talking mouth for to-camera shots: open on word starts (stressed words), closed in pauses >= 6 frames */
function talk(f: number, a: number, b: number) {
  const w = wordFrames.find((x) => f >= x.a && f < x.b && x.a >= a && x.a <= b);
  if (!w) return 0;
  const k = (f - w.a) % 8; return k < 4 ? 2 : 1;
}

type Ctx = { f: number; shot: Shot; cam: THREE.PerspectiveCamera; W: World };
function place(c: Ctx, standin: string, override?: { pos?: THREE.Vector3; yaw?: number }) {
  const set = c.shot.set;
  const ch = c.W.actor(set, standin, kindOf(standin));
  ch.reset(); ch.root.visible = true;
  const s = c.W.standin(set, standin, c.f);
  const pos = override?.pos ?? s?.pos ?? new THREE.Vector3();
  ch.root.position.copy(pos);
  const yaw = override?.yaw ?? Math.atan2(c.cam.position.x - pos.x, c.cam.position.z - pos.z);   // face the camera
  ch.root.rotation.set(0, yaw, 0);
  return ch;
}
const yawAlong = (from: THREE.Vector3, to: THREE.Vector3) => Math.atan2(to.x - from.x, to.z - from.z);
const toward = (c: Ctx, from: THREE.Vector3, to: THREE.Vector3) => yawAlong(from, to);
function walkPath(ch: Character, a: THREE.Vector3, b: THREE.Vector3, t: number, f: number, f0: number, step = 12) {
  const p = a.clone().lerp(b, t); ch.root.position.copy(p); ch.root.rotation.y = yawAlong(a, b);
  if (t > 0 && t < 1) ch.walk((f - f0) / step);
}
/** sitting: hip at seat height `seatY`, thighs forward */
function seat(ch: Character, seatY: number, t = 1) { ch.root.position.y = seatY - 0.62 * ch.scale * t; ch.sit(t); }
const face = (ch: Character, preset: Preset, f: number, seed: number, extra: Partial<Parameters<Character["face"]>[0]> = {}, quiet: number[] = []) =>
  ch.face({ preset, blink: blinking(f, seed, quiet), ...extra });

/** pose everything for frame f */
export function direct(c: Ctx) {
  const f = c.f, id = c.shot.id;
  const B0 = c.W.sets[c.shot.set];
  const hp = B0.nodes.get("HP");
  switch (id) {
    case "02": {  // asleep under the blanket
      const ch = place(c, "HERO_tidur", { pos: new THREE.Vector3(0, 0.6, -0.24), yaw: 0 });
      ch.root.rotation.set(-Math.PI / 2, 0, 0); ch.blob.visible = false;
      const frown = f >= 106 && f < 112 ? -0.003 : -0.004;
      ch.face({ preset: "TIDUR", brows: [frown, 0, frown, 0] });
      break;
    }
    case "03": {  // wakes, glances at the window, sits bolt upright on "kaget" (182)
      const ch = place(c, "HERO_duduk_kasur", { yaw: 0 }); ch.blob.visible = false;
      const t = ramp(f, 182, 6, easeOut);                 // 0 lying -> 1 sitting
      const ang = -Math.PI / 2 * (1 - t), hip = new THREE.Vector3(0, 0.6, -0.87);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(ang, 0, 0));
      ch.root.quaternion.copy(q); ch.root.position.copy(hip.clone().sub(new THREE.Vector3(0, 0.63, 0).applyQuaternion(q)));
      ch.sit(t, true);
      const look: [number, number] = f >= 150 && f < 176 ? [-30, 6] : [0, 0];
      const preset: Preset = f < 139 ? "TIDUR" : f < 182 ? "SENYUM" : "KAGET";
      ch.face({ preset, look, eyeScale: preset === "SENYUM" ? 0.92 : undefined, blink: f >= 135 && f < 139 && f % 2 === 0 });
      if (f >= 198) ch.head(-25 * ramp(f, 198, 7), 0);
      break;
    }
    case "05": case "06": {  // seated on the edge of the bed, watching the TV
      const ch = place(c, "HERO_duduk_tepi", { pos: B(0, -0.02, 0.0), yaw: 0 });
      seat(ch, 0.54);
      if (id === "05") { ch.head(0, 3 * ramp(f, 265, 7, easeIn)); ch.root.position.z += 0.04 * ramp(f, 265, 15, easeOut); face(ch, "KAGET", f, 1, {}, [298]); ch.face({ preset: "KAGET", blink: f >= 298 && f < 302 }); }
      else {
        const big = ramp(f, 327, 6, easeOut);
        ch.face({ preset: f >= 345 ? "SENYUM" : "KAGET", eyeScale: f >= 345 ? 1.08 : 1.16 + 0.09 * big, brows: [0.022 + 0.006 * big, 0, 0.022 + 0.006 * big, 0], look: f < 322 ? [0, 0] : [-4, 2] });
      }
      break;
    }
    case "28": {  // in front of the golden map: glances back at it, turns to camera on "kapan", hand to chin
      const ch = place(c, "HERO_berdiri_peta", { pos: B(-0.75, 1.0, 0) });
      const turnT = ramp(f, 1652, 8, easeOut);
      ch.head(lerp(-55, 0, turnT), 0);
      const chin = ramp(f, 1690, 10, easeOut); ch.handToChin(chin);
      const lookBack: [number, number] = f < 1645 ? [-30, 0] : f < 1652 ? [-10, 0] : f > 1720 ? [10, 12 * ramp(f, 1720, 30)] : [0, 0];
      ch.face({ preset: f >= 1690 ? "MIKIR" : "SENYUM", mouth: f <= 1717 ? talk(f, 1639, 1717) : undefined, look: f >= 1690 ? undefined : lookBack, blink: f >= 1730 && f < 1734 });
      break;
    }
    case "07": {  // door opens, steps out, walks left revealing the street
      const ch = place(c, "HERO_07");
      const a = B(0.2, 7.3, 0.14), m = B(0.2, 6.1, 0.14), e = B(-2.6, 5.3, 0.14);
      if (f < 378) { ch.root.position.copy(a); ch.root.rotation.y = yawAlong(a, m); }
      else if (f < 400) walkPath(ch, a, m, (f - 378) / 22, f, 378);
      else walkPath(ch, m, e, (f - 400) / 40, f, 378);
      if (f >= 400) ch.head(25 * ramp(f, 400, 8), 0);
      face(ch, f >= 413 ? "SENANG" : "SENYUM", f, 2, { look: f < 372 ? [0, 0] : [10, 0] });
      break;
    }
    case "08": {  // looks up at the train
      const ch = place(c, "HERO_08");
      ch.head(lerp(20, -25, ramp(f, 440, 35)), -24 * ramp(f, 437, 8, easeOut));
      face(ch, "SENANG", f, 3, { look: [0, -18] }, [458]);
      break;
    }
    case "09": {  // crosses the zebra crossing
      const ch = place(c, "HERO_09");
      walkPath(ch, B(14, -2.6, 0), B(14, 1.6, 0), (f - 482) / 49, f, 482);
      face(ch, "SENANG", f, 4);
      break;
    }
    case "10": case "11": case "12": {  // phone: lift to the face, surprise; insert; lower and smile
      const ch = place(c, "HERO_10", { pos: B(-4, 5.0, 0.14) });
      const phone = B(-4, 4.6, 1.0);
      if (id === "10") {
        const up = ramp(f, 537, 8, easeOut);
        if (up > 0) ch.reach(["upperarm.R", "forearm.R"], "Tangan_-1", ch.handWorld("R").lerp(phone.clone().add(new THREE.Vector3(-0.04, -0.06, 0)), up));
        face(ch, f >= 578 ? "KAGET" : "SENYUM", f, 5, { look: f < 535 ? [-15, 15] : [0, 12] }, [578]);
      } else if (id === "11") {
        ch.reach(["upperarm.R", "forearm.R"], "Tangan_-1", phone.clone().add(new THREE.Vector3(-0.04, -0.06, 0)));
        face(ch, "SENANG", f, 5, { look: [0, 12] });
      } else {
        const down = ramp(f, 670, 10, easeOut);
        const hand = phone.clone().add(new THREE.Vector3(-0.04, -0.06 - 0.25 * down, 0.03 * down));
        ch.reach(["upperarm.R", "forearm.R"], "Tangan_-1", hand);
        if (hp) { hp.position.copy(hand.clone().add(new THREE.Vector3(0.04, 0.06, 0))); }
        face(ch, f >= 699 ? "SENANG" : "SENYUM", f, 5, { look: f < 670 ? [0, 12] : [0, 0], blink: f >= 714 && f < 718 });
      }
      break;
    }
    case "18": {  // slows, stops dead on "tunggu", eyes up on "dulu"
      const ch = place(c, "HERO_18");
      const a = B(6, 1.2, 0), b = B(6, 0, 0);
      const t = clamp01((f - 1061) / 12); const eased = 1 - Math.pow(1 - t, 2);
      ch.root.position.copy(a.clone().lerp(b, eased)); ch.root.rotation.y = yawAlong(a, b);
      if (f < 1071) ch.walk((f - 1061) / 12, 1 - t);
      ch.face({ preset: f >= 1088 ? "MIKIR" : "SENYUM", look: f >= 1085 ? [8, 16] : [0, 0], mouth: f >= 1088 ? 0 : undefined });
      break;
    }
    case "19": {  // hand to chin, thinking
      const ch = place(c, "HERO_19", { pos: B(6, 0, 0) });
      ch.handToChin(ramp(f, 1130, 10, easeOut)); ch.head(0, 0, 3 * ramp(f, 1166, 12));
      ch.face({ preset: "MIKIR", look: f < 1130 ? [6, 10] : [14, 14] });
      break;
    }
    case "20": {  // "Tentu nggak!": hand drops, three quick shakes, laughs
      const ch = place(c, "HERO_20", { pos: B(6, 0, 0) });
      ch.handToChin(1 - ramp(f, 1188, 8));
      const k = f - 1199; let shake = 0;
      if (k >= 0 && k < 12) { const d = 1 - k / 12; shake = 18 * Math.sin((k / 12) * 3 * 2 * Math.PI) * d; }
      ch.head(shake, f < 1199 ? 6 * ramp(f, 1190, 8) : 0);
      ch.face({ preset: f >= 1199 ? "TERTAWA" : "MIKIR" });
      break;
    }
    case "21": {  // walks toward camera explaining, open hand on "bukan"
      const ch = place(c, "HERO_21");
      walkPath(ch, B(-6.6, 5.2, 0.14), B(-4.9, 5.2, 0.14), (f - 1218) / 42, f, 1218);
      if (f >= 1240) ch.turn("upperarm.R", new THREE.Vector3(0, 0, 1), -35 * ramp(f, 1240, 6, easeOut));
      face(ch, "SENYUM", f, 6);
      break;
    }
    case "22": case "23": {  // ordinary people at the bus stop; the bus arrives in 23
      const show = c.W.sets.kota.json.cameras[id].show;
      show.forEach((n, i) => {
        const ch = place(c, n);
        if (n.startsWith("FIG_warga_")) {
          const k = +n.slice(-1);
          if (k === 0) ch.swing("upperarm.L", 120 * ramp(f, 1261 + i * 6, 10));            // farmer adjusts the caping
          if (k === 1) { ch.swing("upperarm.R", 50); ch.swing("forearm.R", 60); }        // teacher holds a book
          if (k === 2) ch.swing("upperarm.R", 40 * ramp(f, 1273, 8));                        // driver reaches for the handlebar
          if (k === 4 && id === "23") {                                                      // the kid walks to the bus and gets on
            const t = clamp01((f - 1350) / 30); const a = ch.root.position.clone(), b = B(-10.6, 2.9, 0.14);
            walkPath(ch, a, b, t, f, 1350, 8); if (f > 1380) ch.root.visible = false;
          }
          face(ch, "SENYUM", f, 10 + k);
        } else {
          face(ch, "SENYUM", f, 7, { look: f > 1380 ? [-20, 0] : [0, 0] });
          if (id === "23" && f >= 1340) ch.head(-20 * ramp(f, 1340, 10), 0);
        }
      });
      break;
    }
    case "24": {  // turns to camera on "ternyata", points up on "soal"; talks to camera
      const ch = place(c, "HERO_24");
      ch.root.rotation.y += THREE.MathUtils.degToRad(lerp(40, 0, ramp(f, 1399, 8, easeOut)));
      ch.pointUp(ramp(f, 1463, 6, easeOut));
      ch.face({ preset: "SENYUM", mouth: talk(f, 1394, 1469), look: f < 1397 ? [-20, 0] : [0, 0] });
      break;
    }
    case "13": {  // classroom: kids at desks turn to the screen, one raises a hand; HERO in the doorway
      c.W.sets.sekolah.json.cameras["13"].show.forEach((n, i) => {
        const ch = place(c, n, n.startsWith("FIG") ? { yaw: Math.PI } : {});
        if (n.startsWith("FIG")) {
          seat(ch, 0.45);
          ch.head(lerp(25 * (i % 2 ? 1 : -1), 0, ramp(f, 752 + i * 4, 8)), 0);
          if (i === 2) { ch.swing("upperarm.R", 160 * ramp(f, 773, 6, easeOut)); }
          face(ch, "SENANG", f, 20 + i);
        } else { ch.root.rotation.y += 0.6; face(ch, "SENYUM", f, 8); ch.head(-20, 0); }
      });
      break;
    }
    case "14": {  // corridor: HERO walks toward camera, nurse passes the other way, a nod at 820
      const h = place(c, "HERO_14"); walkPath(h, B(0.3, 9.2, 0), B(0.3, 6.6, 0), (f - 794) / 67, f, 794);
      if (f >= 816 && f < 826) h.head(0, 10 * Math.sin((f - 816) / 10 * Math.PI));
      face(h, "SENYUM", f, 9, {}, [820]);
      const n = place(c, "FIG_perawat"); walkPath(n, B(-0.7, 6.0, 0), B(-0.7, 10.5, 0), (f - 794) / 67, f, 794);
      if (f >= 818 && f < 828) n.head(0, 10 * Math.sin((f - 818) / 10 * Math.PI));
      face(n, "SENYUM", f, 30);
      break;
    }
    case "15": {  // waiting chairs: grandfather breathes out, relieved; HERO turns to him and smiles
      const k = place(c, "FIG_pasien", { yaw: -Math.PI / 2 }); seat(k, 0.49);
      k.turn("spine", new THREE.Vector3(1, 0, 0), -4 * Math.sin(Math.PI * clamp01((f - 862) / 34)));
      face(k, f >= 896 ? "SENYUM" : "KAGET", f, 31, { eyeScale: f >= 896 ? 1 : 1.05 });
      const h = place(c, "HERO_15", { yaw: -Math.PI / 2 }); seat(h, 0.49);
      h.head(30 * ramp(f, 898, 8, easeOut), 0);
      face(h, "SENYUM", f, 9, { look: f >= 895 ? [25, 0] : [0, 0] });
      break;
    }
    case "16": {
      const ch = place(c, "HERO_16"); ch.root.rotation.y += THREE.MathUtils.degToRad(lerp(60, 0, ramp(f, 925, 35)));
      face(ch, "SENANG", f, 11);
      break;
    }
    case "17": {
      const ch = place(c, "HERO_17");
      const turnTo = f < 1022 ? 30 : f < 1030 ? 10 : f < 1038 ? -10 : -25;
      ch.head(turnTo, -10);
      face(ch, "SENANG", f, 12, { look: [turnTo > 0 ? 15 : -15, -10] }, [1022, 1030, 1038]);
      break;
    }
    case "26": {  // villagers on the porch wave one after another; HERO waves too
      c.W.sets.desa.json.cameras["26"].show.forEach((n, i) => {
        const sp = c.W.standin("desa", n, c.f)!.pos;
        const ch = place(c, n, n.startsWith("FIG") ? { pos: new THREE.Vector3(sp.x, 1.3, -3.85) } : {});
        const w = ramp(f, 1549 + i * 5, 6, easeOut);
        ch.swing("upperarm.L", 150 * w); ch.turn("forearm.L", new THREE.Vector3(0, 0, 1), 25 * Math.sin((f - 1549) / 4) * w);
        face(ch, "SENYUM", f, 40 + i);
      });
      break;
    }
    case "27": {  // kids run along the bund; HERO laughs
      c.W.sets.desa.json.cameras["27"].show.forEach((n, i) => {
        const ch = place(c, n);
        if (n.startsWith("FIG_anak_desa")) { ch.root.rotation.y = -Math.PI / 2; ch.walk((f - 1593) / 8 + i * 0.4, 1.6); face(ch, "TERTAWA", f, 50 + i); }
        else { ch.turn("spine", new THREE.Vector3(1, 0, 0), -6 * ramp(f, 1608, 6)); face(ch, "TERTAWA", f, 13); }
      });
      break;
    }
  }
}
export type { Ctx };
