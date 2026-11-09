// 2.5D "3D camera" model shared by the depth-photo mesh and the HTML overlays.
// A still image is unprojected along the rays of a virtual camera at the origin (vertical FOV FOV0, looking down -Z):
// pixel (u, v) with relative depth d (1 = near, 0 = far) lands at distance Z = 1 / (d * (1/zn - 1/zf) + 1/zf).
// Seen from the origin the mesh reproduces the image exactly; moving the camera gives real parallax.
import * as THREE from "three";
import { Easing, interpolate } from "remotion";

export const FOV0 = 40; // degrees, vertical
export const TAN_H = Math.tan(((FOV0 / 2) * Math.PI) / 180);
export const ASPECT = 1080 / 1920; // images are generated 9:16 like the video

export type V3 = [number, number, number];
export type CamState = { pos: V3; look: V3; roll: number; crop: number };
export type Shot = {
  img: string; // public/krakatau/<img>.jpg + <img>_depth.png
  zn: number;
  zf: number;
  cam: (f: number) => CamState; // f = frame inside the shot
};

/** 3D point of image coords (u from left, v from TOP, depth d in 0..1) */
export const unproject = (u: number, v: number, d: number, zn: number, zf: number): V3 => {
  const Z = 1 / (d * (1 / zn - 1 / zf) + 1 / zf);
  return [(u - 0.5) * 2 * TAN_H * ASPECT * Z, (0.5 - v) * 2 * TAN_H * Z, -Z];
};

/** Apply a camera state to a three.js perspective camera */
export const applyCam = (cam: THREE.PerspectiveCamera, s: CamState) => {
  cam.fov = (2 * Math.atan(TAN_H / s.crop) * 180) / Math.PI;
  cam.aspect = ASPECT;
  cam.near = 0.05;
  cam.far = 100;
  cam.position.set(...s.pos);
  cam.up.set(Math.sin(s.roll), Math.cos(s.roll), 0);
  cam.lookAt(...s.look);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
};

const scratch = new THREE.PerspectiveCamera();
const pv = new THREE.Vector3();
const fwd = new THREE.Vector3();
/** Screen position (px in a 1080x1920 frame) and perspective scale (1 at view distance `ref`) of a 3D point */
export const toScreen = (s: CamState, p: V3, ref: number) => {
  applyCam(scratch, s);
  pv.set(...p).project(scratch);
  scratch.getWorldDirection(fwd);
  const dist = new THREE.Vector3(...p).sub(scratch.position).dot(fwd);
  return { x: (pv.x * 0.5 + 0.5) * 1080, y: (0.5 - pv.y * 0.5) * 1920, scale: (ref / dist) * s.crop, visible: dist > 0.05 };
};

// --- small helpers for camera paths ---
export const ease = Easing.bezier(0.16, 1, 0.3, 1); // fast start, long settle ("whip-in")
export const smooth = Easing.bezier(0.45, 0, 0.55, 1);
export const lerp3 = (f: number, frames: number[], vals: V3[], easing = smooth): V3 =>
  [0, 1, 2].map((i) =>
    interpolate(f, frames, vals.map((v) => v[i]), { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing }),
  ) as V3;
