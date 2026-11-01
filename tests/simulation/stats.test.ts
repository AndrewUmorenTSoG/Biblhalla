import test from 'node:test';
import assert from 'node:assert/strict';
import { S, Q } from '../helpers/engine.ts';
import { MatchRecorder } from '../../packages/sim/src/stats.ts';

test('match instrumentation counts hits, whiffs, KOs and self-KOs from real events', () => {
  const s = S.create({ mode: 'duel', hero: 'david', opponent: 'saul', seed: 3 });
  while (s.phase === 'countdown') S.step(s);
  const rec = new MatchRecorder(s);
  const [a, d] = s.fighters;
  d.ai.next = 1e9; d.ai.intent = S.input();
  a.weapon = 'sword';
  // A whiff far away.
  a.x = -300 * Q; d.x = 300 * Q;
  S.step(s, { [a.id]: { light: true } }); rec.observe(s);
  for (let t = 0; t < 40; t++) { S.step(s, { [a.id]: {} }); rec.observe(s); }
  // A hit up close.
  a.x = 0; a.facing = 1; d.x = 50 * Q; d.y = a.y;
  S.step(s, { [a.id]: { light: true } }); rec.observe(s);
  for (let t = 0; t < 40; t++) { S.step(s, { [a.id]: {} }); rec.observe(s); }
  const st = rec.stats.fighters[a.id];
  assert.equal(st.attacks, 2);
  assert.equal(st.whiffs, 1);
  assert.equal(st.hits, 1);
  assert.ok(st.damageDealt > 0);
  // A self-KO: falling with no recent hit.
  a.y = (s.map.blastBoundsUnits.minY - 100) * Q; a.invulnerable = 0;
  for (let t = 0; t < 200; t++) { S.step(s, { [a.id]: {} }); rec.observe(s); }
  assert.equal(rec.stats.fighters[a.id].selfKos, 1);
  assert.equal(rec.stats.contentHash, S.content.hash);
});

test('the matchup grid covers all 78 pairings', async () => {
  const { runMatchups } = await import('../../tools/matchups.ts');
  const r = runMatchups(0);
  assert.equal(r.pairs, 78);
  assert.equal(r.totals.length, 12);
});
