"""Character-sheet prompts for the video "Ratu Kalinyamat" (16th-century Jepara).
Every character is drawn in the user's stickman style (same as the caveman reference sheet).
The descriptors in CHARS are reused later by the per-timestamp prompts."""
import os

SHEET = ("Character reference sheet on a plain white background, in exactly the same art style as the attached "
         "stickman reference sheet: round white head, thin black stick arms and legs, simple dot eyes and expressive "
         "eyebrows, thick clean hand-drawn black outlines, flat muted colors, minimal shading. Layout like the "
         "reference: top row shows the character full body in three views (front view, three-quarter side view, back "
         "view) standing side by side; bottom row shows six head close-ups with different expressions: {expr}. "
         "Keep the outfit, colors and props identical in every view. No text, no labels, no letters, no watermark.")

DEFAULT_EXPR = "neutral, happy smile, worried, surprised (open round mouth), angry, sad"

# id, display name, role, appearance, expressions (None = default)
CHARS = [
    ("ratu", "Ratu Kalinyamat (Retna Kencana)", "Tokoh utama — Ratu Jepara 1549–1579",
     "a 16th-century Javanese queen of Jepara drawn as a stickman woman: round white head with a few short eyelash "
     "strokes, long black hair tied in a large low Javanese bun (sanggul) decorated with small gold hairpins and a thin "
     "gold diadem across the forehead; a long-sleeved deep emerald-green royal blouse reaching the hips with gold "
     "trim at the neckline and cuffs; a long brown-and-gold batik wrap skirt (kain jarik) down to the ankles; a "
     "maroon silk shawl (selendang) draped over one shoulder and across the body; a simple gold necklace and gold "
     "bracelets; a small keris with a carved wooden sheath tucked at the front of her waist sash; upright, dignified "
     "posture",
     "calm and dignified, proud confident smile, determined (firm eyebrows, closed mouth), worried, angry and "
     "commanding (shouting an order), grieving with tears"),
    ("retna_muda", "Retna Kencana muda", "Ratu Kalinyamat saat masih putri Demak (sebelum 1549)",
     "the same woman as the queen but younger and simpler: round white head, long black hair in a smaller bun with "
     "one gold hairpin and no diadem; a long-sleeved soft yellow blouse with thin gold trim; a brown batik wrap skirt "
     "to the ankles; a light green shawl over one shoulder; small gold earrings; curious, gentle posture",
     "neutral, happy smile, curious, worried, surprised, sad"),
    ("ratu_duka", "Retna Kencana berduka", "Setelah wafatnya Pangeran Hadlirin",
     "the same woman as the queen in mourning: hair loose and slightly untidy without any gold ornaments, a plain "
     "long-sleeved off-white blouse and a plain dark brown wrap skirt, a dark grey shawl, no jewelry, head slightly "
     "bowed",
     "grieving with tears, sad, numb and empty, quietly determined, angry, looking up with resolve"),
    ("trenggana", "Sultan Trenggana", "Ayah Retna Kencana, Sultan Demak (wafat 1546)",
     "an older 16th-century Javanese Muslim sultan of Demak drawn as a stickman: round white head with a short grey "
     "beard drawn with simple lines, a white turban wrapped around the head with a gold band and a small gold "
     "ornament at the front; a long dark-green royal robe with gold embroidery at the collar and cuffs; a brown-and-"
     "gold batik cloth wrapped at the waist; a keris with a gold hilt tucked at the back of his sash; holding a "
     "simple wooden staff; calm, authoritative posture",
     "calm and wise, proud smile, stern, worried, angry, tired and ill"),
    ("hadlirin", "Pangeran Hadlirin", "Suami Retna Kencana",
     "a young 16th-century Javanese prince drawn as a stickman: round white head with a neat black moustache, a dark "
     "blue batik head cloth (iket/udeng) tied around the head; a dark blue high-collared jacket with gold buttons and "
     "gold trim; a brown batik wrap cloth (kain) to the knees over plain trousers; a keris with a wooden sheath at the "
     "back of his waist sash; kind and gentle posture",
     DEFAULT_EXPR),
    ("penangsang", "Arya Penangsang", "Adipati Jipang, terlibat dalam konflik kekuasaan Demak",
     "a fierce 16th-century Javanese duke (adipati) drawn as a stickman: round white head with thick angry eyebrows "
     "and a large curled black moustache, a red batik head cloth (iket) tied with sharp points; a black high-collared "
     "jacket with red trim; a red sash at the waist; a dark red-and-black batik wrap cloth to the knees; a long keris "
     "with a dark wooden sheath at his waist; proud, aggressive stance with chest out",
     "arrogant smirk, angry shouting, scheming (narrow eyes, sly smile), surprised, furious, defeated"),
    ("laksamana", "Kidemang Laksamana", "Panglima armada Jepara (1574)",
     "a 16th-century Javanese naval commander drawn as a stickman: round white head with a short black moustache and "
     "beard, a dark red batik head cloth (iket) tied firmly; a short dark brown sleeveless vest over a long-sleeved "
     "off-white shirt; a wide gold-and-red sash at the waist with a keris; a brown-and-black batik wrap cloth to the "
     "knees over dark trousers; holding a long Javanese spear (tombak) with a wavy steel blade; a round rattan shield "
     "on his back; brave, steady posture",
     "calm and focused, confident grin, determined (shouting a command), worried, angry, exhausted"),
    ("prajurit_jepara", "Prajurit & pelaut Jepara", "Pasukan/awak armada Jepara (bisa digambar beramai-ramai)",
     "a 16th-century Javanese soldier and sailor of Jepara drawn as a stickman: round white head, a simple indigo "
     "batik head cloth (iket); bare stick-figure torso with a short brown sleeveless vest; a dark checkered (lurik) "
     "cloth wrapped at the waist to the knees; a red sash; holding a long spear (tombak) in one hand and a round "
     "rattan shield in the other; a keris at the waist; barefoot",
     "neutral, cheering, determined battle cry, worried, scared, exhausted"),
    ("albuquerque", "Afonso de Albuquerque", "Panglima Portugis yang merebut Malaka (1511)",
     "a 16th-century Portuguese governor and commander drawn as a stickman: round white head with a very long, "
     "pointed white beard reaching the chest, a black flat cap; a black doublet with slashed puffed sleeves showing a "
     "dark red lining; a black cape over the shoulders; black hose and boots; a long sword with a cross-shaped hilt at "
     "his side; stern, commanding posture",
     "stern, triumphant smile, scheming, surprised, angry, satisfied"),
    ("portugis", "Prajurit & kapten Portugis", "Pasukan yang mempertahankan Malaka",
     "a 16th-century Portuguese soldier drawn as a stickman: round white head with a small black moustache, a shiny "
     "steel morion helmet with a curved brim and a raised comb on top; a steel breastplate over a red puffed-sleeve "
     "shirt; baggy striped knee-length breeches in red and yellow; dark boots; holding a matchlock arquebus or a long "
     "pike; a short sword at the belt. Variant for the captain: the same outfit plus a red feather plume on the "
     "helmet and a rapier in hand",
     "neutral, arrogant smirk, alert (eyes wide, eyebrows up), angry, worried, relieved"),
    ("johor", "Sultan Johor", "Penguasa Johor yang mengajak menyerang Malaka (1550)",
     "a 16th-century Malay sultan of Johor drawn as a stickman: round white head with a short black beard, a folded "
     "golden-yellow royal head cloth (tengkolok) with a pointed peak; a long-sleeved golden-yellow Malay tunic (baju "
     "Melayu) with a high collar; a dark green songket cloth wrapped around the waist over loose trousers; a keris "
     "tucked at the front of the waist; dignified posture",
     "calm, hopeful smile, serious, worried, angry, disappointed"),
    ("aceh", "Prajurit Aceh", "Sekutu dari Kesultanan Aceh (1573)",
     "a 16th-century Acehnese warrior drawn as a stickman: round white head, a tall red-yellow-green Acehnese hat "
     "(kupiah meukeutop) with a pointed top; a black long-sleeved tunic with gold embroidery; black trousers with a "
     "red-and-gold songket cloth at the waist; a rencong (curved Acehnese dagger) tucked at the front; holding a "
     "spear; strong, ready stance",
     "neutral, determined, battle cry, worried, angry, tired"),
    ("hitu", "Masyarakat Hitu (Maluku)", "Penerima bantuan Ratu Kalinyamat di Maluku",
     "a 16th-century warrior from Hitu, Maluku, drawn as a stickman: round white head with a red headband; a short "
     "red sleeveless top; a white cloth wrapped at the waist to the knees; holding a long narrow wooden shield "
     "(salawaku) decorated with small white shell patterns and a long machete-sword (parang); barefoot",
     "neutral, grateful smile, determined, worried, angry, cheering"),
    ("pedagang", "Para pedagang Malaka & Jepara", "Pedagang Jawa, Melayu, India (Gujarat) dan Tiongkok",
     "four different 16th-century traders drawn as stickmen standing together: (1) a Javanese trader with a brown "
     "batik head cloth and a basket of spices; (2) a Malay trader with a dark songket head cloth and baju Melayu; (3) "
     "a Gujarati Indian merchant with a white turban, a long white coat (jama) and a roll of colourful cloth; (4) a "
     "Chinese merchant with a black hat and a long blue robe holding a porcelain jar",
     "friendly smile, bargaining (raised eyebrow), happy laughing, worried, surprised, thinking"),
    ("pemandu", "Si Stickman Purba (opsional)", "Pemandu/saksi seperti di video-video sebelumnya",
     "the stickman caveman from the reference sheet, completely unchanged (messy shaggy dark-brown hair, ragged brown "
     "fur tunic with white fur collar and rope belt, stone-tipped wooden spear). Use the reference sheet as is",
     "worried, happy, skeptical, surprised, scared, angry"),
]

LINEUP = ("Group lineup on a plain white background, in exactly the same art style as the attached stickman reference "
          "sheet (round white heads, thin black stick limbs, thick clean black outlines, flat muted colors). All main "
          "characters of a 16th-century Javanese history story stand side by side in front view, at the same scale, "
          "each with a neutral expression, from left to right: {names}. Keep each outfit exactly as described: {descs}. "
          "No text, no labels, no letters, no watermark.")

SHORT = {
    "ratu": "the queen with a large black hair bun, thin gold diadem, emerald-green long blouse, brown-gold batik skirt, maroon shawl and a small keris",
    "trenggana": "the old sultan with a grey beard, white turban with gold band, long dark-green robe and a wooden staff",
    "hadlirin": "the young prince with a moustache, dark blue head cloth and dark blue high-collared jacket with gold buttons",
    "penangsang": "the fierce duke with a big curled moustache, red head cloth, black jacket and red sash",
    "laksamana": "the admiral with a dark red head cloth, brown vest, gold-red sash, batik cloth, wavy-bladed spear and rattan shield",
    "albuquerque": "the Portuguese commander with a very long white beard, black flat cap, black doublet and cape, and a long sword",
}

def sheet_prompt(c):
    _id, name, role, look, expr = c
    if _id == "pedagang":
        return (f"Draw {look}, standing side by side in front view on a plain white background. Below them, a row of six "
                f"head close-ups (mixing the four traders) with these expressions: {expr}. Same art style as the attached "
                "stickman reference sheet: round white heads, thin black stick limbs, simple dot eyes and expressive "
                "eyebrows, thick clean hand-drawn black outlines, flat muted colors, minimal shading. No text, no labels, "
                "no letters, no watermark.")
    return f"Draw {look}. " + SHEET.format(expr=expr or DEFAULT_EXPR)

if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    main = [c for c in CHARS if c[0] in ("ratu", "trenggana", "hadlirin", "penangsang", "laksamana", "albuquerque")]
    lineup = LINEUP.format(names=", ".join(c[1].split(" (")[0] for c in main),
                           descs="; ".join(SHORT[c[0]] for c in main))
    with open(os.path.join(here, "ratu-kalinyamat-karakter.txt"), "w") as f:
        blocks = [f"[{c[0]}] {sheet_prompt(c)}" for c in CHARS] + [f"[lineup] {lineup}"]
        f.write("\n\n".join(blocks) + "\n")
    md = ["# Desain Karakter — \"Ratu Kalinyamat\"", "",
          f"Total: **{len(CHARS)} lembar karakter** + 1 gambar lineup. Rasio yang disarankan 3:2 atau 16:9.", "",
          "Semua karakter memakai gaya stickman yang sama dengan lembar referensi kamu (kepala bulat putih, tubuh garis "
          "hitam tipis, garis tebal doodle); yang berbeda hanya pakaian dan properti khas abad ke-16.", "",
          "## Cara pakai di Google Flow", "",
          "1. Upload lembar karakter stickman kamu sebagai **Ingredient / reference image** (untuk gaya gambar).",
          "2. Generate setiap lembar karakter di bawah. Pilih hasil terbaik untuk tiap karakter.",
          "3. Simpan hasil terpilih sebagai **Ingredient** dengan nama karakternya (mis. `Ratu Kalinyamat`). "
          "Lembar-lembar inilah yang nanti dipakai sebagai referensi saat membuat gambar per timestamp.", "",
          "### Instruksi untuk agent Flow", "", "```",
          "Generate one character reference sheet for EACH prompt below (tagged [ratu], [trenggana], ...), plus the "
          "[lineup] image. Use the attached stickman sheet only as the ART STYLE reference: round white heads, thin "
          "black stick limbs, thick clean black outlines, flat muted colors. Follow each prompt's outfit description "
          "exactly. Name each image with its tag. Do not add any text or labels.", "```", "",
          "## Daftar karakter", ""]
    for c in CHARS:
        md += [f"### {c[1]}", f"*{c[2]}*", "", "```", f"[{c[0]}] {sheet_prompt(c)}", "```", ""]
    md += ["### Lineup semua tokoh utama", "*Untuk mengecek konsistensi ukuran & gaya antar karakter*", "", "```",
           f"[lineup] {lineup}", "```", ""]
    with open(os.path.join(here, "ratu-kalinyamat-karakter.md"), "w") as f:
        f.write("\n".join(md))
    print(len(CHARS))
