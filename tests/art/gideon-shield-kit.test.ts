import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Renderer} from '../../apps/game/src/render/renderer.ts';
import {readPng} from '../../tools/art/image.ts';
import {sha256,ROOT} from '../../tools/lib/content.ts';
import {join} from 'node:path';
const all=JSON.parse(readFileSync(join(ROOT,'assets/runtime/fighters/fighters.json'),'utf8')),e=all.gideon;
test('64 drawn shield poses are registered to hands on a small additional texture',()=>{
 const page=e.pages.gideon_shield_kit,bytes=readFileSync(join(ROOT,page.image)),png=readPng(join(ROOT,page.image));
 assert.equal(sha256(bytes),page.sha256);assert.ok(png.width<=2048&&png.height<=2048);
 let count=0;for(const kind of ['rush','lift','sweep','air'])for(let i=0;i<16;i++){
  const f=e.frames[`release_${kind}_${i}`];assert.equal(f.sheet,'gideon_shield_kit');assert.ok(f.gripX>=0&&f.gripX<f.w&&f.gripY>=0&&f.gripY<f.h);assert.equal(f.pivotY,f.h);assert.ok(f.x+f.w<=png.width&&f.y+f.h<=png.height);count++;
 }assert.equal(count,64);
});
test('low shield thrust has sixteen distinct drawings with full reach throughout impact',()=>{
 const clip=e.clips.shield_dlight;assert.equal(clip.frames.length,17);
 let tick=0;for(let i=0;i<16;i++){const f=e.frames['release_dlight_'+i];assert.ok(f);assert.equal(f.pivotY,f.h);assert.ok(f.gripX<f.w&&f.gripY<f.h);if(i>=4&&i<=7){assert.ok((f.gripX-f.pivotX)*96/e.frames.idle.h>=69);assert.ok((f.pivotY-f.gripY)*96/e.frames.idle.h>=30);}assert.equal(clip.frames[i],'release_dlight_'+i);tick+=clip.ticks[i];}
 assert.equal(tick+clip.ticks[16],29);
});
test('all eleven shield clips render from the correct page, then return to equipped guard',()=>{
 const pages:any={gideon:{complete:true,naturalWidth:2048},gideon_shield_kit:{complete:true,naturalWidth:1024}};
 const drawn:any[]=[];const ctx=new Proxy({} as any,{get:(_,k)=>(...args:any[])=>{if(k==='drawImage')drawn.push(args[0]);},set:()=>true});
 const r=Object.create(Renderer.prototype);Object.assign(r,{ctx,art:pages,atlas:{gideon:e.frames},clips:{gideon:e.clips},S:{moves:{}},reduced:false});
 let clips=0;for(const [move,clip]of Object.entries(e.clips)as[string,any][]){if(!clip.frames.some((f:string)=>/^release_(rush|lift|sweep|air|dlight)_/.test(f)))continue;clips++;let t=0;
  for(let i=0;i<clip.frames.length;i++){drawn.length=0;const key=clip.frames[i];assert.equal(r.frameFor('gideon','active','shield',move,t),key);r.rig('gideon',0,0,1,1,'active',0,t,'shield','',false,move);assert.equal(drawn[0],e.frames[key].sheet?pages.gideon_shield_kit:pages.gideon);t+=clip.ticks[i];}
  assert.equal(clip.frames.at(-1),'equipped_shield_idle_0');assert.ok(new Set(clip.frames).size>=10);
 }assert.equal(clips,11);
 // Corrupt or not-yet-decoded extra art uses the complete equipped idle safely.
 pages.gideon_shield_kit.naturalWidth=0;drawn.length=0;r.rig('gideon',0,0,1,1,'active',0,16,'shield','',false,'gideon_shield_ssig');assert.equal(drawn[0],pages.gideon);
});
