import{readFileSync}from'node:fs';import{join}from'node:path';import{ROOT}from'../lib/content.ts';import{readPng,blank,crop,resize,blit,writePng}from'./image.ts';
const meta=JSON.parse(readFileSync(join(ROOT,'assets/runtime/weapons/weapons.json'),'utf8')),out=blank(1600,900);let row=0;
for(const e of Object.values(meta)as any[]){const sheet=readPng(join(ROOT,e.image));e.frames.forEach((f:any,i:number)=>{const k=90/Math.max(f.w,f.h),img=resize(crop(sheet,f.x,f.y,f.w,f.h),Math.round(f.w*k),Math.round(f.h*k));blit(out,img,i*100+Math.floor((100-img.width)/2),row*100+Math.floor((100-img.height)/2));});row++;}
writePng(join(ROOT,'assets/animation-production/weapons/contact.png'),out);
