// "Pulau Kecil yang Ditukar dengan New York": a 60 s Vox-style explainer on the spice history of Maluku.
// Archival images (public domain) as torn cutouts on paper, word-timed map moves, AI footage marked as such.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, continueRender, delayRender, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { AiTag, C, Captions, F, Grain, Hand, Paper, Photo, Source, Stamp, Tag, Vignette, clamp01, ease, eout, lin, mix, pop, rand } from "./kit";
import { MapView, PL, R_ARAB_VENICE, R_INDIA_ARAB, R_MALUKU_INDIA, R_PORTUGAL, R_TERQA, R_VOC, arcWp } from "./map";
import { CUT, FPS, TOTAL, VOICE_END, fr, ws, we } from "./timing";

export const REMPAH_FRAMES = TOTAL;

const useT = (t0: number) => useCurrentFrame() / FPS + t0;

// ---------------------------------------------------------------- footage
const Footage: React.FC<{ src: string; t0: number; t1: number; from?: number; rate?: number; push?: [number, number]; origin?: string; children?: (t: number) => React.ReactNode }> = ({
  src, t0, t1, from = 0, rate = 1, push = [1, 1.06], origin = "50% 50%", children,
}) => {
  const t = useT(t0);
  const s = mix(push[0], push[1], lin(t, t0, t1));
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${s})`, transformOrigin: origin }}>
        <OffthreadVideo src={staticFile(src)} startFrom={Math.round(from * FPS)} playbackRate={rate} muted style={{ width: 1080, height: 1920 }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.45) 100%)" }} />
      <AiTag />
      {children ? children(t) : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- scenes
const S1Manhattan: React.FC = () => (
  <Footage src="rempah/manhattan.mp4" t0={CUT.manhattan} t1={CUT.castello} rate={0.9} push={[1.0, 1.05]}>
    {(t) => (
      <>
        <YearStrip t={t} at={0.35} text="1667" y={330} />
        <Hand t={t} at={1.0} x={540} y={640} text="Perjanjian Breda" size={60} color={C.paperHi} rot={-3} align="center" width={800} />
      </>
    )}
  </Footage>
);

const YearStrip: React.FC<{ t: number; at: number; text: string; y: number }> = ({ t, at, text, y }) => {
  const k = pop(t, at, 0.45, 0.25);
  if (k <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 540, top: y, transform: `translate(-50%,0) rotate(-2.5deg) scale(${0.6 + 0.4 * k})`, opacity: clamp01(k * 3),
      background: C.paperHi, padding: "6px 60px 0", boxShadow: "0 16px 30px rgba(0,0,0,0.45)", fontFamily: F.head, fontWeight: 900, fontSize: 220, color: C.ink, lineHeight: 1.05 }}>
      {text}
    </div>
  );
};

const S2Castello: React.FC = () => {
  const t = useT(CUT.castello);
  return (
    <AbsoluteFill>
      <Paper />
      <Photo t={t} src="rempah/castello.jpg" iw={3200} ih={2325} box={{ x: 50, y: 300, w: 980, h: 900 }} rot={-1.5} seed={3} enter={CUT.castello - 0.05}
        keys={[{ t: CUT.castello, c: { cx: 0.5, cy: 0.5, zw: 0.95 } }, { t: CUT.map1, c: { cx: 0.33, cy: 0.62, zw: 0.62 } }]} />
      <Source t={t} at={CUT.castello + 0.3} x={70} y={1225} text="NEW AMSTERDAM, 1660" />
      <Hand t={t} at={ws(9)} x={70} y={1268} text="sekarang: Manhattan" size={78} rot={-2} />
      <Stamp t={t} at={ws(11)} x={700} y={980} text="KE INGGRIS" size={96} rot={-11} font={F.label} />
    </AbsoluteFill>
  );
};

const S3Map1: React.FC = () => {
  const t = useT(CUT.map1);
  const q = pop(t, CUT.map1, 0.45, 0.4);
  const qOut = 1 - lin(t, ws(13) + 0.2, ws(13) + 0.45);
  return (
    <MapView
      t={t}
      cam={[
        { t: CUT.map1, lon: -74, lat: 40.7, z: 1.5 },
        { t: CUT.map1 + 0.35, lon: -74, lat: 40.7, z: 1.5 },
        { t: ws(16), lon: 30, lat: 18, z: 0.4 },
        { t: ws(18), lon: 128.5, lat: -3, z: 2.4 },
        { t: CUT.pala + 0.1, lon: 129.75, lat: -4.55, z: 9 },
      ]}
      routes={[{ wp: arcWp(PL.manhattan, PL.run, 0.22), a: CUT.map1 + 0.35, b: ws(17), color: C.red, w: 6, dash: "14 10" }]}
      pins={[
        { lon: PL.manhattan[0], lat: PL.manhattan[1], at: CUT.map1, label: "MANHATTAN", side: "r" },
        { lon: PL.run[0], lat: PL.run[1], at: ws(17) - 0.1, label: "MALUKU", side: "l", until: ws(19) - 0.05 },
        { lon: PL.run[0], lat: PL.run[1], at: ws(19), label: "PULAU RUN", side: "t", big: true },
      ]}
    >
      {() => (
        <div style={{ position: "absolute", left: 540, top: 250, transform: `translateX(-50%) scale(${q}) rotate(-4deg)`, opacity: clamp01(q * 3) * qOut,
          fontFamily: F.head, fontWeight: 900, fontSize: 300, color: C.red, textShadow: `0 0 0 ${C.paperHi}, 6px 8px 0 rgba(0,0,0,0.18)` }}>
          ?
        </div>
      )}
    </MapView>
  );
};

const S4Pala: React.FC = () => (
  <Footage src="rempah/pala.mp4" t0={CUT.pala} t1={CUT.plancius} rate={0.95} push={[1.04, 1.12]} origin="50% 45%">
    {(t) => (
      <>
        <Hand t={t} at={ws(21)} x={650} y={300} text="pala" size={120} color={C.paperHi} rot={-6} width={400}
          arrow={{ x1: 700, y1: 450, x2: 610, y2: 720, bend: -0.3 }} />
        <Tag t={t} at={ws(21) + 0.3} x={650} y={445} text="MYRISTICA FRAGRANS" size={30} rot={-4} bg="rgba(20,16,12,0.8)" />
      </>
    )}
  </Footage>
);

const S5Plancius: React.FC = () => {
  const t = useT(CUT.plancius);
  return (
    <AbsoluteFill>
      <Paper />
      <Photo t={t} src="rempah/plancius.jpg" iw={1876} ih={1338} box={{ x: 30, y: 330, w: 1020, h: 980 }} rot={1.2} seed={5} enter={CUT.plancius - 0.05}
        keys={[{ t: CUT.plancius, c: { cx: 0.27, cy: 0.86, zw: 0.4 } }, { t: ws(29), c: { cx: 0.26, cy: 0.87, zw: 0.34 } }, { t: ws(30) + 0.5, c: { cx: 0.6, cy: 0.87, zw: 0.32 } }]} />
      <Source t={t} at={CUT.plancius + 0.2} x={60} y={1330} text="PETA MALUKU, PLANCIUS 1592" />
      <Hand t={t} at={CUT.plancius + 0.25} x={90} y={210} text="rempahnya sampai digambar di peta" size={58} rot={-2} until={ws(30) + 0.2} />
      <Hand t={t} at={ws(30) + 0.45} x={640} y={700} text="cengkih" size={100} color={C.red} rot={-4} width={400} halo
        arrow={{ x1: 720, y1: 820, x2: 600, y2: 1000, bend: -0.25 }} />
    </AbsoluteFill>
  );
};

const S6Cengkih: React.FC = () => (
  <Footage src="rempah/cengkih.mp4" t0={CUT.cengkih} t1={CUT.map2} from={1.0} push={[1.02, 1.08]}>
    {(t) => <Tag t={t} at={ws(34)} x={540} y={330} text="HANYA DI MALUKU" size={70} bg={C.red} rot={-3} anchor="center" />}
  </Footage>
);

const Counter: React.FC<{ t: number; a: number; b: number; from: number; to: number; y: number; prefix?: string; size?: number; color?: string; at: number }> = ({
  t, a, b, from, to, y, prefix = "± ", size = 170, color = C.ink, at,
}) => {
  const k = pop(t, at, 0.4, 0.2);
  if (k <= 0) return null;
  const v = Math.round(mix(from, to, eout(lin(t, a, b))) / 10) * 10;
  return (
    <div style={{ position: "absolute", left: 540, top: y, transform: `translateX(-50%) scale(${0.7 + 0.3 * k})`, opacity: clamp01(k * 3), fontFamily: F.head, fontWeight: 900,
      fontSize: size, color, whiteSpace: "nowrap", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {v.toLocaleString("id-ID")}
    </div>
  );
};

const S7Map2: React.FC = () => {
  const t = useT(CUT.map2);
  const cardK = pop(t, ws(47) - 0.15, 0.45, 0.2);
  return (
    <MapView
      t={t}
      cam={[
        { t: CUT.map2, lon: 128, lat: -2, z: 2.2 },
        { t: ws(40), lon: 84, lat: 16, z: 0.95 },
        { t: ws(44), lon: 42, lat: 32, z: 2.6 },
        { t: CUT.merveilles, lon: 40.8, lat: 34, z: 3.2 },
      ]}
      routes={[{ wp: R_TERQA, a: ws(38) - 0.1, b: ws(44) - 0.1, color: C.ochre, w: 7 }]}
      pins={[
        { lon: PL.maluku[0], lat: PL.maluku[1], at: CUT.map2, label: "MALUKU", side: "l" },
        { lon: PL.terqa[0], lat: PL.terqa[1], at: ws(44) - 0.05, label: "TERQA, SURIAH", side: "b", big: true },
      ]}
    >
      {() => (
        <>
          <Hand t={t} at={ws(42)} x={540} y={470} text="cengkih ditemukan di sini" size={66} rot={-3} align="center" width={900} halo />
          {cardK > 0 ? (
            <div style={{ position: "absolute", left: 540, top: 1110, transform: `translateX(-50%) rotate(-1.5deg) scale(${0.8 + 0.2 * cardK})`, opacity: clamp01(cardK * 3),
              background: C.paperHi, padding: "18px 50px 22px", boxShadow: "0 14px 26px rgba(0,0,0,0.35)", textAlign: "center" }}>
              <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 150, color: C.ink, lineHeight: 1, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                ± {(Math.round(mix(0, 3700, eout(lin(t, ws(47), ws(50) + 0.2))) / 100) * 100).toLocaleString("id-ID")}
              </div>
              <div style={{ fontFamily: F.label, fontWeight: 700, fontSize: 46, letterSpacing: 6, color: C.red, marginTop: 6 }}>TAHUN LALU</div>
            </div>
          ) : null}
        </>
      )}
    </MapView>
  );
};

const S8Merveilles: React.FC = () => {
  const t = useT(CUT.merveilles);
  return (
    <AbsoluteFill>
      <Paper />
      <Photo t={t} src="rempah/merveilles.jpg" iw={2252} ih={1382} box={{ x: 40, y: 380, w: 1000, h: 760 }} rot={-1.4} seed={8} enter={CUT.merveilles - 0.05}
        keys={[{ t: CUT.merveilles, c: { cx: 0.5, cy: 0.5, zw: 0.9 } }, { t: CUT.map3, c: { cx: 0.42, cy: 0.55, zw: 0.72 } }]} />
      <Tag t={t} at={ws(55)} x={540} y={250} text="INDIA" size={90} anchor="center" rot={-3} />
      <Source t={t} at={CUT.merveilles + 0.2} x={70} y={1165} text="LIVRE DES MERVEILLES, ±1410" />
      <Hand t={t} at={CUT.merveilles + 0.35} x={70} y={1210} text="begini Eropa membayangkan India" size={58} rot={-2} />
    </AbsoluteFill>
  );
};

const Bars: React.FC<{ t: number; at: number; grow: number; out: number }> = ({ t, at, grow, out }) => {
  const k = pop(t, at, 0.45, 0.15);
  const o = 1 - ease(t, out, out + 0.35);
  if (k <= 0 || o <= 0) return null;
  const names = ["MALUKU", "INDIA", "ARAB", "VENESIA"];
  const hs = [0.07, 0.22, 0.48, 1];
  return (
    <div style={{ position: "absolute", left: 120, top: 1000 + (1 - k) * 160 + (1 - o) * 400, width: 840, height: 420, transform: "rotate(-1deg)",
      background: C.paperHi, boxShadow: "0 16px 30px rgba(0,0,0,0.35)", padding: "22px 40px" }}>
      <div style={{ fontFamily: F.label, fontWeight: 700, fontSize: 40, letterSpacing: 5, color: C.ink }}>HARGA</div>
      <div style={{ position: "absolute", left: 40, right: 40, bottom: 64, height: 270, borderBottom: `4px solid ${C.ink}`, display: "flex", alignItems: "flex-end", justifyContent: "space-around" }}>
        {hs.map((h, i) => {
          const g = eout(lin(t, grow + i * 0.38, grow + i * 0.38 + 0.4));
          return <div key={i} style={{ width: 120, height: Math.max(4, h * 255 * g), background: i === 3 ? C.red : C.ochre }} />;
        })}
      </div>
      <div style={{ position: "absolute", left: 40, right: 40, bottom: 16, display: "flex", justifyContent: "space-around" }}>
        {names.map((n) => (
          <div key={n} style={{ width: 160, textAlign: "center", fontFamily: F.label, fontWeight: 500, fontSize: 28, letterSpacing: 2, color: C.ink }}>{n}</div>
        ))}
      </div>
    </div>
  );
};

const S9Map3: React.FC = () => {
  const t = useT(CUT.map3);
  const cutAt = ws(67) + 0.1; // memotong
  const xk = lin(t, cutAt, cutAt + 0.12);
  return (
    <MapView
      t={t}
      cam={[
        { t: CUT.map3, lon: 76, lat: 20, z: 0.6 },
        { t: ws(64), lon: 74, lat: 22, z: 0.63 },
        { t: ws(67) - 0.2, lon: 62, lat: 22, z: 0.6 },
        { t: CUT.malaka, lon: 47, lat: 10, z: 0.5 },
      ]}
      routes={[
        { wp: R_MALUKU_INDIA, a: CUT.map3 - 0.3, b: CUT.map3 + 0.15, color: C.ochre, fadeTo: { at: cutAt + 0.1, color: "#8f877a" } },
        { wp: R_INDIA_ARAB, a: CUT.map3 + 0.05, b: ws(58), color: C.ochre, fadeTo: { at: cutAt + 0.1, color: "#8f877a" } },
        { wp: R_ARAB_VENICE, a: ws(58), b: ws(59) + 0.2, color: C.ochre, fadeTo: { at: cutAt + 0.1, color: "#8f877a" } },
        { wp: R_PORTUGAL, a: cutAt + 0.35, b: CUT.malaka + 0.1, color: C.red, w: 8 },
      ]}
      pins={[
        { lon: PL.maluku[0], lat: PL.maluku[1], at: CUT.map3, label: "MALUKU", side: "t" },
        { lon: PL.kollam[0], lat: PL.kollam[1], at: CUT.map3, label: "INDIA", side: "b" },
        { lon: 45, lat: 15, at: CUT.map3 + 0.1, label: "ARAB", side: "r", until: cutAt + 0.6 },
        { lon: PL.venice[0], lat: PL.venice[1], at: ws(58), label: "VENESIA", side: "t" },
        { lon: PL.lisbon[0], lat: PL.lisbon[1], at: cutAt + 0.3, label: "PORTUGAL", side: "t", color: C.ink },
      ]}
    >
      {({ sx }) => {
        const [x, y] = sx(33, 26);
        return (
          <>
            <Bars t={t} at={ws(59) - 0.2} grow={ws(60)} out={ws(65) - 0.1} />
            {xk > 0 ? (
              <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
                <path d={`M${x - 60},${y - 60} L${x - 60 + 120 * xk},${y - 60 + 120 * xk}`} stroke={C.red} strokeWidth={16} strokeLinecap="round" />
                {xk >= 1 ? <path d={`M${x + 60},${y - 60} L${x + 60 - 120 * lin(t, cutAt + 0.12, cutAt + 0.24)},${y - 60 + 120 * lin(t, cutAt + 0.12, cutAt + 0.24)}`} stroke={C.red} strokeWidth={16} strokeLinecap="round" /> : null}
              </svg>
            ) : null}
            <Hand t={t} at={cutAt + 0.6} x={60} y={1230} text="jalan memutar Afrika" size={62} color={C.red} rot={-2} halo />
          </>
        );
      }}
    </MapView>
  );
};

const S10Malaka: React.FC = () => {
  const t = useT(CUT.malaka);
  return (
    <AbsoluteFill>
      <Paper />
      <Photo t={t} src="rempah/malaka.jpg" iw={1915} ih={959} box={{ x: 30, y: 470, w: 1020, h: 720 }} rot={1.4} seed={11} enter={CUT.malaka - 0.05}
        keys={[{ t: CUT.malaka, c: { cx: 0.5, cy: 0.5, zw: 0.95 } }, { t: CUT.ortelius, c: { cx: 0.48, cy: 0.62, zw: 0.62 } }]} filter="sepia(0.35) contrast(1.1)" />
      <Tag t={t} at={ws(72)} x={60} y={330} text="MALAKA" size={80} rot={-3} />
      <Source t={t} at={CUT.malaka + 0.3} x={60} y={1215} text="GAMBAR MALAKA, ABAD KE-16" />
      <Stamp t={t} at={ws(74)} x={720} y={1010} text="1511" size={150} rot={-9} />
    </AbsoluteFill>
  );
};

const S11Ortelius: React.FC = () => {
  const t = useT(CUT.ortelius);
  const led = lin(t, CUT.ledger - 0.1, CUT.ledger + 0.3);
  return (
    <AbsoluteFill>
      <Paper />
      <Photo t={t} src="rempah/ortelius.jpg" iw={4001} ih={2771} box={{ x: 15, y: 260, w: 1050, h: 1150 }} rot={-0.8} seed={13} enter={CUT.ortelius - 0.05}
        keys={[
          { t: CUT.ortelius, c: { cx: 0.33, cy: 0.5, zw: 0.62 } },
          { t: ws(80), c: { cx: 0.64, cy: 0.66, zw: 0.34 } },
          { t: CUT.ledger, c: { cx: 0.645, cy: 0.67, zw: 0.3 } },
          { t: CUT.vroom, c: { cx: 0.65, cy: 0.67, zw: 0.27 } },
        ]}
        filter={`sepia(0.12) contrast(1.04) blur(${led * 7}px) brightness(${1 - led * 0.35})`} />
      {t < CUT.ledger ? (
        <>
          <Source t={t} at={CUT.ortelius + 0.2} x={40} y={1430} text="PETA PASIFIK, ORTELIUS 1589" />
          <Hand t={t} at={ws(79) + 0.5} x={70} y={330} text="kapal Victoria" size={92} color={C.red} rot={-4} width={600} halo
            arrow={{ x1: 330, y1: 440, x2: 470, y2: 700, bend: -0.3 }} />
          <Tag t={t} at={ws(82)} x={60} y={1260} text="EKSPEDISI MAGELLAN" size={46} rot={-2} />
          <Hand t={t} at={ws(85)} x={560} y={1150} text="muatan: cengkih Tidore" size={56} rot={-3} width={500} halo />
        </>
      ) : null}
      {t >= CUT.ledger - 0.1 ? <Ledger t={t} /> : null}
    </AbsoluteFill>
  );
};

const Ledger: React.FC<{ t: number }> = ({ t }) => {
  const k = pop(t, CUT.ledger, 0.5, 0.18);
  const rows = ["Kapal", "Awak kapal", "Perbekalan"];
  return (
    <div style={{ position: "absolute", left: 130, top: 380 + (1 - k) * 600, width: 820, height: 900, transform: "rotate(-2deg)", background: C.paperHi,
      boxShadow: "0 22px 40px rgba(0,0,0,0.45)", padding: "50px 60px", backgroundImage: "repeating-linear-gradient(180deg, rgba(0,0,0,0) 0 69px, rgba(60,90,120,0.22) 69px 71px)" }}>
      <div style={{ position: "absolute", left: 110, top: 0, bottom: 0, width: 3, background: "rgba(196,55,43,0.45)" }} />
      <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 72, color: C.ink, lineHeight: 1.1, marginLeft: 70 }}>Biaya ekspedisi</div>
      {rows.map((r, i) => {
        const rk = lin(t, CUT.ledger + 0.35 + i * 0.3, CUT.ledger + 0.6 + i * 0.3);
        return (
          <div key={r} style={{ marginLeft: 70, marginTop: i === 0 ? 50 : 18, height: 52, display: "flex", alignItems: "center", gap: 24, opacity: rk }}>
            <div style={{ fontFamily: F.hand, fontWeight: 700, fontSize: 58, color: C.ink, width: 300 }}>{r}</div>
            <div style={{ height: 6, width: 260 * rk, background: "rgba(31,26,21,0.55)", borderRadius: 3 }} />
          </div>
        );
      })}
      <div style={{ marginLeft: 70, marginTop: 60, fontFamily: F.label, fontWeight: 700, fontSize: 38, letterSpacing: 4, color: C.ink, opacity: lin(t, ws(88), ws(88) + 0.2) }}>DIBAYAR DENGAN:</div>
      <div style={{ marginLeft: 70, marginTop: 6, fontFamily: F.hand, fontWeight: 700, fontSize: 96, color: C.red, opacity: 1,
        clipPath: `inset(-20% ${100 - 100 * lin(t, ws(88) + 0.2, ws(88) + 0.7)}% -20% 0)` }}>cengkih</div>
      <Stamp t={t} at={ws(92)} x={520} y={660} text="LUNAS" size={130} rot={-14} font={F.label} />
    </div>
  );
};

const S12Vroom: React.FC = () => {
  const t = useT(CUT.vroom);
  const sk = pop(t, ws(95), 0.4, 0.3);
  return (
    <AbsoluteFill>
      <Paper />
      <Photo t={t} src="rempah/vroom.jpg" iw={4000} ih={1844} box={{ x: -20, y: 640, w: 1120, h: 700 }} rot={-1} seed={17} enter={CUT.vroom - 0.05}
        keys={[{ t: CUT.vroom, c: { cx: 0.28, cy: 0.5, zw: 0.48 } }, { t: CUT.coen, c: { cx: 0.5, cy: 0.5, zw: 0.44 } }]} />
      {sk > 0 ? (
        <div style={{ position: "absolute", left: 540, top: 330, width: 300, height: 300, transform: `translate(-50%,0) scale(${sk}) rotate(-8deg)`, borderRadius: "50%",
          border: `14px solid ${C.red}`, outline: `5px solid ${C.red}`, outlineOffset: 8, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F.head, fontWeight: 900, fontSize: 130, color: C.red, mixBlendMode: "multiply", opacity: 0.92 }}>
          VOC
        </div>
      ) : null}
      <Source t={t} at={CUT.vroom + 0.2} x={50} y={1360} text="ARMADA BELANDA, H.C. VROOM 1599" />
      <Hand t={t} at={CUT.vroom + 0.3} x={540} y={200} text="kongsi dagang Belanda" size={56} rot={-2} align="center" width={800} />
    </AbsoluteFill>
  );
};

const S13Coen: React.FC = () => {
  const t = useT(CUT.coen);
  return (
    <AbsoluteFill>
      <Paper />
      <Photo t={t} src="rempah/coen.jpg" iw={1797} ih={2400} box={{ x: 170, y: 250, w: 740, h: 920 }} rot={-1.2} seed={19} enter={CUT.coen - 0.05}
        keys={[{ t: CUT.coen, c: { cx: 0.5, cy: 0.42, zw: 0.95 } }, { t: CUT.banda, c: { cx: 0.54, cy: 0.3, zw: 0.62 } }]} />
      <Tag t={t} at={CUT.coen + 0.15} x={540} y={1200} text="JAN PIETERSZOON COEN" size={50} anchor="center" rot={-2} />
      <Hand t={t} at={CUT.coen + 0.5} x={540} y={1295} text="Gubernur Jenderal VOC" size={56} rot={-2} align="center" width={800} />
    </AbsoluteFill>
  );
};

const S14Banda: React.FC = () => {
  const t = useT(CUT.banda);
  return (
    <AbsoluteFill>
      <Paper />
      <Photo t={t} src="rempah/banda1665.jpg" iw={2395} ih={1297} box={{ x: 20, y: 420, w: 1040, h: 780 }} rot={1.1} seed={23} enter={CUT.banda - 0.05}
        keys={[{ t: CUT.banda, c: { cx: 0.45, cy: 0.5, zw: 0.95 } }, { t: CUT.dots, c: { cx: 0.5, cy: 0.58, zw: 0.62 } }]} />
      <Tag t={t} at={CUT.banda + 0.1} x={60} y={290} text="KEPULAUAN BANDA" size={66} rot={-2} />
      <Source t={t} at={CUT.banda + 0.3} x={50} y={1225} text="PETA BANDA, ±1665" />
      <Stamp t={t} at={ws(104)} x={730} y={1040} text="1621" size={150} rot={-8} />
    </AbsoluteFill>
  );
};

const S15Dots: React.FC = () => {
  const t = useT(CUT.dots);
  const cols = 15, rows = 10, cell = 62, x0 = 540 - (cols * cell) / 2 + cell / 2, y0 = 640;
  const r = rand(77);
  const order = Array.from({ length: cols * rows }, (_, i) => ({ i, k: r() }));
  const keep = new Set(order.slice().sort((a, b) => a.k - b.k).slice(0, 10).map((o) => o.i));
  const goneA = ws(117), goneB = ws(118) + 0.6;
  const showHead = lin(t, ws(112) - 0.1, ws(112) + 0.15);
  const down = lin(t, ws(118) - 0.1, ws(118) + 0.5);
  const val = Math.round(mix(15000, 1000, eout(down)) / 100) * 100;
  return (
    <AbsoluteFill>
      <Paper dark />
      <div style={{ position: "absolute", left: 0, right: 0, top: 270, textAlign: "center", opacity: showHead }}>
        <div style={{ fontFamily: F.label, fontWeight: 700, fontSize: 44, letterSpacing: 8, color: "rgba(246,238,220,0.8)" }}>PENDUDUK BANDA</div>
        <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 170, color: down > 0 ? "#e8664f" : C.paperHi, lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>
          ± {val.toLocaleString("id-ID")}
        </div>
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        {order.map(({ i }) => {
          const cx = x0 + (i % cols) * cell, cy = y0 + Math.floor(i / cols) * cell;
          const appear = pop(t, CUT.dots + 0.1 + ((i % cols) + Math.floor(i / cols)) * 0.035, 0.35, 0.3);
          const gk = keep.has(i) ? 0 : lin(t, goneA + r() * 0 + (i * 7919 % 150) / 150 * (goneB - goneA - 0.25), goneA + (i * 7919 % 150) / 150 * (goneB - goneA - 0.25) + 0.25);
          const fill = keep.has(i) && t > goneB ? "#e8664f" : C.paperHi;
          return (
            <g key={i} transform={`translate(${cx},${cy}) scale(${appear})`}>
              <circle r={22} fill={fill} opacity={1 - gk * 0.92} />
              <circle r={22} fill="none" stroke="rgba(246,238,220,0.45)" strokeWidth={2.5} opacity={gk} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

const S16Map5: React.FC = () => {
  const t = useT(CUT.map5);
  const a = CUT.map5 + 0.1;
  return (
    <MapView
      t={t}
      cam={[
        { t: CUT.map5, lon: 45, lat: 15, z: 0.3 },
        { t: ws(125), lon: 50, lat: 12, z: 0.36 },
        { t: CUT.pulau, lon: 120, lat: -3, z: 1.1 },
      ]}
      routes={[
        { wp: [...R_MALUKU_INDIA, ...R_INDIA_ARAB.slice(1), ...R_ARAB_VENICE.slice(1)], a, b: a + 1.3, color: C.ochre, w: 6 },
        { wp: R_PORTUGAL, a: a + 0.25, b: a + 1.6, color: C.red, w: 6 },
        { wp: R_VOC, a: a + 0.5, b: a + 1.9, color: C.teal, w: 6 },
        { wp: arcWp(PL.manhattan, PL.run, 0.22), a: a + 0.7, b: a + 2.1, color: C.ink, w: 4, dash: "12 9" },
      ]}
      pins={[
        { lon: PL.maluku[0], lat: PL.maluku[1], at: CUT.map5, label: "MALUKU", side: "t", big: true },
        { lon: PL.venice[0], lat: PL.venice[1], at: a + 0.6 },
        { lon: PL.lisbon[0], lat: PL.lisbon[1], at: a + 0.6, color: C.red },
        { lon: PL.amsterdam[0], lat: PL.amsterdam[1], at: a + 0.6, color: C.teal },
        { lon: PL.manhattan[0], lat: PL.manhattan[1], at: a + 0.6, color: C.ink },
      ]}
    />
  );
};

const S17Pulau: React.FC = () => (
  <Footage src="rempah/pulau.mp4" t0={CUT.pulau} t1={CUT.tangan} rate={0.95} push={[1.0, 1.07]} origin="50% 40%" />
);

const S18Tangan: React.FC = () => (
  <Footage src="rempah/tangan.mp4" t0={CUT.tangan} t1={TOTAL / FPS} rate={0.85} push={[1.0, 1.08]}>
    {(t) => {
      const k = pop(t, VOICE_END + 0.15, 0.5, 0.2);
      if (k <= 0) return null;
      return (
        <div style={{ position: "absolute", left: 540, top: 330, transform: `translateX(-50%) rotate(-2deg) scale(${0.7 + 0.3 * k})`, opacity: clamp01(k * 3),
          background: C.paperHi, padding: "14px 54px 18px", boxShadow: "0 16px 30px rgba(0,0,0,0.45)", textAlign: "center", whiteSpace: "nowrap" }}>
          <div style={{ fontFamily: F.label, fontWeight: 700, fontSize: 40, letterSpacing: 10, color: C.red }}>JALUR</div>
          <div style={{ fontFamily: F.head, fontWeight: 900, fontSize: 150, color: C.ink, lineHeight: 1 }}>Rempah</div>
        </div>
      );
    }}
  </Footage>
);

// ---------------------------------------------------------------- fonts + assembly
const FONTS: [string, string, string][] = [
  ["PlayfairR", "rempah/fonts/playfair.woff2", "400 900"],
  ["OswaldR", "rempah/fonts/oswald.woff2", "200 700"],
  ["CaveatR", "rempah/fonts/caveat.woff2", "400 700"],
];
const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(FONTS.map(([n, s, w]) => new FontFace(n, `url(${staticFile(s)})`, { weight: w }).load().then((f) => (document.fonts as unknown as { add: (f: FontFace) => void }).add(f))))
      .then(() => document.fonts.load("800 66px Inter"))
      .then(() => continueRender(h))
      .catch((e) => {
        console.error(e);
        continueRender(h);
      });
  }, [h]);
};

const SCENES: [number, number, React.FC][] = [
  [CUT.manhattan, CUT.castello, S1Manhattan],
  [CUT.castello, CUT.map1, S2Castello],
  [CUT.map1, CUT.pala, S3Map1],
  [CUT.pala, CUT.plancius, S4Pala],
  [CUT.plancius, CUT.cengkih, S5Plancius],
  [CUT.cengkih, CUT.map2, S6Cengkih],
  [CUT.map2, CUT.merveilles, S7Map2],
  [CUT.merveilles, CUT.map3, S8Merveilles],
  [CUT.map3, CUT.malaka, S9Map3],
  [CUT.malaka, CUT.ortelius, S10Malaka],
  [CUT.ortelius, CUT.vroom, S11Ortelius],
  [CUT.vroom, CUT.coen, S12Vroom],
  [CUT.coen, CUT.banda, S13Coen],
  [CUT.banda, CUT.dots, S14Banda],
  [CUT.dots, CUT.map5, S15Dots],
  [CUT.map5, CUT.pulau, S16Map5],
  [CUT.pulau, CUT.tangan, S17Pulau],
  [CUT.tangan, TOTAL / FPS, S18Tangan],
];

export const SHOTS = SCENES.map(([a, b], i) => ({ id: i + 1, a: fr(a), b: fr(b) }));

export const Rempah: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const t = f / FPS;
  const audio = (getInputProps() as { audio?: boolean }).audio !== false;
  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      {SCENES.map(([a, b, S], i) => (
        <Sequence key={i} from={fr(a)} durationInFrames={fr(b) - fr(a)} premountFor={15}>
          <S />
        </Sequence>
      ))}
      <Vignette k={0.3} />
      <Grain amount={0.14} />
      <Captions t={t} />
      {audio ? <Audio src={staticFile("rempah/mix.wav")} /> : null}
    </AbsoluteFill>
  );
};

export const _unused = { we, Stamp, eout };
