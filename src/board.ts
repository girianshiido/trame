import {candidates,key,xy,read,clip,cross,type H,type Board} from './geometry';
import type {Level} from './types';
type Model={level:Level;board:Board;selected:string|null;preview:H|null;hover:H|null;complete:boolean};
export class GridView {
 canvas:HTMLCanvasElement; ctx:CanvasRenderingContext2D; size=500; pad=30; unit=55; model!:Model;
 private cacheId=''; private cache=new Map<string,H>();
 constructor(canvas:HTMLCanvasElement){this.canvas=canvas;this.ctx=canvas.getContext('2d')!;new ResizeObserver(()=>this.draw()).observe(canvas);}
 update(model:Model){this.model=model;this.draw();}
 getCandidates(){const {board,level}=this.model;const id=level.id+'|'+board.lines.join(';')+'|'+board.points.join(';');if(id!==this.cacheId){this.cacheId=id;this.cache=candidates(board,level.given.map(g=>g.p),8,level.segments);}return this.cache;}
 screen(a:H):[number,number]{const [x,y]=xy(a);return [this.pad+x*this.unit,this.size-this.pad-y*this.unit];}
 world(clientX:number,clientY:number):[number,number]{const r=this.canvas.getBoundingClientRect();return [(clientX-r.left-this.pad)/this.unit,(this.size-this.pad-(clientY-r.top))/this.unit];}
 snap(clientX:number,clientY:number):H|null {const [x,y]=this.world(clientX,clientY);if(x<-.18||x>8.18||y<-.18||y>8.18)return null;const cs=this.getCandidates();const threshold=Math.min(.32,13/this.unit);let best:H|null=null,d=threshold;for(const a of cs.values()){const [u,v]=xy(a),dist=Math.hypot(u-x,v-y);if(dist<d){d=dist;best=a;}}return best;}
 draw(){if(!this.model)return;const c=this.ctx,sz=this.canvas.getBoundingClientRect().width;if(!sz)return;this.size=sz;this.pad=sz<350?23:32;this.unit=(sz-2*this.pad)/8;const dpr=Math.min(window.devicePixelRatio||1,2);if(this.canvas.width!==Math.round(sz*dpr)){this.canvas.width=Math.round(sz*dpr);this.canvas.height=Math.round(sz*dpr);}c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,sz,sz);c.fillStyle='#fcfbf6';c.fillRect(0,0,sz,sz);
  const line=(a:[number,number],b:[number,number],color:string,width=1,dash:number[]=[])=>{c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.setLineDash([]);};
  const dot=(a:H,color:string,r=4,ring=false)=>{const [x,y]=this.screen(a);if(ring){c.beginPath();c.arc(x,y,r+5,0,Math.PI*2);c.fillStyle=color+'20';c.fill();}c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();c.strokeStyle='#fcfbf6';c.lineWidth=1.6;c.stroke();};
  c.font=`${sz<350?9:10}px ui-monospace, monospace`;c.textAlign='center';c.textBaseline='middle';for(let i=0;i<=8;i++){const x=this.pad+i*this.unit,y=sz-this.pad-i*this.unit;line([x,this.pad],[x,sz-this.pad],i===0||i===8?'#9baea8':'#dce4dd');line([this.pad,y],[sz-this.pad,y],i===0||i===8?'#9baea8':'#dce4dd');c.fillStyle='#7c8c83';c.fillText(String(i),x,sz-this.pad+13);c.fillText(String(i),this.pad-13,y);}
  c.fillStyle='#b8c7bd';for(let i=0;i<=8;i++)for(let j=0;j<=8;j++){c.beginPath();c.arc(this.pad+i*this.unit,sz-this.pad-j*this.unit,1.25,0,Math.PI*2);c.fill();}
  const m=this.model; if(m.level.segments.length>=3){const seg=m.level.segments,closed=seg[0][0]===seg[seg.length-1][1];if(closed){c.beginPath();seg.forEach((s,i)=>{const a=this.screen(read(s[0]));if(i===0)c.moveTo(...a);c.lineTo(...this.screen(read(s[1])));});c.closePath();c.fillStyle='#1e6d6110';c.fill();}}
  for(const [a,b] of m.level.segments)line(this.screen(read(a)),this.screen(read(b)),'#236a60',2.2);
  const infinite=(k:string,color:string,width:number,dash:number[]=[])=>{const ends=clip(read(k));if(ends.length<2)return;const screen=(q:number[])=>[this.pad+q[0]*this.unit,sz-this.pad-q[1]*this.unit] as [number,number];line(screen(ends[0]),screen(ends[1]),color,width,dash);};
  for(const l of m.board.lines)infinite(l,m.level.initialLines.includes(l)?'#216c63':m.complete?'#287a69':'#d0774d',1.8,m.level.initialLines.includes(l)?[6,4]:[]);
  // Visible tiny crossing marks advertise usable intersections, without selecting them.
  const cs=this.getCandidates();c.fillStyle='#cc956c80';for(const [k,a]of cs){if(m.board.points.includes(k)||m.level.given.some(g=>g.p===k))continue;const [x,y]=xy(a);if(Number.isInteger(x)&&Number.isInteger(y))continue;const [sx,sy]=this.screen(a);c.beginPath();c.arc(sx,sy,2.1,0,Math.PI*2);c.fill();}
  for(const k of m.board.points)dot(read(k),m.complete?'#287a69':'#c5673e',3.7);
  for(const g of m.level.given){const a=read(g.p);dot(a,'#1b5b51',4.5);const [x,y]=this.screen(a);c.font=`600 ${sz<350?11:12}px system-ui,sans-serif`;c.textAlign='left';c.textBaseline='middle';const label=g.label||'';const dx=x>sz-45?-17:8,dy=y<this.pad+12?14:-10;c.lineWidth=4;c.strokeStyle='#fcfbf6';c.strokeText(label,x+dx,y+dy);c.fillStyle='#164d44';c.fillText(label,x+dx,y+dy);}
  if(m.selected){dot(read(m.selected),'#e28b44',5,true);if(m.preview&&key(m.preview)!==m.selected){const ends=clip(cross(read(m.selected),m.preview));if(ends.length===2)line([this.pad+ends[0][0]*this.unit,sz-this.pad-ends[0][1]*this.unit],[this.pad+ends[1][0]*this.unit,sz-this.pad-ends[1][1]*this.unit],'#d77e43',2,[4,4]);dot(m.preview,'#e28b44',4,true);}}
  if(m.hover)dot(m.hover,'#e28b44',4,true);
 }
}
