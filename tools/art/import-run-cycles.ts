import{readFileSync,writeFileSync,existsSync}from'node:fs';import{join}from'node:path';import{ROOT,loadContent,sha256}from'../lib/content.ts';import{figures}from'./import-defence.ts';import{readPng,blank,resize,blit,writePng}from'./image.ts';
const file=join(ROOT,'assets/runtime/fighters/fighters.json'),backup=join(ROOT,'assets/runtime/fighters/fighters-before-run-cycles.json');if(!existsSync(backup))writeFileSync(backup,readFileSync(file));const meta=JSON.parse(readFileSync(backup,'utf8'));
for(const def of loadContent().fighters.fighters){const e=meta[def.id],sheet=readPng(join(ROOT,existsSync(join(ROOT,`assets/animation-production/run-cycles/${def.id}-corrected.png`))?`assets/animation-production/run-cycles/${def.id}-corrected.png`:`assets/animation-production/run-cycles/${def.id}.png`)),poses=figures(sheet,4,4,1000,64),base=readPng(join(ROOT,e.image));
 // One scale for the entire sheet. Shared source-cell registration prevents
 // the pelvis sliding left/right when the support foot changes.
 if(def.id==='nehemiah'){const extra=readPng(join(ROOT,'assets/animation-production/run-cycles/nehemiah-hammer.png')),hp=figures(extra,4,2,1000,64);for(let i=0;i<8;i++)poses[i]={...hp[i],cellCenterX:(i%4+.5)*extra.width/4} as any;}
 const standing=e.frames['equipped_'+def.weaponPair[0]+'_0'].h,scales=[0,1].map(w=>standing*.88/Math.max(...poses.slice(w*8,w*8+8).map(p=>p.image.height)));
 const fw=Math.ceil(Math.max(...poses.map((p,i)=>p.image.width*scales[Math.floor(i/8)])))+12,fh=Math.ceil(Math.max(...poses.map((p,i)=>p.image.height*scales[Math.floor(i/8)])))+12,atlas=blank(Math.max(base.width,fw*4),base.height+fh*4);blit(atlas,base,0,0);
 for(let i=0;i<16;i++){const p=poses[i],scale=scales[Math.floor(i/8)],img=resize(p.image,Math.max(1,Math.round(p.image.width*scale)),Math.max(1,Math.round(p.image.height*scale))),x=i%4*fw+4,y=base.height+Math.floor(i/4)*fh+4,cellX=(p as any).cellCenterX??(i%4+.5)*sheet.width/4;
   blit(atlas,img,x,y);e.frames[`gait_${def.weaponPair[Math.floor(i/8)]}_${i%8}`]={x,y,w:img.width,h:img.height,pivotX:Math.round((cellX-p.originX)*scale),pivotY:img.height};
 }
 e.image=`assets/runtime/fighters/${def.id}-run-cycle.png`;e.sha256=sha256(writePng(join(ROOT,e.image),atlas));e.runCycle={framesPerWeapon:8,source:`assets/animation-production/run-cycles/${def.id}.png`,cycleUnits:120};console.log(def.id+': complete eight-pose cycles for both weapons');
}
writeFileSync(file,JSON.stringify(meta,null,2)+'\n');
