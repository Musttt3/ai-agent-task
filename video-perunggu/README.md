# Keruntuhan Zaman Perunggu — proyek edit video

Proyek [Remotion](https://remotion.dev) untuk video YouTube stickman
"Keruntuhan Zaman Perunggu: Ketika Peradaban Besar Dunia Hancur Hampir Bersamaan" (16:9, 1080p, 30 fps, ±8:56).
Proyek ini memakai kerangka yang sama dengan `../video-indonesia`.

## Isi edit

- **Gambar**: 107 ilustrasi stickman, dipotong sesuai narasi. Waktu pergantian diambil dari transkripsi kata per kata (Whisper) atas audio ElevenLabs.
- **Kamera & efek**: zoom/pan pelan (Ken Burns), punch-zoom, putaran lorong waktu, guncangan kamera (Ugarit terbakar, serangan Bangsa Laut, takhta Het runtuh, efek domino, kuil runtuh), efek bara api di adegan kota terbakar, dan kilas balik sepia.
- **Transisi**: crossfade, whip-pan + motion blur, wipe, zoom, warp (lorong waktu), flash, dip-to-black (malam), dan fade sepia (1891).
- **Motion graphic**: kartu judul, 11 kartu bab, label peta (Yunani, Anatolia, Siprus, Mesir, Ugarit), keterangan fakta (Hattusa, Mykenai, Uluburun, Ramses III, Medinet Habu, Linear B, kekeringan 1198–1196 SM), penghitung tahun 2026 M → 1300 SM, angka "10 TON" dan "2023", stempel "UGARIT RUNTUH"/"RUNTUH", label efek domino, infografis linimasa krisis, dan kartu penutup.
- **Audio** (`tools/mix.py`): narasi + suasana per adegan (pelabuhan & camar, pasar, ombak, angin gurun, kobaran api, bawah laut, badai), efek suara (whoosh, dentuman, batu beradu, langkah, cipratan, guntur, detak jantung, stempel, pop label), dan pad musik latar dengan ducking otomatis di bawah narasi. Semuanya disintesis sendiri, kecuali 4 SFX pendek dari remotion.media. Loudness akhir -14 LUFS.

## Cara render ulang

```bash
npm i
python3 tools/prepare_images.py "/path/ke/zaman_perunggu"
python3 tools/align.py                       # tools/script.json + transcript.json -> tools/align_fixed.json
python3 tools/plan.py                        # tools/align_fixed.json -> src/data/plan.json
npx remotion render KeruntuhanZamanPerunggu out/video_noaudio.mp4 --muted --concurrency=4 --crf=18
python3 tools/mix.py "/path/ke/narasi.mp3" out/mix.wav
ffmpeg -i out/video_noaudio.mp4 -i out/mix.wav -c:v copy -c:a aac -b:a 192k -shortest out/final.mp4
python3 tools/captions.py out                # subtitle_indonesia.srt + chapters_youtube.txt
```

Pratinjau/edit interaktif: `npx remotion studio`. Edit teks overlay, waktu, dan transisi di `tools/plan.py`, lalu jalankan ulang skripnya.

Font: Luckiest Guy & Nunito (SIL Open Font License), disimpan lokal di `public/fonts`.
