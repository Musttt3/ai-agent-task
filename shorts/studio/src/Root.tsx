import React from "react";
import { Composition } from "remotion";
import { LascauxShort, LASCAUX_FRAMES } from "./videos/lascaux/Lascaux";
import { SmokeTest } from "./videos/lascaux/SmokeTest";
import { Waterfall, WATERFALL_FRAMES } from "./videos/waterfall/Waterfall";
import { Lyric3D, LYRIC3D_FRAMES } from "./videos/lyric3d/Lyric3D";

export const Root: React.FC = () => (
  <>
    <Composition id="LascauxShort" component={LascauxShort} durationInFrames={LASCAUX_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="SmokeTest" component={SmokeTest} durationInFrames={30} fps={30} width={1080} height={1920} />
    <Composition id="Lyric3D" component={Lyric3D} durationInFrames={LYRIC3D_FRAMES} fps={30} width={1080} height={1080} />
    <Composition id="Waterfall" component={Waterfall} durationInFrames={WATERFALL_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
