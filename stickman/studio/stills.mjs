// node stills.mjs out/dir/prefix t1,t2,... [scale]  (times in seconds) -> stills with one bundle
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import fs from "fs";
const [prefix, timesArg, scaleArg] = process.argv.slice(2);
const frames = timesArg.split(",").map((t) => Math.round(Number(t) * 30));
const scale = Number(scaleArg ?? 0.5);
fs.mkdirSync(path.dirname(prefix), { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable: "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell", chromiumOptions: { gl: "swangle" } });
const inputProps = { audio: false };
const composition = await selectComposition({ serveUrl, id: "Helikopter", inputProps, puppeteerInstance: browser });
for (const f of frames) {
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${String(f).padStart(5, "0")}.jpg`, imageFormat: "jpeg", jpegQuality: 85, scale, inputProps, puppeteerInstance: browser, chromiumOptions: { gl: "swangle" } });
}
console.log("done", frames.length);
await browser.close({ silent: true });
