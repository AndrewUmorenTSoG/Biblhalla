import test from 'node:test';
import assert from 'node:assert/strict';
import { S, Q } from '../helpers/engine.ts';

function scene(distance=55,facing=1){
 const s=S.create({mode:'training',hero:'esther',opponent:'saul',trainingBot:'stand'});s.phase='playing';const[f,t]=s.fighters;
 for(const p of s.fighters){p.invulnerable=p.respawn=p.hitstop=0;p.ai.next=1e9;p.ai.intent=S.input();p.y=80*Q;p.ground=s.map.main.id;}
 f.x=0;f.facing=facing;f.weapon='blades';t.x=distance*Q;
 return{s,f,t};
}
test('Esther whirlwind strikes four times in either direction, then launches away from the wind',()=>{
 for(const heavy of [false,true])for(const facing of [-1,1])for(const distance of [-55,55])for(const initial of [0,1000]){
  const{s,f,t}=scene(distance,facing);t.damage=initial;const hits:{tick:number;force:number;damage:number}[]=[];
  for(let n=0;n<120;n++){S.step(s,{[f.inputId]:n===0?{x:facing,light:!heavy,heavy}:{} });for(const e of s.events)if(e.type==='hit'&&e.attacker===f.id)hits.push({tick:s.tick,force:Math.abs(t.kx),damage:Number(e.damage)});}
  assert.equal(hits.length,4,JSON.stringify({heavy,facing,distance,initial,hits}));assert.equal(f.hits,4);
  assert.ok(hits.slice(0,3).every(h=>h.force===0));assert.ok(hits[3].force>0);assert.ok(hits[3].damage>hits[0].damage);
  assert.ok(hits.every((h,i)=>!i||h.tick-hits[i-1].tick>=8));assert.equal(f.weapon,'blades');assert.equal(s.projectiles.length,0);
 }
});
test('interruption stops remaining whirlwind hits and distant targets do not take wind damage',()=>{
 const{s,f,t}=scene();S.startAttack(s,f,{light:true,x:1});let interrupted=false;
 for(let n=0;n<100;n++){S.step(s);if(!interrupted&&f.hits){f.action=null;f.stun=8;interrupted=true;}}
 assert.ok(interrupted);assert.equal(f.hits,1);assert.ok(t.damage>0);
 const far=scene(300);S.startAttack(far.s,far.f,{heavy:true,x:1});for(let n=0;n<110;n++)S.step(far.s);assert.equal(far.t.damage,0);
});
