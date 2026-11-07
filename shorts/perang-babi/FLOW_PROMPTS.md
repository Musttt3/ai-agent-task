# Perang Babi 1859: Prompt Google Flow per Timestamp

Video naratif ±58 detik. Karakter utama **Lyman Cutler** memakai stickman dari `ref/stickman_sheet.webp` (desain milik user).
Prompt ditulis dalam bahasa Inggris karena Veo/Nano Banana di Flow lebih patuh pada prompt bahasa Inggris. Penjelasan dalam bahasa Indonesia.

## File referensi (`ref/`)

| File | Isi | Dipakai untuk |
|---|---|---|
| `stickman_sheet.webp` | Sheet asli (3 pose + 6 ekspresi) | Referensi gaya saat membuat ingredient baru |
| `cutler_depan.png` | Badan penuh, tampak depan | **Ingredient utama di semua adegan Cutler** |
| `cutler_samping.png`, `cutler_belakang.png` | Tampak samping / belakang | Adegan Cutler menyamping atau membelakangi kamera |
| `wajah_1_cemas.png` | Cemas / canggung | S12 |
| `wajah_2_senang.png` | Senang | S02, S11 |
| `wajah_3_curiga.png` | Curiga / kesal ringan | S03 (awal) |
| `wajah_4_kaget.png` | Kaget | S01 |
| `wajah_5_takut.png` | Takut | S05 |
| `wajah_6_marah.png` | Marah | S03 (akhir), S04 |

Sheet asli berisi 3 badan + 6 kepala. Kalau sheet itu dipakai langsung sebagai ingredient video, Veo cenderung memunculkan beberapa Cutler sekaligus. Karena itu pakai `cutler_depan.png` sebagai ingredient karakter, dan file `wajah_*.png` hanya bila ekspresinya perlu dikunci.

## Cara pakai di Flow

1. **Kirim "Brief untuk Agent" di bawah sekali di awal**, bersama `cutler_depan.png` dan `stickman_sheet.webp`.
2. **Buat ingredient tambahan dulu** (Prompt A sampai C): babi, pemilik babi, tentara. Simpan hasil terbaiknya sebagai ingredient, karena Flow mengizinkan maksimal 3 gambar referensi per generate.
3. **Per adegan:** buat *Frame awal* (gambar) dengan ingredient yang tertulis, lalu animasikan dengan **Frames to Video** memakai prompt *Video*. Cara ini paling konsisten. Kalau ingin langsung video, pakai **Ingredients to Video** dengan prompt *Video* saja, karena prompt itu sudah memuat deskripsi karakter dan gaya.
4. **Durasi:** Veo menghasilkan klip sampai 8 detik. Generate 8 detik, lalu potong sesuai timestamp di editor. Untuk adegan pendek (S04, 2 detik), prompt sudah meminta aksi selesai di awal klip.
5. **Audio:** semua prompt melarang dialog dan teks. Pakai SFX bawaan Veo atau mute, lalu taruh voice-over di editor.
6. **Teks layar** ("1859", "Pulau San Juan", "1872", "Hudson's Bay Company") tambahkan saat editing. Veo sering salah mengeja teks.
7. **Rasio:** pilih di pengaturan Flow (9:16 untuk Shorts/Reels/TikTok, 16:9 untuk YouTube). Komposisi tiap adegan dibuat terpusat agar aman di kedua rasio.

## Timeline

| # | Waktu | Durasi | Narasi | Visual singkat |
|---|---|---|---|---|
| S01 | 0:00–0:06 | 6 dtk | Bayangkan, seekor babi hampir membuat Amerika dan Inggris berperang. | Babi santai makan kentang di antara dua pasukan |
| S02 | 0:06–0:12 | 6 dtk | Tahun 1859, di Pulau San Juan, seorang petani Amerika bernama Lyman Cutler | Kamera mendekat dari pulau ke kebun Cutler |
| S03 | 0:12–0:18 | 6 dtk | kesal karena babi milik perusahaan Inggris terus memakan kentangnya. | Babi diusir, muncul lagi, Cutler makin marah |
| S04 | 0:18–0:20 | 2 dtk | Ia pun menembak babi itu. | Senapan meletus, asap kartun (tanpa darah) |
| S05 | 0:20–0:25 | 5 dtk | Pemiliknya marah, lalu pihak Inggris mengancam menangkap Cutler. | Pemilik babi marah, tentara Inggris bawa borgol |
| S06 | 0:25–0:29 | 4 dtk | Masalahnya, pulau tersebut memang sedang diperebutkan kedua negara. | Tarik tambang memperebutkan pulau |
| S07 | 0:29–0:34 | 5 dtk | Amerika mengirim tentara, Inggris membalas dengan kapal perang. | Tentara AS mendarat, kapal perang Inggris datang |
| S08 | 0:34–0:39 | 5 dtk | Dua kekuatan besar kini saling berhadapan hanya karena seekor babi. | Dari nisan babi mungil, kamera mundur ke dua pasukan |
| S09 | 0:39–0:43 | 4 dtk | Untungnya, tak satu pun pihak melepaskan tembakan. | Semua menurunkan senjata, lega |
| S10 | 0:43–0:48 | 5 dtk | Sengketa itu akhirnya diselesaikan melalui arbitrase pada tahun 1872 | Arbiter mengetuk palu |
| S11 | 0:48–0:52 | 4 dtk | dan Pulau San Juan menjadi milik Amerika. | Bendera AS naik, Cutler bersorak |
| S12 | 0:52–0:58 | ±6 dtk | Bagian paling absurd, satu-satunya korban dalam perang babi ini, ya babinya sendiri. | Hantu babi bersayap melayang, menatap kamera datar |

---

## Brief untuk Agent Flow (kirim sekali di awal)

```
I am making a ~58-second narrated cartoon video about the 1859 "Pig War" on San Juan Island. I will add the voice-over and on-screen text myself in editing, so every clip must have NO speech, NO dialogue, NO subtitles and NO on-screen text. Sound effects only.

VISUAL STYLE (keep identical in every image and clip): hand-drawn 2D stickman cartoon exactly matching the attached character sheet — thick, slightly wobbly black ink outlines, flat colors with no shading or gradients, round white heads with simple dot eyes and expressive eyebrows, thin black stick arms and legs with rounded black mitten hands. Simple flat doodle backgrounds in soft muted colors (grass green, sky blue, sand beige). Smooth, simple 2D animation. Never 3D, never realistic, never anime. Comedic tone, no blood, no gore.

CHARACTERS:
1. LYMAN CUTLER (main character, American farmer) = the stickman in the attached reference: messy spiky brown hair, round white face, blue short-sleeve t-shirt, khaki shorts, black stick legs. Keep his design exactly as the reference in every shot. His facial expressions follow the six expression heads on the sheet.
2. THE PIG = a chubby round pink cartoon pig with a thick black outline, tiny curly tail, short stubby legs, wearing a small British Union Jack bandana around its neck (it belongs to a British company).
3. THE PIG'S OWNER (British) = tall stickman with a round white face, bushy gray mustache, brown bowler hat and a long dark-green coat.
4. AMERICAN SOLDIERS = stickmen in navy-blue jackets, light-blue trousers and small blue kepi caps, carrying old long muskets.
5. BRITISH SOLDIERS = stickmen in bright red coats with white cross-belts, dark trousers and black shako hats, carrying old long muskets.

I will send one scene at a time. For each scene, first create the start-frame image, then animate it into a video clip using the video prompt.
```

---

## Ingredient tambahan (buat sebelum adegan)

Lampirkan `stickman_sheet.webp` sebagai referensi gaya untuk ketiganya.

### Prompt A: Babi

```
Character reference sheet of a chubby round pink cartoon pig, drawn in exactly the same hand-drawn style as the attached stickman sheet: thick slightly wobbly black ink outlines, flat colors, no shading, simple dot eyes. Tiny curly tail, short stubby legs, wearing a small British Union Jack bandana around its neck. Show front view, side view and back view in a row, and below them four expressions: happily chewing a potato, smug, surprised, and as a translucent white ghost with a golden halo and tiny angel wings. Plain white background, no text, no labels.
```

### Prompt B: Pemilik babi (orang Inggris)

```
Character reference sheet of a tall British stickman, drawn in exactly the same hand-drawn style as the attached stickman sheet: round white head with dot eyes, thin black stick arms and legs, rounded black mitten hands, thick slightly wobbly black ink outlines, flat colors, no shading. He has a bushy gray mustache, a brown bowler hat and a long dark-green coat. Show front view, side view and back view in a row, and below them three expressions: neutral, angry red-faced, and pointing furiously. Plain white background, no text, no labels.
```

### Prompt C: Tentara Amerika & Inggris (satu gambar, hemat slot ingredient)

```
Character reference sheet of two stickman soldiers from 1859 standing side by side, drawn in exactly the same hand-drawn style as the attached stickman sheet: round white heads with dot eyes, thin black stick arms and legs, rounded black mitten hands, thick slightly wobbly black ink outlines, flat colors, no shading. Left: an American soldier in a navy-blue jacket, light-blue trousers and a small blue kepi cap, holding an old long musket upright. Right: a British soldier in a bright red coat with white cross-belts, dark trousers and a black shako hat, holding an old long musket upright. Each shown in front view and side view. Plain white background, no text, no labels.
```

---

## Adegan

> Ingredient yang disebut per adegan adalah saran maksimal 3 gambar. "Babi", "Pemilik" dan "Tentara" adalah hasil Prompt A, B, C.

### S01 · 0:00–0:06 · Hook

Narasi: *"Bayangkan, seekor babi hampir membuat Amerika dan Inggris berperang."*
Ingredient: `cutler_depan.png`, Babi, Tentara · Ekspresi Cutler: kaget (`wajah_4_kaget.png`)

**Frame awal**
```
Wide shot of a flat green grassy field under a pale blue sky. In the exact center, a chubby pink cartoon pig wearing a small Union Jack bandana sits calmly chewing a potato. On the left, a row of American stickman soldiers in navy-blue uniforms and blue kepi caps with a US flag; on the right, a row of British stickman soldiers in red coats and black shako hats with a Union Jack flag. Both rows glare at each other across the pig. In the lower corner, Lyman Cutler (the reference stickman: messy spiky brown hair, blue t-shirt, khaki shorts) peeks into frame with a shocked open-mouth face. Style: hand-drawn 2D stickman cartoon exactly matching the attached reference — thick slightly wobbly black ink outlines, flat colors, no shading, round white heads with dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors. No text.
```

**Video**
```
The camera slowly pushes in toward the chubby pink pig with a Union Jack bandana sitting in the center of a grassy field. On the left, American stickman soldiers in navy-blue uniforms lean forward and glare; on the right, British stickman soldiers in red coats do the same, both sides lifting their muskets slightly while their flags flap in the wind. The pig keeps munching its potato, completely unbothered, then turns its head to look straight at the camera and blinks once. In the bottom corner, Lyman Cutler (messy spiky brown hair, blue t-shirt, khaki shorts) pops into view with a shocked open mouth. Audio: tense snare drum roll, crunchy munching, light wind. Style: hand-drawn 2D stickman cartoon exactly matching the attached character reference — thick slightly wobbly black ink outlines, flat colors with no shading, round white heads with simple dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors, smooth simple 2D animation. No 3D, no realism, no on-screen text, no subtitles, no speech or dialogue, no blood.
```

### S02 · 0:06–0:12 · Setting: 1859, Pulau San Juan

Narasi: *"Tahun 1859, di Pulau San Juan, seorang petani Amerika bernama Lyman Cutler"*
Ingredient: `cutler_depan.png`, `wajah_2_senang.png` · Ekspresi: senang
Teks editing: "1859 · Pulau San Juan"

**Frame awal**
```
Wide establishing shot of a small green island covered in pine trees, surrounded by a calm blue sea, with distant snowy mountains on the horizon. On a gentle hill of the island: a small log cabin with a tiny US flag on a pole, a wooden fence, and neat rows of a potato garden. Lyman Cutler (the reference stickman: messy spiky brown hair, blue t-shirt, khaki shorts) stands small in the garden holding a hoe. Style: hand-drawn 2D stickman cartoon exactly matching the attached reference — thick slightly wobbly black ink outlines, flat colors, no shading, round white heads with dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors. No text.
```

**Video**
```
Slow, smooth camera push-in from the wide view of a small pine-covered island in a calm blue sea toward a little log cabin and potato garden on the hill. The shot ends on a medium shot of Lyman Cutler (messy spiky brown hair, blue t-shirt, khaki shorts) happily hoeing his potato rows; he pauses, wipes his forehead with his arm and smiles proudly at his potatoes. Seagulls drift across the sky, the small US flag by the cabin waves gently. Audio: gentle waves, seagulls, soft hoe digging into soil. Style: hand-drawn 2D stickman cartoon exactly matching the attached character reference — thick slightly wobbly black ink outlines, flat colors with no shading, round white heads with simple dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors, smooth simple 2D animation. No 3D, no realism, no on-screen text, no subtitles, no speech or dialogue.
```

### S03 · 0:12–0:18 · Babi terus mencuri kentang

Narasi: *"kesal karena babi milik perusahaan Inggris terus memakan kentangnya."*
Ingredient: `cutler_depan.png`, Babi, `wajah_6_marah.png` · Ekspresi: curiga → marah
Teks editing (opsional): "Hudson's Bay Company"

**Frame awal**
```
Medium-wide shot of Lyman Cutler's potato garden behind a wooden fence. In the foreground, the chubby pink pig with a Union Jack bandana digs into a potato row with its snout, dirt flying, a potato in its mouth. Behind it, Lyman Cutler (the reference stickman: messy spiky brown hair, blue t-shirt, khaki shorts) stands with a hoe, narrowed eyes and a suspicious, annoyed face. In the far background across the field, a farm building with a small British flag. Style: hand-drawn 2D stickman cartoon exactly matching the attached reference — thick slightly wobbly black ink outlines, flat colors, no shading, round white heads with dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors. No text.
```

**Video**
```
Comedic loop of frustration in a potato garden. Lyman Cutler (messy spiky brown hair, blue t-shirt, khaki shorts) waves his hoe and shoos the chubby pink pig with a Union Jack bandana out of the garden; the pig trots away past the fence. A moment later the pig pops up again from a different potato row with a fresh potato in its mouth, chewing happily. Cutler's face changes from annoyed to furious: eyebrows slam down, teeth clenched, he stomps his foot and small cartoon steam puffs shoot from his head. The pig looks at him and lets out a tiny burp. Audio: munching, quick trotting hooves, a comedic boing when the pig pops up, a small burp, an angry foot stomp. Style: hand-drawn 2D stickman cartoon exactly matching the attached character reference — thick slightly wobbly black ink outlines, flat colors with no shading, round white heads with simple dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors, smooth simple 2D animation. No 3D, no realism, no on-screen text, no subtitles, no speech or dialogue.
```

### S04 · 0:18–0:20 · Dor

Narasi: *"Ia pun menembak babi itu."*
Ingredient: `cutler_depan.png`, `wajah_6_marah.png` · Ekspresi: marah
Potong ke 2 detik di editor.

**Frame awal**
```
Medium shot of Lyman Cutler (the reference stickman: messy spiky brown hair, blue t-shirt, khaki shorts) in his potato garden, holding an old long wooden rifle at shoulder height, aiming toward off-screen right, one eye squinted, angry determined face. The pig is not visible. Style: hand-drawn 2D stickman cartoon exactly matching the attached reference — thick slightly wobbly black ink outlines, flat colors, no shading, round white heads with dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors. No text.
```

**Video**
```
Very quick action that happens within the first two seconds: Lyman Cutler (messy spiky brown hair, blue t-shirt, khaki shorts) squeezes the trigger of his old long rifle aimed off-screen right. A big round white cartoon smoke puff bursts out of the barrel and billows across the frame, the recoil blows his spiky hair back and makes him stumble one step. The target stays off-screen and is never shown. Then everything is still as the smoke slowly clears. Comedic and non-graphic. Audio: one loud old-musket bang, then sudden silence and a single cricket chirp. Style: hand-drawn 2D stickman cartoon exactly matching the attached character reference — thick slightly wobbly black ink outlines, flat colors with no shading, round white heads with simple dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors, smooth simple 2D animation. No 3D, no realism, no on-screen text, no subtitles, no speech or dialogue, no blood, no injury shown.
```

> Kalau Flow menolak karena unsur senjata, ganti kalimat aksinya dengan: *"Cutler lifts his old rifle; cut to a giant white cartoon smoke cloud with a comic star-shaped flash filling the whole frame, then the smoke clears to show Cutler blinking, his hair blown back."*

### S05 · 0:20–0:25 · Ancaman ditangkap

Narasi: *"Pemiliknya marah, lalu pihak Inggris mengancam menangkap Cutler."*
Ingredient: `cutler_depan.png`, Pemilik, Tentara · Ekspresi: takut (`wajah_5_takut.png`)

**Frame awal**
```
Medium-wide shot at the wooden fence of the potato garden. On the right, the British pig owner (tall stickman with a bushy gray mustache, brown bowler hat and long dark-green coat) stands with a red angry face, pointing at Cutler. Behind him, a British stickman soldier in a red coat and black shako hat holds up a pair of iron handcuffs. On the left, Lyman Cutler (the reference stickman: messy spiky brown hair, blue t-shirt, khaki shorts) leans back, scared, with sweat drops. Style: hand-drawn 2D stickman cartoon exactly matching the attached reference — thick slightly wobbly black ink outlines, flat colors, no shading, round white heads with dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors. No text.
```

**Video**
```
The British pig owner (tall stickman with a bushy gray mustache, brown bowler hat and long dark-green coat) stomps toward Lyman Cutler, his face turning red, wagging his finger furiously, his mustache bristling and his bowler hat bouncing. A British soldier in a red coat and black shako hat steps up beside him and dangles a pair of iron handcuffs. Lyman Cutler (messy spiky brown hair, blue t-shirt, khaki shorts) shrinks backward with a scared wobbly mouth, sweat drops flying off his head, hands raised defensively. Audio: heavy angry footsteps, clinking handcuffs, a nervous gulp. Style: hand-drawn 2D stickman cartoon exactly matching the attached character reference — thick slightly wobbly black ink outlines, flat colors with no shading, round white heads with simple dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors, smooth simple 2D animation. No 3D, no realism, no on-screen text, no subtitles, no speech or dialogue.
```

### S06 · 0:25–0:29 · Pulau yang diperebutkan

Narasi: *"Masalahnya, pulau tersebut memang sedang diperebutkan kedua negara."*
Ingredient: Tentara, `cutler_depan.png`

**Frame awal**
```
Top-down storybook view of a flat blue sea with a small green pine-covered island in the middle, a thick rope tied around it. On the left edge, a giant American stickman soldier in a navy-blue uniform and blue kepi cap grips one end of the rope; on the right edge, a giant British stickman soldier in a red coat and black shako hat grips the other end, a tug-of-war over the island. A tiny Lyman Cutler (messy spiky brown hair, blue t-shirt, khaki shorts) stands on the island. Style: hand-drawn 2D stickman cartoon exactly matching the attached reference — thick slightly wobbly black ink outlines, flat colors, no shading, round white heads with dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors. No text.
```

**Video**
```
Tug-of-war over an island. The giant American soldier on the left and the giant British soldier on the right both heave on the rope; the little pine-covered island slides left, then right, then left again, wobbling on the blue sea and making splashy cartoon waves. On the island, tiny Lyman Cutler (messy spiky brown hair, blue t-shirt, khaki shorts) hugs a pine tree to keep from falling off, eyes wide. Audio: creaking rope, effort grunts without words, splashing water, a comedic wobble sound. Style: hand-drawn 2D stickman cartoon exactly matching the attached character reference — thick slightly wobbly black ink outlines, flat colors with no shading, round white heads with simple dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors, smooth simple 2D animation. No 3D, no realism, no on-screen text, no subtitles, no speech or dialogue.
```

### S07 · 0:29–0:34 · Tentara vs kapal perang

Narasi: *"Amerika mengirim tentara, Inggris membalas dengan kapal perang."*
Ingredient: Tentara

**Frame awal**
```
Wide shot of a rocky beach on the island with pine trees behind. A line of American stickman soldiers in navy-blue jackets, light-blue trousers and blue kepi caps marches onto the beach carrying long muskets and a US flag, small white tents behind them. The bay on the right side of the frame is still empty water. Style: hand-drawn 2D stickman cartoon exactly matching the attached reference — thick slightly wobbly black ink outlines, flat colors, no shading, round white heads with dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors. No text.
```

**Video**
```
American stickman soldiers in navy-blue uniforms and blue kepi caps march in step onto the rocky beach and one of them plants a US flag firmly in the sand. The camera then pans right across the bay as a huge 19th-century British wooden warship with three masts, white sails, rows of cannon hatches and a Union Jack glides in; its cannon hatches flap open one after another and cannons roll out to face the beach. The American soldiers freeze and stare at it. Audio: marching drum and footsteps, then creaking wood, a ship bell, and heavy clunks as the cannons roll out. Style: hand-drawn 2D stickman cartoon exactly matching the attached character reference — thick slightly wobbly black ink outlines, flat colors with no shading, round white heads with simple dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors, smooth simple 2D animation. No 3D, no realism, no on-screen text, no subtitles, no speech or dialogue.
```

### S08 · 0:34–0:39 · Saling berhadapan karena seekor babi

Narasi: *"Dua kekuatan besar kini saling berhadapan hanya karena seekor babi."*
Ingredient: Tentara, Babi

**Frame awal**
```
Close-up on the sand of a beach: a tiny wooden grave marker shaped like a cartoon pig, with a half-eaten potato placed in front of it and a small daisy. Blurred hints of soldiers' boots on the left and right edges. Style: hand-drawn 2D stickman cartoon exactly matching the attached reference — thick slightly wobbly black ink outlines, flat colors, no shading, simple flat doodle background in soft muted colors. No text.
```

**Video**
```
The shot starts as a close-up of a tiny pig-shaped wooden grave marker on the sand with a half-eaten potato in front of it. The camera slowly pulls back and rises to reveal the full standoff: on the left, a big line of American stickman soldiers in navy-blue uniforms with muskets and two small cannons; on the right, British stickman soldiers in red coats with muskets and a huge wooden warship with cannons in the bay behind them. Everyone glares and aims at each other, and the tiny grave sits exactly in the middle between the two armies. A single leaf drifts across the empty space. Audio: tense silence, wind, one distant seagull. Style: hand-drawn 2D stickman cartoon exactly matching the attached character reference — thick slightly wobbly black ink outlines, flat colors with no shading, round white heads with simple dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors, smooth simple 2D animation. No 3D, no realism, no on-screen text, no subtitles, no speech or dialogue, no blood.
```

### S09 · 0:39–0:43 · Tidak ada yang menembak

Narasi: *"Untungnya, tak satu pun pihak melepaskan tembakan."*
Ingredient: Tentara

**Frame awal**
```
Medium-wide shot of the beach standoff. In the foreground left, sweating American stickman soldiers in navy-blue uniforms aim trembling muskets; on the right, British stickman soldiers in red coats aim back. On the deck of the British wooden warship in the background, a British admiral stickman in a dark-blue naval coat with gold epaulettes and a black bicorne hat looks through a brass telescope. Style: hand-drawn 2D stickman cartoon exactly matching the attached reference — thick slightly wobbly black ink outlines, flat colors, no shading, round white heads with dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors. No text.
```

**Video**
```
Soldiers on both sides sweat, their muskets trembling. On the warship deck, the British admiral in a dark-blue naval coat and black bicorne hat lowers his brass telescope, shakes his head and raises one hand: hold fire. One by one, every soldier on both sides lowers his musket, the ship's cannons slide back inside, and everyone's shoulders drop as they let out a big relieved breath. A seagull lands on top of a cannon. Audio: tense heartbeat that stops, cannons rolling back with a clunk, a crowd of relieved sighs, a seagull squawk. Style: hand-drawn 2D stickman cartoon exactly matching the attached character reference — thick slightly wobbly black ink outlines, flat colors with no shading, round white heads with simple dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors, smooth simple 2D animation. No 3D, no realism, no on-screen text, no subtitles, no speech or dialogue.
```

### S10 · 0:43–0:48 · Arbitrase 1872

Narasi: *"Sengketa itu akhirnya diselesaikan melalui arbitrase pada tahun 1872"*
Ingredient: `stickman_sheet.webp` (gaya saja)
Teks editing: "1872"

Catatan fakta: arbiternya Kaisar Wilhelm I dari Jerman (keputusan 21 Oktober 1872), jadi digambar dengan helm berpaku Prusia.

**Frame awal**
```
A grand formal room with tall windows and red curtains. Behind a big wooden desk sits an elderly stickman arbiter, a German emperor with big white bushy sideburns and mustache, a spiked Prussian helmet and a dark military coat, reading a thick stack of documents. On the left side of the desk sits an American diplomat stickman in a black top hat and dark suit; on the right sits a British diplomat stickman in a gray suit and bowler hat. Both wait stiffly. Style: hand-drawn 2D stickman cartoon exactly matching the attached reference — thick slightly wobbly black ink outlines, flat colors, no shading, round white heads with dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors. No text.
```

**Video**
```
In a grand formal room, the elderly arbiter with big white sideburns and a spiked Prussian helmet flips through a thick stack of papers, glances at the American diplomat in a black top hat on the left, then at the British diplomat in a bowler hat on the right. Both diplomats lean forward nervously. The arbiter presses a big red wax seal onto the final page and taps a wooden gavel once on the desk. Audio: rustling paper, a ticking clock, a firm wax-seal thump, one gavel knock. Style: hand-drawn 2D stickman cartoon exactly matching the attached character reference — thick slightly wobbly black ink outlines, flat colors with no shading, round white heads with simple dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors, smooth simple 2D animation. No 3D, no realism, no on-screen text, no readable writing on the papers, no subtitles, no speech or dialogue.
```

### S11 · 0:48–0:52 · San Juan milik Amerika

Narasi: *"dan Pulau San Juan menjadi milik Amerika."*
Ingredient: `cutler_depan.png`, `wajah_2_senang.png`, Tentara · Ekspresi: senang

**Frame awal**
```
Sunny beach of the island with a tall wooden flagpole in the center flying a Union Jack. A British stickman soldier in a red coat stands at the pole holding the rope. Lyman Cutler (the reference stickman: messy spiky brown hair, blue t-shirt, khaki shorts) stands beside the pole looking up hopefully, holding a potato. A British wooden warship sits in the bay behind. Style: hand-drawn 2D stickman cartoon exactly matching the attached reference — thick slightly wobbly black ink outlines, flat colors, no shading, round white heads with dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors. No text.
```

**Video**
```
The British soldier lowers the Union Jack down the flagpole, and a US flag is hoisted up to the top where it waves in the breeze. In the bay behind, the British wooden warship turns and sails away into the distance. Lyman Cutler (messy spiky brown hair, blue t-shirt, khaki shorts) jumps for joy with a wide happy smile, lifting his potato above his head like a trophy. Audio: short cheerful brass fanfare, flag flapping, a happy jump thud. Style: hand-drawn 2D stickman cartoon exactly matching the attached character reference — thick slightly wobbly black ink outlines, flat colors with no shading, round white heads with simple dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors, smooth simple 2D animation. No 3D, no realism, no on-screen text, no subtitles, no speech or dialogue.
```

### S12 · 0:52–0:58 · Punchline: satu-satunya korban

Narasi: *"Bagian paling absurd, satu-satunya korban dalam perang babi ini, ya babinya sendiri."*
Ingredient: Babi (versi hantu), `cutler_depan.png`, `wajah_1_cemas.png` · Ekspresi: cemas / canggung

**Frame awal**
```
Cutler's potato garden at golden sunset. A tiny pig-shaped wooden grave marker stands in the soil with a potato in front of it. Floating above it is the pig as a translucent white ghost with a golden halo, tiny angel wings and the Union Jack bandana, chewing a ghostly potato. Lyman Cutler (the reference stickman: messy spiky brown hair, blue t-shirt, khaki shorts) stands beside the grave looking up with an awkward, worried, guilty face. Style: hand-drawn 2D stickman cartoon exactly matching the attached reference — thick slightly wobbly black ink outlines, flat colors, no shading, round white heads with dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors. No text.
```

**Video**
```
In a potato garden at golden sunset, the ghost of the pig, translucent white with a golden halo, tiny flapping angel wings and a Union Jack bandana, floats slowly upward from a tiny pig-shaped grave marker, still chewing a ghostly potato. It turns to look straight into the camera with a flat, deadpan expression and blinks slowly. Below, Lyman Cutler (messy spiky brown hair, blue t-shirt, khaki shorts) looks up with an awkward guilty face and gives a small, sheepish wave. The camera slowly pushes in on the ghost pig's deadpan face. Audio: a soft heavenly choir chord without words, ghostly munching, a single cricket. Style: hand-drawn 2D stickman cartoon exactly matching the attached character reference — thick slightly wobbly black ink outlines, flat colors with no shading, round white heads with simple dot eyes, thin black stick limbs with rounded black mitten hands, simple flat doodle background in soft muted colors, smooth simple 2D animation. No 3D, no realism, no on-screen text, no subtitles, no speech or dialogue, no blood.
```

---

## Tips konsistensi

- **Selalu lampirkan `cutler_depan.png`** di setiap adegan yang ada Cutler, meski agent sudah menerima brief.
- Kalau gaya mulai bergeser (garis jadi tipis, muncul bayangan/3D), tambahkan di awal prompt: `Match the attached reference style exactly.`
- Kalau Cutler muncul lebih dari satu, tambahkan: `Only one Cutler in the frame.`
- Kalau Veo menambahkan teks atau bicara, generate ulang dengan kalimat `no on-screen text, no speech` dipindah ke awal prompt.
- Simpan frame terakhir klip yang bagus dan pakai sebagai frame awal adegan berikutnya bila lokasinya sama (S02 ke S03, S07 ke S08 ke S09) agar latar tetap sambung.

## Fakta pendukung

- 15 Juni 1859: Lyman Cutler menembak babi milik Charles Griffin, pengelola peternakan Hudson's Bay Company (perusahaan Inggris), yang memakan kentangnya. Otoritas Inggris mengancam menangkap Cutler.
- AS mengirim Kapten George Pickett dengan sekitar 64 tentara. Inggris mengirim kapal perang. Laksamana Muda Robert Baynes menolak memulai perang "karena urusan seekor babi".
- Pulau diduduki bersama sampai 1872. Arbiter Kaisar Wilhelm I dari Jerman memutuskan sengketa untuk AS pada 21 Oktober 1872.
- Tidak ada tembakan antara kedua pihak. Korban satu-satunya adalah babinya.
