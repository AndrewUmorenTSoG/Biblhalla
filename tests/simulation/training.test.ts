import test from 'node:test';
import assert from 'node:assert/strict';
import { S, Q } from '../helpers/engine.ts';
import { ComboTracker, InputHistory, actionable, describe } from '../../apps/game/src/training/combo.ts';
import type { SimState } from '../../packages/sim/src/index.ts';

function training(): SimState {
  const s = S.create({ mode: 'training', hero: 'samson', opponent: 'david' });
  while (s.phase === 'countdown') S.step(s);
  return s;
}

/** Fake a hit event as the simulation would emit it. */
function hit(s: SimState, attacker: number, defender: number, damage = 100): void {
  s.events = [{ id: ++s.eventId, tick: s.tick, type: 'hit', fighter: defender, attacker, damage }];
}

test('hits link into one combo only while the defender never became actionable', () => {
  const s = training();
  const [a, d] = s.fighters;
  const t = new ComboTracker(a.id, d.id);
  d.stun = 20;
  hit(s, a.id, d.id); t.observe(s);
  s.events = []; t.observe(s); t.observe(s); // still in hitstun: no gap
  hit(s, a.id, d.id, 80); t.observe(s);
  assert.deepEqual([t.report.hits, t.report.damageTenths, t.report.lastGap], [2, 180, 0]);
  d.stun = 0; d.hitstop = 0; d.action = null;
  s.events = []; for (let k = 0; k < 7; k++) t.observe(s);
  hit(s, a.id, d.id, 50); t.observe(s);
  assert.deepEqual([t.report.hits, t.report.damageTenths, t.report.lastGap, t.report.best], [1, 50, 7, 2]);
});

test('actionable means free to act: not stunned, frozen, respawning or committed', () => {
  const s = training();
  const d = s.fighters[1];
  d.action = null; d.stun = 0; d.hitstop = 0;
  assert.ok(actionable(d));
  d.stun = 1; assert.ok(!actionable(d)); d.stun = 0;
  d.hitstop = 1; assert.ok(!actionable(d)); d.hitstop = 0;
  d.respawn = 5; assert.ok(!actionable(d));
});

test('a real light-attack hit is observed from simulation events', () => {
  const s = training();
  const [a, d] = s.fighters;
  a.weapon = 'gauntlets';
  a.x = 0; a.y = 80 * Q; a.facing = 1; d.x = 50 * Q; d.y = 80 * Q;
  for (let k = 0; k < 4; k++) S.step(s);
  const t = new ComboTracker(a.id, d.id);
  S.step(s, { [a.id]: { light: true } }); t.observe(s);
  for (let k = 0; k < 30 && !t.report.hits; k++) { S.step(s); t.observe(s); }
  assert.equal(t.report.hits, 1);
  assert.ok(t.report.damageTenths > 0);
});

test('input history keeps distinct presses, newest last, bounded', () => {
  const h = new InputHistory();
  h.record(1, { x: 1, light: true });
  h.record(2, { x: 1, light: true });
  h.record(3, { y: -1, heavy: true });
  h.record(4, { x: 1 });
  assert.deepEqual(h.entries.map(e => e.text), ['→ Light', '↓ Heavy']);
  for (let k = 0; k < 50; k++) h.record(10 + k, { jump: k % 2 === 0, dodge: k % 2 === 1 });
  assert.equal(h.entries.length, 30);
  assert.equal(describe({ x: -1, y: 1, jump: true, light: true }), '↑← Jump+Light');
});
