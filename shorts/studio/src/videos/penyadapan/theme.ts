// Shared constants + small helpers for "Dugaan Penyadapan Presiden" (TikTok 9:16 explainer).
import { Easing } from "remotion";
import PLAN from "./plan.json";
import WORDS from "./words.json";
import ENV from "./voice_env.json";

export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const VO: number = PLAN.vo; // narration starts this many seconds into the video
export const TOTAL = Math.round((PLAN.end + VO) * FPS);

/** narration seconds -> composition frame */
export const fr = (t: number) => Math.round((t + VO) * FPS);
/** composition frame -> narration seconds */
export const sec = (f: number) => f / FPS - VO;

export type Word = { w: string; s: number; e: number };
export const words = WORDS as Word[];
export const voiceEnv = ENV as number[];

// any-typed plan entries keep the JSON flexible; the components validate what they read
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Any = any;
export const plan = PLAN as Any;

export const C = {
  red: "#E5232E",
  redDeep: "#8E0C15",
  cyan: "#3FD8FF",
  yellow: "#FFE14D",
  green: "#2FE37C",
  ink: "#06080C",
  white: "#F5F7FA",
  amber: "#FFB020",
};

export const F = {
  head: "Anton, Impact, 'Arial Narrow', sans-serif",
  body: "Montserrat, Arial, sans-serif",
  mono: "'JetBrains Mono', 'DejaVu Sans Mono', monospace",
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const backOut = (t: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** deterministic pseudo-random in [0,1) */
export const rnd = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** 0..1 entrance progress over `dur` frames starting at frame f0 */
export const inP = (frame: number, f0: number, dur: number) => clamp01((frame - f0) / dur);

/** fade-out multiplier: 1 until (f1 - dur), then down to 0 at f1 */
export const outP = (frame: number, f1: number, dur = 5) => clamp01((f1 - frame) / dur);

/** text stroke used for every caption/headline on top of footage */
export const heavyShadow = "0 6px 0 rgba(0,0,0,0.35), 0 10px 30px rgba(0,0,0,0.55)";
