// Import the 24 drawn turn poses. Source art and prompts stay local.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, sha256 } from '../lib/content.ts';
import { readPng, blank, resize, blit, writePng } from './image.ts';
import { figures } from './import-defence.ts';

const path=join(ROOT,'assets/runtime/fighters/fighters.json'),meta=JSON.parse(readFileSync(path,'utf8')),e=meta.esther;
const source='assets/animation-production/esther-whirlwind/spin.png',poses=figures(readPng(join(ROOT,source)),6,4,500,150),scale=e.frames.idle.h/poses[0].image.height;
const parts=poses.map((p,i)=>({i,p,image:resize(p.image,Math.round(p.image.width*scale),Math.round(p.image.height*scale))}));
let x=2,y=2,row=0;const placed=parts.map(p=>{if(x+p.image.width+2>1024){x=2;y+=row+3;row=0;}const out={...p,x,y};x+=p.image.width+3;row=Math.max(row,p.image.height);return out;});
const page=blank(1024,y+row+2);if(page.height>2048)throw Error('Esther action page exceeds texture budget');
for(const p of placed){blit(page,p.image,p.x,p.y);e.frames['release_esther_wind_'+p.i]={x:p.x,y:p.y,w:p.image.width,h:p.image.height,pivotX:Math.round(p.p.pivot*scale),pivotY:p.image.height,sheet:'esther_whirlwind'};}
const image='assets/runtime/fighters/esther-whirlwind-packed.png',bytes=writePng(join(ROOT,image),page);
e.pages={...e.pages,esther_whirlwind:{image,sha256:sha256(bytes),width:page.width,height:page.height,bytes:bytes.length}};
const dataPath=join(ROOT,'production-pack/09_Data/attacks.json'),data=JSON.parse(readFileSync(dataPath,'utf8'));
for(const id of ['esther_blades_slight','esther_blades_ssig']){
 const m=data.attacks.find(m=>m.id===id);m.active=32;m.totalTicks=m.startup+m.active+m.recovery;m.oneHitPerTarget=false;m.hitstopTicks=2;
 m.displayName=id.endsWith('slight')?'Hurricane Spin':'Tempest Dance';
 m.motionEvents=[];
 m.visualPose='Esther coils, turns through front, side and back views with both daggers, and whips four wind pulses around her before braking into guard.';
 m.collisionPhases=Array.from({length:4},(_,i)=>({firstTick:m.startup+i*8,lastTickExclusive:m.startup+i*8+4,shape:'rect',rectUnits:id.endsWith('slight')?[-78,8,176,88]:[-88,8,196,96],anchor:'fighterFeet',hitGroup:i,damagePermille:i===3?400:200,forcePermille:i===3?1000:0}));
 const recover=[3,3,3,m.recovery-12,3];
 e.clips[id]={frames:[...Array.from({length:24},(_,i)=>'release_esther_wind_'+i),'equipped_blades_idle_0'],ticks:[...Array(4).fill(m.startup/4),...Array(16).fill(2),...recover],loop:false};
}
e.windAnimation={source,drawings:24,notes:'Full-body dagger turn with four damage groups; translucent wind is rendered independently around the body.'};
writeFileSync(path,JSON.stringify(meta,null,2)+'\n');writeFileSync(dataPath,JSON.stringify(data,null,2)+'\n');
console.log('Esther: 24 turn drawings, two four-hit whirlwinds, '+page.width+'x'+page.height+' action page');
