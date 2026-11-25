#!/bin/bash
# Heavy shots (e.g. the banquet, 12): wait until no other rebuild runs, then build alone (render may continue).
cd "$(dirname "$0")/.."
while pgrep -f "shots/(rebuild_audit|build_when_free).sh" > /dev/null; do sleep 60; done
exec shots/rebuild_audit.sh "$@"
