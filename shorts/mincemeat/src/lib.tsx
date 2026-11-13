import React from 'react';
import {continueRender, delayRender, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {FPS} from './timeline';

export const C = {
  ink: '#0c0a08',
  paper: '#eadfc6',
  paperDark: '#cdbb94',
  red: '#c0241c',
  redBright: '#e2382d',
  gold: '#e6c27a',
  bone: '#f3ead6',
  steel: '#9aa4a8',
};

export const SERIF = '"Playfair Display", Georgia, serif';
export const TYPE = '"Special Elite", "Courier New", monospace';
export const MONO = '"IBM Plex Mono", monospace';
export const COND = '"Oswald", "Arial Narrow", sans-serif';
export const HAND = '"Caveat", cursive';

const FONTS: [string, string, string, string][] = [
  ['Playfair Display', 'playfair-display-latin-400-normal.woff2', '400', 'normal'],
  ['Playfair Display', 'playfair-display-latin-700-normal.woff2', '700', 'normal'],
  ['Playfair Display', 'playfair-display-latin-900-normal.woff2', '900', 'normal'],
  ['Playfair Display', 'playfair-display-latin-400-italic.woff2', '400', 'italic'],
  ['Playfair Display', 'playfair-display-latin-700-italic.woff2', '700', 'italic'],
  ['Playfair Display', 'playfair-display-latin-900-italic.woff2', '900', 'italic'],
  ['Special Elite', 'special-elite-latin-400-normal.woff2', '400', 'normal'],
  ['Oswald', 'oswald-latin-500-normal.woff2', '500', 'normal'],
  ['Oswald', 'oswald-latin-700-normal.woff2', '700', 'normal'],
  ['IBM Plex Mono', 'ibm-plex-mono-latin-400-normal.woff2', '400', 'normal'],
  ['IBM Plex Mono', 'ibm-plex-mono-latin-600-normal.woff2', '600', 'normal'],
  ['Caveat', 'caveat-latin-700-normal.woff2', '700', 'normal'],
];

let fontsLoaded = false;
export const loadFonts = () => {
  if (fontsLoaded || typeof document === 'undefined') return;
  fontsLoaded = true;
  const h = delayRender('fonts');
  Promise.all(
    FONTS.map(([fam, file, weight, style]) => {
      const ff = new FontFace(fam, `url(${staticFile('fonts/' + file)})`, {weight, style});
      return ff.load().then((x) => (document.fonts as unknown as {add: (f: FontFace) => void}).add(x));
    }),
  )
    .then(() => continueRender(h))
    .catch((e) => {
      console.error(e);
      continueRender(h);
    });
};

/** Local time in seconds inside the current <Sequence>. */
export const useT = () => useCurrentFrame() / FPS;

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const ramp = (t: number, a: number, b: number, ease: (x: number) => number = Easing.out(Easing.cubic)) =>
  ease(clamp01((t - a) / (b - a)));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** 0→1 in, hold, 1→0 out (seconds, local). */
export const inOut = (t: number, a: number, aDur: number, b: number, bDur: number) =>
  interpolate(t, [a, a + aDur, b - bDur, b], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/** Deterministic pseudo-random in [0,1). */
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Damped spring overshoot for slams: starts at `from`, settles at 1. */
export const slam = (t: number, t0: number, from = 2.4) => {
  const u = t - t0;
  if (u < 0) return from;
  const k = 0.11;
  if (u < k) return lerp(from, 0.94, Easing.in(Easing.quad)(u / k));
  const v = u - k;
  return 1 - 0.06 * Math.exp(-v * 9) * Math.cos(v * 34);
};

/** Small camera shake that decays after t0. */
export const shake = (t: number, t0: number, amp = 14, dur = 0.45) => {
  const u = t - t0;
  if (u < 0 || u > dur) return {x: 0, y: 0, r: 0};
  const d = Math.pow(1 - u / dur, 2);
  const i = Math.floor(u * FPS);
  return {x: (rnd(i * 3.1 + t0) - 0.5) * 2 * amp * d, y: (rnd(i * 7.7 + t0) - 0.5) * 2 * amp * d, r: (rnd(i * 1.3 + t0) - 0.5) * 1.2 * d};
};

export const Abs: React.FC<React.PropsWithChildren<{style?: React.CSSProperties}>> = ({children, style}) => (
  <div style={{position: 'absolute', inset: 0, ...style}}>{children}</div>
);
