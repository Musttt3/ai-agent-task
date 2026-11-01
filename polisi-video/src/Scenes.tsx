import React from "react";
import { AbsoluteFill, Easing, random } from "remotion";
import {
  BODY,
  BottomShade,
  CREAM,
  GOLD,
  HEAD,
  INK,
  MAROON,
  Photo,
  RED,
  ROYAL,
  Vignette,
  YELLOW,
  lerp,
  shakeAt,
  textStroke,
  usePop,
  useT,
} from "./lib";
import { Arrow, Chip, DrawCircle, Stamp } from "./common";
import { Car, Clock, Crown, Heart, Home, Justice, Pin, Star } from "./Icons";

const IW = 941;
const IH = 1672;

/** image + optional zoom toward a focal point (px in 1080x1920 space) */
const Pic: React.FC<{
  n: number;
  scale: number;
  x?: number;
  y?: number;
  filter?: string;
  fx?: number;
  fy?: number;
  punch?: number;
  children?: React.ReactNode;
}> = ({ n, scale, x = 0, y = 0, filter, fx = 540, fy = 960, punch = 1, children }) => (
  <AbsoluteFill style={{ transformOrigin: `${fx}px ${fy}px`, scale: String(punch) }}>
    <Photo src={`img/p${n}.jpg`} iw={IW} ih={IH} scale={scale} x={x} y={y} filter={filter} />
    {children}
  </AbsoluteFill>
);

/** old-film overlay: grain, flicker, sprocket holes */
export const FilmLook: React.FC<{ sprockets?: boolean; strength?: number }> = ({ sprockets = false, strength = 1 }) => {
  const t = useT();
  const k = Math.floor(t * 24);
  const flicker = 0.06 + random(`fl${k}`) * 0.08;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "#2a1a05", opacity: flicker * strength, mixBlendMode: "multiply" }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.22 * strength, mixBlendMode: "overlay" }}>
        <filter id={`g${k}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={k} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter={`url(#g${k})`} />
      </svg>
      {/* scratches */}
      {random(`sc${k}`) > 0.6 ? (
        <div
          style={{
            position: "absolute",
            left: random(`sx${k}`) * 1080,
            top: 0,
            width: 2,
            height: 1920,
            background: "rgba(255,255,255,0.35)",
          }}
        />
      ) : null}
      {sprockets
        ? [0, 1].map((side) => (
            <div
              key={side}
              style={{
                position: "absolute",
                top: -((t * 400) % 120),
                [side ? "right" : "left"]: 0,
                width: 70,
                height: 2200,
                background: "#000",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 50,
                paddingTop: 20,
              }}
            >
              {new Array(20).fill(0).map((_, i) => (
                <div key={i} style={{ width: 36, height: 50, borderRadius: 8, background: "#e8e0cc" }} />
              ))}
            </div>
          ))
        : null}
    </AbsoluteFill>
  );
};

const BigText: React.FC<{
  at: number;
  children: React.ReactNode;
  size?: number;
  color?: string;
  stroke?: string;
  font?: string;
  top: number;
  slam?: boolean;
  style?: React.CSSProperties;
}> = ({ at, children, size = 150, color = "#fff", stroke = "#000", font = HEAD, top, slam = false, style }) => {
  const t = useT();
  const pop = usePop(at, 11);
  if (t < at) return null;
  const s = slam ? lerp(t, [at, at + 0.13], [2.8, 1], Easing.bezier(0.5, 0, 0.9, 0.6)) : pop;
  return (
    <div
      style={{
        position: "absolute",
        left: 40,
        right: 40,
        top,
        textAlign: "center",
        fontFamily: font,
        fontSize: size,
        lineHeight: 1.05,
        color,
        letterSpacing: 2,
        scale: String(s),
        opacity: lerp(t, [at, at + 0.06], [0, 1]),
        ...textStroke(Math.round(size / 13), stroke),
        filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.55))",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/* ============================ S1 HOOK ============================== */
// 0 – 2.55 "Polisi ini nekat menilang Sultan Jogja."
export const S1Hook: React.FC = () => {
  const t = useT();
  const blink = Math.floor(t * 6) % 2;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Pic n={8} scale={lerp(t, [0, 2.6], [1.25, 1.05])} />
      <BottomShade />
      <AbsoluteFill
        style={{
          background: blink
            ? "linear-gradient(90deg, rgba(255,0,30,0.55), rgba(0,0,0,0) 35%)"
            : "linear-gradient(270deg, rgba(0,80,255,0.55), rgba(0,0,0,0) 35%)",
          opacity: lerp(t, [0, 0.2, 2.2, 2.55], [0, 1, 1, 0.3]),
        }}
      />
      <BigText at={0.02} top={1080} size={150}>
        POLISI NEKAT
      </BigText>
      {t >= 1.12 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1260, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              fontFamily: HEAD,
              fontSize: 150,
              color: GOLD,
              background: MAROON,
              padding: "4px 36px 12px",
              rotate: "-3deg",
              boxShadow: "0 16px 0 #000",
              border: `6px solid ${GOLD}`,
              scale: String(lerp(t, [1.12, 1.25], [2.6, 1], Easing.bezier(0.5, 0, 0.9, 0.6))),
            }}
          >
            TILANG SULTAN!
          </div>
        </div>
      ) : null}
      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

/* ============================ S2 TEASER ============================ */
// 2.55 – 7.25 "Tapi siapa sangka, nasibnya justru berakhir mengejutkan."
export const S2Teaser: React.FC = () => {
  const t = useT();
  const q = usePop(3.22, 7);
  const glitchOn = t > 6.22 && t < 6.5;
  const k = Math.floor(t * 30);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Pic
        n={1}
        scale={lerp(t, [2.5, 7.3], [1.3, 1.1])}
        filter={`blur(${lerp(t, [2.5, 6.2], [34, 16])}px) sepia(0.6) brightness(0.55)`}
      />
      <FilmLook strength={0.7} />
      <BigText at={2.62} top={430} size={78} font={BODY} style={{ fontWeight: 900 }}>
        TAPI SIAPA SANGKA...
      </BigText>
      {t >= 3.22 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 620,
            textAlign: "center",
            fontFamily: HEAD,
            fontSize: 420,
            color: GOLD,
            lineHeight: 1,
            scale: String(q),
            rotate: `${Math.sin(t * 4) * 8}deg`,
            translate: `0px ${Math.sin(t * 5) * 18}px`,
            ...textStroke(22, "#000"),
          }}
        >
          ?
        </div>
      ) : null}
      <BigText at={4.42} top={1150} size={90} font={BODY} style={{ fontWeight: 900 }}>
        NASIBNYA BERAKHIR...
      </BigText>
      {t >= 6.22 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1290, textAlign: "center" }}>
          {[
            { c: "rgba(255,0,60,0.8)", dx: glitchOn ? (random(`a${k}`) - 0.5) * 50 : 0 },
            { c: "rgba(0,220,255,0.8)", dx: glitchOn ? (random(`b${k}`) - 0.5) * 50 : 0 },
            { c: YELLOW, dx: 0 },
          ].map((l, i) => (
            <div
              key={i}
              style={{
                position: i < 2 ? "absolute" : "relative",
                left: 0,
                right: 0,
                fontFamily: HEAD,
                fontSize: 160,
                color: l.c,
                translate: `${l.dx}px 0px`,
                scale: String(lerp(t, [6.22, 6.35], [2.2, 1], Easing.bezier(0.5, 0, 0.9, 0.6))),
                ...(i === 2 ? textStroke(12, "#000") : {}),
              }}
            >
              MENGEJUTKAN!
            </div>
          ))}
        </div>
      ) : null}
      <Vignette strength={0.7} />
    </AbsoluteFill>
  );
};

/* ============================ S3 1960-an =========================== */
// 7.25 – 9.85 "Pada tahun 1960-an,"
export const S3Year: React.FC = () => {
  const t = useT();
  const yr = Math.round(lerp(t, [7.3, 8.1], [2026, 1960], Easing.out(Easing.cubic)));
  const done = t >= 8.1;
  const p = usePop(7.3, 14);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Pic n={11} scale={lerp(t, [7.0, 9.9], [1.12, 1.0])} filter="sepia(1) contrast(1.1) brightness(0.8)" />
      <FilmLook sprockets strength={1.2} />
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.35)" }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 640,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          scale: String(p),
        }}
      >
        <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 64, color: CREAM, letterSpacing: 14, ...textStroke(8) }}>
          TAHUN
        </div>
        <div
          style={{
            fontFamily: HEAD,
            fontSize: 300,
            lineHeight: 1,
            color: done ? GOLD : CREAM,
            fontVariantNumeric: "tabular-nums",
            scale: String(done ? lerp(t, [8.1, 8.25], [1.15, 1]) : 1),
            ...textStroke(16, "#000"),
          }}
        >
          {yr}
          {done ? "-AN" : ""}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ============================ S4 ROYADIN =========================== */
// 9.85 – 11.55 "seorang polisi bernama Royadin"
export const S4Royadin: React.FC = () => {
  const t = useT();
  const plate = usePop(11.0, 12);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Pic n={10} scale={lerp(t, [9.7, 11.6], [1.05, 1.15])} fy={600} />
      <FilmLook strength={0.8} />
      <BottomShade />
      <Chip at={10.15} bg={CREAM} color={MAROON} from="left" style={{ left: 80, top: 1180, fontSize: 46 }}>
        SEORANG POLISI
      </Chip>
      {t >= 11.0 ? (
        <div
          style={{
            position: "absolute",
            left: 80,
            top: 1280,
            background: MAROON,
            border: `6px solid ${GOLD}`,
            padding: "4px 40px 10px",
            fontFamily: HEAD,
            fontSize: 150,
            color: GOLD,
            letterSpacing: 6,
            boxShadow: "14px 14px 0 #000",
            clipPath: `inset(0 ${(1 - plate) * 100}% 0 0)`,
          }}
        >
          ROYADIN
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ============================ S5 STOP ============================== */
// 11.55 – 12.8 "menghentikan mobil"
export const S5Stop: React.FC = () => {
  const t = useT();
  const p = lerp(t, [11.62, 11.8], [0, 1], Easing.out(Easing.back(2)));
  const sh = shakeAt(t, [11.62], 14);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Pic n={4} scale={lerp(t, [11.5, 12.9], [1.0, 1.1])} fx={805} fy={520} punch={lerp(t, [11.62, 11.75], [1.08, 1])} />
      <BottomShade />
      {t >= 11.62 ? (
        <div
          style={{
            position: "absolute",
            left: 430,
            top: 150,
            fontFamily: HEAD,
            fontSize: 170,
            color: YELLOW,
            rotate: "-10deg",
            scale: String(p),
            translate: `${sh.x}px ${sh.y}px`,
            ...textStroke(14, "#000"),
          }}
        >
          PRIIIT!
        </div>
      ) : null}
      {t >= 11.62 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: p }}>
          {[0, 1, 2].map((i) => (
            <line
              key={i}
              x1={870 + i * 30}
              y1={430 - i * 40}
              x2={950 + i * 40}
              y2={380 - i * 60}
              stroke={YELLOW}
              strokeWidth={12}
              strokeLinecap="round"
            />
          ))}
        </svg>
      ) : null}
      <Chip at={12.2} bg={RED} color="#fff" style={{ left: 80, top: 1350, fontSize: 52 }}>
        MOBIL DIHENTIKAN
      </Chip>
    </AbsoluteFill>
  );
};

/* ============================ S6 RED LIGHT ========================= */
// 12.8 – 14.95 "yang menerobos lampu merah di Semarang."
export const S6RedLight: React.FC = () => {
  const t = useT();
  const pulse = 0.5 + 0.5 * Math.sin(t * 14);
  const pinY = lerp(t, [14.04, 14.35], [-400, 0], Easing.bounce);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Pic n={11} scale={lerp(t, [12.7, 15.0], [1.04, 1.14])} fx={760} fy={600} />
      <BottomShade />
      {/* red light glow */}
      <div
        style={{
          position: "absolute",
          left: 975 - 110,
          top: 105 - 110,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,40,40,0.95) 0%, rgba(255,0,0,0.35) 40%, rgba(255,0,0,0) 70%)",
          opacity: 0.4 + pulse * 0.6,
          mixBlendMode: "screen",
        }}
      />
      <DrawCircle at={12.9} cx={960} cy={150} r={95} color={RED} />
      <Chip at={13.0} bg={RED} color="#fff" from="left" style={{ left: 70, top: 1250, fontSize: 56 }}>
        MENEROBOS LAMPU MERAH!
      </Chip>
      <Arrow at={13.15} x1={600} y1={1240} x2={880} y2={980} color={RED} />
      {t >= 14.04 ? (
        <>
          <div style={{ position: "absolute", left: 610, top: 150 + pinY }}>
            <Pin size={100} />
          </div>
          <Chip at={14.25} bg={CREAM} color={MAROON} style={{ left: 450, top: 300, fontSize: 52 }}>
            SEMARANG
          </Chip>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/* ============================ S7 WINDOW ============================ */
// 14.95 – 18.0 "Saat kaca mobil dibuka, ia langsung terkejut."
export const S7Window: React.FC = () => {
  const t = useT();
  const down = lerp(t, [15.5, 16.25], [0, 1], Easing.inOut(Easing.quad));
  const shock = t >= 16.9;
  const punch = shock ? lerp(t, [16.9, 17.05], [1, 1.3], Easing.out(Easing.cubic)) : 1;
  const sh = shakeAt(t, [16.9], 20);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <div style={{ position: "absolute", inset: 0, translate: `${sh.x}px ${sh.y}px` }}>
        <Pic n={5} scale={lerp(t, [14.9, 16.8], [1.0, 1.08])} fx={324} fy={300} punch={punch}>
          {/* tinted glass rolling down */}
          <div
            style={{
              position: "absolute",
              left: 330,
              top: 450 + down * 760,
              width: 740,
              height: Math.max(0, 760 - down * 760),
              background:
                "linear-gradient(115deg, rgba(10,14,20,0.92) 0%, rgba(10,14,20,0.92) 40%, rgba(160,190,220,0.45) 46%, rgba(10,14,20,0.9) 52%, rgba(10,14,20,0.92) 100%)",
              borderTop: "6px solid rgba(200,220,240,0.6)",
            }}
          />
        </Pic>
      </div>
      <BottomShade />
      {!shock ? (
        <Chip at={15.3} bg={CREAM} color={INK} from="left" style={{ left: 70, top: 170, fontSize: 46 }}>
          KACA MOBIL DIBUKA...
        </Chip>
      ) : null}
      {shock ? (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            {new Array(10).fill(0).map((_, i) => {
              const a = (i / 10) * Math.PI * 2;
              const r1 = 280 + Math.sin(t * 30 + i) * 20;
              return (
                <line
                  key={i}
                  x1={324 + Math.cos(a) * r1}
                  y1={330 + Math.sin(a) * r1}
                  x2={324 + Math.cos(a) * (r1 + 110)}
                  y2={330 + Math.sin(a) * (r1 + 110)}
                  stroke={YELLOW}
                  strokeWidth={14}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          <BigText at={16.9} top={1250} size={170} slam color={YELLOW}>
            TERKEJUT!
          </BigText>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/* ============================ S8 SULTAN ============================ */
// 18.0 – 21.7 "Pengemudinya ternyata Sri Sultan Hamengkubuwono IX."
export const S8Sultan: React.FC = () => {
  const t = useT();
  const lit = lerp(t, [19.2, 19.5], [0.18, 1]);
  const raysO = lerp(t, [19.2, 19.6], [0, 0.55]);
  const plate = usePop(19.3, 14);
  const crown = usePop(19.5, 9);
  const name1 = "SRI SULTAN";
  const name2 = "HAMENGKUBUWONO IX";
  const letters = (s: string, at: number, gap: number) =>
    s.split("").map((c, i) => (
      <span key={i} style={{ opacity: lerp(t, [at + i * gap, at + i * gap + 0.12], [0, 1]), display: "inline-block", translate: `0px ${lerp(t, [at + i * gap, at + i * gap + 0.2], [20, 0])}px` }}>
        {c === " " ? " " : c}
      </span>
    ));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Pic n={9} scale={lerp(t, [18.0, 21.8], [1.15, 1.02])} filter={`brightness(${lit}) contrast(1.1)`} />
      {/* royal rays */}
      <AbsoluteFill
        style={{
          background: `repeating-conic-gradient(from ${t * 20}deg at 50% 38%, rgba(232,185,49,0.35) 0deg 6deg, rgba(0,0,0,0) 6deg 18deg)`,
          opacity: raysO,
          mixBlendMode: "screen",
        }}
      />
      <BottomShade />
      <BigText at={18.06} top={200} size={66} font={BODY} style={{ fontWeight: 900, opacity: lerp(t, [18.06, 18.2, 19.1, 19.3], [0, 1, 1, 0]) }}>
        PENGEMUDINYA TERNYATA...
      </BigText>
      {t >= 19.3 ? (
        <div
          style={{
            position: "absolute",
            left: 60,
            right: 60,
            top: 1120,
            padding: "40px 20px 36px",
            background: "linear-gradient(180deg, rgba(60,8,16,0.92), rgba(122,16,32,0.92))",
            border: `6px solid ${GOLD}`,
            outline: `3px solid ${GOLD}`,
            outlineOffset: 10,
            borderRadius: 12,
            textAlign: "center",
            scale: String(plate),
            boxShadow: "0 30px 60px rgba(0,0,0,0.7)",
          }}
        >
          <div style={{ position: "absolute", left: 0, right: 0, top: -80, display: "flex", justifyContent: "center", scale: String(crown) }}>
            <Crown size={140} />
          </div>
          <div style={{ fontFamily: ROYAL, fontWeight: 900, fontSize: 78, color: GOLD, letterSpacing: 6 }}>
            {letters(name1, 19.3, 0.03)}
          </div>
          <div style={{ fontFamily: ROYAL, fontWeight: 900, fontSize: 62, color: CREAM, letterSpacing: 2, marginTop: 6 }}>
            {letters(name2, 19.9, 0.035)}
          </div>
        </div>
      ) : null}
      <Vignette strength={0.6} />
    </AbsoluteFill>
  );
};

/* ============================ S9 TILANG ============================ */
// 21.7 – 27.25 "Meski berhadapan dengan orang penting, Royadin tetap menjalankan tugasnya dan memberikan surat tilang."
export const S9Ticket: React.FC = () => {
  const t = useT();
  const ticket = usePop(26.3, 14);
  const sign = lerp(t, [26.6, 27.0], [0, 1]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Pic n={6} scale={lerp(t, [21.6, 27.3], [1.0, 1.15])} fx={400} fy={1000} />
      <BottomShade />
      <Chip at={22.7} bg={GOLD} color={INK} from="left" style={{ left: 70, top: 170, fontSize: 50 }}>
        <Crown size={56} color="#fff" /> ORANG PENTING
      </Chip>
      <Stamp at={24.22} text="TETAP TEGAS!" color={YELLOW} size={100} rotate={-8} style={{ left: 120, top: 560, background: "rgba(0,0,0,0.65)" }} />
      {t >= 26.3 ? (
        <div
          style={{
            position: "absolute",
            left: 120,
            top: 860,
            width: 840,
            background: CREAM,
            borderRadius: 10,
            boxShadow: "0 30px 60px rgba(0,0,0,0.7)",
            translate: `${(1 - ticket) * 900}px ${(1 - ticket) * 300}px`,
            rotate: `${(1 - ticket) * 25 + 3}deg`,
            overflow: "hidden",
            fontFamily: BODY,
            color: INK,
          }}
        >
          <div style={{ background: MAROON, color: GOLD, fontFamily: HEAD, fontSize: 76, padding: "14px 36px", letterSpacing: 4 }}>
            SURAT TILANG
          </div>
          <div style={{ padding: "26px 36px 30px", fontWeight: 800, fontSize: 34, lineHeight: 1.6 }}>
            <div>Pelanggaran: <b style={{ fontWeight: 900 }}>Menerobos lampu merah</b></div>
            <div>Lokasi: <b style={{ fontWeight: 900 }}>Semarang</b></div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 10 }}>
              Petugas:
              <svg width={260} height={70}>
                <path
                  d="M5 50 C30 10, 50 10, 60 45 S95 70, 110 30 S150 5, 160 45 S200 60, 250 25"
                  fill="none"
                  stroke="#1a3a8a"
                  strokeWidth={5}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - sign}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <Stamp at={26.95} text="DITILANG" color={RED} size={84} rotate={-14} style={{ right: 40, top: 150 }} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ============================ S10 LETTER =========================== */
// 27.25 – 32.95 "Keesokan harinya, surat dari keraton tiba. Royadin mengira dirinya akan dihukum."
export const S10Letter: React.FC = () => {
  const t = useT();
  const fear = t >= 30.54;
  const gray = lerp(t, [30.54, 30.9], [0, 1]);
  const beat = fear ? Math.max(0, Math.sin((t - 30.6) * Math.PI * 2 * 1.25)) ** 4 : 0;
  const glow = 0.5 + 0.5 * Math.sin(t * 6);
  const daysP = usePop(27.32, 12);
  const sh = shakeAt(t, [32.1], 18);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Pic
        n={7}
        scale={lerp(t, [27.2, 33.0], [1.0, 1.18])}
        fx={405}
        fy={765}
        filter={`grayscale(${gray}) brightness(${1 - gray * 0.35})`}
      />
      {/* seal glow */}
      {t >= 28.86 && !fear ? (
        <div
          style={{
            position: "absolute",
            left: 405 - 200,
            top: 765 - 200,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,215,90,0.85) 0%, rgba(255,200,60,0.25) 45%, rgba(0,0,0,0) 70%)",
            mixBlendMode: "screen",
            opacity: lerp(t, [28.86, 29.1], [0, 1]) * (0.6 + 0.4 * glow),
          }}
        />
      ) : null}
      <BottomShade />
      {t >= 27.32 && t < 28.86 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 230,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 24,
            scale: String(daysP),
          }}
        >
          <Clock t={(t - 27.3) * 3} size={100} />
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 60, color: "#fff", ...textStroke(10) }}>KEESOKAN HARINYA...</div>
        </div>
      ) : null}
      <Chip at={29.2} bg={GOLD} color={MAROON} style={{ left: 120, top: 1080, fontSize: 52 }}>
        <Crown size={56} color={MAROON} /> SURAT DARI KERATON
      </Chip>
      {fear ? (
        <>
          <AbsoluteFill
            style={{
              background: "radial-gradient(circle, rgba(0,0,0,0) 30%, rgba(170,0,15,0.85) 100%)",
              opacity: 0.35 + beat * 0.65,
            }}
          />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1250, textAlign: "center", translate: `${sh.x}px ${sh.y}px` }}>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 60, color: "#fff", ...textStroke(10) }}>
              {t >= 30.94 ? "MENGIRA AKAN..." : ""}
            </div>
            {t >= 32.1 ? (
              <div
                style={{
                  fontFamily: HEAD,
                  fontSize: 220,
                  color: RED,
                  lineHeight: 1,
                  scale: String(lerp(t, [32.1, 32.24], [2.5, 1], Easing.bezier(0.5, 0, 0.9, 0.6)) * (1 + beat * 0.05)),
                  ...textStroke(16, "#fff"),
                }}
              >
                DIHUKUM?
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/* ============================ S11 SEBALIKNYA ======================= */
// 32.95 – 38.7 "Namun, yang terjadi justru sebaliknya. Sultan ternyata kagum dengan ketegasannya,"
export const S11Reverse: React.FC = () => {
  const t = useT();
  const flip = lerp(t, [34.48, 34.9], [180, 0], Easing.out(Easing.back(1.4)));
  const revOut = lerp(t, [35.85, 36.0], [1, 0]);
  const kagum = usePop(36.94, 9);
  const leak = 0.5 + 0.5 * Math.sin(t * 1.7);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Pic n={3} scale={lerp(t, [32.9, 38.8], [1.18, 1.0])} fx={640} fy={330} />
      {/* warm light leak */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${20 + leak * 60}% 15%, rgba(255,190,90,0.55), rgba(0,0,0,0) 55%)`,
          mixBlendMode: "screen",
        }}
      />
      <BottomShade />
      <BigText at={33.08} top={1020} size={80} font={BODY} style={{ fontWeight: 900, opacity: revOut }}>
        NAMUN...
      </BigText>
      {t >= 34.48 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1130,
            display: "flex",
            justifyContent: "center",
            perspective: 900,
            opacity: revOut,
          }}
        >
          <div
            style={{
              fontFamily: HEAD,
              fontSize: 130,
              lineHeight: 1.05,
              textAlign: "center",
              color: INK,
              background: GOLD,
              padding: "10px 40px 18px",
              borderRadius: 16,
              boxShadow: "0 14px 0 #000",
              transform: `rotateX(${flip}deg)`,
              backfaceVisibility: "hidden",
            }}
          >
            JUSTRU SEBALIKNYA!
          </div>
        </div>
      ) : null}
      {t >= 36.0 ? (
        <>
          {new Array(8).fill(0).map((_, i) => {
            const a = (i / 8) * Math.PI * 2 + t * 0.8;
            const r = 300 + Math.sin(t * 3 + i) * 20;
            const pop = lerp(t, [36.94 + i * 0.05, 37.15 + i * 0.05], [0, 1], Easing.out(Easing.back(3)));
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 640 + Math.cos(a) * r - 30,
                  top: 330 + Math.sin(a) * r * 0.8 - 30,
                  scale: String(pop),
                  rotate: `${t * 90 + i * 40}deg`,
                }}
              >
                <Star size={60} />
              </div>
            );
          })}
          <BigText at={36.04} top={1060} size={74} font={BODY} style={{ fontWeight: 900 }}>
            SULTAN JUSTRU...
          </BigText>
          {t >= 36.94 ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1170, display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  fontFamily: HEAD,
                  fontSize: 200,
                  color: GOLD,
                  lineHeight: 1,
                  scale: String(kagum),
                  textShadow: "0 0 50px rgba(232,185,49,0.9)",
                  ...textStroke(14, "#000"),
                }}
              >
                KAGUM!
              </div>
            </div>
          ) : null}
          <Chip at={37.64} bg={CREAM} color={MAROON} style={{ left: 130, top: 1420, fontSize: 46 }}>
            DENGAN KETEGASANNYA
          </Chip>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/* ============================ S12 INVITATION ======================= */
// 38.7 – 42.9 "bahkan mengundang Royadin bersama keluarganya pindah ke Jogjakarta."
const routePt = (p: number) => {
  // quadratic bezier from Semarang (top) to Yogyakarta (bottom)
  const a = { x: 560, y: 70 };
  const c = { x: 160, y: 190 };
  const b = { x: 300, y: 330 };
  const x = (1 - p) ** 2 * a.x + 2 * (1 - p) * p * c.x + p ** 2 * b.x;
  const y = (1 - p) ** 2 * a.y + 2 * (1 - p) * p * c.y + p ** 2 * b.y;
  return { x, y };
};

const RouteCard: React.FC<{ p: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ p, style, children }) => {
  const car = routePt(Math.min(1, p));
  return (
    <div
      style={{
        position: "absolute",
        left: 140,
        width: 800,
        height: 420,
        background: CREAM,
        borderRadius: 30,
        border: `6px solid ${MAROON}`,
        boxShadow: "0 24px 50px rgba(0,0,0,0.6)",
        overflow: "hidden",
        ...style,
      }}
    >
      <svg width={800} height={420} style={{ position: "absolute", inset: 0 }}>
        <path d="M0 330 Q200 300 400 360 T800 340 V420 H0z" fill="#9cc7e8" opacity={0.6} />
        <path d="M0 40 Q250 0 520 30 T800 20 V0 H0z" fill="#9cc7e8" opacity={0.6} />
        <path
          d="M560 70 Q160 190 300 330"
          fill="none"
          stroke={MAROON}
          strokeWidth={8}
          strokeDasharray="18 14"
          opacity={0.35}
        />
        <path
          d="M560 70 Q160 190 300 330"
          fill="none"
          stroke={RED}
          strokeWidth={10}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - Math.min(1, p)}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: "absolute", left: 560 - 30, top: 70 - 78 }}>
        <Pin size={60} color="#1d5fd1" />
      </div>
      <div style={{ position: "absolute", left: 605, top: 62, fontFamily: HEAD, fontSize: 44, color: INK }}>SEMARANG</div>
      <div style={{ position: "absolute", left: 300 - 30, top: 330 - 78 }}>
        <Pin size={60} />
      </div>
      <div style={{ position: "absolute", left: 360, top: 320, fontFamily: HEAD, fontSize: 48, color: RED }}>YOGYAKARTA</div>
      {p > 0 ? (
        <div style={{ position: "absolute", left: car.x - 40, top: car.y - 46 }}>
          <Car size={80} />
        </div>
      ) : null}
      {children}
    </div>
  );
};

export const S12Invite: React.FC = () => {
  const t = useT();
  const card = usePop(40.9, 14);
  const route = lerp(t, [41.3, 42.5], [0, 1], Easing.inOut(Easing.cubic));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Pic n={2} scale={lerp(t, [38.6, 43.0], [1.12, 1.0])} fx={540} fy={650} />
      <BottomShade />
      <Chip at={39.26} bg={GOLD} color={MAROON} from="left" style={{ left: 70, top: 170, fontSize: 52 }}>
        <Crown size={56} color={MAROON} /> DIUNDANG SULTAN!
      </Chip>
      <Chip at={40.4} bg={CREAM} color={MAROON} from="right" style={{ right: 70, top: 280, fontSize: 46 }}>
        <Heart size={44} /> BERSAMA KELUARGA
      </Chip>
      {t >= 40.9 ? <RouteCard p={route} style={{ top: 1080, scale: String(card) }} /> : null}
    </AbsoluteFill>
  );
};

/* ============================ S13 REFUSE =========================== */
// 42.9 – 48.35 "Namun, Royadin memilih menolak tawaran tersebut dan tetap mengabdi di kampung halamannya."
export const S13Refuse: React.FC = () => {
  const t = useT();
  const x = lerp(t, [44.56, 44.8], [0, 1]);
  const cardOut = lerp(t, [45.8, 46.05], [1, 0]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Pic n={1} scale={lerp(t, [42.8, 48.4], [1.0, 1.14])} fx={830} fy={600} />
      <BottomShade />
      {t < 46.05 ? (
        <RouteCard p={1} style={{ top: 1080, scale: String(cardOut), rotate: `${(1 - cardOut) * 20}deg` }}>
          {t >= 44.56 ? (
            <svg width={800} height={420} style={{ position: "absolute", inset: 0 }}>
              <line x1={120} y1={60} x2={680} y2={370} stroke={RED} strokeWidth={26} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, x * 2)} />
              <line x1={680} y1={60} x2={120} y2={370} stroke={RED} strokeWidth={26} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, x * 2 - 1)} />
            </svg>
          ) : null}
        </RouteCard>
      ) : null}
      {t < 46.05 ? (
        <Stamp at={44.6} text="DITOLAK" color={RED} size={130} rotate={-10} style={{ left: 250, top: 900, background: "rgba(245,230,200,0.9)", opacity: cardOut }} />
      ) : null}
      <Chip at={43.68} bg={CREAM} color={MAROON} from="left" style={{ left: 70, top: 170, fontSize: 48 }}>
        ROYADIN MEMILIH...
      </Chip>
      {t >= 46.1 ? (
        <>
          <BigText at={46.1} top={1120} size={130} color={GOLD}>
            TETAP MENGABDI
          </BigText>
          <Chip at={47.16} bg={CREAM} color={MAROON} style={{ left: 170, top: 1290, fontSize: 52 }}>
            <Home size={56} /> DI KAMPUNG HALAMAN <Heart size={46} />
          </Chip>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/* ============================ S14 MORAL ============================ */
// 48.35 – end "Kisah ini menjadi pengingat bahwa hukum seharusnya berlaku untuk siapa saja, tanpa memandang jabatan."
export const S14Moral: React.FC = () => {
  const t = useT();
  const tilt = lerp(t, [50.3, 50.6, 53.4, 54.2], [0, -16, -16, 0], Easing.inOut(Easing.cubic)) + (t > 54.2 ? Math.sin((t - 54.2) * 6) * 3 * Math.exp(-(t - 54.2) * 2) : 0);
  const scaleP = usePop(50.3, 12);
  const glow = lerp(t, [54.0, 54.4, 55.5], [0, 1, 0.5]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Pic n={8} scale={lerp(t, [48.3, 57.0], [1.05, 1.2])} filter="brightness(0.38) blur(3px) sepia(0.3)" />
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 30%, rgba(232,185,49,0.5), rgba(0,0,0,0) 55%)",
          opacity: glow,
          mixBlendMode: "screen",
        }}
      />
      <BigText at={48.44} top={190} size={60} font={BODY} color={CREAM} style={{ fontWeight: 900, letterSpacing: 6 }}>
        PENGINGAT UNTUK KITA
      </BigText>
      {t >= 50.3 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", scale: String(scaleP) }}>
          <Justice size={440} tilt={tilt} />
        </div>
      ) : null}
      <BigText at={50.3} top={840} size={110} color={CREAM}>
        HUKUM BERLAKU UNTUK
      </BigText>
      <BigText at={52.06} top={960} size={150} color={GOLD} slam>
        SIAPA SAJA
      </BigText>
      {t >= 53.18 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1170, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              background: MAROON,
              border: `6px solid ${GOLD}`,
              color: GOLD,
              fontFamily: HEAD,
              fontSize: 84,
              padding: "6px 36px 12px",
              letterSpacing: 3,
              boxShadow: "0 14px 0 #000",
              clipPath: `inset(0 ${(1 - lerp(t, [53.18, 53.9], [0, 1])) * 100}% 0 0)`,
            }}
          >
            TANPA MEMANDANG JABATAN
          </div>
        </div>
      ) : null}
      <Vignette strength={0.7} />
    </AbsoluteFill>
  );
};
