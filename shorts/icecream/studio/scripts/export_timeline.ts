// Exports the picture's events for the sound design (audio/ice_timeline.json): per-frame world state as runs (set, light,
// generator on, lid, fire, stars, melt, cart position), every badge / mark / burst / hop / wolf / walking crowd with its
// frame, kicks and flashes. Run: npx esbuild scripts/export_timeline.ts --bundle --platform=node --outfile=out/tl.cjs && node out/tl.cjs
import "./node_shim";
import fs from "fs";
import { RANGES, END, FLASHES, beatAt } from "../src/videos/icecream/story";
import { DEFAULT_WS, WS } from "../src/videos/icecream/beats";

type Ev = { k: string; f: number; x?: number; z?: number; text?: string; n?: number };
const ev: Ev[] = [], seen = new Set<string>();
const once = (id: string, e: Ev) => { if (!seen.has(id)) { seen.add(id); ev.push(e); } };
const runs: Record<string, [number, unknown][]> = {};
const rec = (k: string, f: number, v: unknown) => { const r = (runs[k] ??= []); const s = JSON.stringify(v); if (!r.length || JSON.stringify(r[r.length - 1][1]) !== s) r.push([f, v]); };
const kicks: number[] = [];
for (const r of RANGES) for (const k of r.beat.kicks ?? []) kicks.push(k);

for (let f = 0; f < END; f++) {
  const i = beatAt(f), R = RANGES[i], beat = R.beat;
  const ws: WS = { ...DEFAULT_WS, set: beat.set, ...(beat.ws ? beat.ws(f) : {}) } as WS;
  rec("beat", f, beat.si); rec("set", f, ws.set); rec("light", f, beat.light); rec("gen", f, ws.genOn && ws.set === "valley");
  rec("lid", f, Math.round(ws.lid * 10) / 10); rec("fire", f, ws.fire); rec("stars", f, ws.stars); rec("melt", f, ws.melt);
  rec("top", f, ws.top); rec("board", f, ws.board); rec("cart", f, ws.cart.map((v) => Math.round(v * 10) / 10));
  let walkers = 0, people = 0, wolf = 0;
  const c: any = {
    f, t: f / 30, a: R.a, b: R.b, u: 0, cam: {}, out: { places: [], fx: [] },
    P: (_w: unknown, x: number, z: number, o: any = {}) => {
      people++; if (o.mode === "march" || o.mode === "stroll") walkers++;
      for (const h of o.hop ?? []) if (h === f) ev.push({ k: "hop", f, x, z });
      if (o.prop) once(`prop|${beat.si}|${o.prop}|${Math.round(x)}`, { k: "prop", f, text: String(o.prop), x, z });
    },
    badge: (key: string, text: string, sub: string, _bg: string, _fg: string, x: number, _y: number, z: number, _w: number, at: number) => { if (f >= at) once(`b|${key}|${text}|${at}`, { k: "badge", f: at, text: text + (sub ? " / " + sub : ""), x, z }); },
    mark: (text: string, _c: string, x: number, _y: number, z: number, _w: number, at: number) => { if (f >= at) once(`m|${text}|${at}`, { k: "mark", f: at, text, x, z }); },
    puffs: (key: string, _x: number, _y: number, _z: number, o: any) => { if (o.on !== false) once(`p|${key}|${i}`, { k: "puffs", f, text: key }); },
    wolf: () => { wolf++; },
    burst: (x: number, _y: number, z: number, _w: number, at: number) => { if (f >= at) once(`u|${at}|${x}`, { k: "burst", f: at, x, z }); },
    thought: (_x: number, _y: number, _z: number, _w: number, at: number) => { if (f >= at) once(`t|${at}`, { k: "thought", f: at }); },
  };
  beat.stage(c);
  rec("walkers", f, walkers); rec("people", f, people); rec("wolf", f, wolf);
}
ev.sort((a, b) => a.f - b.f);
const beats = RANGES.map((r) => ({ si: r.beat.si, a: r.a, b: r.b, set: r.beat.set, light: r.beat.light }));
fs.writeFileSync(process.argv[2] ?? "out/ice_timeline.json", JSON.stringify({ fps: 30, total: END, flashes: FLASHES, kicks, beats, runs, events: ev }));
console.log("frames", END, "events", ev.length, "kicks", kicks.length, "flashes", FLASHES.length);
