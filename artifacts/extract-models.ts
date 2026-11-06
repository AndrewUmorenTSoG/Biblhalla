import{readFileSync,mkdirSync}from'node:fs';import{readPng,crop,blank,blit,writePng}from'../tools/art/image.ts';
const meta=JSON.parse(readFileSync('assets/runtime/fighters/fighters.json','utf8')),defs=JSON.parse(readFileSync('production-pack/09_Data/fighters.json','utf8')).fighters;
mkdirSync('assets/animation-production/fluid-runs',{recursive:true});
for(const def of defs){const e=meta[def.id],s=readPng(e.image);const fs=def.weaponPair.map(w=>e.frames['equipped_'+w+'_0']);const out=blank(fs.reduce((sum,f)=>sum+f.w+24,24),Math.max(...fs.map(f=>f.h))+32);let x=24;for(const f of fs){blit(out,crop(s,f.x,f.y,f.w,f.h),x,16);x+=f.w+24;}writePng('assets/animation-production/fluid-runs/'+def.id+'-identity.png',out);}

