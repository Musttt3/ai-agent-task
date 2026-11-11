import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { moveFor, SHAKE, Trans, TRANSITIONS } from "./edit";
import { clamp, COLORS, easeIn, easeInOut, easeOut, f, H, SHOTS, shotEnd, TOTAL_FRAMES, W } from "./lib";

// source pictures are 1376x768; cover 1920x1080
const IMG_W = Math.ceil((1080 * 1376) / 768);
const IMG_LEFT = (W - IMG_W) / 2;

/** frames a transition borrows on each side of its cut (flash/dip are pure overlays). */
const pad = (t?: Trans) => (!t || t.type === "flash" || t.type === "dip" ? 0 : Math.ceil(t.dur / 2));

type Props = { n: number; from: number; startF: number; endF: number; tin?: Trans; tout?: Trans };

const kenBurns = (n: number, p: number) => {
  const m = moveFor(n);
  const e = easeInOut(p) * 0.35 + p * 0.65; // mostly linear, soft ends
  switch (m) {
    case "in":
      return { s: 1.0 + 0.075 * e, x: 0, y: 0 };
    case "out":
      return { s: 1.075 - 0.075 * e, x: 0, y: 0 };
    case "left":
      return { s: 1.08, x: 40 - 80 * e, y: 0 };
    case "right":
      return { s: 1.08, x: -40 + 80 * e, y: 0 };
    case "up":
      return { s: 1.07 + 0.02 * e, x: 0, y: 18 - 36 * e };
    default:
      return { s: 1.0, x: 0, y: 0 };
  }
};

const shake = (n: number, frame: number, startF: number, endF: number) => {
  const k = SHAKE[n];
  if (!k) return { x: 0, y: 0, r: 0 };
  const env = interpolate(frame, [startF, startF + 6, endF - 8, endF], [0.3, 1, 1, 0.2], clamp);
  const a = 7 * k * env;
  return {
    x: a * (Math.sin(frame * 1.9) * 0.6 + Math.sin(frame * 3.7 + 1.3) * 0.4),
    y: a * (Math.sin(frame * 2.3 + 0.7) * 0.6 + Math.sin(frame * 4.1 + 2.1) * 0.4),
    r: 0.25 * k * env * Math.sin(frame * 1.3 + 0.4),
  };
};

/** style contribution of a transition for one side of the cut. p runs 0..1 over the window. */
type TS = React.CSSProperties & { ring?: number; edge?: number };
const transStyle = (t: Trans, role: "in" | "out", p: number): TS => {
  const dir = t.dir ?? 1;
  switch (t.type) {
    case "whip": {
      const o = easeInOut(p) * W;
      const blur = 26 * Math.sin(Math.PI * p);
      return {
        translate: role === "out" ? `${-dir * o}px 0px` : `${dir * (W - o)}px 0px`,
        filter: `blur(${blur.toFixed(1)}px)`,
      };
    }
    case "zoom":
      if (role === "out")
        return { scale: String(1 + 0.9 * easeIn(p)), filter: `blur(${(18 * easeIn(p)).toFixed(1)}px)` };
      return {
        opacity: interpolate(p, [0.3, 0.6], [0, 1], clamp),
        scale: String(interpolate(p, [0.3, 1], [1.5, 1], { ...clamp, easing: easeOut })),
        filter: `blur(${interpolate(p, [0.35, 1], [16, 0], clamp).toFixed(1)}px)`,
      };
    case "spin":
      if (role === "out")
        return {
          rotate: `${40 * easeIn(p)}deg`,
          scale: String(1 + 1.2 * easeIn(p)),
          filter: `blur(${(22 * easeIn(p)).toFixed(1)}px)`,
        };
      return {
        opacity: interpolate(p, [0.35, 0.6], [0, 1], clamp),
        rotate: `${interpolate(p, [0.35, 1], [-40, 0], { ...clamp, easing: easeOut })}deg`,
        scale: String(interpolate(p, [0.35, 1], [2.0, 1], { ...clamp, easing: easeOut })),
        filter: `blur(${interpolate(p, [0.35, 1], [20, 0], clamp).toFixed(1)}px)`,
      };
    case "iris": {
      if (role === "out") return { scale: String(1 + 0.05 * p) };
      const r = interpolate(p, [0, 1], [0, 1200], { ...clamp, easing: easeInOut });
      return { clipPath: `circle(${r}px at 50% 50%)`, ring: r };
    }
    case "wipe": {
      if (role === "out") return { translate: `${-dir * 120 * easeInOut(p)}px 0px` };
      const s = 220; // slant of the wipe edge
      const e = interpolate(p, [0, 1], [-s, W + s], { ...clamp, easing: easeInOut });
      const poly =
        dir === 1
          ? `polygon(0px 0px, ${e + s}px 0px, ${e - s}px ${H}px, 0px ${H}px)`
          : `polygon(${W - e - s}px 0px, ${W}px 0px, ${W}px ${H}px, ${W - e + s}px ${H}px)`;
      return { clipPath: poly, edge: dir * e };
    }
    case "dissolve":
      return role === "in" ? { opacity: easeInOut(p) } : {};
    default:
      return {};
  }
};

const Shot: React.FC<Props> = ({ n, from, startF, endF, tin, tout }) => {
  const frame = useCurrentFrame() + from;
  const kb = kenBurns(n, interpolate(frame, [startF, endF], [0, 1], clamp));
  const sh = shake(n, frame, startF, endF);

  let st: TS = {};
  if (tin && pad(tin) && frame < startF + pad(tin)) {
    st = transStyle(tin, "in", (frame - (startF - tin.dur / 2)) / tin.dur);
  } else if (tout && pad(tout) && frame >= endF - pad(tout)) {
    st = transStyle(tout, "out", (frame - (endF - tout.dur / 2)) / tout.dur);
  }
  const { ring, edge, ...wrap } = st;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ ...wrap, backgroundColor: COLORS.ink }}>
        <AbsoluteFill
          style={{
            translate: `${kb.x + sh.x}px ${kb.y + sh.y}px`,
            scale: String(kb.s),
            rotate: `${sh.r}deg`,
          }}
        >
          <Img
            src={staticFile(`img/${SHOTS[n - 1].img}`)}
            style={{ position: "absolute", left: IMG_LEFT, top: 0, width: IMG_W, height: H }}
          />
        </AbsoluteFill>
      </AbsoluteFill>
      {ring !== undefined && ring > 0 && ring < 1190 ? (
        <div
          style={{
            position: "absolute",
            left: W / 2 - ring,
            top: H / 2 - ring,
            width: ring * 2,
            height: ring * 2,
            borderRadius: "50%",
            border: `12px solid ${COLORS.ink}`,
            boxSizing: "border-box",
          }}
        />
      ) : null}
      {edge !== undefined ? (
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          {edge >= 0 ? (
            <line x1={edge + 220} y1={0} x2={edge - 220} y2={H} stroke={COLORS.ink} strokeWidth={14} />
          ) : (
            <line x1={W + edge - 220} y1={0} x2={W + edge + 220} y2={H} stroke={COLORS.ink} strokeWidth={14} />
          )}
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

export const Shots: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      {SHOTS.map((s) => {
        const n = s.i;
        const startF = f(s.start);
        const endF = n < SHOTS.length ? f(shotEnd(n)) : TOTAL_FRAMES;
        const tin = TRANSITIONS[n];
        const tout = TRANSITIONS[n + 1];
        const from = Math.max(0, startF - pad(tin));
        const to = Math.min(TOTAL_FRAMES, endF + pad(tout));
        return (
          <Sequence key={n} from={from} durationInFrames={to - from} layout="none">
            <Shot n={n} from={from} startF={startF} endF={endF} tin={tin} tout={tout} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

/** White flashes and dips to black, drawn over the pictures. */
export const CutOverlays: React.FC = () => {
  const frame = useCurrentFrame();
  let white = 0;
  let black = 0;
  for (const [k, t] of Object.entries(TRANSITIONS)) {
    if (t.type !== "flash" && t.type !== "dip") continue;
    const c = f(SHOTS[Number(k) - 1].start);
    if (Math.abs(frame - c) > t.dur) continue;
    if (t.type === "flash") {
      const a = Math.round(t.dur * 0.25);
      white = Math.max(white, interpolate(frame, [c - a, c, c + t.dur - a], [0, 1, 0], { ...clamp, easing: easeOut }));
    } else {
      const h = Math.round(t.dur / 2);
      black = Math.max(black, interpolate(frame, [c - h, c, c + h], [0, 1, 0], { ...clamp, easing: easeInOut }));
    }
  }
  // fade to black at the end
  black = Math.max(black, interpolate(frame, [TOTAL_FRAMES - 30, TOTAL_FRAMES - 4], [0, 1], clamp));
  return (
    <>
      {black > 0 ? <AbsoluteFill style={{ backgroundColor: "#000", opacity: black }} /> : null}
      {white > 0 ? <AbsoluteFill style={{ backgroundColor: "#fffdf5", opacity: white }} /> : null}
    </>
  );
};
