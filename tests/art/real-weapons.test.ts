import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
import{drawWeaponSprite}from'../../apps/game/src/render/weapon-art.ts';import{Renderer}from'../../apps/game/src/render/renderer.ts';
const meta=JSON.parse(readFileSync(new URL('../../assets/runtime/fighters/fighters.json',import.meta.url),'utf8'));
test('thrown weapons retain the exact equipped texture and frame',()=>{
 const old=(globalThis as any).Image;(globalThis as any).Image=class{src='';complete=true;naturalWidth=1024;};
 try{for(const kind of ['sword','staff','spear','hammer','bow','sling','shield','blades','gauntlets']){const draws:any[][]=[];const c=new Proxy({}as any,{get:(_,key)=>(...args:any[])=>{if(key==='drawImage')draws.push(args);}});assert.equal(drawWeaponSprite(c,kind,0,0,0,false,0,true),true);assert.equal(drawWeaponSprite(c,kind,0,0,2,false,0,true),true);assert.deepEqual(draws[0],draws[1],kind);}}
 finally{(globalThis as any).Image=old;}
});
test('drawn slingers retain their sling in every movement phase and use the release drawing in attacks',()=>{
 const r=Object.create(Renderer.prototype)as Renderer;r.atlas=Object.fromEntries(Object.entries(meta).map(([id,e]:[string,any])=>[id,e.frames]));r.clips=Object.fromEntries(Object.entries(meta).map(([id,e]:[string,any])=>[id,e.clips]));
 for(const hero of ['david','moses','miriam']){for(const pose of ['idle','run','air_rise','air_apex','air_fall','land'])assert.match(r.frameFor(hero,pose,'sling','',0,8),/^(equipped_sling_|gait_sling_)/);assert.equal(meta[hero].clips.sling_nlight.frames[2],'equipped_sling_14');for(let i=0;i<4;i++)for(const row of ['idle','run','air','cast'])assert.ok(meta[hero].frames[`slinger_${row}_${i}`]);}
});
