import test from 'node:test';
import assert from 'node:assert/strict';
import { S } from '../helpers/engine.ts';
import { MatchRecorder } from '../../packages/sim/src/stats.ts';

function chases(difficulty: string, seeds = 6) {
  let chaseUses = 0, hits = 0;
  for (let seed = 0; seed < seeds; seed++) {
    const s = S.create({ mode: 'local', difficulty, seed: 300 + seed,
      fighters: [{ hero: 'david', human: false, team: 0 }, { hero: 'joshua', human: false, team: 1 }] });
    const rec = new MatchRecorder(s);
    while (s.phase !== 'result' && s.tick < 7200) { S.step(s); rec.observe(s); }
    for (const st of Object.values(rec.stats.fighters)) { chaseUses += st.chaseUses; hits += st.hits; }
  }
  return { chaseUses, hits };
}

test('Hard and Extreme bots chase-dodge after some confirmed hits; Easy bots never do', () => {
  assert.equal(chases('easy').chaseUses, 0);
  const hard = chases('hard'), extreme = chases('extreme');
  assert.ok(hard.chaseUses > 0, 'hard bots chase');
  assert.ok(extreme.chaseUses > hard.chaseUses * 0.8, `extreme ${extreme.chaseUses} vs hard ${hard.chaseUses}`);
  assert.ok(extreme.chaseUses < extreme.hits, 'never more chases than hits');
});

test('bots favour finishers as the target nears KO range, never above 65%', async () => {
  const { killHeavyChance } = await import('../../packages/sim/src/ai.ts');
  assert.equal(killHeavyChance(0), 25);
  assert.equal(killHeavyChance(600), 25);
  assert.ok(killHeavyChance(1200) > killHeavyChance(800));
  assert.equal(killHeavyChance(9990), 65);
});
