// Converts a TTF into the Three.js "typeface" JSON format used by FontLoader.
import fs from "node:fs";
import opentype from "opentype.js";

const [, , input, output] = process.argv;
const buf = fs.readFileSync(input);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@.,·!?-_ /&'";
const glyphs = {};
for (const ch of chars) {
  const g = font.charToGlyph(ch);
  const p = g.getPath(0, 0, font.unitsPerEm);
  const o = [];
  for (const c of p.commands) {
    // getPath flips Y for screen space; flip back for Three (Y up).
    if (c.type === "M") o.push("m", c.x, -c.y);
    else if (c.type === "L") o.push("l", c.x, -c.y);
    else if (c.type === "Q") o.push("q", c.x, -c.y, c.x1, -c.y1);
    else if (c.type === "C") o.push("b", c.x, -c.y, c.x1, -c.y1, c.x2, -c.y2);
  }
  const bb = g.getBoundingBox();
  glyphs[ch] = {
    ha: Math.round(g.advanceWidth),
    x_min: Math.round(bb.x1),
    x_max: Math.round(bb.x2),
    o: o.map((v) => (typeof v === "number" ? Math.round(v * 100) / 100 : v)).join(" "),
  };
}
const head = font.tables.head;
fs.writeFileSync(
  output,
  JSON.stringify({
    glyphs,
    familyName: font.names.fontFamily?.en ?? "Font",
    ascender: font.ascender,
    descender: font.descender,
    underlinePosition: font.tables.post.underlinePosition,
    underlineThickness: font.tables.post.underlineThickness,
    boundingBox: { xMin: head.xMin, yMin: head.yMin, xMax: head.xMax, yMax: head.yMax },
    resolution: font.unitsPerEm,
    original_font_information: { format: 0, fontFamily: font.names.fontFamily?.en },
  }),
);
console.log("wrote", output, Object.keys(glyphs).length, "glyphs");
