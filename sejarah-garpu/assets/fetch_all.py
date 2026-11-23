#!/usr/bin/env python3
import os, sys, subprocess
from concurrent.futures import ThreadPoolExecutor
HERE = os.path.dirname(os.path.abspath(__file__))
rows = [l.split() for l in open(os.path.join(HERE, "ph_list.txt")) if l.strip() and not l.startswith("#")]
def run(r):
    p = subprocess.run([sys.executable, os.path.join(HERE, "fetch_ph.py"), *r], capture_output=True, text=True)
    return (p.stdout.strip() or p.stderr.strip().splitlines()[-1]) if (p.stdout or p.stderr) else "?"
with ThreadPoolExecutor(6) as ex:
    for out in ex.map(run, rows): print(out, flush=True)
