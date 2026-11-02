// Shot plan: every cut and every reaction is placed on a word of the narration (timing.ts).
import { W, FPS, VOICE_END } from "./timing";

export const T = {
  lalu1: W("lalu"), hancur: W("hancur"), napas1: W("berenafas|bernafas|bernapas|berenapas"),
  prancis: W("prancis"), seorang: W("seorang"), kuda: W("kuda"), rusa: W("rusa"), banteng: W("banteng"), sepanjang: W("sepanjang"),
  lalu2: W("lalu", 1), tertimbun: W("tertimbun"), gelap: W("gelap"), sunyi: W("sunyi"), ribuan: W("ribuan"),
  t1940: W("tahun", 2), robot: W("robot"), mengendus: W("mengendus"), lubang: W("lubang"),
  pemiliknya: W("pemiliknya"), marcel: W("marcel"), merangkak: W("merangkak"), menemukan: W("menemukan"), galeri: W("galeri"),
  t1948: W("tahun", 4), dibuka: W("dibuka"), datang: W("orang", 1), banyak: W("banyak"), n1200: W("1200"), sehari: W("sehari"),
  lalu3: W("lalu", 3), mulai: W("mulai"), hijau: W("hijau"),
  untungnya: W("untungnya"), menyentuh: W("menyentuh"), sayangnya: W("sayangnya"), napas2: W("berenafas|bernafas|bernapas|berenapas", 1),
  napas3: W("nafas|napas"), seperti: W("seperti"), berembun: W("berembun"), penumpang: W("penumpang"),
  bedanya: W("bedanya"), dilap: W("dilap"),
  uap: W("uap|uwap"), panas: W("panas"), lampu: W("lampu"), alga: W("alga"), jamur: W("jamur"),
  t1963: W("tahun", 5), ditutup: W("ditutup"),
  turis: W("turis"), tiruan: W("tiruannya"),
  k17: W("17", 1), aman: W("aman"), k15: W("15"), hampir: W("hampir", 1), habis: W("habis"),
};
export const TOTAL = Math.round((VOICE_END + 1.6) * FPS);
export const FLASH_AT = T.prancis - 4;
const BEAT = 3; // visual reactions land this many frames before their word

export type ShotId =
  | "hook" | "hookBreath" | "iceExt" | "paint" | "bullWide" | "seal" | "dark" | "timelapse" | "dog" | "marcel" | "discover"
  | "open" | "crowd" | "green" | "notouch" | "car" | "nowipe" | "grow" | "close" | "replica" | "safe" | "end";
export type Shot = { id: ShotId; a: number; b: number; grade: "day" | "golden"; cInf: number };

const S = (id: ShotId, a: number, grade: Shot["grade"], cInf: number) => ({ id, a, grade, cInf });
const raw = [
  S("hook", 0, "golden", 12),
  S("hookBreath", T.lalu1 - BEAT, "day", 8),
  S("iceExt", T.prancis - 2, "day", 0),
  S("paint", T.seorang - BEAT, "golden", 10),
  S("bullWide", T.banteng - 6, "golden", 4),
  S("seal", T.lalu2 - BEAT, "day", 0),
  S("dark", T.gelap - BEAT, "golden", 6),
  S("timelapse", T.ribuan - BEAT, "day", 0),
  S("dog", T.t1940 - BEAT, "day", 12),
  S("marcel", T.pemiliknya - BEAT, "day", 8),
  S("discover", T.menemukan - BEAT, "golden", 10),
  S("open", T.t1948 - BEAT, "day", 0),
  S("crowd", T.datang - BEAT, "day", 6),
  S("green", T.lalu3 - BEAT, "day", 12),
  S("notouch", T.untungnya - BEAT, "day", 10),
  S("car", T.napas3 - BEAT, "day", 8),
  S("nowipe", T.bedanya - BEAT, "day", 12),
  S("grow", T.uap - BEAT, "day", 14),
  S("close", T.t1963 - BEAT, "day", 0),
  S("replica", T.turis - BEAT, "day", 8),
  S("safe", T.k17 - BEAT, "golden", 10),
  S("end", T.k15 - BEAT, "day", 10),
];
export const SHOTS: Shot[] = raw.map((s, i) => ({ ...s, b: i + 1 < raw.length ? raw[i + 1].a : TOTAL }));
export const shotAt = (f: number) => { for (let i = SHOTS.length - 1; i >= 0; i--) if (f >= SHOTS[i].a) return SHOTS[i]; return SHOTS[0]; };

// ---------------- easing ----------------
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const t = clamp01(x); return t * t * t * (t * (t * 6 - 15) + 10); };
export const ramp = (f: number, a: number, len: number) => smooth((f - a) / Math.max(1, len));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export type V3 = [number, number, number];
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** impact flip-shake: sign flips every frame, decays over 7 frames */
export const kick = (f: number, at: number[], amp = 0.05): V3 => {
  let x = 0, y = 0;
  for (const k of at) {
    const d = f - k;
    if (d >= 0 && d < 7) { const s = (d % 2 ? -1 : 1) * amp * (1 - d / 7); x += s; y += s * 0.6; }
  }
  return [x, y, 0];
};
