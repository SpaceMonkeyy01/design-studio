import * as THREE from 'three';
import {toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';
import {clippedReturnRings,offsetRegions} from '../../core/artwork.mjs?v=11';
import {mountingPoints} from '../../core/routing.mjs?v=10';
import {finishMaterial,artworkMaterial,ledColour} from '../../core/materials.mjs?v=11';
import {artSpace} from '../../core/shapes.mjs?v=1';
import {partSet,hardwareMaterials,isTinyPiece,letterScale,mountScale,letterLEDs,threadedStud,groupMount,drainMarker} from '../../core/hardware.mjs?v=1';
// Face-lit (front-lit) channel letters: trim cap, lit translucent acrylic face, opaque returns, front-facing LEDs,
// sealed metal back, flush threaded studs. Nothing glows behind the letters. See CLAUDE.md in this folder.
// Inches. ASSUMED values (see CLAUDE.md): face, back, return wall, trim thickness and lip. Trim band, LED pitch from the shop's answers.
const FACE=.1875,BACK=.063,RETURN=.04,TRIM=.06,TRIM_BAND=1,LIP=.125,LED_PITCH=4;
// Face emissive per unit of intensity (tuned on screenshots: face brighter than the wall, hue not washed to white).
const FACE_GLOW=2.4;
const TRIM_FINISH={black:'black',white:'white',artwork:'artwork',silver:'silver-brushed',gold:'gold-brushed',bronze:'bronze-brushed'};
// Lit face: the artwork colour (vinyl print, or one tint per letter) shines through, brighter over each LED module.
// Near-black artwork stays dark; an all-black logo lights white instead (black by day, white at night).
function faceMaterial(art,s,isLit,modules){const w=art.w,h=art.h,dark=c=>!c?.colour?.isColor||.2126*c.colour.r+.7152*c.colour.g+.0722*c.colour.b<.012,allDark=art.colors.every(dark);
 const texture=paint=>{const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'));const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;};
 const hex=i=>{const c=art.colors[i]?.colour;return c?.isColor?'#'+c.getHexString(THREE.SRGBColorSpace):'#a6a6a6';};
 const tint=x=>art.loops.forEach((l,i)=>{x.fillStyle=hex(i);x.beginPath();for(const loop of [l.points,...l.holes]){loop.forEach((p,k)=>k?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();}x.fill('evenodd');});
 const colour=x=>s.facetype==='tinted'?tint(x):x.drawImage(art.texture.image,0,0,w,h),pitch=w*LED_PITCH/s.width;
 // Black outside the letters, so face edges sampling past the outline darken slightly instead of picking up the falloff grey.
 const glow=texture(x=>{x.fillStyle=allDark?'#ffffff':'#000000';x.fillRect(0,0,w,h);if(!allDark)colour(x);
  // LED falloff, sRGB: 196 between modules (≈55% linear) up to 255 over each module.
  const f=document.createElement('canvas');f.width=w;f.height=h;const fx=f.getContext('2d');fx.fillStyle='rgb(196,196,196)';fx.fillRect(0,0,w,h);fx.globalCompositeOperation='lighter';for(const p of modules){const g=fx.createRadialGradient(p[0],p[1],0,p[0],p[1],pitch*.8);g.addColorStop(0,'rgba(59,59,59,1)');g.addColorStop(1,'rgba(59,59,59,0)');fx.fillStyle=g;fx.fillRect(p[0]-pitch,p[1]-pitch,pitch*2,pitch*2);}
  x.globalCompositeOperation='multiply';x.drawImage(f,0,0);});
 // When lit, the face reflects little room light (25%) so the glow carries the colour instead of washing it out.
 const litColour=new THREE.Color(.25,.25,.25),unlitColour=new THREE.Color(1,1,1);
 const mat=new THREE.MeshPhysicalMaterial({color:isLit?litColour:unlitColour,map:s.facetype==='tinted'?texture(tint):art.texture,roughness:.32,metalness:0,clearcoat:.5,clearcoatRoughness:.18,emissive:ledColour(s),emissiveMap:glow,emissiveIntensity:isLit?s.intensity*FACE_GLOW:0});
 Object.assign(mat.userData,{glowFactor:FACE_GLOW,litColour,unlitColour});return mat;}
// Builds the sign for one traced artwork and settings snapshot. Returns {root, parts} with one group per part.
export function buildFaceLit(art,s,isLit,renderer){const {root,parts,addPart}=partSet(['trim','face','returns','leds','wires','back','studs','drain']);
 const {pos,shapes,uv,contours}=artSpace(art),C=window.ClipperLib;
 const inch=4/s.width,depth=s.depth*inch,faceT=FACE*inch,backT=BACK*inch,trimT=TRIM*inch,band=Math.min(TRIM_BAND,s.depth*.5)*inch,lip=LIP*inch,wallZ=-depth-backT;
 // Extrude Clipper regions [{points, holes}] from z0 to z1 with artwork-space UVs. Rings of tiny pieces can collapse to <3 points: skip them.
 const slab=(regions,z0,z1,material,part,index)=>{for(const r of regions){if(r.points.length<3)continue;const shape=new THREE.Shape(r.points.map(p=>new THREE.Vector2(...p)));shape.holes=r.holes.filter(h=>h.length>=3).map(h=>new THREE.Path(h.map(p=>new THREE.Vector2(...p))));const raw=new THREE.ExtrudeGeometry(shape,{depth:z1-z0,bevelEnabled:false,steps:1});raw.translate(0,0,z0);raw.scale(100,100,100);const g=toCreasedNormals(raw,.8);g.scale(.01,.01,.01);uv(g);const m=new THREE.Mesh(g,material);m.userData.artIndex=index;addPart(part,m);}};
 // LEDs, wiring, studs and weep holes first: the face glow needs the module positions.
 const mats=hardwareMaterials(s,isLit),{studMat}=mats,modules=[];
 for(const l of art.loops){if(isTinyPiece(l,art))continue;const mounts=mountingPoints(l,art.dist,art.w,art.h,s.mountcount,art.labels),scale=letterScale(mounts,art,inch);
  // Front-facing modules on the sealed back; lenses point at the acrylic face. Pitch ≈ 4″; a letter too small
  // for that still gets modules at the denser default spacing (every lit letter needs light).
  const leds={z:-depth+.06*inch,lens:1,wireZ:-depth+.03*inch};let placed=letterLEDs(addPart,parts,art,l,pos,s,scale,mats,{...leds,spacing:art.w*LED_PITCH/s.width});if(!placed.length)placed=letterLEDs(addPart,parts,art,l,pos,s,scale,mats,leds);modules.push(...placed);
  // 3–4 threaded studs through the back into the wall, nut inside the can. No spacer, no clamps: flush, no acrylic back.
  for(const m of mounts){const start=parts.studs.children.length,v=pos(m.point),h=inch*mountScale(m,art,inch);threadedStud(addPart,studMat,v.x,v.y,h,{shaftTop:-depth+.15*h,end:wallZ-.35*inch,nutTop:-depth+.2*h,nutBottom:-depth,threadTop:-depth,turns:Math.max(4,Math.round((BACK+.35)*20))});groupMount(parts,start);}
  drainMarker(addPart,l,pos,inch,-depth+.25*inch);}
 // Returns (opaque, full depth behind the face) and trim cap (band over the returns + lip over the face edge).
 const returnBase=finishMaterial({...s,finish:s.returns,sheen:'satin'},art.texture,renderer),trimFinish=TRIM_FINISH[s.trim],trimBase=trimFinish&&finishMaterial({...s,finish:trimFinish,sheen:'gloss'},art.texture,renderer);
 for(let index=0;index<art.loops.length;index++){const l=art.loops[index],c=contours(l),clearance=mountingPoints(l,art.dist,art.w,art.h,s.mountcount,art.labels).reduce((n,m)=>Math.max(n,m.clearance*4/art.w),.001);
  slab(clippedReturnRings(c,Math.min(RETURN*inch,clearance*.22),C),-depth,-faceT,artworkMaterial(returnBase,index,false,s.returns,art.colors),'returns',index);
  if(trimBase){const tm=artworkMaterial(trimBase,index,false,trimFinish,art.colors);for(const r of offsetRegions(c,trimT,C)){const rc=[r.points,...r.holes];slab(clippedReturnRings(rc,trimT,C),-band,0,tm,'trim',index);slab(clippedReturnRings(rc,trimT+lip,C),0,trimT,tm,'trim',index);}}}
 // Acrylic face in front, sealed back behind; both cut to the letter outline.
 const faceMat=faceMaterial(art,s,isLit,modules),backMat=new THREE.MeshStandardMaterial({color:'#8b9196',metalness:.6,roughness:.5});
 // Face edges take the returns' paint: sampling the artwork at the exact outline gives a ragged rim when trimless.
 shapes().forEach((shape,index)=>{const face=new THREE.Mesh(uv(new THREE.ExtrudeGeometry(shape,{depth:faceT,bevelEnabled:false})),[faceMat,artworkMaterial(returnBase,index,false,s.returns,art.colors)]);face.position.z=-faceT;addPart('face',face);const back=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:backT,bevelEnabled:false}),backMat);back.position.z=wallZ;addPart('back',back);});
 return {root,parts};
}
// Exploded-view z offsets per part (world units), front to back: trim, face, LEDs, wires, returns, back, studs.
// LEDs and wiring sit on the back, so they move forward by the can depth to clear the returns.
export const explodedOffsets=s=>{const d=s.depth*4/s.width;return {trim:1.05,face:.7,leds:d+.3,wires:d+.25,returns:0,drain:0,back:-.35,studs:-.7};};
// Inspector title and description per part.
export const componentInfo={
 trim:['Trim cap','Plastic or metal bezel wrapping the face edge and holding it in place: 1″ band over the returns, ⅛″ lip over the face (lip and .06″ thickness assumed). Never lit. Trimless removes it.'],
 face:['Acrylic face','3/16″ translucent acrylic cut to the letter (thickness assumed). White acrylic with translucent vinyl, or solid-tinted acrylic. Light leaves only through this face; dark artwork stays unlit.'],
 returns:['Returns','Opaque painted metal sidewalls at the full sign depth (5″ standard; .040″ aluminium assumed). Never lit.'],
 leds:['LED module','Front-facing module with three lenses on the sealed back, about 4″ apart. Positions and fitted sizes are illustrative.'],
 wires:['18 AWG wiring','Illustrative red / white wiring between LED modules inside the letters.'],
 back:['Sealed back','Solid metal back (.063″ aluminium assumed). With the returns it forms a sealed can: no light reaches the wall.'],
 studs:['Threaded studs','3–4 threaded studs per letter through the back into the wall, nut inside the can. Flush mounting, no wall gap. Sizes are illustrative.'],
 drain:['Weep hole','One drain hole at the lowest point of each letter, for outdoor cans. Position is illustrative.']
};
// Sign-type interface read by app.js (same shape as signs/halo-lit). No halo: halo is null.
export const sign={id:'face-lit',label:'Face-lit',standardDepth:5,build:buildFaceLit,halo:null,
 // Flush: the wall touches the sealed back.
 wallDepth:s=>(s.depth+BACK)*(4/s.width),wallGap:()=>0,
 explodedOffsets,componentInfo,
 parts:[['trim','#1d1f21','Trim cap'],['face','#f1ede2','Acrylic face'],['returns','#8d959e','Returns'],['leds','#f5d791','LED modules'],['wires','#bd655c','18 AWG wiring'],['back','#6d747b','Sealed back'],['studs','#747c88','Threaded studs'],['drain','#272b31','Weep holes']],
 finishParts:[],internalHidden:['trim','face'],assembledHidden:[],singleParts:['leds','studs','drain'],
 hints:{assembled:'Translucent acrylic face lit from inside. Returns, trim and back stay dark; nothing glows behind the letters.',exploded:'Separated layers: trim cap, acrylic face, front-facing LEDs and wiring, returns, sealed back and studs.',internal:'Face and trim removed to inspect the LEDs and wiring. The LEDs point at the acrylic face.'},
 specs:(s,led)=>s.depth+'″ depth · '+(s.trim==='none'?'trimless':s.trim+' trim')+' · '+(s.facetype==='tinted'?'tinted':'vinyl')+' face · '+led};
