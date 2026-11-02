/** Poses 0–2 wind up, 3 extends the throwing arm, 4 holds follow-through,
 * 5 reaches for return, 6 catches, 7 settles. Time is simulation ticks. */
export function shieldReleaseFrame(tick:number, launchTick:number, state:string, charging=false):number {
 if(state==='return')return 5;
 if(state==='catch')return 6;
 if(state==='settle')return 7;
 if(state==='out')return tick-launchTick<24?3:4;
 if(charging)return 2;
 if(tick<launchTick)return Math.min(2,Math.floor(tick*3/Math.max(1,launchTick)));
 return tick-launchTick<24?3:4;
}
