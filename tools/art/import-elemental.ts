import { readFileSync,writeFileSync,existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT,loadContent,sha256 } from '../lib/content.ts';
import { readPng,blank,resize,blit,writePng } from './image.ts';
import { figures } from './import-defence.ts';
const dir=join(ROOT,'assets/runtime/fighters'),file=join(dir,'fighters.json'),backup=join(dir,'fighters-before-elemental.json');
if(!existsSync(backup))writeFileSync(backup,readFileSync(file));
const meta=JSON.parse(readFileSync(backup,'utf8')),content=loadContent();
const jobs=JSON.parse(readFileSync(join(ROOT,'assets/animation-production/elemental/jobs.json'),'utf8'));
for(const def of content.fighters.fighters){
  const entry=meta[def.id],job=jobs.find((j:any)=>j.id===def.id),source=`assets/animation-production/elemental/${def.id}.png`;
  const sheet=readPng(join(ROOT,source)),poses=figures(sheet,4,4),base=readPng(join(ROOT,entry.image));
  const heights=poses.map(p=>p.image.height).sort((a,b)=>a-b),scale=192/heights[12];
  const fw=Math.ceil(Math.max(...poses.map(p=>p.image.width))*scale)+16,fh=Math.ceil(Math.max(...poses.map(p=>p.image.height))*scale)+16;
  const atlas=blank(Math.max(base.width,fw*4),base.height+fh*4);blit(atlas,base,0,0);
  for(let i=0;i<16;i++){const pose=poses[i],img=resize(pose.image,Math.round(pose.image.width*scale),Math.round(pose.image.height*scale)),x=i%4*fw+8,y=base.height+Math.floor(i/4)*fh+8;
    blit(atlas,img,x,y);entry.frames[`element_${Math.floor(i/4)}_${i%4}`]={x,y,w:img.width,h:img.height,pivotX:Math.round(pose.pivot*scale),pivotY:img.height};}
  const wanted=content.attacks.attacks.filter(m=>(m.ownerType==='weapon'&&(def.weaponPair.includes(m.ownerId)||m.ownerId==='unarmed'))||m.ownerId===def.id);
  const ids=new Set(wanted.map(m=>m.id));
  for(const key of Object.keys(entry.clips))if(!['idle','run','jump','dodge','hitstun'].includes(key)&&!ids.has(key))delete entry.clips[key];
  for(const m of wanted){
    const weapon=m.weapon??(m.ownerType==='weapon'?m.ownerId:def.weaponPair.find(w=>m.id.includes('_'+w+'_')));
    let row=job.weapons.indexOf(weapon),special=false;
    if(m.id==='caleb_gauntlets_slight'||m.id==='samson_gauntlets_nlight'||m.id==='samson_gauntlets_nsig'||m.id==='esther_blades_slight'||m.id.startsWith('moses_staff_d')||m.id.startsWith('nehemiah_hammer_d')||m.id==='jonathan_sword_sair'||m.id==='jonathan_sword_nair'){row=2;special=true;}
    if(def.id==='caleb'&&m.id.endsWith('ground_pound')){row=3;special=true;}
    if(def.id==='samson'&&m.id.includes('hammer')&&(m.id.endsWith('dsig')||m.id.endsWith('ground_pound'))){row=3;special=true;}
    if(weapon==='shield'){
      if(m.id.endsWith('dsig')||m.id.endsWith('ground_pound'))row=def.id==='gideon'?3:def.id==='nehemiah'?1:2;
      else if(m.ownerType==='fighter')row=def.id==='joshua'||def.id==='nehemiah'?3:2;
      special=true;
    }
    const air=m.input.context==='air';
    if(weapon==='sling'&&m.projectile){row=job.weapons.indexOf('sling');special=true;}
    if(!special&&!air&&entry.clips[m.id])continue;
    if(row<0&&entry.clips[m.id])continue;
    if(row<0){ // Unarmed aerial follow-up uses the drawn kick sequence.
      entry.clips[m.id]={frames:['defence_4','defence_5','defence_6','defence_7'],ticks:[Math.floor(m.startup/2),Math.ceil(m.startup/2),m.active,m.recovery]};continue;
    }
    const key=(i:number)=>`element_${row}_${i}`;
    // Register active down aliases so both preview and runtime retain explicit
    // down-contact identities, now pointing to the new sequence's strike.
    const down=/_d(light|air|sig)$|_ground_pound$/.test(m.id),contact=down?'down_'+m.id:key(2);
    if(down)entry.frames[contact]={...entry.frames[key(2)]};
    const frames=[key(0),key(1)],ticks=[Math.floor(m.startup/2),Math.ceil(m.startup/2)];
    if(!m.oneHitPerTarget&&m.collisionPhases.length>1){const split=m.collisionPhases[1].firstTick-m.startup;frames.push(key(1),m.id.startsWith('caleb_')?key(3):key(2));ticks.push(split,m.active-split);}
    else {frames.push(contact);ticks.push(m.active);}
    frames.push(key(3));ticks.push(m.recovery);
    if(m.id==='esther_blades_slight'){
      // Back-facing and front-facing drawings both belong to the active
      // whirlwind, so Esther visibly turns while the wind can hit.
      entry.clips[m.id]={frames:[key(0),key(1),key(2),key(3)],ticks:[m.startup,Math.floor(m.active/2),Math.ceil(m.active/2),m.recovery]};
    }else entry.clips[m.id]={frames:frames.filter((_,i)=>ticks[i]>0),ticks:ticks.filter(t=>t>0)};
  }
  entry.image=`assets/runtime/fighters/${def.id}-elemental.png`;entry.sha256=sha256(writePng(join(ROOT,entry.image),atlas));
  entry.readiness='runtime_alpha';entry.elementalAnimation={source,frames:16,notes:'Four drawn poses per sequence; shared aerial families, character specials and shield replacements.'};
  console.log(`${def.id}: 16 new sprites, ${Object.keys(entry.clips).length} clips`);
}
writeFileSync(file,JSON.stringify(meta,null,2)+'\n');
