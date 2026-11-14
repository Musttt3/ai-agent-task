# LAPORAN PENGUMPULAN FILE — Langkah 6

Sumber: folder Google Drive **Mentahan** → `Mentahan.zip` (677 MB, 108 file) + unduhan otomatis + voice over ElevenLabs.
Semua file sudah ada di `assets/` dengan nama sesuai daftar (`tools/import_drive.py` memetakan nama asli → nama daftar).

## Status: ✅ LENGKAP — 52/52 visual, 24/24 SFX, 3/3 musik, 8/8 voice over

### Yang perlu diperhatikan / sudah diperbaiki

| File | Masalah | Tindakan |
|---|---|---|
| `TU02_diderot-van-loo_nobg.png` | PNG yang dikirim (`91552.png`) **bukan Diderot**: potret pria lain (berwig, memegang tongkat) | Dibuat ulang dari potret Van Loo asli dengan rembg ✅. File salah disimpan di `assets/_alt/potret-bukan-diderot_nobg.png` |
| `TU06_heller_nobg.png` | PNG yang dikirim (`91558.png`) foto Heller **lain**, hanya 1000×720 | Dibuat ulang dari foto 1979 (4234×6165) dengan model segmentasi manusia, kemeja utuh ✅. Versimu disimpan di `assets/_alt/heller-kedua_nobg.png` |
| `LK08_medali-olimpiade_nobg.png` | Remove background `91591.png` belum bersih: lemari kaca dan alasnya ikut | Ketiga plakat medali (emas, perak, perunggu) dipotong rapi lalu disusun ulang di latar transparan ✅. Plakat satuan ada di `assets/_alt/medali-*.png` |
| FT04, FT05, FT06, FT08 | Kamu mengganti dengan footage Pexels lain | **Dipakai versimu** ✅: 13324066 (dua orang memegang kopi, portrait), 7594672 (menuang kopi di dapur, 1080p), 13443899 (kurir di depan pintu, portrait), 4199353 (scroll ponsel, 4K). Versi lama ada di `assets/_alt/` |
| `481077__khenshom__book-handling...wav` | Langsung dari Freesound, **lisensi tidak bisa diverifikasi** (Freesound memblokir akses dari server; bisa jadi CC BY-NC) | **Tidak dipakai.** Kalau lisensinya CC0/CC BY, kabari saya |
| 20 SFX tambahan (Pixabay) + musik *Discover* | Di luar daftar | Disimpan di `assets/sfx_tambahan/` sebagai lapisan opsional, misalnya *small wood block* dan *bodyfall* untuk stempel yang lebih empuk, dan *polaroid foley*. Pixabay License: bebas pakai, tanpa atribusi |
| `mixkit-vastness-184 (1).mp3` | Duplikat | Diabaikan |

### Cek kualitas

- **Foto:** semua lebar ≥1500 px, kecuali 8 file yang sejak awal ditandai ⚠ untuk dipakai sebagai foto pin (Vonnegut 936 px, Kahneman 1280 px, komik 1921, diagram RPE, molekul dopamin, upacara 1912, Gray 869/771).
- **PNG `_nobg`:** 9/9 benar-benar transparan (24–88% piksel transparan, sesuai bentuk objek).
- **Footage:** 14/14 terbaca normal. 10 klip 4K/UHD, 3 klip 1080p, 2 klip portrait (FT04, FT06) yang akan di-crop atau diberi latar blur untuk 16:9.
- **Voice over (Must4):** 7 bagian, total **8:50** (`VO_full.mp3`, −16,7 LUFS).
  - Transkripsi Whisper cocok 90–97% dengan naskah, dan semua kalimat lengkap.
  - Timing per kata ada di `timing/`.
  - Nama yang perlu didengar ulang: Buss, Luttmer, Momand, Diener.
  - Durasi VO (8:50) lebih pendek dari target 10:00, karena Must4 membaca dengan tempo pas (±130 kata/menit). Ditambah jeda visual dan layar akhir, perkiraan durasi video **±9:30**.
