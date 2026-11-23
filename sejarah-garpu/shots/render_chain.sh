#!/bin/bash
# wait for the running render batch, then render the remaining shots
cd "$(dirname "$0")/.."
while pgrep -f "shots/render.sh" > /dev/null; do sleep 30; done
while pgrep -f "build_all.sh" > /dev/null; do sleep 30; done
shots/render.sh 04 12 18 19 17
