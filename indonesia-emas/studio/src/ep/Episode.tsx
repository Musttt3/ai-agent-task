// "Indonesia Emas" — Blender sets + characters (exported glb) rendered with three.js inside Remotion.
// Post: depth of field (focus from the Blender camera) -> AgX tone mapping (as in Blender) -> SMAA.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { DepthOfFieldEffect, ToneMappingEffect, ToneMappingMode, SMAAEffect } from "postprocessing";
import { loadAll, Loaded, World } from "./world";
import { direct } from "./direction";
import { shotAt, TOTAL } from "./timing";
import { Screen, drawTV, drawPhone, setGeo } from "./screens";

export const EPISODE_FRAMES = TOTAL;
const props = () => (getInputProps() as { exposure?: number; dof?: boolean });

const Inner: React.FC<{ L: Loaded }> = ({ L }) => {
  const f = useCurrentFrame();
  const { camera, scene, gl } = useThree();
  const world = useMemo(() => new World(L, gl), [L, gl]);
  const screens = useMemo(() => {
    const tv = new Screen(512, 288), ph = new Screen(270, 540);
    for (const [set, mat, s, node] of [["kamar", "Layar_TV", tv, "TV_Layar"], ["kota", "Layar_HP", ph, "HP_Layar"]] as const) {
      for (const m of world.sets[set].mats.get(mat) ?? []) { m.map = s.tex; m.emissiveMap = s.tex; m.emissive.set(0xffffff); m.color.set(0xffffff); m.needsUpdate = true; }
      // planar UVs across the screen face (the box had per-face cube UVs)
      const o = world.sets[set].nodes.get(node) as THREE.Mesh | undefined;
      if (o?.geometry) {
        const g = o.geometry, p = g.attributes.position; g.computeBoundingBox(); const bb = g.boundingBox!;
        const size = bb.getSize(new THREE.Vector3()); const axes = [0, 1, 2].sort((i, j) => size.getComponent(j) - size.getComponent(i)); // two largest
        const [ua, va] = size.getComponent(0) > size.getComponent(1) || axes[0] === 0 ? [axes[0], axes[1]] : [axes[1], axes[0]];
        const uv = new Float32Array(p.count * 2);
        for (let i = 0; i < p.count; i++) {
          const v = new THREE.Vector3().fromBufferAttribute(p, i);
          const u = (v.getComponent(ua) - bb.min.getComponent(ua)) / size.getComponent(ua);
          uv[i * 2] = node === "TV_Layar" ? 1 - u : u;
          uv[i * 2 + 1] = 1 - (v.getComponent(va) - bb.min.getComponent(va)) / size.getComponent(va);
        }
        g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      }
    }
    return { tv, ph };
  }, [world]);
  const fx = useMemo(() => ({
    dof: new DepthOfFieldEffect(camera, { worldFocusDistance: 3, worldFocusRange: 1.5, bokehScale: 2.5, resolutionScale: 0.5 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.AGX }),
    smaa: new SMAAEffect(),
  }), [camera]);
  const shot = shotAt(f);
  const cam = camera as THREE.PerspectiveCamera;
  const r = world.update(f, shot, cam, scene);
  direct({ f, shot, cam, W: world });
  if (shot.set === "kamar") drawTV(screens.tv, f);
  if (shot.set === "kota") drawPhone(screens.ph, f);
  // thin-lens-ish: in-focus range grows with distance and f-stop
  fx.dof.cocMaterial.worldFocusDistance = r.focus;
  fx.dof.cocMaterial.worldFocusRange = Math.max(0.25, r.focus * r.fstop * 0.06);
  gl.toneMappingExposure = props().exposure ?? 1.0;
  return (
    <>
      <primitive object={world.root} dispose={null} />
      <EffectComposer multisampling={0}>
        {props().dof === false ? <></> : <primitive object={fx.dof} dispose={null} />}
        <primitive object={fx.tone} dispose={null} />
        <primitive object={fx.smaa} dispose={null} />
      </EffectComposer>
    </>
  );
};

export const Episode: React.FC = () => {
  const [L, setL] = useState<Loaded | null>(null);
  const [handle] = useState(() => delayRender("load sets + characters", { timeoutInMilliseconds: 600000 }));
  useEffect(() => {
    Promise.all([loadAll(), fetch(staticFile("export/indonesia_50m.geojson")).then((r) => r.json())]).then(([l, geo]) => { setGeo(geo); setL(l); continueRender(handle); });
  }, [handle]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {L && (
        <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, toneMapping: THREE.NoToneMapping }} camera={{ fov: 40, near: 0.05, far: 800 }}>
          <Inner L={L} />
        </ThreeCanvas>
      )}
    </AbsoluteFill>
  );
};
