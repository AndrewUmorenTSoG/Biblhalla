import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawElements,drawElementProjectile,drawCharge,drawThrowWind} from '../../apps/game/src/render/elemental.ts';
import {Renderer} from '../../apps/game/src/render/renderer.ts';
function context(){const calls:{name:string,args:any[]}[]=[];const ctx=new Proxy({} as any,{get:(_,name)=> (...args:any[])=>calls.push({name:String(name),args}),set:()=>true});return {ctx,calls};}
test('element effects expire, mirror and draw without changing simulation data',()=>{
  for(const effect of ['water','rock','dust','wind','sun','sound']){
    const {ctx,calls}=context(),world:any={tick:15,events:[{type:'element',tick:10,hero:'moses',weapon:'staff',move:'moses_staff_dlight',effect,x:0,y:0,facing:-1}]},before=JSON.stringify(world);
    drawElements(ctx,world,(x,y)=>({x,y}),1,false);assert.ok(calls.some(c=>c.name==='fill'||c.name==='stroke'));assert.ok(calls.some(c=>c.name==='scale'&&c.args[0]===-1));assert.equal(JSON.stringify(world),before);
    calls.length=0;world.tick=33;drawElements(ctx,world,(x,y)=>({x,y}),1,false);assert.equal(calls.length,0);
  }
});
test('charge steam and elemental projectiles render through their dedicated paths',()=>{
  const {ctx,calls}=context();drawCharge(ctx,{action:{kind:'attack',charge:25}} as any,0,0,1,10,false);assert.equal(calls.filter(c=>c.name==='bezierCurveTo').length,5);
  for(const [hero,move,effect] of [['gideon','gideon_shield_ssig','shield'],['nehemiah','hammer_dlight','rock'],['caleb','caleb_gauntlets_slight','sound'],['david','sling_slight',''],['jonathan','bow_nlight','']])assert.equal(drawElementProjectile(ctx,{move,effect,facing:1} as any,{hero} as any,0,0,1,10),true);
});
test('renderer retains impact events across ticks and drops them after their short lifetime',()=>{
  const r=Object.create(Renderer.prototype) as Renderer;r.elementEvents=[];
  r.collectElements({tick:10,events:[{id:1,type:'element',tick:10}]} as any);r.collectElements({tick:11,events:[]} as any);assert.equal(r.elementEvents.length,1);
  r.collectElements({tick:33,events:[]} as any);assert.equal(r.elementEvents.length,0);
});
test('all slingers release into a visible stone, and thrown objects show short wind strokes',()=>{
  const meta=JSON.parse(readFileSync(new URL('../../assets/runtime/fighters/fighters.json',import.meta.url),'utf8'));
  for(const hero of ['david','moses','miriam']){
    const clip=meta[hero].clips.sling_nlight;
    assert.ok(clip.frames.includes(`element_${hero==='david'?0:1}_2`),hero);
    const {ctx,calls}=context();assert.equal(drawElementProjectile(ctx,{move:'sling_nlight',facing:1} as any,{hero} as any,0,0,1,10),true);
    assert.ok(calls.some(c=>c.name==='arc'));
    calls.length=0;drawThrowWind(ctx,{vx:1200,vy:0} as any,0,0,1);assert.equal(calls.filter(c=>c.name==='lineTo').length,3);
  }
});
test('Moses staff combo plays the four drawn rotation poses in order',()=>{
  const meta=JSON.parse(readFileSync(new URL('../../assets/runtime/fighters/fighters.json',import.meta.url),'utf8'));
  assert.deepEqual(meta.moses.clips.staff_air_combo.frames.slice(0,4),[0,1,2,3].map(i=>`moses_staff_spin_${i}`));
  assert.equal(meta.moses.clips.staff_air_combo.ticks.reduce((a:number,b:number)=>a+b),26);
});
