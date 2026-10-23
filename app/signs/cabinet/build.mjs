import * as THREE from 'three';
import {offsetRegions} from '../../core/artwork.mjs?v=11';
import {mountingPoints} from '../../core/routing.mjs?v=10';
import {finishMaterial,ledColour} from '../../core/materials.mjs?v=13';
import {artSpace} from '../../core/shapes.mjs?v=1';
import {glowPlane} from '../../core/glow.mjs?v=2';
import {acrylicFaceMaterial,faceGlowPlane} from '../../core/litface.mjs?v=1';
import {SIGNS as REGISTRY} from '../../registry.mjs?v=2';
import {partSet,hardwareMaterials,isTinyPiece,letterScale,letterLEDs,threadedStud,groupMount,rod,box} from '../../core/hardware.mjs?v=3';
// Cabinets: a rectangular aluminium box on the wall; the artwork is in or on its front. See CLAUDE.md in this folder.
// Built today: push-through (letters routed out of the aluminium front, 3/4″ acrylic letters pushed through and standing proud,
// lit from inside), as face-lit and as halo-lit (frosted acrylic back, standoffs, halo around the cabinet).
//   halo   false = removable aluminium back, flush on the wall; true = frosted acrylic back on 1.5″ standoffs, LEDs both ways
export const CONFIGS={
 'push-thru':{halo:false},
 'push-thru-halo':{halo:true},
};
// Inches. From the Estimator drawings (references/cabinet/push-thru, push-thru-face-halo): 3/4″ raised acrylic letters, 1.5″ spacers.
// ASSUMED (not called out; see CLAUDE.md): front 1/8″, returns 0.063″ and back 0.1019″ (the cabinet face-lit PARTS), acrylic backing
// and frosted back 3/16″, PVC sheet 1/8″, 1/32″ routing clearance, studs 3″ in from the corners, at most ~24″ apart.
const LETTER=.75,STANDOFF=1.5,FRONT=.125,RETURN=.063,BACK=.1019,ACRYLIC=.1875,PVC=.125,CLEARANCE=1/32,STUD_INSET=3,STUD_PITCH=24,LED_PITCH=4;
// Lit letter edges (the raised sides of the push-through acrylic) and the frosted acrylic back: emissive per unit of intensity.
const EDGE_GLOW=1.6,BACK_GLOW=.9;
// Cabinet finish (the Cabinet finish control): paints and brushed metals. Black is the default.
const CABINET_FINISH={black:'black',white:'white',silver:'silver-brushed',bronze:'bronze-brushed'};
const margin=s=>Math.max(0,s.cabinetmargin??3);

// Builds one cabinet for a traced artwork, settings snapshot and config. Returns {root, parts}, one group per part.
export function buildCabinet(art,s,isLit,renderer,cfg){const halo=cfg.halo;
 const {root,parts,addPart}=partSet(halo?['letters','front','returns','leds','wires','pvc','back','studs','psu','drain']:['letters','front','returns','backing','leds','wires','back','studs','psu','drain']);
 const {pos,shapes,uv,contours}=artSpace(art),C=window.ClipperLib,inch=4/s.width,depth=s.depth*inch,m=margin(s)*inch,W=4+2*m,H=4*art.h/art.w+2*m;
 const frontT=FRONT*inch,returnT=RETURN*inch,backT=(halo?ACRYLIC:BACK)*inch,innerW=W-2*returnT,innerH=H-2*returnT;
 const finish=CABINET_FINISH[s.cabinetfinish]||'black',cabinetMat=finishMaterial({...s,finish,sheen:'satin'},art.texture,renderer),hw=hardwareMaterials(s,isLit),{studMat}=hw;
 const slab=(w,h,d,z,mat,part)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.z=z;return addPart(part,mesh);};

 // LEDs under each meaningful letter (illustrative). Face-lit: on the back, facing the front. Halo: both sides of a mid-depth PVC sheet.
 const modules=[];for(const l of art.loops){if(isTinyPiece(l,art))continue;const scale=letterScale(mountingPoints(l,art.dist,art.w,art.h,'auto',art.labels),art,inch),spacing=art.w*LED_PITCH/s.width;
  if(halo){const mid=-depth/2,half=PVC*inch/2;modules.push(...letterLEDs(addPart,parts,art,l,pos,s,scale,hw,{z:mid+half+.06*inch,lens:1,wireZ:mid+half+.03*inch,spacing}));letterLEDs(addPart,parts,art,l,pos,s,scale,hw,{z:mid-half-.06*inch,lens:-1,wireZ:mid-half-.03*inch,spacing});}
  else modules.push(...letterLEDs(addPart,parts,art,l,pos,s,scale,hw,{z:-depth+.06*inch,lens:1,wireZ:-depth+.03*inch,spacing}));}

 // Push-through letters: 3/4″ acrylic, from the backing (behind the front) forward, standing proud of the front by LETTER − FRONT.
 // Front caps: the lit face material; sides: lit acrylic edges in the LED colour.
 const faceMat=acrylicFaceMaterial(art,s,isLit,modules,LED_PITCH),litEdge=new THREE.Color(.25,.25,.25),dayEdge=new THREE.Color('#f2f1ec'),edgeMat=new THREE.MeshPhysicalMaterial({color:isLit?litEdge:dayEdge,emissive:ledColour(s),emissiveIntensity:isLit?s.intensity*EDGE_GLOW:0,roughness:.3,metalness:0,clearcoat:.5,clearcoatRoughness:.15});Object.assign(edgeMat.userData,{glowFactor:EDGE_GLOW,litColour:litEdge,unlitColour:dayEdge});
 shapes().forEach((shape,index)=>{const g=uv(new THREE.ExtrudeGeometry(shape,{depth:LETTER*inch,bevelEnabled:false,curveSegments:24}));const letter=new THREE.Mesh(g,[faceMat,edgeMat]);letter.position.z=-frontT;letter.userData.artIndex=index;addPart('letters',letter);});

 // Aluminium front: the cabinet rectangle with each letter routed out (outline grown by the routing clearance). A letter's counters
 // (the inside of an O) stay as aluminium islands, held by the backing.
 const outline=new THREE.Shape([[-W/2,-H/2],[W/2,-H/2],[W/2,H/2],[-W/2,H/2]].map(p=>new THREE.Vector2(...p))),islands=[];
 for(const l of art.loops)for(const r of offsetRegions(contours(l),CLEARANCE*inch,C)){if(r.points.length<3)continue;outline.holes.push(new THREE.Path(r.points.map(p=>new THREE.Vector2(...p))));for(const h of r.holes)if(h.length>=3)islands.push(new THREE.Shape(h.map(p=>new THREE.Vector2(...p))));}
 for(const shape of [outline,...islands]){const plate=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:frontT,bevelEnabled:false,curveSegments:24}),cabinetMat);plate.position.z=-frontT;addPart('front',plate);}

 // Returns: four aluminium sides from the front back to the back panel.
 for(const [w,h,x,y] of [[W,returnT,0,(H-returnT)/2],[W,returnT,0,-(H-returnT)/2],[returnT,innerH,(W-returnT)/2,0],[returnT,innerH,-(W-returnT)/2,0]]){const side=slab(w,h,depth-frontT,-frontT-(depth-frontT)/2,cabinetMat,'returns');side.position.x=x;side.position.y=y;}

 // Face-lit: translucent acrylic backing behind the front (diffuses the LEDs, holds the counters) and the removable aluminium back.
 // Halo: a PVC sheet mid-depth carrying the LEDs, and a frosted acrylic back that glows and throws the halo.
 if(!halo){slab(innerW,innerH,ACRYLIC*inch,-frontT-ACRYLIC*inch/2,new THREE.MeshPhysicalMaterial({color:'#f4f4ef',transparent:true,opacity:.55,roughness:.6,metalness:0,depthWrite:false}),'backing');
  slab(W,H,backT,-depth-backT/2,new THREE.MeshStandardMaterial({color:'#8b9196',metalness:.6,roughness:.5}),'back');}
 else{slab(innerW,innerH,PVC*inch,-depth/2,new THREE.MeshStandardMaterial({color:'#f1f1ec',roughness:.8}),'pvc');
  const frosted=new THREE.MeshPhysicalMaterial({color:'#f4f4ef',emissive:ledColour(s),emissiveIntensity:isLit?s.intensity*BACK_GLOW:0,roughness:.7,metalness:0,transparent:true,opacity:.75,depthWrite:false});frosted.userData.glowFactor=BACK_GLOW;
  slab(W,H,backT,-depth-backT/2,frosted,'back');}

 // Studs: a grid 3″ in from the corners, ≤24″ apart. Face-lit: through the back into the wall, nut inside. Halo: across a 1.5″ spacer.
 const backZ=-depth-backT,wallZ=backZ-(halo?STANDOFF*inch:0),cols=Math.max(2,Math.ceil((W/inch-2*STUD_INSET)/STUD_PITCH)+1),rows=Math.max(2,Math.ceil((H/inch-2*STUD_INSET)/STUD_PITCH)+1),ix=Math.max(0,W/2-STUD_INSET*inch),iy=Math.max(0,H/2-STUD_INSET*inch);
 for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const x=-ix+2*ix*i/(cols-1),y=-iy+2*iy*j/(rows-1),start=parts.studs.children.length;
  if(halo)rod(addPart,[x,y,wallZ],[x,y,backZ],.21*inch,studMat,'studs');
  threadedStud(addPart,studMat,x,y,inch,{shaftTop:-depth+.15*inch,end:wallZ-.35*inch,nutTop:-depth+.2*inch,nutBottom:-depth,threadTop:-depth,turns:Math.max(4,Math.round(((halo?STANDOFF:0)+BACK+.35)*20))});groupMount(parts,start);}

 // Power supply box with on/off switch inside, bottom left; drain hole in the bottom return.
 box(addPart,-W/2+returnT+2*inch,-H/2+returnT+1.25*inch,-depth+.9*inch,3*inch,2*inch,1.5*inch,new THREE.MeshStandardMaterial({color:'#d9d9d4',roughness:.6}),'psu');
 rod(addPart,[0,-H/2-.02*inch,-depth/2],[0,-H/2+returnT+.02*inch,-depth/2],.15*inch,new THREE.MeshStandardMaterial({color:'#1b1d1e',roughness:.8}),'drain');
 return {root,parts};}

// Light planes. Face glow in front of the raised letters; halo-lit adds the halo of the whole cabinet on the wall (a rectangle, blurred
// as halo-lit's halo for a 1.5″ gap, in the LED colour).
const faceLight=(art,s,isLit,height)=>faceGlowPlane(art,s,isLit,height,(LETTER-FRONT+.05)*(4/s.width));
function cabinetHalo(art,s,isLit,wallZ){const inch=4/s.width,m=margin(s)*inch,W=4+2*m,H=4*art.h/art.w+2*m,c=document.createElement('canvas');c.width=Math.max(8,Math.round(256*W/Math.max(W,H)));c.height=Math.max(8,Math.round(256*H/Math.max(W,H)));const x=c.getContext('2d');x.fillStyle='#ffffff';x.fillRect(0,0,c.width,c.height);
 return glowPlane(c,H,{width:W,core:inch*(.4+STANDOFF),wide:inch*(1+2.5*STANDOFF),tint:ledColour(s),opacity:isLit?s.intensity*1.15:0,opacityFactor:1.15,z:wallZ+.008});}

// Registry ids this construction builds → the sign to open.
export const VARIANTS={
 'push-through-signage-face-lit':{sign:'push-thru'},
 'push-through-signage-halo-lit':{sign:'push-thru-halo'},
};
const depthOf=id=>{const {min,max,std}=REGISTRY.find(r=>VARIANTS[r.id]?.sign===id).depth;return {min,max,std};};
const common=id=>({id,construction:'cabinet',mountings:[],standardDepth:depthOf(id).std,depthRange:depthOf(id),defaultIntensity:50,
 // The sign on a wall or in a scene is the cabinet: the artwork plus the margin all round.
 outer:s=>2*margin(s),
 finishParts:[],internalHidden:['letters','front'],assembledHidden:[],singleParts:['leds','studs','psu','drain']});
const INFO={
 letters:['Push-through letters','3/4″ acrylic letters routed to the artwork and pushed through the aluminium front, standing proud of it. Face: white acrylic with translucent vinyl, or tinted; the raised sides glow too.'],
 front:['Aluminium front','Cabinet face with each letter routed out (1/32″ clearance, assumed); letter counters stay as aluminium islands. Painted or brushed, as chosen; never lit.'],
 returns:['Returns','Aluminium sides of the cabinet (0.063″ assumed) at the full cabinet depth.'],
 leds:['LED module','Modules with three lenses behind each letter, about 4″ apart. Positions are illustrative.'],
 wires:['18 AWG wiring','Illustrative red / white wiring between LED modules.'],
 studs:['Studs','¼″Ø threaded studs into the wall, about 3″ in from the corners and at most ~24″ apart (assumed).'],
 psu:['Power supply box','Power supply in the cabinet with an ON/OFF switch, as on the drawing. Position illustrative.'],
 drain:['Drain hole','Drain hole in the bottom of the cabinet. Position illustrative.']};
const glowSpec=(s,led,extra)=>s.depth+'″ cabinet · '+margin(s)+'″ margin · 3/4″ push-through letters'+extra+' · '+led;
// Sign-type interface read by app.js, one per built config (the Sign type control).
export const signs={
 'push-thru':{...common('push-thru'),label:'Push-through',config:CONFIGS['push-thru'],
  build:(art,s,isLit,renderer)=>buildCabinet(art,s,isLit,renderer,CONFIGS['push-thru']),
  glow:(art,s,isLit,wallZ,height)=>faceLight(art,s,isLit,height),
  // Flush: the wall touches the removable aluminium back.
  wallDepth:s=>(s.depth+BACK)*(4/s.width),wallGap:()=>0,
  explodedOffsets:{letters:1.1,front:.65,backing:.35,leds:0,wires:0,returns:0,psu:0,drain:0,back:-.35,studs:-.65},
  componentInfo:{...INFO,backing:['Acrylic backing','Translucent acrylic sheet behind the front (3/16″ assumed): diffuses the LEDs and holds the letter counters.'],back:['Removable back','Aluminium back panel (0.1019″ assumed), removable for service.']},
  parts:[['letters','#f1ede2','Push-through letters'],['front','#2b2e30','Aluminium front'],['returns','#8d959e','Returns'],['backing','#e8f2f4','Acrylic backing'],['leds','#f5d791','LED modules'],['wires','#bd655c','18 AWG wiring'],['back','#6d747b','Removable back'],['studs','#747c88','Studs'],['psu','#d9d9d4','Power supply box'],['drain','#272b31','Drain hole']],
  hints:{assembled:'Aluminium cabinet with acrylic letters pushed through its front: the letters glow, the cabinet stays dark.',exploded:'Separated layers: push-through letters, routed aluminium front, acrylic backing, LEDs, returns, back and studs.',internal:'Front and letters removed to inspect the LEDs, wiring and power supply inside the cabinet.'},
  specs:(s,led)=>glowSpec(s,led,'')},
 'push-thru-halo':{...common('push-thru-halo'),label:'Push-through halo',config:CONFIGS['push-thru-halo'],
  build:(art,s,isLit,renderer)=>buildCabinet(art,s,isLit,renderer,CONFIGS['push-thru-halo']),
  glow:(art,s,isLit,wallZ,height)=>[cabinetHalo(art,s,isLit,wallZ),faceLight(art,s,isLit,height)],
  // Standoffs: the wall is 1.5″ behind the frosted acrylic back.
  wallDepth:s=>(s.depth+ACRYLIC)*(4/s.width),wallGap:s=>STANDOFF*(4/s.width),
  explodedOffsets:{letters:1.1,front:.65,leds:0,wires:0,pvc:0,returns:0,psu:0,drain:0,back:-.4,studs:-.7},
  componentInfo:{...INFO,pvc:['PVC sheet','Sheet mid-cavity carrying LEDs on both sides (1/8″ assumed): forward for the letters, back for the halo.'],back:['Frosted acrylic back','Frosted acrylic back (3/16″ assumed): the rear LEDs light it and throw the halo on the wall.'],studs:['Studs + spacers','¼″Ø studs with 1.5″ spacers (from the drawing), about 3″ in from the corners (assumed).']},
  parts:[['letters','#f1ede2','Push-through letters'],['front','#2b2e30','Aluminium front'],['returns','#8d959e','Returns'],['leds','#f5d791','LED modules'],['wires','#bd655c','18 AWG wiring'],['pvc','#f1f1ec','PVC sheet'],['back','#a8d7e6','Frosted acrylic back'],['studs','#747c88','Studs + spacers'],['psu','#d9d9d4','Power supply box'],['drain','#272b31','Drain hole']],
  hints:{assembled:'Push-through letters glow at the front and the whole cabinet throws a halo on the wall behind it.',exploded:'Separated layers: letters, routed front, LEDs on both sides of the PVC sheet, returns, frosted back and standoff studs.',internal:'Front and letters removed to inspect the LEDs on both sides of the PVC sheet.'},
  specs:(s,led)=>glowSpec(s,led,' + halo')},
};
