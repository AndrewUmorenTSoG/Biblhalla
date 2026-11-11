import test from'node:test';import assert from'node:assert/strict';import{RunDistance}from'../../apps/game/src/render/animation.ts';import{readFileSync}from'node:fs';import{S}from'../helpers/engine.ts';import{Renderer}from'../../apps/game/src/render/renderer.ts';
test('gait follows travelled distance and does not reset when painting or briefly stopping',()=>{
 const r=new RunDistance();r.capture(1,0,0,true);for(let t=1;t<=20;t++)r.capture(1,t*6,t,true);
 assert.equal(r.phase(1,120),120*24/168);assert.equal(r.phase(1,123),123*24/168);
 r.capture(1,120,21,false);assert.equal(r.phase(1,120),120*24/168);r.capture(1,120,22,true);r.capture(1,126,23,true);assert.equal(r.phase(1,126),126*24/168);
 r.capture(1,1000,24,true);assert.equal(r.phase(1,1000),126*24/168);
});
test('the first moving tick after a stop advances the planted foot',()=>{
 const r=new RunDistance();r.capture(1,0,0,false);r.capture(1,7,1,true);
 assert.equal(r.phase(1,7),1);
 r.capture(1,7,2,false);r.capture(1,14,3,true);
 assert.equal(r.phase(1,14),2);
});
test('equipped dodges show preparation, burst, and landing poses',()=>{
 const meta=JSON.parse(readFileSync(new URL('../../assets/runtime/fighters/fighters.json',import.meta.url),'utf8'));
 const r=Object.create(Renderer.prototype) as Renderer;
 r.atlas=Object.fromEntries(Object.entries(meta).map(([id,e]:[string,any])=>[id,e.frames]));
 for(const def of S.content.fighters.fighters)for(const weapon of def.weaponPair)
  assert.deepEqual([0,6,14].map(t=>r.frameFor(def.id,'dodge',weapon,'',0,t)),[2,3,11].map(i=>`equipped_${weapon}_${i}`));
});
test('render batching at 30, 60 and 120 Hz produces the same gait phase at the same position',()=>{
 const phases=(hz:number)=>{const r=new RunDistance();r.capture(1,0,0,true);let tick=0;const samples:number[]=[];for(let frame=1;frame<=hz;frame++){const t=frame*60/hz;while(tick<Math.floor(t)){tick++;r.capture(1,tick*7,tick,true);}const phase=r.phase(1,t*7);if(frame%(hz/10)===0)samples.push(phase);}return samples;};
 assert.deepEqual(phases(30),phases(60));assert.deepEqual(phases(60),phases(120));
});
test('every equipped run loop plays twelve consecutive drawn poses and loops cleanly',()=>{
 const meta=JSON.parse(readFileSync(new URL('../../assets/runtime/fighters/fighters.json',import.meta.url),'utf8')),r=Object.create(Renderer.prototype)as Renderer;r.atlas=Object.fromEntries(Object.entries(meta).map(([id,e]:[string,any])=>[id,e.frames]));
 for(const def of S.content.fighters.fighters)for(const weapon of def.weaponPair){const frames=Array.from({length:12},(_,i)=>r.frameFor(def.id,'run',weapon,'',0,i*2));assert.deepEqual(frames,Array.from({length:12},(_,i)=>`gait_${weapon}_${i}`));assert.equal(r.frameFor(def.id,'run',weapon,'',0,24),`gait_${weapon}_0`);for(const name of frames)assert.ok(meta[def.id].frames[name]);}
});

test('normal-speed running visits every pose without skipping at 60 and 120 Hz',()=>{
 const meta=JSON.parse(readFileSync(new URL('../../assets/runtime/fighters/fighters.json',import.meta.url),'utf8')),r=Object.create(Renderer.prototype)as Renderer;
 r.atlas=Object.fromEntries(Object.entries(meta).map(([id,e]:[string,any])=>[id,e.frames]));r.clips=Object.fromEntries(Object.entries(meta).map(([id,e]:[string,any])=>[id,e.clips]));
 for(const hz of [60,120])for(const def of S.content.fighters.fighters)for(const weapon of ['unarmed',...def.weaponPair]){
  let previous=0;const seen=new Set<number>();
  for(let n=0;n<hz;n++){const distance=n*60/hz*8.5,time=distance*24/168,name=r.frameFor(def.id,'run',weapon,'',0,time),index=Number(name.split('_').at(-1));
   assert.ok((index-previous+12)%12<=1,`${def.id}/${weapon}: skipped pose at ${hz} Hz`);seen.add(index);previous=index;
  }
  assert.equal(seen.size,12,def.id+'/'+weapon);
 }
});

test('contact poses meet the floor and flight poses remain above it',()=>{
 const meta=JSON.parse(readFileSync(new URL('../../assets/runtime/fighters/fighters.json',import.meta.url),'utf8'));
 for(const def of S.content.fighters.fighters)for(const weapon of ['unarmed',...def.weaponPair])for(let i=0;i<12;i++){
  const e=meta[def.id],f=e.frames[weapon==='unarmed'?`run_${i}`:`gait_${weapon}_${i}`];
  assert.ok(f.pivotY>=f.h,`${def.id}/${weapon}/${i} fell below the floor`);
  if(i===0||i===6)assert.equal(f.pivotY,f.h);
  if(i===4||i===10)assert.ok(f.pivotY>f.h);
 }
});
