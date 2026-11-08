import { Composition } from "remotion";
import { FPS, PulauVideo, TOTAL } from "./Video";
import { PURBA_FPS, PURBA_TOTAL, PurbaVideo } from "./purba/PurbaVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PulauYangLupa"
        component={PulauVideo}
        durationInFrames={TOTAL}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="ManusiaPurbaMinus30"
        component={PurbaVideo}
        durationInFrames={PURBA_TOTAL}
        fps={PURBA_FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
