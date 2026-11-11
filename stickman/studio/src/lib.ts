import { Easing, interpolate } from "remotion";
import timelineJson from "./data/timeline.json";

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const AUDIO_SEC = 464.77;
export const TOTAL_SEC = 466; // narration + short hold and fade to black
export const TOTAL_FRAMES = TOTAL_SEC * FPS;

export type ShotData = { i: number; img: string; start: number; voice: number; text: string };
export const SHOTS = timelineJson as unknown as ShotData[];

export const f = (sec: number) => Math.round(sec * FPS);

/** Start of shot n (1-based) in seconds. */
export const shotStart = (n: number) => SHOTS[n - 1].start;
/** Start of the voice line for shot n (1-based) in seconds. */
export const shotVoice = (n: number) => SHOTS[n - 1].voice;
export const shotEnd = (n: number) => (n < SHOTS.length ? SHOTS[n].start : TOTAL_SEC);

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.5, 0, 0.75, 0);

export const COLORS = { ink: "#26221f" };

