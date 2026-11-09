# Menteri Jenius — Ir. Sutami (TikTok 9:16, 67 dtk)

Hasil akhir: `sutami_final.mp4` (1080x1920, 30 fps, H.264 + AAC, -14 LUFS).

Bahan dari Google Drive `@Mentri` (Menteri.zip): naskah, voice-over ElevenLabs (Must4, 65,2 dtk), 10 gambar,
dan contoh editing (tidak dimasukkan ke repo). Gaya mengikuti contoh: dinding kertas abu-abu, potongan tokoh
hitam-putih dengan lingkaran gelap, kartu foto 3D yang jatuh dengan kilat kamera, judul nama yang diketik,
transisi glitch, dan angka besar menyala di adegan gelap.

## Struktur

- `studio/` — proyek Remotion. `src/Sutami.tsx` berisi daftar potongan (frame) yang disinkronkan ke awal kata
  di voice-over; `src/Scenes1.tsx` dan `src/Scenes2.tsx` berisi tiap adegan; `src/lib.tsx` berisi efek
  (Ken Burns, kartu foto, teks ketik, glitch, light leak, grain, vignette).
- `audio/mix.py` — mixing: voice-over tidak diubah, musik di-*duck* di bawah narasi, SFX diletakkan di event visual.
  `audio/cues.md` adalah cue sheet SFX.
- `fetch_assets.sh` — mengunduh klip & SFX Mixkit (tidak disimpan di repo karena lisensinya melarang distribusi ulang file).

## Membuat ulang

```bash
bash fetch_assets.sh
```

```bash
cd audio && python3 mix.py
```

```bash
cd studio && npm i && npx remotion render src/index.ts Sutami out/video_noaudio.mp4 --muted --crf=17
```

```bash
ffmpeg -i studio/out/video_noaudio.mp4 -i audio/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart sutami_final.mp4
```

## Teks di layar (sengaja sedikit)

PROYEK RAKSASA · TAGIHAN LISTRIK + stempel DIPUTUS · Ir. Sutami / Menteri legendaris · SOEKARNO / SOEHARTO ·
JENIUS · rumus di kertas · TANPA KALKULATOR · JEMBATAN SEMANGGI / STADION GELORA BUNG KARNO / GEDUNG DPR ·
Restoran Mewah (dicoret) · 1980 · JABATAN BISA BERAKHIR — KEJUJURAN AKAN TERUS DIKENANG.
Adegan baju dijahit, rumah bocor, sakit, dan foto arsip sengaja tanpa teks.

## Sumber B-roll dan lisensi

Foto (Wikimedia Commons):
- Sutami, Men PU-TL, Anggota Kabinet Pembangunan II — domain publik
- Semanggi Interchange, *Gedung MPR DPR RI – Sejarah dan Perkembangannya* hlm. 93 — domain publik
- Indonesie, bijeenkomst in Bung Karno Stadion Djakarta, president Soekarno spreekt (Nationaal Archief 924-8281) — CC0
- MPRDPRBuilding.jpg — domain publik
- Presiden Sukarno.jpg — domain publik
- Suharto 1978.jpg — domain publik
- Slide rule J Klawun Hannover in box.jpg — CC0

Video (Mixkit, Mixkit License): pensil di cetak biru (34274), pekerja beton (14729), jarum jahit (32433),
tetesan air di genangan (2208), monitor jantung (49226), lilin (48919), beras jatuh (46354).

Audio:
- Musik: dibuat dengan ElevenLabs Music (instrumental, 66 dtk), 2 bar diulang agar akhir musik jatuh di akhir video.
- SFX listrik padam, kain robek, tetesan air, monitor jantung: dibuat dengan ElevenLabs Sound Effects (`audio/sfx/`).
- SFX lain (whoosh, impact, glitch, mesin tik, shutter, kertas, pensil, hujan, proyektor): Mixkit, Mixkit License.

Font: Montserrat, Special Elite, Playfair Display (SIL Open Font License), disajikan lokal di `studio/public/fonts`.

## Catatan

- Gambar `ai_makam.jpg` (nisan) memuat tahun "1911 – 1980"; Sutami lahir 1928, jadi di video gambar itu
  dipotong hanya bagian wajah sehingga tulisan nisan tidak terlihat.
- Durasi 67 dtk: narasi selesai di 64,9 dtk, sisanya kalimat penutup tetap di layar lalu memudar ke hitam.
