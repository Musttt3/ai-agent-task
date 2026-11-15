# Stickman — Memancing 12.000 Tahun Lalu di Pulau Alor

Video YouTube 16:9 (1920×1080, 30 fps), gaya cut sederhana tanpa SFX/musik.

- `stickman_mancing_alor.mp4` — hasil akhir (9:44 = voice over 9:41 + tahan gambar penutup 2,5 detik)
- `timeline.csv` — daftar 294 gambar dengan waktu mulai/selesai di video
- `align.json` — timestamp naskah vs awal kalimat sebenarnya di voice over (whisper)
- `align.py`, `build.py` — skrip sinkronisasi dan render

Bahan dari Google Drive `Mancing/Mancing.zip` (294 gambar 1376×768, VO ElevenLabs, naskah, `daftar_adegan.csv`).

Render ulang:

```bash
python3 build.py <folder_bahan> align.json stickman_mancing_alor.mp4
```
