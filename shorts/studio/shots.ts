import { SHOTS, TOTAL } from "./src/videos/lascaux/story";
const mode = process.argv[2] ?? "mid";
if (mode === "table") { for (const s of SHOTS) console.log(s.id.padEnd(11), s.a, s.b, ((s.b - s.a) / 30).toFixed(2) + "s"); console.log("TOTAL", TOTAL); }
else console.log(SHOTS.map((s) => Math.round(mode === "late" ? s.b - 4 : (s.a + s.b) / 2)).join(","));
