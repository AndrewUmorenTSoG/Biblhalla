import { readFileSync,writeFileSync,existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT,loadContent,sha256 } from '../lib/content.ts';
import { readPng,blank,crop,resize,blit,writePng } from './image.ts';
import type { Image } from './image.ts';
import { bounds } from './import-movement.ts';

/** Extract connected figures across the sheet, not fixed cells that clip kicks. */
export function figures(img:Image,columns=4,rows=4,minArea=1000,alphaCutoff=150){
  const seen=new Uint8Array(img.width*img.height),groups=new Map<number,number[]>();
  for(let start=0;start<seen.length;start++){
    if(seen[start]||img.data[start*4+3]<alphaCutoff)continue;
    const queue=[start];seen[start]=1;let sx=0,sy=0;
    for(let i=0;i<queue.length;i++){
      const p=queue[i],x=p%img.width,y=Math.floor(p/img.width);sx+=x;sy+=y;
      for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(nx<0||ny<0||nx>=img.width||ny>=img.height)continue;const q=ny*img.width+nx;if(!seen[q]&&img.data[q*4+3]>=alphaCutoff){seen[q]=1;queue.push(q);}}
    }
    if(queue.length<minArea)continue;
    const col=Math.max(0,Math.min(columns-1,Math.floor(sx/queue.length/img.width*columns))),row=Math.max(0,Math.min(rows-1,Math.floor(sy/queue.length/img.height*rows))),key=row*columns+col;
    if(queue.length>(groups.get(key)?.length??0))groups.set(key,queue);
  }
  if(groups.size!==columns*rows)throw Error(`Expected ${columns*rows} separated figures, found ${groups.size}`);
  return Array.from({length:columns*rows},(_,index)=>{
    const group=groups.get(index)!,xs=group.map(p=>p%img.width),ys=group.map(p=>Math.floor(p/img.width));
    let l=img.width,t=img.height,r=0,b=0;for(let i=0;i<group.length;i++){l=Math.min(l,xs[i]);r=Math.max(r,xs[i]);t=Math.min(t,ys[i]);b=Math.max(b,ys[i]);}
    l=Math.max(0,l-2);t=Math.max(0,t-2);r=Math.min(img.width-1,r+2);b=Math.min(img.height-1,b+2);
    const out=blank(r-l+1,b-t+1);
    for(const p of group){const x=p%img.width,y=Math.floor(p/img.width);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<l||xx>r||yy<t||yy>b)continue;const from=(yy*img.width+xx)*4,to=((yy-t)*out.width+xx-l)*4;if(img.data[from+3]>=32)out.data.set(img.data.subarray(from,from+4),to);}}
    let sum=0,n=0;for(let y=Math.floor(out.height*.88);y<out.height;y++)for(let x=0;x<out.width;x++)if(out.data[(y*out.width+x)*4+3]>150){sum+=x;n++;}
    return {image:out,pivot:n?sum/n:out.width/2};
  });
}
if(import.meta.main){
const dir=join(ROOT,'assets/runtime/fighters'),manifest=join(dir,'fighters.json'),backup=join(dir,'fighters-before-defence.json');
if(!existsSync(backup))writeFileSync(backup,readFileSync(manifest));
const meta=JSON.parse(readFileSync(backup,'utf8')),content=loadContent();
for(const def of content.fighters.fighters){
  if(process.argv.includes('--only')&&def.id!==process.argv[process.argv.indexOf('--only')+1])continue;
  const entry=meta[def.id],file=join(ROOT,`assets/animation-production/${def.id}-unarmed-defence.png`);
  const poses=figures(readPng(file)),scale=entry.frames.idle.h/poses[0].image.height;
  const base=readPng(join(ROOT,entry.image)),fw=Math.ceil(Math.max(...poses.map(p=>p.image.width))*scale)+16,fh=Math.ceil(Math.max(...poses.map(p=>p.image.height))*scale)+16;
  const atlas=blank(Math.max(base.width,fw*4),base.height+fh*4);blit(atlas,base,0,0);
  for(let i=0;i<poses.length;i++){
    const p=poses[i],img=resize(p.image,Math.round(p.image.width*scale),Math.round(p.image.height*scale)),x=i%4*fw+8,y=base.height+Math.floor(i/4)*fh+8;
    blit(atlas,img,x,y);entry.frames[`defence_${i}`]={x,y,w:img.width,h:img.height,pivotX:Math.round(p.pivot*scale),pivotY:img.height};
  }
  entry.clips.idle={frames:['defence_0'],ticks:[60]};
  entry.clips.jump={frames:['air_rise','air_apex','air_fall'],ticks:[6,6,6],loop:false};
  entry.clips.dodge={frames:['defence_8','defence_9','defence_10','defence_11'],ticks:[2,5,5,5],loop:false};
  entry.clips.hitstun={frames:['defence_13','defence_14'],ticks:[5,7],loop:false};
  for(const move of content.attacks.attacks.filter(m=>m.ownerType==='weapon'&&m.ownerId==='unarmed')){
    const kick=['side','down'].includes(move.input.direction),offset=kick?4:0;
    const prep=Math.max(1,Math.floor(move.startup*.35));
    const frames=[`defence_${offset}`,`defence_${offset+1}`,`defence_${offset+2}`,`defence_${offset+3}`,'defence_0'];
    const recover=Math.max(1,Math.floor(move.recovery*.65));
    const ticks=[prep,move.startup-prep,move.active,recover,move.recovery-recover];
    entry.clips[move.id]={frames:frames.filter((_,i)=>ticks[i]>0),ticks:ticks.filter(t=>t>0)};
  }
  entry.defenceAnimation={readiness:'animation_alpha',notes:'New punch, kick, dodge and recoil drawings. Unarmed directional moves share punch/kick poses; no added gameplay displacement.'};
  entry.image=`assets/runtime/fighters/${def.id}-complete.png`;entry.sha256=sha256(writePng(join(ROOT,entry.image),atlas));
  console.log(`${def.id}: idle, defence, hit reaction and eleven unarmed clips added`);
}
writeFileSync(manifest,JSON.stringify(meta,null,2)+'\n');

}
