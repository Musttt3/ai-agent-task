// GPU-less render check: a lit box, a ground and the ink + lens + bloom + tone + grade chain.
import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass } from "./ink";
import { LensBlur } from "./lensblur";
import { GradeEffect, GRADES } from "./grade";

const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const { scene, camera } = useThree();
  const fx = useMemo(() => ({ ink: new InkPass(scene, camera as THREE.PerspectiveCamera), lens: new LensBlur(), tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), grade: new GradeEffect(GRADES.day) }), [scene, camera]);
  camera.position.set(4 * Math.sin(f / 20), 2, 6); camera.lookAt(0, 0.5, 0);
  fx.lens.focus = 6; fx.lens.cInf = 10;
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 2]} intensity={2} />
      <mesh position={[0, 0.5, 0]}><boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="#c8743a" /></mesh>
      <mesh position={[2, 0.6, -3]}><sphereGeometry args={[0.6, 32, 16]} /><meshLambertMaterial color="#5d8a3a" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[40, 40]} /><meshLambertMaterial color="#d9c9a3" /></mesh>
      <EffectComposer multisampling={4}>
        <primitive object={fx.ink} dispose={null} />
        <primitive object={fx.lens.pre} dispose={null} />
        <primitive object={fx.lens.main} dispose={null} />
        <primitive object={fx.tone} dispose={null} />
        <primitive object={fx.grade} dispose={null} />
      </EffectComposer>
    </>
  );
};

export const SmokeTest: React.FC = () => (
  <AbsoluteFill style={{ background: "#9cc3e6" }}>
    <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false }} camera={{ fov: 40, near: 0.2, far: 500 }}>
      <color attach="background" args={["#9cc3e6"]} />
      <Inner />
    </ThreeCanvas>
  </AbsoluteFill>
);
