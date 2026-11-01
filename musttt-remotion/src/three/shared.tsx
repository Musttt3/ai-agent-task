import { useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { continueRender, delayRender, staticFile } from "remotion";
import { C, rng } from "../theme";

/** Positions the camera from props on every frame (driven by useCurrentFrame upstream). */
export const CameraRig: React.FC<{
  position: [number, number, number];
  lookAt?: [number, number, number];
  fov?: number;
}> = ({ position, lookAt = [0, 0, 0], fov = 35 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...position);
    camera.fov = fov;
    camera.near = 0.05;
    camera.far = 200;
    camera.updateProjectionMatrix();
    camera.lookAt(...lookAt);
  });
  return null;
};

/** A seeded star/dust field. Rotation is passed in so it stays a function of the frame. */
export const Dust: React.FC<{ count?: number; radius?: number; rotation: number; seed?: number; opacity?: number }> = ({
  count = 1400,
  radius = 30,
  rotation,
  seed = 7,
  opacity = 0.85,
}) => {
  const geometry = useMemo(() => {
    const r = rng(seed);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const ink = new THREE.Color(C.ink);
    const red = new THREE.Color(C.accent);
    for (let i = 0; i < count; i++) {
      const u = r() * 2 - 1;
      const th = r() * Math.PI * 2;
      const d = radius * (0.25 + 0.75 * Math.cbrt(r()));
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = d * s * Math.cos(th);
      pos[i * 3 + 1] = d * u;
      pos[i * 3 + 2] = d * s * Math.sin(th);
      const c = r() < 0.18 ? red : ink;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [count, radius, seed]);
  return (
    <points geometry={geometry} rotation={[rotation * 0.3, rotation, 0]}>
      <pointsMaterial size={0.07} vertexColors transparent opacity={opacity} sizeAttenuation depthWrite={false} />
    </points>
  );
};

/** Loads textures from public/ and blocks the render until they're decoded. */
export const useTextures = (files: string[]) => {
  const [textures, setTextures] = useState<Record<string, THREE.Texture> | null>(null);
  const [handle] = useState(() => delayRender("Loading pose textures"));
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    Promise.all(
      files.map(
        (f) =>
          new Promise<[string, THREE.Texture]>((resolve, reject) =>
            loader.load(
              staticFile(f),
              (t) => {
                t.colorSpace = THREE.SRGBColorSpace;
                t.anisotropy = 8;
                resolve([f, t]);
              },
              undefined,
              reject,
            ),
          ),
      ),
    )
      .then((entries) => {
        setTextures(Object.fromEntries(entries));
        continueRender(handle);
      })
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return textures;
};
