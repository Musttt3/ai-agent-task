# Apa jadinya kalau kamu jualan es krim di zaman purba?

Skill: `2d-in-3d-animation-agent`, built from its template (`studio/src/videos/icecream/`, its own Remotion project in
`studio/`). **16:9, 30 fps, final export 2K 2560x1440** (composition `IceCream` 1920x1080, `--scale 1.3333`).
Narration: Indonesian, the user's own ElevenLabs voice (`voice/voice.mp3`, 7:51). Script by the user.
Word timings: `voice/words.json` (faster-whisper "small", Indonesian; 1,000 words, 130 sentences; the TurboScribe SRT
`voice/turboscribe.srt` is phrase-level only and starts with a watermark line). Some words are misspelt by the
recogniser ("tomba", "strek" for "listrik"): only the timing is used, no spoken-word captions.
In-scene signs and comic badges with text (user rule, 2026-11-17).

## Facts behind the jokes
- 30,000 years ago (Upper Palaeolithic) people lived as hunter-gatherers; no metal tools, no agriculture, no electricity.
- A freezer is insulated, so without power it warms slowly (hours), it does not create cold.
- Ice cream that has melted is not made safe again by refreezing (food-safety guidance: thawed frozen desserts should be
  discarded; bacteria such as Listeria can grow, and the texture is ruined).
- Opening the lid lets warm air in, so the compressor (powered by the generator) runs longer and burns more fuel.
- Fish and fruit spoil quickly without cooling; drying, smoking or eating them soon were the old answers.
- Barter has no fixed unit: "is a small fish worth the same as a big fish?" is the classic problem money solves.

## Chapters (sentence index -> time)
| Ch | Sentences | Time | Content |
|---|---|---|---|
| 1 | 0-7 | 0:00-0:44 | Hook: the cart at a school vs 30,000 years ago; cavemen with spears; first ice cream seller; "awal bencana". |
| 2 | 8-21 | 0:44-1:43 | Arrival in the valley; you, the cart, the generator; your friend knocks, cheek on the freezer, jumps; the first ice cream. |
| 3 | 22-40 | 1:43-2:48 | The group wants some; money gesture -> "itchy hand"; barter: stone no, twig no, fish yes; crowd; day 1 success. |
| 4 | 41-51 | 2:48-3:25 | Friend guards the queue but gives kids extras; a wolf drawn by the fish; new job: guarding food. |
| 5 | 52-72 | 3:25-4:29 | Night, generator off, big mistake; morning melt; refreezing is not safe; price 2 fish; small vs big fish. |
| 6 | 73-95 | 4:29-5:29 | The sun: lid opening, fuel burns; the queue knocks; generator dies, no SPBU; push to shade; only slows the warming. |
| 7 | 96-112 | 5:29-6:38 | Last ice cream unsellable; food spoils; bankrupt; friend shows fruit kept cool by the river; sustainable food. |
| 8 | 113-129 | 6:38-7:51 | Cart becomes a shelter; a kid brings a fish -- he wants the used stick; stick toys; recap; the punchline. |

## Workflow (user rules)
- Multi-angle camera: every 4-6 s beat split into 2-3 sub-angles (wide / insert / low Dutch / crane), kicks on punch words.
- Phase 1 stills + Opus verifier, phase 2 motion previews (1-3 s) for the user's approval, then the full 2K render per
  chapter in resumable chunks; audio master -14..-15 LUFS, true peak <= -1.5 dBTP.
