export type V=readonly[number,number];
export type Box={x:number;y:number;w:number;h:number};
export type CircleInk={center:V;radius:number};
type Layout={point:V;width:number;height?:number;size:number;boxes:Box[];points:V[];segments:readonly[V,V][];circles:CircleInk[];away?:V};
const overlaps=(a:Box,b:Box)=>a.x<b.x+b.w+3&&a.x+a.w>b.x-3&&a.y<b.y+b.h+3&&a.y+a.h>b.y-3;
export function segmentHitsBox(a:V,b:V,box:Box):boolean {
  let lo=0,hi=1;const d=[b[0]-a[0],b[1]-a[1]];
  for(let axis=0;axis<2;axis++){
    const min=(axis===0?box.x:box.y)-2,max=min+(axis===0?box.w:box.h)+4;
    if(Math.abs(d[axis])<1e-9){if(a[axis]<min||a[axis]>max)return false;continue;}
    let t0=(min-a[axis])/d[axis],t1=(max-a[axis])/d[axis];
    if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return false;
  }
  return true;
}
export function placeLabel(layout:Layout):Box {
  const {point:[x,y],width:w,size,boxes,points,segments,circles}=layout,h=layout.height||17;
  const away=layout.away||[0,0],length=Math.hypot(...away)||1;
  let best:Box={x:x+10,y:y-18,w,h},score=Infinity;
  for(const gap of [10,20,30]){
    const candidates=[
      [x+gap,y-h-gap/2],[x+gap,y+gap/2],[x-w-gap,y+gap/2],[x-w-gap,y-h-gap/2],
      [x-w-gap,y-h/2],[x+gap,y-h/2],[x-w/2,y+gap],[x-w/2,y-h-gap]
    ];
    for(const [px,py]of candidates){
      const box={x:px,y:py,w,h},cx=px+w/2,cy=py+h/2;
      const dx=cx-x,dy=cy-y,distance=Math.hypot(dx,dy)||1;
      let value=(gap-10)*.7-(dx*away[0]+dy*away[1])/distance/length*12;
      if(px<3||py<3||px+w>size-3||py+h>size-3)value+=10000;
      value+=boxes.filter(b=>overlaps(box,b)).length*1200;
      value+=points.filter(p=>Math.hypot(p[0]-x,p[1]-y)>1&&p[0]>px-5&&p[0]<px+w+5&&p[1]>py-5&&p[1]<py+h+5).length*1200;
      value+=segments.filter(([a,b])=>segmentHitsBox(a,b,box)).length*220;
      for(const circle of circles){
        const nearX=Math.max(px,Math.min(circle.center[0],px+w)),nearY=Math.max(py,Math.min(circle.center[1],py+h));
        const min=Math.hypot(nearX-circle.center[0],nearY-circle.center[1]);
        const max=Math.max(...[[px,py],[px+w,py],[px,py+h],[px+w,py+h]].map(p=>Math.hypot(p[0]-circle.center[0],p[1]-circle.center[1])));
        if(min<=circle.radius+3&&max>=circle.radius-3)value+=260;
      }
      if(value<score){score=value;best=box;}
    }
  }
  return {x:Math.max(3,Math.min(size-w-3,best.x)),y:Math.max(3,Math.min(size-h-3,best.y)),w,h};
}
