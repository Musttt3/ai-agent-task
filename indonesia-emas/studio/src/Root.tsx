import React from "react";
import { Composition } from "remotion";
import { Episode, EPISODE_FRAMES } from "./ep/Episode";
export const Root: React.FC = () => <Composition id="IndonesiaEmas" component={Episode} durationInFrames={EPISODE_FRAMES} fps={30} width={1080} height={1920} />;
