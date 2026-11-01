import test from 'node:test';
import assert from 'node:assert/strict';
import { S } from '../helpers/engine.ts';

test('custom lives and timer apply to every fighter in versus play', () => {
  const s = S.create({ mode: 'ffa', stocks: 7, matchMinutes: 2, fighters: [
    { hero: 'david', human: true, team: 0, inputId: 'keyboard' },
    { hero: 'saul', human: true, team: 1, inputId: 'pad:0' },
    { hero: 'esther', human: false, team: 2 },
  ] });
  assert.deepEqual(s.fighters.map(f => f.stocks), [7, 7, 7]);
  assert.equal(s.remaining, 2 * 60 * 60);
  const quick = S.create({ mode: 'duel', stocks: '1', matchMinutes: '10' });
  assert.deepEqual(quick.fighters.map(f => f.stocks), [1, 1]);
  assert.equal(quick.remaining, 10 * 3600);
});

test('out-of-range rules fall back to the defaults', () => {
  for (const [stocks, matchMinutes] of [[0, 0], [10, 11], [2.5, -1], ['x', '']]) {
    const s = S.create({ mode: 'duel', stocks, matchMinutes } as any);
    assert.equal(s.fighters[0].stocks, S.R.stockDefault);
    assert.equal(s.remaining, S.R.matchTicks);
  }
});

test('the boss keeps its single guard stock whatever the lives rule', () => {
  const s = S.create({ mode: 'boss', stocks: 9 });
  assert.equal(s.fighters[0].stocks, 9);
  assert.equal(s.fighters[1].stocks, 1);
});

test('replays carry the rules and reject out-of-range ones', () => {
  const s = S.create({ mode: 'duel', stocks: 5, matchMinutes: 3, seed: 9 });
  const r: any = S.newReplay(s);
  for (let n = 0; n < 300; n++) { S.step(s, { keyboard: { x: n % 60 < 30 ? 1 : -1 } }); r.entries.push({ kind: 'input', frames: { keyboard: { x: n % 60 < 30 ? 1 : -1 } } }); }
  r.finalHash = S.hash(s);
  assert.ok(S.simulateReplay(JSON.parse(JSON.stringify(r))).verified);
  const bad = JSON.parse(JSON.stringify(r));
  bad.initial.options.stocks = 40;
  assert.throws(() => S.validateReplay(bad), /Invalid match rules/);
});
