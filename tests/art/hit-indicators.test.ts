import test from 'node:test';
import assert from 'node:assert/strict';
import type { SimState } from '../../packages/sim/src/index.ts';
import { HitIndicators } from '../../apps/game/src/render/hit-indicators.ts';

function world(): Pick<SimState, 'tick' | 'events'> {
  return {tick: 0, events: [{id: 1, type: 'hit', tick: 0, x: 40, y: 80, damage: 70}]};
}

function draw(indicators: HitIndicators, tick: number, reduced = false) {
  const labels: unknown[][] = [];
  const rings: number[] = [];
  const ctx = {
    save() {}, restore() {}, beginPath() {}, stroke() {},
    arc(_x: number, _y: number, radius: number) { rings.push(radius); },
    fillText(...args: unknown[]) { labels.push(args); },
  };
  indicators.draw(ctx as unknown as CanvasRenderingContext2D, (x, y) => ({x, y}), tick, reduced);
  return {labels, rings};
}

test('hit labels last 400 ms of simulation time at 30, 60, 120 and 144 Hz', () => {
  for (const hz of [30, 60, 120, 144]) {
    const indicators = new HitIndicators(), s = world();
    for (let frame = 0; frame <= hz; frame++) {
      s.tick = Math.floor(frame * 60 / hz);
      indicators.collect(s);
      assert.equal(draw(indicators, s.tick).labels.length, s.tick < 24 ? 1 : 0);
    }
  }
});

test('between-paint hits survive, freeze with training, and clear on rematch', () => {
  const indicators = new HitIndicators(), s = world();
  indicators.collect(s);
  s.events = [];
  s.tick = 3;
  indicators.collect(s);
  const frozen = draw(indicators, s.tick);
  assert.deepEqual(frozen.labels, [['+7', 40, 62]]);
  for (let i = 0; i < 120; i++) assert.deepEqual(draw(indicators, s.tick), frozen);
  assert.deepEqual(draw(indicators, s.tick, true), {labels: [['+7', 40, 70]], rings: []});
  const next = world();
  next.events[0].damage = 20;
  indicators.collect(next);
  assert.deepEqual(draw(indicators, 0).labels, [['+2', 40, 68]]);
});
