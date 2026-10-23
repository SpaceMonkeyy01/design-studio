import * as THREE from 'three';
import {ledColour} from './materials.mjs?v=13';
import {glowPlane} from './glow.mjs?v=2';
// Lit acrylic faces, shared by sign types that light an acrylic face from inside (face-lit channel letters, push-through letters):
// the face material and the face glow plane in front of it.
// Lit acrylic face: emissive per unit of intensity (tuned on screenshots: face brighter than the wall, hue not washed to white).
export const FACE_GLOW=2.4;
// Face glow plane in front of a lit face: blur sigmas (inches) and strength.
const GLOW_CORE=.35,GLOW_WIDE=1.4,GLOW=.8;
// The colour a lit acrylic face shows, painted in mask pixels: vinyl artwork, one tint per letter, or white for an all-black logo.
// Near-black artwork stays dark; an all-black logo lights white instead (black by day, white at night).
export function faceColour(art,s){const dark=c=>!c?.colour?.isColor||.2126*c.colour.r+.7152*c.colour.g+.0722*c.colour.b<.012,allDark=art.colors.every(dark);
 const hex=i=>{const c=art.colors[i]?.colour;return c?.isColor?'#'+c.getHexString(THREE.SRGBColorSpace):'#a6a6a6';};
 const tint=x=>art.loops.forEach((l,i)=>{x.fillStyle=hex(i);x.beginPath();for(const loop of [l.points,...l.holes]){loop.forEach((p,k)=>k?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();}x.fill('evenodd');});
 const paint=x=>{if(allDark){x.fillStyle='#ffffff';x.fillRect(0,0,art.w,art.h);}else if(s.facetype==='tinted')tint(x);else x.drawImage(art.texture.image,0,0,art.w,art.h);};
 return {tint,paint};}
// Lit acrylic face material (ledPitch: module spacing, inches): the face colour shines through, brighter over each LED module.
export function acrylicFaceMaterial(art,s,isLit,modules,ledPitch=4){const w=art.w,h=art.h,{tint,paint}=faceColour(art,s),pitch=w*ledPitch/s.width;
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
// Face glow: the lit face colours, blurred, on an additive plane at z, just in front of the face. It reads as light spilling past
// the face, like bloom in a photo of a lit sign. Front only: nothing is added behind the letters.
export function faceGlowPlane(art,s,isLit,height,z){const inch=4/s.width,c=document.createElement('canvas');c.width=art.w;c.height=art.h;const x=c.getContext('2d');faceColour(art,s).paint(x);x.globalCompositeOperation='destination-in';x.drawImage(art.glowSource,0,0);
 return glowPlane(c,height,{core:GLOW_CORE*inch,wide:GLOW_WIDE*inch,opacity:isLit?s.intensity*GLOW:0,opacityFactor:GLOW,z,front:true});}
