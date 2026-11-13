# Pulau Kecil yang Ditukar dengan New York (sejarah rempah)

Format: short vertikal 1080x1920, 30 fps, ±62 detik, gaya explainer Vox (kertas, kolase arsip, peta animasi).
Narasi: bahasa Indonesia, ElevenLabs voice **Must4** (eleven_v4), take 1. Komposisi Remotion: `Rempah`
(`studio/src/videos/rempah/`), audio: `studio/audio/rempah_audio.py`.

## Naskah
| Waktu | Narasi | Visual |
|---|---|---|
| 0:00 | Tahun 1667, Belanda melepas Manhattan ke Inggris. | Footage AI Manhattan + "1667"; Castello Plan (New Amsterdam 1660), stempel "KE INGGRIS" |
| 0:05 | Gantinya? Sebuah pulau kecil di Maluku. Pulau Run. | Peta: kamera terbang Manhattan → Maluku → Pulau Run |
| 0:09 | Penghasil pala, rempah yang dulu hanya tumbuh di Kepulauan Banda. | Footage AI pala; peta Plancius 1592 (gambar pala) |
| 0:13 | Cengkih pun begitu, hanya ada di Maluku. | Plancius (pohon cengkih); footage AI cengkih dijemur |
| 0:16 | Tapi jejaknya sampai jauh. Cengkih ditemukan di Suriah, dari sekitar 3.700 tahun lalu. | Peta: garis Maluku → Terqa, penghitung ± 3.700 |
| 0:23 | Lewat pedagang India, Arab, lalu Venesia, harganya berlipat setiap kali berpindah tangan. | Livre des merveilles (±1410); peta rute + grafik harga |
| 0:29 | Eropa ingin memotong jalur itu. | Silang merah di jalur lama, rute Portugis memutari Afrika |
| 0:31 | Portugis merebut Malaka tahun 1511. | Gambar Malaka abad ke-16, stempel "1511" |
| 0:35 | Kapal Victoria dari ekspedisi Magellan pulang membawa cengkih Tidore. Muatannya cukup untuk membiayai seluruh pelayaran. | Peta Ortelius 1589 (kapal Victoria); buku biaya, stempel "LUNAS" |
| 0:42 | Lalu datang VOC. Demi monopoli pala, Banda ditaklukkan tahun 1621. | Lukisan armada Vroom 1599 + segel VOC; potret J.P. Coen; peta Banda ±1665, stempel "1621" |
| 0:48 | Dari sekitar 15 ribu penduduk, hanya sekitar seribu yang tersisa. | 150 titik → 10 titik, penghitung ± 15.000 → ± 1.000 |
| 0:53 | Rempah menggambar ulang peta dunia. Dan semuanya berawal dari pulau-pulau kecil di timur Nusantara. | Peta dunia: semua rute bertemu di Maluku; footage AI pulau + tangan, "Jalur Rempah" |

## Fakta & catatan
- Perjanjian Breda (1667): Inggris tetap memegang New Amsterdam (Manhattan), Belanda tetap memegang Pulau Run. "Ditukar" adalah penyederhanaan populer; perjanjian ini mengukuhkan status quo.
- Pala dan cengkih dulu hanya tumbuh di Maluku (pala: Kepulauan Banda; cengkih: Ternate, Tidore, Moti, Makian, Bacan).
- Cengkih ditemukan di situs Terqa (Suriah), sekitar 1700 SM.
- Portugis merebut Malaka tahun 1511.
- Kapal Victoria (ekspedisi Magellan) kembali 1522 membawa cengkih dari Tidore; hasil penjualannya menutup biaya ekspedisi.
- VOC berdiri 1602. Penaklukan Banda 1621 di bawah J.P. Coen; penduduk turun dari sekitar 15.000 menjadi sekitar 1.000.

## Aset
- Arsip (domain publik, dari user): Castello Plan (redraft J.W. Adams dari peta 1660), peta Insulae Moluccae (Plancius 1592),
  Livre des merveilles (pepper harvest, ±1410), Malaka 1550–1563, Maris Pacifici (Ortelius 1589), H.C. Vroom 1599
  (Rijksmuseum SK-A-2858), potret J.P. Coen, peta Banda ±1665. Di `studio/public/rempah/*.jpg`.
- Footage AI (Google Flow, dari user): `assets/*.mp4`, semua diberi label "ILUSTRASI AI" di video. `prep.sh` membuat versi
  all-intra 30 fps untuk Remotion.
- Font: Playfair Display, Oswald, Caveat (Google Fonts, OFL), Inter (sistem) untuk caption.
- Musik dan SFX: disintesis sendiri (`rempah_audio.py`), tanpa sampel.
