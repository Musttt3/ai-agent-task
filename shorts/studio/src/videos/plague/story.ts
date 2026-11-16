// Shot plan: every cut and every reaction is placed on a word of the narration (timing.ts, words.json).
import { W, FPS, VOICE_END } from "./timing";

export const T = {
  doctor: W("doctor"), y1348: W("1348"), half: W("half"), town: W("town"), dying: W("dying"),
  the0: W("the"), worst: W("worst"), part: W("part"), no: W("no"), idea: W("idea"), why: W("why"),
  patients: W("patients"), high: W("high"), fevers: W("fevers"), swollen: W("swollen"), lumps: W("lumps"), dark: W("dark"), patches: W("patches"), skin: W("skin"),
  try: W("try"), everything: W("everything"), herbal: W("herbal"), medicines: W("medicines"), bloodletting: W("bloodletting"),
  even1: W("even"), burning: W("burning"), aromatic: W("aromatic"), purify: W("purify"), air1: W("air"),
  nothing: W("nothing"), work: W("work"),
  people: W("people"), believe: W("believe"), poisonous: W("poisonous"), air2: W("air", 1), divine: W("divine"), punishment: W("punishment"),
  but: W("but"), dont: W("dont"), real: W("real"), culprit: W("culprit"),
  bacterium: W("bacterium"), yersinia: W("yersinia"), pestis: W("pestis"), spread: W("spread"), infected: W("infected"), fleas: W("fleas"),
  every: W("every", 0, 31), morning: W("morning"), bodies: W("bodies"), streets: W("streets"),
  families: W("families"), abandon: W("abandon"), homes: W("homes"),
  even2: W("even", 1), fellow: W("fellow"), doctors: W("doctors"), disappearing: W("disappearing"),
  now: W("now"), developing: W("developing"), fever: W("fever", 1),
  look: W("look"), down: W("down"), painful: W("painful"), swelling: W("swelling"), beneath: W("beneath"), arm: W("arm"),
  suddenly: W("suddenly"), longer: W("longer"), doctor2: W("doctor", 0, 46), patient: W("patient", 0, 47),
  black: W("black"), death: W("death"), kill: W("kill"), tens: W("tens"), millions: W("millions"), europe: W("europe"),
  terrifying: W("terrifying"), truth: W("truth"),
  fighting: W("fighting"), invisible: W("invisible"), enemy: W("enemy"), humanity: W("humanity"), scientifically: W("scientifically"), identify: W("identify"),
  for2: W("for", 0, 57), y500: W("500"), years: W("years"),
};
export const TOTAL = Math.round((VOICE_END + 1.6) * FPS);
const BEAT = 3; // visual reactions land this many frames before their word
export const FLASH_AT = T.the0 - BEAT;

export type Light = "day" | "golden" | "storm" | "cold" | "candle";
export type ShotId =
  | "hook" | "worst" | "patients" | "herbal" | "bloodlet" | "herbs" | "nothing" | "miasma" | "divine" | "culprit" | "bacteria"
  | "morning" | "families" | "doctors" | "fever" | "lookDown" | "patient" | "europe" | "truth" | "invisible" | "future";
export type Shot = { id: ShotId; a: number; b: number; grade: Light; cInf: number };

const S = (id: ShotId, a: number, grade: Light, cInf: number) => ({ id, a, grade, cInf });
const raw = [
  S("hook", 0, "day", 8),
  S("worst", T.the0 - BEAT, "candle", 13),
  S("patients", T.patients - BEAT, "day", 10),
  S("herbal", T.try - 6, "day", 12),
  S("bloodlet", T.bloodletting - 4, "day", 13),
  S("herbs", T.even1 - BEAT, "day", 10),
  S("nothing", T.nothing - BEAT, "day", 13),
  S("miasma", T.people - BEAT, "day", 6),
  S("divine", T.divine - BEAT, "storm", 4),
  S("culprit", T.but - BEAT, "day", 12),
  S("bacteria", T.bacterium - 6, "day", 14),
  S("morning", T.every - BEAT, "cold", 6),
  S("families", T.families - BEAT, "cold", 6),
  S("doctors", T.even2 - BEAT, "day", 8),
  S("fever", T.now - 9, "candle", 12),
  S("lookDown", T.look - 9, "candle", 13),
  S("patient", T.suddenly - BEAT, "day", 10),
  S("europe", T.black - 8, "golden", 0),
  S("truth", T.terrifying - 13, "candle", 13),
  S("invisible", T.fighting - 12, "candle", 8),
  S("future", T.for2 - BEAT, "day", 10),
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
