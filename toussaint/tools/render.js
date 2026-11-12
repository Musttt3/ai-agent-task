// Render driver: headless Chromium (WebGL via SwiftShader) -> JPEG frames -> ffmpeg (H.264 High, yuv420p, CRF 18).
// usage: node tools/render.js --data data/beats.json --from 0 --to 600 --out out/part.mp4
//        node tools/render.js --data data/beats.json --stills 30,90,150 --stillDir out/stills
const http = require('http'), fs = require('fs'), path = require('path'), { spawn, execSync } = require('child_process');
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }
const ROOT = path.resolve(__dirname, '..');
const A = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, arr) => (v.startsWith('--') && acc.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]), acc), []));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png' };

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, r) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

(async () => {
  const srv = await serve(), port = srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('[page]', m.text()); });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${port}/render/index.html`);
  await page.waitForFunction(() => window.__ready === true);
  const t0 = Date.now();
  const info = await page.evaluate(d => window.__init(d), '/' + (A.data || 'data/beats.json'));
  console.error(`init ${((Date.now() - t0) / 1000).toFixed(1)}s, ${info.objects} objects, ${info.frames} frames`);
  const grab = async (f, png) => { const r = await page.evaluate(([f, png]) => window.__frame(f, { png }), [f, png]); return { buf: Buffer.from(r.url.split(',')[1], 'base64'), N: r.N, tr: r.tr, te: r.te }; };

  if (A.stills) {
    fs.mkdirSync(A.stillDir, { recursive: true });
    for (const f of String(A.stills).split(',').map(Number)) { const g = await grab(f, !A.jpg); fs.writeFileSync(path.join(A.stillDir, `f${String(f).padStart(5, '0')}.${A.jpg ? 'jpg' : 'png'}`), g.buf); console.error('still', f, 'N', g.N, 'render', g.tr.toFixed(0), 'ms encode', g.te.toFixed(0), 'ms'); }
  } else {
    const from = +(A.from || 0), to = +(A.to || info.frames);
    fs.mkdirSync(path.dirname(A.out), { recursive: true });
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', A.out], { stdio: ['pipe', 'inherit', 'inherit'] });
    let last = Date.now();
    for (let f = from; f < to; f++) {
      const { buf, N } = await grab(f, false);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if ((f - from) % 30 === 0) { const el = (Date.now() - t0) / 1000; console.error(`frame ${f}/${to} N=${N} ${((Date.now() - last) / 30).toFixed(0)}ms/f  elapsed ${el.toFixed(0)}s`); last = Date.now(); }
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
