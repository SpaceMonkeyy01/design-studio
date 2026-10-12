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
