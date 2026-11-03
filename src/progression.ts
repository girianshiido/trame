import type {Level} from './types.js';
type Progress={results:Record<string,unknown>};

/** A legacy success stays replayable without unlocking a gap in the campaign. */
export function nextPuzzle(levels:Level[],save:Progress):Level|undefined {
  return levels.find(level=>!save.results[level.id]);
}
export function canPlay(level:Level,levels:Level[],save:Progress):boolean {
  return level.id==='free'||!!save.results[level.id]||nextPuzzle(levels,save)?.id===level.id;
}
export function canVisitChapter(chapter:number,levels:Level[],save:Progress):boolean {
  return levels.some(level=>level.chapter===chapter&&canPlay(level,levels,save));
}
export function chapterDone(chapter:number,levels:Level[],save:Progress):boolean {
  const puzzles=levels.filter(level=>level.chapter===chapter);
  return puzzles.length>0&&puzzles.every(level=>!!save.results[level.id]);
}
export function resumePuzzle(current:string,levels:Level[],save:Progress):Level {
  const level=levels.find(level=>level.id===current);
  return level&&!save.results[level.id]&&canPlay(level,levels,save)?level:nextPuzzle(levels,save)||level||levels[0];
}
