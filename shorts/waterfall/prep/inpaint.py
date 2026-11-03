import numpy as np, cv2, time
from PIL import Image
from simple_lama_inpainting import SimpleLama
lama = SimpleLama()
im = np.array(Image.open('photo.jpg').convert('RGB'))
m = np.array(Image.open('mask_final.png').convert('L'))
md = cv2.dilate((m > 20).astype(np.uint8)*255, cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(31,31)))
xs = [(0,496),(496,1042),(1042,1500)]
for i,(a,b) in enumerate(xs,1):
    t=time.time()
    crop = im[:,a:b]; mk = md[:,a:b]
    if mk.max()==0:
        out = crop
    else:
        out = np.array(lama(Image.fromarray(crop), Image.fromarray(mk)))[:crop.shape[0],:crop.shape[1]]
    Image.fromarray(out).save(f'p{i}_clean.png'); print(i, out.shape, time.time()-t)
