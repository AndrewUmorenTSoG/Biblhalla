// Import only run frames into the current manifest. Other animation work is retained.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {ROOT,loadContent,sha256} from '../lib/content.ts';
import {figures} from './import-defence.ts';
import {readPng,blank,resize,blit,writePng} from './image.ts';
import type {Image} from './image.ts';
import {forwardHand} from './run-registration.ts';
/** Largest connected head silhouette in the upper band, excluding thin weapon tips. */
function headCentre(img:Image){
 const h=Math.max(1,Math.floor(img.height*.28)),seen=new Uint8Array(img.width*h);let best:number[]=[];
 for(let start=0;start<seen.length;start++){
  if(seen[start]||img.data[start*4+3]<100)continue;
  const q=[start];seen[start]=1;
  for(let i=0;i<q.length;i++){const x=q[i]%img.width,y=Math.floor(q[i]/img.width);for(const[nx,ny]of[[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(nx<0||nx>=img.width||ny<0||ny>=h)continue;const n=ny*img.width+nx;if(!seen[n]&&img.data[n*4+3]>=100){seen[n]=1;q.push(n);}}}
  if(q.length>best.length)best=q;
 }
 return best.length?best.reduce((sum,p)=>sum+p%img.width,0)/best.length:img.width/2;
}
const file=join(ROOT,'assets/runtime/fighters/fighters.json'),backup=join(ROOT,'assets/runtime/fighters/fighters-before-fluid-runs.json');
if(!existsSync(backup))writeFileSync(backup,readFileSync(file));
const meta=JSON.parse(readFileSync(file,'utf8'));
for(const def of loadContent().fighters.fighters){
 const e=meta[def.id],source=`assets/animation-production/fluid-runs/${def.id}${existsSync(join(ROOT,`assets/animation-production/fluid-runs/${def.id}-corrected.png`))?'-corrected':''}.png`,poses=figures(readPng(join(ROOT,source)),4,6,500,64);
 const unarmedSource=`assets/animation-production/fluid-runs/${def.id}-unarmed${existsSync(join(ROOT,`assets/animation-production/fluid-runs/${def.id}-unarmed-corrected.png`))?'-corrected':''}.png`,unarmed=figures(readPng(join(ROOT,unarmedSource)),4,3,500,64);
 const standing=Math.min(...def.weaponPair.map(w=>e.frames['equipped_'+w+'_0'].h));
 const medians=[0,1].map(w=>poses.slice(w*12,w*12+12).map(p=>p.image.height).sort((a,b)=>a-b)[6]);
 // One scale for the model, both weapons and all phases. Never resize individual poses.
 const scale=standing*.95/Math.min(...medians),base=readPng(join(ROOT,e.image));
 const unarmedScale=standing*.95/unarmed.map(p=>p.image.height).sort((a,b)=>a-b)[6];
 const all=[...poses.map((p,i)=>({p,scale,name:`gait_${def.weaponPair[Math.floor(i/12)]}_${i%12}`})),...unarmed.map((p,i)=>({p,scale:unarmedScale,name:`run_${i}`}))];
 const fw=Math.ceil(Math.max(...all.map(({p,scale})=>p.image.width*scale)))+12,fh=Math.ceil(Math.max(...all.map(({p,scale})=>p.image.height*scale)))+12;
 const atlas=blank(Math.max(base.width,fw*4),base.height+fh*9);blit(atlas,base,0,0);
 for(let i=0;i<all.length;i++){
  const {p,scale,name}=all[i],img=resize(p.image,Math.max(1,Math.round(p.image.width*scale)),Math.max(1,Math.round(p.image.height*scale))),x=i%4*fw+4,y=base.height+Math.floor(i/4)*fh+4;
  const grip=i>=24?forwardHand(p.image):null;
  blit(atlas,img,x,y);e.frames[name]={x,y,w:img.width,h:img.height,pivotX:Math.round(headCentre(p.image)*scale-standing*.06),pivotY:img.height+Math.round(standing*[0,0,0,.008,.025,.012,0,0,0,.008,.025,.012][i%12]),...(grip?{gripX:Math.round(grip.x*scale),gripY:Math.round(grip.y*scale)}:{})};
 }
 e.clips.run={frames:Array.from({length:12},(_,i)=>`run_${i}`),ticks:Array(12).fill(2),loop:true};
 e.image=`assets/runtime/fighters/${def.id}-fluid-run.png`;e.sha256=sha256(writePng(join(ROOT,e.image),atlas));
 e.runCycle={framesPerWeapon:12,cycleUnits:168,source,unarmedSource,unarmedFrames:12,registration:'head silhouette; single model scale; feet at or above ground'};
 console.log(def.id+': 36 run drawings imported');
}
writeFileSync(file,JSON.stringify(meta,null,2)+'\n');
