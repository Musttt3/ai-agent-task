// Time -> scene state for "Breathe", the waterfall triptych motion piece. Everything is a pure function of t (seconds),
// so any frame renders on its own. Cue times come from the music analysis (audio.json): kicks, hats, bar grid.
import audio from "./audio.json";

export const FPS = 30;
export const DURATION = audio.duration; // 25.78 s, the length of the track
export const TOTAL_FRAMES = Math.ceil(DURATION * FPS);

// Bar grid of the track (one bar = 1.32 s after the drop) and section boundaries.
export const T = {
  intro: [0.27, 0.94, 1.59, 2.25, 2.9, 3.59], // kicks during the intro groove
  build: 4.5, // drums drop out, downward sweep
  drop: 5.87,
  heroKicks: [7.19, 8.51, 9.83],
  p1: 11.15, // into the jungle panel
  p1Kick: 12.47,
  p3: 13.79, // into the waterfall panel
  p3Kick: 15.11,
  center: 16.43, // close-ups of the centre panel
  centerKicks: [17.75, 19.07, 20.39],
  outro: 21.71,
  outroKicks: [23.03, 24.35],
  end: DURATION,
};

export const HATS: number[] = audio.hats;
export const KICKS: number[] = audio.kicks;

// ---------- easing helpers ----------
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
export const inv = (a: number, b: number, x: number) => clamp((x - a) / (b - a));
export const smooth = (x: number) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const smoother = (x: number) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeInCubic = (x: number) => Math.pow(clamp(x), 3);
export const easeOutExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)));
export const easeInOutSine = (x: number) => -(Math.cos(Math.PI * clamp(x)) - 1) / 2;
export const easeOutBack = (x: number, s = 1.7) => { x = clamp(x) - 1; return 1 + (s + 1) * x * x * x + s * x * x; };
// Damped spring from 0 to 1 starting at t0 (x>=1 at rest). Used for landings and punches.
export const spring = (t: number, t0: number, freq = 3.2, damp = 5.5) => {
  const x = t - t0;
  if (x <= 0) return 0;
  return 1 - Math.exp(-damp * x) * Math.cos(2 * Math.PI * freq * x);
};
// Decaying impulse after a cue: 1 at the cue, e^{-k dt} after.
export const pulse = (t: number, t0: number, k = 8) => (t < t0 ? 0 : Math.exp(-k * (t - t0)));
export const pulses = (t: number, cues: number[], k = 8) => cues.reduce((s, c) => s + pulse(t, c, k), 0);

const rmsAt = (t: number) => {
  const i = clamp(t * FPS, 0, audio.rms.length - 1);
  const a = Math.floor(i), b = Math.min(a + 1, audio.rms.length - 1);
  return lerp(audio.rms[a], audio.rms[b], i - a);
};

export type Vec3 = [number, number, number];

export type CamMode = { kind: "world" } | { kind: "panel"; panel: 0 | 2 };

export type State = {
  t: number;
  shot: "intro" | "build" | "hero" | "p1" | "p3" | "center" | "outro";
  cam: { pos: Vec3; target: Vec3; fov: number; roll: number; frame: CamMode };
  fan: number; // side-panel hinge angle (radians); + folds toward the camera
  panelIn: [PanelIn, PanelIn, PanelIn]; // fly-in offsets
  disp: [number, number, number]; // depth displacement per panel
  edge: number; // panel edge glow
  person: { on: number; z: number; scale: number; bulge: number; rim: number };
  words: { lost: number; inn: number; nature: number; scatter: number };
  breathe: { letters: number; opacity: number; z: number };
  endCard: number;
  rays: number; // god-ray strength
  haze: number;
  particles: { density: number; implode: number; fall: number };
  burst: number; // seconds since the drop burst (<0 = none)
  ripples: number[]; // ripple start times that are alive
  slit: number; // light strip between the closing doors
  sweep: number; // light sweep across the collage, 0..1 (<0 off)
  flash: number; // white flash overlay
  fade: number; // black fade
  blur: [number, number]; // screen-space motion blur vector (uv units)
  ca: number; // chromatic aberration
  exposure: number;
  shake: number;
  hat: number; // hat pulse 0..1
};

export type PanelIn = { pos: Vec3; rot: Vec3; opacity: number };

const restIn = (): PanelIn => ({ pos: [0, 0, 0], rot: [0, 0, 0], opacity: 1 });

const FAN = (28 * Math.PI) / 180;
const CLOSED = (124 * Math.PI) / 180;

// Orbit camera around a target at a given azimuth (deg), elevation (deg), distance.
const orbit = (target: Vec3, az: number, el: number, dist: number): Vec3 => {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
  return [target[0] + Math.sin(a) * Math.cos(e) * dist, target[1] + Math.sin(e) * dist, target[2] + Math.cos(a) * Math.cos(e) * dist];
};

// Fly-in for a panel landing at cue c: starts far behind with a spin, lands with a small overshoot.
const flyIn = (t: number, c: number, from: Vec3, spin: Vec3): PanelIn => {
  if (t < c - 0.02) return { pos: from, rot: spin, opacity: 0 };
  const x = (t - c + 0.02) / 0.55;
  const p = easeOutBack(x, 1.25);
  const k = 1 - p;
  return { pos: [from[0] * k, from[1] * k, from[2] * k], rot: [spin[0] * k, spin[1] * k, spin[2] * k], opacity: clamp(x * 4) };
};

export const stateAt = (t: number): State => {
  const hat = clamp(pulses(t, HATS, 14));
  const kickP = clamp(pulses(t, KICKS, 7));
  const rms = rmsAt(t);
  const s: State = {
    t,
    shot: "intro",
    cam: { pos: [0, 0, 9], target: [0, 0, 0], fov: 38, roll: 0, frame: { kind: "world" } },
    fan: FAN,
    panelIn: [restIn(), restIn(), restIn()],
    disp: [0.1, 0.07, 0.1],
    edge: 0.25 + 0.5 * hat,
    person: { on: 0, z: 0.62, scale: 1, bulge: 0.07, rim: 0.6 },
    words: { lost: 0, inn: 0, nature: 0, scatter: 0 },
    breathe: { letters: 0, opacity: 0, z: 0.28 },
    endCard: 0,
    rays: 0.55 + 0.6 * rms,
    haze: 0.35,
    particles: { density: 1, implode: 0, fall: 0 },
    burst: -1,
    ripples: [],
    sweep: -1,
    slit: 0,
    flash: 0,
    fade: 0,
    blur: [0, 0],
    ca: 0.0015 + 0.004 * kickP,
    exposure: 1,
    shake: 0,
    hat,
  };

  // ---------------- INTRO: panels fly in on the first three kicks, words on the next three ----------------
  if (t < T.build) {
    s.shot = "intro";
    const [k1, k2, k3, k4, k5, k6] = T.intro;
    s.panelIn = [
      flyIn(t, k1, [-3.2, 1.6, -7], [0.6, 1.8, 0.4]),
      flyIn(t, k3, [0, -4.5, -5], [-1.2, 0, 0.2]),
      flyIn(t, k2, [3.2, -1.2, -7], [-0.5, -1.8, -0.4]),
    ];
    // Fan opens a little wider as everything lands, then settles.
    s.fan = FAN * lerp(1.7, 1, easeOutCubic(inv(k1, k4, t)));
    s.words.lost = inv(k4 - 0.02, k4 + 0.12, t);
    s.words.inn = inv(k5 - 0.02, k5 + 0.12, t);
    s.words.nature = inv(k6 - 0.02, k6 + 0.12, t);
    const u = smoother(inv(0, T.build, t));
    const tgt: Vec3 = [0, 0.05, 0];
    s.cam.pos = orbit(tgt, lerp(-16, 7, u), lerp(6, 2, u), lerp(10.4, 8.6, u));
    s.cam.target = tgt;
    s.cam.fov = 38 - 1.6 * pulses(t, [k4, k5, k6], 9);
    s.edge += 2.2 * pulses(t, [k1, k2, k3], 6);
    s.exposure = lerp(0, 1, smooth(inv(0, 0.5, t)));
    s.ripples = [k1, k2, k3, k4, k5, k6].filter((c) => t >= c && t < c + 3);
    s.particles.density = lerp(0.3, 1, inv(0, 2, t));
    s.shake = 0.6 * pulses(t, [k1, k2, k3], 14);
  }

  // ---------------- BUILD: words scatter, doors swing nearly shut, light leaks through the slit ----------------
  if (t >= T.build && t < T.drop) {
    s.shot = "build";
    const u = inv(T.build, T.drop, t);
    s.words.lost = s.words.inn = s.words.nature = 1;
    s.words.scatter = easeInCubic(inv(T.build, T.build + 0.75, t));
    s.fan = lerp(FAN, CLOSED, easeInOutSine(inv(T.build + 0.15, T.drop - 0.12, t)));
    const tgt: Vec3 = [0, 0.05, 0.3];
    s.cam.pos = orbit(tgt, lerp(7, 0, smooth(u)), lerp(2, -1, u), lerp(8.6, 7.2, easeInCubic(u)));
    s.cam.target = tgt;
    s.cam.fov = lerp(38, 29, easeInCubic(u));
    s.rays = lerp(0.7, 1.15, u);
    s.particles.implode = easeInCubic(u);
    s.edge = 0.4 + 1.4 * u;
    s.slit = Math.pow(inv(T.build + 0.5, T.drop, t), 1.6) * 1.3;
    s.flash = Math.pow(inv(T.drop - 0.15, T.drop, t), 2) * 0.85;
    s.shake = 1.4 * Math.pow(inv(T.drop - 0.6, T.drop, t), 2);
    s.ca = 0.002 + 0.01 * easeInCubic(u);
    s.haze = 0.35;
  }

  // ---------------- HERO: drop -> doors burst open, the person appears; slow low-angle orbit; BREATHE ----------------
  if (t >= T.drop && t < T.p1) {
    s.shot = "hero";
    const d = t - T.drop;
    s.fan = lerp(CLOSED, FAN, spring(t, T.drop, 1.6, 4.2));
    s.person.on = clamp(d / 0.1);
    s.person.scale = lerp(1.08, 1, easeOutExpo(d / 0.6));
    s.burst = d;
    s.flash = d < 0.4 ? 0.9 * Math.exp(-d * 14) : 0;
    s.slit = 1.3 * Math.exp(-d * 16);
    s.ripples = [T.drop, ...T.heroKicks].filter((c) => t >= c && t < c + 3);
    const orbitU = smoother(inv(T.drop, T.p1 - 0.25, t));
    const tgt: Vec3 = [0.02, -0.05, 0.35];
    const punch = 3.2 * (1 - spring(t, T.drop, 2.2, 5)) + 1.8 * pulses(t, T.heroKicks, 8);
    s.cam.pos = orbit(tgt, lerp(-20, 14, orbitU), lerp(-4, 1.5, orbitU), lerp(6.4, 5.6, orbitU));
    s.cam.target = tgt;
    s.cam.fov = 36 - punch;
    s.breathe.letters = clamp((t - T.heroKicks[0] + 0.02) / 0.33 + 1, 0, 7) * (t >= T.heroKicks[0] - 0.02 ? 1 : 0);
    s.breathe.opacity = 1;
    s.rays = 0.9 + 0.8 * rms + 0.9 * pulses(t, [T.drop, ...T.heroKicks], 4);
    s.edge = 0.3 + 0.6 * hat + 2.5 * pulse(t, T.drop, 5);
    s.shake = 1.6 * pulse(t, T.drop, 7) + 0.4 * pulses(t, T.heroKicks, 12);
    s.ca = 0.0015 + 0.012 * pulse(t, T.drop, 6) + 0.004 * pulses(t, T.heroKicks, 8);
    s.haze = 0.4;
    // whip pan to the left into the jungle panel
    const w = inv(T.p1 - 0.22, T.p1, t);
    if (w > 0) {
      const ww = easeInCubic(w);
      s.cam.pos = orbit(tgt, lerp(14, 14, orbitU), lerp(1.5, 1.5, orbitU), 5.6);
      const yaw = -ww * 0.3; // turn left, toward the jungle panel
      const dir = [s.cam.target[0] - s.cam.pos[0], s.cam.target[2] - s.cam.pos[2]];
      const c = Math.cos(yaw), sn = Math.sin(yaw);
      s.cam.target = [s.cam.pos[0] + dir[0] * c - dir[1] * sn, tgt[1], s.cam.pos[2] + dir[0] * sn + dir[1] * c];
      s.blur = [-0.13 * ww, 0];
    }
  }

  // ---------------- P1: inside the jungle panel, crane up with deep parallax ----------------
  if (t >= T.p1 && t < T.p3) {
    s.shot = "p1";
    const u = inv(T.p1, T.p3, t);
    const e = easeOutCubic(inv(T.p1, T.p1 + 0.35, t));
    s.cam.frame = { kind: "panel", panel: 0 };
    // local panel coords: x across (0 = panel centre), y up, z out of the panel. Seen as a relief card: wider view,
    // small orbit so the depth displacement reads, crane bottom -> top.
    const y = lerp(-0.66, 0.5, smoother(u));
    const x = lerp(0.12, -0.06, smoother(u));
    s.cam.pos = [x, y - 0.1, lerp(2.0, 2.25, u)];
    s.cam.target = [lerp(0.05, 0, e), y + 0.04, -0.15];
    s.cam.fov = 40 - 2 * pulse(t, T.p1Kick, 6);
    s.cam.roll = lerp(-0.06, 0.02, e) + 0.015 * Math.sin(u * 4);
    s.disp = [0.34, 0.07, 0.1];
    s.person.on = 0;
    s.blur = [-0.05 * (1 - e), 0];
    s.ca = 0.002 + 0.006 * (1 - e) + 0.004 * pulse(t, T.p1Kick, 6);
    s.edge = 0;
    s.rays = 0.5 + 0.5 * pulse(t, T.p1Kick, 3);
    s.haze = 0;
    s.particles.density = 1.2;
    s.exposure = 1 + 0.12 * pulse(t, T.p1Kick, 5);
    const w = inv(T.p3 - 0.2, T.p3, t);
    if (w > 0) { s.cam.target[0] += 0.9 * easeInCubic(w); s.blur = [0.07 * easeInCubic(w), 0]; }
  }

  // ---------------- P3: inside the waterfall panel, crane down the falls to the stream ----------------
  if (t >= T.p3 && t < T.center) {
    s.shot = "p3";
    const u = inv(T.p3, T.center, t);
    const e = easeOutCubic(inv(T.p3, T.p3 + 0.35, t));
    s.cam.frame = { kind: "panel", panel: 2 };
    const y = lerp(0.82, -0.8, smoother(u));
    const x = lerp(-0.4, 0.03, e) - 0.04 * Math.sin(u * 3);
    s.cam.pos = [x, y + 0.1, lerp(1.9, 1.6, u)];
    s.cam.target = [x * 0.4 + 0.03, y - 0.06, -0.2];
    s.cam.fov = 40 - 2 * pulse(t, T.p3Kick, 6);
    s.cam.roll = lerp(0.06, -0.015, e);
    s.disp = [0.1, 0.07, 0.4];
    s.person.on = 0;
    s.blur = [0.06 * (1 - e), 0];
    s.ca = 0.002 + 0.006 * (1 - e) + 0.004 * pulse(t, T.p3Kick, 6);
    s.edge = 0;
    s.rays = 0.5 + 0.5 * pulse(t, T.p3Kick, 3);
    s.haze = 0;
    s.particles.fall = 1;
    s.exposure = 1 + 0.12 * pulse(t, T.p3Kick, 5);
    // push-through into the centre: fast dolly + flash
    const w = inv(T.center - 0.25, T.center, t);
    if (w > 0) { s.cam.pos[2] -= 1.1 * easeInCubic(w); s.flash = 0.65 * Math.pow(w, 4); s.blur = [0, -0.03 * easeInCubic(w)]; }
  }

  // ---------------- CENTER: from the sandals up to the face, then pull back with the light ----------------
  if (t >= T.center && t < T.outro) {
    s.shot = "center";
    const [k1, k2, k3] = T.centerKicks;
    s.person.on = 1;
    s.person.z = 0.62;
    s.disp = [0.12, 0.22, 0.12];
    s.person.bulge = 0.09;
    s.flash = 0.6 * pulse(t, T.center, 14);
    const a = smoother(inv(T.center, k2, t)); // crane up the body
    const b = smoother(inv(k2 - 0.1, T.outro, t)); // pull back
    const camA: Vec3 = [lerp(0.42, -0.3, a), lerp(-1.18, 0.36, a), lerp(2.5, 2.5, a)];
    const tgtA: Vec3 = [lerp(0.12, 0.05, a), lerp(-1.12, 0.42, a), 0.55];
    const camB: Vec3 = [0.1, 0.5, 4.6];
    const tgtB: Vec3 = [0.02, 0.15, 0.3];
    s.cam.pos = [lerp(camA[0], camB[0], b), lerp(camA[1], camB[1], b), lerp(camA[2], camB[2], b)];
    s.cam.target = [lerp(tgtA[0], tgtB[0], b), lerp(tgtA[1], tgtB[1], b), lerp(tgtA[2], tgtB[2], b)];
    s.cam.fov = lerp(36, 38, b) - 1.6 * pulses(t, [k1, k2, k3], 7);
    s.cam.roll = lerp(0.035, 0, a);
    s.rays = 0.8 + 0.7 * rms + 1.3 * pulse(t, k2, 2.5) + 0.5 * pulses(t, [k1, k3], 4);
    s.haze = 0.45;
    s.edge = 0.3 + 0.5 * hat;
    s.breathe.opacity = 0;
    s.ripples = [k1, k2, k3].filter((c) => t >= c && t < c + 3);
    s.ca = 0.0015 + 0.005 * pulses(t, [k1, k2, k3], 8);
    s.exposure = 1 + 0.18 * pulse(t, k2, 4);
  }

  // ---------------- OUTRO: pull back, the triptych folds flat into the original photo; end card ----------------
  if (t >= T.outro) {
    s.shot = "outro";
    const [k1, k2] = T.outroKicks;
    const u = smoother(inv(T.outro, k2 - 0.15, t));
    const flat = smoother(inv(T.outro + 0.5, k2 - 0.1, t));
    s.person.on = 1;
    s.fan = lerp(FAN, 0, flat);
    s.person.z = lerp(0.62, 0.03, flat);
    s.person.bulge = lerp(0.09, 0, flat);
    s.person.rim = lerp(0.6, 0.15, flat);
    s.disp = [lerp(0.1, 0, flat), lerp(0.07, 0, flat), lerp(0.1, 0, flat)];
    const tgt: Vec3 = [lerp(0.02, -0.038, u), lerp(0.15, 0.0, u), lerp(0.3, 0, u)];
    const p0: Vec3 = [0.1, 0.5, 4.6];
    const p1: Vec3 = [-0.038, 0.0, 9.7];
    s.cam.pos = [lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u), lerp(p0[2], p1[2], u)];
    s.cam.target = tgt;
    s.cam.fov = lerp(38, 36, u) - 1.2 * pulse(t, k1, 7);
    s.endCard = smoother(inv(k1 - 0.1, k1 + 0.9, t));
    s.breathe.opacity = 0;
    s.sweep = inv(k2, k2 + 1.1, t) > 0 && inv(k2, k2 + 1.1, t) < 1 ? inv(k2, k2 + 1.1, t) : -1;
    s.edge = lerp(0.3, 0, flat) + 0.6 * hat * (1 - flat);
    s.rays = lerp(1.0, 0.55, u) + 0.4 * pulse(t, k2, 3);
    s.haze = lerp(0.4, 0.15, u);
    s.ripples = [T.outro, k1, k2].filter((c) => t >= c && t < c + 3);
    s.fade = smooth(inv(T.end - 0.45, T.end - 0.02, t));
    s.ca = 0.0012;
  }

  s.cam.fov = Math.max(20, s.cam.fov);
  return s;
};
