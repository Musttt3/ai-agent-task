import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate } from "remotion";
import data from "./data.json";
import { cueFor, DAY6_FROM, FLASHBACK, RADIO, REC } from "./cues";
import { Shot } from "./Shot";
import {
  DayStamp,
  EndCard,
  Flicker,
  Grain,
  Letterbox,
  Quote,
  RadioPanel,
  RecOverlay,
  TitleCard,
  Vignette,
} from "./Overlays";

export const FPS = data.fps;
export const END_CARD = 120;
export const TOTAL = data.audioFrames + END_CARD;

type ShotData = { n: number; file: string; text: string; from: number; dur: number };
const shots = data.shots as ShotData[];
const byN = (n: number) => shots[n - 1];

const gradeFor = (n: number) => {
  if (n >= FLASHBACK.from && n <= FLASHBACK.to) return "sepia(0.28) saturate(0.9) contrast(1.02)";
  if (n >= 83) return "saturate(0.85) contrast(1.06) brightness(0.96)";
  return "saturate(0.92) contrast(1.03)";
};

const rangeSeq = (from: number, to: number) => {
  const a = byN(from);
  const b = byN(to);
  return { from: a.from, dur: b.from + b.dur - a.from };
};

const Drone: React.FC = () => {
  const frame = useCurrentFrame();
  // bed gets a little louder in the tense second half, fades at the end
  const v = interpolate(
    frame,
    [0, 60, byN(83).from, byN(83).from + 90, data.audioFrames, data.audioFrames + END_CARD],
    [0, 0.1, 0.1, 0.16, 0.16, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <Audio src={staticFile("sfx/drone.wav")} loop volume={v} />;
};

export const PulauVideo: React.FC = () => {
  const recRange = rangeSeq(REC.from, REC.to);
  const radioRange = rangeSeq(RADIO.from, RADIO.to);
  const day6From = byN(DAY6_FROM).from;
  const darkFrom = byN(83).from;

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* Pictures */}
      {shots.map((s, i) => {
        const cue = cueFor(s.n);
        const next = shots[i + 1];
        const nextIn = next ? cueFor(next.n).in ?? null : "dip";
        return (
          <Sequence key={s.n} from={s.from} durationInFrames={s.dur} name={`${String(s.n).padStart(3, "0")} ${s.text.slice(0, 30)}`}>
            <Shot
              n={s.n}
              file={s.file}
              dur={s.dur}
              cue={cue}
              prevFile={i > 0 ? shots[i - 1].file : null}
              nextIn={nextIn}
              grade={gradeFor(s.n)}
            />
          </Sequence>
        );
      })}

      {/* Atmosphere */}
      <Sequence from={darkFrom} durationInFrames={data.audioFrames - darkFrom} name="Flicker">
        <Flicker />
      </Sequence>
      <Sequence from={recRange.from} durationInFrames={recRange.dur} name="REC overlay">
        <RecOverlay startSec={0} />
      </Sequence>
      <Vignette strength={0.55} />
      <Grain opacity={0.09} />
      <Letterbox />

      {/* Motion graphics */}
      <Sequence from={0} durationInFrames={150} name="Title">
        <TitleCard />
      </Sequence>
      <Sequence from={day6From} durationInFrames={90} name="Stamp hari 6">
        <DayStamp />
      </Sequence>
      <Sequence from={radioRange.from} durationInFrames={radioRange.dur} name="Radio">
        <RadioPanel />
      </Sequence>
      {shots.map((s, i) => {
        const q = cueFor(s.n).quote;
        if (!q) return null;
        const next = shots[i + 1];
        const nextHasQuote = next && cueFor(next.n).quote;
        const dur = nextHasQuote ? s.dur : Math.max(s.dur, 45);
        return (
          <Sequence key={`q${s.n}`} from={s.from} durationInFrames={dur} name={`Quote ${s.n}`}>
            <Quote text={q.text} style={q.style} dur={dur} />
          </Sequence>
        );
      })}
      <Sequence from={data.audioFrames} durationInFrames={END_CARD} name="End card">
        <EndCard />
      </Sequence>

      {/* Sound */}
      <Audio src={staticFile("narasi.mp3")} />
      <Drone />
      {shots.flatMap((s) =>
        (cueFor(s.n).sfx ?? []).map((fx, j) => (
          <Sequence
            key={`fx${s.n}-${j}`}
            from={s.from + Math.round((fx.at ?? 0) * FPS)}
            durationInFrames={Math.round((fx.dur ?? 12) * FPS)}
            name={`sfx ${fx.name} @${s.n}`}
            layout="none"
          >
            <Audio src={staticFile(`sfx/${fx.name}.wav`)} volume={fx.vol ?? 0.4} />
          </Sequence>
        )),
      )}
      <Sequence from={data.audioFrames - 10} durationInFrames={END_CARD} layout="none" name="sfx end">
        <Audio src={staticFile("sfx/impact.wav")} volume={0.35} />
      </Sequence>
    </AbsoluteFill>
  );
};
