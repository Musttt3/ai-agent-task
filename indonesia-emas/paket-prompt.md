# Paket Prompt Claude Code — Indonesia Emas (2.5D, 9:16)

Dibuat 5 November 2026 · @mustofak004

---

## Cara pakai

Jalankan 7 prompt di bawah ini berurutan di Claude Code, satu per satu. Tunggu hasilnya dan cek dulu sebelum lanjut ke prompt berikutnya. Naskah sekitar 136 kata, jadi durasi videonya sekitar 50–60 detik.

**Satu perubahan dari artikel:** karakter kamu bergaya mainan 3D (clay/vinyl), bukan kartun datar 2D. Karena itu, karakternya dibangun sebagai model 3D sederhana di Blender. Wajahnya tetap memakai sistem tukar ekspresi (mata dan mulut diganti per momen) sesuai sheet ekspresi kamu.

### Persiapan (sekali saja)

1. Install Blender 4.2 atau lebih baru, lalu sambungkan ke Claude Code: `uvx mcp-for-blender setup`
2. Pasang skill: `npx skills add LottieFiles/motion-design-skill` dan `npx skills add remotion-dev/skills`
3. Install Whisper untuk timestamp kata: `pip install -U openai-whisper` (butuh ffmpeg).
4. Pastikan ElevenLabs juga tersambung **di Claude Code**, bukan hanya di aplikasi Claude. Cek dengan perintah `/mcp`. Kalau belum ada, tambahkan MCP server ElevenLabs dengan API key kamu.
5. Buat folder proyek seperti ini:

```text
indonesia-emas/
  CLAUDE.md          (file terpisah yang disertakan)
  ref/karakter.png   (gambar referensi karakter kamu)
  script.md          (dibuat oleh Prompt 1)
```

6. Buka Claude Code di folder itu dengan model Opus 5.5. Pakai effort **xhigh** untuk Prompt 1–5 dan **medium** untuk revisi.

### Urutan kerja

1. Voice over ElevenLabs dan timestamp per kata
2. Shot list dari suara yang sudah jadi
3. Set 3D di Blender
4. Karakter 3D dari referensi
5. Akting dan animasi
6. Caption, musik, SFX, lalu rakit di Remotion
7. Review, revisi, dan cek export

Suara dibuat paling awal supaya semua cut, gerakan mulut, dan caption mengikuti timing suara yang asli, bukan tebakan.

---

## Prompt 1 — Naskah, suara, dan timestamp kata

Hasilnya: `script.md`, `audio/voice.wav`, dan `captions/voice.json` yang berisi waktu setiap kata.

```text
Simpan naskah di bawah ini persis apa adanya sebagai script.md. Jangan ubah satu kata pun.

---
Bagaimana kalau besok pagi, Indonesia tiba-tiba menjadi negara emas?

Baru bangun tidur, kamu langsung kaget. Berita di televisi mengumumkan Indonesia resmi menjadi salah satu negara paling maju di dunia!

Kamu keluar rumah. Jalanan bersih, transportasi umum canggih, dan hampir nggak ada kemacetan.

Pas buka HP, kamu makin heran. Lapangan kerja melimpah, gaji layak, dan harga kebutuhan pokok stabil.

Sekolah berkualitas bisa diakses semua anak, sementara rumah sakit punya fasilitas modern tanpa bikin pasien takut biaya.

Bahkan desa-desa terpencil sudah punya internet cepat dan akses listrik yang andal.

Tapi tunggu dulu...

Apakah semua orang langsung kaya?

Tentu nggak!

Negara maju bukan berarti semua warganya jadi miliarder, melainkan punya kesempatan hidup yang lebih baik.

Dan ternyata, Indonesia Emas bukan cuma soal gedung tinggi atau teknologi canggih.

Tapi tentang rakyat yang benar-benar merasakan kemajuannya.

Pertanyaannya, kapan Indonesia bisa seperti itu?
---

Lalu buat voice over dengan ElevenLabs lewat MCP:
1. Tampilkan 3 pilihan suara narator pria muda yang hangat dan cocok untuk Bahasa Indonesia. Tunggu saya memilih.
2. Pakai model multilingual terbaru. Gaya: bercerita santai seperti ngobrol dengan teman, penuh rasa penasaran, tidak seperti iklan.
3. Beri jeda alami: jeda agak panjang setelah "Tapi tunggu dulu...", lalu "Tentu nggak!" diucapkan tegas dan cepat.
4. Simpan hasilnya sebagai audio/voice.mp3, lalu konversi dengan ffmpeg ke audio/voice.wav (48 kHz, mono).
5. Laporkan durasinya. Targetnya 50-60 detik. Kalau di luar itu, sesuaikan kecepatan bicara dan buat ulang.

Terakhir, ambil timestamp setiap kata:
whisper audio/voice.wav --model small --language Indonesian --word_timestamps True --output_format json --output_dir captions/

Whisper bisa salah dengar. Cocokkan setiap kata di captions/voice.json dengan script.md, perbaiki ejaannya tanpa mengubah waktunya, lalu simpan ulang. Laporkan kata-kata yang kamu perbaiki.
```

---

## Prompt 2 — Shot list

Video ini cukup memakai 5 set dan 1 objek utama (peta Indonesia emas 3D). Tabel di bawah adalah rancangan awal. Edit kalau ada adegan yang mau diganti, lalu tempel ke prompt.

| Baris naskah | Set | Visual | Ekspresi |
| --- | --- | --- | --- |
| Bagaimana kalau besok pagi... negara emas? | Kamar | Peta Indonesia emas berkilau di kegelapan, push-in. Cut ke karakter tidur. | TIDUR |
| Baru bangun tidur, kamu langsung kaget. | Kamar | Mata terbuka, badan duduk tegak di kasur. | KAGET |
| Berita di televisi mengumumkan... | Kamar | Layar TV berita fiktif dengan grafik peta emas. Karakter menatap TV. | KAGET |
| Kamu keluar rumah. | Kota | Pintu terbuka, cahaya pagi masuk, karakter melangkah keluar. | SENYUM |
| Jalanan bersih, transportasi umum canggih... | Kota | 3 shot: trotoar bersih, kereta listrik fiktif lewat, jalan lancar. | SENANG |
| Pas buka HP, kamu makin heran. | Kota | Close-up tangan memegang HP, wajah diterangi layar. | KAGET |
| Lapangan kerja melimpah, gaji layak... | Kota | Layar HP: ikon lowongan, dompet, keranjang belanja. Tanpa angka. | SENANG |
| Sekolah berkualitas bisa diakses semua anak... | Sekolah | Kelas terang, anak-anak bergaya sama, layar pintar. | SENYUM |
| ...rumah sakit punya fasilitas modern... | Rumah sakit | Lorong bersih dan modern, pasien tersenyum lega. | SENYUM |
| Bahkan desa-desa terpencil... | Desa | Sawah, rumah panggung, menara internet. Lampu rumah menyala saat senja. | SENANG |
| Tapi tunggu dulu... | Kota | Musik berhenti, karakter diam di tengah jalan, kamera statis. | MIKIR |
| Apakah semua orang langsung kaya? | Kota | Close-up tangan di dagu. | MIKIR |
| Tentu nggak! | Kota | Karakter menggeleng cepat. | TERTAWA |
| Negara maju bukan berarti... miliarder... | Kota | Warga beragam profesi (petani, guru, pengemudi) beraktivitas biasa. | SENYUM |
| Indonesia Emas bukan cuma soal gedung tinggi... | Kota | Kamera naik pelan menyusuri gedung tinggi. | SENYUM |
| Tapi tentang rakyat yang benar-benar merasakan... | Desa | Warga desa tersenyum, anak-anak berlarian di pematang sawah. | TERTAWA |
| Pertanyaannya, kapan Indonesia bisa seperti itu? | Kamar | Kembali ke peta emas, karakter menatap kamera, push-in pelan. | MIKIR |

```text
Baca script.md, captions/voice.json, dan CLAUDE.md.
Buat shotlist.md berdasarkan peta adegan di bawah. Satu shot per ide, 1,5-3 detik per shot.
Waktu setiap shot WAJIB mengikuti waktu kata di captions/voice.json: cut tepat di awal kata pertama shot itu.

Untuk setiap shot tulis:
  id, kata yang dicakup, frame awal-akhir (30 fps), durasi
  SET        set mana dan posisi di dalamnya
  KAMERA     framing + gerakan (push-in / dolly / statis) beserta alasannya
  KARAKTER   pose dan ekspresi (SENANG / SENYUM / TERTAWA / KAGET / MIKIR / TIDUR)
  PROP       objek utama kalau ada (harus dibangun 3D)
  SUARA      SFX hanya kalau ada kejadian fisik

Pakai ulang set. Total hanya 5 set: Kamar, Kota, Sekolah, Rumah sakit, Desa.
Objek utama: peta kepulauan Indonesia 3D berbahan emas, muncul di shot pertama dan terakhir.

Peta adegan:
[tempel tabel di atas di sini]

Di akhir, tulis daftar momen kunci dalam nomor frame (cut, gerakan besar, SFX) supaya revisi bisa ditulis dengan angka.
```

---

## Prompt 3 — Set 3D di Blender

Jalankan prompt ini sekali per set (ganti bagian [nama set] dan tempel deskripsinya). Mulai dari Kamar karena set ini muncul di awal dan akhir.

```text
Kamu sedang membangun SET [nama set] untuk short vertikal 9:16, di Blender lewat MCP.
Ikuti CLAUDE.md dan shotlist.md. Simpan di sets/[nama-set].blend.
Deskripsi set: [tempel dari tabel di bawah]

Tahap 1, BLOK: bentuk abu-abu untuk dinding, lantai, dan furnitur utama.
Pasang semua kamera untuk shot yang memakai set ini sesuai shotlist.md.
Gunakan look di setiap kamera dan kirim satu sheet. Berhenti, tunggu OK saya.

Tahap 2, CAHAYA: satu sumber cahaya utama yang masuk akal, cahaya hangat pendukung,
HDRI dari Poly Haven untuk isian. Jangan pakai lampu studio 3 titik.
Kirim still dari 3 kamera. Berhenti, tunggu OK saya.

Tahap 3, DEKORASI: material dengan tekstur dan variasi, properti kecil, nuansa Indonesia.
Depth of field di setiap kamera, fokus di titik tempat karakter berdiri.
Tandai titik berdiri karakter dengan empty bernama MARK_[id shot].

Pakai Eevee untuk preview. Ukuran render 1080x1920. Jangan render lebih besar lalu di-crop.
```

| Set | Deskripsi untuk prompt |
| --- | --- |
| Kamar | Kamar tidur sederhana khas Indonesia, pagi hari. Kasur dengan sprei motif batik halus, jendela kayu dengan cahaya matahari miring masuk (cahaya utama), kipas angin, TV di meja, pintu kayu. Peta Indonesia emas dipajang di dinding. |
| Kota | Jalan kota Indonesia masa depan yang cerah. Trotoar lebar dan bersih, pohon trembesi, gedung tinggi modern dengan sentuhan ornamen tradisional, halte, jalur kereta listrik layang fiktif. Lalu lintas sepi dan lancar. Cahaya matahari pagi dari samping. |
| Sekolah | Ruang kelas terang dengan meja kayu, layar pintar di depan, rak buku, jendela besar dengan pemandangan pohon. Cahaya dari jendela. |
| Rumah sakit | Lorong rumah sakit modern yang bersih dan hangat, bukan dingin. Tanaman, kursi tunggu nyaman, cahaya alami dari skylight. |
| Desa | Desa di perbukitan saat senja: sawah bertingkat, rumah panggung, tiang listrik, menara internet ramping di bukit. Lampu-lampu rumah hangat menyala. Matahari terbenam sebagai cahaya utama. |

**Objek utama (sekali saja):**

```text
Bangun objek utama: peta kepulauan Indonesia 3D berbahan emas.
Bentuk pulau-pulau utama dikenali dengan jelas, dengan ketebalan seperti plakat.
Semua sisi di-bevel. Material emas dengan sedikit goresan dan kotoran di celah.
Render look sheet 6 sudut di lantai netral. Lalu pasang di dinding set Kamar.
```

---

## Prompt 4 — Karakter 3D dari referensi

Bagian paling susah adalah rambut ikalnya. Cek look sheet dengan teliti sebelum lanjut, karena karakter ini akan dipakai di semua video berikutnya.

```text
Buka ref/karakter.png dan pelajari: ada 4 tampak (depan, 3/4, samping, belakang) dan 4 ekspresi wajah.
Bangun karakter ini di Blender lewat MCP sebagai characters/hero.blend. Ikuti deskripsi karakter di CLAUDE.md.

Tahap 1, BENTUK DASAR (berhenti setelah ini dan kirim look sheet 4 tampak di samping gambar referensi):
- Proporsi seperti mainan: kepala sangat besar dan bulat, badan hoodie membulat,
  kaki panjang ramping, lengan kurus seperti stik, tangan berupa bola, sepatu sneaker putih.
- Rambut: gumpalan ikal bervolume dari banyak kurva/tabung melengkung yang menumpuk.
  Kalau terlalu berat, pakai metaball yang dibentuk lalu dikonversi ke mesh.
  Rambut harus terlihat sama dari depan, samping, dan belakang seperti di referensi.
- Hoodie: tudung di belakang leher, lengan pendek, saku kanguru, logo garis putih kecil di dada.

Tahap 2, MATERIAL: matte lembut seperti clay/vinyl, sedikit subsurface di kulit.
Warna diambil dari referensi. Tanpa tekstur kasar.

Tahap 3, WAJAH YANG BISA DITUKAR:
- Mata: bola putih 3D dengan pupil hitam dan titik kilau, bisa melirik (rotasi).
  Kelopak mata untuk kedip dan TIDUR. Versi melengkung untuk TERTAWA.
- Alis: mesh kecil melengkung yang bisa naik/turun/miring.
- Mulut: decal di permukaan kepala, ditukar per ekspresi lewat satu properti angka
  (0 tertutup, 1 senyum, 2 lebar terbuka, 3 bulat "O", 4 miring).
- Buat preset ekspresi: SENANG, SENYUM, TERTAWA, KAGET, MIKIR, TIDUR.
  Kirim sheet 6 ekspresi di samping sheet ekspresi referensi.

Tahap 4, RIG: armature sederhana (badan, kepala, lengan, kaki) dengan kontrol tangan ke dagu untuk pose MIKIR.
Uji 3 pose: berdiri, duduk di kasur, tangan di dagu. Kirim look sheet.

Setiap tahap: bandingkan hasil dengan referensi dan sebutkan bagian yang masih berbeda sebelum saya lihat.
```

Untuk karakter pendukung (anak sekolah, petani, guru, pasien), minta Claude membuat varian dari rig yang sama dengan rambut, baju, dan warna berbeda, supaya gaya semua karakter konsisten.

---

## Prompt 5 — Akting dan animasi

```text
Baca shotlist.md, captions/voice.json, dan CLAUDE.md.
Langkah 1: tulis acting.md, satu blok per shot, dengan format:

SHOT 02 (1,8 dtk)  "Baru bangun tidur, kamu langsung kaget."
  pikiran:     masih ngantuk, lalu sadar ada yang aneh
  antisipasi:  kelopak mata bergetar 4 frame sebelum terbuka
  aksi:        mata terbuka lebar + badan tegak di kata "kaget"
  tahan:       diam 10 frame di ekspresi KAGET supaya terbaca

Aturan:
- Tanpa idle bounce. Setiap gerakan dimulai dari lirikan mata.
- Mulut bergerak mengikuti narasi hanya di shot karakter berbicara ke kamera:
  buka di awal kata yang ditekankan (dari captions/voice.json), tutup di jeda.
- Kedip alami tiap 2-4 detik, jangan saat momen penting.
- Jalan (shot "Kamu keluar rumah"): walk cycle santai 12 frame per langkah.
- "Tentu nggak!": geleng cepat 3 kali dalam 12 frame dengan ease-out.
- Pakai prinsip timing dan easing dari motion-design-skill.
Berhenti dan tunggu OK saya untuk acting.md.

Langkah 2: animasikan setiap shot di Blender sesuai acting.md.
Link karakter dari characters/hero.blend ke setiap set, letakkan di MARK_[id shot].
Gabungkan semua shot di scenes/episode.blend dengan frame global yang sama seperti shotlist.md.
Untuk setiap shot, render 4 still (awal, antisipasi, aksi, tahan) dan kirim sebagai satu sheet.
```

---

## Prompt 6 — Caption, musik, SFX, dan perakitan

```text
Langkah 1, RENDER: render scenes/episode.blend per shot sebagai PNG sequence 1080x1920, 30 fps,
ke render/shot_[id]/. Pakai Eevee. Laporkan kalau ada frame yang hilang.

Langkah 2, SFX: buat daftar cue di cues.md dengan nomor frame yang sama dengan shotlist.md.
Buat SFX lewat ElevenLabs (sound effects) hanya untuk kejadian fisik, misalnya:
- alarm/kicauan burung pagi saat bangun
- denting TV menyala
- pintu terbuka
- kereta listrik lewat
- notifikasi HP
- jangkrik dan angin di desa
Tidak ada whoosh lebih dari 2 kali di seluruh video.
Cari puncak gelombang setiap SFX dan geser klipnya supaya puncak itu jatuh tepat di frame kejadian.

Langkah 3, MUSIK: musik latar optimis yang ringan dan bebas royalti.
Musik berhenti total selama 20 frame di "Tapi tunggu dulu...", lalu masuk lagi lebih pelan.
Musik selesai (resolve) tepat di frame terakhir.

Langkah 4, CAPTION di Remotion dari captions/voice.json:
- 1-2 kata di layar, ganti tepat di waktu awal setiap kata
- font tebal (Montserrat ExtraBold), putih dengan outline gelap tebal
- tengah agak ke bawah, di dalam area aman Shorts (di atas 15% bawah layar)
- kata penting ("emas", "kaget", "kaya", "nggak") berwarna kuning keemasan dengan pop-in kecil
  hanya kata-kata itu, kata lain tanpa animasi

Langkah 5, MIX dan RAKIT di Remotion: gabungkan render/, audio/voice.wav, SFX, musik, dan caption.
Suara narasi selalu paling atas, musik di bawahnya (sekitar -18 dB saat narasi).
Export ke out/episode.mp4 (H.264, 1080x1920, 30 fps).

Langkah 6, DENGARKAN dengan earshot (kalau terpasang) dan cek terhadap cues.md.
```

---

## Prompt 7 — Review, revisi, dan cek export

```text
Buat 2 lembar review dari out/episode.mp4:
ffmpeg -i out/episode.mp4 -vf "fps=1,scale=240:-1,tile=8x8" -frames:v 1 review/contact.png
ffmpeg -i out/episode.mp4 -vf "fps=1/3,scale=360:-1,tile=6x4" -frames:v 1 review/phone.png

Buka keduanya. Kamu bukan pembuatnya. Kamu sutradara animasi paling galak yang saya kenal.
Cek:
- Apakah karakter sama persis dengan ref/karakter.png di setiap shot?
- Apakah karakter selalu menapak lantai (ada bayangan kontak)?
- Ada shot lebih dari 3 detik tanpa ide baru?
- Apakah caption terbaca di ukuran layar HP?
- Ada logo/merek asli atau angka yang tidak ada di naskah?
- Apakah cut jatuh tepat di kata yang benar?
Tulis setiap masalah dengan timestamp. Perbaiki 3 yang terburuk.
Render ulang hanya detik yang diperbaiki, lalu kirim lembar baru.
```

**Template revisi** (pakai setiap kali minta perbaikan, supaya Claude tidak mengubah hal lain):

```text
Revisi SHOT [id] sesuai shotlist.md.
DI MANA    frame global [awal]-[akhir]
MASALAH    [apa yang salah, dengan nomor frame]
UBAH       [hanya bagian ini]
TETAP      [kamera, cut, caption, dan semua shot lain]

Render still di frame-frame penting dan preview dari [awal]-[akhir].
Cek frame di antaranya untuk lompatan. Laporkan apa yang berubah dan file hasilnya.
```

Urutan perbaikan: yang salah atau hilang dulu, lalu keterbacaan, lalu timing, terakhir detail visual.

**Cek export sebelum upload:**

```text
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,avg_frame_rate,duration -of json out/episode.mp4
```

Hasilnya harus 1080 x 1920, frame rate 30/1, dan durasi sesuai rencana. Tonton sekali di HP dengan suara menyala, lalu sekali lagi sambil memejamkan mata untuk mengecek audionya.

Kalau episode pertama sudah berhasil, minta Claude menyimpan alur ini sebagai skill di `~/.claude/skills/studio-shorts/SKILL.md`, supaya episode berikutnya cukup dimulai dengan naskah baru.
