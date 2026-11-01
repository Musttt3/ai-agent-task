import React from "react";
import { AbsoluteFill, Composition, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { FPS, H, W, lerp, sf, useT } from "./lib";
import { Scene } from "./common";
import {
  S1Hook,
  S2Teaser,
  S3Year,
  S4Royadin,
  S5Stop,
  S6RedLight,
  S7Window,
  S8Sultan,
  S9Ticket,
  S10Letter,
  S11Reverse,
  S12Invite,
  S13Refuse,
  S14Moral,
} from "./Scenes";

/** voiceover is 54.8s; keep ~2s of tail so the last line is never cut */
export const DURATION = 57.0;

/** SFX sit under the narrator */
const SFX_GAIN = 0.45;

/** [time (s), file, volume] */
const SFX: [number, string, number][] = [
  [0.0, "siren", 0.35],
  [0.02, "impact", 0.5],
  [1.1, "impact", 0.55],
  [2.45, "glitch", 0.5],
  [3.22, "pop", 0.5],
  [4.4, "dun", 0.6],
  [4.65, "riser", 0.3],
  [6.2, "impact", 0.5],
  [7.1, "rewind", 0.6],
  [7.35, "clock", 0.5],
  [8.1, "stamp", 0.6],
  [9.75, "whip", 0.5],
  [10.15, "pop", 0.5],
  [11.0, "stamp", 0.7],
  [11.45, "whoosh", 0.4],
  [11.6, "whistle", 0.7],
  [12.2, "pop", 0.5],
  [12.7, "whip", 0.5],
  [13.0, "dun", 0.45],
  [14.04, "pop", 0.5],
  [14.3, "bubble", 0.4],
  [14.82, "whoosh", 0.5],
  [15.3, "pop", 0.4],
  [15.45, "window", 0.7],
  [16.85, "dun", 0.6],
  [16.9, "impact", 0.5],
  [19.2, "gong", 0.9],
  [19.35, "sparkle", 0.6],
  [21.55, "whip", 0.5],
  [22.7, "pop", 0.5],
  [24.22, "stamp", 0.8],
  [24.6, "pen", 0.6],
  [26.3, "paper", 0.6],
  [26.6, "pen", 0.4],
  [26.95, "stamp", 0.8],
  [27.1, "whoosh", 0.5],
  [27.32, "clock", 0.6],
  [28.9, "bonang", 0.6],
  [29.2, "pop", 0.4],
  [30.55, "heartbeat", 0.9],
  [32.1, "impact", 0.45],
  [32.15, "heartbeat", 0.35],
  [32.88, "scratch", 0.5],
  [34.48, "whoosh", 0.5],
  [34.6, "chime", 0.4],
  [36.04, "pop", 0.4],
  [36.94, "sparkle", 0.7],
  [37.0, "chime", 0.5],
  [37.64, "pop", 0.4],
  [38.55, "whip", 0.5],
  [39.26, "bonang", 0.6],
  [40.4, "pop", 0.45],
  [40.9, "paper", 0.4],
  [41.3, "whoosh", 0.5],
  [42.5, "ding", 0.4],
  [42.75, "whip", 0.5],
  [43.68, "pop", 0.4],
  [44.56, "stamp", 0.7],
  [45.8, "whoosh", 0.4],
  [46.1, "bonang", 0.6],
  [47.16, "pop", 0.45],
  [48.2, "whoosh", 0.5],
  [48.44, "bonang", 0.4],
  [50.3, "dun", 0.6],
  [52.06, "impact", 0.5],
  [53.18, "whoosh", 0.4],
  [54.0, "gong", 0.9],
  [54.1, "sparkle", 0.5],
];

/** [time, colour] flashes on the big beats */
const FLASHES: [number, string][] = [
  [6.22, "#fff"],
  [7.25, "#fff"],
  [11.62, "#fff"],
  [16.9, "#fff"],
  [19.2, "#E8B931"],
  [32.95, "#fff"],
  [54.0, "#E8B931"],
];

const Flashes: React.FC = () => {
  const t = useT();
  const f = FLASHES.find(([x]) => t >= x - 0.03 && t < x + 0.3);
  if (!f) return null;
  return (
    <AbsoluteFill
      style={{
        background: f[1],
        opacity: lerp(t, [f[0] - 0.03, f[0], f[0] + 0.3], [0, 0.8, 0]),
        mixBlendMode: "screen",
      }}
    />
  );
};

export const PolisiVideo: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Scene start={0} end={2.55} enter="none" impacts={[0.02, 1.12]}>
        <S1Hook />
      </Scene>
      <Scene start={2.55} end={7.25} enter="glitch" impacts={[6.22]}>
        <S2Teaser />
      </Scene>
      <Scene start={7.25} end={9.85} enter="zoom" impacts={[8.1]}>
        <S3Year />
      </Scene>
      <Scene start={9.85} end={11.55} enter="whip" impacts={[11.0]}>
        <S4Royadin />
      </Scene>
      <Scene start={11.55} end={12.8} enter="whip">
        <S5Stop />
      </Scene>
      <Scene start={12.8} end={14.95} enter="zoom" impacts={[14.2]}>
        <S6RedLight />
      </Scene>
      <Scene start={14.95} end={18.0} enter="whip">
        <S7Window />
      </Scene>
      <Scene start={18.0} end={21.7} enter="none" impacts={[19.22]}>
        <S8Sultan />
      </Scene>
      <Scene start={21.7} end={27.25} enter="whip" impacts={[24.24, 26.97]}>
        <S9Ticket />
      </Scene>
      <Scene start={27.25} end={32.95} enter="zoom">
        <S10Letter />
      </Scene>
      <Scene start={32.95} end={38.7} enter="glitch" impacts={[36.96]}>
        <S11Reverse />
      </Scene>
      <Scene start={38.7} end={42.9} enter="whip">
        <S12Invite />
      </Scene>
      <Scene start={42.9} end={48.35} enter="whipUp" impacts={[44.6]}>
        <S13Refuse />
      </Scene>
      <Scene start={48.35} end={DURATION} enter="zoom" impacts={[52.08]}>
        <S14Moral />
      </Scene>

      <Flashes />
      <AbsoluteFill style={{ background: "#000", opacity: lerp(t, [56.2, 57.0], [0, 1]) }} />

      <Audio src={staticFile("vo.mp3")} volume={1} />
      <Audio src={staticFile("sfx/bgm.mp3")} volume={0.1} />
      {SFX.map(([at, name, vol], i) => (
        <Sequence key={i} from={sf(at)} layout="none" name={`sfx ${name}`}>
          <Audio src={staticFile(`sfx/${name}.mp3`)} volume={vol * SFX_GAIN} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const PolisiComposition: React.FC = () => (
  <Composition
    id="PolisiTilangSultan"
    component={PolisiVideo}
    durationInFrames={Math.round(DURATION * FPS)}
    fps={FPS}
    width={W}
    height={H}
  />
);
