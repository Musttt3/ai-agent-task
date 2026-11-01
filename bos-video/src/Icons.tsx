import React from "react";

type P = { size?: number; color?: string };

export const Incognito: React.FC<P> = ({ size = 80, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <path d="M8 30h48l-6-4-5-16c-1-3-4-4-7-3l-6 2-6-2c-3-1-6 0-7 3l-5 16z" fill={color} />
    <circle cx="20" cy="44" r="8" fill="none" stroke={color} strokeWidth="4" />
    <circle cx="44" cy="44" r="8" fill="none" stroke={color} strokeWidth="4" />
    <path d="M28 44c2-2 6-2 8 0" stroke={color} strokeWidth="4" fill="none" />
  </svg>
);

export const Pin: React.FC<P> = ({ size = 120, color = "#FF2E3F" }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 48 62">
    <path d="M24 2C12 2 3 11 3 23c0 16 21 37 21 37s21-21 21-37C45 11 36 2 24 2z" fill={color} stroke="#fff" strokeWidth="3" />
    <circle cx="24" cy="22" r="8" fill="#fff" />
  </svg>
);

export const Eye: React.FC<P> = ({ size = 70, color = "#111" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <path d="M2 32s11-18 30-18 30 18 30 18-11 18-30 18S2 32 2 32z" fill="none" stroke={color} strokeWidth="6" />
    <circle cx="32" cy="32" r="9" fill={color} />
  </svg>
);

export const Heart: React.FC<P> = ({ size = 80, color = "#FF2E3F" }) => (
  <svg width={size} height={size} viewBox="0 0 64 58">
    <path d="M32 56S2 38 2 18C2 8 10 2 18 2c6 0 11 3 14 8 3-5 8-8 14-8 8 0 16 6 16 16 0 20-30 38-30 38z" fill={color} />
  </svg>
);

export const Laugh: React.FC<P> = ({ size = 170 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="46" fill="#FFC21A" stroke="#111" strokeWidth="5" />
    <path d="M24 38q8-10 16 0M60 38q8-10 16 0" stroke="#111" strokeWidth="6" fill="none" strokeLinecap="round" />
    <path d="M22 52h56q-4 30-28 30T22 52z" fill="#111" />
    <path d="M34 72q16 10 32 0" stroke="#FF5A6A" strokeWidth="7" fill="none" strokeLinecap="round" />
  </svg>
);

export const Briefcase: React.FC<P> = ({ size = 170 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <rect x="8" y="28" width="84" height="58" rx="8" fill="#fff" stroke="#111" strokeWidth="5" />
    <path d="M36 28v-8c0-3 2-6 6-6h16c4 0 6 3 6 6v8" fill="none" stroke="#111" strokeWidth="5" />
    <path d="M8 50h84" stroke="#111" strokeWidth="5" />
    <rect x="42" y="44" width="16" height="12" rx="2" fill="#FF2E3F" stroke="#111" strokeWidth="4" />
    <path d="M70 10l6 8M80 8l-2 10M86 16l-8 4" stroke="#FF2E3F" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

export const Clapper: React.FC<{ size?: number; open: number }> = ({ size = 520, open }) => (
  <svg width={size} height={size * 0.82} viewBox="0 0 200 164">
    <g transform={`rotate(${-open * 28} 10 52)`}>
      <rect x="8" y="34" width="184" height="22" fill="#111" stroke="#fff" strokeWidth="3" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={`M${18 + i * 30} 34l16 22h-12l-16-22z`} fill="#fff" />
      ))}
    </g>
    <rect x="8" y="58" width="184" height="102" rx="4" fill="#111" stroke="#fff" strokeWidth="3" />
    <path d="M8 92h184M8 126h184M100 92v68" stroke="#fff" strokeWidth="2" />
    <text x="16" y="84" fill="#fff" fontFamily="Anton" fontSize="22">ADEGAN: KONFRONTASI</text>
    <text x="16" y="118" fill="#FFD400" fontFamily="Anton" fontSize="22">TAKE: 01</text>
    <text x="108" y="118" fill="#fff" fontFamily="Anton" fontSize="22">ROLL: 07</text>
    <text x="16" y="152" fill="#fff" fontFamily="Anton" fontSize="20">SCENE 3</text>
    <text x="108" y="152" fill="#FF2E3F" fontFamily="Anton" fontSize="20">ACTION!</text>
  </svg>
);

export const ArrowDown: React.FC<P> = ({ size = 90, color = "#FFD400" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <path d="M32 6v40M14 32l18 20 18-20" stroke={color} strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Send: React.FC<P> = ({ size = 50, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <path d="M6 30L58 8 44 58 30 36z" fill={color} />
  </svg>
);
