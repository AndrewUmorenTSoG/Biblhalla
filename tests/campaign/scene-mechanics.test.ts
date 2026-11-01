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

test('L016/L042: lookouts see only ahead, and crouching in cover hides you', () => {
  for (const id of ['L016', 'L042']) {
    const s = enter(id);
    assert.ok(s.sightLines, `${id} uses line of sight`);
    assert.ok(s.covers.length >= 2);
    const h = s.hazards[0];
    for (let t = 0; t < 600 && !(h.state === 'active'); t++) A.step(s, {});
    const f = s.world.fighters[0];
    const place = (dx: number) => { f.x = h.x + dx * Q * h.facing!; f.y = 82 * Q; f.vx = f.vy = 0; f.action = null; };
    // Behind the lookout: unseen.
    place(-120);
    let x = f.x; A.step(s, {}); assert.equal(f.x, x, 'behind the lookout is safe');
    // In its sight line, crouching inside cover: hidden.
    const cover = s.covers.find(([a, b]) => Math.sign(((a + b) / 2) - h.x) === h.facing)!;
    f.x = (cover[0] + cover[1]) / 2; f.y = 82 * Q; f.vx = f.vy = 0;
    x = f.x; A.step(s, { y: -1 }); assert.equal(f.x, x, 'hidden in cover');
    // In its sight line in the open: seen, sent back without harm.
    assert.equal(h.state, 'active');
    place(100);
    A.step(s, { y: -1 });
    assert.equal(f.x, 80 * Q, 'crouching in the open is still seen and sent back to the safe deck');
    assert.equal(f.damage, 0);
  }
});

test('escort travelers wait in their bay, follow only after Regroup, and stay safe at their gate', () => {
  const s = enter('L004');
  assert.equal(s.travelers.length, s.markers.filter(m => m.type === 'escort').length);
  const f = s.world.fighters[0], m = s.markers[0], t = s.travelers[0];
  const bay = t.x;
  for (let k = 0; k < 120; k++) A.step(s, { x: 1 });
  assert.equal(t.x, bay, 'a waiting traveler does not wander');
  f.x = m.x; f.y = m.y; f.action = null;
  A.interact(s);
  assert.equal(t.state, 'following');
  // Run ahead to the gate: too far for the traveler, so the gate waits.
  f.x = m.targetX; f.y = m.y;
  A.interact(s);
  assert.ok(!m.done);
  assert.match(s.caption, /catch up/);
  for (let k = 0; k < 300 && Math.abs(t.x - f.x) > 150 * Q; k++) A.step(s, {});
  A.interact(s);
  assert.ok(m.done);
  assert.equal(t.state, 'safe');
  const parked = t.x;
  for (let k = 0; k < 120; k++) A.step(s, { x: -1 });
  assert.equal(t.x, parked, 'a delivered traveler stays at its gate');
});

test('L056: Ken waits at each ember lane and crosses only in a safe window; embers never hurt', () => {
  const s = enter('L056', 'hard');
  assert.equal(s.embers.length, 3);
  const f = s.world.fighters[0], lane = s.embers[0];
  // Player goes past the first lane; Ken must wait at the edge until it is safe.
  f.x = lane.x + 150 * Q; f.y = 82 * Q;
  let crossedDuringDanger = false, crossed = false;
  for (let t = 0; t < 600 && !crossed; t++) {
    f.x = lane.x + 150 * Q; f.y = 82 * Q; f.vx = 0;
    A.step(s, {});
    if (lane.kenCrossed) { crossed = true; crossedDuringDanger = lane.state !== 'safe'; }
    else assert.ok(s.companion.x <= lane.x - 55 * Q, 'Ken never stands in the lane');
  }
  assert.ok(crossed && !crossedDuringDanger);
  // Standing in an active lane sends the player back without damage.
  for (let t = 0; t < 600 && lane.state !== 'active'; t++) A.step(s, {});
  f.x = lane.x; f.y = 82 * Q;
  A.step(s, {});
  assert.ok(f.x < lane.x - 200 * Q);
  assert.equal(f.damage, 0);
  // The scene cannot complete while Ken is still behind a lane.
  for (const m of s.markers) { m.done = true; if (!s.done.includes(m.id)) s.done.push(m.id); }
  f.x = 3700 * Q; f.y = 82 * Q;
  A.step(s, { interact: true });
  assert.notEqual(s.phase, 'complete');
});
