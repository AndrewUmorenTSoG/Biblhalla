import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
import{handGrip,needsCarriedWeapon}from'../../apps/game/src/render/grip.ts';
import{Renderer}from'../../apps/game/src/render/renderer.ts';
const meta=JSON.parse(readFileSync(new URL('../../assets/runtime/fighters/fighters.json',import.meta.url),'utf8'));
test('all movement and shared body combo sprites have hand positions inside their frame',()=>{
 for(const[id,e]of Object.entries(meta)as[string,any][])for(const[name,f]of Object.entries(e.frames)as[string,any][]){
  if(!needsCarriedWeapon(name,'sword'))continue;
  assert.ok(Number.isFinite(f.gripX)&&f.gripX>=0&&f.gripX<f.w,`${id}/${name}`);assert.ok(f.gripY>=0&&f.gripY<f.h);
  assert.deepEqual(handGrip(f),{x:f.gripX-f.pivotX,y:f.gripY-f.pivotY});
 }
});
test('carried weapons render after the body, then the gripping fingers cover the handle',()=>{
 for(const hero of Object.keys(meta))for(const pose of ['idle','run','air_rise','air_fall'])for(const weapon of ['sling','sword','staff']){
  const calls:string[]=[];const ctx=new Proxy({}as any,{get:(_,name)=>(..._args:any[])=>calls.push(String(name)),set:()=>true});
  const r=Object.create(Renderer.prototype)as Renderer;Object.assign(r,{ctx,atlas:{[hero]:meta[hero].frames},clips:{[hero]:meta[hero].clips},art:{[hero]:{complete:true,naturalWidth:1024}},reduced:false});
  r.rig(hero,0,0,1,1,pose,3,0,weapon);if(weapon==='sling'&&meta[hero].frames.slinger_idle_0){assert.equal(calls.filter(c=>c==='drawImage').length,1);continue;}const body=calls.indexOf('drawImage'),fingers=calls.lastIndexOf('drawImage');assert.ok(fingers>body);assert.ok(calls.slice(body,fingers).includes('stroke'),`${hero}/${pose}/${weapon}`);
 }
});
test('throw shows anticipation, extended release, follow-through and recovery',()=>{
 const r=Object.create(Renderer.prototype)as Renderer;
 assert.deepEqual([0,6,13,20].map(t=>r.frameFor('david','weapon_throw','unarmed','',0,t)),['defence_1','defence_2','defence_3','motion_idle']);
 assert.equal(needsCarriedWeapon('defence_2','staff'),true);assert.equal(needsCarriedWeapon('element_0_2','staff'),false);
});
