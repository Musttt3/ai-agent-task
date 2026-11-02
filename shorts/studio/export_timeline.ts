import { T, SHOTS, TOTAL } from "./src/videos/lascaux/story";
import { VOICE_END } from "./src/videos/lascaux/timing";
import words from "./src/videos/lascaux/words.json";
console.log(JSON.stringify({ fps: 30, total: TOTAL, voiceEnd: VOICE_END, T, shots: SHOTS, words }));
