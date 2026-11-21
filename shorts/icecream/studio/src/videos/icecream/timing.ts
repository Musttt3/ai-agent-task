// Word timing of the narration (faster-whisper "small", Indonesian, on the user's ElevenLabs take): 130 sentences, each a
// list of [word, startFrame, endFrame] at 30 fps. Every cut, sub-angle and reaction is placed on these frames.
import SENTENCES from "./sentences.json";

export const FPS = 30;
type Wd = [string, number, number];
export const SENT = SENTENCES as Wd[][];
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
export const VOICE_END = SENT[SENT.length - 1][SENT[SENT.length - 1].length - 1][2];
export const TOTAL = VOICE_END + 45;

/** start frame of sentence si */
export const ss = (si: number) => SENT[si][0][1];
/** start frame of the word in sentence si that begins with `needle` (n-th match), or the k-th word if a number */
export const wf = (si: number, needle: string | number, n = 0): number => {
  const s = SENT[si];
  if (typeof needle === "number") return s[Math.min(s.length - 1, needle)][1];
  const q = norm(needle);
  let k = 0;
  for (const [w, a] of s) if (norm(w).startsWith(q)) { if (k === n) return a; k++; }
  throw new Error(`word "${needle}" not in sentence ${si}: ${s.map((x) => x[0]).join(" ")}`);
};
/** end frame of sentence si */
export const se = (si: number) => SENT[si][SENT[si].length - 1][2];
