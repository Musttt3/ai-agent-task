#!/bin/bash
# Downloads the source pack (Google Drive: Helikopter/Helikopter.zip) into studio/public.
set -e
cd "$(dirname "$0")/.."
TMP=$(mktemp -d)
curl -sSL -o "$TMP/heli.zip" "https://drive.usercontent.google.com/download?id=19-Qe4VhcEvOOWdF9Hkn4HvfWD1z1oxem&export=download&confirm=t"
unzip -q "$TMP/heli.zip" -d "$TMP"
D=$(dirname "$(ls "$TMP"/*/001.jpg)")
mkdir -p studio/public/img
cp "$D"/*.jpg studio/public/img/
cp "$D"/ElevenLabs*.mp3 studio/public/narasi.mp3
rm -rf "$TMP"
echo "bahan siap: $(ls studio/public/img | wc -l) gambar + narasi.mp3"
