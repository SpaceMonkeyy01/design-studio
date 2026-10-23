import * as THREE from 'three';
import {toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';
import {clippedReturnRings,offsetRegions} from '../../core/artwork.mjs?v=11';
import {mountingPoints} from '../../core/routing.mjs?v=10';
import {finishMaterial,artworkMaterial,ledColour} from '../../core/materials.mjs?v=13';
import {artSpace,flatCaps} from '../../core/shapes.mjs?v=1';
import {glowPlane} from '../../core/glow.mjs?v=2';
import {acrylicFaceMaterial,faceGlowPlane} from '../../core/litface.mjs?v=1';
import {builtMounting} from '../../core/mounting.mjs?v=5';
import {SIGNS as REGISTRY,PARTS} from '../../registry.mjs?v=2';
import {partSet,hardwareMaterials,isTinyPiece,letterScale,mountScale,letterLEDs,threadedStud,groupMount,drainMarker} from '../../core/hardware.mjs?v=3';
// Channel letters: a traced can (face + returns + back). One parametric build for every channel-letter variant;
// the variant is a construction config, not code. See CLAUDE.md in this folder.
//   face      opaque | acrylic | none | half-mirror
//   faceVinyl true = opaque vinyl over the acrylic face (side-lit: the same acrylic face, not an opaque face part)
//   returns   opaque | translucent
//   back      opaque | acrylic | mirror | none (open-back can: fabricated non-lit)
//   emit      subset of front, back, side
// Materials and gauges per part are PARTS in registry.mjs; these switches only say how light gets out.
// Built today: halo-lit {opaque, opaque, acrylic, [back]}, face-lit {acrylic, opaque, opaque, [front]}, fabricated-nonlit {opaque, opaque, none, []},
// side-lit {acrylic+vinyl, translucent, opaque, [side]}, face-halo-lit {acrylic, opaque, acrylic, [front, back]},
// face-side-lit {acrylic, translucent, opaque, [front, side]}.
export const CONFIGS={
 'halo-lit':{face:'opaque',returns:'opaque',back:'acrylic',emit:['back']},
 'face-lit':{face:'acrylic',returns:'opaque',back:'opaque',emit:['front']},
 'fabricated-nonlit':{face:'opaque',returns:'opaque',back:'none',emit:[]},
 'side-lit':{face:'acrylic',faceVinyl:true,returns:'translucent',back:'opaque',emit:['side']},
 'face-halo-lit':{face:'acrylic',returns:'opaque',back:'acrylic',emit:['back','front']},
 'face-side-lit':{face:'acrylic',returns:'translucent',back:'opaque',emit:['front','side']},
};
const key=c=>[c.face+(c.faceVinyl?'+vinyl':''),c.returns,c.back,[...c.emit].sort().join('+')].join('/'),BUILT=new Map(Object.entries(CONFIGS).map(([id,c])=>[key(c),id]));
// The construction a config describes. Other switch combinations (side-lit, face & halo, infinity mirror…) are not built yet.
function construction(cfg){const id=BUILT.get(key(cfg));if(!id)throw new Error('Channel-letter construction not built yet: '+key(cfg));return id;}

// Inches. ASSUMED values are listed in CLAUDE.md: trim thickness and lip. ACRYLIC/BACK/RETURN are only fallbacks for a part
// whose cross-section gives no thickness (METAL_FACE: halo-lit's face); measured gauges come from PARTS (see gauges()).
const ACRYLIC=.1875,BACK=.063,RETURN=.04,METAL_FACE=.045,TRIM=.06,TRIM_BAND=1,LIP=.125,LED_PITCH=4;
// Side-lit: lit acrylic returns, emissive per unit of intensity; and the light they throw on the wall around each letter (blur
// sigmas in inches, strength). Tuned on screenshots.
const SIDE_GLOW=3,SPILL_CORE=.35,SPILL_WIDE=1.4,SPILL=1.5;
// Face & side-lit opens at 50% intensity (for its lit face), so its returns and spill are 1.5× side-lit's (which opens at 75%).
const FACE_SIDE=1.5;
const TRIM_FINISH={black:'black',white:'white',artwork:'artwork',silver:'silver-brushed',gold:'gold-brushed',bronze:'bronze-brushed'};
// Mounting parts between the letters and the wall (MOUNTING_SETS). depth = how far it stands off the wall (inches); the letters
// keep their place and the wall moves back by it. From the shop: backer thicknesses (4 mm ACM, 8 mm acrylic, 2.5 mm aluminium) and
// the raceway's and backboard cabinet's 2″ depth (0.1019″ / 0.079″ aluminium). ASSUMED until the shop confirms (editable, see CLAUDE.md):
// backer and cabinet = rectangle around the artwork with a 3″ margin (s.backermargin), square corners; raceway = one box centred on the artwork, 5″ tall (s.racewayheight),
// 2″ shorter than the sign at each end, no top lip; colour s.backercolour (white, black, silver; clear for an acrylic backer only).
const MOUNTS={'backer-acm-4':{kind:'backer',material:'ACM',depth:4/25.4},'backer-acrylic-8':{kind:'backer',material:'acrylic',depth:8/25.4},'backer-aluminum-25':{kind:'backer',material:'aluminium',depth:2.5/25.4},
 'raceway-2':{kind:'raceway',material:'aluminium',depth:2},'backboard-cabinet-2':{kind:'cabinet',material:'aluminium',depth:2}};
const RACEWAY_INSET=2;
export const mountOf=s=>MOUNTS[s.mounting]||null;const mountDepth=s=>mountOf(s)?.depth||0;


// Builds one sign for a traced artwork, settings snapshot and construction config. Returns {root, parts}, one group per part.
// Pieces are created in each construction's original order: material ids decide the draw order of coplanar surfaces,
// so reordering would move pixels.
// A cross-section call-out in inches: '0.0630"' or '3/16"'. null when the drawing gives none.
const callout=t=>{const f=/^(\d+)\/(\d+)"$/.exec(t||'');return f?f[1]/f[2]:parseFloat(t)||null;};
// Part gauges of a built construction from PARTS (registry.mjs). acrylic = the lit acrylic part: the face (face-lit) or the back (halo-lit);
// metalFace = an opaque metal face (halo-lit, fabricated).
function gauges(kind){const p=PARTS[kind];return {acrylic:callout(p.face?.material==='acrylic'?p.face.thickness:p.back?.thickness)??ACRYLIC,back:callout(p.back?.thickness)??BACK,returns:callout(p.returns?.thickness)??RETURN,metalFace:callout(p.face?.material!=='acrylic'?p.face?.thickness:null)??METAL_FACE};}
export function buildChannelLetter(art,s,isLit,renderer,cfg){const kind=construction(cfg),rearLit=cfg.back==='acrylic';builtMounting('channel-letter',s.mounting||'flush');const mountPart=mountOf(s);
 const {root,parts,addPart}=partSet([...(kind==='fabricated-nonlit'?['face','returns','studs']:kind==='side-lit'||kind==='face-side-lit'?['face','returns','leds','wires','back','studs','drain']:kind==='face-halo-lit'?['trim','face','returns','leds','wires','acrylic','studs','drain','clamps']:rearLit?['face','returns','acrylic','leds','studs','wires','drain','clamps']:['trim','face','returns','leds','wires','back','studs','drain']),...(mountPart?[mountPart.kind]:[])]);
 const {pos,shapes,uv,contours}=artSpace(art),C=window.ClipperLib;
 const inch=4/s.width,depth=s.depth*inch,gap=rearLit?s.gap*inch:0,backerT=mountDepth(s)*inch,g=kind==='side-lit'?{...gauges(kind),acrylic:gauges('face-lit').acrylic}:gauges(kind),acrylicT=g.acrylic*inch,backT=g.back*inch,trimT=TRIM*inch,band=Math.min(TRIM_BAND,s.depth*.5)*inch,lip=LIP*inch;
 // Extrude Clipper regions [{points, holes}] from z0 to z1 with artwork-space UVs. material: one material, or a function called per region.
 // Rings of tiny pieces can collapse to <3 points: skip them.
 const slab=(regions,z0,z1,material,part,index)=>{for(const r of regions){if(r.points.length<3)continue;const shape=new THREE.Shape(r.points.map(p=>new THREE.Vector2(...p)));shape.holes=r.holes.filter(h=>h.length>=3).map(h=>new THREE.Path(h.map(p=>new THREE.Vector2(...p))));const raw=new THREE.ExtrudeGeometry(shape,{depth:z1-z0,bevelEnabled:false,steps:1});raw.translate(0,0,z0);raw.scale(100,100,100);const g=toCreasedNormals(raw,.8);g.scale(.01,.01,.01);uv(g);const m=new THREE.Mesh(g,typeof material==='function'?material():material);m.userData.artIndex=index;m.userData.faceSurface=false;addPart(part,m);}};
 // Returns: opaque metal sidewalls from z0 to z1. Wall = min(.040″, 22% of the widest mount clearance). Boolean offsetting
 // keeps shells continuous around acute corners and narrow strokes. after(index, contours) adds per-letter pieces (trim).
 const returnsShell=(z0,z1,material,after)=>{for(let index=0;index<art.loops.length;index++){const letter=art.loops[index],c=contours(letter),mounts=mountingPoints(letter,art.dist,art.w,art.h,s.mountcount,art.labels),clearance=mounts.reduce((n,m)=>Math.max(n,m.clearance*4/art.w),.001);slab(clippedReturnRings(c,Math.min(g.returns*inch,clearance*.22),C),z0,z1,material(index),'returns',index);after?.(index,c);}};
 // Hardware per meaningful letter: LED modules + wiring, mounts, drain / weep hole (drain returns its z, or null for none).
 // Returns all module positions (mask px).
 const hardware=({leds,mount,drain})=>{const modules=[];for(const l of art.loops){if(isTinyPiece(l,art))continue;const mounts=mountingPoints(l,art.dist,art.w,art.h,s.mountcount,art.labels),scale=letterScale(mounts,art,inch);const placed=leds(l,scale);modules.push(...placed);for(const m of mounts)mount(l,m);const z=drain(placed);if(z!==null)drainMarker(addPart,l,pos,inch,z);}return modules;};
 const mats=hardwareMaterials.bind(null,s,isLit);
 if(kind==='halo-lit')rearLitCan();else if(kind==='fabricated-nonlit')openBackCan();else if(kind==='side-lit'||kind==='face-side-lit')sideLitCan();else if(kind==='face-halo-lit')faceHaloCan();else faceLitCan();
 // The mounting part's front is where the wall was: behind the acrylic back and the gap (halo-lit), the sealed back (face-lit) or the returns.
 if(mountPart)(mountPart.kind==='raceway'?racewayBox:backerPanel)(rearLit?-depth-acrylicT-gap:kind==='face-lit'||kind==='side-lit'||kind==='face-side-lit'?-depth-backT:-depth);
 return {root,parts};

 // Colour of a backer or raceway. Not a finish part: it keeps its own colour. Clear only for an acrylic backer (others draw white).
 function mountMaterial(){const colour=s.backercolour==='clear'&&mountPart.material!=='acrylic'?'white':s.backercolour||'white';
  return colour==='silver'?finishMaterial({...s,finish:'silver-brushed'},art.texture,renderer):colour==='clear'?new THREE.MeshPhysicalMaterial({color:'#e4f0f3',transparent:true,opacity:.3,roughness:.06,metalness:0,clearcoat:1,clearcoatRoughness:.05,depthWrite:false}):new THREE.MeshStandardMaterial({color:colour==='black'?'#1b1d1e':'#efeee9',roughness:mountPart.material==='acrylic'?.15:.5,metalness:0});}
 // Flat backer or backboard cabinet: one rectangle around the artwork plus the margin, from its front (z) back to the wall. The
 // cabinet is drawn closed (its power supply inside is not drawn).
 function backerPanel(front){const m=Math.max(0,s.backermargin??3)*inch,panel=new THREE.Mesh(new THREE.BoxGeometry(4+2*m,4*art.h/art.w+2*m,backerT),mountMaterial());panel.position.z=front-backerT/2;addPart(mountPart.kind,panel);}
 // Raceway: a box on the wall, centred on the artwork, the sign's width less RACEWAY_INSET at each end; the letters are bolted to its
 // front, the power supply sits inside (not drawn). Drawn closed; the drawings' top lip is left out. The letters hang on the raceway
 // only: stud mounts outside its band are dropped (a letter wholly above or below it gets none: a real job would add a raceway).
 function racewayBox(front){const length=Math.max(4*.3,4-2*RACEWAY_INSET*inch),height=Math.max(.5,s.racewayheight??5)*inch,box=new THREE.Mesh(new THREE.BoxGeometry(length,height,backerT),mountMaterial());box.position.z=front-backerT/2;addPart('raceway',box);
  const band=new THREE.Box3(new THREE.Vector3(-length/2,-height/2,-Infinity),new THREE.Vector3(length/2,height/2,Infinity)),centre=new THREE.Vector3();
  for(const mount of [...parts.studs.children]){new THREE.Box3().setFromObject(mount).getCenter(centre);if(band.containsPoint(centre))continue;parts.studs.remove(mount);mount.traverse(o=>o.geometry?.dispose());}}

 // Halo-lit: opaque metal face and returns, rear-facing LEDs, acrylic back, spacer + stud mounts with L-clamps across the wall gap.
 function rearLitCan(){const mat=finishMaterial(s,art.texture,renderer);
  metalFace(mat);
  returnsShell(-depth,0,index=>()=>artworkMaterial(mat,index,false,s.finish,art.colors));
  acrylicBack();
  const hw=mats(),{studMat}=hw;
  hardware({
   // Rear-facing modules just behind the face; lenses point at the acrylic back.
   leds:(l,scale)=>letterLEDs(addPart,parts,art,l,pos,s,scale,hw,{z:-.06*inch,lens:-1,wireZ:-.06*inch-.11*inch}),
   mount:(l,m)=>spacerMount(l,m,studMat),
   // Drain marker only on letters with LEDs.
   drain:placed=>placed.length?-depth/2:null});}

 // Acrylic back (halo-lit, face & halo-lit): cut to the letters, emissive in the LED colour; clear, frosted or opal.
 function acrylicBack(){const acrylicOptions={clear:{opacity:.25,roughness:.08,faceGlow:.12,edgeGlow:.65},frosted:{opacity:.62,roughness:.7,faceGlow:.75,edgeGlow:.95},opal:{opacity:.94,roughness:.38,faceGlow:1.15,edgeGlow:1.2}}[s.acrylictype]||{opacity:.25,roughness:.08,faceGlow:.12,edgeGlow:.65};const acrylic=new THREE.MeshPhysicalMaterial({color:s.acrylictype==='clear'?'#e4f0f3':'#f4f4ef',emissive:ledColour(s),emissiveIntensity:isLit?s.intensity*acrylicOptions.faceGlow:0,roughness:acrylicOptions.roughness,metalness:0,transparent:true,opacity:acrylicOptions.opacity,clearcoat:1,clearcoatRoughness:.06,side:THREE.DoubleSide,depthWrite:false});acrylic.userData.glowFactor=acrylicOptions.faceGlow;const acrylicEdge=acrylic.clone();acrylicEdge.opacity=Math.max(.6,acrylicOptions.opacity);acrylicEdge.emissiveIntensity=isLit?s.intensity*acrylicOptions.edgeGlow:0;acrylicEdge.userData.glowFactor=acrylicOptions.edgeGlow;for(const shape of shapes()){const glass=new THREE.Mesh(uv(new THREE.ExtrudeGeometry(shape,{depth:acrylicT,bevelEnabled:true,bevelThickness:.005*inch,bevelSize:.005*inch,bevelSegments:2})),[acrylic,acrylicEdge]);glass.position.z=-depth-acrylicT;addPart('acrylic',glass);}}

 // Hollow spacer across the wall gap, threaded stud through its bore, rivnut, and an L-clamp with 2 screws (acrylic-backed cans).
 function spacerMount(l,mountPoint,studMat){const p=mountPoint.point,mountStart=parts.studs.children.length,v=pos(p),hardwareInch=inch*mountScale(mountPoint,art,inch),panelBack=-depth-acrylicT,wallZ=panelBack-gap,studEnd=wallZ-backerT-.35*inch;
    const spacerShape=new THREE.Shape();spacerShape.absarc(0,0,.21*hardwareInch,0,Math.PI*2,false);const bore=new THREE.Path();bore.absarc(0,0,.142*hardwareInch,0,Math.PI*2,true);spacerShape.holes.push(bore);const spacer=new THREE.Mesh(new THREE.ExtrudeGeometry(spacerShape,{depth:gap,bevelEnabled:true,bevelSize:.006*hardwareInch,bevelThickness:.006*hardwareInch,bevelSegments:2,curveSegments:32}),studMat);spacer.position.set(v.x,v.y,wallZ);addPart('studs',spacer);
    threadedStud(addPart,studMat,v.x,v.y,hardwareInch,{shaftTop:-depth+.15*hardwareInch,end:studEnd,nutTop:-depth+.25*hardwareInch,nutBottom:-depth-.12*hardwareInch,threadTop:panelBack,turns:Math.max(4,Math.round((s.gap+.35)*20))});groupMount(parts,mountStart);addBackClamp(l,mountPoint,hardwareInch,studMat);}

 // Opaque metal face in front of the returns (z 0 to its gauge) with a small bevel; takes the selected finish (flat caps so mirror
 // finishes reflect cleanly). Halo-lit: .045″ (no gauge on its drawing); fabricated: 0.1019″ from PARTS.
 function metalFace(mat){shapes().forEach((shape,index)=>{const rawFace=new THREE.ExtrudeGeometry(shape,{depth:g.metalFace*inch,bevelEnabled:true,bevelThickness:.006*inch,bevelSize:.009*inch,bevelSegments:6,curveSegments:32});rawFace.scale(100,100,100);const face=flatCaps(toCreasedNormals(rawFace,.8));face.scale(.01,.01,.01);uv(face);const surface=new THREE.Mesh(face,artworkMaterial(mat,index,true,s.finish,art.colors));surface.userData.artIndex=index;surface.userData.faceSurface=true;addPart('face',surface);});}

 // Fabricated non-lit: metal face and returns that sit on the wall, open back. Threaded studs welded to the back of the face
 // run through the empty can into the wall. No LEDs, wiring, drain, back panel or gap.
 function openBackCan(){const mat=finishMaterial(s,art.texture,renderer),{studMat}=mats();
  metalFace(mat);
  returnsShell(-depth,0,index=>()=>artworkMaterial(mat,index,false,s.finish,art.colors));
  hardware({leds:()=>[],drain:()=>null,
   mount:(l,m)=>{const start=parts.studs.children.length,v=pos(m.point),h=inch*mountScale(m,art,inch);threadedStud(addPart,studMat,v.x,v.y,h,{shaftTop:0,end:-depth-backerT-.35*inch,nutTop:0,nutBottom:-.25*h,threadTop:-.25*h,turns:Math.max(4,Math.round((s.depth+.35)*20))});groupMount(parts,start);}});}

 // Face-lit: trim cap, lit acrylic face, opaque returns, front-facing LEDs on a sealed back, flush threaded studs.
 function faceLitCan(){const wallZ=-depth-backT,hw=mats(),{studMat}=hw;
  // LEDs, wiring, studs and weep holes first: the face glow needs the module positions.
  const modules=hardware({
   // Front-facing modules on the sealed back, ≈4″ pitch; a letter too small for that gets the denser default spacing.
   leds:(l,scale)=>{const leds={z:-depth+.06*inch,lens:1,wireZ:-depth+.03*inch};let placed=letterLEDs(addPart,parts,art,l,pos,s,scale,hw,{...leds,spacing:art.w*LED_PITCH/s.width});if(!placed.length)placed=letterLEDs(addPart,parts,art,l,pos,s,scale,hw,leds);return placed;},
   // Threaded stud through the back into the wall, nut inside the can. No spacer, no clamps: flush, no acrylic back.
   mount:(l,m)=>{const start=parts.studs.children.length,v=pos(m.point),h=inch*mountScale(m,art,inch);threadedStud(addPart,studMat,v.x,v.y,h,{shaftTop:-depth+.15*h,end:wallZ-backerT-.35*inch,nutTop:-depth+.2*h,nutBottom:-depth,threadTop:-depth,turns:Math.max(4,Math.round((g.back+.35)*20))});groupMount(parts,start);},
   // Weep hole at the lowest point of every letter, just above the back.
   drain:()=>-depth+.25*inch});
  // Returns behind the face, and the trim cap: a band over the returns plus a lip over the face edge.
  const returnBase=finishMaterial({...s,finish:s.returns,sheen:'satin'},art.texture,renderer),trimFinish=TRIM_FINISH[s.trim],trimBase=trimFinish&&finishMaterial({...s,finish:trimFinish,sheen:'gloss'},art.texture,renderer);
  returnsShell(-depth,-acrylicT,index=>artworkMaterial(returnBase,index,false,s.returns,art.colors),(index,c)=>{if(!trimBase)return;const tm=artworkMaterial(trimBase,index,false,trimFinish,art.colors);for(const r of offsetRegions(c,trimT,C)){const rc=[r.points,...r.holes];slab(clippedReturnRings(rc,trimT,C),-band,0,tm,'trim',index);slab(clippedReturnRings(rc,trimT+lip,C),0,trimT,tm,'trim',index);}});
  // Acrylic face in front, sealed back behind; both cut to the letter outline. Face edges take the returns' paint:
  // sampling the artwork at the exact outline gives a ragged rim when trimless.
  const faceMat=acrylicFaceMaterial(art,s,isLit,modules,LED_PITCH),backMat=new THREE.MeshStandardMaterial({color:'#8b9196',metalness:.6,roughness:.5});
  shapes().forEach((shape,index)=>{const face=new THREE.Mesh(uv(new THREE.ExtrudeGeometry(shape,{depth:acrylicT,bevelEnabled:false})),[faceMat,artworkMaterial(returnBase,index,false,s.returns,art.colors)]);face.position.z=-acrylicT;addPart('face',face);const back=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:backT,bevelEnabled:false}),backMat);back.position.z=wallZ;addPart('back',back);});}

 // Side-lit: the face-lit can with the light moved to the returns. Acrylic face under opaque vinyl (the artwork colours, never lit),
 // 3/16″ acrylic returns that glow in the LED colour, front-facing LEDs on the sealed 0.1019″ back, flush studs, weep holes. No trim.
 // Face & side-lit: the same can without the vinyl: the acrylic face is lit too (face-lit's face material).
 function sideLitCan(){const wallZ=-depth-backT,hw=mats(),{studMat}=hw,litFace=kind==='face-side-lit',glowFactor=SIDE_GLOW*(litFace?FACE_SIDE:1);
  const modules=hardware({
   leds:(l,scale)=>{const leds={z:-depth+.06*inch,lens:1,wireZ:-depth+.03*inch};let placed=letterLEDs(addPart,parts,art,l,pos,s,scale,hw,{...leds,spacing:art.w*LED_PITCH/s.width});if(!placed.length)placed=letterLEDs(addPart,parts,art,l,pos,s,scale,hw,leds);return placed;},
   mount:(l,m)=>{const start=parts.studs.children.length,v=pos(m.point),h=inch*mountScale(m,art,inch);threadedStud(addPart,studMat,v.x,v.y,h,{shaftTop:-depth+.15*h,end:wallZ-backerT-.35*inch,nutTop:-depth+.2*h,nutBottom:-depth,threadTop:-depth,turns:Math.max(4,Math.round((g.back+.35)*20))});groupMount(parts,start);},
   drain:()=>-depth+.25*inch});
  // Lit acrylic returns: frosted white by day; when lit they glow in the LED colour (emissive × intensity × SIDE_GLOW) and reflect
  // only 25% of the room light, as face-lit's face does, so the LED colour carries them instead of washing out to white.
  const litColour=new THREE.Color(.25,.25,.25),unlitColour=new THREE.Color('#f2f1ec');
  const returnMat=new THREE.MeshPhysicalMaterial({color:isLit?litColour:unlitColour,emissive:ledColour(s),emissiveIntensity:isLit?s.intensity*glowFactor:0,roughness:.55,metalness:0,clearcoat:.4,clearcoatRoughness:.2});Object.assign(returnMat.userData,{glowFactor,litColour,unlitColour});
  returnsShell(-depth,-acrylicT,()=>returnMat);
  // Vinyl face in the artwork colours (solid letters take their own colour, patterned ones keep the artwork), and the sealed back.
  const vinyl=litFace?null:finishMaterial({...s,finish:'artwork',sheen:'satin'},art.texture,renderer),faceMat=litFace?acrylicFaceMaterial(art,s,isLit,modules,LED_PITCH):null,backMat=new THREE.MeshStandardMaterial({color:'#8b9196',metalness:.6,roughness:.5});
  shapes().forEach((shape,index)=>{const face=new THREE.Mesh(uv(new THREE.ExtrudeGeometry(shape,{depth:acrylicT,bevelEnabled:false})),[litFace?faceMat:artworkMaterial(vinyl,index,true,'artwork',art.colors),returnMat]);face.position.z=-acrylicT;face.userData.artIndex=index;addPart('face',face);const back=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:backT,bevelEnabled:false}),backMat);back.position.z=wallZ;addPart('back',back);});}

 // Face & halo-lit: face-lit's front (lit acrylic face in a welded trim cap the colour of the returns) on halo-lit's back (acrylic
 // back, standoff studs with clamps, halo on the wall). Front-facing LEDs on the acrylic back light both ways. The back's thickness
 // is not called out on the drawing: 3/16″ ASSUMED (acrylicT, as the face).
 function faceHaloCan(){const hw=mats(),{studMat}=hw;
  const modules=hardware({
   leds:(l,scale)=>{const leds={z:-depth+.06*inch,lens:1,wireZ:-depth+.03*inch};let placed=letterLEDs(addPart,parts,art,l,pos,s,scale,hw,{...leds,spacing:art.w*LED_PITCH/s.width});if(!placed.length)placed=letterLEDs(addPart,parts,art,l,pos,s,scale,hw,leds);return placed;},
   mount:(l,m)=>spacerMount(l,m,studMat),
   drain:()=>-depth+.25*inch});
  const returnBase=finishMaterial({...s,finish:s.returns,sheen:'satin'},art.texture,renderer);
  returnsShell(-depth,-acrylicT,index=>artworkMaterial(returnBase,index,false,s.returns,art.colors),(index,c)=>{const tm=artworkMaterial(returnBase,index,false,s.returns,art.colors);for(const r of offsetRegions(c,trimT,C)){const rc=[r.points,...r.holes];slab(clippedReturnRings(rc,trimT,C),-band,0,tm,'trim',index);slab(clippedReturnRings(rc,trimT+lip,C),0,trimT,tm,'trim',index);}});
  const faceMat=acrylicFaceMaterial(art,s,isLit,modules,LED_PITCH);
  shapes().forEach((shape,index)=>{const face=new THREE.Mesh(uv(new THREE.ExtrudeGeometry(shape,{depth:acrylicT,bevelEnabled:false})),[faceMat,artworkMaterial(returnBase,index,false,s.returns,art.colors)]);face.position.z=-acrylicT;addPart('face',face);});
  acrylicBack();}

 // L-clamp at the letter edge nearest a mount: bracket on the acrylic back, one screw into the return, one into the acrylic.
 function addBackClamp(letter,mount,unit,material){const boundary=letter.points.reduce((a,b)=>Math.hypot(a[0]-mount.point[0],a[1]-mount.point[1])<Math.hypot(b[0]-mount.point[0],b[1]-mount.point[1])?a:b),edge=pos(boundary),center=pos(mount.point),inward=center.clone().sub(edge).normalize(),angle=Math.atan2(inward.y,inward.x),u=unit*.65;const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(.35*u,0);shape.lineTo(.35*u,.045*u);shape.lineTo(.045*u,.045*u);shape.lineTo(.045*u,.32*u);shape.lineTo(0,.32*u);shape.closePath();const geometry=new THREE.ExtrudeGeometry(shape,{depth:.3*u,bevelEnabled:true,bevelThickness:.004*u,bevelSize:.004*u,bevelSegments:2});geometry.translate(0,0,-.15*u);geometry.rotateX(Math.PI/2);geometry.rotateZ(angle);const bracket=new THREE.Mesh(geometry,material);bracket.position.set(edge.x+inward.x*.04*u,edge.y+inward.y*.04*u,-depth);const group=new THREE.Group();group.add(bracket);const screwX=edge.x+inward.x*.23*u,screwY=edge.y+inward.y*.23*u;const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.045*u,.045*u,.23*u,24),material);shaft.rotation.x=Math.PI/2;shaft.position.set(screwX,screwY,-depth-.08*u);group.add(shaft);const head=new THREE.Mesh(new THREE.SphereGeometry(.075*u,24,12),material);head.scale.z=.4;head.position.set(screwX,screwY,-depth+.06*u);group.add(head);const slot=new THREE.Mesh(new THREE.BoxGeometry(.085*u,.014*u,.01*u),new THREE.MeshStandardMaterial({color:'#454b4f',roughness:.7}));slot.position.set(screwX,screwY,-depth+.092*u);group.add(slot);const sideScrew=new THREE.Mesh(new THREE.CylinderGeometry(.038*u,.038*u,.11*u,24),material);sideScrew.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(inward.x,inward.y,0));sideScrew.position.set(edge.x+inward.x*.035*u,edge.y+inward.y*.035*u,-depth+.21*u);group.add(sideScrew);const sideHead=new THREE.Mesh(new THREE.SphereGeometry(.065*u,24,12),material);sideHead.scale.z=.4;sideHead.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(inward.x,inward.y,0));sideHead.position.set(edge.x+inward.x*.105*u,edge.y+inward.y*.105*u,-depth+.21*u);group.add(sideHead);const sideSlot=new THREE.Mesh(new THREE.BoxGeometry(.075*u,.012*u,.008*u),slot.material);sideSlot.quaternion.copy(sideHead.quaternion);sideSlot.position.copy(sideHead.position).addScaledVector(new THREE.Vector3(inward.x,inward.y,0),.027*u);group.add(sideSlot);group.userData.clampAssembly=true;group.userData.screwCount=2;addPart('clamps',group);}
}

// Light planes (core/glow.mjs), chosen by `emit`.
// emit back: halo = the mask blurred (core σ 0.4″ + gap, wide σ 1″ + 2.5 × gap) in the LED colour, just in front of the wall.
export function haloGlow(art,s,isLit,wallZ,height,factor=1.15){const inch=4/s.width;return glowPlane(art.glowSource,height,{core:inch*(.4+s.gap),wide:inch*(1+2.5*s.gap),tint:ledColour(s),opacity:isLit?s.intensity*factor:0,opacityFactor:factor,z:wallZ+(mountOf(s)&&mountOf(s).kind!=='raceway'?mountDepth(s)*inch:0)+.008});} // on a backer's or cabinet's front; a raceway leaves it on the wall, partly hidden
// emit side: the light the lit returns throw on the wall (or backer / cabinet) around each letter: the mask blurred tight, in the
// LED colour, just in front of the wall. Only the part outside the letters shows.
export function sideGlow(art,s,isLit,wallZ,height,factor=SPILL){const inch=4/s.width;return glowPlane(art.glowSource,height,{core:SPILL_CORE*inch,wide:SPILL_WIDE*inch,tint:ledColour(s),opacity:isLit?s.intensity*factor:0,opacityFactor:factor,z:wallZ+(mountOf(s)&&mountOf(s).kind!=='raceway'?mountDepth(s)*inch:0)+.008});}
// emit front + back (face & halo-lit): both planes, the halo on the wall and the face glow in front. Its intensity opens at 50%
// (for the face), so the halo is 1.5× halo-lit's: at 50% it matches halo-lit's halo at its 75%.
export const faceHaloGlow=(art,s,isLit,wallZ,height)=>[haloGlow(art,s,isLit,wallZ,height,1.15*1.5),faceGlow(art,s,isLit,wallZ,height)];
// emit front + side (face & side-lit): the spill on the wall (1.5×, see FACE_SIDE) and the face glow in front.
export const faceSideGlow=(art,s,isLit,wallZ,height)=>[sideGlow(art,s,isLit,wallZ,height,SPILL*FACE_SIDE),faceGlow(art,s,isLit,wallZ,height)];
// emit front: face glow = the lit face colours, blurred, on an additive plane just in front of the face. It reads as light
// spilling past the trim, like bloom in a photo of a lit sign. Front only: nothing is added behind the letters.
export const faceGlow=(art,s,isLit,wallZ,height)=>faceGlowPlane(art,s,isLit,height,(TRIM+.05)*(4/s.width));

// Registry ids (app/registry.mjs) this construction builds → the sign to open and, per studio tier, the trims offered.
// Face-lit Standard = plastic trim cap; Premium = metallic trim or trimless (pricing names: "Plastic Trim" / "Metallic Trim").
const STANDARD_TRIMS=['artwork','black','white'],PREMIUM_TRIMS=['silver','gold','bronze','none'];
// Fabricated non-lit: one finish per studio variant; "Painted (same as logo)" also offers the other paints. Antique bronze (the
// registry's ninth finish) has no variant row of its own: it is in the Finish list for every metal sign.
const PAINTS=['artwork','black','white','custom'];
export const VARIANTS={
 'illuminated-dimensional-letters-halo-lit-back-lit':{sign:'halo-lit'},
 'illuminated-channel-letters-halo-lit-back-lit':{sign:'halo-lit'},
 'illuminated-dimensional-letters-face-lit-standard-channel-letter':{sign:'face-lit',options:{trim:STANDARD_TRIMS}},
 'illuminated-channel-letters-face-lit-standard-channel-letter':{sign:'face-lit',options:{trim:STANDARD_TRIMS}},
 'illuminated-dimensional-letters-face-lit-premium-channel-letters':{sign:'face-lit',options:{trim:PREMIUM_TRIMS}},
 'illuminated-channel-letters-face-lit-premium-channel-letters':{sign:'face-lit',options:{trim:PREMIUM_TRIMS}},
 'illuminated-dimensional-letters-side-lit':{sign:'side-lit'},
 'illuminated-dimensional-letters-face-halo-lit':{sign:'face-halo-lit'},
 'illuminated-channel-letters-face-halo-lit':{sign:'face-halo-lit'},
 'illuminated-dimensional-letters-face-side-lit':{sign:'face-side-lit'},
 'illuminated-channel-letters-face-side-lit':{sign:'face-side-lit'},
 'illuminated-channel-letters-side-lit':{sign:'side-lit'},
 'dimensional-fabricated-letters-painted-finish-same-as-logo':{sign:'fabricated-nonlit',options:{finish:PAINTS}},
 'dimensional-fabricated-letters-polished-gold':{sign:'fabricated-nonlit',options:{finish:['gold-mirror']}},
 'dimensional-fabricated-letters-brushed-gold':{sign:'fabricated-nonlit',options:{finish:['gold-brushed']}},
 'dimensional-fabricated-letters-polished-bronze':{sign:'fabricated-nonlit',options:{finish:['bronze-mirror']}},
 'dimensional-fabricated-letters-brushed-bronze':{sign:'fabricated-nonlit',options:{finish:['bronze-brushed']}},
 'dimensional-fabricated-letters-polished-silver-mirror':{sign:'fabricated-nonlit',options:{finish:['silver-mirror']}},
 'dimensional-fabricated-letters-brushed-silver':{sign:'fabricated-nonlit',options:{finish:['silver-brushed']}},
};
// Depth (inches: min, max, std) each sign is sold at, from the registry rows that open it (all its rows agree; tested).
const depthOf=id=>{const {min,max,std}=REGISTRY.find(r=>VARIANTS[r.id]?.sign===id).depth;return {min,max,std};};
// Inspector text for one PARTS entry: '0.0630″ aluminum'. Call-outs use ", the studio shows ″.
const spec=part=>((part.thickness?part.thickness+' ':'')+part.material).replace(/"/g,'″'),FACE_LIT=PARTS['face-lit'],FABRICATED=PARTS['fabricated-nonlit'],SIDE_LIT=PARTS['side-lit'],FACE_HALO=PARTS['face-halo-lit'],FACE_SIDE_LIT=PARTS['face-side-lit'];
// Mountings every channel-letter sign offers, and the mounting part's explorer button, inspector text and exploded offset.
const MOUNTINGS=['flush','raceway-2','backer-acm-4','backer-acrylic-8','backer-aluminum-25','backboard-cabinet-2'];
const withMount=(s,list)=>{const m=mountOf(s);return m?[...list,[m.kind,'#d8d6cc',m.kind==='raceway'?'2″ raceway':m.kind==='cabinet'?'2″ backboard cabinet':m.material+' backer']]:list;},exploded=(s,offsets)=>mountOf(s)?{...offsets,[mountOf(s).kind]:-1.05}:offsets;
const RACEWAY_INFO=['Raceway','2″ deep 0.1019″ aluminium box on the wall; the letters are bolted to its front and the power supply sits inside it. Height (5″), length (2″ in from each end of the sign), one centred raceway and colour are assumed until the shop confirms them; the top lip on the drawings is not drawn.'];
const CABINET_INFO=['Backboard cabinet','2″ deep 0.079″ aluminium box on the wall behind the letters; the letters are stud-mounted to its front and the power supply sits inside it. Rectangle with a 3″ margin, square corners and colour are assumed until the shop confirms them.'];
const BACKER_INFO=['Backer panel','Flat panel on the wall behind the letters: 4 mm ACM, 8 mm acrylic or 2.5 mm aluminium, as chosen. The letters are stud-mounted through it; the power supply stays behind the wall. Rectangle with a 3″ margin, square corners and colour are assumed until the shop confirms them.'];
// Sign-type interface read by app.js, one per built construction (the studio's Sign type control).
export const signs={
 'halo-lit':{id:'halo-lit',label:'Halo-lit',config:CONFIGS['halo-lit'],construction:'channel-letter',mountings:MOUNTINGS,mount:mountOf,standardDepth:depthOf('halo-lit').std,depthRange:depthOf('halo-lit'),defaultIntensity:75,
  build:(art,s,isLit,renderer)=>buildChannelLetter(art,s,isLit,renderer,CONFIGS['halo-lit']),glow:haloGlow,
  // Wall sits behind the acrylic back, across the wall gap (and behind the backer, when there is one).
  wallDepth:s=>(s.depth+gauges('halo-lit').acrylic+mountDepth(s))*(4/s.width),wallGap:s=>s.gap*(4/s.width),
  explodedOffsets:s=>exploded(s,{face:.9,returns:.2,leds:.6,acrylic:-.55,studs:-.7,wires:.4,drain:.2,clamps:-.35}),
  componentInfo:{
   face:['Metal face','Opaque SS / aluminium face. Its finish follows the artwork or selected metallic finish.'],
   returns:['Metal returns','Smooth metal sidewalls · '+ '1″ standard depth, with an editable custom depth.'],
   leds:['LED module','Rear-facing module with three lenses. Module positions and automatically fitted dimensions are illustrative.'],
   acrylic:['Acrylic back','3/16″ acrylic back, cut to the artwork contours. Clear, frosted and opal options respond to the selected LED colour and intensity.'],
   studs:['Stud + rivnut','Hollow rear spacer with a threaded mounting stud through its bore, plus the rivnut connection. 3–4 uniformly spread mounts per letter; hardware is visually fitted to stroke width. Fabrication dimensions require confirmation.'],
   clamps:['L brackets + screws','At least three small L brackets per letter. Each bracket has two screws: one through the metal return and one through the acrylic back. Positions and sizes are illustrative.'],
   wires:['18 AWG wiring','Illustrative red / white wiring between LED modules inside the letters.'],
   drain:['Drain position','Illustrative bottom drain marker. Final hole position follows fabrication details.'],backer:BACKER_INFO,raceway:RACEWAY_INFO,cabinet:CABINET_INFO},
  parts:s=>withMount(s,[['face','#ad9270','Metal face'],['returns','#8d959e','Metal returns'],['leds','#f5d791','LED modules'],['acrylic','#a8d7e6','3/16″ acrylic back'],['studs','#747c88','Spacers + threaded studs'],['clamps','#9aa4aa','L brackets + screws'],['wires','#bd655c','18 AWG wiring'],['drain','#272b31','Drain position']]),
  finishParts:['face','returns'],internalHidden:['face'],assembledHidden:['clamps'],singleParts:['leds','studs','drain','clamps'],
  hints:{assembled:'Opaque metal face and returns. Light exits through the acrylic back and reflects from the wall.',exploded:'Separated layers reveal your metal shell, rear-facing LEDs, acrylic back and wall mounting.',internal:'Face removed to inspect the LEDs and wiring. The LEDs point towards the acrylic back.'},
  specs:(s,led)=>s.depth+'″ depth · 3/16″ acrylic · '+led},
 'face-lit':{id:'face-lit',label:'Face-lit',config:CONFIGS['face-lit'],construction:'channel-letter',mountings:MOUNTINGS,mount:mountOf,standardDepth:depthOf('face-lit').std,depthRange:depthOf('face-lit'),defaultIntensity:40,
  build:(art,s,isLit,renderer)=>buildChannelLetter(art,s,isLit,renderer,CONFIGS['face-lit']),glow:faceGlow,
  // Flush: the wall (or the backer) touches the sealed back.
  wallDepth:s=>(s.depth+gauges('face-lit').back+mountDepth(s))*(4/s.width),wallGap:()=>0,
  // Front to back: trim, face, LEDs, wires, returns, back, studs. LEDs and wiring sit on the back, so they move forward by the can depth.
  explodedOffsets:s=>{const d=s.depth*4/s.width;return exploded(s,{trim:1.05,face:.7,leds:d+.3,wires:d+.25,returns:0,drain:0,back:-.35,studs:-.7});},
  componentInfo:{
   trim:['Trim cap','Plastic or metal bezel wrapping the face edge and holding it in place: 1″ band over the returns, ⅛″ lip over the face (lip and .06″ thickness assumed). Never lit. Trimless removes it.'],
   face:['Acrylic face',spec(FACE_LIT.face)+' face, translucent, cut to the letter. White acrylic with translucent vinyl, or solid-tinted acrylic. Light leaves only through this face; dark artwork stays unlit.'],
   returns:['Returns','Opaque painted '+spec(FACE_LIT.returns)+' sidewalls at the full sign depth ('+depthOf('face-lit').std+'″ standard, '+depthOf('face-lit').min+'–'+depthOf('face-lit').max+'″). Never lit.'],
   leds:['LED module','Front-facing module with three lenses on the sealed back, about 4″ apart. Positions and fitted sizes are illustrative.'],
   wires:['18 AWG wiring','Illustrative red / white wiring between LED modules inside the letters.'],
   back:['Sealed back','Solid '+spec(FACE_LIT.back)+' back. With the returns it forms a sealed can: no light reaches the wall.'],
   studs:['Threaded studs','3–4 threaded studs per letter through the back into the wall, nut inside the can. Flush mounting, no wall gap. Sizes are illustrative.'],
   drain:['Weep hole','One drain hole at the lowest point of each letter, for outdoor cans. Position is illustrative.'],backer:BACKER_INFO,raceway:RACEWAY_INFO,cabinet:CABINET_INFO},
  parts:s=>withMount(s,[['trim','#1d1f21','Trim cap'],['face','#f1ede2',spec(FACE_LIT.face)+' face'],['returns','#8d959e','Returns'],['leds','#f5d791','LED modules'],['wires','#bd655c','18 AWG wiring'],['back','#6d747b','Sealed back'],['studs','#747c88','Threaded studs'],['drain','#272b31','Weep holes']]),
  finishParts:[],internalHidden:['trim','face'],assembledHidden:[],singleParts:['leds','studs','drain'],
  hints:{assembled:'Translucent acrylic face lit from inside. Returns, trim and back stay dark; nothing glows behind the letters.',exploded:'Separated layers: trim cap, acrylic face, front-facing LEDs and wiring, returns, sealed back and studs.',internal:'Face and trim removed to inspect the LEDs and wiring. The LEDs point at the acrylic face.'},
  specs:(s,led)=>s.depth+'″ depth · '+(s.trim==='none'?'trimless':s.trim+' trim')+' · '+(s.facetype==='tinted'?'tinted':'vinyl')+' face · '+led},
 'fabricated-nonlit':{id:'fabricated-nonlit',label:'Fabricated',config:CONFIGS['fabricated-nonlit'],construction:'channel-letter',mountings:MOUNTINGS,mount:mountOf,lit:false,standardDepth:depthOf('fabricated-nonlit').std,depthRange:depthOf('fabricated-nonlit'),defaultIntensity:75,
  build:(art,s,isLit,renderer)=>buildChannelLetter(art,s,isLit,renderer,CONFIGS['fabricated-nonlit']),glow:null,
  // Flush: the returns sit on the wall (or on the backer).
  wallDepth:s=>(s.depth+mountDepth(s))*(4/s.width),wallGap:()=>0,
  explodedOffsets:s=>exploded(s,{face:.9,returns:0,studs:-.7}),
  componentInfo:{
   face:['Metal face',spec(FABRICATED.face)+' face cut to the letter. Takes the selected finish: polished or brushed metal, or paint.'],
   returns:['Returns',spec(FABRICATED.returns)+' sidewalls at the full sign depth ('+depthOf('fabricated-nonlit').std+'″ standard, '+depthOf('fabricated-nonlit').min+'–'+depthOf('fabricated-nonlit').max+'″), same finish as the face. They sit on the wall: the back is open.'],
   studs:['Threaded studs','3–4 ¼″Ø threaded studs per letter, welded to the back of the face and set into the wall. Sizes are illustrative.'],backer:BACKER_INFO,raceway:RACEWAY_INFO,cabinet:CABINET_INFO},
  parts:s=>withMount(s,[['face','#ad9270',spec(FABRICATED.face)+' face'],['returns','#8d959e',spec(FABRICATED.returns)+' returns'],['studs','#747c88','Threaded studs']]),
  finishParts:['face','returns'],internalHidden:['face'],assembledHidden:[],singleParts:['studs'],
  hints:{assembled:'Metal face and returns, flush on the wall. Not illuminated: no LEDs, no back panel.',exploded:'Separated: metal face, returns and the threaded studs welded to the back of the face.',internal:'Face removed: the can is open at the back, and the studs run straight into the wall.'},
  specs:s=>s.depth+'″ depth · '+spec(FABRICATED.face)+' face · not illuminated'},
 'side-lit':{id:'side-lit',label:'Side-lit',config:CONFIGS['side-lit'],construction:'channel-letter',mountings:MOUNTINGS,mount:mountOf,standardDepth:depthOf('side-lit').std,depthRange:depthOf('side-lit'),defaultIntensity:75,
  build:(art,s,isLit,renderer)=>buildChannelLetter(art,s,isLit,renderer,CONFIGS['side-lit']),glow:sideGlow,
  // Flush: the wall (or the mounting part) touches the sealed back.
  wallDepth:s=>(s.depth+gauges('side-lit').back+mountDepth(s))*(4/s.width),wallGap:()=>0,
  explodedOffsets:s=>{const d=s.depth*4/s.width;return exploded(s,{face:.7,leds:d+.3,wires:d+.25,returns:0,drain:0,back:-.35,studs:-.7});},
  componentInfo:{
   face:['Vinyl face','3/16″ acrylic face under opaque vinyl in the artwork colours: the same acrylic part as face-lit, made opaque. Never lit.'],
   returns:['Lit acrylic returns',spec(SIDE_LIT.returns)+' returns, frosted white by day. The LEDs light them from inside: the light leaves through the sides.'],
   leds:['LED module','Front-facing module with three lenses on the sealed back, about 4″ apart. Positions and fitted sizes are illustrative.'],
   wires:['18 AWG wiring','Illustrative red / white wiring between LED modules inside the letters.'],
   back:['Sealed back','Solid '+spec(SIDE_LIT.back)+' back, screwed to the returns.'],
   studs:['Threaded studs','3–4 threaded studs per letter through the back into the wall, nut inside the can. Sizes are illustrative.'],
   drain:['Weep hole','One drain hole at the lowest point of each letter, for outdoor cans. Position is illustrative.'],backer:BACKER_INFO,raceway:RACEWAY_INFO,cabinet:CABINET_INFO},
  parts:s=>withMount(s,[['face','#ad9270','Vinyl face'],['returns','#e8f2f4','Lit acrylic returns'],['leds','#f5d791','LED modules'],['wires','#bd655c','18 AWG wiring'],['back','#6d747b','Sealed back'],['studs','#747c88','Threaded studs'],['drain','#272b31','Weep holes']]),
  finishParts:[],internalHidden:['face'],assembledHidden:[],singleParts:['leds','studs','drain'],
  hints:{assembled:'Opaque vinyl face. The acrylic returns glow: light leaves through the sides and washes the wall around each letter.',exploded:'Separated layers: vinyl face, front-facing LEDs and wiring, acrylic returns, sealed back and studs.',internal:'Face removed to inspect the LEDs and wiring. The LEDs light the acrylic returns from inside.'},
  specs:(s,led)=>s.depth+'″ depth · lit acrylic returns · '+led},
 'face-halo-lit':{id:'face-halo-lit',label:'Face & halo-lit',config:CONFIGS['face-halo-lit'],construction:'channel-letter',mountings:MOUNTINGS,mount:mountOf,standardDepth:depthOf('face-halo-lit').std,depthRange:depthOf('face-halo-lit'),defaultIntensity:50,
  build:(art,s,isLit,renderer)=>buildChannelLetter(art,s,isLit,renderer,CONFIGS['face-halo-lit']),glow:faceHaloGlow,
  // Wall behind the acrylic back, across the standoff gap (and behind the mounting part, when there is one).
  wallDepth:s=>(s.depth+gauges('face-halo-lit').acrylic+mountDepth(s))*(4/s.width),wallGap:s=>s.gap*(4/s.width),
  explodedOffsets:s=>{const d=s.depth*4/s.width;return exploded(s,{trim:1.05,face:.7,leds:d+.3,wires:d+.25,returns:0,drain:0,acrylic:-.45,clamps:-.3,studs:-.75});},
  componentInfo:{
   trim:['Welded trim cap','Aluminium lip welded to the returns, holding the face: the colour of the returns. 1″ band and ⅛″ lip as face-lit (assumed).'],
   face:['Acrylic face',spec(FACE_HALO.face)+' face, translucent, cut to the letter. White acrylic with translucent vinyl, or solid-tinted acrylic. Lit from inside.'],
   returns:['Returns','Opaque painted '+spec(FACE_HALO.returns)+' sidewalls at the full sign depth ('+depthOf('face-halo-lit').std+'″ standard, '+depthOf('face-halo-lit').min+'–'+depthOf('face-halo-lit').max+'″). Never lit.'],
   leds:['LED module','Module with three lenses on the acrylic back, facing the face; light leaves through the face and through the back. Positions are illustrative.'],
   wires:['18 AWG wiring','Illustrative red / white wiring between LED modules inside the letters.'],
   acrylic:['Acrylic back','Acrylic back cut to the letter (thickness not on the drawing: 3/16″ assumed). Clear, frosted or opal; it lights the halo on the wall.'],
   studs:['Standoff studs','Hollow spacer across the wall gap with a ¼″Ø threaded stud through it, 3–4 per letter. Sizes are illustrative.'],
   clamps:['L brackets + screws','Brackets holding the acrylic back to the returns, two screws each. Positions are illustrative.'],
   drain:['Weep hole','One drain hole at the lowest point of each letter, for outdoor cans. Position is illustrative.'],backer:BACKER_INFO,raceway:RACEWAY_INFO,cabinet:CABINET_INFO},
  parts:s=>withMount(s,[['trim','#8d959e','Welded trim cap'],['face','#f1ede2',spec(FACE_HALO.face)+' face'],['returns','#8d959e','Returns'],['leds','#f5d791','LED modules'],['wires','#bd655c','18 AWG wiring'],['acrylic','#a8d7e6','Acrylic back'],['studs','#747c88','Standoff studs'],['clamps','#9aa4aa','L brackets + screws'],['drain','#272b31','Weep holes']]),
  finishParts:[],internalHidden:['trim','face'],assembledHidden:['clamps'],singleParts:['leds','studs','drain','clamps'],
  hints:{assembled:'Lit acrylic face at the front and a halo on the wall behind: the LEDs light both ways.',exploded:'Separated layers: welded trim, acrylic face, LEDs and wiring, returns, acrylic back, clamps and standoff studs.',internal:'Face and trim removed to inspect the LEDs and wiring on the acrylic back.'},
  specs:(s,led)=>s.depth+'″ depth · '+(s.facetype==='tinted'?'tinted':'vinyl')+' face + halo · '+s.gap+'″ gap · '+led},
 'face-side-lit':{id:'face-side-lit',label:'Face & side-lit',config:CONFIGS['face-side-lit'],construction:'channel-letter',mountings:MOUNTINGS,mount:mountOf,standardDepth:depthOf('face-side-lit').std,depthRange:depthOf('face-side-lit'),defaultIntensity:50,
  build:(art,s,isLit,renderer)=>buildChannelLetter(art,s,isLit,renderer,CONFIGS['face-side-lit']),glow:faceSideGlow,
  // Flush: the wall (or the mounting part) touches the sealed back.
  wallDepth:s=>(s.depth+gauges('face-side-lit').back+mountDepth(s))*(4/s.width),wallGap:()=>0,
  explodedOffsets:s=>{const d=s.depth*4/s.width;return exploded(s,{face:.7,leds:d+.3,wires:d+.25,returns:0,drain:0,back:-.35,studs:-.7});},
  componentInfo:{
   face:['Acrylic face',spec(FACE_SIDE_LIT.face)+' face, translucent, cut to the letter. White acrylic with translucent vinyl, or solid-tinted acrylic. Lit from inside.'],
   returns:['Lit acrylic returns',spec(FACE_SIDE_LIT.returns)+' returns, frosted white by day. The LEDs light them from inside: light leaves through the face and the sides.'],
   leds:['LED module','Front-facing module with three lenses on the sealed back, about 4″ apart. Positions and fitted sizes are illustrative.'],
   wires:['18 AWG wiring','Illustrative red / white wiring between LED modules inside the letters.'],
   back:['Sealed back','Solid '+spec(FACE_SIDE_LIT.back)+' back, screwed to the returns.'],
   studs:['Threaded studs','3–4 threaded studs per letter through the back into the wall, nut inside the can. Sizes are illustrative.'],
   drain:['Weep hole','One drain hole at the lowest point of each letter, for outdoor cans. Position is illustrative.'],backer:BACKER_INFO,raceway:RACEWAY_INFO,cabinet:CABINET_INFO},
  parts:s=>withMount(s,[['face','#f1ede2',spec(FACE_SIDE_LIT.face)+' face'],['returns','#e8f2f4','Lit acrylic returns'],['leds','#f5d791','LED modules'],['wires','#bd655c','18 AWG wiring'],['back','#6d747b','Sealed back'],['studs','#747c88','Threaded studs'],['drain','#272b31','Weep holes']]),
  finishParts:[],internalHidden:['face'],assembledHidden:[],singleParts:['leds','studs','drain'],
  hints:{assembled:'Lit acrylic face and glowing acrylic returns: light leaves through the front and the sides, washing the wall around each letter.',exploded:'Separated layers: acrylic face, front-facing LEDs and wiring, acrylic returns, sealed back and studs.',internal:'Face removed to inspect the LEDs and wiring. The LEDs light the face and the returns.'},
  specs:(s,led)=>s.depth+'″ depth · '+(s.facetype==='tinted'?'tinted':'vinyl')+' face + lit returns · '+led}
};
