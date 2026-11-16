import React from "react";
import { AbsoluteFill } from "remotion";
import { SahamCaptionOverlay } from "./TemplateCaptionOverlay";

export const SahamCaptions: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "transparent" }}>
    <SahamCaptionOverlay />
  </AbsoluteFill>
);
