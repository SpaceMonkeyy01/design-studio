// core/placement.mjs: a camera recovered from four corners must see the rectangle exactly where they were clicked,
// and must match the camera that took the (synthetic) photo when the shot has real perspective.
import {cameraFromCorners,projectPoint,convex} from '../app/core/placement.mjs';
const norm=a=>{const l=Math.hypot(...a);return a.map(v=>v/l);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
// A camera at `position` looking at `target` (y up), focal length f pixels.
const camera=(position,target,f)=>{const z=norm(position.map((v,i)=>v-target[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);return {position,x,y,z,focal:f};};
const W=1024,H=683,panel={w:10,h:2.5,z:-.3},corners=(c,h=panel.h)=>[[-panel.w/2,h/2],[panel.w/2,h/2],[panel.w/2,-h/2],[-panel.w/2,-h/2]].map(([x,y])=>projectPoint(c,[x,y,panel.z],W,H));
let failed=0;const check=(name,ok,detail)=>{console.log((ok?'ok   ':'FAIL ')+name+(detail?' · '+detail:''));if(!ok)failed++;};
const cases=[['three-quarter from the left, below',camera([-6,-2.5,9],[1,.5,panel.z],900)],['steep side angle, long lens',camera([9,1,5],[0,0,panel.z],2200)],['looking up at a fascia, wide lens',camera([-2,-5,6],[0,0,panel.z],520)]];
for(const [name,truth] of cases){const q=corners(truth),cam=cameraFromCorners(q,W,H,{panelWidth:panel.w,wallZ:panel.z});
 if(!cam){check(name,false,'no camera');continue;}
 const back=corners(cam),err=Math.max(...back.map((p,i)=>Math.hypot(p[0]-q[i][0],p[1]-q[i][1]))),pos=Math.hypot(...cam.position.map((v,i)=>v-truth.position[i]));
 check(name,cam.lensSolved&&err<.01&&pos<1e-6*100&&Math.abs(cam.focal-truth.focal)<1e-3&&Math.abs(cam.panelHeight-panel.h)<1e-6,`reprojection ${err.toExponential(1)} px, position ${pos.toExponential(1)}, f ${cam.focal.toFixed(1)}/${truth.focal}, panel height ${cam.panelHeight.toFixed(4)}`);}
// Straight-on in one direction (verticals parallel): the lens cannot be measured, the fallback is used, the corners still fit.
{const truth=camera([5,0,8],[0,0,panel.z],900),q=corners(truth),cam=cameraFromCorners(q,W,H,{panelWidth:panel.w,wallZ:panel.z}),err=cam&&Math.max(...corners(cam,cam.panelHeight).map((p,i)=>Math.hypot(p[0]-q[i][0],p[1]-q[i][1])));
 check('eye-level shot uses the fallback lens and still fits',cam&&!cam.lensSolved&&err<.01,cam&&`reprojection ${err.toFixed(3)} px, f ${cam.focal.toFixed(0)}`);}
// Placement: the sign centre lands at the requested spot on the rectangle (across 0.25, down 0.5 → left quarter).
{const truth=cases[0][1],q=corners(truth),cam=cameraFromCorners(q,W,H,{panelWidth:panel.w,wallZ:panel.z,place:{across:.25,down:.5}}),p=projectPoint(cam,[0,0,panel.z],W,H),want=projectPoint(truth,[-panel.w/4,0,panel.z],W,H);
 check('sign centre placed a quarter across',Math.hypot(p[0]-want[0],p[1]-want[1])<.01);}
check('bow-tie corners are rejected',cameraFromCorners([[0,0],[100,100],[100,0],[0,100]],W,H,{panelWidth:1})===null&&!convex([[0,0],[100,100],[100,0],[0,100]]));
if(failed){console.error(failed+' placement check(s) failed');process.exit(1);}console.log('PLACEMENT_OK');
