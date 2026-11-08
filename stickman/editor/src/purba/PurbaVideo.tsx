// 9:16 TikTok edit: "Bisakah Manusia Purba Bertahan Hidup di Suhu Minus 30 Derajat?"
import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, random, Sequence, staticFile, useCurrentFrame } from "remotion";
import data from "./data.json";
import { Captions, Frost, Headline, Hook, ListCard, Snow, Stamp, TempPill, Vignette, Warm, Word } from "./ui";

export const PURBA_FPS = data.fps;
export const PURBA_TOTAL = data.total;

type ShotD = { n: number; file: string; text: string; from: number; dur: number };
const shots = data.shots as ShotD[];
const words = data.words as (Word & { shot: number })[];
const S = (n: number) => shots[n - 1];
// absolute frame when a word (first match within a shot) starts
const at = (shot: number, word: string) => {
  const w = words.find((x) => x.shot === shot && x.w.toLowerCase().startsWith(word.toLowerCase()));
  if (!w) throw new Error(`word ${word} not in shot ${shot}`);
  return w.from;
};

type Move = "pushIn" | "pullBack" | "panL" | "panR" | "tiltUp" | "tiltDown" | "punch" | "arc";
type In = "cut" | "whip" | "flash" | "whiteout" | "punch";
const SHOT: Record<number, { move: Move; in?: In; shake?: boolean }> = {
  1: { move: "pushIn" },
  2: { move: "pushIn", in: "punch" },
  3: { move: "panR", in: "whip" },
  4: { move: "pullBack", in: "whip" },
  5: { move: "tiltUp", in: "punch" },
  6: { move: "pushIn", in: "whip" },
  7: { move: "pushIn", in: "punch" },
  8: { move: "arc", in: "whip" },
  9: { move: "tiltDown", in: "flash" },
  10: { move: "pushIn", in: "whip" },
  11: { move: "pushIn", in: "whiteout" },
  12: { move: "punch", in: "punch", shake: true },
  13: { move: "pullBack", in: "whip" },
  14: { move: "pullBack", in: "whiteout", shake: true },
  15: { move: "arc", in: "flash" },
  16: { move: "punch", in: "punch" },
  17: { move: "punch", in: "punch" },
  18: { move: "pullBack", in: "flash" },
};
const SNOWY = new Set([1, 2, 3, 4, 9, 11, 12, 13, 14, 15, 16]);
const WARM = new Set([7, 8, 16, 18]);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Shot: React.FC<{ s: ShotD; nextIn?: In }> = ({ s, nextIn }) => {
  const frame = useCurrentFrame();
  const cfg = SHOT[s.n];
  const p = interpolate(frame, [0, s.dur], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  let sc = 1.08, x = 0, y = 0, rot = 0;
  switch (cfg.move) {
    case "pushIn": sc = 1.04 + 0.14 * p; break;
    case "pullBack": sc = 1.2 - 0.14 * p; break;
    case "panL": sc = 1.18; x = 5 - 10 * p; break;
    case "panR": sc = 1.18; x = -5 + 10 * p; break;
    case "tiltUp": sc = 1.16; y = -5 + 10 * p; break;
    case "tiltDown": sc = 1.16; y = 5 - 10 * p; break;
    case "arc": sc = 1.1 + 0.06 * p; x = -3 + 6 * p; rot = -1.2 + 2.4 * p; break;
    case "punch": {
      const k = interpolate(frame, [0, 6], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
      sc = 1.02 + 0.12 * k + 0.04 * p;
      break;
    }
  }
  // in-transitions
  let blur = 0, tx = 0, flash = 0, white = 0;
  if (cfg.in === "whip") {
    const k = interpolate(frame, [0, 7], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
    tx += 40 * k; blur += 26 * k;
  }
  if (cfg.in === "punch") sc *= interpolate(frame, [0, 5], [1.25, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (cfg.in === "flash") flash = interpolate(frame, [0, 8], [0.9, 0], clamp);
  if (cfg.in === "whiteout") white = interpolate(frame, [0, 12], [1, 0], clamp);
  // out-transitions (from next shot)
  if (nextIn === "whip") {
    const k = interpolate(frame, [s.dur - 6, s.dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
    tx -= 40 * k; blur += 26 * k;
  }
  if (nextIn === "whiteout") white = Math.max(white, interpolate(frame, [s.dur - 8, s.dur], [0, 1], clamp));
  if (cfg.shake) {
    const a = interpolate(frame, [0, 18], [26, 0], clamp);
    x += ((random(`x${s.n}-${frame}`) - 0.5) * a) / 10.8;
    y += ((random(`y${s.n}-${frame}`) - 0.5) * a) / 19.2;
  }
  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${x + tx}%, ${y}%) scale(${sc}) rotate(${rot}deg)`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined }}>
        <Img src={staticFile(`purba/${s.file}`)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.12) contrast(1.05)" }} />
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ background: "white", opacity: flash }} /> : null}
      {white > 0 ? <AbsoluteFill style={{ background: "#e6f6ff", opacity: white }} /> : null}
    </AbsoluteFill>
  );
};

const Fx: React.FC<{ name: string; from: number; vol: number; dir?: string; loop?: boolean; dur?: number }> = ({ name, from, vol, dir = "purba/sfx", loop, dur = 300 }) => (
  <Sequence from={Math.max(0, from)} durationInFrames={dur} layout="none" name={`sfx ${name}`}>
    <Audio src={staticFile(`${dir}/${name}.wav`)} volume={vol} loop={loop} />
  </Sequence>
);

const span = (a: number, b: number) => ({ from: S(a).from, durationInFrames: S(b).from + S(b).dur - S(a).from });

export const PurbaVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const frost = interpolate(frame, [S(14).from, S(14).from + S(14).dur], [0.2, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {shots.map((s, i) => (
        <Sequence key={s.n} from={s.from} durationInFrames={s.dur} name={`${s.n} ${s.text.slice(0, 28)}`}>
          <Shot s={s} nextIn={shots[i + 1] ? SHOT[shots[i + 1].n].in : undefined} />
          {WARM.has(s.n) ? <Warm /> : null}
          {SNOWY.has(s.n) ? <Snow wind={s.n === 14 ? 0.4 : 1.4} count={s.n === 14 ? 90 : 140} /> : null}
        </Sequence>
      ))}
      <Sequence {...span(11, 13)} name="cold tint">
        <AbsoluteFill style={{ background: "rgba(60,120,200,0.18)", mixBlendMode: "multiply" }} />
      </Sequence>
      <Sequence {...span(14, 14)} name="frost">
        <Frost amount={frost} />
      </Sequence>
      <Vignette />

      {/* ---- motion graphics ---- */}
      <Sequence {...span(1, 1)} name="Hook">
        <Hook jaketAt={at(1, "jaket") - S(1).from} sepatuAt={at(1, "sepatu") - S(1).from} />
      </Sequence>
      <Sequence {...span(2, 2)} name="Pertanyaan">
        <Headline text={"BISA\nSELAMAT?"} color="white" size={150} />
      </Sequence>
      <Sequence from={at(3, "bisa")} durationInFrames={at(3, "tapi") - at(3, "bisa")} name="BISA">
        <Stamp text="BISA!" color={"#4ee08a"} />
      </Sequence>
      <Sequence from={at(3, "tapi")} durationInFrames={S(4).from - at(3, "tapi")} name="tidak mudah">
        <Headline text={"TAPI\nTIDAK MUDAH"} color="#ff6b6b" size={120} rotate={-3} />
      </Sequence>
      <Sequence from={at(4, "sendirian")} durationInFrames={S(5).from - at(4, "sendirian")} name="tidak sendirian">
        <Headline text={"TIDAK\nSENDIRIAN"} color={"#9fe3ff"} size={120} />
      </Sequence>
      <Sequence {...span(5, 10)} name="Checklist bertahan">
        <ListCard
          title="CARA BERTAHAN"
          tone="good"
          items={[
            { label: "KULIT HEWAN", at: at(5, "kulit") - S(5).from },
            { label: "GUA", at: at(6, "gua") - S(5).from },
            { label: "API NONSTOP", at: at(7, "api") - S(5).from },
            { label: "MAKANAN BERLEMAK", at: at(8, "berlemak") - S(5).from },
            { label: "BERKELOMPOK", at: at(9, "kelompok") - S(5).from },
            { label: "SALING MENGHANGATKAN", at: at(10, "saling") - S(5).from },
          ]}
        />
      </Sequence>
      <Sequence {...span(11, 13)} name="Bahaya">
        <ListCard
          title="BAHAYA!"
          tone="bad"
          items={[
            { label: "API PADAM", at: at(11, "padam") - S(11).from },
            { label: "PAKAIAN BASAH", at: at(12, "basah") - S(11).from },
            { label: "TERPISAH", at: at(13, "terpisah") - S(11).from },
          ]}
        />
      </Sequence>
      <Sequence from={at(14, "minus")} durationInFrames={S(15).from - at(14, "minus")} name="-30 besar">
        <Headline text="-30°C" color={"#9fe3ff"} size={230} top={300} />
      </Sequence>
      <Sequence from={at(15, "bertahan")} durationInFrames={S(16).from - at(15, "bertahan")} name="bisa bertahan">
        <Stamp text="BISA BERTAHAN!" color={"#ffd23f"} />
      </Sequence>
      <Sequence {...span(16, 18)} name="3 kunci">
        <ListCard
          title="3 KUNCI BERTAHAN"
          tone="key"
          top={260}
          items={[
            { label: "API", at: at(16, "api") - S(16).from },
            { label: "PERLINDUNGAN", at: at(17, "perlindungan") - S(16).from },
            { label: "KEBERSAMAAN", at: at(18, "kebersamaan") - S(16).from },
          ]}
        />
      </Sequence>
      <Sequence {...span(2, 15)} name="Suhu">
        <TempPillSwitch />
      </Sequence>

      <Captions words={words} />

      {/* ---- sound ---- */}
      <Audio src={staticFile("purba/narasi.mp3")} />
      <Audio src={staticFile("purba/sfx/pulse.wav")} loop volume={(f) => interpolate(f, [0, 20, data.audioEnd - 30, data.total], [0, 0.22, 0.22, 0], clamp)} />
      <Audio src={staticFile("purba/sfx/wind.wav")} loop volume={(f) => {
        const indoor = [6, 7, 8, 10, 17, 18].some((n) => f >= S(n).from && f < S(n).from + S(n).dur);
        return indoor ? 0.06 : f >= S(14).from && f < S(15).from ? 0.45 : 0.28;
      }} />
      <Fx name="impact" dir="sfx" from={0} vol={0.45} />
      <Fx name="crunch" from={10} vol={0.35} />
      <Fx name="pop" from={at(1, "jaket")} vol={0.5} />
      <Fx name="pop" from={at(1, "sepatu")} vol={0.5} />
      <Fx name="whoosh" dir="sfx" from={S(2).from - 4} vol={0.4} />
      <Fx name="impact" dir="sfx" from={at(3, "bisa")} vol={0.35} />
      <Fx name="whoosh" dir="sfx" from={S(3).from - 6} vol={0.35} />
      <Fx name="crunch" from={S(3).from + 10} vol={0.4} />
      <Fx name="whoosh" dir="sfx" from={S(4).from - 6} vol={0.35} />
      <Fx name="crunch" from={S(4).from + 15} vol={0.25} />
      {[at(5, "kulit"), at(6, "gua"), at(7, "api"), at(8, "berlemak"), at(9, "kelompok"), at(10, "saling")].map((f, i) => (
        <Fx key={`pop${i}`} name="pop" from={f} vol={0.55} />
      ))}
      <Fx name="whoosh" dir="sfx" from={S(6).from - 6} vol={0.35} />
      <Fx name="fire" from={S(7).from} vol={0.5} dur={S(9).from - S(7).from} />
      <Fx name="whoosh" dir="sfx" from={S(8).from - 6} vol={0.3} />
      <Fx name="bite" from={S(8).from + 12} vol={0.6} />
      <Fx name="bite" from={S(8).from + 40} vol={0.5} />
      <Fx name="whoosh" dir="sfx" from={S(10).from - 6} vol={0.3} />
      <Fx name="fire" from={S(10).from} vol={0.25} dur={S(11).from - S(10).from} />
      <Fx name="impact" dir="sfx" from={S(11).from} vol={0.5} />
      <Fx name="sting" dir="sfx" from={S(11).from} vol={0.3} />
      {[at(11, "padam"), at(12, "basah"), at(13, "terpisah")].map((f, i) => (
        <Fx key={`x${i}`} name="pop" from={f} vol={0.5} />
      ))}
      <Fx name="icecrack" from={S(12).from} vol={0.7} />
      <Fx name="whoosh" dir="sfx" from={S(13).from - 6} vol={0.35} />
      <Fx name="heartbeat" dir="sfx" from={S(14).from} vol={0.55} dur={S(15).from - S(14).from} />
      <Fx name="impact" dir="sfx" from={at(14, "minus")} vol={0.4} />
      <Fx name="chime" dir="sfx" from={S(15).from} vol={0.4} />
      <Fx name="impact" dir="sfx" from={at(15, "bertahan")} vol={0.3} />
      <Fx name="fire" from={S(16).from} vol={0.45} dur={data.total - S(16).from} />
      {[at(16, "api"), at(17, "perlindungan"), at(18, "kebersamaan")].map((f, i) => (
        <Fx key={`k${i}`} name="impact" dir="sfx" from={f} vol={0.3 + i * 0.05} />
      ))}
      <Fx name="chime" dir="sfx" from={at(18, "kebersamaan")} vol={0.45} />
    </AbsoluteFill>
  );
};

const TempPillSwitch: React.FC = () => {
  const frame = useCurrentFrame() + S(2).from;
  const danger = frame >= S(11).from && frame < S(15).from;
  // hide while the big hook/-30 headline already shows the temperature
  const hidden = frame >= at(14, "minus") && frame < S(15).from;
  return hidden ? null : <TempPill danger={danger} />;
};
