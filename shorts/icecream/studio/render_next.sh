#!/bin/bash
# render_next.sh [N]: render the next N (default 3) unfinished chunks, so one call fits in a 2 h background slot
cd "$(dirname "$0")"
N=${1:-3}; STEP=150
TOTAL=$(node -e 'const s=require("./src/videos/icecream/sentences.json");console.log(s[s.length-1].slice(-1)[0][2]+45)')
for ((a=0; a<TOTAL; a+=STEP)); do [ -f out/final/chunks/$(printf %05d $a).done ] || break; done
((a>=TOTAL)) && { echo "all chunks done"; exit 0; }
./render_chunks.sh $a $((a+N*STEP)) 3
echo "rendered from $a; done chunks: $(ls out/final/chunks/*.done 2>/dev/null | wc -l) of $(( (TOTAL+STEP-1)/STEP ))"
