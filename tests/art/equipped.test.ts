import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{Renderer}from'../../apps/game/src/render/renderer.ts';import{S}from'../helpers/engine.ts';
const meta=JSON.parse(readFileSync(new URL('../../assets/runtime/fighters/fighters.json',import.meta.url),'utf8'));
const r=Object.create(Renderer.prototype)as Renderer;r.atlas=Object.fromEntries(Object.entries(meta).map(([id,e]:[string,any])=>[id,e.frames]));r.clips=Object.fromEntries(Object.entries(meta).map(([id,e]:[string,any])=>[id,e.clips]));
test('both weapons for every fighter have drawn idle, run, airborne and crouch poses',()=>{
 let count=0;for(const def of S.content.fighters.fighters)for(const weapon of def.weaponPair){for(let i=0;i<16;i++){const f=meta[def.id].frames[`equipped_${weapon}_${i}`];assert.ok(f,def.id+'/'+weapon+'/'+i);assert.equal(f.pivotY,f.h);count++;}for(const pose of ['idle','run','air_rise','air_apex','air_fall','land','crouch'])assert.match(r.frameFor(def.id,pose,weapon,'',0,10),new RegExp('^'+(pose==='run'?'gait_':'equipped_')+weapon+'_'));}assert.equal(count,384);
});
test('Down selects crouch while grounded and still selects down attacks',()=>{
 const s=S.create({mode:'training',hero:'miriam'});s.phase='playing';const f=s.fighters[0];f.x=0;f.y=80*256;f.ground=s.map.main.id;f.weapon='staff';f.invulnerable=0;
 S.step(s,{[f.id]:{y:-1}});assert.equal(f.crouching,true);assert.equal(r.frameFor(f.hero,'crouch',f.weapon,'',0,10),'equipped_staff_3');
 S.step(s,{[f.id]:{y:-1,light:true}});assert.equal(f.action?.move,'staff_dlight');
});
