// Pack generated movement frames alongside the existing attack poses.
// Original source sheets and concept atlases are preserved for rework.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, sha256 } from '../lib/content.ts';
import { readPng, blank, crop, resize, blit, writePng } from './image.ts';
import type { Image } from './image.ts';

// Ignore faint generation residue, cell rules, and detached speckles; retain
// the connected character silhouette and its antialiased boundary.
function silhouette(img: Image): Image {
  const size=img.width*img.height, seen=new Uint8Array(size);
  let largest:number[]=[];
  for(let start=0;start<size;start++){
    if(seen[start]||img.data[start*4+3]<150)continue;
    const queue=[start];seen[start]=1;
    for(let i=0;i<queue.length;i++){
      const p=queue[i],x=p%img.width,y=Math.floor(p/img.width);
      for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){
        if(nx<0||ny<0||nx>=img.width||ny>=img.height)continue;
        const q=ny*img.width+nx;
        if(!seen[q]&&img.data[q*4+3]>=150){seen[q]=1;queue.push(q);}
      }
    }
    if(queue.length>largest.length)largest=queue;
  }
  if(largest.length<500)throw Error('Missing character silhouette');
  const keep=new Uint8Array(size);
  for(const p of largest){const x=p%img.width,y=Math.floor(p/img.width);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<img.width&&yy<img.height)keep[yy*img.width+xx]=1;}}
  for(let p=0;p<size;p++)if(!keep[p]||img.data[p*4+3]<32)img.data[p*4+3]=0;
  return img;
}
function bounds(img:Image){let l=img.width,t=img.height,r=0,b=0;for(let y=0;y<img.height;y++)for(let x=0;x<img.width;x++)if(img.data[(y*img.width+x)*4+3]>100){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}return {l,t,r,b};}
function cell(sheet:Image,row:number,col:number){const x=Math.round(col*sheet.width/8),y=Math.round(row*sheet.height/4),right=Math.round((col+1)*sheet.width/8),bottom=Math.round((row+1)*sheet.height/4);return silhouette(crop(sheet,x+3,y+3,right-x-6,bottom-y-6));}

export { cell, bounds };
if(import.meta.main){
const dir=join(ROOT,'assets/runtime/fighters');
const manifestPath=join(dir,'fighters.json');
const backup=join(dir,'fighters-before-movement.json');
if(!existsSync(backup))writeFileSync(backup,readFileSync(manifestPath));
const meta=JSON.parse(readFileSync(backup,'utf8'));
for(const [id,raw] of Object.entries(meta)){
  const entry=raw as any, original=readPng(join(ROOT,entry.image));
  const source=`assets/animation-production/${id}-animation-draft.png`;
  const sheet=readPng(join(ROOT,source));
  const stand=cell(sheet,3,0), standing=bounds(stand);
  const scale=entry.frames.idle.h/(standing.b-standing.t+1);
  const names=['motion_idle',...Array.from({length:8},(_,i)=>`run_${i}`),'air_rise','air_apex','air_fall','land'];
  const sources=[stand,...Array.from({length:8},(_,i)=>cell(sheet,0,i)),... [3,4,5,6].map(i=>cell(sheet,3,i))];
  const frameW=Math.ceil(sheet.width/8*scale)+16,frameH=Math.ceil(sheet.height/4*scale)+16;
  const columns=4, atlas=blank(Math.max(original.width,frameW*columns),original.height+frameH*Math.ceil(names.length/columns));
  blit(atlas,original,0,0);
  for(let i=0;i<names.length;i++){
    const src=sources[i],b=bounds(src);
    const cropped=crop(src,b.l,b.t,b.r-b.l+1,b.b-b.t+1);
    const image=resize(cropped,Math.max(1,Math.round(cropped.width*scale)),Math.max(1,Math.round(cropped.height*scale)));
    const x=(i%columns)*frameW+8,y=original.height+Math.floor(i/columns)*frameH+8;
    blit(atlas,image,x,y);
    // Anchor the torso rather than the bounding-box centre: flowing capes
    // must not move a character sideways between animation frames.
    let sum=0,count=0;
    for(let yy=Math.floor(src.height*.35);yy<Math.floor(src.height*.65);yy++)for(let xx=Math.floor(src.width*.35);xx<Math.floor(src.width*.8);xx++)if(src.data[(yy*src.width+xx)*4+3]>150){sum+=xx;count++;}
    const centre=count?sum/count:(b.l+b.r)/2;
    entry.frames[names[i]]={x,y,w:image.width,h:image.height,pivotX:Math.round((centre-b.l)*scale),pivotY:image.height};
  }
  entry.clips={...entry.clips,run:{frames:Array.from({length:8},(_,i)=>`run_${i}`),ticks:Array(8).fill(4)}};
  entry.movement={source,readiness:'animation_alpha',frames:13,notes:'Run cycle and velocity-selected airborne poses; attack poses remain concept cuts.'};
  entry.image=`assets/runtime/fighters/${id}-movement.png`;
  entry.sha256=sha256(writePng(join(ROOT,entry.image),atlas));
  console.log(`${id}: eight run frames, ascent/apex/descent/landing, stable foot anchors`);
}
writeFileSync(manifestPath,JSON.stringify(meta,null,2)+'\n');
}
