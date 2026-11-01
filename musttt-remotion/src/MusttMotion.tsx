import { Audio, Video } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Genesis } from "./scenes/Genesis";
import { Mark } from "./scenes/Mark";
import { Orbit } from "./scenes/Orbit";
import { C } from "./theme";

/**
 * MUSTTT — 30 s, 1080×1080, 30 fps.
 *
 *  0.0 –  6.0 s  Genesis    (Remotion · Three.js)  flower core, 3D name assembles, dive into the core
 *  6.0 – 14.0 s  Manifesto  (HyperFrames)          THINK / WRITE / BUILD / SHARE
 * 14.0 – 21.0 s  Orbit      (Remotion · Three.js)  ring of pose cards, "Satu nama. Seribu ekspresi."
 * 21.0 – 26.0 s  Hero       (HyperFrames)          full-body hero, name and roles
 * 26.0 – 30.0 s  Mark       (Remotion · Three.js)  3D logo + @musttt
 *
 * The HyperFrames scenes are rendered from ../musttt-hyperframes into public/hyperframes-scenes.mp4
 * (manifesto 0–8 s, hero 8–13 s of that file).
 */
export const MUSTT_DURATION = 900;

const HF = staticFile("hyperframes-scenes.mp4");

export const MusttMotion: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.ground }}>
      <Sequence name="Genesis (3D)" from={0} durationInFrames={180}>
        <Genesis />
      </Sequence>
      <Sequence name="Manifesto (HyperFrames)" from={180} durationInFrames={240}>
        <Video src={HF} trimBefore={0} durationInFrames={240} muted style={{ width: "100%", height: "100%" }} />
      </Sequence>
      <Sequence name="Orbit (3D)" from={420} durationInFrames={210}>
        <Orbit />
      </Sequence>
      <Sequence name="Hero (HyperFrames)" from={630} durationInFrames={150}>
        <Video src={HF} trimBefore={240} durationInFrames={150} muted style={{ width: "100%", height: "100%" }} />
      </Sequence>
      <Sequence name="Mark (3D)" from={780} durationInFrames={120}>
        <Mark />
      </Sequence>

      {/* Sound design: each clip starts so its measured peak lands one frame after its picture. */}
      {/* dive into the core → 6.0 s (whoosh-cinematic peaks at 2.64 s) */}
      <Audio name="Dive swell" src={staticFile("sfx/whoosh-cinematic.mp3")} from={102} volume={0.29} />
      {/* manifesto lands → 6.0 s (impact-bass-1 peaks at 0.48 s) */}
      <Audio name="Manifesto hit" src={staticFile("sfx/impact-bass-1.mp3")} from={167} volume={0.36} />
      {/* beat changes at 8, 10, 12 s (whooshes peak at 0.16 s) */}
      <Audio name="Beat 2" src={staticFile("sfx/whoosh-short.mp3")} from={236} volume={0.23} />
      <Audio name="Beat 3" src={staticFile("sfx/whoosh.mp3")} from={296} volume={0.25} />
      <Audio name="Beat 4" src={staticFile("sfx/whoosh-short.mp3")} from={356} volume={0.23} />
      {/* red whips away into the orbit → 14 s */}
      <Audio name="Orbit whip" src={staticFile("sfx/whoosh.mp3")} from={416} volume={0.25} />
      {/* name letters in the hero → ~21.7 s */}
      <Audio name="Hero name" src={staticFile("sfx/pop.mp3")} from={651} volume={0.19} />
      {/* dive into the card → 21 s */}
      <Audio name="Card dive" src={staticFile("sfx/whoosh-cinematic.mp3")} from={552} volume={0.25} />
      {/* logo slam → 26 s (impact-bass-2 peaks at 2.06 s) */}
      <Audio name="Logo hit" src={staticFile("sfx/impact-bass-2.mp3")} from={719} volume={0.38} />
    </AbsoluteFill>
  );
};
