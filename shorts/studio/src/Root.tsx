import React from "react";
import { Composition } from "remotion";
import { LascauxShort, LASCAUX_FRAMES } from "./videos/lascaux/Lascaux";
import { SmokeTest } from "./videos/lascaux/SmokeTest";
import { CastSheet } from "./videos/viking/CastSheet";
import { VikingShort, VIKING_FRAMES } from "./videos/viking/Viking";
import { CastSheet as PlagueCast } from "./videos/plague/CastSheet";
import { PlagueShort, PLAGUE_FRAMES } from "./videos/plague/Plague";
import { CastSheet as ByzCast } from "./videos/byzantium/CastSheet";

export const Root: React.FC = () => (
  <>
    <Composition id="LascauxShort" component={LascauxShort} durationInFrames={LASCAUX_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="SmokeTest" component={SmokeTest} durationInFrames={30} fps={30} width={1080} height={1920} />
    <Composition id="VikingShort" component={VikingShort} durationInFrames={VIKING_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="VikingCast" component={CastSheet} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="PlagueShort" component={PlagueShort} durationInFrames={PLAGUE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="ByzCast" component={ByzCast} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="PlagueCast" component={PlagueCast} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
