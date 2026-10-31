import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { arenaThemes, paintArenaSurface } from '../../apps/game/src/render/arena-scenes.ts';
import { createEngine, Q } from '../../packages/sim/src/index.ts';
import { loadContent } from '../../tools/lib/content.ts';

const maps = JSON.parse(readFileSync(new URL('../../production-pack/09_Data/maps.json', import.meta.url), 'utf8')).maps;

test('visible arena tops meet the feet of grounded simulated fighters',()=>{
  const engine=createEngine(loadContent());
  for(const map of maps){
    const world=engine.create({mode:'training',arena:map.id});
    for(let tick=0;tick<240;tick++)engine.step(world,{});
    const fighter=world.fighters[0],surface=[world.map.main,...world.map.platforms].find(p=>p.id===fighter.ground);
    assert.ok(surface,`${map.id}: grounded fighter`);
    const rects:number[][]=[];
    const context={fillRect:(...r:number[])=>rects.push(r),strokeRect:()=>{},beginPath:()=>{},moveTo:()=>{},lineTo:()=>{},stroke:()=>{},globalAlpha:1} as unknown as CanvasRenderingContext2D;
    paintArenaSurface(context,map.id,surface.rectUnits,surface.kind==='solid');
    const top=rects.find(r=>r[3]===8)!;
    assert.equal(top[1]+top[3],fighter.y/Q,`${map.id}: painted floor meets fighter feet`);
  }
});

test('all six maps have a distinct visual theme and exact playable top edges', () => {
  assert.equal(maps.length, 6);
  assert.equal(new Set(maps.map((map: any) => arenaThemes[map.id]?.accent)).size, 6);
  for (const map of maps) {
    for (const platform of [map.main, ...map.platforms]) {
      const rects: number[][] = [];
      const context = {
        fillRect: (...args: number[]) => rects.push(args),
        strokeRect: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {},
        globalAlpha: 1,
      } as unknown as CanvasRenderingContext2D;
      paintArenaSurface(context, map.id, platform.rectUnits, platform.kind === 'solid');
      const [x, bottom, width, thickness] = platform.rectUnits;
      const top = bottom + thickness;
      assert.ok(rects.some(([rx, ry, rw, rh]) => rx === x && ry === top - 8 && rw === width && rh === 8), `${map.id}: top cue`);
      assert.ok(rects.some(([rx, ry, rw, rh]) => rx === x && ry === top - thickness - 4 && rw === width && rh === thickness + 4), `${map.id}: body`);
    }
  }
});
