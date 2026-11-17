import test from 'node:test';
import assert from 'node:assert/strict';
import { S } from '../helpers/engine.ts';
import { drawEncounter } from '../../apps/game/src/render/encounter.ts';
import { davidFightOptions } from '../../packages/campaign/src/david-fights.ts';

test('boss warnings and active strikes never paint a collision overlay', () => {
  const world = S.create(davidFightOptions(2, 'easy', 'keyboard'));
  const canvas = new Proxy({}, {get: (_, key) => () => assert.fail(String(key))}) as CanvasRenderingContext2D;
  for (const stage of ['tell', 'active'] as const) {
    world.bossHazard = {name:'Spear thrust',kind:'melee',stage,box:[0,0,220,72],ticks:4};
    drawEncounter(canvas, world);
  }
});
