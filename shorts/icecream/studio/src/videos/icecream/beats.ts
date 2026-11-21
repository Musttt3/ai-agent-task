// The story beat by beat: one beat per narration sentence (timing.ts). Each beat names its set and light, the world state
// (cart lid, signs, generator, fire, night), its 2-3 camera sub-angles cut on words, and who stands where doing what.
import { LightName } from "./lights";
import { Key, V3, wide, two, ms, cu, ins, low, high, frame, add3 } from "./cam";
import { Ctx, WHO } from "./cast";
import { ss, wf } from "./timing";
import { SCHOOL_X, RIVER_X } from "./build";

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
export const PILE_POS: V3 = [2.3, 0, 2.2];
/** the cart pushed under the shade tree (build.ts, tree at -9, 2.4) from chapter 6 on */
/** the river set's x offset (build.ts RIVER_X) */
const RV = RIVER_X;
export const CSH: V3 = [-7.9, 0, 3.0];
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

  // ---- chapter 2: arrival in the valley, the cart, the first ice cream (sentences 8-21) ----
  { // 8: "Semuanya bermula ketika kamu dan teman purbamu tiba-tiba muncul di sebuah lembah dekat pantai."
    si: 8, set: "valley", light: "day", flash: true,
    cams: (a) => [
      { f: a, s: high([0, 0, -1.5], a, { az: 0, d: 10, h: 7.5, fov: 34, rate: 0.0012 }) },
      { f: wf(8, "tiba") - 4, cut: true, s: two([0, 0, 0.8], wf(8, "tiba"), { az: -8, d: 6.2, h: 1.6 }) },
      { f: wf(8, "pantai") - 10, cut: true, s: frame([0, 0, -12], wf(8, "pantai"), 16, 3.2, 0.6, { az: 175, fov: 34, rate: 0.0012, orbit: -6 }) },
    ],
    stage: (c) => {
      const pop = wf(8, "tiba");
      if (c.f >= pop) {
        c.P(WHO.kamu, K[0], K[2], { expr: c.f < pop + 20 ? "shock" : "nervous", facing: 1, hop: [pop] });
        c.P(WHO.purba, F[0], F[2], { expr: c.f < pop + 20 ? "dazed" : "neutral", prop: "spear", hop: [pop + 2] });
      }
      for (const [x, z] of [[K[0], K[2]], [F[0], F[2]], [0, 0.5]] as const) { c.burst(x, 1.1, z, 1.8, pop - 2, "#ffffff"); c.puffs("pop" + x, x, 0.3, z, { n: 3, period: 90, life: 24, size: 1.0, rise: 0.6, col: "#f2efe6", on: c.f >= pop - 2 && c.f < pop + 24 }); }
    },
    ws: (f) => ({ cart: f >= wf(8, "tiba") - 2 ? CART : [0, -50, 0] }),
  },
  { // 9: "Kamu masih memakai kaos kuning, celana pendek, dan sandal jepit."
    si: 9, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: frame(K, a, 1.9, 1.4, 1.15, { az: 15, fov: 28, rate: 0.003 }) },
      { f: wf(9, "celana") - 4, cut: true, s: frame(K, wf(9, "celana"), 1.9, 0.75, 0.62, { az: -12, fov: 28, rate: 0.003, roll: 0.04 }) },
      { f: wf(9, "sandal") - 4, cut: true, s: ins([K[0], 0.08, K[2] + 0.05], wf(9, "sandal"), { az: 20, d: 0.85, h: 0.22, fov: 30 }) },
    ],
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "nervous", facing: 1 });
      c.badge("kaos", "KAOS KUNING", "", "#ffd43b", "#241726", K[0] + 0.55, 1.62, K[2] + 0.25, 0.48, wf(9, "kaos") - 2);
      c.badge("celana", "CELANA PENDEK", "", "#2f7fd0", "#ffffff", K[0] + 0.55, 0.78, K[2] + 0.25, 0.5, wf(9, "celana") - 2);
      c.badge("sandal", "SANDAL JEPIT", "", "#2fa0d8", "#ffffff", K[0] + 0.3, 0.3, K[2] + 0.2, 0.3, wf(9, "sandal") - 2);
    },
  },
  { // 10: "Di sampingmu berdiri gerobak es krim modern, dilengkapi freezer bertenaga generator kecil."
    si: 10, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: frame([-0.6, 0, 0.3], a, 4.8, 1.5, 1.1, { az: -32, fov: 30, orbit: 26, rate: 0.0018 }) },
      { f: wf(10, "freezer") - 4, cut: true, s: ins([0, 1.32, 0.1], wf(10, "freezer"), { az: 0, d: 1.35, h: 0.75, fov: 32 }) },
      { f: wf(10, "generator") - 6, cut: true, s: low(GEN, wf(10, "generator"), { az: 30, d: 1.6, h: 0.35, ly: 0.35, fov: 30 }) },
    ],
    ws: (f) => ({ lid: open(f, wf(10, "freezer") - 8, 12) }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "smile", facing: 1 });
      c.badge("gen", "GENERATOR KECIL", "BENSIN", "#d9382e", "#ffffff", GEN[0] - 0.35, 0.95, GEN[2] + 0.35, 0.55, wf(10, "generator") - 2);
    },
  },
  { // 11: "Tangki bahan bakarnya penuh, dan seluruh isinya masih membeku."
    si: 11, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: ins([GEN[0] - 0.08, 0.4, GEN[2] + 0.25], a, { az: -8, d: 1.4, h: 0.12, fov: 30 }) },
      { f: wf(11, "seluruh") - 4, cut: true, s: ins([0, 1.3, 0.05], wf(11, "seluruh"), { az: 8, d: 1.15, h: 0.9, fov: 32, roll: -0.04 }) },
    ],
    ws: () => ({ lid: 1 }),
    stage: (c) => {
      c.badge("penuh", "PENUH!", "", "#3fb950", "#ffffff", GEN[0] - 0.3, 0.64, GEN[2] + 0.32, 0.32, wf(11, "penuh") - 2);
      c.badge("beku", "-18°C", "SEMUA MASIH BEKU", "#bfe8ff", "#241726", 0.55, 1.65, 0.35, 0.55, wf(11, "membe") - 2);
      c.puffs("cold11", 0, 1.36, 0.05, { n: 5, period: 36, life: 36, size: 0.45, rise: 0.4, drift: [0.05, 0.2], col: "#e8f6ff" });
    },
  },
  { // 12: "Teman purbamu mendekat sambil memegang tombak."
    si: 12, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: low([1.6, 0, 1.0], a, { az: 40, d: 3.2, h: 0.55, ly: 1.4, roll: 0.06 }) },
      { f: wf(12, "memegang") - 4, cut: true, s: ins([2.05, 1.25, 1.3], wf(12, "memegang"), { az: 30, d: 1.0, h: 0.5, fov: 30 }) },
    ],
    stage: (c) => {
      const k = Math.min(1, (c.f - c.a) / 60);
      c.P(WHO.purba, 3.6 - 2.0 * k, 2.4 - 1.0 * k, { expr: "stern", prop: "spear", mode: k < 1 ? "stroll" : "stand", phase: c.t * 1.6, facing: -1 });
      c.P(WHO.kamu, K[0], K[2], { expr: "neutral", facing: 1 });
    },
  },
  { // 13: "Dia mengetuk dinding freezer, kemudian menempelkan pipi ke permukaannya."
    si: 13, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: ms([1.2, 0, 0.6], a, { az: 25, d: 3.0, h: 1.3, ly: 1.1 }) },
      { f: wf(13, "menempelkan") - 4, cut: true, s: cu([0.95, 0, 0.75], wf(13, "menempelkan"), { az: 40, d: 1.4, h: 1.2, ly: 1.05, roll: -0.05 }) },
    ],
    stage: (c) => {
      const cheek = c.f >= wf(13, "menempelkan") - 3, knock = Math.floor((c.f - c.a) / 6) % 2;
      if (!cheek) c.P(WHO.purba, 1.55, 0.95, { expr: "stern", prop: "reach", wave: knock, mirror: true });
      else c.P(WHO.purba, 1.12, 0.78, { expr: "smile_closed", tilt: -16, headTilt: -12, y: -0.08, mirror: true });
      if (!cheek) c.mark("TOK! TOK!", "#ffffff", 0.95, 1.6, 0.75, 0.9, c.a + 6, wf(13, "menempelkan") - 3);
      c.P(WHO.kamu, K[0], K[2], { expr: "dazed", facing: 1 });
    },
  },
  { // 14: "Begitu merasakan dingin, dia melompat mundur."
    si: 14, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: cu([1.12, 0, 0.78], a, { az: 35, d: 1.6, h: 1.25, ly: 1.15 }) },
      { f: wf(14, "melompat") - 4, cut: true, s: two([1.6, 0, 1.4], wf(14, "melompat"), { az: 20, d: 5.2, h: 1.5 }) },
    ],
    kicks: [wf(14, "dingin"), wf(14, "melompat")],
    stage: (c) => {
      const jump = wf(14, "melompat"), k = Math.min(1, Math.max(0, (c.f - jump) / 10));
      if (c.f < jump) c.P(WHO.purba, 1.12, 0.78, { expr: c.f < wf(14, "dingin") ? "smile_closed" : "shock", tilt: -16, headTilt: -12, y: -0.08, mirror: true });
      else c.P(WHO.purba, 1.12 + 1.5 * k, 0.78 + 0.9 * k, { expr: "shock", prop: "spear", hop: [jump], hopH: 0.4 });
      c.mark("BRRR!", "#bfe8ff", 1.7, 1.95, 1.2, 0.8, wf(14, "dingin") - 2);
      c.P(WHO.kamu, K[0], K[2], { expr: "laugh", facing: 1 });
    },
  },
  { // 15: "Mungkin dia mengira kamu menyimpan angin dari puncak gunung di dalam kotak besi."
    si: 15, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: ms([2.6, 0, 1.7], a, { az: -10, d: 3.2, h: 1.6, ly: 1.4 }) },
      { f: wf(15, "kotak") - 6, cut: true, s: frame([0.4, 0, 0.4], wf(15, "kotak"), 3.2, 1.9, 1.2, { az: 30, fov: 30, rate: 0.0026 }) },
    ],
    stage: (c) => {
      c.P(WHO.purba, 2.62, 1.68, { expr: "dazed", prop: "spear", look: -0.6 });
      c.thought(2.2, 2.55, 1.55, 1.2, wf(15, "angin") - 4);
      c.P(WHO.kamu, K[0], K[2], { expr: "smile", facing: 1 });
    },
  },
  { // 16: "Kamu membuka tutup freezer dan mengambil es krim coklat."
    si: 16, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: ins([0, 1.32, 0.1], a, { az: -20, d: 1.4, h: 0.75, fov: 32 }) },
      { f: wf(16, "es") - 4, cut: true, s: ms(K, wf(16, "es"), { az: 20, d: 2.8 }) },
    ],
    ws: (f) => ({ lid: open(f, ss(16), 12) }),
    stage: (c) => {
      const got = c.f >= wf(16, "mengambil");
      c.P(WHO.kamu, K[0], K[2], { expr: got ? "grin" : "smile", facing: 1, prop: got ? "popsicle" : "reach", wave: 0 });
      c.P(WHO.purba, 2.62, 1.68, { expr: "neutral", prop: "spear" });
      c.puffs("cold16", 0, 1.36, 0.05, { n: 5, period: 36, life: 36, size: 0.45, rise: 0.4, col: "#e8f6ff", on: c.f >= ss(16) + 6 });
    },
  },
  { // 17: "Temanmu mencium aromanya, mengamatinya lama, lalu mencoba menggigit bagian stik kayunya."
    si: 17, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: cu([0.4, 0, 1.25], a, { az: 15, d: 1.6 }) },
      { f: wf(17, "mengamati") - 4, cut: true, s: frame([0.4, 0, 1.25], wf(17, "mengamati"), 1.9, 1.35, 1.42, { az: -25, fov: 28, orbit: 18, rate: 0.0028 }) },
      { f: wf(17, "menggigit") - 4, cut: true, s: low([0.4, 0, 1.25], wf(17, "menggigit"), { az: 10, d: 1.8, ly: 1.45, roll: -0.06 }) },
    ],
    stage: (c) => {
      const bite = c.f >= wf(17, "menggigit") - 2;
      c.P(WHO.purba, 0.4, 1.25, { expr: bite ? "grin" : c.f >= wf(17, "mengamati") ? "dazed" : "whistle", prop: bite ? "popsicle_down" : "popsicle" });
      if (c.f < wf(17, "mengamati")) c.mark("SNIFF", "#ffffff", 0.85, 1.85, 1.3, 0.55, c.a + 6);
      c.P(WHO.kamu, K[0], K[2], { expr: bite ? "shock" : "smile", facing: 1 });
    },
  },
  { // 18: "Kamu buru-buru membalik es krim itu."
    si: 18, set: "valley", light: "day",
    cams: (a) => [{ f: a, s: two([-0.4, 0, 0.9], a, { az: 5, d: 3.6, h: 1.4, ly: 1.15, orbit: 12, rate: 0.004 }) }],
    kicks: [ss(18) + 6],
    stage: (c) => {
      const flipped = c.f >= ss(18) + 10;
      c.P(WHO.purba, 0.4, 1.25, { expr: flipped ? "smile" : "grin", prop: flipped ? "popsicle" : "popsicle_down" });
      c.P(WHO.kamu, -0.55, 1.05, { expr: "nervous", facing: 1, prop: "reach", wave: Math.floor(c.f / 4) % 2, mode: "stand" });
      c.mark("!", "#ffd43b", -0.1, 1.95, 1.1, 0.4, ss(18) + 2);
    },
  },
  { // 19: "Setelah menjilat ujungnya, matanya membesar."
    si: 19, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: cu([0.4, 0, 1.25], a, { az: -10, d: 1.5 }) },
      { f: wf(19, "matanya") - 4, cut: true, s: cu([0.4, 0, 1.25], wf(19, "matanya"), { az: 5, d: 1.15, rate: 0.006, punch: 0.012, roll: 0.05 }) },
    ],
    kicks: [wf(19, "membesar")],
    stage: (c) => {
      const wow = c.f >= wf(19, "matanya") - 2;
      c.P(WHO.purba, 0.4, 1.25, { expr: wow ? "shock" : "lick", prop: "popsicle_bit", blink: wow ? false : undefined });
      c.burst(0.4, 1.45, 1.3, 1.4, wf(19, "membesar") - 2, "#fff3b0");
    },
  },
  { // 20: "Dia langsung meraih tanganmu, meminta satu lagi."
    si: 20, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: two([-0.1, 0, 1.0], a, { az: -10, d: 3.6, h: 1.4, ly: 1.15 }) },
      { f: wf(20, "satu") - 4, cut: true, s: low([0.3, 0, 1.15], wf(20, "satu"), { az: 25, d: 2.2, ly: 1.4, roll: 0.07 }) },
    ],
    stage: (c) => {
      c.P(WHO.purba, 0.45, 1.2, { expr: "grin", prop: "reach", mirror: true, hop: [ss(20) + 8, ss(20) + 24] });
      c.P(WHO.kamu, -0.55, 1.05, { expr: "nervous", facing: 1 });
      c.badge("lagi", "SATU LAGI!", "", "#ffd43b", "#241726", 0.55, 2.15, 1.25, 0.8, wf(20, "satu") - 2);
    },
  },
  { // 21: "Kamu menggeleng, dagangan tidak boleh dihabiskan sendiri."
    si: 21, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: cu([-0.55, 0, 1.05], a, { az: 10, d: 1.6 }) },
      { f: wf(21, "dagangan") - 4, cut: true, s: two([-0.2, 0, 0.6], wf(21, "dagangan"), { az: -18, d: 4.6, h: 1.6 }) },
    ],
    stage: (c) => {
      const shake = c.f < wf(21, "dagangan") ? ([-1, 1] as const)[Math.floor(c.f / 5) % 2] : 0;
      c.P(WHO.kamu, -0.55, 1.05, { expr: "stern", facing: shake });
      c.P(WHO.purba, 0.45, 1.2, { expr: "pained", prop: "popsicle_bit" });
      c.badge("dagangan", "DAGANGAN", "BUKAN BUAT DIHABISKAN SENDIRI", "#2f7fd0", "#ffffff", -0.1, 2.25, 0.6, 1.3, wf(21, "dagangan") - 2);
    },
  },

  // ---- chapter 3: the group, the money gesture, barter, the crowd, day one (sentences 22-40) ----
  { // 22: "Masalah pertama muncul ketika beberapa anggota kelompok mendekat."
    si: 22, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: frame([-3.5, 0, -2.5], a, 9, 2.0, 1.0, { az: 140, fov: 32, rate: 0.0018 }) },
      { f: wf(22, "anggota") - 4, cut: true, s: low([-2.2, 0, -1.2], wf(22, "anggota"), { az: -30, d: 3.2, ly: 1.4, roll: -0.07 }) },
    ],
    kicks: [wf(22, "masalah")],
    stage: (c) => {
      const k = Math.min(1, (c.f - c.a) / 110);
      [[-6.5, -4.8], [-7.4, -3.8], [-5.6, -3.4], [-8.2, -4.6]].forEach(([x, z], i) =>
        c.P(WHO.tribe(i + 1), x + 4.2 * k, z + 2.6 * k, { expr: i % 2 ? "neutral" : "stern", mode: k < 1 ? "stroll" : "stand", phase: c.t * 1.5 + i * 0.3, facing: 1, prop: i === 0 ? "spear" : null }));
      c.P(WHO.purba, 0.45, 1.2, { expr: "lick", prop: "popsicle_bit" });
      c.P(WHO.kamu, K[0], K[2], { expr: "nervous", facing: -1 });
      c.badge("m1", "MASALAH #1", "", "#e2453c", "#ffffff", -2.6, 2.0, -0.6, 0.9, wf(22, "masalah") - 2);
    },
  },
  { // 23: "Mereka melihat temanmu menikmati makanan aneh dan ingin mencobanya."
    si: 23, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: frame([0.45, 0, 1.2], a, 2.6, 1.5, 1.35, { az: -65, fov: 30, rate: 0.0026 }) },
      { f: wf(23, "ingin") - 4, cut: true, s: two([-2.3, 0, 1.0], wf(23, "ingin"), { az: 25, d: 4.4, h: 1.5 }) },
    ],
    stage: (c) => {
      c.P(WHO.purba, 0.45, 1.2, { expr: "lick", prop: "popsicle_bit" });
      [[-2.9, 0.5], [-3.6, 1.3], [-2.2, 1.8], [-3.9, 0.2]].forEach(([x, z], i) => c.P(WHO.tribe(i + 1), x, z, { expr: i % 2 ? "grin" : "dazed", facing: 1, look: 0.6, prop: i === 0 ? "spear" : null }));
      c.P(WHO.kamu, K[0], K[2] - 0.2, { expr: "neutral" });
    },
  },
  { // 24: "Kamu tersenyum, mengulurkan telapak tangan, lalu menggosok jari seperti orang meminta uang."
    si: 24, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: ms(K, a, { az: -25, d: 3.0 }) },
      { f: wf(24, "menggosok") - 4, cut: true, s: ins([K[0] + 0.45, 1.25, K[2] + 0.1], wf(24, "menggosok"), { az: 10, d: 0.9, h: 0.1, fov: 30 }) },
      { f: wf(24, "uang") - 6, cut: true, s: two([-2.2, 0, 0.9], wf(24, "uang"), { az: 30, d: 4.6, h: 1.6 }) },
    ],
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "grin", prop: c.f >= wf(24, "mengulurkan") ? "rub" : null, facing: -1 });
      [[-2.9, 0.5], [-3.6, 1.3], [-2.2, 1.8], [-3.9, 0.2]].forEach(([x, z], i) => c.P(WHO.tribe(i + 1), x, z, { expr: "neutral", facing: 1 }));
      c.badge("bayar", "BAYAR DULU!", "", "#3fb950", "#ffffff", K[0] + 0.6, 2.05, K[2] + 0.2, 0.9, wf(24, "uang") - 2);
    },
  },
  { // 25: "Mereka malah mengira tanganmu gatal."
    si: 25, set: "valley", light: "day",
    cams: (a) => [{ f: a, s: two([-2.6, 0, 1.0], a, { az: 10, d: 4.0, h: 1.4, orbit: -14, rate: 0.003 }) }],
    stage: (c) => {
      [[-2.9, 0.5], [-3.6, 1.3], [-2.2, 1.8], [-3.9, 0.2]].forEach(([x, z], i) => c.P(WHO.tribe(i + 1), x, z, { expr: i % 2 ? "dazed" : "nervous", facing: 1 }));
      c.P(WHO.kamu, K[0], K[2], { expr: "smile", prop: "rub", facing: -1 });
      c.mark("?", "#ffd43b", -3.2, 2.15, 1.0, 0.5, ss(25) + 2); c.mark("?", "#ffd43b", -2.5, 2.25, 1.6, 0.42, ss(25) + 8);
      c.badge("gatal", "TANGANNYA GATAL?", "", "#f2efe6", "#241726", -2.9, 2.75, 0.9, 1.0, wf(25, "gatal") - 2);
    },
  },
  { // 26: "Salah seorang mengambil daun dan mencoba mengoleskannya ke jarimu."
    si: 26, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: two([-1.9, 0, 0.8], a, { az: 15, d: 3.6, h: 1.4 }) },
      { f: wf(26, "mengoleskan") - 4, cut: true, s: frame([-1.55, 0, 0.75], wf(26, "mengoleskan"), 2.4, 1.35, 1.25, { az: 15, fov: 30, roll: -0.05, rate: 0.004, punch: 0.01 }) },
    ],
    stage: (c) => {
      const near = Math.min(1, (c.f - wf(26, "mengambil")) / 30);
      c.P(WHO.tribe(1), -2.6 + 0.6 * Math.max(0, near), 1.2 - 0.2 * Math.max(0, near), { expr: "stern", prop: c.f >= wf(26, "daun") ? "leaf" : null, facing: 1 });
      c.P(WHO.kamu, K[0], K[2], { expr: c.f >= wf(26, "mengoleskan") ? "shock" : "smile", prop: "rub", facing: -1 });
      [[-3.6, 1.6], [-3.9, 0.2]].forEach(([x, z], i) => c.P(WHO.tribe(i + 2), x, z, { expr: "neutral", facing: 1 }));
    },
  },
  { // 27: "Kamu menjelaskan dengan gerakan bahwa satu es krim harus ditukar dengan sesuatu."
    si: 27, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: ms(K, a, { az: 20, d: 3.2, orbit: -12 }) },
      { f: wf(27, "ditukar") - 6, cut: true, s: ins([-2.55, 1.7, 0.75], wf(27, "ditukar"), { az: 14, d: 1.9, h: 0.1, fov: 30 }) },
    ],
    ws: (f) => ({ board: f >= wf(27, "satu") - 4 ? "ask" : null }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "grin", wave: (Math.floor(c.f / 7) % 2) * 0.8, facing: -1 });
      [[-3.3, 1.5], [-3.9, 0.4]].forEach(([x, z], i) => c.P(WHO.tribe(i + 1), x, z, { expr: "dazed", facing: 1 }));
    },
  },
  { // 28: "Seorang pemburu menyerahkan batu."
    si: 28, set: "valley", light: "day",
    cams: (a) => [{ f: a, s: two([-2.0, 0, 1.0], a, { az: 20, d: 3.4, h: 1.4, rate: 0.004 }) }],
    ws: () => ({ board: "ask" }),
    stage: (c) => {
      c.P(WHO.tribe(0), -2.45, 1.25, { expr: "smile", prop: "stone", facing: 1 });
      c.P(WHO.kamu, K[0], K[2], { expr: "neutral", facing: -1 });
    },
  },
  { // 29: "Kamu menolak."
    si: 29, set: "valley", light: "day",
    cams: (a) => [{ f: a, s: cu(K, a, { az: 20, d: 1.5, rate: 0.006, punch: 0.01, roll: 0.05 }) }],
    kicks: [ss(29) + 2],
    ws: () => ({ board: "ask" }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "stern", facing: ([-1, 1] as const)[Math.floor(c.f / 5) % 2] });
      c.badge("tolak1", "DITOLAK!", "", "#e2453c", "#ffffff", K[0] + 0.55, 1.95, K[2] + 0.1, 0.55, ss(29));
    },
  },
  { // 30: "Yang lain memberikan ranting."
    si: 30, set: "valley", light: "day",
    cams: (a) => [{ f: a, s: two([-2.0, 0, 1.0], a, { az: -15, d: 3.4, h: 1.4, rate: 0.004 }) }],
    ws: () => ({ board: "ask" }),
    stage: (c) => {
      c.P(WHO.tribe(3), -2.5, 1.2, { expr: "grin", prop: "twig", facing: 1 });
      c.P(WHO.kamu, K[0], K[2], { expr: "neutral", facing: -1 });
    },
  },
  { // 31: "Kamu juga menolak."
    si: 31, set: "valley", light: "day",
    cams: (a) => [{ f: a, s: cu(K, a, { az: -15, d: 1.5, rate: 0.006, punch: 0.01, roll: -0.05 }) }],
    kicks: [ss(31) + 2],
    ws: () => ({ board: "ask" }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "stern", facing: ([1, -1] as const)[Math.floor(c.f / 5) % 2] });
      c.badge("tolak2", "DITOLAK LAGI!", "", "#e2453c", "#ffffff", K[0] + 0.55, 1.95, K[2] + 0.1, 0.6, ss(31));
    },
  },
  { // 32: "Sampai seorang perempuan datang membawa ikan segar."
    si: 32, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: low([-2.8, 0, 1.6], a, { az: 30, d: 3.0, ly: 1.4, roll: 0.06 }) },
      { f: wf(32, "ikan") - 4, cut: true, s: ins([-2.35, 1.3, 1.55], wf(32, "ikan"), { az: 20, d: 1.0, h: 0.1, fov: 30 }) },
    ],
    ws: () => ({ board: "ask" }),
    stage: (c) => {
      const k = Math.min(1, (c.f - c.a) / 50);
      c.P(WHO.tribe(4), -4.6 + 1.9 * k, 2.4 - 0.8 * k, { expr: "smile", prop: "fishbig", mode: k < 1 ? "stroll" : "stand", phase: c.t * 1.6, facing: 1 });
      c.burst(-2.35, 1.35, 1.6, 0.9, wf(32, "ikan") - 2, "#bfe8ff");
    },
  },
  { // 33: "Nah, akhirnya ada transaksi masuk akal."
    si: 33, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: cu(K, a, { az: 10, d: 1.6 }) },
      { f: wf(33, "transaksi") - 4, cut: true, s: ins([-2.55, 1.7, 0.75], wf(33, "transaksi"), { az: 14, d: 1.9, h: 0.1, fov: 30, roll: 0.04 }) },
    ],
    ws: (f) => ({ board: f >= wf(33, "transaksi") - 4 ? "fish1" : "ask" }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "laugh", facing: -1, hop: [ss(33) + 4] });
      c.badge("deal", "DEAL!", "", "#3fb950", "#ffffff", -2.0, 2.55, 1.0, 0.7, wf(33, "transaksi") - 1);
    },
  },
  { // 34: "Kamu memberikan dua es krim."
    si: 34, set: "valley", light: "day",
    cams: (a) => [{ f: a, s: two([-1.9, 0, 1.1], a, { az: 15, d: 3.6, h: 1.4, rate: 0.004 }) }],
    ws: () => ({ board: "fish1", lid: 1 }),
    stage: (c) => {
      c.P(WHO.tribe(4), -2.7, 1.6, { expr: "grin", prop: "popsicle", facing: 1 });
      c.P(WHO.kamu, K[0] - 0.2, K[2] + 0.2, { expr: "grin", prop: "fishbig", facing: -1 });
      c.mark("x2", "#ffd43b", -2.2, 2.05, 1.7, 0.45, ss(34) + 4);
    },
  },
  { // 35: "Dia mencicipinya lalu memanggil keluarganya."
    si: 35, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: cu([-2.7, 0, 1.6], a, { az: 20, d: 1.6 }) },
      { f: wf(35, "memanggil") - 4, cut: true, s: frame([-5, 0, 0], wf(35, "memanggil"), 7, 1.8, 1.0, { az: 60, fov: 32 }) },
    ],
    ws: () => ({ board: "fish1" }),
    stage: (c) => {
      const call = c.f >= wf(35, "memanggil") - 2;
      c.P(WHO.tribe(4), -2.7, 1.6, { expr: call ? "laugh" : "lick", prop: call ? null : "popsicle_bit", wave: call ? (Math.floor(c.f / 6) % 2) : undefined, facing: -1 });
      if (call) { const k = Math.min(1, (c.f - wf(35, "memanggil")) / 60); [[-9, -3], [-10, -1.5], [-8.6, 0.2]].forEach(([x, z], i) => c.P(i === 1 ? WHO.kid(i) : WHO.tribe(i + 6), x + 2.6 * k, z, { expr: "grin", mode: "march", phase: c.t * 2 + i * 0.3, facing: 1 })); }
    },
  },
  { // 36: "Dalam waktu singkat, orang-orang berkerumun di sekitar gerobak."
    si: 36, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: high([0, 0, 0.6], a, { az: 15, d: 6.5, h: 6.8, rise: 1.5, rate: 0.0016 }) },
      { f: wf(36, "berkerumun") - 4, cut: true, s: two([0.2, 0, 1.3], wf(36, "berkerumun"), { az: -20, d: 5.0, h: 1.6, orbit: 14 }) },
    ],
    ws: () => ({ board: "fish1", lid: 1 }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "laugh", facing: 1 });
      const spots: [number, number][] = [[-2.6, 1.6], [-1.6, 2.2], [-0.4, 2.5], [0.9, 2.3], [2.0, 1.9], [2.6, 1.0], [-3.2, 0.6], [1.3, 3.1], [-1.0, 3.2]];
      spots.forEach(([x, z], i) => c.P(i % 4 === 3 ? WHO.kid(i) : WHO.tribe(i), x, z, { expr: i % 2 ? "grin" : "laugh", facing: x < 0 ? 1 : -1, hop: [ss(36) + 10 + i * 5] }));
    },
  },
  { // 37: "Ada yang membawa buah, kerang, ikan dan potongan kayu."
    si: 37, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: ins([-1.6, 1.25, 2.25], a, { az: 10, d: 1.0, h: 0.1, fov: 30 }) },
      { f: wf(37, "kerang") - 3, cut: true, s: ins([-0.4, 1.25, 2.55], wf(37, "kerang"), { az: -10, d: 1.0, h: 0.1, fov: 30, roll: -0.04 }) },
      { f: wf(37, "ikan") - 3, cut: true, s: ins([0.9, 1.25, 2.35], wf(37, "ikan"), { az: 10, d: 1.0, h: 0.1, fov: 30 }) },
      { f: wf(37, "kayu") - 4, cut: true, s: ins([2.0, 1.25, 1.95], wf(37, "kayu"), { az: -12, d: 1.1, h: 0.15, fov: 30, roll: 0.04 }) },
    ],
    ws: () => ({ board: "fish1", lid: 1 }),
    stage: (c) => {
      const props: [number, number, "basket" | "shell" | "fishbig" | "twig"][] = [[-1.6, 2.2, "basket"], [-0.4, 2.5, "shell"], [0.9, 2.3, "fishbig"], [2.0, 1.9, "twig"]];
      props.forEach(([x, z, pr], i) => c.P(WHO.tribe(i + 1), x, z, { expr: "grin", prop: pr, facing: x < 0 ? 1 : -1 }));
    },
  },
  { // 38: "Kamu bahkan menerima sebuah batu mengilap karena mengira itu mungkin berharga."
    si: 38, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: ms(K, a, { az: 25, d: 3.0 }) },
      { f: wf(38, "berharga") - 8, cut: true, s: ins([K[0] + 0.45, 1.2, K[2] + 0.1], wf(38, "berharga"), { az: 15, d: 0.9, h: 0.12, fov: 30 }) },
    ],
    ws: () => ({ board: "fish1", fish: true }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: c.f >= wf(38, "mengira") ? "grin" : "smile", prop: "gem", facing: -1 });
      c.P(WHO.tribe(0), -2.6, 1.4, { expr: "smile", facing: 1 });
      c.burst(K[0] + 0.45, 1.3, K[2] + 0.12, 0.5, wf(38, "mengilap") - 2, "#bfe8ff");
      c.badge("gem", "BERHARGA?", "MUNGKIN...", "#bfe8ff", "#241726", K[0] + 0.95, 1.85, K[2], 0.7, wf(38, "berharga") - 2);
    },
  },
  { // 39: "Hari pertama terasa seperti kesuksesan besar."
    si: 39, set: "valley", light: "golden", sun: [40, 26],
    cams: (a) => [
      { f: a, s: wide([0.4, 0, 1.0], a, { az: 10, d: 8.5, h: 2.6, orbit: -10 }) },
      { f: wf(39, "kesuksesan") - 4, cut: true, s: low(K, wf(39, "kesuksesan"), { az: 20, d: 2.6, ly: 1.45, roll: -0.06 }) },
    ],
    ws: () => ({ board: "fish1", fish: true }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "laugh", wave: 1, hop: [wf(39, "kesuksesan")] });
      c.P(WHO.purba, 0.6, 1.4, { expr: "laugh", prop: "spear" });
      c.badge("hari1", "HARI 1", "SUKSES BESAR!", "#ffd43b", "#241726", 0.3, 2.7, 1.0, 1.4, wf(39, "hari") - 2);
    },
  },
  { // 40: "Kamu punya banyak makanan tanpa perlu berburu."
    si: 40, set: "valley", light: "golden", sun: [40, 26],
    cams: (a) => [
      { f: a, s: ins([2.3, 0.3, 2.2], a, { az: 20, d: 2.0, h: 0.9, fov: 32 }) },
      { f: wf(40, "berburu") - 6, cut: true, s: ms([1.6, 0, 2.6], wf(40, "berburu"), { az: 10, d: 3.2 }) },
    ],
    ws: () => ({ board: "fish1", fish: true }),
    stage: (c) => {
      c.P(WHO.kamu, 1.6, 2.6, { expr: "relief", mode: "sit", prop: "fish" });
      c.badge("makanan", "BANYAK MAKANAN", "TANPA BERBURU", "#3fb950", "#ffffff", 2.3, 1.2, 2.2, 0.9, ss(40) + 4);
    },
  },

  // ---- chapter 4: the queue guard, extras for the kids, the wolf, a new job (sentences 41-51) ----
  { // 41: "Teman purbamu bertugas menjaga anterian."
    si: 41, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: frame([-1.2, 0, 2.6], a, 7.5, 2.2, 1.0, { az: 55, fov: 32, rate: 0.0018, orbit: -10 }) },
      { f: wf(41, "menjaga") - 4, cut: true, s: low([-0.7, 0, 1.7], wf(41, "menjaga"), { az: 25, d: 2.6, ly: 1.5, roll: 0.07 }) },
    ],
    ws: () => ({ board: "fish1", lid: 1 }),
    stage: (c) => {
      c.P(WHO.purba, -0.7, 1.7, { expr: "stern", prop: "spear", facing: -1 });
      c.P(WHO.kamu, K[0], K[2], { expr: "smile", facing: 1 });
      const q: [number, number][] = [[-2.1, 2.3], [-2.9, 2.9], [-3.7, 3.5], [-4.5, 4.1], [-5.3, 4.7]];
      q.forEach(([x, z], i) => c.P(i === 1 || i === 3 ? WHO.kid(i) : WHO.tribe(i + 2), x, z, { expr: i % 2 ? "neutral" : "grin", prop: i === 0 ? "fish" : null, facing: 1 }));
      c.badge("antre", "ANTRE DI SINI", "", "#ffd43b", "#241726", -1.9, 2.25, 2.0, 1.0, wf(41, "menjaga") - 2);
    },
  },
  { // 42: "Sayangnya, dia tidak faham konsep satu orang satu es krim."
    si: 42, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: ms([-0.7, 0, 1.7], a, { az: -30, d: 3.0 }) },
      { f: wf(42, "konsep") - 4, cut: true, s: cu([-0.7, 0, 1.7], wf(42, "konsep"), { az: -10, d: 1.5, roll: -0.05 }) },
    ],
    ws: () => ({ board: "rule", lid: 1 }),
    stage: (c) => {
      c.P(WHO.purba, -0.7, 1.7, { expr: "dazed", prop: "spear", facing: 1 });
      c.P(WHO.tribe(2), -2.1, 2.3, { expr: "grin", facing: 1 });
      if (c.f >= wf(42, "konsep")) c.mark("?", "#ffd43b", -0.95, 2.3, 1.75, 0.5, wf(42, "konsep"));
    },
  },
  { // 43: "Setiap melihat anak kecil, dia memberikan tambahan diam-diam."
    si: 43, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: two([-1.2, 0, 2.1], a, { az: 35, d: 3.8, h: 1.3 }) },
      { f: wf(43, "tambahan") - 4, cut: true, s: ins([-1.25, 1.0, 2.05], wf(43, "tambahan"), { az: 25, d: 1.0, h: 0.1, fov: 30, roll: 0.05 }) },
    ],
    ws: () => ({ board: "fish1", lid: 1 }),
    stage: (c) => {
      const give = c.f >= wf(43, "memberikan") - 2;
      c.P(WHO.purba, -0.7, 1.7, { expr: give ? "smile_closed" : "smile", prop: give ? "popsicle" : null, facing: -1 });
      c.P(WHO.kid(1), -1.6, 2.3, { expr: give ? "laugh" : "grin", prop: "popsicle", facing: 1, hop: [wf(43, "tambahan") + 3] });
      c.P(WHO.kid(3), -2.3, 2.8, { expr: "grin", prop: "popsicle", facing: 1 });
      c.mark("+1", "#3fb950", -1.25, 1.65, 2.2, 0.38, wf(43, "tambahan"));
      c.mark("ssst", "#f2efe6", -0.45, 2.15, 1.8, 0.38, wf(43, "diam") - 2);
    },
  },
  { // 44: "Ketika kamu memergokinya, dia hanya tersenyum."
    si: 44, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: low(K, a, { az: 40, d: 2.6, ly: 1.4, roll: -0.08 }) },
      { f: wf(44, "tersenyum") - 4, cut: true, s: cu([-0.7, 0, 1.7], wf(44, "tersenyum"), { az: -20, d: 1.4, rate: 0.005, punch: 0.01 }) },
    ],
    kicks: [wf(44, "memergokinya")],
    ws: () => ({ board: "fish1", lid: 1 }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "stern", facing: 1 });
      c.P(WHO.purba, -0.7, 1.7, { expr: c.f >= wf(44, "tersenyum") - 2 ? "grin" : "nervous", prop: "popsicle", facing: -1 });
      c.mark("!", "#e2453c", K[0] + 0.1, 2.15, K[2], 0.45, wf(44, "memergokinya") - 1);
      c.badge("ketahuan", "KETAHUAN!", "", "#e2453c", "#ffffff", -0.2, 2.25, 1.6, 0.8, wf(44, "memergokinya") - 1, wf(44, "tersenyum") - 4);
    },
  },
  { // 45: "Belum lagi seekor hewan liar mulai berkeliaran."
    si: 45, set: "valley", light: "golden", sun: [-40, 22],
    cams: (a) => [
      { f: a, s: wide([5.5, 0, -2.0], a, { az: -60, d: 9, h: 1.6, ly: 0.8, orbit: 8 }) },
      { f: wf(45, "berkeliaran") - 4, cut: true, s: low([5.2, 0, -0.8], wf(45, "berkeliaran"), { az: -20, d: 2.4, ly: 0.6, roll: 0.06 }) },
    ],
    ws: () => ({ board: "fish1", fish: true }),
    stage: (c) => {
      const k = Math.min(1, (c.f - c.a) / 120);
      c.wolf(8.5 - 3.3 * k, -3.0 + 2.2 * k, false, true);
      c.badge("liar", "HEWAN LIAR!", "", "#e2453c", "#ffffff", 4.6, 1.5, -1.4, 0.9, wf(45, "hewan") - 2);
    },
  },
  { // 46: "Tertarik oleh bau ikan hasil barter yang kamu letakkan sembarangan."
    si: 46, set: "valley", light: "golden", sun: [-40, 22],
    cams: (a) => [
      { f: a, s: ins([3.6, 0.55, 1.4], a, { az: 40, d: 1.6, h: 0.25, fov: 30 }) },
      { f: wf(46, "ikan") - 4, cut: true, s: ins([2.3, 0.25, 2.2], wf(46, "ikan"), { az: 20, d: 1.4, h: 0.4, fov: 30, roll: -0.05 }) },
      { f: wf(46, "sembarangan") - 6, cut: true, s: frame([2.8, 0, 1.6], wf(46, "sembarangan"), 4.6, 1.6, 0.6, { az: 30, fov: 32, orbit: -10 }) },
    ],
    ws: () => ({ board: "fish1", fish: true }),
    stage: (c) => {
      const k = Math.min(1, (c.f - c.a) / 90);
      c.wolf(5.2 - 1.6 * k, -0.8 + 1.8 * k, false, true);
      c.puffs("bau", 2.3, 0.4, 2.2, { n: 4, period: 30, life: 60, size: 0.3, rise: 0.6, drift: [-0.3, 0.1], col: "#cfe3a8", on: true });
      c.mark("bau!", "#cfe3a8", 2.7, 0.95, 2.2, 0.4, wf(46, "bau") - 2);
    },
  },
  { // 47: "Teman purbamu segera memindahkan ikan itu menjauh dari tempat tidur kelompok."
    si: 47, set: "valley", light: "golden", sun: [-40, 22],
    cams: (a) => [
      { f: a, s: two([1.4, 0, 2.0], a, { az: 30, d: 4.6, h: 1.5 }) },
      { f: wf(47, "menjauh") - 4, cut: true, s: wide([-3.0, 0, -1.5], wf(47, "menjauh"), { az: 120, d: 9.5, h: 2.6, orbit: 10 }) },
    ],
    ws: (f) => ({ board: "fish1", fish: f < wf(47, "memindahkan") }),
    stage: (c) => {
      const m = wf(47, "memindahkan"), k = Math.max(0, Math.min(1, (c.f - m) / 110));
      if (c.f < m) c.P(WHO.purba, 1.2, 1.4, { expr: "shock", prop: "spear", facing: 1 });
      else c.P(WHO.purba, 2.3 + 5.5 * k, 2.2 - 3.5 * k, { expr: "stern", prop: "basket", mode: k < 1 ? "march" : "stand", phase: c.t * 2.2, facing: 1 });
      c.wolf(3.0 + 5.4 * k, 0.6 - 3.8 * k, false, false);
      c.badge("tidur", "TEMPAT TIDUR", "", "#f2efe6", "#241726", -9, 2.4, -6.0, 1.3, wf(47, "tempat") - 2);
    },
  },
  { // 48: "Kamu baru sadar."
    si: 48, set: "valley", light: "golden", sun: [40, 26],
    cams: (a) => [{ f: a, s: cu(K, a, { az: 20, d: 1.5, rate: 0.006, punch: 0.012, roll: 0.05 }) }],
    kicks: [ss(48) + 2],
    ws: () => ({ board: "fish1" }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "shock", facing: 1 });
      c.mark("!", "#ffd43b", K[0] + 0.15, 2.1, K[2], 0.5, ss(48));
    },
  },
  { // 49: "Setiap es krim yang terjual bukan cuma menghasilkan keuntungan."
    si: 49, set: "valley", light: "golden", sun: [40, 26],
    cams: (a) => [
      { f: a, s: ins([0, 1.2, 0], a, { az: 10, d: 2.0, h: 0.5, fov: 30 }) },
      { f: wf(49, "keuntungan") - 4, cut: true, s: ms(K, wf(49, "keuntungan"), { az: -25, d: 3.0 }) },
    ],
    ws: () => ({ board: "fish1", lid: 1 }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "nervous", prop: "fish", facing: 1 });
      c.badge("untung", "+ UNTUNG", "", "#3fb950", "#ffffff", K[0] + 0.7, 2.0, K[2] + 0.1, 0.75, wf(49, "keuntungan") - 2);
    },
  },
  { // 50: "Kamu juga mendapat pekerjaan baru."
    si: 50, set: "valley", light: "golden", sun: [40, 26],
    cams: (a) => [{ f: a, s: ms(K, a, { az: 10, d: 2.6, rate: 0.005, punch: 0.01 }) }],
    kicks: [wf(50, "pekerjaan")],
    ws: () => ({ board: "fish1" }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "dazed", prop: "spear", facing: 1 });
      c.badge("kerja", "+ PEKERJAAN BARU", "", "#e2453c", "#ffffff", K[0] + 0.75, 2.05, K[2] + 0.1, 0.95, wf(50, "pekerjaan") - 2);
    },
  },
  { // 51: "Menjaga makanan agar tidak mengundang masalah."
    si: 51, set: "valley", light: "golden", sun: [40, 26],
    cams: (a) => [
      { f: a, s: frame([6.5, 0, -2.0], a, 6.0, 1.5, 0.9, { az: 60, fov: 32, orbit: -12 }) },
      { f: wf(51, "masalah") - 6, cut: true, s: high([7.8, 0, -1.3], wf(51, "masalah"), { az: 20, d: 5, h: 4.6, rise: 0.8 }) },
    ],
    ws: () => ({ board: "fish1" }),
    stage: (c) => {
      c.P(WHO.kamu, 7.0, -0.4, { expr: "nervous", prop: "spear", facing: 1 });
      c.P(WHO.purba, 8.6, -1.1, { expr: "stern", prop: "basket", facing: -1 });
      c.wolf(11.5, -3.5, true, true);
      c.badge("satpam", "SATPAM MAKANAN", "", "#ffd43b", "#241726", 7.8, 2.4, -0.8, 1.2, wf(51, "makanan") - 2);
    },
  },

  // ---- chapter 5: night, the generator off, the soft morning, refreezing, the price of two fish (sentences 52-72) ----
  { // 52: "Malam tiba, tetapi generator masih berdengung."
    si: 52, set: "valley", light: "night", flash: true,
    cams: (a) => [
      { f: a, s: wide([-2.0, 0, -1.0], a, { az: 30, d: 10, h: 3.2, ly: 1.6, rise: -0.8 }) },
      { f: wf(52, "generator") - 4, cut: true, s: ins([GEN[0], 0.75, GEN[2]], wf(52, "generator"), { az: 35, d: 1.6, h: 0.2, fov: 30 }) },
    ],
    ws: () => ({ stars: true, moon: true, fire: true, board: "fish1", gauge: 1 }),
    stage: (c) => {
      c.P(WHO.tribe(1), -5.9, -1.9, { expr: "smile_closed", mode: "sit" });
      c.P(WHO.tribe(2), -4.5, -1.8, { expr: "smile_closed", mode: "sit" });
      c.mark("BRRR", "#ffd43b", GEN[0] + 0.1, 1.25, GEN[2] + 0.35, 0.55, wf(52, "berdengung") - 2);
      c.badge("malam", "MALAM", "", "#241726", "#ffd43b", -2.0, 3.0, -0.5, 1.0, ss(52) + 6, wf(52, "generator") - 4);
    },
  },
  { // 53: "Kamu mulai mengantuk."
    si: 53, set: "valley", light: "night",
    cams: (a) => [{ f: a, s: cu(K, a, { az: 25, d: 1.6, rate: 0.004, roll: 0.05 }) }],
    ws: () => ({ stars: true, moon: true, fire: true, board: "fish1", gauge: 1 }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "relief", facing: 1 });
      c.mark("Zzz", "#bfe8ff", K[0] + 0.35, 2.05, K[2], 0.45, ss(53) + 6);
    },
  },
  { // 54: "Temanmu menunjuk mesin dan bertanya dengan isyarat mengapa benda itu terus berisik."
    si: 54, set: "valley", light: "night",
    cams: (a) => [
      { f: a, s: two([0.3, 0, 1.0], a, { az: 20, d: 4.6, h: 1.5 }) },
      { f: wf(54, "isyarat") - 4, cut: true, s: cu(F, wf(54, "isyarat"), { az: -25, d: 1.6 }) },
      { f: wf(54, "berisik") - 6, cut: true, s: ins([GEN[0], 0.75, GEN[2]], wf(54, "berisik"), { az: -30, d: 1.3, h: 0.1, fov: 30, roll: -0.06 }) },
    ],
    ws: () => ({ stars: true, moon: true, fire: true, board: "fish1", gauge: 1 }),
    stage: (c) => {
      c.P(WHO.purba, F[0], F[2], { expr: "stern", prop: c.f >= wf(54, "menunjuk") ? "reach" : null, facing: -1 });
      c.P(WHO.kamu, K[0], K[2], { expr: "relief", facing: 1 });
      if (c.f >= wf(54, "isyarat")) c.mark("?", "#ffd43b", F[0] - 0.2, 2.25, F[2], 0.5, wf(54, "isyarat"));
      c.mark("BRRR", "#ffd43b", GEN[0] + 0.1, 1.25, GEN[2] + 0.35, 0.55, wf(54, "berisik") - 2);
    },
  },
  { // 55: "Kamu mematikan generator supaya bisa tidur nyenyak."
    si: 55, set: "valley", light: "night",
    cams: (a) => [
      { f: a, s: ins([GEN[0] - 0.3, 0.8, GEN[2] + 0.3], a, { az: 20, d: 1.2, h: 0.2, fov: 30 }) },
      { f: wf(55, "tidur") - 4, cut: true, s: frame([-6.5, 0, -4.5], wf(55, "tidur"), 6.0, 2.4, 0.6, { az: 35, fov: 32, rate: 0.002 }) },
    ],
    ws: (f) => ({ stars: true, moon: true, fire: true, board: "fish1", gauge: 1, genOn: f < wf(55, "generator") + 4 }),
    stage: (c) => {
      if (c.f < wf(55, "tidur") - 4) c.P(WHO.kamu, GEN[0] - 0.9, GEN[2] + 0.55, { expr: "relief", prop: "reach", facing: 1 });
      else { c.P(WHO.kamu, -6.6, -4.4, { expr: "smile_closed", mode: "sit" }); c.mark("Zzz", "#bfe8ff", -6.2, 1.5, -4.4, 0.45, wf(55, "tidur")); }
      c.mark("KLIK", "#ffffff", GEN[0], 1.2, GEN[2] + 0.35, 0.45, wf(55, "generator") + 4);
    },
  },
  { // 56: "Kesalahan besar."
    si: 56, set: "valley", light: "night",
    cams: (a) => [{ f: a, s: ins([0, 1.2, 0], a, { az: 15, d: 2.2, h: 0.4, fov: 30, punch: 0.015, roll: -0.06 }) }],
    kicks: [ss(56) + 2],
    ws: () => ({ stars: true, moon: true, board: "fish1", gauge: 1, genOn: false }),
    stage: (c) => {
      c.badge("salah", "KESALAHAN BESAR", "", "#e2453c", "#ffffff", 0, 2.1, 0.2, 1.3, ss(56));
    },
  },
  { // 57: "Pagi harinya, sebagian es krim mulai melunak."
    si: 57, set: "valley", light: "golden", sun: [60, 14], flash: true,
    cams: (a) => [
      { f: a, s: wide([0, 0, 0.3], a, { az: -20, d: 9, h: 2.2 }) },
      { f: wf(57, "melunak") - 6, cut: true, s: ins([0, 1.25, 0], wf(57, "melunak"), { az: 10, d: 0.9, h: 0.55, fov: 30 }) },
    ],
    ws: (f) => ({ board: "fish1", gauge: 1, genOn: false, lid: f >= wf(57, "es") ? 1 : 0, melt: f >= wf(57, "melunak") - 6 }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: c.f >= wf(57, "melunak") ? "shock" : "relief", facing: 1 });
      c.badge("pagi", "PAGI", "", "#ffd43b", "#241726", 0, 2.8, 0.3, 0.8, ss(57) + 4, wf(57, "melunak") - 6);
      c.puffs("uap", 0, 1.4, 0, { n: 3, period: 24, life: 40, size: 0.18, rise: 0.3, drift: [0.05, 0.05], col: "#f2efe6", on: c.f >= wf(57, "melunak") });
    },
  },
  { // 58: "Freezer memang memiliki insulasi."
    si: 58, set: "valley", light: "golden", sun: [60, 14],
    cams: (a) => [{ f: a, s: frame([0, 0, 0], a, 3.0, 1.6, 0.9, { az: 70, fov: 30, orbit: -25, rate: 0.003 }) }],
    ws: () => ({ board: "fish1", gauge: 1, genOn: false, melt: true }),
    stage: (c) => {
      c.badge("insulasi", "INSULASI", "MENAHAN DINGIN", "#bfe8ff", "#241726", 0.3, 2.1, 0.3, 0.9, wf(58, "insulasi") - 2);
    },
  },
  { // 59: "Tetapi tanpa listrik, suhunya perlahan naik."
    si: 59, set: "valley", light: "golden", sun: [60, 14],
    cams: (a) => [
      { f: a, s: ins([GEN[0], 0.75, GEN[2]], a, { az: 25, d: 1.5, h: 0.2, fov: 30 }) },
      { f: wf(59, "suhunya") - 4, cut: true, s: ins([0.35, 1.2, 0.45], wf(59, "suhunya"), { az: 20, d: 1.2, h: 0.1, fov: 30, roll: -0.05 }) },
    ],
    ws: () => ({ board: "fish1", gauge: 1, genOn: false, melt: true }),
    stage: (c) => {
      const k = Math.max(0, Math.min(1, (c.f - wf(59, "perlahan")) / 50));
      c.badge("suhu", `SUHU ${Math.round(-18 + 14 * k)}°C`, "", k > 0.5 ? "#e2453c" : "#bfe8ff", k > 0.5 ? "#ffffff" : "#241726", 0.35, 1.45, 0.55, 0.6, wf(59, "suhunya") - 2);
    },
  },
  { // 60: "Kamu segera menghidupkan generator lagi."
    si: 60, set: "valley", light: "golden", sun: [60, 14],
    cams: (a) => [{ f: a, s: low([GEN[0] - 0.9, 0, GEN[2] + 0.55], a, { az: 50, d: 2.4, ly: 1.2, roll: 0.07, punch: 0.01 }) }],
    kicks: [wf(60, "generator")],
    ws: (f) => ({ board: "fish1", gauge: 1, genOn: f >= wf(60, "generator"), melt: true }),
    stage: (c) => {
      c.P(WHO.kamu, GEN[0] - 0.9, GEN[2] + 0.55, { expr: "nervous", prop: "reach", facing: 1, hop: [wf(60, "generator")] });
      c.mark("BRRR", "#ffd43b", GEN[0] + 0.1, 1.25, GEN[2] + 0.35, 0.55, wf(60, "generator") + 2);
    },
  },
  { // 61: "Es krim yang sudah mencair tidak otomatis kembali aman dijual hanya karena dibekukan ulang."
    si: 61, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: ins([0, 1.25, 0], a, { az: -15, d: 0.95, h: 0.55, fov: 30 }) },
      { f: wf(61, "aman") - 4, cut: true, s: ms(K, wf(61, "aman"), { az: 30, d: 2.9 }) },
      { f: wf(61, "dibekukan") - 4, cut: true, s: ins([-2.55, 1.7, 0.75], wf(61, "dibekukan"), { az: 14, d: 2.2, h: 0.1, fov: 30, roll: 0.05 }) },
    ],
    ws: () => ({ board: "fish1", gauge: 1, melt: true, lid: 1 }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "nervous", prop: "melted", facing: 1 });
      c.badge("tidakaman", "TIDAK AMAN", "", "#e2453c", "#ffffff", K[0] + 0.7, 2.0, K[2] + 0.1, 0.8, wf(61, "aman") - 2);
      c.badge("ulang", "BEKU ULANG: TETAP TIDAK AMAN", "", "#e2453c", "#ffffff", -2.4, 2.45, 0.95, 1.2, wf(61, "dibekukan") - 2);
    },
  },
  { // 62: "Kamu memeriksa persediaan."
    si: 62, set: "valley", light: "day",
    cams: (a) => [{ f: a, s: high([0, 0, 0.3], a, { az: -25, d: 2.2, h: 3.2, ly: 1.1, rate: 0.004 }) }],
    ws: () => ({ board: "fish1", gauge: 1, melt: true, lid: 1 }),
    stage: (c) => {
      c.P(WHO.kamu, -0.55, 0.75, { expr: "neutral", facing: 1 });
    },
  },
  { // 63: "Beberapa bungkus bocor dan banyak yang mulai berubah bentuk."
    si: 63, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: ins([0, 1.25, 0], a, { az: 25, d: 0.85, h: 0.6, fov: 30 }) },
      { f: wf(63, "berubah") - 4, cut: true, s: ins([-0.25, 1.25, 0.1], wf(63, "berubah"), { az: -25, d: 0.8, h: 0.5, fov: 30, roll: -0.06 }) },
    ],
    ws: () => ({ board: "fish1", gauge: 1, melt: true, lid: 1 }),
    stage: (c) => {
      c.mark("BOCOR", "#e2453c", 0.25, 1.6, 0.2, 0.4, wf(63, "bocor") - 2);
    },
  },
  { // 64: "Jumlah dagangan berkurang."
    si: 64, set: "valley", light: "day",
    cams: (a) => [{ f: a, s: cu(K, a, { az: -15, d: 1.6, rate: 0.006 }) }],
    ws: () => ({ board: "fish1", gauge: 1, melt: true }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "pained", facing: 1 });
      c.badge("stok", "STOK: SEDIKIT", "", "#e2453c", "#ffffff", K[0] + 0.55, 1.95, K[2] + 0.1, 0.65, ss(64) + 4);
    },
  },
  { // 65: "Sementara orang-orang terus datang meminta makanan dingin yang kemarin mereka cicipi."
    si: 65, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: frame([-2.8, 0, 2.6], a, 8.0, 2.2, 1.0, { az: 60, fov: 32, orbit: -12 }) },
      { f: wf(65, "dingin") - 4, cut: true, s: two([-1.6, 0, 1.8], wf(65, "dingin"), { az: 20, d: 4.0, h: 1.4 }) },
    ],
    ws: () => ({ board: "fish1", gauge: 1, melt: true }),
    stage: (c) => {
      const k = Math.min(1, (c.f - c.a) / 90);
      const q: [number, number][] = [[-1.6, 1.8], [-2.4, 2.4], [-3.2, 3.0], [-4.0, 3.6], [-4.8, 4.2], [-5.6, 4.8]];
      q.forEach(([x, z], i) => c.P(i % 3 === 1 ? WHO.kid(i) : WHO.tribe(i + 3), x - 1.5 * (1 - k), z + 0.8 * (1 - k), { expr: i % 2 ? "grin" : "smile", prop: i % 2 ? "fish" : null, mode: k < 1 ? "stroll" : "stand", phase: c.t * 1.6 + i * 0.4, facing: 1 }));
      c.P(WHO.kamu, K[0], K[2], { expr: "nervous", facing: 1 });
    },
  },
  { // 66: "Kamu menaikkan harga."
    si: 66, set: "valley", light: "day",
    cams: (a) => [{ f: a, s: ins([-2.55, 1.7, 0.75], a, { az: 14, d: 1.9, h: 0.1, fov: 30, punch: 0.014 }) }],
    kicks: [wf(66, "harga")],
    ws: () => ({ board: "fish1", gauge: 1, melt: true }),
    stage: (c) => {
      c.badge("naik", "HARGA NAIK!", "", "#e2453c", "#ffffff", -2.3, 2.4, 0.95, 0.75, wf(66, "harga") - 2);
    },
  },
  { // 67: "Sekarang satu es krim harus ditukar dengan dua ikan."
    si: 67, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: ms(K, a, { az: -20, d: 3.0 }) },
      { f: wf(67, "dua") - 4, cut: true, s: ins([-2.55, 1.7, 0.75], wf(67, "dua"), { az: -12, d: 1.8, h: 0.1, fov: 30, roll: -0.05 }) },
    ],
    ws: (f) => ({ board: f >= wf(67, "dua") - 4 ? "fish2" : "fish1", gauge: 1, melt: true }),
    stage: (c) => {
      c.P(WHO.kamu, K[0] + 0.3, K[2] + 0.2, { expr: "grin", prop: "point_up", facing: -1 });
    },
  },
  { // 68: "Teman purbamu menatapmu bingung."
    si: 68, set: "valley", light: "day",
    cams: (a) => [{ f: a, s: cu(F, a, { az: -20, d: 1.5, orbit: 10 }) }],
    ws: () => ({ board: "fish2", gauge: 1, melt: true }),
    stage: (c) => {
      c.P(WHO.purba, F[0], F[2], { expr: "dazed", prop: "spear", facing: -1 });
      c.mark("?", "#ffd43b", F[0] - 0.25, 2.25, F[2], 0.5, wf(68, "bingung") - 2);
    },
  },
  { // 69: "Dia menunjuk ikan kecil dan ikan besar."
    si: 69, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: ins([F[0] - 0.45, 1.2, F[2] + 0.1], a, { az: -15, d: 1.0, h: 0.1, fov: 30 }) },
      { f: wf(69, "besar") - 4, cut: true, s: ins([F[0] + 0.45, 1.2, F[2] + 0.1], wf(69, "besar"), { az: 15, d: 1.2, h: 0.1, fov: 30, roll: -0.05 }) },
    ],
    ws: () => ({ board: "fish2", gauge: 1, melt: true }),
    stage: (c) => {
      c.P(WHO.purba, F[0], F[2], { expr: "stern", prop: c.f < wf(69, "besar") - 4 ? "fish" : "fishbig", facing: c.f < wf(69, "besar") - 4 ? -1 : 1 });
      c.mark(c.f < wf(69, "besar") - 4 ? "KECIL" : "BESAR", "#ffd43b", F[0] + (c.f < wf(69, "besar") - 4 ? -0.45 : 0.45), 1.6, F[2] + 0.15, 0.4, wf(69, "ikan"));
    },
  },
  { // 70: "Seolah bertanya apakah keduanya dihargai sama."
    si: 70, set: "valley", light: "day",
    cams: (a) => [{ f: a, s: two([-0.05, 0, 1.0], a, { az: 0, d: 3.6, h: 1.4, rate: 0.003 }) }],
    ws: () => ({ board: "fish2", gauge: 1, melt: true }),
    stage: (c) => {
      c.P(WHO.purba, F[0] - 0.3, F[2], { expr: "stern", prop: "fishbig", facing: -1 });
      c.P(WHO.kamu, K[0] + 0.3, K[2] + 0.3, { expr: "nervous", facing: 1 });
      c.badge("sama", "KECIL = BESAR?", "", "#f2efe6", "#241726", 0, 2.45, 1.0, 1.0, wf(70, "sama") - 2);
    },
  },
  { // 71: "Kamu tidak tahu cara menjawabnya."
    si: 71, set: "valley", light: "day",
    cams: (a) => [{ f: a, s: low(K, a, { az: 30, d: 2.4, ly: 1.45, roll: -0.08 }) }],
    ws: () => ({ board: "fish2", gauge: 1, melt: true }),
    stage: (c) => {
      c.P(WHO.kamu, K[0] + 0.3, K[2] + 0.3, { expr: "dazed", facing: 1 });
      c.mark("...", "#f2efe6", K[0] + 0.5, 2.1, K[2] + 0.3, 0.45, ss(71) + 6);
    },
  },
  { // 72: "Ternyata membuat sistem pembayaran jauh lebih rumit daripada menempelkan daftar harga."
    si: 72, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: wide([-0.6, 0, 0.8], a, { az: 25, d: 8.5, h: 2.4, orbit: -10 }) },
      { f: wf(72, "rumit") - 4, cut: true, s: ins([-2.55, 1.7, 0.75], wf(72, "rumit"), { az: 20, d: 2.4, h: 0.2, fov: 30 }) },
    ],
    ws: () => ({ board: "fish2", gauge: 1, melt: true }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "pained", facing: 1 });
      c.P(WHO.purba, F[0], F[2], { expr: "stern", prop: "fishbig", facing: -1 });
      c.badge("rumit", "SISTEM PEMBAYARAN", "= RUMIT", "#e2453c", "#ffffff", -2.4, 2.5, 0.95, 1.2, wf(72, "rumit") - 2);
    },
  },

  // ---- chapter 6: the sun, the open lid, fuel, the knocking queue, the generator dies, the shade (sentences 73-95) ----
  { // 73: "Masalah berikutnya datang dari matahari."
    si: 73, set: "valley", light: "day", sun: [10, 70], flash: true,
    cams: (a) => [
      { f: a, s: frame([0, 0, 0.3], a, 4.0, 0.5, 2.6, { az: 20, fov: 34, rate: 0.002 }) },
      { f: wf(73, "matahari") - 4, cut: true, s: low(K, wf(73, "matahari"), { az: 30, d: 2.4, ly: 1.5, roll: 0.08 }) },
    ],
    kicks: [wf(73, "matahari")],
    ws: () => ({ board: "fish2", gauge: 1 }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "pained", facing: 1 });
      c.badge("m2", "MASALAH #2", "MATAHARI", "#e2453c", "#ffffff", K[0] + 0.8, 2.05, K[2] + 0.1, 0.9, wf(73, "matahari") - 2);
      c.puffs("panas", K[0], 0.2, K[2] + 0.4, { n: 4, period: 30, life: 40, size: 0.35, rise: 1.0, drift: [0, 0], col: "#ffe2a8" });
    },
  },
  { // 74: "Ketika tutup freezer terlalu sering dibuka, udara hangat masuk."
    si: 74, set: "valley", light: "day", sun: [10, 70],
    cams: (a) => [
      { f: a, s: two([-0.6, 0, 0.9], a, { az: 25, d: 3.6, h: 1.5 }) },
      { f: wf(74, "udara") - 4, cut: true, s: ins([0, 1.3, 0], wf(74, "udara"), { az: 20, d: 1.1, h: 0.5, fov: 30 }) },
    ],
    ws: (f) => ({ board: "fish2", gauge: 1, lid: f < wf(74, "udara") - 4 ? (Math.floor((f - ss(74)) / 14) % 2 ? 1 : 0.15) : 1 }),
    stage: (c) => {
      c.P(WHO.kamu, -0.55, 0.85, { expr: "nervous", prop: "reach", facing: 1 });
      [[-1.8, 1.8], [-2.6, 2.3]].forEach(([x, z], i) => c.P(WHO.tribe(i + 2), x, z, { expr: "grin", prop: "fish", facing: 1 }));
      c.puffs("hangat", 0, 1.9, 0.3, { n: 5, period: 30, life: 30, size: 0.4, rise: -0.45, drift: [0, -0.2], col: "#ffc07a", on: c.f >= wf(74, "udara") - 6 });
      c.badge("hangat", "UDARA HANGAT MASUK", "", "#ff8a3d", "#ffffff", 0.2, 2.2, 0.2, 1.1, wf(74, "hangat") - 2);
    },
  },
  { // 75: "Generator bekerja lebih lama untuk menjaga suhu."
    si: 75, set: "valley", light: "day", sun: [10, 70],
    cams: (a) => [
      { f: a, s: ins([GEN[0], 0.75, GEN[2]], a, { az: 30, d: 1.6, h: 0.2, fov: 30, orbit: -15 }) },
      { f: wf(75, "suhu") - 4, cut: true, s: ins([GEN[0] + 0.25, 0.9, GEN[2] + 0.35], wf(75, "suhu"), { az: 10, d: 0.85, h: 0.05, fov: 30 }) },
    ],
    ws: (f) => ({ board: "fish2", gauge: f < wf(75, "suhu") ? 1 : 2 }),
    stage: (c) => {
      c.mark("BRRR", "#ffd43b", GEN[0] + 0.1, 1.25, GEN[2] + 0.35, 0.55, ss(75) + 2);
      c.badge("lembur", "LEMBUR!", "", "#ffd43b", "#241726", GEN[0] - 0.5, 1.5, GEN[2] + 0.4, 0.6, wf(75, "lama") - 2);
    },
  },
  { // 76: "Bahan bakar menipis jauh lebih cepat daripada perkiraanmu."
    si: 76, set: "valley", light: "day", sun: [10, 70],
    cams: (a) => [
      { f: a, s: ins([GEN[0] + 0.25, 0.9, GEN[2] + 0.35], a, { az: -10, d: 0.85, h: 0.05, fov: 30, punch: 0.012 }) },
      { f: wf(76, "perkiraanmu") - 4, cut: true, s: cu(K, wf(76, "perkiraanmu"), { az: 30, d: 1.5 }) },
    ],
    kicks: [wf(76, "cepat")],
    ws: (f) => ({ board: "fish2", gauge: f < wf(76, "menipis") ? 2 : 3 }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "shock", facing: 1 });
      c.badge("bbm", "BBM: MENIPIS", "", "#e2453c", "#ffffff", GEN[0] - 0.35, 1.25, GEN[2] + 0.5, 0.55, wf(76, "menipis") - 2, wf(76, "perkiraanmu") - 4);
    },
  },
  { // 77: "Kamu mencoba mengurangi jam berjualan."
    si: 77, set: "valley", light: "day", sun: [10, 70],
    cams: (a) => [{ f: a, s: ms([0, 0, 0.6], a, { az: -20, d: 3.4, orbit: 12 }) }],
    ws: (f) => ({ board: "fish2", gauge: 3, top: f >= wf(77, "jam") ? "closed" : null }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "stern", prop: "point_up", facing: 1 });
      c.badge("jam", "BUKA: 2 JAM", "", "#f2efe6", "#241726", K[0] + 0.7, 2.05, K[2] + 0.1, 0.75, wf(77, "jam") - 2);
    },
  },
  { // 78: "Tetapi para pembeli justru berdatangan ketika hari paling panas."
    si: 78, set: "valley", light: "day", sun: [10, 70],
    cams: (a) => [
      { f: a, s: high([-1.5, 0, 2.0], a, { az: 30, d: 6.0, h: 6.5, rise: 1.0 }) },
      { f: wf(78, "panas") - 4, cut: true, s: two([-1.6, 0, 1.8], wf(78, "panas"), { az: -25, d: 4.0, h: 1.4 }) },
    ],
    ws: () => ({ board: "fish2", gauge: 3, top: "closed" }),
    stage: (c) => {
      const k = Math.min(1, (c.f - c.a) / 100);
      const q: [number, number][] = [[-1.4, 1.7], [-2.2, 2.3], [-0.6, 2.4], [-3.0, 2.9], [-1.6, 3.2], [0.4, 2.8], [-3.8, 3.5]];
      q.forEach(([x, z], i) => c.P(i % 3 === 2 ? WHO.kid(i) : WHO.tribe(i + 1), x - 2.5 * (1 - k), z + 1.5 * (1 - k), { expr: "grin", prop: i % 2 ? "fish" : null, mode: k < 1 ? "march" : "stand", phase: c.t * 2 + i * 0.4, facing: 1 }));
      c.badge("panas", "HARI PALING PANAS", "", "#ff8a3d", "#ffffff", -1.2, 2.6, 1.5, 1.1, wf(78, "panas") - 2);
    },
  },
  { // 79: "Begitu gerobak ditutup, mereka mengetuknya bergantian."
    si: 79, set: "valley", light: "day", sun: [10, 70],
    cams: (a) => [
      { f: a, s: ins([0, 1.3, 0.45], a, { az: 15, d: 1.6, h: 0.2, fov: 30 }) },
      { f: wf(79, "bergantian") - 4, cut: true, s: two([0, 0, 1.0], wf(79, "bergantian"), { az: 40, d: 3.6, h: 1.4, orbit: -14 }) },
    ],
    kicks: [wf(79, "mengetuknya"), wf(79, "mengetuknya") + 9, wf(79, "bergantian") + 4],
    ws: () => ({ board: "fish2", gauge: 3, top: "closed" }),
    stage: (c) => {
      const knock = (i: number) => (Math.floor((c.f + i * 5) / 5) % 3 === 0 ? 1 : 0);
      [[-0.55, 0.95], [0.55, 0.95], [-1.2, 1.4]].forEach(([x, z], i) => c.P(i === 2 ? WHO.kid(i) : WHO.tribe(i + 2), x, z, { expr: "stern", prop: "reach", wave: knock(i), facing: x < 0 ? 1 : -1 }));
      c.mark("TOK", "#ffffff", -0.3, 1.55, 0.6, 0.4, wf(79, "mengetuknya"));
      c.mark("TOK", "#ffffff", 0.35, 1.7, 0.6, 0.4, wf(79, "mengetuknya") + 9);
      c.mark("TOK!", "#ffd43b", 0, 1.9, 0.6, 0.45, wf(79, "bergantian") + 4);
    },
  },
  { // 80: "Temanmu sampai mengangkat tombak untuk menjaga antrean."
    si: 80, set: "valley", light: "day", sun: [10, 70],
    cams: (a) => [
      { f: a, s: low(F, a, { az: 30, d: 2.4, ly: 1.6, roll: 0.08, punch: 0.01 }) },
      { f: wf(80, "menjaga") - 4, cut: true, s: two([-0.6, 0, 1.6], wf(80, "menjaga"), { az: -30, d: 4.2, h: 1.5 }) },
    ],
    kicks: [wf(80, "mengangkat")],
    ws: () => ({ board: "fish2", gauge: 3, top: "closed" }),
    stage: (c) => {
      c.P(WHO.purba, F[0], F[2], { expr: "stern", prop: "spear", facing: -1, hop: [wf(80, "mengangkat")] });
      [[-1.0, 2.0], [-1.8, 2.5], [-2.6, 3.0]].forEach(([x, z], i) => c.P(WHO.tribe(i + 3), x, z, { expr: "nervous", facing: 1 }));
      c.badge("tertib", "TERTIB!", "", "#e2453c", "#ffffff", F[0] - 0.3, 2.3, F[2] + 0.1, 0.6, wf(80, "tombak") - 2);
    },
  },
  { // 81: "Bukan untuk mengusir hewan."
    si: 81, set: "valley", light: "day", sun: [10, 70],
    cams: (a) => [{ f: a, s: cu(F, a, { az: -15, d: 1.5, rate: 0.006 }) }],
    ws: () => ({ board: "fish2", gauge: 3, top: "closed" }),
    stage: (c) => {
      c.P(WHO.purba, F[0], F[2], { expr: "stern", prop: "spear", facing: -1 });
      c.mark("BUKAN SERIGALA", "#e2453c", F[0] + 0.5, 2.15, F[2], 0.6, wf(81, "hewan") - 2);
    },
  },
  { // 82: "Sore itu generator tersendat."
    si: 82, set: "valley", light: "golden", sun: [-50, 16],
    cams: (a) => [
      { f: a, s: wide([0.6, 0, 0.2], a, { az: -35, d: 9, h: 2.2, orbit: 6 }) },
      { f: wf(82, "tersendat") - 4, cut: true, s: ins([GEN[0], 0.75, GEN[2]], wf(82, "tersendat"), { az: 30, d: 1.4, h: 0.2, fov: 30, roll: -0.06 }) },
    ],
    kicks: [wf(82, "tersendat") + 4, wf(82, "tersendat") + 14],
    ws: (f) => ({ board: "fish2", gauge: 3, top: "closed", genOn: f < wf(82, "tersendat") || Math.floor(f / 6) % 3 !== 0 }),
    stage: (c) => {
      c.mark("TEK..TEK", "#f2efe6", GEN[0] + 0.1, 1.25, GEN[2] + 0.35, 0.55, wf(82, "tersendat"));
      c.puffs("asap", GEN[0] + 0.35, 0.9, GEN[2] - 0.1, { n: 3, period: 18, life: 30, size: 0.3, rise: 0.6, drift: [0.1, 0], col: "#5a5560", on: c.f >= wf(82, "tersendat") });
    },
  },
  { // 83: "Kamu mencoba menyalakannya lagi."
    si: 83, set: "valley", light: "golden", sun: [-50, 16],
    cams: (a) => [{ f: a, s: ms([GEN[0] - 0.9, 0, GEN[2] + 0.55], a, { az: 40, d: 2.6, orbit: -10 }) }],
    ws: () => ({ board: "fish2", gauge: 3, top: "closed", genOn: false }),
    stage: (c) => {
      const tug = Math.floor((c.f - ss(83)) / 6) % 2;
      c.P(WHO.kamu, GEN[0] - 0.9, GEN[2] + 0.55, { expr: "pained", prop: "reach", wave: tug, facing: 1 });
      c.mark("SRET!", "#ffffff", GEN[0] - 0.3, 1.3, GEN[2] + 0.5, 0.45, ss(83) + 10);
    },
  },
  { // 84: "Mesin sempat hidup, kemudian mati."
    si: 84, set: "valley", light: "golden", sun: [-50, 16],
    cams: (a) => [
      { f: a, s: ins([GEN[0], 0.75, GEN[2]], a, { az: -25, d: 1.3, h: 0.15, fov: 30 }) },
      { f: wf(84, "mati") - 3, cut: true, s: cu([GEN[0] - 0.9, 0, GEN[2] + 0.55], wf(84, "mati"), { az: 35, d: 1.5, roll: 0.06 }) },
    ],
    kicks: [wf(84, "hidup")],
    ws: (f) => ({ board: "fish2", gauge: 4, top: "closed", genOn: f >= wf(84, "hidup") && f < wf(84, "mati") }),
    stage: (c) => {
      c.P(WHO.kamu, GEN[0] - 0.9, GEN[2] + 0.55, { expr: c.f < wf(84, "mati") ? "grin" : "shock", facing: 1 });
      if (c.f < wf(84, "mati")) c.mark("BRRR!", "#ffd43b", GEN[0] + 0.1, 1.25, GEN[2] + 0.35, 0.55, wf(84, "hidup"));
      c.puffs("mati", GEN[0] + 0.35, 0.9, GEN[2] - 0.1, { n: 2, period: 40, life: 40, size: 0.5, rise: 0.5, drift: [0, 0], col: "#4a4550", on: c.f >= wf(84, "mati") });
    },
  },
  { // 85: "Tangkinya hampir kosong."
    si: 85, set: "valley", light: "golden", sun: [-50, 16],
    cams: (a) => [{ f: a, s: ins([GEN[0] + 0.25, 0.9, GEN[2] + 0.35], a, { az: 10, d: 0.8, h: 0.05, fov: 30, punch: 0.014, roll: -0.05 }) }],
    kicks: [wf(85, "kosong")],
    ws: () => ({ board: "fish2", gauge: 4, top: "closed", genOn: false }),
    stage: (c) => {
      c.badge("kosong", "TANGKI: KOSONG", "", "#e2453c", "#ffffff", GEN[0] - 0.2, 1.2, GEN[2] + 0.55, 0.5, wf(85, "kosong") - 2);
    },
  },
  { // 86: "Kamu terdiam."
    si: 86, set: "valley", light: "golden", sun: [-50, 16],
    cams: (a) => [{ f: a, s: cu([GEN[0] - 0.9, 0, GEN[2] + 0.55], a, { az: 5, d: 1.4, rate: 0.006 }) }],
    ws: () => ({ board: "fish2", gauge: 4, top: "closed", genOn: false }),
    stage: (c) => {
      c.P(WHO.kamu, GEN[0] - 0.9, GEN[2] + 0.55, { expr: "dazed" });
    },
  },
  { // 87: "Tidak ada bengkel."
    si: 87, set: "valley", light: "golden", sun: [-50, 16],
    cams: (a) => [{ f: a, s: frame([-4, 0, -12], a, 14, 2.0, 1.6, { az: 180, fov: 34, rate: 0.003 }) }],
    ws: () => ({ board: "fish2", gauge: 4, top: "closed", genOn: false }),
    stage: (c) => {
      c.badge("bengkel", "BENGKEL?", "TIDAK ADA", "#e2453c", "#ffffff", -4, 2.5, -10, 1.6, ss(87));
    },
  },
  { // 88: "Tidak ada SPBU."
    si: 88, set: "valley", light: "golden", sun: [-50, 16],
    cams: (a) => [{ f: a, s: frame([6, 0, -12], a, 14, 2.0, 1.6, { az: 150, fov: 34, rate: 0.003, roll: 0.05 }) }],
    ws: () => ({ board: "fish2", gauge: 4, top: "closed", genOn: false }),
    stage: (c) => {
      c.badge("spbu", "SPBU?", "TIDAK ADA", "#e2453c", "#ffffff", 6, 2.5, -10, 1.6, ss(88));
    },
  },
  { // 89: "Dan tidak ada orang yang bisa menyuling bahan bakar pengganti di sekitar lembah."
    si: 89, set: "valley", light: "golden", sun: [-50, 16],
    cams: (a) => [
      { f: a, s: two([-4.8, 0, -2.2], a, { az: 30, d: 4.6, h: 1.5 }) },
      { f: wf(89, "lembah") - 6, cut: true, s: high([-1, 0, -1], wf(89, "lembah"), { az: 20, d: 9, h: 9, ly: 0.5, rise: 2.5, rate: 0.0012 }) },
    ],
    ws: () => ({ board: "fish2", gauge: 4, top: "closed", genOn: false, fire: true }),
    stage: (c) => {
      c.P(WHO.tribe(1), -5.9, -1.9, { expr: "dazed", mode: "sit" });
      c.P(WHO.tribe(5), -4.4, -1.8, { expr: "neutral", mode: "sit", prop: "stone" });
      c.P(WHO.purba, -3.6, -1.0, { expr: "dazed", prop: "fuel", facing: -1 });
      c.mark("?", "#ffd43b", -3.8, 2.25, -1.0, 0.5, wf(89, "menyuling"));
    },
  },
  { // 90: "Dalam beberapa jam, daganganmu akan mulai menghangat."
    si: 90, set: "valley", light: "golden", sun: [-50, 16],
    cams: (a) => [
      { f: a, s: ins([0, 1.3, 0.45], a, { az: -10, d: 1.4, h: 0.3, fov: 30 }) },
      { f: wf(90, "menghangat") - 4, cut: true, s: ins([0, 1.25, 0], wf(90, "menghangat"), { az: 20, d: 0.9, h: 0.55, fov: 30, roll: 0.05 }) },
    ],
    ws: (f) => ({ board: "fish2", gauge: 4, genOn: false, lid: f >= wf(90, "menghangat") - 4 ? 1 : 0, top: "closed" }),
    stage: (c) => {
      c.badge("jam", "KIRA-KIRA 4 JAM LAGI", "", "#ff8a3d", "#ffffff", 0.35, 1.9, 0.45, 0.7, wf(90, "jam") - 2, wf(90, "menghangat") - 4);
      c.puffs("hangat2", 0, 1.4, 0, { n: 3, period: 24, life: 40, size: 0.2, rise: 0.3, drift: [0.05, 0.05], col: "#ffd9a8", on: c.f >= wf(90, "menghangat") });
    },
  },
  { // 91: "Kamu panik mencari cara."
    si: 91, set: "valley", light: "golden", sun: [-50, 16],
    cams: (a) => [{ f: a, s: low([-0.2, 0, 1.2], a, { az: -30, d: 3.0, ly: 1.3, roll: -0.09, orbit: 30, rate: 0.005 }) }],
    kicks: [ss(91) + 2],
    ws: () => ({ board: "fish2", gauge: 4, genOn: false, top: "closed" }),
    stage: (c) => {
      const k = (c.f - ss(91)) / 40, x = -0.2 + 1.2 * Math.sin(k * Math.PI);
      c.P(WHO.kamu, x, 1.2, { expr: "shock", mode: "march", phase: c.t * 3, facing: Math.cos(k * Math.PI) > 0 ? 1 : -1 });
      c.mark("!!", "#e2453c", x, 2.1, 1.2, 0.45, ss(91) + 4);
    },
  },
  { // 92: "Gerobak didorong ke tempat teduh."
    si: 92, set: "valley", light: "golden", sun: [-50, 16],
    cams: (a) => [{ f: a, s: frame([-3.5, 0, -2.4], a, 8.0, 2.4, 0.9, { az: 60, fov: 32, orbit: -12, rate: 0.0016 }) }],
    ws: (f) => { const k = Math.max(0, Math.min(1, (f - ss(92)) / 50)); return { board: "fish2", gauge: 4, genOn: false, top: "closed", cart: [CSH[0] * k, 0, CSH[2] * k] as V3 }; },
    stage: (c) => {
      const k = Math.max(0, Math.min(1, (c.f - ss(92)) / 50)), cx = CSH[0] * k, cz = CSH[2] * k;
      c.P(WHO.kamu, cx + 0.95, cz + 0.65, { expr: "pained", mode: k < 1 ? "march" : "stand", phase: c.t * 1.4, facing: -1, prop: "reach" });
      c.P(WHO.purba, cx + 0.95, cz - 0.4, { expr: "stern", mode: k < 1 ? "march" : "stand", phase: c.t * 1.4 + 0.5, facing: -1, prop: "reach" });
      c.badge("teduh", "TEMPAT TEDUH", "", "#3fb950", "#ffffff", CSH[0], 2.6, CSH[2] - 0.6, 1.0, wf(92, "seduh") - 6);
    },
  },
  { // 93: "Tutup freezer ditahan agar tetap rapat."
    si: 93, set: "valley", light: "golden", sun: [-50, 16],
    cams: (a) => [
      { f: a, s: ms([CSH[0], 0, CSH[2] + 0.6], a, { az: 30, d: 3.0 }) },
      { f: wf(93, "rapat") - 4, cut: true, s: ins([CSH[0], 1.3, CSH[2] + 0.4], wf(93, "rapat"), { az: 10, d: 1.0, h: 0.2, fov: 30 }) },
    ],
    ws: () => ({ board: "fish2", gauge: 4, genOn: false, top: "closed", cart: CSH }),
    stage: (c) => {
      c.P(WHO.kamu, CSH[0] - 0.3, CSH[2] + 0.75, { expr: "pained", prop: "reach", facing: 1 });
      c.P(WHO.purba, CSH[0] + 0.5, CSH[2] + 0.75, { expr: "stern", prop: "reach", facing: -1 });
      c.badge("rapat", "JANGAN DIBUKA!", "", "#e2453c", "#ffffff", CSH[0], 2.15, CSH[2] + 0.4, 0.85, wf(93, "rapat") - 2);
    },
  },
  { // 94: "Tetapi semua itu hanya memperlambat kenaikan suhu."
    si: 94, set: "valley", light: "golden", sun: [-50, 16],
    cams: (a) => [
      { f: a, s: frame([CSH[0], 0, CSH[2]], a, 5.0, 1.8, 1.0, { az: -30, fov: 32, orbit: 15 }) },
      { f: wf(94, "suhu") - 4, cut: true, s: ins([CSH[0] + 0.35, 1.2, CSH[2] + 0.45], wf(94, "suhu"), { az: 15, d: 1.1, h: 0.1, fov: 30 }) },
    ],
    ws: () => ({ board: "fish2", gauge: 4, genOn: false, top: "closed", cart: CSH }),
    stage: (c) => {
      c.P(WHO.kamu, CSH[0] - 0.3, CSH[2] + 0.85, { expr: "nervous", mode: "sit" });
      const k = Math.max(0, Math.min(1, (c.f - wf(94, "kenaikan")) / 50));
      c.badge("suhu2", `SUHU ${Math.round(-12 + 6 * k)}°C`, "PELAN-PELAN NAIK", "#ff8a3d", "#ffffff", CSH[0] + 0.35, 1.5, CSH[2] + 0.55, 0.65, wf(94, "suhu") - 2);
    },
  },
  { // 95: "Bukan menciptakan dingin baru."
    si: 95, set: "valley", light: "golden", sun: [-50, 16],
    cams: (a) => [{ f: a, s: cu([CSH[0] - 0.3, 0, CSH[2] + 0.85], a, { az: 20, d: 1.6, rate: 0.005 }) }],
    ws: () => ({ board: "fish2", gauge: 4, genOn: false, top: "closed", cart: CSH }),
    stage: (c) => {
      c.P(WHO.kamu, CSH[0] - 0.3, CSH[2] + 0.85, { expr: "pained", mode: "sit" });
      c.badge("dingin", "BUKAN DINGIN BARU", "", "#241726", "#bfe8ff", CSH[0] + 0.35, 1.55, CSH[2] + 0.8, 0.7, wf(95, "dingin") - 2);
    },
  },

  // ---- chapter 7: the last ice cream, spoiling profit, bankrupt, the cool river, sustainable food (sentences 96-112) ----
  { // 96: "Malam berikutnya, es krim terakhir tak lagi layak dijual."
    si: 96, set: "valley", light: "night", flash: true,
    cams: (a) => [
      { f: a, s: frame([CSH[0], 0, CSH[2]], a, 7.5, 2.4, 1.0, { az: 50, fov: 32, rate: 0.0018 }) },
      { f: wf(96, "terakhir") - 4, cut: true, s: ins([CSH[0], 1.25, CSH[2]], wf(96, "terakhir"), { az: 15, d: 0.9, h: 0.55, fov: 30 }) },
    ],
    ws: () => ({ stars: true, moon: true, fire: true, gauge: 4, genOn: false, top: "closed", cart: CSH, melt: true, lid: 1 }),
    stage: (c) => {
      c.badge("terakhir", "ES KRIM TERAKHIR", "TIDAK LAYAK", "#e2453c", "#ffffff", CSH[0] + 0.3, 1.85, CSH[2] + 0.3, 0.8, wf(96, "layak") - 2);
    },
  },
  { // 97: "Kamu membuang produk yang sudah rusak dan duduk lesu di samping gerobak."
    si: 97, set: "valley", light: "night",
    cams: (a) => [
      { f: a, s: ms([CSH[0] + 1.0, 0, CSH[2] + 0.8], a, { az: 30, d: 3.0 }) },
      { f: wf(97, "duduk") - 4, cut: true, s: frame([CSH[0] + 0.9, 0, CSH[2] + 0.9], wf(97, "duduk"), 3.2, 0.9, 0.7, { az: -25, fov: 30, rate: 0.0024, orbit: 10 }) },
    ],
    ws: () => ({ stars: true, moon: true, fire: true, gauge: 4, genOn: false, top: "closed", cart: CSH, melt: true }),
    stage: (c) => {
      if (c.f < wf(97, "duduk") - 4) c.P(WHO.kamu, CSH[0] + 1.0, CSH[2] + 0.8, { expr: "pained", prop: "melted", facing: 1 });
      else { c.P(WHO.kamu, CSH[0] + 0.9, CSH[2] + 0.9, { expr: "pained", mode: "sit" }); c.mark("hhh...", "#bfe8ff", CSH[0] + 1.3, 1.25, CSH[2] + 0.9, 0.45, wf(97, "lesu") - 2); }
      c.badge("buang", "BUANG", "", "#241726", "#f2efe6", CSH[0] + 1.5, 1.45, CSH[2] + 0.8, 0.5, wf(97, "membuang"), wf(97, "duduk") - 4);
    },
  },
  { // 98: "Seluruh keuntunganmu berupa ikan dan buah juga tidak bisa disimpan lama."
    si: 98, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: ins([CSH[0] + 1.6, 0.2, CSH[2] + 0.4], a, { az: 25, d: 1.9, h: 0.8, fov: 30, orbit: -15 }) },
      { f: wf(98, "lama") - 6, cut: true, s: ins([CSH[0] + 1.6, 0.15, CSH[2] + 0.4], wf(98, "lama"), { az: -20, d: 1.2, h: 0.45, fov: 30, roll: 0.05 }) },
    ],
    ws: () => ({ gauge: 4, genOn: false, top: "closed", cart: CSH, melt: true }),
    stage: (c) => {
      c.puffs("bau2", CSH[0] + 1.6, 0.3, CSH[2] + 0.4, { n: 4, period: 30, life: 60, size: 0.3, rise: 0.6, drift: [0.1, 0], col: "#cfe3a8" });
      c.badge("untung2", "KEUNTUNGAN:", "IKAN & BUAH", "#3fb950", "#ffffff", CSH[0] + 1.6, 1.25, CSH[2] + 0.4, 0.75, wf(98, "ikan") - 2, wf(98, "lama") - 6);
      c.badge("simpan", "TIDAK TAHAN LAMA", "", "#e2453c", "#ffffff", CSH[0] + 1.6, 0.95, CSH[2] + 0.4, 0.7, wf(98, "lama") - 2);
    },
  },
  { // 99: "Sebagian harus segera dimakan atau diolah agar tidak busuk."
    si: 99, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: two([-4.6, 0, -1.8], a, { az: 25, d: 4.0, h: 1.4 }) },
      { f: wf(99, "busuk") - 4, cut: true, s: ins([-5.2, 0.6, -2.6], wf(99, "busuk"), { az: 30, d: 1.3, h: 0.25, fov: 30 }) },
    ],
    ws: () => ({ gauge: 4, genOn: false, top: "closed", cart: CSH, fire: true }),
    stage: (c) => {
      c.P(WHO.tribe(1), -5.9, -1.9, { expr: "grin", mode: "sit", prop: "fish" });
      c.P(WHO.tribe(4), -4.4, -1.8, { expr: "lick", mode: "sit", prop: "fishbig" });
      c.P(WHO.kid(2), -3.6, -2.2, { expr: "laugh", prop: "basket" });
      c.badge("makan", "MAKAN SEKARANG!", "", "#ffd43b", "#241726", -5.0, 2.4, -2.0, 1.0, wf(99, "dimakan") - 2);
    },
  },
  { // 100: "Kamu mengeluh kepada teman purbamu."
    si: 100, set: "valley", light: "day",
    cams: (a) => [{ f: a, s: two([CSH[0] + 1.3, 0, CSH[2] + 1.0], a, { az: 30, d: 3.6, h: 1.4, orbit: -12 }) }],
    ws: () => ({ gauge: 4, genOn: false, top: "closed", cart: CSH }),
    stage: (c) => {
      c.P(WHO.kamu, CSH[0] + 0.9, CSH[2] + 0.9, { expr: "pained", wave: Math.floor(c.f / 8) % 2, facing: 1 });
      c.P(WHO.purba, CSH[0] + 2.0, CSH[2] + 1.0, { expr: "neutral", prop: "spear", facing: -1 });
      c.mark("huuu", "#f2efe6", CSH[0] + 0.6, 2.05, CSH[2] + 0.9, 0.45, wf(100, "mengeluh"));
    },
  },
  { // 101: "Bisnismu bangkrut, bahkan sebelum sempat membuka cabang kedua."
    si: 101, set: "valley", light: "day",
    cams: (a) => [
      { f: a, s: low([CSH[0], 0, CSH[2]], a, { az: 35, d: 3.0, ly: 1.3, roll: -0.09, punch: 0.012 }) },
      { f: wf(101, "cabang") - 4, cut: true, s: cu([CSH[0] + 0.9, 0, CSH[2] + 0.9], wf(101, "cabang"), { az: 20, d: 1.5 }) },
    ],
    kicks: [wf(101, "bangkrut")],
    ws: () => ({ gauge: 4, genOn: false, top: "closed", cart: CSH }),
    stage: (c) => {
      c.P(WHO.kamu, CSH[0] + 0.9, CSH[2] + 0.9, { expr: "dazed", facing: 1 });
      c.badge("bangkrut", "BANGKRUT", "", "#e2453c", "#ffffff", CSH[0], 2.35, CSH[2] + 0.5, 1.0, wf(101, "bangkrut") - 2, wf(101, "cabang") - 4);
      c.badge("cabang", "CABANG KE-2", "BATAL", "#241726", "#ffd43b", CSH[0] + 1.55, 2.0, CSH[2] + 0.9, 0.7, wf(101, "cabang") - 2);
    },
  },
  { // 102: "Anehnya, temanmu tidak ikut sedih."
    si: 102, set: "valley", light: "day",
    cams: (a) => [{ f: a, s: cu([CSH[0] + 2.0, 0, CSH[2] + 1.0], a, { az: -25, d: 1.5, orbit: 12 }) }],
    ws: () => ({ gauge: 4, genOn: false, top: "closed", cart: CSH }),
    stage: (c) => {
      c.P(WHO.purba, CSH[0] + 2.0, CSH[2] + 1.0, { expr: "grin", prop: "spear", facing: -1, hop: [wf(102, "sedih")] });
    },
  },
  { // 103: "Dia mengajakmu menuju aliran sungai yang teduh, lalu memperlihatkan buah-buahan yang tadi ia kumpulkan."
    si: 103, set: "river", light: "day",
    cams: (a) => [
      { f: a, s: wide([RV + 1.5, 0, 0.5], a, { az: -35, d: 9, h: 2.4 }) },
      { f: wf(103, "memperlihatkan") - 4, cut: true, s: two([RV + 1.2, 0, 0.2], wf(103, "memperlihatkan"), { az: 20, d: 3.6, h: 1.4 }) },
      { f: wf(103, "kumpulkan") - 6, cut: true, s: ins([RV + 1.0, 1.15, 0.4], wf(103, "kumpulkan"), { az: 15, d: 1.0, h: 0.1, fov: 30 }) },
    ],
    stage: (c) => {
      const k = Math.min(1, (c.f - c.a) / 100);
      c.P(WHO.purba, RV - 4 + 5.0 * k, 3 - 2.6 * k, { expr: "grin", prop: c.f >= wf(103, "memperlihatkan") ? "basket" : null, mode: k < 1 ? "stroll" : "stand", phase: c.t * 1.8, facing: 1 });
      c.P(WHO.kamu, RV - 5 + 5.0 * k, 3.6 - 2.6 * k, { expr: "neutral", mode: k < 1 ? "stroll" : "stand", phase: c.t * 1.8 + 0.5, facing: 1 });
      c.badge("sungai", "SUNGAI YANG TEDUH", "", "#3fb950", "#ffffff", RV + 2.5, 2.6, -1.0, 1.2, wf(103, "sungai") - 2, wf(103, "memperlihatkan") - 4);
    },
  },
  { // 104: "Sebagian sudah disimpan dalam wadah tertutup dan diletakkan di tempat sejuk."
    si: 104, set: "river", light: "day",
    cams: (a) => [
      { f: a, s: ins([RV + 1.5, 0.35, -0.9], a, { az: 20, d: 1.7, h: 0.6, fov: 30, orbit: -20 }) },
      { f: wf(104, "sejuk") - 4, cut: true, s: ins([RV + 1.2, 0.45, -1.2], wf(104, "sejuk"), { az: -15, d: 1.0, h: 0.2, fov: 30, roll: 0.05 }) },
    ],
    stage: (c) => {
      c.badge("wadah", "WADAH TERTUTUP", "", "#f2efe6", "#241726", RV + 1.3, 1.05, -0.8, 0.75, wf(104, "wadah") - 2, wf(104, "sejuk") - 4);
      c.badge("sejuk", "TEMPAT SEJUK", "", "#bfe8ff", "#241726", RV + 1.3, 0.95, -0.9, 0.6, wf(104, "sejuk") - 2);
    },
  },
  { // 105: "Bukan membeku, hanya lebih nyaman dimakan saat cuaca panas."
    si: 105, set: "river", light: "day",
    cams: (a) => [
      { f: a, s: cu([RV + 0.9, 0, 0.3], a, { az: 25, d: 1.6 }) },
      { f: wf(105, "nyaman") - 4, cut: true, s: two([RV + 0.6, 0, 0.4], wf(105, "nyaman"), { az: -20, d: 3.4, h: 1.4 }) },
    ],
    stage: (c) => {
      c.P(WHO.kamu, RV + 0.0, 0.5, { expr: c.f >= wf(105, "nyaman") ? "smile" : "neutral", prop: "fish", facing: 1 });
      c.P(WHO.purba, RV + 1.3, 0.3, { expr: "grin", prop: "basket", facing: -1 });
      c.badge("beku", "BUKAN BEKU", "CUMA SEJUK", "#3fb950", "#ffffff", RV + 0.6, 2.4, 0.3, 0.8, wf(105, "membekuh") - 2);
    },
  },
  { // 106: "Dia membagikannya kepada anak-anak kelompok."
    si: 106, set: "river", light: "day",
    cams: (a) => [{ f: a, s: two([RV + 0.6, 0, 0.8], a, { az: 30, d: 4.0, h: 1.4, orbit: -14 }) }],
    stage: (c) => {
      c.P(WHO.purba, RV + 1.3, 0.3, { expr: "laugh", prop: "basket", facing: -1 });
      [[RV - 0.2, 1.1], [RV + 0.4, 1.7], [RV + 1.2, 1.6]].forEach(([x, z], i) => c.P(WHO.kid(i), x, z, { expr: "laugh", prop: c.f >= wf(106, "membagikannya") + i * 10 ? "basket" : null, facing: 1, hop: [wf(106, "membagikannya") + i * 10] }));
    },
  },
  { // 107: "Mereka tersenyum dan menikmati buah bersama."
    si: 107, set: "river", light: "golden", sun: [-30, 22],
    cams: (a) => [
      { f: a, s: cu([RV + 0.4, 0, 1.7], a, { az: 15, d: 1.6 }) },
      { f: wf(107, "bersama") - 4, cut: true, s: wide([RV + 0.6, 0, 1.0], wf(107, "bersama"), { az: 20, d: 8, h: 2.2, orbit: -8 }) },
    ],
    stage: (c) => {
      [[RV - 0.2, 1.1], [RV + 0.4, 1.7], [RV + 1.2, 1.6]].forEach(([x, z], i) => c.P(WHO.kid(i), x, z, { expr: i === 1 ? "lick" : "laugh", prop: "basket", facing: x < RV + 0.5 ? 1 : -1 }));
      c.P(WHO.purba, RV + 1.9, 0.6, { expr: "smile_closed", facing: -1 });
      c.P(WHO.kamu, RV - 0.9, 0.5, { expr: "smile", facing: 1 });
    },
  },
  { // 108: "Tak ada generator, tak ada freezer, dan tidak ada antrean panjang."
    si: 108, set: "river", light: "golden", sun: [-30, 22],
    cams: (a) => [
      { f: a, s: frame([RV + 0.6, 0, 1.0], a, 5.0, 1.6, 1.0, { az: -30, fov: 32, orbit: 18 }) },
    ],
    stage: (c) => {
      [[RV - 0.2, 1.1], [RV + 0.4, 1.7], [RV + 1.2, 1.6]].forEach(([x, z], i) => c.P(WHO.kid(i), x, z, { expr: "laugh", prop: "basket", facing: x < RV + 0.5 ? 1 : -1 }));
      c.P(WHO.purba, RV + 1.9, 0.6, { expr: "smile_closed", facing: -1 });
      c.badge("x1", "TANPA GENERATOR", "", "#241726", "#ffd43b", RV - 0.6, 2.55, 0.8, 0.8, wf(108, "generator") - 2);
      c.badge("x2", "TANPA FREEZER", "", "#241726", "#ffd43b", RV + 0.6, 2.75, 0.8, 0.8, wf(108, "freezer") - 2);
      c.badge("x3", "TANPA ANTREAN", "", "#241726", "#ffd43b", RV + 1.8, 2.55, 0.8, 0.8, wf(108, "anterian") - 2);
    },
  },
  { // 109: "Kamu baru mengerti."
    si: 109, set: "river", light: "golden", sun: [-30, 22],
    cams: (a) => [{ f: a, s: cu([RV - 0.9, 0, 0.5], a, { az: 25, d: 1.5, rate: 0.006, punch: 0.01 }) }],
    kicks: [wf(109, "mengerti")],
    stage: (c) => {
      c.P(WHO.kamu, RV - 0.9, 0.5, { expr: "shock", facing: 1 });
      c.mark("!", "#ffd43b", RV - 0.75, 2.1, 0.5, 0.5, wf(109, "mengerti") - 1);
    },
  },
  { // 110: "Orang-orang itu bukan membutuhkan es krim setiap hari."
    si: 110, set: "river", light: "golden", sun: [-30, 22],
    cams: (a) => [{ f: a, s: ms([RV - 0.9, 0, 0.5], a, { az: -30, d: 3.0, orbit: 10 }) }],
    stage: (c) => {
      c.P(WHO.kamu, RV - 0.9, 0.5, { expr: "neutral", prop: "point_up", facing: 1 });
      c.badge("tiaphari", "ES KRIM TIAP HARI?", "TIDAK PERLU", "#241726", "#ffd43b", RV - 0.2, 2.1, 0.5, 0.95, wf(110, "eskrim") - 2);
    },
  },
  { // 111: "Mereka menyukai rasa baru yang kamu bawa."
    si: 111, set: "river", light: "golden", sun: [-30, 22],
    cams: (a) => [{ f: a, s: two([RV + 0.4, 0, 1.3], a, { az: 10, d: 4.0, h: 1.5, rate: 0.003 }) }],
    stage: (c) => {
      [[RV - 0.2, 1.1], [RV + 0.4, 1.7], [RV + 1.2, 1.6]].forEach(([x, z], i) => c.P(WHO.kid(i), x, z, { expr: "laugh", prop: "basket", facing: x < RV + 0.5 ? 1 : -1 }));
      c.badge("rasa", "SUKA RASA BARU!", "", "#ff7aa8", "#ffffff", RV + 0.4, 2.3, 1.4, 0.9, wf(111, "rasa") - 2);
    },
  },
  { // 112: "Tetapi mereka tetap membutuhkan makanan yang bisa didapat secara berkelanjutan."
    si: 112, set: "river", light: "golden", sun: [-30, 22],
    cams: (a) => [
      { f: a, s: ins([RV + 1.5, 0.35, -0.9], a, { az: 30, d: 2.0, h: 0.8, fov: 30 }) },
      { f: wf(112, "berkelanjutan") - 6, cut: true, s: high([RV + 1.5, 0, 0], wf(112, "berkelanjutan"), { az: -20, d: 8, h: 7, rise: 2, rate: 0.0012 }) },
    ],
    stage: (c) => {
      c.P(WHO.purba, RV + 2.2, -0.4, { expr: "smile_closed", prop: "basket", facing: -1 });
      c.badge("lanjut", "MAKANAN", "BERKELANJUTAN", "#3fb950", "#ffffff", RV + 1.5, 2.4, -0.6, 1.3, wf(112, "berkelanjutan") - 2);
    },
  },
  // ---- chapter 8: the cart becomes a store, the kid with the fish, the stick toy, the recap, the punchline (sentences 113-129) ----
  { // 113: "Keesokan paginya, kamu mengubah gerobak menjadi tempat menyimpan peralatan dan berteduh."
    si: 113, set: "valley", light: "golden", sun: [60, 14], flash: true,
    cams: (a) => [
      { f: a, s: wide([CSH[0] + 0.8, 0, CSH[2]], a, { az: 40, d: 8.5, h: 2.4 }) },
      { f: wf(113, "peralatan") - 4, cut: true, s: ms([CSH[0], 0, CSH[2] + 0.4], wf(113, "peralatan"), { az: -25, d: 3.0, orbit: 12 }) },
    ],
    ws: (f) => ({ gauge: 4, genOn: false, cart: CSH, lid: 1, melt: true, top: f >= wf(113, "mengubah") ? "store" : "closed" }),
    stage: (c) => {
      if (c.f < wf(113, "berteduh")) c.P(WHO.kamu, CSH[0] + 1.0, CSH[2] + 0.8, { expr: "smile", prop: "spear", facing: -1 });
      else c.P(WHO.kamu, CSH[0] + 0.85, CSH[2] + 0.95, { expr: "smile_closed", mode: "sit" });
      c.badge("toko", "BUKAN TOKO LAGI", "", "#8a5a34", "#ffffff", CSH[0] - 0.4, 2.7, CSH[2], 1.0, wf(113, "mengubah") - 2, wf(113, "peralatan") - 4);
    },
  },
  { // 114: "Teman purbamu menggunakannya untuk menaruh keranjang buah agar tidak terkena hujan."
    si: 114, set: "valley", light: "golden", sun: [60, 14],
    cams: (a) => [
      { f: a, s: two([CSH[0] + 0.6, 0, CSH[2] + 0.6], a, { az: 25, d: 3.8, h: 1.4 }) },
      { f: wf(114, "hujan") - 4, cut: true, s: ins([CSH[0], 1.3, CSH[2]], wf(114, "hujan"), { az: 20, d: 1.2, h: 0.4, fov: 30 }) },
    ],
    ws: () => ({ gauge: 4, genOn: false, cart: CSH, lid: 1, melt: true, top: "store" }),
    stage: (c) => {
      c.P(WHO.purba, CSH[0] + 0.6, CSH[2] + 0.7, { expr: "grin", prop: c.f < wf(114, "keranjang") + 25 ? "basket" : null, facing: -1 });
      c.badge("hujan", "ANTI HUJAN", "", "#4f9ed0", "#ffffff", CSH[0] + 0.4, 1.95, CSH[2] + 0.2, 0.7, wf(114, "hujan") - 2);
    },
  },
  { // 115: "Namun kejutan terakhir muncul saat seorang anak mendekat."
    si: 115, set: "valley", light: "golden", sun: [60, 14],
    cams: (a) => [
      { f: a, s: low([CSH[0] + 2.4, 0, CSH[2] + 1.8], a, { az: -50, d: 3.2, ly: 0.9, roll: 0.07 }) },
    ],
    ws: () => ({ gauge: 4, genOn: false, cart: CSH, top: "store" }),
    stage: (c) => {
      const k = Math.min(1, (c.f - c.a) / 90);
      c.P(WHO.kid(0), CSH[0] + 5.5 - 3.1 * k, CSH[2] + 3.0 - 1.2 * k, { expr: "smile", prop: "fish", mode: k < 1 ? "stroll" : "stand", phase: c.t * 1.9, facing: -1 });
      c.P(WHO.kamu, CSH[0] + 0.85, CSH[2] + 0.95, { expr: "neutral", mode: "sit" });
      c.badge("kejutan", "KEJUTAN TERAKHIR", "", "#ffd43b", "#241726", CSH[0] + 1.8, 2.3, CSH[2] + 1.5, 1.0, wf(115, "kejutan") - 2);
    },
  },
  { // 116: "Dia menyerahkan ikan kecil, lalu menunjuk gerobakmu sambil tersenyum."
    si: 116, set: "valley", light: "golden", sun: [60, 14],
    cams: (a) => [
      { f: a, s: ins([CSH[0] + 2.15, 1.0, CSH[2] + 1.85], a, { az: 15, d: 1.0, h: 0.1, fov: 30 }) },
      { f: wf(116, "menunjuk") - 4, cut: true, s: two([CSH[0] + 1.6, 0, CSH[2] + 1.4], wf(116, "menunjuk"), { az: 30, d: 3.4, h: 1.2 }) },
    ],
    ws: () => ({ gauge: 4, genOn: false, cart: CSH, top: "store" }),
    stage: (c) => {
      c.P(WHO.kid(0), CSH[0] + 2.4, CSH[2] + 1.8, { expr: c.f >= wf(116, "tersenyum") - 2 ? "grin" : "smile", prop: c.f < wf(116, "menunjuk") ? "fish" : "reach", facing: -1 });
      c.P(WHO.kamu, CSH[0] + 0.85, CSH[2] + 0.95, { expr: "neutral", mode: "sit" });
    },
  },
  { // 117: "Kamu menggeleng, merasa bersalah karena tak punya es krim lagi."
    si: 117, set: "valley", light: "golden", sun: [60, 14],
    cams: (a) => [
      { f: a, s: cu([CSH[0] + 0.85, 0, CSH[2] + 0.95], a, { az: 30, d: 1.6, h: 1.0, ly: 0.9 }) },
      { f: wf(117, "eskrim") - 4, cut: true, s: ins([CSH[0], 1.25, CSH[2]], wf(117, "eskrim"), { az: 20, d: 1.0, h: 0.5, fov: 30 }) },
    ],
    ws: (f) => ({ gauge: 4, genOn: false, cart: CSH, top: "store", lid: f >= wf(117, "eskrim") - 4 ? 1 : 0, melt: true }),
    stage: (c) => {
      c.P(WHO.kamu, CSH[0] + 0.85, CSH[2] + 0.95, { expr: "pained", mode: "sit", facing: ([1, -1] as const)[Math.floor(c.f / 6) % 2] });
      c.badge("habis", "ES KRIM: HABIS", "", "#e2453c", "#ffffff", CSH[0] + 0.3, 1.8, CSH[2] + 0.3, 0.75, wf(117, "eskrim") - 2);
    },
  },
  { // 118: "Ternyata anak itu tidak meminta makanan dingin."
    si: 118, set: "valley", light: "golden", sun: [60, 14],
    cams: (a) => [{ f: a, s: cu([CSH[0] + 2.4, 0, CSH[2] + 1.8], a, { az: -30, d: 1.6, h: 1.0, ly: 0.9, orbit: 10 }) }],
    ws: () => ({ gauge: 4, genOn: false, cart: CSH, top: "store" }),
    stage: (c) => {
      c.P(WHO.kid(0), CSH[0] + 2.4, CSH[2] + 1.8, { expr: "grin", facing: ([-1, 1] as const)[Math.floor(c.f / 7) % 2] });
      c.badge("dingin2", "BUKAN MAKANAN DINGIN", "", "#241726", "#bfe8ff", CSH[0] + 2.4, 1.55, CSH[2] + 1.8, 0.75, wf(118, "dingin") - 2);
    },
  },
  { // 119: "Dia hanya ingin stik kayu bekas yang kemarin kamu berikan."
    si: 119, set: "valley", light: "golden", sun: [60, 14],
    cams: (a) => [
      { f: a, s: two([CSH[0] + 1.6, 0, CSH[2] + 1.4], a, { az: -20, d: 3.4, h: 1.2 }) },
      { f: wf(119, "stik") - 3, cut: true, s: ins([CSH[0] + 1.5, 0.35, CSH[2] + 1.1], wf(119, "stik"), { az: 10, d: 0.9, h: 0.25, fov: 30, punch: 0.012 }) },
    ],
    kicks: [wf(119, "stik")],
    ws: () => ({ gauge: 4, genOn: false, cart: CSH, top: "store" }),
    stage: (c) => {
      c.P(WHO.kid(0), CSH[0] + 2.4, CSH[2] + 1.8, { expr: "laugh", prop: "reach", facing: -1 });
      c.P(WHO.kamu, CSH[0] + 0.85, CSH[2] + 0.95, { expr: "dazed", mode: "sit" });
      c.burst(CSH[0] + 1.5, 0.2, CSH[2] + 1.1, 0.6, wf(119, "stik") - 1, "#fff3b0");
      c.badge("stik", "STIK BEKAS?!", "", "#ffd43b", "#241726", CSH[0] + 1.5, 0.75, CSH[2] + 1.1, 0.6, wf(119, "stik") - 1);
    },
  },
  { // 120: "Dengan bangga, dia menunjukkan beberapa stik yang sudah diikat menjadi mainan kecil."
    si: 120, set: "valley", light: "golden", sun: [60, 14],
    cams: (a) => [
      { f: a, s: low([CSH[0] + 2.4, 0, CSH[2] + 1.8], a, { az: -30, d: 2.2, ly: 1.0, roll: -0.07 }) },
      { f: wf(120, "mainan") - 6, cut: true, s: ins([CSH[0] + 2.05, 0.95, CSH[2] + 1.85], wf(120, "mainan"), { az: -10, d: 0.85, h: 0.08, fov: 30, roll: 0.05 }) },
    ],
    ws: () => ({ gauge: 4, genOn: false, cart: CSH, top: "store" }),
    stage: (c) => {
      c.P(WHO.kid(0), CSH[0] + 2.4, CSH[2] + 1.8, { expr: "laugh", prop: "sticktoy", facing: -1, hop: [wf(120, "bangga"), wf(120, "mainan")] });
      c.burst(CSH[0] + 2.05, 1.0, CSH[2] + 1.9, 0.7, wf(120, "mainan") - 2, "#fff3b0");
      c.badge("mainan", "MAINAN BARU!", "", "#3fb950", "#ffffff", CSH[0] + 2.4, 1.85, CSH[2] + 1.8, 0.75, wf(120, "mainan") - 2);
    },
  },
  { // 121: "Kamu terdiam."
    si: 121, set: "valley", light: "golden", sun: [60, 14],
    cams: (a) => [{ f: a, s: cu([CSH[0] + 0.85, 0, CSH[2] + 0.95], a, { az: 10, d: 1.4, h: 1.0, ly: 0.85, rate: 0.006 }) }],
    ws: () => ({ gauge: 4, genOn: false, cart: CSH, top: "store" }),
    stage: (c) => {
      c.P(WHO.kamu, CSH[0] + 0.85, CSH[2] + 0.95, { expr: "dazed", mode: "sit" });
    },
  },
  { // 122: "Kamu datang membawa teknologi mahal untuk menjual makanan yang langsung habis."
    si: 122, set: "valley", light: "golden", sun: [60, 14],
    cams: (a) => [
      { f: a, s: ins([GEN[0], 0.75, GEN[2]], a, { az: 30, d: 1.8, h: 0.3, fov: 30, orbit: -15 }) },
      { f: wf(122, "habis") - 6, cut: true, s: ins([CSH[0], 1.25, CSH[2]], wf(122, "habis"), { az: -15, d: 1.0, h: 0.5, fov: 30 }) },
    ],
    ws: (f) => ({ gauge: 4, genOn: false, cart: CSH, top: "store", lid: f >= wf(122, "habis") - 6 ? 1 : 0, melt: true }),
    stage: (c) => {
      c.badge("mahal", "TEKNOLOGI MAHAL", "", "#ffd43b", "#241726", GEN[0], 1.55, GEN[2] + 0.3, 0.8, wf(122, "teknologi") - 2, wf(122, "habis") - 6);
      c.badge("habis2", "LANGSUNG HABIS", "", "#e2453c", "#ffffff", CSH[0] + 0.3, 1.8, CSH[2] + 0.3, 0.75, wf(122, "habis") - 2);
    },
  },
  { // 123: "Tetapi benda paling berharga bagi anak itu justru potongan kayu yang biasanya kamu buang."
    si: 123, set: "valley", light: "golden", sun: [60, 14],
    cams: (a) => [
      { f: a, s: two([CSH[0] + 1.6, 0, CSH[2] + 1.4], a, { az: 20, d: 3.6, h: 1.3, orbit: -12 }) },
      { f: wf(123, "potongan") - 4, cut: true, s: ins([CSH[0] + 2.05, 0.95, CSH[2] + 1.85], wf(123, "potongan"), { az: 15, d: 0.9, h: 0.1, fov: 30 }) },
    ],
    ws: () => ({ gauge: 4, genOn: false, cart: CSH, top: "store" }),
    stage: (c) => {
      c.P(WHO.kid(0), CSH[0] + 2.4, CSH[2] + 1.8, { expr: "laugh", prop: "sticktoy", facing: -1 });
      c.P(WHO.kamu, CSH[0] + 0.85, CSH[2] + 0.95, { expr: "smile", mode: "sit" });
      c.badge("berharga", "PALING BERHARGA", "", "#ffd43b", "#241726", CSH[0] + 2.2, 1.6, CSH[2] + 1.9, 0.8, wf(123, "berharga") - 2);
    },
  },
  { // 124: "Jadi, bagaimana rasanya menjual es krim di zaman purba?"
    si: 124, set: "valley", light: "golden", sun: [40, 20], flash: true,
    cams: (a) => [{ f: a, s: high([-1.5, 0, 1.0], a, { az: 30, d: 9, h: 6.5, ly: 0.8, rise: 2.5, rate: 0.0014, orbit: -14 }) }],
    ws: () => ({ gauge: 4, genOn: false, cart: CSH, top: "store", fire: true }),
    stage: (c) => {
      c.P(WHO.kid(0), CSH[0] + 2.4, CSH[2] + 1.8, { expr: "laugh", prop: "sticktoy", facing: -1 });
      c.P(WHO.kamu, CSH[0] + 0.85, CSH[2] + 0.95, { expr: "smile", mode: "sit" });
      c.P(WHO.purba, CSH[0] + 1.8, CSH[2] + 0.4, { expr: "grin", prop: "spear" });
      c.badge("jadi", "JADI...", "BAGAIMANA RASANYA?", "#f2efe6", "#241726", -1.5, 2.6, 1.0, 1.6, ss(124) + 6);
    },
  },
  { // 125: "Hari pertama, kamu menjadi pedagang paling terkenal di lembah."
    si: 125, set: "valley", light: "day",
    cams: (a) => [{ f: a, s: two([-0.6, 0, 1.4], a, { az: 15, d: 4.8, h: 1.6, orbit: 12 }) }],
    ws: () => ({ board: "fish1", lid: 1, fish: true, top: "first" }),
    stage: (c) => {
      c.P(WHO.kamu, K[0], K[2], { expr: "laugh", wave: 1 });
      const spots: [number, number][] = [[-2.6, 1.6], [-1.6, 2.2], [-0.4, 2.5], [0.9, 2.3], [2.0, 1.9]];
      spots.forEach(([x, z], i) => c.P(i % 2 ? WHO.kid(i) : WHO.tribe(i), x, z, { expr: "laugh", prop: "popsicle", facing: x < 0 ? 1 : -1 }));
      c.badge("r1", "HARI 1", "PALING TERKENAL", "#ffd43b", "#241726", -0.4, 2.7, 1.2, 1.3, ss(125) + 2);
    },
  },
  { // 126: "Hari kedua, kamu sibuk menghitung bahan bakar."
    si: 126, set: "valley", light: "golden", sun: [-50, 16],
    cams: (a) => [{ f: a, s: ms([GEN[0] - 0.9, 0, GEN[2] + 0.55], a, { az: 40, d: 2.6, orbit: -12 }) }],
    ws: () => ({ board: "fish2", gauge: 3 }),
    stage: (c) => {
      c.P(WHO.kamu, GEN[0] - 0.9, GEN[2] + 0.55, { expr: "nervous", prop: "fuel", facing: 1 });
      c.badge("r2", "HARI 2", "HITUNG BBM", "#ff8a3d", "#ffffff", GEN[0] - 0.6, 2.2, GEN[2] + 0.5, 0.9, ss(126) + 2);
      c.mark(["1..", "2..", "3.."][Math.min(2, Math.floor((c.f - ss(126)) / 25))], "#f2efe6", GEN[0] - 0.2, 1.35, GEN[2] + 0.6, 0.4, wf(126, "menghitung"));
    },
  },
  { // 127: "Beberapa hari kemudian, kamu bangkrut."
    si: 127, set: "valley", light: "night",
    cams: (a) => [{ f: a, s: low([CSH[0] + 0.9, 0, CSH[2] + 0.9], a, { az: 30, d: 2.6, ly: 0.9, roll: -0.08, punch: 0.012 }) }],
    kicks: [wf(127, "bangkrut")],
    ws: () => ({ stars: true, moon: true, gauge: 4, genOn: false, top: "closed", cart: CSH, melt: true }),
    stage: (c) => {
      c.P(WHO.kamu, CSH[0] + 0.9, CSH[2] + 0.9, { expr: "pained", mode: "sit" });
      c.badge("r3", "HARI KE-SEKIAN", "BANGKRUT", "#e2453c", "#ffffff", CSH[0] + 0.6, 2.2, CSH[2] + 0.6, 1.0, ss(127) + 2);
    },
  },
  { // 128: "Dan lucunya, setelah semua es krim habis, satu-satunya produk yang masih diminati ternyata bukan cokelat atau vanila."
    si: 128, set: "valley", light: "golden", sun: [60, 14], flash: true,
    cams: (a) => [
      { f: a, s: frame([CSH[0] + 1.6, 0, CSH[2] + 1.6], a, 7.0, 2.0, 1.0, { az: 30, fov: 32, orbit: -12 }) },
      { f: wf(128, "produk") - 4, cut: true, s: two([CSH[0] + 1.6, 0, CSH[2] + 1.6], wf(128, "produk"), { az: -20, d: 4.0, h: 1.3 }) },
      { f: wf(128, "coklat") - 4, cut: true, s: cu([CSH[0] + 0.85, 0, CSH[2] + 0.95], wf(128, "coklat"), { az: 20, d: 1.6, h: 1.0, ly: 0.9 }) },
    ],
    ws: () => ({ gauge: 4, genOn: false, cart: CSH, top: "store" }),
    stage: (c) => {
      c.P(WHO.kamu, CSH[0] + 0.85, CSH[2] + 0.95, { expr: c.f >= wf(128, "coklat") ? "smile" : "neutral", mode: "sit" });
      [[CSH[0] + 2.4, CSH[2] + 1.8], [CSH[0] + 3.1, CSH[2] + 2.4], [CSH[0] + 1.8, CSH[2] + 2.7]].forEach(([x, z], i) => c.P(WHO.kid(i), x, z, { expr: "laugh", prop: c.f >= wf(128, "produk") ? "sticktoy" : null, facing: -1, hop: [wf(128, "produk") + 6 * i] }));
      c.badge("coklat", "BUKAN COKELAT", "", "#6b3e26", "#ffffff", CSH[0] + 0.2, 2.15, CSH[2] + 0.9, 0.65, wf(128, "coklat") - 2);
      c.badge("vanila", "BUKAN VANILA", "", "#f6e7b8", "#241726", CSH[0] + 1.5, 2.05, CSH[2] + 0.9, 0.6, wf(128, "vanila") - 2);
    },
  },
  { // 129: "Melainkan stik es krim bekas."
    si: 129, set: "valley", light: "golden", sun: [60, 14],
    cams: (a) => [
      { f: a, s: ins([CSH[0] + 2.05, 0.95, CSH[2] + 1.85], a, { az: 15, d: 1.0, h: 0.1, fov: 30, punch: 0.012 }) },
      { f: wf(129, "bekas") + 10, cut: true, s: wide([CSH[0] + 1.6, 0, CSH[2] + 1.8], wf(129, "bekas") + 10, { az: 25, d: 9, h: 2.6, rise: 1.5, rate: 0.0016 }) },
    ],
    kicks: [wf(129, "stik")],
    ws: () => ({ gauge: 4, genOn: false, cart: CSH, top: "store" }),
    stage: (c) => {
      c.P(WHO.kamu, CSH[0] + 0.85, CSH[2] + 0.95, { expr: "laugh", mode: "sit" });
      c.P(WHO.purba, CSH[0] - 0.3, CSH[2] + 1.0, { expr: "laugh", prop: "spear" });
      [[CSH[0] + 2.4, CSH[2] + 1.8], [CSH[0] + 3.1, CSH[2] + 2.4], [CSH[0] + 1.8, CSH[2] + 2.7]].forEach(([x, z], i) => c.P(WHO.kid(i), x, z, { expr: "laugh", prop: "sticktoy", facing: -1, hop: [wf(129, "stik") + 8 * i, wf(129, "bekas") + 20 + 8 * i] }));
      c.badge("laris", "STIK BEKAS", "PRODUK TERLARIS!", "#ffd43b", "#241726", CSH[0] + 1.8, 2.5, CSH[2] + 1.6, 1.4, wf(129, "stik") - 2);
    },
  },
];

export const DEFAULT_WS: WS = { set: "valley", lid: 0, melt: false, board: null, top: null, gauge: 0, genOn: true, fire: false, stars: false, moon: false, fish: false, cart: CART };
