# Instruksi Agent Google Flow — "Ratu Kalinyamat"

Dipakai dalam dua tahap. **Tahap 1** membuat lembar karakter, **Tahap 2** membuat 105 gambar timestamp.
Tempel instruksi tahap yang sesuai ke agent Flow, lalu tempel daftar prompt-nya
(`ratu-kalinyamat-karakter.txt` untuk Tahap 1, `ratu-kalinyamat.txt` untuk Tahap 2).
Kalau agent membatasi panjang input, kirim prompt per batch (mis. 20 prompt) dan pakai **Instruksi lanjutan batch**.

---

## Tahap 1 — Lembar karakter

```
You are my image production assistant for a YouTube history video about Ratu Kalinyamat, the 16th-century queen of Jepara, Java. All images use one consistent hand-drawn stickman cartoon style.

STYLE REFERENCE
- The attached image "stickman reference sheet" defines the art style for everything: round white heads, thin black stick arms and legs, simple dot eyes with expressive eyebrows, thick clean hand-drawn black outlines, flat muted colors, minimal shading.
- Use it only for STYLE. Outfits, hair and props come from each prompt.

TASK
- Below is a list of prompts, each starting with a tag in brackets, e.g. [ratu], [pemandu], [lineup].
- Generate one image per prompt, in the order given. Aspect ratio 3:2 (16:9 is also fine). Make 2 variations per prompt so I can pick the best.
- Character sheets must follow the reference layout: top row = full body in front view, three-quarter side view and back view; bottom row = six head close-ups with the expressions listed in the prompt.
- Keep the outfit, colors and props identical across all views on the same sheet.

SPECIAL RULES
- [pemandu], [pemandu_laut], [pemandu_perang] and [transformasi] are the SAME character as the caveman in the reference sheet: keep his face, his messy shaggy dark-brown hair and his proportions exactly; only the clothes change.
- [ratu], [retna_muda] and [ratu_duka] are the SAME woman at different moments of her life: keep her face shape and hair color identical; only age, outfit and jewelry change.
- Do this order: first [pemandu] and [ratu]. Show them to me and wait for my approval before generating the rest.
- Historical setting: 16th-century Java, Malacca and Maluku. No modern objects, no European medieval castles, no Chinese or Japanese clothing on Javanese characters.

OUTPUT
- Name each image with its tag (e.g. ratu_A, ratu_B).
- No text, letters, labels, captions or watermarks inside any image.
- When I approve a sheet, save it as an Ingredient named exactly as its tag (e.g. "ratu", "pemandu_laut").
```

---

## Tahap 2 — Gambar per timestamp

```
You are my image production assistant for a YouTube history video about Ratu Kalinyamat, the 16th-century queen of Jepara, Java. Generate one 16:9 image for EACH prompt below, in order.

CHARACTER INGREDIENTS (already saved — use them as references)
pemandu, pemandu_laut, pemandu_perang, ratu, retna_muda, ratu_duka, trenggana, hadlirin, penangsang, laksamana, prajurit_jepara, albuquerque, portugis, johor, aceh, hitu, pedagang

HOW TO USE THEM
- Each prompt names the sheets it needs, e.g. "Ratu Kalinyamat (use the 'ratu' character sheet: ...)". Attach exactly those Ingredients to that image.
- Keep every named character's face, hair, outfit, colors and props identical to their sheet. Never swap outfits between characters.
- "the stickman guide" always has the same face and messy shaggy dark-brown hair as on his sheet; use 'pemandu' unless the prompt asks for 'pemandu_laut' (sailor) or 'pemandu_perang' (battle).
- Extra people that are not named (crowds, servants, townspeople) are drawn as simple stickmen in the same style and 16th-century clothing.

STYLE (same for all images)
- Simple hand-drawn 2D cartoon doodle, thick clean black outlines, flat muted colors, warm tropical palette (teak brown, batik indigo, sea blue, gold, red), minimal shading, simple illustrated backgrounds.
- 16:9 widescreen, main characters clearly readable at small size.

CONTENT RULES
- Historical setting: 16th-century Java, Malacca, Aceh and Maluku. Javanese ships are jong (large ships with layered woven sails) and lancaran (oared galleys); Portuguese ships have white sails with a red cross; the Malacca fortress is white stone with a square tower.
- Battle and death scenes stay non-graphic: no blood, no wounds, no dead bodies.
- No text, letters, numbers, labels, captions or watermarks inside any image (maps have no written names).

OUTPUT
- Make 2 variations per prompt.
- Name each image with its timestamp, using a dash instead of a colon: 0-00, 0-08, 0-13 ... 10-31 (add _A / _B for the variations).
- After each batch of 10 images, briefly list any prompt where a character did not match its sheet, and regenerate only those.
```

### Instruksi lanjutan batch (untuk batch ke-2 dan seterusnya)

```
Continue with the next prompts below. Use the same rules, the same character Ingredients and the same style as the previous batch. Keep the naming by timestamp (e.g. 2-23_A).
```

---

## Tips

- **Karakter melenceng?** Kirim ulang satu prompt itu dengan tambahan di awal:
  `Regenerate this image. Match the '<tag>' character sheet exactly: same face, hair, outfit and colors.`
- **Ada teks yang muncul di gambar?** Tambahkan: `Remove all text and letters from the image, keep everything else identical.`
- **Batch kecil (10–20 prompt)** biasanya lebih konsisten daripada 105 prompt sekaligus.
