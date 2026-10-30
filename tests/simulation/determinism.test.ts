import test from 'node:test';
import assert from 'node:assert/strict';
import { S } from '../helpers/engine.ts';
import { FixedStepRunner, TICK_MS } from '../../apps/game/src/runner.ts';
import type { InputFrame, SimState } from '../../packages/sim/src/index.ts';

/** Deterministic scripted human input for tick n. */
function scripted(n: number): InputFrame {
  return {
    x: n % 240 < 120 ? 1 : -1, y: n % 97 < 8 ? -1 : 0,
    jump: n % 83 === 0, jumpHeld: n % 83 < 14, light: n % 29 === 0, heavy: n % 151 === 0, heavyHeld: n % 151 < 20,
    dodge: n % 173 === 0, item: n % 61 === 0,
  };
}

function run(s: SimState, from: number, to: number): void {
  for (let n = from; n < to; n++) S.step(s, { keyboard: scripted(n) });
}

for (const difficulty of ['easy', 'hard', 'extreme']) {
  test(`same seed and inputs give identical hashes (${difficulty})`, () => {
    const opts = { mode: 'duel', hero: 'david', opponent: 'samson', difficulty, seed: 4242 };
    const a = S.create(opts), b = S.create(opts);
    run(a, 0, 3000);
    run(b, 0, 3000);
    assert.equal(S.hash(a), S.hash(b));
    const other = S.create({ ...opts, seed: 4243 });
    run(other, 0, 3000);
    assert.notEqual(S.hash(other), S.hash(a), 'seed must matter');
  });
}

test('snapshot restore matches uninterrupted simulation', () => {
  const opts = { mode: 'waves', hero: 'deborah', difficulty: 'hard', seed: 99 };
  const whole = S.create(opts);
  run(whole, 0, 2400);
  const split = S.create(opts);
  run(split, 0, 1100);
  const restored = S.snapshot(split);
  run(restored, 1100, 2400);
  assert.equal(S.hash(restored), S.hash(whole));
});

test('rendering at 30, 60 and 120 FPS produces the same simulation', () => {
  const hashes = [30, 60, 120].map(fps => {
    const s = S.create({ mode: 'duel', hero: 'gideon', opponent: 'esther', difficulty: 'extreme', seed: 7 });
    const runner = new FixedStepRunner();
    let n = 0;
    // Advance 40 simulated seconds of display frames; inputs are per tick, never per frame.
    for (let frame = 0; frame < 40 * fps && n < 2400; frame++) {
      runner.advance(1000 / fps, () => { S.step(s, { keyboard: scripted(n++) }); return n < 2400; });
    }
    assert.equal(n, 2400, `${fps} FPS ran every tick`);
    return S.hash(s);
  });
  assert.equal(hashes[0], hashes[1]);
  assert.equal(hashes[1], hashes[2]);
});

test('runner caps catch-up at five ticks and pauses only on sustained overload', () => {
  const runner = new FixedStepRunner();
  let ticks = 0;
  const hitch = runner.advance(1000, () => { ticks++; return true; });
  assert.equal(hitch.ticks, 5);
  assert.equal(hitch.overloaded, true);
  assert.equal(hitch.sustained, false, 'one hitch is not sustained');
  let last = hitch;
  for (let i = 0; i < 40; i++) last = runner.advance(200, () => true);
  assert.equal(last.sustained, true);
  runner.reset();
  const calm = runner.advance(TICK_MS * 2 + 0.01, () => true);
  assert.deepEqual([calm.ticks, calm.overloaded, calm.sustained], [2, false, false]);
});

test('stopping mid-frame discards the remaining backlog', () => {
  const runner = new FixedStepRunner();
  let ticks = 0;
  runner.advance(TICK_MS * 4, () => ++ticks < 2);
  assert.equal(ticks, 2);
  assert.equal(runner.accumulator, 0);
});
