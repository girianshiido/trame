import test from 'node:test';
import assert from 'node:assert/strict';
import {GridView,solutionName} from '../.tools/board.js';
import {themes} from '../.tools/themes.js';

test('Rendu : pas de graduations ; réponses nommées seulement après réussite, dans les six thèmes',()=>{
  const texts=[],strokes=[];
  const ctx=new Proxy({fillText:text=>texts.push(text),stroke:()=>strokes.push(ctx.strokeStyle),measureText:text=>({width:text.length*8}),createLinearGradient:()=>({addColorStop:()=>{}})},{get:(target,name)=>name in target?target[name]:()=>{}});
  const canvas={width:0,height:0,getContext:()=>ctx,getBoundingClientRect:()=>({width:365,left:0,top:0})};
  globalThis.window={devicePixelRatio:2};globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  const level={id:'test',given:[{p:'2,2,1',label:'B'},{p:'6,2,1',label:'C'}],segments:[['2,2,1','6,2,1']],initialLines:[],targets:[{kind:'point',p:'4,2,1',label:'A'},{kind:'line',line:'1,1,-4',label:'Segment image',segment:['0,4,1','4,0,1']}]};
  for(const theme of themes){
    const view=new GridView(canvas,theme.id);texts.length=0;
    view.update({level,board:{points:[],lines:[]},selected:null,hover:null,preview:null,complete:false});
    assert.deepEqual(texts,['B','C']);
    texts.length=0;
    view.update({level,board:{points:['4,2,1'],lines:['1,1,-4']},selected:null,hover:null,preview:null,complete:true});
    assert.deepEqual(texts,['B','C','A']);
    assert.ok(strokes.includes(theme.accent+'a6'),'Les traits auxiliaires restent translucides');
    assert.ok(strokes.includes(theme.win+'d9'),'Le segment final est mis en évidence');
    assert.ok(!texts.some(t=>/^\d+$/.test(t)));view.destroy();
  }
  assert.equal(solutionName('Milieu de [AB]'),'M');assert.equal(solutionName('Partage 2'),'P2');
});
