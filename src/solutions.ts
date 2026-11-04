import {legalPoint,lineThrough,gridLines,key,read,onSegment,type Board} from './geometry.js';
import {solved,type Level,type Step} from './types.js';

export function replaySolution(level:Level,steps:Step[]=level.steps):Board|null {
  const board:Board={points:[],lines:[...level.initialLines]},given=level.given.map(g=>g.p);
  for(const step of steps){
    if(step.kind==='point'){
      if(step.via){
        const grid=new Set(gridLines().map(key));
        if(step.via.some(line=>!grid.has(line)&&!board.lines.includes(line)&&!level.segments.some(([a,b])=>lineThrough(a,b)===line&&onSegment(read(step.p),read(a),read(b)))))return null;
      }
      if(!legalPoint(step.p,board,given,8,level.segments))return null;
      if(!board.points.includes(step.p))board.points.push(step.p);
    }else{
      if(!legalPoint(step.a,board,given,8,level.segments)||!legalPoint(step.b,board,given,8,level.segments))return null;
      const line=lineThrough(step.a,step.b);if(!line)return null;
      if(!board.lines.includes(line))board.lines.push(line);
    }
  }
  return board;
}

/** A given segment is already active. Extend it only if later steps need its outside support. */
export function reuseGivenStrokes(level:Level):Level {
  let steps=[...level.steps];
  const supports=new Set(level.segments.map(([a,b])=>lineThrough(a,b)));
  const required=new Set(level.targets.filter(t=>t.kind==='line').map(t=>t.line));
  let changed=true;
  while(changed){
    changed=false;
    for(let i=0;i<steps.length;i++){
      const step=steps[i];if(step.kind!=='line')continue;
      const line=lineThrough(step.a,step.b);
      if(!line||!supports.has(line)||required.has(line))continue;
      const proposed=steps.filter((_,index)=>index!==i),board=replaySolution(level,proposed);
      if(board&&solved(level,board)){steps=proposed;changed=true;break;}
    }
  }
  steps=steps.map(step=>{
    if(step.kind!=='line')return step;
    const line=lineThrough(step.a,step.b);
    return line&&supports.has(line)&&!required.has(line)?{...step,text:'Prolonger le segment donné : une intersection utile est au-delà de ses extrémités.'}:step;
  });
  return {...level,steps,par:steps.length};
}
