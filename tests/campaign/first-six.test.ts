import test from 'node:test';
import assert from 'node:assert/strict';
import { S, A, content, Q } from '../helpers/engine.ts';
import { gatePoint, ARRIVAL_CUE_TICKS, SAFE_ARRIVAL_UNITS } from '../../packages/sim/src/waves.ts';
import type { Scene } from '../../packages/campaign/src/index.ts';

function enter(id: string, difficulty = 'easy'): Scene {
  const s = A.create(id, difficulty);
  A.begin(s);
  for (let i = 0; i < 64; i++) A.step(s, {});
  return s;
}

test('every level brief yields companion lines and matching wave gates', () => {
  const scripts = content.campaign.scripts;
  assert.equal(scripts.length, 84);
  const l005 = scripts.find(s => s.id === 'L005')!;
  assert.deepEqual(l005.waveEntries.map(w => w.gates), [['left_floor', 'right_shelf'], ['left_floor', 'right_floor'], ['right_floor', 'center']]);
  assert.equal(l005.waveEntries[1].archerGate, 'high_shelf');
  assert.equal(scripts[0].opening.text, 'Let’s follow the first path together.');
  assert.equal(scripts[83].closing.speaker, 'Dru');
});

test('levels open and close with their authored companion lines', () => {
  const s = A.create('L001');
  assert.equal(s.caption, 'Ken: Let’s follow the first path together.');
  A.complete(s);
  assert.equal(s.caption, 'Dru: We can keep going. Stay beside me.');
  assert.equal(A.create('L084').closingLine, 'Dru: We have heard the story. Let’s carry its hope into how we treat people.');
});

test('every wave arrival is announced at its gate 90 ticks ahead, clear of the player', () => {
  const s = A.create('L005', 'hard');
  A.begin(s);
  const w = s.world;
  const player = w.fighters[0];
  const cues: { tick: number; x: number; y: number }[] = [];
  const arrivals: { tick: number; x: number; y: number }[] = [];
  for (let t = 0; t < 4000 && arrivals.length < 3; t++) {
    A.step(s, {});
    for (const e of w.events) {
      if (e.type === 'arrivalCue') cues.push({ tick: w.tick, x: e.x as number, y: e.y as number });
      if (e.type === 'arrival') arrivals.push({ tick: w.tick, x: e.x as number, y: e.y as number });
    }
  }
  assert.equal(arrivals.length, 3);
  arrivals.forEach((a, i) => {
    assert.equal(a.tick - cues[i].tick, ARRIVAL_CUE_TICKS + 1);
    assert.deepEqual([a.x, a.y], [cues[i].x, cues[i].y]);
    assert.ok(Math.abs(a.x - player.x) / Q >= SAFE_ARRIVAL_UNITS || Math.abs(a.y - player.y) / Q >= SAFE_ARRIVAL_UNITS);
  });
  const [lx, ly] = gatePoint(w.map, 'left_floor');
  assert.deepEqual([arrivals[0].x, arrivals[0].y], [lx * Q, ly * Q], 'first raider uses the left floor gate');
});

test('the ark workshop completes through waves plus carried deliveries', () => {
  const s = enter('L005');
  const f = s.world.fighters[0];
  for (let t = 0; t < 20000 && !s.combatCleared; t++) {
    A.step(s, {});
    // Fixture: training raiders are ringed out as soon as they arrive.
    for (const e of s.world.fighters) if (!e.human && e.stocks && !e.invulnerable) S.knockOut(s.world, e);
    f.damage = 0;
  }
  assert.ok(s.combatCleared, 'all three waves cleared');
  for (const m of s.markers) {
    f.x = m.x; f.y = m.y; f.action = null;
    A.interact(s);
    assert.equal(f.carry, true, 'carrying disables attacks');
    A.step(s, { light: true });
    assert.equal(f.action, null);
    f.x = m.targetX;
    A.interact(s);
    assert.ok(m.done);
  }
  f.x = 360 * Q;
  A.step(s, { interact: true });
  assert.equal(s.phase, 'complete');
});

test('rising water sweeps the floor but never the ledges', () => {
  const s = enter('L006', 'hard');
  assert.ok(s.water);
  const f = s.world.fighters[0];
  for (const m of s.markers) assert.ok(m.y > 150 * Q, 'latches sit above the surge line');
  // Stand on the floor away from the safe deck until the surge arrives.
  f.x = 600 * Q; f.y = 82 * Q;
  let swept = false;
  for (let t = 0; t < 800 && !swept; t++) {
    A.step(s, {});
    swept = s.water!.state === 'high' && f.x === 80 * Q;
  }
  assert.ok(swept, 'standing on the floor during a surge returns to the safe deck');
  const ledge = s.world.map.platforms.find(p => p.kind === 'oneWay')!;
  for (let t = 0; t < 400 && s.water!.state !== 'rising'; t++) A.step(s, {});
  f.x = (ledge.rectUnits[0] + 100) * Q; f.y = (ledge.rectUnits[1] + ledge.rectUnits[3]) * Q; f.vx = f.vy = 0;
  const x = f.x;
  for (let t = 0; t < 200; t++) A.step(s, {});
  assert.equal(f.x, x, 'ledges are safe');
});

test('river-sound captions point toward the next garden marker', () => {
  const s = enter('L002');
  for (let t = 0; t < 600 && !/river sounds/.test(s.caption); t++) A.step(s, {});
  assert.match(s.caption, /river sounds are to the (right|left)/);
});

test('story cards stay seen across a checkpoint retry', () => {
  const s = enter('L003');
  const f = s.world.fighters[0];
  const m = s.markers[0];
  f.x = m.x; f.y = m.y; f.action = null;
  A.interact(s);
  assert.ok(A.card(s, s.pendingCard!));
  assert.ok(A.resolveCard(s, 0));
  const m2 = s.markers[1];
  f.x = m2.x; f.y = m2.y;
  A.interact(s);
  A.resolveCard(s, 0);
  const cp = s.checkpointEvent ?? { level: 'L003', stage: s.stage, progress: [...s.done], combatCleared: true, seed: 1, seen: [...s.seen] };
  assert.ok(cp.seen!.includes('L003:0'));
  const retry = A.create('L003', 'easy', cp);
  assert.ok(retry.seen.includes('L003:0') && retry.seen.includes('L003:1'));
});
