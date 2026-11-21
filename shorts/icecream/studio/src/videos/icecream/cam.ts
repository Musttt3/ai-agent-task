// Camera grammar of the 2d-in-3d-animation-agent template (story.ts there), generalised for 16:9:
// continuous slow push-ins (pushK), smootherstep glides between keys, hard cuts on reframes, sign-flipping 7-frame kicks.
// Presets build a framing from a subject position, so every beat can be split into 2-3 contrasting sub-angles:
// wide/establishing, medium, close-up, macro insert on a prop, low Dutch push-in, high-angle crane, over-the-shoulder.
export type V3 = [number, number, number];
export type CamPose = { pos: V3; look: V3; fov: number; roll: number };
export type Shot = Partial<CamPose> & { pos: V3; look: V3 };
export type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const mix = (a: CamPose, b: CamPose, k: number): CamPose => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3,
  look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k,
  roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): CamPose => ({ fov: 30, roll: 0, ...c });
export const run = (keys: Key[], f: number): CamPose => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 22)));
  }
  return cur;
};

/** push-in factor since f0: the subject grows ~rate per frame; `punch` raises it for the first n frames */
export const pushK = (f: number, f0: number, rate: number, punch = 0, n = 28) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 7, (n - i - 0.5) / 7));
  return Math.exp(-s);
};
export const dolly = (pos: V3, look: V3, k: number, rest: Partial<CamPose> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });

// ---------------- framing presets (subject c = feet position; az = degrees around the subject, 0 = from +z) ----------------
const at = (c: V3, d: number, h: number, az: number): V3 => {
  const a = (az * Math.PI) / 180;
  return [c[0] + Math.sin(a) * d, h, c[2] + Math.cos(a) * d];
};
type P = { az?: number; d?: number; h?: number; ly?: number; fov?: number; roll?: number; rate?: number; punch?: number; orbit?: number; rise?: number; dx?: number };
/** generic framing around a point with a continuous push-in, optional orbit (deg over the shot) and crane rise (m) */
export const frame = (c: V3, f0: number, d: number, h: number, ly: number, o: P = {}) => (f: number): Shot => {
  const t = Math.max(0, f - f0), az = (o.az ?? 0) + (o.orbit ?? 0) * Math.min(1, t / 150);
  const pos = at(c, o.d ?? d, (o.h ?? h) + (o.rise ?? 0) * Math.min(1, t / 120), az);
  if (o.dx) pos[0] += o.dx;
  const look: V3 = [c[0] + (o.dx ?? 0) * 0.3, o.ly ?? ly, c[2]];
  return dolly(pos, look, pushK(f, f0, o.rate ?? 0.0022, o.punch ?? 0, 24), { fov: o.fov ?? 30, roll: o.roll ?? 0 });
};
export const wide = (c: V3, f0: number, o: P = {}) => frame(c, f0, 9.5, 2.6, 1.2, { fov: 32, rate: 0.0016, ...o });
export const two = (c: V3, f0: number, o: P = {}) => frame(c, f0, 5.2, 1.7, 1.05, { fov: 30, ...o });
export const ms = (c: V3, f0: number, o: P = {}) => frame(c, f0, 3.3, 1.45, 1.15, { fov: 30, rate: 0.0026, ...o });
export const cu = (c: V3, f0: number, o: P = {}) => frame(c, f0, 1.6, 1.5, 1.38, { fov: 28, rate: 0.003, ...o });
/** macro insert on a prop point (y included in c) */
export const ins = (c: V3, f0: number, o: P = {}) => (f: number): Shot => {
  const a = ((o.az ?? 0) * Math.PI) / 180, d = o.d ?? 1.1;
  const pos: V3 = [c[0] + Math.sin(a) * d, c[1] + (o.h ?? 0.35), c[2] + Math.cos(a) * d];
  return dolly(pos, c, pushK(f, f0, o.rate ?? 0.0034, o.punch ?? 0.007, 22), { fov: o.fov ?? 30, roll: o.roll ?? 0.04 });
};
/** low-angle Dutch push-in on a character */
export const low = (c: V3, f0: number, o: P = {}) => frame(c, f0, 2.7, 0.7, 1.35, { fov: 31, roll: -0.07, rate: 0.0034, punch: 0.0075, ...o });
/** high-angle crane looking down */
export const high = (c: V3, f0: number, o: P = {}) => frame(c, f0, 5.5, 5.2, 0.6, { fov: 32, rate: 0.002, ...o });
