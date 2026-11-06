# Ratu Kalinyamat — proyek edit video

Proyek [Remotion](https://remotion.dev) untuk video YouTube stickman
"Ratu dari Jawa yang Berani Mengirim Armada Perang Melawan Portugis" (16:9, 1080p, 30 fps, ±10:41).
Proyek ini memakai kerangka yang sama dengan `../video-indonesia` dan `../video-perunggu`.

## Isi edit

- **Gaya**: pergantian gambar dengan cut sederhana; transisi khusus hanya di momen penting (lorong waktu, kematian, penobatan, pertempuran, penutup).
- **Pembuka 0:00–0:32**: 5 klip animasi Artlist (Kling v3 Pro 1080p) di `public/clips/` (tidak disimpan di git; ada di folder "stickman" Artlist).
- **Motion graphic tanpa teks** (`src/icons.tsx`, `src/motion.tsx`): lencana ikon doodle (kapal, meriam, mahkota, rempah, benteng, Portugis, jabat tangan, dll.), armada kapal berlayar, ikon dari empat arah, kerumunan prajurit, ledakan meriam, ikon yang dicoret satu per satu (6 kapal perbekalan), hati retak, jam pasir, mahkota jatuh, pin dan rute kapal di peta.
- **Audio** (`tools/mix.py`): narasi + suasana per adegan (laut, pelabuhan & camar, pasar, istana, hujan, pertempuran), efek suara untuk setiap animasi ikon, dan musik latar bernuansa gamelan (saron, bonang, kenong, gong, kendang; tangga nada slendro) — semuanya disintesis, -14 LUFS.

## Cara render ulang

```bash
npm i
python3 tools/prepare_images.py "/path/ke/ratu_kalinyamat"
python3 tools/align.py                       # tools/script.json + transcript.json -> tools/align_fixed.json
python3 tools/plan.py                        # tools/align_fixed.json -> src/data/plan.json
npx remotion render RatuKalinyamat out/video_noaudio.mp4 --muted --concurrency=4 --crf=18
python3 tools/mix.py "/path/ke/narasi.mp3" out/mix.wav
ffmpeg -i out/video_noaudio.mp4 -i out/mix.wav -c:v copy -c:a aac -b:a 192k -shortest out/final.mp4
python3 tools/captions.py out                # subtitle_indonesia.srt + chapters_youtube.txt
```

Pratinjau/edit interaktif: `npx remotion studio`. Edit teks overlay, waktu, dan transisi di `tools/plan.py`, lalu jalankan ulang skripnya.

Font: Luckiest Guy & Nunito (SIL Open Font License), disimpan lokal di `public/fonts`.
