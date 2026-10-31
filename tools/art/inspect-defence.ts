import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../lib/content.ts';
import { readPng,blank,crop,resize,blit,writePng } from './image.ts';
const meta=JSON.parse(readFileSync(join(ROOT,'assets/runtime/fighters/fighters.json'),'utf8'));
const ids=Object.keys(meta).sort(),sheet=blank(1200,ids.length*110);
for(const [row,id] of ids.entries()){
  const entry=meta[id],atlas=readPng(join(ROOT,entry.image));
  for(let col=0;col<16;col++){
    const f=entry.frames[`defence_${col}`];if(!f)throw Error(`${id}: missing defence_${col}`);
    const k=Math.min(65/f.w,95/entry.frames.idle.h),w=Math.max(1,Math.round(f.w*k)),h=Math.max(1,Math.round(f.h*k));
    blit(sheet,resize(crop(atlas,f.x,f.y,f.w,f.h),w,h),col*75+Math.floor((75-w)/2),row*110+100-h);
  }
}
writePng(join(ROOT,'assets/animation-production/defence-contact.png'),sheet);
console.log('Rows: '+ids.join(', '));
