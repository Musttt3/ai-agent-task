# Jasa Memarahi Bos Secara Anonim — TikTok 9:16 (46 detik)

Video vertikal 1080×1920 @30fps, dibuat dengan [Remotion](https://remotion.dev) dari bahan:
voiceover ElevenLabs, 5 foto, dan naskah.

Hasil render: `out/jasa-marahi-bos.mp4`

## Struktur scene (detik, sinkron ke voiceover)

| Waktu | Scene | Motion graphic | Transisi masuk |
|---|---|---|---|
| 0.0–6.5 | Hook | Judul "JASA MEMARAHI BOS" slam + shake, badge "SECARA ANONIM", pan kamera, kartu karyawan piksel + stempel RAHASIA | — |
| 6.5–12.3 | Kalimar White | Lower-third nama + "AKTOR", badge OCDA berputar | Whip pan |
| 12.3–17.9 | Keluhan anonim | Mockup HP chat: pesan masuk, efek mengetik, kirim, toggle anonim, stempel 100% ANONIM | Zoom blur |
| 17.9–21.0 | Datang ke kantor | Chip "DATANG LANGSUNG!", pin lokasi jatuh | Whip pan |
| 21.0–25.0 | Konfrontasi | Panah + lingkaran "SERAGAM KHUSUS", speech bubble marah, pan ke bos + label "SANG BOS" | Glitch |
| 25.0–30.1 | Viral | Viewfinder REC + shutter flash, progress unggah, counter penonton 1.000.000+, hati beterbangan | Zoom blur |
| 30.1–35.5 | Settingan | "SERIUS?" + vignette detak jantung (hitam-putih), record scratch, coret, clapperboard, stempel UNTUK HIBURAN | Glitch |
| 35.5–41.0 | Sorotan | Lampu sorot menyapu, "JADI SOROTAN", kartu HUMOR + MASALAH NYATA | Whip vertikal |
| 41.0–46.3 | CTA | Bendera berkibar, "INDONESIA" slam, pertanyaan, kolom komentar mengetik + panah | Whip pan |

Sepanjang video: caption kata-per-kata (timing dari transkripsi Whisper), kata kunci di-highlight,
flash di tiap potongan, progress bar, dan ~55 sound effect + beat latar tipis.

Semua SFX dan musik latar disintesis sendiri (`public/sfx/`) — bebas lisensi.

## Render ulang

```bash
npm i
npx remotion studio           # preview
npx remotion render JasaMarahiBos out/jasa-marahi-bos.mp4 --crf=18
```

Ubah timing SFX di `src/Main.tsx` (array `SFX`), visual tiap scene di `src/Scenes.tsx`,
gaya caption di `src/Captions.tsx`.
