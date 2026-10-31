# Indonesia 1 Juta Tahun Lalu — proyek edit video

Proyek [Remotion](https://remotion.dev) untuk video YouTube stickman
"Indonesia 1 Juta Tahun Lalu: Seperti Apa Kehidupan Manusia Purba di Jawa" (16:9, 1080p, 30 fps, ±10:51).

## Isi edit

- **Gambar**: 128 ilustrasi stickman, dipotong sesuai narasi. Waktu pergantian diambil dari transkripsi kata per kata (Whisper) atas audio ElevenLabs.
- **Kamera**: zoom/pan pelan (Ken Burns) di setiap adegan, punch-zoom, putaran lorong waktu, dan guncangan kamera di adegan bahaya.
- **Transisi**: crossfade, whip-pan + motion blur, wipe, zoom, warp (lorong waktu), flash, dip-to-black (malam), dan fade sepia (1891).
- **Motion graphic**: kartu judul, 11 kartu bab, label peta (Sumatra, Kalimantan, Jawa, Sundaland, Daratan Asia), keterangan fakta, penghitung tahun mundur ke 1.000.000 tahun lalu, stempel "BELUM PASTI"/"MITOS FILM", angka 1891 & ±110.000, grafik perbandingan waktu, dan kartu penutup.
- **Audio** (`tools/mix.py`): narasi + suasana alam per adegan (burung, angin, sungai, ombak, jangkrik, api, kota), efek suara (whoosh, dentuman, batu beradu, langkah, cipratan, guntur, detak jantung, stempel, pop label), dan pad musik latar dengan ducking otomatis di bawah narasi. Semuanya disintesis sendiri, kecuali 4 SFX pendek dari remotion.media. Loudness akhir -14 LUFS.

## Cara render ulang

```bash
npm i
python3 tools/prepare_images.py "/path/ke/indonesia_1_juta_tahun"
python3 tools/plan.py                        # tools/align_fixed.json -> src/data/plan.json
npx remotion render Indonesia1JutaTahun out/video_noaudio.mp4 --muted --concurrency=4 --crf=18
python3 tools/mix.py "/path/ke/narasi.mp3" out/mix.wav
ffmpeg -i out/video_noaudio.mp4 -i out/mix.wav -c:v copy -c:a aac -b:a 192k -shortest out/final.mp4
python3 tools/captions.py out                # subtitle_indonesia.srt + chapters_youtube.txt
```

Pratinjau/edit interaktif: `npx remotion studio`. Edit teks overlay, waktu, dan transisi di `tools/plan.py`, lalu jalankan ulang skripnya.

Font: Luckiest Guy & Nunito (SIL Open Font License), disimpan lokal di `public/fonts`.
