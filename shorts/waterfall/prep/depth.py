import numpy as np, torch
from PIL import Image
from transformers import pipeline
pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device="cpu")
for i in (1,2,3):
    im = Image.open(f'p{i}_clean.png').convert('RGB')
    out = pipe(im)
    d = out["predicted_depth"]
    d = torch.nn.functional.interpolate(d[None] if d.dim()==3 else d[None,None], size=(im.height, im.width), mode="bicubic", align_corners=False)[0,0].numpy()
    d = (d - np.percentile(d,1)) / (np.percentile(d,99.5) - np.percentile(d,1)); d = np.clip(d,0,1)
    Image.fromarray((d*255).astype(np.uint8)).save(f'p{i}_depth.png'); print(i, d.shape)
