import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { arenaThemes, paintArenaSurface } from '../../apps/game/src/render/arena-scenes.ts';
import { createEngine, Q } from '../../packages/sim/src/index.ts';
import { loadContent } from '../../tools/lib/content.ts';

const maps = JSON.parse(readFileSync(new URL('../../production-pack/09_Data/maps.json', import.meta.url), 'utf8')).maps;

/** Canvas stand-in that records fillRect calls and accepts every other drawing call. */
function recorder(rects: number[][]): CanvasRenderingContext2D {
  return new Proxy({}, {
    get: (_t, key) => key === 'fillRect' ? (...r: number[]) => rects.push(r) : () => {},
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
}

test('visible arena tops meet the feet of grounded simulated fighters',()=>{
  const engine=createEngine(loadContent());
  for(const map of maps){
    const world=engine.create({mode:'training',arena:map.id});
    for(let tick=0;tick<240;tick++)engine.step(world,{});
    const fighter=world.fighters[0],surface=[world.map.main,...world.map.platforms].find(p=>p.id===fighter.ground);
    assert.ok(surface,`${map.id}: grounded fighter`);
    const rects:number[][]=[];
    paintArenaSurface(recorder(rects),map.id,surface.rectUnits,surface.kind==='solid');
    const edge=rects[rects.length-1];
    assert.equal(edge[1]+edge[3],fighter.y/Q,`${map.id}: painted floor meets fighter feet`);
  }
});

test('all six maps have a distinct surface design and exact playable top edges', () => {
  assert.equal(maps.length, 6);
  assert.equal(new Set(maps.map((map: any) => arenaThemes[map.id]?.accent)).size, 6);
  const signatures = new Set<string>();
  for (const map of maps) {
    for (const platform of [map.main, ...map.platforms]) {
      const rects: number[][] = [];
      paintArenaSurface(recorder(rects), map.id, platform.rectUnits, platform.kind === 'solid');
      const [x, bottom, width, thickness] = platform.rectUnits;
      const top = bottom + thickness;
      assert.ok(rects.some(([rx, ry, rw, rh]) => rx === x && ry + rh === top && rw === width), `${map.id}: top edge`);
      for (const [, ry, , rh] of rects) assert.ok(ry + rh <= top + 1e-9, `${map.id}: nothing painted above the standing surface`);
      if (platform === map.main) signatures.add(JSON.stringify(rects.slice(0, 12)));
    }
  }
  assert.equal(signatures.size, 6, 'each arena paints its main stage differently');
});
