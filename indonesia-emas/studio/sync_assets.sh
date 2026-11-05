#!/bin/bash
# copy Blender exports + HDRIs into public/ (Remotion serves public/), and the word timings into src
cd "$(dirname "$0")"
mkdir -p public/export public/hdri
cp ../export/*.glb ../export/*.json public/export/
cp ../assets/hdri/*.hdr public/hdri/
cp ../captions/voice.json src/ep/voice.json
cp ../assets/geo/indonesia_50m.geojson public/export/
mkdir -p public/audio && cp ../audio/voice.wav public/audio/voice.wav
ls public/export | wc -l
