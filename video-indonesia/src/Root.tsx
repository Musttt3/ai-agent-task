import { Composition } from "remotion";
import { FPS, IndonesiaVideo, TOTAL } from "./Video";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Indonesia1JutaTahun"
      component={IndonesiaVideo}
      durationInFrames={TOTAL}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
