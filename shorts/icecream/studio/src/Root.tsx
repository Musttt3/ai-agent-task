import React from "react";
import { Composition } from "remotion";
import { IceCreamShort, ICECREAM_FRAMES } from "./videos/icecream/Bridge";

export const Root: React.FC = () => (
  <>
    <Composition id="IceCream" component={IceCreamShort} durationInFrames={ICECREAM_FRAMES} fps={30} width={1920} height={1080} />
  </>
);
