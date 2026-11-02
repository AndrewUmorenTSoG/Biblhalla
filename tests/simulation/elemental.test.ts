import test from 'node:test';
import assert from 'node:assert/strict';
import {S,content,Q} from '../helpers/engine.ts';
import {createContext} from '../../packages/sim/src/context.ts';
import {combat,startProjectile} from '../../packages/sim/src/combat.ts';
import {resolveAction} from '../../packages/sim/src/moveResolver.ts';
const ctx=createContext(content);
function scene(hero='gideon',opponent='david'){
  const s=S.create({mode:'training',hero,opponent});s.phase='playing';
  const [f,t]=s.fighters;for(const p of s.fighters){p.invulnerable=p.respawn=p.hitstop=0;p.ai.next=1e9;p.ai.intent=S.input();p.y=80*Q;p.ground=s.map.main.id;}
  f.x=0;t.x=50*Q;f.facing=1;return {s,f,t};
}
test('shield replaces the requested weapon families and returns within four body widths',()=>{
  for(const [hero,other] of [['gideon','sword'],['nehemiah','hammer'],['joshua','sword']])assert.deepEqual(new Set(S.defs[hero].weaponPair),new Set([other,'shield']));
  const {s,f,t}=scene();f.weapon='shield';t.x=400*Q;
  S.startAttack(s,f,{heavy:true,x:1});const a=f.action!,m=S.moves[a.move!];startProjectile(ctx,s,f,m,a);
  let furthest=0,returned=false;
  for(let i=0;i<90;i++){combat(ctx,s);for(const p of s.projectiles){furthest=Math.max(furthest,p.x);returned ||= !!p.returning;}}
  assert.equal(furthest,160*Q);assert.ok(returned);assert.equal(s.projectiles.length,0);assert.equal(f.weapon,'shield');
});
test('returning shield hits a target at most once per throw',()=>{
  const {s,f,t}=scene();f.weapon='shield';S.startAttack(s,f,{heavy:true,x:1});startProjectile(ctx,s,f,S.moves[f.action!.move!],f.action!);
  for(let i=0;i<70;i++)combat(ctx,s);
  assert.equal(f.hits,1);assert.ok(t.damage>0);
});
test('confirmed aerial light can link twice, while whiffs and a third link cannot',()=>{
  const {s,f}=scene('david');f.weapon='sword';f.ground=null;
  S.startAttack(s,f,{light:true,x:1});f.action!.tick=S.moves[f.action!.move!].startup+S.moves[f.action!.move!].active;
  resolveAction(ctx,s,f,S.input({light:true}));assert.equal(f.action!.move,'sword_sair');
  f.action!.confirmed=true;resolveAction(ctx,s,f,S.input({light:true}));assert.equal(f.action!.move,'sword_air_combo');assert.equal(f.action!.comboDepth,1);
  f.action!.confirmed=true;f.action!.tick=10;resolveAction(ctx,s,f,S.input({light:true}));assert.equal(f.action!.comboDepth,2);
  const instance=f.action!.instance;f.action!.confirmed=true;f.action!.tick=10;resolveAction(ctx,s,f,S.input({light:true}));assert.equal(f.action!.instance,instance);
});
test('Samson grabs then punches and gauntlets splash nearby enemies',()=>{
  const {s,f,t}=scene('samson');f.weapon='gauntlets';t.x=30*Q;S.startAttack(s,f,{light:true});const a=f.action!,m=S.moves[a.move!];
  a.tick=m.collisionPhases[0].firstTick+1;combat(ctx,s);assert.equal(t.grabbed?.owner,f.id);const damage=t.damage;
  f.hitstop=t.hitstop=0;t.x=24*Q;t.y=f.y+48*Q;a.tick=m.collisionPhases[1].firstTick+1;combat(ctx,s);assert.ok(t.damage>damage);assert.equal(t.grabbed,undefined);assert.equal(f.hits,2);
  const other=scene('samson');other.f.weapon='gauntlets';other.t.x=-30*Q;S.startAttack(other.s,other.f,{light:true,x:1});other.f.action!.tick=S.moves[other.f.action!.move!].startup+1;combat(ctx,other.s);assert.ok(other.t.damage>0,'small rear splash');
});
test('Caleb punch and clap are separate hits, with a long-range sound projectile',()=>{
  const {s,f,t}=scene('caleb');f.weapon='gauntlets';S.startAttack(s,f,{light:true,x:1});const a=f.action!,m=S.moves[a.move!];assert.equal(m.id,'caleb_gauntlets_slight');
  for(const ph of m.collisionPhases){f.hitstop=t.hitstop=0;t.x=50*Q;t.y=80*Q;a.tick=ph.firstTick+1;combat(ctx,s);}
  assert.equal(f.hits,2);assert.equal(m.projectile!.effect,'sound');assert.ok(m.projectile!.speedQ*m.projectile!.lifetimeTicks>=240*Q);
});
test('Moses waves hit both sides; Joshua sun beam reaches upward; Esther hurricane pushes forward',()=>{
  const {s,f,t}=scene('moses');f.weapon='staff';t.x=-70*Q;S.startAttack(s,f,{light:true,y:-1});f.action!.tick=S.moves[f.action!.move!].startup+1;combat(ctx,s);assert.ok(t.damage>0);
  assert.equal(S.moves.joshua_shield_nsig.effect,'sun');assert.ok(S.moves.joshua_shield_nsig.collisionPhases[0].rectUnits[3]>=200);
  const e=scene('esther');e.f.weapon='blades';S.startAttack(e.s,e.f,{light:true,x:1});assert.equal(e.f.action!.move,'esther_blades_slight');e.f.action!.tick=9;combat(ctx,e.s);assert.ok(e.t.kx>0);
});
test('heavy charge is capped and damage grows; Samson receives 5% less and deals 10% extra',()=>{
  const hit=(hero:string,target:string,charge=0)=>{const {s,f,t}=scene(hero,target);f.weapon='unarmed';S.startAttack(s,f,{heavy:true,x:1});const a=f.action!,m=S.moves[a.move!];f.stats.power=t.stats.power=5;a.charge=charge;a.tick=m.startup+1;combat(ctx,s);return t.damage;};
  const base=hit('david','saul');assert.ok(base>0);assert.equal(hit('david','samson'),Math.floor(base*.95+.5));assert.ok(hit('david','saul',36)>base);assert.equal(hit('samson','saul'),Math.floor(base*1.1+.5));
  for(const m of content.attacks.attacks.filter(m=>m.input.button==='heavy')){assert.equal(m.chargeMaxTicks,36);assert.equal(m.chargeMaxDamagePermille,1500);}
});
test('Samson attack timing is about five percent slower without repeated attack events',()=>{
  const duration=(hero:string)=>{const {s,f,t}=scene(hero);t.x=450*Q;f.weapon='unarmed';S.startAttack(s,f,{light:true});let ticks=0,events=0;while(f.action&&ticks<100){S.step(s);ticks++;events+=s.events.filter(e=>e.type==='element').length;}return {ticks,events};};
  const base=duration('david'),slow=duration('samson');
  assert.ok(slow.ticks>base.ticks);assert.ok(Math.abs(slow.ticks/base.ticks-1.05)<.03);assert.equal(slow.events,1);
});
test('earth pounds burst on landing and Nehemiah launches the rock wave from ground contact',()=>{
  for(const hero of ['caleb','nehemiah']){
    const {s,f,t}=scene(hero);t.x=400*Q;f.weapon=hero==='caleb'?'gauntlets':'hammer';f.ground=null;f.y=82*Q;
    S.startAttack(s,f,{heavy:true,y:-1});f.action!.tick=S.moves[f.action!.move!].startup;
    S.moveFighter(s,f,0,-4*Q);assert.equal(f.action!.impactTick,s.tick);assert.ok(s.events.some(e=>e.type==='element'));
    if(hero==='nehemiah')assert.ok(s.projectiles.some(p=>p.effect==='rock'));
  }
});
