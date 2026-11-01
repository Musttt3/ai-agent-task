import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, mono } from "../theme";
import { useLetters } from "../three/Letters";
import { CameraRig, Dust } from "../three/shared";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const inCubic = Easing.bezier(0.55, 0, 1, 0.45);

const WORD = "MUSTTT";
const FLOWER_Y = 0.75;
const WORD_Y = -2.05;

/** The hoodie's flower: warm-white petals around a glowing crimson core, wrapped in smoke rings. */
const Flower: React.FC<{ frame: number }> = ({ frame }) => {
  const grow = interpolate(frame, [0, 45], [0.18, 0.8], { ...clamp, easing: outExpo });
  const open = interpolate(frame, [10, 70], [0.35, 1], { ...clamp, easing: outExpo });
  const petals = 10;
  return (
    <group position={[0, FLOWER_Y, -2]} scale={grow} rotation={[0, 0, frame * 0.012]}>
      {Array.from({ length: petals }).map((_, i) => {
        const a = (i / petals) * Math.PI * 2;
        const r = 1.05 * open;
        return (
          <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * r, -0.1]} rotation={[0, 0, a - Math.PI / 2]} scale={[0.42, 0.95, 0.16]}>
            <sphereGeometry args={[1, 32, 24]} />
            <meshStandardMaterial color={C.ink} roughness={0.55} metalness={0.05} />
          </mesh>
        );
      })}
      <mesh>
        <sphereGeometry args={[0.55, 48, 32]} />
        <meshStandardMaterial color={C.accent} emissive={C.accent} emissiveIntensity={1.4} roughness={0.35} side={2} />
      </mesh>
      {[2.1, 2.6, 3.2].map((r, i) => (
        <mesh key={r} rotation={[1.1 + i * 0.35 + frame * 0.004 * (i + 1), frame * 0.006 * (i % 2 ? -1 : 1), i]}>
          <torusGeometry args={[r, 0.012, 8, 160]} />
          <meshBasicMaterial color={i === 1 ? C.accent : C.smoke} transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
};

export const Genesis: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const letters = useLetters(WORD, 0.92, 0.38);

  // Camera: slow approach, hold, then dive into the crimson core.
  const camZ =
    frame < 145
      ? interpolate(frame, [0, 110], [17, 10.5], { ...clamp, easing: outExpo })
      : interpolate(frame, [145, 178], [10.5, -1.75], { ...clamp, easing: inCubic });
  const camX = interpolate(frame, [0, 110, 145], [1.6, 0.25, 0], { ...clamp, easing: inOut });
  const camY = interpolate(frame, [0, 110, 145, 172], [1.0, -0.35, -0.35, FLOWER_Y], { ...clamp, easing: inOut });
  const lookY = interpolate(frame, [145, 165], [-0.35, FLOWER_Y], { ...clamp, easing: inOut });

  return (
    <AbsoluteFill style={{ backgroundColor: C.ground }}>
      <ThreeCanvas width={width} height={height}>
        <color attach="background" args={[C.ground]} />
        <fog attach="fog" args={[C.ground, 16, 48]} />
        <CameraRig position={[camX, camY, camZ]} lookAt={[0, lookY, -2]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 6, 8]} intensity={2.4} color="#ffe6cc" />
        <directionalLight position={[-6, 2, -5]} intensity={1.6} color="#9fbfff" />
        <pointLight position={[0, FLOWER_Y, -1.2]} intensity={5} distance={2.6} color={C.accent} />
        <Dust rotation={frame * 0.0025} />
        <Flower frame={frame} />
        {letters.map((l, i) => {
          const start = 42 + i * 6;
          const p = interpolate(frame, [start, start + 28], [0, 1], { ...clamp, easing: outExpo });
          const s = interpolate(frame, [140, 168], [0, 1], { ...clamp, easing: inCubic });
          const dir = i % 2 ? 1 : -1;
          const x = l.x * (1 + (1 - p) * 2.2) + l.x * s * 2.6;
          const y = WORD_Y + (1 - p) * dir * 2.5 + s * dir * 2.4;
          const z = 0.6 - (1 - p) * 36 + s * 7;
          const isT = l.char === "T";
          return (
            <mesh
              key={i}
              geometry={l.geometry}
              position={[x, y, z]}
              rotation={[(1 - p) * dir * 1.2 + s * dir, (1 - p) * Math.PI * 1.5 + s * 1.4 * dir, 0]}
            >
              <meshStandardMaterial
                color={isT ? C.accent : C.ink}
                metalness={0.3}
                roughness={0.38}
                emissive={isT ? C.accent : "#000000"}
                emissiveIntensity={isT ? 0.25 : 0}
              />
            </mesh>
          );
        })}
      </ThreeCanvas>
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 108 }}>
        <div
          style={{
            fontFamily: mono,
            fontSize: 34,
            letterSpacing: "0.35em",
            color: C.ink,
            opacity: interpolate(frame, [92, 98, 136, 142], [0, 1, 1, 0], clamp),
            filter: `blur(${interpolate(frame, [92, 98], [8, 0], clamp)}px)`,
          }}
        >
          DIGITAL CREATOR
        </div>
      </AbsoluteFill>
      {/* Inside the core: the frame floods crimson and cuts to the manifesto's red ground. */}
      <AbsoluteFill style={{ backgroundColor: C.accent, opacity: interpolate(frame, [168, 177], [0, 1], clamp) }} />
    </AbsoluteFill>
  );
};
