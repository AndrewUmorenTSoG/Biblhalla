// Resolve legacy placeholders in the data, so every consumer plays the same art.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadContent } from '../lib/content.ts';

export function spriteOnly(meta: Record<string, any>) {
  const content=loadContent();
  for(const def of content.fighters.fighters){
    const entry=meta[def.id],unsafe=new Set(entry.attackAnimation?.unsafeFrames??[]);
    const safeAction=(weapon:string,index:number)=>{
      const candidates=Array.from({length:8},(_,i)=>i)
        .filter(i=>entry.frames[`attack_${weapon}_${i}`]&&!unsafe.has(`attack_${weapon}_${i}`))
        .sort((a,b)=>Math.abs(a-index)-Math.abs(b-index));
      if(!candidates.length)throw Error(`No usable action sprites: ${def.id}/${weapon}`);
      return `attack_${weapon}_${candidates[0]}`;
    };
    for(const [id,clip] of Object.entries(entry.clips) as [string,any][]){
      const move=content.attacks.attacks.find(m=>m.id===id);
      const weapon=move?.ownerType==='weapon'?move.ownerId:def.weaponPair.find(w=>id.includes('_'+w+'_'));
      let tick=0;
      clip.frames=clip.frames.map((key:string,i:number)=>{
        const start=tick;tick+=clip.ticks[i];
        if(key==='idle'||key==='turnaround')return 'motion_idle';
        if(key==='light'||key.startsWith('sig_')){
          if(!weapon||weapon==='unarmed')return 'defence_2';
          // Advance into follow-through in recovery, rather than flashing a
          // concept portrait or cycling backward through contact drawings.
          return safeAction(weapon,start>=(move?.startup??0)+(move?.active??0)?5:3);
        }
        if(unsafe.has(key))return safeAction(weapon!,Number(key.split('_').at(-1)));
        return key;
      });
    }
    // All sprites share the bottom registration line. In-air displacement
    // belongs to physics, never a one-frame pivot change during the strike.
    for(const [name,frame] of Object.entries(entry.frames) as [string,any][]){
      if(/^(motion_|run_|air_|land$|attack_|defence_|down_)/.test(name))frame.pivotY=frame.h;
    }
    entry.attackAnimation.notes='Sprite-only clips; shared weapon windup and follow-through; edge-clipped source frames excluded.';
    entry.downwardArt.notes='Dedicated downward contact sprites with consistent bottom registration; existing sprite windup and recovery retained.';
    entry.movement.notes='Sprite run and airborne poses with consistent bottom registration.';
  }
  return meta;
}
if(import.meta.main){
  const file=join(ROOT,'assets/runtime/fighters/fighters.json');
  writeFileSync(file,JSON.stringify(spriteOnly(JSON.parse(readFileSync(file,'utf8'))),null,2)+'\n');
  console.log('Resolved all clips to sprites and aligned their registration lines.');
}
