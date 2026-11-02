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
  samples=new Map<number,{x:number;tick:number;distance:number;active:boolean}>();
  clear(){this.samples.clear();}
  capture(id:number,x:number,tick:number,active:boolean){
    const old=this.samples.get(id);let distance=old?.distance??0;
    if(old&&tick>old.tick&&active&&old.active&&Math.abs(x-old.x)<100)distance+=Math.abs(x-old.x);
    this.samples.set(id,{x,tick,distance,active});
  }
  phase(id:number,visualX:number,ticksPerCycle=24){const s=this.samples.get(id);if(!s)return 0;const delta=s.active&&Math.abs(visualX-s.x)<100?Math.abs(visualX-s.x):0;return (s.distance+delta)*ticksPerCycle/120;}
}
