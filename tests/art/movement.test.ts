import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Renderer } from '../../apps/game/src/render/renderer.ts';
const meta=JSON.parse(readFileSync(new URL('../../assets/runtime/fighters/fighters.json',import.meta.url),'utf8'));
const renderer=Object.create(Renderer.prototype) as Renderer;
renderer.atlas=Object.fromEntries(Object.entries(meta).map(([id,v]:[string,any])=>[id,v.frames]));
renderer.clips=Object.fromEntries(Object.entries(meta).map(([id,v]:[string,any])=>[id,v.clips]));
test('all twelve fighters cycle through twelve run drawings and keep airborne phases stable',()=>{
  assert.equal(Object.keys(meta).length,12);
  for(const id of Object.keys(meta)){
    const selected=new Set(Array.from({length:24},(_,tick)=>renderer.frameFor(id,'run','unarmed','',0,tick)));
    assert.equal(selected.size,12,id);
    assert.equal(renderer.frameFor(id,'run','unarmed','',0,24),'run_0');
    for(const pose of ['air_rise','air_apex','air_fall','land']){
      assert.equal(renderer.frameFor(id,pose,'unarmed','',0,1),pose);
      assert.equal(renderer.frameFor(id,pose,'unarmed','',0,999),pose);
      assert.ok(meta[id].frames[pose]);
    }
  }
});
test('movement additions do not replace a signature with a running frame',()=>{
  const moves=JSON.parse(readFileSync(new URL('../../production-pack/09_Data/attacks.json',import.meta.url),'utf8')).attacks;
  for(const [hero,weapon,id] of [['david','sling','david_sling_nsig'],['samson','hammer','samson_hammer_ssig']]){
    const move=moves.find((m:any)=>m.id===id);
    const expected=hero==='david'?/^equipped_sling_14$/:new RegExp(`^attack_${weapon}_[3-5]$`);
    assert.match(renderer.frameFor(hero,'active',weapon,id,move.startup,5),expected);
    assert.match(renderer.frameFor(hero,'active',weapon,id,move.startup+move.active-1,5),expected);
  }
});
test('the roster rests in the closed-hand sprite with either carried weapon',()=>{
  for(const [hero,entry] of Object.entries(meta) as [string,any][]){
    for(const weapon of ['unarmed',...JSON.parse(readFileSync(new URL('../../production-pack/09_Data/fighters.json',import.meta.url),'utf8')).fighters.find((f:any)=>f.id===hero).weaponPair]){
      assert.equal(renderer.frameFor(hero,'idle',weapon,'',0,0),entry.frames['equipped_'+weapon+'_0']?'equipped_'+weapon+'_0':'motion_idle');
      assert.equal(renderer.frameFor(hero,'idle',weapon,'',0,120),entry.frames['equipped_'+weapon+'_0']?'equipped_'+weapon+'_1':'motion_idle');
    }
    assert.ok(entry.frames.motion_idle);
  }
});
test('attack playback never selects a legacy cutout key pose',()=>{
  const fighters=JSON.parse(readFileSync(new URL('../../production-pack/09_Data/fighters.json',import.meta.url),'utf8')).fighters;
  for(const [hero,entry] of Object.entries(meta) as [string,any][]){
    const weapons=fighters.find((f:any)=>f.id===hero).weaponPair;
    for(const [move,clip] of Object.entries(entry.clips) as [string,any][]){
      if(!move.includes('_'))continue;
      const weapon=['unarmed',...weapons].find(w=>move===w||move.startsWith(w+'_')||move.includes('_'+w+'_'))??'unarmed';
      const total=clip.ticks.reduce((a:number,b:number)=>a+b,0);
      for(let tick=0;tick<total;tick++){
        const frame=renderer.frameFor(hero,'active',weapon,move,tick,0);
        assert.ok(!['idle','light','turnaround'].includes(frame)&&!frame.startsWith('sig_'),`${hero} ${move} tick ${tick}: ${frame}`);
      }
    }
  }
});
test('backflip uses the airborne sprite sequence instead of a cutout pose',()=>{
  for(const hero of Object.keys(meta)){
    assert.deepEqual([0,5,10,16].map(t=>renderer.frameFor(hero,'backflip','unarmed','',0,t)),
      ['air_rise','air_apex','air_fall','land'],hero);
    assert.equal(renderer.frameFor(hero,'happy','unarmed','',0,0),'motion_idle');
  }
});
