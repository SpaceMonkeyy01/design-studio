// Trace the visible artwork into closed boundaries, preserving counters and holes.
export function traceMask(mask,w,h){
 const edges=new Map(), key=(x,y)=>y*(w+1)+x;
 const put=(x,y,nx,ny)=>{let k=key(x,y);if(!edges.has(k))edges.set(k,[]);edges.get(k).push([nx,ny]);};
 const on=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&mask[y*w+x];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(on(x,y)){
  if(!on(x,y-1))put(x,y,x+1,y);if(!on(x+1,y))put(x+1,y,x+1,y+1);
  if(!on(x,y+1))put(x+1,y+1,x,y+1);if(!on(x-1,y))put(x,y+1,x,y);
 }
 const loops=[];let remaining=[...edges.values()].reduce((a,b)=>a+b.length,0);
 while(remaining){let start;for(const [k,v] of edges)if(v.length){start=[k%(w+1),Math.floor(k/(w+1))];break;}
  if(!start)break;let p=start,prev=null,loop=[],guard=remaining+1;
  do{loop.push(p);let options=edges.get(key(...p));if(!options?.length)break;let pick=0;
   if(options.length>1&&prev){const dx=p[0]-prev[0],dy=p[1]-prev[1];let best=-10;options.forEach((q,i)=>{const nx=q[0]-p[0],ny=q[1]-p[1];const rank=dx*ny-dy*nx; if(rank>best){best=rank;pick=i;}});}
   const next=options.splice(pick,1)[0];remaining--;prev=p;p=next;
  }while((p[0]!==start[0]||p[1]!==start[1])&&--guard>0);
  const simple=loop.filter((v,i)=>{const a=loop[(i+loop.length-1)%loop.length],b=loop[(i+1)%loop.length];return (v[0]-a[0])*(b[1]-v[1])!==(v[1]-a[1])*(b[0]-v[0]);});
  const area=simple.reduce((s,p,i)=>{const q=simple[(i+1)%simple.length];return s+p[0]*q[1]-q[0]*p[1];},0)/2;
  if(simple.length>=3&&Math.abs(area)>=0.5)loops.push({points:simple,area});
 }
 return loops;
}
export function contains(points,p){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function groupLoops(loops){const outer=loops.filter(l=>l.area>0).map(l=>({...l,holes:[]}));for(const hole of loops.filter(l=>l.area<0)){const owners=outer.filter(l=>contains(l.points,hole.points[0])).sort((a,b)=>a.area-b.area);if(owners.length)owners[0].holes.push(hole.points);}return outer;}
export function kelvinRGB(k){const t=k/100;let r=t<=66?255:329.698727446*Math.pow(t-60,-.1332047592);let g=t<=66?99.4708025861*Math.log(t)-161.1195681661:288.1221695283*Math.pow(t-60,-.0755148492);let b=t>=66?255:t<=19?0:138.5177312231*Math.log(t-10)-305.0447927307;return [r,g,b].map(v=>Math.max(0,Math.min(255,v))/255);}

function distanceToSegment(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
function simplifyOpen(points,tolerance){if(points.length<3)return points;let distance=0,index=0;for(let i=1;i<points.length-1;i++){const d=distanceToSegment(points[i],points[0],points.at(-1));if(d>distance){distance=d;index=i;}}return distance>tolerance?[...simplifyOpen(points.slice(0,index+1),tolerance).slice(0,-1),...simplifyOpen(points.slice(index),tolerance)]:[points[0],points.at(-1)];}
export function smoothContour(points,tolerance=1.25){if(points.length<5)return points;let far=1,distance=0;for(let i=1;i<points.length;i++){const d=Math.hypot(points[i][0]-points[0][0],points[i][1]-points[0][1]);if(d>distance){distance=d;far=i;}}let p=[...simplifyOpen(points.slice(0,far+1),tolerance).slice(0,-1),...simplifyOpen([...points.slice(far),points[0]],tolerance).slice(0,-1)];
 // Protect designed corners; only round low-curvature raster stair steps.
 for(let pass=0;pass<4;pass++){const out=[];for(let i=0;i<p.length;i++){const a=p[(i+p.length-1)%p.length],v=p[i],b=p[(i+1)%p.length],u=[v[0]-a[0],v[1]-a[1]],w=[b[0]-v[0],b[1]-v[1]],lu=Math.hypot(...u),lw=Math.hypot(...w),angle=Math.acos(Math.max(-1,Math.min(1,(u[0]*w[0]+u[1]*w[1])/(lu*lw||1))));if(angle>.64&&Math.min(lu,lw)>Math.max(8,distance*.06)){out.push(v);}else{out.push([v[0]*.75+a[0]*.25,v[1]*.75+a[1]*.25],[v[0]*.75+b[0]*.25,v[1]*.75+b[1]*.25]);}}p=out;}return p;
}
export function smoothLoops(loops,tolerance=1.25){return loops.map(l=>({...l,points:smoothContour(l.points,tolerance)}));}

// Smooth contour normals stop alternating raster edges from reflecting as stripes.
export function returnShell(contours,depth,thickness){const positions=[],normals=[],uv=[];
 const push=(p,n)=>{positions.push(...p);normals.push(...n);uv.push(p[0]/4+.5,p[1]);};
 for(const loop of contours){const len=loop.length,edges=loop.map((a,i)=>{const b=loop[(i+1)%len],dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1;return [-dy/d,dx/d];});const vertex=edges.map((n,i)=>{const previous=edges[(i+len-1)%len],x=n[0]+previous[0],y=n[1]+previous[1],d=Math.hypot(x,y)||1;return [x/d,y/d];});const inset=loop.map((p,i)=>{const n=vertex[i],k=Math.min(thickness*3,thickness/Math.max(.25,n[0]*edges[i][0]+n[1]*edges[i][1]));return [p[0]-n[0]*k,p[1]-n[1]*k];});
  for(let i=0;i<len;i++){const j=(i+1)%len,a=loop[i],b=loop[j],ia=inset[i],ib=inset[j],e=edges[i];const pick=k=>{const n=vertex[k],prev=edges[(k+len-1)%len],next=edges[k];return prev[0]*next[0]+prev[1]*next[1]<.8?e:n;};const na=pick(i),nb=pick(j);const tri=(a,b,c,na,nb,nc)=>{push(a,na);push(b,nb);push(c,nc);};
   const A=[...a,0],B=[...b,0],C=[...b,-depth],D=[...a,-depth],I=[...ia,0],J=[...ib,0],K=[...ib,-depth],L=[...ia,-depth],an=[...na,0],bn=[...nb,0];tri(A,C,D,an,bn,an);tri(A,B,C,an,bn,bn);const ai=[-na[0],-na[1],0],bi=[-nb[0],-nb[1],0];tri(I,K,J,ai,bi,bi);tri(I,L,K,ai,ai,bi);tri(A,J,B,[0,0,1],[0,0,1],[0,0,1]);tri(A,I,J,[0,0,1],[0,0,1],[0,0,1]);tri(D,K,L,[0,0,-1],[0,0,-1],[0,0,-1]);tri(D,C,K,[0,0,-1],[0,0,-1],[0,0,-1]);
  }
 }return {positions,normals,uv};
}

export function insetContour(loop,thickness){const normals=loop.map((a,i)=>{const b=loop[(i+1)%loop.length],dx=b[0]-a[0],dy=b[1]-a[1],n=Math.hypot(dx,dy)||1;return [-dy/n,dx/n];});return loop.map((p,i)=>{const a=normals[(i+loop.length-1)%loop.length],b=normals[i],nx=a[0]+b[0],ny=a[1]+b[1],len=Math.hypot(nx,ny)||1,n=[nx/len,ny/len],amount=Math.min(thickness*3,thickness/Math.max(.25,n[0]*b[0]+n[1]*b[1]));return [p[0]-n[0]*amount,p[1]-n[1]*amount];});}
