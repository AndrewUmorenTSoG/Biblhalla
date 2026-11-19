import assert from 'node:assert/strict';
import test from 'node:test';
import { S, Q } from '../helpers/engine.ts';

test('aerial follow-up keeps the direction pressed during hitstop after the stick is released',()=>{
 for(const facing of [-1,1]) {
  const world=S.create({mode:'training',hero:'caleb',trainingBot:'stand'});
  world.phase='playing';
  const [f,target]=world.fighters;
  f.weapon='gauntlets';f.x=0;f.y=300*Q;f.ground=null;f.facing=facing;target.x=450*Q;
  S.startAttack(world,f,{light:true,x:facing});
  const move=S.moves[f.action!.move!];
  f.action!.confirmed=true;f.action!.tick=move.startup+move.active-2;f.hitstop=2;
  S.step(world,{[f.inputId]:{light:true,x:-facing}});
  for(let i=0;i<6 && f.action?.move!=='gauntlets_air_combo';i++) S.step(world,{[f.inputId]:{}});
  assert.equal(f.action?.move,'gauntlets_air_combo');
  assert.equal(f.action?.facing,-facing,'buffered reversal must survive neutral input');
  assert.equal(f.action?.comboDepth,1);
 }
});

test('later movement cannot redirect a neutral aerial follow-up already buffered',()=>{
 for(const facing of [-1,1]) {
  const world=S.create({mode:'training',hero:'david',trainingBot:'stand'});world.phase='playing';
  const [f,target]=world.fighters;f.weapon='sword';f.x=0;f.y=300*Q;f.ground=null;f.facing=facing;target.x=450*Q;
  S.startAttack(world,f,{light:true,x:facing});
  const move=S.moves[f.action!.move!];f.action!.confirmed=true;f.action!.tick=move.startup+move.active-2;f.hitstop=2;
  S.step(world,{[f.inputId]:{light:true}});
  for(let i=0;i<6 && f.action?.move!=='sword_air_combo';i++)S.step(world,{[f.inputId]:{x:-facing}});
  assert.equal(f.action?.move,'sword_air_combo');
  assert.equal(f.action?.facing,facing);
 }
});
