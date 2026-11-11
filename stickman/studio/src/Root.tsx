import React, { useState } from "react";
import {
  AbsoluteFill,
  Audio,
  cancelRender,
  Composition,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { clamp, FPS, H, TOTAL_FRAMES, W } from "./lib";
import { FLASHBACK, Overlays } from "./Overlays";
import { CutOverlays, Shots } from "./Shots";

const useFonts = () => {
  const [handle] = useState(() => delayRender("fonts"));
  React.useEffect(() => {
    const faces = [
      new FontFace("Fredoka", `url(${staticFile("fonts/Fredoka.ttf")})`, { weight: "300 700" }),
      new FontFace("PermanentMarker", `url(${staticFile("fonts/PermanentMarker.ttf")})`),
    ];
    Promise.all(faces.map((ff) => ff.load()))
      .then((loaded) => {
        loaded.forEach((ff) => (document.fonts as unknown as { add: (f: FontFace) => void }).add(ff));
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [handle]);
};

const Helikopter: React.FC<{ audio: boolean }> = ({ audio }) => {
  useFonts();
  const frame = useCurrentFrame();
  const [a, b] = FLASHBACK;
  const sepia = interpolate(frame, [a - 2, a + 6, b - 6, b], [0, 0.75, 0.75, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={sepia > 0 ? { filter: `sepia(${sepia}) saturate(${1 - sepia * 0.25})` } : undefined}>
        <Shots />
      </AbsoluteFill>
      <Overlays />
      <CutOverlays />
      {audio ? <Audio src={staticFile("narasi.mp3")} /> : null}
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => (
  <Composition
    id="Helikopter"
    component={Helikopter}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={W}
    height={H}
    defaultProps={{ audio: true }}
  />
);
