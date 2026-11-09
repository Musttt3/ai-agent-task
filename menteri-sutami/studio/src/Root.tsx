import React from "react";
import { Composition } from "remotion";
import { Sutami, TOTAL } from "./Sutami";

export const RemotionRoot: React.FC = () => (
  <Composition id="Sutami" component={Sutami} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
);
