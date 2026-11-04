import test from 'node:test';
import assert from 'node:assert/strict';
import {AttemptClock,newAttempt,formatRecordTime} from '../.tools/attempt.js';
import {fresh,validate,mergeSaves,resetSave} from '../.tools/persistence.js';
import {recordResult,achievements,unlockAchievements} from '../.tools/records.js';
import fs from 'node:fs';
const {levels}=JSON.parse(fs.readFileSync(new URL('../src/content.json',import.meta.url)));
test('Chrono : activation, pauses, reprise et restauration sans compter le temps absent',()=>{
 let now=0;const clock=new AttemptClock(()=>now);now=5000;assert.equal(clock.snapshot().elapsedMs,0);
 clock.begin();now=6200;clock.step();clock.pause();assert.equal(clock.snapshot().elapsedMs,1200);assert.equal(clock.snapshot().steps,1);
 now=90000;assert.equal(clock.snapshot().elapsedMs,1200);clock.resume();now=90500;clock.pause();assert.equal(clock.snapshot().elapsedMs,1700);
 const saved=clock.snapshot(),restored=new AttemptClock(()=>now);restored.restore(saved);now=200000;assert.equal(restored.snapshot().elapsedMs,1700);
 restored.resume();now=200300;restored.pause();assert.equal(restored.snapshot().elapsedMs,2000);assert.equal(formatRecordTime(120),'0,120 s');
});
test('Records : minima indépendants ; un brouillon ancien ne crée pas de faux record',()=>{
 let result=recordResult(undefined,{...newAttempt(),started:true,steps:8,elapsedMs:25000});
 result=recordResult(result,{...newAttempt(),started:true,steps:3,elapsedMs:45000,undos:1});
 assert.equal(result.bestTimeMs,25000);assert.equal(result.bestSteps,3);assert.equal(result.attempts,2);
 const legacy=recordResult(undefined,{...newAttempt(false),started:true,steps:1,elapsedMs:100});
 assert.equal(legacy.bestTimeMs,undefined);assert.equal(legacy.bestSteps,undefined);
 const repeated=recordResult(result,{...newAttempt(),recorded:true,started:true,steps:10,elapsedMs:90000});assert.equal(repeated.attempts,2);
});
test('Migrations et imports : chronos et meilleurs résultats sont conservés',()=>{
 const a=fresh(),b=fresh();a.results['1-1']={stars:3,moves:3,bestTimeMs:2000,bestSteps:3,attempts:2};b.results['1-1']={stars:3,moves:2,bestTimeMs:3000,bestSteps:2,attempts:4};
 a.attempts['21-2']={...newAttempt(),started:true,elapsedMs:1234,steps:2};a.achievements.first=100;
 b.achievements.first=200;
 const merged=mergeSaves(a,b);assert.equal(merged.results['1-1'].bestTimeMs,2000);assert.equal(merged.results['1-1'].bestSteps,2);assert.equal(merged.achievements.first,100);
 assert.deepEqual(validate(JSON.parse(JSON.stringify(a))),a);
 const old=validate({version:1,current:'1-1',results:{'1-1':{stars:3,moves:0}},drafts:{},sound:false});assert.deepEqual(old.attempts,{});assert.equal(old.results['1-1'].bestSteps,undefined);
});
test('Succès : temps et étapes ne sont jamais déduits des anciennes sauvegardes',()=>{
 const save=fresh();save.results['1-1']={stars:3,moves:0};const first=unlockAchievements(save,levels,100);assert.ok(first.some(a=>a.id==='first'));assert.ok(!first.some(a=>['minute','one-step'].includes(a.id)));
 save.results['1-2']=recordResult(undefined,{...newAttempt(),started:true,steps:1,elapsedMs:8000});unlockAchievements(save,levels,200);
 assert.ok(save.achievements['ten-seconds']);assert.ok(save.achievements['one-step']);assert.equal(save.achievements.first,100);assert.equal(unlockAchievements(save,levels,300).length,0);
 assert.equal(achievements(save,levels).length,15);
});
test('Remise à zéro : toutes les données de jeu sont effacées, les préférences restent',()=>{
 const save=fresh();save.theme='boreal';save.sound=true;save.current='21-15';save.results['21-14']={stars:3,moves:5,bestTimeMs:4000};save.achievements.first=123;save.drafts.free={points:['2,2,1'],lines:[]};save.attempts['21-15']=newAttempt();
 const cleared=resetSave(save);assert.deepEqual(cleared,{...fresh(),theme:'boreal',sound:true});assert.ok(save.results['21-14']);
});
