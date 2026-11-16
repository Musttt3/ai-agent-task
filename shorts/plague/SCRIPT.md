# You're a Doctor in 1348

Format: vertical short, 30 fps, ~61 s, `cartoon-3d-short` style (flat 2D cards in a painted 3D toon world).
**Final export 2K: 1440x2560** (`--scale 1.3333` on the 1080x1920 composition `PlagueShort`).
Narration: English, the user's own ElevenLabs voice (`voice/voice.mp3`, 59.8 s), one steady tone. Script by the user (`script_source.md`).
Word timings: `voice/words.json` (faster-whisper small.en, matches the script word for word; "Families" onset hand-fixed to 34.42 s).
No captions or labels in the video.

## Facts & sources
- The Black Death reached Sicily from the Black Sea in October 1347 and swept Italy, France and England in 1348; estimates put deaths at 25-50 million in Europe, roughly a third to a half of the population, with some towns losing about half (Wikipedia "Black Death"; Benedictow, *The Black Death 1346-1353*).
- Symptoms: high fever, buboes (painful swollen lymph nodes in the groin, armpit or neck) and dark blotches on the skin from bleeding under it; Boccaccio's *Decameron* (1353) describes the swellings and the black or livid spots.
- Treatments of the time: bloodletting, herbal remedies such as theriac, and burning aromatic woods and herbs to cleanse the "corrupted air" (Wikipedia "Black Death", "Miasma theory").
- Explanations at the time: miasma (poisoned air; the Paris medical faculty's 1348 report blamed a 1345 planetary conjunction and corrupted air) and divine punishment (the flagellant processions of 1348-49) (Wikipedia "Miasma theory", "Flagellant").
- Physicians died too: Guy de Chauliac, physician to the Pope in Avignon, caught the plague in 1348 and survived and described it; many doctors fled or died (Wikipedia "Guy de Chauliac").
- The bird-beak plague doctor costume is from the 17th century (attributed to Charles de Lorme, 1619), so our 1348 doctor wears a physician's long robe and cap and carries a urine flask (uroscopy was the physician's signature test) (Wikipedia "Plague doctor costume", "Uroscopy"). Spectacles existed in Italy from about 1290.
- *Yersinia pestis* was identified in Hong Kong in 1894 by Alexandre Yersin (and Kitasato Shibasaburō); Paul-Louis Simond showed the rat flea's role in 1898. 1894 - 1348 = 546 years, "another 500 years" (Wikipedia "Alexandre Yersin", "Yersinia pestis"). In stains the bacterium shows dark "safety-pin" ends (bipolar staining), which is how we draw it.

## Shot plan (word-timed in `studio/src/videos/plague/story.ts`)
| # | Shot | Narration | Visual |
|---|---|---|---|
| 1 | hook | You're a doctor in 1348, and half your town is dying. | Our doctor (red robe, cap, spectacles, urine flask) in a timber-framed street; camera pulls up to reveal sick townsfolk on doorsteps, a cough puff. |
| 2 | worst | The worst part? You have absolutely no idea why. | Flash. Night study by candle: books, jars; the doctor shrugs, question marks pop. |
| 3 | patients | Patients arrive with high fevers, swollen lumps, and dark patches on their skin. | Infirmary beds: dolly past three patients; sweat + flush on "fevers", a neck lump on "lumps", dark spots on "patches". |
| 4 | herbal | You try everything, herbal medicines, | Doctor grinding herbs in a mortar. |
| 5 | bloodlet | bloodletting, | Quick insert: a bowl under a wincing patient's arm. |
| 6 | herbs | even burning aromatic herbs to purify the air. | Doctor waves a smoking herb bundle over a brazier, smoke fills the room. |
| 7 | nothing | Nothing seems to work. | Patient coughs; doctor's deadpan push-in. |
| 8 | miasma | People believe the disease comes from poisonous air | Green fog rolls down the street, townsfolk hold posies to their noses. |
| 9 | divine | or divine punishment. | Low angle: church tower under black storm clouds, lightning. |
| 10 | culprit | but you don't know the real culprit. | Street level: a rat scurries past the doctor's feet; he never looks down. |
| 11 | bacteria | A bacterium called Yersinia pestis, often spread by infected fleas. | The rat close up; a magnifier bubble shows wiggling safety-pin rods; a flea hops off on "fleas". |
| 12 | morning | Every morning, more bodies appear in the streets. | Cold dawn: a cart of white shrouds pushed down the street. |
| 13 | families | Families abandon their homes. | A family with bundles walks away, door left open. |
| 14 | doctors | Even fellow doctors begin disappearing. | Four doctors in a row; three vanish in puffs one by one; ours looks left and right. |
| 15 | fever | And now, you're developing a fever. | Night study: our doctor sweats, flushes; kick on "fever". |
| 16 | lookDown | You look down. A painful swelling has appeared beneath your arm. | He looks down, lifts his arm: the swelling pops up; shock on "arm". |
| 17 | patient | Suddenly, you're no longer the doctor. You're the patient. | He's in the bed now, his cap on the peg; a colleague holds the flask to the light. |
| 18 | europe | The Black Death would kill tens of millions across Europe. | Aerial at dusk over towns and fields; a dark shadow spreads, plumes rise town after town. |
| 19 | truth | And the terrifying truth? | Push-in on his face in bed, candle light. |
| 20 | invisible | You're fighting an invisible enemy that humanity won't scientifically identify | He swings his herb bundle at empty air while giant smug bacteria float around him. |
| 21 | future | for another 500 years. | 1894 laboratory: a scientist at a brass microscope, the bubble of rods, his "aha". Fade out. |

## Notes
- Render 2K (1440x2560) as the user requires; chunked and resumable.
- Final: `plague_short.mp4`, 1440x2560 (2K), 30 fps, 60.9 s, H.264 crf 18 + AAC 192k; -15.3 LUFS, peak -0.8 dBFS (true peak of the mix -1.2 dBTP).
- Verifier (Opus): ~6.5/10 on stills; all 8 fixes applied (pained face no longer a wink, plum swelling with throb ticks, magnifier clear of the doctor, flea hop in the rat's plane, fully fogged ink in the dawn mist, moving darkness front + smoke columns over Europe, blood in the bowl, shorter pestle, brazier flames, robe-shaped robe and cap on the bedpost, no beard on the kid, brown-hooded gravedigger, moustached colleagues).
- QA pass 1: a 1.5 s frozen hold at the end of the patients dolly (fixed with a push-in, 238-379 re-rendered) and a 0.37 s silence before "you're the patient" (room tone + pad). Pass 2: no frozen spans, no silences; the remaining frame-diff spikes are planned (cuts, flash, lightning, kicks on "punishment", "culprit", "fever", "patient", the flea jump, the flush).
