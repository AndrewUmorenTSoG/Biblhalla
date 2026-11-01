import test from 'node:test';
import assert from 'node:assert/strict';
import { A, Q } from '../helpers/engine.ts';
import type { Scene } from '../../packages/campaign/src/index.ts';

function enter(id: string, difficulty = 'hard'): Scene {
  const s = A.create(id, difficulty);
  A.begin(s);
  while (s.world.phase === 'countdown') A.step(s, {});
  return s;
}

test('L023: the far shore appears only after the first narrated route marker', () => {
  const s = enter('L023');
  const far = () => s.world.map.platforms.filter(p => p.rectUnits[0] >= 2400).length;
  assert.equal(far(), 0, 'far route held back');
  assert.ok(s.parted && s.parted.length > 0);
  for (let t = 0; t < 120; t++) A.step(s, { x: 1 });
  assert.equal(far(), 0, 'walking alone never opens it');
  const f = s.world.fighters[0], m = s.markers[0];
  f.x = m.x; f.y = m.y; f.action = null;
  A.interact(s);
  if (s.pendingCard !== null) A.resolveCard(s, 0);
  A.step(s, {});
  assert.ok(far() > 0, 'route opens on the cue');
  assert.match(s.caption, /sea opening/);
});

test('L070: storm gusts are announced, slow grounded movement, and stop when the tasks are done', () => {
  const s = enter('L070', 'extreme');
  assert.ok(s.wind);
  const f = s.world.fighters[0];
  f.x = 600 * Q; f.y = 82 * Q;
  let warned = false;
  for (let t = 0; t < 400 && s.wind!.state !== 'gust'; t++) { A.step(s, {}); warned ||= s.wind!.state === 'warning'; }
  assert.ok(warned, 'a warning precedes every gust');
  assert.match(s.caption, /gust/i);
  const x = f.x;
  A.step(s, {});
  assert.equal(f.x, x - 3 * Q, 'headwind pushes back');
  const braced = f.x;
  A.step(s, { y: -1 });
  assert.equal(f.x, braced, 'bracing holds position');
  for (const m of s.markers) { m.done = true; s.done.push(m.id); }
  A.step(s, {});
  assert.equal(s.wind!.state, 'over');
  const calm = f.x;
  for (let t = 0; t < 400; t++) A.step(s, {});
  assert.equal(f.x, calm, 'no gusts after the storm is stilled');
});

test('a gust never pushes a fighter off the edge of their footing', () => {
  const s = enter('L070', 'extreme');
  const f = s.world.fighters[0];
  const floor = s.world.map.main;
  for (let t = 0; t < 400 && s.wind!.state !== 'gust'; t++) A.step(s, {});
  f.x = (floor.rectUnits[0] + 31) * Q; f.y = 82 * Q; f.vx = 0;
  for (let t = 0; t < 30; t++) A.step(s, {});
  assert.ok(f.x >= (floor.rectUnits[0] + 30) * Q - Q);
  assert.ok(f.ground, 'still standing');
});
