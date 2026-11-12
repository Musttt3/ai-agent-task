# Stickman — Bagaimana Jika Kamu Punya Helikopter di Zaman Purba?

Video YouTube 16:9 (1920x1080, 30 fps, 7:46) dari bahan di Google Drive `Helikopter/Helikopter.zip`:
145 gambar berurutan, narasi ElevenLabs (7:44.8), naskah dan transkrip bertimestamp.

Hasil akhir: `out/helikopter_zaman_purba.mp4` (1080p, untuk upload YouTube) dan `out/preview_720p.mp4` (preview ringan).
Keduanya disimpan lewat Git LFS (`git lfs pull` setelah clone).

Thumbnail YouTube (1280x720): `out/thumbnail_A.png` (pemburu panik melihat helikopter) dan
`out/thumbnail_B.png` (tokoh berdiri di atas helikopter). Dibuat dari `studio/src/Thumbnail.tsx`:
`npx remotion still src/index.ts Thumbnail ../out/thumbnail_A.png --props '{"variant":"A"}'`.

## Gaya edit
- Dasar: pergantian gambar dengan cut sederhana, satu gambar per kalimat narasi.
  Titik cut diselaraskan per kata dengan narasi (faster-whisper, `tools/asr.py` + `tools/align.py`),
  jatuh sedikit sebelum suara kalimat baru dimulai.
- Setiap gambar bergerak pelan (zoom/geser halus) supaya tidak statis.
- Transisi hanya di pergantian bagian cerita (sekitar 50 dari 144 cut), sisanya cut biasa.
  Daftar lengkap ada di `studio/src/edit.ts`:
  - spin (masuk lorong waktu), zoom, whip pan, wipe diagonal bergaris tinta, iris lingkaran,
    dissolve, kilatan putih (helikopter muncul, ibu berteriak, kilas balik), dip ke hitam
    (lompatan waktu: "beberapa hari kemudian", "suatu sore", "hari demi hari", "suatu pagi").
- Tanpa sound effect dan tanpa musik: audio hanya narasi asli.

## Motion graphic
Tidak ada. Motion graphic (kartu teks, label, indikator bahan bakar, hujan, efek film) dan guncangan
kamera sudah dihapus atas permintaan; versi lama masih ada di riwayat git (commit 65bc92d).

## Membuat ulang
```bash
tools/fetch_bahan.sh          # unduh gambar + narasi dari Drive ke studio/public
cd studio && npm install
npx remotion studio src/index.ts   # pratinjau
./render_chunks.sh            # render per potongan (bisa dilanjutkan)
./encode.sh                   # gabung + narasi -> ../out/helikopter_zaman_purba.mp4
```
