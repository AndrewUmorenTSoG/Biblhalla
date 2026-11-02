import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {ROOT,sha256} from '../lib/content.ts';
import {readPng,blank,blit,resize,writePng} from './image.ts';
import {figures} from './import-defence.ts';
const dir=join(ROOT,'assets/runtime/fighters'),file=join(dir,'fighters.json');
const meta=JSON.parse(readFileSync(file,'utf8')),entry=meta.moses;
const sheet=readPng(join(ROOT,'assets/animation-production/elemental/moses-staff-spin.png'));
const poses=figures(sheet,4,1),base=readPng(join(ROOT,entry.image));
const scale=entry.frames.motion_idle.h/Math.max(...poses.map(p=>p.image.height));
const widths=poses.map(p=>Math.ceil(p.image.width*scale));
const height=Math.ceil(Math.max(...poses.map(p=>p.image.height))*scale)+8;
const atlas=blank(Math.max(base.width,widths.reduce((a,b)=>a+b+12,8)),base.height+height);blit(atlas,base,0,0);
let x=4;
for(let i=0;i<4;i++){
  const pose=poses[i],img=resize(pose.image,widths[i],Math.ceil(pose.image.height*scale));
  const name=`moses_staff_spin_${i}`,y=base.height+4;blit(atlas,img,x,y);
  entry.frames[name]={x,y,w:img.width,h:img.height,pivotX:Math.round(pose.pivot*scale),pivotY:img.height};x+=img.width+12;
}
const clip=entry.clips.staff_air_combo;clip.frames=['moses_staff_spin_0','moses_staff_spin_1','moses_staff_spin_2','moses_staff_spin_3','element_0_3'];
clip.ticks=[2,3,2,3,16];
entry.image='assets/runtime/fighters/moses-staff-spin.png';entry.sha256=sha256(writePng(join(ROOT,entry.image),atlas));
writeFileSync(file,JSON.stringify(meta,null,2)+'\n');
console.log('Imported four staff-spin poses into Moses air combo.');
