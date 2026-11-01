import test from 'node:test';
import assert from 'node:assert/strict';
import { S } from '../helpers/engine.ts';

const roster = new Set(S.content.fighters.fighters.map(f => f.id));

test('Random fighters resolve from the seed to real roster fighters, the same every time', () => {
  const a = S.create({ mode: 'duel', hero: 'random', opponent: 'random', seed: 1234 });
  const b = S.create({ mode: 'duel', hero: 'random', opponent: 'random', seed: 1234 });
  assert.deepEqual(a.fighters.map(f => f.hero), b.fighters.map(f => f.hero));
  for (const f of a.fighters) assert.ok(roster.has(f.hero), f.hero);
  const seen = new Set<string>();
  for (let seed = 1; seed < 200; seed++) seen.add(S.create({ mode: 'duel', hero: 'random', seed }).fighters[0].hero);
  assert.ok(seen.size >= 10, 'random picks cover the roster');
});

test('Random never touches the simulation RNG stream', () => {
  const fixed = S.create({ mode: 'duel', hero: 'david', opponent: 'saul', seed: 77 });
  const random = S.create({ mode: 'duel', hero: 'random', opponent: 'random', seed: 77 });
  assert.equal(random.rng, fixed.rng);
});

test('local seats can be Random, and replays of random picks verify', () => {
  const opts = { mode: 'ffa', seed: 9, fighters: [
    { hero: 'random', human: true, team: 0, inputId: 'keyboard' }, { hero: 'random', human: false, team: 1, inputId: 'cpu:1' },
  ] };
  const s = S.create(opts);
  for (const f of s.fighters) assert.ok(roster.has(f.hero));
  const r: any = S.newReplay(s);
  for (let n = 0; n < 200; n++) { S.step(s, { keyboard: { x: 1 } }); r.entries.push({ kind: 'input', frames: { keyboard: { x: 1 } } }); }
  r.finalHash = S.hash(s);
  assert.ok(S.simulateReplay(JSON.parse(JSON.stringify(r))).verified);
});
