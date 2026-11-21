// The story beat by beat: one beat per narration sentence (timing.ts). Each beat names its set and light, the world state
// (cart lid, signs, generator, fire, night), its 2-3 camera sub-angles cut on words, and who stands where doing what.
import { LightName } from "./lights";
import { Key, V3, wide, two, ms, cu, ins, low, high, frame, add3 } from "./cam";
import { Ctx, WHO } from "./cast";
import { ss, wf } from "./timing";
import { SCHOOL_X } from "./build";

export type SetKind = "school" | "valley" | "river";
export type WS = {
  set: SetKind; lid: number; melt: boolean; board: string | null; top: string | null; gauge: number; genOn: boolean;
  fire: boolean; stars: boolean; moon: boolean; fish: boolean; cart: V3;
};
export type Beat = {
  si: number; set: SetKind; light: LightName; sun?: [number, number]; flash?: boolean;
  cams: (a: number) => Key[]; stage: (c: Ctx) => void; ws?: (f: number) => Partial<WS>; kicks?: number[]; cInf?: number;
};

// ---- places ----
const SX = SCHOOL_X;
export const CART: V3 = [0, 0, 0];
export const CART_S: V3 = [SX + 1.2, 0, 1.4];
const K: V3 = [-1.35, 0, 0.55];                 // where you stand by the cart in the valley
const KS: V3 = [SX - 0.15, 0, 1.75];            // ... and in front of the school
const F: V3 = [1.25, 0, 1.45];                  // your prehistoric friend's usual spot
const GEN: V3 = [1.55, 0, -0.2];
export const GEN_POS = GEN;
const up = (p: V3, y: number): V3 => [p[0], y, p[2]];
const open = (f: number, at: number, len = 10) => Math.max(0, Math.min(1, (f - at) / len));

// ---- chapter 1: the hook (sentences 0-7) ----
export const BEATS: Beat[] = [
  { // 0: "Apa jadinya kalau kamu punya gerobak es krim, lengkap dengan freezer dan ratusan es krim, tetapi bukan untuk berjualan di depan sekolah?"
    si: 0, set: "school", light: "day",
    cams: (a) => [
      { f: a, s: wide(add3(CART_S, [-0.6, 0, 0]), a, { az: 18, d: 8.5, h: 2.4, orbit: -8 }) },
      { f: wf(0, "freezer") - 4, cut: true, s: ins(up(CART_S, 1.32), wf(0, "freezer"), { az: 10, d: 1.25, h: 0.95, fov: 32 }) },
      { f: wf(0, "tetapi") - 3, cut: true, s: ms(add3(KS, [0.5, 0, 0]), wf(0, "tetapi"), { az: -12, d: 3.6 }) },
      { f: wf(0, "sekolah") - 6, dur: 18, s: low(add3(KS, [0.9, 0, -0.6]), wf(0, "sekolah"), { az: -18, d: 4.4, ly: 2.2, roll: 0.06 }) },
    ],
    ws: (f) => ({ lid: open(f, wf(0, "freezer") - 6) }),
    stage: (c) => {
      const no = c.f >= wf(0, "bukan") - 3;
      c.P(WHO.kamu, KS[0], KS[2], { expr: no ? "whistle" : "grin", facing: no ? 1 : 0, swaps: [wf(0, "bukan")], hop: [wf(0, "kamu")] });
      c.badge("ratusan", "RATUSAN ES KRIM", "LENGKAP DENGAN FREEZER", "#2f7fd0", "#ffffff", CART_S[0] - 0.2, 2.35, CART_S[2] + 0.3, 1.5, wf(0, "ratusan") - 3, wf(0, "tetapi") - 3);
      c.badge("bukan", "BUKAN DI SINI!", "BUKAN DI DEPAN SEKOLAH", "#e2453c", "#ffffff", KS[0] + 1.6, 2.5, KS[2] - 1.2, 1.7, wf(0, "bukan") - 2);
    },
  },
  { // 1: "Melainkan 30 ribu tahun lalu, ketika manusia masih berburu, mengumpulkan makanan, dan belum mengenal listrik."
    si: 1, set: "valley", light: "golden", flash: true, sun: [40, 24],
    cams: (a) => [
      { f: a, s: frame([-3.4, 0.6, 1.6], a, 2.6, 0.9, 0.75, { az: 12, fov: 30, rise: 2.6, rate: 0.0012 }) },
      { f: wf(1, "berburu") - 4, cut: true, s: two([-6.5, 0, -4.5], wf(1, "berburu"), { az: 35, d: 7, h: 1.9, orbit: 10 }) },
      { f: wf(1, "mengumpulkan") - 3, cut: true, s: ms([4.6, 0, -3.2], wf(1, "mengumpulkan"), { az: -20, d: 3.4 }) },
      { f: wf(1, "strek") - 8, cut: true, s: ins([0.3, 0.15, 1.15], wf(1, "strek"), { az: 25, d: 1.0, h: 0.45, fov: 30 }) },
    ],
    stage: (c) => {
      const tw = (c.f - c.a) / 60;
      [[-7.6, -5.2], [-6.2, -4.4], [-5.0, -5.6]].forEach(([x, z], i) =>
        c.P(WHO.tribe(i * 2), x + tw * 0.25, z, { expr: "stern", prop: "spear", mode: "stroll", phase: c.t * 1.6 + i * 0.3, facing: 1 }));
      c.P(WHO.tribe(1), 4.6, -3.2, { expr: "smile", prop: "basket" });
      c.P(WHO.tribe(4), 6.2, -4.4, { expr: "neutral", prop: "leaf" });
      c.badge("listrik", "LISTRIK?", "BELUM ADA", "#ffd43b", "#241726", 0.75, 0.62, 1.05, 0.62, wf(1, "strek") - 2);
    },
  },
  { // 2: "Biasanya, anak-anak berlari menghampirimu sambil membawa uang."
    si: 2, set: "school", light: "day",
    cams: (a) => [
      { f: a, s: frame([SX - 0.7, 0, -1.4], a, 4.6, 0.85, 1.0, { az: -14, fov: 31, roll: 0.05, rate: 0.003 }) },
      { f: wf(2, "uang") - 6, cut: true, s: ins([SX - 0.55, 0.98, 0.15], wf(2, "uang"), { az: 0, d: 0.9, h: 0.25, fov: 30 }) },
    ],
    ws: () => ({ lid: 1 }),
    stage: (c) => {
      const k = Math.min(1, (c.f - c.a) / 85);
      [[-2.2, 0], [-0.8, 0.6], [0.6, 0.2], [1.8, 0.9]].forEach(([dx, dd], i) => {
        const z = -4.8 + k * (4.6 - dd);
        c.P(WHO.school(i), SX + dx * (1 - k * 0.6) - 0.4, z, { expr: i % 2 ? "laugh" : "grin", prop: "money", mode: k < 1 ? "march" : "stand", phase: c.t * 2.2 + i * 0.25, wave: 0.6 });
      });
      c.P(WHO.kamu, SX + 2.6, 1.2, { expr: "grin", facing: -1 });
    },
  },
  { // 3: "Sekarang, yang menghampiri justru manusia purba dengan tombak kayu."
    si: 3, set: "valley", light: "golden", sun: [40, 24],
    cams: (a) => [
      { f: a, s: frame(add3(K, [0.6, 0, -2.5]), a, 4.8, 1.7, 1.15, { az: 172, fov: 30, rate: 0.0022, dx: -0.4 }) },
      { f: wf(3, "tomba") - 4, cut: true, s: low([0.9, 0, -2.6], wf(3, "tomba"), { az: 8, d: 2.5, ly: 1.5, roll: 0.07 }) },
    ],
    ws: () => ({ lid: 0 }),
    kicks: [wf(3, "tomba")],
    stage: (c) => {
      const k = Math.min(1, (c.f - c.a) / 100);
      c.P(WHO.purba, 0.9, -4.8 + 2.2 * k, { expr: "stern", prop: "spear", mode: k < 1 ? "stroll" : "stand", phase: c.t * 1.6 });
      c.P(WHO.tribe(0), -0.9, -5.6 + 2.2 * k, { expr: "stern", prop: "spear", mode: k < 1 ? "stroll" : "stand", phase: c.t * 1.6 + 0.4 });
      c.P(WHO.tribe(3), 2.4, -6.0 + 2.2 * k, { expr: "neutral", prop: "spear", mode: k < 1 ? "stroll" : "stand", phase: c.t * 1.6 + 0.2 });
      c.P(WHO.kamu, K[0], K[2], { expr: "nervous", facing: -1 });
    },
  },
  { // 4: "Mereka belum pernah melihat es krim, apalagi gerobak yang mengeluarkan hawa dingin."
    si: 4, set: "valley", light: "golden", sun: [40, 24],
    cams: (a) => [
      { f: a, s: frame([0.2, 0, -0.9], a, 3.6, 2.0, 1.25, { az: 180, fov: 30, rate: 0.0026 }) },
      { f: wf(4, "hawa") - 6, cut: true, s: ins([0.1, 1.5, 0.1], wf(4, "hawa"), { az: 18, d: 1.45, h: 0.3, fov: 32 }) },
    ],
    ws: () => ({ lid: 1 }),
    stage: (c) => {
      c.P(WHO.purba, 0.75, -1.45, { expr: "shock", prop: "spear", look: -0.4 });
      c.P(WHO.tribe(0), -0.7, -1.55, { expr: "dazed", prop: "spear" });
      c.P(WHO.tribe(3), 2.05, -1.9, { expr: "shock", prop: "spear" });
      c.P(WHO.kamu, K[0], K[2], { expr: "grin", facing: 1 });
      c.puffs("cold4", 0, 1.38, 0.05, { n: 6, period: 34, life: 34, size: 0.55, rise: 0.55, drift: [0.1, -0.25] });
      c.badge("dingin", "-18°C", "HAWA DINGIN", "#bfe8ff", "#241726", -0.4, 2.0, 0.1, 0.8, wf(4, "dingin") - 2);
    },
  },
  { // 5: "Kedengarannya keren, bukan?"
    si: 5, set: "valley", light: "golden", sun: [40, 24],
    cams: (a) => [{ f: a, s: cu(K, a, { az: 25, orbit: -16, rate: 0.004 }) }],
    ws: () => ({ lid: 1 }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "grin", facing: 1, hop: [ss(5) + 6] });
      c.mark("!", "#ffd43b", K[0] + 0.55, 2.0, K[2], 0.45, ss(5) + 4);
    },
  },
  { // 6: "Kamu bisa menjadi penjual es krim pertama di zaman purba."
    si: 6, set: "valley", light: "golden", sun: [40, 24],
    cams: (a) => [
      { f: a, s: ms(add3(K, [0.6, 0, 0]), a, { az: 12, d: 3.4 }) },
      { f: wf(6, "pertama") - 8, dur: 26, s: frame([-0.4, 0, 0], wf(6, "pertama"), 7.6, 1.0, 1.75, { az: 4, fov: 32, rise: 1.0, rate: 0.0016 }) },
    ],
    ws: () => ({ lid: 0, top: "first" }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "laugh", wave: 1 });
      c.P(WHO.purba, F[0], F[2], { expr: "dazed", prop: "spear" });
      c.P(WHO.tribe(0), -2.6, -1.2, { expr: "smile", prop: "spear" });
      c.P(WHO.tribe(1), 2.7, -0.8, { expr: "smile" });
    },
  },
  { // 7: "Tapi tunggu, di dunia tanpa pom bensin, bahkan satu es krim yang tidak laku bisa menjadi awal bencana."
    si: 7, set: "valley", light: "golden", sun: [40, 24],
    cams: (a) => [
      { f: a, s: cu(K, a, { az: -20, roll: -0.06, rate: 0.0045, punch: 0.009 }) },
      { f: wf(7, "pom") - 6, cut: true, s: ins([GEN[0] - 0.08, 0.4, GEN[2] + 0.25], wf(7, "pom"), { az: 6, d: 1.5, h: 0.14, fov: 30 }) },
      { f: wf(7, "awal") - 6, cut: true, s: high([0, 0, 0.4], wf(7, "awal"), { az: 20, d: 6.5, h: 5.6, rate: 0.003, roll: 0.05 }) },
    ],
    ws: () => ({ top: null }),
    kicks: [wf(7, "tunggu"), wf(7, "bencana")],
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: c.f < wf(7, "bencana") - 3 ? "nervous" : "shock", facing: 1, swaps: [wf(7, "bencana")] });
      c.P(WHO.purba, F[0], F[2], { expr: "neutral", prop: "spear" });
      c.badge("pom", "POM BENSIN TERDEKAT:", "30.000 TAHUN LAGI", "#ffd43b", "#241726", GEN[0] - 0.26, 0.66, GEN[2] + 0.32, 0.42, wf(7, "pom") - 2);
      c.badge("bencana", "AWAL BENCANA", "SATU ES KRIM TIDAK LAKU...", "#e2453c", "#ffffff", 0.9, 1.7, 1.6, 2.0, wf(7, "bencana") - 3);
    },
  },
];

export const DEFAULT_WS: WS = { set: "valley", lid: 0, melt: false, board: null, top: null, gauge: 0, genOn: true, fire: false, stars: false, moon: false, fish: false, cart: CART };
