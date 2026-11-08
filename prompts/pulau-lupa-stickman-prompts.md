# Prompt Gambar per Timestamp — "Pulau yang Lupa" (Stickman Horror-Misteri)

Untuk Google Flow (agent batch image). Prompt ditulis dalam bahasa Inggris karena model gambar lebih akurat dengan bahasa Inggris; narasi asli tetap dicantumkan sebagai acuan.

---

## 1. Kenapa hasilnya ngaco (versi 1) dan apa yang diubah

| Masalah | Penyebab | Perbaikan |
|---|---|---|
| Gambar meniru *character sheet* (latar putih, tokoh berjejer, deretan wajah di bawah) | Yang dipakai sebagai referensi adalah **sheet utuh**, jadi model meniru tata letaknya | Referensi diganti jadi **satu pose saja** (lihat langkah 1 di bawah); setiap prompt ditutup larangan "NOT a character sheet" |
| Latar putih / gambar terbagi 2 panel (adegan sumur) | Prompt "split composition" + latar putih dari sheet | Prompt split ditulis ulang jadi satu adegan utuh; setiap prompt mewajibkan latar penuh |
| Semua penduduk berwajah/berambut seperti tokoh A | Sheet A ikut dipasang di adegan yang tidak ada tokoh A | Tiap prompt kini punya label **Ingredients** — pasang hanya referensi yang disebut |
| Tokoh B gayanya berubah-ubah | Deskripsi B hanya ada di instruksi awal, tidak di tiap prompt | Deskripsi lengkap A dan B kini ditulis **di dalam setiap prompt**, jadi tiap prompt berdiri sendiri |

---

## 2. Cara pakai di Google Flow

1. **Buat 3 ingredient bersih** (ini langkah paling penting):
   - **A** — crop dari sheet stickman kamu: hanya **pose depan seluruh badan** (tokoh rambut cokelat, kaos biru). Jangan sertakan pose samping/belakang atau deretan wajah.
   - **B** — crop dari sheet B yang sudah kamu buat (rambut hitam, kaos kuning): hanya **pose depan seluruh badan**.
   - **GAYA** — satu hasil generate yang sudah bagus dan **tidak ada tokohnya**, misalnya gambar kapal di dermaga (1:10). Ini jadi acuan gaya gambar untuk adegan tanpa A/B.
2. Lihat baris **Ingredients** di atas tiap prompt, lalu pasang hanya ingredient itu:
   - `A` → hanya A · `B` → hanya B · `A + B` → A dan B · `GAYA` → hanya gambar GAYA (jangan pasang A/B).
3. Agent Flow cenderung memakai semua ingredient untuk semua gambar. Jadi jalankan **per kelompok**: kirim dulu semua prompt `A + B`, lalu `A`, lalu `B`, lalu `GAYA`, dan ganti ingredient yang terpasang di antara kelompok. Tempel **Instruksi Agent** (bagian 3) setiap kali mulai kelompok baru.
4. Aspect ratio **16:9**. Kalau satu gambar masih meleset, generate ulang satuan saja (bukan lewat agent), dengan ingredient yang benar.

---

## 2b. Pembagian kelompok (untuk dijalankan per batch)

- **A + B** — 82 gambar: 0:05, 0:11, 0:25, 0:51, 1:16, 1:18, 1:22, 1:24, 1:33, 1:42, 1:50, 1:54, 2:00, 2:07, 2:10, 2:18, 2:24, 2:38, 2:43, 2:44, 2:55, 2:59, 3:04, 3:09, 3:14, 3:26, 3:28, 3:33, 3:36, 3:39, 3:46, 3:49, 4:05, 4:06, 4:15, 4:19, 4:22, 4:24, 4:31, 4:35, 4:38, 4:54, 5:00, 5:11, 5:19, 5:25a, 5:25b, 5:29, 5:33, 5:38, 5:41, 5:44, 5:50, 5:54, 6:04, 6:19, 6:24, 6:32, 6:47, 6:53, 7:03, 7:08, 7:18, 7:26, 7:40, 7:42, 8:07, 8:10, 8:11, 8:17, 8:19, 8:21, 8:27, 8:28, 8:31, 8:32, 8:36, 8:40, 8:44, 9:03, 9:06, 9:34
- **A** — 45 gambar: 0:00, 0:15, 0:17, 0:21, 1:13, 2:13, 2:29, 2:35, 3:11, 3:24, 3:53, 3:56, 4:52, 5:53, 5:57, 6:00, 6:16, 6:44, 7:07, 7:16, 7:21, 7:25, 7:30, 7:36, 7:44, 7:46, 7:48, 7:51, 7:55a, 7:55b, 7:58, 8:00, 8:02, 8:03, 8:22, 8:42, 8:45, 8:52, 9:01, 9:10, 9:12, 9:14, 9:16, 9:25, 9:30
- **B** — 23 gambar: 0:10, 2:48, 2:50, 3:06, 3:32, 3:42, 4:28, 4:45, 4:49, 5:13, 5:16, 5:18, 5:36, 5:46, 5:48, 6:27, 6:50, 6:55, 6:58, 7:00, 7:01, 8:16, 8:39
- **GAYA (tanpa sheet karakter)** — 47 gambar: 0:30, 0:35, 0:40, 0:42, 0:46, 0:54, 0:56, 1:01, 1:04, 1:10, 1:28, 1:38, 1:46, 2:03, 2:32, 3:19, 3:59, 4:10, 5:02, 5:06, 5:30, 6:07, 6:08, 6:11, 6:13, 6:21, 6:29, 6:34, 6:38, 6:41, 7:11, 7:13, 7:28, 7:33, 7:35, 7:49, 8:06, 8:24, 8:35, 8:48, 8:49, 8:56, 8:57, 9:20, 9:22, 9:27, 9:29

---

## 3. Instruksi Agent (tempel di awal setiap kelompok)

```
Generate exactly one 16:9 image for EACH prompt below, using the prompt text exactly as written. Name each file after its timestamp (e.g. 0-00.png, 5-25a.png).
Use ONLY the ingredients I attached for this batch as character/style reference. Copy the drawing style and the character's look from them, but NEVER copy their layout: every result must be a full illustrated scene with a complete background, never a white background, never a character turnaround sheet, never a row of faces, never comic panels.
Draw only the characters each prompt names. Background people must look different from A and B.
No text in the image unless the prompt asks for written text.
```

---

### Referensi B (sudah kamu buat — tidak perlu generate ulang)

Sheet B kamu sudah sesuai: rambut hitam tebal pendek dengan poni, kaos kuning mustard, celana pendek abu tua. Prompt aslinya, kalau perlu membuat ulang:

```
Character turnaround sheet, white background, same hand-drawn stickman style as the uploaded reference: round white head, short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts, thin black stick limbs, small black mitten hands. Top row: front view, side view, back view. Bottom row: six head close-ups with expressions: worried, happy, suspicious, shocked, scared, angry. Thick black outlines, flat colors, no text.
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
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) standing alone on a grey foggy beach of a small tropical island, worried expression, abandoned wooden boats and a broken fishing net around, overcast sky, eerie quiet mood, wide shot. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

0:05 — *Pagi ini, sahabatmu menatapmu dengan ketakutan dan bertanya,*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Inside a shabby clinic room in pale morning light, boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) stands against the wall staring at boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) with a scared expression, A in foreground seen from behind-shoulder, tense atmosphere. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

0:10 — *"Kamu siapa?"*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts)'s face, scared expression, wide eyes, mouth trembling, sweat drops, dim clinic background, dramatic framing. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

0:11 — *Padahal semalam kalian masih berbicara seperti biasa.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Warm flashback scene in soft sepia tones: boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) sitting on the floor of a clinic waiting room at night, laughing together beside a small lantern, cozy and friendly mood. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

0:15 — *Dan sebelum hari ini berakhir,*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) standing at a clinic window looking out at the island as an orange sun sinks into a dark sea, long shadows, ominous mood, back view. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

0:17 — *kamu akan menemukan sesuatu yang jauh lebih mengerikan.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) with a shocked expression in a dark clinic corridor, a red iron door wrapped in chains glowing faintly at the far end, deep shadows, horror atmosphere. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

0:21 — *Mungkin selama ini, kamu juga sudah kehilangan ingatan.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) holding his head with both hands, worried expression, small memory pictures (photos of a beach, a friend, a boat) floating around his head and dissolving into dust, dark teal background. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

### Bagian 2 — Awal wabah (0:25–1:22)

0:25 — *Semuanya dimulai ketika kalian datang ke pulau kecil untuk berlibur.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Bright sunny flashback: boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) smiling happily on the deck of a small passenger ferry with backpacks, a small green island ahead, blue sea, cheerful mood. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

0:30 — *Hanya ada sebuah pelabuhan, beberapa permukiman, dan klinik kesehatan di dekat bukit.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Wide establishing shot of a small island: a little wooden harbor, a handful of simple houses, and a small white one-story clinic on a hill with a sign "KLINIK", flat illustrated landscape, slightly muted colors. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

0:35 — *Pada hari pertama, seorang nelayan ditemukan berjalan tanpa tujuan.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. A stickman fisherman with a straw hat and striped shirt wandering aimlessly on a wooden pier, blank empty eyes, holding a fishing rod upside down, villagers watching from a distance. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

0:40 — *Ia lupa alamat rumahnya.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. The straw-hat fisherman standing confused in front of a row of identical small houses, question marks floating above his head, worried expression. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

0:42 — *Besoknya, seorang pedagang tidak mengenali anaknya sendiri.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. A stickman market vendor with a headscarf behind a fruit stall staring blankly at a small crying child who reaches out to her, sad and unsettling mood. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

0:46 — *Lebih banyak penduduk mulai melupakan percakapan yang baru saja terjadi.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Two stickman villagers talking on a village street; one speaks while the other has a completely blank face and an empty speech bubble fading away, other villagers in background also looking lost. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

0:51 — *Dalam tiga hari, kepanikan menyebar ke seluruh pulau.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Chaotic village street, stickman villagers running in different directions carrying bags, a dropped basket of fish, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) watching worriedly from the side, dusty air. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

0:54 — *Tak seorang pun tahu penyebabnya.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. A group of stickman villagers huddled in a circle with confused and scared expressions, one huge dark question mark shadow looming over them. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

0:56 — *Ada yang menuduh air minum, ada yang menyebut penyakit menular.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. One single continuous village square scene (no panels, no dividing line): a bald villager in a green shirt angrily points at an old stone water well with a bucket, while a few steps away a woman with a grey bun and red dress wearing a face mask points at a coughing man in a white cap, tension between them, houses and palm trees in the background. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

1:01 — *Petugas kesehatan hanya bisa memastikan satu hal.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. A stickman health worker in a white coat, face mask and clipboard standing in front of the clinic speaking to a worried crowd, serious expression. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

1:04 — *Sebagian penderita masih mengingat masa kecil, tetapi kesulitan menyimpan ingatan baru.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. A stickman patient sitting on a clinic bed; above his head a clear bright thought bubble showing a childhood memory (a kid flying a kite), while new memories leak out of the back of his head like falling sand. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

1:10 — *Kapal penumpang berhenti beroperasi.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. A passenger ferry tied to the dock with no passengers, ropes slack, grey sky, empty ticket booth, lonely mood. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

1:13 — *Pelabuhan ditutup. Telepon mulai sulit tersambung.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) holding up a phone showing a no-signal icon, worried expression, behind him the harbor gate closed with a striped barrier and a chain. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

1:16 — *Kalian gagal meninggalkan pulau,*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) sitting dejected on the edge of an empty pier with their backpacks, looking at the empty sea, grey overcast sky. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

1:18 — *lalu berlindung di klinik yang tiba-tiba ditinggalkan petugasnya.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) cautiously entering the small white clinic on the hill at dusk, the front door hanging open, nobody inside, papers blowing across the floor. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

### Bagian 3 — Kilas balik evakuasi (1:22–2:00)

1:22 — *Sebelum pelabuhan ditutup,*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Faded sepia flashback of the busy harbor still open, villagers walking around with bags, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) in the crowd. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

1:24 — *kalian sempat melihat seorang petugas menempel pengumuman evakuasi.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. A stickman officer in a uniform cap taping a paper notice onto a wooden harbor wall, the notice shows a simple boat icon, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) watching from behind, sepia flashback tones. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

1:28 — *Ia meminta penduduk berkumpul di dermaga sebelum matahari terbenam.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. A crowd of stickman villagers gathering on a long wooden pier at sunset, orange sky, everyone looking toward the sea, waiting. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

1:33 — *Tetapi ketika kalian tiba, kapal yang dijanjikan tidak pernah datang.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) standing at the end of the pier staring at an empty horizon at dusk, no boat anywhere, disappointed and worried expressions. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

1:38 — *Yang tersisa hanya koper-koper terbuka dan sandal berserakan.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of a deserted pier: open suitcases with clothes spilling out, scattered flip-flops, a lost hat, no people, eerie dusk light. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

1:42 — *Seorang pria tua terus mengulang bahwa putrinya sedang menjemput,*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. An old stickman man with white hair and a walking cane sitting on a crate on the pier, smiling blankly and pointing at the sea, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) looking at him with concern. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

1:46 — *meskipun ia sendiri baru saja melihat putrinya dibawa ke klinik.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Memory inset: the same old man standing on a path watching a stickman young woman being carried on a stretcher by two health workers toward the clinic on the hill. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

1:50 — *Kamu ingin menolongnya, tetapi sahabatmu menarik lenganmu.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) reaching a hand toward the old man on the pier while boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) firmly pulls A's other arm away, B has a worried expression. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

1:54 — *Kalian tidak tahu apa yang akan terjadi jika tetap di pelabuhan sampai malam.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) hurrying away from the darkening harbor, night falling, long eerie shadows stretching from the empty pier, the old man a small lonely silhouette behind them. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

### Bagian 4 — Buku catatan & janji (2:00–2:29)

2:00 — *Di ruang tunggu, kalian menemukan kursi terbalik,*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Abandoned clinic waiting room, plastic chairs knocked over, flickering ceiling lamp, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) standing at the doorway, cautious expressions. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

2:03 — *berkas berserakan,*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of the clinic floor covered with scattered patient files and papers, a fallen clipboard, footprints in dust. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

2:07 — *dan pesan di dinding: "Kalau mulai lupa, tulis semuanya."*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. A handwritten paper note taped on a clinic wall that reads "KALAU MULAI LUPA, TULIS SEMUANYA", boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) reading it from behind, dim light. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

2:10 — *Sejak itu, kalian membuat buku catatan bersama.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) sitting together on the floor, opening a brown notebook with an elastic band, pen in A's hand, small lantern beside them. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

2:13 — *Setiap pagi kamu menuliskan tanggal, persediaan makanan, dan tempat kalian berada.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) writing in the brown notebook in soft morning light; the page shows simple doodles of a calendar, a water bottle, biscuits and a little map of the clinic. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

2:18 — *Kalian berjanji, siapapun yang masih mengingat harus membantu temannya.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) making a pinky promise over the open brown notebook, serious but warm expressions, lantern light. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

2:24 — *Janji sederhana itu terasa penting, meskipun kalian berharap tidak perlu menggunakannya.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Back view of boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) sitting side by side by a window at night, the notebook between them, moonlight, quiet bittersweet mood. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

### Bagian 5 — Hari ke-6 (2:29–3:24)

2:29 — *Pada hari ke-6, kamu terbangun sendirian.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) waking up on a thin mattress in the clinic waiting room, sitting up, confused expression, the spot next to him empty, cold morning light. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

2:32 — *Selimut sahabatmu tergeletak di lantai.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of a crumpled empty blanket on the clinic floor next to an empty mattress, ominous mood. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

2:35 — *Lalu terdengar suara barang jatuh dari ruang pemeriksaan.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) turning sharply toward a door labeled "RUANG PERIKSA", shocked expression, impact lines coming from behind the door. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

2:38 — *Ketika pintunya dibuka, ia berdiri di sudut sambil menggenggam gunting.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) opening the examination room door; inside, boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) stands pressed into a corner holding a pair of scissors, scared expression, a fallen medical tray on the floor. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

2:43 — *Kamu memanggil namanya.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) stepping forward with one hand gently outstretched, calling out, worried expression, boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) in the corner. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

2:44 — *Ia malah mundur, mengangkat gunting, dan berteriak.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) backing into the wall raising the scissors defensively in front of him, screaming with a scared expression, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) stopping in surprise. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

2:48 — *"Jangan dekat-dekat! Kamu siapa?"*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) shouting, scared and angry expression, scissors raised, motion lines, dramatic low angle. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

2:50 — *Tidak ada tanda ia sedang bercanda. Wajahnya benar-benar ketakutan.*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Extreme close-up of boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts)'s eyes trembling with fear, tears forming, sweat drops, dark background. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

2:55 — *Kamu menunjukkan buku catatan dan foto kalian berdua.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) slowly holding out the brown notebook in one hand and a phone in the other, calm pleading expression, boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) still wary in the corner. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

2:59 — *Ia melihat wajahnya di layar ponsel, lalu membaca seluruh halaman pertama.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) holding the phone showing a selfie of boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and B smiling together on a ferry, the brown notebook open in his other hand, confused expression. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

3:04 — *Perlahan, tangannya turun.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) slowly lowering the scissors to his side, expression softening from fear to confusion, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) watching hopefully. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

3:06 — *"Aku percaya tulisan ini," katanya.*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) holding the brown notebook against his chest, calm but sad expression, looking at the floor. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

3:09 — *"Tapi aku sama sekali tidak ingat kamu."*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) looking at boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) with a polite distant expression like meeting a stranger, A heartbroken, a visible gap between them. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

3:11 — *Kalimat itu membuat dadamu sesak.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) alone with a hand on his chest, sad worried expression, a small crack drawn over his chest, dark blue background. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

3:14 — *Orang yang bertahun-tahun mengenalmu, kini memandangmu seperti orang asing.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Dim clinic waiting room: boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) stares at boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) blankly like a stranger; on the wall behind them hangs a faded photo of A and B laughing together, A looks at the photo sadly. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

3:19 — *Air bersih tinggal satu botol, dan makanan hanya beberapa bungkus biskuit.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of a small table: one water bottle and three small biscuit packets, an empty water jug tipped over, dim light. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

### Bagian 6 — Mencari gudang (3:24–4:24)

3:24 — *Kalian harus bergerak!*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) grabbing his backpack with a determined expression, the brown notebook tucked under his arm. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

3:26 — *Kamu mengajaknya mencari gudang persediaan.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) gesturing toward a dark corridor, inviting boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) to follow; B hesitating but stepping forward. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

3:28 — *Sepanjang koridor, ia terus menanyakan pertanyaan yang sama.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) walking down a long dim clinic corridor with doors on both sides, B behind with a confused expression. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

3:32 — *"Kita di mana?"*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) stopping and looking around with a confused worried expression, question marks above his head, corridor background. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

3:33 — *Lima menit kemudian, pertanyaan itu muncul lagi.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Same corridor, a wall clock showing five minutes later, boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) asking again with the same confused face, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) looking tired. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

3:36 — *Kamu mencoba menguji ingatannya dengan tiga kata.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) facing boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) and holding up three fingers, patient expression, B listening attentively. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

3:39 — *"Kunci, gelas, jam."*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Three simple icons floating in the air between boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts): a key, a drinking glass and a clock, clearly drawn. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

3:42 — *Setelah berjalan sebentar, ia tidak mampu mengulang satupun.*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) with a blank face; the three icons (key, glass, clock) above his head fading and crumbling into dust. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

3:46 — *Kamu ingin marah karena lelah mengulang jawaban.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) with an angry frustrated expression, clenched fists, steam lines, boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) unaware in background. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

3:49 — *Tetapi melihat kebingungannya, kamu justru merasa bersalah.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) looking down with a guilty sad expression, hand on the back of his neck, boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) looking lost and small beside him. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

3:53 — *Gudang akhirnya ditemukan, terkunci dari luar.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. A storage door with a sign "GUDANG" locked with a heavy padlock, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) tugging the handle unsuccessfully. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

3:56 — *Kunci cadangan terselip di laci meja pendaftaran.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) pulling open a drawer of a dusty reception desk and finding a small key on a ring, surprised happy expression. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

3:59 — *Di dalamnya ada makanan kemasan, beberapa botol air, senter, dan radio portabel.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Inside the storage room: metal shelves with packaged food, several water bottles, a flashlight and a grey portable radio with antenna, a beam of light from the open door. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

4:05 — *Kalian hampir bersorak!*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) with happy expressions, arms half raised in celebration in front of the stocked shelves. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

4:06 — *Saat radio dinyalakan, suara berdesis memenuhi ruangan.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) switching on the grey portable radio, zigzag static lines filling the room, boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) covering his ears. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

4:10 — *Setelah beberapa kali memutar frekuensi, muncul pesan terputus-putus.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of a stick hand turning the radio's tuning dial, broken sound wave lines coming from the speaker. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

4:15 — *"Untuk siapapun yang masih di klinik, jangan buka pintu belakang."*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) leaning close to the radio, tense scared expressions, a faint ghostly image of a chained red door appearing in the sound waves. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

4:19 — *Pesan itu kemudian berulang dari awal.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. The radio on a shelf with a circular looping arrow symbol around it, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) exchanging uneasy glances. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

4:22 — *Rupanya rekaman otomatis.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) with a realizing suspicious expression staring at the glowing radio in the dark storage room, boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) behind him. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

### Bagian 7 — Botol air (4:24–5:00)

4:24 — *Saat menemukan air, kamu segera memberi sahabatmu satu botol.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) holding out a water bottle toward boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) with a kind smile. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

4:28 — *Ia menolak karena mengira kalian belum saling mengenal.*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) raising a hand politely refusing the bottle, awkward wary expression, stepping back slightly. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

4:31 — *Kamu menjelaskan kembali bahwa kalian sudah berteman lama.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) gesturing while explaining earnestly, the brown notebook open in his hand, boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) listening. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

4:35 — *Ia bertanya apa yang biasanya kalian lakukan bersama.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) tilting his head with a curious expression, small question mark, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) about to answer. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

4:38 — *Perjalanan, pertengkaran kecil, dan malam-malam saling menemani.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Three warm memory bubbles above boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts): hiking together with backpacks, a small silly argument with crossed arms, sitting together at night comforting each other. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

4:45 — *Ia tersenyum tipis, tetapi senyum itu menghilang...*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) with a faint small smile that is fading on one side, the warm memory bubbles popping above him. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

4:49 — *"Kenapa aku tidak bisa mengingat semua itu?"*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) holding his head with a sad worried expression, eyes watery, dim storage room. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

4:52 — *Kamu tidak punya jawaban.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) silent, looking down, mouth closed, no words, empty space between them. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

4:54 — *Kamu menyimpan botol tersebut di tangannya.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts)'s hands gently placing the water bottle into boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts)'s hands. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

### Bagian 8 — Pintu besi merah (5:00–6:00)

5:00 — *Kamu mengikuti koridor menuju belakang klinik.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) walking down a narrow dark corridor toward the back of the clinic, A holding a flashlight, flickering lights. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:02 — *Di ujungnya berdiri pintu besi merah terlilit rantai.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. At the end of the corridor, a rusty red iron door wrapped in heavy chains with a padlock, lit by the flashlight beam, ominous. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:06 — *Goresan panjang seperti bekas sesuatu yang diseret.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of the corridor wall beside the red door with long scratch marks dragged along the paint toward the door, flashlight beam. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:11 — *Sahabatmu berhenti mendadak.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) freezing mid-step, stiff posture, eyes fixed forward, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) turning back to look at him. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:13 — *Ia menatap pintu, lalu berbisik.*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) staring at the chained red door with a shocked expression, whisper lines from his mouth. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:16 — *"Aku pernah ada di sini."*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) whispering, wide eyes, red glow of the door reflected on his face. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:18 — *"Di baliknya ada seseorang."*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) pointing at the red door; through the gap under the door a faint shadow of feet is visible, horror mood. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:19 — *Kamu memintanya menjelaskan, namun beberapa detik kemudian ia mengerutkan dahi.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) holding boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts)'s shoulder asking urgently, B frowning with a suspicious confused expression. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:25a — *"Pintu apa?"*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) looking at boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) with a completely blank confused face, the red door behind him ignored. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:25b — *Ingatan yang baru muncul itu sudah hilang.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. A small glowing memory image of the red door floating from boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts)'s head and dissolving into dust, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) watching helplessly. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:29 — *Tiba-tiba terdengar ketukan.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. The red chained door with bold impact lines in the center, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) jumping back in shock. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:30 — *Tiga kali dari sisi lain pintu.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of the red iron door with three impact marks one after another, chains rattling, dust falling. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:33 — *Tok, tok, tok.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) pressed together in the corridor with scared expressions, the red door vibrating in the background, flashlight shaking. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:36 — *Sahabatmu ingin membukanya.*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) stepping toward the red door reaching for the chain, determined expression. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:38 — *Mungkin ada orang yang membutuhkan pertolongan.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) turning to boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) with a pleading expression, one hand on the chain. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:41 — *Kamu mengingat pesan radio dan menahan tangannya.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) grabbing boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts)'s wrist firmly to stop him, a ghostly radio icon above A's head as a reminder. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:44 — *Kalian bertengkar.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) arguing face to face with angry expressions, jagged lines between them, red door in background. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:46 — *"Katamu kita harus saling percaya."*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) speaking with a hurt expression, hand on his chest, the brown notebook in his other hand. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:48 — *Ucapnya dengan mata berkaca-kaca.*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts)'s teary eyes, glistening tears, sad expression. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:50 — *"Tapi kamu memperlakukanku seperti ancaman."*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) pointing at boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) with a hurt angry expression, A stepping back. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:53 — *Kamu terdiam.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) standing silent, head lowered, flashlight pointing at the floor. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:54 — *Akhirnya kalian sepakat mencari informasi terlebih dahulu.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) nodding to each other and walking away from the red door down the corridor. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

5:57 — *Meski ketukan itu terus terbayang di kepala.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) glancing back over his shoulder at the distant red door, faint knock lines echoing in the dark. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

### Bagian 9 — Ruang arsip (6:00–7:16)

6:00 — *Di ruang arsip, kamu menemukan alat perekam kecil.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. A dusty archive room with metal shelves and file boxes, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) picking up a small black voice recorder from a desk, flashlight beam. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:04 — *Suara petugas terdengar ketika tombolnya ditekan.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts)'s finger pressing play on the black voice recorder, sound wave lines coming out, boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) leaning in. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:07 — *"Catatan hari kelima."*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Ghostly translucent memory scene: the stickman health worker in a white coat speaking into the same voice recorder at a desk, tired expression. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:08 — *"Beberapa pasien kehilangan ingatan setelah tidur."*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Clinic ward with stickman patients sleeping in beds, faint wisps of light rising from their heads and disappearing, dark blue night. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:11 — *"Yang lain lupa dalam hitungan menit."*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. A stickman patient sitting next to a ticking clock, a thought bubble emptying quickly, blank face. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:13 — *"Nomor satu masih mampu menyembunyikan gejalanya."*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. A mysterious stickman silhouette in dark shadow with a hospital tag "01" on the wrist, face hidden, standing behind a curtain. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:16 — *Rekaman berhenti akibat suara benturan.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. The voice recorder in boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts)'s hand with a sharp jagged impact symbol bursting from the speaker, A flinching. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:19 — *Disusul teriakan singkat.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) with horrified shocked expressions, the recorder dropping from A's hand, dark room. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:21 — *Di bagian belakang alat tertulis angka 01.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of the back of the black voice recorder with a white sticker clearly showing "01". Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:24 — *Kalian menemukan daftar pasien dalam map berdebu.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) blowing dust off an old cardboard folder and opening it on the desk, boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) holding the flashlight. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:27 — *Nomor dua adalah sahabatmu.*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of a patient list page: row "02" with a small photo of boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) clipped to it. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:29 — *Nama pasien nomor satu sudah dicoret hitam.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of the same list: row "01" with the name completely scribbled out in thick black marker, no photo. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:32 — *Sebelum meninggalkan ruang arsip,*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) at the archive room doorway about to leave, A glancing back into the room. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:34 — *Jam dinding berhenti pada pukul 2 lewat 3 menit.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. A round wall clock with a cracked glass stopped at 2:03, dust and cobwebs, eerie light. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:38 — *Di lantai tergeletak kartu akses dengan ujung patah.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of a white plastic access card with a broken corner lying on the dusty floor. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:41 — *Kartu itu memiliki bekas noda merah tua,*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of the broken access card with a small dark reddish-brown stain on its edge, not graphic, dim light. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:44 — *tetapi kamu tidak berani memastikan asalnya.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) crouching with his hand hovering hesitantly above the card, worried scared expression. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:47 — *Sahabatmu menunjuk foto petugas yang tergantung di dinding.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) pointing at a framed photo on the wall showing a stickman staff member in a white coat, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) turning to look. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:50 — *"Aku pernah melihat orang ini," katanya.*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) staring at the framed staff photo with a serious suspicious expression. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:53 — *Kamu buru-buru bertanya kapan.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) holding boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts)'s shoulders and asking eagerly, urgent expression. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:55 — *Ia memejamkan mata, berusaha mengingat,*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) with eyes squeezed shut, straining to remember, hands on his temples. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

6:58 — *lalu mulai menangis.*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) crying with tears streaming, scared sad expression. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:00 — *Semakin keras ia mencoba,*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) gripping his head, swirling spiral lines around it. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:01 — *semakin bingung dirinya.*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) with a tangled black scribble cloud above his head, lost confused expression. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:03 — *Kamu berhenti bertanya dan mengajaknya keluar.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) putting an arm around boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts)'s shoulders and gently leading him out of the archive room. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:07 — *Untuk pertama kalinya,*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) standing in the corridor looking back at the archive door, thoughtful expression. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:08 — *kamu takut mencari jawaban justru menyakitinya.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) with a worried expression looking at boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) who sits curled up against the wall, fragile mood. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:11 — *Di bawah angka itu tercatat,*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of the patient list row "01" with a short handwritten note underneath it. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:13 — *"tidak menyadari kehilangan ingatannya sendiri."*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of a handwritten note on a patient file that reads "TIDAK MENYADARI KEHILANGAN INGATANNYA SENDIRI", flashlight beam. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

### Bagian 10 — Video jam 2 pagi (7:16–8:06)

7:16 — *Kamu merasa tengkukmu dingin.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) shivering, chill lines on the back of his neck, shocked expression, cold blue lighting. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:18 — *Sejak pagi, kamu yakin hanya sahabatmu yang sakit.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) looking at boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) from a distance, B surrounded by a faint grey sickness haze, A clear. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:21 — *Tetapi saat mencoba mengingat malam sebelumnya,*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) with a thinking expression, hand on chin, an empty thought bubble above him. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:25 — *kamu kosong.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) standing alone in a completely white empty void, small and lost. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:26 — *Kalian makan, lalu tidur.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Hazy dream-like flashback: boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) eating biscuits, then lying down to sleep, soft blurry edges. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:28 — *Setidaknya begitu ceritanya.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. The same hazy flashback image cracking like broken glass, darkness behind the cracks. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:30 — *Kamu membuka galeri ponsel dan menemukan video*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) scrolling through a phone gallery, screen glow on his face, worried expression. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:33 — *yang direkam pukul 2 dini hari.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of a phone screen showing a dark video thumbnail with a timestamp "02:00". Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:35 — *Dalam video itu,*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Phone screen view of a grainy dark night-vision style video frame of the clinic corridor. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:36 — *kamu berdiri di depan pintu merah sambil memegang kunci.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Grainy night-vision style frame: boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) standing in front of the chained red iron door holding a key, back to the camera. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:40 — *Sahabatmu yang merekam dari belakang,*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Grainy video frame from boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts)'s point of view: B's yellow-sleeved arm at the edge of the frame, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) ahead at the red door. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:42 — *memohon agar kamu menjauh.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Grainy video frame: boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts)'s hand reaching toward boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) in the foreground, A at the red door ignoring it. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:44 — *Suaramu sendiri terdengar jelas.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Grainy video frame: boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) turning his head slightly, mouth open speaking, sound lines. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:46 — *"Kalau besok aku lupa,"*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Grainy video frame: boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) facing the camera, serious emotionless expression, red door behind him. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:48 — *"jangan ceritakan semuanya."*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Grainy video frame: boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) holding a finger to his lips, eerie calm expression. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:49 — *Video berhenti mendadak.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Phone screen suddenly black with a frozen glitch line across it. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:51 — *Kamu memutarnya lagi,*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts)'s finger tapping the replay button on the phone. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:55a — *tapi tetap sama.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) staring intensely at the phone screen, sweat drop, confused expression. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:55b — *Kamu sama sekali tidak ingat pernah berdiri di sana.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) shaking his head in disbelief, the phone in his hand showing himself at the red door. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

7:58 — *Ternyata selama ini,*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts)'s distorted reflection in the black phone screen, eerie. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:00 — *kamu juga mengalami kekosongan ingatan.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) with several puzzle pieces missing from his head, dark gaps, shocked expression. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:02 — *Bedanya,*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) alone in a spotlight in a dark room, looking at his hands. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:03 — *kamu cukup percaya diri untuk tidak menyadarinya.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) in a confident pose with a smile, while behind him a large shadow of himself has missing pieces and cracks. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

### Bagian 11 — Pengakuan (8:06–8:35)

8:06 — *Sore itu,*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. The clinic waiting room in late afternoon orange light coming through dusty windows. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:07 — *kalian duduk berhadapan di ruang tunggu.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) sitting on two chairs facing each other, tense quiet mood, orange light. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:10 — *Kamu menunjukkan video tersebut*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) handing the phone to boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts), the screen showing the red door video. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:11 — *dan mengakui ada hal-hal yang tidak bisa kamu ingat.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) with head lowered confessing, worried expression, boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) holding the phone. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:16 — *Sahabatmu lama terdiam.*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) silent, staring at the phone, expressionless, long shadow on the floor. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:17 — *Kemudian berkata,*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) looking up at boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) slowly, about to speak. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:19 — *"Kalau kita berdua lupa,"*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) facing each other, both their outlines slightly fading at the edges like disappearing. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:21 — *"siapa yang bisa kita percaya?"*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) looking at each other with uncertain worried expressions, a big question mark between them. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:22 — *Kamu membuka buku bersama*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) opening the brown notebook on a small table between them. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:24 — *dan menulis semua temuan hari itu.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of the notebook page with doodles: radio, red door, recorder "01", clock at 2:03, broken card. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:27 — *Kalian sepakat,*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) shaking hands over the notebook, serious expressions. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:28 — *tidak akan menyembunyikan informasi lagi.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Both boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts)'s and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts)'s hands resting on the open notebook together, sincere mood. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:31 — *Untuk sesaat,*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) sitting quietly, small relieved smiles. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:32 — *janji itu membuat ruangan terasa lebih aman.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. The waiting room glowing with warm lantern light, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) and boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) relaxed, shadows pushed back to the corners. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

### Bagian 12 — Buku biru & akhir (8:35–9:34)

8:35 — *Menjelang malam,*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Clinic window as the sky turns deep blue and dark, lantern lit inside. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:36 — *sahabatmu menyerahkan buku kecil bersampul biru.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) handing a small dark-blue pocket notebook to boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts). Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:39 — *"Ini milikku."*  
**Ingredients: B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) holding the blue notebook up, serious calm expression. Only one main character: B. A does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:40 — *"Kalau besok aku lupa,"*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) looking into boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts)'s eyes, worried expression. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:42 — *"bacakan," katanya.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) receiving the blue notebook with both hands, nodding. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:44 — *Setelah ia tertidur,*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) asleep on a mattress under a blanket, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) sitting nearby in lantern light. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:45 — *kamu membuka halaman demi halaman.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) reading the blue notebook with a flashlight, curious expression. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:48 — *Ada catatan makanan,*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of a blue notebook page with a simple list doodle of food and water bottles. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:49 — *denah klinik,*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of a page with a hand-drawn map of the clinic, the back door marked with a red X. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:52 — *lalu kamu menemukan tulisan besar di halaman terakhir.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) turning to the last page of the blue notebook, eyes widening, shocked expression. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:56 — *"Jika aku lupa lagi,"*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of the last page with large shaky handwriting: "JIKA AKU LUPA LAGI," Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

8:57 — *"jangan percaya cerita orang yang bersamaku."*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of the last page with large shaky handwriting: "JANGAN PERCAYA CERITA ORANG YANG BERSAMAKU", flashlight beam. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

9:01 — *Di bawahnya tergambar wajahmu.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Close-up of the notebook page showing a pencil sketch of boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts)'s face (messy hair) circled under the handwriting. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

9:03 — *Kamu menatap sahabatmu yang sedang tidur.*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) holding the blue notebook, staring at sleeping boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts), suspicious worried expression, lantern flickering. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

9:06 — *Apakah ia pernah melihatmu melakukan sesuatu yang berbahaya?*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Imagined dark scene: a shadow version of boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) at the red door holding a key, boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) watching in fear from the corridor. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

9:10 — *Apakah kamu menyembunyikan rahasia darinya*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) sitting while his own dark shadow on the wall holds a finger to its lips. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

9:12 — *lalu melupakannya sendiri?*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts)'s shadow on the wall dissolving into dust, A looking at his hands confused. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

9:14 — *Sebelum sempat mencari jawaban,*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) tense, eyes darting, the room suddenly dark and quiet. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

9:16 — *terdengar tiga ketukan.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Three bold impact lines appearing in the darkness, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) jumping in shock. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

9:20 — *Kali ini bukan dari pintu besi merah.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. The red chained door at the end of the corridor, silent and still, no knock lines. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

9:22 — *Suaranya datang dari pintu ruang tunggu*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. The waiting room door with a frosted glass window, impact lines on it. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

9:25 — *tepat di belakangmu.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Front view of boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) frozen with a scared expression, the waiting room door directly behind him with knock lines. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

9:27 — *Padahal beberapa detik lalu,*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Through the door's window, the corridor outside, dim and still. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

9:29 — *koridor itu kosong.*  
**Ingredients: GAYA (tanpa sheet karakter)**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. The completely empty dark corridor outside the waiting room, flickering lamp. Neither A nor B appears in this image. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

9:30 — *Dan sebuah suara yang kamu kenal berbisik dari luar.*  
**Ingredients: A**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. A dark silhouette behind the frosted glass of the waiting room door, with messy spiky hair exactly like boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts)'s, whisper lines through the door gap. Only one main character: A. B does not appear. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```

9:34 — *"Jangan bangunkan dia."*  
**Ingredients: A + B**
```
Full 16:9 scene, simple hand-drawn 2D stickman cartoon, thick black ink outlines, flat muted colors, fully painted background filling the whole frame. Final shot: boy B (short thick black hair with a small fringe, mustard-yellow short-sleeve t-shirt, dark grey shorts) sleeping peacefully in the foreground, boy A (messy spiky dark-brown hair covering the forehead, blue short-sleeve t-shirt, khaki shorts) frozen in fear in the middle, the silhouette with A's hair behind the frosted door, whisper lines, dark horror ending. Exactly two main characters: A and B. Every other person is a villager who looks clearly different from A and B (bald, caps, long hair, grey hair, buns; green, red, white, brown or striped clothes); nobody else has messy brown hair with a blue t-shirt or black hair with a yellow t-shirt. NOT a character sheet: no white background, no turnaround poses, no row of face expressions, no comic panels, no duplicate copies of a character.
```
