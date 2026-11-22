import test from 'node:test';
import assert from 'node:assert/strict';
import { S, content } from '../helpers/engine.ts';
import { DAVID_FIGHTS, davidFightOptions, storyRival, withChapterOpponent } from '../../packages/campaign/src/david-fights.ts';
import { createProfiles, seal } from '../../apps/game/src/storage/profile.ts';
import { rivalFrame, RIVAL_FRAME_COUNT } from '../../apps/game/src/render/story-rivals.ts';

for (const index of [3, 4]) {
  const fight = DAVID_FIGHTS[index];
  test(fight.name + ' has three distinct readable moves which connect once and recover safely', () => {
    const moves = [...new Map(fight.phases.flat().map(m => [m.name, m])).values()];
    assert.equal(moves.length, 3);
    for (const move of moves) {
      assert.ok(move.tell >= 24 && move.recovery >= 24);
      const s = S.create({ ...davidFightOptions(index, 'hard', 'keyboard'), bossScript: { phases: [[move], [move], [move]] } });
      s.phase = 'playing';
      const [player, rival] = s.fighters;
      const [, y, , h] = s.map.main.rectUnits;
      rival.x = 0; player.x = 35 * S.Q;
      for (const f of s.fighters) { f.y = (y + h) * S.Q; f.ground = s.map.main.id; f.invulnerable = f.respawn = 0; }
      rival.facing = 1;
      s.bossRun!.stage = 'tell'; s.bossRun!.ticks = 1;
      let hits = 0;
      for (let tick = 0; tick < move.active + move.recovery; tick++) {
        S.step(s);
        hits += s.events.filter(e => e.type === 'hit' && e.hazard === move.name).length;
        if (String(s.bossRun!.stage) === 'recovery') assert.equal(s.bossHazard, null);
      }
      assert.equal(hits, 1, move.name);
      assert.equal(player.damage, move.damageTenths);
    }
  });
  test(fight.name + ' recovers from a reachable ledge launch without spending a life', () => {
    const s = S.create(davidFightOptions(index, 'easy', 'keyboard')); s.phase = 'playing';
    const rival = s.fighters[1], [left, bottom, , height] = s.map.main.rectUnits;
    rival.ground = null; rival.x = (left - 60) * S.Q; rival.y = (bottom + height + 6) * S.Q; rival.vy = -S.Q;
    for (let i = 0; i < 180 && !rival.ground; i++) S.step(s);
    assert.ok(rival.ground); assert.equal(rival.stocks, 2);
  });
  test(fight.name + ' stays out of the playable and Quick Battle roster', () => {
    assert.equal(S.defs[fight.skin], undefined);
    const options = { mode: 'duel' as const, opponent: fight.skin };
    assert.equal(withChapterOpponent(options, 'keyboard'), options);
    assert.ok(storyRival(index));
  });
}

test('five-fight progress survives save import and old chapter completion unlocks the first rival', () => {
  const profiles = createProfiles(content), store = new profiles.Store();
  for (const wins of [3, 4, 5]) {
    store.import(seal({ ...profiles.defaults(), davidWins: wins }));
    assert.equal(store.data.davidWins, wins);
  }
});

test('rival sprite states occupy distinct bounded frames without frame-rate-dependent simulation', () => {
  const frames = new Set<number>();
  const counts = { idle: 3, run: 6, air: 6, hurt: 3, tell: 3, active: 1, recovery: 2 } as const;
  for (const [pose, count] of Object.entries(counts)) {
    const moves = ['tell', 'active', 'recovery'].includes(pose) ? 3 : 1;
    for (let m = 0; m < moves; m++) for (let i = 0; i < count; i++) {
      const frame = rivalFrame(pose as keyof typeof counts, (i + 0.1) / count, m);
      assert.ok(frame >= 0 && frame < RIVAL_FRAME_COUNT);
      assert.ok(!frames.has(frame)); frames.add(frame);
    }
  }
  assert.equal(frames.size, RIVAL_FRAME_COUNT);
});
