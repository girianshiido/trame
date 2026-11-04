import type {Board,Key} from './geometry.js';
export type Step={kind:'point';p:Key;text:string;via?:[Key,Key]}|{kind:'line';a:Key;b:Key;text:string};
export type Target={kind:'point';p:Key;label:string}|{kind:'line';line:Key;label:string;segment?:[Key,Key];circles?:number[];contacts?:{p:Key;label:string}[]};
export type GivenCircle={center:Key;radius:[number,number];label:string};
export type Level={id:string;chapter:number;number:number;title:string;goal:string;lesson:string;hints:string[];given:{p:Key;label:string}[];segments:[Key,Key][];initialLines:Key[];circles?:GivenCircle[];targets:Target[];difficulty:number};
export type SolutionLevel=Level&{steps:Step[];par:number};
export type Chapter={id:number;title:string;subtitle:string;icon:string;intro:string;terms:string[]};
export function solved(level:Level,board:Board):boolean{return level.targets.length>0&&level.targets.every(t=>t.kind==='point'?board.points.includes(t.p):board.lines.includes(t.line));}
