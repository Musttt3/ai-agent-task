# Prompt Gambar per Timestamp — "Pulau yang Lupa" (Stickman Horror-Misteri)

Untuk Google Flow (agent batch image). Prompt ditulis dalam bahasa Inggris karena model gambar lebih akurat dengan bahasa Inggris; narasi asli tetap dicantumkan sebagai acuan.

---

## 1. Cara pakai di Google Flow

1. Upload **character sheet stickman** kamu sebagai *Ingredient / reference image*, beri nama **Character A**.
2. (Disarankan) Buat dulu reference sheet untuk **Character B (sahabat)** pakai prompt di bagian 3, lalu upload juga sebagai ingredient. Tanpa ini, wajah/baju sahabat bisa berubah-ubah antar gambar.
3. Tempel **Instruksi Agent** (bagian 2) ke agent Flow, lalu tempel daftar prompt (bagian 5) sekaligus atau per blok.
4. Aspect ratio: **16:9**. Teks/subtitle sebaiknya ditambahkan saat editing; hanya adegan yang memang butuh tulisan (catatan, dinding, layar) yang memuat teks.

---

## 2. Instruksi Agent (tempel sekali di awal)

```
You will generate one 16:9 image for EACH numbered line below. Keep the file name = the timestamp (e.g. 0-00.png, 5-25a.png).

GLOBAL STYLE (apply to every image):
Simple hand-drawn 2D stickman cartoon, thick clean black ink outlines, flat colors, minimal shading, round white heads with simple dot eyes and expressive eyebrows/mouth, thin black stick arms and legs with small black mitten hands, exactly like the uploaded character sheet. Backgrounds are simple flat illustrations with muted, desaturated colors (grey-green, dusty blue, pale ochre) to create an eerie horror-mystery mood. Night/indoor scenes use dark teal shadows with a single warm light source. No gore, no realistic rendering, no 3D, no photorealism. No text, letters or captions unless the line explicitly asks for written text.

CHARACTERS (keep identical in every image):
[A] = the protagonist from the uploaded reference sheet: round white head, messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki/beige shorts, black stick limbs.
[B] = the best friend: same stickman style, round white head, short neat black hair with a small side fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts, black stick limbs.
Extras (villagers, fisherman, officer, old man) use the same stickman style with different simple hair/clothes, never blue t-shirt + khaki shorts, never mustard-yellow t-shirt.

Use the facial expressions from the reference sheet (worried, happy, suspicious, shocked, scared, angry) whenever a line mentions an emotion.
```

---

## 3. Prompt reference sheet Character B (sahabat) — buat duluan

```
Character turnaround sheet, white background, same hand-drawn stickman style as the uploaded reference: round white head, short neat black hair with a small side fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts, thin black stick limbs, small black mitten hands. Top row: front view, side view, back view, full body standing. Bottom row: six head close-ups with expressions: worried, happy, suspicious, shocked, scared, angry. Thick black outlines, flat colors, no text.
```

---

## 4. Konsistensi properti (sudah dimasukkan ke prompt)

| Properti | Deskripsi tetap |
|---|---|
| Buku catatan bersama | buku tulis cokelat dengan tali karet |
| Buku kecil sahabat | buku saku bersampul biru tua |
| Pintu belakang | pintu besi merah kusam dililit rantai & gembok |
| Klinik | bangunan kecil putih kusam satu lantai di bukit, papan "KLINIK" |
| Radio | radio portabel abu-abu dengan antena |
| Alat perekam | voice recorder hitam kecil, stiker "01" di belakang |

---

## 5. Daftar prompt per timestamp

### Bagian 1 — Pembuka (0:00–0:25)

0:00 — *Sudah enam hari kamu terjebak di pulau yang dilanda wabah misterius.*
```
[A] standing alone on a grey foggy beach of a small tropical island, worried expression, abandoned wooden boats and a broken fishing net around, overcast sky, eerie quiet mood, wide shot.
```

0:05 — *Pagi ini, sahabatmu menatapmu dengan ketakutan dan bertanya,*
```
Inside a shabby clinic room in pale morning light, [B] stands against the wall staring at [A] with a scared expression, [A] in foreground seen from behind-shoulder, tense atmosphere.
```

0:10 — *"Kamu siapa?"*
```
Close-up of [B]'s face, scared expression, wide eyes, mouth trembling, sweat drops, dim clinic background, dramatic framing.
```

0:11 — *Padahal semalam kalian masih berbicara seperti biasa.*
```
Warm flashback scene in soft sepia tones: [A] and [B] sitting on the floor of a clinic waiting room at night, laughing together beside a small lantern, cozy and friendly mood.
```

0:15 — *Dan sebelum hari ini berakhir,*
```
[A] standing at a clinic window looking out at the island as an orange sun sinks into a dark sea, long shadows, ominous mood, back view.
```

0:17 — *kamu akan menemukan sesuatu yang jauh lebih mengerikan.*
```
[A] with a shocked expression in a dark clinic corridor, a red iron door wrapped in chains glowing faintly at the far end, deep shadows, horror atmosphere.
```

0:21 — *Mungkin selama ini, kamu juga sudah kehilangan ingatan.*
```
[A] holding his head with both hands, worried expression, small memory pictures (photos of a beach, a friend, a boat) floating around his head and dissolving into dust, dark teal background.
```

### Bagian 2 — Awal wabah (0:25–1:22)

0:25 — *Semuanya dimulai ketika kalian datang ke pulau kecil untuk berlibur.*
```
Bright sunny flashback: [A] and [B] smiling happily on the deck of a small passenger ferry with backpacks, a small green island ahead, blue sea, cheerful mood.
```

0:30 — *Hanya ada sebuah pelabuhan, beberapa permukiman, dan klinik kesehatan di dekat bukit.*
```
Wide establishing shot of a small island: a little wooden harbor, a handful of simple houses, and a small white one-story clinic on a hill with a sign "KLINIK", flat illustrated landscape, slightly muted colors.
```

0:35 — *Pada hari pertama, seorang nelayan ditemukan berjalan tanpa tujuan.*
```
A stickman fisherman with a straw hat and striped shirt wandering aimlessly on a wooden pier, blank empty eyes, holding a fishing rod upside down, villagers watching from a distance.
```

0:40 — *Ia lupa alamat rumahnya.*
```
The straw-hat fisherman standing confused in front of a row of identical small houses, question marks floating above his head, worried expression.
```

0:42 — *Besoknya, seorang pedagang tidak mengenali anaknya sendiri.*
```
A stickman market vendor with a headscarf behind a fruit stall staring blankly at a small crying child who reaches out to her, sad and unsettling mood.
```

0:46 — *Lebih banyak penduduk mulai melupakan percakapan yang baru saja terjadi.*
```
Two stickman villagers talking on a village street; one speaks while the other has a completely blank face and an empty speech bubble fading away, other villagers in background also looking lost.
```

0:51 — *Dalam tiga hari, kepanikan menyebar ke seluruh pulau.*
```
Chaotic village street, stickman villagers running in different directions carrying bags, a dropped basket of fish, [A] and [B] watching worriedly from the side, dusty air.
```

0:54 — *Tak seorang pun tahu penyebabnya.*
```
A group of stickman villagers huddled in a circle with confused and scared expressions, one huge dark question mark shadow looming over them.
```

0:56 — *Ada yang menuduh air minum, ada yang menyebut penyakit menular.*
```
Split composition: left side a villager angrily pointing at an old water well and a bucket; right side a villager wearing a face mask pointing at another coughing villager, tension between them.
```

1:01 — *Petugas kesehatan hanya bisa memastikan satu hal.*
```
A stickman health worker in a white coat, face mask and clipboard standing in front of the clinic speaking to a worried crowd, serious expression.
```

1:04 — *Sebagian penderita masih mengingat masa kecil, tetapi kesulitan menyimpan ingatan baru.*
```
A stickman patient sitting on a clinic bed; above his head a clear bright thought bubble showing a childhood memory (a kid flying a kite), while new memories leak out of the back of his head like falling sand.
```

1:10 — *Kapal penumpang berhenti beroperasi.*
```
A passenger ferry tied to the dock with no passengers, ropes slack, grey sky, empty ticket booth, lonely mood.
```

1:13 — *Pelabuhan ditutup. Telepon mulai sulit tersambung.*
```
[A] holding up a phone showing a no-signal icon, worried expression, behind him the harbor gate closed with a striped barrier and a chain.
```

1:16 — *Kalian gagal meninggalkan pulau,*
```
[A] and [B] sitting dejected on the edge of an empty pier with their backpacks, looking at the empty sea, grey overcast sky.
```

1:18 — *lalu berlindung di klinik yang tiba-tiba ditinggalkan petugasnya.*
```
[A] and [B] cautiously entering the small white clinic on the hill at dusk, the front door hanging open, nobody inside, papers blowing across the floor.
```

### Bagian 3 — Kilas balik evakuasi (1:22–2:00)

1:22 — *Sebelum pelabuhan ditutup,*
```
Faded sepia flashback of the busy harbor still open, villagers walking around with bags, [A] and [B] in the crowd.
```

1:24 — *kalian sempat melihat seorang petugas menempel pengumuman evakuasi.*
```
A stickman officer in a uniform cap taping a paper notice onto a wooden harbor wall, the notice shows a simple boat icon, [A] and [B] watching from behind, sepia flashback tones.
```

1:28 — *Ia meminta penduduk berkumpul di dermaga sebelum matahari terbenam.*
```
A crowd of stickman villagers gathering on a long wooden pier at sunset, orange sky, everyone looking toward the sea, waiting.
```

1:33 — *Tetapi ketika kalian tiba, kapal yang dijanjikan tidak pernah datang.*
```
[A] and [B] standing at the end of the pier staring at an empty horizon at dusk, no boat anywhere, disappointed and worried expressions.
```

1:38 — *Yang tersisa hanya koper-koper terbuka dan sandal berserakan.*
```
Close-up of a deserted pier: open suitcases with clothes spilling out, scattered flip-flops, a lost hat, no people, eerie dusk light.
```

1:42 — *Seorang pria tua terus mengulang bahwa putrinya sedang menjemput,*
```
An old stickman man with white hair and a walking cane sitting on a crate on the pier, smiling blankly and pointing at the sea, [A] and [B] looking at him with concern.
```

1:46 — *meskipun ia sendiri baru saja melihat putrinya dibawa ke klinik.*
```
Memory inset: the same old man standing on a path watching a stickman young woman being carried on a stretcher by two health workers toward the clinic on the hill.
```

1:50 — *Kamu ingin menolongnya, tetapi sahabatmu menarik lenganmu.*
```
[A] reaching a hand toward the old man on the pier while [B] firmly pulls [A]'s other arm away, [B] has a worried expression.
```

1:54 — *Kalian tidak tahu apa yang akan terjadi jika tetap di pelabuhan sampai malam.*
```
[A] and [B] hurrying away from the darkening harbor, night falling, long eerie shadows stretching from the empty pier, the old man a small lonely silhouette behind them.
```

### Bagian 4 — Buku catatan & janji (2:00–2:29)

2:00 — *Di ruang tunggu, kalian menemukan kursi terbalik,*
```
Abandoned clinic waiting room, plastic chairs knocked over, flickering ceiling lamp, [A] and [B] standing at the doorway, cautious expressions.
```

2:03 — *berkas berserakan,*
```
Close-up of the clinic floor covered with scattered patient files and papers, a fallen clipboard, footprints in dust.
```

2:07 — *dan pesan di dinding: "Kalau mulai lupa, tulis semuanya."*
```
A handwritten paper note taped on a clinic wall that reads "KALAU MULAI LUPA, TULIS SEMUANYA", [A] and [B] reading it from behind, dim light.
```

2:10 — *Sejak itu, kalian membuat buku catatan bersama.*
```
[A] and [B] sitting together on the floor, opening a brown notebook with an elastic band, pen in [A]'s hand, small lantern beside them.
```

2:13 — *Setiap pagi kamu menuliskan tanggal, persediaan makanan, dan tempat kalian berada.*
```
Close-up of [A] writing in the brown notebook in soft morning light; the page shows simple doodles of a calendar, a water bottle, biscuits and a little map of the clinic.
```

2:18 — *Kalian berjanji, siapapun yang masih mengingat harus membantu temannya.*
```
[A] and [B] making a pinky promise over the open brown notebook, serious but warm expressions, lantern light.
```

2:24 — *Janji sederhana itu terasa penting, meskipun kalian berharap tidak perlu menggunakannya.*
```
Back view of [A] and [B] sitting side by side by a window at night, the notebook between them, moonlight, quiet bittersweet mood.
```

### Bagian 5 — Hari ke-6 (2:29–3:24)

2:29 — *Pada hari ke-6, kamu terbangun sendirian.*
```
[A] waking up on a thin mattress in the clinic waiting room, sitting up, confused expression, the spot next to him empty, cold morning light.
```

2:32 — *Selimut sahabatmu tergeletak di lantai.*
```
Close-up of a crumpled empty blanket on the clinic floor next to an empty mattress, ominous mood.
```

2:35 — *Lalu terdengar suara barang jatuh dari ruang pemeriksaan.*
```
[A] turning sharply toward a door labeled "RUANG PERIKSA", shocked expression, impact lines coming from behind the door.
```

2:38 — *Ketika pintunya dibuka, ia berdiri di sudut sambil menggenggam gunting.*
```
[A] opening the examination room door; inside, [B] stands pressed into a corner holding a pair of scissors, scared expression, a fallen medical tray on the floor.
```

2:43 — *Kamu memanggil namanya.*
```
[A] stepping forward with one hand gently outstretched, calling out, worried expression, [B] in the corner.
```

2:44 — *Ia malah mundur, mengangkat gunting, dan berteriak.*
```
[B] backing into the wall raising the scissors defensively in front of him, screaming with a scared expression, [A] stopping in surprise.
```

2:48 — *"Jangan dekat-dekat! Kamu siapa?"*
```
Close-up of [B] shouting, scared and angry expression, scissors raised, motion lines, dramatic low angle.
```

2:50 — *Tidak ada tanda ia sedang bercanda. Wajahnya benar-benar ketakutan.*
```
Extreme close-up of [B]'s eyes trembling with fear, tears forming, sweat drops, dark background.
```

2:55 — *Kamu menunjukkan buku catatan dan foto kalian berdua.*
```
[A] slowly holding out the brown notebook in one hand and a phone in the other, calm pleading expression, [B] still wary in the corner.
```

2:59 — *Ia melihat wajahnya di layar ponsel, lalu membaca seluruh halaman pertama.*
```
[B] holding the phone showing a selfie of [A] and [B] smiling together on a ferry, the brown notebook open in his other hand, confused expression.
```

3:04 — *Perlahan, tangannya turun.*
```
[B] slowly lowering the scissors to his side, expression softening from fear to confusion, [A] watching hopefully.
```

3:06 — *"Aku percaya tulisan ini," katanya.*
```
[B] holding the brown notebook against his chest, calm but sad expression, looking at the floor.
```

3:09 — *"Tapi aku sama sekali tidak ingat kamu."*
```
[B] looking at [A] with a polite distant expression like meeting a stranger, [A] heartbroken, a visible gap between them.
```

3:11 — *Kalimat itu membuat dadamu sesak.*
```
[A] alone with a hand on his chest, sad worried expression, a small crack drawn over his chest, dark blue background.
```

3:14 — *Orang yang bertahun-tahun mengenalmu, kini memandangmu seperti orang asing.*
```
Split frame: left side faded memories of [A] and [B] laughing together over the years; right side [B] today staring at [A] blankly.
```

3:19 — *Air bersih tinggal satu botol, dan makanan hanya beberapa bungkus biskuit.*
```
Close-up of a small table: one water bottle and three small biscuit packets, an empty water jug tipped over, dim light.
```

### Bagian 6 — Mencari gudang (3:24–4:24)

3:24 — *Kalian harus bergerak!*
```
[A] grabbing his backpack with a determined expression, the brown notebook tucked under his arm.
```

3:26 — *Kamu mengajaknya mencari gudang persediaan.*
```
[A] gesturing toward a dark corridor, inviting [B] to follow; [B] hesitating but stepping forward.
```

3:28 — *Sepanjang koridor, ia terus menanyakan pertanyaan yang sama.*
```
[A] and [B] walking down a long dim clinic corridor with doors on both sides, [B] behind with a confused expression.
```

3:32 — *"Kita di mana?"*
```
[B] stopping and looking around with a confused worried expression, question marks above his head, corridor background.
```

3:33 — *Lima menit kemudian, pertanyaan itu muncul lagi.*
```
Same corridor, a wall clock showing five minutes later, [B] asking again with the same confused face, [A] looking tired.
```

3:36 — *Kamu mencoba menguji ingatannya dengan tiga kata.*
```
[A] facing [B] and holding up three fingers, patient expression, [B] listening attentively.
```

3:39 — *"Kunci, gelas, jam."*
```
Three simple icons floating in the air between [A] and [B]: a key, a drinking glass and a clock, clearly drawn.
```

3:42 — *Setelah berjalan sebentar, ia tidak mampu mengulang satupun.*
```
[B] with a blank face; the three icons (key, glass, clock) above his head fading and crumbling into dust.
```

3:46 — *Kamu ingin marah karena lelah mengulang jawaban.*
```
[A] with an angry frustrated expression, clenched fists, steam lines, [B] unaware in background.
```

3:49 — *Tetapi melihat kebingungannya, kamu justru merasa bersalah.*
```
[A] looking down with a guilty sad expression, hand on the back of his neck, [B] looking lost and small beside him.
```

3:53 — *Gudang akhirnya ditemukan, terkunci dari luar.*
```
A storage door with a sign "GUDANG" locked with a heavy padlock, [A] tugging the handle unsuccessfully.
```

3:56 — *Kunci cadangan terselip di laci meja pendaftaran.*
```
[A] pulling open a drawer of a dusty reception desk and finding a small key on a ring, surprised happy expression.
```

3:59 — *Di dalamnya ada makanan kemasan, beberapa botol air, senter, dan radio portabel.*
```
Inside the storage room: metal shelves with packaged food, several water bottles, a flashlight and a grey portable radio with antenna, a beam of light from the open door.
```

4:05 — *Kalian hampir bersorak!*
```
[A] and [B] with happy expressions, arms half raised in celebration in front of the stocked shelves.
```

4:06 — *Saat radio dinyalakan, suara berdesis memenuhi ruangan.*
```
[A] switching on the grey portable radio, zigzag static lines filling the room, [B] covering his ears.
```

4:10 — *Setelah beberapa kali memutar frekuensi, muncul pesan terputus-putus.*
```
Close-up of a stick hand turning the radio's tuning dial, broken sound wave lines coming from the speaker.
```

4:15 — *"Untuk siapapun yang masih di klinik, jangan buka pintu belakang."*
```
[A] and [B] leaning close to the radio, tense scared expressions, a faint ghostly image of a chained red door appearing in the sound waves.
```

4:19 — *Pesan itu kemudian berulang dari awal.*
```
The radio on a shelf with a circular looping arrow symbol around it, [A] and [B] exchanging uneasy glances.
```

4:22 — *Rupanya rekaman otomatis.*
```
[A] with a realizing suspicious expression staring at the glowing radio in the dark storage room, [B] behind him.
```

### Bagian 7 — Botol air (4:24–5:00)

4:24 — *Saat menemukan air, kamu segera memberi sahabatmu satu botol.*
```
[A] holding out a water bottle toward [B] with a kind smile.
```

4:28 — *Ia menolak karena mengira kalian belum saling mengenal.*
```
[B] raising a hand politely refusing the bottle, awkward wary expression, stepping back slightly.
```

4:31 — *Kamu menjelaskan kembali bahwa kalian sudah berteman lama.*
```
[A] gesturing while explaining earnestly, the brown notebook open in his hand, [B] listening.
```

4:35 — *Ia bertanya apa yang biasanya kalian lakukan bersama.*
```
[B] tilting his head with a curious expression, small question mark, [A] about to answer.
```

4:38 — *Perjalanan, pertengkaran kecil, dan malam-malam saling menemani.*
```
Three warm memory bubbles above [A] and [B]: hiking together with backpacks, a small silly argument with crossed arms, sitting together at night comforting each other.
```

4:45 — *Ia tersenyum tipis, tetapi senyum itu menghilang...*
```
[B] with a faint small smile that is fading on one side, the warm memory bubbles popping above him.
```

4:49 — *"Kenapa aku tidak bisa mengingat semua itu?"*
```
[B] holding his head with a sad worried expression, eyes watery, dim storage room.
```

4:52 — *Kamu tidak punya jawaban.*
```
[A] silent, looking down, mouth closed, no words, empty space between them.
```

4:54 — *Kamu menyimpan botol tersebut di tangannya.*
```
Close-up of [A]'s hands gently placing the water bottle into [B]'s hands.
```

### Bagian 8 — Pintu besi merah (5:00–6:00)

5:00 — *Kamu mengikuti koridor menuju belakang klinik.*
```
[A] and [B] walking down a narrow dark corridor toward the back of the clinic, [A] holding a flashlight, flickering lights.
```

5:02 — *Di ujungnya berdiri pintu besi merah terlilit rantai.*
```
At the end of the corridor, a rusty red iron door wrapped in heavy chains with a padlock, lit by the flashlight beam, ominous.
```

5:06 — *Goresan panjang seperti bekas sesuatu yang diseret.*
```
Close-up of the corridor wall beside the red door with long scratch marks dragged along the paint toward the door, flashlight beam.
```

5:11 — *Sahabatmu berhenti mendadak.*
```
[B] freezing mid-step, stiff posture, eyes fixed forward, [A] turning back to look at him.
```

5:13 — *Ia menatap pintu, lalu berbisik.*
```
[B] staring at the chained red door with a shocked expression, whisper lines from his mouth.
```

5:16 — *"Aku pernah ada di sini."*
```
Close-up of [B] whispering, wide eyes, red glow of the door reflected on his face.
```

5:18 — *"Di baliknya ada seseorang."*
```
[B] pointing at the red door; through the gap under the door a faint shadow of feet is visible, horror mood.
```

5:19 — *Kamu memintanya menjelaskan, namun beberapa detik kemudian ia mengerutkan dahi.*
```
[A] holding [B]'s shoulder asking urgently, [B] frowning with a suspicious confused expression.
```

5:25a — *"Pintu apa?"*
```
[B] looking at [A] with a completely blank confused face, the red door behind him ignored.
```

5:25b — *Ingatan yang baru muncul itu sudah hilang.*
```
A small glowing memory image of the red door floating from [B]'s head and dissolving into dust, [A] watching helplessly.
```

5:29 — *Tiba-tiba terdengar ketukan.*
```
The red chained door with bold impact lines in the center, [A] and [B] jumping back in shock.
```

5:30 — *Tiga kali dari sisi lain pintu.*
```
Close-up of the red iron door with three impact marks one after another, chains rattling, dust falling.
```

5:33 — *Tok, tok, tok.*
```
[A] and [B] pressed together in the corridor with scared expressions, the red door vibrating in the background, flashlight shaking.
```

5:36 — *Sahabatmu ingin membukanya.*
```
[B] stepping toward the red door reaching for the chain, determined expression.
```

5:38 — *Mungkin ada orang yang membutuhkan pertolongan.*
```
[B] turning to [A] with a pleading expression, one hand on the chain.
```

5:41 — *Kamu mengingat pesan radio dan menahan tangannya.*
```
[A] grabbing [B]'s wrist firmly to stop him, a ghostly radio icon above [A]'s head as a reminder.
```

5:44 — *Kalian bertengkar.*
```
[A] and [B] arguing face to face with angry expressions, jagged lines between them, red door in background.
```

5:46 — *"Katamu kita harus saling percaya."*
```
[B] speaking with a hurt expression, hand on his chest, the brown notebook in his other hand.
```

5:48 — *Ucapnya dengan mata berkaca-kaca.*
```
Close-up of [B]'s teary eyes, glistening tears, sad expression.
```

5:50 — *"Tapi kamu memperlakukanku seperti ancaman."*
```
[B] pointing at [A] with a hurt angry expression, [A] stepping back.
```

5:53 — *Kamu terdiam.*
```
[A] standing silent, head lowered, flashlight pointing at the floor.
```

5:54 — *Akhirnya kalian sepakat mencari informasi terlebih dahulu.*
```
[A] and [B] nodding to each other and walking away from the red door down the corridor.
```

5:57 — *Meski ketukan itu terus terbayang di kepala.*
```
[A] glancing back over his shoulder at the distant red door, faint knock lines echoing in the dark.
```

### Bagian 9 — Ruang arsip (6:00–7:16)

6:00 — *Di ruang arsip, kamu menemukan alat perekam kecil.*
```
A dusty archive room with metal shelves and file boxes, [A] picking up a small black voice recorder from a desk, flashlight beam.
```

6:04 — *Suara petugas terdengar ketika tombolnya ditekan.*
```
Close-up of [A]'s finger pressing play on the black voice recorder, sound wave lines coming out, [B] leaning in.
```

6:07 — *"Catatan hari kelima."*
```
Ghostly translucent memory scene: the stickman health worker in a white coat speaking into the same voice recorder at a desk, tired expression.
```

6:08 — *"Beberapa pasien kehilangan ingatan setelah tidur."*
```
Clinic ward with stickman patients sleeping in beds, faint wisps of light rising from their heads and disappearing, dark blue night.
```

6:11 — *"Yang lain lupa dalam hitungan menit."*
```
A stickman patient sitting next to a ticking clock, a thought bubble emptying quickly, blank face.
```

6:13 — *"Nomor satu masih mampu menyembunyikan gejalanya."*
```
A mysterious stickman silhouette in dark shadow with a hospital tag "01" on the wrist, face hidden, standing behind a curtain.
```

6:16 — *Rekaman berhenti akibat suara benturan.*
```
The voice recorder in [A]'s hand with a sharp jagged impact symbol bursting from the speaker, [A] flinching.
```

6:19 — *Disusul teriakan singkat.*
```
[A] and [B] with horrified shocked expressions, the recorder dropping from [A]'s hand, dark room.
```

6:21 — *Di bagian belakang alat tertulis angka 01.*
```
Close-up of the back of the black voice recorder with a white sticker clearly showing "01".
```

6:24 — *Kalian menemukan daftar pasien dalam map berdebu.*
```
[A] blowing dust off an old cardboard folder and opening it on the desk, [B] holding the flashlight.
```

6:27 — *Nomor dua adalah sahabatmu.*
```
Close-up of a patient list page: row "02" with a small photo of [B] clipped to it.
```

6:29 — *Nama pasien nomor satu sudah dicoret hitam.*
```
Close-up of the same list: row "01" with the name completely scribbled out in thick black marker, no photo.
```

6:32 — *Sebelum meninggalkan ruang arsip,*
```
[A] and [B] at the archive room doorway about to leave, [A] glancing back into the room.
```

6:34 — *Jam dinding berhenti pada pukul 2 lewat 3 menit.*
```
A round wall clock with a cracked glass stopped at 2:03, dust and cobwebs, eerie light.
```

6:38 — *Di lantai tergeletak kartu akses dengan ujung patah.*
```
Close-up of a white plastic access card with a broken corner lying on the dusty floor.
```

6:41 — *Kartu itu memiliki bekas noda merah tua,*
```
Close-up of the broken access card with a small dark reddish-brown stain on its edge, not graphic, dim light.
```

6:44 — *tetapi kamu tidak berani memastikan asalnya.*
```
[A] crouching with his hand hovering hesitantly above the card, worried scared expression.
```

6:47 — *Sahabatmu menunjuk foto petugas yang tergantung di dinding.*
```
[B] pointing at a framed photo on the wall showing a stickman staff member in a white coat, [A] turning to look.
```

6:50 — *"Aku pernah melihat orang ini," katanya.*
```
[B] staring at the framed staff photo with a serious suspicious expression.
```

6:53 — *Kamu buru-buru bertanya kapan.*
```
[A] holding [B]'s shoulders and asking eagerly, urgent expression.
```

6:55 — *Ia memejamkan mata, berusaha mengingat,*
```
[B] with eyes squeezed shut, straining to remember, hands on his temples.
```

6:58 — *lalu mulai menangis.*
```
[B] crying with tears streaming, scared sad expression.
```

7:00 — *Semakin keras ia mencoba,*
```
[B] gripping his head, swirling spiral lines around it.
```

7:01 — *semakin bingung dirinya.*
```
[B] with a tangled black scribble cloud above his head, lost confused expression.
```

7:03 — *Kamu berhenti bertanya dan mengajaknya keluar.*
```
[A] putting an arm around [B]'s shoulders and gently leading him out of the archive room.
```

7:07 — *Untuk pertama kalinya,*
```
[A] standing in the corridor looking back at the archive door, thoughtful expression.
```

7:08 — *kamu takut mencari jawaban justru menyakitinya.*
```
[A] with a worried expression looking at [B] who sits curled up against the wall, fragile mood.
```

7:11 — *Di bawah angka itu tercatat,*
```
Close-up of the patient list row "01" with a short handwritten note underneath it.
```

7:13 — *"tidak menyadari kehilangan ingatannya sendiri."*
```
Close-up of a handwritten note on a patient file that reads "TIDAK MENYADARI KEHILANGAN INGATANNYA SENDIRI", flashlight beam.
```

### Bagian 10 — Video jam 2 pagi (7:16–8:06)

7:16 — *Kamu merasa tengkukmu dingin.*
```
[A] shivering, chill lines on the back of his neck, shocked expression, cold blue lighting.
```

7:18 — *Sejak pagi, kamu yakin hanya sahabatmu yang sakit.*
```
[A] looking at [B] from a distance, [B] surrounded by a faint grey sickness haze, [A] clear.
```

7:21 — *Tetapi saat mencoba mengingat malam sebelumnya,*
```
[A] with a thinking expression, hand on chin, an empty thought bubble above him.
```

7:25 — *kamu kosong.*
```
[A] standing alone in a completely white empty void, small and lost.
```

7:26 — *Kalian makan, lalu tidur.*
```
Hazy dream-like flashback: [A] and [B] eating biscuits, then lying down to sleep, soft blurry edges.
```

7:28 — *Setidaknya begitu ceritanya.*
```
The same hazy flashback image cracking like broken glass, darkness behind the cracks.
```

7:30 — *Kamu membuka galeri ponsel dan menemukan video*
```
[A] scrolling through a phone gallery, screen glow on his face, worried expression.
```

7:33 — *yang direkam pukul 2 dini hari.*
```
Close-up of a phone screen showing a dark video thumbnail with a timestamp "02:00".
```

7:35 — *Dalam video itu,*
```
Phone screen view of a grainy dark night-vision style video frame of the clinic corridor.
```

7:36 — *kamu berdiri di depan pintu merah sambil memegang kunci.*
```
Grainy night-vision style frame: [A] standing in front of the chained red iron door holding a key, back to the camera.
```

7:40 — *Sahabatmu yang merekam dari belakang,*
```
Grainy video frame from [B]'s point of view: [B]'s yellow-sleeved arm at the edge of the frame, [A] ahead at the red door.
```

7:42 — *memohon agar kamu menjauh.*
```
Grainy video frame: [B]'s hand reaching toward [A] in the foreground, [A] at the red door ignoring it.
```

7:44 — *Suaramu sendiri terdengar jelas.*
```
Grainy video frame: [A] turning his head slightly, mouth open speaking, sound lines.
```

7:46 — *"Kalau besok aku lupa,"*
```
Grainy video frame: [A] facing the camera, serious emotionless expression, red door behind him.
```

7:48 — *"jangan ceritakan semuanya."*
```
Grainy video frame: [A] holding a finger to his lips, eerie calm expression.
```

7:49 — *Video berhenti mendadak.*
```
Phone screen suddenly black with a frozen glitch line across it.
```

7:51 — *Kamu memutarnya lagi,*
```
Close-up of [A]'s finger tapping the replay button on the phone.
```

7:55a — *tapi tetap sama.*
```
[A] staring intensely at the phone screen, sweat drop, confused expression.
```

7:55b — *Kamu sama sekali tidak ingat pernah berdiri di sana.*
```
[A] shaking his head in disbelief, the phone in his hand showing himself at the red door.
```

7:58 — *Ternyata selama ini,*
```
[A]'s distorted reflection in the black phone screen, eerie.
```

8:00 — *kamu juga mengalami kekosongan ingatan.*
```
[A] with several puzzle pieces missing from his head, dark gaps, shocked expression.
```

8:02 — *Bedanya,*
```
[A] alone in a spotlight in a dark room, looking at his hands.
```

8:03 — *kamu cukup percaya diri untuk tidak menyadarinya.*
```
[A] in a confident pose with a smile, while behind him a large shadow of himself has missing pieces and cracks.
```

### Bagian 11 — Pengakuan (8:06–8:35)

8:06 — *Sore itu,*
```
The clinic waiting room in late afternoon orange light coming through dusty windows.
```

8:07 — *kalian duduk berhadapan di ruang tunggu.*
```
[A] and [B] sitting on two chairs facing each other, tense quiet mood, orange light.
```

8:10 — *Kamu menunjukkan video tersebut*
```
[A] handing the phone to [B], the screen showing the red door video.
```

8:11 — *dan mengakui ada hal-hal yang tidak bisa kamu ingat.*
```
[A] with head lowered confessing, worried expression, [B] holding the phone.
```

8:16 — *Sahabatmu lama terdiam.*
```
[B] silent, staring at the phone, expressionless, long shadow on the floor.
```

8:17 — *Kemudian berkata,*
```
[B] looking up at [A] slowly, about to speak.
```

8:19 — *"Kalau kita berdua lupa,"*
```
[A] and [B] facing each other, both their outlines slightly fading at the edges like disappearing.
```

8:21 — *"siapa yang bisa kita percaya?"*
```
[A] and [B] looking at each other with uncertain worried expressions, a big question mark between them.
```

8:22 — *Kamu membuka buku bersama*
```
[A] opening the brown notebook on a small table between them.
```

8:24 — *dan menulis semua temuan hari itu.*
```
Close-up of the notebook page with doodles: radio, red door, recorder "01", clock at 2:03, broken card.
```

8:27 — *Kalian sepakat,*
```
[A] and [B] shaking hands over the notebook, serious expressions.
```

8:28 — *tidak akan menyembunyikan informasi lagi.*
```
Both [A]'s and [B]'s hands resting on the open notebook together, sincere mood.
```

8:31 — *Untuk sesaat,*
```
[A] and [B] sitting quietly, small relieved smiles.
```

8:32 — *janji itu membuat ruangan terasa lebih aman.*
```
The waiting room glowing with warm lantern light, [A] and [B] relaxed, shadows pushed back to the corners.
```

### Bagian 12 — Buku biru & akhir (8:35–9:34)

8:35 — *Menjelang malam,*
```
Clinic window as the sky turns deep blue and dark, lantern lit inside.
```

8:36 — *sahabatmu menyerahkan buku kecil bersampul biru.*
```
[B] handing a small dark-blue pocket notebook to [A].
```

8:39 — *"Ini milikku."*
```
[B] holding the blue notebook up, serious calm expression.
```

8:40 — *"Kalau besok aku lupa,"*
```
[B] looking into [A]'s eyes, worried expression.
```

8:42 — *"bacakan," katanya.*
```
[A] receiving the blue notebook with both hands, nodding.
```

8:44 — *Setelah ia tertidur,*
```
[B] asleep on a mattress under a blanket, [A] sitting nearby in lantern light.
```

8:45 — *kamu membuka halaman demi halaman.*
```
[A] reading the blue notebook with a flashlight, curious expression.
```

8:48 — *Ada catatan makanan,*
```
Close-up of a blue notebook page with a simple list doodle of food and water bottles.
```

8:49 — *denah klinik,*
```
Close-up of a page with a hand-drawn map of the clinic, the back door marked with a red X.
```

8:52 — *lalu kamu menemukan tulisan besar di halaman terakhir.*
```
[A] turning to the last page of the blue notebook, eyes widening, shocked expression.
```

8:56 — *"Jika aku lupa lagi,"*
```
Close-up of the last page with large shaky handwriting: "JIKA AKU LUPA LAGI,"
```

8:57 — *"jangan percaya cerita orang yang bersamaku."*
```
Close-up of the last page with large shaky handwriting: "JANGAN PERCAYA CERITA ORANG YANG BERSAMAKU", flashlight beam.
```

9:01 — *Di bawahnya tergambar wajahmu.*
```
Close-up of the notebook page showing a pencil sketch of [A]'s face (messy hair) circled under the handwriting.
```

9:03 — *Kamu menatap sahabatmu yang sedang tidur.*
```
[A] holding the blue notebook, staring at sleeping [B], suspicious worried expression, lantern flickering.
```

9:06 — *Apakah ia pernah melihatmu melakukan sesuatu yang berbahaya?*
```
Imagined dark scene: a shadow version of [A] at the red door holding a key, [B] watching in fear from the corridor.
```

9:10 — *Apakah kamu menyembunyikan rahasia darinya*
```
[A] sitting while his own dark shadow on the wall holds a finger to its lips.
```

9:12 — *lalu melupakannya sendiri?*
```
[A]'s shadow on the wall dissolving into dust, [A] looking at his hands confused.
```

9:14 — *Sebelum sempat mencari jawaban,*
```
[A] tense, eyes darting, the room suddenly dark and quiet.
```

9:16 — *terdengar tiga ketukan.*
```
Three bold impact lines appearing in the darkness, [A] jumping in shock.
```

9:20 — *Kali ini bukan dari pintu besi merah.*
```
The red chained door at the end of the corridor, silent and still, no knock lines.
```

9:22 — *Suaranya datang dari pintu ruang tunggu*
```
The waiting room door with a frosted glass window, impact lines on it.
```

9:25 — *tepat di belakangmu.*
```
Front view of [A] frozen with a scared expression, the waiting room door directly behind him with knock lines.
```

9:27 — *Padahal beberapa detik lalu,*
```
Through the door's window, the corridor outside, dim and still.
```

9:29 — *koridor itu kosong.*
```
The completely empty dark corridor outside the waiting room, flickering lamp.
```

9:30 — *Dan sebuah suara yang kamu kenal berbisik dari luar.*
```
A dark silhouette behind the frosted glass of the waiting room door, with messy spiky hair exactly like [A]'s, whisper lines through the door gap.
```

9:34 — *"Jangan bangunkan dia."*
```
Final shot: [B] sleeping peacefully in the foreground, [A] frozen in fear in the middle, the silhouette with [A]'s hair behind the frosted door, whisper lines, dark horror ending.
```
