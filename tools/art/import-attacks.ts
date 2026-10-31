import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadContent, sha256 } from '../lib/content.ts';
import { readPng, blank, crop, resize, blit, writePng } from './image.ts';
import { cell, bounds } from './import-movement.ts';

// Preserve the movement baseline so this import can be reproduced safely.
const dir=join(ROOT,'assets/runtime/fighters'),manifest=join(dir,'fighters.json');
const backup=join(dir,'fighters-before-attacks.json');
if(!existsSync(backup))writeFileSync(backup,readFileSync(manifest));
const meta=JSON.parse(readFileSync(backup,'utf8')),content=loadContent();
function distribute(total:number,count:number){return Array.from({length:count},(_,i)=>Math.floor(total/count)+(i<total%count?1:0));}
for(const def of content.fighters.fighters){
  const entry=meta[def.id],base=readPng(join(ROOT,entry.image));
  const sheet=readPng(join(ROOT,`assets/animation-production/${def.id}-animation-draft.png`));
  const standing=bounds(cell(sheet,3,0)),scale=entry.frames.idle.h/(standing.b-standing.t+1);
  const fw=Math.ceil(sheet.width/8*scale)+16,fh=Math.ceil(sheet.height/4*scale)+16;
  const atlas=blank(Math.max(base.width,fw*4),base.height+fh*4);blit(atlas,base,0,0);
  const weapons=def.id==='david'?['sword','sling']:def.weaponPair;
  const unsafe=new Set<string>();
  for(let row=0;row<2;row++)for(let col=0;col<8;col++){
    const src=cell(sheet,row+1,col),b=bounds(src),name=`attack_${weapons[row]}_${col}`;
    let edge=0;for(let y=0;y<src.height-8;y++)for(const x of [0,1,src.width-2,src.width-1])if(src.data[(y*src.width+x)*4+3]>200)edge++;
    if(edge>24)unsafe.add(name);
    const cut=crop(src,b.l,b.t,b.r-b.l+1,b.b-b.t+1),image=resize(cut,Math.round(cut.width*scale),Math.round(cut.height*scale));
    const index=row*8+col,x=(index%4)*fw+8,y=base.height+Math.floor(index/4)*fh+8;
    blit(atlas,image,x,y);
    entry.frames[name]={x,y,w:image.width,h:image.height,pivotX:Math.round((src.width*.53-b.l)*scale),pivotY:image.height};
  }
  let count=0;
  for(const move of content.attacks.attacks){
    if(!((move.ownerType==='weapon'&&def.weaponPair.includes(move.ownerId))||move.ownerId===def.id))continue;
    const weapon=move.ownerType==='weapon'?move.ownerId:def.weaponPair.find(w=>move.id.includes('_'+w+'_'))!;
    const key=(n:number)=>`attack_${weapon}_${n}`;
    const signature=/_([nsd])sig$/.exec(move.id);
    const contact=signature?`sig_${weapon}_${signature[1]}`:'light';
    const safe=(n:number,fallback:string)=>unsafe.has(key(n))?fallback:key(n);
    // Only a side light uses the generated side-contact sequence. Directional
    // and signature attacks preserve their existing authored contact silhouette.
    const side=move.id===weapon+'_slight';
    const startupCount=Math.min(3,move.startup),recoveryCount=Math.min(3,move.recovery);
    const prep=[safe(0,'idle'),safe(1,'idle'),safe(2,'idle')].slice(0,startupCount);
    const finish=[safe(5,contact),safe(6,'idle'),safe(7,'idle')].slice(0,recoveryCount);
    entry.clips[move.id]={frames:[...prep,side?safe(4,contact):contact,...finish],ticks:[...distribute(move.startup,startupCount),move.active,...distribute(move.recovery,recoveryCount)]};
    count++;
  }
  entry.attackAnimation={readiness:'animation_alpha',clips:count,unsafeFrames:[...unsafe],notes:'Shared weapon anticipation/recovery. Directional and signature contacts retain authored concept poses. Unarmed attacks await separate drawings.'};
  entry.image=`assets/runtime/fighters/${def.id}-attacks.png`;entry.sha256=sha256(writePng(join(ROOT,entry.image),atlas));
  console.log(`${def.id}: ${count} timed armed attack clips; ${unsafe.size} edge-touching drawings excluded from playback`);
}
writeFileSync(manifest,JSON.stringify(meta,null,2)+'\n');
