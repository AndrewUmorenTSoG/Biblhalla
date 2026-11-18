import assert from 'node:assert/strict';
import test from 'node:test';
import {S,Q} from '../helpers/engine.ts';
function scene(facing=1,distance=55){
 const world=S.create({mode:'training',hero:'nehemiah',trainingBot:'stand'});world.phase='playing';
 const [f,target]=world.fighters;f.weapon='hammer';f.x=0;f.facing=facing;target.x=distance*facing*Q;
 for(const p of [f,target]){p.y=80*Q;p.ground=world.map.main.id;p.invulnerable=0;}
 return {world,f,target};
}
test('Nehemiah down heavy delivers two timed contacts mirrored in either direction',()=>{
 for(const facing of [-1,1])for(const distance of [30,75,100]){
  const {world,f}=scene(facing,distance);const contacts:number[]=[];let rocks=0;
  for(let t=0;t<110;t++){
   S.step(world,{[f.inputId]:t===0?{heavy:true,y:-1}:{}});
   for(const e of world.events){if(e.type==='hit'&&e.attacker===f.id)contacts.push(Number(e.damage));if(e.type==='element'&&e.move==='nehemiah_hammer_dsig')rocks++;}
  }
  assert.equal(contacts.length,2,JSON.stringify({facing,distance,contacts}));
  assert.ok(contacts[1]>contacts[0]);assert.equal(rocks,2);assert.equal(world.projectiles.length,0);
 }
});
test('Nehemiah forward heavy moves in the chosen direction and hits each target only once',()=>{
 for(const facing of [-1,1]){
  const {world,f}=scene(facing,110);let contacts=0;
  for(let t=0;t<90;t++){
   S.step(world,{[f.inputId]:t===0?{heavy:true,x:facing}:{}});
   contacts+=world.events.filter(e=>e.type==='hit'&&e.attacker===f.id).length;
  }
  assert.equal(contacts,1);assert.ok(f.x*facing>=50*Q);
 }
});
test('holding Nehemiah heavy cannot move or damage during its charge',()=>{
 const {world,f,target}=scene();const start=f.x;
 for(let t=0;t<34;t++)S.step(world,{[f.inputId]:{heavy:t===0,heavyHeld:true,x:t===0?1:0}});
 assert.equal(target.damage,0);assert.equal(f.x,start);assert.ok(f.action!.charge>0);
 for(let t=0;t<50;t++)S.step(world,{[f.inputId]:{}});
 assert.ok(f.x>start);assert.ok(target.damage>0);
});

test('the hammer rush stops against solid geometry',()=>{
 for(const facing of [-1,1]){
  const {world,f}=scene(facing,400);
  world.map=structuredClone(world.map);
  world.map.platforms.push({id:'rush-wall',kind:'solid',rectUnits:[facing===1?48:-68,80,20,160]});
  for(let t=0;t<85;t++)S.step(world,{[f.inputId]:t===0?{heavy:true,x:facing}:{}});
  assert.ok(f.x*facing<48*Q);assert.ok(f.x*facing>0);
 }
});
