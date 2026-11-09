# usage: depth.py OUTDIR name=path ...  -> OUTDIR/name.jpg (1188x2112 color) + OUTDIR/name_depth.png (8-bit, white = near)
import sys, numpy as np, torch, cv2
from PIL import Image
from transformers import pipeline
out = sys.argv[1]
pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Large-hf", device="cpu")
for arg in sys.argv[2:]:
    name, path = arg.split("=", 1)
    im = Image.open(path).convert("RGB")
    W, H = 1188, 2112
    im_s = im.resize((W, H), Image.LANCZOS)
    im_s.save(f"{out}/{name}.jpg", quality=93)
    # run at higher input res for crisper edges
    pipe.image_processor.size = {"height": 1022, "width": 574}  # multiples of 14, 9:16-ish
    pipe.image_processor.keep_aspect_ratio = False
    d = np.array(pipe(im)["predicted_depth"].squeeze().float().numpy(), dtype=np.float32)
    d = cv2.resize(d, (W, H), interpolation=cv2.INTER_CUBIC)
    lo, hi = np.percentile(d, 1), np.percentile(d, 99.5)
    d = np.clip((d - lo) / (hi - lo), 0, 1)
    # grow near regions slightly so foreground edges keep their own pixels when the camera moves
    d = cv2.dilate(d, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    d = cv2.GaussianBlur(d, (0, 0), 2.5)
    cv2.imwrite(f"{out}/{name}_depth.png", (d * 255).astype(np.uint8))
    print(name, d.shape, float(d.mean()))
