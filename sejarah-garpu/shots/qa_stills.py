# QA stills from a saved shot (when the build process ran out of memory before its stills):
#   blender -b shots/blend/<SID>.blend --python shots/qa_stills.py -- <SID> [frame ...]
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shot_lib import stills
a = sys.argv[sys.argv.index("--") + 1:]
print("STILLS", stills(a[0], [int(x) for x in a[1:]] or None))
