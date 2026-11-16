// Character check sheet: every cast member and the doctor's expressions/props, drawn straight onto a DOM canvas.
import React, { useEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen, bodyFront, Outfit, FrontOpts } from "./toon";
import { DOC, DOC_SICK, colleague, folk, sick, DIGGER, SCIENTIST } from "./cast";

const CELLS: [Outfit, Partial<FrontOpts>][] = [
  [DOC, { expr: "smile", prop: "flask" }], [DOC, { expr: "dazed", facing: 1 }], [DOC, { expr: "neutral", prop: "mortar" }], [DOC, { expr: "stern", prop: "herbs", wave: 1 }],
  [{ ...DOC, flush: 0.9 }, { expr: "nervous" }], [{ ...DOC, bubo: 1 }, { expr: "shock", wave: 1 }], [DOC_SICK, { expr: "pained", mode: "sit" }], [colleague(0), { expr: "neutral", prop: "flask" }],
  [colleague(1), { expr: "stern" }], [colleague(2), { expr: "nervous", facing: -1 }], [colleague(3), { expr: "neutral" }], [folk(0), { expr: "nervous", prop: "posy" }],
  [folk(1), { expr: "neutral", prop: "posy" }], [folk(2), { expr: "pained" }], [folk(4), { expr: "nervous", mode: "stroll", phase: 0.25 }], [sick(0, { flush: 1 }), { expr: "pained", mode: "sit" }],
  [sick(1, { lump: 1 }), { expr: "nervous", mode: "sit" }], [sick(2, { spots: 1 }), { expr: "dazed", mode: "sit" }], [DIGGER, { expr: "stern" }], [SCIENTIST, { expr: "grin" }],
];

export const CastSheet: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.fillStyle = "#c9b48e"; g.fillRect(0, 0, 1080, 1920);
    CELLS.forEach(([o, opts], i) => {
      const col = i % 4, row = Math.floor(i / 4);
      g.setTransform(0.42, 0, 0, 0.42, 20 + col * 265, 20 + row * 380);
      bodyFront(new Pen(g), o, { mode: "stand", seed: 3 + i, ...opts } as FrontOpts);
    });
  }, []);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} /></AbsoluteFill>;
};
