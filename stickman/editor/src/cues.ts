// Editing decisions per shot (shot numbers = image numbers 001..197).

export type InTransition = "cut" | "flash" | "whip" | "dip" | "glitch" | "xfade";
export type QuoteStyle = "shout" | "whisper" | "type" | "words" | "big";

export type Sfx = { name: string; at?: number; vol?: number; dur?: number };

export type Cue = {
  in?: InTransition;
  shake?: boolean;
  quote?: { text: string; style: QuoteStyle; at?: number };
  sfx?: Sfx[];
  // "punch": quick zoom punch, "still": almost no movement
  camera?: "punch" | "still" | "slowpush";
};

// Story sections → chapter lower-thirds + dip transitions.
export const SECTIONS: { shot: number; title: string }[] = [
  { shot: 8, title: "Awal Wabah" },
  { shot: 23, title: "Kapal yang Tak Datang" },
  { shot: 32, title: "Buku Catatan" },
  { shot: 39, title: "Hari Ke-6" },
  { shot: 55, title: "Mencari Gudang" },
  { shot: 74, title: "Sebotol Air" },
  { shot: 83, title: "Pintu Besi Merah" },
  { shot: 106, title: "Ruang Arsip" },
  { shot: 135, title: "Video Pukul 02.00" },
  { shot: 158, title: "Pengakuan" },
  { shot: 172, title: "Buku Biru" },
];

export const FLASHBACK = { from: 8, to: 38 }; // days 1-5
export const DAY6_FROM = 39;
export const RADIO = { from: 69, to: 73 };
export const REC = { from: 143, to: 150 };

const C: Record<number, Cue> = {
  1: { sfx: [{ name: "waves", vol: 0.35 }, { name: "whoosh", at: 0.2, vol: 0.4 }] },
  2: { sfx: [{ name: "sting", vol: 0.25 }] },
  3: { in: "glitch", shake: true, camera: "punch", quote: { text: "Kamu siapa?", style: "shout" }, sfx: [{ name: "impact", vol: 0.5 }, { name: "glitch", vol: 0.35 }] },
  4: { in: "flash", sfx: [{ name: "chime", vol: 0.3 }] },
  5: { sfx: [{ name: "riser", at: 0.2, vol: 0.4 }] },
  6: { shake: true, camera: "slowpush", sfx: [{ name: "impact", vol: 0.55 }, { name: "sting", vol: 0.3 }] },
  7: { in: "glitch", sfx: [{ name: "glitch", vol: 0.4 }] },
  8: { sfx: [{ name: "waves", vol: 0.3 }, { name: "chime", at: 0.3, vol: 0.25 }] },
  9: { sfx: [{ name: "waves", vol: 0.25 }] },
  10: { sfx: [{ name: "waves", vol: 0.2 }] },
  14: { shake: true, sfx: [{ name: "impact", vol: 0.3 }] },
  15: { sfx: [{ name: "sting", vol: 0.2 }] },
  19: { sfx: [{ name: "waves", vol: 0.3 }] },
  20: { sfx: [{ name: "tap", at: 0.4, vol: 0.4 }] },
  21: { sfx: [{ name: "waves", vol: 0.25 }] },
  22: { in: "dip" },
  23: { in: "flash" },
  25: { sfx: [{ name: "waves", vol: 0.25 }] },
  26: { sfx: [{ name: "waves", vol: 0.3 }] },
  27: { sfx: [{ name: "sting", vol: 0.2 }] },
  31: { sfx: [{ name: "riser", at: 2.5, vol: 0.3 }] },
  34: { quote: { text: "Kalau mulai lupa, tulis semuanya.", style: "type" }, sfx: [{ name: "page", vol: 0.4 }] },
  35: { sfx: [{ name: "page", vol: 0.4 }] },
  36: { sfx: [{ name: "page", at: 0.5, vol: 0.35 }] },
  37: { sfx: [{ name: "chime", vol: 0.25 }] },
  38: { in: "xfade" },
  39: { sfx: [{ name: "impact", at: 0.15, vol: 0.5 }] },
  40: { camera: "slowpush" },
  41: { shake: true, sfx: [{ name: "impact", at: 0.3, vol: 0.55 }] },
  42: { sfx: [{ name: "sting", vol: 0.35 }] },
  43: { sfx: [{ name: "heartbeat", vol: 0.5 }] },
  44: { shake: true, camera: "punch", sfx: [{ name: "heartbeat", vol: 0.5 }] },
  45: { in: "glitch", shake: true, camera: "punch", quote: { text: "Jangan dekat-dekat!\nKamu siapa?", style: "shout" }, sfx: [{ name: "impact", vol: 0.5 }] },
  46: { camera: "slowpush", sfx: [{ name: "heartbeat", vol: 0.4 }] },
  47: { sfx: [{ name: "page", vol: 0.35 }] },
  48: { sfx: [{ name: "tap", at: 0.5, vol: 0.35 }] },
  51: { quote: { text: "“Tapi aku sama sekali tidak ingat kamu.”", style: "whisper" } },
  52: { camera: "slowpush", sfx: [{ name: "heartbeat", vol: 0.4 }] },
  55: { in: "whip" },
  58: { quote: { text: "Kita di mana?", style: "big" }, sfx: [{ name: "glitch", vol: 0.2 }] },
  59: { quote: { text: "Kita di mana?", style: "big" }, sfx: [{ name: "ticks", vol: 0.4 }] },
  61: { quote: { text: "KUNCI · GELAS · JAM", style: "words" }, sfx: [{ name: "ticks", vol: 0.45 }] },
  62: { in: "glitch", sfx: [{ name: "glitch", vol: 0.35 }] },
  63: { shake: true },
  65: { sfx: [{ name: "knock", vol: 0.4 }, { name: "knock", at: 0.35, vol: 0.35 }] },
  66: { sfx: [{ name: "tap", at: 0.6, vol: 0.4 }] },
  67: { in: "flash" },
  68: { camera: "punch", sfx: [{ name: "chime", vol: 0.3 }] },
  69: { in: "glitch", sfx: [{ name: "static", vol: 0.35 }] },
  70: { sfx: [{ name: "static", vol: 0.3 }] },
  71: { quote: { text: "“…jangan buka pintu belakang.”", style: "type" }, sfx: [{ name: "static", vol: 0.2 }, { name: "sting", vol: 0.3 }] },
  72: { sfx: [{ name: "static", vol: 0.2 }] },
  73: { sfx: [{ name: "static", vol: 0.15 }] },
  78: { in: "xfade", sfx: [{ name: "chime", vol: 0.25 }] },
  80: { sfx: [{ name: "glitch", vol: 0.2 }] },
  82: { in: "xfade" },
  83: { sfx: [{ name: "riser", at: 0.5, vol: 0.35 }] },
  84: { shake: true, camera: "slowpush", sfx: [{ name: "impact", vol: 0.55 }] },
  85: { sfx: [{ name: "sting", vol: 0.3 }] },
  86: { camera: "punch" },
  88: { quote: { text: "“Aku pernah ada di sini.”", style: "whisper" } },
  89: { sfx: [{ name: "sting", vol: 0.3 }] },
  91: { in: "glitch", quote: { text: "Pintu apa?", style: "big" }, sfx: [{ name: "glitch", vol: 0.35 }] },
  92: { in: "glitch" },
  93: { shake: true, sfx: [{ name: "knock3", at: 0.1, vol: 0.85 }] },
  94: { camera: "punch" },
  95: { shake: true, camera: "punch", quote: { text: "TOK.  TOK.  TOK.", style: "words" }, sfx: [{ name: "heartbeat", vol: 0.45 }] },
  99: { shake: true, sfx: [{ name: "impact", vol: 0.3 }] },
  102: { quote: { text: "“Kamu memperlakukanku seperti ancaman.”", style: "whisper" } },
  103: { camera: "still" },
  105: { sfx: [{ name: "knock", at: 1.2, vol: 0.25 }] },
  106: { sfx: [{ name: "page", vol: 0.35 }] },
  107: { sfx: [{ name: "tap", vol: 0.4 }, { name: "static", at: 0.2, vol: 0.15 }] },
  108: { quote: { text: "CATATAN HARI KELIMA", style: "type" } },
  111: { quote: { text: "Nomor satu…", style: "whisper" }, sfx: [{ name: "sting", vol: 0.25 }] },
  112: { shake: true, camera: "punch", sfx: [{ name: "impact", vol: 0.6 }] },
  113: { in: "glitch", shake: true, sfx: [{ name: "sting", vol: 0.4 }, { name: "glitch", vol: 0.3 }] },
  114: { camera: "punch", quote: { text: "01", style: "big" } },
  115: { sfx: [{ name: "page", vol: 0.4 }] },
  117: { sfx: [{ name: "sting", vol: 0.25 }] },
  119: { camera: "slowpush", quote: { text: "02:03", style: "big" }, sfx: [{ name: "ticks", vol: 0.45 }] },
  121: { camera: "slowpush", sfx: [{ name: "sting", vol: 0.25 }] },
  128: { in: "glitch", sfx: [{ name: "glitch", vol: 0.25 }] },
  129: { in: "glitch" },
  134: { quote: { text: "“Tidak menyadari kehilangan ingatannya sendiri.”", style: "type" } },
  135: { sfx: [{ name: "heartbeat", vol: 0.45 }] },
  137: { sfx: [{ name: "riser", at: 1.0, vol: 0.3 }] },
  138: { in: "flash", camera: "slowpush", quote: { text: "Kosong.", style: "big" }, sfx: [{ name: "impact", vol: 0.45 }] },
  139: { in: "xfade" },
  140: { in: "glitch", shake: true, sfx: [{ name: "glitch", vol: 0.35 }, { name: "impact", vol: 0.3 }] },
  141: { sfx: [{ name: "tap", at: 0.5, vol: 0.4 }, { name: "tap", at: 1.4, vol: 0.4 }] },
  142: { sfx: [{ name: "tap", at: 0.8, vol: 0.4 }] },
  143: { in: "glitch", sfx: [{ name: "static", vol: 0.12 }] },
  146: { sfx: [{ name: "static", vol: 0.1 }] },
  148: { quote: { text: "“Kalau besok aku lupa…”", style: "whisper" } },
  149: { camera: "slowpush", quote: { text: "“…jangan ceritakan semuanya.”", style: "whisper" }, sfx: [{ name: "sting", vol: 0.35 }] },
  150: { in: "glitch", shake: true, sfx: [{ name: "glitch", vol: 0.4 }] },
  151: { sfx: [{ name: "tap", at: 0.4, vol: 0.4 }] },
  155: { in: "glitch", shake: true, sfx: [{ name: "impact", vol: 0.45 }, { name: "glitch", vol: 0.3 }] },
  156: { camera: "still" },
  160: { sfx: [{ name: "tap", vol: 0.35 }] },
  165: { quote: { text: "Siapa yang bisa kita percaya?", style: "whisper" } },
  166: { sfx: [{ name: "page", vol: 0.4 }] },
  167: { sfx: [{ name: "page", at: 0.8, vol: 0.3 }] },
  171: { in: "xfade", sfx: [{ name: "chime", vol: 0.25 }] },
  173: { sfx: [{ name: "page", vol: 0.3 }] },
  176: { quote: { text: "“Kalau besok aku lupa, bacakan.”", style: "whisper" } },
  177: { in: "xfade" },
  178: { sfx: [{ name: "page", vol: 0.4 }, { name: "page", at: 1.2, vol: 0.35 }] },
  179: { sfx: [{ name: "page", vol: 0.35 }] },
  180: { sfx: [{ name: "page", vol: 0.35 }] },
  181: { sfx: [{ name: "page", vol: 0.35 }, { name: "riser", at: 1.0, vol: 0.35 }] },
  182: { camera: "slowpush", sfx: [{ name: "impact", vol: 0.4 }] },
  183: { shake: true, camera: "slowpush", sfx: [{ name: "sting", vol: 0.4 }] },
  184: { camera: "slowpush", sfx: [{ name: "sting", vol: 0.3 }] },
  186: { in: "xfade" },
  188: { in: "glitch", sfx: [{ name: "glitch", vol: 0.3 }] },
  189: { camera: "still", sfx: [{ name: "heartbeat", vol: 0.45 }] },
  190: { shake: true, sfx: [{ name: "knock3", at: 0.9, vol: 0.9 }] },
  191: { camera: "slowpush" },
  192: { sfx: [{ name: "knock", at: 1.2, vol: 0.5 }] },
  193: { shake: true, camera: "punch", sfx: [{ name: "impact", vol: 0.5 }] },
  194: { camera: "still" },
  195: { camera: "slowpush" },
  196: { camera: "slowpush", sfx: [{ name: "riser", vol: 0.45 }] },
  197: { shake: true, camera: "slowpush", quote: { text: "“Jangan bangunkan dia.”", style: "whisper" }, sfx: [{ name: "sting", vol: 0.5 }, { name: "impact", vol: 0.5 }] },
};

const sectionStarts = new Set(SECTIONS.map((s) => s.shot));

export const cueFor = (n: number): Cue => {
  const c: Cue = { ...(C[n] ?? {}) };
  if (sectionStarts.has(n)) {
    c.in = c.in ?? "dip";
    c.sfx = [{ name: "whoosh", vol: 0.45 }, ...(c.sfx ?? [])];
  }
  if (c.in === "whip") c.sfx = [{ name: "whoosh", vol: 0.45 }, ...(c.sfx ?? [])];
  return c;
};
