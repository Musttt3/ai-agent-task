// Write the shot list from src/timeline.ts to audio/timeline.json for the Python mixer.
// Run: node --experimental-strip-types scripts/export_timeline.mjs
import fs from 'node:fs';
const m = await import('../src/timeline.ts');
fs.writeFileSync(new URL('../audio/timeline.json', import.meta.url), JSON.stringify({shots: m.SHOTS, pad: m.PAD, duration: m.DURATION_S}, null, 1));
console.log('shots', m.SHOTS.length);
