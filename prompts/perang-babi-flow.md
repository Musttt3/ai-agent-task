# Prompt Google Flow — "Perang Babi 1859" (Frame Awal & Akhir)

Naskah ±58 detik dipecah menjadi **10 klip** (masing-masing dibuat 8 detik di Flow, lalu dipotong sesuai narasi).
Setiap klip memakai fitur **Awal** (frame awal) dan **Akhir** (frame akhir). Beberapa klip berbagi frame
(akhir klip sebelumnya = awal klip berikutnya) supaya gerakannya menyambung mulus.

Prompt ditulis dalam bahasa Inggris agar hasil model lebih akurat. Semua prompt meminta **tanpa teks** dan
**tanpa dialog/narasi** — narasi dari naskah ditambahkan saat editing.

---

## Langkah 1 — Siapkan referensi karakter (Ingredients)

Upload lembar karakter stickman kamu sebagai Ingredient **`pemandu`**. Ia tampil apa adanya (baju bulu, tanpa
tombak) sebagai pemandu/saksi yang "nyasar" ke tahun 1859 — kontras yang lucu untuk cerita absurd ini.

Lalu buat 5 lembar karakter pendukung (gaya sama), simpan sebagai Ingredient dengan nama tag-nya:

```
[cutler] Character reference sheet on a plain white background, in exactly the same hand-drawn stickman art style as the attached reference sheet (round white head, thin black stick limbs, dot eyes, expressive eyebrows, thick clean black outlines, flat muted colors). Draw Lyman Cutler, an American farmer of 1859: short scruffy brown beard, worn straw hat, red-and-black checked flannel shirt with rolled sleeves, brown trousers held by suspenders, muddy boots, a long hunting rifle (muzzle-loading) slung on his back. Top row: front, three-quarter side and back view. Bottom row: six head close-ups: annoyed, angry, proud, surprised, nervous, smug grin. No text.
```

```
[griffin] Character reference sheet on a plain white background, in exactly the same hand-drawn stickman art style as the attached reference sheet. Draw Charles Griffin, a British farm manager of the Hudson's Bay Company in 1859: neat sideburns and moustache, tall black top hat, dark green tailcoat over a cream waistcoat, white shirt with a black neck tie, grey trousers, black boots, holding a walking cane. Top row: front, three-quarter side and back view. Bottom row: six head close-ups: proud, furious shouting, shocked, crying over his pig, pointing accusingly, smug. No text.
```

```
[us_soldier] Character reference sheet on a plain white background, in exactly the same hand-drawn stickman art style as the attached reference sheet. Draw a US Army infantry soldier of 1859: dark blue frock coat with brass buttons, light blue trousers, dark blue kepi cap, white cross belts, holding a long rifle musket with bayonet. Variant beside him: the captain (George Pickett) with long wavy hair, moustache, gold epaulettes, sword at his side. Top row: front, side and back view. Bottom row: six head close-ups: serious, alert, nervous, relieved, surprised, confused. No text.
```

```
[british_navy] Character reference sheet on a plain white background, in exactly the same hand-drawn stickman art style as the attached reference sheet. Draw a British Royal Navy sailor of 1859: flat round sailor hat, white shirt with a wide blue sailor collar, navy blue trousers; and beside him a Royal Navy officer: bicorne hat, dark navy tailcoat with gold buttons and gold epaulettes, white trousers, telescope in hand. Top row: front, side and back view. Bottom row: six head close-ups: stern, alert, nervous, relieved, surprised, shrugging. No text.
```

```
[babi] Character reference sheet on a plain white background, in exactly the same hand-drawn cartoon doodle style as the attached stickman reference sheet (thick clean black outlines, flat muted colors). Draw the famous pig of 1859: a big round black pig with a pink snout, small floppy ears, a curly tail and cute expressive eyes. Show front, side and back view, plus six head close-ups: happy munching, sneaky, surprised, scared, sleepy, angelic with a small golden halo. No text.
```

---

## Langkah 2 — Gaya gambar (ditempel di akhir setiap prompt frame)

```
Style: simple hand-drawn 2D cartoon doodle, exactly the same art style and line quality as the attached character sheets, thick clean black outlines, flat muted colors, warm Pacific Northwest palette (pine green, sea blue, wooden brown, sky blue), minimal shading, simple illustrated background, San Juan Island in 1859, 16:9 widescreen composition, no text, no letters, no captions, no watermark.
```

---

## Langkah 3 — Frame (gambar Awal & Akhir)

Buat setiap frame dengan generator gambar Flow memakai Ingredient yang disebut, lalu tempel **Gaya gambar** di akhirnya.

| Frame | Prompt |
|---|---|
| **F01** | The stickman guide (use the 'pemandu' sheet) stands close to the camera on a green hilltop of San Juan Island, surprised face, pointing at a big round black pig (use the 'babi' sheet) that innocently munches grass beside him; pine forest and calm sea with distant islands behind. |
| **F02** | Wide shot of the same hilltop meadow: the black pig sits in the exact center looking confused; on the left a line of US soldiers (use the 'us_soldier' sheet) with an American flag on a pole; on the right, in the bay, a large British wooden warship with sails and cannons and a British flag; the stickman guide stands between them with a shocked face. |
| **F03** | A small farm potato patch with neat rows of green potato plants and a wooden rail fence; the black pig (use the 'babi' sheet) has broken through the fence and happily digs up potatoes with dirt flying; in the background Lyman Cutler (use the 'cutler' sheet) storms out of his log cabin with an annoyed face; a larger farm with sheep pens of the British company far behind. |
| **F04** | Same potato patch: Lyman Cutler stands at the fence, furious, raising his long rifle to his shoulder and aiming toward the pig, which looks up from a half-eaten potato with a guilty face; the stickman guide peeks from behind a tree covering his eyes. |
| **F05** | Same potato patch a moment later, non-graphic cartoon: a puff of white smoke drifts from Cutler's rifle barrel; the pig is no longer visible, only its curly tail sticking up from behind the potato plants and a few potato leaves floating in the air; Cutler stands frozen with wide eyes; the guide drops his jaw. No blood. |
| **F06** | In front of the British farm house: Charles Griffin (use the 'griffin' sheet) shouts at Lyman Cutler, red-faced, top hat tilted, pointing his cane at him; Cutler crosses his arms defiantly; the stickman guide stands between them looking nervous. |
| **F07** | Same place: two British officials in dark coats and top hats arrive and point at Cutler, one holding open handcuffs; Griffin nods angrily; Cutler steps back, alarmed; the guide holds his head. |
| **F08** | Simple hand-drawn cartoon map of the waters between Vancouver Island and Washington Territory, with the small San Juan Island in the middle; a big American flag on one side and a big British flag on the other, both connected to the island by ropes like a tug-of-war; the stickman guide stands on the island in the middle looking worried. No written names. |
| **F09** | The same map, the two ropes pulled tight and the island shaking with motion lines; small cartoon ships and soldiers gathering on both sides; the guide clings to the island with a scared face. |
| **F10** | A beach on San Juan Island: US soldiers (use the 'us_soldier' sheet) row ashore in small boats and march onto the beach carrying rifles and a small cannon, Captain Pickett leading with his sword raised; tents being set up on the meadow; the guide watches from behind a log. |
| **F11** | View from the same beach toward the bay: three large British wooden warships (use the 'british_navy' sheet for crews) anchored in line with dozens of cannons aimed at the shore, sailors on deck, an officer looking through a telescope; the US soldiers in the foreground look up nervously. |
| **F12** | Standoff, wide shot: US soldiers in a line on the shore aiming rifles toward the sea; the British warships aiming cannons at the shore; exactly in the middle on the sand sits the black pig wearing a tiny golden halo, looking innocent; the guide stands next to the pig with a disbelieving face. |
| **F13** | Same standoff a moment later: the soldiers lower their rifles and sigh with relief, the British sailors shrug and lean on their cannons, a white dove flies across the sky; the guide wipes sweat from his forehead and smiles. |
| **F14** | An elegant 1870s European palace hall: an old bearded arbitrator in a dark military coat sits at a large table reading thick documents with a magnifying glass; an American diplomat and a British diplomat in frock coats stand on opposite sides of the table waiting nervously; the guide peeks over the documents. |
| **F15** | Same hall: the arbitrator stamps a document with a big stamp and points to the American diplomat; the American diplomat cheers and the British diplomat shakes his hand politely; the guide claps. |
| **F16** | A peaceful sunny meadow on San Juan Island with the sea behind: an American flag flies on a tall wooden flagpole above a small white building, a few soldiers relaxing; the stickman guide stands below the flag giving a thumbs up. |
| **F17** | Same peaceful meadow at sunset: the black pig (use the 'babi' sheet) floats in the sky above the flagpole as a cute translucent ghost with angel wings and a small golden halo, waving goodbye; the stickman guide looks up, shrugs with both palms up and an awkward smile. |

---

## Langkah 4 — Klip video (pilih Frame Awal & Akhir, lalu tempel prompt)

Durasi 8 detik per klip. Tambahkan kalimat penutup ini ke setiap prompt klip:
`Keep the hand-drawn 2D cartoon style, characters and colors exactly as in the frames. No dialogue, no voices, no text. Only natural ambient sound.`

| Klip | Narasi (waktu) | Awal → Akhir | Prompt gerakan |
|---|---|---|---|
| **1** | 0:00–0:06 *"Bayangkan, seekor babi hampir membuat Amerika dan Inggris berperang."* | F01 → F02 | The camera pulls back quickly from the guide and the pig into a wide shot, revealing American soldiers marching in from the left and a British warship sailing in from the right; the pig looks around, confused; flags flutter. |
| **2** | 0:06–0:14 *"Tahun 1859, di Pulau San Juan, seorang petani Amerika bernama Lyman Cutler kesal karena babi milik perusahaan Inggris terus memakan kentangnya."* | F03 → F04 | The pig keeps digging up potatoes, dirt flying; Cutler marches to the fence, getting angrier, grabs his rifle from his back and raises it to his shoulder; the pig slowly looks up with a guilty face; slow push-in. |
| **3** | 0:14–0:20 *"…Ia pun menembak babi itu."* | F04 → F05 | Quick cut-in on Cutler's face, a sudden white puff of smoke from the rifle, the pig ducks out of sight behind the potato plants, leaves float down; the guide covers his eyes; a small camera shake. Non-graphic, no blood. |
| **4** | 0:20–0:25 *"Pemiliknya marah, lalu pihak Inggris mengancam menangkap Cutler."* | F06 → F07 | Griffin stomps and shouts, waving his cane; two British officials walk in from the side holding handcuffs and point at Cutler; Cutler backs away step by step. |
| **5** | 0:25–0:29 *"Masalahnya, pulau tersebut memang sedang diperebutkan kedua negara."* | F08 → F09 | The two flags pull their ropes harder in a tug-of-war, the island wobbles and shakes, little ships and soldiers gather on both sides; the guide clings on. |
| **6** | 0:29–0:34 *"Amerika mengirim tentara, Inggris membalas dengan kapal perang."* | F10 → F11 | The camera pans from US soldiers landing on the beach and setting up tents to the sea, where British warships glide into the bay and turn their cannons toward the shore. |
| **7** | 0:34–0:39 *"Dua kekuatan besar kini saling berhadapan hanya karena seekor babi."* | F11 → F12 | Slow dramatic dolly-in toward the middle of the beach; both sides aim their weapons; the pig appears in the center, blinking innocently; tension builds, wind blows sand. |
| **8** | 0:39–0:43 *"Untungnya, tak satu pun pihak melepaskan tembakan."* | F12 → F13 | The tension breaks: soldiers lower their rifles, sailors shrug, a white dove flies across the frame; the guide wipes his forehead and smiles. |
| **9** | 0:43–0:52 *"Sengketa itu akhirnya diselesaikan melalui arbitrase pada tahun 1872 dan Pulau San Juan menjadi milik Amerika."* | F14 → F15 | The arbitrator flips through documents, looks up, then slams a big stamp onto the paper and points to the American side; the American diplomat celebrates, the British diplomat politely shakes hands. *(Lanjutkan dengan klip kecil F15 → F16 bila perlu: transisi ke bendera Amerika berkibar di pulau.)* |
| **10** | 0:52–0:58 *"Bagian paling absurd, satu-satunya korban dalam perang babi ini, ya babinya sendiri."* | F16 → F17 | The sky turns to sunset as the pig's ghost rises gently above the flagpole with little angel wings and a halo, waving goodbye; the guide looks up and shrugs at the camera. |

---

## Tips

- **Konsistensi**: lampirkan Ingredient karakter yang sama saat membuat setiap frame; buat frame berurutan (F01, F02, …) dan pakai frame sebelumnya sebagai referensi tambahan agar latar tetap sama.
- **Klip menyambung**: klip 3, 7, dan 8 memakai frame akhir klip sebelumnya sebagai frame awal, jadi gerakannya mengalir tanpa lompatan.
- **Video pendek (Shorts/Reels)**: ganti `16:9 widescreen composition` dengan `9:16 vertical composition, main characters centered` di Gaya gambar, lalu pilih rasio 9:16 di Flow.
- **Audio Flow**: matikan suara atau pakai hanya suasana; narasi, musik, dan efek suara (tembakan, terompet, ombak) lebih rapi ditambahkan saat editing.
