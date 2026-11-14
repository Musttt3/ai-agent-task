# Manusia Purba Jadi WNI — edit video (Remotion)

Video stickman 16:9 (9:53) dengan pergantian gambar cut sederhana + Ken Burns, kartu judul & bab,
tag, stempel, penghitung, notifikasi ponsel dan ikon situasional. Semua SFX, ambience dan musik
disintesis dengan kode (`tools/mix.py`) — bebas lisensi pihak ketiga.

## Alur
1. Gambar `public/img/001–169.jpg` (dari ZIP Drive "File wni"), narasi ElevenLabs.
2. `tools/script.json` — naskah per adegan; `tools/transcript.json` — kata + waktu (faster-whisper).
3. `python3 tools/align.py` → `tools/align_fixed.json` (waktu mulai tiap adegan).
4. `python3 tools/plan.py` → `src/data/plan.json` (adegan, transisi, overlay).
5. `npx remotion render ManusiaPurbaWNI out/video_noaudio.mp4 --muted`
6. `python3 -I tools/mix.py <narasi.mp3> out/mix.wav` (stems di `out/stems/`).
7. ffmpeg: gabungkan video + audio (x264 CRF 21, AAC 192k).
8. `python3 tools/captions.py <dir>` → SRT + chapter YouTube.
