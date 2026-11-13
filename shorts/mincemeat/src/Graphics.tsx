import React from 'react';
import {Easing, Img, interpolate, Sequence, staticFile} from 'remotion';
import {f} from './timeline';
import {Abs, C, COND, HAND, inOut, lerp, MONO, ramp, rnd, SERIF, shake, slam, TYPE, useT} from './lib';
import {MapCard, P} from './MapCard';

// Place a graphic on the absolute timeline: children see local time 0 at `at`.
const At: React.FC<React.PropsWithChildren<{at: number; until: number; name: string}>> = ({at, until, name, children}) => (
  <Sequence from={f(at)} durationInFrames={f(until) - f(at)} name={name} layout="none">
    {children}
  </Sequence>
);

// ------------------------------------------------------------------ primitives

/** Typewriter reveal. `t0` local seconds, `cps` characters per second. */
export const Typed: React.FC<{text: string; t0: number; cps?: number; style?: React.CSSProperties; cursor?: boolean}> = ({
  text,
  t0,
  cps = 22,
  style,
  cursor = true,
}) => {
  const t = useT();
  const n = Math.max(0, Math.min(text.length, Math.floor((t - t0) * cps)));
  const typing = t >= t0 && n < text.length;
  const blink = Math.floor(t * 2.4) % 2 === 0;
  return (
    <span style={style}>
      {text.slice(0, n)}
      <span style={{opacity: 0}}>{text.slice(n)}</span>
      {cursor && t >= t0 && (typing || blink) && n >= 0 ? (
        <span style={{position: 'relative'}}>
          <span style={{position: 'absolute', left: n < text.length ? `${-(text.length - n)}ch` : 0, opacity: 0.9}}>▌</span>
        </span>
      ) : null}
    </span>
  );
};

/** Rubber stamp that slams down. */
export const Stamp: React.FC<{
  text: string;
  t0: number;
  x: number;
  y: number;
  size?: number;
  rot?: number;
  color?: string;
  sub?: string;
  out?: number;
}> = ({text, t0, x, y, size = 120, rot = -8, color = C.red, sub, out}) => {
  const t = useT();
  if (t < t0) return null;
  const s = slam(t, t0, 2.6);
  const o = Math.min(ramp(t, t0, t0 + 0.08), out === undefined ? 1 : 1 - ramp(t, out - 0.3, out));
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`,
        opacity: o,
        WebkitMaskImage: `url(${staticFile('fx/ink.png')})`,
        WebkitMaskSize: '100% 100%',
        maskImage: `url(${staticFile('fx/ink.png')})`,
        maskSize: '100% 100%',
      }}
    >
      <div
        style={{
          border: `${size * 0.07}px solid ${color}`,
          padding: `${size * 0.06}px ${size * 0.22}px ${size * 0.02}px`,
          color,
          fontFamily: COND,
          fontWeight: 700,
          fontSize: size,
          letterSpacing: size * 0.08,
          lineHeight: 1.05,
          whiteSpace: 'nowrap',
          textAlign: 'center',
          boxShadow: `inset 0 0 0 ${size * 0.03}px rgba(0,0,0,0)`,
          mixBlendMode: 'normal',
        }}
      >
        {text}
        {sub ? <div style={{fontFamily: MONO, fontWeight: 600, fontSize: size * 0.22, letterSpacing: size * 0.04, marginTop: size * 0.02, marginBottom: size * 0.06}}>{sub}</div> : null}
      </div>
    </div>
  );
};

/** Leader-line callout pointing at something in the picture. */
const Callout: React.FC<{t0: number; out: number; px: number; py: number; lx: number; ly: number; text: string; sub?: string}> = ({
  t0,
  out,
  px,
  py,
  lx,
  ly,
  text,
  sub,
}) => {
  const t = useT();
  const line = ramp(t, t0 + 0.15, t0 + 0.5);
  const o = 1 - ramp(t, out - 0.3, out);
  const ring = ramp(t, t0, t0 + 0.35, Easing.out(Easing.back(2)));
  const ex = lerp(px, lx, line);
  const ey = lerp(py, ly, line);
  const right = lx >= px;
  return (
    <Abs style={{opacity: o}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <circle cx={px} cy={py} r={34 * ring} fill="none" stroke={C.bone} strokeWidth={3} />
        <circle cx={px} cy={py} r={7 * ring} fill={C.redBright} />
        <line x1={px} y1={py} x2={ex} y2={ey} stroke={C.bone} strokeWidth={2.5} />
        {line >= 1 ? <line x1={lx} y1={ly} x2={lx + (right ? 1 : -1) * 260 * ramp(t, t0 + 0.5, t0 + 0.8)} y2={ly} stroke={C.bone} strokeWidth={2.5} /> : null}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: right ? lx + 6 : undefined,
          right: right ? undefined : 1080 - lx + 6,
          top: ly - 58,
          textAlign: right ? 'left' : 'right',
          fontFamily: COND,
          fontWeight: 700,
          fontSize: 44,
          letterSpacing: 4,
          color: C.bone,
          textShadow: '0 2px 10px #000',
          opacity: ramp(t, t0 + 0.5, t0 + 0.8),
        }}
      >
        {text}
      </div>
      {sub ? (
        <div
          style={{
            position: 'absolute',
            left: right ? lx + 6 : undefined,
            right: right ? undefined : 1080 - lx + 6,
            top: ly + 12,
            fontFamily: MONO,
            fontSize: 24,
            letterSpacing: 2,
            color: C.gold,
            textShadow: '0 2px 8px #000',
          }}
        >
          <Typed text={sub} t0={t0 + 0.7} cps={30} cursor={false} />
        </div>
      ) : null}
    </Abs>
  );
};

/** A paper dossier card. */
const Paper: React.FC<React.PropsWithChildren<{x: number; y: number; w: number; h: number; rot?: number; style?: React.CSSProperties}>> = ({
  x,
  y,
  w,
  h,
  rot = 0,
  style,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      transform: `rotate(${rot}deg)`,
      boxShadow: '0 24px 60px rgba(0,0,0,0.75), 0 2px 0 rgba(255,255,255,0.15) inset',
      backgroundImage: `url(${staticFile('fx/paper.png')})`,
      backgroundSize: '100% 100%',
      color: '#231c14',
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </div>
);

const Rule: React.FC<{p: number; color?: string; w?: number; style?: React.CSSProperties}> = ({p, color = C.red, w = 300, style}) => (
  <div style={{height: 5, width: w * p, background: color, ...style}} />
);

// ------------------------------------------------------------------ shot graphics

/** 0.0–5.1  "1943 · INGGRIS vs NAZI" */
const Opening: React.FC = () => {
  const t = useT(); // local == absolute (starts at 0)
  const o = 1 - ramp(t, 4.7, 5.1);
  const big = ramp(t, 0.5, 1.1, Easing.out(Easing.cubic));
  const digits = '1943'.split('');
  return (
    <Abs style={{opacity: o}}>
      <div style={{position: 'absolute', top: 210, width: '100%', textAlign: 'center'}}>
        <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 28, letterSpacing: 9, color: C.gold, textShadow: '0 2px 8px #000'}}>
          <Typed text="ARSIP PERANG DUNIA II" t0={0.25} cps={34} cursor={false} />
        </div>
        <div style={{display: 'flex', justifyContent: 'center', marginTop: 6}}>
          {digits.map((d, i) => {
            const ti = 0.54 + i * 0.32;
            const p = ramp(t, ti, ti + 0.18);
            return (
              <span
                key={i}
                style={{
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: 270,
                  lineHeight: 1,
                  color: C.bone,
                  opacity: p,
                  transform: `translateY(${(1 - p) * -40}px) scale(${lerp(1.5, 1, p)})`,
                  filter: `blur(${(1 - p) * 8}px)`,
                  textShadow: '0 8px 30px rgba(0,0,0,0.8)',
                  display: 'inline-block',
                }}
              >
                {d}
              </span>
            );
          })}
        </div>
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <Rule p={ramp(t, 1.9, 2.5) * big} w={520} />
        </div>
        <div
          style={{
            marginTop: 30,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'baseline',
            gap: 34,
            fontFamily: COND,
            fontWeight: 700,
            fontSize: 72,
            letterSpacing: 8,
            textShadow: '0 4px 16px #000',
          }}
        >
          <span style={{color: C.bone, opacity: ramp(t, 2.9, 3.2), transform: `translateX(${(1 - ramp(t, 2.9, 3.3)) * -50}px)`}}>INGGRIS</span>
          <span style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 52, color: C.gold, opacity: ramp(t, 3.8, 4.1)}}>vs</span>
          <span style={{color: C.redBright, opacity: ramp(t, 4.34, 4.5), transform: `scale(${slam(t, 4.34, 1.8)})`, display: 'inline-block'}}>NAZI</span>
        </div>
      </div>
    </Abs>
  );
};

/** 7.6–9.3  SESOSOK MAYAT. */
const MayatTitle: React.FC = () => {
  const t = useT() + 7.6;
  const sh = shake(t, 8.28, 18, 0.5);
  const a = ramp(t, 7.72, 8.0);
  const o = 1 - ramp(t, 9.15, 9.35);
  return (
    <Abs style={{opacity: o, transform: `translate(${sh.x}px, ${sh.y}px)`}}>
      <div style={{position: 'absolute', top: 330, width: '100%', textAlign: 'center'}}>
        <div
          style={{
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 96,
            letterSpacing: 18,
            color: C.bone,
            opacity: a,
            filter: `blur(${(1 - a) * 10}px)`,
            textShadow: '0 4px 20px #000',
          }}
        >
          sesosok
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 250,
            lineHeight: 0.95,
            color: C.redBright,
            transform: `scale(${slam(t, 8.28, 2.2)})`,
            opacity: t >= 8.28 ? 1 : 0,
            textShadow: '0 10px 40px rgba(0,0,0,0.9)',
          }}
        >
          MAYAT.
        </div>
      </div>
    </Abs>
  );
};

/** 10.3–12.0  "PASUKAN SEKUTU" HUD tag */
const SekutuTag: React.FC = () => {
  const t = useT();
  const o = inOut(t, 0, 0.3, 1.7, 0.3);
  return (
    <Abs style={{opacity: o}}>
      <div style={{position: 'absolute', left: 70, top: 230, borderLeft: `6px solid ${C.gold}`, paddingLeft: 22}}>
        <div style={{fontFamily: MONO, fontSize: 24, letterSpacing: 5, color: C.gold}}>
          <Typed text="RENCANA SEKUTU · 1943" t0={0.05} cps={40} cursor={false} />
        </div>
        <div style={{fontFamily: COND, fontWeight: 700, fontSize: 70, letterSpacing: 4, color: C.bone, textShadow: '0 4px 14px #000'}}>
          <Typed text="SERBU PULAU SICILIA" t0={1.35} cps={30} />
        </div>
      </div>
    </Abs>
  );
};

const MAP_BOX = {x: 70, y: 330, w: 940, h: 940};

/** 11.9–18.6  target map: Sicily, then "somewhere else?" */
const MapSicily: React.FC = () => (
  <MapCard
    box={MAP_BOX}
    dur={6.7}
    camA={{cx: 520, cy: 600, z: 1.05}}
    camB={{cx: 690, cy: 780, z: 1.75}}
    camT={[0.25, 1.3]}
    title="TARGET INVASI SEKUTU"
    titleAt={0.3}
    labels={[
      {pt: P.L_Italy, text: 'ITALIA', size: 24},
      {pt: P.L_Greece, text: 'YUNANI', size: 22},
      {pt: P.L_Africa, text: 'AFRIKA UTARA', size: 22},
      {pt: P.L_Sea, text: 'LAUT TENGAH', size: 18},
      {pt: P.L_Spain, text: 'SPANYOL', size: 24},
      {pt: P.L_France, text: 'PRANCIS', size: 24},
      {pt: P.L_Germany, text: 'JERMAN', size: 24},
    ]}
    hi={[{name: 'Sicily', at: 0.6, pulse: true}]}
    arrows={[
      {from: P.NorthAfrica, to: [P.Sicily[0] - 8, P.Sicily[1] + 16], at: 0.85, dur: 0.6, bend: -0.3},
      {from: P.NorthAfrica, to: [P.Greece[0] - 20, P.Greece[1] + 10], at: 4.55, dur: 0.8, dashed: true, color: C.gold, bend: 0.22, width: 5},
      {from: P.NorthAfrica, to: [P.Sardinia[0] + 2, P.Sardinia[1] + 24], at: 4.75, dur: 0.7, dashed: true, color: C.gold, bend: -0.25, width: 5},
    ]}
    pins={[
      {pt: P.Sicily, at: 0.65, label: 'SICILIA', sub: 'TARGET ASLI', side: 'right'},
      {pt: P.Greece, at: 6.0, label: 'YUNANI?', color: C.gold, side: 'left', ring: false},
      {pt: P.Sardinia, at: 6.1, label: 'SARDINIA?', color: C.gold, side: 'right', ring: false},
    ]}
  />
);

/** Dossier card A: the real man (21.7–24.25) */
const DossierReal: React.FC = () => {
  const t = useT();
  const enter = ramp(t, 0, 0.45, Easing.out(Easing.back(1.2)));
  const exit = ramp(t, 2.25, 2.55, Easing.in(Easing.cubic));
  return (
    <Abs style={{opacity: 1 - exit}}>
      <Paper x={110} y={lerp(-480, 220, enter) - exit * 80} w={860} h={390} rot={lerp(-6, -1.5, enter)}>
        <div style={{position: 'absolute', left: 40, top: 32, right: 40, fontFamily: MONO, fontWeight: 600, fontSize: 21, letterSpacing: 4, display: 'flex', justifyContent: 'space-between'}}>
          <span>BERKAS · INTELIJEN INGGRIS</span>
          <span style={{color: C.red}}>NO. 1943/MM</span>
        </div>
        <div style={{position: 'absolute', left: 40, right: 40, top: 70, height: 2, background: '#3b2f22'}} />
        <div style={{position: 'absolute', left: 40, top: 100, fontFamily: TYPE, fontSize: 30, color: '#5a4630'}}>NAMA ASLI:</div>
        <div style={{position: 'absolute', left: 40, top: 140, fontFamily: TYPE, fontSize: 78, color: '#16100a', whiteSpace: 'nowrap'}}>
          <Typed text="GLYNDWR MICHAEL" t0={0.8} cps={22} />
        </div>
        <div style={{position: 'absolute', left: 40, top: 262, fontFamily: TYPE, fontSize: 32, color: '#3a2c1d'}}>
          <Typed text="1909 – 1943  ·  WALES" t0={1.5} cps={30} cursor={false} />
        </div>
        <div style={{position: 'absolute', left: 40, top: 312, fontFamily: TYPE, fontSize: 28, color: '#6d5841'}}>
          <Typed text="STATUS: JENAZAH TAK DIKLAIM" t0={1.8} cps={40} cursor={false} />
        </div>
      </Paper>
    </Abs>
  );
};

/** Dossier card B: the fake identity (26.6–29.15) */
const DossierFake: React.FC = () => {
  const t = useT(); // 0 at 26.6
  const enter = ramp(t, 0, 0.4, Easing.out(Easing.cubic));
  const exit = ramp(t, 2.3, 2.55, Easing.in(Easing.cubic));
  const flip = lerp(90, 0, enter);
  return (
    <Abs style={{opacity: 1 - exit, perspective: 1600}}>
      <Paper x={110} y={220} w={860} h={390} rot={1.2} style={{transform: `rotate(1.2deg) rotateY(${flip}deg)`}}>
        <div style={{position: 'absolute', left: 40, top: 32, right: 40, fontFamily: MONO, fontWeight: 600, fontSize: 21, letterSpacing: 4, display: 'flex', justifyContent: 'space-between'}}>
          <span>KARTU IDENTITAS · ROYAL MARINES</span>
          <span style={{color: C.red}}>148228</span>
        </div>
        <div style={{position: 'absolute', left: 40, right: 40, top: 70, height: 2, background: '#3b2f22'}} />
        <div style={{position: 'absolute', left: 40, top: 100, fontFamily: TYPE, fontSize: 30, color: '#5a4630'}}>NAMA:</div>
        <div style={{position: 'absolute', left: 40, top: 140, fontFamily: TYPE, fontSize: 78, color: '#16100a', whiteSpace: 'nowrap'}}>
          <Typed text="WILLIAM MARTIN" t0={1.6} cps={20} />
        </div>
        <div style={{position: 'absolute', left: 40, top: 262, fontFamily: TYPE, fontSize: 32, color: '#3a2c1d'}}>
          <Typed text="PANGKAT: MAYOR (A/MAJ.)" t0={2.0} cps={34} cursor={false} />
        </div>
      </Paper>
      <Stamp text="PALSU" t0={0.76} x={790} y={300} size={110} rot={-12} />
    </Abs>
  );
};

/** 30.3–33.6  love letter: hand-written "surat cinta" + heart */
const LoveLetter: React.FC = () => {
  const t = useT(); // 0 at 30.3
  const o = 1 - ramp(t, 3.0, 3.3);
  const write = ramp(t, 0.05, 1.0, Easing.inOut(Easing.quad));
  const heart = ramp(t, 0.9, 1.6, Easing.inOut(Easing.quad));
  const heartPath = 'M60,105 C10,70 0,30 30,15 C50,5 60,25 60,35 C60,25 72,3 92,12 C122,28 110,72 60,105 Z';
  return (
    <Abs style={{opacity: o}}>
      <div style={{position: 'absolute', left: 80, top: 210, width: 920}}>
        <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 24, letterSpacing: 5, color: C.gold, textShadow: '0 2px 8px #000'}}>
          <Typed text="BAGIAN DARI PENYAMARAN" t0={0} cps={40} cursor={false} />
        </div>
        <div style={{position: 'relative', height: 190, marginTop: 4}}>
          <div
            style={{
              position: 'absolute',
              fontFamily: HAND,
              fontWeight: 700,
              fontSize: 168,
              color: '#f0d9b8',
              textShadow: '0 4px 18px #000',
              clipPath: `inset(-20% ${100 - write * 100}% -20% -5%)`,
              transform: 'rotate(-4deg)',
              whiteSpace: 'nowrap',
            }}
          >
            Surat cinta
          </div>
          <svg width={130} height={120} viewBox="0 0 130 120" style={{position: 'absolute', left: 730, top: 30, overflow: 'visible'}}>
            <path d={heartPath} fill="none" stroke={C.redBright} strokeWidth={7} strokeLinecap="round" strokeDasharray={330} strokeDashoffset={330 * (1 - heart)} />
          </svg>
        </div>
      </div>
    </Abs>
  );
};

/** 35.32–37.3  TOP SECRET */
const TopSecret: React.FC = () => {
  const t = useT(); // 0 at 35.32
  const sh = shake(t, 0, 16, 0.4);
  return (
    <Abs style={{transform: `translate(${sh.x}px, ${sh.y}px)`}}>
      <Stamp text="TOP SECRET" t0={0} x={540} y={470} size={150} rot={-9} out={1.95} />
      <div
        style={{
          position: 'absolute',
          top: 610,
          width: '100%',
          textAlign: 'center',
          fontFamily: MONO,
          fontWeight: 600,
          fontSize: 36,
          letterSpacing: 8,
          color: C.bone,
          textShadow: '0 2px 10px #000',
          opacity: 1 - ramp(t, 1.65, 1.95),
        }}
      >
        <Typed text="DOKUMEN MILITER PALSU" t0={0.42} cps={36} />
      </div>
    </Abs>
  );
};

/** 37.2–39.65  the fake target: Greece */
const MapGreece: React.FC = () => (
  <MapCard
    box={{x: 70, y: 300, w: 940, h: 820}}
    dur={2.45}
    camA={{cx: 700, cy: 790, z: 1.7}}
    title="ISI DOKUMEN"
    labels={[
      {pt: P.L_Italy, text: 'ITALIA', size: 24},
      {pt: P.L_Africa, text: 'AFRIKA UTARA', size: 22},
    ]}
    hi={[{name: 'Greece', at: 1.3, pulse: true}]}
    arrows={[{from: P.NorthAfrica, to: [P.Greece[0] - 16, P.Greece[1] + 14], at: 0.3, dur: 1.0, bend: 0.2}]}
    pins={[
      {pt: P.Sicily, at: 0.2, label: 'SICILIA', color: '#777', ring: false, side: 'left'},
      {pt: P.Greece, at: 1.35, label: 'YUNANI', sub: 'TARGET PALSU', side: 'left'},
    ]}
  />
);

/** 39.9–43.5  submarine HUD + reticle on the body */
const SubHud: React.FC = () => {
  const t = useT(); // 0 at 39.9
  const o = 1 - ramp(t, 3.5, 3.75);
  const lockT = 2.15; // 42.05
  const lock = ramp(t, lockT, lockT + 0.45, Easing.out(Easing.cubic));
  const bx = 605;
  const by = 1195;
  const r = lerp(260, 120, lock);
  return (
    <Abs style={{opacity: o}}>
      <div style={{position: 'absolute', left: 70, top: 220, fontFamily: MONO, color: C.bone, textShadow: '0 2px 8px #000'}}>
        <div style={{fontSize: 24, letterSpacing: 5, color: C.gold}}>
          <Typed text="● KAPAL SELAM ROYAL NAVY" t0={0} cps={40} cursor={false} />
        </div>
        <div style={{fontFamily: COND, fontWeight: 700, fontSize: 84, letterSpacing: 4, lineHeight: 1.1}}>
          <Typed text="HMS SERAPH" t0={0.35} cps={20} />
        </div>
        <div style={{fontSize: 30, letterSpacing: 4}}>
          <Typed text="30 APRIL 1943 · 04.30" t0={1.0} cps={30} cursor={false} />
        </div>
      </div>
      {t >= lockT ? (
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <g transform={`translate(${bx} ${by}) rotate(${(1 - lock) * 45})`} opacity={lock}>
            <circle r={r} fill="none" stroke={C.bone} strokeWidth={2.5} strokeDasharray="18 12" />
            {[0, 90, 180, 270].map((a) => (
              <line key={a} x1={r + 10} y1={0} x2={r + 50} y2={0} stroke={C.redBright} strokeWidth={5} transform={`rotate(${a})`} />
            ))}
            <circle r={6} fill={C.redBright} />
          </g>
        </svg>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: bx + 150,
          top: by - 170,
          fontFamily: MONO,
          fontSize: 26,
          letterSpacing: 3,
          color: C.bone,
          textShadow: '0 2px 8px #000',
          textAlign: 'left',
          opacity: lock,
          width: 330,
        }}
      >
        <div style={{color: C.gold}}>
          <Typed text="37°15'N 6°57'W" t0={lockT + 0.15} cps={45} cursor={false} />
        </div>
        <div style={{fontFamily: COND, fontWeight: 700, fontSize: 44, letterSpacing: 3}}>
          <Typed text="HUELVA, SPANYOL" t0={lockT + 0.35} cps={40} cursor={false} />
        </div>
      </div>
    </Abs>
  );
};

/** 44.55–47.95  the papers travel Huelva → Madrid → Berlin */
const MapRoute: React.FC = () => (
  <MapCard
    box={MAP_BOX}
    dur={3.4}
    camA={{cx: 400, cy: 560, z: 1.05}}
    camB={{cx: 430, cy: 520, z: 1.25}}
    camT={[0.2, 3.2]}
    title="JALUR DOKUMEN"
    labels={[
      {pt: P.L_France, text: 'PRANCIS', size: 24},
      {pt: P.L_Germany, text: 'JERMAN', size: 24},
      {pt: P.L_UK, text: 'INGGRIS', size: 22},
      {pt: P.L_Italy, text: 'ITALIA', size: 22},
      {pt: P.L_Atlantic, text: 'ATLANTIK', size: 18},
    ]}
    hi={[{name: 'Germany', at: 2.2, color: '#7a1712', opacity: 0.55}]}
    arrows={[
      {from: P.Huelva, to: P.Madrid, at: 0.55, dur: 0.6, dashed: true, color: C.gold, bend: -0.2, width: 5},
      {from: P.Madrid, to: P.Berlin, at: 1.25, dur: 1.0, bend: -0.12},
    ]}
    pins={[
      {pt: P.Huelva, at: 0.25, label: 'HUELVA', side: 'right', ring: false},
      {pt: P.Madrid, at: 1.05, label: 'MADRID', sub: 'AGEN ABWEHR', side: 'right', ring: false},
      {pt: P.Berlin, at: 2.25, label: 'BERLIN', sub: 'INTELIJEN NAZI', side: 'left'},
    ]}
  />
);

/** 48.44–50.0  TERTIPU */
const Tertipu: React.FC = () => {
  const t = useT();
  const sh = shake(t, 0, 20, 0.45);
  return (
    <Abs style={{transform: `translate(${sh.x}px, ${sh.y}px)`}}>
      <Stamp text="TERTIPU" t0={0} x={540} y={1130} size={170} rot={-10} out={1.5} />
    </Abs>
  );
};

/** 49.9–52.95  German forces sent to the wrong places */
const MapWrong: React.FC = () => {
  const t = useT(); // 0 at 49.9
  const xo = ramp(t, 2.15, 2.4);
  return (
    <>
      <MapCard
        box={{x: 70, y: 330, w: 940, h: 940}}
        dur={3.05}
        camA={{cx: 640, cy: 560, z: 1.1}}
        camB={{cx: 680, cy: 650, z: 1.3}}
        camT={[0.2, 2.8]}
        title="PASUKAN JERMAN DIALIHKAN"
        labels={[
          {pt: P.L_Italy, text: 'ITALIA', size: 24},
          {pt: P.L_Germany, text: 'JERMAN', size: 24},
        ]}
        hi={[
          {name: 'Greece', at: 0.9, color: '#b8862b', opacity: 0.7},
          {name: 'Sardinia', at: 1.0, color: '#b8862b', opacity: 0.7},
        ]}
        arrows={[
          {from: P.Berlin, to: [P.Greece[0] - 10, P.Greece[1] - 20], at: 0.15, dur: 1.0, color: '#d8d2c4', bend: -0.12, width: 7},
          {from: P.Berlin, to: [P.Sardinia[0] + 4, P.Sardinia[1] - 30], at: 0.35, dur: 0.9, color: '#d8d2c4', bend: 0.1, width: 7},
        ]}
        pins={[
          {pt: P.Berlin, at: 0.05, label: 'BERLIN', ring: false, color: '#d8d2c4', side: 'right'},
          {pt: P.Sicily, at: 1.2, label: 'SICILIA', color: '#777', ring: false, side: 'right'},
        ]}
      />
      <div
        style={{
          position: 'absolute',
          top: 1170,
          width: '100%',
          textAlign: 'center',
          fontFamily: COND,
          fontWeight: 700,
          fontSize: 58,
          letterSpacing: 6,
          color: C.redBright,
          textShadow: '0 3px 12px #000',
          opacity: xo * (1 - ramp(t, 2.75, 3.05)),
          transform: `scale(${slam(t, 2.15, 1.6)})`,
        }}
      >
        WILAYAH YANG SALAH
      </div>
    </>
  );
};

/** 53.55–58.1  10 JULI 1943 / INVASI SICILIA */
const Invasion: React.FC = () => {
  const t = useT(); // 0 at 53.55
  const o = 1 - ramp(t, 4.3, 4.55);
  const sh = shake(t, 0.43, 14, 0.4);
  return (
    <Abs style={{opacity: o, transform: `translate(${sh.x}px, ${sh.y}px)`}}>
      <div style={{position: 'absolute', top: 230, width: '100%', textAlign: 'center'}}>
        <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 26, letterSpacing: 8, color: C.gold, textShadow: '0 2px 8px #000'}}>
          <Typed text="OPERATION HUSKY" t0={0.1} cps={30} cursor={false} />
        </div>
        <div style={{fontFamily: COND, fontWeight: 700, fontSize: 150, letterSpacing: 6, lineHeight: 1.05, color: C.bone, textShadow: '0 6px 24px #000'}}>
          <span style={{display: 'inline-block', opacity: ramp(t, 0.05, 0.12), transform: `scale(${slam(t, 0.05, 1.8)})`}}>10 JULI</span>{' '}
          <span style={{display: 'inline-block', color: C.redBright, opacity: ramp(t, 0.43, 0.5), transform: `scale(${slam(t, 0.43, 2)})`}}>1943</span>
        </div>
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <Rule p={ramp(t, 0.8, 1.3)} w={600} />
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: 76,
            color: C.bone,
            textShadow: '0 4px 18px #000',
            opacity: ramp(t, 2.55, 2.85),
            transform: `translateY(${(1 - ramp(t, 2.55, 2.95)) * 30}px)`,
            letterSpacing: 2,
          }}
        >
          Sekutu menyerbu Sicilia
        </div>
      </div>
    </Abs>
  );
};

/** 59.7–61.6  OPERATION MINCEMEAT title */
const Title: React.FC = () => {
  const t = useT(); // 0 at 59.7
  const o = 1 - ramp(t, 1.6, 1.9);
  const m = ramp(t, 0.78, 1.0);
  return (
    <Abs style={{opacity: o}}>
      <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center'}}>
        <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 44, letterSpacing: 22, color: C.gold, textShadow: '0 2px 12px #000', paddingLeft: 22}}>
          <Typed text="OPERATION" t0={0.08} cps={16} cursor={false} />
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 142,
            lineHeight: 1.0,
            letterSpacing: 0,
            color: C.bone,
            opacity: m,
            transform: `scale(${slam(t, 0.78, 1.7)})`,
            textShadow: '0 10px 40px rgba(0,0,0,0.95)',
          }}
        >
          MINCEMEAT
        </div>
        <div style={{display: 'flex', justifyContent: 'center', marginTop: 14}}>
          <Rule p={ramp(t, 1.0, 1.4)} w={700} />
        </div>
      </div>
    </Abs>
  );
};

/** 66.6–70.5  memorial */
const Memorial: React.FC = () => {
  const t = useT(); // 0 at 66.6
  const a = ramp(t, 0, 0.9, Easing.out(Easing.quad));
  const b = ramp(t, 0.9, 1.6);
  const c = ramp(t, 1.7, 2.5);
  return (
    <Abs>
      <Abs style={{opacity: a, background: 'radial-gradient(ellipse 620px 420px at 50% 470px, rgba(0,0,0,0.7), rgba(0,0,0,0) 100%)'}} />
      <div style={{position: 'absolute', top: 260, width: '100%', textAlign: 'center'}}>
        <div style={{fontFamily: MONO, fontWeight: 600, fontSize: 24, letterSpacing: 8, color: C.gold, opacity: a, textShadow: '0 2px 8px #000'}}>PRIA DI BALIK OPERASI</div>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 108,
            lineHeight: 1.1,
            color: C.bone,
            opacity: a,
            letterSpacing: lerp(30, 4, a),
            filter: `blur(${(1 - a) * 8}px)`,
            textShadow: '0 6px 30px #000',
          }}
        >
          GLYNDWR MICHAEL
        </div>
        <div style={{display: 'flex', justifyContent: 'center', margin: '10px 0 16px'}}>
          <Rule p={b} w={420} color={C.gold} />
        </div>
        <div style={{fontFamily: SERIF, fontSize: 56, color: C.bone, opacity: b, letterSpacing: 10, textShadow: '0 4px 16px #000'}}>1909 — 1943</div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: 40, color: C.gold, opacity: c, marginTop: 22, textShadow: '0 3px 12px #000', lineHeight: 1.35}}>
          dimakamkan di Huelva
          <br />
          sebagai Mayor William Martin
        </div>
      </div>
    </Abs>
  );
};

export const Graphics: React.FC = () => (
  <>
    <At at={0} until={5.1} name="g opening 1943">
      <Opening />
    </At>
    <At at={7.6} until={9.35} name="g SESOSOK MAYAT">
      <MayatTitle />
    </At>
    <At at={10.3} until={12.3} name="g sekutu tag">
      <SekutuTag />
    </At>
    <At at={11.9} until={18.6} name="g map sicily">
      <MapSicily />
    </At>
    <At at={21.7} until={24.25} name="g dossier real">
      <DossierReal />
    </At>
    <At at={24.95} until={26.7} name="g callout uniform">
      <Callout t0={0} out={1.75} px={734} py={1091} lx={520} ly={1300} text="SERAGAM MILITER" sub="ROYAL MARINES" />
    </At>
    <At at={26.6} until={29.15} name="g dossier fake">
      <DossierFake />
    </At>
    <At at={30.3} until={33.6} name="g love letter">
      <LoveLetter />
    </At>
    <At at={31.4} until={33.6} name="g callout photo">
      <Callout t0={0} out={2.2} px={692} py={875} lx={420} ly={1240} text="'PAM'" sub="TUNANGAN FIKTIF" />
    </At>
    <At at={35.32} until={37.3} name="g TOP SECRET">
      <TopSecret />
    </At>
    <At at={37.2} until={39.65} name="g map greece">
      <MapGreece />
    </At>
    <At at={39.9} until={43.65} name="g sub hud">
      <SubHud />
    </At>
    <At at={44.55} until={47.95} name="g map route">
      <MapRoute />
    </At>
    <At at={48.44} until={50.0} name="g TERTIPU">
      <Tertipu />
    </At>
    <At at={49.9} until={52.95} name="g map wrong">
      <MapWrong />
    </At>
    <At at={53.55} until={58.1} name="g invasion">
      <Invasion />
    </At>
    <At at={59.7} until={61.6} name="g title">
      <Title />
    </At>
    <At at={66.6} until={70.5} name="g memorial">
      <Memorial />
    </At>
  </>
);

export {interpolate, Img, rnd};
