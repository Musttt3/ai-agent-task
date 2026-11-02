// Everything is timed to the narration's word timings (words.json, faster-whisper on the chosen ElevenLabs take).
import WORDS from "./words.json";

export const FPS = 30;
type W = { w: string; s: number; e: number };
const words = WORDS as W[];
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
export const VOICE_END = words[words.length - 1].e;

/** frame where the nth (0-based) word matching one of `alts` ("a|b") starts, searching from `fromSec` */
export const W = (alts: string, n = 0, fromSec = 0, end = false): number => {
  const keys = alts.split("|").map(norm);
  let k = 0;
  for (const x of words) {
    if (x.s < fromSec) continue;
    const t = norm(x.w);
    if (keys.some((q) => t === q || (q.length > 3 && t.startsWith(q)))) {
      if (k === n) return Math.round((end ? x.e : x.s) * FPS);
      k++;
    }
  }
  throw new Error(`word not found: ${alts} #${n}`);
};
