import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {p,key,read,cross,mid,mean,inside,on,candidates,lineThrough,legalPoint,reflect,rotate,scale} from '../.tools/geometry.js';
import {solved} from '../.tools/types.js';
import {fresh,validate,load,persist} from '../.tools/persistence.js';
const {levels,chapters}=JSON.parse(fs.readFileSync(new URL('../src/content.json',import.meta.url)));
test('315 puzzles, 21 chapitres, 15 niveaux chacun',()=>{assert.equal(levels.length,315);assert.equal(chapters.length,21);assert.equal(new Set(levels.map(l=>l.id)).size,315);for(const ch of chapters)assert.equal(levels.filter(l=>l.chapter===ch.id).length,15);});
for(const level of levels)test(`Solution bornée et légale : ${level.id} ${level.title}`,()=>{
 const given=level.given.map(a=>a.p),board={points:[],lines:[...level.initialLines]};
 assert.ok(!solved(level,board));
 for(const g of level.given){assert.ok(inside(read(g.p)));assert.ok(g.label);}
 for(const t of level.targets)if(t.kind==='point')assert.ok(inside(read(t.p)));
 for(const step of level.steps){if(step.kind==='point'){assert.ok(inside(read(step.p)),`Point extérieur ${step.p}`);assert.ok(legalPoint(step.p,board,given,8,level.segments),`Point non constructible ${step.p}`);board.points.push(step.p);}else{for(const k of [step.a,step.b]){assert.ok(inside(read(k)),`Extrémité extérieure ${k}`);assert.ok(legalPoint(k,board,given,8,level.segments),`Extrémité non constructible ${k}`);}assert.notEqual(step.a,step.b);board.lines.push(lineThrough(step.a,step.b));}}
 assert.ok(solved(level,board));assert.ok(board.lines.length<=200);assert.ok(board.points.length<=200);
 // Validation must ignore unrelated auxiliary objects and the path to the answer.
 const minimal={points:level.targets.filter(t=>t.kind==='point').map(t=>t.p),lines:level.targets.filter(t=>t.kind==='line').map(t=>t.line)};
 assert.ok(solved(level,minimal));minimal.lines.push(key(cross(p(0,0),p(8,0))));assert.ok(solved(level,minimal));
});
test('Rationnels : intersections, milieux, rotations, réflexions',()=>{
 const a=p(5,4,3),b=p(17,19,3),m=mid(a,b);assert.equal(key(m),'22,23,6');
 const l=cross(p(0,0),p(3,1)),t=cross(p(0,1),p(3,0));assert.equal(key(cross(l,t)),'3,1,2');
 assert.deepEqual(reflect(reflect(a,l),l),a);assert.deepEqual(scale(scale(a,p(4,4),-1),p(4,4),-1),a);
 let r=a;for(let i=0;i<4;i++)r=rotate(r,p(4,4));assert.deepEqual(r,a);
 assert.equal(key(mean([p(1,1),p(7,2),p(2,7)],[1,2,3])),'21,26,6');
});
test('Tous les candidats restent à l’intérieur, bords inclus',()=>{const b={points:[],lines:[key(cross(p(0,1),p(1,0))),key(cross(p(7,8),p(8,7)))]};for(const a of candidates(b,[]).values())assert.ok(inside(a));assert.ok(!legalPoint(key(p(-1,0)),b,[]));assert.ok(legalPoint(key(p(8,8)),b,[]));});
test('Centres : points, fil et surface ne sont pas confondus',()=>{
 const L=levels.find(l=>l.id==='17-7');assert.equal(L.targets[0].p,'24,16,5');
 const wire=levels.find(l=>l.id==='11-10');assert.ok(wire.lesson.includes('longueur'));assert.ok(wire.targets.length===1);
});
test('Sauvegardes : validation, restauration et corruption',()=>{const s=fresh();s.results['1-1']={stars:3,moves:2};s.drafts['1-2']={points:[key(p(2,2))],lines:[]};assert.deepEqual(validate(JSON.parse(JSON.stringify(s))),s);assert.throws(()=>validate({version:2}));const db=new Map(),storage={getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,v)};assert.ok(persist(storage,s));assert.deepEqual(load(storage).save,s);db.set('trame-save-v1','broken');assert.deepEqual(load(storage).save,s);assert.ok(load(storage).error);assert.equal(persist({setItem:()=>{throw Error('quota');}},s),false);});

test('Les segments de départ sont actifs, y compris hors des nœuds',()=>{const a=p(2,1),b=p(5,6),ls=key(cross(p(2,4),p(3,3))),board={points:[],lines:[ls]},seg=[[key(a),key(b)]];const crossing=cross(cross(a,b),read(ls));assert.ok(legalPoint(key(crossing),board,[key(a),key(b)],8,seg));const withGrid=cross(cross(a,b),cross(p(3,0),p(3,8)));assert.ok(legalPoint(key(withGrid),{points:[],lines:[]},[],8,seg));const extended=cross(cross(a,b),cross(p(0,0),p(0,8)));assert.ok(!legalPoint(key(extended),{points:[],lines:[]},[],8,seg));});

test('Figures images : placer les seuls sommets ne suffit plus ; tout tracé exact convient',()=>{
 for(const level of levels.filter(l=>l.targets.some(t=>t.kind==='line'&&t.segment))){
  const points=level.targets.filter(t=>t.kind==='point').map(t=>t.p);
  assert.ok(!solved(level,{points,lines:[...level.initialLines]}),level.id);
  const lines=level.targets.filter(t=>t.kind==='line').map(t=>t.line);
  assert.ok(solved(level,{points:[...points].reverse(),lines:[...lines].reverse()}),level.id);
  for(const t of level.targets.filter(t=>t.kind==='line'&&t.segment)){
   assert.ok(inside(read(t.segment[0]))&&inside(read(t.segment[1])));
   assert.equal(lineThrough(...t.segment),t.line);
  }
 }
 const rotation=levels.find(l=>l.id==='14-3');
 assert.equal(rotation.targets.filter(t=>t.kind==='line'&&t.segment).length,1);
 assert.ok(rotation.goal.includes('segment [A′B′]'));
});
