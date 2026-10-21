// Real-browser render test. Serves app/, opens it in Chromium (real GPU by default),
// times sample load + each fixture upload, and saves screenshots to test-output/.
// Usage: npm run test:visual            (headless, real GPU if available)
//        HEADED=1 npm run test:visual   (watch it run)
//        SWIFTSHADER=1 npm run test:visual  (CPU fallback for machines without GPU; slow)
//        CHANNEL=msedge npm run test:visual (use installed Edge/Chrome instead of Playwright's Chromium)
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const root = fileURLToPath(new URL('../app/', import.meta.url));
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
// Fixed-camera views of the last logo, so refactors can be checked pixel-for-pixel against a baseline.
const click = sel => page.evaluate(s => document.querySelector(s).click(), sel);
const choose = (id, value) => page.evaluate(([id, value]) => { const e = document.getElementById(id); e.value = value; e.dispatchEvent(new Event('change')); }, [id, value]);
const steps = [
  ['exploded', () => click('[data-mode=exploded]')],
  ['inside', () => click('[data-mode=internal]')],
  ['gold-mirror', async () => { await click('[data-mode=assembled]'); await click('[data-view=front]'); await click('[data-finish=gold-mirror]'); }],
  ['unlit', () => click('#unlit')],
  ['charcoal-wall', async () => { await click('#lit'); await choose('wall', 'charcoal'); }],
  ['inspect-studs', async () => { await click('[data-mode=exploded]'); await click('[data-part=studs]'); }],
];
for (const [name, act] of steps) { await act(); await snap(String(n++).padStart(2, '0') + '-' + name); }
// Cutout layers (lit, front): sign PNG must have transparent corners and opaque letters; halo PNG must hold soft glow.
// Saved to test-output/cutout/ so test:compare (top-level PNGs only) ignores them.
{ await click('[data-mode=assembled]'); await click('[data-view=front]'); fs.mkdirSync(path.join(out, 'cutout'), { recursive: true });
  t = Date.now(); const downloads = []; const got = new Promise(r => page.on('download', d => { downloads.push(d); if (downloads.length === 2) r(); }));
  await click('#cutout'); await got; const files = {};
  for (const d of downloads) { const f = path.join(out, 'cutout', d.suggestedFilename()); await d.saveAs(f); files[/-halo\.png$/.test(f) ? 'halo' : 'sign'] = f; }
  const stats = async f => page.evaluate(async src => { const im = new Image(); im.src = src; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let opaque = 0, partial = 0; for (let i = 3; i < d.length; i += 4) { if (d[i] === 255) opaque++; else if (d[i]) partial++; } const corner = [0, c.width - 1, (c.height - 1) * c.width, c.height * c.width - 1].map(p => d[p * 4 + 3]); return { w: c.width, h: c.height, opaque, partial, corner }; }, 'data:image/png;base64,' + fs.readFileSync(f).toString('base64'));
  const sign = await stats(files.sign), halo = await stats(files.halo);
  const ok = sign.w === 3840 && sign.corner.every(a => a === 0) && sign.opaque > 1e5 && halo.corner.every(a => a === 0) && halo.partial > 1e5;
  results.push({ step: 'cutout layers', ms: Date.now() - t, ok, sign, halo }); }
// Face-lit (screenshots 10+). The face must read as lit, not paint: brighter than the wall and, for colour, still saturated.
// Shot with and without the wall: sign pixels are identical in both, wall pixels change. Face = sign pixels that are not dark (trim).
const faceVsWall = async () => { await page.waitForTimeout(1000); const clip = await stage.boundingBox(), withWall = await page.screenshot({ clip });
  await page.evaluate(() => { const e = document.getElementById('showwall'); e.checked = false; }); await page.waitForTimeout(800); const noWall = await page.screenshot({ clip });
  await page.evaluate(() => { document.getElementById('showwall').checked = true; }); await page.waitForTimeout(500);
  return page.evaluate(async ([a, b]) => { const load = async src => { const im = new Image(); im.src = src; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; };
    const A = await load(a), B = await load(b), face = [], wall = [], med = v => v.sort((p, q) => p - q)[v.length >> 1] ?? 0;
    for (let i = 0; i < A.length; i += 16) { const diff = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2])), r = A[i] / 255, g = A[i + 1] / 255, bl = A[i + 2] / 255, v = Math.max(r, g, bl), sat = v ? 1 - Math.min(r, g, bl) / v : 0, lum = .2126 * r + .7152 * g + .0722 * bl;
      if (diff <= 2 && v > .3) face.push([v, sat, lum]); else if (diff > 12) wall.push([v, sat, lum]); }
    const pick = (list, k) => med(list.map(p => p[k]));
    return { facePixels: face.length, faceValue: pick(face, 0), faceSat: pick(face, 1), faceLum: pick(face, 2), wallValue: pick(wall, 0), wallLum: pick(wall, 2) };
  }, ['data:image/png;base64,' + withWall.toString('base64'), 'data:image/png;base64,' + noWall.toString('base64')]); };
const uploadAndWait = async f => { const name = path.basename(f); t = Date.now(); await page.setInputFiles('#file', f); await page.waitForFunction(n => { const s = document.getElementById('uploadstatus').textContent; return s.includes(n) && !/Loading/.test(s); }, name); return Date.now() - t; };
{ await click('[data-mode=assembled]'); await choose('wall', 'plaster'); await choose('signtype', 'face-lit'); await page.waitForFunction(() => /^Face-lit/.test(document.getElementById('status').textContent)); await click('[data-view=front]');
  const white = await faceVsWall(); await snap('10-face-lit-white');
  results.push({ step: 'face-lit white face brighter than wall', ok: white.facePixels > 1000 && white.faceLum > white.wallLum, ...white });
  await click('[data-mode=exploded]'); await snap('11-face-lit-exploded'); await click('[data-mode=internal]'); await snap('12-face-lit-inside'); await click('[data-mode=assembled]');
  const ms = await uploadAndWait(fixtures[0]); await click('[data-view=front]'); const colour = await faceVsWall(); await snap('13-face-lit-colour');
  results.push({ step: 'face-lit upload ' + path.basename(fixtures[0]), ms, ok: colour.facePixels > 1000 && colour.faceValue > colour.wallValue && colour.faceSat > .45, ...colour });
  await click('#unlit'); await snap('14-face-lit-unlit'); await click('#lit');
  const accent = fileURLToPath(new URL('fixtures/logo-dark-accent.png', import.meta.url)); results.push({ step: 'face-lit upload logo-dark-accent.png', ms: await uploadAndWait(accent) }); await click('[data-view=front]'); await snap('15-face-lit-dark-accent');
  await choose('signtype', 'halo-lit'); await page.waitForFunction(() => /^Halo-lit/.test(document.getElementById('status').textContent)); }
console.log(JSON.stringify({ gpu, results, budget_ms: 5000, over_budget: results.filter(r => r.ms > 5000 && r.step !== 'cutout layers').map(r => r.step), console: logs }, null, 2));
await browser.close(); server.close();
process.exitCode = results.every(r => r.ok !== false) ? 0 : 1;
