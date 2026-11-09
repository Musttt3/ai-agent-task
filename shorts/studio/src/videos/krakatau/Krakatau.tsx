// "Krakatau 1883" documentary short: AI stills + depth maps -> 3D camera moves, film grade, grain,
// story-driven text (title year in 3D space, typed labels, a drawn circle). Audio is mixed separately
// (shorts/krakatau/audio/mix.py) and muxed after the render.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { SANS, SERIF } from "./fonts";
import { DepthPhoto } from "./DepthPhoto";
import { CamState, ease, lerp3, Shot, toScreen, unproject, V3 } from "./cam";

const CREAM = "#eadfc8";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------------------------------------------------------------- shots
// Frame ranges (30 fps) follow the voice-over pauses in voice_s1-3.mp3 (+0.2 s lead-in).
export const S1 = { from: 0, dur: 255 }; // "Tahun 1883 ... 4.800 kilometer jauhnya."
export const S2 = { from: 255, dur: 180 }; // "Di sebuah pulau kecil di Samudra Hindia ..."
export const S3 = { from: 435, dur: 180 }; // "Padahal ... Selat Sunda, di antara Jawa dan Sumatra."
export const KRAKATAU_SAMPLE_FRAMES = 630; // + 0.5 s black tail

// The distant boom (audio cue at 2.7 s): a short punch-in plus a decaying shake, so the picture reacts to the sound.
const BOOM_F = 81;
const addV = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const boomKick = (f: number, at: number): V3 => {
  const t = f - at;
  if (t < 0) return [0, 0, 0];
  const push = -0.07 * interpolate(t, [0, 7], [0, 1], { ...clamp, easing: ease });
  const amp = 0.006 * Math.exp(-t / 7);
  return [amp * Math.sin(t * 2.1), amp * Math.cos(t * 2.7 + 1), push];
};

const shot1: Shot = {
  img: "s01",
  zn: 1.2,
  zf: 7,
  cam: (f): CamState => ({
    // whip-in over the waves, then a slow push toward the island
    pos: addV(
      f < 14 ? lerp3(f, [0, 14], [[0, 0, 0.02], [0, 0.006, -0.12]], ease) : lerp3(f, [14, 255], [[0, 0.006, -0.12], [0, 0.02, -0.24]]),
      boomKick(f, BOOM_F),
    ),
    look: [0, 0.06, -8],
    roll: 0,
    crop: 1.06,
  }),
};

const shot2: Shot = {
  img: "s02",
  zn: 1.0,
  zf: 6,
  cam: (f): CamState => ({
    // slow lateral slide: the people pass in front of a near-still sea
    pos: [
      interpolate(f, [0, 180], [0.035, -0.035], clamp),
      0,
      f < 12 ? interpolate(f, [0, 12], [0.0, -0.09], { ...clamp, easing: ease }) : interpolate(f, [12, 180], [-0.09, -0.2], clamp),
    ],
    look: [0, 0.02, -5],
    roll: 0,
    crop: 1.12,
  }),
};

const K_UV = { u: 0.505, v: 0.515, d: 0.48 }; // Krakatau on the chart
const shot3: Shot = {
  img: "s03",
  zn: 1.0,
  zf: 2.0,
  cam: (f): CamState => {
    const K = unproject(K_UV.u, K_UV.v, K_UV.d, 1.0, 2.0);
    // dive toward the island: most of the travel in the first half second, then a slow settle
    const t = f < 16 ? interpolate(f, [0, 16], [0, 0.24], { ...clamp, easing: ease }) : interpolate(f, [16, 180], [0.24, 0.42], clamp);
    return {
      pos: [K[0] * t, K[1] * t, K[2] * t],
      look: K,
      roll: interpolate(f, [0, 16, 180], [-0.07, -0.01, 0.015], { ...clamp, easing: ease }),
      crop: 1.05,
    };
  },
};

// ---------------------------------------------------------------- look
const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const i = f % 6;
  const ox = ((f * 137) % 97) - 48;
  const oy = ((f * 71) % 89) - 44;
  return (
    <AbsoluteFill style={{ overflow: "hidden", mixBlendMode: "overlay", opacity: 0.55 }}>
      <Img src={staticFile(`krakatau/grain_${i}.png`)} style={{ position: "absolute", left: -60 + ox, top: -60 + oy, width: 1200, height: 2040 }} />
    </AbsoluteFill>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 62% at 50% 48%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 84%, rgba(0,0,0,0.78) 100%)" }} />
);

/** One 3D-camera shot with a whip-in blur at its start */
const ShotLayer: React.FC<{ shot: Shot; dur: number; fadeIn?: number }> = ({ shot, dur, fadeIn = 0 }) => {
  const f = useCurrentFrame();
  const blur = interpolate(f, [0, 10], [10, 0], { ...clamp, easing: Easing.out(Easing.quad) });
  const bright = interpolate(f, [0, Math.max(1, fadeIn)], [fadeIn ? 0 : 1, 1], clamp) * interpolate(f, [dur - 4, dur], [1, 0.85], clamp);
  return (
    <AbsoluteFill style={{ filter: `blur(${blur}px) contrast(1.12) saturate(0.78) brightness(${0.96 * bright})` }}>
      <DepthPhoto shot={shot} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- text
/** Thin serif year that lives in the 3D scene (moves with parallax) */
const Year3D: React.FC<{ shot: Shot; text: string; at: V3; ref0: number; inF: number; outF: number }> = ({ shot, text, at, ref0, inF, outF }) => {
  const f = useCurrentFrame();
  const s = toScreen(shot.cam(f), at, ref0);
  const chars = text.split("");
  const out = interpolate(f, [outF, outF + 14], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <div style={{ position: "absolute", left: s.x, top: s.y, translate: "-50% -50%", scale: String(s.scale), display: "flex", whiteSpace: "nowrap" }}>
      {chars.map((c, i) => {
        const st = inF + i * 4;
        const p = interpolate(f, [st, st + 18], [0, 1], { ...clamp, easing: ease });
        return (
          <span
            key={i}
            style={{
              fontFamily: SERIF,
              fontWeight: 300,
              fontSize: 250,
              letterSpacing: "0.06em",
              color: CREAM,
              opacity: p * (1 - out),
              filter: `blur(${(1 - p) * 14 + out * 10}px)`,
              translate: `0 ${(1 - p) * 26}px`,
              textShadow: "0 0 30px rgba(234,223,200,0.25)",
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
};

/** Typed documentary label: small caps line, rule, sub line */
const TypedLabel: React.FC<{ x: number; y: number; title: string; sub?: string; at: number; outF?: number }> = ({ x, y, title, sub, at, outF = 9999 }) => {
  const f = useCurrentFrame();
  const n1 = Math.floor(interpolate(f, [at, at + title.length * 1.6], [0, title.length], clamp));
  const rule = interpolate(f, [at + 6, at + 30], [0, 1], { ...clamp, easing: ease });
  const sAt = at + title.length * 1.6 + 6;
  const n2 = sub ? Math.floor(interpolate(f, [sAt, sAt + sub.length * 1.2], [0, sub.length], clamp)) : 0;
  const out = interpolate(f, [outF, outF + 10], [1, 0], clamp);
  const caret = f >= at && (f < sAt + (sub?.length ?? 0) * 1.2 + 8) && Math.floor(f / 6) % 2 === 0;
  return (
    <div style={{ position: "absolute", left: x, top: y, translate: "-50% 0", opacity: out, textAlign: "center", whiteSpace: "nowrap" }}>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 44, letterSpacing: "0.32em", color: CREAM, textShadow: "0 2px 18px rgba(0,0,0,0.8)" }}>
        {title.slice(0, n1)}
        <span style={{ opacity: caret && n1 < title.length ? 1 : 0 }}>▍</span>
      </div>
      <div style={{ height: 2, margin: "16px auto", width: 420 * rule, background: "rgba(234,223,200,0.75)" }} />
      {sub ? (
        <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 34, letterSpacing: "0.08em", color: "rgba(234,223,200,0.82)", textShadow: "0 2px 14px rgba(0,0,0,0.85)" }}>
          {sub.slice(0, n2)}
        </div>
      ) : null}
    </div>
  );
};

/** Hand-drawn style dashed circle around a 3D anchor + typed label under it */
const CircleMark: React.FC<{ shot: Shot; at: V3; ref0: number; r: number; drawAt: number; label: string }> = ({ shot, at, ref0, r, drawAt, label }) => {
  const f = useCurrentFrame();
  const s = toScreen(shot.cam(f), at, ref0);
  const R = r * s.scale;
  const p = interpolate(f, [drawAt, drawAt + 20], [0, 1], { ...clamp, easing: ease });
  const C = 2 * Math.PI * R;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <g style={{ filter: "drop-shadow(0 0 6px rgba(0,0,0,0.7))" }}>
          <circle
            cx={s.x}
            cy={s.y}
            r={R}
            fill="none"
            stroke={CREAM}
            strokeWidth={5}
            strokeDasharray={`${C * p} ${C}`}
            transform={`rotate(${-100 + f * 0.4} ${s.x} ${s.y})`}
            strokeLinecap="round"
            opacity={0.95}
          />
          <circle cx={s.x} cy={s.y} r={R + 14} fill="none" stroke={CREAM} strokeWidth={2.5} strokeDasharray="10 14" opacity={0.6 * p} transform={`rotate(${f * -0.6} ${s.x} ${s.y})`} />
        </g>
      </svg>
      <TypedLabel x={s.x} y={s.y + R + 36} title={label} at={drawAt + 8} />
    </>
  );
};

// ---------------------------------------------------------------- composition
export const KrakatauSample: React.FC = () => {
  const yearAt = unproject(0.5, 0.33, 0.276, shot1.zn, shot1.zf); // Z = 3, in the sky above the island
  const seaAt = unproject(0.5, 0.36, 0.1, shot2.zn, shot2.zf);
  const kAt = unproject(K_UV.u, K_UV.v, K_UV.d, shot3.zn, shot3.zf);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence from={S1.from} durationInFrames={S1.dur} name="1 Laut malam">
        <ShotLayer shot={shot1} dur={S1.dur} fadeIn={12} />
        <Year3D shot={shot1} text="1883" at={yearAt} ref0={3} inF={8} outF={84} />
      </Sequence>
      <Sequence from={S2.from} durationInFrames={S2.dur} name="2 Pantai Samudra Hindia">
        <ShotLayer shot={shot2} dur={S2.dur} />
        <SeaLabel shot={shot2} at={seaAt} />
      </Sequence>
      <Sequence from={S3.from} durationInFrames={S3.dur} name="3 Peta Selat Sunda">
        <ShotLayer shot={shot3} dur={S3.dur} />
        <CircleMark shot={shot3} at={kAt} ref0={-kAt[2]} r={170} drawAt={57} label="SELAT SUNDA" />
      </Sequence>
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

const SeaLabel: React.FC<{ shot: Shot; at: V3 }> = ({ shot, at }) => {
  const f = useCurrentFrame();
  const s = toScreen(shot.cam(f), at, 4);
  return <TypedLabel x={s.x} y={s.y} title="SAMUDRA HINDIA" sub="4.800 km dari Krakatau" at={42} outF={168} />;
};
