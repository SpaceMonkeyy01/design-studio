// app/registry.mjs: every sign type the studio sells. Data is provided, not edited here; this only checks it is well formed.
import {SIGNS, BUILDS, MOUNTINGS, STRUCTURES, stats} from '../app/registry.mjs';
const fail = msg => { throw new Error('registry: ' + msg); };
const ids = SIGNS.map(s => s.id);
if (new Set(ids).size !== ids.length) fail('duplicate ids');
for (const s of SIGNS) {
  if (!s.id || !s.signType || !s.category || !s.status) fail('missing id/signType/category/status on ' + JSON.stringify(s).slice(0, 80));
  if (s.status !== 'excluded' && !BUILDS[s.build]) fail(`${s.id}: unknown build ${s.build}`);
  if ((s.mounting || []).some(m => !MOUNTINGS.includes(m))) fail(`${s.id}: unknown mounting`);
  if (s.structure && !STRUCTURES[s.structure]) fail(`${s.id}: unknown structure ${s.structure}`);
  if (s.depth && !(s.depth.min <= s.depth.std && s.depth.std <= s.depth.max)) fail(`${s.id}: depth std outside min–max`);
}
console.log('REGISTRY_OK', JSON.stringify(stats()));
