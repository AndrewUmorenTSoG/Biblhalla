import test from'node:test';import assert from'node:assert/strict';import{S,Q}from'../helpers/engine.ts';
test('ground movement accelerates promptly and releases to a stop within five ticks',()=>{
 const s=S.create({mode:'training',hero:'david'});while(s.phase==='countdown')S.step(s);const f=s.fighters[0];f.x=0;f.y=80*Q;f.ground=s.map.main.id;f.vx=0;
 const cap=S.P.runMaxQ+S.P.runSpeedPerStatQ*(f.stats.speed-S.P.statBaseline);let acceleration=0;while(f.vx<cap&&acceleration<20){S.step(s,{[f.id]:{x:1}});acceleration++;}assert.ok(acceleration<=8);assert.equal(f.vx,cap);
 let braking=0;while(f.vx&&braking<20){S.step(s);braking++;}assert.ok(braking<=5);assert.equal(f.vx,0);
  f.vx=cap;let turn=0;while(f.vx>=0&&turn<20){S.step(s,{[f.id]:{x:-1}});turn++;}assert.ok(turn<=3);assert.equal(f.facing,-1);
});
