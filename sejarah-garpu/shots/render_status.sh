#!/bin/bash
# render status: frames done / 1515, empty placeholders (crashed frames), current shot, rate over the last 30 minutes
cd "$(dirname "$0")/../out/frames"
done=$(find . -name "*.png" -size +1k | wc -l); empty=$(find . -name "*.png" -size -1k | wc -l)
recent=$(find . -name "*.png" -size +1k -mmin -30 | wc -l)
cur=$(grep "^=== render" ../render.log | tail -1)
echo "frames $done/1515, empty $empty, last 30 min $recent, $cur, $(date +%T)"
