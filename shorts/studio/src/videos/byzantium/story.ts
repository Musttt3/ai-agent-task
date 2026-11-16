// Shot plan: every cut and every reaction is placed on a word of the narration (timing.ts, words.json).
import { W, FPS, VOICE_END } from "./timing";

export const T = {
  messenger: W("messenger"), constantinople: W("constantinople"), fate: W("fate"), empire1: W("empire"), hands: W("hands"),
  its: W("its"), may: W("may"), d29: W("29"), y1453: W("1453"),
  weeks: W("weeks"), ottoman1: W("ottoman"), cannons: W("cannons"), pounded: W("pounded"), massive: W("massive"), walls1: W("walls"),
  now: W("now"), dawn: W("dawn"), defenses: W("defenses"), collapsing: W("collapsing"),
  commander: W("commander"), grabs: W("grabs"), shoulder: W("shoulder"),
  get: W("get"), palace: W("palace"), warn: W("warn"), them: W("them"),
  run1: W("run"), narrow: W("narrow"), streets1: W("streets"), bells: W("bells"), ring: W("ring"), terrified: W("terrified"), families: W("families"), rush: W("rush"), past: W("past"),
  behind: W("behind"), soldiers1: W("soldiers"), desperately: W("desperately"), fight: W("fight"), hold: W("hold"), sultan: W("sultan"), mehmed: W("mehmed"), army: W("army"),
  then: W("then"), hear: W("hear"),
  deafening: W("deafening"), roar: W("roar"), walls2: W("walls", 1),
  ottoman2: W("ottoman", 1), soldiers2: W("soldiers", 1), breaking: W("breaking"), city: W("city", 0, 33),
  run2: W("run", 1), faster: W("faster"), smoke: W("smoke"), fills: W("fills"), streets2: W("streets", 1), crowds: W("crowds"), thicker: W("thicker"),
  by: W("by"), reach: W("reach"), heart: W("heart"), constantinople2: W("constantinople", 1),
  already: W("already"), late: W("late"),
  emperor: W("emperor"), constantine: W("constantine"), eleventh: W("eleventh"), dies: W("dies"), final: W("final"), battle: W("battle"),
  byzantine: W("byzantine"), empire2: W("empire", 1), survived: W("survived"), thousand: W("thousand"), years: W("years"), comes: W("comes"), end: W("end"),
  supposed: W("supposed"), deliver: W("deliver"), warning: W("warning"),
  instead: W("instead"), witnessed: W("witnessed"), fall: W("fall"), empire3: W("empire", 2),
};
export const TOTAL = Math.round((VOICE_END + 1.6) * FPS);
const BEAT = 3; // visual reactions land this many frames before their word
export const FLASH_AT = T.its - BEAT;

// cold = blue pre-dawn, golden = dawn / sunrise, storm = battle smoke
export type Light = "day" | "golden" | "storm" | "cold" | "candle";
export type ShotId =
  | "hook" | "date" | "cannons" | "collapsing" | "grab" | "order" | "run" | "behind" | "hear" | "roar" | "breaking" | "faster"
  | "heart" | "late" | "emperor" | "endEmpire" | "warning" | "witnessed";
export type Shot = { id: ShotId; a: number; b: number; grade: Light; cInf: number };

const S = (id: ShotId, a: number, grade: Light, cInf: number) => ({ id, a, grade, cInf });
const raw = [
  S("hook", 0, "golden", 10),
  S("date", T.its - BEAT, "cold", 0),
  S("cannons", T.weeks - BEAT, "cold", 6),
  S("collapsing", T.now - BEAT, "golden", 8),
  S("grab", T.commander - 8, "golden", 12),
  S("order", T.get - BEAT, "golden", 14),
  S("run", T.run1 - 6, "golden", 6),
  S("behind", T.behind - BEAT, "storm", 6),
  S("hear", T.then - BEAT, "golden", 13),
  S("roar", T.deafening - 7, "storm", 4),
  S("breaking", T.ottoman2 - BEAT, "storm", 6),
  S("faster", T.run2 - 6, "storm", 6),
  S("heart", T.by - BEAT, "golden", 4),
  S("late", T.already - 6, "golden", 13),
  S("emperor", T.emperor - BEAT, "storm", 10),
  S("endEmpire", T.byzantine - 10, "golden", 4),
  S("warning", T.supposed - 8, "golden", 14),
  S("witnessed", T.instead - BEAT, "golden", 4),
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
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** impact flip-shake: sign flips every frame, decays over 7 frames */
export const kick = (f: number, at: number[], amp = 0.05): V3 => {
  let x = 0, y = 0;
  for (const k of at) {
    const d = f - k;
    if (d >= 0 && d < 7) { const s = (d % 2 ? -1 : 1) * amp * (1 - d / 7); x += s; y += s * 0.6; }
  }
  return [x, y, 0];
};
