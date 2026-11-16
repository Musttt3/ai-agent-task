// Character check sheet for the Constantinople short.
import React, { useEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen, bodyFront, Outfit, FrontOpts } from "./toon";
import { MESSENGER, COMMANDER, defender, janissary, MEHMED, EMPEROR, citizen, kid } from "./cast";

const CELLS: [Outfit, Partial<FrontOpts>][] = [
  [MESSENGER, { expr: "neutral", prop: "scroll" }], [MESSENGER, { expr: "shock", mode: "march", phase: 0.25 }], [MESSENGER, { expr: "pained" }], [MESSENGER, { expr: "dazed", mode: "sit", prop: "scroll" }],
  [COMMANDER, { expr: "shout", wave: 1 }], [COMMANDER, { expr: "stern" }], [defender(0), { expr: "stern", prop: "shield" }], [defender(1), { expr: "nervous", prop: "spear" }],
  [defender(2), { expr: "stern", prop: "shield" }], [janissary(0), { expr: "stern" }], [janissary(1), { expr: "shout", prop: "spear" }], [janissary(2), { expr: "neutral", prop: "shield" }],
  [MEHMED, { expr: "stern" }], [EMPEROR, { expr: "stern", prop: "sword", wave: 1 }], [EMPEROR, { expr: "shout" }], [citizen(0), { expr: "nervous", mode: "stroll", phase: 0.25 }],
  [citizen(1), { expr: "shock" }], [citizen(2), { expr: "nervous" }], [kid(4), { expr: "shock" }], [kid(5), { expr: "nervous" }],
];

export const CastSheet: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.fillStyle = "#d8b890"; g.fillRect(0, 0, 1080, 1920);
    CELLS.forEach(([o, opts], i) => {
      const col = i % 4, row = Math.floor(i / 4);
      g.setTransform(0.42, 0, 0, 0.42, 20 + col * 265, 40 + row * 380);
      bodyFront(new Pen(g), o, { mode: "stand", seed: 3 + i, ...opts } as FrontOpts);
    });
  }, []);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} /></AbsoluteFill>;
};
