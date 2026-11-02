import { readFileSync,writeFileSync,existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT,loadContent,sha256 } from '../lib/content.ts';
import { readPng,blank,resize,blit,writePng } from './image.ts';
import { figures } from './import-defence.ts';
import { spriteOnly } from './sprite-only.ts';
const dir=join(ROOT,'assets/runtime/fighters'),manifest=join(dir,'fighters.json'),backup=join(dir,'fighters-before-down.json');
if(!existsSync(backup))writeFileSync(backup,readFileSync(manifest));
const meta=JSON.parse(readFileSync(backup,'utf8')),content=loadContent();
const jobs=JSON.parse(readFileSync(join(ROOT,'assets/animation-production/down-attacks/jobs.json'),'utf8'));
for(const job of jobs){
  if(process.argv.includes('--only')&&job.id!==process.argv[process.argv.indexOf('--only')+1])continue;
  const entry=meta[job.id],sheet=readPng(join(ROOT,`assets/animation-production/down-attacks/${job.id}.png`));
  const poses=figures(sheet,4,3),base=readPng(join(ROOT,entry.image));
  const scale=entry.frames.idle.h/(sheet.height/3*.85);
  const fw=Math.ceil(Math.max(...poses.map(p=>p.image.width))*scale)+16,fh=Math.ceil(Math.max(...poses.map(p=>p.image.height))*scale)+16;
  const atlas=blank(Math.max(base.width,fw*4),base.height+fh*3);blit(atlas,base,0,0);
  for(let index=0;index<12;index++){
    const spec=job.rows[index],move=content.attacks.attacks.find(m=>m.id===spec.id)!;
    if(!move)throw Error('Unknown move '+spec.id);
    const pose=poses[index],img=resize(pose.image,Math.round(pose.image.width*scale),Math.round(pose.image.height*scale));
    const x=index%4*fw+8,y=base.height+Math.floor(index/4)*fh+8,name=`down_${spec.id}`;
    blit(atlas,img,x,y);
    const isAir=spec.id.endsWith('_dair')||spec.id.endsWith('_ground_pound');
    entry.frames[name]={x,y,w:img.width,h:img.height,pivotX:isAir?Math.round(img.width*.48):Math.round(pose.pivot*scale),pivotY:img.height};
    // Replace exactly the active interval, retaining existing anticipation and
    // recovery durations. Splitting also supports future multi-phase clips.
    const original=entry.clips[spec.id],frames:string[]=[],ticks:number[]=[];let cursor=0;
    if(!original)throw Error('Missing clip '+spec.id);
    for(let i=0;i<original.frames.length;i++){
      const end=cursor+original.ticks[i];
      const boundaries=[cursor,...[move.startup,move.startup+move.active].filter(t=>t>cursor&&t<end),end];
      for(let n=0;n<boundaries.length-1;n++){const start=boundaries[n];frames.push(start>=move.startup&&start<move.startup+move.active?name:original.frames[i]);ticks.push(boundaries[n+1]-start);}
      cursor=end;
    }
    if(cursor!==move.totalTicks)throw Error('Timing mismatch '+spec.id);
    entry.clips[spec.id]={frames,ticks};
  }
  entry.downwardArt={readiness:'animation_alpha',source:'docs/art/DOWN_ATTACKS.md',contacts:12,notes:'Dedicated down-contact drawings; existing anticipation/recovery retained. Airborne origin registration is provisional and requires visual hitbox review.'};
  entry.image=`assets/runtime/fighters/${job.id}-down.png`;entry.sha256=sha256(writePng(join(ROOT,entry.image),atlas));
  console.log(`${job.id}: twelve downward contact poses, exact active timing`);
}
writeFileSync(manifest,JSON.stringify(process.argv.includes('--only')?meta:spriteOnly(meta),null,2)+'\n');
