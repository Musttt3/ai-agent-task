// Word-timed plan for "Pulau Kecil yang Ditukar dengan New York". Times come from the ElevenLabs transcript of
// voice take 1 after the voice edit (0.15 s lead, +0.4 s after "Maluku.", +0.6 s after "tersisa."): see words.json.
import words from "./words.json";

export const FPS = 30;
export const WORDS = words as { w: string; s: number; e: number }[];
/** start time (s) of word i */
export const ws = (i: number) => WORDS[i].s;
/** end time (s) of word i */
export const we = (i: number) => WORDS[i].e;
export const fr = (t: number) => Math.round(t * FPS);

export const VOICE_END = WORDS[WORDS.length - 1].e;
export const TOTAL = fr(VOICE_END + 1.7);

// scene cuts (s), each a cut on a word onset
export const CUT = {
  manhattan: 0,
  castello: ws(7), // Belanda
  map1: ws(12), // Gantinya?
  pala: ws(20), // Penghasil
  plancius: ws(28), // Kepulauan
  cengkih: ws(33), // hanya (ada di Maluku)
  map2: ws(37), // Tapi
  merveilles: ws(53), // Lewat
  map3: ws(56), // Arab
  malaka: ws(70), // Portugis
  ortelius: ws(78), // Kapal
  ledger: ws(87), // Muatannya
  vroom: ws(93), // Lalu datang VOC
  coen: ws(98), // Demi
  banda: ws(101), // Banda ditaklukkan
  dots: ws(110), // Dari sekitar
  map5: ws(121), // Rempah menggambar ulang
  pulau: ws(126), // Dan semuanya
  tangan: ws(132), // di timur Nusantara
};

// caption chunks: [first word, last word, display text]; numbers are shown as digits
export const CAPTIONS: [number, number, string][] = [
  [0, 6, "Tahun 1667,"],
  [7, 9, "Belanda melepas Manhattan"],
  [10, 11, "ke Inggris."],
  [12, 12, "Gantinya?"],
  [13, 15, "Sebuah pulau kecil"],
  [16, 17, "di Maluku."],
  [18, 19, "Pulau Run."],
  [20, 21, "Penghasil pala,"],
  [22, 25, "rempah yang dulu hanya"],
  [26, 29, "tumbuh di Kepulauan Banda."],
  [30, 32, "Cengkih pun begitu,"],
  [33, 36, "hanya ada di Maluku."],
  [37, 40, "Tapi jejaknya sampai jauh."],
  [41, 44, "Cengkih ditemukan di Suriah,"],
  [45, 52, "dari sekitar 3.700 tahun lalu."],
  [53, 55, "Lewat pedagang India,"],
  [56, 58, "Arab, lalu Venesia,"],
  [59, 60, "harganya berlipat"],
  [61, 64, "setiap kali berpindah tangan."],
  [65, 66, "Eropa ingin"],
  [67, 69, "memotong jalur itu."],
  [70, 72, "Portugis merebut Malaka"],
  [73, 77, "tahun 1511."],
  [78, 79, "Kapal Victoria"],
  [80, 82, "dari ekspedisi Magellan"],
  [83, 86, "pulang membawa cengkih Tidore."],
  [87, 89, "Muatannya cukup untuk"],
  [90, 92, "membiayai seluruh pelayaran."],
  [93, 97, "Lalu datang VOC."],
  [98, 100, "Demi monopoli pala,"],
  [101, 102, "Banda ditaklukkan"],
  [103, 109, "tahun 1621."],
  [110, 115, "Dari sekitar 15 ribu penduduk,"],
  [116, 120, "hanya sekitar seribu yang tersisa."],
  [121, 123, "Rempah menggambar ulang"],
  [124, 125, "peta dunia."],
  [126, 128, "Dan semuanya berawal"],
  [129, 131, "dari pulau-pulau kecil"],
  [132, 134, "di timur Nusantara."],
];
