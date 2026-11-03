// Canvas-drawn type as textured planes. Fonts (Anton, Montserrat) are loaded from public/ before the scene is built.
import * as THREE from "three";

export type Glyph = { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; x: number; w: number; h: number };

const PX_PER_UNIT = 900;

// One plane for a run of text. `height` is the cap height in world units; returns the mesh centred on the origin.
export const textPlane = (text: string, font: string, weight: number, height: number, tracking = 0, color = "#ffffff") => {
  const fontPx = Math.round(height * PX_PER_UNIT * 1.32);
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  ctx.font = `${weight} ${fontPx}px "${font}"`;
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const track = tracking * fontPx;
  const total = widths.reduce((a, b) => a + b, 0) + track * (chars.length - 1);
  const pad = Math.round(fontPx * 0.25);
  c.width = Math.ceil(total + pad * 2);
  c.height = Math.ceil(fontPx * 1.5 + pad * 2);
  ctx.font = `${weight} ${fontPx}px "${font}"`;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = fontPx * 0.12;
  ctx.shadowOffsetY = fontPx * 0.02;
  let x = pad;
  chars.forEach((ch, i) => { ctx.fillText(ch, x, c.height / 2 + fontPx * 0.04); x += widths[i] + track; });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const w = c.width / PX_PER_UNIT / 1.32, h = c.height / PX_PER_UNIT / 1.32;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  return { mesh, mat, w, h, inkW: total / PX_PER_UNIT / 1.32 };
};

// A word split into per-letter planes laid out with the font's own advances (for letter-by-letter reveals).
export const letterRow = (text: string, font: string, weight: number, height: number, tracking = 0) => {
  const fontPx = Math.round(height * PX_PER_UNIT * 1.32);
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  ctx.font = `${weight} ${fontPx}px "${font}"`;
  const chars = [...text];
  const adv = chars.map((ch) => ctx.measureText(ch).width / PX_PER_UNIT / 1.32);
  const track = tracking * height * 1.32;
  const total = adv.reduce((a, b) => a + b, 0) + track * (chars.length - 1);
  const group = new THREE.Group();
  const glyphs: Glyph[] = [];
  let x = -total / 2;
  chars.forEach((ch, i) => {
    const p = textPlane(ch, font, weight, height);
    p.mesh.position.x = x + adv[i] / 2;
    group.add(p.mesh);
    glyphs.push({ mesh: p.mesh, mat: p.mat, x: x + adv[i] / 2, w: p.w, h: p.h });
    x += adv[i] + track;
  });
  return { group, glyphs, width: total };
};

export const loadFonts = async (urls: { family: string; url: string; weight?: string }[]) => {
  await Promise.all(
    urls.map(async ({ family, url, weight }) => {
      const f = new FontFace(family, `url(${url})`, weight ? { weight } : {});
      await f.load();
      (document.fonts as unknown as { add: (f: FontFace) => void }).add(f);
    }),
  );
  await document.fonts.ready;
};
