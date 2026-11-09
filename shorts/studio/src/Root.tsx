import React from "react";
import { Composition } from "remotion";
import { LascauxShort, LASCAUX_FRAMES } from "./videos/lascaux/Lascaux";
import { SmokeTest } from "./videos/lascaux/SmokeTest";
import { KrakatauSample, KRAKATAU_SAMPLE_FRAMES } from "./videos/krakatau/Krakatau";

export const Root: React.FC = () => (
  <>
    <Composition id="LascauxShort" component={LascauxShort} durationInFrames={LASCAUX_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="KrakatauSample" component={KrakatauSample} durationInFrames={KRAKATAU_SAMPLE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="SmokeTest" component={SmokeTest} durationInFrames={30} fps={30} width={1080} height={1920} />
  </>
);
