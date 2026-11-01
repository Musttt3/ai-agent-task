import React from "react";

type P = { size?: number; color?: string };

export const Pin: React.FC<P> = ({ size = 110, color = "#C8102E" }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 48 62">
    <path d="M24 2C12 2 3 11 3 23c0 16 21 37 21 37s21-21 21-37C45 11 36 2 24 2z" fill={color} stroke="#fff" strokeWidth="3" />
    <circle cx="24" cy="22" r="8" fill="#fff" />
  </svg>
);

export const Crown: React.FC<P> = ({ size = 90, color = "#E8B931" }) => (
  <svg width={size} height={size * 0.75} viewBox="0 0 80 60">
    <path d="M6 50L2 14l20 16L40 4l18 26 20-16-4 36z" fill={color} stroke="#5a3a00" strokeWidth="3" strokeLinejoin="round" />
    <rect x="6" y="50" width="68" height="8" rx="2" fill={color} stroke="#5a3a00" strokeWidth="3" />
    <circle cx="40" cy="36" r="5" fill="#C8102E" />
    <circle cx="20" cy="40" r="3.5" fill="#1d5fd1" />
    <circle cx="60" cy="40" r="3.5" fill="#1d5fd1" />
  </svg>
);

export const Heart: React.FC<P> = ({ size = 70, color = "#C8102E" }) => (
  <svg width={size} height={size} viewBox="0 0 64 58">
    <path d="M32 56S2 38 2 18C2 8 10 2 18 2c6 0 11 3 14 8 3-5 8-8 14-8 8 0 16 6 16 16 0 20-30 38-30 38z" fill={color} />
  </svg>
);

export const Home: React.FC<P> = ({ size = 70, color = "#7A1020" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <path d="M6 30L32 8l26 22" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 26v30h36V26" stroke={color} strokeWidth="6" fill="none" strokeLinejoin="round" />
    <rect x="27" y="38" width="10" height="18" fill={color} />
  </svg>
);

export const Car: React.FC<P> = ({ size = 70, color = "#111" }) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 100 60">
    <path d="M8 40l8-18c2-5 6-8 12-8h40c6 0 10 3 13 8l9 18v10H8z" fill={color} />
    <path d="M28 20h18v14H22zM52 20h18l6 14H52z" fill="#9fd3ff" />
    <circle cx="28" cy="50" r="9" fill="#333" stroke="#fff" strokeWidth="3" />
    <circle cx="74" cy="50" r="9" fill="#333" stroke="#fff" strokeWidth="3" />
  </svg>
);

export const Clock: React.FC<P & { t: number }> = ({ size = 80, color = "#fff", t }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="28" fill="none" stroke={color} strokeWidth="5" />
    <line x1="32" y1="32" x2="32" y2="14" stroke={color} strokeWidth="5" strokeLinecap="round" transform={`rotate(${t * 360} 32 32)`} />
    <line x1="32" y1="32" x2="44" y2="32" stroke={color} strokeWidth="5" strokeLinecap="round" transform={`rotate(${t * 30} 32 32)`} />
  </svg>
);

export const Star: React.FC<P> = ({ size = 60, color = "#E8B931" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <path d="M32 2l7 22h23L44 38l7 23-19-14-19 14 7-23L2 24h23z" fill={color} stroke="#fff" strokeWidth="2" />
  </svg>
);

/** scales of justice; tilt in degrees (+ = right pan lower) */
export const Justice: React.FC<{ size?: number; tilt: number; color?: string }> = ({
  size = 420,
  tilt,
  color = "#E8B931",
}) => {
  const rad = (tilt * Math.PI) / 180;
  const L = 150;
  const lx = 200 - Math.cos(rad) * L;
  const ly = 90 - Math.sin(rad) * L;
  const rx = 200 + Math.cos(rad) * L;
  const ry = 90 + Math.sin(rad) * L;
  const pan = (x: number, y: number) => (
    <g>
      <line x1={x} y1={y} x2={x - 55} y2={y + 120} stroke={color} strokeWidth="4" />
      <line x1={x} y1={y} x2={x + 55} y2={y + 120} stroke={color} strokeWidth="4" />
      <path d={`M${x - 75} ${y + 120} h150 q-10 40 -75 40 t-75 -40z`} fill={color} stroke="#5a3a00" strokeWidth="3" />
    </g>
  );
  return (
    <svg width={size} height={size * 1.05} viewBox="0 0 400 420">
      <rect x="190" y="70" width="20" height="300" fill={color} stroke="#5a3a00" strokeWidth="3" />
      <path d="M120 400h160l-20-30H140z" fill={color} stroke="#5a3a00" strokeWidth="3" />
      <circle cx="200" cy="60" r="18" fill={color} stroke="#5a3a00" strokeWidth="3" />
      <line x1={lx} y1={ly} x2={rx} y2={ry} stroke={color} strokeWidth="12" strokeLinecap="round" />
      {pan(lx, ly)}
      {pan(rx, ry)}
    </svg>
  );
};
