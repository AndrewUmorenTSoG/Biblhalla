import test from 'node:test';
import assert from 'node:assert/strict';
import {shieldReleaseFrame as frame} from '../../apps/game/src/render/shield-release.ts';
test('shield wind-up uses three distinct poses then extends the arm for 0.4 seconds',()=>{
 assert.deepEqual([0,6,12].map(t=>frame(t,16,'')),[0,1,2]);
 for(let t=16;t<40;t++)assert.equal(frame(t,16,'out'),3);
 assert.equal(frame(40,16,'out'),4);
});
test('charge, return, catch and settle use dedicated poses',()=>{
 assert.equal(frame(12,16,'',true),2);
 assert.equal(frame(18,16,'return'),5);
 assert.equal(frame(19,16,'catch'),6);
 assert.equal(frame(22,16,'settle'),7);
});
