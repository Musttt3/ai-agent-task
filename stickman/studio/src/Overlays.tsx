import React from "react";
import { Sequence } from "remotion";
import { AUDIO_SEC, COLORS, f, shotStart, shotVoice, TOTAL_SEC, W, wt } from "./lib";
import {
  ArrowLabel,
  Checklist,
  FilmLook,
  FuelGauge,
  IconCards,
  PriceTag,
  Rain,
  RedAlert,
  SplitLabels,
  TimeNote,
  Warning,
  WordReveal,
  YearCounter,
} from "./mg/graphics";

/** Spread the words of `text` over [t0, t1] by length (for lines where ASR word split differs). */
const spread = (text: string, t0: number, t1: number, from: number, hi: string[] = []) => {
  const ws = text.split(" ");
  const total = ws.reduce((a, w) => a + w.length + 1, 0);
  let acc = 0;
  return ws.map((w) => {
    const at = f(t0 + ((t1 - t0) * acc) / total) - from;
    if (w !== "\n") acc += w.length + 1;
    return { t: w, at, hi: hi.includes(w.replace(/[^\p{L}]/gu, "").toLowerCase()) };
  });
};

type Cue = { from: number; to: number; el: (from: number) => React.ReactNode; name: string };

/** relative frame of an absolute time inside a cue that starts at `from` frames */
const rel = (sec: number, from: number) => f(sec) - from;

const CUES: Cue[] = [
  {
    name: "Harga helikopter",
    from: wt("miliaran", 0) - 0.15,
    to: shotStart(2) - 0.1,
    el: () => <PriceTag pos={{ right: 250, top: 120 }} top="HARGA" main="MILIARAN RUPIAH" />,
  },
  {
    name: "30.000 tahun lalu",
    from: shotVoice(2) + 0.3,
    to: shotStart(3) - 0.15,
    el: (fr) => (
      <YearCounter
        pos={{ left: W / 2, bottom: 64 }}
        countFrom={rel(wt("zaman", shotVoice(2)), fr)}
        countTo={rel(wt("lalu", shotVoice(2)) + 0.25, fr)}
        target={30000}
      />
    ),
  },
  {
    name: "Tidak ada bandara",
    from: wt("bandara", shotVoice(3)) - 0.2,
    to: shotStart(4) - 0.1,
    el: (fr) => {
      const a = wt("bandara", shotVoice(3));
      return (
        <Checklist
          pos={{ right: 70, top: 56 }}
          items={[
            { text: "Bandara", at: rel(a, fr), kind: "x" },
            { text: "Bengkel", at: rel(wt("ban", a + 0.3, 3), fr), kind: "x" },
            { text: "Bahan bakar", at: rel(wt("bahan", a + 0.6), fr), kind: "x" },
          ]}
        />
      );
    },
  },
  {
    name: "Tangki penuh",
    from: shotVoice(7) + 0.3,
    to: shotStart(8) - 0.1,
    el: (fr) => (
      <FuelGauge
        pos={{ right: 70, top: 56 }}
        keys={[
          [rel(wt("penuh", shotVoice(7)) - 0.6, fr), 0.02],
          [rel(wt("penuh", shotVoice(7)) + 0.4, fr), 1],
        ]}
        status="PENUH"
        statusColor={COLORS.green}
        scale={0.9}
      />
    ),
  },
  {
    name: "Gunanya helikopter",
    from: shotVoice(38),
    to: shotStart(40) - 0.1,
    el: (fr) => (
      <IconCards
        pos={{ left: 80, bottom: 64 }}
        items={[
          { icon: "water", text: "Sungai", at: rel(wt("sungai", shotVoice(38)), fr) },
          { icon: "herd", text: "Kawanan hewan", at: rel(wt("mengamati", shotVoice(38)) + 0.4, fr) },
          { icon: "cave", text: "Tempat berlindung", at: rel(wt("tempat", shotVoice(39)), fr) },
        ]}
      />
    ),
  },
  {
    name: "Timur",
    from: wt("timur", shotVoice(45)) - 0.1,
    to: shotStart(48) - 0.1,
    el: () => <ArrowLabel pos={{ left: 90, top: 80 }} text="TIMUR" dir="left" color={COLORS.orange} />,
  },
  {
    name: "Barat",
    from: wt("barat", shotVoice(46)) - 0.1,
    to: shotStart(48) - 0.1,
    el: () => <ArrowLabel pos={{ right: 90, top: 80 }} text="BARAT" dir="right" color={COLORS.blue} />,
  },
  {
    name: "Pengetahuan pemburu",
    from: shotVoice(50),
    to: shotStart(53) - 0.1,
    el: (fr) => (
      <Checklist
        pos={{ left: 70, top: 56 }}
        title="Pemburu tahu"
        titleColor={COLORS.green}
        items={[
          { text: "Tempat air mengalir", at: rel(wt("tempat", shotVoice(50)), fr), kind: "check" },
          { text: "Tanah yang mudah ambles", at: rel(shotVoice(51), fr), kind: "check" },
          { text: "Jejak hewan", at: rel(wt("jejak", shotVoice(52)), fr), kind: "check" },
        ]}
      />
    ),
  },
  {
    name: "Udara vs darat",
    from: wt("melihat", shotVoice(53)) - 0.1,
    to: shotStart(54) - 0.3,
    el: (fr) => (
      <SplitLabels left="MELIHAT JAUH" right="MEMAHAMI TANAH" rightAt={rel(wt("memahami", shotVoice(53)), fr)} />
    ),
  },
  {
    name: "Beberapa hari kemudian",
    from: shotStart(54) + 0.35,
    to: shotStart(55) - 0.1,
    el: () => <TimeNote text="Beberapa hari kemudian..." />,
  },
  {
    name: "Tidak ada kilang",
    from: shotVoice(57),
    to: shotStart(59) - 0.1,
    el: (fr) => (
      <Checklist
        pos={{ left: 70, top: 56 }}
        title="Di zaman ini"
        titleColor={COLORS.red}
        items={[
          { text: "Kilang minyak", at: rel(wt("kilang", shotVoice(57)), fr), kind: "x" },
          { text: "Truk pengisian", at: rel(wt("truk", shotVoice(58)), fr), kind: "x" },
          { text: "Suku cadang", at: rel(wt("suku", shotVoice(58)), fr), kind: "x" },
        ]}
      />
    ),
  },
  {
    name: "Suatu sore",
    from: shotStart(69) + 0.4,
    to: shotStart(70) - 0.1,
    el: () => <TimeNote text="Suatu sore..." />,
  },
  {
    name: "Hujan",
    from: shotVoice(70) - 0.2,
    to: shotVoice(86) + 1.1,
    el: (fr) => <Rain fadeOutAt={rel(shotVoice(86), fr)} />,
  },
  {
    name: "Bahaya terbang",
    from: wt("terbang", shotVoice(84)) - 0.1,
    to: shotStart(85) - 0.1,
    el: () => (
      <Warning pos={{ left: 70, bottom: 56 }} title="BAHAYA!" lines={["Hujan deras", "Angin kencang"]} />
    ),
  },
  {
    name: "Cuaca membaik",
    from: shotVoice(86),
    to: shotStart(89) - 0.1,
    el: (fr) => (
      <Checklist
        pos={{ left: 70, top: 56 }}
        title="Cuaca"
        titleColor={COLORS.blue}
        items={[
          { text: "Hujan reda", at: rel(wt("reda", shotVoice(86)) - 0.15, fr), kind: "check" },
          { text: "Angin melemah", at: rel(shotVoice(87), fr), kind: "check" },
          { text: "Jarak pandang membaik", at: rel(shotVoice(88), fr), kind: "check" },
        ]}
      />
    ),
  },
  {
    name: "Alarm bahan bakar",
    from: wt("lampu", shotVoice(99)) - 0.1,
    to: shotStart(102) - 0.1,
    el: () => <RedAlert />,
  },
  {
    name: "Gauge hampir habis",
    from: wt("lampu", shotVoice(99)) - 0.1,
    to: shotStart(102) - 0.1,
    el: () => (
      <FuelGauge
        pos={{ right: 70, top: 56 }}
        keys={[
          [0, 0.14],
          [40, 0.04],
        ]}
        status="HAMPIR HABIS"
        statusColor={COLORS.red}
        blink
        scale={0.9}
      />
    ),
  },
  {
    name: "Bahan bakar terlalu sedikit",
    from: wt("bahan", shotVoice(111)) - 0.1,
    to: shotStart(112) - 0.1,
    el: () => (
      <FuelGauge
        pos={{ right: 70, top: 56 }}
        keys={[
          [0, 0.07],
          [30, 0.01],
        ]}
        status="TERLALU SEDIKIT"
        statusColor={COLORS.red}
        scale={0.9}
      />
    ),
  },
  {
    name: "Harga tak berguna",
    from: wt("miliaran", shotVoice(112)) - 0.2,
    to: shotStart(115) - 0.3,
    el: (fr) => (
      <PriceTag
        pos={{ right: 250, top: 120 }}
        top="HARGA"
        main="MILIARAN RUPIAH"
        stamp="TIDAK BISA TERBANG"
        stampAt={rel(wt("tidak", shotVoice(114)), fr)}
      />
    ),
  },
  {
    name: "Hari demi hari",
    from: shotStart(115) + 0.4,
    to: shotStart(116) - 0.1,
    el: () => <TimeNote text="Hari demi hari..." />,
  },
  {
    name: "Belajar bertahan",
    from: shotVoice(116),
    to: shotStart(119) + 1.0,
    el: (fr) => (
      <Checklist
        pos={{ left: 70, top: 56 }}
        title="Belajar"
        titleColor={COLORS.green}
        items={[
          { text: "Mencari air", at: rel(wt("mencari", shotVoice(116)), fr), kind: "check" },
          { text: "Mengenali tumbuhan", at: rel(shotVoice(117), fr), kind: "check" },
          { text: "Membuat peralatan", at: rel(shotVoice(118), fr), kind: "check" },
        ]}
      />
    ),
  },
  {
    name: "Suatu pagi",
    from: shotStart(121) + 0.3,
    to: shotStart(122) + 1.2,
    el: () => <TimeNote text="Suatu pagi..." />,
  },
  {
    name: "Batu tajam",
    from: shotVoice(128),
    to: shotStart(133) - 0.1,
    el: (fr) => (
      <Checklist
        pos={{ left: 60, top: 56 }}
        title="Batu tajam"
        titleColor={COLORS.green}
        size={40}
        items={[
          { text: "Dipakai hari ini", at: rel(wt("hari", shotVoice(128)), fr), kind: "check" },
          { text: "Besok", at: rel(wt("besok", shotVoice(129)), fr), kind: "check" },
          { text: "Bertahun-tahun kemudian", at: rel(wt("bertahun", shotVoice(129), 6), fr), kind: "check" },
          { text: "Bisa diasah kembali", at: rel(wt("diasah", shotVoice(130)), fr), kind: "check" },
        ]}
      />
    ),
  },
  {
    name: "Helikopter butuh",
    from: shotVoice(131),
    to: shotStart(133) - 0.1,
    el: (fr) => (
      <Checklist
        pos={{ right: 60, top: 56 }}
        title="Helikopter"
        titleColor={COLORS.red}
        tilt={1.5}
        size={40}
        items={[
          { text: "Butuh bahan bakar", at: rel(wt("bahan", shotVoice(131)), fr), kind: "x", strike: false },
          { text: "Butuh perawatan", at: rel(wt("perawatan", shotVoice(132)), fr), kind: "x", strike: false },
          { text: "Butuh teknologi", at: rel(wt("teknologi", shotVoice(132)), fr), kind: "x", strike: false },
        ]}
      />
    ),
  },
  {
    name: "Pertanyaan",
    from: shotVoice(133),
    to: shotStart(134) - 0.05,
    el: (fr) => (
      <WordReveal
        pos={{ left: (W - 1500) / 2, bottom: 56 }}
        words={spread(
          "Jadi, bagaimana rasanya punya helikopter 30 ribu tahun lalu?",
          shotVoice(133),
          shotStart(134) - 0.9,
          fr,
          ["helikopter"],
        )}
      />
    ),
  },
  {
    name: "Kilas balik",
    from: shotStart(134),
    to: shotStart(139),
    el: () => <FilmLook />,
  },
  {
    name: "Hari pertama",
    from: shotStart(134) + 0.25,
    to: shotStart(136) - 0.1,
    el: () => <TimeNote text="Hari pertama" />,
  },
  {
    name: "Beberapa hari kemudian 2",
    from: shotStart(136) + 0.05,
    to: shotStart(138) - 0.1,
    el: () => <TimeNote text="Beberapa hari kemudian" />,
  },
  {
    name: "Penerbangan terakhir",
    from: shotStart(138) + 0.05,
    to: shotStart(139),
    el: () => <TimeNote text="Penerbangan terakhir" />,
  },
  {
    name: "Pesan akhir",
    from: shotVoice(145),
    to: TOTAL_SEC,
    el: (fr) => (
      <WordReveal
        pos={{ left: (W - 1640) / 2, bottom: 56 }}
        width={1640}
        size={58}
        words={spread(
          "Barang paling mahal belum tentu \n menjadi barang yang paling berguna.",
          shotVoice(145),
          AUDIO_SEC - 0.9,
          fr,
          ["mahal", "berguna"],
        )}
      />
    ),
  },
];

export const Overlays: React.FC = () => (
  <>
    {CUES.map((c) => {
      const from = f(c.from);
      const dur = f(c.to) - from;
      return (
        <Sequence key={c.name} name={c.name} from={from} durationInFrames={dur} layout="none">
          {c.el(from)}
        </Sequence>
      );
    })}
  </>
);

/** Flashback window, used to tint the pictures underneath. */
export const FLASHBACK: [number, number] = [f(shotStart(134)), f(shotStart(139))];
