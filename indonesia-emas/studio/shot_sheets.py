# shot_sheets.py <dir> <prefix> : one sheet per 7 shots, each row = AWAL / ANTISIPASI / AKSI / TAHAN
import json, sys, os
from PIL import Image, ImageDraw
d, prefix = sys.argv[1], sys.argv[2]
J = json.load(open("shot_frames.json")); ids = list(J)
tw, th, lab = 180, 320, 20
for k in range(0, len(ids), 7):
    part = ids[k:k + 7]
    S = Image.new("RGB", (4 * tw + 70, len(part) * (th + lab)), "white"); D = ImageDraw.Draw(S)
    for r, sid in enumerate(part):
        y = r * (th + lab); D.text((6, y + th // 2), "SHOT\n " + sid, fill="black")
        for c, (fr, nm) in enumerate(zip(J[sid], ["awal", "antisipasi", "aksi", "tahan"])):
            p = os.path.join(d, f"{prefix}{fr:04d}.jpg")
            if os.path.exists(p): S.paste(Image.open(p).convert("RGB").resize((tw, th)), (70 + c * tw, y + lab))
            D.text((74 + c * tw, y + 4), f"{nm} {fr}", fill="black")
    S.save(os.path.join(d, f"lembar_shot_{part[0]}-{part[-1]}.jpg"), quality=85)
    print("sheet", part[0], part[-1])
