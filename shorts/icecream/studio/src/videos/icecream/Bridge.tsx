// "Es Krim di Zaman Purba": 16:9 2D-in-3D Remotion video (2d-in-3d-animation-agent template)
// Full post chain: InkPass -> LensBlur (pre + main) -> [Bloom + NEUTRAL tone map + Grade], MSAA 4 + Kinetic Comic Captions.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BlendFunction,
  BloomEffect,
  Effect,
  EffectComposer as PostEffectComposer,
  EffectPass,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
} from "postprocessing";
import { World } from "./world";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur, GrainEffect } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./grade";
import { Kit } from "./build";
import { END, RANGES, beatAt, FLASHES, dofAt } from "./story";

export const ICECREAM_FRAMES = END;

type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean };
const toggles = (): PostToggles => ({
  ink: true,
  lens: true,
  pre: true,
  bloom: true,
  grade: true,
  grain: false,
  ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}),
});

const makeBloom = () => {
  const b = new BloomEffect({
    blendFunction: BlendFunction.ADD,
    intensity: 0.5,
    luminanceThreshold: 1.0,
    luminanceSmoothing: 0.2,
    mipmapBlur: true,
    levels: 6,
    radius: 0.6,
  });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => { const k = 1080 / Math.max(1, Math.min(w, h)); setSize(Math.round(w * k), Math.round(h * k)); };
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3(), glSize = new THREE.Vector2();
const EMPTY_KIT: Kit = {};

const Inner: React.FC<{ kit: Kit }> = ({ kit }) => {
  const f = useCurrentFrame();
  const { gl, camera, scene } = useThree();
  const world = useMemo(() => new World(kit), [kit]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);

  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.night, GRADE_STRENGTH.night),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }),
  }), [camera, scene]);

  const composer = useMemo(() => {
    gl.toneMapping = THREE.NoToneMapping;
    const c = new PostEffectComposer(gl, { multisampling: 4, frameBufferType: THREE.HalfFloatType });
    c.addPass(new RenderPass(scene, camera));
    if (on.ink) c.addPass(fx.ink);
    if (on.lens && on.pre) c.addPass(new EffectPass(camera, fx.lens.pre));
    if (on.lens) c.addPass(new EffectPass(camera, fx.lens.main));
    const tail: Effect[] = [];
    if (on.bloom) tail.push(fx.bloom);
    tail.push(fx.tone);
    if (on.grade) tail.push(fx.grade);
    if (on.grain) tail.push(fx.grain);
    c.addPass(new EffectPass(camera, ...tail));
    return c;
  }, [gl, scene, camera, fx, on]);

  useEffect(() => () => {
    composer.dispose();
    fx.ink.dispose();
  }, [composer, fx]);

  const syncFrame = (frame: number) => {
    const cam = camera as THREE.PerspectiveCamera;
    const id = beatAt(frame);
    target.copy(world.update(id, frame, cam, scene));
    noInkFallback(world.root);
    const d = dofAt(id, frame);
    cam.getWorldDirection(fwd);
    fpt.copy(target);
    fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
    fx.lens.cInf = d.cInf;
    gradeFor(fx.grade, RANGES[id].beat.light);
    fx.grain.seed = frame;
  };

  syncFrame(f);

  useFrame((_, delta) => {
    syncFrame(f);
    gl.getSize(glSize);
    composer.setSize(glSize.width, glSize.height);
    gl.autoClear = true;
    composer.render(delta || 1 / 30);
  }, 1);

  return <primitive object={world.root} dispose={null} />;
};

const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;

const ShotView: React.FC<{ kit: Kit }> = ({ kit }) => (
  <AbsoluteFill>
    <ThreeCanvas
      width={1920}
      height={1080}
      {...(dprOverride() ? { dpr: dprOverride() } : {})}
      shadows
      gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 30, near: 0.1, far: 1500 }}
    >
      <Inner kit={kit} />
    </ThreeCanvas>
  </AbsoluteFill>
);

/** Poppins Black must be loaded before any sign or badge canvas is painted */
const useFont = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("poppins"));
  useEffect(() => {
    const ff = new FontFace("PoppinsBlack", `url(${staticFile("Poppins-Black.woff2")}) format("woff2")`, { weight: "900" });
    ff.load().then((x) => { (document.fonts as unknown as { add: (f: FontFace) => void }).add(x); setReady(true); continueRender(handle); })
      .catch(() => { setReady(true); continueRender(handle); });
  }, [handle]);
  return ready;
};

export const IceCreamShort: React.FC = () => {
  const f = useCurrentFrame();
  const ready = useFont();
  const on = (getInputProps() as { post?: { audio?: boolean } }).post?.audio !== false;
  let flash = 0;
  for (const a of FLASHES) if (f >= a && f < a + 4) flash = [1, 0.75, 0.45, 0.2][f - a];
  const fade = Math.min(1, Math.max(0, (f - (END - 14)) / 12));
  return (
    <AbsoluteFill style={{ backgroundColor: "#140b2e" }}>
      {ready && <ShotView kit={EMPTY_KIT} />}
      {flash > 0 && <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: flash }} />}
      {fade > 0 && <AbsoluteFill style={{ backgroundColor: "#000000", opacity: fade }} />}
      {on && END > 14000 && <Audio src={staticFile("icecream_mix.wav")} />}
    </AbsoluteFill>
  );
};
