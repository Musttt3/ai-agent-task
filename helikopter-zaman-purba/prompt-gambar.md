# Prompt Gambar — "Punya Helikopter 30 Ribu Tahun Lalu"

Untuk Google Flow (agent batch). Format 9:16, 145 gambar, satu gambar per timestamp.

Cara pakai:
1. Upload gambar karakter stickman sebagai referensi (Ingredients / reference image).
2. Tempel **BAGIAN A (instruksi global)** ke agent satu kali di awal.
3. Tempel **BAGIAN B (daftar scene)**, boleh sekaligus atau per 20–30 scene agar agent tidak memotong.
4. Kalau ada scene yang dibuat ulang satu per satu di luar agent, tambahkan **STYLE SUFFIX** di akhir prompt-nya.

---

## BAGIAN A — Instruksi global (tempel sekali)

```
You will generate one image for EACH scene in the list I send next. One image per scene, in order, keep the scene number in the file name. Aspect ratio 9:16 vertical for every image.

MAIN CHARACTER = the stickman in the uploaded reference image. Keep the design EXACTLY the same in every image: round white head with a thick black outline, simple black dot eyes with expressive eyebrows and mouth, messy spiky brown hair, shaggy brown fur tunic with a cream-white fur patch on the chest, thin brown rope belt, jagged fur hem, thin black stick arms and legs, rounded black mitten hands, flat black feet. Only the pose, expression and camera angle change. Never give the Main Character modern clothes.

ART STYLE: 2D hand-drawn cartoon stickman illustration, clean bold black ink outlines, flat colors with light soft shading, simple but detailed prehistoric backgrounds (grassland, forest, river, mountains, caves), earthy palette (greens, browns, sky blue), expressive comedic faces, cinematic composition, YouTube storytelling explainer style. No text, no letters, no numbers, no captions, no watermark. Thought bubbles may contain pictures only.

RECURRING ELEMENTS (keep identical in every scene):
- HELICOPTER: a small modern private helicopter, glossy white body with one navy-blue stripe, dark-blue tinted cockpit glass, black main rotor with 4 blades, small tail rotor, black landing skids. Drawn in the same cartoon ink style but with a metallic shine so it looks expensive and out of place.
- HUNTERS: other prehistoric stickmen in the same style as the Main Character (round white heads, stick limbs) but with different hair (black, grey, braided, bald with beard) and darker grey/tan fur clothes, carrying long wooden spears.
- CHILD: one small stickman kid, about half the Main Character's height, short tufty black hair, small light-tan fur tunic. Always the same child.
- MOTHER: the child's mother, stickman woman with long dark hair tied with a leather band and a long brown fur dress.
- DASHBOARD: simple cartoon helicopter dashboard with a round fuel gauge (green zone = full, red zone = empty) and a round red warning light. No readable text on it.
```

**STYLE SUFFIX** (untuk prompt yang dibuat satuan):

```
Same Main Character as the reference image (round white head, messy brown hair, brown fur tunic with cream chest patch, black stick limbs). 2D cartoon stickman illustration, bold black ink outlines, flat earthy colors, prehistoric setting, no text, 9:16 vertical.
```

---

## BAGIAN B — Daftar scene

```
Scene 001 [0:00] Main Character standing proudly with hands on hips next to the gleaming HELICOPTER on a modern rooftop helipad, city skyline behind, golden sparkles and floating gold coins around the helicopter to show it is extremely expensive, confident grin. Wide shot.

Scene 002 [0:04] The HELICOPTER flying through a swirling blue time-travel vortex full of spinning clock shapes, Main Character visible in the cockpit with a shocked face, the vortex opening onto a prehistoric landscape with mountains and woolly mammoths.

Scene 003 [0:09] Main Character standing beside the landed HELICOPTER in an empty prehistoric grassland, scratching head; a thought bubble shows an airport control tower, a mechanic garage and a fuel pump, each crossed out with a big red X.

Scene 004 [0:15] Main Character flying the HELICOPTER high above a prehistoric valley at sunrise, one arm raised triumphantly, huge proud smile, birds flying below, feeling like the king of the sky.

Scene 005 [0:18] Ominous foreshadowing: inside the cockpit, Main Character sweating and terrified, gripping the controls, dark storm clouds outside, the red warning light glowing on the DASHBOARD.

Scene 006 [0:24] A bright flash of light as the HELICOPTER suddenly appears on a vast green meadow, grass blown outward in a ring, Main Character stepping out looking bewildered. Wide establishing shot.

Scene 007 [0:28] Close-up of the DASHBOARD: fuel gauge needle pointing to the full green zone, engine lights glowing green, the Main Character's mitten hand giving a thumbs-up in the foreground.

Scene 008 [0:32] Wide panoramic landscape: dense forest, a winding river, snowy mountains, herds of mammoths, deer and bison grazing; the Main Character small in frame, standing on the helicopter skid shading eyes and looking around.

Scene 009 [0:38] Main Character peeking out from behind the HELICOPTER, spotting a line of five HUNTERS walking across the grassland in the distance carrying wooden spears.

Scene 010 [0:43] The HELICOPTER flying low toward the group of HUNTERS, Main Character waving happily from the cockpit, the hunters freezing and looking up.

Scene 011 [0:47] HUNTERS scattering in panic in every direction, wide eyes, motion lines, grass flattened by rotor wind, the HELICOPTER hovering above with loud sound-wave lines.

Scene 012 [0:51] One HUNTER hiding behind a big boulder, another lying flat face-down in the grass covering his head, and one brave HUNTER pointing his spear up at the hovering HELICOPTER.

Scene 013 [0:57] Dramatic low angle from the hunters' point of view: the giant HELICOPTER looming in the sky like a metal monster, rotor wind swirling like a storm, HUNTERS in the foreground with terrified faces.

Scene 014 [1:05] The HELICOPTER landed on an open dirt clearing, rotor blades slowing, Main Character stepping out of the door with a friendly smile and a small wave.

Scene 015 [1:10] HUNTERS stepping backward cautiously with spears held forward, suspicious frowns, while the Main Character's smile fades into awkwardness.

Scene 016 [1:14] Main Character raising both hands high with open palms and a gentle reassuring smile to show no danger, HUNTERS watching from a distance.

Scene 017 [1:19] The CHILD bravely tiptoeing toward the HELICOPTER alone while the adult HUNTERS watch nervously from behind rocks.

Scene 018 [1:22] The CHILD touching the shiny helicopter body with one hand and staring at their own reflection in the glossy cockpit glass, wide curious eyes.

Scene 019 [1:27] The CHILD jumping backward in fright with arms flailing, startled face, their reflection still visible in the glass, motion lines; Main Character chuckling nearby.

Scene 020 [1:32] Main Character opening the helicopter door and politely gesturing toward the padded passenger seat inside, inviting.

Scene 021 [1:35] One HUNTER sitting stiffly in the passenger seat, holding his spear upright, nervous but proud, other HUNTERS peeking from outside.

Scene 022 [1:37] Main Character leaning in to buckle the seatbelt across the HUNTER; the HUNTER panicking, eyes huge, sweat drops flying, arms flailing.

Scene 023 [1:41] The HUNTER glaring at the seatbelt, with a thought bubble showing himself tied up with ropes as a prisoner; frightened and angry expression.

Scene 024 [1:45] Main Character quickly unbuckling the seatbelt with an apologetic face, the HUNTER scrambling out of the seat, relieved.

Scene 025 [1:47] Main Character in the pilot seat with a sheepish smile reaching for the start switch, while the HUNTERS and the CHILD are still crowded very close around the HELICOPTER.

Scene 026 [1:52] Main Character pressing the start button, rotor beginning to spin, HUNTERS and CHILD standing dangerously close and unaware.

Scene 027 [1:57] Powerful rotor downwash blasting leaves, dust and grass into the air, swirling debris everywhere, total chaos around the HELICOPTER.

Scene 028 [2:00] HUNTERS covering their faces with their arms, squinting, hair and fur clothes whipping wildly in the dust storm.

Scene 029 [2:02] The CHILD running after a woven basket tumbling away in the wind, berries spilling out of it.

Scene 030 [2:05] One HUNTER bravely jabbing his spear into the wind toward the spinning rotor as if fighting an invisible monster, comical determined face.

Scene 031 [2:09] Main Character in the cockpit flipping the engine switch off with an embarrassed face, dust settling, leaves floating down slowly.

Scene 032 [2:11] Main Character standing next to the HELICOPTER rubbing the back of the head awkwardly, while dusty HUNTERS glare with arms crossed.

Scene 033 [2:15] Imagined scene inside a cloud-shaped border: angry HUNTERS chasing the Main Character out of the valley with spears raised, Main Character running away comically.

Scene 034 [2:17] HUNTERS' faces slowly softening from fear to wonder, cautiously gazing at the parked HELICOPTER, warm soft light.

Scene 035 [2:21] The HELICOPTER taking off from a safe distant hilltop, Main Character waving from the cockpit, HUNTERS watching from far away at a safe distance.

Scene 036 [2:24] The whole tribe standing on the grassland watching the tiny HELICOPTER disappear behind a hill at sunset, mouths open in awe.

Scene 037 [2:28] Main Character with a glowing lightbulb above the head, excited grin, finger raised, standing beside the parked HELICOPTER.

Scene 038 [2:31] View from above: the HELICOPTER flying over a sparkling blue river winding through a green forest.

Scene 039 [2:34] The HELICOPTER flying over a herd of bison, a dry cave shelter visible on a cliff ahead, dark rain clouds approaching in the distance.

Scene 040 [2:39] Main Character standing tall on a rock with chest puffed out in a superhero pose, smug proud face, the tribe in the background, golden glow.

Scene 041 [2:43] Early morning sunrise, misty valley, the HELICOPTER lifting off, Main Character in the cockpit with a determined look.

Scene 042 [2:47] Top-down aerial view out of the cockpit window: a herd of deer grazing near a valley, Main Character's mitten hand pointing at them excitedly.

Scene 043 [2:50] Main Character kneeling and drawing a map in the dirt with a stick (arrows, circles, wavy lines and a little deer doodle), proud grin, HUNTERS gathering around.

Scene 044 [2:56] HUNTERS staring at the dirt drawing with confused faces and question marks above their heads, one tilting his head, one looking at it upside down.

Scene 045 [3:00] One HUNTER confidently pointing toward a hill on the left (east side) of the frame.

Scene 046 [3:03] Main Character pointing in the opposite direction (right side, west), both standing back to back pointing opposite ways, comical disagreement.

Scene 047 [3:05] Main Character and the HUNTERS waving their arms and making wild hand gestures like a game of charades, motion lines, sweat drops.

Scene 048 [3:08] Main Character shrugging and giving in, walking behind the HUNTERS in a line into the forest.

Scene 049 [3:11] HUNTERS leading the way along a safe, gentle forest trail, Main Character following and looking impressed.

Scene 050 [3:15] A HUNTER crouching and pointing at a small hidden stream of water flowing between rocks, Main Character amazed.

Scene 051 [3:17] A HUNTER stopping the Main Character with an outstretched arm right before stepping onto a patch of soft mud that is collapsing into a sinkhole.

Scene 052 [3:19] A HUNTER kneeling and pointing at deer hoofprints and broken twigs on the ground, Main Character leaning in with surprise.

Scene 053 [3:22] Two-part vertical composition: top half shows the HELICOPTER high above a tiny landscape; bottom half shows a HUNTER's hand touching footprints in the soil. Main Character in the middle looking humbled and thoughtful.

Scene 054 [3:27] Days later, gloomy mood, sun and moon arcs across the sky, Main Character walking toward the parked HELICOPTER with a worried face.

Scene 055 [3:31] Extreme close-up of the DASHBOARD fuel gauge, needle dropping toward the red empty zone, Main Character's worried face reflected in the gauge glass.

Scene 056 [3:35] Main Character next to the HELICOPTER with the engine cover open showing a turbine engine, holding an empty jerrycan, thought bubble showing a glowing drop of special aviation fuel.

Scene 057 [3:39] Main Character sadly sitting on a rock in the prehistoric landscape, thought bubble showing an oil refinery with tall towers crossed out with a big red X.

Scene 058 [3:42] Main Character holding head in both hands, thought bubble showing a fuel tanker truck and a box of spare parts and wrenches, both crossed out with red X marks.

Scene 059 [3:44] Main Character heating a clay pot full of black crude oil over a campfire, thick black smoke puffing up, soot covering the face, coughing, failed experiment.

Scene 060 [3:49] The HELICOPTER flying with a trail of fuel drops evaporating behind it, Main Character nervously glancing at the fuel gauge.

Scene 061 [3:52] Main Character cupping the last drop of fuel in both hands like a precious jewel, sad expression, HELICOPTER in the background.

Scene 062 [3:56] The HELICOPTER parked quietly under a big tree, rotor still, a few leaves resting on it, calm peaceful scene.

Scene 063 [3:59] Main Character shaking head and putting the helicopter key into a leather pouch, refusing to fly just to show off, HELICOPTER parked behind.

Scene 064 [4:03] HUNTERS gathered around the silent parked HELICOPTER, smiling and relaxed, gently touching it with curiosity.

Scene 065 [4:07] Several children, including the CHILD, sitting in the shade under the helicopter's body and tail boom, playing with pebbles on a sunny day.

Scene 066 [4:10] HUNTERS examining the HELICOPTER: one opening and closing the door, one pressing his face against the cockpit glass, one tapping the window.

Scene 067 [4:12] A HUNTER sitting on the ground carefully building a small helicopter model out of twigs and vines, tongue out in concentration, Main Character watching amused.

Scene 068 [4:16] The twig helicopter model's tiny rotor snapping and breaking apart, the HUNTER's shocked face, Main Character holding back a laugh.

Scene 069 [4:19] Afternoon sky turning dark grey, heavy storm clouds rolling over the valley, the tribe looking up worried.

Scene 070 [4:22] Heavy rain pouring down, everyone huddling under fur cloaks and big leaves, the HELICOPTER soaked with rain streaks.

Scene 071 [4:25] The river near the tribe's camp swelling and overflowing its banks, brown muddy water creeping toward the huts.

Scene 072 [4:28] Raging floodwater carrying broken branches and whole tree trunks downstream, dramatic angle.

Scene 073 [4:30] HUNTERS hurrying up a slope toward higher ground in the rain, carrying bundles and spears.

Scene 074 [4:33] Main Character helping carry heavy bundles and baskets up the muddy slope in the rain.

Scene 075 [4:35] The MOTHER suddenly screaming in panic with hands on her cheeks, rain falling, everyone turning toward her.

Scene 076 [4:37] The MOTHER pointing frantically down toward the flooded riverbank, tears on her face, an empty spot by the water where the child used to play.

Scene 077 [4:40] Main Character and HUNTERS standing on safe higher ground, shading their eyes and scanning the flooded landscape.

Scene 078 [4:42] Wide shot: a small patch of land turning into an island, surrounded on all sides by rushing brown floodwater.

Scene 079 [4:46] The CHILD standing alone on the small island, crying, rain falling, tiny lonely figure.

Scene 080 [4:48] The raging current between the group and the island, no bridge, a HUNTER trying to step in but being pulled back by others.

Scene 081 [4:52] Main Character turning to stare at the parked HELICOPTER, rain dripping, determined but anxious face.

Scene 082 [4:54] Close-up of the DASHBOARD fuel gauge almost empty in the red zone, Main Character's anxious reflection in the glass.

Scene 083 [4:58] Main Character clenching both fists, desperate to help, looking across the water at the crying CHILD.

Scene 084 [4:59] Imagined danger inside a cloud-shaped border: the HELICOPTER tossed by strong wind and heavy rain with lightning, about to crash; Main Character shaking head beside it.

Scene 085 [5:04] Main Character sitting under a rock shelter, watching the sky carefully and waiting, rain falling, the CHILD visible far away on the island.

Scene 086 [5:07] The rain stopping, last drops falling from leaves, clouds starting to part.

Scene 087 [5:08] The wind calming down, trees and grass becoming still, leaves settling.

Scene 088 [5:09] Mist lifting and visibility clearing, a clear view across the valley to the CHILD on the island.

Scene 089 [5:11] Main Character running toward the HELICOPTER with a determined face and opening the cockpit door.

Scene 090 [5:14] The HELICOPTER taking off carefully and flying low over the flooded river toward a dry open plain.

Scene 091 [5:18] Aerial view: a dry open plain that is not flooded, very close to the CHILD's little island.

Scene 092 [5:20] The HELICOPTER landing safely on dry ground, rotor slowing to a stop.

Scene 093 [5:22] Main Character walking toward the crying CHILD with open arms and a gentle smile.

Scene 094 [5:24] The CHILD recognizing the Main Character and running toward them, tears turning into happiness.

Scene 095 [5:28] Main Character lifting the CHILD into the helicopter passenger seat.

Scene 096 [5:30] Main Character fastening the seatbelt on the CHILD, who stays calm and trusting this time.

Scene 097 [5:31] The HELICOPTER flying back toward the higher ground over the flooded valley, Main Character and CHILD visible inside.

Scene 098 [5:34] Mid-flight, Main Character glancing down at the DASHBOARD with sudden worry, CHILD looking out the window.

Scene 099 [5:36] Close-up of the red fuel warning light glowing brightly on the DASHBOARD, flashing light rays.

Scene 100 [5:39] Main Character sweating heavily and gripping the controls, the CHILD clutching the seat nervously.

Scene 101 [5:41] Main Character with a tense focused face flying straight ahead, no time to turn or circle, flooded land below.

Scene 102 [5:46] View through the cockpit window: an open patch of ground on the high hill ahead with the tribe waving, within reach.

Scene 103 [5:50] The HELICOPTER touching down on the open ground, Main Character switching off the engine and exhaling in relief.

Scene 104 [5:53] The MOTHER running and hugging the CHILD tightly, both crying happy tears.

Scene 105 [5:56] HUNTERS walking calmly toward the HELICOPTER.

Scene 106 [5:58] HUNTERS approaching with spears lowered and pointed at the ground, friendly smiles.

Scene 107 [6:00] HUNTERS gently placing their hands on the HELICOPTER with respect, warm sunlight breaking through the clouds.

Scene 108 [6:02] A HUNTER with a thought bubble showing the helicopter drawn as a scary monster with fangs, crossed out with a red X.

Scene 109 [6:04] The tribe gathered around the HELICOPTER and the reunited MOTHER and CHILD, warm group moment, Main Character in the center smiling.

Scene 110 [6:08] Main Character opening the helicopter fuel tank cap and peering inside, worried.

Scene 111 [6:11] Main Character holding up a stick used as a dipstick, only a tiny drop of fuel at its tip, disappointed face.

Scene 112 [6:15] The HELICOPTER standing alone on the grassland, the golden sparkles and coins around it fading away.

Scene 113 [6:17] The HELICOPTER now dusty, vines growing on the skids, a bird nesting on the rotor, a big useless metal object.

Scene 114 [6:19] Main Character sitting sadly on the helicopter skid, chin resting in both hands.

Scene 115 [6:22] Time-lapse feeling: several suns and moons arcing across the sky above the parked HELICOPTER, days passing.

Scene 116 [6:24] Main Character kneeling at a clear stream, scooping water into a gourd.

Scene 117 [6:27] A HUNTER teaching the Main Character to recognize plants and berries, holding up leaves.

Scene 118 [6:28] Main Character crafting simple tools: chipping a stone and tying it to a wooden handle with vines.

Scene 119 [6:30] Main Character sitting by a campfire in the prehistoric camp at dusk, thoughtful face.

Scene 120 [6:32] Main Character looking back and forth between the parked HELICOPTER and a simple handmade tool, realizing machines alone cannot solve life here.

Scene 121 [6:36] Peaceful misty morning, soft sunrise over the camp and the parked HELICOPTER.

Scene 122 [6:37] The CHILD walking happily toward the Main Character, holding something wrapped in a big leaf.

Scene 123 [6:40] Close-up of the CHILD's small hands unwrapping a carefully crafted sharp flint stone blade.

Scene 124 [6:43] The CHILD handing the stone blade to the Main Character, who receives it with both hands.

Scene 125 [6:45] The CHILD pointing at the parked HELICOPTER, the Main Character looking in that direction while holding the stone.

Scene 126 [6:48] Close-up of the Main Character smiling warmly.

Scene 127 [6:49] Close-up of the simple stone blade resting in the Main Character's black mitten hand, soft light.

Scene 128 [6:52] Main Character using the stone blade to cut a vine rope today, sunny scene.

Scene 129 [6:54] Main Character using the same stone blade in different seasons: autumn leaves on one side, snow on the other, showing it lasts for years.

Scene 130 [6:57] Main Character sharpening the stone blade against a flat rock, stone dust flying, satisfied face.

Scene 131 [7:00] The parked HELICOPTER with a thought bubble showing an empty fuel jerrycan.

Scene 132 [7:04] The parked HELICOPTER with thought bubbles showing maintenance tools, a factory and a computer, all faded and locked away, impossible in this world.

Scene 133 [7:08] Main Character facing the viewer with a shrug and a questioning smile, standing between the HELICOPTER and a campfire.

Scene 134 [7:13] Flashback with warm vintage tone: on the first day, the tribe gazing at the Main Character in awe.

Scene 135 [7:15] Flashback: Main Character standing on top of the HELICOPTER like a celebrity, the tribe staring up amazed at the most incredible being in the valley.

Scene 136 [7:18] Flashback: days later, Main Character walking to the HELICOPTER with growing worry, clouds gathering.

Scene 137 [7:19] Flashback: Main Character panicking and pulling their hair while staring at the nearly empty fuel gauge.

Scene 138 [7:22] Flashback: the HELICOPTER making its final landing, rotor slowing down for the last time.

Scene 139 [7:24] The tribe resting in the shade under the HELICOPTER, fur clothes drying on the rotor blades, the helicopter now a very expensive shelter. Funny tone.

Scene 140 [7:28] Main Character holding something small that glows warmly in both hands, gentle smile.

Scene 141 [7:32] Main Character turning away from the HELICOPTER in the background, which is out of focus.

Scene 142 [7:34] Close-up of the small stone blade glowing warmly in the Main Character's hand.

Scene 143 [7:36] Main Character and the CHILD sitting together on a rock, smiling at each other, the stone blade between them.

Scene 144 [7:39] Wide sunset shot of the prehistoric valley: the tribe's camp, campfire smoke rising, the parked HELICOPTER in the distance.

Scene 145 [7:40] Final shot: Main Character holding the stone blade up proudly, the CHILD beside them, the tribe resting under the HELICOPTER behind, warm golden sunset.
```
