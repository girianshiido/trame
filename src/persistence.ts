import {read,inside,type Board} from './geometry.js';
import {validTheme,type ThemeId} from './themes.js';
export type Result={stars:number;moves:number};
export type Save={version:1;current:string;results:Record<string,Result>;drafts:Record<string,Board>;sound:boolean;theme:ThemeId};
export const fresh=():Save=>({version:1,current:'1-1',results:{},drafts:{},sound:false,theme:'aurore'});
export function validate(raw:unknown):Save {
 if(!raw||typeof raw!=='object'||(raw as Save).version!==1)throw new Error('Format de sauvegarde non reconnu.');
 const s=raw as Save;const out=fresh();if(typeof s.current==='string'&&/^(?:[1-9]|1\d|20)-(?:[1-9]|1[0-5])$/.test(s.current))out.current=s.current;
 out.sound=s.sound===true;
 out.theme=validTheme(s.theme)?s.theme:'aurore';
 for(const [k,r]of Object.entries(s.results||{}))if(/^(?:[1-9]|1\d|20)-(?:[1-9]|1[0-5])$/.test(k)&&r&&Number.isInteger(r.stars)&&r.stars>=1&&r.stars<=3&&Number.isInteger(r.moves)&&r.moves>=0)out.results[k]={stars:r.stars,moves:r.moves};
 for(const [k,b]of Object.entries(s.drafts||{})) {if(k!=='free'&&!/^(?:[1-9]|1\d|20)-(?:[1-9]|1[0-5])$/.test(k))continue; if(!b||!Array.isArray(b.points)||!Array.isArray(b.lines)||b.points.length>5000||b.lines.length>2000)continue;
 try{const ps=b.points.filter(p=>typeof p==='string'&&inside(read(p)));const ls=b.lines.filter(l=>typeof l==='string'&&(read(l)[0]!==0n||read(l)[1]!==0n));out.drafts[k]={points:[...new Set(ps)],lines:[...new Set(ls)]};}catch{/* Ignore only the invalid draft. */}}
 return out;
}
export function load(storage:Pick<Storage,'getItem'>):{save:Save;error:boolean}{
 try{const main=storage.getItem('trame-save-v1');if(main)return {save:validate(JSON.parse(main)),error:false};}catch{/* Fall back to last successful snapshot. */}
 try{const backup=storage.getItem('trame-save-backup');if(backup)return {save:validate(JSON.parse(backup)),error:true};}catch{}
 return {save:fresh(),error:!!storage.getItem('trame-save-v1')};
}
export function persist(storage:Pick<Storage,'setItem'>,save:Save):boolean{try{const text=JSON.stringify(save);storage.setItem('trame-save-v1',text);storage.setItem('trame-save-backup',text);return true;}catch{return false;}}
