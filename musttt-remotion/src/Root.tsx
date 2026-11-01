import { Composition, Folder } from "remotion";
import { MusttMotion, MUSTT_DURATION } from "./MusttMotion";
import { Genesis } from "./scenes/Genesis";
import { Mark } from "./scenes/Mark";
import { Orbit } from "./scenes/Orbit";
import { FPS, SIZE } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="MusttMotion-Scenes">
        <Composition id="Genesis" component={Genesis} width={SIZE} height={SIZE} fps={FPS} durationInFrames={180} />
        <Composition id="Orbit" component={Orbit} width={SIZE} height={SIZE} fps={FPS} durationInFrames={210} />
        <Composition id="Mark" component={Mark} width={SIZE} height={SIZE} fps={FPS} durationInFrames={120} />
      </Folder>
      <Composition
        id="MusttMotion"
        component={MusttMotion}
        width={SIZE}
        height={SIZE}
        fps={FPS}
        durationInFrames={MUSTT_DURATION}
      />
    </>
  );
};
