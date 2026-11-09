# Alat bantu Krakatau

- `depth.py OUTDIR name=gambar.png ...` membuat `name.jpg` (1188x2112) dan `name_depth.png` (putih = dekat)
  dengan Depth Anything V2 Large (transformers + torch CPU). Depth diperlebar sedikit di tepi objek dekat
  supaya tepi orang/ombak tidak "tertarik" saat kamera bergerak.
- `fix_java.py in.png out.jpg` mengganti label peta AI yang salah eja ("JAYA") menjadi "JAVA".

Hasilnya dipakai oleh `shorts/studio/src/videos/krakatau` (komposisi Remotion `KrakatauSample`).
Render: `npx remotion render src/index.ts KrakatauSample out/krakatau_sample_silent.mp4 --muted`,
lalu `python3 shorts/krakatau/audio/mix.py` dan mux dengan ffmpeg.
