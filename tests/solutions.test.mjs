import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {p,key,read,cross,mid,on,scale,same,gridLines,lineThrough,onSegment} from '../.tools/geometry.js';
import {replaySolution,reuseGivenStrokes} from '../.tools/solutions.js';
import {Construction} from '../scripts/geometric-solutions.mjs';
const {levels}=JSON.parse(fs.readFileSync(new URL('../src/content.json',import.meta.url)));
const empty=()=>({id:'proof',given:[],segments:[],initialLines:[],targets:[]});
test('Constructions flottantes : les parallèles, milieux et perpendiculaires suivent les données',()=>{
 for(const offset of [0,1,2]){
  const a=p(13+offset,17,7),b=p(41,31+offset,7),c=p(26,43+offset,11),level=empty();level.given=[a,b,c].map((q,i)=>({p:key(q),label:'ABC'[i]}));
  const plan=new Construction(level),parallel=plan.parallel(c,a,b),direction=cross(a,b),l=read(parallel.k);
  assert.ok(on(l,c));assert.equal(l[0]*direction[1]-l[1]*direction[0],0n);
  assert.ok(same(plan.ratio(a,b,1,2),mid(a,b)));
  const normal=read(plan.perpendicular(c,a,b).k);assert.ok(on(normal,c));assert.equal(normal[0]*direction[0]+normal[1]*direction[1],0n);
  assert.ok(same(plan.ratio(a,b,2,3),scale(b,a,2,3)));
 }
});
test('Chaque point hors grille du corrigé est déduit de deux traits visibles, jamais d’une coordonnée cible',()=>{
 const grid=new Set(gridLines().map(key));
 for(const level of levels){const board={points:[],lines:[...level.initialLines]};
  for(const step of level.steps){
   if(step.kind==='line'){board.lines.push(lineThrough(step.a,step.b));continue;}
   const q=read(step.p),node=q[0]%q[2]===0n&&q[1]%q[2]===0n;
   assert.ok(node||step.via,level.id+' '+step.p);
   if(step.via){assert.equal(key(cross(...step.via.map(read))),step.p);for(const l of step.via)assert.ok(grid.has(l)||board.lines.includes(l)||level.segments.some(([a,b])=>lineThrough(a,b)===l&&onSegment(q,read(a),read(b))),level.id+' invisible parent');}
   board.points.push(step.p);
  }
 }
});
test('Les segments donnés ne sont pas retracés quand le corrigé fonctionne déjà sans leur prolongement',()=>{
 for(const level of levels){const optimized=reuseGivenStrokes(level);assert.equal(optimized.steps.length,level.steps.length,level.id);assert.ok(replaySolution(level),level.id);}
 const middle=levels.find(l=>l.id==='1-5'),ab=lineThrough(middle.given[0].p,middle.given[1].p);
 assert.ok(!middle.steps.some(s=>s.kind==='line'&&lineThrough(s.a,s.b)===ab));
});
test('Tangentes : quinze configurations, cercles dans le cadre et tangence exacte',()=>{
 const tangents=levels.filter(l=>l.chapter===20);assert.equal(tangents.length,15);
 for(const level of tangents){assert.ok(level.circles?.length);
  for(const c of level.circles){const o=read(c.center),[rn,rd]=c.radius.map(BigInt);assert.ok(o[0]*rd>=rn*o[2]&&o[1]*rd>=rn*o[2]&&(8n*o[2]-o[0])*rd>=rn*o[2]&&(8n*o[2]-o[1])*rd>=rn*o[2]);}
  for(const target of level.targets.filter(t=>t.kind==='line'))for(const index of target.circles){const circle=level.circles[index],[a,b,c]=read(target.line),o=read(circle.center),[rn,rd]=circle.radius.map(BigInt),s=a*o[0]+b*o[1]+c*o[2];assert.equal(s*s*rd*rd,rn*rn*o[2]*o[2]*(a*a+b*b),level.id);}
 }
 assert.equal(tangents.at(-1).targets.length,4);
});
test('Cercles : les contacts et premières tangentes fournis sont de vraies données de la figure',()=>{
 for(const level of levels.filter(l=>l.chapter===20)){
  const givens=Object.fromEntries(level.given.map(g=>[g.label,read(g.p)]));
  for(const name of ['A','B'])if(givens[name]){
   const point=givens[name],circle=level.circles[0],center=read(circle.center),[rn,rd]=circle.radius.map(BigInt);
   const dx=point[0]*center[2]-center[0]*point[2],dy=point[1]*center[2]-center[1]*point[2];
   assert.equal((dx*dx+dy*dy)*rd*rd,rn*rn*point[2]*point[2]*center[2]*center[2],level.id);
  }
  if(givens.P)for(const target of level.targets)assert.ok(on(read(target.line),givens.P));
 }
});

test('Grand Atelier final : centre de gravité puis tangente, sans centre donné',()=>{
 const level=levels.find(l=>l.id==='21-15'),[a,b,c]=level.given.map(g=>read(g.p));
 assert.equal(level.given.map(g=>g.label).join(''),'ABC');
 const center=read(level.circles[0].center);assert.ok(same(center,scale(scale(a,b,1,2),c,2,3)));
 assert.equal(key(center),'4,4,1');const target=level.targets.find(t=>t.kind==='line'),[x,y,z]=read(target.line),[rn,rd]=level.circles[0].radius.map(BigInt),s=x*center[0]+y*center[1]+z*center[2];assert.equal(s*s*rd*rd,rn*rn*center[2]*center[2]*(x*x+y*y));
 assert.ok(on(read(target.line),a));assert.ok(replaySolution(level));
});
