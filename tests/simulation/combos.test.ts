import test from 'node:test';
import assert from 'node:assert/strict';
import { S, Q } from '../helpers/engine.ts';
import { ComboTracker } from '../../apps/game/src/training/combo.ts';
import { LAUNCH_STUN_CAP, launchStunBonus } from '../../packages/sim/src/combat.ts';
import type { InputFrame, SimState } from '../../packages/sim/src/index.ts';

function duel(weapon: string, damage: number): SimState {
  const s = S.create({ mode: 'training', hero: 'david', opponent: 'saul' });
  while (s.phase === 'countdown') S.step(s);
  const [a, d] = s.fighters;
  a.weapon = weapon; a.x = 0; a.y = 80 * Q; a.facing = 1;
  d.x = 45 * Q; d.y = 80 * Q; d.facing = -1; d.damage = damage;
  for (let i = 0; i < 4; i++) S.step(s);
  return s;
}

/** Light, then chase toward on the confirmed hit, then light again, as long as possible. */
function chaseString(s: SimState, ticks = 160) {
  const [a, d] = s.fighters;
  const t = new ComboTracker(a.id, d.id);
  for (let k = 0; k < ticks; k++) {
    const act = a.action;
    const frame: InputFrame = k === 0 ? { light: true }
      : act?.kind === 'attack' && act.confirmed && a.chase > 0 ? { dodge: true, x: 1 }
      : act?.kind === 'chase' || !act ? { light: true } : {};
    S.step(s, { [a.id]: frame });
    t.observe(s);
  }
  return t.report;
}

test('a confirmed hit plus a chase dash links into a true combo', () => {
  for (const weapon of ['sword', 'gauntlets', 'unarmed']) {
    const r = chaseString(duel(weapon, 1000));
    assert.ok(r.best >= 2, `${weapon}: at least a two-hit combo (best ${r.best})`);
  }
});

test('every combo string ends: bounded hits and a real escape window', () => {
  for (const weapon of ['sword', 'gauntlets', 'spear', 'unarmed']) {
    for (const damage of [0, 300, 600, 1000, 1500]) {
      const r = chaseString(duel(weapon, damage), 400);
      assert.ok(r.best <= 5, `${weapon} at ${damage / 10}: ${r.best} hits`);
    }
  }
});

test('launch hitstun bonus grows with force and is capped', () => {
  assert.equal(launchStunBonus(0), 0);
  assert.ok(launchStunBonus(1280) > launchStunBonus(640));
  assert.equal(launchStunBonus(1e6), LAUNCH_STUN_CAP);
});

test('gravity cancel: a neutral air dodge cancels into a grounded attack in mid-air', () => {
  const s = duel('sword', 0);
  const a = s.fighters[0];
  S.step(s, { [a.id]: { jump: true, jumpHeld: true } });
  for (let k = 0; k < 10; k++) S.step(s, { [a.id]: { jumpHeld: true } });
  assert.equal(a.ground, null);
  S.step(s, { [a.id]: { dodge: true } });
  assert.equal(a.action?.kind, 'dodge');
  for (let k = 0; k < 4; k++) S.step(s, { [a.id]: {} });
  S.step(s, { [a.id]: { light: true } });
  assert.equal(a.action?.kind, 'attack');
  assert.equal(a.action?.move, 'sword_nlight', 'the grounded light comes out in the air');
  assert.equal(a.ground, null);
});

test('a directional air dodge cannot gravity cancel', () => {
  const s = duel('sword', 0);
  const a = s.fighters[0];
  S.step(s, { [a.id]: { jump: true, jumpHeld: true } });
  for (let k = 0; k < 10; k++) S.step(s, { [a.id]: { jumpHeld: true } });
  S.step(s, { [a.id]: { dodge: true, x: 1 } });
  for (let k = 0; k < 4; k++) S.step(s, { [a.id]: {} });
  S.step(s, { [a.id]: { light: true } });
  assert.equal(a.action?.kind, 'dodge');
});
