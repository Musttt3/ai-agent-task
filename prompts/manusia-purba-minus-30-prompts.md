# Prompt Gambar per Timestamp — "Minus 30 Derajat: Bisakah Manusia Purba Selamat?"

Untuk Google Flow (agent batch image). 18 gambar untuk narasi ±56 detik.
Setiap prompt sudah berdiri sendiri: deskripsi tokoh, gaya, sudut kamera, dan larangan ditulis di dalam prompt. Ini supaya hasilnya tidak meniru layout character sheet atau berubah-ubah antar gambar.

---

## 1. Cara pakai

1. **Ingredient A**: crop dari sheet stickman kamu **satu pose depan seluruh badan saja** (rambut cokelat berantakan). Jangan pakai sheet utuh.
2. Pasang ingredient sesuai label **Ingredients** di atas tiap prompt (`A` atau `GAYA`). `GAYA` = adegan tanpa tokoh utama; pasang satu gambar hasil yang sudah bagus tanpa tokoh sebagai acuan gaya, atau tanpa ingredient sama sekali.
3. Tempel **Instruksi Agent** di bawah, lalu daftar prompt.
4. Baris **Gerak kamera** dipakai saat editing (zoom/pan) atau sebagai prompt image-to-video di Flow (Veo). Tidak perlu dimasukkan ke prompt gambar.
5. Rasio default **16:9**. Kalau untuk YouTube Shorts, ganti ke **9:16** di instruksi agent; komposisi tetap jalan karena subjek utama selalu di tengah/sepertiga.

### Instruksi Agent

```
Generate exactly one 16:9 image for EACH prompt below, using the prompt text exactly as written. Name each file after its timestamp (e.g. 0-00.png, 0-38b.png).
Use the attached ingredient only as the character/style reference. Copy the drawing style and the character's face and hair, but NEVER copy its layout: every result must be a full illustrated cinematic scene with a complete background, never a white background, never a character turnaround sheet, never a row of faces, never comic panels.
Draw only the characters each prompt names. No text in the image.
```

---

## 2. Tokoh & dunia (sudah tertulis di setiap prompt)

| | Deskripsi |
|---|---|
| **A — manusia purba** | Stickman dari referensi: kepala bulat putih, rambut cokelat berantakan, badan dan tangan-kaki stik hitam. Memakai **jubah bulu hewan cokelat tebal**, ikat pinggang tali kulit, kaki dibalut kulit bulu. |
| **Anggota kelompok** | Stickman gaya sama, rambut beda (hitam panjang, abu, botak, kepang), bulu abu/putih/belang. Tidak ada yang berambut cokelat berantakan. |
| **Dunia** | Zaman es: salju tebal, badai, tebing es, hutan pinus beku, gua batu. Palet biru-dingin; api = satu-satunya warna oranye hangat. |

---

## 3. Daftar prompt per timestamp

### 0:00 — *Minus 30 derajat, tanpa jaket, tanpa sepatu modern.*
**Ingredients: A** · Shot: extreme wide establishing, high angle drone
```
Cinematic 16:9 illustration, hand-drawn 2D stickman cartoon style with thick black ink outlines and flat colors, fully painted background. Extreme wide high-angle drone shot of a vast frozen ice-age valley in a raging blizzard, snow-covered pine forest and icy cliffs, tiny lone figure in the center: the caveman A (round white stickman head, messy spiky dark-brown hair, black stick limbs, thick brown animal-fur cloak, fur-wrapped feet) walking through deep snow leaving footprints. Cold desaturated blue-white palette, heavy snowfall, epic sense of scale. NOT a character sheet: no white background, no turnaround poses, no row of faces, no comic panels, no text.
```
Gerak kamera: *slow drone push-in toward the tiny figure, snow drifting across the lens.*

### 0:05 — *Apakah manusia purba bisa selamat?*
**Ingredients: A** · Shot: close-up, low angle, shallow depth of field
```
Cinematic 16:9 illustration, hand-drawn 2D stickman cartoon style with thick black ink outlines and flat colors, fully painted background. Low-angle close-up of the caveman A (round white stickman head, messy spiky dark-brown hair covered in frost, thick brown animal-fur cloak pulled up to the chin) looking up into the storm with a worried expression, breath steaming from his mouth, ice crystals on his hair, blurred falling snowflakes in the foreground, dark grey sky behind. NOT a character sheet: no white background, no turnaround poses, no row of faces, no comic panels, no text.
```
Gerak kamera: *slow push-in to his face, slight handheld wobble from the wind.*

### 0:08 — *Jawabannya bisa, tapi tidak mudah.*
**Ingredients: A** · Shot: medium tracking shot, side profile
```
Cinematic 16:9 illustration, hand-drawn 2D stickman cartoon style with thick black ink outlines and flat colors, fully painted background. Medium side-profile shot of the caveman A (round white stickman head, messy spiky dark-brown hair, thick brown animal-fur cloak, fur-wrapped feet, wooden spear in hand) leaning forward and pushing through knee-deep snow against strong wind, determined expression, snow streaks blowing horizontally, frozen pine trees in the background. NOT a character sheet: no white background, no turnaround poses, no row of faces, no comic panels, no text.
```
Gerak kamera: *lateral tracking shot moving with him from left to right.*

### 0:12 — *Manusia purba tidak bertahan sendirian melawan dingin.*
**Ingredients: A** · Shot: wide pull-back reveal, eye level
```
Cinematic 16:9 illustration, hand-drawn 2D stickman cartoon style with thick black ink outlines and flat colors, fully painted background. Wide eye-level shot: the caveman A (round white stickman head, messy spiky dark-brown hair, thick brown animal-fur cloak) in the foreground turns to look back, and behind him a group of six other cave people walk together in a line through the snow, each with different hair (long black, grey, bald, braids) and grey, white or striped fur clothing, carrying spears and bundles. Cold blue snowy landscape. Only A has messy brown hair. NOT a character sheet: no white background, no turnaround poses, no row of faces, no comic panels, no text.
```
Gerak kamera: *pull back from A to reveal the whole group behind him.*

### 0:16a — *Mereka memakai kulit hewan tebal,*
**Ingredients: A** · Shot: macro detail / insert shot
```
Cinematic 16:9 illustration, hand-drawn 2D stickman cartoon style with thick black ink outlines and flat colors, fully painted background. Close-up insert shot of the black stick hands of the caveman A tying a leather cord to fasten a thick shaggy brown fur cloak over his shoulders, the edge of his messy dark-brown hair visible at the top of frame, fur texture drawn in detail, snowflakes landing on the fur, warm firelight from the side. NOT a character sheet: no white background, no turnaround poses, no row of faces, no comic panels, no text.
```
Gerak kamera: *slow tilt up from the hands to his shoulders.*

### 0:16b — *tinggal di gua atau tempat berlindung sederhana,*
**Ingredients: GAYA** · Shot: wide establishing, slightly low angle
```
Cinematic 16:9 illustration, hand-drawn 2D stickman cartoon style with thick black ink outlines and flat colors, fully painted background. Wide slightly-low-angle shot of a rocky cave mouth in a snowy cliff during a blizzard, a hide-covered windbreak of animal skins and wooden poles at the entrance, warm orange firelight glowing from inside the cave, small stickman silhouettes inside, deep snow outside, strong contrast between cold blue outside and warm orange inside. NOT a character sheet: no comic panels, no text.
```
Gerak kamera: *slow dolly forward toward the glowing cave entrance.*

### 0:21 — *lalu menjaga api tetap menyala siang dan malam.*
**Ingredients: A** · Shot: low angle close-up from behind the fire
```
Cinematic 16:9 illustration, hand-drawn 2D stickman cartoon style with thick black ink outlines and flat colors, fully painted background. Low-angle shot from just behind a crackling campfire inside a dark cave, flames large and out of focus in the foreground, the caveman A (round white stickman head, messy spiky dark-brown hair, thick brown animal-fur cloak) kneeling and adding a log to the fire, his face lit warm orange, sparks rising, cave walls in deep shadow. NOT a character sheet: no white background, no turnaround poses, no row of faces, no comic panels, no text.
```
Gerak kamera: *slow push-in through the flames, sparks floating upward.*

### 0:24 — *Mereka juga makan makanan berlemak dan tinggi energi supaya tubuh tetap panas.*
**Ingredients: A** · Shot: medium close-up, three-quarter angle
```
Cinematic 16:9 illustration, hand-drawn 2D stickman cartoon style with thick black ink outlines and flat colors, fully painted background. Medium close-up three-quarter angle of the caveman A (round white stickman head, messy spiky dark-brown hair, thick brown animal-fur cloak) sitting by a cave fire biting into a big piece of roasted fatty meat on a bone, happy satisfied expression, grease shining, more meat roasting on a stick over the fire, warm orange glow. NOT a character sheet: no white background, no turnaround poses, no row of faces, no comic panels, no text.
```
Gerak kamera: *slow orbit around him from left to right.*

### 0:30 — *Di tempat bersalju, mereka bergerak dalam kelompok,*
**Ingredients: A** · Shot: high angle top-down
```
Cinematic 16:9 illustration, hand-drawn 2D stickman cartoon style with thick black ink outlines and flat colors, fully painted background. High-angle top-down shot of a group of seven cave people walking close together in a tight cluster across a white snowfield, long footprint trail behind them; one of them is the caveman A (round white stickman head, messy spiky dark-brown hair, thick brown animal-fur cloak) in the middle, the others have different hair and grey, white or striped fur. Light snowfall, long blue shadows. NOT a character sheet: no turnaround poses, no row of faces, no comic panels, no text.
```
Gerak kamera: *overhead crane shot slowly drifting forward with the group.*

### 0:33 — *saling menghangatkan dan menghindari terlalu lama diam di luar.*
**Ingredients: A** · Shot: medium two-shot, eye level, backlit
```
Cinematic 16:9 illustration, hand-drawn 2D stickman cartoon style with thick black ink outlines and flat colors, fully painted background. Eye-level medium shot of cave people huddled shoulder to shoulder under shared fur blankets, rubbing their hands together; the caveman A (round white stickman head, messy spiky dark-brown hair, thick brown animal-fur cloak) in the center, others with different hair and fur colors around him, breath steaming, a cave entrance glowing warm behind them while snow blows outside. NOT a character sheet: no turnaround poses, no row of faces, no comic panels, no text.
```
Gerak kamera: *slow push-in to the huddled group.*

### 0:38a — *Tapi kalau api padam,*
**Ingredients: GAYA** · Shot: extreme close-up, top-down
```
Cinematic 16:9 illustration, hand-drawn 2D stickman cartoon style with thick black ink outlines and flat colors, fully painted background. Extreme close-up top-down shot of a dying campfire: last glowing embers turning black, a thin wisp of smoke rising, snowflakes falling onto the ashes, cold blue light taking over the orange glow, dark and ominous mood. NOT a character sheet: no comic panels, no text.
```
Gerak kamera: *slow push-down onto the embers while the glow fades.*

### 0:38b — *pakaian basah,*
**Ingredients: A** · Shot: medium shot, dutch angle
```
Cinematic 16:9 illustration, hand-drawn 2D stickman cartoon style with thick black ink outlines and flat colors, fully painted background. Medium shot with a tilted dutch angle: the caveman A (round white stickman head, messy spiky dark-brown hair, brown animal-fur cloak now soaked and dripping) climbing out of a broken hole in a frozen river, shivering violently with a scared expression, icicles forming on the wet fur, cracked ice around him, grey sky. NOT a character sheet: no white background, no turnaround poses, no row of faces, no comic panels, no text.
```
Gerak kamera: *handheld shake, quick zoom-in on his shivering face.*

### 0:38c — *atau mereka terpisah dari kelompok,*
**Ingredients: A** · Shot: extreme wide, isolation framing
```
Cinematic 16:9 illustration, hand-drawn 2D stickman cartoon style with thick black ink outlines and flat colors, fully painted background. Extreme wide shot: the caveman A (round white stickman head, messy spiky dark-brown hair, thick brown animal-fur cloak) stands tiny and alone in the bottom left of a huge white snowfield, reaching out toward the faint silhouettes of his group disappearing into a thick blizzard far away in the top right, lots of empty negative space, lonely and desperate mood. NOT a character sheet: no white background, no turnaround poses, no row of faces, no comic panels, no text.
```
Gerak kamera: *slow pull-back making him smaller and smaller.*

### 0:44 — *suhu minus 30 derajat bisa membunuh dalam waktu singkat.*
**Ingredients: A** · Shot: close-up, high angle looking down
```
Cinematic 16:9 illustration, hand-drawn 2D stickman cartoon style with thick black ink outlines and flat colors, fully painted background. High-angle close-up looking down at the caveman A (round white stickman head, messy spiky dark-brown hair covered in frost, thick brown animal-fur cloak) curled up in the snow, eyes half closed, frost spreading over his face and fur, snow slowly covering him, ice crystals creeping in from the frame edges, freezing blue-white palette, sad and dangerous mood, not gory. NOT a character sheet: no white background, no turnaround poses, no row of faces, no comic panels, no text.
```
Gerak kamera: *slow crane up and away while frost creeps over the frame.*

### 0:48 — *Jadi, manusia purba memang bisa bertahan di cuaca ekstrem,*
**Ingredients: A** · Shot: hero shot, low angle, golden light
```
Cinematic 16:9 illustration, hand-drawn 2D stickman cartoon style with thick black ink outlines and flat colors, fully painted background. Heroic low-angle shot of the caveman A (round white stickman head, messy spiky dark-brown hair, thick brown animal-fur cloak, wooden spear) standing proudly on a snowy ridge at sunrise, the storm clearing behind him, golden sunlight breaking through the clouds onto the snow, confident smile, cloak blowing in the wind. NOT a character sheet: no white background, no turnaround poses, no row of faces, no comic panels, no text.
```
Gerak kamera: *slow low-angle arc around him as the light rises.*

### 0:52a — *tapi kuncinya cuma tiga: api,*
**Ingredients: GAYA** · Shot: close-up hero object
```
Cinematic 16:9 illustration, hand-drawn 2D stickman cartoon style with thick black ink outlines and flat colors, fully painted background. Close-up hero shot of a bright roaring campfire in the center of the frame on a stone ring in the snow, dark cold blue background, flames and sparks dramatic and glowing, symmetrical composition. NOT a character sheet: no comic panels, no text.
```
Gerak kamera: *quick punch-in on the fire.*

### 0:52b — *perlindungan,*
**Ingredients: GAYA** · Shot: close-up hero object
```
Cinematic 16:9 illustration, hand-drawn 2D stickman cartoon style with thick black ink outlines and flat colors, fully painted background. Close-up hero shot of a thick brown fur cloak hanging at the entrance of a stone cave shelter, snow piled outside, warm light glowing inside, symmetrical composition, cold blue background. NOT a character sheet: no comic panels, no text.
```
Gerak kamera: *quick punch-in on the cave and fur.*

### 0:52c — *dan kebersamaan.*
**Ingredients: A** · Shot: final wide, warm, eye level
```
Cinematic 16:9 illustration, hand-drawn 2D stickman cartoon style with thick black ink outlines and flat colors, fully painted background. Warm final wide shot inside a cave: the whole group of cave people sitting together around a big fire sharing food and smiling, the caveman A (round white stickman head, messy spiky dark-brown hair, thick brown animal-fur cloak) in the center laughing, others with different hair and fur colors around him, a blizzard raging outside the cave entrance in cold blue, inside glowing orange and safe. NOT a character sheet: no white background, no turnaround poses, no row of faces, no comic panels, no text.
```
Gerak kamera: *slow pull-back to reveal the whole cave and the storm outside, end on the warm fire.*

---

## 4. Ringkasan kelompok ingredient

- **A** (14 gambar): 0:00, 0:05, 0:08, 0:12, 0:16a, 0:21, 0:24, 0:30, 0:33, 0:38b, 0:38c, 0:44, 0:48, 0:52c
- **GAYA** (4 gambar): 0:16b, 0:38a, 0:52a, 0:52b

Untuk sub-shot (a/b/c), bagi durasi narasinya rata saat editing. Contohnya 0:38–0:44 menjadi tiga potong masing-masing ±2 detik.
