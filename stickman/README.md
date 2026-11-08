# Wabah Hilang Ingatan: Hari Ke-6 di Klinik Pulau — editing

Proyek editing (Remotion) untuk video stickman 16:9, 9:36 + 4 detik end card.

## Isi
- `editor/` — proyek Remotion
  - `src/data.json` — timeline 197 gambar (dihasilkan dari `timeline.txt`, cut disesuaikan ke awal ucapan narasi)
  - `src/cues.ts` — keputusan editing per gambar: transisi, efek kamera, guncangan, teks kinetik, efek suara
  - `src/Shot.tsx` — gerak kamera (zoom/pan), transisi (cut, flash, whip, dip, glitch, crossfade)
  - `src/Overlays.tsx` — motion graphic: judul, kartu bab, tag HUD, stempel "HARI KE-6", teks kutipan, panel radio, UI rekaman, end card, grain, vignette
  - `public/sfx/` — efek suara sintetis (dibuat oleh `tools/make_sfx.py`)
- `tools/make_sfx.py` — membuat efek suara
- `tools/gen_timeline.py` — membuat `src/data.json` dari `timeline.txt` + audio
- `timeline.txt` — timeline asli dari folder Pulau

## Render ulang
1. Ekstrak `Pulau.zip`, salin `*.jpg` ke `editor/public/img/` dan MP3 narasi ke `editor/public/narasi.mp3`.
2. Jalankan:

```bash
cd editor && npm i && npx remotion render PulauYangLupa out/pulau-yang-lupa.mp4 --codec=h264 --crf=22
```

Untuk mengubah edit: `npx remotion studio`, lalu ubah `src/cues.ts`.
