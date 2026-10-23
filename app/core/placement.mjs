// Place the sign in a photograph: recover the photo's camera from four clicked corners of a flat rectangle
// (a fascia, a panel). Pure maths, no THREE, so it runs in node tests. Shared by every sign type.
// Image coordinates: pixels, x right, y down, principal point at the photo centre, square pixels.
// Corners in order: top-left, top-right, bottom-right, bottom-left (of the rectangle as it stands on the wall).
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],len=a=>Math.hypot(...a),scale=(a,k)=>a.map(v=>v*k),sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
// Homography taking the unit square (s right, t down) to the quad (Heckbert). Columns: s, t, origin.
export function squareToQuad(q){const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]=q,dx1=x1-x2,dx2=x3-x2,dx3=x0-x1+x2-x3,dy1=y1-y2,dy2=y3-y2,dy3=y0-y1+y2-y3;
 if(Math.abs(dx3)<1e-9&&Math.abs(dy3)<1e-9)return [[x1-x0,y1-y0,0],[x3-x0,y3-y0,0],[x0,y0,1]];
 const den=dx1*dy2-dx2*dy1;if(Math.abs(den)<1e-12)return null;const g=(dx3*dy2-dx2*dy3)/den,h=(dx1*dy3-dx3*dy1)/den;
 return [[x1-x0+g*x1,y1-y0+g*y1,g],[x3-x0+h*x3,y3-y0+h*y3,h],[x0,y0,1]];}
// A convex quad with all four corners turning the same way; anything else cannot be a rectangle seen by a camera.
export function convex(q){let sign=0;for(let i=0;i<4;i++){const a=q[i],b=q[(i+1)%4],c=q[(i+2)%4],z=(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);if(Math.abs(z)<1e-6)return false;if(sign&&Math.sign(z)!==sign)return false;sign=Math.sign(z);}return true;}
// Focal length (pixels) from the rectangle's right angle: the two vanishing directions are perpendicular.
// Undefined when an edge pair is parallel in the photo (a straight-on shot); then `fallbackFov` (horizontal, degrees,
// over the photo's long side) is used. Any focal length fits exactly when one pair is parallel, so the fallback costs little.
export function focalLength(H,photoW,photoH,fallbackFov=60){const long=Math.max(photoW,photoH),fallback=long/2/Math.tan(fallbackFov*Math.PI/360),[h1,h2]=H,gh=h1[2]*h2[2];
 if(Math.abs(gh)>1e-14){const f2=-(h1[0]*h2[0]+h1[1]*h2[1])/gh;if(f2>0){const f=Math.sqrt(f2);if(f>.4*long&&f<4*long)return {f,solved:true};}}return {f:fallback,solved:false};}
// Camera pose that sees the rectangle at `corners`. World: x right, y up, z out of the wall (the studio's axes).
// panelWidth: the rectangle's real width in world units. centre: [x,y] of the sign in world. place.across/down: where
// the sign centre sits on the rectangle (0–1 from its left/top edge). wallZ: the rectangle's plane.
// Returns null for corners no camera could see as a rectangle. Otherwise a three.js-style camera: position, basis axes
// x/y/z (z points back, out of the photo), vertical fov in degrees, aspect; plus the rectangle's height in world units.
export function cameraFromCorners(corners,photoW,photoH,{panelWidth,centre=[0,0],place={across:.5,down:.5},wallZ=0,fallbackFov=60}){
 if(!corners||corners.length!==4||!convex(corners))return null;const H=squareToQuad(corners.map(([x,y])=>[x-photoW/2,y-photoH/2]));if(!H)return null;
 const {f,solved}=focalLength(H,photoW,photoH,fallbackFov),g1=[H[0][0]/f,H[0][1]/f,H[0][2]],g2=[H[1][0]/f,H[1][1]/f,H[1][2]],g3=[H[2][0]/f,H[2][1]/f,H[2][2]];
 let k=len(g1)/panelWidth;const panelHeight=len(g2)/k;if(g3[2]<0)k=-k; // the rectangle must be in front of the camera
 const r1=scale(g1,1/k/panelWidth),r2a=scale(g2,1/k/panelHeight),r2=sub(r2a,scale(r1,dot(r1,r2a))),r2n=scale(r2,1/len(r2)),r3=cross(r1,r2n),T=scale(g3,1/k);
 // World → camera (computer-vision axes: x right, y down, z forward) maps wall right → r1, wall down (−y) → r2, out of wall (+z) → −r3.
 const rows=[[r1[0],-r2n[0],-r3[0]],[r1[1],-r2n[1],-r3[1]],[r1[2],-r2n[2],-r3[2]]],topLeft=[centre[0]-place.across*panelWidth,centre[1]+place.down*panelHeight,wallZ];
 const position=sub(topLeft,[0,1,2].map(j=>rows[0][j]*T[0]+rows[1][j]*T[1]+rows[2][j]*T[2]));
 return {position,x:rows[0],y:scale(rows[1],-1),z:scale(rows[2],-1),fov:2*Math.atan(photoH/2/f)*180/Math.PI,aspect:photoW/photoH,focal:f,lensSolved:solved,panelHeight,topLeft};}
// Project a world point through a camera from cameraFromCorners into photo pixels (for tests and the corner overlay).
export function projectPoint(cam,p,photoW,photoH){const d=sub(p,cam.position),xc=dot(d,cam.x),yc=dot(d,cam.y),zc=-dot(d,cam.z);return [photoW/2+cam.focal*xc/zc,photoH/2-cam.focal*yc/zc];}
