# Polisi yang Nekat Menilang Sultan Jogja — TikTok 9:16 (57 detik)

Video vertikal 1080×1920 @30fps, dibuat dengan [Remotion](https://remotion.dev) dari voiceover ElevenLabs,
11 gambar, dan naskah. Tanpa subtitle narator.

Hasil final (audio dinormalisasi -14 LUFS): `../hasil/polisi-tilang-sultan.mp4`

## Scene (detik, sinkron ke voiceover)

| Waktu | Narasi | Motion graphic | Transisi |
|---|---|---|---|
| 0.0–2.6 | Polisi nekat menilang Sultan | Lampu sirene merah/biru, "POLISI NEKAT" + "TILANG SULTAN!" slam | — |
| 2.6–7.3 | Siapa sangka... mengejutkan | Foto akhir di-blur (teaser), tanda tanya, teks glitch RGB | Glitch |
| 7.3–9.9 | Tahun 1960-an | Efek film lama (sepia, grain, sprocket), angka tahun 2026 → 1960 | Zoom |
| 9.9–11.6 | Polisi bernama Royadin | Plakat nama ROYADIN | Whip |
| 11.6–12.8 | Menghentikan mobil | "PRIIIT!" + peluit | Whip |
| 12.8–15.0 | Menerobos lampu merah di Semarang | Lampu merah berdenyut, lingkaran, panah, pin SEMARANG | Zoom |
| 15.0–18.0 | Kaca dibuka, terkejut | Kaca mobil turun, zoom punch + garis kaget, "TERKEJUT!" | Whip |
| 18.0–21.7 | Sri Sultan Hamengkubuwono IX | Reveal dari gelap, sinar emas, gong, plakat nama kerajaan + mahkota | — |
| 21.7–27.3 | Tetap tegas, surat tilang | Chip ORANG PENTING, stempel TETAP TEGAS, kartu surat tilang + tanda tangan + stempel DITILANG | Whip |
| 27.3–33.0 | Surat keraton, mengira dihukum | Jam, segel bercahaya, hitam-putih + vignette detak jantung, "DIHUKUM?" | Zoom |
| 33.0–38.7 | Justru sebaliknya, Sultan kagum | Teks flip 3D, bintang berputar, "KAGUM!" | Glitch |
| 38.7–42.9 | Diundang pindah ke Yogyakarta | Chip undangan, peta rute Semarang → Yogyakarta dengan mobil bergerak | Whip |
| 42.9–48.4 | Menolak, tetap mengabdi | Rute dicoret X + stempel DITOLAK, "TETAP MENGABDI" | Whip vertikal |
| 48.4–57.0 | Hukum untuk siapa saja | Timbangan keadilan miring lalu seimbang, gong penutup | Zoom |

SFX dan musik latar bernuansa gamelan (bonang, gong, kendang) disintesis sendiri di `public/sfx/` — bebas lisensi.
SFX dikecilkan (`SFX_GAIN` di `src/Main.tsx`) agar narator selalu jelas.

## Render ulang

```bash
npm i
npx remotion studio
npx remotion render PolisiTilangSultan out/polisi-tilang-sultan.mp4 --crf=18
```
