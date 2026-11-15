// Shot plan: every cut and every reaction is placed on a word of the narration (timing.ts, words.json).
import { W, FPS, VOICE_END } from "./timing";

export const T = {
  viking: W("viking"), reached: W("reached"), america: W("america"), n500: W("500"), columbus: W("columbus"),
  but1: W("but"), getting: W("getting"), killed: W("killed"),
  its: W("its"), year: W("year", 0, 8), live: W("live"), freezing1: W("freezing"), greenland1: W("greenland"),
  when: W("when"), sailors: W("sailors"), mysterious: W("mysterious"), forests1: W("forests"),
  join: W("join"), expedition: W("expedition"), big: W("big"), mistake: W("mistake"),
  spend: W("spend"), days: W("days"), atlantic1: W("atlantic"), wooden: W("wooden"), battling: W("battling"), waves: W("waves"), storms: W("storms"),
  then: W("then"), suddenly: W("suddenly"), someone: W("someone"), shouts: W("shouts"), land: W("land", 1),
  step: W("step"), coastline: W("coastline"),
  there: W("there"), enormous: W("enormous"), forests2: W("forests", 1), water: W("water"), timber: W("timber"),
  help: W("help"), build: W("build"), shelters: W("shelters"), gather: W("gather"), supplies1: W("supplies"),
  but2: W("but", 1), problem: W("problem"), youre2: W("youre", 1), alone: W("alone"),
  indigenous: W("indigenous"), lived: W("lived"), thousands: W("thousands"),
  encounters: W("encounters"), crew: W("crew"), local: W("local"), dangerous: W("dangerous"),
  with: W("with", 1), limited: W("limited"), reinforcements: W("reinforcements"), eventually: W("eventually"), sail: W("sail", 0, 49), greenland2: W("greenland", 1),
  a1000: W("a", 0, 51), thousand: W("thousand", 0, 51), later: W("later"),
  archaeologists: W("archaeologists"), find: W("find"), norse1: W("norse"), newfoundland: W("newfoundland"), canada: W("canada"),
  evidence: W("evidence"), confirms: W("confirms"), activity: W("activity"), y1021: W("1021"),
  you60: W("you", 0, 60), werent: W("werent"), first: W("first"), america2: W("america", 1),
  but3: W("but", 2), extraordinary: W("extraordinary"), voyage: W("voyage"), crossed: W("crossed"), centuries: W("centuries"), columbus2: W("columbus", 1),
  and68: W("and", 0, 67.5), craziest: W("craziest"), part: W("part", 1), had: W("had"), absolutely: W("absolutely"), idea: W("idea"), making: W("making"), history: W("history"),
};
export const TOTAL = Math.round((VOICE_END + 1.6) * FPS);
export const FLASH_AT = T.but1 - 3;
const BEAT = 3; // visual reactions land this many frames before their word

export type Light = "day" | "golden" | "storm" | "cold";
export type ShotId =
  | "hook" | "stormFlash" | "greenland" | "sailors" | "join" | "mistake" | "crossing" | "land" | "step" | "forest" | "build"
  | "problem" | "notAlone" | "indigenous" | "tension" | "supplies" | "sailBack" | "later" | "dig" | "evidence" | "notFirst" | "voyage" | "end";
export type Shot = { id: ShotId; a: number; b: number; grade: Light; cInf: number };

const S = (id: ShotId, a: number, grade: Light, cInf: number) => ({ id, a, grade, cInf });
const raw = [
  S("hook", 0, "golden", 10),
  S("stormFlash", T.but1 - BEAT, "storm", 6),
  S("greenland", T.its - BEAT, "cold", 8),
  S("sailors", T.when - BEAT, "golden", 10),
  S("join", T.join - 8, "cold", 6),
  S("mistake", T.big - BEAT, "cold", 12),
  S("crossing", T.spend - 8, "day", 0),
  S("land", T.then - BEAT, "golden", 8),
  S("step", T.step - 10, "day", 10),
  S("forest", T.there - BEAT, "day", 0),
  S("build", T.help - 6, "day", 8),
  S("problem", T.but2 - BEAT, "day", 13),
  S("notAlone", T.youre2 - BEAT, "day", 6),
  S("indigenous", T.indigenous - BEAT, "golden", 8),
  S("tension", T.encounters - 10, "storm", 6),
  S("supplies", T.with - BEAT, "day", 14),
  S("sailBack", T.eventually - 6, "golden", 0),
  S("later", T.a1000 - BEAT, "day", 0),
  S("dig", T.archaeologists - BEAT, "day", 8),
  S("evidence", T.evidence - BEAT, "day", 14),
  S("notFirst", T.you60 - BEAT, "golden", 10),
  S("voyage", T.but3 - BEAT, "golden", 0),
  S("end", T.and68 - BEAT, "golden", 12),
];
export const SHOTS: Shot[] = raw.map((s, i) => ({ ...s, b: i + 1 < raw.length ? raw[i + 1].a : TOTAL }));
export const shotAt = (f: number) => { for (let i = SHOTS.length - 1; i >= 0; i--) if (f >= SHOTS[i].a) return SHOTS[i]; return SHOTS[0]; };
/** crossfades (DOM, 7 frames) where the place or time changes without a flash */
export const XFADE: number[] = [];

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
