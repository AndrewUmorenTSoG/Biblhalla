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

test('L073: stretcher lifts need Ken on the other end', () => {
  const s = enter('L073');
  assert.ok(s.coopLift);
  const f = s.world.fighters[0];
  const m = s.markers.find(k => k.type === 'building' || k.type === 'carry')!;
  f.x = m.x; f.y = m.y; f.action = null;
  s.companion.x = m.x - 600 * Q;
  A.interact(s);
  assert.equal(s.carry, null, 'cannot lift alone');
  assert.match(s.caption, /two-person lift/);
  s.companion.x = m.x - 80 * Q;
  A.interact(s);
  assert.equal(s.carry, m.id);
  for (let t = 0; t < 60; t++) {
    A.step(s, { x: 1 });
    assert.ok(Math.abs(s.companion.x - f.x) <= 60 * Q, 'Ken stays on the stretcher');
  }
});

test('L072: stepping stones rise, warn and sink; slipping returns you to the bank unharmed', () => {
  const s = enter('L072');
  assert.equal(s.stones.length, 9);
  const states = new Set<string>();
  const st = s.stones[0];
  for (let t = 0; t < 300; t++) { A.step(s, {}); states.add(st.state); }
  assert.deepEqual([...states].sort(), ['down', 'sinking', 'up']);
  // A sunk stone is not standable.
  for (let t = 0; t < 300 && st.state !== 'down'; t++) A.step(s, {});
  assert.ok(!s.world.map.platforms.some(p => p.id === st.id));
  // Markers sit on the far banks, never over water.
  for (const m of s.markers) assert.ok(!s.stones.some(z => m.x / Q > z.x - 30 && m.x / Q < z.x + z.w + 30));
  // Falling into the channel puts you back on the near bank with no damage.
  const f = s.world.fighters[0];
  f.x = (st.x + 40) * Q; f.y = 10 * Q; f.vx = f.vy = 0; f.ground = null;
  A.step(s, {});
  assert.equal(f.x, 540 * Q);
  assert.equal(f.damage, 0);
});

test('latches and ropes are secured by holding Interact; letting go keeps progress', async () => {
  const { LATCH_HOLD_TICKS } = await import('../../packages/campaign/src/controller.ts');
  for (const id of ['L050', 'L070']) {
    const s = enter(id);
    const m = s.markers.find(k => k.type === 'latches')!;
    const f = s.world.fighters[0];
    const stand = () => { f.x = m.x; f.y = m.y; f.vx = f.vy = 0; f.action = null; };
    stand();
    A.interact(s);
    assert.ok(!m.done, `${id}: a single press does not secure it`);
    for (let t = 0; t < 15; t++) { stand(); A.step(s, { interactHeld: true }); }
    const partial = m.progress ?? 0;
    assert.ok(partial > 0 && !m.done);
    for (let t = 0; t < 20; t++) { stand(); A.step(s, {}); }
    assert.equal(m.progress, partial, `${id}: progress is kept while released`);
    for (let t = 0; t < LATCH_HOLD_TICKS; t++) { stand(); A.step(s, { interactHeld: true }); }
    assert.ok(m.done, `${id}: secured after holding`);
  }
});

test('L007: pictogram routes reconnect in the order the signs show, not left to right', () => {
  const s = enter('L007');
  const signs = s.markers;
  assert.deepEqual(signs.map(m => m.shape), ['●', '▲', '■', '◆']);
  assert.ok(signs[0].x > signs[1].x, 'the first shape is not the nearest sign');
  assert.match(s.caption, /● → ▲ → ■ → ◆/);
  const f = s.world.fighters[0];
  const visit = (k: number) => { f.x = signs[k].x; f.y = signs[k].y; f.action = null; A.interact(s); };
  visit(1);
  assert.ok(!signs[1].done, 'out of order is refused without penalty');
  assert.match(s.caption, /continues at ● first/);
  for (const k of [0, 1, 2, 3]) { visit(k); assert.ok(signs[k].done, `sign ${signs[k].shape}`); }
});

test('L008: the supply cart waits in its safe bay while raiders are active', () => {
  const s = A.create('L008', 'hard');
  A.begin(s);
  while (s.world.phase === 'countdown') A.step(s, {});
  const cart = s.travelers[0];
  assert.ok(cart, 'the cart exists in the combat scene');
  const f = s.world.fighters[0], m = s.markers.find(k => k.id === cart.markerId)!;
  f.x = m.x; f.y = m.y; f.action = null;
  A.interact(s);
  assert.equal(cart.state, 'following');
  for (let t = 0; t < 600 && !s.world.fighters.some(o => !o.human && o.stocks); t++) A.step(s, {});
  const parked = cart.x;
  f.x = parked + 300 * Q;
  for (let t = 0; t < 30; t++) A.step(s, {});
  assert.equal(cart.x, parked, 'no escort movement during combat');
  for (const o of s.world.fighters) if (!o.human) o.stocks = 0;
  s.world.wavePending = [];
  A.step(s, {});
  assert.notEqual(cart.x, parked, 'it moves again once the raiders are cleared');
});

test('L009: captive gates open by holding Interact and the released stay safe', async () => {
  const { LATCH_HOLD_TICKS } = await import('../../packages/campaign/src/controller.ts');
  const s = A.create('L009', 'easy');
  A.begin(s);
  while (s.world.phase === 'countdown') A.step(s, {});
  const gates = s.markers;
  assert.equal(gates.length, 2);
  assert.ok(gates.every(g => g.type === 'latches' && /Captive gate/.test(g.label)));
  const f = s.world.fighters[0];
  for (const g of gates) {
    for (let t = 0; t <= LATCH_HOLD_TICKS && !g.done; t++) {
      f.x = g.x; f.y = g.y; f.vx = f.vy = 0; f.action = null; f.stun = 0; f.hitstop = 0;
      A.step(s, { interactHeld: true });
    }
    assert.ok(g.done);
  }
  assert.equal(s.travelers.filter(t => t.state === 'safe').length, 2);
});
