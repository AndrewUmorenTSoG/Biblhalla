import test from 'node:test';
import assert from 'node:assert/strict';
import { A, Q } from '../helpers/engine.ts';
import { AIM_ZONE, STONE_BAY_X } from '../../packages/campaign/src/goliath.ts';
import type { Scene } from '../../packages/campaign/src/index.ts';

function enter(difficulty = 'hard'): Scene {
  const s = A.create('L041', difficulty);
  A.begin(s);
  while (s.world.phase === 'countdown') A.step(s, {});
  return s;
}
const place = (s: Scene, x: number, airborne = false) => {
  const f = s.world.fighters[0];
  f.x = x * Q; f.y = (airborne ? 300 : 82) * Q; f.vx = f.vy = 0; f.action = null;
};

/** Collect the stone, then clear two advances by staying airborne over them. */
function reachAim(s: Scene): void {
  place(s, STONE_BAY_X);
  A.step(s, { interact: true });
  assert.equal(s.goliath.stage, 'composure');
  for (let t = 0; t < 1200 && s.goliath.stage === 'composure'; t++) {
    place(s, STONE_BAY_X - 20, s.goliath.advance.state === 'active');
    A.step(s, {});
  }
  assert.equal(s.goliath.stage, 'aim');
}

test('David plays the reenactment alone, with no combat, damage or projectiles', () => {
  const s = enter();
  assert.equal(s.world.fighters.length, 1);
  assert.equal(s.world.fighters[0].hero, 'david');
  assert.equal(s.markers.length, 0);
  const f = s.world.fighters[0];
  for (let t = 0; t < 300; t++) A.step(s, { light: t % 7 === 0, heavy: t % 11 === 0, item: t % 13 === 0 });
  assert.equal(f.damage, 0);
  assert.equal(s.world.projectiles.length, 0);
  assert.equal(f.action?.kind === 'attack', false);
});

test('an active spear lane returns David to safety without harm', () => {
  const s = enter();
  const lane = s.goliath.lanes[0];
  for (let t = 0; t < 400 && lane.state !== 'active'; t++) { place(s, 300); A.step(s, {}); }
  place(s, lane.x / Q);
  A.step(s, {});
  const f = s.world.fighters[0];
  assert.ok(f.x < lane.x - 100 * Q);
  assert.equal(f.damage, 0);
});

test('a shield advance that catches David restarts composure, nothing more', () => {
  const s = enter();
  place(s, STONE_BAY_X);
  A.step(s, { interact: true });
  assert.ok(s.goliath.stone);
  let reset = false;
  for (let t = 0; t < 600 && !reset; t++) {
    const a = s.goliath.advance;
    if (a.state === 'active') place(s, a.x / Q);
    A.step(s, {});
    reset = s.world.fighters[0].x === (STONE_BAY_X - 150) * Q;
  }
  assert.ok(reset);
  assert.equal(s.goliath.advancesCleared, 0);
  assert.equal(s.goliath.stage, 'composure');
});

test('a miss returns to composure; one aimed stone from the zone completes the account', () => {
  const s = enter('extreme');
  reachAim(s);
  place(s, AIM_ZONE[0] - 200);
  A.step(s, { interact: true });
  assert.equal(s.goliath.stage, 'composure');
  assert.equal(s.goliath.misses, 1);
  reachAim(s);
  assert.equal(s.goliath.open, 1);
  place(s, (AIM_ZONE[0] + AIM_ZONE[1]) / 2);
  A.step(s, { interact: true });
  assert.equal(s.phase, 'complete');
  assert.match(s.caption, /./);
  assert.equal(s.world.fighters[0].damage, 0);
});

test('the opening expires back to composure if no stone is released', () => {
  const s = enter('easy');
  reachAim(s);
  for (let t = 0; t < 400 && s.goliath.stage === 'aim'; t++) A.step(s, {});
  assert.equal(s.goliath.stage, 'composure');
  assert.equal(s.phase, 'active');
});
