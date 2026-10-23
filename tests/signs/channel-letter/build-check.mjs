// Channel-letter construction rules on the HALO HALO fixture (CPU only, mocked canvas). See app/signs/channel-letter/CLAUDE.md.
// Mostly face-lit (halo-lit is covered by runtime-smoke + the screenshots), plus the config switches.
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
const {signs, buildChannelLetter, CONFIGS, VARIANTS} = await import('../../../app/signs/channel-letter/build.mjs');
const {SIGNS: REGISTRY} = await import('../../../app/registry.mjs');
const sign = signs['face-lit'];

const fixture = JSON.parse(fs.readFileSync(new URL('../../fixtures/halo-halo-mask.json', import.meta.url)));
const art = {mask: cleanArtworkMask(fixture.mask, fixture.w, fixture.h), w: fixture.w, h: fixture.h, texture: new THREE.Texture()};
art.dist = distanceField(art.mask, art.w, art.h); art.labels = componentLabels(art.mask, art.w, art.h);
art.loops = groupLoops(smoothLoops(traceMask(art.mask, art.w, art.h)));
art.colors = art.loops.map((l, i) => ({colour: new THREE.Color(i % 5 ? '#cc2222' : '#000000'), pattern: false}));
const settings = {signtype: 'face-lit', facetype: 'film', trim: 'black', returns: 'artwork', width: 48, gap: .25, depth: sign.standardDepth, mountcount: 'auto', finish: 'artwork', sheen: 'satin', wallscale: 100, acrylictype: 'clear', paint: '#263c68', led: '6500', cct: 6500, rgb: '#80bfff', intensity: .75, wall: 'plaster'};
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
// Data from the registry: depth per sign (every row that opens it agrees) and face-lit gauges from PARTS.
for (const [id, sg] of Object.entries(signs)) for (const r of REGISTRY.filter(r => VARIANTS[r.id]?.sign === id))
  if (r.depth.std !== sg.standardDepth || r.depth.min !== sg.depthRange.min || r.depth.max !== sg.depthRange.max) fail(`${id} depth disagrees with registry row ${r.id}`);
if (sign.standardDepth !== 3) fail('face-lit standard depth should be the registry 3″');
const inch = 4 / settings.width, backDepth = parts.back.children[0].geometry.parameters.options.depth;
if (Math.abs(backDepth - .1019 * inch) > 1e-9) fail('sealed back should be the measured 0.1019″, got ' + backDepth / inch);
if (Math.abs(sign.wallDepth(settings) - (settings.depth + .1019) * inch) > 1e-9) fail('wall must touch the 0.1019″ back');
for (const depth of [sign.depthRange.min, sign.depthRange.max]) sign.build(art, {...settings, depth}, true, renderer).root.traverse(o => { if (o.geometry && !o.geometry.attributes.position.array.every(Number.isFinite)) fail('invalid geometry at ' + depth + '″'); });
// ?type= table: exactly the registry's built channel-letter rows, each opening a real sign with real select options.
// Every built row opens a variant; a variant may run ahead of the registry (its row still "todo" until the source is regenerated).
const rows = new Map(REGISTRY.map(r => [r.id, r]));
for (const r of REGISTRY.filter(r => r.build === 'channel-letter' && r.status === 'done')) if (!VARIANTS[r.id]) fail('built registry row without a variant: ' + r.id);
for (const id of Object.keys(VARIANTS)) if (rows.get(id)?.build !== 'channel-letter') fail('VARIANTS lists ' + id + ', not a channel-letter registry row');
const waiting = Object.keys(VARIANTS).filter(id => rows.get(id).status !== 'done');
for (const [id, v] of Object.entries(VARIANTS)) { if (!signs[v.sign]) fail(id + ' opens unknown sign ' + v.sign);
  for (const t of v.options?.trim || []) if (!['artwork', 'black', 'white', 'silver', 'gold', 'bronze', 'none'].includes(t)) fail(id + ': unknown trim ' + t);
  for (const f of v.options?.finish || []) if (!['artwork', 'silver-brushed', 'silver-mirror', 'gold-brushed', 'gold-mirror', 'bronze-brushed', 'bronze-mirror', 'bronze-antique', 'black', 'white', 'custom'].includes(f)) fail(id + ': unknown finish ' + f); }
// Every mounting a config offers must be in the registry's channel-letter set and built: all six channel-letter mountings.
const {mounting, mountingsFor} = await import('../../../app/core/mounting.mjs');
for (const [id, sg] of Object.entries(signs)) if (!sg.mountings?.length || sg.mountings.some(m => !mounting('channel-letter', m)?.built)) fail(id + ' offers an unbuilt mounting');
if (mountingsFor('channel-letter').filter(m => m.built).map(m => m.id).join() !== 'flush,raceway-2,backer-acm-4,backer-acrylic-8,backer-aluminum-25,backboard-cabinet-2') fail('every channel-letter mounting should be built');
// An unbuilt mounting is refused by name, never drawn as nothing.
for (const id of ['nonsense']) { let refused = false; try { sign.build(art, {...settings, mounting: id}, true, renderer); } catch (e) { refused = /not implemented|Unknown/.test(e.message); }
  if (!refused) fail('mounting ' + id + ' was not refused'); }
// Flat backers, every sign × backer: a panel of the drawing's thickness whose back is on the wall and whose front is where the wall
// was under flush; the wall moves back by exactly that thickness; studs reach through it into the wall; margin as set.
for (const [id, sg] of Object.entries(signs)) for (const [mid, mm] of [['backer-acm-4', 4], ['backer-acrylic-8', 8], ['backer-aluminum-25', 2.5]]) {
  const st = {...settings, signtype: id, depth: sg.standardDepth, mounting: mid, backermargin: 3, backercolour: 'clear'}, flushSt = {...st, mounting: 'flush'}, inch = 4 / st.width, t = mm / 25.4 * inch;
  const b = sg.build(art, st, true, renderer); b.root.updateMatrixWorld(true); const what = id + ' / ' + mid + ': ';
  if (b.parts.backer?.children.length !== 1) fail(what + 'expected one backer panel');
  const panel = new THREE.Box3().setFromObject(b.parts.backer), wall = -(sg.wallDepth(st) + sg.wallGap(st)), flushWall = -(sg.wallDepth(flushSt) + sg.wallGap(flushSt));
  if (Math.abs(sg.wallDepth(st) - sg.wallDepth(flushSt) - t) > 1e-9) fail(what + 'wall should move back by the backer thickness');
  if (Math.abs(panel.min.z - wall) > 1e-6 || Math.abs(panel.max.z - flushWall) > 1e-6) fail(what + `panel ${panel.min.z / inch}…${panel.max.z / inch}″ should span the wall ${wall / inch}″ to ${flushWall / inch}″`);
  if (Math.abs(panel.max.x - panel.min.x - (4 + 6 * inch)) > 1e-6 || Math.abs(panel.max.y - panel.min.y - (4 * art.h / art.w + 6 * inch)) > 1e-6) fail(what + 'panel should be the artwork plus a 3″ margin');
  if (new THREE.Box3().setFromObject(b.parts.studs).min.z > wall - 1e-6) fail(what + 'studs must reach through the backer into the wall');
  const mat = b.parts.backer.children[0].material; if ((mid === 'backer-acrylic-8') !== !!mat.transparent) fail(what + 'clear is for acrylic only (others draw white)');
  const offsets = typeof sg.explodedOffsets === 'function' ? sg.explodedOffsets(st) : sg.explodedOffsets; if (!(offsets.backer < 0)) fail(what + 'backer must move back in the exploded view');
  if (!(typeof sg.parts === 'function' ? sg.parts(st) : sg.parts).some(([n]) => n === 'backer') || !sg.componentInfo.backer) fail(what + 'backer needs an explorer button and inspector text'); }
// Raceway, every sign: a 2″-deep box whose back is on the wall and whose front is where the wall was under flush; 5″ tall, the
// sign's width less 2″ at each end, centred on the artwork; the wall moves back by 2″; studs reach the wall.
for (const [id, sg] of Object.entries(signs)) { const st = {...settings, signtype: id, depth: sg.standardDepth, mounting: 'raceway-2', racewayheight: 5, backercolour: 'black'}, flushSt = {...st, mounting: 'flush'}, inch = 4 / st.width, what = id + ' / raceway: ';
  const r = sg.build(art, st, true, renderer); r.root.updateMatrixWorld(true); if (r.parts.raceway?.children.length !== 1 || r.parts.backer) fail(what + 'expected one raceway and no backer');
  const box = new THREE.Box3().setFromObject(r.parts.raceway), wall = -(sg.wallDepth(st) + sg.wallGap(st)), flushWall = -(sg.wallDepth(flushSt) + sg.wallGap(flushSt));
  if (Math.abs(sg.wallDepth(st) - sg.wallDepth(flushSt) - 2 * inch) > 1e-9) fail(what + 'wall should move back by 2″');
  if (Math.abs(box.min.z - wall) > 1e-6 || Math.abs(box.max.z - flushWall) > 1e-6) fail(what + 'raceway should span the wall to the letters');
  if (Math.abs(box.max.y - box.min.y - 5 * inch) > 1e-6 || Math.abs(box.max.x - box.min.x - (4 - 4 * inch)) > 1e-6 || Math.abs(box.max.x + box.min.x) > 1e-6 || Math.abs(box.max.y + box.min.y) > 1e-6) fail(what + 'raceway should be 5″ tall, 2″ in from each end, centred');
  if (new THREE.Box3().setFromObject(r.parts.studs).min.z > wall - 1e-6) fail(what + 'studs must reach the wall');
  const c = new THREE.Vector3(); if (!r.parts.studs.children.length || r.parts.studs.children.some(m => Math.abs(new THREE.Box3().setFromObject(m).getCenter(c).y) > box.max.y + 1e-6 || Math.abs(c.x) > box.max.x + 1e-6)) fail(what + 'every stud mount must land on the raceway');
  const offsets = typeof sg.explodedOffsets === 'function' ? sg.explodedOffsets(st) : sg.explodedOffsets; if (!(offsets.raceway < 0) || 'backer' in offsets) fail(what + 'raceway (only) moves back in the exploded view');
  if (!sg.parts(st).some(([n]) => n === 'raceway') || !sg.componentInfo.raceway) fail(what + 'needs an explorer button and inspector text'); }
// Backboard cabinet, every sign: a 2″-deep box, the artwork plus a 3″ margin, back on the wall, front where the wall was; studs reach the wall.
for (const [id, sg] of Object.entries(signs)) { const st = {...settings, signtype: id, depth: sg.standardDepth, mounting: 'backboard-cabinet-2', backermargin: 3, backercolour: 'clear'}, flushSt = {...st, mounting: 'flush'}, inch = 4 / st.width, what = id + ' / cabinet: ';
  const c = sg.build(art, st, true, renderer); c.root.updateMatrixWorld(true); if (c.parts.cabinet?.children.length !== 1 || c.parts.backer || c.parts.raceway) fail(what + 'expected one cabinet only');
  const box = new THREE.Box3().setFromObject(c.parts.cabinet), wall = -(sg.wallDepth(st) + sg.wallGap(st)), flushWall = -(sg.wallDepth(flushSt) + sg.wallGap(flushSt));
  if (Math.abs(sg.wallDepth(st) - sg.wallDepth(flushSt) - 2 * inch) > 1e-9 || Math.abs(box.min.z - wall) > 1e-6 || Math.abs(box.max.z - flushWall) > 1e-6) fail(what + 'cabinet should be 2″ deep, from the wall to the letters');
  if (Math.abs(box.max.x - box.min.x - (4 + 6 * inch)) > 1e-6 || Math.abs(box.max.y - box.min.y - (4 * art.h / art.w + 6 * inch)) > 1e-6) fail(what + 'cabinet should be the artwork plus a 3″ margin');
  if (new THREE.Box3().setFromObject(c.parts.studs).min.z > wall - 1e-6) fail(what + 'studs must reach the wall');
  if (c.parts.cabinet.children[0].material.transparent) fail(what + 'clear is for an acrylic backer only');
  if (!(sg.explodedOffsets(st).cabinet < 0) || !sg.parts(st).some(([n]) => n === 'cabinet') || !sg.componentInfo.cabinet) fail(what + 'needs an exploded offset, explorer button and inspector text'); }
for (const [id, sg] of Object.entries(signs)) { const f = sg.build(art, {...settings, signtype: id, depth: sg.standardDepth, mounting: 'flush'}, true, renderer);
  if (f.parts.backer || f.parts.raceway || f.parts.cabinet || (typeof sg.parts === 'function' ? sg.parts(settings) : sg.parts).some(([n]) => ['backer', 'raceway', 'cabinet'].includes(n))) fail(id + ': flush must have no backer, raceway or cabinet'); }
if (!mounting('channel-letter', 'raceway-2').psuInside || mounting('channel-letter', 'flush').psuInside) fail('power supply: inside the raceway, behind the wall for flush');
// Config switches: the two built constructions resolve; anything else is refused, not half-built.
for (const [id, cfg] of Object.entries(CONFIGS)) if (signs[id].config !== cfg) fail('preset ' + id + ' does not use its config');
const halo = buildChannelLetter(art, {...settings, depth: 1}, true, renderer, CONFIGS['halo-lit']);
if (!halo.parts.acrylic?.children.length || halo.parts.clamps.children.length < 3 * meaningful || halo.parts.trim) fail('halo-lit config did not build an acrylic back with clamps');
for (const cfg of [{face: 'acrylic', faceVinyl: true, returns: 'opaque', back: 'opaque', emit: ['front']},
  {face: 'opaque', returns: 'opaque', back: 'opaque', emit: []}]) {
  let refused = false; try { buildChannelLetter(art, settings, true, renderer, cfg); } catch (e) { refused = /not built yet/.test(e.message); }
  if (!refused) fail('unbuilt construction was not refused: ' + JSON.stringify(cfg)); }
// Fabricated non-lit: metal face + returns on the wall, open back, studs welded to the face. Nothing glows, lit or not.
const fab = signs['fabricated-nonlit'], fabSettings = {...settings, signtype: 'fabricated-nonlit', depth: fab.standardDepth, finish: 'gold-brushed'};
if (fab.lit !== false || fab.glow) fail('fabricated must be non-lit with no light plane');
if (fab.standardDepth !== 1 || fab.depthRange.min !== .75 || fab.depthRange.max !== 10) fail('fabricated depth should be the registry 1″ (0.75–10″)');
for (const isLit of [true, false]) { const f = fab.build(art, fabSettings, isLit, renderer); f.root.updateMatrixWorld(true);
  if (Object.keys(f.parts).sort().join() !== 'face,returns,studs') fail('fabricated parts: ' + Object.keys(f.parts).sort().join());
  f.root.traverse(o => { if (o.isMesh && materials(o).some(glowing)) fail('fabricated sign glows'); if (!o.matrixWorld.elements.every(Number.isFinite)) fail('fabricated: invalid transform'); });
  if (f.parts.face.children.length !== pieces) fail('fabricated face pieces ' + f.parts.face.children.length);
  if (f.parts.studs.children.length < 3 * meaningful) fail('fabricated: expected ≥3 studs per piece'); }
const fabInch = 4 / fabSettings.width, fabBuilt = fab.build(art, fabSettings, false, renderer), fabBox = new THREE.Box3().setFromObject(fabBuilt.parts.face);
if (Math.abs(fabBox.max.z - .1019 * fabInch) > .02 * fabInch) fail('fabricated face should be the measured 0.1019″, front at ' + fabBox.max.z / fabInch + '″');
if (Math.abs(fab.wallDepth(fabSettings) - fabSettings.depth * fabInch) > 1e-9 || fab.wallGap(fabSettings) !== 0) fail('fabricated returns must sit on the wall');
const fabReturns = new THREE.Box3().setFromObject(fabBuilt.parts.returns);
if (Math.abs(fabReturns.min.z + fab.wallDepth(fabSettings)) > 1e-6) fail('fabricated returns do not reach the wall');
// Side-lit: the returns are the lit part (the face's acrylic edges share their material; the vinyl front never glows); back,
// studs, drain and wiring never glow; its light
// plane sits on the wall, not in front; flush, gauges from PARTS (3/16″ acrylic returns, 0.1019″ back); every mounting builds.
const side = signs['side-lit'], sideSt = {...settings, signtype: 'side-lit', depth: side.standardDepth};
if (side.standardDepth !== 1 || side.depthRange.min !== .75 || side.depthRange.max !== 10) fail('side-lit depth should be the registry 1″ (0.75–10″)');
{ const sl = side.build(art, sideSt, true, renderer); sl.root.updateMatrixWorld(true); const sInch = 4 / sideSt.width;
  if (Object.keys(sl.parts).sort().join() !== 'back,drain,face,leds,returns,studs,wires') fail('side-lit parts: ' + Object.keys(sl.parts).sort().join());
  if (sl.parts.face.children.length !== pieces || sl.parts.back.children.length !== pieces) fail('side-lit face/back pieces');
  if (sl.parts.leds.children.length < meaningful || sl.parts.drain.children.length !== meaningful || sl.parts.studs.children.length < 3 * meaningful) fail('side-lit LEDs, weep holes or studs missing');
  for (const name of ['back', 'studs', 'drain', 'wires']) sl.parts[name].traverse(o => { if (o.isMesh && materials(o).some(glowing)) fail('side-lit ' + name + ' glows'); });
  if (!materials(sl.parts.returns.children[0]).some(glowing)) fail('side-lit returns do not glow');
  if (materials(sl.parts.face.children[0])[0].emissiveIntensity > 0 && glowing(materials(sl.parts.face.children[0])[0])) fail('side-lit vinyl face must not glow');
  side.build(art, sideSt, false, renderer).root.traverse(o => { if (o.isMesh && materials(o).some(glowing)) fail('unlit side-lit still glows'); });
  const plane = side.glow(art, sideSt, true, -side.wallDepth(sideSt), 4 * art.h / art.w); if (plane.userData.front || plane.position.z > -side.wallDepth(sideSt) + .02 || plane.material.opacity <= 0) fail('side-lit light must land on the wall');
  if (side.wallGap(sideSt) !== 0 || Math.abs(side.wallDepth(sideSt) - (sideSt.depth + .1019) * sInch) > 1e-9) fail('side-lit: flush on the 0.1019″ back');
  if (Math.abs(sl.parts.back.children[0].geometry.parameters.options.depth - .1019 * sInch) > 1e-9) fail('side-lit back should be 0.1019″');
  for (const mid of ['raceway-2', 'backer-acm-4', 'backboard-cabinet-2']) { const m = side.build(art, {...sideSt, mounting: mid}, true, renderer); if (!m.parts[{ 'raceway-2': 'raceway', 'backer-acm-4': 'backer', 'backboard-cabinet-2': 'cabinet' }[mid]]?.children.length) fail('side-lit ' + mid + ' did not build'); } }
// Face & halo-lit: lit face and lit acrylic back; trim, returns, studs, clamps never glow; two light planes (halo on the wall, glow in
// front); standoff gap; welded trim always present (not the trim select); every mounting builds.
const fh = signs['face-halo-lit'], fhSt = {...settings, signtype: 'face-halo-lit', depth: fh.standardDepth, trim: 'none', gap: .5};
if (fh.standardDepth !== 3 || fh.depthRange.min !== 2.5 || fh.depthRange.max !== 10) fail('face & halo depth should be the registry 3″ (2.5–10″)');
{ const b = fh.build(art, fhSt, true, renderer); b.root.updateMatrixWorld(true); const fInch = 4 / fhSt.width;
  if (Object.keys(b.parts).sort().join() !== 'acrylic,clamps,drain,face,leds,returns,studs,trim,wires') fail('face & halo parts: ' + Object.keys(b.parts).sort().join());
  if (!b.parts.trim.children.length) fail('face & halo: the welded trim is always there (trim select does not apply)');
  if (!materials(b.parts.face.children[0]).some(glowing) || !materials(b.parts.acrylic.children[0]).some(glowing)) fail('face & halo: face and acrylic back must glow');
  for (const name of ['trim', 'returns', 'studs', 'clamps', 'drain', 'wires']) b.parts[name].traverse(o => { if (o.isMesh && materials(o).some(glowing)) fail('face & halo ' + name + ' glows'); });
  if (b.parts.clamps.children.length < 3 * meaningful || b.parts.studs.children.length < 3 * meaningful) fail('face & halo: standoff studs and clamps');
  fh.build(art, fhSt, false, renderer).root.traverse(o => { if (o.isMesh && materials(o).some(glowing)) fail('unlit face & halo still glows'); });
  const planes = [].concat(fh.glow(art, fhSt, true, -fh.wallDepth(fhSt) - fh.wallGap(fhSt), 4 * art.h / art.w));
  if (planes.length !== 2 || planes.filter(p => p.userData.front).length !== 1 || planes.some(p => p.material.opacity <= 0)) fail('face & halo: one halo on the wall + one glow in front');
  if (Math.abs(fh.wallGap(fhSt) - .5 * fInch) > 1e-9 || Math.abs(fh.wallDepth(fhSt) - (fhSt.depth + .1875) * fInch) > 1e-9) fail('face & halo: wall behind the 3/16″ back across the gap');
  for (const mid of ['raceway-2', 'backer-acm-4', 'backboard-cabinet-2']) { const m = fh.build(art, {...fhSt, mounting: mid}, true, renderer); if (!m.parts[{ 'raceway-2': 'raceway', 'backer-acm-4': 'backer', 'backboard-cabinet-2': 'cabinet' }[mid]]?.children.length) fail('face & halo ' + mid + ' did not build'); } }
// Face & side-lit: the lit face and the acrylic returns glow; back, studs, drain, wiring never; spill on the wall + face glow in front;
// flush; returns and spill 1.5× side-lit's; every mounting builds.
const fs2 = signs['face-side-lit'], fsSt = {...settings, signtype: 'face-side-lit', depth: fs2.standardDepth};
if (fs2.standardDepth !== 3 || fs2.depthRange.min !== 2 || fs2.depthRange.max !== 5) fail('face & side depth should be the registry 3″ (2–5″)');
{ const b = fs2.build(art, fsSt, true, renderer); b.root.updateMatrixWorld(true);
  if (Object.keys(b.parts).sort().join() !== 'back,drain,face,leds,returns,studs,wires') fail('face & side parts: ' + Object.keys(b.parts).sort().join());
  if (!glowing(materials(b.parts.face.children[0])[0]) || !materials(b.parts.returns.children[0]).some(glowing)) fail('face & side: face and returns must glow');
  if (materials(b.parts.returns.children[0])[0].userData.glowFactor !== 4.5) fail('face & side returns should be 1.5× side-lit');
  for (const name of ['back', 'studs', 'drain', 'wires']) b.parts[name].traverse(o => { if (o.isMesh && materials(o).some(glowing)) fail('face & side ' + name + ' glows'); });
  fs2.build(art, fsSt, false, renderer).root.traverse(o => { if (o.isMesh && materials(o).some(glowing)) fail('unlit face & side still glows'); });
  const planes = [].concat(fs2.glow(art, fsSt, true, -fs2.wallDepth(fsSt), 4 * art.h / art.w));
  if (planes.length !== 2 || planes.filter(p => p.userData.front).length !== 1 || planes.some(p => p.material.opacity <= 0)) fail('face & side: spill on the wall + glow in front');
  if (fs2.wallGap(fsSt) !== 0 || Math.abs(fs2.wallDepth(fsSt) - (fsSt.depth + .1019) * 4 / fsSt.width) > 1e-9) fail('face & side: flush on the 0.1019″ back');
  for (const mid of ['raceway-2', 'backer-acm-4', 'backboard-cabinet-2']) { const m = fs2.build(art, {...fsSt, mounting: mid}, true, renderer); if (!m.parts[{ 'raceway-2': 'raceway', 'backer-acm-4': 'backer', 'backboard-cabinet-2': 'cabinet' }[mid]]?.children.length) fail('face & side ' + mid + ' did not build'); }
  // Side-lit is unchanged by the shared can: vinyl face, returns at 3.
  const sl = signs['side-lit'].build(art, {...settings, signtype: 'side-lit', depth: 1}, true, renderer); if (materials(sl.parts.returns.children[0])[0].userData.glowFactor !== 3 || glowing(materials(sl.parts.face.children[0])[0])) fail('side-lit changed'); }
if (waiting.length) console.log('VARIANTS_WAITING_FOR_REGISTRY', waiting.length, 'rows still "todo":', waiting.join(', '));
console.log('CHANNEL_LETTER_BUILD_OK', JSON.stringify({pieces, trim: parts.trim.children.length, mounts: parts.studs.children.length, leds: parts.leds.children.length, weep: parts.drain.children.length}));
