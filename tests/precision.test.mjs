import test from 'node:test';
import assert from 'node:assert/strict';
import {p,key,grid,candidates,cross} from '../.tools/geometry.js';
import {magnifierPoints} from '../.tools/precision.js';

test('Loupe : tous les points du rectangle visible, même au-delà des huit plus proches',()=>{
  const points=magnifierPoints(grid(),[4,4],25);
  assert.ok(points.length>8);
  assert.ok(points.some(point=>key(point)===key(p(6,5))),'Un point à droite, visible dans l’image, reste sélectionnable');
  assert.ok(!points.some(point=>key(point)===key(p(7,4))));
});
test('Loupe : les croisements de droites visibles ne sont pas limités à un cercle de proximité',()=>{
  const line=key(cross(p(0,1),p(8,5)));
  const all=candidates({points:[],lines:[line]},[]);
  const visible=magnifierPoints(all.values(),[3,2],35);
  const crossing=p(4,3);
  assert.ok(all.has(key(crossing)));
  assert.ok(visible.some(point=>key(point)===key(crossing)));
});
