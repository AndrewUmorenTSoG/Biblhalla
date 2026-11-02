import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Renderer } from '../../apps/game/src/render/renderer.ts';
const meta=JSON.parse(readFileSync(new URL('../../assets/runtime/fighters/fighters.json',import.meta.url),'utf8'));
test('raw playback and runtime both use only complete sprites above the registration line',()=>{
  const renderer=Object.create(Renderer.prototype) as Renderer;
  renderer.atlas=Object.fromEntries(Object.entries(meta).map(([id,e]:[string,any])=>[id,e.frames]));
  renderer.clips=Object.fromEntries(Object.entries(meta).map(([id,e]:[string,any])=>[id,e.clips]));
  for(const [hero,entry] of Object.entries(meta) as [string,any][]){
    for(const [move,clip] of Object.entries(entry.clips) as [string,any][]){
      let tick=0;
      for(let i=0;i<clip.frames.length;i++){
        const key=clip.frames[i],frame=entry.frames[key];
        assert.match(key,/^(motion_|run_|air_|land$|attack_|defence_|down_|element_|moses_staff_spin_)/,`${hero}/${move}: ${key}`);
        assert.ok(!entry.attackAnimation.unsafeFrames.includes(key),`${hero}: clipped ${key}`);
        assert.equal(frame.pivotY,frame.h,`${hero}/${key} crosses the origin line`);
        if(move.includes('_'))for(let t=tick;t<tick+clip.ticks[i];t++){
          assert.equal(renderer.frameFor(hero,'active','unarmed',move,t),key,`${hero}/${move}/${t}: preview differs`);
        }
        tick+=clip.ticks[i];
      }
    }
    assert.equal(renderer.frameFor(hero,'active','sword','missing_attack'),'motion_idle');
  }
});
