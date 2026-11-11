import test from 'node:test';
import assert from 'node:assert/strict';
import { Callouts, CALLOUT_TICKS } from '../../apps/game/src/render/callouts.ts';
import { S, Q } from '../helpers/engine.ts';

const f = (o: any = {}) => ({ id: 2, x: 0, y: 0, stun: 0, hitstop: 0, ...o });

test('hits landed while the target is still stunned count as one combo', () => {
  const c = new Callouts();
  c.update({ tick: 1, phase: 'playing', events: [{ id: 1, type: 'hit', fighter: 2, damage: 40 }], fighters: [f({ stun: 18 })] });
  assert.equal(c.visibleCombos().length, 0, 'one hit is not a combo');
  c.update({ tick: 10, phase: 'playing', events: [{ id: 2, type: 'hit', fighter: 2, damage: 50 }], fighters: [f({ stun: 15 })] });
  c.update({ tick: 20, phase: 'playing', events: [{ id: 3, type: 'hit', fighter: 2, damage: 60 }], fighters: [f({ stun: 15 })] });
  const [k] = c.visibleCombos();
  assert.equal(k.hits, 3);
  assert.equal(k.damage, 150);
  assert.equal(k.open, true);
  c.update({ tick: 40, phase: 'playing', events: [], fighters: [f()] });
  assert.equal(c.visibleCombos()[0].open, false, 'the string ends when the target recovers');
  c.update({ tick: 41 + CALLOUT_TICKS, phase: 'playing', events: [], fighters: [f()] });
  assert.equal(c.visibleCombos().length, 0);
});

test('a hit after the target recovered starts a new count', () => {
  const c = new Callouts();
  c.update({ tick: 1, phase: 'playing', events: [{ id: 1, type: 'hit', fighter: 2, damage: 40 }], fighters: [f({ stun: 10 })] });
  c.update({ tick: 30, phase: 'playing', events: [], fighters: [f()] });
  c.update({ tick: 31, phase: 'playing', events: [{ id: 2, type: 'hit', fighter: 2, damage: 40 }], fighters: [f({ stun: 10 })] });
  assert.equal(c.visibleCombos().length, 0);
});

test('KO and GO callouts appear once and fade', () => {
  const c = new Callouts();
  c.update({ tick: 0, phase: 'countdown', events: [], fighters: [] });
  c.update({ tick: 1, phase: 'playing', events: [{ id: 1, type: 'ko', fighter: 2, x: 900 * Q, y: 0 }], fighters: [] });
  assert.equal(c.goTick, 1);
  assert.equal(c.texts.length, 1);
  c.update({ tick: 2, phase: 'playing', events: [{ id: 1, type: 'ko', fighter: 2, x: 900 * Q, y: 0 }], fighters: [] });
  assert.equal(c.texts.length, 1, 'the same event is not shown twice');
  c.update({ tick: 2 + CALLOUT_TICKS, phase: 'playing', events: [], fighters: [] });
  assert.equal(c.texts.length, 0);
});

test('a real chase-dodge string shows a 2-hit combo', () => {
  const s: any = S.create({ mode: 'training', hero: 'david', opponent: 'saul', trainingBot: 'idle' });
  while (s.phase === 'countdown') S.step(s);
  for (let i = 0; i < 10; i++) S.step(s);
  const [p, d] = s.fighters; d.x = p.x + 45 * Q; p.facing = 1;
  const c = new Callouts(); let pressed = false, best = 0;
  for (let t = 0; t < 60; t++) {
    const i: any = { light: t === 0 };
    if (!pressed && p.chase > 0 && p.hitstop > 0) { i.dodge = true; i.x = 1; pressed = true; }
    if (p.action?.kind === 'chase') i.light = true;
    S.step(s, { [p.id]: i }); c.update(s);
    for (const k of c.visibleCombos()) best = Math.max(best, k.hits);
  }
  assert.ok(best >= 2, `combo of ${best}`);
});
