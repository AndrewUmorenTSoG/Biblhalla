/** Locate the forward fist in the body band, excluding head, boots and costume colours.
 * Stored grip landmarks let any picked-up weapon follow the painted hand. */
import type {Image} from './image.ts';
export function forwardHand(img:Image){
 const pixels:{x:number;y:number}[]=[];
 for(let y=Math.floor(img.height*.37);y<Math.floor(img.height*.69);y++)for(let x=Math.floor(img.width*.45);x<img.width;x++){
  const p=(y*img.width+x)*4,r=img.data[p],g=img.data[p+1],b=img.data[p+2];
  if(img.data[p+3]>150&&r>55&&r>g*1.18&&r<g*2&&b>g*.45&&b<g*.88)pixels.push({x,y});
 }
 if(!pixels.length)throw Error('Run sprite has no readable hand in its body band');
 const right=Math.max(...pixels.map(p=>p.x)),tip=pixels.filter(p=>p.x>=right-img.height*.04),ys=tip.map(p=>p.y).sort((a,b)=>a-b);
 return {x:Math.max(2,Math.min(img.width-3,right-img.height*.025)),y:ys[Math.floor(ys.length/2)]};
}
