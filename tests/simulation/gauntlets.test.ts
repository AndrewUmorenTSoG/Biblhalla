import assert from 'node:assert/strict';
import test from 'node:test';
import {S,Q} from '../helpers/engine.ts';

function setup(hero='caleb',facing=1,distance=40){
 const world=S.create({mode:'training',hero,trainingBot:'stand'});world.phase='playing';
 const [f,target]=world.fighters;f.weapon='gauntlets';f.facing=facing;f.x=0;target.x=distance*facing*Q;
 for(const p of [f,target]){p.y=80*Q;p.ground=world.map.main.id;p.invulnerable=0;}
 return {world,f,target};
}
test('gauntlet punch burst connects three distinct contacts in either facing',()=>{
 for(const hero of ['caleb','samson'])for(const facing of [-1,1]){
  const {world,f}=setup(hero,facing);let hits=0;
  for(let t=0;t<70;t++){S.step(world,{[f.inputId]:t===0?{light:true}:{}});hits+=world.events.filter(e=>e.type==='hit'&&e.attacker===f.id).length;}
  assert.equal(hits,3,hero+'/'+facing);
 }
});
test('Caleb neutral heavy holds the uppercut windup and releases once',()=>{
 const {world,f,target}=setup();let before=0;
 for(let t=0;t<30;t++){S.step(world,{[f.inputId]:{heavy:t===0,heavyHeld:true}});before+=world.events.filter(e=>e.type==='hit').length;}
 assert.equal(f.action?.move,'caleb_gauntlets_nsig');assert.ok(f.action!.charge>0);assert.equal(before,0);
 for(let t=0;t<40;t++)S.step(world,{[f.inputId]:{}});
 assert.ok(target.damage>0);assert.equal(f.hits,1);
});
test('side light can link into down light only on contact, mirrored both ways',()=>{
 for(const facing of [-1,1])for(const distance of [40,400]){
  const {world,f}=setup('caleb',facing,distance);let linked=false,queued=false;
  for(let t=0;t<70;t++){
   const follow=!queued&&f.action?.confirmed;if(follow)queued=true;
   S.step(world,{[f.inputId]:t===0?{light:true,x:facing}:follow?{light:true,y:-1}:{}});
   if(f.action?.move==='gauntlets_dlight')linked=true;
  }
  assert.equal(linked,distance===40);
 }
});
test('Caleb ground smash emits one rock burst at contact, not while charging',()=>{
 const {world,f}=setup();let bursts=0;
 for(let t=0;t<90;t++){S.step(world,{[f.inputId]:{heavy:t===0,y:t===0?-1:0,heavyHeld:t<30}});
 for(const e of world.events)if(e.type==='element'&&e.move==='caleb_gauntlets_dsig'){assert.ok(t>=30);assert.equal(e.effect,'rock');bursts++;}}
 assert.equal(bursts,1);
});

test('down light links into Caleb uppercut and both attacks hit in either facing',()=>{
 for(const facing of [-1,1]){
  const {world,f}=setup('caleb',facing);let queued=false;const contacts:string[]=[];
  for(let t=0;t<90;t++){
   const follow=!queued&&f.action?.confirmed;if(follow)queued=true;
   S.step(world,{[f.inputId]:t===0?{light:true,y:-1}:follow?{heavy:true}:{}});
   for(const e of world.events)if(e.type==='hit'&&e.attacker===f.id)contacts.push(f.action!.move!);
  }
  assert.deepEqual(contacts,['gauntlets_dlight','caleb_gauntlets_nsig']);
 }
});
