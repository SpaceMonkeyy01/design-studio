// Real-browser render test. Serves dist/, opens it in Chromium (real GPU by default),
// times sample load + each fixture upload, and saves screenshots to test-output/.
// Usage: npm run test:visual            (headless, real GPU if available)
//        HEADED=1 npm run test:visual   (watch it run)
//        SWIFTSHADER=1 npm run test:visual  (CPU fallback for machines without GPU; slow)
//        CHANNEL=msedge npm run test:visual (use installed Edge/Chrome instead of Playwright's Chromium)
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const out = fileURLToPath(new URL('../test-output/', import.meta.url)); fs.mkdirSync(out, { recursive: true });
const fixtures = ['logo-colored-serif.png', 'logo-white-on-transparent.png'].map(f => fileURLToPath(new URL('fixtures/' + f, import.meta.url)));
const types = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.json':'application/json' };
const server = http.createServer((req, res) => { const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html'); if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404).end(); return; } res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); });
await new Promise(r => server.listen(0, '127.0.0.1', r)); const url = `http://127.0.0.1:${server.address().port}/`;
const args = process.env.SWIFTSHADER ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--ignore-gpu-blocklist', '--enable-gpu'];
const browser = await chromium.launch({ headless: !process.env.HEADED, args, channel: process.env.CHANNEL });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } }); page.setDefaultTimeout(180000);
const logs = []; page.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(`${m.type()}: ${m.text()}`); }); page.on('pageerror', e => logs.push('pageerror: ' + e.message));
const results = []; const stage = page.locator('#stage');
const snap = async name => { await page.waitForTimeout(1000); await page.screenshot({ path: path.join(out, name + '.png'), clip: await stage.boundingBox() }); };
let t = Date.now(); await page.goto(url);
await page.waitForFunction(() => /Halo-lit/.test(document.getElementById('status').textContent));
results.push({ step: 'sample first build', ms: Date.now() - t }); await snap('01-sample');
const gpu = await page.evaluate(() => { const c = document.createElement('canvas').getContext('webgl2'); const d = c && c.getExtension('WEBGL_debug_renderer_info'); return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
let n = 2;
for (const f of fixtures) {
  const name = path.basename(f); t = Date.now(); await page.setInputFiles('#file', f);
  await page.waitForFunction(n => { const s = document.getElementById('uploadstatus').textContent; return s.includes(n) && !/Loading/.test(s); }, name);
  const status = await page.textContent('#uploadstatus'); const ok = /^Loaded/.test(status);
  results.push({ step: 'upload ' + name, ms: Date.now() - t, ok, status });
  await page.click('[data-view=front]'); await snap(String(n++).padStart(2, '0') + '-' + name.replace('.png', ''));
}
console.log(JSON.stringify({ gpu, results, budget_ms: 5000, over_budget: results.filter(r => r.ms > 5000).map(r => r.step), console: logs }, null, 2));
await browser.close(); server.close();
process.exitCode = results.every(r => r.ok !== false) ? 0 : 1;
