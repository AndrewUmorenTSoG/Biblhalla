import{readFileSync,writeFileSync}from'node:fs';import{join}from'node:path';
import{ROOT}from'../lib/content.ts';import{readPng,blank,crop,resize,blit,writePng}from'./image.ts';
const file=join(ROOT,'assets/runtime/fighters/fighters.json'),meta=JSON.parse(readFileSync(file,'utf8'));
const defsFile=join(ROOT,'production-pack/09_Data/fighters.json'),defs=JSON.parse(readFileSync(defsFile,'utf8'));
const review=blank(1600,1440);let row=0;
for(const[id,e]of Object.entries(meta)as[string,any][]){const sheet=readPng(join(ROOT,e.image));let col=0;
 for(const[name,f]of Object.entries(e.frames)as[string,any][]){
  if(!/^(motion_idle|run_|air_|land$|defence_)/.test(name))continue;
  let best=-Infinity,hx=f.w*.74,hy=f.h*.56;
  for(let y=Math.floor(f.h*.34);y<f.h*.68;y++)for(let x=Math.floor(f.w*.4);x<f.w;x++){
   const p=((f.y+y)*sheet.width+f.x+x)*4,r=sheet.data[p],g=sheet.data[p+1],b=sheet.data[p+2];
   if(sheet.data[p+3]<220||r<g*1.15||g<b*1.05||r-g<15)continue;
   const score=x-Math.abs(y-f.h*.51)*.15;if(score>best){best=score;hx=x-3;hy=y;}
  }
  if(name==='land'){hx=f.w*.8;hy=f.h*.88;}
  f.gripX=Math.round(hx);f.gripY=Math.round(hy);
  if(col<16){const img=crop(sheet,f.x,f.y,f.w,f.h);for(let y=Math.max(0,f.gripY-3);y<Math.min(img.height,f.gripY+4);y++)for(let x=Math.max(0,f.gripX-3);x<Math.min(img.width,f.gripX+4);x++)img.data.set([255,70,70,255],(y*img.width+x)*4);const scale=Math.min(95/img.width,110/img.height);blit(review,resize(img,Math.round(img.width*scale),Math.round(img.height*scale)),col*100,row*120);col++;}
 }
 row++;
}
for(const def of defs.fighters){const e=meta[def.id],f=e.frames.defence_2;def.itemThrowOrigin=[Math.round((f.gripX-f.pivotX)*96/e.frames.idle.h),Math.round((f.pivotY-f.gripY)*96/e.frames.idle.h)];}
writeFileSync(defsFile,JSON.stringify(defs,null,2)+'\n');
writeFileSync(file,JSON.stringify(meta,null,2)+'\n');writePng(join(ROOT,'assets/animation-production/hand-grips.png'),review);
