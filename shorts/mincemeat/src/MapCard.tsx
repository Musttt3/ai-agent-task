import React from 'react';
import {Easing, interpolate} from 'remotion';
import mapData from './map.json';
import {C, clamp01, COND, lerp, MONO, ramp, SERIF, useT} from './lib';

type Pt = [number, number];
const M = mapData as unknown as {W: number; H: number; land: string[]; hi: Record<string, string>; pts: Record<string, Pt>};
export const P = M.pts;

export type Cam = {cx: number; cy: number; z: number};
export type Hi = {name: string; at: number; color?: string; opacity?: number; pulse?: boolean};
export type Arrow = {from: Pt; to: Pt; at: number; dur?: number; color?: string; dashed?: boolean; bend?: number; width?: number};
export type Pin = {pt: Pt; at: number; label: string; sub?: string; color?: string; side?: 'left' | 'right'; ring?: boolean};
export type Lbl = {pt: Pt; text: string; at?: number; size?: number; italic?: boolean};

export type MapProps = {
  // card geometry on the 1080x1920 frame
  box: {x: number; y: number; w: number; h: number};
  dur: number; // seconds this card lives (local)
  camA: Cam;
  camB?: Cam;
  camT?: [number, number];
  title?: string;
  titleAt?: number;
  hi?: Hi[];
  arrows?: Arrow[];
  pins?: Pin[];
  labels?: Lbl[];
};

const quad = (a: Pt, b: Pt, bend: number) => {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const c: Pt = [mx - dy * bend, my + dx * bend];
  const pts: Pt[] = [];
  for (let i = 0; i <= 64; i++) {
    const u = i / 64;
    pts.push([
      (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0],
      (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1],
    ]);
  }
  return pts;
};

const ArrowPath: React.FC<{a: Arrow; t: number; z: number}> = ({a, t, z}) => {
  const p = ramp(t, a.at, a.at + (a.dur ?? 0.9), Easing.inOut(Easing.cubic));
  if (p <= 0) return null;
  const pts = quad(a.from, a.to, a.bend ?? 0.18);
  const k = p * 64;
  const n = Math.floor(k);
  const vis = pts.slice(0, n + 1);
  if (n < 64) {
    const fr = k - n;
    vis.push([lerp(pts[n][0], pts[n + 1][0], fr), lerp(pts[n][1], pts[n + 1][1], fr)]);
  }
  const d = 'M' + vis.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' L');
  const end = vis[vis.length - 1];
  const prev = vis[Math.max(0, vis.length - 3)];
  const ang = (Math.atan2(end[1] - prev[1], end[0] - prev[0]) * 180) / Math.PI;
  const col = a.color ?? C.redBright;
  const sw = (a.width ?? 6) / z;
  const head = 22 / z;
  return (
    <g>
      <path d={d} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={sw * 2.2} strokeLinecap="round" strokeDasharray={a.dashed ? `${14 / z} ${12 / z}` : undefined} />
      <path d={d} fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeDasharray={a.dashed ? `${14 / z} ${12 / z}` : undefined} />
      <g transform={`translate(${end[0]} ${end[1]}) rotate(${ang})`}>
        <path d={`M${head * 0.4},0 L${-head},${-head * 0.62} L${-head * 0.6},0 L${-head},${head * 0.62} Z`} fill={col} />
      </g>
    </g>
  );
};

export const MapCard: React.FC<MapProps> = (props) => {
  const t = useT();
  const {box, dur} = props;
  const enter = ramp(t, 0, 0.55, Easing.out(Easing.cubic));
  const exit = ramp(t, dur - 0.4, dur, Easing.in(Easing.cubic));
  const camP = props.camB && props.camT ? ramp(t, props.camT[0], props.camT[1], Easing.inOut(Easing.cubic)) : 0;
  const camB = props.camB ?? props.camA;
  const cam: Cam = {
    cx: lerp(props.camA.cx, camB.cx, camP),
    cy: lerp(props.camA.cy, camB.cy, camP),
    z: lerp(props.camA.z, camB.z, camP) * lerp(1.12, 1, enter),
  };
  const z = cam.z;
  const reveal = interpolate(enter, [0, 1], [100, 0]);
  const opacity = 1 - exit;
  const y = box.y + (1 - enter) * 60 + exit * 40;

  return (
    <div
      style={{
        position: 'absolute',
        left: box.x,
        top: y,
        width: box.w,
        height: box.h,
        opacity,
        clipPath: `inset(0 0 ${reveal}% 0)`,
        boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
        border: '2px solid rgba(230,194,122,0.55)',
        background: '#0d1013',
      }}
    >
      <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="sea" cx="50%" cy="45%" r="75%">
            <stop offset="0%" stopColor="#1d2a31" />
            <stop offset="100%" stopColor="#090c0e" />
          </radialGradient>
          <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a463d" />
            <stop offset="100%" stopColor="#2e2b25" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width={box.w} height={box.h} fill="url(#sea)" />
        <g transform={`translate(${box.w / 2} ${box.h / 2}) scale(${z}) translate(${-cam.cx} ${-cam.cy})`}>
          {/* graticule */}
          {new Array(21).fill(0).map((_, i) => (
            <line key={'v' + i} x1={i * 50} y1={-200} x2={i * 50} y2={1200} stroke="rgba(150,170,180,0.09)" strokeWidth={1 / z} />
          ))}
          {new Array(25).fill(0).map((_, i) => (
            <line key={'h' + i} x1={-200} y1={i * 50 - 100} x2={1200} y2={i * 50 - 100} stroke="rgba(150,170,180,0.09)" strokeWidth={1 / z} />
          ))}
          {/* land with fake extrusion */}
          <g transform={`translate(${3 / z} ${5 / z})`}>
            {M.land.map((d, i) => (
              <path key={'s' + i} d={d} fill="#050505" opacity={0.8} />
            ))}
          </g>
          {M.land.map((d, i) => (
            <path key={i} d={d} fill="url(#land)" stroke="#8d8573" strokeWidth={0.9 / z} />
          ))}
          {(props.hi ?? []).map((h, i) => {
            const p = ramp(t, h.at, h.at + 0.5);
            const pulse = h.pulse ? 0.75 + 0.25 * Math.sin((t - h.at) * 6) : 1;
            return (
              <path
                key={'hi' + i}
                d={M.hi[h.name]}
                fill={h.color ?? C.red}
                opacity={p * (h.opacity ?? 0.85) * pulse}
                stroke={h.color ?? C.redBright}
                strokeWidth={2 / z}
                filter="url(#glow)"
              />
            );
          })}
          {(props.labels ?? []).map((l, i) => {
            const o = l.at === undefined ? 1 : ramp(t, l.at, l.at + 0.5);
            return (
              <text
                key={'l' + i}
                x={l.pt[0]}
                y={l.pt[1]}
                textAnchor="middle"
                fontFamily={SERIF}
                fontStyle={l.italic === false ? 'normal' : 'italic'}
                fontSize={(l.size ?? 26) / z}
                letterSpacing={(l.size ?? 26) * 0.25 / z}
                fill="rgba(234,223,198,0.62)"
                opacity={o}
              >
                {l.text}
              </text>
            );
          })}
          {(props.arrows ?? []).map((a, i) => (
            <ArrowPath key={'a' + i} a={a} t={t} z={z} />
          ))}
          {(props.pins ?? []).map((p, i) => {
            const o = ramp(t, p.at, p.at + 0.35);
            if (o <= 0) return null;
            const col = p.color ?? C.redBright;
            const ringU = ((t - p.at) % 1.2) / 1.2;
            const side = p.side === 'left' ? -1 : 1;
            return (
              <g key={'p' + i} transform={`translate(${p.pt[0]} ${p.pt[1]}) scale(${1 / z})`} opacity={o}>
                {p.ring !== false ? <circle r={10 + ringU * 46} fill="none" stroke={col} strokeWidth={3} opacity={1 - ringU} /> : null}
                <circle r={lerp(22, 9, o)} fill={col} stroke="#fff" strokeWidth={2.5} />
                <line x1={0} y1={0} x2={side * 46} y2={-46} stroke={C.bone} strokeWidth={2} />
                <text
                  x={side * 54}
                  y={-50}
                  textAnchor={side > 0 ? 'start' : 'end'}
                  fontFamily={COND}
                  fontWeight={700}
                  fontSize={34}
                  letterSpacing={3}
                  fill={C.bone}
                  stroke="#000"
                  strokeWidth={5}
                  paintOrder="stroke"
                >
                  {p.label}
                </text>
                {p.sub ? (
                  <text
                    x={side * 54}
                    y={-18}
                    textAnchor={side > 0 ? 'start' : 'end'}
                    fontFamily={MONO}
                    fontSize={21}
                    fill={C.gold}
                    stroke="#000"
                    strokeWidth={4}
                    paintOrder="stroke"
                  >
                    {p.sub}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>
        {/* card chrome */}
        <rect x={14} y={14} width={box.w - 28} height={box.h - 28} fill="none" stroke="rgba(230,194,122,0.25)" strokeWidth={1} />
        {[0, 1, 2, 3].map((i) => {
          const cx = i % 2 ? box.w - 14 : 14;
          const cy = i > 1 ? box.h - 14 : 14;
          const sx = i % 2 ? -1 : 1;
          const sy = i > 1 ? -1 : 1;
          return <path key={i} d={`M${cx},${cy + sy * 40} L${cx},${cy} L${cx + sx * 40},${cy}`} stroke={C.gold} strokeWidth={4} fill="none" />;
        })}
      </svg>
      {props.title ? (
        <div
          style={{
            position: 'absolute',
            left: 34,
            top: 30,
            fontFamily: MONO,
            fontWeight: 600,
            fontSize: 24,
            letterSpacing: 4,
            color: C.gold,
            opacity: ramp(t, props.titleAt ?? 0.3, (props.titleAt ?? 0.3) + 0.3),
            textShadow: '0 2px 6px #000',
          }}
        >
          {props.title}
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          right: 34,
          bottom: 26,
          fontFamily: MONO,
          fontSize: 18,
          letterSpacing: 3,
          color: 'rgba(234,223,198,0.5)',
        }}
      >
        TEATER MEDITERANIA · 1943
      </div>
    </div>
  );
};

export const mid = (a: Pt, b: Pt, k = 0.5): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
export const off = (a: Pt, dx: number, dy: number): Pt => [a[0] + dx, a[1] + dy];
export {clamp01};
