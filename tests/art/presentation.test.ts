import test from 'node:test';
import assert from 'node:assert/strict';
import { interpolatePosition,cameraEase,runCadence } from '../../apps/game/src/render/animation.ts';
test('visual interpolation preserves simulation inputs and snaps teleports',()=>{
  const before=Object.freeze({x:10,y:20}),current=Object.freeze({x:30,y:40});
  assert.deepEqual(interpolatePosition(before,current,.5,200),{x:20,y:30});
  assert.deepEqual(interpolatePosition(before,{x:1000,y:40},.1,200),{x:1000,y:40});
  assert.deepEqual(interpolatePosition(undefined,current,.5,200),current);
  assert.deepEqual(interpolatePosition(before,current,1,200),current);
});
test('camera settles the same distance at 30, 60 and 120 Hz',()=>{
  const values=[30,60,120].map(rate=>{let x=0;for(let i=0;i<rate;i++)x+=(100-x)*cameraEase(.08,1000/rate);return x;});
  for(const x of values)assert.ok(Math.abs(x-values[0])<1e-9);
  assert.equal(cameraEase(.08,0),0);
});
test('run cadence follows actual speed with bounded extremes',()=>{
  assert.equal(runCadence(5),1);assert.equal(runCadence(-5),1);
  assert.ok(runCadence(2)<runCadence(5));assert.equal(runCadence(100),1.6);
});
