import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawWhirlwind} from '../../apps/game/src/render/wind.ts';
const meta=JSON.parse(readFileSync(new URL('../../assets/runtime/fighters/fighters.json',import.meta.url),'utf8')).esther;
test('Esther has 24 full-body turn drawings and visits every active angle in both whirlwinds',()=>{
 for(let i=0;i<24;i++){const f=meta.frames['release_esther_wind_'+i];assert.ok(f);assert.equal(f.sheet,'esther_whirlwind');assert.equal(f.pivotY,f.h);}
 for(const id of ['esther_blades_slight','esther_blades_ssig']){const c=meta.clips[id];assert.equal(c.frames.length,25);assert.equal(c.frames.at(-1),'equipped_blades_idle_0');assert.deepEqual(c.frames.slice(4,20),Array.from({length:16},(_,i)=>'release_esther_wind_'+(i+4)));assert.ok(c.ticks.slice(4,20).every(n=>n===2));}
});
function record(){const calls:any[]=[];const c=new Proxy({globalAlpha:1}as any,{get:(o,k)=>k==='globalAlpha'?o[k]:(...args:any[])=>calls.push([k,...args]),set:(o,k,v)=>{o[k]=v;return true;}});return{c,calls};}
test('wind uses open moving wisps with no filled cone or stacked ellipse shape',()=>{
 const a=record();drawWhirlwind(a.c,12,32,false);assert.ok(a.calls.filter(c=>c[0]==='lineTo').length>100);assert.ok(!a.calls.some(c=>c[0]==='ellipse'||c[0]==='closePath'));assert.ok(a.calls.every(c=>c.slice(1).every(v=>typeof v!=='number'||Number.isFinite(v))));
 const b=record();drawWhirlwind(b.c,13,32,false);assert.notDeepEqual(a.calls,b.calls);
 const first=record(),second=record();drawWhirlwind(first.c,12,32,true);drawWhirlwind(second.c,13,32,true);assert.deepEqual(first.calls,second.calls);
 const expired=record();drawWhirlwind(expired.c,42,32,false);assert.equal(expired.calls.length,0);
});
