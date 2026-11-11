import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Renderer } from '../../apps/game/src/render/renderer.ts';
import { validateArt } from '../../tools/art/validate-art.ts';
const meta=JSON.parse(readFileSync(new URL('../../assets/runtime/fighters/fighters.json',import.meta.url),'utf8'));
const moves=JSON.parse(readFileSync(new URL('../../production-pack/09_Data/attacks.json',import.meta.url),'utf8')).attacks;
const renderer=Object.create(Renderer.prototype) as Renderer;
renderer.atlas=Object.fromEntries(Object.entries(meta).map(([id,v]:[string,any])=>[id,v.frames]));
renderer.clips=Object.fromEntries(Object.entries(meta).map(([id,v]:[string,any])=>[id,v.clips]));
test('every roster entry has the required movement and attack clip slots',()=>{
  const report=validateArt();assert.deepEqual(report.errors,[]);
  assert.equal(Object.keys(report.coverage).length,12);
  for(const [id,coverage] of Object.entries(report.coverage))assert.equal(coverage.covered,coverage.total,id);
});
test('unarmed contacts use unarmed drawings for the whole active window',()=>{
  for(const id of Object.keys(meta))for(const move of moves.filter((m:any)=>m.ownerId==='unarmed')){
    const expected=move.input.direction==='down'?'down_'+move.id:move.input.direction==='side'?'defence_6':'defence_2';
    assert.equal(renderer.frameFor(id,'active','unarmed',move.id,move.startup,0),expected);
    assert.equal(renderer.frameFor(id,'active','unarmed',move.id,move.startup+move.active-1,0),expected);
  }
});
test('a sustained hit reaction holds its final pose rather than restarting the recoil',()=>{
  for(const id of Object.keys(meta)){
    assert.equal(renderer.frameFor(id,'recovery','unarmed','',0,0),'defence_13');
    assert.equal(renderer.frameFor(id,'recovery','unarmed','',0,1000),'defence_14');
    assert.equal(renderer.frameFor(id,'dodge','unarmed','',0,1000),'equipped_unarmed_dodge_7');
  }
});
