import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRoster, CPU_INPUT } from '../../apps/game/src/ui/lobby.ts';
import { S } from '../helpers/engine.ts';

const ready = (id: string) => id === 'pad:0' || id === 'pad:1';
const nameOf = (h: string) => S.defs[h].name;

test('computer seats fill a 2v2 beside human players and are labelled CPU', () => {
  const r = buildRoster('teams', [
    { hero: 'david', input: 'keyboard' }, { hero: 'saul', input: 'pad:0' },
    { hero: 'samson', input: CPU_INPUT }, { hero: 'esther', input: CPU_INPUT },
  ], ready, nameOf);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.deepEqual(r.fighters.map(f => [f.human, f.team]), [[true, 0], [true, 1], [false, 0], [false, 1]]);
  assert.equal(r.fighters[2].name, 'Samson (CPU)');
  const s = S.create({ mode: 'teams', difficulty: 'hard', fighters: r.fighters });
  assert.equal(s.fighters.filter(f => !f.human).length, 2);
  for (let t = 0; t < 600; t++) S.step(s, { keyboard: {}, 'pad:0': {} });
  assert.ok(s.tick > 0, 'the match runs with computer seats');
});

test('lobby rules reject unplayable rosters with a clear message', () => {
  const cases: [string, { hero: string; input: string }[], RegExp][] = [
    ['ffa', [{ hero: 'david', input: CPU_INPUT }, { hero: 'saul', input: CPU_INPUT }], /At least one player/],
    ['ffa', [{ hero: 'david', input: 'keyboard' }, { hero: 'saul', input: '' }], /every seat/],
    ['local', [{ hero: 'david', input: 'pad:0' }, { hero: 'saul', input: 'pad:0' }], /different input device/],
    ['local', [{ hero: 'david', input: 'keyboard' }, { hero: 'saul', input: 'pad:3' }], /Test each assigned controller/],
  ];
  for (const [mode, slots, message] of cases) {
    const r = buildRoster(mode, slots, ready, nameOf);
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.message, message);
  }
});

test('several computer seats never collide on input ids', () => {
  const r = buildRoster('ffa', [{ hero: 'david', input: 'touch' }, { hero: 'saul', input: CPU_INPUT }, { hero: 'caleb', input: CPU_INPUT }], ready);
  assert.ok(r.ok);
  if (r.ok) assert.equal(new Set(r.fighters.map(f => f.inputId)).size, 3);
});

test('everyone readies after the final rules; any rule change cancels every Ready', async () => {
  const { ReadyBoard } = await import('../../apps/game/src/ui/lobby.ts');
  const board = new ReadyBoard();
  const slots = [{ hero: 'david', input: 'keyboard' }, { hero: 'saul', input: 'pad:0' }, { hero: 'caleb', input: CPU_INPUT }];
  board.setRules({ stocks: 3, slots });
  assert.equal(board.allReady(slots), false);
  board.toggle(0);
  assert.equal(board.allReady(slots), false, 'one human still not ready');
  board.toggle(1);
  assert.equal(board.allReady(slots), true, 'computer seats never need Ready');
  assert.equal(board.setRules({ stocks: 3, slots }), false, 'same rules keep Ready');
  assert.equal(board.allReady(slots), true);
  assert.equal(board.setRules({ stocks: 4, slots }), true);
  assert.equal(board.allReady(slots), false, 'a rule change cancels Ready');
  board.toggle(0); board.toggle(0);
  assert.equal(board.isReady(0), false, 'Ready toggles off again');
});
