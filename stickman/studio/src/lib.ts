import { Easing, interpolate } from "remotion";
import timelineJson from "./data/timeline.json";
import wordsJson from "./data/words.json";

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const AUDIO_SEC = 464.77;
export const TOTAL_SEC = 466; // narration + short hold and fade to black
export const TOTAL_FRAMES = TOTAL_SEC * FPS;

export type ShotData = { i: number; img: string; start: number; voice: number; text: string };
export const SHOTS = timelineJson as unknown as ShotData[];

type Word = { w: string; s: number; e: number };
const WORDS = wordsJson as Word[];

export const f = (sec: number) => Math.round(sec * FPS);

/** Start of shot n (1-based) in seconds. */
export const shotStart = (n: number) => SHOTS[n - 1].start;
/** Start of the voice line for shot n (1-based) in seconds. */
export const shotVoice = (n: number) => SHOTS[n - 1].voice;
export const shotEnd = (n: number) => (n < SHOTS.length ? SHOTS[n].start : TOTAL_SEC);

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Time (sec) the narrator starts saying `word`, searching from `after` (sec).
 * Prefix match so "bengkel" still finds the ASR's "bankel"-style misspellings via
 * a short prefix when needed. Falls back to `after` if not found within 10 s.
 */
export const wt = (word: string, after: number, prefix = 5): number => {
  const k = norm(word).slice(0, prefix);
  for (const w of WORDS) {
    if (w.s < after - 0.05) continue;
    if (w.s > after + 10) break;
    if (norm(w.w).startsWith(k)) return w.s;
  }
  return after;
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.5, 0, 0.75, 0);

/** Overshooting pop 0 -> 1 over `dur` frames starting at frame `start`. */
export const pop = (frame: number, start: number, dur = 12) =>
  interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1) });

export const ramp = (frame: number, a: number, b: number, easing = easeOut) =>
  interpolate(frame, [a, b], [0, 1], { ...clamp, easing });

/** Deterministic pseudo-random in [0,1). */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export const COLORS = {
  ink: "#26221f",
  paper: "#fffaf0",
  red: "#e63946",
  green: "#2a9d8f",
  yellow: "#ffb703",
  orange: "#f4892a",
  blue: "#219ebc",
};

export const FONT = "Fredoka, sans-serif";
export const MARKER = "PermanentMarker, Fredoka, sans-serif";
