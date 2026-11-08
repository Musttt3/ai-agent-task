import { Composition } from "remotion";
import { FPS, PulauVideo, TOTAL } from "./Video";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="PulauYangLupa"
      component={PulauVideo}
      durationInFrames={TOTAL}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
