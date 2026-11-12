// QA helper: camera speed per frame (+ beat timing) -> out/qa/camera.json ; then tools/qa_plot.py draws the graph.
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }
const ROOT = path.resolve(__dirname, '..');
(async () => {
  const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.woff2': 'font/woff2' }[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }).listen(0);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await pg.goto(`http://127.0.0.1:${srv.address().port}/render/index.html`); await pg.waitForFunction(() => window.__ready);
  await pg.evaluate(d => window.__init(d), '/' + (process.argv[2] || 'data/beats.json'));
  const r = await pg.evaluate(() => window.__camSpeeds());
  fs.mkdirSync(path.join(ROOT, 'out/qa'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'out/qa/camera.json'), JSON.stringify(r));
  console.log('frames', r.speeds.length); await b.close(); srv.close();
})();
