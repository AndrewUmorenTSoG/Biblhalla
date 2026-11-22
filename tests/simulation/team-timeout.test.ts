import test from 'node:test';
import assert from 'node:assert/strict';
import { S } from '../helpers/engine.ts';

function timeout(stocks: number[], damage: number[]) {
  const s = S.create({ mode: 'teams', fighters: [
    { hero: 'david', human: true, team: 0 }, { hero: 'caleb', team: 0 },
    { hero: 'saul', team: 1 }, { hero: 'esther', team: 1 },
  ] });
  s.phase = 'playing';
  s.remaining = 1;
  s.fighters.forEach((f, i) => { f.stocks = stocks[i]; f.damage = damage[i]; });
  return s;
}

test('timeout credits eliminated teammates when stocks or damage decide the winning team', () => {
  for (const [stocks, damage] of [
    [[0, 3, 1, 1], [9000, 500, 0, 0]],
    [[0, 2, 1, 1], [9000, 100, 100, 100]],
  ]) {
    const s = timeout(stocks, damage);
    S.step(s);
    assert.equal(s.result?.won, true);
    assert.deepEqual(s.result?.winners, s.fighters.slice(0, 2).map(f => f.id));
    assert.equal(s.fighters[0].stocks, 0, 'credit does not revive eliminated teammates');
  }
});

test('timeout loss credits the entire opposing team without awarding the human a win', () => {
  const s = timeout([0, 1, 2, 0], [0, 0, 0, 9000]);
  S.step(s);
  assert.equal(s.result?.won, false);
  assert.deepEqual(s.result?.winners, s.fighters.slice(2).map(f => f.id));
});

test('tied teams enter sudden death with only living contenders, then may draw', () => {
  const s = timeout([0, 1, 1, 0], [9000, 0, 0, 9000]);
  S.step(s);
  assert.equal(s.suddenDeath, true);
  assert.equal(s.result === null, true);
  assert.deepEqual(s.fighters.map(f => f.stocks), [0, 1, 1, 0]);
  s.remaining = 1;
  S.step(s);
  assert.deepEqual(s.result?.winners, []);
  assert.match(s.result?.reason ?? '', /draw/);
});
