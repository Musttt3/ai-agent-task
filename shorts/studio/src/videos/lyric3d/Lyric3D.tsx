// 3D lyric piece, 1080x1080: the supplied photo exactly as it is (no crop, no grade, no motion) with 3D type,
// 3D icons and a HyperFrames-rendered overlay (now-playing card, equaliser, sparkles) on top. Length = the track.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { AbsoluteFill, Audio, Img, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { END, Kit, World, loadKit } from "./scene";

export const LYRIC3D_FRAMES = Math.ceil(END * 30);

type Props = { audio?: boolean; hf?: boolean };
const props = (): Props => ({ audio: true, hf: true, ...(getInputProps() as Props) });

const Inner: React.FC<{ kit: Kit }> = ({ kit }) => {
  const f = useCurrentFrame();
  const { camera, gl, scene } = useThree();
  const world = useMemo(() => new World(kit), [kit]);
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.75;
    scene.background = null;
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1.05;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.setClearColor(0x000000, 0);
  }, [gl, scene]);
  world.update(f / 30, camera as THREE.PerspectiveCamera);
  return <primitive object={world.root} dispose={null} />;
};

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("lyric3d kit", { timeoutInMilliseconds: 120000 }));
  useEffect(() => { loadKit().then((k) => { setKit(k); continueRender(handle); }); }, [handle]);
  return kit;
};

export const Lyric3D: React.FC = () => {
  const f = useCurrentFrame();
  const kit = useKit();
  const on = useMemo(props, []);
  const hfFrame = `lyric3d/hf/frame_${String(Math.min(f + 1, 774)).padStart(6, "0")}.png`;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Img src={staticFile("lyric3d/photo.jpg")} style={{ width: 1080, height: 1080 }} />
      {kit && (
        <ThreeCanvas width={1080} height={1080} style={{ position: "absolute", inset: 0 }} shadows
          gl={{ alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: true }}
          camera={{ fov: 30, near: 0.1, far: 100, position: [0, 0, 10] }}>
          <Inner kit={kit} />
        </ThreeCanvas>
      )}
      {on.hf && <Img src={staticFile(hfFrame)} style={{ position: "absolute", inset: 0, width: 1080, height: 1080 }} />}
      {on.audio && <Audio src={staticFile("lyric3d/music.mp3")} />}
    </AbsoluteFill>
  );
};
