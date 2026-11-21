import test from 'node:test';
import assert from 'node:assert/strict';
import { S } from '../helpers/engine.ts';
import { scheduleWave } from '../../packages/sim/src/state.ts';
import { dangerDamage } from '../../packages/sim/src/danger.ts';
import { withChapterOpponent } from '../../packages/campaign/src/david-fights.ts';
import { buildRoster } from '../../apps/game/src/ui/lobby.ts';

test('Quick Battle opponent stocks are independent and bounded', () => {
  const s = S.create({ stocks: 2, opponentStocks: 7 });
  assert.deepEqual(s.fighters.map(f => f.stocks), [2, 7]);
  assert.equal(S.create({ opponentStocks: 99 }).fighters[1].stocks, 3);
  const goliath = S.create(withChapterOpponent({ mode: 'duel', opponent: 'goliath', opponentStocks: 6 }, 'keyboard'));
  assert.equal(goliath.fighters[1].stocks, 6);
});

test('a real team attack hits opponents but passes through teammates', () => {
  const s = S.create({ mode: 'teams', fighters: [
    { hero: 'caleb', team: 0, human: true }, { hero: 'david', team: 0, human: true },
    { hero: 'saul', team: 1, human: true },
  ] });
  s.phase = 'playing';
  const [, y, , height] = s.map.main.rectUnits;
  for (const [i, f] of s.fighters.entries()) {
    f.x = i ? 35 * S.Q : 0; f.y = (y + height) * S.Q;
    f.ground = s.map.main.id; f.invulnerable = f.respawn = 0;
  }
  const attacker = s.fighters[0]; attacker.facing = 1; attacker.weapon = 'gauntlets';
  S.startAttack(s, attacker, {}, false, S.moves.caleb_gauntlets_nlight);
  for (let i = 0; i < 35; i++) S.step(s);
  assert.equal(s.fighters[1].damage, 0);
  assert.ok(s.fighters[2].damage > 0);
});

test('an eliminated human still wins when their CPU teammate is the last team standing', () => {
  const s = S.create({ mode: 'teams', fighters: [
    { hero: 'david', human: true, team: 0 }, { hero: 'caleb', team: 0 },
    { hero: 'saul', team: 1 }, { hero: 'esther', team: 1 },
  ] });
  s.phase = 'playing';
  for (const i of [0, 2, 3]) s.fighters[i].stocks = 0;
  S.step(s);
  assert.equal(s.result?.won, true);
  assert.deepEqual(s.result?.winners, [s.fighters[0].id, s.fighters[1].id]);
});

test('boss difficulty sets red danger and Extreme second stock resets to 100 damage', () => {
  for (const [difficulty, threshold, stocks] of [['easy', 7500, 1], ['hard', 10000, 1], ['extreme', 11000, 2]] as const) {
    const s = S.create({ mode: 'boss', difficulty });
    const boss = s.fighters[1];
    assert.equal(boss.redDamage, threshold);
    assert.equal(boss.stocks, stocks);
    boss.damage = threshold;
    assert.equal(dangerDamage(boss), 1500);
    assert.equal(s.phase, 'countdown', 'red is danger, not defeat');
    if (difficulty === 'extreme') {
      s.phase = 'playing'; boss.respawn = 0; boss.y = -1000000;
      S.step(s);
      assert.equal(boss.stocks, 1);
      assert.equal(boss.redDamage, 1000);
      for (let i = 0; i < 180; i++) S.step(s);
      assert.equal(boss.damage, 0);
      assert.equal(boss.maxGuard, 1000);
    }
  }
});

test('2v2 allies share consecutive seats, cannot damage each other, and win as a team', () => {
  const roster = buildRoster('teams', ['david', 'caleb', 'saul', 'esther'].map((hero, i) => ({ hero, input: i ? 'cpu' : 'keyboard' })), () => true);
  assert.ok(roster.ok); if (!roster.ok) return;
  const s = S.create({ mode: 'teams', fighters: roster.fighters, friendlyFire: true });
  assert.deepEqual(s.fighters.map(f => f.team), [0, 0, 1, 1]);
  assert.equal(s.friendlyFire, false);
  s.phase = 'playing';
  s.fighters[2].stocks = s.fighters[3].stocks = 0;
  S.step(s);
  assert.equal(s.phase, 'result');
  assert.equal(s.result?.won, true);
});

test('endless waves progress beyond authored waves, escalate and introduce rotating giants', () => {
  const s = S.create({ mode: 'waves', endless: true, seed: 123 });
  assert.equal(s.wave, 1);
  for (let i = 0; i < 4; i++) scheduleWave(s);
  assert.ok(s.wavePending[0].startsWith('giant:'));
  const first = s.wavePending[0];
  for (let i = 0; i < 5; i++) scheduleWave(s);
  assert.equal(s.wave, 10);
  assert.notEqual(s.wavePending[0], first);
  assert.equal(s.difficulty, 'hard');
  scheduleWave(s); assert.equal(s.difficulty, 'extreme');
  assert.equal(s.result, null);
});

test('2vWaves keeps a CPU ally, spawns enemies, ignores timer and cleans completed waves', () => {
  const s = S.create({ mode: 'waves', endless: true, waveStyle: 'coop', fighters: [
    { hero: 'david', human: true, team: 0 }, { hero: 'caleb', team: 0 },
  ] });
  s.phase = 'playing'; s.remaining = 1;
  // Keep contenders away from arrival gates while stepping the actual scheduler.
  for (let i = 0; i < 140; i++) { s.fighters[0].x = 0; S.step(s); }
  assert.ok(s.fighters.some(f => f.waveEnemy));
  assert.equal(s.remaining, 1);
  assert.equal(s.phase, 'playing');
  s.wavePending = []; s.cue = null; s.waveWait = 0;
  for (const f of s.fighters) if (f.waveEnemy) f.stocks = 0;
  S.step(s);
  assert.equal(s.fighters.length, 2);
  assert.equal(s.fighters[1].team, 0);
  s.fighters[0].stocks = 0;
  S.step(s); assert.equal(s.phase, 'playing', 'ally can keep the run alive');
  s.fighters[1].stocks = 0;
  S.step(s); assert.equal(s.phase, 'result');
});
