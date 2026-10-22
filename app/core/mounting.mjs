// Mountings, per construction. The sets themselves are MOUNTING_SETS in registry.mjs (generated data, never repeated here);
// this module only says which of them draw hardware today. A construction lists the ones it offers in its `signs` entry.
// psuInside (raceway): the power supply sits inside the mounting, not behind the wall.
import {MOUNTING_SETS} from '../registry.mjs?v=2';
// Mountings that draw geometry. The rest stay declared until the shop sends real inches.
const BUILT={'channel-letter':['flush']};
// Every mounting of a construction, each with `built`. [] = the construction has none; null = not known yet (ASK).
export const mountingsFor=build=>{const set=MOUNTING_SETS[build];return set?set.map(m=>({...m,built:!!BUILT[build]?.includes(m.id)})):set??null;};
// One mounting by construction and id; null when unknown.
export const mounting=(build,id)=>mountingsFor(build)?.find(m=>m.id===id)||null;
// The mounting a build is about to draw. Throws for an unknown or unbuilt one instead of silently drawing nothing.
export function builtMounting(build,id){const m=mounting(build,id);if(!m)throw new Error('Unknown '+build+' mounting: '+id);if(!m.built)throw new Error(m.label+': mounting not implemented yet (waiting on dimensions from the shop).');return m;}
