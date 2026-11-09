// A still image turned into a depth-displaced mesh, filmed by a moving virtual camera (the "3D camera" look).
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { applyCam, ASPECT, Shot, TAN_H } from "./cam";

const GRID_X = 240;
const GRID_Y = 426;

type Loaded = { tex: THREE.Texture; depth: Float32Array; w: number; h: number };

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });

const useShotAssets = (img: string) => {
  const [data, setData] = useState<Loaded | null>(null);
  const [handle] = useState(() => delayRender(`load ${img}`));
  useEffect(() => {
    let alive = true;
    (async () => {
      const [color, depthIm] = await Promise.all([
        loadImage(staticFile(`krakatau/${img}.jpg`)),
        loadImage(staticFile(`krakatau/${img}_depth.png`)),
      ]);
      const c = document.createElement("canvas");
      c.width = depthIm.width;
      c.height = depthIm.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(depthIm, 0, 0);
      const px = ctx.getImageData(0, 0, c.width, c.height).data;
      const depth = new Float32Array(c.width * c.height);
      for (let i = 0; i < depth.length; i++) depth[i] = px[i * 4] / 255;
      const tex = new THREE.Texture(color);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.anisotropy = 4;
      tex.needsUpdate = true;
      if (alive) setData({ tex, depth, w: c.width, h: c.height });
      continueRender(handle);
    })();
    return () => {
      alive = false;
    };
  }, [img, handle]);
  return data;
};

const buildGeometry = (d: Loaded, zn: number, zf: number) => {
  const g = new THREE.PlaneGeometry(1, 1, GRID_X, GRID_Y);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const a = 1 / zn - 1 / zf;
  for (let i = 0; i < pos.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i); // 0 = bottom
    const sx = Math.min(d.w - 1, Math.round(u * (d.w - 1)));
    const sy = Math.min(d.h - 1, Math.round((1 - v) * (d.h - 1)));
    const dep = d.depth[sy * d.w + sx];
    const Z = 1 / (dep * a + 1 / zf);
    pos.setXYZ(i, (u - 0.5) * 2 * TAN_H * ASPECT * Z, (v - 0.5) * 2 * TAN_H * Z, -Z);
  }
  pos.needsUpdate = true;
  g.computeBoundingSphere();
  return g;
};

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
// colour + a little lateral chromatic aberration towards the frame edges
const frag = /* glsl */ `
uniform sampler2D map;
uniform float ca;
varying vec2 vUv;
void main() {
  vec2 dir = vUv - 0.5;
  float r = texture2D(map, vUv + dir * ca).r;
  float g = texture2D(map, vUv).g;
  float b = texture2D(map, vUv - dir * ca).b;
  gl_FragColor = vec4(r, g, b, 1.0);
  #include <colorspace_fragment>
}`;

const Inner: React.FC<{ shot: Shot; data: Loaded; ca: number }> = ({ shot, data, ca }) => {
  const f = useCurrentFrame();
  const { camera } = useThree();
  const geo = useMemo(() => buildGeometry(data, shot.zn, shot.zf), [data, shot.zn, shot.zf]);
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ uniforms: { map: { value: data.tex }, ca: { value: ca } }, vertexShader: vert, fragmentShader: frag }),
    [data, ca],
  );
  applyCam(camera as THREE.PerspectiveCamera, shot.cam(f));
  return <mesh geometry={geo} material={mat} frustumCulled={false} />;
};

export const DepthPhoto: React.FC<{ shot: Shot; ca?: number }> = ({ shot, ca = 0.0022 }) => {
  const data = useShotAssets(shot.img);
  // mount the canvas only once the assets exist, so ThreeCanvas' own first-render wait covers the mesh
  if (!data) return null;
  return (
    <ThreeCanvas width={1080} height={1920} gl={{ antialias: true, stencil: false }} camera={{ fov: 40, near: 0.05, far: 100 }}>
      <color attach="background" args={["#050403"]} />
      <Inner shot={shot} data={data} ca={ca} />
    </ThreeCanvas>
  );
};
