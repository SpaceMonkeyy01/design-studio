import * as THREE from 'three';
import {toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';
import {clippedReturnRings,offsetRegions} from '../../core/artwork.mjs?v=11';
import {mountingPoints} from '../../core/routing.mjs?v=10';
import {finishMaterial,artworkMaterial,ledColour} from '../../core/materials.mjs?v=11';
import {artSpace,flatCaps} from '../../core/shapes.mjs?v=1';
import {glowPlane} from '../../core/glow.mjs?v=1';
import {builtMounting} from '../../core/mounting.mjs?v=2';
import {partSet,hardwareMaterials,isTinyPiece,letterScale,mountScale,letterLEDs,threadedStud,groupMount,drainMarker} from '../../core/hardware.mjs?v=1';
// Channel letters: a traced can (face + returns + back). One parametric build for every channel-letter variant;
// the variant is a construction config, not code. See CLAUDE.md in this folder.
//   face    opaque | acrylic | none | half-mirror
//   returns opaque | translucent
//   back    opaque | acrylic | mirror
//   emit    subset of front, back, side
// Built today: halo-lit {opaque, opaque, acrylic, [back]} and face-lit {acrylic, opaque, opaque, [front]}.
export const CONFIGS={
 'halo-lit':{face:'opaque',returns:'opaque',back:'acrylic',emit:['back']},
 'face-lit':{face:'acrylic',returns:'opaque',back:'opaque',emit:['front']},
};
const key=c=>[c.face,c.returns,c.back,[...c.emit].sort().join('+')].join('/'),BUILT=new Map(Object.entries(CONFIGS).map(([id,c])=>[key(c),id]));
// The construction a config describes. Other switch combinations (side-lit, face & halo, infinity mirror…) are not built yet.
function construction(cfg){const id=BUILT.get(key(cfg));if(!id)throw new Error('Channel-letter construction not built yet: '+key(cfg));return id;}

// Inches. ASSUMED values are listed in CLAUDE.md: acrylic thickness, sealed back, return wall, trim thickness and lip.
const ACRYLIC=.1875,BACK=.063,RETURN=.04,TRIM=.06,TRIM_BAND=1,LIP=.125,LED_PITCH=4;
// Lit acrylic face: emissive per unit of intensity (tuned on screenshots: face brighter than the wall, hue not washed to white).
const FACE_GLOW=2.4;
// Face glow plane in front of a lit face: blur sigmas (inches) and strength.
const GLOW_CORE=.35,GLOW_WIDE=1.4,GLOW=.8;
const TRIM_FINISH={black:'black',white:'white',artwork:'artwork',silver:'silver-brushed',gold:'gold-brushed',bronze:'bronze-brushed'};

// The colour a lit acrylic face shows, painted in mask pixels: vinyl artwork, one tint per letter, or white for an all-black logo.
// Near-black artwork stays dark; an all-black logo lights white instead (black by day, white at night).
function faceColour(art,s){const dark=c=>!c?.colour?.isColor||.2126*c.colour.r+.7152*c.colour.g+.0722*c.colour.b<.012,allDark=art.colors.every(dark);
 const hex=i=>{const c=art.colors[i]?.colour;return c?.isColor?'#'+c.getHexString(THREE.SRGBColorSpace):'#a6a6a6';};
 const tint=x=>art.loops.forEach((l,i)=>{x.fillStyle=hex(i);x.beginPath();for(const loop of [l.points,...l.holes]){loop.forEach((p,k)=>k?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();}x.fill('evenodd');});
 const paint=x=>{if(allDark){x.fillStyle='#ffffff';x.fillRect(0,0,art.w,art.h);}else if(s.facetype==='tinted')tint(x);else x.drawImage(art.texture.image,0,0,art.w,art.h);};
 return {tint,paint};}
// Lit acrylic face material: the face colour shines through, brighter over each LED module.
function acrylicFaceMaterial(art,s,isLit,modules){const w=art.w,h=art.h,{tint,paint}=faceColour(art,s),pitch=w*LED_PITCH/s.width;
 const texture=draw=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'));const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;};
 // Black outside the letters, so face edges sampling past the outline darken slightly instead of picking up the falloff grey.
 const glow=texture(x=>{x.fillStyle='#000000';x.fillRect(0,0,w,h);paint(x);
  // LED falloff, sRGB: 196 between modules (≈55% linear) up to 255 over each module.
  const f=document.createElement('canvas');f.width=w;f.height=h;const fx=f.getContext('2d');fx.fillStyle='rgb(196,196,196)';fx.fillRect(0,0,w,h);fx.globalCompositeOperation='lighter';for(const p of modules){const g=fx.createRadialGradient(p[0],p[1],0,p[0],p[1],pitch*.8);g.addColorStop(0,'rgba(59,59,59,1)');g.addColorStop(1,'rgba(59,59,59,0)');fx.fillStyle=g;fx.fillRect(p[0]-pitch,p[1]-pitch,pitch*2,pitch*2);}
  x.globalCompositeOperation='multiply';x.drawImage(f,0,0);});
 // When lit, the face reflects little room light (25%) so the glow carries the colour instead of washing it out.
 const litColour=new THREE.Color(.25,.25,.25),unlitColour=new THREE.Color(1,1,1);
 const mat=new THREE.MeshPhysicalMaterial({color:isLit?litColour:unlitColour,map:s.facetype==='tinted'?texture(tint):art.texture,roughness:.32,metalness:0,clearcoat:.5,clearcoatRoughness:.18,emissive:ledColour(s),emissiveMap:glow,emissiveIntensity:isLit?s.intensity*FACE_GLOW:0});
 Object.assign(mat.userData,{glowFactor:FACE_GLOW,litColour,unlitColour});return mat;}

// Builds one sign for a traced artwork, settings snapshot and construction config. Returns {root, parts}, one group per part.
// Pieces are created in each construction's original order: material ids decide the draw order of coplanar surfaces,
// so reordering would move pixels.
export function buildChannelLetter(art,s,isLit,renderer,cfg){const kind=construction(cfg),rearLit=cfg.back==='acrylic';builtMounting('channel-letter',s.mounting||'flush');
 const {root,parts,addPart}=partSet(rearLit?['face','returns','acrylic','leds','studs','wires','drain','clamps']:['trim','face','returns','leds','wires','back','studs','drain']);
 const {pos,shapes,uv,contours}=artSpace(art),C=window.ClipperLib;
 const inch=4/s.width,depth=s.depth*inch,gap=rearLit?s.gap*inch:0,acrylicT=ACRYLIC*inch,backT=BACK*inch,trimT=TRIM*inch,band=Math.min(TRIM_BAND,s.depth*.5)*inch,lip=LIP*inch;
 // Extrude Clipper regions [{points, holes}] from z0 to z1 with artwork-space UVs. material: one material, or a function called per region.
 // Rings of tiny pieces can collapse to <3 points: skip them.
 const slab=(regions,z0,z1,material,part,index)=>{for(const r of regions){if(r.points.length<3)continue;const shape=new THREE.Shape(r.points.map(p=>new THREE.Vector2(...p)));shape.holes=r.holes.filter(h=>h.length>=3).map(h=>new THREE.Path(h.map(p=>new THREE.Vector2(...p))));const raw=new THREE.ExtrudeGeometry(shape,{depth:z1-z0,bevelEnabled:false,steps:1});raw.translate(0,0,z0);raw.scale(100,100,100);const g=toCreasedNormals(raw,.8);g.scale(.01,.01,.01);uv(g);const m=new THREE.Mesh(g,typeof material==='function'?material():material);m.userData.artIndex=index;m.userData.faceSurface=false;addPart(part,m);}};
 // Returns: opaque metal sidewalls from z0 to z1. Wall = min(.040″, 22% of the widest mount clearance). Boolean offsetting
 // keeps shells continuous around acute corners and narrow strokes. after(index, contours) adds per-letter pieces (trim).
 const returnsShell=(z0,z1,material,after)=>{for(let index=0;index<art.loops.length;index++){const letter=art.loops[index],c=contours(letter),mounts=mountingPoints(letter,art.dist,art.w,art.h,s.mountcount,art.labels),clearance=mounts.reduce((n,m)=>Math.max(n,m.clearance*4/art.w),.001);slab(clippedReturnRings(c,Math.min(RETURN*inch,clearance*.22),C),z0,z1,material(index),'returns',index);after?.(index,c);}};
 // Hardware per meaningful letter: LED modules + wiring, mounts, drain / weep hole (drain returns its z, or null for none).
 // Returns all module positions (mask px).
 const hardware=({leds,mount,drain})=>{const modules=[];for(const l of art.loops){if(isTinyPiece(l,art))continue;const mounts=mountingPoints(l,art.dist,art.w,art.h,s.mountcount,art.labels),scale=letterScale(mounts,art,inch);const placed=leds(l,scale);modules.push(...placed);for(const m of mounts)mount(l,m);const z=drain(placed);if(z!==null)drainMarker(addPart,l,pos,inch,z);}return modules;};
 const mats=hardwareMaterials.bind(null,s,isLit);
 if(kind==='halo-lit')rearLitCan();else faceLitCan();
 return {root,parts};

 // Halo-lit: opaque metal face and returns, rear-facing LEDs, acrylic back, spacer + stud mounts with L-clamps across the wall gap.
 function rearLitCan(){const mat=finishMaterial(s,art.texture,renderer);
  // Metal face: .045″ with a small bevel, takes the selected finish (flat caps so mirror finishes reflect cleanly).
  shapes().forEach((shape,index)=>{const rawFace=new THREE.ExtrudeGeometry(shape,{depth:.045*inch,bevelEnabled:true,bevelThickness:.006*inch,bevelSize:.009*inch,bevelSegments:6,curveSegments:32});rawFace.scale(100,100,100);const face=flatCaps(toCreasedNormals(rawFace,.8));face.scale(.01,.01,.01);uv(face);const surface=new THREE.Mesh(face,artworkMaterial(mat,index,true,s.finish,art.colors));surface.userData.artIndex=index;surface.userData.faceSurface=true;addPart('face',surface);});
  returnsShell(-depth,0,index=>()=>artworkMaterial(mat,index,false,s.finish,art.colors));
  // Acrylic back: emissive in the LED colour; clear, frosted or opal.
  const acrylicOptions={clear:{opacity:.25,roughness:.08,faceGlow:.12,edgeGlow:.65},frosted:{opacity:.62,roughness:.7,faceGlow:.75,edgeGlow:.95},opal:{opacity:.94,roughness:.38,faceGlow:1.15,edgeGlow:1.2}}[s.acrylictype]||{opacity:.25,roughness:.08,faceGlow:.12,edgeGlow:.65};const acrylic=new THREE.MeshPhysicalMaterial({color:s.acrylictype==='clear'?'#e4f0f3':'#f4f4ef',emissive:ledColour(s),emissiveIntensity:isLit?s.intensity*acrylicOptions.faceGlow:0,roughness:acrylicOptions.roughness,metalness:0,transparent:true,opacity:acrylicOptions.opacity,clearcoat:1,clearcoatRoughness:.06,side:THREE.DoubleSide,depthWrite:false});acrylic.userData.glowFactor=acrylicOptions.faceGlow;const acrylicEdge=acrylic.clone();acrylicEdge.opacity=Math.max(.6,acrylicOptions.opacity);acrylicEdge.emissiveIntensity=isLit?s.intensity*acrylicOptions.edgeGlow:0;acrylicEdge.userData.glowFactor=acrylicOptions.edgeGlow;for(const shape of shapes()){const glass=new THREE.Mesh(uv(new THREE.ExtrudeGeometry(shape,{depth:acrylicT,bevelEnabled:true,bevelThickness:.005*inch,bevelSize:.005*inch,bevelSegments:2})),[acrylic,acrylicEdge]);glass.position.z=-depth-acrylicT;addPart('acrylic',glass);}
  const hw=mats(),{studMat}=hw;
  hardware({
   // Rear-facing modules just behind the face; lenses point at the acrylic back.
   leds:(l,scale)=>letterLEDs(addPart,parts,art,l,pos,s,scale,hw,{z:-.06*inch,lens:-1,wireZ:-.06*inch-.11*inch}),
   // Hollow spacer across the wall gap, threaded stud through its bore, rivnut, and an L-clamp with 2 screws.
   mount:(l,mountPoint)=>{const p=mountPoint.point,mountStart=parts.studs.children.length,v=pos(p),hardwareInch=inch*mountScale(mountPoint,art,inch),panelBack=-depth-acrylicT,wallZ=panelBack-gap,studEnd=wallZ-.35*inch;
    const spacerShape=new THREE.Shape();spacerShape.absarc(0,0,.21*hardwareInch,0,Math.PI*2,false);const bore=new THREE.Path();bore.absarc(0,0,.142*hardwareInch,0,Math.PI*2,true);spacerShape.holes.push(bore);const spacer=new THREE.Mesh(new THREE.ExtrudeGeometry(spacerShape,{depth:gap,bevelEnabled:true,bevelSize:.006*hardwareInch,bevelThickness:.006*hardwareInch,bevelSegments:2,curveSegments:32}),studMat);spacer.position.set(v.x,v.y,wallZ);addPart('studs',spacer);
    threadedStud(addPart,studMat,v.x,v.y,hardwareInch,{shaftTop:-depth+.15*hardwareInch,end:studEnd,nutTop:-depth+.25*hardwareInch,nutBottom:-depth-.12*hardwareInch,threadTop:panelBack,turns:Math.max(4,Math.round((s.gap+.35)*20))});groupMount(parts,mountStart);addBackClamp(l,mountPoint,hardwareInch,studMat);},
   // Drain marker only on letters with LEDs.
   drain:placed=>placed.length?-depth/2:null});}

 // Face-lit: trim cap, lit acrylic face, opaque returns, front-facing LEDs on a sealed back, flush threaded studs.
 function faceLitCan(){const wallZ=-depth-backT,hw=mats(),{studMat}=hw;
  // LEDs, wiring, studs and weep holes first: the face glow needs the module positions.
  const modules=hardware({
   // Front-facing modules on the sealed back, ≈4″ pitch; a letter too small for that gets the denser default spacing.
   leds:(l,scale)=>{const leds={z:-depth+.06*inch,lens:1,wireZ:-depth+.03*inch};let placed=letterLEDs(addPart,parts,art,l,pos,s,scale,hw,{...leds,spacing:art.w*LED_PITCH/s.width});if(!placed.length)placed=letterLEDs(addPart,parts,art,l,pos,s,scale,hw,leds);return placed;},
   // Threaded stud through the back into the wall, nut inside the can. No spacer, no clamps: flush, no acrylic back.
   mount:(l,m)=>{const start=parts.studs.children.length,v=pos(m.point),h=inch*mountScale(m,art,inch);threadedStud(addPart,studMat,v.x,v.y,h,{shaftTop:-depth+.15*h,end:wallZ-.35*inch,nutTop:-depth+.2*h,nutBottom:-depth,threadTop:-depth,turns:Math.max(4,Math.round((BACK+.35)*20))});groupMount(parts,start);},
   // Weep hole at the lowest point of every letter, just above the back.
   drain:()=>-depth+.25*inch});
  // Returns behind the face, and the trim cap: a band over the returns plus a lip over the face edge.
  const returnBase=finishMaterial({...s,finish:s.returns,sheen:'satin'},art.texture,renderer),trimFinish=TRIM_FINISH[s.trim],trimBase=trimFinish&&finishMaterial({...s,finish:trimFinish,sheen:'gloss'},art.texture,renderer);
  returnsShell(-depth,-acrylicT,index=>artworkMaterial(returnBase,index,false,s.returns,art.colors),(index,c)=>{if(!trimBase)return;const tm=artworkMaterial(trimBase,index,false,trimFinish,art.colors);for(const r of offsetRegions(c,trimT,C)){const rc=[r.points,...r.holes];slab(clippedReturnRings(rc,trimT,C),-band,0,tm,'trim',index);slab(clippedReturnRings(rc,trimT+lip,C),0,trimT,tm,'trim',index);}});
  // Acrylic face in front, sealed back behind; both cut to the letter outline. Face edges take the returns' paint:
  // sampling the artwork at the exact outline gives a ragged rim when trimless.
  const faceMat=acrylicFaceMaterial(art,s,isLit,modules),backMat=new THREE.MeshStandardMaterial({color:'#8b9196',metalness:.6,roughness:.5});
  shapes().forEach((shape,index)=>{const face=new THREE.Mesh(uv(new THREE.ExtrudeGeometry(shape,{depth:acrylicT,bevelEnabled:false})),[faceMat,artworkMaterial(returnBase,index,false,s.returns,art.colors)]);face.position.z=-acrylicT;addPart('face',face);const back=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:backT,bevelEnabled:false}),backMat);back.position.z=wallZ;addPart('back',back);});}

 // L-clamp at the letter edge nearest a mount: bracket on the acrylic back, one screw into the return, one into the acrylic.
 function addBackClamp(letter,mount,unit,material){const boundary=letter.points.reduce((a,b)=>Math.hypot(a[0]-mount.point[0],a[1]-mount.point[1])<Math.hypot(b[0]-mount.point[0],b[1]-mount.point[1])?a:b),edge=pos(boundary),center=pos(mount.point),inward=center.clone().sub(edge).normalize(),angle=Math.atan2(inward.y,inward.x),u=unit*.65;const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(.35*u,0);shape.lineTo(.35*u,.045*u);shape.lineTo(.045*u,.045*u);shape.lineTo(.045*u,.32*u);shape.lineTo(0,.32*u);shape.closePath();const geometry=new THREE.ExtrudeGeometry(shape,{depth:.3*u,bevelEnabled:true,bevelThickness:.004*u,bevelSize:.004*u,bevelSegments:2});geometry.translate(0,0,-.15*u);geometry.rotateX(Math.PI/2);geometry.rotateZ(angle);const bracket=new THREE.Mesh(geometry,material);bracket.position.set(edge.x+inward.x*.04*u,edge.y+inward.y*.04*u,-depth);const group=new THREE.Group();group.add(bracket);const screwX=edge.x+inward.x*.23*u,screwY=edge.y+inward.y*.23*u;const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.045*u,.045*u,.23*u,24),material);shaft.rotation.x=Math.PI/2;shaft.position.set(screwX,screwY,-depth-.08*u);group.add(shaft);const head=new THREE.Mesh(new THREE.SphereGeometry(.075*u,24,12),material);head.scale.z=.4;head.position.set(screwX,screwY,-depth+.06*u);group.add(head);const slot=new THREE.Mesh(new THREE.BoxGeometry(.085*u,.014*u,.01*u),new THREE.MeshStandardMaterial({color:'#454b4f',roughness:.7}));slot.position.set(screwX,screwY,-depth+.092*u);group.add(slot);const sideScrew=new THREE.Mesh(new THREE.CylinderGeometry(.038*u,.038*u,.11*u,24),material);sideScrew.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(inward.x,inward.y,0));sideScrew.position.set(edge.x+inward.x*.035*u,edge.y+inward.y*.035*u,-depth+.21*u);group.add(sideScrew);const sideHead=new THREE.Mesh(new THREE.SphereGeometry(.065*u,24,12),material);sideHead.scale.z=.4;sideHead.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(inward.x,inward.y,0));sideHead.position.set(edge.x+inward.x*.105*u,edge.y+inward.y*.105*u,-depth+.21*u);group.add(sideHead);const sideSlot=new THREE.Mesh(new THREE.BoxGeometry(.075*u,.012*u,.008*u),slot.material);sideSlot.quaternion.copy(sideHead.quaternion);sideSlot.position.copy(sideHead.position).addScaledVector(new THREE.Vector3(inward.x,inward.y,0),.027*u);group.add(sideSlot);group.userData.clampAssembly=true;group.userData.screwCount=2;addPart('clamps',group);}
}

// Light planes (core/glow.mjs), chosen by `emit`.
// emit back: halo = the mask blurred (core σ 0.4″ + gap, wide σ 1″ + 2.5 × gap) in the LED colour, just in front of the wall.
export function haloGlow(art,s,isLit,wallZ,height){const inch=4/s.width;return glowPlane(art.glowSource,height,{core:inch*(.4+s.gap),wide:inch*(1+2.5*s.gap),tint:ledColour(s),opacity:isLit?s.intensity*1.15:0,opacityFactor:1.15,z:wallZ+.008});}
// emit front: face glow = the lit face colours, blurred, on an additive plane just in front of the face. It reads as light
// spilling past the trim, like bloom in a photo of a lit sign. Front only: nothing is added behind the letters.
export function faceGlow(art,s,isLit,wallZ,height){const inch=4/s.width,c=document.createElement('canvas');c.width=art.w;c.height=art.h;const x=c.getContext('2d');faceColour(art,s).paint(x);x.globalCompositeOperation='destination-in';x.drawImage(art.glowSource,0,0);
 return glowPlane(c,height,{core:GLOW_CORE*inch,wide:GLOW_WIDE*inch,opacity:isLit?s.intensity*GLOW:0,opacityFactor:GLOW,z:(TRIM+.05)*inch,front:true});}

// Registry ids (app/registry.mjs) this construction builds → the sign to open and, per studio tier, the trims offered.
// Face-lit Standard = plastic trim cap; Premium = metallic trim or trimless (pricing names: "Plastic Trim" / "Metallic Trim").
const STANDARD_TRIMS=['artwork','black','white'],PREMIUM_TRIMS=['silver','gold','bronze','none'];
export const VARIANTS={
 'illuminated-dimensional-letters-halo-lit-back-lit':{sign:'halo-lit'},
 'illuminated-channel-letters-halo-lit-back-lit':{sign:'halo-lit'},
 'illuminated-dimensional-letters-face-lit-standard-channel-letter':{sign:'face-lit',options:{trim:STANDARD_TRIMS}},
 'illuminated-channel-letters-face-lit-standard-channel-letter':{sign:'face-lit',options:{trim:STANDARD_TRIMS}},
 'illuminated-dimensional-letters-face-lit-premium-channel-letters':{sign:'face-lit',options:{trim:PREMIUM_TRIMS}},
 'illuminated-channel-letters-face-lit-premium-channel-letters':{sign:'face-lit',options:{trim:PREMIUM_TRIMS}},
};
// Sign-type interface read by app.js, one per built construction (the studio's Sign type control).
export const signs={
 'halo-lit':{id:'halo-lit',label:'Halo-lit',config:CONFIGS['halo-lit'],mountings:['flush'],standardDepth:1,defaultIntensity:75,
  build:(art,s,isLit,renderer)=>buildChannelLetter(art,s,isLit,renderer,CONFIGS['halo-lit']),glow:haloGlow,
  // Wall sits behind the acrylic back, across the wall gap.
  wallDepth:s=>{const inch=4/s.width;return s.depth*inch+.1875*inch;},wallGap:s=>s.gap*(4/s.width),
  explodedOffsets:{face:.9,returns:.2,leds:.6,acrylic:-.55,studs:-.7,wires:.4,drain:.2,clamps:-.35},
  componentInfo:{
   face:['Metal face','Opaque SS / aluminium face. Its finish follows the artwork or selected metallic finish.'],
   returns:['Metal returns','Smooth metal sidewalls · '+ '1″ standard depth, with an editable custom depth.'],
   leds:['LED module','Rear-facing module with three lenses. Module positions and automatically fitted dimensions are illustrative.'],
   acrylic:['Acrylic back','3/16″ acrylic back, cut to the artwork contours. Clear, frosted and opal options respond to the selected LED colour and intensity.'],
   studs:['Stud + rivnut','Hollow rear spacer with a threaded mounting stud through its bore, plus the rivnut connection. 3–4 uniformly spread mounts per letter; hardware is visually fitted to stroke width. Fabrication dimensions require confirmation.'],
   clamps:['L brackets + screws','At least three small L brackets per letter. Each bracket has two screws: one through the metal return and one through the acrylic back. Positions and sizes are illustrative.'],
   wires:['18 AWG wiring','Illustrative red / white wiring between LED modules inside the letters.'],
   drain:['Drain position','Illustrative bottom drain marker. Final hole position follows fabrication details.']},
  parts:[['face','#ad9270','Metal face'],['returns','#8d959e','Metal returns'],['leds','#f5d791','LED modules'],['acrylic','#a8d7e6','3/16″ acrylic back'],['studs','#747c88','Spacers + threaded studs'],['clamps','#9aa4aa','L brackets + screws'],['wires','#bd655c','18 AWG wiring'],['drain','#272b31','Drain position']],
  finishParts:['face','returns'],internalHidden:['face'],assembledHidden:['clamps'],singleParts:['leds','studs','drain','clamps'],
  hints:{assembled:'Opaque metal face and returns. Light exits through the acrylic back and reflects from the wall.',exploded:'Separated layers reveal your metal shell, rear-facing LEDs, acrylic back and wall mounting.',internal:'Face removed to inspect the LEDs and wiring. The LEDs point towards the acrylic back.'},
  specs:(s,led)=>s.depth+'″ depth · 3/16″ acrylic · '+led},
 'face-lit':{id:'face-lit',label:'Face-lit',config:CONFIGS['face-lit'],mountings:['flush'],standardDepth:5,defaultIntensity:40,
  build:(art,s,isLit,renderer)=>buildChannelLetter(art,s,isLit,renderer,CONFIGS['face-lit']),glow:faceGlow,
  // Flush: the wall touches the sealed back.
  wallDepth:s=>(s.depth+BACK)*(4/s.width),wallGap:()=>0,
  // Front to back: trim, face, LEDs, wires, returns, back, studs. LEDs and wiring sit on the back, so they move forward by the can depth.
  explodedOffsets:s=>{const d=s.depth*4/s.width;return {trim:1.05,face:.7,leds:d+.3,wires:d+.25,returns:0,drain:0,back:-.35,studs:-.7};},
  componentInfo:{
   trim:['Trim cap','Plastic or metal bezel wrapping the face edge and holding it in place: 1″ band over the returns, ⅛″ lip over the face (lip and .06″ thickness assumed). Never lit. Trimless removes it.'],
   face:['Acrylic face','3/16″ translucent acrylic cut to the letter (thickness assumed). White acrylic with translucent vinyl, or solid-tinted acrylic. Light leaves only through this face; dark artwork stays unlit.'],
   returns:['Returns','Opaque painted metal sidewalls at the full sign depth (5″ standard; .040″ aluminium assumed). Never lit.'],
   leds:['LED module','Front-facing module with three lenses on the sealed back, about 4″ apart. Positions and fitted sizes are illustrative.'],
   wires:['18 AWG wiring','Illustrative red / white wiring between LED modules inside the letters.'],
   back:['Sealed back','Solid metal back (.063″ aluminium assumed). With the returns it forms a sealed can: no light reaches the wall.'],
   studs:['Threaded studs','3–4 threaded studs per letter through the back into the wall, nut inside the can. Flush mounting, no wall gap. Sizes are illustrative.'],
   drain:['Weep hole','One drain hole at the lowest point of each letter, for outdoor cans. Position is illustrative.']},
  parts:[['trim','#1d1f21','Trim cap'],['face','#f1ede2','Acrylic face'],['returns','#8d959e','Returns'],['leds','#f5d791','LED modules'],['wires','#bd655c','18 AWG wiring'],['back','#6d747b','Sealed back'],['studs','#747c88','Threaded studs'],['drain','#272b31','Weep holes']],
  finishParts:[],internalHidden:['trim','face'],assembledHidden:[],singleParts:['leds','studs','drain'],
  hints:{assembled:'Translucent acrylic face lit from inside. Returns, trim and back stay dark; nothing glows behind the letters.',exploded:'Separated layers: trim cap, acrylic face, front-facing LEDs and wiring, returns, sealed back and studs.',internal:'Face and trim removed to inspect the LEDs and wiring. The LEDs point at the acrylic face.'},
  specs:(s,led)=>s.depth+'″ depth · '+(s.trim==='none'?'trimless':s.trim+' trim')+' · '+(s.facetype==='tinted'?'tinted':'vinyl')+' face · '+led},
};
