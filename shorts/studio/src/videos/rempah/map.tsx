// Paper world map (Mercator, Natural Earth 1:50m via world-atlas) with a word-timed camera, ink routes that draw
// themselves, pins and labels. The map is projected once into a 4000 px plane; the camera scales/translates it.
import React from "react";
import { geoGraticule10, geoMercator, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import land50 from "world-atlas/land-50m.json";
import countries50 from "world-atlas/countries-50m.json";
import land110 from "world-atlas/land-110m.json";
import countries110 from "world-atlas/countries-110m.json";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, F, clamp01, ease, eout, lin, mix, pop } from "./kit";

const MW = 4000;
const proj = geoMercator().scale(MW / (2 * Math.PI)).translate([MW / 2, MW / 2]).precision(0.2);
export const P = (lon: number, lat: number) => proj([lon, lat]) as [number, number];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LAND_F = feature(land50 as any, (land50 as any).objects.land) as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BORDER_M = mesh(countries50 as any, (countries50 as any).objects.countries, (a: unknown, b: unknown) => a !== b) as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LAND_LO = feature(land110 as any, (land110 as any).objects.land) as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BORDER_LO = mesh(countries110 as any, (countries110 as any).objects.countries, (a: unknown, b: unknown) => a !== b) as any;
const GRAT_F = geoGraticule10();
/** the map re-projected for one camera (scale z, offset tx/ty) and clipped to the frame: cheap to rasterize at any zoom */
const viewPaths = (z: number, tx: number, ty: number) => {
  const pr = geoMercator().scale((MW * z) / (2 * Math.PI)).translate([(MW / 2) * z + tx, (MW / 2) * z + ty])
    .clipExtent([[-60, -60], [1140, 1980]]).precision(0.4);
  const g = geoPath(pr);
  const lo = z < 1.2;
  return { land: g(lo ? LAND_LO : LAND_F) ?? "", borders: g(lo ? BORDER_LO : BORDER_M) ?? "", grat: g(GRAT_F) ?? "" };
};

export type Cam = { t: number; lon: number; lat: number; z: number };
export const camAt = (keys: Cam[], t: number) => {
  let x = P(keys[0].lon, keys[0].lat), z = keys[0].z;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t >= a.t) {
      const k = ease(t, a.t, b.t);
      const pa = P(a.lon, a.lat), pb = P(b.lon, b.lat);
      x = [mix(pa[0], pb[0], k), mix(pa[1], pb[1], k)];
      z = Math.exp(mix(Math.log(a.z), Math.log(b.z), k));
    }
  }
  return { x, z, tx: 540 - x[0] * z, ty: 900 - x[1] * z };
};

/** Catmull-Rom through projected waypoints, sampled densely, with cumulative length */
const routeCache = new Map<string, { pts: [number, number][]; cum: number[] }>();
export const routePts = (wp: [number, number][]) => {
  const key = JSON.stringify(wp);
  const hit = routeCache.get(key);
  if (hit) return hit;
  const q = wp.map(([lo, la]) => P(lo, la));
  const pts: [number, number][] = [];
  for (let i = 0; i < q.length - 1; i++) {
    const p0 = q[Math.max(0, i - 1)], p1 = q[i], p2 = q[i + 1], p3 = q[Math.min(q.length - 1, i + 2)];
    for (let s = 0; s < 16; s++) {
      const u = s / 16, u2 = u * u, u3 = u2 * u;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
      pts.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  pts.push(q[q.length - 1]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const r = { pts, cum };
  routeCache.set(key, r);
  return r;
};
/** an arc between two points (for symbolic links) */
export const arcWp = (a: [number, number], b: [number, number], lift = 0.25): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i <= 12; i++) {
    const u = i / 12;
    out.push([mix(a[0], b[0], u), mix(a[1], b[1], u) + Math.sin(u * Math.PI) * Math.abs(b[0] - a[0]) * lift]);
  }
  return out;
};

const partial = (wp: [number, number][], p: number, z: number, tx: number, ty: number) => {
  const r0 = routePts(wp);
  const pts = r0.pts.map(([x, y]) => [x * z + tx, y * z + ty] as [number, number]);
  const cum = r0.cum.map((c) => c * z);
  const L = cum[cum.length - 1] * clamp01(p);
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  let head = pts[0];
  for (let i = 1; i < pts.length; i++) {
    if (cum[i] <= L) {
      d += `L${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)}`;
      head = pts[i];
    } else {
      const k = (L - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
      head = [mix(pts[i - 1][0], pts[i][0], k), mix(pts[i - 1][1], pts[i][1], k)];
      d += `L${head[0].toFixed(1)},${head[1].toFixed(1)}`;
      break;
    }
  }
  return { d, head };
};

export type Route = { wp: [number, number][]; a: number; b: number; color: string; w?: number; dash?: string; fadeTo?: { at: number; color: string }; headDot?: boolean };
export type Pin = { lon: number; lat: number; at: number; label?: string; side?: "r" | "l" | "t" | "b"; color?: string; until?: number; big?: boolean; labelAt?: number };

export const MapView: React.FC<{ t: number; cam: Cam[]; routes?: Route[]; pins?: Pin[]; children?: (c: { sx: (lon: number, lat: number) => [number, number]; z: number }) => React.ReactNode }> = ({
  t, cam, routes = [], pins = [], children,
}) => {
  const { z, tx, ty } = camAt(cam, t);
  const vp = viewPaths(z, tx, ty);
  const sx = (lon: number, lat: number): [number, number] => {
    const [x, y] = P(lon, lat);
    return [x * z + tx, y * z + ty];
  };
  return (
    <AbsoluteFill style={{ backgroundColor: C.sea, overflow: "hidden" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={vp.grat} fill="none" stroke="rgba(40,70,80,0.16)" strokeWidth={1.2} />
        <path d={vp.land} fill="rgba(70,55,35,0.20)" transform="translate(4,6)" />
        <path d={vp.land} fill={C.land} stroke="#4a3f33" strokeWidth={2.2} strokeLinejoin="round" />
        <path d={vp.borders} fill="none" stroke="rgba(74,63,51,0.22)" strokeWidth={1.1} />
        {routes.map((r, i) => {
          const p = ease(t, r.a, r.b);
          if (p <= 0) return null;
          const { d, head } = partial(r.wp, p, z, tx, ty);
          const fk = r.fadeTo ? lin(t, r.fadeTo.at, r.fadeTo.at + 0.3) : 0;
          const col = fk > 0 && r.fadeTo ? r.fadeTo.color : r.color;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke="rgba(246,238,220,0.9)" strokeWidth={(r.w ?? 7) + 7} strokeLinecap="round" strokeLinejoin="round" opacity={1 - fk * 0.6} />
              <path d={d} fill="none" stroke={col} strokeWidth={r.w ?? 7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={r.dash} />
              {r.headDot !== false && p < 1 ? <circle cx={head[0]} cy={head[1]} r={9} fill={col} stroke={C.paperHi} strokeWidth={3} /> : null}
            </g>
          );
        })}
      </svg>
      <AbsoluteFill style={{ mixBlendMode: "multiply", opacity: 0.55 }}>
        <Img src={staticFile("rempah/paper.jpg")} style={{ width: 1080, height: 1920 }} />
      </AbsoluteFill>
      {pins.map((p, i) => {
        if (t < p.at || (p.until !== undefined && t > p.until + 0.2)) return null;
        const [x, y] = sx(p.lon, p.lat);
        const k = pop(t, p.at, 0.4, 0.3);
        const out = p.until !== undefined ? 1 - lin(t, p.until, p.until + 0.2) : 1;
        const R = p.big ? 17 : 13;
        const lk = eout(lin(t, p.labelAt ?? p.at + 0.08, (p.labelAt ?? p.at + 0.08) + 0.25));
        const side = p.side ?? "r";
        const off = { r: [R + 16, -30], l: [-(R + 16), -30], t: [0, -R - 74], b: [0, R + 14] }[side];
        return (
          <div key={i} style={{ position: "absolute", left: 0, top: 0, opacity: out }}>
            <div style={{ position: "absolute", left: x - R, top: y - R, width: 2 * R, height: 2 * R, borderRadius: "50%", background: p.color ?? C.red,
              border: `5px solid ${C.paperHi}`, boxShadow: "0 3px 6px rgba(0,0,0,0.35)", transform: `scale(${k})` }} />
            {p.label ? (
              <div style={{ position: "absolute", left: x + off[0], top: y + off[1], transform: `translateX(${side === "l" ? "-100%" : side === "r" ? "0" : "-50%"})`,
                clipPath: `inset(0 ${100 - lk * 100}% 0 0)`, background: C.ink, color: C.paperHi, fontFamily: F.label, fontWeight: 700, fontSize: 40, letterSpacing: 3,
                padding: "4px 14px", whiteSpace: "nowrap", boxShadow: "0 4px 8px rgba(0,0,0,0.3)" }}>
                {p.label}
              </div>
            ) : null}
          </div>
        );
      })}
      {children ? children({ sx, z }) : null}
    </AbsoluteFill>
  );
};

// places (lon, lat)
export const PL = {
  manhattan: [-74.0, 40.7] as [number, number],
  run: [129.69, -4.55] as [number, number],
  maluku: [127.6, -1.2] as [number, number],
  terqa: [40.6, 34.9] as [number, number],
  kollam: [76.6, 8.9] as [number, number],
  alexandria: [29.9, 31.2] as [number, number],
  venice: [12.3, 45.4] as [number, number],
  lisbon: [-9.1, 38.7] as [number, number],
  malaka: [102.25, 2.2] as [number, number],
  amsterdam: [4.9, 52.37] as [number, number],
};

export const R_MALUKU_INDIA: [number, number][] = [[127.6, -1.2], [123, -5.5], [114, -6], [106.5, -5.2], [104.5, -1.5], [101.5, 2.5], [97.5, 5.8], [88, 6.5], [80.5, 6.2], [76.6, 8.9]];
export const R_INDIA_ARAB: [number, number][] = [[76.6, 8.9], [70, 11.5], [58, 13], [48, 12.3], [43.2, 13.3], [40, 18], [36.5, 23.5], [33.5, 27.5], [32.4, 30.5], [29.9, 31.2]];
export const R_ARAB_VENICE: [number, number][] = [[29.9, 31.2], [25, 33.6], [20.5, 35.5], [18.6, 39.6], [16, 42.2], [12.3, 45.4]];
export const R_TERQA: [number, number][] = [[127.6, -1.2], [123, -5.5], [114, -6], [106.5, -5.2], [104.5, -1.5], [101.5, 2.5], [97.5, 5.8], [88, 6.5], [80.5, 6.2], [74, 13], [66, 22], [57, 24.5], [51, 27.5], [48, 30], [44.5, 33], [40.6, 34.9]];
export const R_PORTUGAL: [number, number][] = [[-9.1, 38.7], [-13, 30], [-18.5, 19], [-18.5, 9], [-9, 2], [4, -4], [10, -17], [14, -29], [18.5, -35.5], [27, -34.5], [35, -26], [41, -15.5], [46, -3], [52, 9], [62, 14], [73.5, 15.4], [75.5, 10], [80, 6], [92, 6], [98, 5], [102.25, 2.2]];
export const R_VOC: [number, number][] = [[4.9, 52.37], [2.5, 51], [-5, 48.5], [-12, 40], [-19, 26], [-24, 12], [-22, -2], [-10, -22], [6, -33], [18.5, -35.6], [32, -38.5], [60, -38.5], [88, -30], [101, -12], [105.8, -6.2], [113, -5.5], [122, -5.8], [129.9, -4.5]];
