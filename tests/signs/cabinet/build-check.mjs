// Cabinet construction rules on the HALO HALO fixture (CPU only, mocked canvas). See app/signs/cabinet/CLAUDE.md.
// Push-through (face-lit and halo-lit): the cabinet is the artwork plus the margin; letters stand proud of the routed front by
// 3/4″ − the front; only the letters (and the halo version's frosted back) glow; the light planes are where they belong.
import fs from 'node:fs'; import vm from 'node:vm'; import {register} from 'node:module';
register('../../three-resolve.mjs', import.meta.url);
const THREE = await import('three');
const ctx = new Proxy({}, {get: (t, k) => k === 'getImageData' || k === 'createImageData' ? (x, y, w, h) => ({data: new Uint8ClampedArray((w ?? x) * (h ?? y) * 4)}) : k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({addColorStop() {}}) : () => {}, set: () => true});
globalThis.document = {createElement: () => ({width: 1, height: 1, getContext: () => ctx})};
const sandbox = {module: {exports: {}}, console}; vm.runInNewContext(fs.readFileSync(new URL('../../../app/vendor/clipper.js', import.meta.url), 'utf8'), sandbox);
globalThis.window = {ClipperLib: sandbox.module.exports};
const {cleanArtworkMask} = await import('../../../app/core/artwork.mjs');
const {traceMask, groupLoops, smoothLoops} = await import('../../../app/core/geometry.mjs');
const {distanceField, componentLabels} = await import('../../../app/core/routing.mjs');
const {signs, VARIANTS} = await import('../../../app/signs/cabinet/build.mjs');
const {SIGNS: REGISTRY} = await import('../../../app/registry.mjs');

const fixture = JSON.parse(fs.readFileSync(new URL('../../fixtures/halo-halo-mask.json', import.meta.url)));
const art = {mask: cleanArtworkMask(fixture.mask, fixture.w, fixture.h), w: fixture.w, h: fixture.h, texture: new THREE.Texture()};
art.dist = distanceField(art.mask, art.w, art.h); art.labels = componentLabels(art.mask, art.w, art.h);
art.loops = groupLoops(smoothLoops(traceMask(art.mask, art.w, art.h)));
art.colors = art.loops.map((l, i) => ({colour: new THREE.Color(i % 5 ? '#cc2222' : '#000000'), pattern: false}));
const settings = {facetype: 'film', width: 48, depth: 3, cabinetmargin: 3, cabinetfinish: 'black', mountcount: 'auto', sheen: 'satin', paint: '#263c68', led: '6500', cct: 6500, rgb: '#80bfff', intensity: .5, finish: 'artwork'};
const renderer = {capabilities: {getMaxAnisotropy: () => 1}};
const fail = msg => { throw new Error('cabinet: ' + msg); };
const materials = o => (Array.isArray(o.material) ? o.material : [o.material]).filter(Boolean);
const glowing = m => m.emissiveIntensity > 0 && (m.emissive?.r || m.emissive?.g || m.emissive?.b);
const pieces = art.loops.length, inch = 4 / settings.width, H = 4 * art.h / art.w;

for (const [id, sg] of Object.entries(signs)) { const s = {...settings, signtype: id}, halo = id === 'push-thru-halo', what = id + ': ';
  if (sg.construction !== 'cabinet' || sg.mountings.length) fail(what + 'cabinet construction, no channel-letter mountings');
  if (sg.standardDepth !== 3 || sg.depthRange.min !== 2 || sg.depthRange.max !== 10) fail(what + 'depth should be the registry 3″ (2–10″)');
  const b = sg.build(art, s, true, renderer); b.root.updateMatrixWorld(true);
  b.root.traverse(o => { if (!o.matrixWorld.elements.every(Number.isFinite)) fail(what + 'invalid transform'); if (o.geometry && !o.geometry.attributes.position.array.every(Number.isFinite)) fail(what + 'invalid geometry'); });
  const expected = halo ? 'back,drain,front,leds,letters,psu,pvc,returns,studs,wires' : 'back,backing,drain,front,leds,letters,psu,returns,studs,wires';
  if (Object.keys(b.parts).sort().join() !== expected) fail(what + 'parts ' + Object.keys(b.parts).sort().join());
  if (b.parts.letters.children.length !== pieces) fail(what + `expected ${pieces} letters, got ${b.parts.letters.children.length}`);
  // The cabinet is the artwork plus the 3″ margin; the front is flush at 0 and the letters stand 3/4″ − 1/8″ proud of it.
  const cab = new THREE.Box3().setFromObject(b.parts.returns), letters = new THREE.Box3().setFromObject(b.parts.letters), front = new THREE.Box3().setFromObject(b.parts.front);
  if (Math.abs(cab.max.x - cab.min.x - (4 + 6 * inch)) > 1e-6 || Math.abs(cab.max.y - cab.min.y - (H + 6 * inch)) > 1e-6) fail(what + 'cabinet should be the artwork plus a 3″ margin');
  if (Math.abs(front.max.z) > 1e-9 || Math.abs(letters.max.z - (.75 - .125) * inch) > 1e-6) fail(what + `letters should stand ${.625}″ proud, got ${letters.max.z / inch}`);
  if (sg.outer(s) !== 6) fail(what + 'outer size should add the margin twice');
  // Wall: flush on the back, or 1.5″ behind the frosted back on standoffs; studs reach it.
  const wall = -(sg.wallDepth(s) + sg.wallGap(s)), back = new THREE.Box3().setFromObject(b.parts.back);
  if (Math.abs(back.min.z + sg.wallDepth(s)) > 1e-6 || Math.abs(sg.wallGap(s) - (halo ? 1.5 * inch : 0)) > 1e-9) fail(what + 'back / wall gap');
  if (new THREE.Box3().setFromObject(b.parts.studs).min.z > wall - 1e-6 || b.parts.studs.children.length < 4) fail(what + 'at least 4 studs reaching the wall');
  // Only the letters glow (and the halo version's frosted back); unlit, nothing does.
  for (const [name, group] of Object.entries(b.parts)) group.traverse(o => { if (o.isMesh && materials(o).some(glowing) && !['letters', 'leds', ...(halo ? ['back'] : [])].includes(name)) fail(what + name + ' glows'); });
  if (!materials(b.parts.letters.children[0]).every(glowing)) fail(what + 'letter faces and edges must glow');
  if (halo && !materials(b.parts.back.children[0]).some(glowing)) fail(what + 'frosted back must glow');
  sg.build(art, s, false, renderer).root.traverse(o => { if (o.isMesh && materials(o).some(glowing)) fail(what + 'unlit cabinet still glows'); });
  // Light planes: face glow in front; the halo version adds the cabinet halo on the wall, cabinet-sized.
  const planes = [].concat(sg.glow(art, s, true, wall, H));
  if (planes.length !== (halo ? 2 : 1) || planes.filter(p => p.userData.front).length !== 1) fail(what + 'light planes');
  if (halo) { const h = planes.find(p => !p.userData.front); if (h.position.z > wall + .02 || h.geometry.parameters.width < 4 + 6 * inch) fail(what + 'halo must be on the wall, around the whole cabinet'); }
  // Margin and finish change the build.
  const wide = new THREE.Box3().setFromObject(sg.build(art, {...s, cabinetmargin: 6}, true, renderer).parts.returns);
  if (Math.abs(wide.max.x - wide.min.x - (4 + 12 * inch)) > 1e-6) fail(what + 'margin 6″ not applied'); }
// Registry: each variant opens a cabinet row.
const rows = new Map(REGISTRY.map(r => [r.id, r]));
for (const [id, v] of Object.entries(VARIANTS)) { if (rows.get(id)?.build !== 'cabinet') fail(id + ' is not a cabinet registry row'); if (!signs[v.sign]) fail(id + ' opens unknown sign ' + v.sign); }
console.log('CABINET_BUILD_OK', JSON.stringify({pieces, signs: Object.keys(signs)}));
