// Character check sheet: every cast member and the hero's expressions/props, drawn straight onto a DOM canvas.
import React, { useEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen, bodyFront, Outfit, FrontOpts } from "./toon";
import { HERO, sailor, settler, native, digger } from "./cast";

const CELLS: [Outfit, Partial<FrontOpts>][] = [
  [HERO, { expr: "grin", mode: "stand" }], [HERO, { expr: "nervous", mode: "stand", facing: 1 }], [HERO, { expr: "shock", mode: "stand", wave: 1 }],
  [HERO, { expr: "stern", prop: ["hammer", 0.3] }], [HERO, { expr: "neutral", prop: "log", mode: "stroll", phase: 0.25 }], [HERO, { expr: "smile", prop: "bowl", mode: "sit" }],
  [sailor(0), { expr: "laugh", wave: 1 }], [sailor(1), { expr: "grin" }], [sailor(2), { expr: "stern", facing: -1 }], [sailor(4), { expr: "neutral" }],
  [settler(0), { expr: "smile" }], [native(0), { expr: "neutral" }], [native(1), { expr: "stern", facing: 1 }], [native(2), { expr: "smile" }],
  [native(3), { expr: "neutral" }], [native(5), { expr: "smile" }], [digger(0), { expr: "shock", prop: "wood" }], [digger(1), { expr: "neutral", prop: "brush" }],
];

export const CastSheet: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.fillStyle = "#9fc3e6"; g.fillRect(0, 0, 1080, 1920);
    CELLS.forEach(([o, opts], i) => {
      const col = i % 4, row = Math.floor(i / 4);
      g.setTransform(0.42, 0, 0, 0.42, 20 + col * 265, 20 + row * 430);
      bodyFront(new Pen(g), o, { mode: "stand", seed: 3 + i, ...opts } as FrontOpts);
    });
  }, []);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} /></AbsoluteFill>;
};
