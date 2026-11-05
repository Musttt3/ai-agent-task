// Shot table (shotlist.md) and word timings (captions/voice.json). 30 fps, 1755 frames.
import VOICE from "./voice.json";
export const FPS = 30;
export const TOTAL = 1755;
export type SetName = "kamar" | "kota" | "sekolah" | "rumah_sakit" | "desa";
export type Shot = { id: string; a: number; b: number; set: SetName };
const S = (id: string, a: number, b: number, set: SetName): Shot => ({ id, a, b, set });
export const SHOTS: Shot[] = [
  S("01", 0, 57, "kamar"), S("02", 58, 129, "kamar"), S("03", 130, 205, "kamar"), S("04", 206, 264, "kamar"),
  S("05", 265, 315, "kamar"), S("06", 316, 365, "kamar"), S("07", 366, 433, "kota"), S("08", 434, 481, "kota"),
  S("09", 482, 531, "kota"), S("10", 532, 597, "kota"), S("11", 598, 666, "kota"), S("12", 667, 723, "kota"),
  S("13", 724, 793, "sekolah"), S("14", 794, 861, "rumah_sakit"), S("15", 862, 924, "rumah_sakit"), S("16", 925, 982, "desa"),
  S("17", 983, 1060, "desa"), S("18", 1061, 1126, "kota"), S("19", 1127, 1187, "kota"), S("20", 1188, 1217, "kota"),
  S("21", 1218, 1260, "kota"), S("22", 1261, 1315, "kota"), S("23", 1316, 1393, "kota"), S("24", 1394, 1469, "kota"),
  S("25", 1470, 1531, "kota"), S("26", 1532, 1592, "desa"), S("27", 1593, 1638, "desa"), S("28", 1639, 1754, "kamar"),
];
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f <= s.b) ?? SHOTS[SHOTS.length - 1];
export type Word = { word: string; start: number; end: number };
export const WORDS: Word[] = (VOICE as { segments: { words: Word[] }[] }).segments[0].words;
export const wordFrames = WORDS.map((w) => ({ w: w.word, a: Math.round(w.start * FPS), b: Math.round(w.end * FPS) }));
// easing
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeIn = (x: number) => Math.pow(clamp01(x), 3);
export const ramp = (f: number, a: number, len: number, e = smooth) => e((f - a) / Math.max(1, len));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
