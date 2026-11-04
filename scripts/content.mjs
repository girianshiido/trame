import fs from 'node:fs';
import {buildGeometricSolution} from './geometric-solutions.mjs';
import {reuseGivenStrokes} from '../.tools/solutions.js';
import {p,key,read,cross,norm,on,inside,intersection,grid,gridLines,mid,mean,scale,affine,rotate,reflect,xy,candidates,lineThrough} from '../.tools/geometry.js';
const chapters=[
 ['Premiers traits','Apprivoiser les deux gestes','01','Observer, compter et relier : une petite grille suffit pour faire de grandes découvertes.',['Point','Droite','Intersection']],
 ['Les milieux','À égale distance','02','Le milieu existe aussi entre les carreaux. Croiser deux droites permet de le faire apparaître.',['Milieu','Diagonales']],
 ['Parallèles','Garder la même direction','03','Un déplacement horizontal et vertical décrit une direction. On peut la reproduire ailleurs.',['Parallèles','Vecteur']],
 ['Parallélogrammes','Le pouvoir des diagonales','04','Des côtés parallèles et des diagonales qui se coupent en leur milieu : deux façons de regarder une même figure.',['Parallélogramme','Diagonales']],
 ['Perpendiculaires','Faire un angle droit','05','Tourner une direction d’un quart de tour, c’est échanger ses déplacements et changer un signe.',['Perpendiculaires','Projection']],
 ['Médiatrices','Le juste équilibre','06','Tous les points d’une médiatrice sont à la même distance des deux extrémités.',['Médiatrice','Milieu']],
 ['Symétrie centrale','De l’autre côté du centre','07','Le centre est le milieu de chaque paire de points correspondants.',['Symétrie centrale']],
 ['Symétrie axiale','De l’autre côté du miroir','08','Le miroir est la médiatrice du segment qui relie un point à son image.',['Symétrie axiale','Projection']],
 ['Translations','Déplacer sans tourner','09','Le même déplacement s’applique à tous les points. La forme et la direction sont conservées.',['Translation','Vecteur']],
 ['Les médianes','Du sommet au milieu','10','Une médiane relie un sommet au milieu du côté opposé. Elle partage aussi l’aire en deux.',['Médiane','Triangle']],
 ['Premiers équilibres','Points, segments et fils','11','Deux points, trois points, un segment puis un fil coudé : observer ce qui porte la masse change le problème.',['Centre de gravité','Fil uniforme','Barycentre']],
 ['Thalès et rapports','Partager dans une direction','12','Les parallèles transportent les proportions. Les tiers et les cinquièmes deviennent accessibles.',['Thalès','Rapport']],
 ['Homothéties','Agrandir autour d’un centre','13','Un même rapport multiplie les distances au centre. Un rapport négatif fait aussi passer de l’autre côté.',['Homothétie','Rapport']],
 ['Quarts de tour','Une autre façon de voir','14','Le quadrillage conserve ses directions après une rotation de 90°. Les points, eux, changent de place.',['Rotation','Perpendiculaires']],
 ['Partager un chemin','La longueur, pas le raccourci','15','Pour partager un fil, il faut suivre le chemin. Un coude change les calculs, pas la règle.',['Ligne brisée','Rapport']],
 ['Partager les aires','Des surfaces qui s’équilibrent','16','Même hauteur, même base, même aire… Les découpages donnent des outils que les longueurs seules ne donnent pas.',['Aire','Médiane','Thalès']],
 ['Centres de surfaces','Triangles, trapèzes et figures creuses','17','Une plaque uniforme se décompose en morceaux. Leurs centres sont pondérés par leurs aires, jamais par le nombre de sommets.',['Surface uniforme','Barycentre','Aire']],
 ['Points remarquables','Trois familles se rencontrent','18','Médianes, hauteurs et médiatrices cachent des points de rencontre particuliers.',['Orthocentre','Cercle circonscrit','Centre de gravité']],
 ['Perspectives','Des points qui se répondent','19','Des couples de points alignés vers un même centre permettent de reconstruire une figure.',['Perspective','Alignement']],
 ['Le grand atelier','Croiser toutes les idées','20','Milieux, équilibres et incidences se combinent. Les outils restent les mêmes ; le regard a changé.',['Varignon','Pappus','Barycentre']],
 ['Tangentes aux cercles','Au point de contact','21','Une tangente est perpendiculaire au rayon au point de contact. Les cercles sont donnés comme figures de référence ; on construit toujours avec les points et les droites.',['Tangente','Cercle','Homothétie']]
].map((a,i)=>({id:i+1,title:a[0],subtitle:a[1],icon:a[2],intro:a[3],terms:a[4]}));
const nodes=grid(); const gl=gridLines();
function transform(a,r){let q=a;for(let i=0;i<r;i++)q=norm(8n*q[2]-q[1],q[0],q[2]);return q;}
class Puzzle {
 constructor(ch,j,r){this.ch=ch;this.j=j;this.r=r;this.given=[];this.segments=[];this.initialLines=[];this.targets=[];this.steps=[];this.board={points:[],lines:[]};this.title='';this.goal='';this.lesson='';this.hints=[];}
 givenPoint(name,a){this.given.push({p:key(a),label:name});return a;}
 shape(names,ps,closed=true){ps.forEach((a,i)=>this.givenPoint(names[i],a));for(let i=0;i<ps.length-(closed?0:1);i++)this.segments.push([key(ps[i]),key(ps[(i+1)%ps.length])]);return ps;}
 line(a,b){if(key(a)===key(b))throw Error('Undefined line');return cross(a,b);}
 need(t){if(!t||!inside(t))throw Error(`Target outside frame ${this.ch}/${this.j}`);}
 targetPoint(a,label='Point recherché'){this.need(a);const k=key(a);if(this.given.some(g=>g.p===k)){throw Error(`Target already given ${this.ch}/${this.j}`);}this.targets.push({kind:'point',p:k,label});}
 targetLine(a,b,label='Droite recherchée'){this.line(a,b);this.targets.push({kind:'line',line:key(cross(a,b)),label});}
 finish(){const tx=k=>key(transform(read(k),this.r));const tl=k=>{const l=read(k);const pts=[];for(const q of nodes)if(on(l,q))pts.push(q);if(pts.length>=2)return key(cross(transform(pts[0],this.r),transform(pts[1],this.r)));const [a,b,c]=l;let r=l;for(let i=0;i<this.r;i++)r=norm(-r[1],r[0],r[2]+8n*r[1]);return key(r);};
  const steps=this.steps.map(s=>s.kind==='point'?{...s,p:tx(s.p)}:{...s,a:tx(s.a),b:tx(s.b)});
  const n=this.r*5+this.j+1;
  return {id:`${this.ch}-${n}`,chapter:this.ch,number:n,title:this.title+(this.r===1?' · Autre regard':this.r===2?' · Hors des mailles':''),goal:this.goal,lesson:this.lesson||chapters[this.ch-1].intro,hints:this.hints.length?this.hints:[chapters[this.ch-1].intro,'Les lignes du quadrillage peuvent servir de repères. Un trait auxiliaire reste autorisé.'],given:this.given.map(g=>({...g,p:tx(g.p)})),segments:this.segments.map(s=>s.map(tx)),initialLines:this.initialLines.map(tl),targets:this.targets.map(t=>t.kind==='point'?{...t,p:tx(t.p)}:{...t,line:tl(t.line)}),steps,difficulty:Math.min(5,1+Math.floor((this.ch-1)/5)+(this.j>2?1:0)),par:steps.length};
 }
}
const P=(x,y,d=1)=>p(x,y,d);
const triangleSets=[[[1,1],[7,1],[3,7]],[[1,2],[7,2],[4,6]],[[1,1],[6,2],[2,7]],[[2,1],[7,4],[1,6]],[[1,1],[7,3],[3,7]]];
const triangle=j=>triangleSets[j].map(a=>P(...a));
function polygonCentroid(ps){let area=0n,x=0n,y=0n;for(let i=0;i<ps.length;i++){const a=ps[i],b=ps[(i+1)%ps.length];if(a[2]!==1n||b[2]!==1n)throw Error('Integer polygon required');const c=a[0]*b[1]-b[0]*a[1];area+=c;x+=(a[0]+b[0])*c;y+=(a[1]+b[1])*c;}return norm(x,y,3n*area);}
function make(ch,j,r){const z=new Puzzle(ch,j,r),G=(name,a)=>z.givenPoint(name,a);let A,B,C,D,O,T;
 switch(ch){
 case 1:
  if(j===0){A=G('A',P(2,2));B=G('B',P(6,2));z.title='Le premier milieu';z.goal='Place le milieu du segment [AB].';z.segments.push([key(A),key(B)]);z.targetPoint(mid(A,B),'Milieu de [AB]');}
  if(j===1){A=G('A',P(1,2));B=G('B',P(6,5));z.title='Un trait, toute une droite';z.goal='Trace la droite passant par A et B.';z.targetLine(A,B,'(AB)');}
  if(j===2){A=G('A',P(1,1));B=G('B',P(7,7));C=G('C',P(1,7));D=G('D',P(7,1));z.title='Le rendez-vous';z.goal='Place le point commun aux droites (AB) et (CD).';z.line(A,B);z.line(C,D);z.targetPoint(P(4,4),'Intersection');}
  if(j===3){[A,B,C]=z.shape('ABC',[P(1,2),P(6,2),P(6,6)],false);z.title='Le coin manquant';z.goal='Place D pour compléter le rectangle ABCD, dans cet ordre.';z.targetPoint(P(1,6),'D');}
  if(j===4){A=G('A',P(2,1));B=G('B',P(5,6));z.segments.push([key(A),key(B)]);z.title='Entre les carreaux';z.goal='Place le milieu de [AB]. Il peut être entre les nœuds.';z.targetPoint(mid(A,B),'Milieu');}
  z.hints=['Un point se pose sur un nœud ou sur un croisement de droites.','Pour tracer : relie deux points. La droite s’arrête au cadre.'];break;
 case 2:{const pairs=[[P(1,2),P(7,6)],[P(1,1),P(6,5)],[P(1,2),P(6,7)],[P(3,5,2),P(11,9,2)],[P(5,4,3),P(17,19,3)]];[A,B]=pairs[j];G('A',A);G('B',B);z.segments.push([key(A),key(B)]);z.title=['Compter à deux','Un demi-carreau','Deux coordonnées impaires','Deux points décalés','Le milieu caché'][j];z.goal='Place M, le milieu de [AB].';z.targetPoint(mid(A,B),'M');z.hints=['Les diagonales d’un parallélogramme se coupent en leur milieu.','Les points auxiliaires peuvent être choisis librement dans le carré.'];break;}
 case 3:{const sets=[[P(1,1),P(5,3),P(2,5)],[P(1,2),P(4,7),P(4,1)],[P(1,7),P(5,3),P(2,7)],[P(3,3,2),P(11,7,2),P(2,5)],[P(4,5,3),P(16,11,3),P(7,8,2)]];[A,B,C]=sets[j];G('A',A);G('B',B);G('C',C);z.segments.push([key(A),key(B)]);z.title=['Même pente','Une direction raide','Descendre en avançant','Direction décalée','Le bon déplacement'][j];z.goal='Trace la parallèle à (AB) qui passe par C.';D=affine(B,C,A);const q=inside(D)?D:scale(D,C,1,2);z.targetLine(C,q,'Parallèle par C');break;}
 case 4:{const sets=[[P(1,1),P(5,2),P(7,6)],[P(2,1),P(6,3),P(4,7)],[P(1,2),P(5,1),P(7,5)],[P(3,3,2),P(11,5,2),P(13,13,2)],[P(4,5,3),P(16,8,3),P(19,20,3)]];[A,B,C]=sets[j];z.shape('ABC',[A,B,C],false);D=affine(A,C,B);z.title=['Le quatrième sommet','Un rectangle incliné','Le côté invisible','Sommets décalés','Diagonales en secret'][j];z.goal=j===4?'Place le centre du parallélogramme ABCD, sans connaître D.':'Place D pour que ABCD soit un parallélogramme, dans cet ordre.';z.targetPoint(j===4?mid(A,C):D,j===4?'Centre':'D');break;}
 case 5:{const sets=[[P(1,2),P(6,2),P(4,6)],[P(1,1),P(5,5),P(2,6)],[P(1,2),P(5,4),P(3,5)],[P(1,1),P(3,5),P(6,3)],[P(3,3,2),P(11,7,2),P(4,5)]];[A,B,C]=sets[j];G('A',A);G('B',B);G('C',C);z.segments.push([key(A),key(B)]);const l=cross(A,B);T=mid(C,reflect(C,l));z.title=['À angle droit','Une diagonale à tourner','Deux pour un','Le pied de la hauteur','Une ombre décalée'][j];z.goal=j<3?'Trace la perpendiculaire à (AB) passant par C.':'Place H, le projeté orthogonal de C sur (AB).';if(j<3)z.targetLine(C,T,'Perpendiculaire');else{z.line(A,B);z.targetPoint(T,'H');}break;}
 case 6:{[A,B]=[[P(2,2),P(6,2)],[P(1,1),P(5,5)],[P(1,2),P(5,4)],[P(3,3,2),P(11,7,2)],[P(4,5,3),P(16,11,3)]][j];G('A',A);G('B',B);z.segments.push([key(A),key(B)]);O=mid(A,B);T=rotate(A,O);z.title=['La ligne d’équilibre','Miroir diagonal','Une médiatrice inclinée','Entre les mailles','Équidistance exacte'][j];z.goal='Trace la médiatrice de [AB].';z.targetLine(O,T,'Médiatrice');z.hints=['Une médiatrice est perpendiculaire au segment et passe par son milieu.','Un quart de tour transforme la direction (a, b) en (−b, a).'];break;}
 case 7:{O=G('O',j>2?P(7,9,2):P(4,4));const ps=j<2?[j===0?P(2,1):P(2,3)]:j===2?[P(2,2),P(4,1)]:[P(3,5,2),P(7,3,2),P(11,7,2)];z.shape('ABC',ps,ps.length>2);z.title=['Le point opposé','Un demi-tour','Un segment en face','Trois images','Un centre entre les mailles'][j];z.goal=`Place ${ps.length===1?'l’image de A':`les ${ps.length} sommets images de ${'ABC'.slice(0,ps.length)}`} par la symétrie de centre O.`;ps.forEach((a,i)=>z.targetPoint(scale(a,O,-1),`${'ABC'[i]}′`));break;}
 case 8:{const axes=[[P(4,0),P(4,8)],[P(0,0),P(8,8)],[P(0,8),P(8,0)],[P(0,2),P(8,6)],[P(0,0),P(4,8)]];[A,B]=axes[j];G('U',A);G('V',B);z.initialLines.push(key(cross(A,B)));z.board.lines.push(key(cross(A,B)));const ps=j<2?[P(2,3)]:j===2?[P(2,3),P(5,2)]:j===3?[P(2,5),P(4,5),P(5,4)]:[P(1,4),P(1,6),P(2,6)];z.shape('ABC',ps,ps.length>2);z.title=['Le miroir vertical','Le miroir diagonal','Un segment dans le miroir','Un triangle incliné','Le triangle de l’autre côté'][j];z.goal='Place les images par la symétrie d’axe (UV).';ps.forEach((q,i)=>z.targetPoint(reflect(q,cross(A,B)),`${'ABC'[i]}′`));if(ps.length===1)z.goal='Place A′, l’image de A par la symétrie d’axe (UV).';break;}
 case 9:{A=G('U',j>2?P(3,5,2):P(1,2));B=G('V',j>2?P(7,7,2):P(3,3));const ps=j<2?[j===0?P(3,4):P(2,5)]:j===2?[P(1,3),P(4,5)]:[P(1,3),P(3,3),P(2,5)];z.shape('ABC',ps,ps.length>2);z.segments.push([key(A),key(B)]);z.title=['Le même déplacement','Copier une flèche','Déplacer un segment','Faire glisser le triangle','Un déplacement décalé'][j];z.goal=`Place ${ps.length===1?'l’image de A':`les images de ${'ABC'.slice(0,ps.length)}`} par la translation qui envoie U sur V.`;ps.forEach((a,i)=>z.targetPoint(affine(a,B,A),`${'ABC'[i]}′`));break;}
 case 10:{[A,B,C]=z.shape('ABC',triangle(j));z.title=['La première médiane','Un triangle étiré','Une médiane oblique','Les trois médianes','Un point commun'][j];z.goal=j<3?'Trace la médiane issue de A.':j===3?'Trace les trois médianes du triangle ABC.':'Place le point commun aux trois médianes de ABC.';if(j<3)z.targetLine(A,mid(B,C),'Médiane de A');else if(j===3){z.targetLine(A,mid(B,C),'Médiane de A');z.targetLine(B,mid(A,C),'Médiane de B');z.targetLine(C,mid(A,B),'Médiane de C');}else{z.line(A,mid(B,C));z.line(B,mid(A,C));z.targetPoint(mean([A,B,C]),'G');}break;}
 case 11:{
  // Ordered progression across the 15 levels: equal masses, then uniform wires.
  const n=r*5+j;z.r=n<5?0:n<10?1:2;z.j=n%5;
  if(n<3){A=G('A',n===2?P(3,5,2):n===1?P(1,1):P(1,2));B=G('B',n===2?P(11,9,2):n===1?P(6,6):P(7,2));z.title=['Deux petites masses','Deux masses en diagonale','Équilibre hors des nœuds'][n];z.goal='Deux points A et B portent la même masse. Place leur centre de gravité G.';z.targetPoint(mid(A,B),'G');}
  else if(n<6){const ps=triangle(n-3);z.shape('ABC',ps,false);z.segments=[];z.title=['Trois masses égales','Un triangle de points','Trois masses décalées'][n-3];z.goal='A, B et C portent chacun la même masse. Place leur centre de gravité G.';z.line(ps[0],mid(ps[1],ps[2]));z.line(ps[1],mid(ps[0],ps[2]));z.targetPoint(mean(ps),'G');}
  else if(n<9){A=G('A',n===8?P(3,3,2):n===7?P(2,1):P(1,2));B=G('B',n===8?P(13,11,2):n===7?P(5,7):P(7,6));z.segments.push([key(A),key(B)]);z.title=['Un segment uniforme','Le fil droit','Un fil décalé'][n-6];z.goal='Le segment [AB] est un fil uniforme. Place son centre de gravité G.';z.targetPoint(mid(A,B),'G');}
  else {const specs=[[[1,1],[5,1],[5,5]],[[1,1],[7,1],[7,4]],[[1,1],[4,5],[7,1]],[[1,1],[5,1],[5,7]],[[1,1],[4,1],[4,5],[7,5]],[[1,1],[4,5],[7,1],[7,6]]];const ps=specs[n-9].map(a=>P(...a));z.shape('ABCD',ps,false);const mids=[],weights=[];for(let i=0;i<ps.length-1;i++){mids.push(mid(ps[i],ps[i+1]));const [x,y]=xy(ps[i]),[u,v]=xy(ps[i+1]);const len=Math.hypot(u-x,v-y);if(Math.abs(len-Math.round(len))>1e-8)throw Error('irrational wire');weights.push(Math.round(len));}z.title=['Un premier coude','Deux bras inégaux','Un fil en V','Le bras le plus long','Trois morceaux','Le fil composé'][n-9];z.goal='La ligne brisée est un fil uniforme, de section constante. Place son centre de gravité G.';z.targetPoint(mean(mids,weights),'G');z.lesson='Chaque morceau se concentre en son milieu. Sa masse est proportionnelle à sa longueur. Le centre du fil n’est généralement pas la moyenne des sommets.';}
  z.hints=['Identifie ce qui porte la masse : les points ou toute la longueur du fil.','Pour un fil composé, chaque segment compte proportionnellement à sa longueur.'];break;}
 case 12:{A=G('A',j===4?P(3,4,2):P(1,2));B=G('B',j===4?P(13,12,2):P(7,6));z.segments.push([key(A),key(B)]);const ratios=[[1,3],[2,3],[1,4],[2,5],[3,5]];const [a,b]=ratios[j];z.title=['Le premier tiers','Deux tiers','Le quart','Deux cinquièmes','Trois cinquièmes décalés'][j];z.goal=`Place P sur [AB] tel que AP = ${a}/${b} de AB.`;z.targetPoint(scale(B,A,a,b),'P');break;}
 case 13:{O=G('O',P(4,4));const ps=j===0?[P(3,2)]:j===1?[P(3,2),P(6,3)]:[P(2,2),P(4,2),P(3,4)];z.shape('ABC',ps,ps.length>2);const [a,b]=[[2,1],[1,2],[-1,1],[3,2],[-1,2]][j];z.title=['Deux fois plus loin','Deux fois plus près','Le rapport négatif','Une fois et demie','Réduire et retourner'][j];z.goal=`Place ${ps.length===1?'l’image de A':'les images de A, B et C'} par l’homothétie de centre O et de rapport ${b===1?a:a+'/'+b}.`;ps.forEach((q,i)=>z.targetPoint(scale(q,O,a,b),`${'ABC'[i]}′`));break;}
 case 14:{O=G('O',j===4?P(7,7,2):P(4,4));const ps=j<2?[P(2,3)]:j===2?[P(2,2),P(5,1)]:j===4?[P(2,1),P(5,2),P(3,5)]:[P(2,2),P(5,2),P(3,4)];z.shape('ABC',ps,ps.length>2);const positive=j%2===0;z.title=['Un quart de tour','Dans l’autre sens','Faire tourner un segment','Le triangle qui pivote','Un centre décalé'][j];z.goal=`Place ${ps.length===1?'l’image de A':`les images de ${'ABC'.slice(0,ps.length)}`} après un quart de tour autour de O, ${positive?'dans le sens inverse des aiguilles d’une montre':'dans le sens des aiguilles d’une montre'}.`;ps.forEach((q,i)=>z.targetPoint(positive?rotate(q,O):scale(rotate(q,O),O,-1),`${'ABC'[i]}′`));break;}
 case 15:{const sets=[[[1,1],[7,1]],[[1,1],[5,1],[5,7]],[[1,1],[7,1],[7,7]],[[1,1],[4,5],[7,1]],[[1,1],[4,1],[4,5],[7,5]]];const ps=sets[j].map(a=>P(...a));z.shape('ABCD',ps,false);const parts=[3,2,3,4,5][j],lengths=ps.slice(1).map((q,i)=>{const a=xy(ps[i]),b=xy(q);return Math.round(Math.hypot(b[0]-a[0],b[1]-a[1]));});const total=lengths.reduce((a,b)=>a+b,0);z.title=['Trois longueurs égales','Le milieu du chemin','Trois étapes','Quatre portions du V','Cinq parts de fil'][j];z.goal=`Place les ${parts-1} points qui partagent ${j===0?'[AB]':'la ligne brisée'} en ${parts} longueurs égales, en suivant le chemin depuis A. Les sommets déjà donnés comptent s’ils conviennent.`;for(let k=1;k<parts;k++){let d=total*k;for(let i=0;i<lengths.length;i++){const l=lengths[i]*parts;if(d<=l){const q=scale(ps[i+1],ps[i],d,l);if(!ps.some(a=>key(a)===key(q)))z.targetPoint(q,`Partage ${k}`);break;}d-=l;}}break;}
 case 16:{z.title=['Deux aires dans un triangle','Trois aires dans un triangle','Trois bandes','Deux moitiés inclinées','Un trapèze partagé'][j];if(j<2){[A,B,C]=z.shape('ABC',triangle(j+1));z.goal=j===0?'Trace la droite passant par A qui partage le triangle ABC en deux aires égales.':'Trace les deux droites passant par A qui partagent le triangle ABC en trois aires égales.';if(j===0)z.targetLine(A,mid(B,C),'Partage en deux');else{z.targetLine(A,scale(C,B,1,3),'Premier partage');z.targetLine(A,scale(C,B,2,3),'Second partage');}}
  if(j===2){z.shape('ABCD',[P(1,1),P(7,1),P(7,7),P(1,7)]);z.goal='Partage le carré ABCD en trois bandes de même aire, par deux droites parallèles à (AD).';z.targetLine(P(3,1),P(3,7));z.targetLine(P(5,1),P(5,7));}
  if(j===3){[A,B,C,D]=z.shape('ABCD',[P(1,1),P(6,2),P(7,7),P(2,6)]);z.goal='Trace la droite (AC), qui partage ce parallélogramme en deux triangles de même aire.';z.targetLine(A,C,'(AC)');}
  if(j===4){[A,B,C,D]=z.shape('ABCD',[P(1,1),P(7,1),P(6,6),P(2,6)]);z.goal='Trace la droite perpendiculaire à (AB) qui partage ce trapèze isocèle en deux aires égales.';z.targetLine(P(4,1),P(4,6),'Axe de partage');}break;}
 case 17:{const n=r*5+j;const polys=[[[1,1],[7,1],[4,7]],[[1,1],[7,2],[2,6]],[[1,2],[6,1],[7,6]],[[1,1],[7,1],[7,5],[1,5]],[[1,1],[6,2],[7,7],[2,6]],[[1,1],[7,1],[6,5],[2,5]],[[1,1],[7,1],[7,3],[3,3],[3,7],[1,7]],[[1,1],[7,1],[7,3],[5,3],[5,5],[1,5]],[[1,1],[7,1],[7,7],[5,7],[5,3],[3,3],[3,7],[1,7]],[[1,1],[7,1],[7,3],[5,3],[5,7],[3,7],[3,3],[1,3]],[[1,1],[7,1],[7,5],[5,5],[5,3],[3,3],[3,5],[1,5]],[[1,1],[7,1],[7,5],[5,5],[5,7],[1,7]],[[1,1],[7,1],[7,3],[5,3],[5,5],[3,5],[3,7],[1,7]],[[1,1],[7,1],[7,7],[3,7],[3,5],[1,5]],[[1,1],[7,1],[7,7],[5,7],[5,5],[3,5],[3,7],[1,7]]];const ps=polys[n].map(a=>P(...a));z.shape('ABCDEFGHIJKL',ps);z.title=['Un premier triangle','Le triangle oblique','Le triangle renversé','Une plaque rectangulaire','Une plaque inclinée','Le trapèze','Une plaque en L','La marche','La plaque en U','La plaque en T','Un creux central','Le coin retiré','L’escalier','Une plaque asymétrique','La dernière encoche'][n];z.goal='La figure est une plaque uniforme. Place son centre de gravité G.';if(n<3){z.line(ps[0],mid(ps[1],ps[2]));z.line(ps[1],mid(ps[0],ps[2]));}z.targetPoint(polygonCentroid(ps),'G');z.lesson='Pour une surface uniforme, la masse de chaque morceau est proportionnelle à son aire. Le centre peut même tomber dans un creux, à l’extérieur de la matière (mais toujours dans la grille).';z.hints=['Commence par les triangles : leurs médianes se rencontrent au centre de gravité.','Pour une plaque composée, pondère les centres de ses morceaux par leurs aires. On peut aussi soustraire une pièce retirée.'];break;}
 case 18:{[A,B,C]=z.shape('ABC',triangle(j));z.title=['Le centre des médianes','Le centre du cercle','La rencontre des hauteurs','Deux centres, un milieu','Le cercle encore'][j];if(j===0){z.goal='Place G, le centre de gravité du triangle ABC.';z.line(A,mid(B,C));z.line(B,mid(A,C));z.targetPoint(mean([A,B,C]),'G');}else{const m=mid(A,B),n=mid(A,C),u=rotate(A,m),v=rotate(A,n);const circum=intersection(cross(m,u),cross(n,v));const ha=mid(A,reflect(A,cross(B,C))),hb=mid(B,reflect(B,cross(A,C)));const ortho=intersection(cross(A,ha),cross(B,hb));if(j===2){z.goal='Place H, l’orthocentre de ABC : le point commun aux hauteurs.';z.line(A,ha);z.line(B,hb);z.targetPoint(ortho,'H');}else if(j===3){z.goal='Place N, le milieu entre le centre O du cercle circonscrit et l’orthocentre H de ABC.';z.targetPoint(mid(circum,ortho),'N');}else{z.goal='Place O, le centre du cercle passant par A, B et C. Aucun cercle n’est à tracer.';z.line(m,u);z.line(n,v);z.targetPoint(circum,'O');}}break;}
 case 19:{O=j===4?P(7,6):j===1?P(3,5):j===2?P(5,3):P(4,4);A=P(1,1);B=P(7,2);C=P(2,7);const ap=scale(A,O,j===3?1:2,3),bp=scale(B,O,1,2),cp=scale(C,O,2,3);G('A',A);G('B',B);G('C',C);G('A′',ap);G('B′',bp);z.segments.push([key(A),key(B)],[key(B),key(C)],[key(C),key(A)]);z.title=['Le centre caché','Les rayons invisibles','Une perspective oblique','Retrouver l’image','Une troisième paire'][j];if(j<3){G('C′',cp);z.goal='Les droites (AA′), (BB′), (CC′) passent par un même centre O. Place O.';z.line(A,ap);z.line(B,bp);z.targetPoint(O,'O');}else{const h=P(0,j===3?5:6),v=P(8,j===3?5:6);G('U',h);G('V',v);z.initialLines.push(key(cross(h,v)));z.board.lines.push(key(cross(h,v)));z.goal='Les couples A, A′ et B, B′ définissent un centre de perspective O. Place C′ sur (UV) pour que C, C′ et O soient alignés.';z.line(A,ap);z.line(B,bp);z.need(O);z.line(C,O);z.targetPoint(intersection(cross(C,O),cross(h,v)),'C′');}break;}
 case 20:{z.title=['Le théorème de Varignon','Des masses différentes','Le centre sans sommet','Le milieu d’un fil composé','Le théorème de Pappus'][j];
  if(j===0){const ps=z.shape('ABCD',[P(1,1),P(7,2),P(6,7),P(2,6)]);z.goal='Place les quatre milieux des côtés de ABCD : ils forment un parallélogramme.';ps.forEach((a,i)=>z.targetPoint(mid(a,ps[(i+1)%4]),`Milieu ${i+1}`));z.lesson='Même pour un quadrilatère quelconque, les milieux successifs de ses côtés forment un parallélogramme : c’est le théorème de Varignon.';}
  if(j===1){A=G('A',P(1,1));B=G('B',P(7,2));C=G('C',P(2,7));z.goal='A porte une masse 1, B une masse 2 et C une masse 3. Place leur centre de gravité G.';z.targetPoint(mean([A,B,C],[1,2,3]),'G');}
  if(j===2){A=G('I',P(2,3));B=G('J',P(5,2));C=G('K',P(5,6));z.goal='I, J et K sont les milieux des trois côtés d’un triangle caché. Place son centre de gravité G.';z.targetPoint(mean([A,B,C]),'G');z.lesson='Le triangle des milieux a le même centre de gravité que le triangle de départ.';}
  if(j===3){const ps=z.shape('ABCD',[P(1,1),P(4,5),P(7,1),P(7,6)],false);z.goal='Le fil ABCD est uniforme. Place son centre de gravité G. Les trois morceaux ont la même longueur.';z.targetPoint(mean([mid(ps[0],ps[1]),mid(ps[1],ps[2]),mid(ps[2],ps[3])]),'G');}
  if(j===4){const a=P(1,1),b=P(4,1),c=P(7,1),u=P(1,7),v=P(4,7),w=P(7,7);[['A',a],['B',b],['C',c],['D',u],['E',v],['F',w]].forEach(([n,q])=>G(n,q));z.segments.push([key(a),key(c)],[key(u),key(w)]);const X=intersection(cross(a,v),cross(b,u)),Y=intersection(cross(a,w),cross(c,u)),Z=intersection(cross(b,w),cross(c,v));z.goal='Place X = (AE) ∩ (BD), Y = (AF) ∩ (CD) et Z = (BF) ∩ (CE). Ces trois points sont alignés.';for(const [q,l1,l2]of [[X,[a,v],[b,u]],[Y,[a,w],[c,u]],[Z,[b,w],[c,v]]]){z.line(...l1);z.line(...l2);z.targetPoint(q,'XYZ'[[X,Y,Z].indexOf(q)]);}z.lesson='Le théorème de Pappus affirme cet alignement pour deux triplets de points alignés. Il suffit de droites et d’intersections pour le voir.';}
 break;}
 }
 return z.finish();}
function enrichFinalFigure(level){
 const addEdge=(a,b,label)=>{
  const line=lineThrough(a,b);if(!line)return;
  if(!level.targets.some(t=>t.kind==='line'&&t.line===line))level.targets.push({kind:'line',line,label,segment:[a,b]});
  const already=level.initialLines.includes(line)||level.steps.some(st=>st.kind==='line'&&lineThrough(st.a,st.b)===line);
  if(!already)level.steps.push({kind:'line',a,b,text:'Relier les sommets pour compléter la figure finale.'});
 };
 if([7,8,9,13,14].includes(level.chapter)){
  const images=new Map();
  for(const given of level.given){const image=level.targets.find(t=>t.kind==='point'&&t.label===given.label+'′');if(image)images.set(given.p,image.p);}
  const edges=level.segments.filter(([a,b])=>images.has(a)&&images.has(b));
  for(const [a,b]of edges)addEdge(images.get(a),images.get(b),'Segment image');
  if(edges.length){
   const suffix=level.goal.match(/ (?:par|après) .+$/)?.[0]||'.';
   level.goal=edges.length===1?`Construis le segment [A′B′], image de [AB]${suffix}`:`Construis le triangle A′B′C′, image du triangle ABC${suffix}`;
  }
 }
 if(level.chapter===4&&(level.number-1)%5>=1&&(level.number-1)%5<=3){
  const D=level.targets.find(t=>t.kind==='point'&&t.label==='D'),A=level.given.find(g=>g.label==='A'),C=level.given.find(g=>g.label==='C');
  addEdge(C.p,D.p,'[CD]');addEdge(D.p,A.p,'[DA]');
  level.goal='Complète le parallélogramme ABCD : construis D et trace les côtés [CD] et [DA].';
 }
 if(level.chapter===20&&(level.number-1)%5===0){
  const mids=level.targets.filter(t=>t.kind==='point');
  mids.forEach((m,i)=>addEdge(m.p,mids[(i+1)%mids.length].p,'Côté du parallélogramme des milieux'));
  level.goal='Construis le parallélogramme formé par les quatre milieux des côtés de ABCD.';
 }
 level.par=level.steps.length;
 return level;
}
const levels=[];for(let ch=1;ch<=20;ch++){for(let r=0;r<3;r++)for(let j=0;j<5;j++){try{let level=make(ch,j,r);if(r===2&&ch!==1&&ch!==11&&ch!==15&&ch!==17){const shrink=q=>scale(read(q),P(4,4),7,11),sp=q=>key(shrink(q)),sl=q=>{const [a,b,c]=read(q);return key(norm(11n*a,11n*b,7n*c-16n*a-16n*b));};level={...level,given:level.given.map(g=>({...g,p:sp(g.p)})),segments:level.segments.map(s=>s.map(sp)),initialLines:level.initialLines.map(sl),targets:level.targets.map(t=>t.kind==='point'?{...t,p:sp(t.p)}:{...t,line:sl(t.line)})};level.steps=[];level.par=0;}level=reuseGivenStrokes(buildGeometricSolution(enrichFinalFigure(level)));levels.push(level);}catch(e){console.error(`Chapter ${ch}, scene ${j}, rotation ${r}`);throw e;}}console.log(`Chapitre ${ch} : 15 solutions bornées.`);}
function givenPointFor(level,label){return read(level.given.find(g=>g.label===label).p);}
function makeTangent(number){
 const z=new Puzzle(21,0,0),circles=[];
 const offset=(o,x,y,d=1)=>affine(o,P(x,y,d),P(0,0));
 const circle=(o,rn,rd=1,label='c')=>{circles.push({center:key(o),radius:[rn,rd],label});return circles.length-1;};
 const given=(name,q)=>z.givenPoint(name,q);
 const radius=(o,rn,rd,name)=>{const r=given(name,offset(o,0,rn,rd));z.segments.push([key(o),key(r)]);return r;};
 const tangent=(o,t,labels,ids)=>{
  z.targetLine(t,rotate(o,t),'Tangente');
  const target=z.targets[z.targets.length-1];target.circles=ids;target.contacts=labels;
 };
 const at=(o,t,id,label='T')=>tangent(o,t,[{p:key(t),label}],[id]);
 if(number<=5){
  const specs=[{o:P(4,4),r:[2,1],t:P(6,4)},{o:P(3,3),r:[2,1],t:P(3,5)},{o:P(3,3),r:[5,2],t:P(9,10,2)},{o:P(4,4),r:[13,6],t:P(29,36,6)},{o:P(2,4),r:[2,1],t:P(0,4)}];
  const {o,r,t}=specs[number-1];given('O',o);given('A',t);const id=circle(o,...r);
  if(number!==2)z.segments.push([key(o),key(t)]);
  z.title=['Le rayon et la tangente','En haut du cercle','Une tangente inclinée','Un contact décalé','Le cadre est tangent'][number-1];
  z.goal='Trace la tangente au cercle en A. O est son centre.';at(o,t,id,'A');
 }else if(number===6){
  const o=given('O',P(4,4)),id=circle(o,5,2);radius(o,5,2,'R');
  const u=given('U',P(0,3)),v=given('V',P(4,0));z.segments.push([key(u),key(v)]);
  z.title='Deux tangentes parallèles';z.goal='Trace les deux tangentes au cercle parallèles à (UV). Le cercle a pour centre O et passe par R.';
  at(o,P(11,12,2),id,'T1');at(o,P(5,4,2),id,'T2');
 }else if(number<=10){
  const specs=[{o:P(5,8,2),r:[3,2],p:P(5,4),up:P(17,26,5),down:P(17,14,5)},{o:P(3,4),r:[2,1],p:P(19,12,3),up:P(21,28,5),down:P(21,12,5)},{o:P(3,3),r:[1,1],p:P(12,13,3),up:P(68,99,25),down:P(4,3)},{o:P(3,4),r:[3,1],p:P(8,4),up:P(24,32,5),down:P(24,8,5)}];
  const {o,r,p:pt,up,down}=specs[number-7];given('O',o);given('P',pt);const id=circle(o,...r);radius(o,...r,'R');
  z.title=['Depuis un point extérieur','Les deux tangentes','Un point extérieur oblique','Depuis le bord du cadre'][number-7];
  z.goal=number===7?'Trace la tangente passant par P dont le contact est au-dessus de (OP). O est le centre du cercle, qui passe par R.':'Trace les deux tangentes au cercle passant par P. O est son centre et R est sur le cercle.';
  at(o,up,id,'T1');if(number!==7)at(o,down,id,'T2');
 }else{
  let o1,o2,r1,r2;
  if(number===11){o1=P(2,4);o2=P(6,4);r1=[1,1];r2=[1,1];}
  if(number===12){o1=P(2,2);o2=P(5,6);r1=[1,1];r2=[1,1];}
  if(number===13){o1=P(2,4);o2=P(9,8,2);r1=[2,1];r2=[1,2];}
  if(number===14){o1=P(5,8,2);o2=P(5,4);r1=[1,1];r2=[1,1];}
  if(number===15){o1=P(23,40,10);o2=P(53,40,10);r1=[21,10];r2=[3,10];}
  given('O1',o1);given('O2',o2);const c1=circle(o1,...r1,'c1'),c2=circle(o2,...r2,'c2');radius(o1,...r1,'R1');radius(o2,...r2,'R2');
  z.title=['Deux cercles de même rayon','Les centres en diagonale','Deux rayons différents','Les tangentes qui se croisent','Les quatre tangentes communes'][number-11];
  z.goal=number===14?'Trace les deux tangentes communes qui croisent le segment [O1O2]. Les cercles sont centrés en O1 et O2 et passent par R1 et R2.':number===15?'Trace les quatre tangentes communes aux deux cercles. O1 et O2 sont les centres, R1 et R2 fixent les rayons.':'Trace les deux tangentes communes extérieures : les centres restent du même côté de chaque droite. O1 et O2 sont les centres ; R1 et R2 fixent les rayons.';
  const contact=(o,r,nx,ny,den)=>offset(o,r[0]*nx,r[0]*ny,r[1]*den);
  const pair=(nx,ny,den,internal,index)=>{
   const a=contact(o1,r1,nx,ny,den),b=contact(o2,r2,internal?-nx:nx,internal?-ny:ny,den);
   z.targetLine(a,b,'Tangente commune');const t=z.targets[z.targets.length-1];t.circles=[c1,c2];t.contacts=[{p:key(a),label:'T'+index},{p:key(b),label:'U'+index}];
  };
  if(number===11){pair(0,1,1,false,1);pair(0,-1,1,false,2);}
  if(number===12){pair(-4,3,5,false,1);pair(4,-3,5,false,2);}
  if(number===13){pair(3,4,5,false,1);pair(3,-4,5,false,2);}
  if(number===14){pair(4,3,5,true,1);pair(4,-3,5,true,2);}
  if(number===15){given('S',P(29,20,5));given('I',P(197,160,40));pair(3,4,5,false,1);pair(3,-4,5,false,2);pair(4,3,5,true,3);pair(4,-3,5,true,4);z.goal+=' S et I, les centres d’homothétie, sont donnés.';}
 }
 z.hints=['Une tangente est perpendiculaire au rayon au point de contact.','Les cercles sont des figures de référence données : aucun cercle auxiliaire ne se trace. Les points donnés s’utilisent sans mesurer leurs coordonnées.'];
 if(number>=11)z.hints.push('Les centres d’homothétie de deux cercles relient les points de contact correspondants.');
 const level=z.finish();level.id='21-'+number;level.number=number;level.circles=circles;level.difficulty=Math.min(5,2+Math.floor((number-1)/4));
 if(number===6){const a=level.targets[0].contacts[0].p;level.given.push({p:a,label:'A'});level.goal='A est sur le cercle. Trace la tangente en A puis la tangente parallèle opposée. O est le centre.';}
 if(number>=7&&number<=10){const a=key(number===7?P(17,26,5):number===8?P(21,28,5):number===9?P(68,99,25):P(24,32,5));level.given.push({p:a,label:'A'});level.segments.push([key(givenPointFor(level,'P')),a]);const o=givenPointFor(level,'O'),down=number===7?P(17,14,5):number===8?P(21,12,5):number===9?P(4,3):P(24,8,5);level.targets=[{kind:'line',line:key(cross(down,rotate(o,down))),label:'Seconde tangente',circles:[0],contacts:[{p:key(down),label:'B'}]}];level.goal='La tangente (PA) est donnée. Construis l’autre tangente au cercle passant par P. O est le centre.';}
 if(number>=12){level.given.push({p:level.targets[0].contacts[0].p,label:'A'});level.goal=(number===14?'A est le contact d’une tangente commune intérieure. Trace les deux tangentes communes qui croisent [O1O2].':number===15?'A et B sont les contacts, sur le premier cercle, d’une tangente extérieure et d’une tangente intérieure. Construis les quatre tangentes communes.':'A est le contact d’une tangente commune extérieure. Trace les deux tangentes communes extérieures.');if(number===15){level.given=level.given.filter(g=>!['S','I'].includes(g.label));level.given.push({p:level.targets[2].contacts[0].p,label:'B'});}}
 return reuseGivenStrokes(buildGeometricSolution(level));
}
for(let n=1;n<=15;n++){try{levels.push(makeTangent(n));}catch(e){console.error('Tangente',n);throw e;}}
console.log('Chapitre 21 : 15 tangentes et constructions bornées.');
fs.writeFileSync(new URL('../src/content.json',import.meta.url),JSON.stringify({chapters,levels}));
console.log(`${levels.length} niveaux écrits.`);
