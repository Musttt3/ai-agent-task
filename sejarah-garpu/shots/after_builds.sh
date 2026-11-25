#!/bin/bash
# Run a command once no shot build has been running for 3 minutes (memory: one build + one render at a time).
cd "$(dirname "$0")/.."
quiet=0
while [ $quiet -lt 3 ]; do
  if pgrep -f "shots/(rebuild_audit|build_alone|build_when_free).sh" > /dev/null; then quiet=0; else quiet=$((quiet+1)); fi
  sleep 60
done
exec "$@"
