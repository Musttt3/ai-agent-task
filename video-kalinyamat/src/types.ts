export type SceneData = {
  i: number;
  img: string;
  video?: string | null;
  start: number;
  end: number;
  trans: string;
  tlen: number;
  motion: string;
  shake: { at: number; dur: number; amp: number }[];
  night: boolean;
  sepia: boolean;
};

export type Overlay = {
  scene: number;
  kind: string;
  at: number;
  dur: number;
  start: number;
  text?: string;
  sub?: string;
  num?: string;
  title?: string;
  icon?: string;
  x?: number;
  y?: number;
  big?: boolean;
  small?: boolean;
  arrow?: boolean;
  from?: number;
  to?: number;
  items?: [string, string][];
  icons?: string[];
  slot?: string;
  stagger?: number;
  glow?: boolean;
  count?: number;
  points?: [number, number][];
};

export type Plan = {
  fps: number;
  duration: number;
  narrEnd: number;
  scenes: SceneData[];
  overlays: Overlay[];
};
