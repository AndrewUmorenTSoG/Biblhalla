import{readFileSync}from'node:fs';import{join}from'node:path';import{ROOT,loadContent}from'../lib/content.ts';import{readPng,blank,crop,resize,blit,writePng}from'./image.ts';
const meta=JSON.parse(readFileSync(join(ROOT,'assets/runtime/fighters/fighters.json'),'utf8')),out=blank(2400,1440);let row=0;
for(const def of loadContent().fighters.fighters){const e=meta[def.id],sheet=readPng(join(ROOT,e.image));for(let i=0;i<24;i++){const f=e.frames[`gait_${def.weaponPair[Math.floor(i/12)]}_${i%12}`],k=Math.min(95/f.w,112/f.h),img=resize(crop(sheet,f.x,f.y,f.w,f.h),Math.max(1,Math.round(f.w*k)),Math.max(1,Math.round(f.h*k)));blit(out,img,i*100+Math.floor((100-img.width)/2),row*120+112-img.height);}row++;}
writePng(join(ROOT,'assets/animation-production/fluid-runs/contact.png'),out);
