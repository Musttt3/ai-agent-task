# Dugaan Penyadapan Presiden: Siapa Mengawasi Orang yang Punya Kuasa?

TikTok explainer, 9:16, 1080×1920, 30 fps, **68 s**. It uses 66.1 s of narration, a 0.25 s glitch-in before the voice and a ~1.8 s end card after it.
Final file: `penyadapan_short.mp4`.

## Source material
* **Narration, script and 18 illustrations** come from the creator's Google Drive folder `Penyadap` (`Penyadap.zip`):
  `ElevenLabs_…_v4.mp3`, `penyadapan-presiden.txt` (copied here as `naskah.txt`) and 18 AI-generated 9:16 PNGs.
  The PNGs are renamed by content in `studio/public/penyadapan/img/` (see `tools/prep_images.py`).
* **B-roll** is public-domain film from the Internet Archive (Prelinger Archives):
  | clip | film | source | in-point |
  |---|---|---|---|
  | `dial` | *Telephone and Telegraph* (1946) | archive.org/details/Telephon1946 | 25.35 s |
  | `listen`, `street`, `couple` | *The Nation at Your Fingertips* (1951) | archive.org/details/Nationat1951 | 248.1 / 20.6 / 206.3 s |
  | `control`, `switch`, `radar` | *On Guard! The Story of SAGE* (1956) | archive.org/details/OnGuard1956 | 290.5 / 323.86 / 317.7 s |

  Each clip is credited on screen ("ARSIP <year> · “<film>” · Prelinger Archives / Internet Archive").
* The AI illustrations are labeled **"ILUSTRASI AI"** on screen, and the archive clips are labeled **"ARSIP · PUBLIC DOMAIN"**.
  Two of the illustrations depict the President. When you upload, also turn on TikTok's AI-generated content label.

## Edit structure (narration seconds)
| time | visual | motion graphics |
|---|---|---|
| 0–2.1 | President on the phone (glitch-in, punch zoom) | "PRESIDEN / DIDUGA DISADAP" + impact |
| 2.1–4.4 | operator under CCTV | CCTV reticle, "SIAPA YANG MENGAWASI PENYADAPNYA?" |
| 4.4–8.85 | Polri press conference, pans down to 3 silhouettes | date card 03 NOVEMBER 2026, camera flashes, counter "3 TERSANGKA", 3 reticles |
| 8.85–10.9 | archive: operator with a headset (1951) | stamp "PENYADAPAN ILEGAL" |
| 10.9–13.15 | President + tapped phone | "MENYASAR PRESIDEN", reticle on the phone "TARGET · LOCKED" |
| 13.15–17.0 | investigators → archive rotary dial → number list | lower third "MENURUT PENYIDIK", typed numbers → "SISTEM PENYADAPAN" |
| 17.0–20.95 | red shield / unlocked | checklist TANPA ✗ VERIFIKASI ✗ DASAR HUKUM |
| 20.95–26.45 | four-panel image | 4 reticles: PEJABAT, TOKOH POLITIK, WARTAWAN, PENGUSAHA |
| 26.45–35.4 | archive SAGE control room → keycard → order → alert | "DI SINILAH PERSOALANNYA", questions 01/02/03 |
| 35.4–42.15 | Komisi III DPR → hearing | lower third, checklist ✓ OBJEKTIF ✓ PROFESIONAL ✓ TRANSPARAN |
| 42.15–48.2 | judge → courtroom | progress bar "PROSES HUKUM / MASIH BERJALAN", "TERSANGKA ≠ TERBUKTI BERSALAH" |
| 48.2–56.55 | archive street → oversight → archive switches → graphic card | "PUBLIK PERLU TAHU", "DIAWASI SIAPA?", "LANGKAH APA…", "AGAR TIDAK TERULANG" |
| 56.55–63.45 | woman on a tapped phone → archive couple → archive radar | waveform driven by the voice, "PERCAKAPAN PALING PRIBADI", radar sweep + "LOLOS DARI PENGAWASAN?" |
| 63.45–67.75 | cracked shield | "SIAPA YANG MENJAMIN PRIVASI KITA?", glass crack, end card "BAGAIMANA MENURUTMU?" |

Transitions are glitch (RGB split plus displaced slices), zoom punch with a flash, whip-left and whip-up with directional
motion blur, white flash, and dip to black. A surveillance HUD (corner brackets, blinking REC with timecode), film grain,
scanlines and a vignette run throughout. Word-by-word captions appear in groups of up to 3 words, with the active word in yellow.

## Sound
`audio/penyadapan_audio.py` synthesizes everything with numpy/scipy. It uses no sample libraries and reads the same `plan.json` as the picture:
* **Voice:** 75 Hz HPF, de-mud, presence EQ, 3:1 compression, normalized to −16 LUFS.
* **Score:** D minor at 100 bpm. Drone, Dm–B♭–Gm–A pad, an 8th-note bass pulse from 2.1 s, ticking 16ths from 4.4 s, kick + arpeggio
  in the questions and the build, a riser over the radar shot, a heartbeat drop for the final question, and a resolving chord under the end card.
  The score ducks about 6 dB under the narration.
* **SFX:** about 20 types. Glitch bursts, whooshes, impacts, shutters, typing and typewriter clicks, target-lock beeps, error buzz, glockenspiel checks,
  stamp, rotary-dial pulses, phone-line static, radar pings, tape rewind, slash, glass crack, heartbeat.
* **Master:** −14 LUFS integrated, true peak ≤ −1 dBTP. `tools/mix_qa.py` flags any 400 ms window where the SFX come within 3 dB of the voice.

## Rebuild
```bash
# 1. assets (once): images, B-roll, captions
python3 tools/prep_images.py <unzipped Penyadap dir> ../studio/public/penyadapan/img
tools/prep_broll.sh <dir with Telephon1946.mp4 Nationat1951.mp4 OnGuard1956.mp4> ../studio/public/penyadapan/broll
python tools/align_words.py ../studio/public/penyadapan/voice/voice.mp3 tools/words_whisper.json naskah.txt \
  ../studio/src/videos/penyadapan/words.json ../studio/src/videos/penyadapan/voice_env.json
# 2. picture (from shorts/studio)
npx remotion render src/index.ts Penyadapan out/penyadapan_video.mp4 --codec h264 --crf 16 --muted --concurrency 4
# 3. sound + mux
python audio/penyadapan_audio.py ../studio/public/penyadapan/voice/voice.mp3 ../studio/out/penyadapan_mix.wav
tools/encode.sh ../studio/out/penyadapan_video.mp4 ../studio/out/penyadapan_mix.wav penyadapan_short.mp4
```
`tools/words_whisper.json` was made with faster-whisper large-v3 (`tools/transcribe.py`). `align_words.py` swaps in the exact
script spelling, for example "terulang", which whisper heard as "terungkap", and snaps word starts out of detected pauses.
Stills for checking frames: `COMP=Penyadapan node stills.mjs out/pstill/x 37,260,788 0.5` (from `shorts/studio`).
