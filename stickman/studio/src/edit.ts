// Edit decision list: which cuts get a transition, how each picture moves.
// Every cut not listed here is a plain hard cut.

export type TransType = "whip" | "zoom" | "flash" | "dip" | "iris" | "spin" | "wipe" | "dissolve";
export type Trans = { type: TransType; dur: number; dir?: 1 | -1 };

const whip = (dir: 1 | -1 = 1): Trans => ({ type: "whip", dur: 12, dir });
const zoom: Trans = { type: "zoom", dur: 14 };
const flash: Trans = { type: "flash", dur: 16 };
const dip = (dur = 24): Trans => ({ type: "dip", dur });
const iris: Trans = { type: "iris", dur: 18 };
const spin: Trans = { type: "spin", dur: 18 };
const wipe = (dir: 1 | -1 = 1): Trans => ({ type: "wipe", dur: 16, dir });
const dissolve = (dur = 18): Trans => ({ type: "dissolve", dur });

/** key = incoming shot number (1-based). */
export const TRANSITIONS: Record<number, Trans> = {
  2: spin, // masuk lorong waktu
  3: zoom, // keluar dari lorong waktu
  4: whip(1),
  5: dip(14), // firasat buruk
  6: flash, // helikopter muncul dengan kilatan
  8: whip(1),
  10: whip(-1),
  13: zoom,
  14: wipe(1),
  17: iris,
  20: wipe(-1),
  25: whip(1),
  27: zoom, // angin baling-baling
  34: dissolve(),
  37: iris,
  38: whip(1),
  41: dip(16),
  43: wipe(1),
  49: whip(-1),
  53: zoom,
  54: dip(26), // beberapa hari kemudian
  60: whip(1),
  62: dissolve(),
  64: wipe(-1),
  69: dip(26), // suatu sore
  75: flash, // ibu berteriak
  78: zoom,
  81: whip(-1),
  85: dissolve(),
  86: dissolve(12),
  87: dissolve(12),
  88: dissolve(12),
  89: whip(1),
  90: zoom,
  93: wipe(1),
  97: whip(1),
  103: zoom,
  104: dissolve(),
  108: iris,
  110: wipe(-1),
  112: dissolve(22),
  115: dip(24), // hari demi hari
  121: dip(24), // suatu pagi
  126: zoom,
  131: whip(1),
  133: zoom,
  134: flash, // kilas balik
  139: flash, // kembali ke masa kini
  140: dissolve(),
  144: dissolve(22),
};


export type Move = "in" | "out" | "left" | "right" | "up" | "still";
const CYCLE: Move[] = ["in", "right", "out", "left", "in", "up"];

const MOVE_OVERRIDE: Record<number, Move> = {
  2: "in",
  53: "still", // komposisi kiri-kanan, jangan digeser
  133: "in",
  145: "out",
};

export const moveFor = (n: number): Move => MOVE_OVERRIDE[n] ?? CYCLE[(n * 5) % CYCLE.length];
