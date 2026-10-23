import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createLetterRouter,layoutModules} from './routing.mjs?v=10';
import {ledColour} from './materials.mjs?v=13';
// Internal hardware shared by every sign type: part groups, LED modules with routed wiring, threaded studs, drain markers.
// Sizes are illustrative and scaled per letter so hardware fits narrow strokes.
// One group per named part under a root. addPart(name, obj) adds a shadow-casting mesh to that part.
export function partSet(names){const root=new THREE.Group(),parts={};for(const name of names){parts[name]=new THREE.Group();root.add(parts[name]);}
 const addPart=(name,obj)=>{if(!parts[name]){parts[name]=new THREE.Group();root.add(parts[name]);}parts[name].add(obj);obj.castShadow=true;obj.receiveShadow=true;return obj;};
 return {root,parts,addPart};}
export function box(addPart,x,y,z,w,h,d,mat,part){const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(w,h,d)*.16),mat);m.position.set(x,y,z);return addPart(part,m);}
export function rod(addPart,a,b,r,mat,part){a=new THREE.Vector3(...a);b=new THREE.Vector3(...b);const v=b.clone().sub(a);if(v.length()<.00001)return;const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v.length(),32),mat);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.clone().normalize());m.position.copy(a.add(b).multiplyScalar(.5));return addPart(part,m);}
export function wirePath(addPart,points,radius,mat){const curve=new THREE.CurvePath();for(let i=1;i<points.length;i++)curve.add(new THREE.LineCurve3(new THREE.Vector3(...points[i-1]),new THREE.Vector3(...points[i])));if(!curve.curves.length)return;const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(12,points.length*6),radius,12,false),mat);addPart('wires',mesh);}
// Creation order matters: material ids decide draw order of coincident surfaces, so keep module, lens, stud, red, white.
export function hardwareMaterials(s,isLit){const moduleMat=new THREE.MeshStandardMaterial({color:'#efeee8',roughness:.45}),lensMat=new THREE.MeshStandardMaterial({color:'#f3e4be',emissive:ledColour(s),emissiveIntensity:isLit?.7:0}),studMat=new THREE.MeshStandardMaterial({color:'#a0a2a4',metalness:.85,roughness:.3}),wireRed=new THREE.MeshStandardMaterial({color:'#cf3938',roughness:.5}),wireWhite=new THREE.MeshStandardMaterial({color:'#ededde',roughness:.6});lensMat.userData.ledLens=true;
 return {moduleMat,lensMat,studMat,wireRed,wireWhite};}
// Pieces under 8 px² or 0.2% of the largest piece get no LEDs or hardware.
export const isTinyPiece=(l,art)=>l.area<Math.max(8,...art.loops.map(l=>l.area*.002));
// Hardware scale for one letter (1 = full size), from the widest stroke clearance at its mounts.
export function letterScale(mounts,art,inch){const maxClearance=mounts.reduce((n,m)=>Math.max(n,m.clearance),0)*4/art.w;return Math.min(1,Math.max(.06,maxClearance/(.45*inch)));}
export const mountScale=(mount,art,inch)=>Math.min(.72,mount.clearance*4/art.w/(.36*inch));
// LED modules laid out inside one letter, chained by A*-routed red/white wires. Returns module positions (mask px).
// z: module centre. lens: +1 lenses face the front, -1 the back. wireZ: red wire depth; the white wire sits .06 module-inch further along lens.
export function letterLEDs(addPart,parts,art,l,pos,s,scale,mats,{z,lens,wireZ,spacing}){const inch=4/s.width,componentInch=inch*scale,{moduleMat,lensMat,wireRed,wireWhite}=mats;
 const router=createLetterRouter(l,art.mask,art.w,art.h,Math.max(1.5,art.w*.055/s.width*scale),Math.max(1,Math.round(art.w/420)),art.labels);const hw=art.w*.38/s.width*scale,hh=art.w*.17/s.width*scale;
 const positions=layoutModules(l,art.mask,art.dist,art.w,art.h,hw,hh,spacing??Math.max(8,art.w*1.8/s.width*scale));let previous=null;
 for(const p of positions){const moduleStart=parts.leds?.children.length||0;const v=pos(p);box(addPart,v.x,v.y,z,.72*componentInch,.28*componentInch,.08*componentInch,moduleMat,'leds');for(const dx of [-.22,0,.22]){const lensMesh=new THREE.Mesh(new THREE.SphereGeometry(.09*componentInch,32,20),lensMat);lensMesh.position.set(v.x+dx*componentInch,v.y,z+lens*.045*componentInch);addPart('leds',lensMesh);}const module=new THREE.Group();module.userData.module=true;const moduleMeshes=parts.leds.children.slice(moduleStart);moduleMeshes.forEach(m=>{m.position.x-=v.x;m.position.y-=v.y;module.add(m);});module.position.set(v.x,v.y,0);module.rotation.z=-(p[2]||0);parts.leds.add(module);
  if(previous){const route=router.route(previous,p);if(route){const world=route.map(q=>{const v=pos(q);return [v.x,v.y,wireZ];});wirePath(addPart,world,.018*componentInch,wireRed);wirePath(addPart,world.map(q=>[q[0],q[1],q[2]+lens*.06*componentInch]),.018*componentInch,wireWhite);}}previous=p;}
 return positions;}
// Threaded mounting stud with a nut/rivnut collar and a helical thread, at (x,y), sized by h (hardware inch).
// Shaft runs shaftTop → end, collar nutTop → nutBottom, thread threadTop → end.
export function threadedStud(addPart,mat,x,y,h,{shaftTop,end,nutTop,nutBottom,threadTop,turns}){rod(addPart,[x,y,shaftTop],[x,y,end],.122*h,mat,'studs');rod(addPart,[x,y,nutTop],[x,y,nutBottom],.18*h,mat,'studs');const length=threadTop-end,points=[];for(let n=0;n<=turns*12;n++){const t=n/(turns*12),a=t*turns*Math.PI*2;points.push(new THREE.Vector3(x+Math.cos(a)*.122*h,y+Math.sin(a)*.122*h,threadTop-t*length));}const thread=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.min(640,turns*12),.009*h,6,false),mat);addPart('studs',thread);}
// Group the stud meshes added since `start` into one mount, so the inspector and picking treat it as one assembly.
export function groupMount(parts,start){const mount=new THREE.Group();mount.userData.mount=true;parts.studs.children.slice(start).forEach(m=>mount.add(m));parts.studs.add(mount);return mount;}
// Drain / weep-hole marker at the letter's lowest point, at depth z.
export function drainMarker(addPart,l,pos,inch,z){const bottom=l.points.reduce((a,b)=>a[1]>b[1]?a:b),v=pos(bottom);const marker=new THREE.Mesh(new THREE.SphereGeometry(.07*inch,32,16),new THREE.MeshStandardMaterial({color:'#101416'}));marker.position.set(v.x,v.y+.01,z);return addPart('drain',marker);}
