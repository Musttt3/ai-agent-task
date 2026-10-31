# Video Stickman: "Dulu, Makan Pakai Garpu Dianggap Dosa"

Video pendek vertikal (1080x1920, 30 fps, ±45 detik) bergaya video referensi:
narasi cepat, caption muncul per kata, potongan adegan cepat, zoom/shake, dan efek suara.

**File utama:** `garpu-stickman-final.mp4`

## Naskah (narasi Bahasa Indonesia)

> Kalau kamu makan pakai garpu... seribu tahun lalu, kamu bakal dianggap PENDOSA!
> Kita mundur ke tahun 1004. Seorang putri Bizantium datang ke Venesia untuk menikah,
> dan dia membawa benda aneh: garpu emas kecil. Para pendeta langsung syok!
> Kata mereka, Tuhan sudah kasih kita jari, ngapain pakai garpu?
> Beberapa tahun kemudian, sang putri meninggal karena wabah. Dan orang-orang bilang...
> itu hukuman gara-gara garpu! Garpu pun dijauhi selama ratusan tahun.
> Bahkan di Inggris tahun 1600-an, pria yang makan pakai garpu malah ditertawakan.
> Sekarang? Miliaran orang pakai garpu setiap hari.
> Jadi kalau hari ini kamu makan pakai garpu... selamat, kamu pemberontak abad pertengahan.

## Cara pembuatan

| Bagian | Alat |
|---|---|
| 14 ilustrasi adegan (karakter stickman konsisten) | Artlist, Nano Banana 2 (image-to-image dari gambar karakter) |
| 3 klip animasi (lorong waktu, massa marah, ending ksatria) | Artlist, Kling 3.0 (image-to-video) |
| Voiceover | Artlist, ElevenLabs Eleven v3 (suara "Hype", Bahasa Indonesia), dipercepat 1,4x |
| Musik latar | Artlist, Lyria 3 Pro (instrumental orisinal, tanpa watermark) |
| Efek suara | Disintesis sendiri (`tools/sfx.py`): whoosh, boom, pop, sparkle, clang, choir, crowd |
| Timing caption per kata | faster-whisper (`tools/transcribe.py`) |
| Kamera, caption, flash, zoom-blur, render | `tools/render.py` (Pillow + ffmpeg) |

`scenes/` berisi ilustrasi tiap adegan (resolusi diperkecil) dan `storyboard.jpg`.
