import test from 'node:test';
import assert from 'node:assert/strict';
import { S, A, content, Q } from '../helpers/engine.ts';
import { BOSS_SCRIPTS } from '../../packages/campaign/src/index.ts';
import { MIN_TELL_TICKS } from '../../packages/sim/src/boss.ts';
import type { Scene } from '../../packages/campaign/src/index.ts';
import type { SimState } from '../../packages/sim/src/index.ts';

function enter(id: string, difficulty = 'hard'): Scene {
  const s = A.create(id, difficulty);
  A.begin(s);
  while (s.world.phase === 'countdown') A.step(s, {});
  return s;
}
const bossOf = (w: SimState) => w.fighters.find(f => f.guard !== null)!;

test('every non-Goliath boss level has a three-phase authored pattern with readable tells', () => {
  const bossLevels = content.campaign.levels.filter(l => l.boss && l.id !== 'L041');
  assert.equal(bossLevels.length, 10);
  for (const l of bossLevels) {
    const script = BOSS_SCRIPTS[l.id];
    assert.ok(script, `${l.id} has a pattern`);
    assert.equal(script.phases.length, 3);
    for (const phase of script.phases) for (const m of phase) {
      assert.ok(m.tell >= MIN_TELL_TICKS, `${l.id} ${m.name} tell`);
      assert.ok(m.recovery > 0 && m.active > 0, `${l.id} ${m.name} has real recovery`);
    }
  }
  assert.equal(BOSS_SCRIPTS.L041, undefined, 'Goliath is a reenactment, not a boss pattern');
});

test('a boss lane locks when the tell starts and never follows the player', () => {
  const s = enter('L035');
  const w = s.world, player = w.fighters[0];
  for (let t = 0; t < 400 && w.bossHazard?.stage !== 'tell'; t++) A.step(s, {});
  assert.equal(w.bossHazard?.stage, 'tell');
  const box = [...w.bossHazard!.box];
  player.x += 200 * Q;
  for (let t = 0; t < 10; t++) A.step(s, {});
  assert.deepEqual(w.bossHazard!.box, box);
});

test('standing in the active lane is hit once; dodge invulnerability is respected', () => {
  for (const dodging of [false, true]) {
    const s = enter('L035');
    const w = s.world, player = w.fighters[0], boss = bossOf(w);
    for (let t = 0; t < 400 && w.bossHazard?.stage !== 'tell'; t++) A.step(s, {});
    const lockX = w.bossRun!.lockX;
    let hits = 0;
    for (let t = 0; t < 120 && w.bossRun!.stage !== 'recovery'; t++) {
      player.x = lockX; player.stun = 0; player.hitstop = 0;
      // Hold the player inside a spot dodge's invulnerable ticks for the whole move.
      if (dodging) player.action = { kind: 'dodge', tick: 6, duration: 20, instance: 0, facing: 1, hit: [], charge: 0, airborne: false };
      A.step(s, {});
      hits += w.events.filter(e => e.type === 'hit' && e.attacker === boss.id).length;
    }
    assert.equal(hits, dodging ? 0 : 1);
  }
});

test('phase changes at 65% and 30% guard and cancel the move in progress', () => {
  const s = enter('L027');
  const w = s.world, boss = bossOf(w);
  for (let t = 0; t < 400 && w.bossHazard?.stage !== 'tell'; t++) A.step(s, {});
  boss.guard = Math.floor(boss.maxGuard! * 0.6);
  A.step(s, {});
  assert.equal(w.bossRun!.phase, 2);
  assert.equal(w.bossHazard, null, 'no hazard survives a phase exit');
  boss.guard = Math.floor(boss.maxGuard! * 0.2);
  A.step(s, {});
  assert.equal(w.bossRun!.phase, 3);
});

test('breaking the guard clears the boss encounter', () => {
  const s = enter('L017', 'easy');
  const boss = bossOf(s.world);
  for (let t = 0; t < 200; t++) A.step(s, {});
  boss.guard = 0;
  A.step(s, {});
  assert.equal(s.combatCleared, true);
});

test('boss patterns are deterministic across runs', () => {
  const run = () => {
    const s = enter('L054', 'extreme');
    for (let t = 0; t < 1500; t++) A.step(s, { x: t % 120 < 60 ? 1 : -1, jump: t % 50 === 0, jumpHeld: t % 50 < 10 });
    return S.hash(s.world);
  };
  assert.equal(run(), run());
});
