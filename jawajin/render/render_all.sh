#!/bin/bash
# usage: render_all.sh [seg indices...]  (default: all 16)
cd "$(dirname "$0")/.."
TOTAL=16237; N=16; STEP=$(( (TOTAL + N - 1) / N ))
IDX=${@:-$(seq 0 $((N-1)))}
export OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1
for i in $IDX; do
  f0=$(( i * STEP )); f1=$(( (i+1) * STEP )); [ $f1 -gt $TOTAL ] && f1=$TOTAL
  echo "$f0 $f1 out/seg/seg$(printf %02d $i).mp4"
done | xargs -P 4 -L 1 sh -c 'python3 render/run.py --seg $0 $1 $2 > $2.log 2>&1'
