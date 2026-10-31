// Compact runtime atlases at approximately 2x the normal on-screen body size.
import { readFileSync,writeFileSync,existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT,sha256 } from '../lib/content.ts';
import { readPng,blank,crop,resize,blit,writePng } from './image.ts';
const dir=join(ROOT,'assets/runtime/fighters'),manifest=join(dir,'fighters.json'),backup=join(dir,'fighters-before-packing.json');
if(!existsSync(backup))writeFileSync(backup,readFileSync(manifest));
const meta=JSON.parse(readFileSync(backup,'utf8'));
for(const [id,raw] of Object.entries(meta)){
  const entry=raw as any,source=readPng(join(ROOT,entry.image)),scale=192/entry.frames.idle.h;
  const packed:any[]=[];let x=4,y=4,rowHeight=0;
  for(const [name,f] of Object.entries(entry.frames) as [string,any][]){
    const w=Math.max(1,Math.round(f.w*scale)),h=Math.max(1,Math.round(f.h*scale));
    if(w>1016)throw Error(`${id}.${name}: frame exceeds packing width`);
    if(x+w+4>1024){x=4;y+=rowHeight+8;rowHeight=0;}
    packed.push({name,old:f,x,y,w,h,pivotX:Math.round(f.pivotX*scale),pivotY:Math.round(f.pivotY*scale)});
    x+=w+8;rowHeight=Math.max(rowHeight,h);
  }
  const atlas=blank(1024,y+rowHeight+4);
  for(const f of packed){blit(atlas,resize(crop(source,f.old.x,f.old.y,f.old.w,f.old.h),f.w,f.h),f.x,f.y);entry.frames[f.name]={x:f.x,y:f.y,w:f.w,h:f.h,pivotX:f.pivotX,pivotY:f.pivotY};}
  entry.image=`assets/runtime/fighters/${id}-packed.png`;const bytes=writePng(join(ROOT,entry.image),atlas);entry.sha256=sha256(bytes);
  entry.packing={width:atlas.width,height:atlas.height,bodyPixels:192,bytes:bytes.length};
  console.log(`${id}: ${atlas.width}x${atlas.height}, ${(bytes.length/1048576).toFixed(2)} MiB`);
}
writeFileSync(manifest,JSON.stringify(meta,null,2)+'\n');
