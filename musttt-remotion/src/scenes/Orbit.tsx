import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, display } from "../theme";
import { CameraRig, Dust, useTextures } from "../three/shared";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
const inCubic = Easing.bezier(0.55, 0, 1, 0.45);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);

const POSES = ["thumbsup", "pointing", "idea", "hood", "shocked", "thinking", "writing", "welcome"];
const FILES = POSES.map((p) => `poses/${p}.png`);
const CARD_COLORS = [C.accent, C.ink, C.accent, C.ink, C.accent, C.ink, C.accent, C.ink];
const R = 3.1;
const CARD_W = 1.9;
const CARD_H = 1.5;

const Card: React.FC<{ tex: THREE.Texture | undefined; color: string; angle: number; rise: number }> = ({
  tex,
  color,
  angle,
  rise,
}) => {
  const img = tex?.image as HTMLImageElement | undefined;
  const aspect = img ? img.width / img.height : 0.68;
  const imgH = CARD_W / aspect;
  return (
    <group position={[Math.sin(angle) * R, 0.05 + rise, Math.cos(angle) * R]} rotation={[0, angle, 0]}>
      {/* The card: the person stands in it, head popping out above its top edge. */}
      <mesh position={[0, -CARD_H / 2 + 0.05, 0]}>
        <boxGeometry args={[CARD_W, CARD_H, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {tex ? (
        <mesh position={[0, -CARD_H + 0.05 + imgH / 2 - 0.02, 0.045]}>
          <planeGeometry args={[CARD_W, imgH]} />
          <meshBasicMaterial map={tex} transparent alphaTest={0.02} toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
};

export const Orbit: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const textures = useTextures(FILES);

  // The ring spins in fast and settles into a steady turn.
  const spin = interpolate(frame, [0, 40], [2.4, 0], { ...clamp, easing: outExpo });
  const ring = spin - frame * 0.014;

  // Ending: the camera dives into the card in front.
  const camZ = interpolate(frame, [172, 206], [10.6, R + 0.25], { ...clamp, easing: inCubic });
  const camY = interpolate(frame, [0, 60, 172, 206], [1.6, 0.55, 0.55, 0.1], { ...clamp, easing: inOut });

  return (
    <AbsoluteFill style={{ backgroundColor: C.ground }}>
      <ThreeCanvas width={width} height={height}>
        <color attach="background" args={[C.ground]} />
        <fog attach="fog" args={[C.ground, 9, 22]} />
        <CameraRig position={[0, camY, camZ]} lookAt={[0, 0.1, 0]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 6, 8]} intensity={2.2} color="#ffe6cc" />
        <directionalLight position={[-5, 3, -6]} intensity={1.4} color="#9fbfff" />
        <pointLight position={[0, 0.5, 0]} intensity={10} distance={6} color={C.accent} />
        <Dust rotation={frame * 0.002} seed={11} radius={26} opacity={0.6} />
        {/* floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.47, 0]}>
          <circleGeometry args={[7, 96]} />
          <meshStandardMaterial color="#141416" roughness={0.85} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, frame * 0.01]} position={[0, -1.45, 0]}>
          <torusGeometry args={[R, 0.018, 8, 200]} />
          <meshBasicMaterial color={C.accent} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.45, 0]}>
          <torusGeometry args={[R + 0.9, 0.008, 8, 200]} />
          <meshBasicMaterial color={C.smoke} transparent opacity={0.5} />
        </mesh>
        {POSES.map((p, i) => {
          const start = 4 + i * 3;
          const rise = interpolate(frame, [start, start + 26], [-5, 0], { ...clamp, easing: outExpo });
          return (
            <Card
              key={p}
              tex={textures?.[FILES[i]]}
              color={CARD_COLORS[i]}
              angle={ring + (i / POSES.length) * Math.PI * 2}
              rise={rise}
            />
          );
        })}
      </ThreeCanvas>

      {/* Shade bands so the copy reads over the cards. */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to bottom, ${C.ground} 0%, rgba(10,10,11,0) 24%, rgba(10,10,11,0) 74%, ${C.ground} 100%)`,
        }}
      />
      {/* Copy: one line on top, one below, one accent word. */}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 104 }}>
        <div
          style={{
            fontFamily: display,
            fontSize: 88,
            lineHeight: 1,
            color: C.ink,
            opacity: interpolate(frame, [22, 28, 168, 174], [0, 1, 1, 0], clamp),
            filter: `blur(${interpolate(frame, [22, 28], [8, 0], clamp)}px)`,
          }}
        >
          SATU NAMA.
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 104 }}>
        <div style={{ fontFamily: display, fontSize: 88, lineHeight: 1, display: "flex", gap: 26 }}>
          {[
            { w: "SERIBU", c: C.ink, at: 46 },
            { w: "EKSPRESI.", c: C.accent, at: 50 },
          ].map(({ w, c, at }) => (
            <span
              key={w}
              style={{
                color: c,
                opacity: interpolate(frame, [at, at + 4, 168, 174], [0, 1, 1, 0], clamp),
                filter: `blur(${interpolate(frame, [at, at + 4], [6, 0], clamp)}px)`,
              }}
            >
              {w}
            </span>
          ))}
        </div>
      </AbsoluteFill>

      {/* Entry: the manifesto's red ground whips up and away. */}
      <AbsoluteFill
        style={{
          backgroundColor: C.accent,
          translate: `0 ${interpolate(frame, [0, 9], [0, -100], { ...clamp, easing: inCubic })}%`,
        }}
      />
      {/* Exit: inside the card, dip to black for the hero cut. */}
      <AbsoluteFill style={{ backgroundColor: C.ground, opacity: interpolate(frame, [198, 208], [0, 1], clamp) }} />
    </AbsoluteFill>
  );
};
