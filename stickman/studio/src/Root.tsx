import React from "react";
import { AbsoluteFill, Audio, Composition, staticFile } from "remotion";
import { FPS, H, TOTAL_FRAMES, W } from "./lib";
import { CutOverlays, Shots } from "./Shots";
import { Thumbnail } from "./Thumbnail";

// Pictures + cuts/transitions + narration only (no motion graphics, no camera shake).
const Helikopter: React.FC<{ audio: boolean }> = ({ audio }) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Shots />
    <CutOverlays />
    {audio ? <Audio src={staticFile("narasi.mp3")} /> : null}
  </AbsoluteFill>
);

export const Root: React.FC = () => (
  <>
    <Composition
    id="Helikopter"
    component={Helikopter}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={W}
    height={H}
    defaultProps={{ audio: true }}
    />
    <Composition id="Thumbnail" component={Thumbnail} durationInFrames={1} fps={FPS} width={1280} height={720} defaultProps={{ variant: "A" as const }} />
  </>
);
