import { useMemo } from "react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import fontJson from "../fonts/archivo-black.typeface.json";

const font = new FontLoader().parse(fontJson as never);

export type LetterInfo = {
  char: string;
  geometry: THREE.BufferGeometry;
  // x of the letter's centre when the word is laid out centred at 0
  x: number;
};

/** Builds one extruded, centred geometry per letter of `word`. */
export const useLetters = (word: string, size = 1, depth = 0.35): LetterInfo[] => {
  return useMemo(() => {
    const scale = size / (fontJson as { resolution: number }).resolution;
    const glyphs = (fontJson as { glyphs: Record<string, { ha: number }> }).glyphs;
    const tracking = size * -0.02;
    let cursor = 0;
    const raw = [...word].map((char) => {
      const geometry = new TextGeometry(char, {
        font,
        size,
        depth,
        curveSegments: 10,
        bevelEnabled: true,
        bevelThickness: depth * 0.12,
        bevelSize: size * 0.012,
        bevelSegments: 4,
      });
      geometry.computeBoundingBox();
      const bb = geometry.boundingBox!;
      const cx = (bb.max.x + bb.min.x) / 2;
      const cy = (bb.max.y + bb.min.y) / 2;
      const cz = (bb.max.z + bb.min.z) / 2;
      geometry.translate(-cx, -cy, -cz);
      const advance = glyphs[char].ha * scale;
      const x = cursor + cx;
      cursor += advance + tracking;
      return { char, geometry, x };
    });
    const total = cursor - tracking;
    return raw.map((l) => ({ ...l, x: l.x - total / 2 }));
  }, [word, size, depth]);
};
