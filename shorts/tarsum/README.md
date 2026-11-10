# Tragedi Ciamis: Kasus Tarsum

A 68.37 s vertical short (2160x3840, 30 fps, 2051 frames). Every frame is drawn in code on
canvas (`@napi-rs/canvas`): one continuous camera move over a dark case board with red pins,
red string, name strips, date tags and a flashlight sequence. No cuts, no AI video, no stock
footage. Every sound effect is synthesized in `src/sound.py`.

The renderer reuses the engine from `../senyum-suharto/src/render_board.mjs` (camera, motion
blur, depth of field, glow, grain, encoder) with a new world for this case.

## Images

- **Real:** `real_tarsum_still.jpg` (frame at 3.0 s of the supplied phone video), `real_kandang.jpg` (news photo of the goat pen).
- **AI illustrations** (C2PA metadata says ChatGPT): basin, RT head, frightened villagers, arrest, RSJ, house of mourning.
  Every one is printed with a readable **ILUSTRASI AI** label so viewers don't take it for a real photo.
- Not used: the AI-made "Polres Ciamis" letter, because it imitates an official document of a real institution.
  The same fact is shown as a plain case folder with a DIHENTIKAN stamp. Nothing graphic is shown anywhere.

## Rebuild

```bash
npm ci
python3 -I src/prep.py      # graded prints, cork, paper, grain -> assets/gen
python3 -I src/sound.py     # sound effects + voiceover mix -> out/mix.wav, cues.md
./render_all.sh             # 4K frames in parallel chunks -> out/video_silent.mp4
ffmpeg -i out/video_silent.mp4 -i out/mix.wav -map 0:v -map 1:a -c:v libx264 -preset slow -b:v 42M -maxrate 55M -bufsize 84M \
  -pix_fmt yuv420p -profile:v high -level 5.2 -c:a aac -b:a 256k -ar 48000 -movflags +faststart out/tragedi_ciamis_tarsum_4k.mp4
```

Review tools: `node src/render.mjs --scale 0.25 --stills 3.9,19.9 --outdir out/stills`,
`--seq 13.6:15.2:4` for a frame sequence, `--camlog out/camlog.csv` + `python3 -I src/camplot.py` for the camera speed profile.

## Beats (times from word-level alignment of `voice/vo.mp3`)

| # | Time (s) | Narration | Hero | Moment on the word |
|---|---|---|---|---|
| 1 | 0.00 | Terlilit utang … seorang pria di Ciamis … | Map of Java, pin on Ciamis | strip CIAMIS typed (3.52) |
| 2 | 7.16 | Pada 3 Mei 2024, Tarsum membunuh istrinya sendiri, Yanti … | Real photo of Tarsum, then Yanti's name card | tag 3 MEI 2024 (7.68), strip TARSUM (9.36), card + strip YANTI (11.3 / 11.56) |
| 3 | 14.0 | Tak berhenti di situ … menggunakan baskom. | Lights out; flashlight follows the string to the basin illustration | print pinned on "membawa" (17.7), basin circled on "baskom" (19.84) |
| 4 | 20.82 | … berkeliling kampung … kepada warga. | Hand-drawn village map | red route drawn (22.66–25.9), houses pinned on "warga" (25.86–26.22) |
| 5 | 26.74 | Ketua RT setempat, Yoyo Tarya … | RT head illustration | strips KETUA RT (26.74) and YOYO TARYA (28.22) |
| 6 | 33.32 | Warga yang ketakutan … diamankan petugas. | Villagers illustration, then arrest illustration | pinned on "ketakutan" (33.7) and "diamankan" (36.76) |
| 7 | 38.22 | … usaha jual beli kambing miliknya bangkrut … | Real photo of the goat pen | stamp BANGKRUT (41.56) |
| 8 | 44.1 | … pemeriksaan kejiwaan … gangguan jiwa. | RSJ illustration, then the exam document | pinned (44.84); "gangguan jiwa" typed and circled (47.84–49.0) |
| 9 | 49.04 | Pada September 2024 … dihentikan … rehabilitasi. | Case folder | tag SEPTEMBER 2024 (49.74), stamp DIHENTIKAN (52.9) |
| 10 | 56.76 | Tragedi ini meninggalkan satu keluarga kehilangan seorang ibu, | Yanti's card + house of mourning illustration | long move up the board; house pinned on "keluarga" (58.78) |
| 11 | 60.74 | dan masyarakat dengan pertanyaan … berujung kekerasan. | Question card over the board | "?" on "pertanyaan" (62.04), lights out on "kekerasan" (67.55) |

Sound cues: see `cues.md`.
