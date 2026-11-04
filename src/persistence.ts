import {read,inside,type Board} from './geometry.js';
import {validTheme,type ThemeId} from './themes.js';
import {parseAttempt,type Attempt} from './attempt.js';
export type Result={stars:number;moves:number;bestTimeMs?:number;bestSteps?:number;attempts?:number;cleanWin?:boolean};
export type Save={version:1;campaignVersion:2;current:string;results:Record<string,Result>;drafts:Record<string,Board>;sound:boolean;theme:ThemeId;attempts:Record<string,Attempt>;achievements:Record<string,number>};
export const fresh=():Save=>({version:1,campaignVersion:2,current:'1-1',results:{},drafts:{},sound:false,theme:'aurore',attempts:{},achievements:{}});
export const resetSave=(save:Save):Save=>({...fresh(),theme:save.theme,sound:save.sound});
const validId=(id:string)=>/^(?:[1-9]|1\d|2[01])-(?:[1-9]|1[0-5])$/.test(id);
export function validate(raw:unknown):Save {
 if(!raw||typeof raw!=='object'||(raw as Save).version!==1)throw new Error('Format de sauvegarde non reconnu.');
 const s=raw as Save;const out=fresh();
 // Older campaigns placed the Grand Atelier at 20 and tangents at 21.
 const id=(key:string)=>s.campaignVersion===2?key:key.replace(/^(20|21)-/,(_,ch)=>`${ch==='20'?21:20}-`);
 if(typeof s.current==='string'&&validId(s.current))out.current=id(s.current);
 out.sound=s.sound===true;
 out.theme=validTheme(s.theme)?s.theme:'aurore';
 for(const [k,r]of Object.entries(s.results||{}))if(validId(k)&&r&&Number.isInteger(r.stars)&&r.stars>=1&&r.stars<=3&&Number.isInteger(r.moves)&&r.moves>=0){
   const result:Result={stars:r.stars,moves:r.moves};
   if(Number.isFinite(r.bestTimeMs)&&r.bestTimeMs!>0)result.bestTimeMs=r.bestTimeMs;
   if(Number.isInteger(r.bestSteps)&&r.bestSteps!>0)result.bestSteps=r.bestSteps;
   if(Number.isInteger(r.attempts)&&r.attempts!>=0)result.attempts=r.attempts;
   if(r.cleanWin===true)result.cleanWin=true;
   out.results[id(k)]=result;
 }
 for(const [k,a]of Object.entries(s.attempts||{})){if(!validId(k))continue;const attempt=parseAttempt(a);if(attempt)out.attempts[id(k)]=attempt;}
 for(const [k,date]of Object.entries(s.achievements||{}))if(/^[a-z0-9-]{1,60}$/.test(k)&&Number.isFinite(date)&&date>=0)out.achievements[k]=date;
 for(const [k,b]of Object.entries(s.drafts||{})) {if(k!=='free'&&!validId(k))continue; if(!b||!Array.isArray(b.points)||!Array.isArray(b.lines)||b.points.length>5000||b.lines.length>2000)continue;
 try{const ps=b.points.filter(p=>typeof p==='string'&&inside(read(p)));const ls=b.lines.filter(l=>typeof l==='string'&&(read(l)[0]!==0n||read(l)[1]!==0n));out.drafts[id(k)]={points:[...new Set(ps)],lines:[...new Set(ls)]};}catch{/* Ignore only the invalid draft. */}}
 return out;
}
export function load(storage:Pick<Storage,'getItem'>):{save:Save;error:boolean}{
 try{const main=storage.getItem('trame-save-v1');if(main)return {save:validate(JSON.parse(main)),error:false};}catch{/* Fall back to last successful snapshot. */}
 try{const backup=storage.getItem('trame-save-backup');if(backup)return {save:validate(JSON.parse(backup)),error:true};}catch{}
 return {save:fresh(),error:!!storage.getItem('trame-save-v1')};
}
export function persist(storage:Pick<Storage,'setItem'>,save:Save):boolean{try{const text=JSON.stringify(save);storage.setItem('trame-save-v1',text);storage.setItem('trame-save-backup',text);return true;}catch{return false;}}
export function mergeSaves(current:Save,incoming:Save):Save {
 const results={...current.results};
 const minimum=(a:number|undefined,b:number|undefined)=>a===undefined?b:b===undefined?a:Math.min(a,b);
 for(const [id,result]of Object.entries(incoming.results)){
   const previous=results[id];
   results[id]=previous?{...result,bestTimeMs:minimum(previous.bestTimeMs,result.bestTimeMs),bestSteps:minimum(previous.bestSteps,result.bestSteps),attempts:Math.max(previous.attempts||0,result.attempts||0),cleanWin:previous.cleanWin||result.cleanWin}:result;
 }
 const achievements={...current.achievements};
 for(const [id,date]of Object.entries(incoming.achievements))achievements[id]=Math.min(achievements[id]??date,date);
 return {...incoming,results,drafts:{...current.drafts,...incoming.drafts},attempts:{...current.attempts,...incoming.attempts},achievements};
}
