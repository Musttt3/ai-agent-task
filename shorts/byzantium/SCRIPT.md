# You're a Messenger During the Fall of Constantinople

Skill: `2d-in-3d-animation-agent` (framework) on the cartoon-3d-short look. Vertical, 30 fps, ~58 s.
**Final export 2K: 1440x2560** (`--scale 1.3333` on the 1080x1920 composition `ByzantiumShort`).
**Captions: word by word** (user asked for them on this video): Poppins Black, white with a black outline, one word per
beat with a small pop, key words in yellow; lower third, framework style.
Narration: English, the user's own ElevenLabs voice (`voice/voice.mp3`, 56.7 s). Script by the user.
Word timings: `voice/words.json` (faster-whisper small.en, matches the script word for word; "Then you" and
"Ottoman soldiers" hand-fixed to the waveform).

## Facts & sources
- Constantinople fell on Tuesday 29 May 1453 after a siege that began in early April 1453 (about 53 days)
  (Wikipedia "Fall of Constantinople"; Runciman, *The Fall of Constantinople 1453*).
- Ottoman artillery, including the giant bombard cast by the engineer Orban, battered the Theodosian Walls (built in
  the 5th century under Theodosius II: moat, outer wall, inner wall with towers) for weeks (Wikipedia "Walls of
  Constantinople", "Orban").
- The final assault came in the hours before dawn on 29 May; when the Genoese commander Giovanni Giustiniani was
  wounded the defence at the walls collapsed and Ottoman troops broke into the city. Church bells rang the alarm and
  crowds fled toward Hagia Sophia (Wikipedia "Fall of Constantinople").
- Sultan Mehmed II (aged 21) led the Ottoman army; the defenders numbered roughly 7,000-8,000 against an army of
  tens of thousands (ibid.). Janissaries wore the tall white felt cap (börk/üsküf).
- Emperor Constantine XI Palaiologos, the last Byzantine emperor, died in the final fighting; his body was never
  identified with certainty (Wikipedia "Constantine XI Palaiologos").
- The Byzantine (Eastern Roman) Empire had lasted over a thousand years: Constantinople was dedicated as the capital
  in 330 AD, 1,123 years before 1453 (Wikipedia "Byzantine Empire").
- Hagia Sophia had no minarets in 1453 (they were added after it became a mosque), so ours has none. The Palaiologan
  banner is drawn as a gold cross on red; Ottoman banners as plain red pennants (no crescent, a later association).
- The messenger and the commander are our own characters (no named historical messenger).

## Shot plan (word-timed in `studio/src/videos/byzantium/story.ts`)
| # | Shot | Narration | Visual |
|---|---|---|---|
| 1 | hook | You're a messenger in Constantinople, and the fate of an empire is in your hands. | Dawn rooftop: our messenger with a sealed letter, the domes behind; push-in to the letter on "hands". |
| 2 | date | It's May 29, 1453. | Flash. Pre-dawn wide over the land walls, the Ottoman camp's fires and tents beyond. |
| 3 | cannons | For weeks, Ottoman cannons have pounded your city's massive walls. | A giant bombard fires (smoke, kick); the ball hits a tower: dust on "walls". |
| 4 | collapsing | Now, just before dawn, the defenses are collapsing. | On the wall walk: defenders with shields; a tower top crumbles on "collapsing". |
| 5 | grab | A commander grabs your shoulder. | Two-shot: helmeted commander grabs the messenger. |
| 6 | order | "Get to the palace! Warn them!" | Close-up: the commander shouts and points; kicks on "palace" and "warn". |
| 7 | run | You run through narrow streets as bells ring and terrified families rush past. | Narrow street: the messenger runs at us, a bell swings, a family hurries across. |
| 8 | behind | Behind you, soldiers desperately fight to hold back Sultan Mehmed the Second's army. | The breach: defenders' shield line against Janissaries in dust; Mehmed II on a rise behind his army. |
| 9 | hear | Then you hear it. | The messenger stops and turns; push-in. |
| 10 | roar | A deafening roar from the walls. | From the street up to the walls: a dust blast, shake on "roar". |
| 11 | breaking | Ottoman soldiers are breaking into the city. | The gate bursts; red pennants and soldiers pour in through the dust. |
| 12 | faster | You run faster, but smoke fills the streets, and the crowds grow thicker. | Running, the smoke thickens, the crowd grows around him. |
| 13 | heart | By the time you reach the heart of Constantinople, | The square: crane up to Hagia Sophia's great dome at sunrise. |
| 14 | late | it's already too late. | His face falls; push-in. |
| 15 | emperor | Emperor Constantine the Eleventh dies in the final battle. | Last stand at the breach: the emperor in purple with sword raised; smoke swallows him; only his gilded helmet remains. |
| 16 | endEmpire | And the Byzantine Empire, which survived for over a thousand years, comes to an end. | The gold-cross banner on its pole; slowly lowered and falls on "end". |
| 17 | warning | You were supposed to deliver a warning. | Close-up: he looks at the unopened letter. |
| 18 | witnessed | Instead, you just witnessed the fall of an empire. | He sits on the steps; the camera pulls back over the smoking city at sunrise. Fade out. |

## Notes
- No gore: the fighting reads as shields, dust and smoke; deaths are implied.
- Final: `byzantium_short.mp4`, 1440x2560 (2K), 30 fps, 57.9 s, H.264 crf 18 + AAC 192k; -15.2 LUFS, peak -0.9 dBFS (mix true peak -1.2 dBTP). Word-by-word captions burned in.
- Verifier (Opus): 6.4/10 on stills; all 10 fixes applied (outer-wall lintel + earth fill so nobody floats or stands in the moat, no houses through the rooftop and the ending kept close on the messenger, captions clear of faces, flat cloak and banner on the stones, crane ends on the dome, gate vault fixed, Mehmed's guards on the dais, cannon/impact framing, tower top tips outward, the commander's hand on the shoulder; banner fire-steels drawn as B's, Mehmed's beard lighter, bell tower moved into view).
- The sitting messenger first sat inside the Hagia Sophia steps (half hidden) and shrank to a speck on the pull-back; the ending moved to the rooftop of the opening.
- QA: no silences, no frozen spans, no unplanned white frames; frame-diff spikes are planned (cuts, bombard fires, kicks, caption word changes).
- Rendered in resumable 100-frame chunks across two container restarts (`studio/brender_chunks.sh`).
