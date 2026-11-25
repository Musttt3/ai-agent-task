#!/bin/bash
# One render at a time from a queue file: echo 22 >> review/render_queue.txt (shots are taken from the top).
cd "$(dirname "$0")/.."
Q=review/render_queue.txt; touch $Q
while true; do
  while pgrep -f "shots/render.sh" > /dev/null; do sleep 30; done
  s=$(head -1 $Q)
  if [ -z "$s" ]; then sleep 60; continue; fi
  [ "$s" = "STOP" ] && exit 0
  sed -i 1d $Q
  shots/render.sh $s
done
