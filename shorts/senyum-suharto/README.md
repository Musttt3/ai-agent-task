# Senyum Suharto

A 63.33 s vertical short (2160x3840, 30 fps). Everything is drawn in code on an HTML-style
canvas (`@napi-rs/canvas`): one continuous camera move over an archive desk. There are no
cuts, no AI video and no stock footage. Every sound effect is synthesized in `src/sound.py`.

## Rebuild

```bash
npm install
pip install numpy scipy pillow fonttools brotli faster-whisper soundfile matplotlib
python3 -I src/prep.py          # graded prints + desk/paper/grain textures -> assets/gen
python3 -I src/sound.py         # sound effects + voiceover mix -> out/mix.wav, cues.md
./render_all.sh                 # 4K frames in parallel chunks -> out/video_silent.mp4
ffmpeg -i out/video_silent.mp4 -i out/mix.wav -c:v copy -c:a aac -b:a 256k -shortest senyum_suharto.mp4
```

Review tools:

- `node src/render.mjs --scale 0.25 --stills 0.5,3.6 --outdir out/stills`: stills at chosen times
- `node src/render.mjs --scale 0.2 --seq 58:61.5:4 --outdir out/seq`: frame sequence of a move
- `node src/render.mjs --scale 0.1 --camlog out/camlog.csv && python3 -I src/camplot.py out/camlog.csv out/camplot.png`: camera speed profile (checks for dead stops and jerks)

## Beats (times are from word-level alignment of `voice/vo.mp3`)

| # | Time (s) | Narration | Hero | Moment on the word |
|---|---|---|---|---|
| 1 | 0.00 | Suharto tersenyum. | Smiling portrait, tag SUHARTO | red circle round the smile (0.60–1.30) |
| 2 | 1.74 | Tapi, apakah itu berarti dia senang? | same portrait | SENANG? typed huge (3.40) |
| 3 | 4.20 | ... dikenal sebagai The Smiling General, | the book | THE 6.68 / SMILING 6.94 / GENERAL 7.46 pressed onto the cover |
| 4 | 8.40 | atau Jenderal yang tersenyum. | the book | pencil translation written 8.62–9.92 |
| 5 | 10.26 | ... biografinya yang terbit pada 1969. | the book, pulled back | stamp 1969 (13.74) |
| 6 | 16.14 | Di depan kamera ... begitu khas. | contact sheet of three smiles | light sweep on "khas" (19.74) |
| 7 | 20.46 | Namun, sejarawan John Roosa ... menyembunyikan emosinya, | two prints of John Roosa + tag | tracing paper slides over the smile (23.72–24.50) |
| 8 | 25.70 | sehingga sulit dibaca. | the blurred smile | push in |
| 9 | 27.08 | ... pemerintahan yang sangat dominan. | map of Indonesia | red ink spreads from Jakarta, complete on "dominan" (32.02) |
| 10 | 32.90 | Selama Orde Baru, kekuasaan ditopang militer, | military print on Jakarta | lands on "militer" (35.02) |
| 11 | 35.88 | sementara ruang bagi perlawanan politik dibatasi. | protest print | lands on "perlawanan" (36.90), red border snaps shut on "dibatasi" (37.86) |
| 12 | 38.96 | Jadi, wajah yang terlihat ramah tidak cukup ... | rice-field print, then the red map | lands on "wajah" (39.72), long pull back |
| 13 | 45.06 | ... setiap senyumnya berarti setuju, | contact sheet | SETUJU? (48.52) |
| 14 | 49.58 | kesal, atau sekadar menjaga sikap di depan publik. | contact sheet | KESAL? (49.50), MENJAGA SIKAP? (50.90) |
| 15 | 52.82 | Itulah yang membuat senyum Suharto terus mengundang tafsir. | portrait | red ? on "tafsir" (55.30) |
| 16 | 55.92 | Orang bisa melihat ekspresinya, | the face | push in |
| 17 | 58.08 | tetapi ... keputusan dan tindakannya. | official papers | KEPUTUSAN stamp (61.40), TINDAKAN stamp (62.40) |

Sound cues: see `cues.md`.
