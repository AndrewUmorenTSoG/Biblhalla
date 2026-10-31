import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Renderer } from '../../apps/game/src/render/renderer.ts';
const meta=JSON.parse(readFileSync(new URL('../../assets/runtime/fighters/fighters.json',import.meta.url),'utf8'));
const renderer=Object.create(Renderer.prototype) as Renderer;
renderer.atlas=Object.fromEntries(Object.entries(meta).map(([id,v]:[string,any])=>[id,v.frames]));
renderer.clips=Object.fromEntries(Object.entries(meta).map(([id,v]:[string,any])=>[id,v.clips]));
test('all twelve fighters cycle through eight run drawings and keep airborne phases stable',()=>{
  assert.equal(Object.keys(meta).length,12);
  for(const id of Object.keys(meta)){
    const selected=new Set(Array.from({length:32},(_,tick)=>renderer.frameFor(id,'run','unarmed','',0,tick)));
    assert.equal(selected.size,8,id);
    assert.equal(renderer.frameFor(id,'run','unarmed','',0,32),'run_0');
    for(const pose of ['air_rise','air_apex','air_fall','land']){
      assert.equal(renderer.frameFor(id,pose,'unarmed','',0,1),pose);
      assert.equal(renderer.frameFor(id,pose,'unarmed','',0,999),pose);
      assert.ok(meta[id].frames[pose]);
    }
  }
});
test('movement additions do not replace a signature with a running frame',()=>{
  const moves=JSON.parse(readFileSync(new URL('../../production-pack/09_Data/attacks.json',import.meta.url),'utf8')).attacks;
  for(const [hero,weapon,id,expected] of [['david','sling','david_sling_nsig','sig_sling_n'],['samson','hammer','samson_hammer_ssig','sig_hammer_s']]){
    const move=moves.find((m:any)=>m.id===id);
    assert.equal(renderer.frameFor(hero,'active',weapon,id,move.startup,5),expected);
    assert.equal(renderer.frameFor(hero,'active',weapon,id,move.startup+move.active-1,5),expected);
  }
});
