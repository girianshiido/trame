import './style.css';
import data from './content.json';
import {read,key,p,xy,candidates,inside,lineThrough,legalPoint,type Board,type H} from './geometry';
import {GridView} from './board';
import {AttemptClock,newAttempt,formatTime,formatRecordTime,type Attempt} from './attempt';
import {recordResult,achievements,unlockAchievements} from './records';
import {solved,type Level,type Chapter} from './types';
import {load,persist,validate,fresh,mergeSaves,resetSave,type Save} from './persistence';
import {lexicon,diagram} from './lexicon';
import {themes,palette,validTheme,type ThemeId} from './themes';
import {magnifierPoints} from './precision';
import {canPlay,canVisitChapter,resumePuzzle,nextPuzzle,chapterDone} from './progression';

const levels=data.levels as Level[],chapters=data.chapters as Chapter[];
const $=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s)!;
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const icons:Record<string,string>={map:'▦',book:'▤',undo:'↶',redo:'↷',line:'╱',point:'·',close:'×',next:'→',sound:'♫',settings:'☷',hint:'?',free:'✧',precision:'⊕',check:'✓'};
const icon=(n:string)=>`<span aria-hidden="true" class="icon">${icons[n]||n}</span>`;
let save:Save,storageError=false;
try{const res=load(localStorage);save=res.save;storageError=res.error;}catch{save=fresh();storageError=true;}
let level=resumePuzzle(save.current,levels,save);
const freeLevel:Level={id:'free',chapter:0,number:0,title:'L’atelier libre',goal:'Pose des points, croise des droites et explore tes propres idées.',lesson:'Toute la grille est à toi. Les points restent dans le cadre.',hints:[],given:[],segments:[],initialLines:[],targets:[],steps:[],difficulty:0,par:0};
type HistoryEntry={board:Board;attempt?:Attempt};
const clock=new AttemptClock();
let board:Board={points:[],lines:[]},history:HistoryEntry[]=[],future:HistoryEntry[]=[],selected:string|null=null,hover:H|null=null,preview:H|null=null;
let chapterReturn=false,precision=false,complete=false,sessionMoves=0,pointer:{x:number;y:number;start:H|null;id:number;held:boolean;timer:number}|null=null;
let offlineText=location.protocol==='file:'?'Fichier autonome · hors connexion':'Préparation du mode hors connexion…';
let keyboard:H=p(4,4),modalReturn:HTMLElement|null=null,audio:AudioContext|null=null,updateReady:ServiceWorker|null=null;

$('#app').innerHTML=`
<header class="topbar"><a class="brand" href="#" aria-label="TRAME, écran titre"><span class="brand-emblem" aria-hidden="true">✧</span><span>TRAME</span></a><div class="mission-meta"><button id="chapterLink" data-action="chapter"></button><span id="levelCount"></span></div><span id="saveLabel" class="sr-only" role="status">Progression enregistrée</span></header>
<section id="home" class="home-screen" aria-label="Écran titre de TRAME">
  <div class="home-art" aria-hidden="true"><svg viewBox="0 0 320 250"><defs><pattern id="homeGrid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="currentColor" stroke-width=".65" opacity=".17"/></pattern><linearGradient id="homeLine"><stop stop-color="var(--given)"/><stop offset="1" stop-color="var(--accent)"/></linearGradient></defs><rect x="32" y="16" width="256" height="224" rx="24" fill="url(#homeGrid)"/><path d="M38 185L278 65M54 48L268 209M85 226L235 30" fill="none" stroke="url(#homeLine)" stroke-width="3" stroke-linecap="round" opacity=".65"/><path d="M88 160L207 98L227 177Z" fill="var(--accent)" opacity=".08"/><g fill="var(--given)" stroke="var(--panel)" stroke-width="3"><circle cx="88" cy="160" r="7"/><circle cx="207" cy="98" r="7"/><circle cx="227" cy="177" r="7"/></g><circle cx="153" cy="128" r="20" fill="var(--accent)" opacity=".12"/><circle cx="153" cy="128" r="6" fill="var(--accent)" stroke="var(--panel)" stroke-width="3"/></svg></div>
  <div class="home-copy"><p class="home-kicker">L’ATELIER DES GÉOMÈTRES</p><h1>TRAME<span>·</span></h1><p class="home-tagline">La géométrie<br>au bout des doigts.</p><button class="primary home-play" data-action="play" id="homePlay">Commencer <span>→</span></button><p id="homeResume" class="home-resume"></p><button class="home-records" data-action="records">Records & succès <span id="achievementCount"></span></button></div>
</section>
<div class="shell"><aside class="sidebar" aria-label="Les chapitres"><div class="sidebar-head"><span class="eyebrow">LES ${chapters.length} CHAPITRES</span><span id="totalCount"></span></div><div class="journey-line"><div id="totalBar"></div></div><div id="chapterList"></div><button class="free-button" data-action="free">${icon('free')} L’atelier libre <span>↗</span></button><div class="sidebar-foot">Deux gestes.<br>Une infinité d’idées.</div></aside>
<main class="workspace"><div class="mission"><h1 id="levelTitle" class="sr-only"></h1><p id="goal"></p></div>
<div class="desk"><div class="board-frame"><div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div><canvas id="grid" tabindex="0" aria-label="Quadrillage de 0 à 8. Flèches pour déplacer le curseur, Entrée pour poser un point, Espace pour relier deux points, crochets pour parcourir les intersections." role="application"></canvas><div class="board-signature" aria-hidden="true">TRAME / 08 × 08</div></div><aside class="desk-note"><span class="eyebrow">LE CARNET</span><div id="noteDiagram"></div><h2 id="noteTitle"></h2><p id="noteText"></p><button class="text-button" data-action="concept">Ouvrir le carnet ${icon('next')}</button><div class="rule-note">Une grille de 8 × 8.<br>Tout se construit à l’intérieur.<br>Toutes les méthodes comptent.</div></aside></div>
<div class="toolbar" aria-label="Outils de construction"><div id="attemptReadout" class="attempt-readout" aria-label="Chrono et nombre de constructions"><span id="timer">0:00</span><small id="stepCountLive">0 étape</small></div><button id="undo" data-action="undo" class="square" aria-label="Annuler" title="Annuler">${icon('undo')}</button><button id="redo" data-action="redo" class="square" aria-label="Rétablir" title="Rétablir">${icon('redo')}</button><button id="restart" data-action="restart" class="square" aria-label="Effacer le dessin et recommencer le niveau" title="Recommencer ce niveau">⟳</button><button id="precision" data-action="precision" class="square" aria-label="Loupe de précision" aria-pressed="false" title="Loupe de précision">${icon('precision')}</button>
<div id="success" class="success" hidden><strong class="sr-only">Construction juste.</strong><button data-action="other">Autre méthode</button><button class="primary" data-action="next">Suite →</button></div></div><div id="status" class="sr-only" role="status" aria-live="polite"></div>
<div class="level-footer"><button data-action="previous" id="previous" aria-label="Niveau précédent">←</button><span id="footerText">CONSTRUCTION LIBRE</span><button data-action="next" id="next" aria-label="Niveau suivant">→</button></div></main></div>
<nav class="mobile-nav" aria-label="Navigation"><button data-action="map">${icon('map')}<span>Parcours</span></button><button data-action="free">${icon('free')}<span>Atelier libre</span></button><button data-action="lexicon">${icon('book')}<span>Encyclopédie</span></button><button data-action="settings">${icon('settings')}<span>Réglages</span></button></nav>
<dialog id="dialog"><div class="dialog-head"><span id="dialogEyebrow" class="eyebrow"></span><button id="dialogClose" class="square" aria-label="Fermer">×</button></div><div id="dialogBody"></div></dialog><div class="toast" id="toast" role="status" hidden></div>`;
const view=new GridView($('#grid'),save.theme),dialog=$<HTMLDialogElement>('#dialog');
document.body.dataset.screen='home';
applyTheme(save.theme);
const clone=(b:Board):Board=>({points:[...b.points],lines:[...b.lines]});
function store(){
  save.drafts[level.id]=clone(board);
  if(level.id!=='free'){save.current=level.id;save.attempts[level.id]=clock.snapshot();}
  try{if(!persist(localStorage,save))throw Error();$('#saveLabel').textContent='Progression enregistrée';}
  catch{$('#saveLabel').textContent='Sauvegarde indisponible';storageError=true;}
}
function draw(){
  document.body.dataset.complete=String(complete);
  $('#success [data-action=next]').textContent=complete&&(chapterReturn||level.number===15&&chapterDone(level.chapter,levels,save))?'Chapitres →':'Suite →';
  view.update({level,board,selected,preview,hover,complete});
  renderReadout();
  $('#undo').toggleAttribute('disabled',history.length===0);
  $('#redo').toggleAttribute('disabled',future.length===0);
}
function setStatus(text?:string){$('#status').textContent=text||(precision?'Loupe active : touche la zone à examiner.':selected?'Choisis l’autre extrémité de la droite.':'Appui bref : point · Appui maintenu puis glissé : droite.');}
function notify(s:string){$('#toast').textContent=s;$('#toast').hidden=false;window.setTimeout(()=>$('#toast').hidden=true,3500);}
function sound(win=false){if(!save.sound)return;try{audio||=new AudioContext();void audio.resume();const t=audio.currentTime;for(let i=0;i<(win?3:1);i++){const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=win?[523.25,659.25,783.99][i]:480;g.gain.setValueAtTime(0,t+i*.12);g.gain.linearRampToValueAtTime(.045,t+i*.12+.012);g.gain.exponentialRampToValueAtTime(.001,t+i*.12+.25);o.connect(g).connect(audio.destination);o.start(t+i*.12);o.stop(t+i*.12+.3);}}catch{}}
document.addEventListener('visibilitychange',()=>{if(document.hidden){void audio?.suspend();pauseAttempt();}else resumeAttempt();});
window.addEventListener('pagehide',pauseAttempt);
function progress(){
  const count=Object.keys(save.results).length;
  $('#totalCount').textContent=`${count} / ${levels.length}`;$('#totalBar').style.width=`${count/levels.length*100}%`;
  $('#chapterList').innerHTML=chapters.map(ch=>{
    const open=canVisitChapter(ch.id,levels,save),done=levels.filter(l=>l.chapter===ch.id&&save.results[l.id]).length;
    return `<button class="chapter-item ${level.chapter===ch.id?'current':''}" data-chapter="${ch.id}" ${open?'':'disabled'}><span class="chapter-number">${String(ch.id).padStart(2,'0')}</span><span class="chapter-name">${ch.title}<small>${ch.subtitle}</small></span><span class="chapter-done">${open?(done===15?'✓':done+'/15'):'🔒'}</span></button>`;
  }).join('');
}
function start(l:Level,savePrevious=true,begin=true){
  if(!canPlay(l,levels,save)){notify('Réussis le niveau précédent pour débloquer celui-ci.');return;}
  if(savePrevious)pauseAttempt();
  const freshPuzzle=begin&&l.id!=='free';
  level=l;board=clone(freshPuzzle?{points:[],lines:l.initialLines}:save.drafts[l.id]||{points:[],lines:l.initialLines});
  board.lines=[...new Set([...l.initialLines,...board.lines])];
  history=[];future=[];selected=null;hover=null;preview=null;
  complete=solved(level,board);chapterReturn=false;
  const hasOldDrawing=board.points.length>0||board.lines.some(l=>!level.initialLines.includes(l));
  clock.restore(freshPuzzle?newAttempt():save.attempts[level.id]||newAttempt(!hasOldDrawing));
  if(complete)clock.pause();
  sessionMoves=clock.snapshot().steps;keyboard=p(4,4);precision=false;updateTools();
  document.body.dataset.screen='game';
  const ch=chapters[l.chapter-1];
  $('#chapterLink').textContent=ch?`${ch.title}`:'Atelier libre';
  $('#levelCount').textContent=ch?`${l.number} / 15`:'';
  $('#levelTitle').textContent=l.title;$('#goal').textContent=l.goal;
  $('#noteTitle').textContent=ch?.subtitle||'Explorer librement';
  $('#noteText').textContent=ch?.intro||'';
  $('#noteDiagram').innerHTML=diagram(ch?lexicon.find(t=>t.name===ch.terms[0])?.diagram||'cross':'para');
  $('#success').hidden=!complete;
  const i=levels.indexOf(l),next=levels[i+1];
  $('#previous').toggleAttribute('disabled',i<=0);
  $('#next').toggleAttribute('disabled',!next||!canPlay(next,levels,save));
  if(begin&&!complete&&level.id!=='free')clock.begin();
  setStatus();progress();draw();store();if(begin)resumeAttempt();requestAnimationFrame(fitBoard);
}
function updateTools(){$('#precision').classList.toggle('active',precision);$('#precision').setAttribute('aria-pressed',String(precision));}
function change(mutator:()=>boolean){
  if(complete){notify('Niveau réussi. Recommence pour un nouvel essai.');return;}
  const before=clone(board);if(!mutator())return;
  history.push({board:before});future=[];
  if(level.id!=='free')clock.step();sessionMoves=clock.snapshot().steps;
  selected=null;hover=null;preview=null;sound();check();store();draw();
}
function check(){
  const wasDone=chapterDone(level.chapter,levels,save);
  complete=solved(level,board);$('#success').hidden=!complete;
  if(complete){
    clock.pause();const attempt=clock.snapshot(),old=save.results[level.id];
    save.results[level.id]=recordResult(old,attempt);clock.recorded();
    const wonAchievements=unlockAchievements(save,levels);sound(true);
    const result=save.results[level.id];
    if(attempt.eligible&&result.bestTimeMs!==undefined&&(!old?.bestTimeMs||result.bestTimeMs<old.bestTimeMs))notify(`Nouveau record : ${formatRecordTime(result.bestTimeMs)}${wonAchievements.length?' · '+wonAchievements.length+' succès débloqué'+(wonAchievements.length>1?'s':''):''}`);
    else if(wonAchievements.length)notify(`${wonAchievements.length} succès débloqué${wonAchievements.length>1?'s':''} !`);
    else if(!attempt.eligible)notify('Réussite conservée. Recommence depuis le départ pour établir un record complet.');
    setStatus('Bravo ! La figure demandée est exacte.');progress();
    if(!wasDone&&chapterDone(level.chapter,levels,save)){
      chapterReturn=true;const won=level.id,ch=level.chapter;
      window.setTimeout(()=>{if(level.id===won&&complete&&!dialog.open&&document.body.dataset.screen==='game')chapterOverview(ch);},900);
    }
  }else setStatus();
}
function act(a:H,asLine=false){const k=key(a);if(!inside(a)||!legalPoint(k,board,level.given.map(g=>g.p),8,level.segments))return;beginAttempt();if(!asLine)change(()=>{if(board.points.includes(k)||level.given.some(g=>g.p===k)){setStatus('Ce point est déjà présent.');return false;}board.points.push(k);return true;});else if(!selected){selected=k;draw();setStatus();}else if(selected===k){selected=null;draw();setStatus();}else{const first=selected;change(()=>{const l=lineThrough(first,k);if(!l||board.lines.includes(l)){selected=null;setStatus('Cette droite existe déjà.');return false;}board.lines.push(l);for(const q of [first,k])if(!board.points.includes(q)&&!level.given.some(g=>g.p===q))board.points.push(q);return true;});}}
function undo(){
  if(!history.length)return;const entry=history.pop()!;
  future.push({board:clone(board),attempt:entry.attempt?clock.snapshot():undefined});
  if(entry.attempt){clock.pause();clock.restore(entry.attempt);}clock.undo();
  board=entry.board;selected=null;complete=solved(level,board);$('#success').hidden=!complete;
  if(!complete)resumeAttempt();setStatus();store();draw();
}
function redo(){
  if(!future.length)return;const entry=future.pop()!;
  history.push({board:clone(board),attempt:entry.attempt?clock.snapshot():undefined});
  board=entry.board;if(entry.attempt){clock.pause();clock.restore(entry.attempt);}else if(level.id!=='free')clock.step();
  check();if(!complete)resumeAttempt();store();draw();
}
function modal(eyebrow:string,html:string,wide=false){pauseAttempt();modalReturn=document.activeElement as HTMLElement;$('#dialogEyebrow').textContent=eyebrow;$('#dialogBody').innerHTML=html;dialog.classList.toggle('wide',wide);if(!dialog.open)dialog.showModal();$('#dialogClose').focus();}
function close(){dialog.close();modalReturn?.focus();resumeAttempt();}
$('#dialogClose').onclick=close;dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
dialog.addEventListener('close',()=>{modalReturn?.focus();resumeAttempt();});
function chapterOverview(completed=0){
  const frontier=nextPuzzle(levels,save);
  modal('LE PARCOURS',`<h2>${completed===chapters.length?'Parcours terminé !':completed?'Chapitre terminé !':'Les chapitres.'}</h2><p class="dialog-intro">${completed===chapters.length?'Tous les chapitres sont terminés. Chaque niveau reste accessible pour explorer de nouvelles méthodes.':completed?`${chapters[completed-1].title} rejoint tes chapitres terminés. Le suivant est ouvert.`:'Une idée après l’autre. Les chapitres terminés restent libres à explorer.'}</p><div class="chapter-cards">${chapters.map(ch=>{
    const done=chapterDone(ch.id,levels,save),open=canVisitChapter(ch.id,levels,save),count=levels.filter(l=>l.chapter===ch.id&&save.results[l.id]).length;
    return `<button data-chapter="${ch.id}" class="chapter-card ${done?'completed':''} ${frontier?.chapter===ch.id?'frontier':''}" ${open?'':'disabled'} aria-label="Chapitre ${ch.id} : ${esc(ch.title)}${done?', terminé':open?', disponible':', verrouillé'}"><span class="chapter-card-number">${String(ch.id).padStart(2,'0')}</span><span class="chapter-card-copy"><strong>${ch.title}</strong><small>${done?'Terminé · Rejouer librement':open?`${count} / 15`:'À débloquer'}</small></span><span class="chapter-card-sign" aria-hidden="true">${done?'✓':open?'→':'🔒'}</span></button>`;
  }).join('')}</div>`,true);
}
function map(chId=level.chapter||1){
  if(!canVisitChapter(chId,levels,save)){chapterOverview();return;}
  const ch=chapters[chId-1],done=chapterDone(chId,levels,save);
  modal(`CHAPITRE ${String(ch.id).padStart(2,'0')}${done?' · ✓ TERMINÉ':''}`,`<button class="back-link" data-action="map">← Les chapitres</button><h2>${ch.title}</h2><p class="dialog-intro">${done?'Choisis librement le niveau que tu souhaites rejouer.':ch.intro}</p><div class="level-grid">${levels.filter(l=>l.chapter===chId).map(l=>{
    const open=canPlay(l,levels,save),won=!!save.results[l.id];
    return `<button data-level="${l.id}" class="${won?'done':''} ${l.id===level.id?'selected':''}" ${open?'':'disabled'} aria-label="Niveau ${l.number} : ${esc(l.title)}${won?', réussi':!open?', verrouillé':''}"><span>${String(l.number).padStart(2,'0')}</span><small>${won?(save.results[l.id].bestTimeMs!==undefined?'✓ '+formatRecordTime(save.results[l.id].bestTimeMs!):'✓ Réussi'):open?'À toi de jouer':'🔒'}</small></button>`;
  }).join('')}</div>`,true);
}

function encyclopedia(term=''){modal('LE CARNET DES GÉOMÈTRES',`<h2>Les idées derrière les traits.</h2><p class="dialog-intro">Des mots simples, un exemple, et la grille devient plus claire.</p><label class="search-label">Rechercher une notion<input id="lexSearch" type="search" value="${esc(term)}" placeholder="Milieu, médiane, centre de gravité…" autocomplete="off"></label><div class="lexicon" id="lexEntries"></div>`,true);const fill=(v:string)=>{const q=v.toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'');const entries=lexicon.filter(e=>(e.name+' '+e.definition).toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(q));$('#lexEntries').innerHTML=entries.map(e=>`<article class="lex-card">${diagram(e.diagram)}<div><h3>${e.name}</h3><p>${e.definition}</p><small>${e.example}</small></div></article>`).join('')||'<p>Aucune notion trouvée.</p>';};fill(term);$('#lexSearch').addEventListener('input',e=>fill((e.target as HTMLInputElement).value));}
function concept(){const ch=chapters[level.chapter-1];encyclopedia(ch?.terms[0]||'');}
function hint(){const ch=chapters[level.chapter-1];modal('UN RAPPEL, PAS UN CORRIGÉ',`<h2>${ch?ch.title:'Les deux gestes'}</h2><p class="dialog-intro">La découverte reste à toi.</p><div class="hint-list">${(level.hints.length?level.hints:['Pose un point sur un nœud ou une intersection. Relie deux points pour tracer une droite.']).map((t,i)=>`<p><span>${i+1}</span>${esc(t)}</p>`).join('')}</div><p class="muted">Les traits auxiliaires sont libres. Seule la figure finale compte.</p><button class="primary full" data-action="concept">Revoir la définition</button>`);}
function settings(){
  modal('TON ATELIER',`<h2>À tes couleurs.</h2><fieldset class="theme-picker"><legend>Thème graphique</legend><div class="theme-grid">${themes.map(t=>`<button class="theme-choice ${save.theme===t.id?'chosen':''}" data-theme="${t.id}" aria-pressed="${save.theme===t.id}" aria-label="Thème ${t.name}"><span class="theme-preview" style="background:${t.bg}"><i style="background:${t.given}"></i><i style="background:${t.accent}"></i><i style="background:${t.secondary}"></i></span><strong>${t.name}</strong><small>${t.description}</small></button>`).join('')}</div></fieldset><div class="settings-list"><button data-action="records"><span>Records & succès</span>✦</button><button data-action="sound"><span>Les sons</span><strong>${save.sound?'Activés':'Coupés'}</strong></button><button data-action="how"><span>Les deux gestes</span>→</button><button data-action="hint"><span>Un rappel sur la notion</span>?</button>${save.results[level.id]?'<button data-action="other"><span>Une autre méthode pour ce niveau</span>→</button>':''}<button data-action="restart"><span>Effacer le dessin et recommencer<small>Les records et réussites restent conservés</small></span>↶</button><button data-action="export"><span>Exporter ma progression</span>↓</button><label class="import-label">Importer une progression<input id="importFile" type="file" accept="application/json,.json"></label><button data-action="update"><span>Rechercher une mise à jour</span>↻</button></div><button class="danger-link" data-action="resetProgress">Effacer toute la progression</button><p class="offline-state" id="offlineState">${offlineText}</p><p class="muted">Progression enregistrée sur cet appareil.</p><p class="version">TRAME 1.2.2 · ${chapters.length} chapitres · ${levels.length} puzzles</p>`);
}
function how(){modal('BIENVENUE DANS TRAME',`<h2>Deux gestes.<br>Une infinité d’idées.</h2><div class="how-steps"><div><b>01</b><h3>Pose un point</h3><p>Touche un nœud du quadrillage, un point donné ou le croisement de droites que tu as tracées.</p></div><div><b>02</b><h3>Relie deux points</h3><p>Glisse du premier au second. Le trait est prolongé jusqu’aux bords.</p></div></div><p>Le cadre est une limite stricte : aucun point ne peut être posé à l’extérieur. Tous les traits de départ sont actifs : leurs croisements visibles sont utilisables sans les retracer. Pour prolonger un segment, relie ses extrémités.</p><p><strong>Toute méthode exacte est acceptée.</strong> Les traits auxiliaires sont libres et aucune limite de temps ou d’étapes n’est imposée. Le corrigé n’est visible qu’après ta réussite.</p><p>Le chrono commence à l’affichage du niveau et compte aussi le temps de réflexion. Il se met en pause dans les menus, au titre et en arrière-plan. Une création de point ou de droite compte pour une étape ; annuler ne rembourse pas les étapes. Les records de temps et d’étapes sont indépendants. Les cercles sont fournis comme figures de référence. On pose les points sur les nœuds et les croisements de traits droits ; aucun cercle auxiliaire ne se trace.</p><p>Deux croisements trop proches ? Active la loupe ⊕, puis touche leur zone pour choisir précisément.</p><details><summary>Jouer au clavier</summary><p>Flèches : déplacer le curseur. [ et ] : parcourir tous les nœuds et croisements disponibles. Entrée : poser un point. Espace : choisir chaque extrémité d’une droite. Échap : annuler la sélection. Ctrl/Cmd + Z : annuler.</p></details><button class="primary full" data-action="close">À moi de jouer →</button>`);}
function other(){if(!save.results[level.id]){notify('Une autre méthode devient visible après ta réussite.');return;}const original=level;let index=0;const demo:Board={points:[],lines:[...level.initialLines]};modal('APRÈS TA RÉUSSITE',`<h2>Une autre construction possible.</h2><p class="dialog-intro">Ta méthode était tout aussi valable. Voici un chemin possible, étape par étape.</p><canvas id="replay" class="replay" aria-label="Construction alternative"></canvas><p id="stepText" class="step-text">La figure de départ.</p><div class="replay-controls"><button id="stepReset">Revenir au départ</button><span id="stepCount">0 / ${level.steps.length}</span><button id="stepNext" class="primary">Étape suivante →</button></div>`);const rv=new GridView($('#replay'),save.theme);const render=()=>{const last=original.steps[index-1],highlight=last?.kind==='point'?last.via:last?.kind==='line'?[lineThrough(last.a,last.b)!]:[];rv.update({level:original,board:demo,selected:null,preview:null,hover:null,complete:index===original.steps.length,highlight,highlightAt:last?.kind==='point'?last.p:undefined});$('#stepCount').textContent=`${index} / ${original.steps.length}`;$('#stepNext').toggleAttribute('disabled',index===original.steps.length);};$('#stepNext').onclick=()=>{const step=original.steps[index++];if(step.kind==='point')demo.points.push(step.p);else{const l=lineThrough(step.a,step.b);if(l)demo.lines.push(l);}$('#stepText').textContent=step.text;render();};$('#stepReset').onclick=()=>{index=0;demo.points=[];demo.lines=[...original.initialLines];$('#stepText').textContent='La figure de départ.';render();};requestAnimationFrame(render);}
function fraction(n:bigint,d:bigint){const gcd=(a:bigint,b:bigint):bigint=>b?gcd(b,a%b):a;const g=gcd(n<0n?-n:n,d);return d/g===1n?String(n/g):`${n/g}/${d/g}`;}
function loupe(x:number,y:number){const [wx,wy]=view.world(x,y);const qs=magnifierPoints(candidates(board,level.given.map(g=>g.p),8,level.segments).values(),[wx,wy],view.unit).map(a=>({a}));if(!qs.length){setStatus('Aucun nœud ni croisement dans cette zone.');return;}modal('LOUPE DE PRÉCISION',`<h2>Choisir le croisement.</h2><p class="dialog-intro">Les numéros correspondent aux points disponibles. Touche un numéro pour poser un point, ou ↗ pour commencer une droite.</p><canvas id="lens" width="520" height="400" class="lens"></canvas><div class="precision-grid">${qs.map((q,i)=>`<div class="precision-choice"><button data-pick="${key(q.a)}"><b>${i+1}</b><span>(${fraction(q.a[0],q.a[2])} ; ${fraction(q.a[1],q.a[2])})</span></button>${selected?'':`<button data-from="${key(q.a)}" aria-label="Relier depuis le point ${i+1}">↗</button>`}</div>`).join('')}</div>`);const tone=palette(save.theme),c=$<HTMLCanvasElement>('#lens').getContext('2d')!,center=view.screen(p(Math.round(wx*10000),Math.round(wy*10000),10000)),ratio=view.canvas.width/view.size,zoom=4,sw=520/zoom,sh=400/zoom;c.fillStyle=tone.board;c.fillRect(0,0,520,400);c.drawImage(view.canvas,(center[0]-sw/2)*ratio,(center[1]-sh/2)*ratio,sw*ratio,sh*ratio,0,0,520,400);qs.forEach((q,i)=>{const [sx,sy]=view.screen(q.a),cx=260+(sx-center[0])*zoom,cy=200+(sy-center[1])*zoom;c.fillStyle=tone.panel;c.beginPath();c.arc(cx,cy,13,0,Math.PI*2);c.fill();c.strokeStyle=tone.accent;c.lineWidth=2;c.stroke();c.fillStyle=tone.ink;c.font='bold 17px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(String(i+1),cx,cy);});}
const canvas=$<HTMLCanvasElement>('#grid');
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;canvas.focus({preventScroll:true});if(precision){loupe(e.clientX,e.clientY);return;}const a=view.snap(e.clientX,e.clientY);if(a)beginAttempt();const id=e.pointerId;const timer=window.setTimeout(()=>{if(!pointer||pointer.id!==id||!pointer.start)return;pointer.held=true;const k=key(pointer.start);selected=k;hover=null;setStatus('Garde l’appui et glisse vers un autre nœud ou croisement.');draw();},340);pointer={x:e.clientX,y:e.clientY,start:a,id,held:false,timer};canvas.setPointerCapture(e.pointerId);hover=a;draw();});
canvas.addEventListener('pointermove',e=>{const a=view.snap(e.clientX,e.clientY);if(pointer){const moved=Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>7;if((moved||pointer.held)&&pointer.start){if(moved)window.clearTimeout(pointer.timer);selected=key(pointer.start);const [x,y]=view.world(e.clientX,e.clientY);preview=a||p(Math.round(Math.max(0,Math.min(8,x))*10000),Math.round(Math.max(0,Math.min(8,y))*10000),10000);hover=null;}else hover=a;}else hover=a;draw();});
canvas.addEventListener('pointerup',e=>{if(!pointer||e.pointerId!==pointer.id)return;window.clearTimeout(pointer.timer);const a=view.snap(e.clientX,e.clientY),drag=Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>7,startPoint=pointer.start,held=pointer.held;pointer=null;preview=null;hover=null;if(drag&&startPoint&&a&&key(startPoint)!==key(a)){selected=key(startPoint);act(a,true);}else if(!drag&&a){selected=null;act(a);}else if(held&&startPoint){selected=null;act(startPoint);}else{selected=null;setStatus(a?'':'Vise un nœud ou un croisement de droites.');}draw();});
canvas.addEventListener('pointercancel',()=>{if(pointer)window.clearTimeout(pointer.timer);pointer=null;selected=null;preview=null;hover=null;setStatus();draw();});canvas.addEventListener('pointerleave',()=>{if(!pointer){hover=null;draw();}});
canvas.addEventListener('keydown',e=>{if(e.key==='Escape'){selected=null;hover=null;preview=null;setStatus();draw();return;}if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();e.shiftKey?redo():undo();return;}if(e.key==='Enter'||e.key===' '){e.preventDefault();act(keyboard,e.key===' ');return;}if(e.key==='['||e.key===']'){e.preventDefault();const cs=[...candidates(board,level.given.map(g=>g.p),8,level.segments).values()].sort((a,b)=>xy(a)[1]-xy(b)[1]||xy(a)[0]-xy(b)[0]);const i=cs.findIndex(a=>key(a)===key(keyboard));keyboard=cs[(i+(e.key===']'?1:-1)+cs.length)%cs.length];}else if(e.key.startsWith('Arrow')){e.preventDefault();const [x,y]=xy(keyboard);keyboard=p(Math.max(0,Math.min(8,Math.round(x)+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0))),Math.max(0,Math.min(8,Math.round(y)+(e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0))));}else return;hover=keyboard;const [x,y]=xy(keyboard);setStatus(`Curseur : (${x.toLocaleString('fr')} ; ${y.toLocaleString('fr')}). Entrée : point. Espace : relier.`);draw();});
function download(){store();const blob=new Blob([JSON.stringify(save,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='TRAME-progression.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);notify('Progression exportée.');}
document.addEventListener('change',async e=>{if((e.target as HTMLElement).id!=='importFile')return;const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;try{if(file.size>3e6)throw Error('Fichier trop volumineux.');const imported=validate(JSON.parse(await file.text()));save=mergeSaves(save,imported);board={points:[],lines:[]};const next=resumePuzzle(save.current,levels,save);applyTheme(save.theme);persist(localStorage,save);close();start(next,false);notify('Progression importée. Tes réussites précédentes sont conservées.');}catch(err){notify(err instanceof Error?err.message:'Fichier de progression invalide.');}});
document.addEventListener('click',async e=>{const btn=(e.target as HTMLElement).closest<HTMLElement>('button, a.brand');if(!btn||btn.hasAttribute('disabled'))return;if(btn.classList.contains('brand')){e.preventDefault();showHome();return;}if(btn.dataset.theme&&validTheme(btn.dataset.theme)){save.theme=btn.dataset.theme;applyTheme(save.theme);store();settings();return;}if(btn.dataset.chapter){map(Number(btn.dataset.chapter));return;}if(btn.dataset.mapchapter){map(Number(btn.dataset.mapchapter));return;}if(btn.dataset.level){const l=levels.find(l=>l.id===btn.dataset.level);if(l&&canPlay(l,levels,save)){close();start(l);}return;}if(btn.dataset.from){selected=btn.dataset.from;close();setStatus('Touche la zone de l’autre extrémité, puis choisis son numéro.');draw();return;}if(btn.dataset.pick){const a=read(btn.dataset.pick);close();act(a,selected!==null);return;}switch(btn.dataset.action){case'play':start(resumePuzzle(save.current,levels,save));break;case'home':showHome();break;case'close':close();break;case'undo':undo();break;case'redo':redo();break;case'precision':precision=!precision;selected=null;updateTools();setStatus();draw();break;case'map':chapterOverview();break;case'chapter':map();break;case'free':if(dialog.open)close();start(freeLevel);break;case'lexicon':encyclopedia();break;case'concept':concept();break;case'hint':hint();break;case'settings':settings();break;case'how':how();break;case'records':showRecords();break;case'resetProgress':confirmReset();break;case'confirmReset':resetProgress();break;case'sound':save.sound=!save.sound;if(!save.sound)void audio?.suspend();store();settings();sound();break;case'restart':restartLevel();break;case'next':case'previous':{if(btn.dataset.action==='next'&&complete&&(chapterReturn||level.number===15&&chapterDone(level.chapter,levels,save))){chapterOverview(level.chapter);break;}const i=levels.indexOf(level),l=levels[i+(btn.dataset.action==='next'?1:-1)];if(l&&canPlay(l,levels,save))start(l);else if(i===levels.length-1)modal('LE PARCOURS CONTINUE',`<h2>Les idées n’ont pas de dernier niveau.</h2><p>Tu peux revisiter les chapitres ou inventer tes propres puzzles dans l’atelier libre.</p><button class="primary full" data-action="free">Ouvrir l’atelier libre →</button>`);break;}case'other':other();break;case'export':download();break;case'update':{if(!('serviceWorker'in navigator)){notify('Ce navigateur ne propose pas le mode hors connexion.');break;}try{const reg=await navigator.serviceWorker.getRegistration();if(!reg){notify('Le mode hors connexion sera disponible depuis la version installable du jeu.');break;}await reg.update();if(reg.waiting){updateReady=reg.waiting;modal('MISE À JOUR PRÊTE',`<h2>Une nouvelle version est prête.</h2><p>Ta progression est conservée.</p><button class="primary full" data-action="applyUpdate">Enregistrer et recharger</button>`);}else notify('Recherche effectuée. Aucune mise à jour prête pour le moment.');}catch{notify('Connexion indisponible. Le jeu reste accessible avec sa version en cache.');}break;}case'applyUpdate':store();navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});updateReady?.postMessage('SKIP_WAITING');break;}});
// Initialize without overwriting the stored draft before it has been restored.
unlockAchievements(save,levels);
const initial=level;start(initial,false,false);showHome();
window.setInterval(()=>{if(clock.running)renderReadout();},250);
if(storageError)notify('Sauvegarde locale indisponible ou récupérée. Pense à exporter ta progression.');
if(!Object.keys(save.results).length&&!save.drafts[initial.id]?.points.length){setStatus('Bienvenue ! Trouve le milieu. Touche le nœud choisi pour le marquer.');}
if('serviceWorker'in navigator&&import.meta.env.PROD&&location.protocol!=='file:')window.addEventListener('load',()=>{
 navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(reg=>{
  reg.addEventListener('updatefound',()=>{const sw=reg.installing;sw?.addEventListener('statechange',()=>{if(sw.state==='installed'&&navigator.serviceWorker.controller)notify('Une mise à jour est prête dans les réglages.');});});
  void navigator.serviceWorker.ready.then(async()=>{
   const urls=[new URL('./index.html',location.href).href,...Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]')).map(s=>s.src),...Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map(s=>s.href)];
   const cached=await Promise.all(urls.map(url=>caches.match(url)));
   offlineText=cached.every(Boolean)?'✓ Jeu prêt hors connexion':'Mise en cache en cours. Garde cette page ouverte un instant.';
   const state=document.querySelector('#offlineState');if(state)state.textContent=offlineText;
  }).catch(()=>{offlineText='Mode hors connexion indisponible dans ce navigateur.';});
 }).catch(()=>{offlineText='La mise en cache hors connexion n’a pas abouti.';notify(offlineText);});
});

function applyTheme(id:ThemeId){
  const theme=palette(id);
  document.documentElement.dataset.theme=id;
  for(const [name,value]of Object.entries(theme))if(name!=='id'&&name!=='name'&&name!=='description')document.documentElement.style.setProperty(name==='board'?'--surface':'--'+name,value);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme.bg);
  view.setTheme(id);
}
function showHome(){
  pauseAttempt();if(dialog.open)close();selected=null;hover=null;preview=null;
  if(pointer){clearTimeout(pointer.timer);pointer=null;}
  document.body.dataset.screen='home';
  const resume=resumePuzzle(save.current,levels,save),count=Object.keys(save.results).length;
  $('#homePlay').innerHTML=`${count||save.drafts[resume.id]?.points.length||save.drafts[resume.id]?.lines.length||save.attempts[resume.id]?.started?'Continuer':'Commencer'} <span>→</span>`;
  const catalog=achievements(save,levels);$('#achievementCount').textContent=`${catalog.filter(a=>save.achievements[a.id]).length} / ${catalog.length}`;
  $('#homeResume').textContent=`${chapters[resume.chapter-1].title} · ${resume.number} / 15`;
}
function fitBoard(){
  if(document.body.dataset.screen!=='game')return;
  const height=$('#app').clientHeight;
  const width=Math.min($('.workspace').clientWidth-8,640);
  const occupied=$('.topbar').offsetHeight+$('.mission').offsetHeight+$('.toolbar').offsetHeight+$('.mobile-nav').offsetHeight+20;
  const size=Math.max(144,Math.min(width,height-occupied));
  document.body.style.setProperty('--board',`${Math.floor(size)}px`);
  view.draw();
}
window.addEventListener('resize',fitBoard);
window.visualViewport?.addEventListener('resize',fitBoard);
new ResizeObserver(()=>{if(document.body.dataset.screen==='game')requestAnimationFrame(fitBoard);}).observe($('.mission'));

// Keep the geometric surface still; menus retain their own vertical scrolling.
for(const eventName of ['gesturestart','gesturechange','dblclick'])document.addEventListener(eventName,event=>event.preventDefault(),{passive:false});
document.addEventListener('touchstart',event=>{if(event.touches.length>1)event.preventDefault();},{passive:false});
document.addEventListener('touchmove',event=>{if(!dialog.open||!dialog.contains(event.target as Node))event.preventDefault();},{passive:false});
window.addEventListener('wheel',event=>{if(event.ctrlKey||!dialog.open||!dialog.contains(event.target as Node))event.preventDefault();},{passive:false});

function beginAttempt(){if(level.id!=='free'&&!complete&&!dialog.open&&document.body.dataset.screen==='game'){clock.begin();renderReadout();}}
function pauseAttempt(){clock.pause();store();renderReadout();}
function resumeAttempt(){if(level.id!=='free'&&!complete&&!dialog.open&&!document.hidden&&document.body.dataset.screen==='game')clock.resume();}
function renderReadout(){
  const a=clock.snapshot();$('#attemptReadout').hidden=level.id==='free';
  $('#timer').textContent=formatTime(a.elapsedMs);$('#stepCountLive').textContent=`${a.steps} étape${a.steps===1?'':'s'}`;
  const record=save.results[level.id];
  $('#attemptReadout').title=record?.bestTimeMs!==undefined?`Meilleur temps : ${formatRecordTime(record.bestTimeMs)} · Moins d’étapes : ${record.bestSteps??'—'}`:'Temps actif sur la figure · Une création = une étape';
}
function restartLevel(){
  clock.pause();const before={board:clone(board),attempt:clock.snapshot()};
  if(dialog.open)close();clock.restore(newAttempt());
  board={points:[],lines:[...level.initialLines]};history=[before];future=[];selected=null;preview=null;hover=null;
  complete=false;chapterReturn=false;sessionMoves=0;precision=false;updateTools();$('#success').hidden=true;
  document.body.dataset.screen='game';if(level.id!=='free')clock.begin();setStatus();draw();store();requestAnimationFrame(fitBoard);
}
function showRecords(){
  const record=save.results[level.id],a=achievements(save,levels),won=a.filter(item=>save.achievements[item.id]).length;
  modal('RECORDS & SUCCÈS',`<h2>${won} succès sur ${a.length}.</h2><p class="dialog-intro">Le temps actif exclut les menus et les pauses. Les meilleurs temps et nombres d’étapes sont deux records indépendants.</p>${level.id!=='free'?`<section class="record-summary"><h3>${esc(level.title)}</h3><div><span>Meilleur temps<strong>${record?.bestTimeMs!==undefined?formatRecordTime(record.bestTimeMs):'—'}</strong></span><span>Moins d’étapes<strong>${record?.bestSteps??'—'}</strong></span></div>${!clock.snapshot().eligible?'<small>Ce dessin avait été commencé sans chrono. Recommence le niveau pour établir un record complet.</small>':''}</section>`:''}<div class="achievement-grid">${a.map(item=>`<article class="achievement ${save.achievements[item.id]?'unlocked':''}"><span>${save.achievements[item.id]?'✦':'◇'}</span><div><h3>${item.title}</h3><p>${item.description}</p><small>${save.achievements[item.id]?'Débloqué':item.target>1?Math.min(item.value,item.target)+' / '+item.target:'À découvrir'}</small></div></article>`).join('')}</div>`,true);
}
function confirmReset(){
  modal('NOUVELLE PARTIE',`<h2>Tout effacer et recommencer ?</h2><p>Cette action efface les réussites, dessins, chronos, records et succès enregistrés sur cet appareil. Les couleurs et le réglage sonore sont conservés.</p><p>Tu peux exporter ta progression avant de la remettre à zéro.</p><button class="full secondary-button" data-action="export">Exporter d’abord ma progression</button><button class="full danger-button" data-action="confirmReset">Tout effacer et recommencer</button>`);
}
function resetProgress(){
  clock.pause();save=resetSave(save);
  clock.restore(newAttempt());board={points:[],lines:[]};history=[];future=[];if(dialog.open)close();
  start(levels[0],false,false);showHome();notify('Nouvelle partie. Les réglages graphiques et sonores sont conservés.');
}
