import React from "react";
import { AbsoluteFill, Img, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import planJson from "./data/plan.json";
import { Scene } from "./Scene";
import { Arrival, Bursts, Converge, Crossout, CrownDrop, Fleet, Heartbreak, Hourglass, IconsRow, Notif, Swarm, Ticker } from "./motion";
import { BigText, ChapterCard, Compare, Counter, Embers, Outro, Stamp, Tag, Timeline, TitleCard, Year } from "./overlays";
import type { Overlay, Plan } from "./types";

export const plan = planJson as unknown as Plan;
const ATTACHED = ["label", "pin", "route"];
export const FPS = plan.fps;
export const TOTAL = Math.round(plan.duration * FPS);

const FadeOut: React.FC = () => {
  const f = useCurrentFrame();
  const o = Math.min(1, Math.max(0, (f - (TOTAL - 45)) / 45));
  return o > 0 ? <AbsoluteFill style={{ backgroundColor: "black", opacity: o }} /> : null;
};

export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const x = Math.floor(random(`gx${f}`) * 256);
  const y = Math.floor(random(`gy${f}`) * 256);
  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity: 0.07, mixBlendMode: "overlay" }}>
      <Img src={staticFile("grain.png")} style={{ position: "absolute", left: -x, top: -y, width: 2304, height: 1408 }} />
    </AbsoluteFill>
  );
};

const renderOverlay = (o: Overlay) => {
  switch (o.kind) {
    case "notif":
      return <Notif o={o} />;
    case "ticker":
      return <Ticker o={o} />;
    case "title":
      return <TitleCard o={o} />;
    case "chapter":
      return <ChapterCard o={o} />;
    case "tag":
      return <Tag o={o} />;
    case "big":
      return <BigText o={o} />;
    case "counter":
      return <Counter o={o} />;
    case "stamp":
      return <Stamp o={o} />;
    case "year":
      return <Year o={o} />;
    case "embers":
      return <Embers />;
    case "timeline":
      return <Timeline o={o} />;
    case "icons":
      return <IconsRow o={o} />;
    case "fleet":
      return <Fleet o={o} />;
    case "converge":
      return <Converge o={o} />;
    case "swarm":
      return <Swarm o={o} />;
    case "bursts":
      return <Bursts o={o} />;
    case "crossout":
      return <Crossout o={o} />;
    case "heartbreak":
      return <Heartbreak o={o} />;
    case "hourglass":
      return <Hourglass o={o} />;
    case "crown":
      return <CrownDrop o={o} />;
    case "flagdrop":
      return <Arrival o={o} />;
    case "compare":
      return <Compare o={o} />;
    case "outro":
      return <Outro o={o} />;
    default:
      return null;
  }
};

export const IndonesiaVideo: React.FC = () => {
  const scenes = plan.scenes;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {scenes.map((sc, n) => {
        const inLen = sc.tlen;
        const next = scenes[n + 1];
        const outLen = next ? next.tlen : 0;
        const s = Math.round(sc.start * FPS);
        const e = next ? Math.round(next.start * FPS) : TOTAL;
        const from = Math.max(0, s - Math.floor(inLen / 2));
        const to = Math.min(TOTAL, e + Math.ceil(outLen / 2));
        const labels = plan.overlays.filter((o) => o.scene === sc.i && ATTACHED.includes(o.kind));
        return (
          <Sequence key={sc.i} from={from} durationInFrames={to - from} name={`Adegan ${sc.i}`}>
            <Scene scene={sc} inLen={n === 0 ? 0 : inLen} outLen={outLen} outTrans={next ? next.trans : ""} labels={labels} sceneFrom={from} />
          </Sequence>
        );
      })}
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 58%, rgba(0,0,0,0.38) 100%)", pointerEvents: "none" }}
      />
      <FadeOut />
      {plan.overlays
        .filter((o) => !ATTACHED.includes(o.kind))
        .map((o, k) => (
          <Sequence
            key={k}
            from={Math.round(o.start * FPS)}
            durationInFrames={Math.min(Math.round(o.dur * FPS), TOTAL - Math.round(o.start * FPS))}
            name={`${o.kind} ${o.text ?? o.title ?? ""}`}
          >
            {renderOverlay(o)}
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};
