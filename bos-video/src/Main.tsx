import React from "react";
import { AbsoluteFill, Composition, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { Captions } from "./Captions";
import { FPS, H, W, YELLOW, lerp, sf, useT } from "./lib";
import {
  S1Hook,
  S2Kalimar,
  S3Phone,
  S4aArrive,
  S4bConfront,
  S5Viral,
  S6Staged,
  S7Spotlight,
  S8Cta,
  Scene,
} from "./Scenes";

export const DURATION = 46.3;

/** [time (s), file, volume] */
const SFX: [number, string, number][] = [
  [0.0, "whoosh", 0.55],
  [0.3, "impact", 0.75],
  [0.88, "pop", 0.6],
  [3.2, "whip", 0.5],
  [3.42, "pop", 0.6],
  [4.52, "stamp", 0.8],
  [6.28, "whoosh", 0.6],
  [7.05, "whip", 0.45],
  [8.6, "pop", 0.5],
  [10.72, "pop", 0.6],
  [10.8, "ding", 0.45],
  [12.1, "whoosh", 0.55],
  [12.5, "notif", 0.5],
  [13.8, "typing", 0.55],
  [15.28, "send", 0.55],
  [16.0, "pop", 0.5],
  [16.55, "bubble", 0.6],
  [17.12, "stamp", 0.8],
  [17.68, "whip", 0.55],
  [18.78, "pop", 0.5],
  [19.8, "whoosh", 0.35],
  [20.05, "stamp", 0.6],
  [20.88, "glitch", 0.45],
  [21.18, "pop", 0.5],
  [21.3, "whip", 0.3],
  [22.45, "impact", 0.45],
  [23.25, "whoosh", 0.5],
  [23.85, "stamp", 0.75],
  [24.78, "whoosh", 0.55],
  [25.0, "notif", 0.35],
  [25.85, "shutter", 0.7],
  [26.6, "send", 0.5],
  [27.6, "ding", 0.45],
  [28.3, "ticks", 0.5],
  [28.7, "bubble", 0.4],
  [29.0, "bubble", 0.35],
  [29.45, "chime", 0.55],
  [30.0, "glitch", 0.5],
  [30.2, "impact", 0.8],
  [33.18, "scratch", 0.7],
  [33.78, "stamp", 0.8],
  [34.88, "stamp", 0.75],
  [35.28, "whoosh", 0.55],
  [35.5, "impact", 0.35],
  [36.84, "pop", 0.55],
  [38.43, "pop", 0.6],
  [38.85, "bubble", 0.45],
  [39.13, "pop", 0.6],
  [39.88, "chime", 0.5],
  [40.78, "whoosh", 0.55],
  [41.2, "pop", 0.5],
  [42.72, "impact", 0.8],
  [43.74, "whip", 0.45],
  [43.8, "pop", 0.55],
  [44.95, "notif", 0.5],
  [45.1, "typing", 0.4],
];

/** quick white/colour flashes at the cuts */
const FLASHES = [0.3, 6.5, 12.3, 25.0, 30.2, 35.5, 41.0, 42.75];

const Flashes: React.FC = () => {
  const t = useT();
  const f = FLASHES.find((x) => t >= x - 0.03 && t < x + 0.25);
  if (f === undefined) return null;
  return (
    <AbsoluteFill
      style={{
        background: "#fff",
        opacity: lerp(t, [f - 0.03, f, f + 0.25], [0, 0.85, 0]),
        mixBlendMode: "screen",
      }}
    />
  );
};

const Progress: React.FC = () => {
  const t = useT();
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        height: 10,
        width: `${(t / DURATION) * 100}%`,
        background: YELLOW,
        boxShadow: "0 0 18px rgba(255,212,0,0.8)",
      }}
    />
  );
};

export const BosVideo: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Scene start={0} end={6.5} enter="none" impacts={[0.32, 4.55]}>
        <S1Hook />
      </Scene>
      <Scene start={6.5} end={12.3} enter="whip" impacts={[10.78]}>
        <S2Kalimar />
      </Scene>
      <Scene start={12.3} end={17.9} enter="zoom" impacts={[17.15]}>
        <S3Phone />
      </Scene>
      <Scene start={17.9} end={21.0} enter="whip" impacts={[20.1]}>
        <S4aArrive />
      </Scene>
      <Scene start={21.0} end={25.0} enter="glitch" impacts={[22.48, 23.9]}>
        <S4bConfront />
      </Scene>
      <Scene start={25.0} end={30.1} enter="zoom" impacts={[25.88]}>
        <S5Viral />
      </Scene>
      <Scene start={30.1} end={35.5} enter="glitch" impacts={[33.8, 34.92]}>
        <S6Staged />
      </Scene>
      <Scene start={35.5} end={41.0} enter="whipUp" impacts={[38.45, 39.15]}>
        <S7Spotlight />
      </Scene>
      <Scene start={41.0} end={DURATION} enter="whip" impacts={[]}>
        <S8Cta />
      </Scene>

      <Flashes />
      <Captions />
      <Progress />
      <AbsoluteFill style={{ background: "#000", opacity: lerp(t, [45.95, 46.3], [0, 1]) }} />

      <Audio src={staticFile("vo.mp3")} volume={1} />
      <Audio src={staticFile("sfx/bgm.mp3")} volume={0.13} />
      {SFX.map(([at, name, vol], i) => (
        <Sequence key={i} from={sf(at)} layout="none" name={`sfx ${name}`}>
          <Audio src={staticFile(`sfx/${name}.mp3`)} volume={vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const BosComposition: React.FC = () => (
  <Composition
    id="JasaMarahiBos"
    component={BosVideo}
    durationInFrames={Math.round(DURATION * FPS)}
    fps={FPS}
    width={W}
    height={H}
  />
);
