// app/references/library.mjs: the construction reference library. Every drawing exists, is a PNG, and points at real
// registry data (PARTS key, MOUNTING_SETS id of its construction); every channel-letter PARTS source has its drawing.
import fs from 'node:fs';
import {LIBRARY} from '../app/references/library.mjs';
import {BUILDS, MOUNTING_SETS, PARTS} from '../app/registry.mjs';
const fail = msg => { throw new Error('reference library: ' + msg); };
const ids = LIBRARY.map(e => e.id), files = LIBRARY.flatMap(e => e.drawings.map(d => d.file));
if (new Set(ids).size !== ids.length) fail('duplicate ids');
if (new Set(files).size !== files.length) fail('two drawings share a file');
for (const e of LIBRARY) {
  if (!e.title || !e.drawings.length) fail(e.id + ': no title or drawings');
  if (e.pending ? e.build !== null : !BUILDS[e.build]) fail(e.id + ': unknown build ' + e.build);
  if (e.parts && !PARTS[e.parts]) fail(e.id + ': unknown parts ' + e.parts);
  for (const d of e.drawings) {
    const png = fs.readFileSync(new URL('../app/references/' + d.file, import.meta.url));
    if (png.readUInt32BE(0) !== 0x89504e47) fail(d.file + ' is not a PNG');
    if (d.mounting && !(MOUNTING_SETS[e.build] || []).some(m => m.id === d.mounting)) fail(`${d.file}: ${d.mounting} is not a ${e.build} mounting`);
  }
}
// Each PARTS entry was measured off a drawing: that drawing must be in the library.
// Folder names in the original tree carry stray trailing spaces, so compare trimmed path segments.
const folder = f => f.split('/').map(s => s.trim()).join('/');
const sources = new Set(LIBRARY.flatMap(e => e.drawings.map(d => folder(d.source.split('/').slice(0, -1).join('/')))));
for (const [key, p] of Object.entries(PARTS)) if (p.verified && !sources.has(folder(p.source))) fail(`PARTS.${key} source "${p.source}" has no drawing`);
// Channel-letter sets are drawn for every mounting.
for (const e of LIBRARY.filter(e => e.build === 'channel-letter')) if (new Set(e.drawings.map(d => d.mounting)).size !== MOUNTING_SETS['channel-letter'].length) fail(e.id + ': missing a mounting drawing');
console.log('REFERENCE_LIBRARY_OK', JSON.stringify({entries: LIBRARY.length, drawings: files.length}));
