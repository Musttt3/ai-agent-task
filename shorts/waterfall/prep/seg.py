import sys, numpy as np
from rembg import remove, new_session
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB")
for m in sys.argv[2:]:
    s = new_session(m)
    out = remove(im, session=s, only_mask=True)
    out.save(f"mask_{m}.png"); print(m, "ok")
