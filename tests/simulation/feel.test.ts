// Feel targets agreed with Andrew (2026-11-02): snappier jumps at the same height, and
// signature finishers that KO around 100 damage rather than 200-300.

import test from 'node:test';
import assert from 'node:assert/strict';
import { S, Q } from '../helpers/engine.ts';

function fresh(hero = 'david') {
  const s = S.create({ mode: 'training', hero, opponent: 'saul', trainingBot: 'idle' });
  while (s.phase === 'countdown') S.step(s);
  for (let i = 0; i < 10; i++) S.step(s);
  return s;
}

test('a full jump peaks within half a second and still clears about 2.8 body heights', () => {
  const s = fresh(), f = s.fighters[0], y0 = f.y;
  let apex = 0, apexAt = 0;
  for (let t = 0; t < 120; t++) {
    S.step(s, { [f.id]: { jump: t === 0, jumpHeld: true } });
    if (f.y - y0 > apex) { apex = f.y - y0; apexAt = t; }
    if (t > 3 && f.ground) break;
  }
  assert.ok(apexAt <= 30, `apex at ${apexAt} ticks`);
  assert.ok(apex / Q > 190 && apex / Q < 225, `height ${apex / Q}`);
});

function sideSig(hero: string, damage: number): boolean {
  const s = fresh(hero), [p, d] = s.fighters;
  p.weapon = S.defs[hero].weaponPair[0]; p.facing = 1; d.damage = damage * 10; d.x = p.x + 60 * Q;
  // Keep the target at the same centre-stage position and sixty units beyond
  // the release point, rather than placing it behind the extended sling.
  p.x-=(S.defs[hero].releaseOrigins?.[p.weapon]?.[0]??0)*Q;
  for (let t = 0; t < 240; t++) {
    S.step(s, { [p.id]: { heavy: t === 0, x: t === 0 ? 1 : 0 } });
    if (s.events.some(e => e.type === 'ko' && e.fighter === d.id)) return true;
  }
  return false;
}

test('side signatures from near centre KO at 100 damage but not at 50', () => {
  for (const hero of ['david', 'samson', 'deborah']) {
    assert.equal(sideSig(hero, 50), false, `${hero} at 50`);
    assert.equal(sideSig(hero, 100), true, `${hero} at 100`);
  }
});
