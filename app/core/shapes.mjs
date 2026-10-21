import * as THREE from 'three';
// Artwork space → world space, shared by every sign type. Artwork width = 4 units, centred, y up.
export function artSpace(art){const pos=(p)=>new THREE.Vector2((p[0]/art.w-.5)*4,(art.h/2-p[1])/art.w*4);
 const shapes=()=>art.loops.map(l=>{const s=new THREE.Shape(l.points.map(pos));s.holes=l.holes.map(p=>new THREE.Path(p.map(pos)));return s;});
 // UVs in artwork space, so artwork textures line up on any extruded part.
 const uv=g=>{const p=g.attributes.position,uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i)/4+.5,p.getY(i)/(4*art.h/art.w)+.5);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));return g;};
 // World-space contours of one traced letter: outline first, then its holes, as [x,y] pairs for Clipper.
 const contours=l=>[l.points,...l.holes].map(loop=>loop.map(p=>{const v=pos(p);return [v.x,v.y];}));
 return {pos,shapes,uv,contours};}
// toCreasedNormals smooths the cap outline into the bevel; the cap's long edge-to-edge triangles then
// interpolate tilted normals across the whole face, which mirror finishes show as shards. Make caps exactly flat.
export function flatCaps(g){const p=g.attributes.position,n=g.attributes.normal;let lo=Infinity,hi=-Infinity;for(let i=0;i<p.count;i++){lo=Math.min(lo,p.getZ(i));hi=Math.max(hi,p.getZ(i));}const eps=(hi-lo)*1e-4;for(let i=0;i<p.count;i+=3)for(const [z,nz] of [[hi,1],[lo,-1]])if([0,1,2].every(k=>Math.abs(p.getZ(i+k)-z)<eps))for(let k=0;k<3;k++)n.setXYZ(i+k,0,0,nz);n.needsUpdate=true;return g;}
