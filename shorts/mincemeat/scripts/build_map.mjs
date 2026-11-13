// Precompute the Mediterranean theatre map as SVG path strings (Natural Earth 1:50m via world-atlas).
import fs from 'node:fs';
import {feature} from 'topojson-client';
import {geoMercator, geoPath, geoContains, geoArea} from 'd3-geo';
const topo = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json', 'utf8'));
const countries = feature(topo, topo.objects.countries).features;
const W = 1000, H = 1000;
const bbox = {type: 'Feature', geometry: {type: 'MultiPoint', coordinates: [[-11, 34], [27, 34], [-11, 56.5], [27, 56.5]]}};
const proj = geoMercator().fitExtent([[0, 0], [W, H]], bbox);
proj.clipExtent([[-40, -40], [W + 40, H + 40]]);
const path = geoPath(proj).digits(1);
const byName = (n) => countries.find((c) => c.properties.name === n);
const out = {W, H, land: [], hi: {}, pts: {}};
for (const c of countries) {
  const d = path(c);
  if (d) out.land.push(d);
}
for (const n of ['Italy', 'Greece', 'Spain', 'United Kingdom', 'Germany']) out.hi[n] = path(byName(n));
// Sicily = the Italy polygon that contains a point in central Sicily
const it = byName('Italy');
const sic = it.geometry.coordinates.find((poly) => geoContains({type: 'Polygon', coordinates: poly}, [14.1, 37.5]));
out.hi.Sicily = path({type: 'Polygon', coordinates: sic});
const sar = it.geometry.coordinates.find((poly) => geoContains({type: 'Polygon', coordinates: poly}, [9.0, 40.0]));
out.hi.Sardinia = path({type: 'Polygon', coordinates: sar});
const P = {London: [-0.13, 51.5], Huelva: [-6.95, 37.26], Madrid: [-3.7, 40.42], Berlin: [13.4, 52.52], Sicily: [14.1, 37.55],
  Greece: [22.0, 38.6], Athens: [23.7, 38.0],
  L_Spain: [-4.0, 39.6], L_France: [2.4, 46.6], L_Italy: [12.6, 42.6], L_Germany: [10.4, 50.6], L_Greece: [22.4, 39.9],
  L_UK: [-1.8, 53.4], L_Africa: [3.0, 34.6], L_Sea: [18.0, 35.4], L_Atlantic: [-9.4, 44.6], Sardinia: [9.0, 40.1], Malta: [14.4, 35.9], Gibraltar: [-5.35, 36.14], NorthAfrica: [10.2, 36.6]};
for (const [k, v] of Object.entries(P)) out.pts[k] = proj(v).map((x) => Math.round(x * 10) / 10);
fs.writeFileSync('src/map.json', JSON.stringify(out));
console.log('land paths', out.land.length, 'bytes', fs.statSync('src/map.json').size, out.pts);
