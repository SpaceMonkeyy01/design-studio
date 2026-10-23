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
let t = Date.now(); await page.goto(url + 'studio.html');
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
  await page.evaluate(() => { const e = document.getElementById('showwall'); e.checked = false; e.dispatchEvent(new Event('change', { bubbles: true })); }); await page.waitForTimeout(800); const noWall = await page.screenshot({ clip });
  await page.evaluate(() => { const e = document.getElementById('showwall'); e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); }); await page.waitForTimeout(500);
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
  // Fabricated non-lit (16–19): no Lit/Unlit toggle, daylight view; polished gold, exploded, painted in the logo's colours, antique bronze.
  await choose('signtype', 'fabricated-nonlit'); await page.waitForFunction(() => /^Fabricated/.test(document.getElementById('status').textContent));
  const fabUI = await page.evaluate(() => ({ lightingHidden: document.getElementById('lighting').hidden, unlit: document.getElementById('unlit').classList.contains('active'), ledHidden: document.querySelector('[data-sign~="face-lit"][data-sign~="halo-lit"]').hidden }));
  await choose('finish', 'gold-mirror'); await click('[data-view=front]'); await snap('16-fabricated-gold-mirror');
  await click('[data-mode=exploded]'); await snap('17-fabricated-exploded'); await click('[data-mode=assembled]');
  await choose('finish', 'artwork'); await snap('18-fabricated-painted'); await click('[data-view=right]'); await choose('finish', 'bronze-antique'); await snap('19-fabricated-bronze-antique');
  results.push({ step: 'fabricated non-lit', ok: fabUI.lightingHidden && fabUI.unlit && fabUI.ledHidden, ...fabUI });
  // Side-lit (20–22): lit acrylic returns, vinyl face. Lighting and LED controls are back; lit and unlit must differ.
  await choose('signtype', 'side-lit'); await page.waitForFunction(() => /^Side-lit/.test(document.getElementById('status').textContent)); await choose('finish', 'artwork');
  const sideUI = await page.evaluate(() => ({ lighting: !document.getElementById('lighting').hidden, led: !document.querySelector('[data-sign~="side-lit"]').hidden, lit: document.getElementById('lit').classList.contains('active') }));
  await click('[data-view=front]'); await snap('20-side-lit'); const sideLit = await page.screenshot({ clip: await stage.boundingBox() });
  await click('#unlit'); await snap('21-side-lit-unlit'); const sideUnlit = await page.screenshot({ clip: await stage.boundingBox() }); await click('#lit');
  await click('[data-mode=exploded]'); await snap('22-side-lit-exploded'); await click('[data-mode=assembled]');
  results.push({ step: 'side-lit', ok: sideUI.lighting && sideUI.led && sideUI.lit && !sideLit.equals(sideUnlit), ...sideUI });
  // Face & halo-lit (23–25): lit face + halo; face and returns controls shown, trim select hidden (its trim is welded).
  await choose('signtype', 'face-halo-lit'); await page.waitForFunction(() => /^Face & halo-lit/.test(document.getElementById('status').textContent)); await choose('wall', 'charcoal');
  const fhUI = await page.evaluate(() => ({ face: !document.getElementById('facetype').closest('[data-sign]').hidden, trimHidden: document.getElementById('trim').closest('label').hidden, gap: !document.getElementById('gap').closest('label').hidden }));
  await click('[data-view=front]'); await snap('23-face-halo-lit'); await click('#unlit'); await snap('24-face-halo-lit-unlit'); await click('#lit');
  await click('[data-mode=exploded]'); await snap('25-face-halo-lit-exploded'); await click('[data-mode=assembled]'); await choose('wall', 'plaster');
  results.push({ step: 'face & halo-lit', ok: fhUI.face && fhUI.trimHidden && fhUI.gap, ...fhUI });
  // Face & side-lit (26–28): lit face + lit returns; Face shown, Trim and Returns hidden (acrylic returns, no trim).
  await choose('signtype', 'face-side-lit'); await page.waitForFunction(() => /^Face & side-lit/.test(document.getElementById('status').textContent)); await choose('wall', 'charcoal');
  const fsUI = await page.evaluate(() => ({ face: !document.getElementById('facetype').closest('[data-sign]').hidden, trimHidden: document.getElementById('trim').closest('label').hidden, returnsHidden: document.getElementById('returns').closest('label').hidden }));
  await click('[data-view=front]'); await snap('26-face-side-lit'); await click('#unlit'); await snap('27-face-side-lit-unlit'); await click('#lit');
  await click('[data-mode=exploded]'); await snap('28-face-side-lit-exploded'); await click('[data-mode=assembled]'); await choose('wall', 'plaster');
  results.push({ step: 'face & side-lit', ok: fsUI.face && fsUI.trimHidden && fsUI.returnsHidden, ...fsUI });
  // Push-through cabinets (29–32): no mountings or mounts-per-letter; cabinet margin and finish shown.
  await choose('signtype', 'push-thru'); await page.waitForFunction(() => /^Push-through/.test(document.getElementById('status').textContent)); await choose('wall', 'charcoal');
  const ptUI = await page.evaluate(() => ({ mountingHidden: document.getElementById('mountingfield').hidden, mountsHidden: document.getElementById('mountcount').closest('label').hidden, cabinet: !document.getElementById('cabinetmargin').closest('[data-sign]').hidden }));
  await click('[data-view=right]'); await snap('29-push-thru'); await click('#unlit'); await snap('30-push-thru-unlit'); await click('#lit'); await click('[data-mode=exploded]'); await snap('31-push-thru-exploded'); await click('[data-mode=assembled]');
  await choose('signtype', 'push-thru-halo'); await page.waitForFunction(() => /^Push-through halo/.test(document.getElementById('status').textContent)); await snap('32-push-thru-halo'); await choose('wall', 'plaster');
  results.push({ step: 'push-through', ok: ptUI.mountingHidden && ptUI.mountsHidden && ptUI.cabinet, ...ptUI });
  await choose('signtype', 'halo-lit'); await page.waitForFunction(() => /^Halo-lit/.test(document.getElementById('status').textContent)); }
// Build board = landing page (app/index.html): every built variant links into the studio, and "Open Design Studio" opens it
// with the default sign. Click through to the studio, halo-lit and face-lit Premium.
// Screenshot in test-output/dashboard/ (not compared: it loads Google Fonts over the network).
{ fs.mkdirSync(path.join(out, 'dashboard'), { recursive: true }); await page.goto(url); await page.waitForSelector('a.v');
  const links = await page.$$eval('a.v', as => as.map(a => a.getAttribute('href'))), untitled = await page.$$eval('.thead b', bs => bs.filter(b => !b.textContent.trim()).length); await page.screenshot({ path: path.join(out, 'dashboard', 'board.png'), fullPage: true });
  const open = async (needle, sign) => { await page.goto(url); await page.waitForSelector('a.v'); await page.click(needle ? `a.v[href*="${needle}"] >> nth=0` : 'a.cta');
    await page.waitForFunction(s => new RegExp('^' + s).test(document.getElementById('status').textContent), sign); return page.evaluate(() => ({ url: location.search, sign: document.getElementById('signtype').value, trim: document.getElementById('trim').value, finish: document.getElementById('finish').value })); };
  const studio = await open(null, 'Halo-lit'), halo = await open('halo-lit-back-lit', 'Halo-lit'), premium = await open('face-lit-premium', 'Face-lit'), gold = await open('fabricated-letters-polished-gold', 'Fabricated'), sideLit = await open('channel-letters-side-lit', 'Side-lit'), faceHalo = await open('channel-letters-face-halo-lit', 'Face & halo-lit'), faceSide = await open('channel-letters-face-side-lit', 'Face & side-lit'), push = await open('push-through-signage-halo-lit', 'Push-through halo');
  // And back: the studio's "← Build board" link returns to the landing page.
  await page.click('#boardlink'); const back = await page.waitForSelector('a.cta').then(() => true, () => false);
  results.push({ step: 'landing board click-through', ok: back && untitled === 0 && links.length === 21 && links.every(h => /^studio\.html\?type=/.test(h)) && studio.url === '' && studio.sign === 'halo-lit' && halo.sign === 'halo-lit' && premium.sign === 'face-lit' && premium.trim === 'silver' && gold.sign === 'fabricated-nonlit' && gold.finish === 'gold-mirror' && sideLit.sign === 'side-lit' && faceHalo.sign === 'face-halo-lit' && faceSide.sign === 'face-side-lit' && push.sign === 'push-thru-halo', links: links.length, untitled, back, studio, halo, premium, gold }); }
// Reference library (app/reference.html): every drawing loads, the studio's button opens it at the current sign,
// and a drawing enlarges. Screenshots in test-output/reference/ (not compared: Google Fonts over the network).
{ fs.mkdirSync(path.join(out, 'reference'), { recursive: true });
  await page.goto(url + 'studio.html'); const studioHref = await page.getAttribute('#reference', 'href');
  await page.goto(url + 'index.html'); const boardHref = await page.getAttribute('a.ref', 'href');
  await page.goto(url + 'reference.html#face-lit'); await page.waitForSelector('.entry.target');
  const lib = await page.evaluate(async () => { const srcs = [...document.querySelectorAll('.sheet img')].map(i => i.src);
    const bad = []; for (const s of srcs) { const r = await fetch(s); if (!r.ok || !(r.headers.get('content-type') || '').includes('image/png')) bad.push(s); }
    return { drawings: srcs.length, bad, target: document.querySelector('.entry.target')?.id, untitled: [...document.querySelectorAll('.sheet figcaption b')].filter(b => !b.textContent.trim()).length }; });
  await page.waitForTimeout(800); await page.screenshot({ path: path.join(out, 'reference', 'face-lit.png') });
  await page.click('#face-lit .sheet button >> nth=0'); const dialogOpen = await page.waitForSelector('#viewer[open]').then(() => true, () => false);
  await page.waitForTimeout(500); await page.screenshot({ path: path.join(out, 'reference', 'viewer.png') });
  results.push({ step: 'reference library', ok: studioHref === 'reference.html#halo-lit' && boardHref === 'reference.html' && lib.drawings === 109 && !lib.bad.length && lib.target === 'face-lit' && lib.untitled === 0 && dialogOpen, studioHref, boardHref, ...lib, dialogOpen }); }
// Scene view (core/placement.mjs): the sign on a preset photo, camera solved from its corners. Screenshots in
// test-output/scene/ (not compared). Checks: canvas takes the photo's shape, dragging a corner moves the camera, view buttons
// leave the scene and "In scene" returns, the scene PNG is the photo's size, every sign type renders, save → load keeps it.
{ fs.mkdirSync(path.join(out, 'scene'), { recursive: true }); const shot = name => page.waitForTimeout(800).then(async () => page.screenshot({ path: path.join(out, 'scene', name + '.png'), clip: await stage.boundingBox() }));
  await page.goto(url + 'studio.html'); await page.waitForFunction(() => /Halo-lit/.test(document.getElementById('status').textContent));
  const look = () => page.evaluate(() => { const v = document.getElementById('viewer'); return { aspect: +(v.clientWidth / v.clientHeight).toFixed(2), inScene: document.getElementById('sceneview').classList.contains('active'), info: document.getElementById('lensinfo').textContent, cornersShown: !document.getElementById('corners').hasAttribute('hidden'), active: [...document.querySelectorAll('.viewmodes .active')].map(b => b.textContent).join(), status: document.getElementById('status').textContent }; });
  await click('[data-scenebtn="scenes/storefront.jpg"]'); await page.waitForFunction(() => /3″ depth/.test(document.getElementById('status').textContent)); await page.waitForTimeout(800); const entered = await look(); await shot('01-storefront-corners');
  const handle = await page.locator('#corners circle[data-corner="1"]').boundingBox(), before = await page.evaluate(() => document.querySelector('#corners polygon').getAttribute('points'));
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2); await page.mouse.down(); await page.mouse.move(handle.x + 30, handle.y + 60, { steps: 4 }); await page.mouse.up();
  const after = await page.evaluate(() => document.querySelector('#corners polygon').getAttribute('points')); await shot('02-storefront-dragged');
  await choose('scene', 'scenes/storefront.jpg'); await page.evaluate(() => { const e = document.getElementById('showcorners'); e.checked = false; e.dispatchEvent(new Event('change')); }); await shot('03-storefront-halo-lit');
  t = Date.now(); const download = page.waitForEvent('download'); await click('#export'); const d = await download, file = path.join(out, 'scene', d.suggestedFilename()); await d.saveAs(file);
  const png = await page.evaluate(async src => { const im = new Image(); im.src = src; await im.decode(); return { w: im.width, h: im.height }; }, 'data:image/png;base64,' + fs.readFileSync(file).toString('base64')); const exportMs = Date.now() - t;
  await click('[data-view=front]'); const left = await look(); await click('#sceneview'); const back = await look();
  // A stacked logo (as tall as wide) must be fitted inside the fascia; a 200″ sign on it must raise the overflow warning.
  await page.setInputFiles('#file', fileURLToPath(new URL('fixtures/logo-tall-stacked.png', import.meta.url))); await page.waitForFunction(() => /^Loaded logo-tall/.test(document.getElementById('uploadstatus').textContent)); const tall = await look(); await shot('04b-storefront-tall-logo');
  await choose('width', '200'); await page.waitForTimeout(800); const tooWide = await look(); await choose('width', '48'); await page.waitForTimeout(500);
  await click('#unlit'); await shot('04-storefront-unlit'); await click('#lit');
  await choose('signtype', 'face-lit'); await page.waitForFunction(() => /^Face-lit/.test(document.getElementById('status').textContent)); const faceLit = await look(); await shot('05-storefront-face-lit');
  await choose('signtype', 'fabricated-nonlit'); await page.waitForFunction(() => /^Fabricated/.test(document.getElementById('status').textContent)); await choose('finish', 'gold-brushed'); await shot('06-storefront-fabricated-gold');
  await choose('signtype', 'halo-lit'); await page.waitForFunction(() => /^Halo-lit/.test(document.getElementById('status').textContent)); await click('[data-scenebtn="scenes/studio-panel.jpg"]'); await page.waitForTimeout(1000); const panel = await look(); await shot('07-panel-halo-lit');
  const saved = page.waitForEvent('download'); await click('#saveproject'); const project = path.join(out, 'scene', 'project.json'); await (await saved).saveAs(project);
  await choose('scene', ''); const cleared = await look(); await page.setInputFiles('#loadproject', project); await page.waitForFunction(() => document.getElementById('sceneview').classList.contains('active'));
  const restored = await look(), savedScene = JSON.parse(fs.readFileSync(project, 'utf8')).scene;
  results.push({ step: 'scene view', ms: exportMs, ok: entered.inScene && entered.aspect === 1.5 && entered.active === 'Outdoor' && /3″ depth/.test(entered.status) && panel.active === 'Indoor' && left.active === 'Assembled' && entered.cornersShown && /^Rectangle \d+″/.test(entered.info) && !entered.info.includes('⚠') && tall.inScene && !tall.info.includes('⚠') && tooWide.info.includes('⚠') && before !== after && png.w === 1024 && png.h === 683 && !left.inScene && left.aspect !== 1.5 && back.inScene && faceLit.inScene && panel.aspect === 1 && savedScene?.src === 'scenes/studio-panel.jpg' && !cleared.inScene && restored.inScene && restored.aspect === 1 && restored.info === panel.info, entered, tall: tall.info, tooWide: tooWide.info, dragMoved: before !== after, png, left, back, panel, restored }); }
console.log(JSON.stringify({ gpu, results, budget_ms: 5000, over_budget: results.filter(r => r.ms > 5000 && r.step !== 'cutout layers').map(r => r.step), console: logs }, null, 2));
await browser.close(); server.close();
process.exitCode = results.every(r => r.ok !== false) ? 0 : 1;
