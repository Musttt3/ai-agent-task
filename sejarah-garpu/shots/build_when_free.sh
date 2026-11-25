#!/bin/bash
# Run rebuild_audit for the given shots once fewer than 2 rebuild lanes are running (memory: 2 builds + 1 render)
cd "$(dirname "$0")/.."
while [ $(pgrep -fc "^/bin/bash shots/rebuild_audit.sh") -ge 2 ]; do sleep 30; done
exec shots/rebuild_audit.sh "$@"
