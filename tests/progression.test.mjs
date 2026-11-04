import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {canPlay,canVisitChapter,nextPuzzle,resumePuzzle,chapterDone} from '../.tools/progression.js';
import {fresh,validate} from '../.tools/persistence.js';
import {themes} from '../.tools/themes.js';
const {levels}=JSON.parse(fs.readFileSync(new URL('../src/content.json',import.meta.url)));
const finish=(save,level)=>save.results[level.id]={stars:3,moves:1};

test('Nouvelle partie : seul le premier niveau est ouvert',()=>{
  const save=fresh();assert.ok(canPlay(levels[0],levels,save));
  assert.equal(levels.filter(l=>canPlay(l,levels,save)).length,1);
  assert.ok(canVisitChapter(1,levels,save));assert.ok(!canVisitChapter(2,levels,save));
});
test('Progression complète : un seul nouveau niveau par réussite, chapitre suivant après 15',()=>{
  const save=fresh();
  levels.forEach((level,index)=>{
    assert.equal(nextPuzzle(levels,save).id,level.id);
    assert.ok(canPlay(level,levels,save));
    if(index+1<levels.length)assert.ok(!canPlay(levels[index+1],levels,save));
    const chapter=Math.floor(index/15)+1;
    if(index%15!==14&&chapter<21)assert.ok(!canVisitChapter(chapter+1,levels,save));
    finish(save,level);
    if(index%15===14&&chapter<21)assert.ok(canVisitChapter(chapter+1,levels,save));
  });
  assert.equal(nextPuzzle(levels,save),undefined);
  assert.equal(levels.filter(l=>canPlay(l,levels,save)).length,315);
});
test('Anciennes réussites : rejouables sans contourner les prérequis manquants',()=>{
  const save=fresh();finish(save,levels[45]);save.current=levels[46].id;
  save.drafts[levels[46].id]={points:['2,2,1'],lines:[]};
  assert.ok(canPlay(levels[45],levels,save));assert.ok(canVisitChapter(4,levels,save));
  assert.ok(!canPlay(levels[46],levels,save));
  assert.equal(resumePuzzle(save.current,levels,save).id,'1-1');
  assert.deepEqual(validate(JSON.parse(JSON.stringify(save))),save);
});
test('Thèmes : migrations et exports conservent la progression',()=>{
  const old={version:1,current:'1-2',results:{'1-1':{stars:3,moves:2}},drafts:{'1-2':{points:['2,2,1'],lines:[]}},sound:true};
  const upgraded=validate(old);assert.equal(upgraded.theme,'aurore');assert.deepEqual(upgraded.results,old.results);assert.deepEqual(upgraded.drafts,old.drafts);
  for(const theme of themes){const save={...upgraded,theme:theme.id};assert.deepEqual(validate(JSON.parse(JSON.stringify(save))),save);}
  assert.equal(validate({...old,theme:'missing'}).theme,'aurore');
});
test('Chapitre terminé : coche uniquement après les 15 réussites, tous les niveaux rejouables',()=>{
  const save=fresh();levels.slice(0,14).forEach(level=>finish(save,level));
  assert.ok(!chapterDone(1,levels,save));finish(save,levels[14]);
  assert.ok(chapterDone(1,levels,save));assert.ok(!chapterDone(2,levels,save));
  assert.ok(levels.slice(0,15).every(level=>canPlay(level,levels,save)));
});
