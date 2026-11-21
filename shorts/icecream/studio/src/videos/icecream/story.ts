// Timeline: beats from beats.ts placed on the narration (a beat starts 3 frames before its sentence), the camera per frame
// (sub-angle keys + 7-frame sign-flipping kicks on punch words), white flashes on reality switches, and the lens blur.
import { BEATS, Beat } from "./beats";
import { FPS, TOTAL, ss } from "./timing";
import { run, CamPose, V3 } from "./cam";

export { FPS };
export const LEADIN = 3;
const starts = BEATS.map((b, i) => (i === 0 ? 0 : ss(b.si) - LEADIN));
/** the timeline ends with the last written beat (the full video when every sentence has a beat) */
export const END = BEATS[BEATS.length - 1].si >= 129 ? TOTAL : ss(BEATS[BEATS.length - 1].si + 1) - LEADIN;
export const RANGES = BEATS.map((b, i) => ({ beat: b, a: starts[i], b: i + 1 < BEATS.length ? starts[i + 1] : END }));
export const beatAt = (f: number) => { for (let i = RANGES.length - 1; i >= 0; i--) if (f >= RANGES[i].a) return i; return 0; };
export const FLASHES = RANGES.filter((r) => r.beat.flash).map((r) => r.a);

const KICKS = RANGES.flatMap((r) => (r.beat.kicks ?? []).map((k) => k - 2));
const keyCache = new Map<number, ReturnType<Beat["cams"]>>();
const keysOf = (i: number) => { let k = keyCache.get(i); if (!k) { k = RANGES[i].beat.cams(RANGES[i].a); keyCache.set(i, k); } return k; };

export const kickAt = (f: number) => {
  let a = 0;
  for (const k of KICKS) { const n = f - k; if (n >= 0 && n < 7) a += 1.2 * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5; }
  return a;
};
export const camAt = (i: number, f: number): CamPose => {
  const c = run(keysOf(i), f), a = kickAt(f);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
/** shallow depth of field on close framings, crisp wides (px blur radius at infinity, 1080p) */
export const dofAt = (i: number, f: number): { cInf: number } => {
  if (RANGES[i].beat.cInf !== undefined) return { cInf: RANGES[i].beat.cInf! };
  const c = run(keysOf(i), f), d = Math.hypot(c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]);
  return { cInf: d < 1.6 ? 12 : d < 2.6 ? 10 : d < 4.2 ? 7 : 3.5 };
};
