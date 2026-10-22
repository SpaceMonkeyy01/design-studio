// app/registry.mjs: every sign type the studio sells. Data is provided, not edited here; this only checks it is well formed.
import {SIGNS, BUILDS, MOUNTING_SETS, PARTS, STRUCTURES, partsFor, stats} from '../app/registry.mjs';
const fail = msg => { throw new Error('registry: ' + msg); };
const ids = SIGNS.map(s => s.id);
if (new Set(ids).size !== ids.length) fail('duplicate ids');
for (const s of SIGNS) {
  if (!s.id || !s.signType || !s.category || !s.status) fail('missing id/signType/category/status on ' + JSON.stringify(s).slice(0, 80));
  if (s.status !== 'excluded' && !BUILDS[s.build]) fail(`${s.id}: unknown build ${s.build}`);
  if (s.structure && !STRUCTURES[s.structure]) fail(`${s.id}: unknown structure ${s.structure}`);
  if (s.depth && !(s.depth.min <= s.depth.std && s.depth.std <= s.depth.max)) fail(`${s.id}: depth std outside min–max`);
  if (s.parts && !PARTS[s.parts]) fail(`${s.id}: unknown parts ${s.parts}`);
}
// Mounting sets are per construction; null means not known yet (ASK), [] means the construction has none.
for (const [build, set] of Object.entries(MOUNTING_SETS)) {
  if (!BUILDS[build]) fail(`MOUNTING_SETS: unknown build ${build}`);
  if (set && new Set(set.map(m => m.id)).size !== set.length) fail(`MOUNTING_SETS.${build}: duplicate ids`);
  if (set?.some(m => !m.id || !m.label)) fail(`MOUNTING_SETS.${build}: mounting without id/label`);
}
// PARTS: inheritance resolves, and every entry reached from a row has a face (or says why not).
for (const [key, p] of Object.entries(PARTS)) if (p.inherits && !PARTS[p.inherits]) fail(`PARTS.${key}: inherits unknown ${p.inherits}`);
for (const s of SIGNS) if (s.parts && !('face' in partsFor(s))) fail(`${s.id}: parts without a face entry`);
console.log('REGISTRY_OK', JSON.stringify(stats()));
