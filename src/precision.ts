import {xy,type H} from './geometry.js';

/** Select the same rectangle that the magnifier draws, without a nearest-N cap. */
export function magnifierPoints(points:Iterable<H>,center:[number,number],unit:number,width=520,height=400,zoom=4):H[]{
  const halfX=(width/2+3)/(unit*zoom),halfY=(height/2+3)/(unit*zoom);
  return [...points].filter(point=>{
    const [x,y]=xy(point);
    return Math.abs(x-center[0])<=halfX&&Math.abs(y-center[1])<=halfY;
  }).sort((a,b)=>{
    const [ax,ay]=xy(a),[bx,by]=xy(b);
    return Math.hypot(ax-center[0],ay-center[1])-Math.hypot(bx-center[0],by-center[1]);
  });
}
