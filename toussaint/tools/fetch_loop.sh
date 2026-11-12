#!/usr/bin/env bash
# Keep fetching until every asset is downloaded at full size (Wikimedia rate-limits this IP in bursts).
cd "$(dirname "$0")/.."
while true; do
  left=$(python3 -c "import json,os;A=json.load(open('data/assets.json'));A.pop('_note');print(sum(1 for k in A if not any(os.path.exists(f'assets/broll/{k}{e}') for e in ('.jpg','.mp4'))))")
  echo "$(date +%T) remaining $left"; [ "$left" = "0" ] && break
  python3 tools/fetch_assets.py; python3 tools/fix_assets.py; sleep 240
done
echo "$(date +%T) all assets downloaded"
