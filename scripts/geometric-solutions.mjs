import {p,key,read,cross,norm,xy,inside,on,mid,mean,scale,affine,rotate,reflect,intersection,grid,gridLines,candidates,legalPoint,lineThrough,same,onSegment} from '../.tools/geometry.js';
import {solved} from '../.tools/types.js';
const NODES=grid(),GL=gridLines();
const isNode=q=>q[0]%q[2]===0n&&q[1]%q[2]===0n;
const abs=n=>n<0n?-n:n;
const rational=(n,d=1n)=>{const h=norm(BigInt(n),0n,BigInt(d));return [h[0],h[2]];};
const root=n=>{if(n<0n)throw Error('Negative root');if(n<2n)return n;let a=n,b=(a+1n)/2n;while(b<a){a=b;b=(a+n/a)/2n;}if(a*a!==n)throw Error('Non-rational length');return a;};
export function rationalLength(a,b){const dx=a[0]*b[2]-b[0]*a[2],dy=a[1]*b[2]-b[1]*a[2],d=a[2]*b[2];return rational(root(dx*dx+dy*dy),d);}
export class Construction {
 constructor(level){this.level=level;this.steps=[];this.board={points:[],lines:[...level.initialLines]};this.given=level.given.map(g=>g.p);this.fixed=new Map();this.parallelCache=new Map();}
 mark(q,text='Marquer l’intersection des deux traits indiqués.',via){
  if(!q||!inside(q))throw Error('Point outside frame');const k=key(q);
  if(this.given.includes(k)||this.board.points.includes(k))return q;
  if(!legalPoint(k,this.board,this.given,8,this.level.segments))throw Error('Unconstructed point '+k);
  this.steps.push({kind:'point',p:k,text,...(via?{via:via.map(r=>r.k)}:{})});this.board.points.push(k);return q;
 }
 join(a,b,text='Relier les deux points indiqués.'){
  if(same(a,b))throw Error('Coincident join');const k=key(cross(a,b));
  const ref={k,a,b};
  if(this.board.lines.includes(k)||GL.some(l=>key(l)===k))return ref;
  const segment=this.level.segments.find(([u,v])=>lineThrough(u,v)===k);
  if(segment)return {...ref,segment};
  this.draw(ref,text);return ref;
 }
 draw(ref,text='Tracer la droite par les deux points indiqués.'){
  if(this.board.lines.includes(ref.k))return ref;
  for(const a of [ref.a,ref.b])if(!legalPoint(key(a),this.board,this.given,8,this.level.segments))throw Error('Illegal line endpoint '+key(a));
  this.steps.push({kind:'line',a:key(ref.a),b:key(ref.b),text});this.board.lines.push(ref.k);return ref;
 }
 at(ref,q){
  if(this.board.lines.includes(ref.k)||GL.some(l=>key(l)===ref.k))return;
  if(ref.segment&&onSegment(q,read(ref.segment[0]),read(ref.segment[1])))return;
  this.draw(ref,ref.segment?'Prolonger le segment donné pour atteindre une intersection au-delà de ses extrémités.':'Tracer la droite auxiliaire.');
 }
 meet(a,b,text){const q=intersection(read(a.k),read(b.k));if(!q||!inside(q))throw Error('Intersection outside frame');this.at(a,q);this.at(b,q);return this.mark(q,text,[a,b]);}
 axis(axis,n,d=1){const q=norm(axis===0?BigInt(d):0n,axis===1?BigInt(d):0n,-BigInt(n));const k=key(q);if(GL.some(l=>key(l)===k))return {k,a:axis===0?p(n,0,d):p(0,n,d),b:axis===0?p(n,8*d,d):p(8*d,n,d)};
  const a=axis===0?this.fixedPoint(p(n,2*d,d)):this.fixedPoint(p(2*d,n,d));
  const b=axis===0?this.fixedPoint(p(n,6*d,d)):this.fixedPoint(p(6*d,n,d));
  return this.join(a,b,'Créer un repère auxiliaire en partageant des carreaux en deux.');
 }
 fixedPoint(q){
  if(isNode(q))return q;const k=key(q);if(this.fixed.has(k))return this.fixed.get(k);
  const [x,y,w]=q;if((w&(w-1n))!==0n)throw Error('Scaffold must be dyadic');
  if(x===0n||x===8n*w){const a=this.fixedPoint(norm(w,y,w)),b=this.fixedPoint(norm(2n*w,y,w));const r=this.meet(this.join(a,b),this.axis(0,x===0n?0:8),'Reporter le repère sur le bord.');this.fixed.set(k,r);return r;}
  if(y===0n||y===8n*w){const a=this.fixedPoint(norm(x,w,w)),b=this.fixedPoint(norm(x,2n*w,w));const r=this.meet(this.join(a,b),this.axis(1,y===0n?0:8),'Reporter le repère sur le bord.');this.fixed.set(k,r);return r;}
  const dx=x%2n?1n:2n,dy=y%2n?1n:2n;
  const corners=[norm(x-dx,y-dy,w),norm(x+dx,y+dy,w),norm(x-dx,y+dy,w),norm(x+dx,y-dy,w)].map(a=>this.fixedPoint(a));
  const r=this.meet(this.join(corners[0],corners[1]),this.join(corners[2],corners[3]),'Les diagonales de ce rectangle donnent le centre du petit carreau.');
  if(!same(r,q))throw Error('Wrong dyadic scaffold');this.fixed.set(k,r);return r;
 }
 parallel(c,a,b){
  if(same(a,b))throw Error('Parallel direction undefined');const base=this.join(a,b),l=read(base.k),ck=key(c)+'|'+base.k;
  if(this.parallelCache.has(ck))return this.parallelCache.get(ck);
  if(on(l,c))return base;
  const wanted=norm(l[0]*c[2],l[1]*c[2],-l[0]*c[0]-l[1]*c[1]);
  const already=[...GL,...this.board.lines.map(read)].find(line=>same(line,wanted));
  if(already){const ends=NODES.filter(q=>on(already,q));if(ends.length>=2)return {k:key(already),a:ends[0],b:ends[ends.length-1]};}
  // Integer displacements can be read directly when all three input points are grid nodes.
  if(isNode(a)&&isNode(b)&&isNode(c)){
   const pair=NODES.find(q=>!same(q,c)&&on(wanted,q));
   if(pair){const r=this.join(c,pair,'Reporter la direction donnée en comptant les carreaux.');this.parallelCache.set(ck,r);return r;}
  }
  let best;
  for(let depth=0;depth<=4&&!best;depth++){
   const den=2**depth,max=8*den;
   for(let axis=0;axis<2;axis++)for(let i=0;i<=max-2;i++){
    const eq=j=>norm(axis===0?BigInt(den):0n,axis===1?BigInt(den):0n,-BigInt(j));
    const qs=[i,i+1,i+2].map(j=>intersection(l,eq(j)));
    if(qs.some(q=>!q||!inside(q)))continue;
    for(const reverse of [false,true]){
     const [u,m,v]=reverse?[qs[2],qs[1],qs[0]]:qs;if(same(v,c))continue;
     const vc=cross(v,c),uc=cross(u,c);
     for(const g of GL){
      const aux=intersection(vc,g);if(!aux||!inside(aux)||same(aux,v)||same(aux,c)||same(aux,m)||same(aux,u))continue;
      const q=intersection(uc,cross(m,aux));if(!q||!inside(q)||same(q,v)||same(q,u)||same(aux,u))continue;
      const s=intersection(cross(v,q),cross(u,aux));if(!s||!inside(s)||same(s,c))continue;
      const result=cross(c,s);if(!same(result,wanted))throw Error('Parallel identity failed');
      const cost=[u,m,v,aux,q,s].filter(pt=>!isNode(pt)&&!this.given.includes(key(pt))&&!this.board.points.includes(key(pt))).length+depth*10;
      if(!best||cost<best.cost)best={u,m,v,axis,i,den,reverse,aux,g,q,s,cost};
     }
    }
   }
  }
  if(!best)throw Error('No bounded parallel '+ck);
  const f=best;
  const axes=[this.axis(f.axis,f.i,f.den),this.axis(f.axis,f.i+1,f.den),this.axis(f.axis,f.i+2,f.den)];
  const refs=f.reverse?axes.reverse():axes;
  const u=this.meet(base,refs[0],'Choisir un premier repère sur la direction donnée.'),m=this.meet(base,refs[1],'Le repère central est au milieu : les parallèles de la grille sont régulièrement espacées.'),v=this.meet(base,refs[2],'Le troisième repère complète ces deux intervalles égaux.');
  const aux=this.meet(this.join(v,c),{k:key(f.g)},'Choisir un point auxiliaire sur cette droite.');
  const q=this.meet(this.join(u,c),this.join(m,aux),'Croiser les deux droites auxiliaires.');
  const s=this.meet(this.join(v,q),this.join(u,aux),'Le quadrilatère complet reporte la direction sans mesurer les coordonnées du point donné.');
  const result=this.join(c,s,'Tracer la parallèle passant par le point donné.');this.parallelCache.set(ck,result);return result;
 }
 ratio(a,b,num,den=1){
  if(!den)throw Error('Zero ratio');if(same(a,b))return a;if(den<0){num=-num;den=-den;}let aa=Math.abs(num),bb=den;while(bb){const r=aa%bb;aa=bb;bb=r;}num/=aa;den/=aa;if(num===0)return a;if(num===den)return b;
  if(isNode(a)&&isNode(b)){
   const target=scale(b,a,num,den);
   if(isNode(target))return this.mark(target,'Partager le déplacement entre les deux points donnés en comptant les carreaux.');
   // Rectangle diagonals are the direct, visible construction of half-cell midpoints.
   if(num*2===den){const [ax,ay]=xy(a),[bx,by]=xy(b);
    if(ax!==bx&&ay!==by){return this.meet(this.join(a,b),this.join(p(ax,by),p(bx,ay)),'Les diagonales du rectangle se coupent au milieu du segment donné.');}
    const ref=this.join(a,b);const axis=ax===bx?1:0;const value=axis===0?xy(target)[0]:xy(target)[1];
    if(Number.isInteger(value))return this.meet(ref,this.axis(axis,value),'Le comptage des carreaux détermine le milieu.');
   }
  }
  const base=this.join(a,b),direction=read(base.k);
  let chosen;
  for(const center of [p(4,4),p(3,4),p(4,3),p(5,4),p(4,5)]){
   if(on(direction,center))continue;
   const carrier=this.parallel(center,a,b),cl=read(carrier.k);
   for(let depth=0;depth<=7&&!chosen;depth++){
    const d=2**depth,max=8*d;
    for(let axis=0;axis<2&&!chosen;axis++)for(let start=0;start<=max&&!chosen;start++)for(const sign of [-1,1]){
     const indexes=[start,start+sign*den,start+sign*num];if(indexes.some(i=>i<0||i>max))continue;
     const qs=indexes.map(i=>intersection(cl,norm(axis===0?BigInt(d):0n,axis===1?BigInt(d):0n,-BigInt(i))));
     if(qs.some(q=>!q||!inside(q))||same(qs[0],qs[1]))continue;
     const av=xy(a),bv=xy(b),uv=xy(qs[0]),vv=xy(qs[1]);
     if((bv[0]-av[0])*(vv[0]-uv[0])+(bv[1]-av[1])*(vv[1]-uv[1])>=0)continue;
     const s=intersection(cross(qs[0],a),cross(qs[1],b));
     if(!s||!inside(s)||same(s,qs[2]))continue;
     const target=intersection(cross(s,qs[2]),read(base.k));if(!target||!inside(target))continue;
     chosen={carrier,axis,d,indexes};break;
    }
   }
   if(chosen)break;
  }
  if(!chosen)throw Error('No bounded ratio '+num+'/'+den);
  const f=chosen,refs=f.indexes.map(i=>this.axis(f.axis,i,f.d));
  const [u,v,w]=refs.map((ref,i)=>this.meet(f.carrier,ref,i===2?`Ce repère partage les intervalles auxiliaires dans le rapport ${num}/${den}.`:'Créer les repères régulièrement espacés du partage.'));
  const s=this.meet(this.join(u,a),this.join(v,b),'Les deux bases sont parallèles : cette perspective conserve leurs rapports.');
  return this.meet(this.join(s,w),base,'Reporter le partage sur le segment de la figure.');
 }
 perpendicular(c,a,b){
  let carrier=this.join(a,b),nodes=NODES.filter(pt=>on(read(carrier.k),pt));
  if(nodes.length<2){for(const center of [p(4,4),p(3,4),p(4,3)]){if(on(read(carrier.k),center))continue;carrier=this.parallel(center,a,b);nodes=NODES.filter(pt=>on(read(carrier.k),pt));if(nodes.length>=2)break;}}
  if(nodes.length>=2){
   const pairs=[];for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const aa=xy(nodes[i]),bb=xy(nodes[j]);pairs.push({a:nodes[i],b:nodes[j],dx:bb[0]-aa[0],dy:bb[1]-aa[1]});}
   pairs.sort((u,v)=>u.dx*u.dx+u.dy*u.dy-v.dx*v.dx-v.dy*v.dy);
   const d=pairs[0];
   for(const origin of NODES){const [x,y]=xy(origin),q=p(x-d.dy,y+d.dx);if(inside(q)&&!same(q,origin)){const normal=this.join(origin,q,'Échanger les deux déplacements de la direction et inverser un sens : un quart de tour donne la perpendiculaire.');return this.parallel(c,normal.a,normal.b);}}
  }
  const ra=this.rotateFixed(a),rb=this.rotateFixed(b);return this.parallel(c,ra,rb);
 }
 rotateFixed(a){
  const h=this.parallel(a,p(0,4),p(8,4)),v=this.parallel(a,p(4,0),p(4,8));
  const diagonal=this.join(p(0,0),p(8,8)),anti=this.join(p(0,8),p(8,0));
  const x=this.meet(v,diagonal,'Reporter une coordonnée sur la diagonale du carré.'),y=this.meet(h,anti,'La seconde diagonale inverse le déplacement horizontal.');
  const horizontal=this.parallel(x,p(0,4),p(8,4)),vertical=this.parallel(y,p(4,0),p(4,8));
  return this.meet(horizontal,vertical,'Ces deux reports donnent le quart de tour autour du centre de la grille.');
 }
 translate(point,u,v,relay=true){
  if(same(u,v))return point;if(same(point,u))return v;
  if(on(cross(u,v),point)){
   if(!relay)throw Error('Collinear translation relay');
   const node=NODES.find(q=>!on(cross(u,v),q)&&inside(affine(q,v,u))&&!on(cross(q,affine(q,v,u)),point));
   if(!node)throw Error('No translation relay');const image=this.translate(node,u,v,false);return this.translate(point,node,image,false);
  }
  return this.meet(this.parallel(point,u,v),this.parallel(v,u,point),'Les côtés opposés du parallélogramme reportent exactement le déplacement donné.');
 }
 turn(point,center,positive=true){
  if(isNode(point)&&isNode(center)){
   const q=positive?rotate(point,center):scale(rotate(point,center),center,-1);if(isNode(q))return this.mark(q,'Tourner le déplacement depuis le centre d’un quart de tour, en comptant les carreaux.');
  }
  const pointTurned=this.rotateFixed(point),centerTurned=this.rotateFixed(center);
  const image=this.translate(pointTurned,centerTurned,center);
  return positive?image:this.ratio(center,image,-1);
 }
 mirror(point,a,b){const foot=this.meet(this.perpendicular(point,a,b),this.join(a,b),'La perpendiculaire donne le pied sur l’axe de symétrie.');return this.ratio(point,foot,2);}
 centerTriangle(a,b,c){const m=this.ratio(b,c,1,2),n=this.ratio(a,c,1,2);return this.meet(this.join(a,m),this.join(b,n),'Le centre de gravité est à la rencontre des médianes.');}
 weighted(points,weights){
  if(points.length===3&&weights.every(w=>w===weights[0])&&!on(cross(points[0],points[1]),points[2]))return this.centerTriangle(...points);
  let result=points[0],mass=weights[0];for(let i=1;i<points.length;i++){result=this.ratio(result,points[i],weights[i],mass+weights[i]);mass+=weights[i];}return result;
 }
 finalLine(ref){return this.draw(ref,'Tracer la droite demandée avec les points obtenus par la construction.');}
 finish(){if(!solved(this.level,this.board))throw Error('Geometric recipe does not solve '+this.level.id);return {...this.level,steps:this.steps,par:this.steps.length};}
}
function area2(a,b,c){const [x,y]=xy(a),[u,v]=xy(b),[s,t]=xy(c);return (u-x)*(t-y)-(v-y)*(s-x);}
function triangulate(points){
 const ids=points.map((_,i)=>i),triangles=[];
 let orientation=0;for(let i=0;i<points.length;i++){const a=xy(points[i]),b=xy(points[(i+1)%points.length]);orientation+=a[0]*b[1]-a[1]*b[0];}orientation=Math.sign(orientation);
 while(ids.length>3){let found=false;for(let i=0;i<ids.length;i++){
  const ia=ids[(i+ids.length-1)%ids.length],ib=ids[i],ic=ids[(i+1)%ids.length],a=points[ia],b=points[ib],c=points[ic];
  if(area2(a,b,c)*orientation<=1e-9)continue;
  const contains=ids.some(id=>id!==ia&&id!==ib&&id!==ic&&area2(a,b,points[id])*orientation>=-1e-9&&area2(b,c,points[id])*orientation>=-1e-9&&area2(c,a,points[id])*orientation>=-1e-9);
  if(contains)continue;triangles.push([a,b,c]);ids.splice(i,1);found=true;break;
 }if(!found)throw Error('Cannot triangulate polygon');}
 triangles.push(ids.map(i=>points[i]));return triangles;
}
export function buildGeometricSolution(level){
 const c=new Construction(level),g=Object.fromEntries(level.given.map(pt=>[pt.label,read(pt.p)]));
 const {A,B,C,D,O}=g,j=(level.number-1)%5;
 const mark=(q,text)=>c.mark(q,text),line=(a,b)=>c.finalLine(c.join(a,b));
 const midpt=(a,b)=>c.ratio(a,b,1,2);
 const median=(a,b,d)=>c.join(a,midpt(b,d));
 const centroid=(a,b,d)=>c.centerTriangle(a,b,d);
 const images=(fn)=>{
  const map=new Map();for(const name of ['A','B','C'])if(g[name])map.set(key(g[name]),fn(g[name]));
  for(const [a,b]of level.segments)if(map.has(a)&&map.has(b))line(map.get(a),map.get(b));
 };
 switch(level.chapter){
  case 1:
   if(j===0||j===4)mark(midpt(A,B));
   if(j===1)line(A,B);
   if(j===2)c.meet(c.join(A,B),c.join(C,D),'Le point cherché est à l’intersection des deux droites de la figure.');
   if(j===3)c.meet(c.parallel(A,B,C),c.parallel(C,A,B),'Les côtés opposés du rectangle sont parallèles.');
   break;
  case 2:mark(midpt(A,B));break;
  case 3:c.finalLine(c.parallel(C,A,B));break;
  case 4:
   if(j===4)mark(midpt(A,C));else{const d=c.translate(A,B,C);mark(d);if(j>=1&&j<=3){line(C,d);line(d,A);}}break;
  case 5:{const normal=c.perpendicular(C,A,B);if(j<3)c.finalLine(normal);else c.meet(normal,c.join(A,B),'Le projeté est au croisement de la perpendiculaire et du support donné.');break;}
  case 6:c.finalLine(c.perpendicular(midpt(A,B),A,B));break;
  case 7:images(q=>c.ratio(O,q,-1));break;
  case 8:images(q=>c.mirror(q,g.U,g.V));break;
  case 9:images(q=>c.translate(q,g.U,g.V));break;
  case 10:
   if(j<3)c.finalLine(median(A,B,C));
   else if(j===3){c.finalLine(median(A,B,C));c.finalLine(median(B,A,C));c.finalLine(median(C,A,B));}
   else mark(centroid(A,B,C));break;
  case 11:
   if(!level.segments.length){const ps=level.given.map(pt=>read(pt.p));mark(ps.length===2?midpt(...ps):centroid(...ps));}
   else if(level.segments.length===1){mark(midpt(...level.segments[0].map(read)));}
   else{const start=c.steps.length,mids=[],weights=[];for(const [a,b]of level.segments){mids.push(midpt(read(a),read(b)));const [n,d]=rationalLength(read(a),read(b));if(d!==1n)throw Error('Wire lengths must be explicit integer grid lengths');weights.push(Number(n));}mark(c.weighted(mids,weights));if(c.steps[start])c.steps[start].text='Chaque morceau se concentre en son milieu ; ses longueurs, lues sur la grille ou calculées par Pythagore, sont '+weights.join(', ')+'. '+c.steps[start].text;}
   break;
  case 12:{const [num,den]=[[1,3],[2,3],[1,4],[2,5],[3,5]][j];mark(c.ratio(A,B,num,den));break;}
  case 13:{const [num,den]=[[2,1],[1,2],[-1,1],[3,2],[-1,2]][j];images(q=>c.ratio(O,q,num,den));break;}
  case 14:images(q=>c.turn(q,O,j%2===0));break;
  case 15:{
   const parts=[3,2,3,4,5][j],ps=level.given.map(pt=>read(pt.p)),lengths=ps.slice(1).map((q,i)=>{const [n,d]=rationalLength(ps[i],q);if(d!==1n)throw Error('Path grid lengths must be explicit');return Number(n);}),total=lengths.reduce((a,b)=>a+b,0);
   for(let k=1;k<parts;k++){let remaining=total*k;for(let i=0;i<lengths.length;i++){const length=lengths[i]*parts;if(remaining<=length){const q=c.ratio(ps[i],ps[i+1],remaining,length);mark(q);break;}remaining-=length;}}break;
  }
  case 16:
   if(j===0)c.finalLine(median(A,B,C));
   if(j===1){line(A,c.ratio(B,C,1,3));line(A,c.ratio(B,C,2,3));}
   if(j===2){c.finalLine(c.parallel(c.ratio(A,B,1,3),A,D));c.finalLine(c.parallel(c.ratio(A,B,2,3),A,D));}
   if(j===3)line(A,C);
   if(j===4)c.finalLine(c.perpendicular(midpt(A,B),A,B));break;
  case 17:{
   const ps=level.segments.map(([a])=>read(a));
   if(ps.length===3)mark(centroid(...ps));else{const triangles=triangulate(ps),start=c.steps.length;for(const t of triangles){c.join(t[0],t[1],'Décomposer la plaque en triangles.');c.join(t[1],t[2],'Décomposer la plaque en triangles.');c.join(t[2],t[0],'Décomposer la plaque en triangles.');}const centers=triangles.map(t=>centroid(...t)),weights=triangles.map(t=>Math.round(Math.abs(area2(...t))));mark(c.weighted(centers,weights));if(c.steps[start])c.steps[start].text='Pondérer les centres des triangles par leurs aires : '+weights.map(w=>String(w/2).replace('.',',')).join(' ; ')+'. '+c.steps[start].text;}
   break;
  }
  case 18:{
   const circ=()=>c.meet(c.perpendicular(midpt(A,B),A,B),c.perpendicular(midpt(A,C),A,C),'Le centre du cercle circonscrit est à la rencontre des médiatrices.');
   const ortho=()=>c.meet(c.perpendicular(A,B,C),c.perpendicular(B,A,C),'Les hauteurs se rencontrent à l’orthocentre.');
   if(j===0)mark(centroid(A,B,C));else if(j===2)mark(ortho());else if(j===3)mark(midpt(circ(),ortho()));else mark(circ());break;
  }
  case 19:{const center=c.meet(c.join(A,g['A′']),c.join(B,g['B′']),'Les droites entre points correspondants donnent le centre de perspective.');if(j<3)mark(center);else c.meet(c.join(C,center),c.join(g.U,g.V),'L’image correspondante est sur la droite donnée et sur le rayon de perspective.');break;}
  case 21:
   if(j===0){const ps=[A,B,C,D],mids=ps.map((a,i)=>midpt(a,ps[(i+1)%4]));mids.forEach((a,i)=>line(a,mids[(i+1)%4]));}
   if(j===1)mark(c.weighted([A,B,C],[1,2,3]));
   if(j===2)mark(centroid(g.I,g.J,g.K));
   if(j===3)mark(c.weighted(level.segments.map(([a,b])=>midpt(read(a),read(b))),[1,1,1]));
   if(j===4&&level.circles){const center=centroid(A,B,C);mark(center);c.finalLine(c.perpendicular(A,center,A));}
   else if(j===4){c.meet(c.join(A,g.E),c.join(B,D),'Former la première intersection de Pappus.');c.meet(c.join(A,g.F),c.join(C,D),'Former la deuxième intersection de Pappus.');c.meet(c.join(B,g.F),c.join(C,g.E),'Former la troisième intersection de Pappus.');}break;
  case 20:{
   if(level.number<=5)c.finalLine(c.perpendicular(A,O,A));
   else if(level.number===6){c.finalLine(c.perpendicular(A,O,A));const other=c.ratio(O,A,-1);c.finalLine(c.perpendicular(other,O,other));}
   else if(level.number<=10){const other=c.mirror(A,O,g.P);c.finalLine(c.perpendicular(other,O,other));}
   else{
    const first=A||g.R1;
    for(const contact of level.number===15?[first,B]:[first]){
      c.finalLine(c.perpendicular(contact,g.O1,contact));const other=c.mirror(contact,g.O1,g.O2);c.finalLine(c.perpendicular(other,g.O1,other));
    }
   }break;
  }
  default:throw Error('No semantic recipe for chapter '+level.chapter);
 }
 return c.finish();
}
