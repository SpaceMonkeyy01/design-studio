// Face-lit construction rules on the HALO HALO fixture (CPU only, mocked canvas). See app/signs/face-lit/CLAUDE.md.
// Checks the looks QC kept failing on that a build can guarantee: no halo (only a front face glow), nothing lit behind the letters,
// returns/trim/back never glow, no hardware from an unselected mounting mode.
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
const {isTinyPiece} = await import('../../../app/core/hardware.mjs');
const {sign} = await import('../../../app/signs/face-lit/build.mjs');

const fixture = JSON.parse(fs.readFileSync(new URL('../../fixtures/halo-halo-mask.json', import.meta.url)));
const art = {mask: cleanArtworkMask(fixture.mask, fixture.w, fixture.h), w: fixture.w, h: fixture.h, texture: new THREE.Texture()};
art.dist = distanceField(art.mask, art.w, art.h); art.labels = componentLabels(art.mask, art.w, art.h);
art.loops = groupLoops(smoothLoops(traceMask(art.mask, art.w, art.h)));
art.colors = art.loops.map((l, i) => ({colour: new THREE.Color(i % 5 ? '#cc2222' : '#000000'), pattern: false}));
const settings = {signtype: 'face-lit', facetype: 'film', trim: 'black', returns: 'artwork', width: 48, gap: .25, depth: 5, mountcount: 'auto', finish: 'artwork', sheen: 'satin', wallscale: 100, acrylictype: 'clear', paint: '#263c68', led: '6500', cct: 6500, rgb: '#80bfff', intensity: .75, wall: 'plaster'};
const renderer = {capabilities: {getMaxAnisotropy: () => 1}};
const fail = msg => { throw new Error('face-lit: ' + msg); };
const materials = o => (Array.isArray(o.material) ? o.material : [o.material]).filter(Boolean);
const glowing = m => m.emissiveIntensity > 0 && (m.emissive?.r || m.emissive?.g || m.emissive?.b);

const pieces = art.loops.length, meaningful = art.loops.filter(l => !isTinyPiece(l, art)).length;
const {root, parts} = sign.build(art, settings, true, renderer); root.updateMatrixWorld(true);
const names = Object.keys(parts).sort().join(',');
if (names !== 'back,drain,face,leds,returns,studs,trim,wires') fail('unexpected parts ' + names + ' (no halo, acrylic back, clamps, raceway or backer under flush)');
// Its only light plane is the face glow, in front of the letters; no halo behind them.
const glow = sign.glow(art, settings, true, -sign.wallDepth(settings), 4 * art.h / art.w);
if (!glow.userData.front || glow.position.z <= 0 || glow.material.opacity <= 0) fail('face glow must be a lit plane in front of the face (no halo behind the letters)');
if (sign.glow(art, settings, false, -sign.wallDepth(settings), 4 * art.h / art.w).material.opacity !== 0) fail('unlit face glow must be off');
if (sign.wallGap(settings) !== 0) fail('flush mounting has no wall gap');
root.traverse(o => { if (!o.matrixWorld.elements.every(Number.isFinite)) fail('invalid transform'); });
for (const part of ['face', 'back']) if (parts[part].children.length !== pieces) fail(`expected ${pieces} ${part} pieces, got ${parts[part].children.length}`);
if (!parts.trim.children.length || !parts.returns.children.length) fail('missing trim or returns');
if (parts.studs.children.some(m => !m.userData.mount) || parts.studs.children.length < 3 * meaningful) fail(`expected ≥3 stud mounts per piece (${3 * meaningful}), got ${parts.studs.children.length}`);
if (parts.leds.children.length < meaningful) fail(`expected LED modules in every lit piece (${meaningful}), got ${parts.leds.children.length} modules`);
if (parts.drain.children.length !== meaningful) fail(`expected one weep hole per piece (${meaningful}), got ${parts.drain.children.length}`);
// Light leaves only through the face: nothing else glows, and nothing lit sits behind the sealed back.
const wallZ = -sign.wallDepth(settings), box = new THREE.Box3();
for (const [name, group] of Object.entries(parts)) group.traverse(o => { if (!o.isMesh || !materials(o).some(glowing)) return;
  if (!['face', 'leds'].includes(name)) fail(name + ' glows; only the face (and the hidden LED lenses) may');
  if (box.setFromObject(o).min.z < wallZ - 1e-9) fail(name + ' emits light behind the letter plane'); });
if (!materials(parts.face.children[0]).some(glowing)) fail('lit face does not glow');
// Unlit: every emissive is zero.
const unlit = sign.build(art, settings, false, renderer);
unlit.root.traverse(o => { if (o.isMesh && materials(o).some(glowing)) fail('unlit sign still glows'); });
// Trimless removes the trim cap and nothing else.
const trimless = sign.build(art, {...settings, trim: 'none'}, true, renderer);
if (trimless.parts.trim.children.length) fail('trimless still has a trim cap');
if (trimless.parts.face.children.length !== pieces) fail('trimless lost face pieces');
console.log('FACE_LIT_BUILD_OK', JSON.stringify({pieces, trim: parts.trim.children.length, mounts: parts.studs.children.length, leds: parts.leds.children.length, weep: parts.drain.children.length}));
