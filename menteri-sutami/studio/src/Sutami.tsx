import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Flash, GlitchBars, GlitchWrap, Grain, LightLeak, Vignette } from "./lib";
import {
  S1Hook, S2Listrik, S3Title, S3Trio, S4Jenius, S5Beton, S5Kalkulator, S5Pencil, S6Cards, S6Nama,
} from "./Scenes1";
import {
  S7Megah, S7Sederhana, S8Jahit, S8Jarum, S9Makan, S9Nasi, S9Tempe, S10Bocor, S10Hujan,
  S11Monitor, S11Ranjang, S11Soeharto, S12Arsip, S12Makam, S12Tahun, S13Penutup,
} from "./Scenes2";

export const TOTAL = 2010; // 67.0 s at 30 fps; narration ends at 64.9 s

// Cut list in frames (30 fps). Boundaries sit on word onsets measured from the narration envelope.
export const SHOTS: [number, number, React.FC, string][] = [
  [0, 63, S1Hook, "Membangun proyek raksasa negara"],
  [63, 206, S2Listrik, "listrik rumahnya ... diputus ... tagihan"],
  [206, 306, S3Title, "Inilah Insinyur Sutami, menteri legendaris"],
  [306, 386, S3Trio, "dipercaya sejak era Soekarno hingga Soeharto"],
  [386, 452, S4Jenius, "Kejeniusannya luar biasa"],
  [452, 502, S5Pencil, "Ia dikenal mampu menghitung"],
  [502, 553, S5Beton, "konstruksi beton rumit"],
  [553, 614, S5Kalkulator, "secara manual, tanpa kalkulator"],
  [614, 683, S6Nama, "Namanya melekat pada proyek besar"],
  [683, 824, S6Cards, "Semanggi, GBK, Gedung DPR"],
  [824, 890, S7Megah, "Namun, di balik kemegahan itu"],
  [890, 968, S7Sederhana, "hidupnya justru sangat sederhana"],
  [968, 1031, S8Jahit, "baju dinasnya yang robek"],
  [1031, 1089, S8Jarum, "dijahit ulang oleh istrinya"],
  [1089, 1158, S9Makan, "Saat bertugas ... bekal"],
  [1158, 1179, S9Nasi, "nasi"],
  [1179, 1254, S9Tempe, "tempe ... restoran mewah"],
  [1254, 1335, S10Bocor, "setelah pensiun, rumahnya"],
  [1335, 1404, S10Hujan, "bocor ... renovasi"],
  [1404, 1455, S11Monitor, "Ketika sakit parah"],
  [1455, 1506, S11Ranjang, "biaya pengobatan menjadi persoalan"],
  [1506, 1580, S11Soeharto, "hingga Soeharto membantu perawatannya"],
  [1580, 1650, S12Tahun, "Tahun 1980"],
  [1650, 1716, S12Arsip, "Sutami meninggal dunia"],
  [1716, 1751, S12Makam, "tanpa meninggalkan kekayaan melimpah"],
  [1751, TOTAL, S13Penutup, "Ia membuktikan satu hal ... dikenang"],
];

// glitch cuts (frame of the cut)
const GLITCH = [63, 824, 1580];

export const Sutami: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SHOTS.map(([a, b, C, name]) => (
        <Sequence key={a} from={a} durationInFrames={b - a} name={name}>
          {GLITCH.includes(a) || GLITCH.includes(b) ? (
            <GlitchWrap at={GLITCH.includes(a) ? 0 : b - a} dur={8} seed={`g${a}`}>
              <C />
            </GlitchWrap>
          ) : (
            <C />
          )}
        </Sequence>
      ))}
      {GLITCH.map((g) => <GlitchBars key={g} at={g} dur={8} seed={`b${g}`} />)}
      <Flash at={306} peak={0.8} />
      <Flash at={683} peak={0.5} len={6} />
      <Flash at={1031} color="#fff6e6" peak={0.35} len={6} />
      <LightLeak at={890} len={24} />
      <LightLeak at={1716} len={20} />
      <Vignette strength={0.42} />
      <Grain opacity={0.15} />
    </AbsoluteFill>
  );
};
