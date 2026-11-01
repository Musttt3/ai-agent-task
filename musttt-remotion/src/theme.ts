import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Fonts ship in public/fonts so renders never depend on the network (both SIL OFL).
export const display = "Archivo Black";
export const mono = "Space Mono";
loadFont({ family: display, url: staticFile("fonts/ArchivoBlack-Regular.ttf"), weight: "400" });
loadFont({ family: mono, url: staticFile("fonts/SpaceMono-Regular.ttf"), weight: "400" });
loadFont({ family: mono, url: staticFile("fonts/SpaceMono-Bold.ttf"), weight: "700" });

// Palette taken from the hoodie: black cloth, warm-white petals, crimson flower cores.
export const C = {
  ground: "#0A0A0B",
  ink: "#F4F1EC",
  accent: "#C8102E",
  smoke: "#8A8A90",
} as const;

export const FPS = 30;
export const SIZE = 1080;

// Deterministic PRNG (mulberry32) so every render is identical.
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
