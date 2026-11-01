import test from 'node:test';
import assert from 'node:assert/strict';
import { S, Q } from '../helpers/engine.ts';

function ffa() {
  const s = S.create({ mode: 'ffa', stocks: 1, fighters: [
    { hero: 'david', human: true, team: 0, inputId: 'keyboard' },
    { hero: 'saul', human: false, team: 1 }, { hero: 'esther', human: false, team: 2 }, { hero: 'caleb', human: false, team: 3 },
  ] });
  while (s.phase === 'countdown') S.step(s);
  for (const f of s.fighters) { f.ai.next = 1e9; f.ai.intent = S.input(); }
  return s;
}
const out = (s: any, f: any) => { f.y = (s.map.blastBoundsUnits.minY - 100) * Q; f.invulnerable = 0; S.step(s); };

test('free-for-all placements follow the order fighters were knocked out', () => {
  const s = ffa();
  const [p1, saul, esther, caleb] = s.fighters;
  out(s, esther);
  out(s, p1);
  out(s, saul);
  assert.equal(s.phase, 'result');
  assert.deepEqual(s.result!.placements.map(p => [p.fighter, p.place]), [[caleb.id, 1], [saul.id, 2], [p1.id, 3], [esther.id, 4]]);
  assert.equal(s.result!.placements[0].name, 'Caleb');
});

test('2v2 teammates share their team place', () => {
  const s = S.create({ mode: 'teams', stocks: 1, fighters: [
    { hero: 'david', human: true, team: 0, inputId: 'keyboard' }, { hero: 'saul', human: false, team: 1 },
    { hero: 'esther', human: false, team: 0 }, { hero: 'caleb', human: false, team: 1 },
  ] });
  while (s.phase === 'countdown') S.step(s);
  for (const f of s.fighters) { f.ai.next = 1e9; f.ai.intent = S.input(); }
  const [p1, saul, esther, caleb] = s.fighters;
  out(s, saul); out(s, caleb);
  assert.equal(s.phase, 'result');
  const place = Object.fromEntries(s.result!.placements.map(p => [p.fighter, p.place]));
  assert.equal(place[p1.id], 1); assert.equal(place[esther.id], 1);
  assert.equal(place[saul.id], 2); assert.equal(place[caleb.id], 2);
});

test('a time-limit draw gives tied fighters the same place', () => {
  const s = S.create({ mode: 'duel', hero: 'david', opponent: 'saul' });
  while (s.phase === 'countdown') S.step(s);
  for (const f of s.fighters) { f.ai.next = 1e9; f.ai.intent = S.input(); }
  s.suddenDeath = true; s.remaining = 1;
  S.step(s);
  assert.match(s.result!.reason, /draw/);
  assert.deepEqual(s.result!.placements.map(p => p.place), [1, 1]);
});
