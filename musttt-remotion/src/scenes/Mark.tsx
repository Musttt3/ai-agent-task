import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, mono } from "../theme";
import { useLetters } from "../three/Letters";
import { CameraRig, Dust } from "../three/shared";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const springy = Easing.spring({ damping: 14 });

export const Mark: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const letters = useLetters("MUSTTT", 0.95, 0.5);

  const camX = interpolate(frame, [0, 46], [2.6, 0], { ...clamp, easing: inOut });
  const camY = interpolate(frame, [0, 46], [1.3, 0.15], { ...clamp, easing: inOut });
  const camZ = interpolate(frame, [0, 46], [8.6, 10], { ...clamp, easing: inOut });
  // The light travels, the logo stays still: highlights sweep across the letters.
  const sweep = interpolate(frame, [20, 120], [-7, 7], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: C.ground }}>
      <ThreeCanvas width={width} height={height}>
        <color attach="background" args={[C.ground]} />
        <CameraRig position={[camX, camY, camZ]} lookAt={[0, 0.15, 0]} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[4, 5, 8]} intensity={1.8} color="#ffe6cc" />
        <directionalLight position={[-6, 1, -4]} intensity={2.2} color={C.accent} />
        <pointLight position={[sweep, 1.2, 2.2]} intensity={22} distance={9} color="#ffffff" />
        <Dust rotation={frame * 0.002} seed={23} radius={24} opacity={0.5} />
        <mesh position={[0, 0.15, -2.4]} rotation={[0, 0, frame * 0.004]}>
          <torusGeometry args={[3.25, 0.02, 8, 220]} />
          <meshBasicMaterial color={C.accent} />
        </mesh>
        <mesh position={[0, 0.15, -2.6]} rotation={[0, 0, -frame * 0.003]}>
          <torusGeometry args={[3.55, 0.008, 8, 220]} />
          <meshBasicMaterial color={C.smoke} transparent opacity={0.6} />
        </mesh>
        {letters.map((l, i) => {
          const start = 2 + i * 3;
          const p = interpolate(frame, [start, start + 22], [0, 1], { ...clamp, easing: springy });
          const isT = l.char === "T";
          return (
            <mesh
              key={i}
              geometry={l.geometry}
              position={[l.x, 0.35 - (1 - p) * 0.9, 0]}
              rotation={[(1 - p) * -Math.PI / 2, 0, 0]}
              scale={interpolate(p, [0, 1], [0.6, 1])}
            >
              <meshStandardMaterial
                color={isT ? C.accent : C.ink}
                metalness={0.3}
                roughness={0.38}
              />
            </mesh>
          );
        })}
      </ThreeCanvas>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 250 }}>
        <div
          style={{
            fontFamily: mono,
            fontWeight: 700,
            fontSize: 52,
            color: C.ink,
            opacity: interpolate(frame, [36, 42], [0, 1], clamp),
            filter: `blur(${interpolate(frame, [36, 42], [8, 0], { ...clamp, easing: outExpo })}px)`,
          }}
        >
          @musttt
        </div>
      </AbsoluteFill>
      {/* Cut-in flash, and a short fade to black at the very end. */}
      <AbsoluteFill style={{ backgroundColor: C.ink, opacity: interpolate(frame, [0, 4], [0.9, 0], clamp) }} />
      <AbsoluteFill style={{ backgroundColor: C.ground, opacity: interpolate(frame, [110, 119], [0, 1], clamp) }} />
    </AbsoluteFill>
  );
};
