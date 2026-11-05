# Acting — Indonesia Emas

Satu blok per shot. Semua nomor frame adalah frame global (30 fps), sama dengan `shotlist.md`, dan diambil dari waktu kata di `captions/voice.json`.

**Aturan yang berlaku di semua shot:**
- **Tanpa idle bounce.** Badan diam kecuali ada alasan. Setiap gerakan dimulai dari lirikan mata (pupil bergerak 2–4 frame lebih dulu), lalu kepala, lalu badan.
- **Gerak mulut ikut narasi hanya di shot 24 dan 28,** karena hanya di dua shot itu HERO bicara langsung ke kamera. Mulut membuka (SENANG/lebar) di awal kata yang ditekankan dan menutup (0) di jeda ≥ 6 frame. Di shot lain, mulut tetap di ekspresi shot itu.
- **Kedip:** 4 frame (tutup 2, buka 2), setiap 2–4 detik. Tidak pernah dalam 10 frame sebelum atau sesudah aksi utama.
- **Easing (motion-design):**
  - Aksi besar: ease-out cepat (sekitar 70% gerak di sepertiga awal).
  - Antisipasi: ease-in.
  - Tahan: tetap ada sedikit gerak (drift 1–2°) supaya tidak terlihat beku.
  - Kamera tidak ikut "bounce".
- **Jalan:** walk cycle santai 12 frame per langkah. Kontak tumit di frame 0 dan 12, badan naik-turun 1,5 cm, lengan berayun berlawanan.

---

## Kamar

```
SHOT 01 (1,93 dtk)  frame 0–57  "Bagaimana kalau besok pagi,"
  pikiran:     — (HERO belum tampil; peta emas "bermimpi")
  antisipasi:  kilau peta redup di frame 0–20
  aksi:        kilau menyapu dari Sumatra ke Papua, frame 20–50
  tahan:       kilau berhenti di Jawa, frame 50–57
```

```
SHOT 02 (2,40 dtk)  frame 58–129  "Indonesia tiba-tiba menjadi negara emas?"
  pikiran:     tidur nyenyak, tidak tahu apa-apa
  antisipasi:  napas tidur pelan (dada naik-turun 1 cm, siklus 60 frame); kelopak bergetar sekali di 96
  aksi:        peta berkilau kuat di "emas" (104); HERO sedikit mengernyit (alis turun 2 mm) di 106
  tahan:       kembali tenang 112–129
  ekspresi:    TIDUR sepanjang shot
```

```
SHOT 03 (2,53 dtk)  frame 130–205  "Baru bangun tidur, kamu langsung kaget."
  pikiran:     masih ngantuk, lalu sadar ada yang aneh
  antisipasi:  kelopak bergetar 4 frame (135–138) sebelum terbuka
  aksi:        mata terbuka setengah di "bangun" (139), melirik ke jendela (150), lalu
               mata terbuka lebar dan badan duduk tegak di "kaget" (182; naik dalam 6 frame, ease-out)
  tahan:       KAGET ditahan 10 frame (188–198), lalu kepala menoleh pelan ke arah TV (198–205)
  ekspresi:    TIDUR → SENYUM ngantuk (139) → KAGET (182)
  kedip:       tidak ada (momen penting)
```

```
SHOT 04 (1,97 dtk)  frame 206–264  "Berita di televisi mengumumkan Indonesia"
  pikiran:     — (insert layar TV)
  antisipasi:  layar TV menyala dari hitam, 206–209
  aksi:        grafik peta emas berputar masuk di "mengumumkan" (234)
  tahan:       peta berputar pelan sampai 264
```

```
SHOT 05 (1,70 dtk)  frame 265–315  "resmi menjadi salah satu negara"
  pikiran:     tidak percaya, mencoba mencerna
  antisipasi:  kepala condong maju 3° (265–272)
  aksi:        badan mendekat ke TV 4 cm di "resmi" (265–280, ease-out)
  tahan:       diam menatap TV 280–315; satu kedip di 298
  ekspresi:    KAGET
```

```
SHOT 06 (1,67 dtk)  frame 316–365  "paling maju di dunia!"
  pikiran:     "seriusan?!"
  antisipasi:  pupil mengecil sedikit dan melirik ke kamera/TV (318–322)
  aksi:        mata makin lebar (skala 1,16 → 1,25) dan alis naik penuh di "maju" (327),
               bersamaan dengan push-in kamera
  tahan:       10 frame (333–343), lalu ujung bibir mulai tersenyum (SENYUM) di "dunia" (345)
  ekspresi:    KAGET → SENYUM (345)
```

## Kota

```
SHOT 07 (2,27 dtk)  frame 366–433  "Kamu keluar rumah. Jalanan bersih,"
  pikiran:     penasaran, ingin melihat sendiri
  antisipasi:  pintu terbuka (366–378); HERO melirik keluar dulu (368)
  aksi:        melangkah keluar (walk cycle 12 f/langkah, 378–433), kepala menoleh ke kiri
               mengikuti reveal jalan di "Jalanan" (401)
  tahan:       — (terus berjalan)
  ekspresi:    SENYUM → SENANG di "bersih" (413)
```

```
SHOT 08 (1,60 dtk)  frame 434–481  "transportasi umum canggih,"
  pikiran:     kagum
  antisipasi:  mata melirik ke atas (434–437)
  aksi:        kepala mendongak mengikuti kereta lewat (puncak 458)
  tahan:       menatap kereta yang menjauh (465–481)
  ekspresi:    SENANG
```

```
SHOT 09 (1,67 dtk)  frame 482–531  "dan hampir nggak ada kemacetan."
  pikiran:     santai, semuanya lancar
  antisipasi:  —
  aksi:        menyeberang di zebra cross (walk cycle) sementara mobil mengalir lancar
  tahan:       —
  ekspresi:    SENANG (terlihat kecil dari atas)
```

```
SHOT 10 (2,20 dtk)  frame 532–597  "Pas buka HP, kamu makin heran."
  pikiran:     ingin memastikan lewat HP
  antisipasi:  melirik ke saku (532–535)
  aksi:        mengangkat HP ke depan wajah di "buka" (537–545, ease-out); layar menyala;
               mata melebar di "heran" (578)
  tahan:       KAGET ditahan 12 frame (580–592)
  ekspresi:    SENYUM → KAGET (578)
  kedip:       satu kedip di 556
```

```
SHOT 11 (2,30 dtk)  frame 598–666  "Lapangan kerja melimpah, gaji layak,"
  pikiran:     — (insert layar HP)
  aksi:        ibu jari menggeser layar di 598 dan 641; ikon tas kerja lalu ikon dompet muncul pop-in
               kecil (6 frame, ease-out)
  tahan:       ikon diam 3–4 frame sebelum geseran berikutnya
```

```
SHOT 12 (1,90 dtk)  frame 667–723  "dan harga kebutuhan pokok stabil."
  pikiran:     lega, senang
  antisipasi:  melirik dari HP ke kamera (667–670)
  aksi:        HP turun ke dada (670–680), senyum melebar di "stabil" (699)
  tahan:       703–723, satu kedip di 714
  ekspresi:    SENYUM → SENANG (699)
```

## Sekolah dan Rumah sakit

```
SHOT 13 (2,33 dtk)  frame 724–793  "Sekolah berkualitas bisa diakses semua anak,"
  pikiran:     bangga melihat anak-anak belajar
  aksi:        HERO bersandar di pintu kelas, menoleh ke anak-anak (730);
               anak-anak menoleh ke layar pintar satu per satu (selisih 4 frame, mulai 752);
               satu anak mengangkat tangan di "semua" (773)
  tahan:       —
  ekspresi:    HERO SENYUM; anak-anak SENANG
```

```
SHOT 14 (2,27 dtk)  frame 794–861  "sementara rumah sakit punya fasilitas modern"
  pikiran:     santai, nyaman
  aksi:        HERO berjalan menyusuri lorong (walk cycle); perawat lewat berlawanan arah dan
               saling mengangguk di 820; pintu otomatis terbuka di 836
  tahan:       —
  ekspresi:    SENYUM
```

```
SHOT 15 (2,10 dtk)  frame 862–924  "tanpa bikin pasien takut biaya."
  pikiran:     ikut lega bersama kakek
  antisipasi:  kakek menghela napas (bahu naik, 862–875)
  aksi:        bahu kakek turun lega di "takut" (896); HERO menoleh ke kakek dan tersenyum (898)
  tahan:       keduanya tersenyum, 905–924
  ekspresi:    kakek KAGET kecil → SENYUM (896); HERO SENYUM
```

## Desa

```
SHOT 16 (1,93 dtk)  frame 925–982  "Bahkan desa-desa terpencil sudah punya"
  pikiran:     takjub melihat luasnya
  aksi:        HERO kecil di pematang, perlahan memutar badan menghadap lembah (925–960)
  tahan:       —
  ekspresi:    SENANG (kecil di layar)
```

```
SHOT 17 (2,60 dtk)  frame 983–1060  "internet cepat dan akses listrik yang andal."
  pikiran:     "wah, nyala semua!"
  antisipasi:  melirik ke menara (983)
  aksi:        lampu menara berkedip; HERO menoleh ke rumah saat lampu menyala (1022, 1030, 1038),
               kepala bergerak kecil di setiap lampu
  tahan:       1040–1060
  ekspresi:    SENANG
```

## Kota: "Tapi tunggu dulu..."

```
SHOT 18 (2,20 dtk)  frame 1061–1126  "Tapi tunggu dulu..."
  pikiran:     ada yang janggal
  antisipasi:  langkah melambat (1061–1068)
  aksi:        berhenti total di "tunggu" (1071); mata melirik ke atas di "dulu" (1088)
  tahan:       diam total 1096–1126 (kamera statis, musik berhenti); hanya pupil yang bergerak
  ekspresi:    SENYUM → MIKIR (1088)
  kedip:       tidak ada
```

```
SHOT 19 (2,03 dtk)  frame 1127–1187  "Apakah semua orang langsung kaya?"
  pikiran:     menimbang-nimbang
  antisipasi:  pupil melirik ke kanan atas (1127–1130)
  aksi:        tangan naik ke dagu (IK) dalam 10 frame (1130–1140, ease-out); alis miring
  tahan:       1140–1187, kepala miring pelan 3° di "kaya" (1166)
  ekspresi:    MIKIR
```

```
SHOT 20 (1,00 dtk)  frame 1188–1217  "Tentu nggak!"
  pikiran:     "ya jelas nggak dong"
  antisipasi:  tangan turun dari dagu dan kepala sedikit menunduk (1188–1198)
  aksi:        geleng cepat 3 kali dalam 12 frame (1199–1210; ±18°, ease-out tiap ayunan)
  tahan:       1210–1217
  ekspresi:    MIKIR → TERTAWA (1199)
```

```
SHOT 21 (1,43 dtk)  frame 1218–1260  "Negara maju bukan berarti"
  pikiran:     menjelaskan sambil jalan
  aksi:        berjalan ke arah kamera (walk cycle); tangan kanan terbuka ke samping di "bukan" (1240)
  ekspresi:    SENYUM
```

```
SHOT 22 (1,83 dtk)  frame 1261–1315  "semua warganya jadi miliarder,"
  pikiran:     — (warga)
  aksi:        petani membetulkan caping; guru membuka buku; pengemudi menyalakan motor (selisih 6 frame)
  ekspresi:    warga SENYUM
```

```
SHOT 23 (2,60 dtk)  frame 1316–1393  "melainkan punya kesempatan hidup yang lebih baik."
  pikiran:     hangat, optimis
  aksi:        bus berhenti (1340); guru mengangguk ke HERO; anak naik bus (1350–1380)
  tahan:       HERO tersenyum ke arah bus, 1380–1393
  ekspresi:    SENYUM
```

```
SHOT 24 (2,53 dtk)  frame 1394–1469  "Dan ternyata, Indonesia Emas bukan cuma soal"   [BICARA KE KAMERA]
  pikiran:     mau memberi tahu sesuatu yang penting
  antisipasi:  melirik ke kamera (1394–1397)
  aksi:        kepala menoleh ke kamera di "ternyata" (1399), tangan kanan menunjuk ke atas di "soal" (1463)
  mulut:       buka di "ternyata" (1399), "Emas" (1433), "bukan" (1444); tutup di jeda 1414–1424
  ekspresi:    SENYUM (dasar), mulut ikut bicara
```

```
SHOT 25 (2,07 dtk)  frame 1470–1531  "gedung tinggi atau teknologi canggih."
  pikiran:     — (kamera naik menyusuri gedung)
```

```
SHOT 26 (2,03 dtk)  frame 1532–1592  "Tapi tentang rakyat yang benar-benar"
  pikiran:     ini yang sebenarnya penting
  aksi:        warga di beranda melambai satu per satu (selisih 5 frame, mulai 1549); HERO ikut melambai
  ekspresi:    SENYUM
```

```
SHOT 27 (1,53 dtk)  frame 1593–1638  "merasakan kemajuannya."
  pikiran:     bahagia
  aksi:        anak-anak berlari di pematang (siklus lari 8 frame); HERO tertawa, badan sedikit
               mundur di "kemajuannya" (1608)
  ekspresi:    TERTAWA
```

## Kamar: penutup

```
SHOT 28 (3,87 dtk)  frame 1639–1754  "Pertanyaannya, kapan Indonesia bisa seperti itu?"   [BICARA KE KAMERA]
  pikiran:     bertanya sungguh-sungguh ke penonton
  antisipasi:  melirik ke peta di belakang (1639–1645), lalu ke kamera (1652–1656)
  aksi:        menoleh ke kamera di "kapan" (1658); tangan naik ke dagu (1690–1700)
  mulut:       buka di "Pertanyaannya" (1639), "kapan" (1658), "Indonesia" (1678), "itu" (1706);
               tutup di 1717
  tahan:       MIKIR ditahan sampai akhir (1717–1754); pupil bergeser pelan dari kamera ke atas
  ekspresi:    SENYUM → MIKIR (1690)
  kedip:       satu kedip di 1730
```
