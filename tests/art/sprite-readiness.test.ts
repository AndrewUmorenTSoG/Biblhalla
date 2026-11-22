import test from 'node:test';
import assert from 'node:assert/strict';
import { SpriteReadiness } from '../../apps/game/src/render/sprite-readiness.ts';
import { Renderer } from '../../apps/game/src/render/renderer.ts';
test('fighter artwork decodes once and blocks until every page is ready', async () => {
  let finish!: () => void, calls = 0;
  const image = { decode: () => { calls++; return new Promise<void>(resolve => finish = resolve); } } as HTMLImageElement;
  const ready = new SpriteReadiness();
  assert.equal(ready.check([image]), 'loading');
  assert.equal(ready.check([image]), 'loading');
  assert.equal(calls, 1);
  finish(); await Promise.resolve();
  assert.equal(ready.check([image]), 'ready');
  assert.equal(ready.check([undefined]), 'error');
});
test('failed sprite decoding reports an error instead of ready', async () => {
  const ready = new SpriteReadiness();
  const image = { decode: () => Promise.reject(new Error('bad image')) } as HTMLImageElement;
  assert.equal(ready.check([image]), 'loading'); await Promise.resolve();
  assert.equal(ready.check([image]), 'error');
});
test('David and Saul never draw substitute bodies while their sprites are unavailable', () => {
  const renderer = Object.create(Renderer.prototype) as Renderer;
  renderer.ctx = new Proxy({} as CanvasRenderingContext2D, { get: (_, key) => { throw new Error('Unexpected primitive draw: '+String(key)); } });
  renderer.art = {}; renderer.atlas = {};
  for (const hero of ['david','saul']) renderer.rig(hero,0,0,1,1,'run',10);
});

test('legacy David and Saul attack clips cannot flash concept cutouts', () => {
  const renderer = Object.create(Renderer.prototype) as Renderer;
  const sourceXs: number[] = [];
  renderer.ctx = new Proxy({ drawImage: (_: unknown,x: number) => sourceXs.push(x) } as unknown as CanvasRenderingContext2D, { get: (target,key) => (target as any)[key] ?? (() => {}) });
  const sprite = { x: 100,y: 0,w: 20,h: 20,pivotX: 10,pivotY: 20 };
  renderer.art = Object.fromEntries(['david','saul'].map(h => [h,{complete:true,naturalWidth:200}])) as any;
  renderer.atlas = Object.fromEntries(['david','saul'].map(h => [h,{idle:{...sprite,x:0},motion_idle:sprite,sig_old:{...sprite,x:50}}]));
  renderer.clips = Object.fromEntries(['david','saul'].map(h => [h,{old:{frames:['sig_old'],ticks:[10]}}]));
  for (const hero of ['david','saul']) renderer.rig(hero,0,0,1,1,'active',0,0,'unarmed','',false,'old');
  assert.deepEqual(sourceXs,[100,100]);
});
