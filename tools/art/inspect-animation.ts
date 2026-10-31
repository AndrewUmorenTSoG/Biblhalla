import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../lib/content.ts';
import { readPng, blank, crop, resize, blit, writePng } from './image.ts';
const dir=join(ROOT,'assets/animation-production');
const files=readdirSync(dir).filter(f=>f.endsWith('-animation-draft.png')).sort();
const contact=blank(800,files.length*110);
for(const [i,file] of files.entries()){
  const img=readPng(join(dir,file));
  const row=crop(img,0,0,img.width,Math.floor(img.height/4));
  blit(contact,resize(row,800,100),0,i*110);
  console.log(file,img.width,img.height);
}
writePng(join(dir,'run-contact.png'),contact);
const manifest=JSON.parse(readFileSync(join(ROOT,'assets/runtime/fighters/fighters.json'),'utf8'));
const packed=blank(800,files.length*110);
for(const [i,file] of files.entries()){
  const id=file.replace('-animation-draft.png',''),entry=manifest[id],atlas=readPng(join(ROOT,entry.image));
  for(let col=0;col<8;col++){
    const f=entry.frames[`run_${col}`];if(!f)continue;
    const k=85/entry.frames.idle.h,w=Math.round(f.w*k),h=Math.round(f.h*k);
    const img=resize(crop(atlas,f.x,f.y,f.w,f.h),w,h);
    const x=Math.max(col*100,Math.min(col*100+100-w,col*100+50-Math.round(f.pivotX*k)));
    blit(packed,img,x,i*110+100-h);
  }
}
writePng(join(dir,'movement-contact.png'),packed);
