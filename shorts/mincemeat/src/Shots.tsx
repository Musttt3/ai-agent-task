import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {DURATION_S, f, FPS, H, PAD, Shot, SHOTS, W} from './timeline';
import {Abs, clamp01, lerp, rnd, shake} from './lib';

const GRADE = 'contrast(1.12) saturate(0.78) sepia(0.16) brightness(0.93)';
const ease = Easing.inOut(Easing.cubic);

type Xf = {x: number; y: number; s: number; r: number; blurX: number; blurY: number; blur: number; o: number};

const transform = (shot: Shot, next: Shot | undefined, t: number): Xf => {
  const xf: Xf = {x: 0, y: 0, s: 1, r: 0, blurX: 0, blurY: 0, blur: 0, o: 1};
  // ---- incoming
  const pin = PAD[shot.in];
  if (pin > 0 && shot.start > 0) {
    const p = clamp01((t - (shot.start - pin)) / (2 * pin));
    const e = ease(p);
    const bump = Math.sin(Math.PI * p);
    if (shot.in === 'whip') {
      xf.x += W * (1 - e);
      xf.blurX += bump * 60;
    } else if (shot.in === 'whipV') {
      xf.y += H * (1 - e);
      xf.blurY += bump * 70;
    } else if (shot.in === 'zoom') {
      xf.s *= lerp(1.35, 1, e);
      xf.blur += (1 - e) * 22;
      xf.o *= e;
    } else {
      xf.o *= e; // fade, leak
    }
  }
  if (shot.in === 'flash') {
    const sh = shake(t, shot.start, 22, 0.5);
    xf.x += sh.x;
    xf.y += sh.y;
    xf.r += sh.r;
    xf.s *= 1 + 0.06 * Math.exp(-(t - shot.start) * 6) * (t >= shot.start ? 1 : 0);
  }
  if (shot.in === 'black') {
    const u = (t - shot.start) * FPS;
    // 4 black frames, then the lamp stutters on
    const pattern = [0, 0, 0, 0, 0.9, 0.15, 0.7, 1, 0.45, 1];
    xf.o *= u < pattern.length ? pattern[Math.max(0, Math.floor(u))] : 1;
  }
  // ---- outgoing
  if (next) {
    const pout = PAD[next.in];
    if (pout > 0) {
      const p = clamp01((t - (shot.end - pout)) / (2 * pout));
      const e = ease(p);
      const bump = Math.sin(Math.PI * p);
      if (next.in === 'whip') {
        xf.x -= W * e;
        xf.blurX += bump * 60;
      } else if (next.in === 'whipV') {
        xf.y -= H * e;
        xf.blurY += bump * 70;
      } else if (next.in === 'zoom') {
        xf.s *= lerp(1, 1.5, Easing.in(Easing.cubic)(p));
        xf.blur += e * 26;
      }
    }
  }
  return xf;
};

const Media: React.FC<{shot: Shot; seqFrom: number}> = ({shot, seqFrom}) => {
  const frame = useCurrentFrame();
  const t = (frame + seqFrom) / FPS;
  const p = clamp01((t - shot.start) / (shot.end - shot.start));
  const kb = shot.kb;
  const z = lerp(kb.z[0], kb.z[1], p);
  const x = kb.x ? lerp(kb.x[0], kb.x[1], p) : 0;
  const y = kb.y ? lerp(kb.y[0], kb.y[1], p) : 0;
  const r = kb.r ? lerp(kb.r[0], kb.r[1], p) : 0;
  const style: React.CSSProperties = {
    position: 'absolute',
    width: W,
    height: H,
    objectFit: 'cover',
    transform: `translate(${x}px, ${y}px) scale(${z}) rotate(${r}deg)`,
  };
  if (shot.kind === 'image') return <Img src={staticFile(shot.src)} style={style} />;
  return (
    <OffthreadVideo
      src={staticFile(shot.src)}
      muted
      playbackRate={shot.rate ?? 1}
      startFrom={Math.round((shot.trimStart ?? 0) * FPS)}
      style={style}
    />
  );
};

const ShotLayer: React.FC<{shot: Shot; next?: Shot; seqFrom: number}> = ({shot, next, seqFrom}) => {
  const frame = useCurrentFrame();
  const t = (frame + seqFrom) / FPS;
  const xf = transform(shot, next, t);
  const dirBlur = xf.blurX > 0.5 || xf.blurY > 0.5;
  const fid = `mb-${shot.id}`;
  const filter = [GRADE, xf.blur > 0.3 ? `blur(${xf.blur}px)` : '', dirBlur ? `url(#${fid})` : ''].join(' ');
  return (
    <AbsoluteFill style={{opacity: xf.o, overflow: 'hidden'}}>
      {dirBlur ? (
        <svg width="0" height="0" style={{position: 'absolute'}}>
          <filter id={fid} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={`${xf.blurX} ${xf.blurY}`} />
          </filter>
        </svg>
      ) : null}
      <AbsoluteFill
        style={{
          transform: `translate(${xf.x}px, ${xf.y}px) scale(${xf.s}) rotate(${xf.r}deg)`,
          filter,
          backgroundColor: '#000',
        }}
      >
        <Media shot={shot} seqFrom={seqFrom} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ShotTrack: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    {SHOTS.map((shot, i) => {
      const next = SHOTS[i + 1];
      const a = Math.max(0, shot.start - (i === 0 ? 0 : PAD[shot.in]));
      const b = Math.min(DURATION_S, shot.end + (next ? PAD[next.in] : 0));
      const from = f(a);
      return (
        <Sequence key={shot.id} from={from} durationInFrames={f(b) - from} name={shot.id}>
          <ShotLayer shot={shot} next={next} seqFrom={from} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

// ------------------------------------------------------------------ transition overlays (above picture)

const Flash: React.FC<{t0: number}> = ({t0}) => {
  const t = useCurrentFrame() / FPS + t0;
  const u = t - t0;
  const o = u < 0 ? 0 : Math.exp(-u * 9);
  return <Abs style={{backgroundColor: '#fff8ea', opacity: o, mixBlendMode: 'screen'}} />;
};

const Leak: React.FC<{t0: number; seed: number}> = ({t0, seed}) => {
  const t = useCurrentFrame() / FPS + t0 - 0.45;
  const u = (t - (t0 - 0.45)) / 0.9; // 0..1 over the leak
  const o = Math.sin(Math.PI * clamp01(u));
  const x = lerp(-300, 900, u) + rnd(seed) * 200;
  return (
    <Abs style={{mixBlendMode: 'screen', opacity: o}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 700px 1300px at ${x}px ${700 + rnd(seed + 1) * 500}px, rgba(255,150,60,0.95), rgba(220,60,20,0.55) 40%, rgba(0,0,0,0) 75%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle 420px at ${1080 - x * 0.6}px ${300 + rnd(seed + 2) * 600}px, rgba(255,230,170,0.9), rgba(0,0,0,0) 70%)`,
        }}
      />
    </Abs>
  );
};

const Shutter: React.FC<{t0: number}> = ({t0}) => {
  // blades close in the 5 frames before the cut and open over 6 frames after it
  const u = useCurrentFrame() / FPS - 0.2; // seq starts 0.2 s before cut
  const close = u < 0 ? Easing.in(Easing.quad)(clamp01((u + 0.17) / 0.17)) : 1 - Easing.out(Easing.quad)(clamp01(u / 0.22));
  const blades = 6;
  const R = 1400;
  return (
    <Abs>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <g transform={`translate(${W / 2} ${H / 2})`}>
          {new Array(blades).fill(0).map((_, i) => {
            const a = (i / blades) * 360 + close * 25;
            const d = lerp(R, 0, close);
            return (
              <g key={i} transform={`rotate(${a}) translate(${d} 0)`}>
                <rect x={-20} y={-R} width={R} height={R * 2} fill="#070605" stroke="#2a2520" strokeWidth={3} transform="rotate(-30)" />
              </g>
            );
          })}
        </g>
      </svg>
      <Abs style={{backgroundColor: '#fff', opacity: u > 0 ? Math.exp(-u * 14) * 0.7 : 0}} />
    </Abs>
  );
};

export const TransitionFX: React.FC = () => (
  <>
    {SHOTS.map((s, i) => {
      if (s.in === 'flash')
        return (
          <Sequence key={s.id} from={f(s.start)} durationInFrames={f(0.6)} name={`flash ${s.id}`}>
            <Flash t0={0} />
          </Sequence>
        );
      if (s.in === 'leak')
        return (
          <Sequence key={s.id} from={f(s.start - 0.45)} durationInFrames={f(0.9)} name={`leak ${s.id}`}>
            <Leak t0={0.45} seed={i * 3} />
          </Sequence>
        );
      if (s.in === 'shutter')
        return (
          <Sequence key={s.id} from={f(s.start - 0.2)} durationInFrames={f(0.5)} name={`shutter ${s.id}`}>
            <Shutter t0={0.2} />
          </Sequence>
        );
      return null;
    })}
  </>
);

// ------------------------------------------------------------------ film look (grain, dust, vignette, flicker)

export const FilmLook: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const flicker = 0.035 * (rnd(frame * 0.37) - 0.5) + 0.02 * Math.sin(t * 13);
  const specks = new Array(7).fill(0).map((_, i) => ({
    on: rnd(frame * 1.7 + i * 31) > 0.72,
    x: rnd(frame * 2.3 + i) * W,
    y: rnd(frame * 5.1 + i * 9) * H,
    r: 1.5 + rnd(frame + i * 4) * 3.5,
  }));
  const scratch = rnd(Math.floor(frame / 3) * 11) > 0.86;
  const sx = rnd(Math.floor(frame / 3) * 17) * W;
  const fadeIn = interpolate(t, [0, 0.45], [1, 0], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(t, [DURATION_S - 0.9, DURATION_S - 0.05], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <>
      {/* warm tint + flicker */}
      <Abs style={{backgroundColor: flicker > 0 ? '#fff3dc' : '#000', opacity: Math.abs(flicker), mixBlendMode: 'soft-light'}} />
      <Abs style={{background: 'linear-gradient(180deg, rgba(40,25,10,0.18), rgba(10,20,30,0.12))', mixBlendMode: 'multiply'}} />
      {/* vignette + caption bed */}
      <Abs
        style={{
          background:
            'radial-gradient(ellipse 85% 70% at 50% 46%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.62) 100%), linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 66%, rgba(0,0,0,0.55) 88%, rgba(0,0,0,0.7) 100%)',
        }}
      />
      {/* grain */}
      <Img
        src={staticFile(`fx/grain_${frame % 8}.png`)}
        style={{position: 'absolute', inset: 0, width: W, height: H, opacity: 0.16, mixBlendMode: 'overlay'}}
      />
      {/* dust & scratches */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 0.55}}>
        {specks.map((s, i) => (s.on ? <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={i % 2 ? '#f7f0e0' : '#0a0806'} /> : null))}
        {scratch ? <line x1={sx} y1={0} x2={sx + 12} y2={H} stroke="#f2ead8" strokeWidth={1.4} opacity={0.35} /> : null}
      </svg>
      <Abs style={{backgroundColor: '#000', opacity: Math.max(fadeIn, fadeOut)}} />
    </>
  );
};
