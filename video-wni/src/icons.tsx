import React from "react";

// Doodle-style icons (viewBox 0 0 100 100), thick ink outline to match the stickman art.
const INK = "#1c1712";
const s = { stroke: INK, strokeWidth: 6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const C = {
  wood: "#a8692f", sail: "#f3e3bd", red: "#c8352b", gold: "#f2b632", green: "#4f8a3a", blue: "#3f7fb5",
  grey: "#9aa3ab", white: "#ffffff", cream: "#fff4dc", brown: "#7a4a22", sand: "#e9c98f", dark: "#3b3b3b",
  skin: "#ffffff", teal: "#2f8f8a",
};

export const ICONS: Record<string, React.ReactNode> = {
  fang: (
    <g>
      <path d="M14 30 Q14 12 30 14 L38 26 Q50 20 62 26 L70 14 Q86 12 86 30 Q92 60 70 80 Q50 92 30 80 Q8 60 14 30 Z" fill="#f2a03a" {...s} />
      <path d="M32 40 L42 46 M68 40 L58 46" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d="M26 28 L34 34 M74 28 L66 34 M18 54 L28 54 M82 54 L72 54" stroke={INK} strokeWidth={4} />
      <path d="M38 62 Q50 72 62 62 L58 70 L54 64 L50 72 L46 64 L42 70 Z" fill={C.white} stroke={INK} strokeWidth={3} />
      <ellipse cx="50" cy="56" rx="6" ry="4" fill={INK} />
    </g>
  ),
  money: (
    <g>
      <rect x="10" y="30" width="80" height="44" rx="6" fill="#7cc576" {...s} transform="rotate(-8 50 52)" />
      <rect x="14" y="36" width="80" height="44" rx="6" fill="#9ad88f" {...s} />
      <circle cx="54" cy="58" r="11" fill="#7cc576" stroke={INK} strokeWidth={4} />
      <path d="M54 51 V65 M50 54 Q54 51 58 54 Q50 58 58 62 Q54 65 50 62" stroke={INK} strokeWidth={3} fill="none" />
    </g>
  ),
  phone: (
    <g>
      <rect x="28" y="8" width="44" height="84" rx="9" fill={C.dark} {...s} />
      <rect x="34" y="18" width="32" height="58" rx="3" fill="#8fd3ff" stroke={INK} strokeWidth={3} />
      <circle cx="50" cy="84" r="3.5" fill={C.white} />
      <path d="M40 34 H60 M40 44 H56 M40 54 H60" stroke={C.white} strokeWidth={4} strokeLinecap="round" />
    </g>
  ),
  house: (
    <g>
      <path d="M14 48 L50 16 L86 48" fill="none" {...s} />
      <path d="M22 44 V86 H78 V44 L50 20 Z" fill={C.cream} {...s} />
      <path d="M10 50 L50 14 L90 50 L84 56 L50 26 L16 56 Z" fill={C.red} {...s} />
      <rect x="42" y="60" width="16" height="26" fill={C.wood} stroke={INK} strokeWidth={4} />
      <rect x="28" y="54" width="10" height="10" fill="#8fd3ff" stroke={INK} strokeWidth={3} />
    </g>
  ),
  tap: (
    <g>
      <path d="M16 30 H58 Q72 30 72 44 V54 H58 V44 H16 Z" fill={C.grey} {...s} />
      <path d="M34 30 V20 M24 18 H44" {...s} fill="none" />
      <path d="M65 64 Q58 74 65 80 Q72 74 65 64 Z" fill="#7fc3ec" stroke={INK} strokeWidth={3} />
      <path d="M65 84 Q60 90 65 94 Q70 90 65 84 Z" fill="#7fc3ec" stroke={INK} strokeWidth={3} />
    </g>
  ),
  bus: (
    <g>
      <rect x="10" y="22" width="80" height="52" rx="8" fill="#f2b632" {...s} />
      <rect x="18" y="30" width="18" height="16" fill="#8fd3ff" stroke={INK} strokeWidth={3} />
      <rect x="41" y="30" width="18" height="16" fill="#8fd3ff" stroke={INK} strokeWidth={3} />
      <rect x="64" y="30" width="18" height="16" fill="#8fd3ff" stroke={INK} strokeWidth={3} />
      <circle cx="28" cy="76" r="9" fill={C.dark} {...s} />
      <circle cx="72" cy="76" r="9" fill={C.dark} {...s} />
    </g>
  ),
  horn: (
    <g>
      <path d="M16 40 H34 L66 20 V80 L34 60 H16 Z" fill={C.red} {...s} />
      <path d="M76 34 Q86 50 76 66 M84 24 Q100 50 84 76" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
    </g>
  ),
  idcard: (
    <g>
      <rect x="8" y="22" width="84" height="56" rx="8" fill="#7fb6e6" {...s} />
      <rect x="16" y="32" width="24" height="30" rx="3" fill={C.white} stroke={INK} strokeWidth={3} />
      <circle cx="28" cy="43" r="6" fill={INK} />
      <path d="M48 36 H82 M48 48 H78 M48 60 H70" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <path d="M16 70 H84" stroke={C.red} strokeWidth={4} />
    </g>
  ),
  chicken: (
    <g>
      <ellipse cx="46" cy="58" rx="30" ry="24" fill={C.white} {...s} />
      <circle cx="70" cy="34" r="13" fill={C.white} {...s} />
      <path d="M66 20 Q70 12 74 20 Q78 14 80 22" fill={C.red} stroke={INK} strokeWidth={3} />
      <path d="M82 34 L92 38 L82 42 Z" fill={C.gold} stroke={INK} strokeWidth={3} />
      <circle cx="72" cy="32" r="2.5" fill={INK} />
      <path d="M40 82 V92 M54 82 V92" {...s} />
      <path d="M22 48 Q12 40 18 30 Q26 40 28 46" fill={C.white} stroke={INK} strokeWidth={4} />
    </g>
  ),
  drumstick: (
    <g>
      <path d="M58 16 Q86 14 84 42 Q82 62 56 60 L38 74 Q30 70 26 62 L42 46 Q36 18 58 16 Z" fill="#c8823a" {...s} />
      <path d="M38 74 L24 88 M26 62 L12 76" stroke={C.cream} strokeWidth={12} strokeLinecap="round" />
      <path d="M38 74 L24 88 M26 62 L12 76" stroke={INK} strokeWidth={3} />
      <path d="M60 26 Q74 26 74 38" stroke="#f0b26a" strokeWidth={5} fill="none" />
    </g>
  ),
  stone: (
    <g>
      <path d="M14 64 Q10 40 34 30 Q52 18 72 30 Q92 42 86 64 Q80 82 50 82 Q20 82 14 64 Z" fill={C.grey} {...s} />
      <path d="M32 46 Q40 40 48 44 M58 58 Q66 54 72 60" stroke={C.white} strokeWidth={4} fill="none" />
    </g>
  ),
  flag: (
    <g>
      <path d="M18 10 V92" {...s} />
      <path d="M20 14 H86 V38 H20 Z" fill="#e23b32" {...s} />
      <path d="M20 38 H86 V62 H20 Z" fill={C.white} {...s} />
    </g>
  ),
  hardhat: (
    <g>
      <path d="M14 66 Q14 26 50 24 Q86 26 86 66 Z" fill="#f2c230" {...s} />
      <path d="M6 66 H94 V76 H6 Z" fill="#f2c230" {...s} />
      <path d="M50 24 V60 M36 30 V60 M64 30 V60" stroke={INK} strokeWidth={4} />
    </g>
  ),
  muscle: (
    <g>
      <path d="M14 80 Q12 52 30 44 L40 24 Q46 14 56 20 Q62 26 56 36 L52 46 Q66 38 78 46 Q92 58 82 74 Q72 86 48 84 Z" fill={C.white} {...s} />
      <path d="M58 58 Q68 52 76 60" stroke={INK} strokeWidth={4} fill="none" />
    </g>
  ),
  thumbsup: (
    <g>
      <path d="M30 46 L48 16 Q60 14 58 30 L54 42 H80 Q92 44 88 58 L82 82 Q78 90 66 90 H30 Z" fill="#ffd166" {...s} />
      <rect x="10" y="44" width="20" height="46" rx="4" fill="#3f7fb5" {...s} />
    </g>
  ),
  laugh: (
    <g>
      <circle cx="50" cy="50" r="40" fill="#ffd166" {...s} />
      <path d="M28 40 Q34 32 40 40 M60 40 Q66 32 72 40" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <path d="M26 54 H74 Q72 80 50 80 Q28 80 26 54 Z" fill={C.dark} stroke={INK} strokeWidth={4} />
      <path d="M36 70 Q50 64 64 70" stroke={C.red} strokeWidth={6} fill="none" />
      <path d="M18 46 Q14 56 20 60 M82 46 Q86 56 80 60" stroke="#7fc3ec" strokeWidth={5} fill="none" />
    </g>
  ),
  chat: (
    <g>
      <path d="M12 20 H88 Q94 20 94 26 V64 Q94 70 88 70 H40 L22 86 V70 H12 Q6 70 6 64 V26 Q6 20 12 20 Z" fill={C.white} {...s} />
      <circle cx="32" cy="45" r="5" fill={INK} />
      <circle cx="50" cy="45" r="5" fill={INK} />
      <circle cx="68" cy="45" r="5" fill={INK} />
    </g>
  ),
  bell: (
    <g>
      <path d="M50 12 Q74 14 74 44 V62 L84 74 H16 L26 62 V44 Q26 14 50 12 Z" fill={C.gold} {...s} />
      <circle cx="50" cy="82" r="8" fill={C.gold} {...s} />
      <circle cx="78" cy="22" r="10" fill={C.red} stroke={INK} strokeWidth={4} />
    </g>
  ),
  moon: (
    <g>
      <path d="M62 10 Q30 16 30 50 Q30 84 64 90 Q36 92 22 70 Q8 46 24 24 Q38 8 62 10 Z" fill="#ffe36a" {...s} />
      <path d="M78 22 L82 30 L90 32 L82 34 L78 42 L74 34 L66 32 L74 30 Z" fill={C.white} stroke={INK} strokeWidth={3} />
    </g>
  ),
  sun: (
    <g>
      <circle cx="50" cy="50" r="20" fill="#ffb627" {...s} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <path key={a} d="M50 8 V20" {...s} transform={`rotate(${a} 50 50)`} />
      ))}
    </g>
  ),
  clock: (
    <g>
      <circle cx="50" cy="50" r="38" fill={C.cream} {...s} />
      <path d="M50 26 V50 L66 60" {...s} fill="none" />
      <circle cx="50" cy="50" r="4" fill={INK} />
    </g>
  ),
  calendar: (
    <g>
      <rect x="12" y="18" width="76" height="70" rx="8" fill={C.white} {...s} />
      <path d="M12 38 H88" stroke={INK} strokeWidth={6} />
      <rect x="12" y="18" width="76" height="20" rx="8" fill={C.red} {...s} />
      <path d="M30 10 V26 M70 10 V26" {...s} />
      <path d="M26 52 H36 M44 52 H54 M62 52 H72 M26 68 H36 M44 68 H54" stroke={INK} strokeWidth={5} />
      <circle cx="67" cy="68" r="8" fill="none" stroke={C.red} strokeWidth={4} />
    </g>
  ),
  tree: (
    <g>
      <path d="M44 92 V60 H56 V92 Z" fill={C.wood} {...s} />
      <circle cx="50" cy="40" r="28" fill={C.green} {...s} />
      <circle cx="30" cy="52" r="16" fill={C.green} {...s} />
      <circle cx="70" cy="52" r="16" fill={C.green} {...s} />
    </g>
  ),
  plane: (
    <g>
      <path d="M8 56 L92 26 Q98 30 92 36 L60 54 L50 86 L40 84 L44 60 L22 70 L16 66 Z" fill={C.white} {...s} />
      <path d="M30 50 L18 36 L26 34 L44 44" fill="#7fb6e6" stroke={INK} strokeWidth={4} />
    </g>
  ),
  pill: (
    <g>
      <rect x="10" y="36" width="80" height="30" rx="15" fill={C.white} {...s} transform="rotate(-30 50 51)" />
      <path d="M50 26 V76" stroke={INK} strokeWidth={5} transform="rotate(-30 50 51)" />
      <path d="M12 36 H40 V65 H26 Q12 65 12 51 Z" fill={C.red} stroke={INK} strokeWidth={4} transform="rotate(-30 50 51)" />
    </g>
  ),
  arrowup: (
    <g>
      <path d="M50 8 L86 46 H64 V92 H36 V46 H14 Z" fill={C.red} {...s} />
    </g>
  ),
  star: (
    <g>
      <path d="M50 8 L61 36 L92 38 L68 58 L76 90 L50 72 L24 90 L32 58 L8 38 L39 36 Z" fill="#ffd166" {...s} />
    </g>
  ),
  wifi: (
    <g>
      <path d="M10 40 Q50 4 90 40 M24 54 Q50 30 76 54 M38 68 Q50 56 62 68" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d="M10 40 Q50 4 90 40 M24 54 Q50 30 76 54 M38 68 Q50 56 62 68" fill="none" stroke="#3f7fb5" strokeWidth={4} strokeLinecap="round" />
      <circle cx="50" cy="82" r="8" fill="#3f7fb5" {...s} />
    </g>
  ),
  ship: (
    <g>
      <path d="M12 62 H88 L76 82 H26 Z" fill={C.wood} {...s} />
      <path d="M50 14 V62" {...s} fill="none" />
      <path d="M52 18 L80 30 L80 54 L52 56 Z" fill={C.sail} {...s} />
      <path d="M48 24 L24 34 L24 54 L48 56 Z" fill={C.sail} {...s} />
      <path d="M58 30 H74 M58 42 H74 M30 40 H44" stroke={INK} strokeWidth={3} />
    </g>
  ),
  cannon: (
    <g>
      <path d="M16 46 L70 30 L76 46 L22 62 Z" fill={C.gold} {...s} />
      <circle cx="74" cy="38" r="8" fill={C.dark} {...s} />
      <circle cx="36" cy="70" r="13" fill={C.wood} {...s} />
      <circle cx="36" cy="70" r="3" fill={INK} />
    </g>
  ),
  people: (
    <g>
      {[22, 50, 78].map((x, k) => (
        <g key={k}>
          <circle cx={x} cy={k === 1 ? 30 : 38} r={11} fill={C.white} {...s} />
          <path d={`M${x - 14} ${k === 1 ? 34 : 42} q14 -12 28 0`} fill="#2f3f73" stroke={INK} strokeWidth={4} />
          <path d={`M${x} ${k === 1 ? 41 : 49} V${k === 1 ? 68 : 72} M${x - 12} ${k === 1 ? 54 : 58} H${x + 12} M${x} ${k === 1 ? 68 : 72} l-9 14 M${x} ${k === 1 ? 68 : 72} l9 14`} {...s} fill="none" />
        </g>
      ))}
    </g>
  ),
  swords: (
    <g>
      <path d="M20 20 L72 72" stroke={C.grey} strokeWidth={12} strokeLinecap="round" />
      <path d="M80 20 L28 72" stroke={C.grey} strokeWidth={12} strokeLinecap="round" />
      <path d="M20 20 L72 72 M80 20 L28 72" stroke={INK} strokeWidth={3} />
      <path d="M62 82 L82 62 M18 62 L38 82" {...s} stroke={C.wood} strokeWidth={10} />
      <path d="M62 82 L82 62 M18 62 L38 82" stroke={INK} strokeWidth={3} />
    </g>
  ),
  queen: (
    <g>
      <ellipse cx="50" cy="22" rx="16" ry="12" fill="#1c1712" />
      <circle cx="50" cy="44" r="18" fill={C.white} {...s} />
      <path d="M36 32 Q50 24 64 32" stroke={C.gold} strokeWidth={5} fill="none" />
      <circle cx="44" cy="44" r="2.5" fill={INK} />
      <circle cx="56" cy="44" r="2.5" fill={INK} />
      <path d="M44 52 q6 4 12 0" stroke={INK} strokeWidth={3} fill="none" />
      <path d="M30 92 Q32 66 50 64 Q68 66 70 92 Z" fill={C.green} {...s} />
      <path d="M36 70 Q50 84 66 72" stroke="#8a2234" strokeWidth={8} fill="none" />
    </g>
  ),
  portugal: (
    <g>
      <path d="M22 16 H78 V50 Q78 78 50 90 Q22 78 22 50 Z" fill={C.white} {...s} />
      <path d="M50 26 V78 M30 46 H70" stroke={C.red} strokeWidth={12} />
      <path d="M50 26 V78 M30 46 H70" stroke={INK} strokeWidth={2} />
    </g>
  ),
  crown: (
    <g>
      <path d="M16 72 L22 30 L38 50 L50 22 L62 50 L78 30 L84 72 Z" fill={C.gold} {...s} />
      <path d="M16 72 H84 V84 H16 Z" fill={C.gold} {...s} />
      <circle cx="50" cy="64" r="5" fill={C.red} stroke={INK} strokeWidth={3} />
      <circle cx="32" cy="66" r="4" fill={C.green} stroke={INK} strokeWidth={3} />
      <circle cx="68" cy="66" r="4" fill={C.blue} stroke={INK} strokeWidth={3} />
    </g>
  ),
  anchor: (
    <g>
      <circle cx="50" cy="20" r="8" fill="none" {...s} />
      <path d="M50 28 V84 M34 40 H66 M20 60 Q24 84 50 84 Q76 84 80 60" fill="none" {...s} />
      <path d="M14 64 L20 56 L28 64 M72 64 L80 56 L86 64" fill="none" {...s} />
    </g>
  ),
  coins: (
    <g>
      {[70, 58, 46, 34].map((y, k) => (
        <ellipse key={k} cx={k % 2 ? 46 : 42} cy={y} rx="24" ry="9" fill={C.gold} {...s} />
      ))}
      <circle cx="70" cy="62" r="16" fill={C.gold} {...s} />
      <path d="M70 54 V70" stroke={INK} strokeWidth={4} />
    </g>
  ),
  clove: (
    <g>
      {[[34, 58, -25], [56, 50, 15], [44, 32, -5]].map(([x, y, r], k) => (
        <g key={k} transform={`rotate(${r} ${x} ${y})`}>
          <path d={`M${x} ${y} V${y + 30}`} stroke={C.brown} strokeWidth={10} strokeLinecap="round" />
          <path d={`M${x} ${y} V${y + 30}`} stroke={INK} strokeWidth={2} />
          <circle cx={x} cy={y - 4} r={9} fill={C.brown} {...s} />
        </g>
      ))}
    </g>
  ),
  bowl: (
    <g>
      <path d="M30 46 Q50 22 70 46" fill={C.white} {...s} />
      <path d="M14 48 H86 Q82 82 50 84 Q18 82 14 48 Z" fill={C.blue} {...s} />
      <path d="M26 60 Q50 70 74 60" stroke={C.white} strokeWidth={4} fill="none" />
    </g>
  ),
  cloth: (
    <g>
      <path d="M20 30 H70 Q84 30 84 44 V70 Q84 84 70 84 H20 Z" fill={C.red} {...s} />
      <ellipse cx="22" cy="57" rx="10" ry="27" fill="#e05a3c" {...s} />
      <path d="M34 42 H70 M34 56 H72 M34 70 H70" stroke={C.gold} strokeWidth={4} strokeDasharray="6 5" />
    </g>
  ),
  sack: (
    <g>
      <path d="M34 26 Q50 34 66 26 L62 38 Q86 50 80 74 Q76 88 50 88 Q24 88 20 74 Q14 50 38 38 Z" fill={C.sand} {...s} />
      <path d="M38 36 Q50 42 62 36" stroke={INK} strokeWidth={4} fill="none" />
      <path d="M40 62 q10 -8 20 0" stroke={C.brown} strokeWidth={4} fill="none" />
    </g>
  ),
  fortress: (
    <g>
      <path d="M14 86 V42 H24 V34 H34 V42 H44 V34 H56 V42 H66 V34 H76 V42 H86 V86 Z" fill="#ece6d6" {...s} />
      <path d="M38 86 V64 Q50 52 62 64 V86" fill={C.dark} {...s} />
      <path d="M50 34 V10 L68 16 L50 22" fill={C.red} {...s} />
    </g>
  ),
  pin: (
    <g>
      <path d="M50 92 C34 70 24 58 24 42 a26 26 0 0 1 52 0 c0 16 -10 28 -26 50z" fill={C.red} {...s} />
      <circle cx="50" cy="42" r="10" fill={C.white} {...s} />
    </g>
  ),
  scroll: (
    <g>
      <path d="M24 22 H76 V78 H24 Z" fill={C.cream} {...s} />
      <path d="M18 20 Q18 12 26 12 H80 Q88 12 88 20 Q88 28 80 28" fill={C.sand} {...s} />
      <path d="M12 80 Q12 88 20 88 H74 Q82 88 82 80 Q82 72 74 72" fill={C.sand} {...s} />
      <path d="M34 40 H66 M34 52 H66 M34 64 H56" stroke={INK} strokeWidth={4} />
      <circle cx="64" cy="66" r="7" fill={C.red} stroke={INK} strokeWidth={3} />
    </g>
  ),
  handshake: (
    <g>
      <path d="M8 46 L28 34 L52 46 L40 58 Z" fill={C.green} {...s} />
      <path d="M92 46 L72 34 L48 46 L60 58 Z" fill={C.blue} {...s} />
      <path d="M30 50 Q42 40 56 44 L72 58 Q74 66 66 66 L50 56 M56 74 L42 62 M48 80 L36 68" fill={C.white} {...s} />
    </g>
  ),
  burst: (
    <g>
      <path d="M50 6 L60 34 L90 22 L70 48 L96 62 L64 64 L70 94 L50 72 L30 94 L36 64 L4 62 L30 48 L10 22 L40 34 Z" fill={C.gold} {...s} />
      <path d="M50 30 L56 44 L72 42 L60 54 L66 70 L50 60 L34 70 L40 54 L28 42 L44 44 Z" fill={C.red} stroke={INK} strokeWidth={3} />
    </g>
  ),
  flame: (
    <g>
      <path d="M50 90 Q20 88 22 60 Q24 40 42 22 Q42 40 54 44 Q50 26 64 12 Q66 34 76 46 Q84 60 78 74 Q72 90 50 90 Z" fill="#f08a24" {...s} />
      <path d="M50 86 Q36 84 38 68 Q40 56 50 48 Q52 60 60 64 Q66 72 60 80 Q56 86 50 86 Z" fill={C.gold} stroke={INK} strokeWidth={3} />
    </g>
  ),
  heart: (
    <g>
      <path d="M50 86 C20 64 12 50 14 36 C16 22 34 16 50 32 C66 16 84 22 86 36 C88 50 80 64 50 86 Z" fill={C.red} {...s} />
      <path d="M28 34 q4 -6 10 -6" stroke={C.white} strokeWidth={4} fill="none" />
    </g>
  ),
  tear: (
    <g>
      <path d="M50 12 Q76 46 74 64 A24 24 0 0 1 26 64 Q24 46 50 12 Z" fill="#7fc3ec" {...s} />
      <path d="M38 62 q2 10 10 12" stroke={C.white} strokeWidth={4} fill="none" />
    </g>
  ),
  question: (
    <g>
      <path d="M32 34 Q32 14 50 14 Q70 14 70 32 Q70 44 56 50 Q50 54 50 64" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <path d="M32 34 Q32 14 50 14 Q70 14 70 32 Q70 44 56 50 Q50 54 50 64" fill="none" stroke={C.gold} strokeWidth={7} strokeLinecap="round" />
      <circle cx="50" cy="82" r="8" fill={C.gold} {...s} />
    </g>
  ),
  bulb: (
    <g>
      <path d="M50 10 Q78 10 78 40 Q78 54 64 64 V72 H36 V64 Q22 54 22 40 Q22 10 50 10 Z" fill="#ffe36a" {...s} />
      <path d="M36 80 H64 M40 90 H60" {...s} />
      <path d="M42 50 L50 36 L58 50" stroke={C.brown} strokeWidth={4} fill="none" />
    </g>
  ),
  hourglass: (
    <g>
      <path d="M20 10 H80 M20 90 H80" {...s} />
      <path d="M28 12 Q28 40 50 50 Q72 40 72 12 Z M28 88 Q28 60 50 50 Q72 60 72 88 Z" fill={C.cream} {...s} />
    </g>
  ),
  xmark: (
    <g>
      <path d="M18 18 L82 82 M82 18 L18 82" stroke={INK} strokeWidth={22} strokeLinecap="round" />
      <path d="M18 18 L82 82 M82 18 L18 82" stroke={C.red} strokeWidth={13} strokeLinecap="round" />
    </g>
  ),
  check: (
    <g>
      <path d="M14 52 L40 78 L88 22" stroke={INK} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M14 52 L40 78 L88 22" stroke={C.green} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  ),
  compass: (
    <g>
      <circle cx="50" cy="50" r="38" fill={C.cream} {...s} />
      <path d="M50 18 L60 50 L50 82 L40 50 Z" fill={C.red} {...s} />
      <path d="M50 50 L60 50 L50 82 L40 50 Z" fill={C.white} stroke={INK} strokeWidth={4} />
      <circle cx="50" cy="50" r="5" fill={INK} />
    </g>
  ),
  sparkle: (
    <g>
      <path d="M50 8 Q56 44 92 50 Q56 56 50 92 Q44 56 8 50 Q44 44 50 8 Z" fill={C.gold} {...s} />
      <path d="M80 14 Q82 22 90 24 Q82 26 80 34 Q78 26 70 24 Q78 22 80 14 Z" fill={C.white} stroke={INK} strokeWidth={3} />
    </g>
  ),
  mosque: (
    <g>
      <path d="M14 86 H86 V70 H14 Z" fill={C.cream} {...s} />
      <path d="M8 70 L50 52 L92 70 Z" fill="#6b4a2e" {...s} />
      <path d="M22 54 L50 38 L78 54 Z" fill="#7d5636" {...s} />
      <path d="M34 38 L50 24 L66 38 Z" fill="#8e6340" {...s} />
      <path d="M50 24 V12" {...s} />
      <path d="M44 86 V76 H56 V86" fill={C.dark} stroke={INK} strokeWidth={4} />
    </g>
  ),
  spear: (
    <g>
      <path d="M22 88 L70 26" stroke={C.wood} strokeWidth={9} strokeLinecap="round" />
      <path d="M22 88 L70 26" stroke={INK} strokeWidth={2} />
      <path d="M66 30 Q70 14 86 8 Q82 24 72 34 Z" fill={C.grey} {...s} />
    </g>
  ),
  shield: (
    <g>
      <circle cx="50" cy="50" r="38" fill="#c89b5a" {...s} />
      <circle cx="50" cy="50" r="24" fill="none" stroke={INK} strokeWidth={4} strokeDasharray="7 6" />
      <circle cx="50" cy="50" r="8" fill={C.brown} stroke={INK} strokeWidth={4} />
    </g>
  ),
};

export const Icon: React.FC<{ name: string; size?: number }> = ({ name, size = 100 }) => (
  <svg viewBox="-6 -6 112 112" width={size} height={size} style={{ overflow: "visible", display: "block" }}>
    {ICONS[name] ?? ICONS.sparkle}
  </svg>
);
