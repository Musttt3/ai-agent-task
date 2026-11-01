import React from "react";
import { AbsoluteFill, Easing, random } from "remotion";
import {
  BODY,
  BottomShade,
  HEAD,
  INK,
  Photo,
  RED,
  Vignette,
  W,
  YELLOW,
  lerp,
  shakeAt,
  textStroke,
  usePop,
  useT,
} from "./lib";
import {
  ArrowDown,
  Briefcase,
  Clapper,
  Eye,
  Heart,
  Incognito,
  Laugh,
  Pin,
  Send,
} from "./Icons";

/* ------------------------------------------------------------------ */
/* Scene wrapper: mounts in its time window and runs entry transition */
/* ------------------------------------------------------------------ */

type Enter = "whip" | "zoom" | "glitch" | "whipUp" | "none";

export const Scene: React.FC<{
  start: number;
  end: number;
  enter: Enter;
  impacts?: number[];
  children: React.ReactNode;
}> = ({ start, end, enter, impacts = [], children }) => {
  const t = useT();
  const pre = enter === "glitch" ? 0.1 : enter === "none" ? 0 : 0.22;
  if (t < start - pre || t >= end + 0.04) return null;
  const p = lerp(t, [start - pre, start + 0.04], [0, 1], Easing.bezier(0.6, 0, 0.2, 1));
  const shake = shakeAt(t, impacts);
  let translate = `${shake.x}px ${shake.y}px`;
  let scale = 1;
  let filter = "none";
  let opacity = 1;
  if (enter === "whip") {
    translate = `${(1 - p) * W * 1.05 + shake.x}px ${shake.y}px`;
    filter = `blur(${(1 - p) * 30}px)`;
  } else if (enter === "whipUp") {
    translate = `${shake.x}px ${(1 - p) * 1920 + shake.y}px`;
    filter = `blur(${(1 - p) * 30}px)`;
  } else if (enter === "zoom") {
    scale = 1 + (1 - p) * 0.6;
    opacity = p;
    filter = `blur(${(1 - p) * 22}px)`;
  } else if (enter === "glitch") {
    const g = t < start + 0.18;
    if (g) {
      const r = random(Math.floor(t * 30));
      translate = `${(r - 0.5) * 120}px ${shake.y}px`;
      filter = `hue-rotate(${r * 180}deg) saturate(2.5) contrast(1.4)`;
    }
  }
  return (
    <AbsoluteFill style={{ translate, scale: String(scale), filter, opacity, overflow: "hidden" }}>
      {children}
      {enter === "glitch" && t < start + 0.18 ? <GlitchBars seed={t} /> : null}
    </AbsoluteFill>
  );
};

const GlitchBars: React.FC<{ seed: number }> = ({ seed }) => {
  const k = Math.floor(seed * 30);
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      {new Array(7).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: (random(`x${k}${i}`) - 0.5) * 200,
            top: random(`y${k}${i}`) * 1920,
            width: W * 1.2,
            height: 20 + random(`h${k}${i}`) * 90,
            background: i % 2 ? "rgba(255,0,80,0.55)" : "rgba(0,255,230,0.5)",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/* ---------------------------- helpers ------------------------------ */

const Stamp: React.FC<{
  at: number;
  text: string;
  color?: string;
  size?: number;
  rotate?: number;
  style?: React.CSSProperties;
}> = ({ at, text, color = RED, size = 110, rotate = -12, style }) => {
  const t = useT();
  if (t < at) return null;
  const s = lerp(t, [at, at + 0.14], [2.6, 1], Easing.bezier(0.5, 0, 0.9, 0.6));
  const o = lerp(t, [at, at + 0.08], [0, 1]);
  return (
    <div
      style={{
        position: "absolute",
        fontFamily: HEAD,
        fontSize: size,
        color,
        border: `10px solid ${color}`,
        borderRadius: 18,
        padding: "4px 30px",
        letterSpacing: 4,
        rotate: `${rotate}deg`,
        scale: String(s),
        opacity: o,
        background: "rgba(255,255,255,0.08)",
        textShadow: "0 4px 18px rgba(0,0,0,0.35)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {text}
    </div>
  );
};

const Chip: React.FC<{
  at: number;
  children: React.ReactNode;
  bg?: string;
  color?: string;
  style?: React.CSSProperties;
  from?: "left" | "right" | "pop";
}> = ({ at, children, bg = YELLOW, color = INK, style, from = "pop" }) => {
  const t = useT();
  const pop = usePop(at);
  if (t < at) return null;
  const slide = from === "left" ? -700 : from === "right" ? 700 : 0;
  return (
    <div
      style={{
        position: "absolute",
        background: bg,
        color,
        fontFamily: BODY,
        fontWeight: 900,
        fontSize: 48,
        padding: "14px 28px",
        borderRadius: 18,
        boxShadow: "0 12px 0 rgba(0,0,0,0.8)",
        translate: `${(1 - pop) * slide}px 0px`,
        scale: String(from === "pop" ? pop : 1),
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** hand-drawn style circle that draws itself */
const DrawCircle: React.FC<{ at: number; cx: number; cy: number; r: number; color?: string }> = ({
  at,
  cx,
  cy,
  r,
  color = YELLOW,
}) => {
  const t = useT();
  const p = lerp(t, [at, at + 0.4], [0, 1]);
  if (t < at) return null;
  const len = 2 * Math.PI * r * 1.15;
  return (
    <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1920}>
      <ellipse
        cx={cx}
        cy={cy}
        rx={r * 1.1}
        ry={r}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - p)}
        transform={`rotate(-8 ${cx} ${cy})`}
        style={{ filter: "drop-shadow(0 6px 6px rgba(0,0,0,0.6))" }}
      />
    </svg>
  );
};

const Arrow: React.FC<{ at: number; x1: number; y1: number; x2: number; y2: number; color?: string }> = ({
  at,
  x1,
  y1,
  x2,
  y2,
  color = YELLOW,
}) => {
  const t = useT();
  if (t < at) return null;
  const p = lerp(t, [at, at + 0.3], [0, 1]);
  const mx = (x1 + x2) / 2 + 60;
  const my = (y1 + y2) / 2 - 80;
  const d = `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`;
  const ang = Math.atan2(y2 - my, x2 - mx);
  const hx = (a: number) => x2 - Math.cos(ang + a) * 50;
  const hy = (a: number) => y2 - Math.sin(ang + a) * 50;
  return (
    <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1920}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p}
        style={{ filter: "drop-shadow(0 6px 6px rgba(0,0,0,0.6))" }}
      />
      {p > 0.95 ? (
        <path
          d={`M${hx(0.5)} ${hy(0.5)} L${x2} ${y2} L${hx(-0.5)} ${hy(-0.5)}`}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
};

/* ============================ SCENE 1 ============================== */
// 0.0 – 6.5  Hook: "Jasa memarahi bos" + identity hidden

export const S1Hook: React.FC = () => {
  const t = useT();
  const panX = lerp(t, [0, 1.9, 2.7], [226, 226, -226], Easing.bezier(0.7, 0, 0.2, 1));
  const zoom = lerp(t, [0, 6.5], [1.12, 1.0], Easing.linear);
  const titleOut = lerp(t, [3.2, 3.45], [1, 0], Easing.bezier(0.6, 0, 1, 1));
  const p1 = usePop(0.05, 12);
  const p2 = lerp(t, [0.32, 0.46], [3, 1], Easing.bezier(0.5, 0, 0.9, 0.6));
  const p3 = usePop(0.9, 12);
  const card = usePop(3.45, 13);
  const cardOut = lerp(t, [6.1, 6.4], [1, 0]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Photo src="img/bluebos.jpg" iw={1440} ih={1805} scale={zoom} x={panX} y={0} />
      <BottomShade />
      <Vignette strength={0.6} />
      {/* angry red pulse on "memarahi" */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(255,0,40,0) 30%, rgba(255,0,40,0.55) 100%)",
          opacity: lerp(t, [0.35, 0.5, 1.4], [0, 1, 0.25]) * titleOut,
        }}
      />
      {/* Title block */}
      <div
        style={{
          position: "absolute",
          top: 640,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: titleOut,
          scale: String(0.6 + 0.4 * titleOut),
        }}
      >
        <div
          style={{
            fontFamily: HEAD,
            fontSize: 130,
            color: "#fff",
            letterSpacing: 6,
            scale: String(p1),
            ...textStroke(12),
          }}
        >
          JASA
        </div>
        {t >= 0.32 ? (
          <div
            style={{
              fontFamily: HEAD,
              fontSize: 168,
              lineHeight: 1.05,
              color: YELLOW,
              background: RED,
              padding: "6px 34px 14px",
              rotate: "-3deg",
              scale: String(p2),
              boxShadow: "0 16px 0 #000",
              ...textStroke(10),
            }}
          >
            MEMARAHI BOS
          </div>
        ) : null}
        {t >= 0.9 ? (
          <div
            style={{
              marginTop: 46,
              display: "flex",
              alignItems: "center",
              gap: 18,
              background: "#000",
              color: "#fff",
              fontFamily: BODY,
              fontWeight: 900,
              fontSize: 60,
              padding: "12px 34px",
              borderRadius: 999,
              scale: String(p3),
              border: "5px solid #fff",
            }}
          >
            <Incognito size={70} /> SECARA ANONIM
          </div>
        ) : null}
      </div>
      {/* Anonymous ID card */}
      {t >= 3.45 ? (
        <div
          style={{
            position: "absolute",
            left: 170,
            top: 640,
            width: 740,
            height: 420,
            background: "#fff",
            borderRadius: 34,
            boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
            scale: String(card * cardOut),
            rotate: `${(1 - card) * -20 + 3}deg`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 86,
              background: INK,
              color: YELLOW,
              fontFamily: HEAD,
              fontSize: 54,
              display: "flex",
              alignItems: "center",
              paddingLeft: 36,
              letterSpacing: 3,
            }}
          >
            KARTU KARYAWAN
          </div>
          <div style={{ display: "flex", padding: 34, gap: 34 }}>
            <div
              style={{
                width: 210,
                height: 250,
                borderRadius: 18,
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {new Array(36).fill(0).map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: `hsl(25, 25%, ${30 + random(`px${i}${Math.floor(t * 6)}`) * 45}%)`,
                  }}
                />
              ))}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontFamily: HEAD,
                  fontSize: 150,
                  color: "#fff",
                  ...textStroke(8),
                }}
              >
                ?
              </div>
            </div>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: "#222", lineHeight: 1.75 }}>
              <div>NAMA: ••••••••</div>
              <div>DIVISI: ••••••</div>
              <div>
                STATUS: <span style={{ color: RED, fontWeight: 900 }}>ANONIM</span>
              </div>
            </div>
          </div>
          <Stamp at={4.55} text="RAHASIA" size={120} style={{ left: 300, top: 150 }} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ============================ SCENE 2 ============================== */
// 6.5 – 12.3 Kalimar White, actor, created OCDA

export const S2Kalimar: React.FC = () => {
  const t = useT();
  const zoom = lerp(t, [6.3, 12.3], [1.02, 1.16], Easing.linear);
  const nameP = usePop(7.08, 14);
  const roleP = usePop(8.62, 14);
  const badge = usePop(10.76, 10);
  const ring = (t - 10.76) * 60;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Photo src="img/kalimar.jpg" iw={1290} ih={1720} scale={zoom} x={0} y={0} />
      <BottomShade />
      <Vignette strength={0.5} />
      {/* lower third */}
      {t >= 7.08 ? (
        <div style={{ position: "absolute", left: 60, top: 1010 }}>
          <div
            style={{
              background: YELLOW,
              color: INK,
              fontFamily: HEAD,
              fontSize: 104,
              padding: "6px 36px",
              letterSpacing: 2,
              clipPath: `inset(0 ${(1 - nameP) * 100}% 0 0)`,
              boxShadow: "12px 12px 0 #000",
            }}
          >
            KALIMAR WHITE
          </div>
          {t >= 8.62 ? (
            <div
              style={{
                marginTop: 18,
                display: "inline-block",
                background: "#000",
                color: "#fff",
                fontFamily: BODY,
                fontWeight: 900,
                fontSize: 50,
                padding: "10px 28px",
                clipPath: `inset(0 ${(1 - roleP) * 100}% 0 0)`,
              }}
            >
              AKTOR • PENCIPTA LAYANAN
            </div>
          ) : null}
        </div>
      ) : null}
      {/* OCDA badge */}
      {t >= 10.76 ? (
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 150,
            width: 340,
            height: 340,
            scale: String(badge),
            rotate: `${(1 - badge) * -90}deg`,
          }}
        >
          <svg width={340} height={340} style={{ position: "absolute", rotate: `${ring}deg` }}>
            <circle cx={170} cy={170} r={160} fill="none" stroke={YELLOW} strokeWidth={10} strokeDasharray="30 18" />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 26,
              borderRadius: "50%",
              background: RED,
              border: "8px solid #fff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ fontFamily: HEAD, fontSize: 120, color: "#fff", lineHeight: 1 }}>OCDA</div>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 26, color: YELLOW, marginTop: 6 }}>
              JASA LAPOR BOS
            </div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ============================ SCENE 3 ============================== */
// 12.3 – 17.9 anonymous complaint (phone chat)

const MSG = "Bos saya suka marah-marah, lembur nggak dibayar!";

export const S3Phone: React.FC = () => {
  const t = useT();
  const phone = usePop(12.3, 15);
  const inMsg = usePop(12.5, 13);
  const typed = Math.floor(lerp(t, [13.8, 15.15], [0, MSG.length], Easing.linear));
  const sent = t >= 15.3;
  const outMsg = usePop(15.3, 13);
  const toggleRow = usePop(16.0, 14);
  const knob = lerp(t, [16.55, 16.75], [0, 1]);
  const bgZoom = lerp(t, [12.3, 17.9], [1.1, 1.2], Easing.linear);
  return (
    <AbsoluteFill style={{ background: "#111" }}>
      <Photo src="img/reception.jpg" iw={1440} ih={1805} scale={bgZoom} x={0} y={0} filter="blur(16px) brightness(0.45)" />
      {/* floating anonymous icons */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 60 + i * 230,
            top: 1700 - ((t - 12.3) * (60 + i * 18) + i * 240) % 1700,
            opacity: 0.18,
            rotate: `${i * 20 - 30}deg`,
          }}
        >
          <Incognito size={110} />
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: 200,
          top: 190,
          width: 680,
          height: 1110,
          borderRadius: 80,
          background: "#000",
          padding: 22,
          boxShadow: "0 40px 80px rgba(0,0,0,0.7)",
          translate: `0px ${(1 - phone) * 1400}px`,
          rotate: `${(1 - phone) * 10 - 2}deg`,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 60,
            background: "#E9E4DC",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* header */}
          <div
            style={{
              height: 150,
              background: INK,
              display: "flex",
              alignItems: "center",
              gap: 22,
              padding: "40px 30px 0",
            }}
          >
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: "50%",
                background: RED,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: HEAD,
                fontSize: 30,
                color: "#fff",
              }}
            >
              OCDA
            </div>
            <div>
              <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 38, color: "#fff" }}>Lapor Bos</div>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 26, color: "#5CE08A" }}>online</div>
            </div>
          </div>
          {/* incoming */}
          {t >= 12.5 ? (
            <Bubble side="left" p={inMsg}>
              Halo! Ceritakan keluhanmu soal atasanmu.
            </Bubble>
          ) : null}
          {sent ? (
            <Bubble side="right" p={outMsg}>
              {MSG}
            </Bubble>
          ) : null}
          {/* anonymous toggle */}
          {t >= 16.0 ? (
            <div
              style={{
                margin: "30px 24px 0",
                background: "#fff",
                borderRadius: 26,
                padding: "22px 26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                scale: String(toggleRow),
                boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Incognito size={56} color="#111" />
                <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 32, color: "#111" }}>
                  Kirim sebagai ANONIM
                </div>
              </div>
              <div
                style={{
                  width: 100,
                  height: 56,
                  borderRadius: 30,
                  background: knob > 0.5 ? "#1DB954" : "#bbb",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    left: 6 + knob * 44,
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "#fff",
                  }}
                />
              </div>
            </div>
          ) : null}
          {/* input bar */}
          <div
            style={{
              position: "absolute",
              left: 20,
              right: 20,
              bottom: 26,
              display: "flex",
              gap: 14,
              alignItems: "center",
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 80,
                background: "#fff",
                borderRadius: 40,
                padding: "16px 28px",
                fontFamily: BODY,
                fontWeight: 800,
                fontSize: 28,
                color: typed > 0 && !sent ? "#111" : "#999",
                lineHeight: 1.3,
              }}
            >
              {typed > 0 && !sent ? MSG.slice(0, typed) : "Tulis keluhan..."}
              {typed > 0 && !sent && Math.floor(t * 4) % 2 === 0 ? "|" : ""}
            </div>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "#1DB954",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                scale: String(t > 15.2 && t < 15.4 ? 0.8 : 1),
              }}
            >
              <Send size={40} />
            </div>
          </div>
        </div>
        <Stamp at={17.15} text="100% ANONIM" size={96} rotate={-14} style={{ left: 70, top: 470, background: "rgba(255,255,255,0.85)" }} />
      </div>
    </AbsoluteFill>
  );
};

const Bubble: React.FC<{ side: "left" | "right"; p: number; children: React.ReactNode }> = ({
  side,
  p,
  children,
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: side === "left" ? "flex-start" : "flex-end",
      padding: "26px 24px 0",
    }}
  >
    <div
      style={{
        maxWidth: 470,
        background: side === "left" ? "#fff" : "#D8FDC4",
        borderRadius: 30,
        borderTopLeftRadius: side === "left" ? 6 : 30,
        borderTopRightRadius: side === "right" ? 6 : 30,
        padding: "20px 26px",
        fontFamily: BODY,
        fontWeight: 800,
        fontSize: 32,
        color: "#111",
        lineHeight: 1.3,
        boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
        scale: String(p),
        transformOrigin: side === "left" ? "left top" : "right top",
      }}
    >
      {children}
    </div>
  </div>
);

/* ============================ SCENE 4a ============================= */
// 17.9 – 21.0 comes directly to the workplace

export const S4aArrive: React.FC = () => {
  const t = useT();
  const zoom = lerp(t, [17.7, 21.0], [1.0, 1.12], Easing.linear);
  const pinY = lerp(t, [19.8, 20.15], [-500, 0], Easing.bounce);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Photo src="img/pointing.jpg" iw={1440} ih={1805} scale={zoom} x={-30} y={60} />
      <BottomShade />
      <Chip at={18.8} from="left" style={{ left: 60, top: 170, fontSize: 52 }}>
        DATANG LANGSUNG!
      </Chip>
      {t >= 19.8 ? (
        <>
          <div style={{ position: "absolute", left: 230, top: 470 + pinY }}>
            <Pin size={110} />
          </div>
          <Chip at={20.1} bg={RED} color="#fff" style={{ left: 120, top: 330, fontSize: 44 }}>
            TEMPAT KERJA SI BOS
          </Chip>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/* ============================ SCENE 4b ============================= */
// 21.0 – 25.0 uniform + delivering complaint in front of the boss

export const S4bConfront: React.FC = () => {
  const t = useT();
  const panX = lerp(t, [21.0, 23.25, 23.75], [-226, -226, 226], Easing.bezier(0.7, 0, 0.2, 1));
  const zoom = lerp(t, [21.0, 25.0], [1.0, 1.08], Easing.linear);
  const bubble = usePop(22.48, 11);
  const bubbleOut = lerp(t, [23.2, 23.35], [1, 0]);
  const showRight = t < 23.3;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Photo src="img/counter.jpg" iw={1440} ih={1805} scale={zoom} x={panX} y={0} />
      <BottomShade />
      {showRight ? (
        <>
          <Chip at={21.2} style={{ left: 70, top: 900, fontSize: 52 }}>
            SERAGAM KHUSUS
          </Chip>
          <Arrow at={21.3} x1={470} y1={890} x2={790} y2={740} />
          <DrawCircle at={21.35} cx={910} cy={680} r={140} />
          {t >= 22.48 ? (
            <div
              style={{
                position: "absolute",
                left: 70,
                top: 200,
                width: 640,
                background: "#fff",
                borderRadius: 40,
                padding: "30px 36px",
                scale: String(bubble * bubbleOut),
                transformOrigin: "right bottom",
                boxShadow: "0 20px 0 #000",
                border: "6px solid #000",
              }}
            >
              <div style={{ fontFamily: HEAD, fontSize: 74, color: RED, lineHeight: 1.05 }}>
                &quot;INI KELUHAN DARI KARYAWAN ANDA!&quot;
              </div>
              <svg width={80} height={80} style={{ position: "absolute", right: -50, bottom: -40 }}>
                <path d="M0 0 L80 70 L10 40z" fill="#fff" stroke="#000" strokeWidth={6} />
              </svg>
              {/* anger marks */}
              <svg width={120} height={120} style={{ position: "absolute", right: -40, top: -50, rotate: `${Math.sin(t * 30) * 8}deg` }}>
                <path d="M20 50 Q50 40 50 10 M70 10 Q70 40 100 50 M100 70 Q70 70 70 100 M50 100 Q50 70 20 70" stroke={RED} strokeWidth={12} fill="none" strokeLinecap="round" />
              </svg>
            </div>
          ) : null}
        </>
      ) : null}
      {t >= 23.85 ? (
        <>
          <DrawCircle at={23.85} cx={370} cy={760} r={140} color={RED} />
          <Chip at={23.9} bg={RED} color="#fff" style={{ left: 200, top: 940, fontSize: 64, fontFamily: HEAD, fontWeight: 400, letterSpacing: 3 }}>
            SANG BOS
          </Chip>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/* ============================ SCENE 5 ============================== */
// 25.0 – 30.1 recorded, uploaded, millions of viewers

export const S5Viral: React.FC = () => {
  const t = useT();
  const recOn = t < 26.6;
  const flash = lerp(t, [25.85, 25.9, 26.15], [0, 1, 0]);
  const upload = lerp(t, [26.6, 27.6], [0, 1], Easing.inOut(Easing.cubic));
  const counterP = lerp(t, [28.4, 29.45], [0, 1], Easing.out(Easing.cubic));
  const views = Math.round(counterP * 1000000);
  const counterPop = usePop(28.3, 12);
  const card = usePop(24.9, 16);
  const tc = Math.max(0, t - 25);
  return (
    <AbsoluteFill style={{ background: INK }}>
      <Photo src="img/reception.jpg" iw={1440} ih={1805} scale={1.15} x={0} y={0} filter="blur(26px) brightness(0.5) saturate(1.3)" />
      {/* post card */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 150,
          width: 900,
          height: 1128,
          borderRadius: 40,
          overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.7)",
          border: "6px solid #fff",
          scale: String(0.8 + 0.2 * card),
        }}
      >
        <Photo src="img/reception.jpg" iw={1440} ih={1805} scale={1} x={0} y={0} />
        {recOn ? (
          <div style={{ position: "absolute", inset: 0 }}>
            {/* viewfinder brackets */}
            {[
              { left: 40, top: 40, b: "borderLeft", c: "borderTop" },
              { right: 40, top: 40, b: "borderRight", c: "borderTop" },
              { left: 40, bottom: 40, b: "borderLeft", c: "borderBottom" },
              { right: 40, bottom: 40, b: "borderRight", c: "borderBottom" },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: 110,
                  height: 110,
                  ...(s as object),
                  [s.b]: "10px solid #fff",
                  [s.c]: "10px solid #fff",
                }}
              />
            ))}
            <div
              style={{
                position: "absolute",
                left: 80,
                top: 80,
                display: "flex",
                alignItems: "center",
                gap: 16,
                fontFamily: BODY,
                fontWeight: 900,
                fontSize: 48,
                color: "#fff",
                textShadow: "0 3px 10px #000",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: RED,
                  opacity: Math.floor(t * 2.5) % 2 === 0 ? 1 : 0.2,
                }}
              />
              REC
            </div>
            <div
              style={{
                position: "absolute",
                right: 80,
                top: 86,
                fontFamily: BODY,
                fontWeight: 800,
                fontSize: 40,
                color: "#fff",
                textShadow: "0 3px 10px #000",
              }}
            >
              00:00:{String(Math.floor(tc)).padStart(2, "0")}:{String(Math.floor((tc % 1) * 30)).padStart(2, "0")}
            </div>
          </div>
        ) : null}
        <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
        {/* upload overlay */}
        {t >= 26.6 && t < 28.3 ? (
          <AbsoluteFill
            style={{
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 30,
            }}
          >
            <div style={{ fontFamily: HEAD, fontSize: 90, color: "#fff", letterSpacing: 3 }}>
              {upload < 1 ? "MENGUNGGAH..." : "TERUNGGAH!"}
            </div>
            <div style={{ width: 640, height: 44, borderRadius: 30, background: "rgba(255,255,255,0.25)", overflow: "hidden" }}>
              <div style={{ width: `${upload * 100}%`, height: "100%", background: upload < 1 ? YELLOW : "#1DB954" }} />
            </div>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 54, color: "#fff" }}>{Math.round(upload * 100)}%</div>
          </AbsoluteFill>
        ) : null}
        {/* side action bar like short-video apps */}
        {t >= 27.6 ? (
          <div
            style={{
              position: "absolute",
              right: 30,
              bottom: 60,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 34,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  scale: String(lerp(t, [27.6 + i * 0.08, 27.8 + i * 0.08], [0, 1], Easing.out(Easing.back(2)))),
                }}
              >
                {i === 0 ? <Heart size={56} /> : i === 1 ? <Send size={48} /> : <Eye size={56} color="#fff" />}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {/* floating hearts */}
      {t >= 28.6
        ? new Array(14).fill(0).map((_, i) => {
            const st = 28.6 + i * 0.1;
            const d = t - st;
            if (d < 0) return null;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 820 + Math.sin(d * 4 + i) * 60 + (random(`hx${i}`) - 0.5) * 120,
                  top: 1150 - d * 700,
                  opacity: lerp(d, [0, 0.2, 1.1, 1.5], [0, 1, 1, 0]),
                  scale: String(0.6 + random(`hs${i}`) * 0.8),
                }}
              >
                <Heart size={80} color={i % 3 === 0 ? YELLOW : RED} />
              </div>
            );
          })
        : null}
      {/* view counter */}
      {t >= 28.3 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1150,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: YELLOW,
              borderRadius: 24,
              padding: "16px 38px",
              display: "flex",
              alignItems: "center",
              gap: 22,
              scale: String(counterPop * (t > 29.45 && t < 29.7 ? 1.08 : 1)),
              boxShadow: "0 14px 0 #000",
              rotate: "-2deg",
            }}
          >
            <Eye size={84} />
            <div style={{ fontFamily: HEAD, fontSize: 104, color: INK, fontVariantNumeric: "tabular-nums" }}>
              {views.toLocaleString("id-ID")}
              {counterP >= 1 ? "+" : ""}
            </div>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ============================ SCENE 6 ============================== */
// 30.1 – 35.5 looks serious, but some scenes are staged for entertainment

export const S6Staged: React.FC = () => {
  const t = useT();
  const zoom = lerp(t, [30.0, 33.2], [1.05, 1.22], Easing.linear);
  const reveal = t >= 33.2;
  const gray = reveal ? lerp(t, [33.2, 33.5], [1, 0]) : 1;
  const beat = Math.max(0, Math.sin((t - 30.2) * Math.PI * 2 * 1.3)) ** 6;
  const serius = usePop(30.2, 9);
  const strike = lerp(t, [33.25, 33.5], [0, 1]);
  const clap = usePop(33.78, 12);
  const clapOpen = lerp(t, [33.78, 34.0, 34.12], [1, 1, 0], Easing.in(Easing.quad));
  const glitch = t >= 33.2 && t < 33.4;
  const sh = shakeAt(t, [30.2], 18);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <div style={{ position: "absolute", inset: 0, translate: glitch ? `${(random(Math.floor(t * 30)) - 0.5) * 80}px 0px` : "0px 0px" }}>
        <Photo
          src="img/bluebos.jpg"
          iw={1440}
          ih={1805}
          scale={zoom}
          x={-170}
          y={60}
          filter={`grayscale(${gray}) contrast(${1 + gray * 0.25}) ${glitch ? "hue-rotate(90deg) saturate(3)" : ""}`}
        />
      </div>
      <BottomShade />
      {!reveal ? (
        <AbsoluteFill
          style={{
            background: "radial-gradient(circle, rgba(0,0,0,0) 35%, rgba(200,0,20,0.75) 100%)",
            opacity: 0.35 + beat * 0.65,
          }}
        />
      ) : null}
      {/* SERIUS? */}
      {t >= 30.2 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: reveal ? lerp(t, [33.2, 33.6], [620, 170]) : 620,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            scale: String(serius * (reveal ? lerp(t, [33.2, 33.6], [1, 0.6]) : 1)),
            translate: `${sh.x}px ${sh.y}px`,
          }}
        >
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 56, color: "#fff", ...textStroke(10) }}>TERLIHAT...</div>
          <div style={{ position: "relative" }}>
            <div
              style={{
                fontFamily: HEAD,
                fontSize: 250,
                color: "#fff",
                letterSpacing: 6,
                lineHeight: 1,
                ...textStroke(16, RED),
              }}
            >
              SERIUS?
            </div>
            {reveal ? (
              <div
                style={{
                  position: "absolute",
                  left: -20,
                  top: "48%",
                  height: 30,
                  width: `${strike * 110}%`,
                  background: YELLOW,
                  rotate: "-6deg",
                  boxShadow: "0 6px 0 #000",
                }}
              />
            ) : null}
          </div>
        </div>
      ) : null}
      {/* clapperboard */}
      {t >= 33.78 ? (
        <div
          style={{
            position: "absolute",
            left: 270,
            top: 560,
            scale: String(clap),
            rotate: `${(1 - clap) * 25 - 4}deg`,
          }}
        >
          <Clapper size={540} open={clapOpen} />
        </div>
      ) : null}
      <Stamp
        at={34.9}
        text="UNTUK HIBURAN"
        color={YELLOW}
        size={104}
        rotate={-6}
        style={{ left: 140, top: 1060, background: "rgba(0,0,0,0.75)" }}
      />
    </AbsoluteFill>
  );
};

/* ============================ SCENE 7 ============================== */
// 35.5 – 41.0 in the spotlight: humor + real workplace problems

export const S7Spotlight: React.FC = () => {
  const t = useT();
  const sweep = lerp(t, [35.5, 36.9], [-35, 0], Easing.bezier(0.3, 0, 0.2, 1));
  const lightOn = lerp(t, [35.5, 35.6], [0, 1]);
  const title = usePop(36.86, 10);
  const c1 = usePop(38.45, 12);
  const c2 = usePop(39.15, 12);
  const plus = usePop(38.85, 10);
  const shine = lerp(t, [39.9, 40.6], [-100, 200], Easing.linear);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Photo src="img/kalimar.jpg" iw={1290} ih={1720} scale={1.25} x={0} y={0} filter="blur(10px) brightness(0.35)" />
      {/* spotlight cone */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: lightOn, mixBlendMode: "screen" }}>
        <defs>
          <radialGradient id="sg" cx="50%" cy="0%" r="100%">
            <stop offset="0%" stopColor="rgba(255,240,180,0.9)" />
            <stop offset="70%" stopColor="rgba(255,220,120,0.08)" />
            <stop offset="100%" stopColor="rgba(255,220,120,0)" />
          </radialGradient>
        </defs>
        <g transform={`rotate(${sweep} 540 -100)`}>
          <polygon points="460,-100 620,-100 1000,1500 80,1500" fill="url(#sg)" />
        </g>
      </svg>
      {/* title */}
      {t >= 36.86 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 230,
            textAlign: "center",
            fontFamily: HEAD,
            fontSize: 170,
            color: YELLOW,
            letterSpacing: 4,
            scale: String(title),
            textShadow: "0 0 60px rgba(255,212,0,0.8)",
            ...textStroke(12),
          }}
        >
          JADI SOROTAN
        </div>
      ) : null}
      {/* formula cards */}
      <div style={{ position: "absolute", left: 60, right: 60, top: 640, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Card p={c1} bg={YELLOW} color={INK} rot={-5} icon={<Laugh size={180} />} label="HUMOR" show={t >= 38.45} />
        <div
          style={{
            fontFamily: HEAD,
            fontSize: 160,
            color: "#fff",
            scale: String(t >= 38.85 ? plus : 0),
            ...textStroke(10),
          }}
        >
          +
        </div>
        <Card p={c2} bg={RED} color="#fff" rot={5} icon={<Briefcase size={180} />} label={"MASALAH\nNYATA"} show={t >= 39.15} />
      </div>
      {t >= 39.9 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1190, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              background: "#fff",
              color: INK,
              fontFamily: HEAD,
              fontSize: 80,
              padding: "6px 40px",
              borderRadius: 20,
              letterSpacing: 3,
              boxShadow: "0 12px 0 #000",
              scale: String(lerp(t, [39.9, 40.1], [0, 1], Easing.out(Easing.back(2.5)))),
            }}
          >
            = KONTEN DUNIA KERJA
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${shine}%`,
                width: 120,
                background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,212,0,0.8), rgba(255,255,255,0))",
                rotate: "15deg",
              }}
            />
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const Card: React.FC<{
  p: number;
  bg: string;
  color: string;
  rot: number;
  icon: React.ReactNode;
  label: string;
  show: boolean;
}> = ({ p, bg, color, rot, icon, label, show }) => (
  <div
    style={{
      width: 390,
      height: 470,
      background: bg,
      borderRadius: 36,
      border: "8px solid #000",
      boxShadow: "0 18px 0 #000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 26,
      rotate: `${rot + (1 - p) * rot * 6}deg`,
      scale: String(show ? p : 0),
    }}
  >
    {icon}
    <div style={{ fontFamily: HEAD, fontSize: 76, color, lineHeight: 1, textAlign: "center", whiteSpace: "pre-line" }}>{label}</div>
  </div>
);

/* ============================ SCENE 8 ============================== */
// 41.0 – end: CTA

export const S8Cta: React.FC = () => {
  const t = useT();
  const zoom = lerp(t, [40.8, 48.0], [1.05, 1.22], Easing.linear);
  const flag = usePop(41.2, 12);
  const kalau = usePop(41.2, 13);
  const indo = lerp(t, [42.74, 42.88], [3, 1], Easing.bezier(0.5, 0, 0.9, 0.6));
  const up = lerp(t, [43.7, 44.0], [0, 1]);
  const q = usePop(43.76, 8);
  const box = usePop(44.95, 13);
  const typedTxt = "Bosku dulu dong!";
  const typed = Math.floor(lerp(t, [45.1, 45.9], [0, typedTxt.length], Easing.linear));
  const sh = shakeAt(t, [42.75], 22);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Photo src="img/pointing.jpg" iw={1440} ih={1805} scale={zoom} x={0} y={0} filter="brightness(0.45) blur(3px)" />
      <BottomShade />
      {/* waving flag */}
      {t >= 41.2 ? (
        <div style={{ position: "absolute", left: 360, top: lerp(up, [0, 1], [190, 120]), scale: String(flag * (1 - up * 0.35)) }}>
          <svg width={360} height={240} viewBox="0 0 360 240">
            {new Array(36).fill(0).map((_, i) => {
              const off = Math.sin(t * 6 - i * 0.35) * 10;
              return (
                <g key={i}>
                  <rect x={i * 10} y={off} width={10.6} height={120} fill={RED} />
                  <rect x={i * 10} y={120 + off} width={10.6} height={110} fill="#fff" />
                </g>
              );
            })}
          </svg>
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: lerp(up, [0, 1], [500, 330]),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          scale: String(1 - up * 0.3),
          translate: `${sh.x}px ${sh.y}px`,
        }}
      >
        {t >= 41.2 ? (
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 70, color: "#fff", scale: String(kalau), ...textStroke(12) }}>
            KALAU ADA DI...
          </div>
        ) : null}
        {t >= 42.74 ? (
          <div
            style={{
              fontFamily: HEAD,
              fontSize: 200,
              lineHeight: 1.05,
              color: RED,
              scale: String(indo),
              letterSpacing: 4,
              ...textStroke(14, "#fff"),
              filter: "drop-shadow(0 14px 0 #000)",
            }}
          >
            INDONESIA
          </div>
        ) : null}
      </div>
      {/* question */}
      {t >= 43.76 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 700,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              background: YELLOW,
              color: INK,
              fontFamily: HEAD,
              fontSize: 86,
              lineHeight: 1.05,
              textAlign: "center",
              padding: "18px 40px",
              borderRadius: 26,
              boxShadow: "0 14px 0 #000",
              scale: String(q),
              rotate: `${Math.sin(t * 5) * 2}deg`,
            }}
          >
            SIAPA BOS YANG
            <br />
            MAU KAMU LAPORIN?
          </div>
        </div>
      ) : null}
      {/* comment box */}
      {t >= 44.95 ? (
        <div style={{ position: "absolute", left: 90, right: 90, top: 1010, scale: String(box) }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 999,
              padding: "20px 34px",
              display: "flex",
              alignItems: "center",
              gap: 20,
              boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ width: 70, height: 70, borderRadius: "50%", background: "#bbb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Incognito size={50} color="#333" />
            </div>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: typed > 0 ? "#111" : "#888", flex: 1 }}>
              {typed > 0 ? typedTxt.slice(0, typed) : "Tulis di komentar..."}
              {Math.floor(t * 4) % 2 === 0 ? "|" : ""}
            </div>
            <Send size={52} color={RED} />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 20,
              translate: `0px ${Math.abs(Math.sin(t * 7)) * 22}px`,
            }}
          >
            <ArrowDown size={100} />
          </div>
        </div>
      ) : null}
      {/* ending fade */}
      <AbsoluteFill style={{ background: "#000", opacity: lerp(t, [47.3, 48.0], [0, 1]) }} />
    </AbsoluteFill>
  );
};
