// @ts-nocheck -- ported legacy suite; kept verbatim as a behavior-parity baseline.
import test from 'node:test';
import assert from 'node:assert/strict';
import { S } from '../helpers/engine.ts';
const B = { validate: S.validateReplay, simulate: S.simulateReplay };
function record(){const s=S.create({mode:'duel',hero:'david',seed:15}),r: any={schema:1,contentHash:S.content.hash,initial:S.snapshot(s),entries:[],finalHash:null};for(let n=0;n<1000;n++){if(n===200){S.pause(s,true);r.entries.push({kind:'pause',on:true});S.pause(s,false);r.entries.push({kind:'pause',on:false});}const frames={keyboard:{x:n%200<100?1:-1,jump:n%111===0,jumpHeld:n%111<16,light:n%37===0}};S.step(s,frames);r.entries.push({kind:'input',frames});}r.finalHash=S.hash(s);return r;}
test('exported semantic replay resimulates with a verified checksum including pause',()=>{const r=record();const replay=B.simulate(JSON.parse(JSON.stringify(r)));assert(replay.verified);assert.equal(replay.hash,r.finalHash);});
test('replay rejects content mismatch, altered geometry and nonsemantic payloads',()=>{const r=record();assert.throws(()=>B.validate({...r,contentHash:'bad'}));const changed=JSON.parse(JSON.stringify(r));changed.initial.map.main.rectUnits[2]=1000000;assert.throws(()=>B.validate(changed));const corrupt=JSON.parse(JSON.stringify(r));corrupt.entries[0].frames.keyboard.light='execute';assert.throws(()=>B.validate(corrupt));});
test('replay bounds players and input history before execution',()=>{const r=record();assert.throws(()=>B.validate({...r,entries:Array(24001).fill({kind:'pause',on:true})}));const bad=JSON.parse(JSON.stringify(r));bad.initial.options.fighters=Array(100).fill({hero:'david',human:true,team:0,inputId:'keyboard'});assert.throws(()=>B.validate(bad));});
