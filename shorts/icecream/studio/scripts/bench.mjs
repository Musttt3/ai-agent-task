// node scripts/bench.mjs frame scale '{"post":{...}}' ... -> time one still per props variant (same bundle)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
const [frameArg, scaleArg, ...variants] = process.argv.slice(2);
process.env.TMPDIR = "/home/user/rtmp";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const chromiumOptions = { gl: "swangle" };
for (const v of variants) {
  const inputProps = { post: { audio: false, ...JSON.parse(v).post } };
  const browser = await openBrowser("chrome", { browserExecutable: "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell", chromiumOptions });
  const composition = await selectComposition({ serveUrl, id: "IceCream", inputProps, puppeteerInstance: browser });
  const ts = [];
  for (const f of [Number(frameArg), Number(frameArg) + 1, Number(frameArg) + 2]) {
    const t0 = Date.now();
    await renderStill({ composition, serveUrl, frame: f, output: `out/bench/${f}_${v.replace(/[^a-z0-9]/gi, "")}.jpg`, imageFormat: "jpeg", scale: Number(scaleArg), inputProps, puppeteerInstance: browser, chromiumOptions, timeoutInMilliseconds: 240000 });
    ts.push(Date.now() - t0);
  }
  console.log(v, ts.join(" "), "ms");
  await browser.close({ silent: true });
}
