/** Presentation-only interpolation. Never writes to simulation state. */
export function interpolatePosition(previous:{x:number;y:number}|undefined,current:{x:number;y:number},alpha:number,maxDistance:number){
  if(!previous||Math.abs(current.x-previous.x)+Math.abs(current.y-previous.y)>maxDistance)return {x:current.x,y:current.y};
  const t=Math.max(0,Math.min(1,alpha));
  return {x:previous.x+(current.x-previous.x)*t,y:previous.y+(current.y-previous.y)*t};
}
export function cameraEase(base:number,elapsedMs:number){return 1-Math.pow(1-base,Math.max(0,Math.min(100,elapsedMs))/(1000/60));}
export function runCadence(speed:number){return Math.max(.25,Math.min(1.6,Math.abs(speed)/5));}
