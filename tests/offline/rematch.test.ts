import test from 'node:test';
import assert from 'node:assert/strict';
import { S } from '../helpers/engine.ts';

test('twenty rematches start identical and leave no growing entity state', () => {
  const opts = { mode: 'ffa', seed: 55, difficulty: 'hard', fighters: [
    { hero: 'david', human: false, team: 0 }, { hero: 'saul', human: false, team: 1 },
    { hero: 'esther', human: false, team: 2 }, { hero: 'caleb', human: false, team: 3 },
  ] };
  const startHash = S.hash(S.create(opts));
  const sizes: number[] = [];
  let endHash = '';
  for (let match = 0; match < 20; match++) {
    const s = S.create(opts);
    assert.equal(S.hash(s), startHash, `rematch ${match} starts from the same state`);
    for (let t = 0; t < 1200; t++) S.step(s);
    if (!endHash) endHash = S.hash(s); else assert.equal(S.hash(s), endHash, 'same seed, same match');
    sizes.push(JSON.stringify(s).length);
    // Live entity lists stay bounded during play.
    assert.ok(s.projectiles.length <= 8 && s.items.length <= 6 && s.events.length < 64);
  }
  assert.equal(new Set(sizes).size, 1, 'state size does not grow across rematches');
});
