import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../lib/content.ts';
import { readPng,blank,crop,resize,blit,writePng } from './image.ts';
const meta=JSON.parse(readFileSync(join(ROOT,'assets/runtime/fighters/fighters.json'),'utf8'));
const jobs=JSON.parse(readFileSync(join(ROOT,'assets/animation-production/down-attacks/jobs.json'),'utf8'));
const contact=blank(1200,120*jobs.length);
for(const [row,job] of jobs.entries()){
  const entry=meta[job.id],atlas=readPng(join(ROOT,entry.image));
  for(const [col,spec] of job.rows.entries()){
    const f=entry.frames['down_'+spec.id];if(!f)throw Error('Missing '+job.id+'/'+spec.id);
    const k=Math.min(92/f.w,112/f.h),w=Math.max(1,Math.round(f.w*k)),h=Math.max(1,Math.round(f.h*k));
    blit(contact,resize(crop(atlas,f.x,f.y,f.w,f.h),w,h),col*100+Math.floor((100-w)/2),row*120+Math.floor((120-h)/2));
  }
}
writePng(join(ROOT,'assets/animation-production/down-attacks/contact.png'),contact);
console.log('Rows: '+jobs.map((j:any)=>j.id).join(', '));
