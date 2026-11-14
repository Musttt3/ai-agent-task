"""Remove background untuk file _nobg yang belum ada (rembg, model isnet-general-use / birefnet)."""
import sys
from pathlib import Path
from PIL import Image
from rembg import remove, new_session
Image.MAX_IMAGE_PIXELS = None
A = Path(__file__).resolve().parent.parent / "assets"
jobs = {  # target: (sumber, model, lebar maks untuk proses)
    "TU02_diderot-van-loo_nobg.png": (A / "TU01_diderot-van-loo.jpg", "isnet-general-use", 3144),
    "TU06_heller_nobg.png": (A / "TU05_heller.jpg", "isnet-general-use", 3000),
    "LK08_medali-olimpiade_nobg.png": (A / "_original/LK08_medali-olimpiade.jpg", "isnet-general-use", 2448),
}
only = sys.argv[1:] or list(jobs)
sessions = {}
for name in only:
    src, model, maxw = jobs[name]
    if not src.exists():
        print("sumber tidak ada:", src); continue
    s = sessions.setdefault(model, new_session(model))
    im = Image.open(src).convert("RGB")
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    out = remove(im, session=s, post_process_mask=True)
    out.save(A / name)
    print("OK", name, out.size, flush=True)
