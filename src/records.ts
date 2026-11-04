import type {Attempt} from './attempt.js';
import type {Result,Save} from './persistence.js';
import type {Level} from './types.js';
import {chapterDone} from './progression.js';

export function recordResult(previous:Result|undefined,attempt:Attempt):Result {
  const result:Result={...previous,stars:3,moves:attempt.steps,attempts:(previous?.attempts||0)+(attempt.recorded?0:1)};
  if(attempt.eligible&&attempt.started&&attempt.steps>0){
    const time=Math.max(1,Math.round(attempt.elapsedMs));
    result.bestTimeMs=Math.min(previous?.bestTimeMs??Infinity,time);
    result.bestSteps=Math.min(previous?.bestSteps??Infinity,attempt.steps);
    if(!attempt.undos)result.cleanWin=true;
  }
  return result;
}
export type Achievement={id:string;title:string;description:string;value:number;target:number};
export function achievements(save:Save,levels:Level[]):Achievement[]{
  const results=Object.values(save.results),wins=results.length;
  const completed=new Set(levels.map(l=>l.chapter));
  const chapters=[...completed].filter(ch=>chapterDone(ch,levels,save)).length;
  const time=Math.min(...results.map(r=>r.bestTimeMs??Infinity));
  const steps=Math.min(...results.map(r=>r.bestSteps??Infinity));
  const binary=(yes:boolean)=>yes?1:0;
  return [
    {id:'first',title:'Premier trait juste',description:'Réussir un premier niveau.',value:wins,target:1},
    {id:'ten',title:'Le déclic',description:'Réussir 10 niveaux.',value:wins,target:10},
    {id:'fifty',title:'Géomètre',description:'Réussir 50 niveaux.',value:wins,target:50},
    {id:'hundred',title:'Cent idées',description:'Réussir 100 niveaux.',value:wins,target:100},
    {id:'chapter',title:'Un chapitre se ferme',description:'Terminer un chapitre.',value:chapters,target:1},
    {id:'five-chapters',title:'Le fil des idées',description:'Terminer cinq chapitres.',value:chapters,target:5},
    {id:'all',title:'Maître de la trame',description:`Réussir les ${levels.length} niveaux.`,value:wins,target:levels.length},
    {id:'minute',title:'En moins d’une minute',description:'Finir un essai complet en moins de 60 secondes.',value:binary(time<60000),target:1},
    {id:'thirty',title:'Éclair de génie',description:'Finir un essai complet en moins de 30 secondes.',value:binary(time<30000),target:1},
    {id:'ten-seconds',title:'L’évidence',description:'Finir un essai complet en moins de 10 secondes.',value:binary(time<10000),target:1},
    {id:'five-steps',title:'Économie de moyens',description:'Réussir en cinq constructions ou moins.',value:binary(steps<=5),target:1},
    {id:'three-steps',title:'L’épure',description:'Réussir en trois constructions ou moins.',value:binary(steps<=3),target:1},
    {id:'one-step',title:'Un seul geste',description:'Réussir avec une seule construction.',value:binary(steps===1),target:1},
    {id:'clean',title:'Sans retouche',description:'Réussir un essai complet sans annulation.',value:binary(results.some(r=>r.cleanWin)),target:1},
    {id:'tangents',title:'Au point de contact',description:'Terminer les quinze niveaux sur les tangentes.',value:levels.filter(l=>l.chapter===20&&save.results[l.id]).length,target:15}
  ];
}
export function unlockAchievements(save:Save,levels:Level[],now=Date.now()):Achievement[]{
  const unlocked=achievements(save,levels).filter(a=>a.value>=a.target&&!Object.hasOwn(save.achievements,a.id));
  for(const a of unlocked)save.achievements[a.id]=now;
  return unlocked;
}
