// Presses made during a hit pause are kept, as in Brawlhalla: a chase pressed on contact
// fires at the first legal recovery tick and the follow-up is a true combo.

import test from 'node:test';
import assert from 'node:assert/strict';
import { S, Q } from '../helpers/engine.ts';
import type { InputFrame } from '../../packages/sim/src/index.ts';

function setup(weapon: string) {
  const s = S.create({ mode: 'training', hero: 'david', opponent: 'saul', trainingBot: 'idle' });
  while (s.phase === 'countdown') S.step(s);
  for (let i = 0; i < 10; i++) S.step(s);
  const [p, d] = s.fighters;
  p.weapon = weapon; p.facing = 1; d.x = p.x + 45 * Q;
  return { s, p, d };
}

for (const weapon of ['unarmed', 'sword']) {
  test(`${weapon}: dodge pressed once on contact chases, and the next light is a true combo`, () => {
    const { s, p, d } = setup(weapon);
    let pressed = false, chaseAt = -1;
    const hits: number[] = [], freeAt: number[] = [];
    for (let t = 0; t < 60; t++) {
      const i: InputFrame = { light: t === 0 };
      // One press, on the first tick of the hit pause.
      if (!pressed && p.chase > 0 && p.hitstop > 0) { Object.assign(i, { dodge: true, x: 1 }); pressed = true; }
      if (p.action?.kind === 'chase') i.light = true;
      S.step(s, { [p.id]: i });
      if (p.action?.kind === 'chase' && chaseAt < 0) chaseAt = t;
      for (const e of s.events) if (e.type === 'hit' && e.fighter === d.id) hits.push(t);
      if (hits.length === 1 && !d.stun && !d.hitstop) freeAt.push(t);
    }
    assert.ok(pressed, 'the first light should earn a chase');
    assert.ok(chaseAt > 0, 'the press made during the hit pause is not dropped');
    assert.equal(hits.length >= 2, true, 'the follow-up connects');
    assert.equal(freeAt.length, 0, 'the target never escapes between the two hits');
  });
}

test('a press made during the hit pause is buffered, and its window waits for the pause to end', () => {
  const { s, p } = setup('unarmed');
  let t = 0;
  for (; t < 30 && !p.hitstop; t++) S.step(s, { [p.id]: { light: t === 0 } });
  assert.ok(p.hitstop > 0, 'the jab connects');
  S.step(s, { [p.id]: { heavy: true } });
  while (p.hitstop) S.step(s);
  assert.equal(p.buffer?.type, 'heavy');
  assert.equal(p.buffer?.ticks, S.P.inputBufferTicks, 'no buffer time was spent in the freeze');
});

test('without a confirmed hit, Dodge + direction is an ordinary dodge, not a stored chase', () => {
  const { s, p, d } = setup('unarmed');
  d.x = p.x + 300 * Q;
  S.step(s, { [p.id]: { light: true } });
  S.step(s, { [p.id]: { dodge: true, x: 1 } });
  assert.notEqual(p.buffer?.type, 'chase');
});
