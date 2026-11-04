export type Attempt={elapsedMs:number;steps:number;undos:number;started:boolean;eligible:boolean;recorded:boolean};
export const newAttempt=(eligible=true):Attempt=>({elapsedMs:0,steps:0,undos:0,started:false,eligible,recorded:false});
export function parseAttempt(raw:unknown):Attempt|undefined {
  if(!raw||typeof raw!=='object')return;
  const a=raw as Attempt;
  if(!Number.isFinite(a.elapsedMs)||a.elapsedMs<0||!Number.isInteger(a.steps)||a.steps<0||!Number.isInteger(a.undos)||a.undos<0)return;
  return {elapsedMs:a.elapsedMs,steps:a.steps,undos:a.undos,started:a.started===true,eligible:a.eligible===true,recorded:a.recorded===true};
}
export class AttemptClock {
  private state=newAttempt();private since:number|null=null;
  constructor(private now:()=>number=()=>performance.now()){}
  get running(){return this.since!==null;}
  get started(){return this.state.started;}
  restore(attempt:Attempt){this.state={...attempt};this.since=null;}
  resume(){if(this.state.started&&this.since===null)this.since=this.now();}
  begin(){this.state.started=true;this.resume();}
  pause(){if(this.since!==null){this.state.elapsedMs+=Math.max(0,this.now()-this.since);this.since=null;}}
  step(){this.begin();this.state.steps++;}
  undo(){this.state.undos++;}
  recorded(){this.state.recorded=true;}
  snapshot():Attempt{return {...this.state,elapsedMs:Math.round(this.state.elapsedMs+(this.since===null?0:Math.max(0,this.now()-this.since)))};}
}
export function formatTime(ms:number):string {
  const seconds=Math.floor(Math.max(0,ms)/1000),minutes=Math.floor(seconds/60);
  return minutes>=60?`${Math.floor(minutes/60)}:${String(minutes%60).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`:`${minutes}:${String(seconds%60).padStart(2,'0')}`;
}
export const formatRecordTime=(ms:number)=>ms<1000?`${(ms/1000).toFixed(3).replace('.',',')} s`:formatTime(ms);
