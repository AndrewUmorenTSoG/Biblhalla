import { weaponSprites } from './weapon-sprites.generated.ts';
const images=new Map<string,HTMLImageElement>();
// Decode embedded sheets while the title screen is visible, before a fighter
// first equips a weapon. Images are shared by every fighter and projectile.
if(typeof Image!=='undefined')for(const[id,e]of Object.entries(weaponSprites)){const img=new Image();img.src=e.uri;images.set(id,img);}
export function drawWeaponSprite(c:CanvasRenderingContext2D,kind:string,x:number,y:number,angle:number,flight=false,phase=0){
 const entry=weaponSprites[kind];if(!entry||typeof Image==='undefined')return false;
 let img=images.get(kind);if(!img){img=new Image();img.src=entry.uri;images.set(kind,img);}
 if(!img.complete||!img.naturalWidth)return false;
 const step=Math.PI/4,turn=Math.round(angle/step),index=flight?8+((Math.floor(phase)%8)+8)%8:((turn%8)+8)%8;
 const f=entry.frames[index];c.save();c.translate(x,y);c.rotate(flight?angle:angle-turn*step);
 const scale=entry.size/Math.max(f.w,f.h);
 c.scale(scale,scale);c.drawImage(img,f.x,f.y,f.w,f.h,-f.pivotX,-f.pivotY,f.w,f.h);c.restore();return true;
}
