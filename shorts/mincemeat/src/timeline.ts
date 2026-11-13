// Edit decision list for "Operation Mincemeat". All times in seconds, taken from the word timings of the
// voice-over (src/words.json, faster-whisper small, checked by ear against the script).
export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const DURATION_S = 70.5;
export const f = (s: number) => Math.round(s * FPS);

// How the cut INTO a shot is made.
//  cut      hard cut
//  flash    hard cut + white impact flash + camera shake
//  whip     horizontal whip pan (outgoing pushed left, incoming from right, motion blur)
//  whipV    vertical whip pan
//  zoom     zoom-through (outgoing punches in and blurs, incoming settles from 1.25x)
//  leak     film burn / light-leak dissolve
//  shutter  camera shutter blades close and open
//  black    power cut: 4 frames of black, then the picture flickers back on
//  fade     slow cross-dissolve
export type Trans = 'cut' | 'flash' | 'whip' | 'whipV' | 'zoom' | 'leak' | 'shutter' | 'black' | 'fade';

export type KB = {z: [number, number]; x?: [number, number]; y?: [number, number]; r?: [number, number]};

export type Shot = {
  id: string;
  src: string;
  kind: 'video' | 'image';
  start: number;
  end: number;
  in: Trans;
  kb: KB; // Ken Burns: zoom / pan (px) / rotation (deg) from start to end of the shot
  rate?: number; // video playback rate
  trimStart?: number; // seconds into the clip
  grade?: string; // extra CSS filter
};

export const SHOTS: Shot[] = [
  {id: 's01', src: 'media/1.mp4', kind: 'video', start: 0, end: 7.6, in: 'fade', kb: {z: [1.12, 1.02]}},
  {id: 's02', src: 'media/02.jpg', kind: 'image', start: 7.6, end: 9.3, in: 'flash', kb: {z: [1.18, 1.3], y: [0, -30]}},
  {id: 's03', src: 'media/03.mp4', kind: 'video', start: 9.3, end: 13.3, in: 'leak', kb: {z: [1.05, 1.14]}, trimStart: 0.4},
  {id: 's04', src: 'media/04.jpg', kind: 'image', start: 13.3, end: 18.7, in: 'whip', kb: {z: [1.08, 1.22], x: [30, -30], r: [0.6, -0.4]}},
  {id: 's05', src: 'media/05.mp4', kind: 'video', start: 18.7, end: 23.85, in: 'zoom', kb: {z: [1.04, 1.12], x: [0, -20]}},
  {id: 's06', src: 'media/06.jpg', kind: 'image', start: 23.85, end: 29.25, in: 'zoom', kb: {z: [1.25, 1.08], x: [-40, 20], y: [20, -10]}},
  {id: 's07', src: 'media/07.jpg', kind: 'image', start: 29.25, end: 33.65, in: 'shutter', kb: {z: [1.06, 1.22], x: [10, -25], y: [-40, 10], r: [-1, 0.5]}},
  {id: 's08', src: 'media/08.mp4', kind: 'video', start: 33.65, end: 39.25, in: 'whipV', kb: {z: [1.04, 1.1]}, rate: 0.86},
  {id: 's09', src: 'media/09.mp4', kind: 'video', start: 39.25, end: 43.5, in: 'fade', kb: {z: [1.02, 1.1]}, trimStart: 0.6},
  {id: 's10', src: 'media/010.mp4', kind: 'video', start: 43.5, end: 47.9, in: 'leak', kb: {z: [1.04, 1.1]}, trimStart: 0.5},
  {id: 's11', src: 'media/011.mp4', kind: 'video', start: 47.9, end: 52.85, in: 'whip', kb: {z: [1.02, 1.08]}, trimStart: 0.2},
  {id: 's12', src: 'media/012.mp4', kind: 'video', start: 52.85, end: 58.15, in: 'flash', kb: {z: [1.06, 1.0]}, trimStart: 0.3},
  {id: 's13', src: 'media/013.jpg', kind: 'image', start: 58.15, end: 61.5, in: 'black', kb: {z: [1.22, 1.06], y: [40, 0]}},
  {id: 's14', src: 'media/014.jpg', kind: 'image', start: 61.5, end: 70.5, in: 'fade', kb: {z: [1.02, 1.2], x: [0, 30], y: [0, 40]}},
];

// Overlap (seconds) each side of a cut that the transition needs.
export const PAD: Record<Trans, number> = {
  cut: 0, flash: 0, whip: 0.2, whipV: 0.2, zoom: 0.17, leak: 0.35, shutter: 0, black: 0, fade: 0.5,
};

// Captions are hidden while a big on-screen title already says the same words.
export const CAPTION_MUTE: [number, number][] = [
  [7.6, 9.3], // SESOSOK MAYAT.
  [59.6, 61.55], // OPERATION MINCEMEAT
];
