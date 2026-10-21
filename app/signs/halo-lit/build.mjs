import * as THREE from 'three';
import {toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';
import {clippedReturnRings} from '../../core/artwork.mjs?v=11';
import {mountingPoints} from '../../core/routing.mjs?v=10';
import {finishMaterial,artworkMaterial,ledColour} from '../../core/materials.mjs?v=11';
import {artSpace,flatCaps} from '../../core/shapes.mjs?v=1';
import {glowPlane} from '../../core/glow.mjs?v=1';
import {partSet,hardwareMaterials,isTinyPiece,letterScale,mountScale,letterLEDs,threadedStud,groupMount,drainMarker} from '../../core/hardware.mjs?v=1';
// Halo-lit (reverse) channel letters: opaque metal face + returns, rear-facing LEDs, 3/16″ acrylic back,
// stud + spacer mounts with L-clamps, and a halo on the wall behind. See CLAUDE.md in this folder.
// Builds the sign for one traced artwork and settings snapshot. Returns {root, parts} with one group per part.
export function buildHaloLit(art,s,isLit,renderer){const {root,parts,addPart}=partSet(['face','returns','acrylic','leds','studs','wires','drain','clamps']);
 const {pos,shapes,uv:uvGeometry,contours:worldContours}=artSpace(art);
 function addBackClamp(letter,mount,depth,unit,material){const boundary=letter.points.reduce((a,b)=>Math.hypot(a[0]-mount.point[0],a[1]-mount.point[1])<Math.hypot(b[0]-mount.point[0],b[1]-mount.point[1])?a:b),edge=pos(boundary),center=pos(mount.point),inward=center.clone().sub(edge).normalize(),angle=Math.atan2(inward.y,inward.x),u=unit*.65;const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(.35*u,0);shape.lineTo(.35*u,.045*u);shape.lineTo(.045*u,.045*u);shape.lineTo(.045*u,.32*u);shape.lineTo(0,.32*u);shape.closePath();const geometry=new THREE.ExtrudeGeometry(shape,{depth:.3*u,bevelEnabled:true,bevelThickness:.004*u,bevelSize:.004*u,bevelSegments:2});geometry.translate(0,0,-.15*u);geometry.rotateX(Math.PI/2);geometry.rotateZ(angle);const bracket=new THREE.Mesh(geometry,material);bracket.position.set(edge.x+inward.x*.04*u,edge.y+inward.y*.04*u,-depth);const group=new THREE.Group();group.add(bracket);const screwX=edge.x+inward.x*.23*u,screwY=edge.y+inward.y*.23*u;const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.045*u,.045*u,.23*u,24),material);shaft.rotation.x=Math.PI/2;shaft.position.set(screwX,screwY,-depth-.08*u);group.add(shaft);const head=new THREE.Mesh(new THREE.SphereGeometry(.075*u,24,12),material);head.scale.z=.4;head.position.set(screwX,screwY,-depth+.06*u);group.add(head);const slot=new THREE.Mesh(new THREE.BoxGeometry(.085*u,.014*u,.01*u),new THREE.MeshStandardMaterial({color:'#454b4f',roughness:.7}));slot.position.set(screwX,screwY,-depth+.092*u);group.add(slot);const sideScrew=new THREE.Mesh(new THREE.CylinderGeometry(.038*u,.038*u,.11*u,24),material);sideScrew.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(inward.x,inward.y,0));sideScrew.position.set(edge.x+inward.x*.035*u,edge.y+inward.y*.035*u,-depth+.21*u);group.add(sideScrew);const sideHead=new THREE.Mesh(new THREE.SphereGeometry(.065*u,24,12),material);sideHead.scale.z=.4;sideHead.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(inward.x,inward.y,0));sideHead.position.set(edge.x+inward.x*.105*u,edge.y+inward.y*.105*u,-depth+.21*u);group.add(sideHead);const sideSlot=new THREE.Mesh(new THREE.BoxGeometry(.075*u,.012*u,.008*u),slot.material);sideSlot.quaternion.copy(sideHead.quaternion);sideSlot.position.copy(sideHead.position).addScaledVector(new THREE.Vector3(inward.x,inward.y,0),.027*u);group.add(sideSlot);group.userData.clampAssembly=true;group.userData.screwCount=2;addPart('clamps',group);}
 const inch=4/s.width,depth=s.depth*inch,gap=s.gap*inch,ss=shapes(),mat=finishMaterial(s,art.texture,renderer);
 for(let index=0;index<ss.length;index++){const rawFace=new THREE.ExtrudeGeometry(ss[index],{depth:.045*inch,bevelEnabled:true,bevelThickness:.006*inch,bevelSize:.009*inch,bevelSegments:6,curveSegments:32});rawFace.scale(100,100,100);const face=flatCaps(toCreasedNormals(rawFace,.8));face.scale(.01,.01,.01);uvGeometry(face);const surface=new THREE.Mesh(face,artworkMaterial(mat,index,true,s.finish,art.colors));surface.userData.artIndex=index;surface.userData.faceSurface=true;addPart('face',surface);}
 // Boolean offsetting creates continuous shells even around acute corners and narrow strokes.
 for(let index=0;index<art.loops.length;index++){const letter=art.loops[index],contours=worldContours(letter),mounts=mountingPoints(letter,art.dist,art.w,art.h,s.mountcount,art.labels),clearance=mounts.reduce((n,m)=>Math.max(n,m.clearance*4/art.w),.001),thickness=Math.min(.04*inch,clearance*.22),rings=clippedReturnRings(contours,thickness,window.ClipperLib);for(const region of rings){const ring=new THREE.Shape(region.points.map(p=>new THREE.Vector2(...p)));ring.holes=region.holes.map(h=>new THREE.Path(h.map(p=>new THREE.Vector2(...p))));const raw=new THREE.ExtrudeGeometry(ring,{depth,bevelEnabled:false,steps:1});raw.translate(0,0,-depth);raw.scale(100,100,100);const geometry=toCreasedNormals(raw,.8);geometry.scale(.01,.01,.01);uvGeometry(geometry);const surface=new THREE.Mesh(geometry,artworkMaterial(mat,index,false,s.finish,art.colors));surface.userData.artIndex=index;surface.userData.faceSurface=false;addPart('returns',surface);}}
 const acrylicOptions={clear:{opacity:.25,roughness:.08,faceGlow:.12,edgeGlow:.65},frosted:{opacity:.62,roughness:.7,faceGlow:.75,edgeGlow:.95},opal:{opacity:.94,roughness:.38,faceGlow:1.15,edgeGlow:1.2}}[s.acrylictype]||{opacity:.25,roughness:.08,faceGlow:.12,edgeGlow:.65};const acrylic=new THREE.MeshPhysicalMaterial({color:s.acrylictype==='clear'?'#e4f0f3':'#f4f4ef',emissive:ledColour(s),emissiveIntensity:isLit?s.intensity*acrylicOptions.faceGlow:0,roughness:acrylicOptions.roughness,metalness:0,transparent:true,opacity:acrylicOptions.opacity,clearcoat:1,clearcoatRoughness:.06,side:THREE.DoubleSide,depthWrite:false});acrylic.userData.glowFactor=acrylicOptions.faceGlow;const acrylicEdge=acrylic.clone();acrylicEdge.opacity=Math.max(.6,acrylicOptions.opacity);acrylicEdge.emissiveIntensity=isLit?s.intensity*acrylicOptions.edgeGlow:0;acrylicEdge.userData.glowFactor=acrylicOptions.edgeGlow;for(const shape of ss){const glass=new THREE.Mesh(uvGeometry(new THREE.ExtrudeGeometry(shape,{depth:.1875*inch,bevelEnabled:true,bevelThickness:.005*inch,bevelSize:.005*inch,bevelSegments:2})),[acrylic,acrylicEdge]);glass.position.z=-depth-.1875*inch;addPart('acrylic',glass);}
 const mats=hardwareMaterials(s,isLit),{studMat}=mats;
 for(const l of art.loops){if(isTinyPiece(l,art))continue;const mounts=mountingPoints(l,art.dist,art.w,art.h,s.mountcount,art.labels),scale=letterScale(mounts,art,inch),z=-.06*inch;
  // Rear-facing modules just behind the face; lenses point at the acrylic back.
  const positions=letterLEDs(addPart,parts,art,l,pos,s,scale,mats,{z,lens:-1,wireZ:z-.11*inch});
  // 3–4 mounting assemblies per meaningful piece (s.mountcount), fitted to the available stroke.
 for(const mountPoint of mounts){const p=mountPoint.point,mountStart=parts.studs.children.length,v=pos(p),hardwareInch=inch*mountScale(mountPoint,art,inch),panelBack=-depth-.1875*inch,wallZ=panelBack-gap,studEnd=wallZ-.35*inch;
 // A hollow spacer maintains the wall gap. The threaded stud passes through its bore.
 const spacerShape=new THREE.Shape();spacerShape.absarc(0,0,.21*hardwareInch,0,Math.PI*2,false);const bore=new THREE.Path();bore.absarc(0,0,.142*hardwareInch,0,Math.PI*2,true);spacerShape.holes.push(bore);const spacer=new THREE.Mesh(new THREE.ExtrudeGeometry(spacerShape,{depth:gap,bevelEnabled:true,bevelSize:.006*hardwareInch,bevelThickness:.006*hardwareInch,bevelSegments:2,curveSegments:32}),studMat);spacer.position.set(v.x,v.y,wallZ);addPart('studs',spacer);
 threadedStud(addPart,studMat,v.x,v.y,hardwareInch,{shaftTop:-depth+.15*hardwareInch,end:studEnd,nutTop:-depth+.25*hardwareInch,nutBottom:-depth-.12*hardwareInch,threadTop:panelBack,turns:Math.max(4,Math.round((s.gap+.35)*20))});groupMount(parts,mountStart);addBackClamp(l,mountPoint,depth,hardwareInch,studMat);}
  if(!positions.length)continue;drainMarker(addPart,l,pos,inch,-depth/2);
 }
 return {root,parts};
}
// Halo: blurred copy of the artwork mask in the LED colour on an additive plane just in front of the wall (not simulated light).
// Halo = tight core + wide soft spread, both sized in inches and growing with the wall gap
// (light leaving the back spreads further the further the wall is). Margin m keeps the wide layer unclipped.
export function buildHalo(art,s,isLit,wallZ,height){const inch=4/s.width;return glowPlane(art.glowSource,height,{core:inch*(.4+s.gap),wide:inch*(1+2.5*s.gap),tint:ledColour(s),opacity:isLit?s.intensity*1.15:0,opacityFactor:1.15,z:wallZ+.008});}
// Exploded-view z offsets per part (world units).
export const explodedOffsets={face:.9,returns:.2,leds:.6,acrylic:-.55,studs:-.7,wires:.4,drain:.2,clamps:-.35};
// Inspector title and description per part.
export const componentInfo={
 face:['Metal face','Opaque SS / aluminium face. Its finish follows the artwork or selected metallic finish.'],
 returns:['Metal returns','Smooth metal sidewalls · '+ '1″ standard depth, with an editable custom depth.'],
 leds:['LED module','Rear-facing module with three lenses. Module positions and automatically fitted dimensions are illustrative.'],
 acrylic:['Acrylic back','3/16″ acrylic back, cut to the artwork contours. Clear, frosted and opal options respond to the selected LED colour and intensity.'],
 studs:['Stud + rivnut','Hollow rear spacer with a threaded mounting stud through its bore, plus the rivnut connection. 3–4 uniformly spread mounts per letter; hardware is visually fitted to stroke width. Fabrication dimensions require confirmation.'],
 clamps:['L brackets + screws','At least three small L brackets per letter. Each bracket has two screws: one through the metal return and one through the acrylic back. Positions and sizes are illustrative.'],
 wires:['18 AWG wiring','Illustrative red / white wiring between LED modules inside the letters.'],
 drain:['Drain position','Illustrative bottom drain marker. Final hole position follows fabrication details.']
};
// Sign-type interface read by app.js. Every sign type exports one of these.
export const sign={id:'halo-lit',label:'Halo-lit',standardDepth:1,defaultIntensity:75,build:buildHaloLit,glow:buildHalo,
 // Wall sits behind the acrylic back, across the wall gap.
 wallDepth:s=>{const inch=4/s.width;return s.depth*inch+.1875*inch;},wallGap:s=>s.gap*(4/s.width),
 explodedOffsets,componentInfo,
 parts:[['face','#ad9270','Metal face'],['returns','#8d959e','Metal returns'],['leds','#f5d791','LED modules'],['acrylic','#a8d7e6','3/16″ acrylic back'],['studs','#747c88','Spacers + threaded studs'],['clamps','#9aa4aa','L brackets + screws'],['wires','#bd655c','18 AWG wiring'],['drain','#272b31','Drain position']],
 finishParts:['face','returns'],internalHidden:['face'],assembledHidden:['clamps'],singleParts:['leds','studs','drain','clamps'],
 hints:{assembled:'Opaque metal face and returns. Light exits through the acrylic back and reflects from the wall.',exploded:'Separated layers reveal your metal shell, rear-facing LEDs, acrylic back and wall mounting.',internal:'Face removed to inspect the LEDs and wiring. The LEDs point towards the acrylic back.'},
 specs:(s,led)=>s.depth+'″ depth · 3/16″ acrylic · '+led};
