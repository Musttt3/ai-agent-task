"""Runner: python3 render/run.py <modul_bagian> sheet|video|audio|draft [waktu...]"""
import importlib
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from engine import ROOT, contact_sheet, render_section  # noqa: E402
from timeline import mix, mux  # noqa: E402

OUT = ROOT / "out"
OUT.mkdir(exist_ok=True)

mod = importlib.import_module(sys.argv[1])
cmd = sys.argv[2]
name = mod.build().name
t = time.time()
if cmd == "sheet":
    times = [float(x) for x in sys.argv[3:]]
    print(contact_sheet(mod.build, times, OUT / f"{name}_sheet.jpg"))
if cmd in ("video", "draft"):
    print(render_section(mod.build, OUT / f"{name}_video.mp4"))
if cmd in ("audio", "draft"):
    print(mix(mod.audio_events(), mod.build().duration, OUT / f"{name}_audio.wav"))
if cmd == "draft":
    print(mux(OUT / f"{name}_video.mp4", OUT / f"{name}_audio.wav", OUT / f"{name}_draft.mp4"))
print(f"selesai dalam {time.time() - t:.1f} dtk")
