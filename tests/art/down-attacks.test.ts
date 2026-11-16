import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadContent } from '../../tools/lib/content.ts';
import { Renderer } from '../../apps/game/src/render/renderer.ts';
const meta=JSON.parse(readFileSync(new URL('../../assets/runtime/fighters/fighters.json',import.meta.url),'utf8'));
const jobs=JSON.parse(readFileSync(new URL('../../assets/animation-production/down-attacks/jobs.json',import.meta.url),'utf8'));
const content=loadContent(),renderer=Object.create(Renderer.prototype) as Renderer;
renderer.atlas=Object.fromEntries(Object.entries(meta).map(([id,v]:[string,any])=>[id,v.frames]));
renderer.clips=Object.fromEntries(Object.entries(meta).map(([id,v]:[string,any])=>[id,v.clips]));
test('all 144 down attacks use their authored contact drawings and animated shield throw',()=>{
  assert.equal(jobs.length,12);let checked=0;
  for(const job of jobs){assert.equal(job.rows.length,12);for(const spec of job.rows){
    const move=content.attacks.attacks.find(m=>m.id===spec.id)!;assert.ok(move);
    const clip=meta[job.id].clips[spec.id];assert.equal(clip.ticks.reduce((a:number,b:number)=>a+b,0),move.totalTicks);
    assert.ok(meta[job.id].frames['down_'+spec.id]);
    for(let tick=0;tick<move.totalTicks;tick++){
      const frame=renderer.frameFor(job.id,'active','unarmed',spec.id,tick,0);
      if(spec.id==='gideon_shield_dsig'){assert.match(frame,/^release_jump_/);if(tick>=move.startup&&tick<move.startup+move.active)assert.match(frame,/^release_jump_[78]$/);}else assert.equal(frame==='down_'+spec.id,tick>=move.startup&&tick<move.startup+move.active,`${job.id}/${spec.id}/${tick}`);
    }
    checked++;
  }}assert.equal(checked,144);
});
