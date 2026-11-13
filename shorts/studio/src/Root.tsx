import React from "react";
import { Composition } from "remotion";
import { LascauxShort, LASCAUX_FRAMES } from "./videos/lascaux/Lascaux";
import { SmokeTest } from "./videos/lascaux/SmokeTest";
import { Rempah, REMPAH_FRAMES } from "./videos/rempah/Rempah";

export const Root: React.FC = () => (
  <>
    <Composition id="LascauxShort" component={LascauxShort} durationInFrames={LASCAUX_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Rempah" component={Rempah} durationInFrames={REMPAH_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="SmokeTest" component={SmokeTest} durationInFrames={30} fps={30} width={1080} height={1920} />
  </>
);
