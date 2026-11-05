// [COMP=id] node stills.mjs out/dir/prefix f1,f2,... [scale]  -> renders stills with one bundle (default comp LascauxShort)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import fs from "fs";
const [prefix, framesArg, scaleArg] = process.argv.slice(2);
const frames = framesArg.split(",").map(Number);
const scale = Number(scaleArg ?? 0.5);
fs.mkdirSync(path.dirname(prefix), { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable: "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell", chromiumOptions: { gl: "swangle" } });
const inputProps = { post: { audio: false } };
const composition = await selectComposition({ serveUrl, id: process.env.COMP ?? "LascauxShort", inputProps, puppeteerInstance: browser });
for (const f of frames) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${String(f).padStart(4, "0")}.jpg`, imageFormat: "jpeg", jpegQuality: 88, scale, inputProps, puppeteerInstance: browser, chromiumOptions: { gl: "swangle" } });
  console.log("frame", f, Date.now() - t0, "ms");
}
await browser.close({ silent: true });
