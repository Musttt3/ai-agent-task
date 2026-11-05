# prep_images.py SRC_DIR OUT_DIR: supplied 9:16 PNGs -> 1242x2208 JPEG (15% headroom for camera moves), named by content
import sys, os
from PIL import Image, ImageFilter
NAMES = {
    "07f99c04": "penyidik", "0f938de7": "telepon_wanita", "167af696": "polri_pers", "2ffea497": "sidang",
    "4123a772": "presiden_target", "4a26935a": "tanpa_verifikasi", "4ac88186": "privasi_retak",
    "4b38a9c0": "operator_cctv", "769b8001": "akses_kartu", "7d59af5f": "verifikasi", "82339e28": "deteksi",
    "9ba6e135": "nomor_telepon", "9d600a19": "sasaran", "c17a984e": "presiden_telepon", "dc346c04": "rapat_publik",
    "e6ca0f18": "perintah", "ee5c15cf": "dpr", "f4829746": "hakim",
}
W, H = 1242, 2208
src, out = sys.argv[1], sys.argv[2]
for f in sorted(os.listdir(src)):
    if not f.endswith(".png"):
        continue
    name = NAMES[f[:8]]
    im = Image.open(os.path.join(src, f)).convert("RGB")
    r = max(W / im.width, H / im.height)            # cover
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x, y = (im.width - W) // 2, (im.height - H) // 2
    im = im.crop((x, y, x + W, y + H)).filter(ImageFilter.UnsharpMask(radius=1.6, percent=45, threshold=2))
    im.save(os.path.join(out, name + ".jpg"), quality=90, optimize=True)
    print(name, f[:8])
