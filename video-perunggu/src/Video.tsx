import React from "react";
import { AbsoluteFill, Img, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import planJson from "./data/plan.json";
import { Scene } from "./Scene";
import { BigText, ChapterCard, Compare, Counter, Embers, Outro, Stamp, Tag, Timeline, TitleCard, Year } from "./overlays";
import type { Overlay, Plan } from "./types";

export const plan = planJson as unknown as Plan;
export const FPS = plan.fps;
export const TOTAL = Math.round(plan.duration * FPS);

const Grain: React.FC = () => {
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
    case "compare":
      return <Compare />;
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
        const labels = plan.overlays.filter((o) => o.scene === sc.i && o.kind === "label");
        return (
          <Sequence key={sc.i} from={from} durationInFrames={to - from} name={`Adegan ${sc.i}`}>
            <Scene scene={sc} inLen={n === 0 ? 0 : inLen} outLen={outLen} outTrans={next ? next.trans : ""} labels={labels} sceneFrom={from} />
          </Sequence>
        );
      })}
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 58%, rgba(0,0,0,0.38) 100%)", pointerEvents: "none" }}
      />
      <Grain />
      {plan.overlays
        .filter((o) => o.kind !== "label")
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
