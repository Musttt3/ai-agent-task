"""Edit video stickman "Memancing 12.000 Tahun Lalu di Pulau Alor".

Gaya: pergantian gambar dengan cut sederhana, tanpa SFX/musik.
Waktu tiap gambar diambil dari daftar_adegan.csv, lalu disinkronkan ke
voice over asli: setiap timestamp naskah dipetakan ke awal kalimat yang
sebenarnya di audio (hasil transkripsi whisper, lihat align.json).

Pakai:  python3 build.py <folder_bahan> <align.json> <output.mp4>
"""
import csv, json, subprocess, sys, os, bisect

FPS = 30
TAIL = 2.5      # tahan gambar terakhir setelah narasi selesai (detik)
LEAD = 0.05     # cut sedikit sebelum kata pertama terucap

src, align_path, out = sys.argv[1:4]
vo = next(os.path.join(src, f) for f in os.listdir(src) if f.endswith(".mp3"))
rows = list(csv.DictReader(open(os.path.join(src, "daftar_adegan.csv"), encoding="utf-8-sig")))

def secs(s):
    m, x = s.split(":"); return int(m) * 60 + int(x)

# titik peta: (detik di naskah, detik di audio)
pts = sorted((t, a) for t, a, _ in json.load(open(align_path)) if a is not None)
xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
def to_audio(t):
    if t <= xs[0]: return ys[0] + (t - xs[0])
    if t >= xs[-1]: return ys[-1] + (t - xs[-1])
    i = bisect.bisect_right(xs, t) - 1
    if xs[i + 1] == xs[i]: return ys[i]
    return ys[i] + (ys[i + 1] - ys[i]) * (t - xs[i]) / (xs[i + 1] - xs[i])

vo_dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                        "-of", "csv=p=0", vo]))
total = round((vo_dur + TAIL) * FPS) / FPS

starts = []
for i, r in enumerate(rows):
    t = 0.0 if i == 0 else max(0.0, to_audio(secs(r["waktu"])) - LEAD)
    f = round(t * FPS)
    if starts: f = max(f, starts[-1] + 15)   # minimal 0,5 detik per gambar
    starts.append(f)
ends = starts[1:] + [round(total * FPS)]

work = os.path.dirname(os.path.abspath(out))
with open(os.path.join(work, "timeline.csv"), "w", newline="", encoding="utf-8") as fh:
    w = csv.writer(fh); w.writerow(["no", "gambar", "mulai", "selesai", "durasi_detik", "adegan"])
    for i, r in enumerate(rows):
        fmt = lambda fr: f"{fr // FPS // 60}:{fr / FPS % 60:06.3f}"
        w.writerow([i + 1, r["nama_baru"], fmt(starts[i]), fmt(ends[i]), f"{(ends[i]-starts[i])/FPS:.3f}", r["adegan"]])

lst = os.path.join(work, "concat.txt")
with open(lst, "w") as fh:
    for i, r in enumerate(rows):
        fh.write(f"file '{os.path.join(os.path.abspath(src), r['nama_baru'])}'\n")
        fh.write(f"duration {(ends[i]-starts[i])/FPS:.6f}\n")
    fh.write(f"file '{os.path.join(os.path.abspath(src), rows[-1]['nama_baru'])}'\n")

tmp = out + ".tmp.mp4"
subprocess.check_call([
    "ffmpeg", "-v", "error", "-stats", "-y",
    "-f", "concat", "-safe", "0", "-i", lst,
    "-i", vo,
    "-filter_complex",
    # 1376x768 -> isi penuh 1920x1080 (potong ~7 px kiri-kanan), cut keras tanpa transisi
    f"[0:v]scale=1935:1080:flags=lanczos,crop=1920:1080,setsar=1,fps={FPS},format=yuv420p[v];"
    f"[1:a]aresample=48000,apad=whole_dur={total}[a]",
    "-map", "[v]", "-map", "[a]", "-t", f"{total}",
    "-c:v", "libx264", "-preset", "slow", "-crf", os.environ.get("CRF", "27"), "-tune", "animation",
    "-g", "300", "-r", str(FPS), "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", "160k", tmp])
os.replace(tmp, out)
print("selesai:", out, f"{total:.2f} detik, {len(rows)} gambar")
