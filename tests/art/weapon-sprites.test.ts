import test from 'node:test';import assert from'node:assert/strict';
import{weaponSprites}from'../../apps/game/src/render/weapon-sprites.generated.ts';
import{readFileSync}from'node:fs';import{sha256}from'../../tools/lib/content.ts';import{join}from'node:path';import{ROOT}from'../../tools/lib/content.ts';
test('all nine weapons have eight equipped angles and eight flight views with grip registration',()=>{
 assert.equal(Object.keys(weaponSprites).length,9);
 for(const[id,e]of Object.entries(weaponSprites)){assert.equal(e.frames.length,16,id);assert.ok(e.uri.startsWith('data:image/png;base64,'));for(const f of e.frames){assert.ok(f.x>=0&&f.y>=0&&f.x+f.w<=1024&&f.y+f.h<=1024);assert.ok(Number.isFinite(f.pivotX)&&Number.isFinite(f.pivotY));}}
 const meta=JSON.parse(readFileSync(join(ROOT,'assets/runtime/weapons/weapons.json'),'utf8'));for(const e of Object.values(meta)as any[])assert.equal(sha256(readFileSync(join(ROOT,e.image))),e.sha256);
});
