// Timed text for the 3D lyric piece. Word start times come from the vocal stem of the supplied track
// (shorts/lyric3d/prep/align.py), so every word lands on a sung syllable. The hook lines are the sung "no"
// and "yeah" runs; the other lines are original captions written for the photo, placed on the vocal rhythm.

export type Style = "flip" | "fly" | "drop" | "slide" | "swing";
export type Zone = "top" | "bottom";

export type CaptionLine = {
  kind: "caption";
  style: Style;
  zone: Zone;
  side: string; // extrusion colour
  accent: string; // face colour of the word being sung
  words: string[];
  times: number[];
  pages: number[][][]; // pages -> rows -> word indices
  end: number;
};

export type HookLine = {
  kind: "hook";
  style: "stamp" | "bounce";
  words: string[];
  times: number[];
  end: number;
};

export type Line = CaptionLine | HookLine;

export const LINES: Line[] = [
  {
    kind: "caption", style: "flip", zone: "top", side: "#0d6e66", accent: "#ffd84a",
    words: ["MIST", "ON", "MY", "FACE,", "SUN", "THROUGH", "THE", "CLOUDS"],
    times: [0.0, 0.46, 1.08, 1.14, 1.44, 1.96, 2.22, 2.66],
    pages: [[[0, 1], [2, 3]], [[4, 5], [6, 7]]],
    end: 3.95,
  },
  {
    kind: "caption", style: "fly", zone: "bottom", side: "#1d4fb0", accent: "#7fe3ff",
    words: ["ARMS", "WIDE", "OPEN,", "BREATHING", "IN", "THE", "GREEN"],
    times: [4.5, 5.66, 5.72, 6.22, 6.5, 6.8, 7.16],
    pages: [[[0], [1, 2]], [[3], [4, 5, 6]]],
    end: 7.86,
  },
  {
    kind: "caption", style: "drop", zone: "top", side: "#1c6e35", accent: "#b6ff5c",
    words: ["WHERE", "THE", "WILD", "WATER", "FALLS"],
    times: [7.92, 8.56, 8.72, 8.88, 9.12],
    pages: [[[0, 1, 2], [3, 4]]],
    end: 10.3,
  },
  {
    kind: "hook", style: "stamp",
    words: ["NO", "NO", "NO", "NO", "NO", "NO", "NO", "NO", "NO-OH"],
    times: [10.5, 11.6, 11.76, 12.14, 12.54, 12.84, 13.18, 13.42, 13.6],
    end: 14.85,
  },
  {
    kind: "caption", style: "slide", zone: "bottom", side: "#0f4a73", accent: "#3fe0d0",
    words: ["COLD", "WATER", "RUSHING", "DOWN", "OVER", "EVERY", "STONE"],
    times: [15.1, 16.14, 16.36, 16.68, 16.96, 17.12, 17.58],
    pages: [[[0, 1], [2]], [[3, 4], [5, 6]]],
    end: 18.2,
  },
  {
    kind: "caption", style: "swing", zone: "top", side: "#4b2fa8", accent: "#ffd84a",
    words: ["NOTHING", "BUT", "GREEN", "AND", "BLUE"],
    times: [18.26, 18.76, 18.94, 19.8, 20.5],
    pages: [[[0, 1], [2, 3, 4]]],
    end: 21.1,
  },
  {
    kind: "hook", style: "bounce",
    words: ["YEAH", "YEAH", "YEAH", "YEAH", "YEAH", "YEAH", "YEAH", "YEAH", "YEAH-EAH"],
    times: [21.2, 22.02, 22.32, 22.66, 23.12, 23.56, 23.92, 24.14, 24.56],
    end: 25.45,
  },
];

// Hook word placements (px in the 1080 frame), kept around the person; the last word is the big one.
export const HOOK_SLOTS: { x: number; y: number; rot: number; s: number }[] = [
  { x: 205, y: 150, rot: -9, s: 1 },
  { x: 875, y: 150, rot: 8, s: 1 },
  { x: 160, y: 430, rot: 6, s: 0.9 },
  { x: 925, y: 430, rot: -7, s: 0.9 },
  { x: 190, y: 700, rot: -8, s: 0.95 },
  { x: 890, y: 700, rot: 9, s: 0.95 },
  { x: 540, y: 108, rot: 0, s: 0.85 },
  { x: 540, y: 875, rot: -3, s: 0.95 },
  { x: 540, y: 560, rot: 0, s: 1.45 },
];

export const HOOK_FACES = ["#ffd84a", "#ff6b6b", "#3fe0d0", "#ffffff", "#b6ff5c", "#ff9a3c", "#7fb2ff", "#ff7ad9"];
