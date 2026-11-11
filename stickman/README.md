# Stickman — Bagaimana Jika Kamu Punya Helikopter di Zaman Purba?

Video YouTube 16:9 (1920x1080, 30 fps, 7:46) dari bahan di Google Drive `Helikopter/Helikopter.zip`:
145 gambar berurutan, narasi ElevenLabs (7:44.8), naskah dan transkrip bertimestamp.

Hasil akhir: `out/helikopter_zaman_purba.mp4` (1080p, untuk upload YouTube) dan `out/preview_720p.mp4` (preview ringan).
Keduanya disimpan lewat Git LFS (`git lfs pull` setelah clone).

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
- Guncangan kamera di adegan angin baling-baling, kepanikan, dan banjir.
- Tanpa sound effect dan tanpa musik: audio hanya narasi asli.

## Motion graphic (hanya di bagian tertentu)
Semua di `studio/src/Overlays.tsx`, muncul tepat saat kata diucapkan:

| Waktu | Grafis |
|---|---|
| 0:02 | Label harga "MILIARAN RUPIAH" |
| 0:05 | Penghitung 0 → 30.000 tahun lalu |
| 0:10 | Daftar silang: bandara, bengkel, bahan bakar |
| 0:28 | Indikator bahan bakar naik ke PENUH |
| 2:31 | Kartu ikon: sungai, kawanan hewan, tempat berlindung |
| 3:01 | Panah TIMUR vs BARAT |
| 3:15 | Daftar centang "Pemburu tahu" |
| 3:22 | Label layar terbelah: MELIHAT JAUH / MEMAHAMI TANAH |
| 3:27 | Catatan waktu "Beberapa hari kemudian..." |
| 3:39 | Daftar silang: kilang minyak, truk pengisian, suku cadang |
| 4:19 | Catatan waktu "Suatu sore..." |
| 4:22–5:08 | Hujan beranimasi, berhenti saat "hujan reda" |
| 4:59 | Kartu peringatan BAHAYA |
| 5:07 | Daftar centang cuaca membaik |
| 5:36 | Alarm merah berdenyut + indikator HAMPIR HABIS |
| 6:11 | Indikator TERLALU SEDIKIT |
| 6:15 | Label harga kembali, dicap "TIDAK BISA TERBANG" |
| 6:22 / 6:36 | Catatan waktu "Hari demi hari..." / "Suatu pagi..." |
| 6:24 | Daftar centang hal yang dipelajari |
| 6:52 | Perbandingan BATU TAJAM vs HELIKOPTER |
| 7:08 | Pertanyaan penutup muncul per kata |
| 7:13 | Efek film lama untuk kilas balik + catatan waktu |
| 7:40 | Pesan akhir muncul per kata |

## Membuat ulang
```bash
tools/fetch_bahan.sh          # unduh gambar + narasi dari Drive ke studio/public
cd studio && npm install
npx remotion studio src/index.ts   # pratinjau
./render_chunks.sh            # render per potongan (bisa dilanjutkan)
./encode.sh                   # gabung + narasi -> ../out/helikopter_zaman_purba.mp4
```
