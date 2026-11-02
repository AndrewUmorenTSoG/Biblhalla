import test from'node:test';import assert from'node:assert/strict';import{RunDistance}from'../../apps/game/src/render/animation.ts';import{readFileSync}from'node:fs';import{S}from'../helpers/engine.ts';import{Renderer}from'../../apps/game/src/render/renderer.ts';
test('gait follows travelled distance and does not reset when painting or briefly stopping',()=>{
 const r=new RunDistance();r.capture(1,0,0,true);for(let t=1;t<=20;t++)r.capture(1,t*6,t,true);
 assert.equal(r.phase(1,120),24);assert.equal(r.phase(1,123),24.6);
 r.capture(1,120,21,false);assert.equal(r.phase(1,120),24);r.capture(1,120,22,true);r.capture(1,126,23,true);assert.equal(r.phase(1,126),25.2);
 r.capture(1,1000,24,true);assert.equal(r.phase(1,1000),25.2);
});
test('render batching at 30, 60 and 120 Hz produces the same gait phase at the same position',()=>{
 const phases=(hz:number)=>{const r=new RunDistance();r.capture(1,0,0,true);let tick=0;const samples:number[]=[];for(let frame=1;frame<=hz;frame++){const t=frame*60/hz;while(tick<Math.floor(t)){tick++;r.capture(1,tick*7,tick,true);}const phase=r.phase(1,t*7);if(frame%(hz/10)===0)samples.push(phase);}return samples;};
 assert.deepEqual(phases(30),phases(60));assert.deepEqual(phases(60),phases(120));
});
test('every equipped run loop plays eight consecutive drawn poses and loops cleanly',()=>{
 const meta=JSON.parse(readFileSync(new URL('../../assets/runtime/fighters/fighters.json',import.meta.url),'utf8')),r=Object.create(Renderer.prototype)as Renderer;r.atlas=Object.fromEntries(Object.entries(meta).map(([id,e]:[string,any])=>[id,e.frames]));
 for(const def of S.content.fighters.fighters)for(const weapon of def.weaponPair){const frames=Array.from({length:8},(_,i)=>r.frameFor(def.id,'run',weapon,'',0,i*3));assert.deepEqual(frames,Array.from({length:8},(_,i)=>`gait_${weapon}_${i}`));assert.equal(r.frameFor(def.id,'run',weapon,'',0,24),`gait_${weapon}_0`);for(const name of frames)assert.ok(meta[def.id].frames[name]);}
});
