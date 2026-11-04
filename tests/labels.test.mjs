import test from 'node:test';
import assert from 'node:assert/strict';
import {placeLabel,segmentHitsBox} from '../.tools/labels.js';
const layout=(point,away,segments=[])=>({point,width:10,size:300,boxes:[],points:[],segments,circles:[],away});
test('Lettres : à l’extérieur des côtés plutôt que systématiquement en haut à droite',()=>{
 const a=placeLabel(layout([70,150],[-1,0],[[[70,150],[230,150]]]));
 const b=placeLabel(layout([230,150],[1,0],[[[70,150],[230,150]]]));
 assert.ok(a.x+a.w<70);assert.ok(b.x>230);
 assert.ok(!segmentHitsBox([70,150],[230,150],a));assert.ok(!segmentHitsBox([70,150],[230,150],b));
});
test('Lettres : courbe du cercle, bords et autres noms sont évités',()=>{
 const a=placeLabel({...layout([150,60],[0,-1]),circles:[{center:[150,150],radius:90}]});assert.ok(a.y+a.h<60);
 const b=placeLabel({...layout([294,6],[1,-1]),boxes:[a]});assert.ok(b.x>=3&&b.y>=3&&b.x+b.w<=297&&b.y+b.h<=297);
});
