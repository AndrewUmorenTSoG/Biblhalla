import test from 'node:test';
import assert from 'node:assert/strict';
import {S,Q} from '../helpers/engine.ts';
import {DEFAULT_BINDINGS} from '../../apps/game/src/storage/profile.ts';
import {keyboardFrame} from '../../apps/game/src/input/keymap.ts';
import {Renderer} from '../../apps/game/src/render/renderer.ts';
import {createContext} from '../../packages/sim/src/context.ts';
import {combat} from '../../packages/sim/src/combat.ts';
import {content} from '../helpers/engine.ts';
import { fighterMeta } from '../helpers/art.ts';

function scene(facing=1){
 const s=S.create({mode:'training',hero:'gideon'});s.phase='playing';
 const [f,t]=s.fighters;for(const p of s.fighters){p.invulnerable=p.respawn=p.hitstop=0;p.ai.next=1e9;p.ai.intent=S.input();p.y=80*Q;p.ground=s.map.main.id;}
 f.weapon='shield';f.x=0;f.facing=facing;t.x=-450*facing*Q;return{s,f,t};
}
test('low shield strike visibly reaches the contact dummy when the first hit connects',()=>{
 const e=fighterMeta.gideon;
 const r=Object.create(Renderer.prototype);r.atlas={gideon:e.frames};r.clips={gideon:e.clips};
 for(const facing of [-1,1]){
  const{s,f,t}=scene(facing);t.x=95*Q*facing;S.startAttack(s,f,{light:true,y:-1});let connected=false;
  for(let n=0;n<15;n++){S.step(s);if(t.damage){const key=r.frameFor('gideon','active','shield','shield_dlight',f.action!.tick),frame=e.frames[key];assert.match(key,/^release_dlight_[4-7]$/);const x=f.x/Q+(frame.gripX-frame.pivotX)*96/e.frames.idle.h*facing,y=f.y/Q+(frame.pivotY-frame.gripY)*96/e.frames.idle.h;const radius=S.P.hurtboxUnits[0]/2,nearestY=Math.max(t.y/Q+radius,Math.min(y,t.y/Q+S.P.hurtboxUnits[1]-radius));assert.ok(Math.hypot(x-t.x/Q,y-nearestY)<=radius+62*96/160/2,'actual shield reaches dummy capsule');assert.equal(f.hits,1);connected=true;break;}}
  assert.ok(connected);
 }
});
test('low shield strike does not hit the empty space behind or beyond the impact shield',()=>{
 const ctx=createContext(content);
 for(const hero of ['gideon','nehemiah'])for(const distance of [20,116]){
  const{s,f,t}=scene();f.hero=hero;t.x=distance*Q;S.startAttack(s,f,{light:true,y:-1});f.action!.tick=9;combat(ctx,s);
  assert.equal(t.damage>0,hero==='nehemiah','Gideon uses authored shield contact; other fighters keep their shared range');
 }
});
test('A/D + K rushes behind the held shield in either direction and brakes',()=>{
 for(const facing of [-1,1]){
  const {s,f}=scene(facing),key=facing===1?'KeyD':'KeyA';
  const i=keyboardFrame(DEFAULT_BINDINGS,new Set([key,'KeyK']),new Set(['KeyK']));
  S.step(s,{[f.id]:{...i,heavyHeld:false}});assert.equal(f.action?.move,'gideon_shield_ssig');
  for(let n=0;n<60;n++){const old=f.x;S.step(s);assert.ok(Math.abs(f.x-old)<=8*Q);assert.equal(s.projectiles.length,0);assert.equal(f.weapon,'shield');}
  assert.equal(f.x,96*Q*facing);assert.equal(f.y,80*Q);assert.equal(f.vx,0);assert.equal(f.action,null);
 }
});
test('rush stays still while charging, remains vulnerable and respects a solid wall',()=>{
 const {s,f}=scene();S.startAttack(s,f,{heavy:true,x:1});
 for(let n=0;n<30;n++)S.step(s,{[f.id]:{heavyHeld:true}});
 assert.equal(f.action?.tick,15);assert.equal(f.x,0);assert.ok(f.action!.charge>0);assert.equal(S.moves[f.action!.move!].invulnerability,false);
 s.map={...s.map,platforms:[...s.map.platforms,{id:'rush-wall',kind:'solid',rectUnits:[55,80,20,150]}]};
 for(let n=0;n<60;n++)S.step(s);
 assert.equal(f.x, (55-S.P.hurtboxUnits[0]/2)*Q);assert.equal(f.y,80*Q);
});
test('rush connects once, and a charged impact does more damage',()=>{
 const damage=(charge:number)=>{const{s,f,t}=scene();t.x=100*Q;S.startAttack(s,f,{heavy:true,x:1});f.action!.charge=charge;for(let n=0;n<60;n++)S.step(s);assert.equal(f.hits,1);assert.equal(s.projectiles.length,0);return t.damage;};
 assert.ok(damage(36)>damage(0));
});
test('neutral K is a shield lift with a real rise, upward contact and recovery',()=>{
 for(const facing of [-1,1]){
  const{s,f,t}=scene(facing);t.x=30*Q*facing;t.y=150*Q;t.ground=null;
  S.step(s,{[f.id]:{heavy:true}});assert.equal(f.action?.move,'gideon_shield_nsig');
  let peak=f.y;for(let n=0;n<100;n++){S.step(s);peak=Math.max(peak,f.y);assert.equal(s.projectiles.length,0);assert.equal(f.weapon,'shield');}
  assert.ok(peak>130*Q);assert.ok(t.damage>0);assert.equal(f.hits,1);assert.equal(f.y,80*Q);assert.equal(f.action,null);
 }
});
test('Gideon light, aerial, recovery, down and combo grammar retain their weapon',()=>{
 const expected=[['shield_nlight',{light:true},true],['shield_slight',{light:true,x:1},true],['shield_dlight',{light:true,y:-1},true],['shield_nair',{light:true},false],['shield_sair',{light:true,x:1},false],['shield_dair',{light:true,y:-1},false],['shield_recovery',{heavy:true},false],['shield_ground_pound',{heavy:true,y:-1},false]] as const;
 for(const [move,input,ground]of expected){const{s,f}=scene();if(!ground){f.ground=null;f.y=200*Q;}assert.ok(S.startAttack(s,f,input));assert.equal(f.action!.move,move);for(let n=0;n<8;n++)S.step(s);assert.equal(f.weapon,'shield');assert.equal(s.projectiles.length,0);}
});
