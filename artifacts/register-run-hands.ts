import{readFileSync,writeFileSync}from'node:fs';import{readPng,crop}from'../tools/art/image.ts';import{forwardHand}from'../tools/art/run-registration.ts';
const file='assets/runtime/fighters/fighters.json',meta=JSON.parse(readFileSync(file,'utf8'));
for(const[id,e]of Object.entries(meta)as[string,any][]){const img=readPng(e.image);for(let i=0;i<12;i++){const f=e.frames['run_'+i],p=forwardHand(crop(img,f.x,f.y,f.w,f.h));f.gripX=Math.round(p.x);f.gripY=Math.round(p.y);}console.log(id+' hands registered');}
writeFileSync(file,JSON.stringify(meta,null,2)+'\n');
