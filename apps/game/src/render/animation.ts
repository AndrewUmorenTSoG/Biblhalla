/** Presentation-only interpolation. Never writes to simulation state. */
export function interpolatePosition(previous:{x:number;y:number}|undefined,current:{x:number;y:number},alpha:number,maxDistance:number){
  if(!previous||Math.abs(current.x-previous.x)+Math.abs(current.y-previous.y)>maxDistance)return {x:current.x,y:current.y};
  const t=Math.max(0,Math.min(1,alpha));
  return {x:previous.x+(current.x-previous.x)*t,y:previous.y+(current.y-previous.y)*t};
}
export function cameraEase(base:number,elapsedMs:number){return 1-Math.pow(1-base,Math.max(0,Math.min(100,elapsedMs))/(1000/60));}
export function runCadence(speed:number){return Math.max(.25,Math.min(1.6,Math.abs(speed)/5));}

/** Accumulate travelled ground distance at simulation ticks, independent of
 * how often the browser paints. Preserve phase across brief stops and turns. */
export class RunDistance {
  samples=new Map<number,{x:number;tick:number;distance:number;active:boolean;facing:number}>();
  clear(){this.samples.clear();}
  capture(id:number,x:number,tick:number,active:boolean,facing=0){
    const old=this.samples.get(id);let distance=old?.distance??0;
    // Count the first moving tick after a stop too, so the footfall does not
    // lag behind the fighter each time they change direction or resume running.
    if(old&&tick>old.tick&&active&&Math.abs(x-old.x)<100)distance+=facing ? (x-old.x)*facing : Math.abs(x-old.x);
    this.samples.set(id,{x,tick,distance,active,facing});
  }
  phase(id:number,visualX:number,ticksPerCycle=24,cycleUnits=168){const s=this.samples.get(id);if(!s)return 0;const delta=s.active&&Math.abs(visualX-s.x)<100?(s.facing ? (visualX-s.x)*s.facing : Math.abs(visualX-s.x)):0;return (s.distance+delta)*ticksPerCycle/cycleUnits;}
}

// Touchdown, support, toe-off and flight, measured in 384px atlas cells.
// The flight drawings are tucked by about 25px and need clearance at the toes.
const giantSteps = [
  [{at:0,frame:16,boot:227}, {at:.22,frame:17,boot:162}, {at:.40,frame:22,boot:139}, {at:.55,frame:18,boot:113}, {at:.72,frame:19,boot:85}, {at:.85,frame:20,boot:0}],
  [{at:0,frame:26,boot:224}, {at:.07,frame:21,boot:226}, {at:.23,frame:27,boot:156}, {at:.44,frame:23,boot:131}, {at:.63,frame:24,boot:100}, {at:.85,frame:25,boot:0}],
];

export function goliathStride(steps:number) {
  const cycle = ((steps % 2) + 2) % 2;
  const keys = giantSteps[Math.floor(cycle)];
  const phase = cycle % 1;
  let index = 0;
  while (index+1 < keys.length && keys[index+1].at <= phase) index++;
  const key = keys[index];
  // Lift the tucked flight cel into the same shoulder line as the standing cels.
  const lift = key.at === .85 ? 22 + 4*Math.sin(Math.PI*(phase-.85)/.15) : 0;
  // As the pelvis moves forward the supporting boot travels back beneath it.
  const footShift = key.boot ? Math.max(-30,Math.min(30,228-180*phase-key.boot)) : 0;
  return {frame:key.frame, lift, footShift};
}
