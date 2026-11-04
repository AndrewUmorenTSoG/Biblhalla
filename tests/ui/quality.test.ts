import test from 'node:test';
import assert from 'node:assert/strict';
import { QualityGovernor, particleCap } from '../../apps/game/src/render/quality.ts';
import { Feedback } from '../../apps/game/src/render/feedback.ts';

const feed = (g: QualityGovernor, ms: number, n: number) => { let changed = 0; for (let i = 0; i < n; i++) if (g.frame(ms)) changed++; return changed; };

test('a device that stays slow drops decoration once, without flickering back', () => {
  const g = new QualityGovernor();
  assert.equal(feed(g, 16.7, 300), 0);
  assert.equal(g.low, false);
  assert.equal(feed(g, 30, 90), 1);
  assert.equal(g.low, true);
  feed(g, 16, 180); // a couple of good seconds is not enough
  assert.equal(g.low, true);
  feed(g, 16, 360);
  assert.equal(g.low, false, 'sustained fast frames restore full quality');
});

test('tab switches and stalls are ignored', () => {
  const g = new QualityGovernor();
  for (const ms of [0, -5, NaN, 5000]) for (let i = 0; i < 100; i++) g.frame(ms);
  assert.equal(g.low, false);
});

test('low quality trims particles; the simulation never changes', () => {
  assert.ok(particleCap(true) < particleCap(false));
  const fb = new Feedback(); fb.maxPuffs = particleCap(true);
  for (let id = 1; id < 60; id++) fb.update({ tick: id, events: [{ id, type: 'ko', fighter: 1, x: 0, y: 0 }], fighters: [] });
  assert.ok(fb.puffs.length <= particleCap(true));
});
