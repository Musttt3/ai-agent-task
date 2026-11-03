// "Breathe": a 3D motion piece built from one triptych photo (three waterfall panels, a person with open arms) and
// the supplied track. Length = the track (25.78 s). Panels are depth-displaced planes hinged like altar doors; the
// person is a cut-out layer standing on still water. All motion is cut to the track's kicks and hats (audio.json).
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { World, Kit, loadKit } from "./scene";
import { FPS, TOTAL_FRAMES, stateAt } from "./timeline";
import { FxEffect, GradeEffect, makeBloom } from "./post";

export const WATERFALL_FRAMES = TOTAL_FRAMES;

type Props = { audio?: boolean; post?: boolean; hide?: string[]; bloom?: boolean };
const props = (): Props => ({ audio: true, post: true, ...(getInputProps() as Props) });

const Inner: React.FC<{ kit: Kit }> = ({ kit }) => {
  const f = useCurrentFrame();
  const { camera, size } = useThree();
  const world = useMemo(() => new World(kit), [kit]);
  const on = useMemo(props, []);
  const fx = useMemo(() => ({ fx: new FxEffect(), bloom: makeBloom(), grade: new GradeEffect() }), []);
  const post = useMemo(
    () =>
      on.post ? (
        <EffectComposer multisampling={4} frameBufferType={THREE.HalfFloatType}>
          <primitive object={fx.fx} dispose={null} />
          {on.bloom === false ? <></> : <primitive object={fx.bloom} dispose={null} />}
          <primitive object={fx.grade} dispose={null} />
        </EffectComposer>
      ) : (
        <></>
      ),
    [fx, on],
  );
  const t = f / FPS;
  const s = stateAt(t);
  world.update(s, camera as THREE.PerspectiveCamera, f, size.height);
  for (const h of on.hide ?? []) {
    const o = (world as unknown as Record<string, THREE.Object3D>)[h];
    if (o) o.visible = false;
    if (h === "refl") world.rigs.forEach((r) => (r.refl.visible = false));
    if (h === "doors") [0, 2].forEach((i) => (world.rigs[i].mesh.visible = false));
  }
  fx.fx.set(s.blur, s.ca);
  fx.grade.set({ exposure: s.exposure, flash: s.flash, fade: s.fade, time: t });
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("waterfall kit", { timeoutInMilliseconds: 120000 }));
  useEffect(() => {
    loadKit().then((k) => { setKit(k); continueRender(handle); });
  }, [handle]);
  return kit;
};

export const Waterfall: React.FC = () => {
  const kit = useKit();
  const on = useMemo(props, []);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {kit && (
        <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }}
          camera={{ fov: 38, near: 0.03, far: 200, position: [0, 0, 9] }}>
          <Inner kit={kit} />
        </ThreeCanvas>
      )}
      {on.audio && <Audio src={staticFile("waterfall/music.mp3")} />}
    </AbsoluteFill>
  );
};
