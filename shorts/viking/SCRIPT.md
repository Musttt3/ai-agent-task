# You're a Viking Who Reached America Before Columbus

Format: vertical short 1080x1920, 30 fps, ~74 s, `cartoon-3d-short` style (flat 2D cards in a painted 3D toon world).
Narration: English, the user's own ElevenLabs voice (`voice/voice.mp3`, 72.6 s), one steady tone. Script by the user (`script_source.md`).
Word timings: `voice/words.json` (faster-whisper small.en, matches the script word for word).
No captions or labels in the video.

## Facts & sources
- Norse Greenland was settled around 985 by Erik the Red's colonists (Wikipedia "Norse colonization of North America", "Erik the Red").
- Around 1000, Leif Erikson sailed west after Bjarni Herjolfsson reported unknown forested lands (Saga of the Greenlanders; Wikipedia "Leif Erikson"). The sagas call the new land Vinland and praise its timber and fresh water; Greenland had almost no large trees.
- The Norse sailed in open wooden ships with one square sail (cargo ships, "knarr"); no horned helmets (a 19th-century myth: Wikipedia "Horned helmet").
- L'Anse aux Meadows, Newfoundland, Canada: Norse site found in 1960 by Helge Ingstad and Anne Stine Ingstad; turf-and-timber buildings; UNESCO World Heritage Site 1978 (Wikipedia "L'Anse aux Meadows").
- Kuitems et al., "Evidence for European presence in the Americas in AD 1021", Nature 601 (2022, online Oct 2021): wood cut with metal blades at L'Anse aux Meadows dated to exactly 1021 using the 993 solar-storm radiocarbon spike.
- Indigenous peoples had lived in Newfoundland and Labrador for thousands of years before the Norse (Maritime Archaic, Dorset, ancestors of the Beothuk and Innu). The sagas describe trade and then violent encounters with people they called "Skraelings", one reason the Norse left.
- Columbus reached the Americas in 1492, roughly 470-490 years after the Norse voyages.

## Shot plan (word-timed in `studio/src/videos/viking/story.ts`)
| # | Shot | Narration | Visual |
|---|---|---|---|
| 1 | hook | You're a Viking, and you've just reached America almost 500 years before Christopher Columbus. | Golden morning. Our Viking on the prow of a striped-sail ship gliding toward a forested coast; proud grin. |
| 2 | stormFlash | But getting here nearly killed you. | Flash. Storm at sea, ship heeling in big waves, Viking soaked and dazed; kick on "killed". |
| 3 | greenland | It's around the year 1000, and you live in freezing Greenland. | Snowy fjord, turf longhouse, bare hills, no trees. Viking shivering, breath puffs. |
| 4 | sailors | When sailors tell you about a mysterious land filled with forests, | Two bearded sailors by the fire, one waving his arms; a dream bubble of tall trees pops on "forests". |
| 5 | join | you join their expedition. | Harbour: Viking strides up the plank onto the ship, grin. |
| 6 | mistake | Big mistake. | Deadpan push-in, the grin drops. |
| 7 | crossing | You spend days crossing the Atlantic in a wooden ship, battling freezing waves and terrifying storms. | Open ocean: calm turns to storm, waves grow, rain, lightning on "storms". |
| 8 | land | Then suddenly, someone shouts, LAND! | Calm golden morning, lookout points, burst on "LAND!". |
| 9 | step | You step onto an unfamiliar coastline. | Low shot: boots onto the pebble beach, ship beached behind. |
| 10 | forest | There are enormous forests, fresh water, and valuable timber. | Camera rises along huge pines, a stream, the Viking hugging a log. |
| 11 | build | You help build shelters and gather supplies. | Turf-and-timber hut going up; Viking hammering, crew carrying logs and baskets. |
| 12 | problem | But there's one problem. | Hammer stops. Push-in on a stern face. |
| 13 | notAlone | You're not alone. | Reverse: people at the forest edge watching. Viking shocked. |
| 14 | indigenous | Indigenous peoples have lived here for thousands of years, | Their camp: hide-covered lodges, birch-bark canoe, fire, a family. |
| 15 | tension | and encounters between your crew and local communities could turn dangerous. | Two groups facing each other on the beach, clouds darken, kick on "dangerous". |
| 16 | sailBack | With limited supplies and no reinforcements, you eventually sail back toward Greenland. | Near-empty barrel, then the ship sails off into a sunset, Viking looking back. |
| 17 | later | A thousand years later, | Time-lapse: the site sinks into grassy mounds. |
| 18 | dig | archaeologists find a Norse settlement in Newfoundland, Canada. | Archaeologists brushing turf-wall outlines on a grassy coast. |
| 19 | evidence | Evidence confirms Norse activity there in 1021. | Close-up: a cut wooden piece held up, archaeologist amazed. |
| 20 | notFirst | You weren't the first person in America, | Indigenous family by their fire at dusk. |
| 21 | voyage | but you were part of an extraordinary voyage that crossed the Atlantic centuries before Columbus. | High wide glide over the ship crossing the golden ocean. |
| 22 | end | And the craziest part? You had absolutely no idea you were making history. | Back in Greenland by the fire, the Viking munches, shrugs, deadpan to camera. Fade out. |

## Notes
- Render at 1080x1920 (software WebGL in the cloud container: ~10 s/frame). 2K would need ~2x the time.
- QA pass 1: the tension shot's sky switched texture in one frame (light blend crossed 0.5). Fixed with a second sky layer that cross-fades; join/crossing/tension/supplies re-rendered with `studio/vpatch.sh`.
- Remaining QA "pops" are planned: shot cuts, the hook flash, lightning, the LAND! burst, the shocked reaction on "not alone" and the kick on "dangerous". The last 2 frames are the fade to black.
