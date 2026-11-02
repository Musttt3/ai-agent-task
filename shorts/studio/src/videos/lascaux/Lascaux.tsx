// "Lukisan yang Hampir Mati karena Napas": our original short about the Lascaux cave in the cartoon-3d-short look.
// One three.js world (world.ts) posed per frame from the word-timed shot plan (story.ts). Post chain as in the skill:
// ink (own pass) -> lens blur pre + main -> bloom (emissive only) -> NEUTRAL tone map -> grade, MSAA 4.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World, loadKit, Kit } from "./world";
import { InkPass } from "./ink";
import { LensBlur } from "./lensblur";
import { GradeEffect, gradeFor } from "./grade";
import { TOTAL, FLASH_AT } from "./story";

export const LASCAUX_FRAMES = TOTAL;

type Toggles = { ink: boolean; lens: boolean; bloom: boolean; grade: boolean; audio: boolean };
const toggles = (): Toggles => ({ ink: true, lens: true, bloom: true, grade: true, audio: true, ...((getInputProps() as { post?: Partial<Toggles> }).post ?? {}) });

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const Inner: React.FC<{ kit: Kit }> = ({ kit }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(kit), [kit]);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect({ ky: [0, 0.1, 0.28, 0.6, 0.835, 0.945, 1], sat: [1, 1.05, 1], tintS: [0, 0], tintM: [0, 0], tintH: [0, 0], vig: [0.12, 0.45] }),
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const post = useMemo(() => (
    <EffectComposer multisampling={4}>
      {on.ink ? <primitive object={fx.ink} dispose={null} /> : <></>}
      {on.lens ? <primitive object={fx.lens.pre} dispose={null} /> : <></>}
      {on.lens ? <primitive object={fx.lens.main} dispose={null} /> : <></>}
      {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : <></>}
      <primitive object={fx.tone} dispose={null} />
      {on.grade ? <primitive object={fx.grade} dispose={null} /> : <></>}
    </EffectComposer>
  ), [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  const { focus, shot } = world.update(f, cam, scene);
  cam.getWorldDirection(fwd);
  fpt.set(...focus);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = shot.cInf;
  gradeFor(fx.grade, shot.grade);
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("lascaux kit"));
  useEffect(() => { loadKit().then((k) => { setKit(k); continueRender(handle); }); }, [handle]);
  return kit;
};

const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;

export const LascauxShort: React.FC = () => {
  const f = useCurrentFrame();
  const kit = useKit();
  const on = useMemo(toggles, []);
  const flash = f >= FLASH_AT && f < FLASH_AT + 4 ? [1, 0.75, 0.45, 0.2][f - FLASH_AT] : 0;
  const fadeOut = Math.min(1, Math.max(0, (f - (TOTAL - 14)) / 12));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {kit && (
        <ThreeCanvas width={1080} height={1920} {...(dprOverride() ? { dpr: dprOverride() } : {})} gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
          camera={{ fov: 40, near: 0.1, far: 1500 }}>
          <Inner kit={kit} />
        </ThreeCanvas>
      )}
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      {fadeOut > 0 && <AbsoluteFill style={{ background: "#000", opacity: fadeOut }} />}
      {on.audio && <Audio src={staticFile("audio/mix.wav")} />}
    </AbsoluteFill>
  );
};
