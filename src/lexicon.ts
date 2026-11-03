export type Entry={name:string;definition:string;example:string;diagram:string};
export const lexicon:Entry[]=[
 {name:'Point',definition:'Une position précise, sans épaisseur ni taille.',example:'Un nœud ou le croisement de deux droites peut recevoir un point.',diagram:'point'},
 {name:'Droite',definition:'Une ligne droite sans fin. Dans TRAME, le cadre en montre la partie visible.',example:'Deux points distincts déterminent une unique droite.',diagram:'line'},
 {name:'Intersection',definition:'Un point commun à deux droites qui se croisent.',example:'Les lignes du quadrillage comptent aussi comme des droites.',diagram:'cross'},
 {name:'Milieu',definition:'Le point d’un segment situé à égale distance de ses deux extrémités.',example:'Si AB mesure 4 carreaux, AM et MB en mesurent chacun 2.',diagram:'mid'},
 {name:'Diagonales',definition:'Les segments qui relient deux sommets non consécutifs d’un polygone.',example:'Dans un parallélogramme, les diagonales se coupent en leur milieu.',diagram:'para'},
 {name:'Parallèles',definition:'Deux droites d’un même plan qui ont la même direction et ne se rencontrent pas.',example:'Avancer de 2 carreaux puis monter de 1 donne une direction que l’on peut répéter.',diagram:'parallel'},
 {name:'Vecteur',definition:'Un déplacement défini par une direction, un sens et une longueur.',example:'Le vecteur de U vers V décrit la translation qui envoie U sur V.',diagram:'parallel'},
 {name:'Parallélogramme',definition:'Un quadrilatère dont les côtés opposés sont parallèles.',example:'Ses diagonales ont le même milieu.',diagram:'para'},
 {name:'Perpendiculaires',definition:'Deux droites qui se coupent en formant un angle droit.',example:'À la direction (2, 1) correspond la direction perpendiculaire (−1, 2).',diagram:'perp'},
 {name:'Projection',definition:'Le pied de la perpendiculaire abaissée d’un point sur une droite.',example:'H appartient à la droite et (AH) lui est perpendiculaire.',diagram:'perp'},
 {name:'Médiatrice',definition:'La droite perpendiculaire à un segment qui passe par son milieu.',example:'Tout point de la médiatrice est à égale distance des deux extrémités.',diagram:'bisector'},
 {name:'Symétrie centrale',definition:'Un demi-tour autour d’un point O.',example:'O est le milieu du segment reliant un point à son image.',diagram:'central'},
 {name:'Symétrie axiale',definition:'Un retournement par rapport à une droite, comme dans un miroir.',example:'L’axe est la médiatrice du segment reliant A à A′.',diagram:'mirror'},
 {name:'Translation',definition:'Un déplacement qui fait glisser tous les points de la même façon.',example:'Les segments reliant chaque point à son image sont parallèles et de même longueur.',diagram:'parallel'},
 {name:'Triangle',definition:'Une figure délimitée par trois segments reliant trois points non alignés.',example:'Ses médianes se rencontrent toujours en un même point.',diagram:'median'},
 {name:'Médiane',definition:'Dans un triangle, le segment qui relie un sommet au milieu du côté opposé.',example:'Une médiane partage l’aire du triangle en deux parts égales.',diagram:'median'},
 {name:'Centre de gravité',definition:'Le point d’équilibre d’un ensemble de masses, d’un fil ou d’une surface.',example:'Pour deux masses égales, c’est le milieu. Pour une plaque triangulaire uniforme, c’est la rencontre des médianes.',diagram:'centroid'},
 {name:'Fil uniforme',definition:'Un fil dont chaque unité de longueur porte la même masse.',example:'Pour un fil coudé, chaque segment compte proportionnellement à sa longueur, et son centre est son milieu.',diagram:'wire'},
 {name:'Surface uniforme',definition:'Une plaque dont chaque unité d’aire porte la même masse.',example:'On combine les centres des morceaux en tenant compte de leurs aires. La moyenne des sommets ne suffit pas.',diagram:'surface'},
 {name:'Barycentre',definition:'La moyenne de plusieurs positions, pondérée par leurs masses.',example:'Une masse 2 en B compte deux fois autant qu’une masse 1 en A. Le centre est plus près de B.',diagram:'weighted'},
 {name:'Thalès',definition:'Des droites parallèles découpent des segments dans les mêmes proportions.',example:'Dans un triangle, une parallèle à la base permet de reporter une moitié ou un tiers sur un autre côté.',diagram:'thales'},
 {name:'Rapport',definition:'Le nombre par lequel on multiplie une longueur pour en obtenir une autre.',example:'AP = ⅓ AB signifie que P est au premier tiers de [AB] depuis A.',diagram:'ratio'},
 {name:'Homothétie',definition:'Un agrandissement ou une réduction autour d’un centre, avec un même rapport.',example:'Avec un rapport −2, l’image est deux fois plus loin du centre et de l’autre côté.',diagram:'thales'},
 {name:'Rotation',definition:'Un mouvement qui fait tourner tous les points du même angle autour d’un centre.',example:'Un quart de tour correspond à 90°, dans un sens précisé.',diagram:'rotation'},
 {name:'Ligne brisée',definition:'Un chemin constitué de plusieurs segments consécutifs.',example:'Sa longueur est la somme des longueurs des segments, même lorsque le chemin fait un détour.',diagram:'wire'},
 {name:'Aire',definition:'La mesure d’une surface.',example:'Deux triangles ayant la même hauteur ont des aires proportionnelles à leurs bases.',diagram:'median'},
 {name:'Orthocentre',definition:'Le point de rencontre des trois hauteurs d’un triangle.',example:'Une hauteur passe par un sommet et est perpendiculaire au côté opposé.',diagram:'altitude'},
 {name:'Cercle circonscrit',definition:'Le cercle qui passe par les trois sommets d’un triangle.',example:'Son centre est à la rencontre des médiatrices des côtés. Il est équidistant des trois sommets.',diagram:'circum'},
 {name:'Perspective',definition:'Ici, deux figures dont les sommets correspondants sont alignés avec un même centre.',example:'Les droites (AA′), (BB′) et (CC′) passent par O.',diagram:'perspective'},
 {name:'Alignement',definition:'Des points sont alignés lorsqu’une même droite passe par chacun d’eux.',example:'Deux points fixent une droite ; un troisième peut appartenir à cette droite.',diagram:'ratio'},
 {name:'Varignon',definition:'Les milieux successifs des côtés d’un quadrilatère forment toujours un parallélogramme.',example:'Cette propriété reste vraie si le quadrilatère de départ est irrégulier.',diagram:'varignon'},
 {name:'Pappus',definition:'Deux triplets de points alignés engendrent trois intersections qui sont elles-mêmes alignées.',example:'Pour A, B, C et D, E, F alignés : (AE)∩(BD), (AF)∩(CD) et (BF)∩(CE) sont alignés.',diagram:'pappus'}
];
export function diagram(type:string):string {
 const line=(x:number,y:number,u:number,v:number,accent=false)=>`<path d="M${x} ${y}L${u} ${v}" stroke="${accent?'#d17946':'#236a60'}" stroke-width="2" fill="none"/>`;
 const dot=(x:number,y:number,t='')=>`<circle cx="${x}" cy="${y}" r="3.8" fill="#d17946"/><text x="${x+6}" y="${y-7}" fill="#205d53" font-size="11">${t}</text>`;
 let content='';switch(type){
 case'point':content=dot(92,62,'A');break;
 case'line':content=line(12,96,178,22)+dot(55,77,'A')+dot(132,43,'B');break;
 case'cross':content=line(20,20,170,100)+line(20,100,170,20)+dot(95,60,'I');break;
 case'mid':case'central':case'weighted':case'ratio':content=line(25,85,165,35)+dot(25,85,'A')+dot(165,35,'B')+dot(type==='weighted'?118:95,type==='weighted'?52:60,type==='central'?'O':type==='weighted'?'G':'M');break;
 case'parallel':content=line(20,65,145,20)+line(45,105,170,60)+dot(45,105,'A')+dot(170,60,'A′');break;
 case'para':case'varignon':content=`<path d="M25 95L125 95L165 25L65 25Z" fill="#236a6010" stroke="#236a60" stroke-width="2"/>`+line(25,95,165,25,true)+line(125,95,65,25,true)+dot(95,60,'M');if(type==='varignon')content+=`<path d="M75 95L145 60L115 25L45 60Z" fill="#d1794620" stroke="#d17946" stroke-width="2"/>`;break;
 case'perp':case'bisector':case'mirror':content=line(15,80,175,80)+line(95,12,95,110,true)+`<path d="M95 69H106V80" stroke="#236a60" fill="none"/>`+dot(50,80,'A')+dot(140,80,'B')+dot(95,80,'M');break;
 case'wire':content=line(25,95,115,95)+line(115,95,115,25)+dot(25,95,'A')+dot(115,95,'B')+dot(115,25,'C')+dot(89,80,'G');break;
 case'surface':content=`<path d="M30 20H155V50H65V105H30Z" fill="#236a6020" stroke="#236a60" stroke-width="2"/>`+dot(72,51,'G');break;
 case'thales':case'perspective':content=line(30,105,95,15)+line(95,15,170,105)+line(30,105,170,105)+line(62.5,60,132.5,60,true)+dot(95,15,'O');break;
 case'rotation':content=line(95,70,35,90)+line(95,70,115,10,true)+dot(95,70,'O')+dot(35,90,'A')+dot(115,10,'A′')+`<path d="M62 80 A34 34 0 0 1 105 38" fill="none" stroke="#d17946" stroke-dasharray="3 3"/>`;break;
 case'pappus':content=line(15,20,175,20)+line(15,100,175,100)+line(25,20,95,100,true)+line(95,20,25,100,true)+line(25,20,165,100,true)+line(165,20,25,100,true)+line(95,20,165,100,true)+line(165,20,95,100,true)+line(15,60,175,60)+dot(60,60)+dot(95,60)+dot(130,60);break;
 default:content=`<path d="M25 100L165 100L75 15Z" fill="#236a6010" stroke="#236a60" stroke-width="2"/>`+line(75,15,95,100,true)+line(25,100,120,57.5,true)+dot(88.3,71.6,'G');break;
 }return `<svg viewBox="0 0 190 120" aria-label="Exemple géométrique" role="img"><defs><pattern id="g-${type}" width="15" height="15" patternUnits="userSpaceOnUse"><path d="M15 0H0V15" fill="none" stroke="#dfe6dd" stroke-width=".7"/></pattern></defs><rect width="190" height="120" fill="url(#g-${type})"/>${content}</svg>`;
}
