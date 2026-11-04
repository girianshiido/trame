import {candidates,key,xy,read,clip,cross,type H,type Board} from './geometry.js';
import type {Level} from './types.js';
import {palette,type ThemeId} from './themes.js';
import {placeLabel,type Box,type V} from './labels.js';

type Model={level:Level;board:Board;selected:string|null;preview:H|null;hover:H|null;complete:boolean};
export function solutionName(label:string):string {
  if(/^Milieu (\d+)$/.test(label))return 'M'+label.slice(7);
  if(label.startsWith('Milieu'))return 'M';
  if(label.startsWith('Partage '))return 'P'+label.slice(8);
  if(label==='Centre')return 'O';
  if(label==='Intersection')return 'I';
  return label;
}
export class GridView {
  canvas:HTMLCanvasElement;
  ctx:CanvasRenderingContext2D;
  size=500;
  pad=8;
  unit=60;
  model!:Model;
  theme:ThemeId;
  private cacheId='';
  private cache=new Map<string,H>();
  private observer:ResizeObserver;

  constructor(canvas:HTMLCanvasElement,theme:ThemeId='aurore'){
    this.canvas=canvas;
    this.ctx=canvas.getContext('2d')!;
    this.theme=theme;
    this.observer=new ResizeObserver(()=>this.draw());
    this.observer.observe(canvas);
  }
  destroy(){this.observer.disconnect();}
  setTheme(theme:ThemeId){this.theme=theme;this.draw();}
  update(model:Model){this.model=model;this.draw();}
  getCandidates(){
    const {board,level}=this.model;
    const id=level.id+'|'+board.lines.join(';')+'|'+board.points.join(';');
    if(id!==this.cacheId){this.cacheId=id;this.cache=candidates(board,level.given.map(g=>g.p),8,level.segments);}
    return this.cache;
  }
  screen(a:H):[number,number]{const [x,y]=xy(a);return [this.pad+x*this.unit,this.size-this.pad-y*this.unit];}
  world(clientX:number,clientY:number):[number,number]{const r=this.canvas.getBoundingClientRect();return [(clientX-r.left-this.pad)/this.unit,(this.size-this.pad-(clientY-r.top))/this.unit];}
  snap(clientX:number,clientY:number):H|null {
    const [x,y]=this.world(clientX,clientY);
    if(x<-.18||x>8.18||y<-.18||y>8.18)return null;
    const threshold=Math.min(.32,14/this.unit);
    let best:H|null=null,d=threshold;
    for(const a of this.getCandidates().values()){
      const [u,v]=xy(a),dist=Math.hypot(u-x,v-y);
      if(dist<d){d=dist;best=a;}
    }
    return best;
  }
  draw(){
    if(!this.model)return;
    const c=this.ctx,sz=this.canvas.getBoundingClientRect().width;
    if(!sz)return;
    const t=palette(this.theme),m=this.model;
    this.size=sz;
    this.pad=8;
    this.unit=(sz-2*this.pad)/8;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    if(this.canvas.width!==Math.round(sz*dpr)||this.canvas.height!==Math.round(sz*dpr)){
      this.canvas.width=Math.round(sz*dpr);this.canvas.height=Math.round(sz*dpr);
    }
    c.setTransform(dpr,0,0,dpr,0,0);
    c.clearRect(0,0,sz,sz);
    c.fillStyle=t.board;c.fillRect(0,0,sz,sz);
    const wash=c.createLinearGradient(0,0,sz,sz);
    wash.addColorStop(0,t.given+'09');wash.addColorStop(1,t.accent+'08');
    c.fillStyle=wash;c.fillRect(0,0,sz,sz);
    const line=(a:[number,number],b:[number,number],color:string,width=1,dash:number[]=[])=>{
      c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.setLineDash(dash);
      c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.setLineDash([]);
    };
    const dot=(a:H,color:string,r=4,ring=false)=>{
      const [x,y]=this.screen(a);
      if(ring){c.beginPath();c.arc(x,y,r+6,0,Math.PI*2);c.fillStyle=color+'22';c.fill();}
      c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();
      c.strokeStyle=t.board;c.lineWidth=1.8;c.stroke();
    };
    const labels:Box[]=[];
    const circleInk=(m.level.circles||[]).map(circle=>({center:this.screen(read(circle.center)),radius:circle.radius[0]/circle.radius[1]*this.unit}));
    const strokes:[V,V][]=m.level.segments.map(([a,b])=>[this.screen(read(a)),this.screen(read(b))]);
    for(const k of m.board.lines){const ends=clip(read(k));if(ends.length===2)strokes.push([[this.pad+ends[0][0]*this.unit,sz-this.pad-ends[0][1]*this.unit],[this.pad+ends[1][0]*this.unit,sz-this.pad-ends[1][1]*this.unit]]);}
    const visiblePoints=[...m.level.given.map(g=>this.screen(read(g.p))),...m.board.points.map(k=>this.screen(read(k)))];
    if(m.complete)for(const target of m.level.targets){if(target.kind==='point')visiblePoints.push(this.screen(read(target.p)));else for(const contact of target.contacts||[])visiblePoints.push(this.screen(read(contact.p)));}
    const centroid=m.level.given.length?m.level.given.reduce((v,g)=>{const q=this.screen(read(g.p));return [v[0]+q[0]/m.level.given.length,v[1]+q[1]/m.level.given.length];},[0,0]):[sz/2,sz/2];
    const label=(a:H,text:string,color:string)=>{
      const point=this.screen(a),[x,y]=point;
      c.font=`650 ${sz<350?12:14}px system-ui,sans-serif`;
      const w=c.measureText(text).width;let away:[number,number]=[0,0],neighbors=0;
      for(const [u,v]of strokes){if(Math.hypot(u[0]-x,u[1]-y)<1){away[0]+=x-v[0];away[1]+=y-v[1];neighbors++;}if(Math.hypot(v[0]-x,v[1]-y)<1){away[0]+=x-u[0];away[1]+=y-u[1];neighbors++;}}
      for(const circle of circleInk)if(Math.abs(Math.hypot(x-circle.center[0],y-circle.center[1])-circle.radius)<2){away[0]+=x-circle.center[0];away[1]+=y-circle.center[1];neighbors++;}
      if(!neighbors)away=[x-centroid[0],y-centroid[1]];
      const box=placeLabel({point,width:w,size:sz,boxes:labels,points:visiblePoints,segments:strokes,circles:circleInk,away});labels.push(box);
      c.textAlign='left';c.textBaseline='middle';c.lineJoin='round';c.lineWidth=4.5;
      c.strokeStyle=t.board;c.strokeText(text,box.x,box.y+box.h/2);
      c.fillStyle=color;c.fillText(text,box.x,box.y+box.h/2);
    };
    for(let i=0;i<=8;i++){
      const x=this.pad+i*this.unit,y=sz-this.pad-i*this.unit;
      const edge=i===0||i===8;
      line([x,this.pad],[x,sz-this.pad],edge?t.node:t.grid,edge?1.1:.8);
      line([this.pad,y],[sz-this.pad,y],edge?t.node:t.grid,edge?1.1:.8);
    }
    c.fillStyle=t.node;
    for(let i=0;i<=8;i++)for(let j=0;j<=8;j++){
      c.beginPath();c.arc(this.pad+i*this.unit,sz-this.pad-j*this.unit,1.45,0,Math.PI*2);c.fill();
    }
    for(const circle of circleInk){
      c.beginPath();c.arc(circle.center[0],circle.center[1],circle.radius,0,Math.PI*2);
      c.fillStyle=t.secondary+'07';c.fill();c.strokeStyle=t.secondary+'b5';c.lineWidth=1.8;c.setLineDash([5,3]);c.stroke();c.setLineDash([]);
    }
    const seg=m.level.segments;
    if(seg.length>=3&&seg[0][0]===seg[seg.length-1][1]){
      c.beginPath();seg.forEach((s,i)=>{const a=this.screen(read(s[0]));if(!i)c.moveTo(...a);c.lineTo(...this.screen(read(s[1])));});
      c.closePath();c.fillStyle=t.given+'12';c.fill();
    }
    for(const [a,b]of seg)line(this.screen(read(a)),this.screen(read(b)),t.given+'c7',2.7);
    const infinite=(k:string,color:string,width:number,dash:number[]=[])=>{
      const ends=clip(read(k));if(ends.length<2)return;
      const screen=(q:number[])=>[this.pad+q[0]*this.unit,sz-this.pad-q[1]*this.unit] as [number,number];
      line(screen(ends[0]),screen(ends[1]),color,width,dash);
    };
    for(const l of m.board.lines){
      const initial=m.level.initialLines.includes(l);
      infinite(l,initial?t.given+'b8':t.accent+'a6',2.1,initial?[7,4]:[]);
    }
    if(m.complete)for(const target of m.level.targets){
      if(target.kind==='line'&&target.segment){
        line(this.screen(read(target.segment[0])),this.screen(read(target.segment[1])),t.win+'d9',3.3);
      }
    }
    c.fillStyle=t.accent+'80';
    for(const [k,a]of this.getCandidates()){
      if(m.board.points.includes(k)||m.level.given.some(g=>g.p===k))continue;
      const [x,y]=xy(a);if(Number.isInteger(x)&&Number.isInteger(y))continue;
      const [sx,sy]=this.screen(a);c.beginPath();c.arc(sx,sy,2.15,0,Math.PI*2);c.fill();
    }
    for(const k of m.board.points)dot(read(k),t.accent,4);
    for(const g of m.level.given){dot(read(g.p),t.given,5);label(read(g.p),g.label||'',t.given);}
    if(m.complete)for(const target of m.level.targets){
      if(target.kind==='point'&&m.board.points.includes(target.p)){
        dot(read(target.p),t.win,5.5,true);label(read(target.p),solutionName(target.label),t.win);
      }
    }
    if(m.complete){
      const annotated=new Set([...m.level.given.map(g=>g.p),...m.level.targets.filter(g=>g.kind==='point').map(g=>g.p)]);
      for(const target of m.level.targets)if(target.kind==='line')for(const contact of target.contacts||[]){if(annotated.has(contact.p))continue;annotated.add(contact.p);dot(read(contact.p),t.win,4.5);label(read(contact.p),contact.label,t.win);}
    }
    if(m.selected){
      dot(read(m.selected),t.secondary,5,true);
      if(m.preview&&key(m.preview)!==m.selected){
        const ends=clip(cross(read(m.selected),m.preview));
        if(ends.length===2)line([this.pad+ends[0][0]*this.unit,sz-this.pad-ends[0][1]*this.unit],[this.pad+ends[1][0]*this.unit,sz-this.pad-ends[1][1]*this.unit],t.accent+'bc',2,[5,4]);
        dot(m.preview,t.secondary,4,true);
      }
    }
    if(m.hover)dot(m.hover,t.secondary,4,true);
  }
}
